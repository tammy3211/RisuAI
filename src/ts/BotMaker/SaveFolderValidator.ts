import { cloneDeep } from 'lodash';
import { parseDocument } from 'yaml';
import type { triggerscript } from '../storage/database.svelte';
import { V2_TRIGGER_HEADER, LUA_TRIGGER_HEADER, CreatesyncJson, validateAndCompleteSyncJson, createSettingsYaml, type MockCharacterDB, createMockCharacter } from './MockCharacterDB.svelte';
import { type SourceMap } from './MockCharParser';
import { loadSyncJson, saveToFile, loadSettingsYaml, saveCharacterJson, saveCharacterData } from './SaveFolderFileManager';
import { LuaBundler } from './luabundle';

/**
 * 범용 객체 병합: target에 없는 source의 필드를 추가
 * @returns 추가된 키 목록
 */
function ensureMissingFields<T extends Record<string, any>>(target: T, source: T): string[] {
  const addedKeys: string[] = [];
  for (const key in source) {
    if (!(key in target)) {
      target[key] = source[key];
      addedKeys.push(key);
    }
  }
  return addedKeys;
}
/**
 * Wrapper 타입 데이터를 배열로 변환 (risu → lorebook, regex → customscript)
 */
export function convertWrapperToArray(data: any, wrapperType: 'risu' | 'regex'): any[] {
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
      result.unshift(V2_TRIGGER_HEADER);
      modified = true;
    }
  } else if (triggerVersion === "lua") {
    // lua: triggerlua 헤더가 없으면 추가
    if (!firstEffect || firstEffectType !== 'triggerlua') {
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

async function ensureSyncJson(folderName: string): Promise<{ content: any; created: boolean; }> {
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
): Promise<{ triggerVersion: 'v1' | 'v2' | 'lua'; useluabundle: boolean; created: boolean; }> {
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

    const triggerVersion: 'v1' | 'v2' | 'lua' = detectedVersion === 'lua' || detectedVersion === 'v2' || detectedVersion === 'v1'
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
export async function validateFileContent(folderName: string, jsonData: MockCharacterDB, sourceMap: SourceMap): Promise<boolean> {
  const json = jsonData;

  // 파일검사: 누락된 필드 보완
  const mock = createMockCharacter();
  const missingKeys = ensureMissingFields(json, mock);

  // 누락된 키를 character.json에 즉시 저장
  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      console.log(`[validateFileContent] Missing key added: ${key}`);
      try {
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
 * Lua 번들링 처리 함수
 */
export async function processLuaBundle(
  folderName: string,
  normalizedTriggerScript: any[],
  sourceMap: SourceMap
): Promise<void> {
  try {
    console.log('[processLuaBundle] Processing Lua bundle...');
    const bundler = new LuaBundler();
    await bundler.initialize();

    // triggerscript에서 triggerlua 타입의 코드 파일 경로 찾기
    const luaFilesToBundle: Array<{ triggerIndex: number; sourcePath: string; code: string; }> = [];

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

