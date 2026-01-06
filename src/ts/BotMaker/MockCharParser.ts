import type { character, loreBook, customscript } from 'src/ts/storage/database.svelte'
import { createBlankChar } from 'src/ts/characters'
import { type MockCharacterDB, mergeSyncToCharacter } from 'src/ts/BotMaker/MockCharacterDB.svelte'
import { v4 as uuid } from 'uuid';
import { loadSyncJson, removeNulls, addCacheBuster, resolveRefPath } from './SaveFolderFileManager';
import { omit, defaults } from 'lodash';
import { convertWrapperToArray, validateFileContent, applyFormatUpdateToFolder } from './SaveFolderValidator';

export type SourceMap = Record<string, string>;

/**
 * 객체에 __source 속성 추가
 * @param obj 대상 객체
 * @param key 키 이름
 * @param path 파일 경로
 */
function addSourceProperty(obj: any, key: string | number, path: string): void {
  if (!obj || typeof obj !== 'object') return;
  
  if (!Array.isArray(obj.__source)) {
    Object.defineProperty(obj, '__source', {
      value: [],
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  obj.__source.push({ key: String(key), path });
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
    const val = obj[key];
    const nextPointer = currentPointer ? `${currentPointer}/${key}` : `/${key}`;

    if (val && typeof val === 'object' && typeof val['$ref'] === 'string') {
      const refPath = val['$ref'];

      // URL 해결: 절대/상대 경로 모두 처리
      const resolvedUrl = resolveRefPath(refPath, currentFileUrl, rootUrl);

      // SourceMap에 기록할 상대 경로 계산
      // rootUrl: /api/save/{Bot}/
      let relativePath = resolvedUrl;
      if (resolvedUrl.startsWith(rootUrl)) {
        relativePath = resolvedUrl.substring(rootUrl.length);
      }

      sourceMap[nextPointer] = relativePath;

      // 부모 객체에 __source 배열 추가 ($ref 로드 전에)
      let shouldAddSourceToChild = false;

      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        addSourceProperty(obj, key, relativePath);
      } else if (Array.isArray(obj)) {
        // 부모가 배열인 경우 (예: globalLore 배열의 요소들)
        // 로드된 childData에 __source를 추가해야 함
        shouldAddSourceToChild = true;
      }

      try {
        const fetchUrl = addCacheBuster(resolvedUrl);

        const res = await fetch(fetchUrl);
        if (!res.ok) {
          console.warn(`[BotJsonParser] Failed to load ref: ${resolvedUrl} (${res.status})`);
          // 실패 시 빈 문자열로 대체하여 UI 크래시 방지
          obj[key] = "";
          continue;
        }

        let childData;
        const contentType = res.headers.get('content-type');
        if (resolvedUrl.endsWith('.json') || contentType?.includes('json')) {
          childData = await res.json();

          // globalLore, customscript 특수 처리: Mock 타입이면 먼저 변환 후 재탐색
          if (key === 'globalLore' || key === 'customscript') {
            const wrapperType = key === 'globalLore' ? 'risu' : 'regex';
            const converted = convertWrapperToArray(childData, wrapperType);
            childData = await recursiveTraverse(converted, nextPointer, resolvedUrl, sourceMap, rootUrl);
          } else {
            // 일반 JSON은 그냥 재귀 탐색
            childData = await recursiveTraverse(childData, nextPointer, resolvedUrl, sourceMap, rootUrl);
          }

          // 부모가 배열인 경우, 로드된 childData에 __source 추가
          if (shouldAddSourceToChild && childData && typeof childData === 'object' && !Array.isArray(childData)) {
            addSourceProperty(childData, key, relativePath);
          }
        } else {
          childData = await res.text();
          // 텍스트 파일은 더 이상 탐색하지 않음
        }

        // $ref 객체를 실제 데이터로 교체
        obj[key] = childData;
      } catch (e) {
        console.error(`[BotJsonParser] Error loading ref ${resolvedUrl}:`, e);
        // 에러 시 빈 문자열로 대체
        obj[key] = "";
      }

    } else {
      // 일반 객체/배열은 현재 파일 컨텍스트 유지하며 재귀 탐색
      obj[key] = await recursiveTraverse(val, nextPointer, currentFileUrl, sourceMap, rootUrl);
    }
  }
  return obj;
}

export async function parseBotJson(folderName: string, options?: { skipFormatUpdate?: boolean }): Promise<{ character: character, sourceMap: SourceMap, error?: boolean }> {
  let botJson: character = createBlankChar();
  const rootUrl = `/api/save/${folderName}/file/`;
  const baseEntryUrl = `/api/save/${folderName}/character.json`;
  const entryUrl = addCacheBuster(baseEntryUrl);

  // virtual file URL to pass to traverse
  // example format "content/desc.md" is interpreted as "/api/save/${folderName}/file/content/desc.md".
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
      return { character: botJson, sourceMap: {}, error: true };
    }

    const sourceMap: SourceMap = {};

    // Generate SourceMap
    const jsonData: MockCharacterDB = await recursiveTraverse(
      rawJson,
      '',
      virtualEntryUrl,
      sourceMap,
      rootUrl
    );

    console.log('[parseBotJson] SourceMap:', sourceMap);

    // 데이터 변환 및 병합

    // Global Lore 처리 (jsonData.globalLore는 이미 recursiveTraverse에서 배열로 변환됨)
    botJson.globalLore = convertWrapperToArray(jsonData.globalLore, 'risu');

    // Custom Script 처리
    botJson.customscript = convertWrapperToArray(jsonData.customscript, 'regex');

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

    // 파일 유효성 검사 및 수정
    await validateFileContent(folderName, jsonData, sourceMap);

    // characterFormatUpdate 적용 및 파일 저장 (최초 로드 시에만)
    if (!options?.skipFormatUpdate) {
      await applyFormatUpdateToFolder(folderName, botJson, sourceMap);
    }

    return { character: botJson, sourceMap };

  } catch (error) {
    console.error('[parseBotJson] Error:', error);
    return { character: botJson, sourceMap: {}, error: true };
  }
}

/**
 * Generate defaultbot template to create a new Save Folder Bot
 * @returns generated folder name (e.g., 'char1')
 */
export async function createdefaultbot(): Promise<string> {
  try {
    const response = await fetch('/api/save/create-from-template', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to create bot: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[createdefaultbot] Successfully created: ${data.folderName}`);
    return data.folderName;
  } catch (error) {
    console.error('[createdefaultbot] Error:', error);
    throw error;
  }
}
