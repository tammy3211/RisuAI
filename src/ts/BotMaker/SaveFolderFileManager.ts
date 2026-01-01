import pointer from 'json-pointer';
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

function removeSourceKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => removeSourceKeys(v));
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => key !== '__source' && key !== '__sourcePath')
        .map(([key, value]) => [key, removeSourceKeys(value)])
    );
  }
  return obj;
}

/**
 * JSON 파일 쓰기
 */
async function writeJson(folderName: string, filePath: string, data: any): Promise<boolean> {
  const noSource = removeSourceKeys(data);
  const cleanData = removeNulls(noSource);
  const content = JSON.stringify(cleanData, null, 2);
  return await writeFile(folderName, filePath, content);
}

/**
 * JSON 포인터 경로(예: /name, /desc)를 객체에서 값을 가져오는 함수
 */
/**
 * JSON 포인터 경로(예: /name, /desc)를 객체에서 값을 가져오는 함수
 */
export function getValueByPath(obj: any, path: string): any {
  if (!path || path === '') return obj;
  try {
    return pointer.get(obj, path);
  } catch (e) {
    return undefined;
  }
}

/**
 * 객체 경로로 값 설정
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  pointer.set(obj, path, value);
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
 * 객체의 __source 배열을 참고하여 컨테이너 파일의 $ref를 업데이트하고 sourceMap을 갱신합니다.
 * @param folderName 폴더명
 * @param itemData __source 속성이 있는 객체 (예: lorebook 아이템)
 * @param itemPointer 아이템의 전체 포인터 (예: /globalLore/2)
 * @param sourceMap 소스 맵 (참조로 전달되어 갱신됨)
 */
export async function saveRefToContainer(
  folderName: string,
  itemData: any,
  itemPointer: string,
  sourceMap: Record<string, string>
): Promise<void> {
  // __source 배열이 없으면 아무것도 하지 않음
  if (!itemData || !Array.isArray(itemData.__source) || itemData.__source.length === 0) {
    return;
  }

  // 1. 컨테이너 파일 찾기 (위로 탐색)
  let parentPointer = itemPointer;
  let containerFile = '';

  while (parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));

    if (sourceMap[parentPointer] && sourceMap[parentPointer].endsWith('.json')) {
      containerFile = sourceMap[parentPointer];
      break;
    }
  }

  if (!containerFile) {
    containerFile = 'character.json';
    parentPointer = '';
  }

  // 2. 컨테이너 파일 로드
  const containerData = await readJson(folderName, containerFile);
  if (!containerData) {
    console.error(`[saveRefToContainer] Failed to load container: ${containerFile}`);
    return;
  }

  // 3. 기본 상대 경로 계산
  let baseRelativePath = itemPointer;
  if (parentPointer.length > 0) {
    baseRelativePath = itemPointer.substring(parentPointer.length);
  }

  // 4. Wrapper 타입 감지
  let wrapperPrefix = '';
  if (containerData.type === 'risu' && Array.isArray(containerData.data)) {
    wrapperPrefix = '/data';
  } else if (containerData.type === 'regex' && Array.isArray(containerData.data)) {
    wrapperPrefix = '/data';
  }

  // 5. __source 배열의 각 항목에 대해 $ref 설정
  for (const sourceEntry of itemData.__source) {
    const { key, path } = sourceEntry;
    
    // 전체 JSON 포인터 계산
    const fullPointer = `${itemPointer}/${key}`;
    
    // 컨테이너 내 상대 경로
    const relativePath = wrapperPrefix + baseRelativePath + `/${key}`;
    
    // $ref 설정
    setValueByPath(containerData, relativePath, { $ref: path });
    
    // sourceMap 갱신
    sourceMap[fullPointer] = path;
  }

  // 6. 컨테이너 파일 저장
  await writeJson(folderName, containerFile, containerData);
  console.log(`[saveRefToContainer] Updated ${itemData.__source.length} ref(s) in ${containerFile} for ${itemPointer}`);
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
 * 객체나 배열을 순회하며 null/undefined를 제거하는 함수
 */
export function removeNulls(obj: any): any {
  if (Array.isArray(obj)) {
    return obj
      .map(v => removeNulls(v))
      .filter(v => v !== null && v !== undefined);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, removeNulls(v)])
        .filter(([_, v]) => v !== null && v !== undefined)
    );
  }
  return obj;
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
/**
 * lorebook 쓰기
 */
export async function writeLorebook(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
) {
  // 1. SourceMap이나 상위 경로를 통해 파일 찾기
  let parentPointer = jsonPointer;
  let filePath = sourceMap[parentPointer];

  // 정확한 경로가 없으면 상위 경로 탐색
  while (!filePath && parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));
    if (sourceMap[parentPointer]) {
      filePath = sourceMap[parentPointer];
      break;
    }
  }

  // 파일이 없으면 기본 character.json에 저장 (단, globalLore 루트인 경우)
  if (!filePath) {
    // globalLore는 보통 루트에 있으므로 character.json에 저장 시도
    if (jsonPointer.startsWith('/globalLore')) {
      await saveCharacterJson(folderName, jsonPointer, value);
      console.log(`[FileManager] Saved ${jsonPointer} to character.json (No external file found)`);
    } else {
      console.warn(`[FileManager] No file found for ${jsonPointer}`);
    }
    return;
  }

  // 2. 파일 확장자 확인
  // JSON 파일이 아니면 (예: .md, .txt) 파일 전체를 덮어씀
  if (!filePath.toLowerCase().endsWith('.json')) {
    await saveToFile(folderName, filePath, value);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (Non-JSON Direct Save)`);
    return;
  }

  // 3. 파일 읽기
  const externalData = await readJson(folderName, filePath);
  if (!externalData) {
    console.error(`[FileManager] Failed to read ${filePath}`);
    return;
  }

  // 4. 상대 경로 계산
  // parentPointer가 /globalLore 이고 jsonPointer가 /globalLore/0/content 면 -> /0/content
  let relativePath = jsonPointer === parentPointer
    ? ''
    : jsonPointer.substring(parentPointer.length);

  // 5. Wrapper 체크 (type: 'risu')
  // 만약 파일이 Risu 포맷 Wrapper({ type: 'risu', data: [...] })라면 경로 수정
  if (externalData.type === 'risu' && Array.isArray(externalData.data)) {
    // 상대 경로 앞에 /data 추가
    relativePath = '/data' + relativePath;
  }

  // 6. 값 설정 및 저장
  if (relativePath === '') {
    // 상대 경로가 비어있다면 파일 전체를 교체하는 것임
    // 배열이면 Wrapper로 변환
    let saveValue = value;
    if (Array.isArray(value)) {
      const { ensureLoreBookWrapper } = await import('./MockCharacterDB.svelte');
      saveValue = ensureLoreBookWrapper(value);
      console.log(`[FileManager] Converted array to Wrapper format`);
    }
    await writeJson(folderName, filePath, saveValue);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (Root Replacement)`);
  } else {
    setValueByPath(externalData, relativePath, value);
    await writeJson(folderName, filePath, externalData);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (adjusted path: ${relativePath})`);
  }
}

/**
 * customscripts 쓰기
 */
export async function writeCustomScripts(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
) {
  // 1. SourceMap이나 상위 경로를 통해 파일 찾기
  let parentPointer = jsonPointer;
  let filePath = sourceMap[parentPointer];

  while (!filePath && parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));
    if (sourceMap[parentPointer]) {
      filePath = sourceMap[parentPointer];
      break;
    }
  }

  if (!filePath) {
    if (jsonPointer.startsWith('/customscript')) {
      await saveCharacterJson(folderName, jsonPointer, value);
      console.log(`[FileManager] Saved ${jsonPointer} to character.json (No external file found)`);
    } else {
      console.warn(`[FileManager] No file found for ${jsonPointer}`);
    }
    return;
  }

  // 2. 파일 확장자 확인
  if (!filePath.toLowerCase().endsWith('.json')) {
    await saveToFile(folderName, filePath, value);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (Non-JSON Direct Save)`);
    return;
  }

  // 3. 파일 읽기
  const externalData = await readJson(folderName, filePath);
  if (!externalData) {
    console.error(`[FileManager] Failed to read ${filePath}`);
    return;
  }

  // 4. 상대 경로 계산
  let relativePath = jsonPointer === parentPointer
    ? ''
    : jsonPointer.substring(parentPointer.length);

  // 5. Wrapper 체크 (type: 'regex')
  if (externalData.type === 'regex' && Array.isArray(externalData.data)) {
    relativePath = '/data' + relativePath;
  }

  // 6. 값 설정 및 저장
  if (relativePath === '') {
    // 상대 경로가 비어있다면 파일 전체를 교체하는 것임
    // 배열이면 Wrapper로 변환
    let saveValue = value;
    if (Array.isArray(value)) {
      const { ensureCustomScriptWrapper } = await import('./MockCharacterDB.svelte');
      saveValue = ensureCustomScriptWrapper(value);
      console.log(`[FileManager] Converted array to Wrapper format`);
    }
    await writeJson(folderName, filePath, saveValue);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (Root Replacement)`);
  } else {
    setValueByPath(externalData, relativePath, value);
    await writeJson(folderName, filePath, externalData);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (adjusted path: ${relativePath})`);
  }
}

/**
 * 에셋 저장/삭제
 */
export async function saveAsset(folderName: string, assetPath: string, data: ArrayBuffer) {
  // 에셋 저장 로직 (필요 시 구현)
  // 현재는 텍스트/JSON 저장에 집중
}
