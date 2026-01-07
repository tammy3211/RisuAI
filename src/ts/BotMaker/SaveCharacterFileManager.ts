import { cloneDeep } from 'lodash';
import type { character } from '../storage/database.svelte';
import { isCharacterKey } from './MockCharacterDB.svelte';
import {
  getValueByPath,
  saveCharacterData,
  saveToSyncJson,
  writeLorebook,
  writeCustomScripts,
  saveRefToContainer
} from './SaveFolderFileManager';

/**
 * 캐릭터 전체를 파일에 덮어쓰기 (재귀 순회 방식)
 * @param folderName 저장할 폴더명
 * @param character 저장할 캐릭터 데이터
 * @param sourceMap 파일 경로 맵
 */
export async function overwriteAllToFiles(
  folderName: string,
  character: character,
  sourceMap: Record<string, string>
): Promise<void> {

  // lastInteraction, bookVersion 제거 (저장 불필요)
  const charToSave = cloneDeep(character);
  delete charToSave.lastInteraction;

  const removeBookVersion = (obj: any) => {
    if (obj && typeof obj === 'object') {
      delete obj.bookVersion;
      if (Array.isArray(obj)) {
        obj.forEach(item => removeBookVersion(item));
      } else {
        Object.values(obj).forEach(val => removeBookVersion(val));
      }
    }
  };
  removeBookVersion(charToSave);

  // 1단계: __source가 있는 배열 아이템들 먼저 처리
  if (charToSave.globalLore && Array.isArray(charToSave.globalLore)) {
    for (let i = 0; i < charToSave.globalLore.length; i++) {
      const item = charToSave.globalLore[i];
      if (item && typeof item === 'object' && '__source' in item) {
        await saveRefToContainer(folderName, item, `/globalLore/${i}`, sourceMap);
      }
    }
  }

  if (charToSave.customscript && Array.isArray(charToSave.customscript)) {
    for (let i = 0; i < charToSave.customscript.length; i++) {
      const item = charToSave.customscript[i];
      if (item && typeof item === 'object' && '__source' in item) {
        await saveRefToContainer(folderName, item, `/customscript/${i}`, sourceMap);
      }
    }
  }

  // 2단계: 재귀적으로 모든 필드 저장
  await saveAllFieldsRecursively(folderName, charToSave, '', sourceMap);
}

/**
 * 재귀적으로 모든 필드를 파일에 저장
 */
async function saveAllFieldsRecursively(
  folderName: string,
  data: any,
  currentPath: string,
  sourceMap: Record<string, string>,
  parentData?: any
): Promise<void> {
  if (data === null || data === undefined) return;

  // 원시값이면 부모에서 저장되므로 여기서는 스킵
  if (typeof data !== 'object') return;

  // 배열 처리
  if (Array.isArray(data)) {
    // 배열 자체를 저장 (부모 경로에서)
    if (currentPath) {
      await saveFieldByPath(folderName, currentPath, data, sourceMap);
    }

    // 배열 요소들 재귀 처리
    for (let i = 0; i < data.length; i++) {
      const itemPath = `${currentPath}/${i}`;
      await saveAllFieldsRecursively(folderName, data[i], itemPath, sourceMap, data);
    }
    return;
  }

  // 객체 처리 - __source 체크
  const hasSource = Array.isArray(data.__source) && data.__source.length > 0;
  const sourceKeys = hasSource ? new Set(data.__source.map((s: any) => s.key)) : new Set();

  const keys = Object.keys(data);

  for (const key of keys) {
    // __source, __sourcePath 등 내부 메타데이터는 스킵
    if (key.startsWith('__')) continue;

    // __source 배열에 정의된 필드는 스킵 ($ref로 이미 처리됨)
    if (sourceKeys.has(key)) {
      continue;
    }

    const value = data[key];
    const fieldPath = currentPath ? `${currentPath}/${key}` : `/${key}`;

    // globalLore, customscript는 1단계에서 이미 처리됨 (saveRefToContainer)
    // 여기서 다시 처리하면 $ref가 실제 데이터로 덮어씌워짐
    if (fieldPath === '/globalLore' || fieldPath === '/customscript') {
      continue;
    }

    // 원시값이면 저장
    if (typeof value !== 'object' || value === null) {
      await saveFieldByPath(folderName, fieldPath, value, sourceMap);
    } else {
      // 객체/배열이면 재귀
      await saveAllFieldsRecursively(folderName, value, fieldPath, sourceMap, data);
    }
  }
}

/**
 * 특정 경로의 필드를 파일에 저장
 */
async function saveFieldByPath(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
): Promise<void> {
  // console.log(`[Save Folder] Saving field: ${jsonPointer}`);

  // Character 키인지 확인
  if (isCharacterKey(jsonPointer)) {
    await saveCharacterData(folderName, jsonPointer, value, sourceMap);
  } else {
    // sync.json에 저장
    const dotPath = jsonPointer.substring(1).replace(/\//g, '.');
    await saveToSyncJson(folderName, dotPath, value);
  }
}

/**
 * 변경사항을 파일에 저장
 */
export async function saveChangesToFiles(
  folderName: string,
  changes: string[],
  currentData: character,
  sourceMap: Record<string, string>
): Promise<void> {
  // 1단계: __source 변경 먼저 처리 (배열 아이템 순서 변경)
  const sourceChanges = changes.filter(c => c.includes('__source'));

  if (sourceChanges.length > 0) {

    // globalLore 배열 아이템 체크
    if (currentData.globalLore && Array.isArray(currentData.globalLore)) {
      for (let i = 0; i < currentData.globalLore.length; i++) {
        const item = currentData.globalLore[i];
        if (item && typeof item === 'object' && '__source' in item) {
          await saveRefToContainer(folderName, item, `/globalLore/${i}`, sourceMap);
        }
      }
    }

    // customscript 배열 아이템 체크
    if (currentData.customscript && Array.isArray(currentData.customscript)) {
      for (let i = 0; i < currentData.customscript.length; i++) {
        const item = currentData.customscript[i];
        if (item && typeof item === 'object' && '__source' in item) {
          await saveRefToContainer(folderName, item, `/customscript/${i}`, sourceMap);
        }
      }
    }
  }

  // 2단계: 나머지 변경사항 처리
  const otherChanges = changes.filter(c => !c.includes('__source'));

  for (const changeStr of otherChanges) {
    const colonIndex = changeStr.indexOf(':');
    if (colonIndex === -1) continue;

    const path = changeStr.substring(0, colonIndex).trim();

    // JSON Pointer 형식으로 변환
    const jsonPointer = path.startsWith('/')
      ? path
      : '/' + path.replace(/\./g, '/').replace(/\[/g, '/').replace(/\]/g, '');

    // 값 가져오기
    const newValue = getValueByPath(currentData, jsonPointer);

    // globalLore, customscript 특별 처리
    if (jsonPointer.startsWith('/globalLore')) {
      await writeLorebook(folderName, jsonPointer, newValue, sourceMap);
      continue;
    }

    if (jsonPointer.startsWith('/customscript')) {
      await writeCustomScripts(folderName, jsonPointer, newValue, sourceMap);
      continue;
    }

    // 나머지는 saveFieldByPath 활용
    await saveFieldByPath(folderName, jsonPointer, newValue, sourceMap);
  }
}
