/**
 * Save Folder 파일 읽기/쓰기 유틸리티
 */

/**
 * 파일 읽기 (텍스트)
 */
async function readFile(folderName: string, filePath: string): Promise<string | null> {
  const url = `/api/save/${folderName}/file/${filePath}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error(`[FileManager] Error reading ${filePath}:`, error);
    return null;
  }
}

/**
 * 파일 쓰기 (텍스트)
 */
async function writeFile(folderName: string, filePath: string, content: string): Promise<boolean> {
  const url = `/api/save/${folderName}/file/${filePath}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: content
    });
    
    if (!res.ok) {
      console.error(`[FileManager] Failed to write ${filePath}: ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[FileManager] Error writing ${filePath}:`, error);
    return false;
  }
}

/**
 * JSON 파일 읽기
 */
async function readJson(folderName: string, filePath: string): Promise<any | null> {
  const content = await readFile(folderName, filePath);
  if (!content) return null;
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`[FileManager] Error parsing JSON ${filePath}:`, error);
    return null;
  }
}

/**
 * JSON 파일 쓰기
 */
async function writeJson(folderName: string, filePath: string, data: any): Promise<boolean> {
  const content = JSON.stringify(data, null, 2);
  return await writeFile(folderName, filePath, content);
}

/**
 * JSON 포인터 경로(예: /name, /desc)를 객체에서 값을 가져오는 함수
 */
export function getValueByPath(obj: any, path: string): any {
  if (!path || path === '') return obj;
  const keys = path.split('/').filter(k => k !== '');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * 객체 경로로 값 설정
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('/').filter(k => k !== '');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * SourceMap을 참조하여 적절한 파일에 데이터 저장
 */
export async function saveCharacterData(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
): Promise<void> {
  // 1. SourceMap에 정확히 일치하는 경로가 있는지 확인
  if (sourceMap[jsonPointer]) {
    const filePath = sourceMap[jsonPointer];
    await saveToFile(folderName, filePath, value);
    console.log(`[FileManager] Saved ${jsonPointer} to external file: ${filePath}`);
    return;
  }

  // 2. 상위 경로가 SourceMap에 있는지 확인 (JSON 파일 내부 수정인 경우)
  let parentPointer = jsonPointer;
  while (parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));
    
    if (sourceMap[parentPointer]) {
      const filePath = sourceMap[parentPointer];
      
      // JSON 파일인 경우에만 내부 수정 가능
      if (filePath.endsWith('.json')) {
        const relativePath = jsonPointer.substring(parentPointer.length);
        console.log(`[FileManager] Found parent ${parentPointer} in SourceMap -> ${filePath}`);
        
        const externalData = await readJson(folderName, filePath);
        if (externalData) {
          setValueByPath(externalData, relativePath, value);
          await writeJson(folderName, filePath, externalData);
          console.log(`[FileManager] Saved ${jsonPointer} to external file ${filePath} (via parent ${parentPointer})`);
          return;
        }
      }
    }
  }

  // 3. character.json에 저장
  await saveCharacterJson(folderName, jsonPointer, value);
  console.log(`[FileManager] Saved ${jsonPointer} to character.json`);
}

/**
 * 개별 파일에 저장 (JSON, MD, 기타)
 */
export async function saveToFile(folderName: string, filePath: string, value: any): Promise<void> {
  if (filePath.endsWith('.json')) {
    await writeJson(folderName, filePath, value);
  } else {
    // Markdown/텍스트 파일: 문자열로 변환
    await writeFile(folderName, filePath, String(value));
  }
}

/**
 * character.json의 특정 필드만 수정 ($ref 보존)
 */
export async function saveCharacterJson(folderName: string, fieldPath: string, value: any): Promise<void> {
  // 원본 character.json 로드
  const originalJson = await readJson(folderName, 'character.json');
  if (!originalJson) {
    console.error(`[FileManager] Failed to load character.json`);
    return;
  }

  // 필드 경로에 값 설정
  setValueByPath(originalJson, fieldPath, value);

  // 수정된 JSON 저장
  await writeJson(folderName, 'character.json', originalJson);
}

/**
 * sync.json에 값 저장
 */
export async function saveToSyncJson(folderName: string, path: string, value: any): Promise<void> {
  console.log(`[saveToSyncJson] path: ${path}, value:`, value);
  
  // 기존 sync.json 로드 (없으면 빈 객체)
  let syncData = await readJson(folderName, '.metadata/sync.json') || {};

  let mappedPath = path;

  console.log(`[saveToSyncJson] mappedPath: ${mappedPath}`);

  // 1. 점(.)으로 분리
  // 2. 배열 인덱스 [0] 처리
  const pathSegments: (string | number)[] = [];
  const parts = mappedPath.split('.');
  
  for (const part of parts) {
    // 배열 인덱스가 포함된 경우: "chats[0]" -> ["chats", 0]
    const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
    if (arrayMatch) {
      pathSegments.push(arrayMatch[1]); // 키 이름
      pathSegments.push(parseInt(arrayMatch[2], 10)); // 배열 인덱스
    } else {
      pathSegments.push(part);
    }
  }

  console.log(`[saveToSyncJson] pathSegments:`, pathSegments);

  // 경로를 따라 이동하면서 값 설정
  let current: any = syncData;
  
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const key = pathSegments[i];
    const nextKey = pathSegments[i + 1];
    
    console.log(`[saveToSyncJson] key: ${key}, nextKey: ${nextKey}, current[key]:`, current[key]);
    
    // 다음 키가 숫자면 배열 생성, 아니면 객체 생성
    if (!(key in current)) {
      current[key] = typeof nextKey === 'number' ? [] : {};
    }
    
    // 배열인 경우, 인덱스가 범위를 벗어나면 배열 확장 (null로 채우지 않음)
    if (Array.isArray(current[key]) && typeof key === 'number') {
      // 배열 요소는 미리 생성하지 않음 (값이 설정될 때만 생성)
    } else if (Array.isArray(current[key]) && typeof nextKey === 'number') {
      // 다음이 배열 인덱스인 경우, 현재 위치로 이동만 함
      // 실제 값은 마지막 단계에서 설정됨
    }
    
    current = current[key];
  }
  
  const lastKey = pathSegments[pathSegments.length - 1];
  console.log(`[saveToSyncJson] Setting ${lastKey} to`, value, 'in', current);
  
  // undefined 값은 저장하지 않음 (JSON에서 제거됨)
  if (value === undefined) {
    console.log(`[saveToSyncJson] Skipping undefined value for ${lastKey}`);
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }

  // console.log(`[saveToSyncJson] Final syncData:`, JSON.stringify(syncData, null, 2));

  // 저장
  await writeJson(folderName, '.metadata/sync.json', syncData);
  
  console.log(`[saveToSyncJson] Saved to sync.json`);
}

/**
 * sync.json 읽기
 */
export async function loadSyncJson(folderName: string): Promise<any | null> {
  return await readJson(folderName, '.metadata/sync.json');
}

/**
 * settings.yaml 읽기
 */
export async function loadSettingsYaml(folderName: string): Promise<string | null> {
  return await readFile(folderName, '.metadata/settings.yaml');
}

/**
 * lorebook 쓰기
 */
export async function writeLorebook() {
  // 입력값, 소스 맵, 폴더 이름을 받아서 lorebook 파일을 작성하는 로직 구현

}

/**
 * customscripts 쓰기
 */

/**
 * 에셋 저장/삭제
 */