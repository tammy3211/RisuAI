import pointer from 'json-pointer';
import { v4 } from 'uuid';
import { hasher } from '../parser.svelte';
import { ensureCustomScriptWrapper, ensureLoreBookWrapper, RUNTIME_ONLY_KEYS } from './MockCharacterDB.svelte';

/**
 * writeBinary file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @param data
 * @returns boolean
 */
export async function writeBinary(folderName: string, filePath: string, data: Uint8Array | ArrayBuffer): Promise<boolean> {
  const url = `/api/save/${folderName}/file/${filePath}`;

  try {
    // use Uint8Array
    const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data);
    const blob = new Blob([uint8Array as BlobPart], { type: 'application/octet-stream' });
    
    const res = await fetch(url, {
      method: 'POST',
      body: blob
    });

    if (!res.ok) {
      console.error(`[FileManager] Failed to write binary ${filePath}: ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[FileManager] Error writing binary ${filePath}:`, error);
    return false;
  }
}

/**
 * readBinary file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @returns data as Uint8Array
 */
export async function readBinary(folderName: string, filePath: string): Promise<Uint8Array | null> {
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  const url = `/api/save/${folderName}/file/${filePath}?t=${timestamp}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`[FileManager] Error reading binary ${filePath}:`, error);
    return null;
  }
}

/**
 * Read text file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @returns content as string
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
 * Write text file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @param content string content
 * @returns boolean
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
 * Read JSON file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @returns parsed JSON object or null
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

/** * Remove runtime-only keys from an object
 */
function removeSourceKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => removeSourceKeys(v));
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => !RUNTIME_ONLY_KEYS.includes(key as any))
        .map(([key, value]) => [key, removeSourceKeys(value)])
    );
  }
  return obj;
}

/**
 * Write JSON file
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @param data object to write
 * @returns boolean
 */
async function writeJson(folderName: string, filePath: string, data: any): Promise<boolean> {
  const noSource = removeSourceKeys(data);
  const cleanData = removeNulls(noSource);
  const content = JSON.stringify(cleanData, null, 2);
  return await writeFile(folderName, filePath, content);
}

/**
 * Get value from object by JSON pointer path (e.g., /name, /desc)
 * @param obj source object
 * @param path JSON pointer path
 * @returns value or undefined
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
 * Set value in object by JSON pointer path
 * @param obj source object
 * @param path JSON pointer path
 * @param value value to set
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  pointer.set(obj, path, value);
}

/**
 * Save data to appropriate file based on SourceMap
 * @param folderName name of char folder
 * @param jsonPointer JSON pointer path
 * @param value value to save
 * @param sourceMap source map object
 */
export async function saveCharacterData(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
): Promise<void> {
  // 1. Check path in sourceMap
  if (sourceMap[jsonPointer]) {
    const filePath = sourceMap[jsonPointer];
    await saveToFile(folderName, filePath, value);
    console.log(`[FileManager] Saved ${jsonPointer} to external file: ${filePath}`);
    return;
  }

  // 2. Check if any parent path exists in SourceMap (for internal JSON file modification)
  let parentPointer = jsonPointer;
  while (parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));

    if (sourceMap[parentPointer]) {
      const filePath = sourceMap[parentPointer];

      // Internal modification allowed only for JSON files
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
 * Save to individual file (JSON, MD, others)
 * @param folderName name of char folder
 * @param filePath sub directory path
 * @param value value to save
 */
export async function saveToFile(folderName: string, filePath: string, value: any): Promise<void> {
  if (filePath.endsWith('.json')) {
    await writeJson(folderName, filePath, value);
  } else {
    // Markdown/txt/other : convert to string
    await writeFile(folderName, filePath, String(value));
  }
}

/**
 * Save specific field in character.json (preserving $ref)
 * @param folderName name of char folder
 * @param fieldPath JSON pointer path
 * @param value value to set
 */
export async function saveCharacterJson(folderName: string, fieldPath: string, value: any): Promise<void> {
  // Load original character.json
  const originalJson = await readJson(folderName, 'character.json');
  if (!originalJson) {
    console.error(`[FileManager] Failed to load character.json`);
    return;
  }
  
  setValueByPath(originalJson, fieldPath, value);
  await writeJson(folderName, 'character.json', originalJson);
}

/**
 * Update $ref in container file based on object's __source array and refresh sourceMap
 * @param folderName name of char folder
 * @param itemData object with __source property (e.g., lorebook item)
 * @param itemPointer full pointer of the item (e.g., /globalLore/2)
 * @param sourceMap source map (passed by reference and updated)
 */
export async function saveRefToContainer(
  folderName: string,
  itemData: any,
  itemPointer: string,
  sourceMap: Record<string, string>
): Promise<void> {
  // return if __source array is missing or empty
  if (!itemData || !Array.isArray(itemData.__source) || itemData.__source.length === 0) {
    return;
  }

  // 1. Find container file (traverse upwards)
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

  // 2. load container file
  const containerData = await readJson(folderName, containerFile);
  if (!containerData) {
    console.error(`[saveRefToContainer] Failed to load container: ${containerFile}`);
    return;
  }

  // 3. Calculate base relative path
  let baseRelativePath = itemPointer;
  if (parentPointer.length > 0) {
    baseRelativePath = itemPointer.substring(parentPointer.length);
  }

  // 4. Wrapper type detection
  let wrapperPrefix = '';
  if (containerData.type === 'risu' && Array.isArray(containerData.data)) {
    wrapperPrefix = '/data';
  } else if (containerData.type === 'regex' && Array.isArray(containerData.data)) {
    wrapperPrefix = '/data';
  }

  // 5. Set $ref for each entry in __source array
  for (const sourceEntry of itemData.__source) {
    const { key, path } = sourceEntry;
    
    // Calculate full JSON pointer
    const fullPointer = `${itemPointer}/${key}`;
    
    // Calculate relative path within container
    const relativePath = wrapperPrefix + baseRelativePath + `/${key}`;
    
    setValueByPath(containerData, relativePath, { $ref: path });
    sourceMap[fullPointer] = path;
  }

  await writeJson(folderName, containerFile, containerData);
  console.log(`[saveRefToContainer] Updated ${itemData.__source.length} ref(s) in ${containerFile} for ${itemPointer}`);
}

/**
 * Save value to sync.json
 * @param folderName name of char folder
 * @param path dot-separated path (e.g., "chats[0].messages[1].text")
 * @param value value to set
 */
export async function saveToSyncJson(folderName: string, path: string, value: any): Promise<void> {
  console.log(`[saveToSyncJson] path: ${path}, value:`, value);

  // Load existing sync.json (or empty object if not found)
  let syncData = await readJson(folderName, '.metadata/sync.json') || {};

  let mappedPath = path;

  console.log(`[saveToSyncJson] mappedPath: ${mappedPath}`);

  // convert dot/bracket notation to array of keys
  const pathSegments: (string | number)[] = [];
  const parts = mappedPath.split('.');

  for (const part of parts) {
    // Handle array indices: "chats[0]" -> ["chats", 0]
    const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
    if (arrayMatch) {
      pathSegments.push(arrayMatch[1]); // key name
      pathSegments.push(parseInt(arrayMatch[2], 10)); // array index
    } else {
      pathSegments.push(part);
    }
  }

  console.log(`[saveToSyncJson] pathSegments:`, pathSegments);

  // Traverse the path and set the value
  let current: any = syncData;

  for (let i = 0; i < pathSegments.length - 1; i++) {
    const key = pathSegments[i];
    const nextKey = pathSegments[i + 1];

    console.log(`[saveToSyncJson] key: ${key}, nextKey: ${nextKey}, current[key]:`, current[key]);

    // Create array if next key is a number, otherwise create object
    if (!(key in current)) {
      current[key] = typeof nextKey === 'number' ? [] : {};
    }
    current = current[key];
  }

  const lastKey = pathSegments[pathSegments.length - 1];
  console.log(`[saveToSyncJson] Setting ${lastKey} to`, value, 'in', current);

  // Do not save undefined values (they are removed from JSON)
  if (value === undefined) {
    console.log(`[saveToSyncJson] Skipping undefined value for ${lastKey}`);
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }

  await writeJson(folderName, '.metadata/sync.json', syncData);

  console.log(`[saveToSyncJson] Saved to sync.json`);
}

/**
 * Recursively remove null and undefined values from objects or arrays
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
 * Load sync.json
 */
export async function loadSyncJson(folderName: string): Promise<any | null> {
  return await readJson(folderName, '.metadata/sync.json');
}

/**
 * Load settings.yaml
 */
export async function loadSettingsYaml(folderName: string): Promise<string | null> {
  return await readFile(folderName, '.metadata/settings.yaml');
}

/**
 * Wrapper configuration definition
 */
interface WrapperConfigDef {
  jsonPointerPrefix: string;
  wrapperType: 'risu' | 'regex';
  ensureWrapper: (value: any) => any;
}

/**
 * Wrapper configurations for lorebook and customscript
 */
const WRAPPER_CONFIGS: Record<string, WrapperConfigDef> = {
  lorebook: {
    jsonPointerPrefix: '/globalLore',
    wrapperType: 'risu',
    ensureWrapper: ensureLoreBookWrapper
  },
  customscript: {
    jsonPointerPrefix: '/customscript',
    wrapperType: 'regex',
    ensureWrapper: ensureCustomScriptWrapper
  }
} as const;

/**
 * Write data with wrapper handling use in lorebook, customscript
 * @param folderName name of char folder
 * @param jsonPointer JSON pointer path
 * @param value value to save
 * @param sourceMap source map object
 * @param config wrapper configuration
 */
async function writeDataWithWrapper(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>,
  config: WrapperConfigDef
): Promise<void> {
  const { jsonPointerPrefix, wrapperType, ensureWrapper } = config;

  // 1. find file through SourceMap or parent path
  let parentPointer = jsonPointer;
  let filePath = sourceMap[parentPointer];

  while (!filePath && parentPointer.lastIndexOf('/') > 0) {
    parentPointer = parentPointer.substring(0, parentPointer.lastIndexOf('/'));
    if (sourceMap[parentPointer]) {
      filePath = sourceMap[parentPointer];
      break;
    }
  }

  // save to character.json if no file found
  if (!filePath) {
    if (jsonPointer.startsWith(jsonPointerPrefix)) {
      await saveCharacterJson(folderName, jsonPointer, value);
      console.log(`[FileManager] Saved ${jsonPointer} to character.json (No external file found)`);
    } else {
      console.warn(`[FileManager] No file found for ${jsonPointer}`);
    }
    return;
  }

  // 2. check file extension is json
  if (!filePath.toLowerCase().endsWith('.json')) {
    await saveToFile(folderName, filePath, value);
    console.log(`[FileManager] Saved ${jsonPointer} to ${filePath} (Non-JSON Direct Save)`);
    return;
  }

  // 3. read file
  const externalData = await readJson(folderName, filePath);
  if (!externalData) {
    console.error(`[FileManager] Failed to read ${filePath}`);
    return;
  }

  // 4. calculate relative path
  let relativePath = jsonPointer === parentPointer
    ? ''
    : jsonPointer.substring(parentPointer.length);

  // 5. Wrapper type handling
  if (externalData.type === wrapperType && Array.isArray(externalData.data)) {
    relativePath = '/data' + relativePath; // add /data prefix for wrapper
  }

  // 6. Save value
  if (relativePath === '') {
    let saveValue = value;
    if (Array.isArray(value)) {
      saveValue = ensureWrapper(value);
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
 * Write lorebook
 * @param folderName name of char folder
 * @param jsonPointer JSON pointer path
 * @param value value to save
 * @param sourceMap source map object
 */
export async function writeLorebook(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
) {
  return writeDataWithWrapper(folderName, jsonPointer, value, sourceMap, WRAPPER_CONFIGS.lorebook);
}

/**
 * Write customscripts
 * @param folderName name of char folder
 * @param jsonPointer JSON pointer path
 * @param value value to save
 * @param sourceMap source map object
 */
export async function writeCustomScripts(
  folderName: string,
  jsonPointer: string,
  value: any,
  sourceMap: Record<string, string>
) {
  return writeDataWithWrapper(folderName, jsonPointer, value, sourceMap, WRAPPER_CONFIGS.customscript);
}

/**
 * save asset to folder
 * @param folderName name of char folder
 * @param assetType asset type (icon, emotions, other)
 * @param data binary data
 * @param fileName file name
 * @returns relative path of saved file
 */
export async function saveAssetToFolder(
  folderName: string,
  assetType: 'icon' | 'emotions' | 'other',
  data: Uint8Array | ArrayBuffer,
  fileName: string = '',
  extension?: string
): Promise<string> {
  // 1. generate ID (hash or custom)
  let id = fileName;
  if (!id) {
    try {
      const dataArray = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
      id = await hasher(dataArray);
      if (extension) {
        id += `.${extension}`;
      }
    } catch (error) {
      id = v4();
      if (extension) {
        id += `.${extension}`;
      }
    }
  }

  const path = `assets/${assetType}/${id}`;
  const success = await writeBinary(folderName, path, data);
  
  if (!success) {
    throw new Error(`Failed to save asset to ${path}`);
  }
  console.log(`[FileManager] Saved asset to ${path}`);

  return path;
}

/**
 * load asset from folder
 * @param folderName name of char folder
 * @param assetPath asset path
 * @returns binary data or null
 */
export async function loadAssetFromFolder(
  folderName: string,
  assetPath: string
): Promise<Uint8Array | null> {
  return await readBinary(folderName, assetPath);
}
