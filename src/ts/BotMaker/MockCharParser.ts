import type { character, loreBook, customscript, triggerscript } from 'src/ts/storage/database.svelte'
import { createBlankChar } from 'src/ts/characters'
import { type MockCharacterDB, createMockCharacter, CreatesyncJson, V2_TRIGGER_HEADER, LUA_TRIGGER_HEADER, mergeSyncToCharacter, validateAndCompleteSyncJson, createSettingsYaml } from 'src/ts/BotMaker/MockCharacterDB.svelte'
import { parseDocument } from 'yaml';
import { v4 as uuid } from 'uuid';
import { loadSyncJson, loadSettingsYaml, saveToFile, saveCharacterJson, saveCharacterData, removeNulls } from './SaveFolderFileManager';
import { cloneDeep, omit, defaults } from 'lodash';
import { LuaBundler } from './luabundle';

export type SourceMap = Record<string, string>;

/**
 * 범용 객체 병합: target에 없는 source의 필드를 추가
 * @returns 추가된 키 목록
 */
function ensureMissingFields<T extends Record<string, any>>(target: T, source: T): string[] {
  const addedKeys: string[] = [];
  for (const key in source) {
    if (!(key in target)) {
      // @ts-ignore
      target[key] = source[key];
      addedKeys.push(key);
    }
  }
  return addedKeys;
}

/**
 * Wrapper 타입 데이터를 배열로 변환 (risu → lorebook, regex → customscript)
 */
function convertWrapperToArray(data: any, wrapperType: 'risu' | 'regex'): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (wrapperType === 'risu' && data?.type === 'risu' && Array.isArray(data.data)) {
    return data.data;
  }

  if (wrapperType === 'regex' && data?.type === 'regex' && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
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

/**
 * sync.json 파일 검사 및 생성
 * @returns {content, created} - sync.json 내용과 생성 여부
 */
async function ensureSyncJson(folderName: string): Promise<{ content: any; created: boolean }> {
  let syncJsonContent = await loadSyncJson(folderName);
  
  if (!syncJsonContent) {
    // sync.json 생성
    const syncData = CreatesyncJson();
    try {
      await saveToFile(folderName, '.metadata/sync.json', syncData);
      console.log('[ensureSyncJson] Created new sync.json');
      return { content: syncData, created: true };
    } catch (e) {
      console.error('[ensureSyncJson] Failed to create sync.json', e);
      throw e;
    }
  }

  // sync.json 파싱 및 필수 필드 보완
  try {
    const { parsedJson, modified } = validateAndCompleteSyncJson(syncJsonContent);

    // sync.json 수정이 필요하면 저장
    if (modified) {
      console.log('[ensureSyncJson] sync.json modified, saving...');
      await saveToFile(folderName, '.metadata/sync.json', parsedJson);
    }
    
    return { content: parsedJson, created: false };
  } catch (e) {
    console.error('[ensureSyncJson] Failed to validate sync.json', e);
    throw e;
  }
}

/**
 * settings.yaml 파일 검사 및 생성
 * @returns {triggerVersion, useluabundle, created} - settings.yaml 값과 생성 여부
 */
async function ensureSettingsYaml(
  folderName: string,
  triggerscript: triggerscript[]
): Promise<{ triggerVersion: 'v1' | 'v2' | 'lua'; useluabundle: boolean; created: boolean }> {
  let settingsYamlContent = await loadSettingsYaml(folderName);
  
  if (!settingsYamlContent) {
    // settings.yaml 생성 (triggerversion만 포함)
    const detectedVersion = detectTriggerVersion(triggerscript);
    const settingsYaml = createSettingsYaml(detectedVersion);

    try {
      await saveToFile(folderName, '.metadata/settings.yaml', settingsYaml);
      console.log('[ensureSettingsYaml] Created new settings.yaml');
    } catch (e) {
      console.error('[ensureSettingsYaml] Failed to create settings.yaml', e);
      throw e;
    }

    const triggerVersion: 'v1' | 'v2' | 'lua' = 
      detectedVersion === 'lua' || detectedVersion === 'v2' || detectedVersion === 'v1'
        ? detectedVersion
        : 'v2';

    return {
      triggerVersion,
      useluabundle: false,
      created: true
    };
  }

  // settings.yaml 파싱
  try {
    const doc = parseDocument(settingsYamlContent);
    const parsedYaml = doc.toJSON() as any;
    const triggerVersion: 'v1' | 'v2' | 'lua' = parsedYaml.triggerversion || 'v2';
    const useluabundle: boolean = parsedYaml.useluabundle || false;

    return {
      triggerVersion,
      useluabundle,
      created: false
    };
  } catch (e) {
    console.error('[ensureSettingsYaml] Failed to parse settings.yaml', e);
    return {
      triggerVersion: 'v2',
      useluabundle: false,
      created: false
    };
  }
}

/**
 * 파일 유효성 검사
 */
async function validateFileContent(folderName: string, jsonData: MockCharacterDB, sourceMap: SourceMap): Promise<boolean> {
  const json = jsonData;

  // 파일검사: 누락된 필드 보완
  const mock = createMockCharacter();
  const missingKeys = ensureMissingFields(json, mock);
  
  // 누락된 키를 character.json에 즉시 저장
  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      console.log(`[validateFileContent] Missing key added: ${key}`);
      try {
        // @ts-ignore
        await saveCharacterJson(folderName, `/${key}`, mock[key]);
        console.log(`[validateFileContent] Saved missing key ${key} to character.json`);
      } catch (e) {
        console.error(`[validateFileContent] Failed to save missing key ${key}`, e);
      }
    }
  }

  // globalLore와 customscript를 Wrapper 형태로 변환 (순수 배열이면 Wrapper로 감싸기)
  // 단, character.json에는 저장하지 않음 (외부 파일 참조를 유지하기 위해)
  if (Array.isArray(json.globalLore)) {
    console.log(`[validateFileContent] globalLore is array (already loaded from external file), converting to wrapper in memory only`);
    const { ensureLoreBookWrapper } = await import('./MockCharacterDB.svelte');
    const wrapper = ensureLoreBookWrapper(json.globalLore);
    json.globalLore = wrapper;
    // character.json에는 저장하지 않음 - $ref 유지
  }

  if (Array.isArray(json.customscript)) {
    console.log(`[validateFileContent] customscript is array (already loaded from external file), converting to wrapper in memory only`);
    const { ensureCustomScriptWrapper } = await import('./MockCharacterDB.svelte');
    const wrapper = ensureCustomScriptWrapper(json.customscript);
    json.customscript = wrapper;
    // character.json에는 저장하지 않음 - $ref 유지
  }

  // .metadata 에 sync.json과 settings.yaml 검사
  try {
    await ensureSyncJson(folderName);
  } catch (e) {
    console.error('[validateFileContent] Failed to ensure sync.json', e);
    return false;
  }

  let triggerVersion: 'v1' | 'v2' | 'lua';
  let useluabundle: boolean;
  
  try {
    const settings = await ensureSettingsYaml(folderName, json.triggerscript);
    triggerVersion = settings.triggerVersion;
    useluabundle = settings.useluabundle;
  } catch (e) {
    console.error('[validateFileContent] Failed to ensure settings.yaml', e);
    return false;
  }

  // triggerscript를 settings.yaml의 triggerversion에 맞게 보정
  if (!json.triggerscript) json.triggerscript = [];

  const { modified: triggerModified, triggerscript: normalizedTriggerScript } = normalizeTriggerScript(json.triggerscript, triggerVersion);

  // luabundle 사용
  if (useluabundle && triggerVersion === 'lua') {
    await processLuaBundle(folderName, normalizedTriggerScript, sourceMap);
  }

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

      // URL 해결: 절대/상대 경로 모두 처리
      let resolvedUrl: string;

      if (refPath.startsWith('./') || refPath.startsWith('../')) {
        // 상대 경로 (., ..) - 컨테이너 파일 기준
        const parentDir = currentFileUrl.substring(0, currentFileUrl.lastIndexOf('/') + 1);
        const resolvedUrlObj = new URL(refPath, "http://dummy" + parentDir);
        resolvedUrl = resolvedUrlObj.pathname;
      } else {
        // 절대 경로 - 루트 기준
        resolvedUrl = rootUrl + refPath;
      }

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
        if (!Array.isArray(obj.__source)) {
          Object.defineProperty(obj, '__source', {
            value: [],
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
        obj.__source.push({ key: String(key), path: relativePath });
      } else if (Array.isArray(obj)) {
        // 부모가 배열인 경우 (예: globalLore 배열의 요소들)
        // 로드된 childData에 __source를 추가해야 함
        shouldAddSourceToChild = true;
      }

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
            const wrapperType = key === 'globalLore' ? 'risu' : 'regex';
            const converted = convertWrapperToArray(childData, wrapperType);
            childData = await recursiveTraverse(converted, nextPointer, resolvedUrl, sourceMap, rootUrl);
          } else {
            // 일반 JSON은 그냥 재귀 탐색
            childData = await recursiveTraverse(childData, nextPointer, resolvedUrl, sourceMap, rootUrl);
          }

          // 부모가 배열인 경우, 로드된 childData에 __source 추가
          if (shouldAddSourceToChild && childData && typeof childData === 'object' && !Array.isArray(childData)) {
            if (!Array.isArray(childData.__source)) {
              Object.defineProperty(childData, '__source', {
                value: [],
                writable: true,
                enumerable: true,
                configurable: true
              });
            }
            childData.__source.push({ key: String(key), path: relativePath });
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

export async function parseBotJson(folderName: string): Promise<{ character: character, sourceMap: SourceMap, error?: boolean }> {
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
      return { character: botJson, sourceMap: {}, error: true };
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

    return { character: botJson, sourceMap };

  } catch (error) {
    console.error('[parseBotJson] Error:', error);
    return { character: botJson, sourceMap: {}, error: true };
  }
}

/**
 * defaultbot 템플릿을 사용하여 새 Save Folder Bot 생성
 * @returns 생성된 폴더명 (예: 'char1')
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

/**
 * Lua 번들링 처리 함수
 */
async function processLuaBundle(
  folderName: string,
  normalizedTriggerScript: any[],
  sourceMap: SourceMap
): Promise<void> {
  try {
    console.log('[processLuaBundle] Processing Lua bundle...');
    const bundler = new LuaBundler();
    await bundler.initialize();

    // triggerscript에서 triggerlua 타입의 코드 파일 경로 찾기
    const luaFilesToBundle: Array<{ triggerIndex: number; sourcePath: string; code: string }> = [];
    
    for (let i = 0; i < normalizedTriggerScript.length; i++) {
      const trigger = normalizedTriggerScript[i];
      if (trigger.effect?.[0]?.type === 'triggerlua') {
        const code = trigger.effect[0].code;
        
        // sourceMap에서 이 trigger의 원본 파일 경로 찾기
        const triggerPointer = `/triggerscript/${i}/effect/0/code`;
        const sourcePath = sourceMap[triggerPointer];
        
        if (sourcePath && sourcePath.endsWith('.lua')) {
          // 외부 .lua 파일을 참조하는 경우
          console.log(`[processLuaBundle] Found lua file reference: ${sourcePath}`);
          luaFilesToBundle.push({
            triggerIndex: i,
            sourcePath: sourcePath,
            code: typeof code === 'string' ? code : ''
          });
        } else if (typeof code === 'string') {
          // 인라인 코드인 경우
          luaFilesToBundle.push({
            triggerIndex: i,
            sourcePath: '',
            code: code
          });
        }
      }
    }

    if (luaFilesToBundle.length > 0) {
      // 메인 파일의 코드 (첫 번째 lua 파일)
      const mainLuaFile = luaFilesToBundle[0];
      const mainCode = mainLuaFile.code;
      
      // 같은 디렉토리의 다른 lua 파일들을 커스텀 모듈로 수집
      const customModules: Record<string, string> = {};
      
      if (mainLuaFile.sourcePath) {
        // 메인 파일의 디렉토리 경로
        const mainDir = mainLuaFile.sourcePath.substring(0, mainLuaFile.sourcePath.lastIndexOf('/'));
        
        // mainCode에서 require 호출 찾기
        const requirePattern = /require\s*[("']([^"')]+)[("')]/g;
        let match;
        
        while ((match = requirePattern.exec(mainCode)) !== null) {
          const moduleName = match[1];
          
          // 표준 모듈(json 등)이 아닌 경우에만 로컬 파일로 간주
          if (moduleName !== 'json' && !moduleName.startsWith('src/')) {
            const modulePath = mainDir ? `${mainDir}/${moduleName}.lua` : `${moduleName}.lua`;
            
            try {
              // 모듈 파일 로드
              const timestamp = Date.now();
              const moduleUrl = `/api/save/${folderName}/file/${modulePath}?t=${timestamp}`;
              const response = await fetch(moduleUrl);
              
              if (response.ok) {
                const moduleCode = await response.text();
                customModules[moduleName] = moduleCode;
                console.log(`[processLuaBundle] Loaded custom module: ${moduleName} from ${modulePath}`);
              } else {
                console.warn(`[processLuaBundle] Module file not found: ${modulePath}`);
              }
            } catch (error) {
              console.warn(`[processLuaBundle] Failed to load module ${moduleName}:`, error);
            }
          }
        }
      }

      // 번들링 수행
      const bundleResult = await bundler.bundle({
        code: mainCode,
        customModules: customModules,
        enableCache: true
      });

      console.log(`[processLuaBundle] Bundled with modules: ${bundleResult.modules.join(', ')}`);
      console.log(`[processLuaBundle] From cache: ${bundleResult.fromCache}`);

      // .compile 폴더에 번들 결과 저장
      await saveToFile(folderName, '.compile/main.lua', bundleResult.bundled);
      console.log('[processLuaBundle] Bundle saved to .compile/main.lua');

      // character.json에서 triggerlua 코드를 $ref로 교체
      // 첫 번째 triggerlua만 $ref로 변경하고 나머지는 제거
      let firstLuaTriggerFound = false;
      for (let i = 0; i < normalizedTriggerScript.length; i++) {
        const trigger = normalizedTriggerScript[i];
        if (trigger.effect?.[0]?.type === 'triggerlua') {
          if (!firstLuaTriggerFound) {
            // 첫 번째 triggerlua를 $ref로 교체
            trigger.effect[0].code = { $ref: '.compile/main.lua' } as any;
            firstLuaTriggerFound = true;
            console.log(`[processLuaBundle] Replaced trigger ${i} with $ref to .compile/main.lua`);
          } else {
            // 나머지 triggerlua 트리거는 제거 (이미 번들에 포함됨)
            normalizedTriggerScript.splice(i, 1);
            i--; // 인덱스 조정
            console.log(`[processLuaBundle] Removed duplicate lua trigger at index ${i + 1}`);
          }
        }
      }

      // 수정된 triggerscript 저장
      await saveCharacterData(folderName, '/triggerscript', normalizedTriggerScript, sourceMap);
      console.log('[processLuaBundle] Updated triggerscript with bundle reference');
    }
  } catch (error) {
    console.error('[processLuaBundle] Lua bundle error:', error);
    // 번들링 실패 시 원본 유지
  }
}