import type { character, loreBook, customscript, triggerscript } from 'src/ts/storage/database.svelte'
import { createBlankChar } from 'src/ts/characters'
import { type MockCharacterDB, createMockCharacter, CreatesyncJson, V2_TRIGGER_HEADER, LUA_TRIGGER_HEADER, mergeSyncToCharacter, validateAndCompleteSyncJson, createSettingsYaml } from 'src/ts/BotMaker/MockCharacterDB.svelte'
import { parseDocument } from 'yaml';
import { v4 as uuid } from 'uuid';
import { loadSyncJson, loadSettingsYaml, saveToFile, saveCharacterJson, saveCharacterData } from './SaveFolderFileManager';
import { cloneDeep, omit, defaults } from 'lodash';

export type SourceMap = Record<string, string>;


/**
 * 파일 유효성 검사
 */
async function validateFileContent(folderName: string, jsonData: MockCharacterDB, sourceMap: SourceMap): Promise<boolean> {
  const json = jsonData;

  // 파일검사 MockCharacterDB 타입 검사
  // 만약 항목이 누락되어 있으면 createMockCharacter를 이용해 보완 (보완이 안될 경우 false 반환)
  const mock = createMockCharacter();
  let isModified = false;

  // 누락된 필드 보완
  for (const key in mock) {
    if (!(key in json)) {
      console.log(`[validateFileContent] Missing key added: ${key}`);
      // @ts-ignore
      json[key] = mock[key];
      
      // 누락된 키를 character.json에 즉시 저장 ($ref 보존을 위해 saveCharacterJson 사용)
      try {
        // @ts-ignore
        await saveCharacterJson(folderName, `/${key}`, mock[key]);
        console.log(`[validateFileContent] Saved missing key ${key} to character.json`);
      } catch (e) {
        console.error(`[validateFileContent] Failed to save missing key ${key}`, e);
      }
    }
  }

  // .metadata 에 sync.json과 settings.yaml 검사
  let syncJsonContent = await loadSyncJson(folderName);
  let settingsYamlContent = await loadSettingsYaml(folderName);
  let triggerVersion = "";
  let syncModified = false;

  // 1. 파일이 없을 경우 생성
  if (!syncJsonContent) {
    // sync.json 생성
    const syncData = CreatesyncJson();
    try {
      await saveToFile(folderName, '.metadata/sync.json', syncData);
    } catch (e) {
      console.error("Failed to create sync.json", e);
      return false;
    }
  }

  if (!settingsYamlContent) {
    // settings.yaml 생성 (triggerversion만 포함)
    const detectedVersion = detectTriggerVersion(json.triggerscript);
    const settingsYaml = createSettingsYaml(detectedVersion);

    try {
      await saveToFile(folderName, '.metadata/settings.yaml', settingsYaml);
    } catch (e) {
      console.error("Failed to create settings.yaml", e);
      return false;
    }

    triggerVersion = detectedVersion;
  } else {
    // sync.json 파싱 및 필수 필드 보완
    try {
      const { parsedJson, modified } = validateAndCompleteSyncJson(syncJsonContent);

      // sync.json 수정이 필요하면 저장
      if (modified) {
        console.log(`[validateFileContent] sync.json modified, saving...`);
        await saveToFile(folderName, '.metadata/sync.json', parsedJson);
      }
    } catch (e) {
      console.error("Failed to validate sync.json", e);
      return false;
    }

    // settings.yaml 파싱
    try {
      const doc = parseDocument(settingsYamlContent);
      const parsedYaml = doc.toJSON() as any;
      triggerVersion = parsedYaml.triggerversion || "v2";
    } catch (e) {
      console.error("Failed to parse settings.yaml", e);
      triggerVersion = "v2";
    }
  }

  // triggerscript를 settings.yaml의 triggerversion에 맞게 보정
  if (!json.triggerscript) json.triggerscript = [];

  const { modified: triggerModified, triggerscript: normalizedTriggerScript } = normalizeTriggerScript(json.triggerscript, triggerVersion);

  if (triggerModified) {
    console.log(`[validateFileContent] triggerscript normalized, saving...`);
    json.triggerscript = normalizedTriggerScript;
    
    try {
      // SourceMap을 활용하여 적절한 위치(외부 파일 또는 character.json)에 저장
      await saveCharacterData(folderName, '/triggerscript', json.triggerscript, sourceMap);
    } catch (e) {
      console.error("Failed to save modified triggerscript", e);
    }
  }

  return true;
}

/**
 * 재귀적으로 JSON을 탐색하며 $ref를 찾아 로드하고 SourceMap을 생성합니다.
 */
async function recursiveTraverse(
  obj: any,
  currentPointer: string,
  currentFileUrl: string,
  sourceMap: SourceMap,
  rootUrl: string
): Promise<any> {
  if (typeof obj !== 'object' || obj === null) return obj;

  // 배열 또는 객체의 키를 순회
  const keys = Array.isArray(obj) ? obj.map((_, i) => i) : Object.keys(obj);

  for (const key of keys) {
    // @ts-ignore
    const val = obj[key];
    const nextPointer = currentPointer ? `${currentPointer}/${key}` : `/${key}`;

    if (val && typeof val === 'object' && typeof val['$ref'] === 'string') {
      const refPath = val['$ref'];

      // URL 해결 (상대 경로 처리)
      // currentFileUrl이 /api/save/Bot/character.json 이면 parentDir는 /api/save/Bot/
      const parentDir = currentFileUrl.substring(0, currentFileUrl.lastIndexOf('/') + 1);

      // 브라우저의 URL API를 사용하여 경로 해결
      const resolvedUrlObj = new URL(refPath, "http://dummy" + parentDir);
      const resolvedUrl = resolvedUrlObj.pathname;

      // SourceMap에 기록할 상대 경로 계산
      // rootUrl: /api/save/Bot/
      let relativePath = resolvedUrl;
      if (resolvedUrl.startsWith(rootUrl)) {
        relativePath = resolvedUrl.substring(rootUrl.length);
      }

      sourceMap[nextPointer] = relativePath;

      try {
        // 캐시 방지를 위한 타임스탬프 추가
        const fetchUrl = resolvedUrl.includes('?') 
          ? `${resolvedUrl}&t=${Date.now()}` 
          : `${resolvedUrl}?t=${Date.now()}`;
          
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          console.warn(`[BotJsonParser] Failed to load ref: ${resolvedUrl} (${res.status})`);
          // 실패 시 빈 문자열로 대체하여 UI 크래시 방지
          // @ts-ignore
          obj[key] = "";
          continue;
        }

        let childData;
        const contentType = res.headers.get('content-type');
        if (resolvedUrl.endsWith('.json') || contentType?.includes('json')) {
          childData = await res.json();

          // globalLore, customscript 특수 처리: Mock 타입이면 먼저 변환 후 재탐색
          if (key === 'globalLore' || key === 'customscript') {
            let converted;
            if (key === 'globalLore') {
              converted = ChangelorebookJSON(childData);
            } else {
              converted = ChangecustomscriptJSON(childData);
            }
            // 변환된 배열을 재귀 탐색 (이렇게 하면 /globalLore/0/content 형태로 경로 생성)
            childData = await recursiveTraverse(converted, nextPointer, resolvedUrl, sourceMap, rootUrl);
          } else {
            // 일반 JSON은 그냥 재귀 탐색
            childData = await recursiveTraverse(childData, nextPointer, resolvedUrl, sourceMap, rootUrl);
          }
        } else {
          childData = await res.text();
          // 텍스트 파일은 더 이상 탐색하지 않음
        }

        // $ref 객체를 실제 데이터로 교체
        // @ts-ignore
        obj[key] = childData;
      } catch (e) {
        console.error(`[BotJsonParser] Error loading ref ${resolvedUrl}:`, e);
        // 에러 시 빈 문자열로 대체
        // @ts-ignore
        obj[key] = "";
      }

    } else {
      // 일반 객체/배열은 현재 파일 컨텍스트 유지하며 재귀 탐색
      // @ts-ignore
      obj[key] = await recursiveTraverse(val, nextPointer, currentFileUrl, sourceMap, rootUrl);
    }
  }
  return obj;
}

function ChangelorebookJSON(data: any): loreBook[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && 'type' in data && data.type === 'risu') {
    return data.data;
  }
  return [];
}

function ChangecustomscriptJSON(data: any): customscript[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && 'type' in data && data.type === 'regex') {
    return data.data;
  }
  return [];
}

export async function parseBotJson(folderName: string): Promise<{ character: character, sourceMap: SourceMap }> {
  let botJson: character = createBlankChar();
  // rootUrl을 /file/ 경로를 포함하도록 수정하여, 이후 모든 상대 경로가 /file/ 아래로 해석되게 함
  const rootUrl = `/api/save/${folderName}/file/`;
  // 캐시 방지를 위한 타임스탬프 추가
  const timestamp = Date.now();
  const entryUrl = `/api/save/${folderName}/character.json?t=${timestamp}`;
  // traverse에 전달할 가상의 파일 URL. 
  // 이렇게 하면 character.json 내부의 "content/desc.md"는 "/api/save/Luna/file/content/desc.md"로 해석됨.
  const virtualEntryUrl = `/api/save/${folderName}/file/character.json`;

  try {
    const response = await fetch(entryUrl);
    if (!response.ok) {
      console.warn(`[BotJsonParser] Failed to load ${folderName}: HTTP ${response.status}`);
      return { character: botJson, sourceMap: {} };
    }

    const text = await response.text();
    let rawJson;
    try {
      rawJson = JSON.parse(text);
    } catch (e) {
      console.error('[parseBotJson] Failed to parse JSON:', e);
      throw new Error('Failed to parse character.json');
    }

    const sourceMap: SourceMap = {};

    // 재귀적 로드 및 SourceMap 생성
    const jsonData: MockCharacterDB = await recursiveTraverse(
      rawJson,
      '',
      virtualEntryUrl,
      sourceMap,
      rootUrl
    );

    console.log('[parseBotJson] SourceMap:', sourceMap);

    // 데이터 변환 및 병합

    // Global Lore 처리
    botJson.globalLore = ChangelorebookJSON(jsonData.globalLore);

    // Custom Script 처리
    botJson.customscript = ChangecustomscriptJSON(jsonData.customscript);

    // Trigger Script 처리
    if (jsonData.triggerscript && Array.isArray(jsonData.triggerscript)) {
      botJson.triggerscript = jsonData.triggerscript;
    }

    // 나머지 필드 병합 (globalLore, customscript, triggerscript 제외)
    // jsonData의 값으로 botJson을 덮어씀 (defaults는 기존값 유지이므로 assign 사용)
    Object.assign(botJson, omit(jsonData, ['globalLore', 'customscript', 'triggerscript']));

    // sync.json에서 character 필수 필드 로드 및 병합
    const parsedJson = await loadSyncJson(folderName);
    mergeSyncToCharacter(botJson, parsedJson);

    // Asset Path 변환 함수
    const convertAssetUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
      return `/api/save/${folderName}/file/${path}`;
    };

    // Asset URL 변환 (한 번에 처리)
    if (botJson.image) botJson.image = convertAssetUrl(botJson.image);
    if (botJson.emotionImages) botJson.emotionImages = botJson.emotionImages.map(([name, path]) => [name, convertAssetUrl(path)]);
    if (botJson.additionalAssets) botJson.additionalAssets = botJson.additionalAssets.map(([name, path, ext]) => [name, convertAssetUrl(path), ext]);
    if (botJson.ccAssets) botJson.ccAssets = botJson.ccAssets.map(item => ({ ...item, uri: convertAssetUrl(item.uri) }));

    // 파일 유효성 검사 및 수정
    await validateFileContent(folderName, jsonData, sourceMap);

    return { character: botJson, sourceMap };

  } catch (error) {
    console.error('[parseBotJson] Error:', error);
    return { character: botJson, sourceMap: {} };
  }
}

/**
 * triggerscript에서 trigger version 감지
 * @returns "v1" | "v2" | "lua"
 */

export function detectTriggerVersion(triggerscript: triggerscript[]): string {
  if (!triggerscript || triggerscript.length === 0) {
    return "v2"; // 기본값은 v2
  }

  const firstEffect = triggerscript[0]?.effect?.[0];
  if (!firstEffect) {
    return "v2";
  }

  if (firstEffect.type === 'v2Header') {
    return "v2";
  } else if (firstEffect.type === 'triggerlua') {
    return "lua";
  } else {
    return "v1";
  }
}

/**
 * triggerVersion에 맞게 triggerscript 보정
 * @returns {modified, triggerscript} - 수정 여부와 보정된 triggerscript
 */

export function normalizeTriggerScript(triggerscript: triggerscript[], triggerVersion: string): { modified: boolean; triggerscript: triggerscript[]; } {
  let modified = false;
  const result = cloneDeep(triggerscript);
  const firstEffect = result[0]?.effect?.[0];
  const firstEffectType = firstEffect?.type;

  if (triggerVersion === "v1") {
    // v1: 헤더가 있으면 제거
    if (firstEffectType === 'v2Header' || firstEffectType === 'triggerlua') {
      result.shift();
      modified = true;
    }
  } else if (triggerVersion === "v2") {
    // v2: v2Header가 없으면 추가
    if (!firstEffect || firstEffectType !== 'v2Header') {
      // @ts-ignore
      result.unshift(V2_TRIGGER_HEADER);
      modified = true;
    }
  } else if (triggerVersion === "lua") {
    // lua: triggerlua 헤더가 없으면 추가
    if (!firstEffect || firstEffectType !== 'triggerlua') {
      // @ts-ignore
      result.unshift(LUA_TRIGGER_HEADER);
      modified = true;
    }
  }

  return { modified, triggerscript: result };
}



