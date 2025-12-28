import type { character, loreBook, customscript } from 'src/ts/storage/database.svelte'
import { createBlankChar } from 'src/ts/characters'
import $RefParser from "@apidevtools/json-schema-ref-parser";
import pointer from 'json-pointer';
import type { MockLoreBook, MockCharacterDB, MockCustomScript } from 'src/ts/BotMaker/MockCharacterDB.svelte'
import type { Mock } from 'node:test';

export type SourceMap = Record<string, string>;

export function generateSourceMap(json: any): SourceMap {
    const map: SourceMap = {};
    try {
        const dict = pointer.dict(json);
        for (const key in dict) {
            if (key.endsWith('/$ref')) {
                const path = key.substring(0, key.length - 5);
                map[path] = dict[key];
            }
        }
    } catch (e) {
        console.error("Error generating source map:", e);
    }
    return map;
}

// refParser for Json 
export async function refParser<T = any>(jsonData: any, basePath?: string): Promise<T> {
  try {
    const schema = await $RefParser.dereference(jsonData, {
      resolve: {
        file: false,
        http: {
          read: async (file) => {
            let url = file.url;
            console.log('[refParser] Original URL:', url, 'basePath:', basePath);
            
            // $RefParser가 상대 경로를 절대 경로로 변환한 경우 처리
            // 예: http://localhost:5174/content/desc.md -> /api/save/Luna/file/content/desc.md
            if (url.includes('://')) {
              const urlObj = new URL(url);
              const pathname = urlObj.pathname;
              
              // 이미 API 경로면 그대로 사용
              if (pathname.startsWith('/api/save/')) {
                url = pathname;
              } else {
                // basePath와 결합
                if (basePath && pathname.startsWith('/')) {
                  url = `${basePath}${pathname}`;
                } else if (basePath) {
                  url = `${basePath}/${pathname}`;
                }
              }
            } else {
              // 상대 경로면 basePath와 결합
              if (basePath && !url.startsWith('/')) {
                url = `${basePath}/${url}`;
              }
            }
            
            console.log('[refParser] Final URL:', url);
            const response = await fetch(url);
            
            if (!response.ok) {
              console.error(`[refParser] Failed to fetch ${url}: ${response.status}`);
              throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            console.log('[refParser] Content-Type:', contentType, 'URL:', url);
            
            const text = await response.text();
            
            // JSON 파일은 JSON으로 파싱
            if (contentType?.includes('json') || url.endsWith('.json')) {
              return JSON.parse(text);
            }
            
            // 그 외는 텍스트로 반환
            console.log('[refParser] Returning text, length:', text.length);
            return text;
          }
        }
      }
    });

    return schema as T;
  } catch (err) {
    console.error("Ref Parsing Error:", err);
    throw err;
  }
}

function ChangelorebookJSON(oldLoreBook: MockLoreBook): loreBook[] {
  const newLoreBooks: loreBook[] = oldLoreBook.data;
  return newLoreBooks;
}

function ChangecustomscriptJSON(oldCustomScript: MockCustomScript): customscript[] {
  const newCustomScripts: customscript[] = oldCustomScript.data;
  return newCustomScripts;
}

export async function parseBotJson(folderName: string): Promise<{ character: character, sourceMap: SourceMap }> {
  console.log('[parseBotJson] Starting parse for folder:', folderName);
  let botJson: character = createBlankChar();
  const url = `/api/save/${folderName}/character.json`;
  console.log('[parseBotJson] Fetching URL:', url);
  const response = await fetch(url);
  console.log('[parseBotJson] Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

  if (response.ok) {
    const text = await response.text();
    console.log('[parseBotJson] Response text preview:', text.substring(0, 200));
    
    let rawJson;
    try {
      rawJson = JSON.parse(text);
    } catch (e) {
      console.error('[parseBotJson] Failed to parse JSON, got HTML instead. Text:', text.substring(0, 500));
      throw new Error('Failed to parse character.json - got HTML instead of JSON');
    }
    console.log('[parseBotJson] Raw JSON:', rawJson);
    
    const sourceMap = generateSourceMap(rawJson);
    console.log('[parseBotJson] Source Map:', sourceMap);

    const jsonData: MockCharacterDB = await refParser(rawJson, `/api/save/${folderName}/file`);
    console.log('[parseBotJson] After refParser:', jsonData);

    // globalLore 변환: MockLoreBook이면 변환, 아니면 그대로
    if (jsonData.globalLore && typeof jsonData.globalLore === 'object') {
      console.log('[parseBotJson] globalLore type:', typeof jsonData.globalLore, Array.isArray(jsonData.globalLore) ? 'array' : 'object');
      if (Array.isArray(jsonData.globalLore)) {
        // 이미 배열이면 그대로 사용
        botJson.globalLore = jsonData.globalLore;
      } else if ('type' in jsonData.globalLore && jsonData.globalLore.type === 'risu') {
        // MockLoreBook 형식이면 변환
        console.log('[parseBotJson] Converting MockLoreBook');
        botJson.globalLore = ChangelorebookJSON(jsonData.globalLore as MockLoreBook);
      } else {
        // 예상치 못한 형식이면 빈 배열
        console.log('[parseBotJson] Unexpected globalLore format, using empty array');
        botJson.globalLore = [];
      }
    } else {
      botJson.globalLore = [];
    }

    // customscript 변환: MockCustomScript이면 변환, 아니면 그대로
    if (jsonData.customscript && typeof jsonData.customscript === 'object') {
      console.log('[parseBotJson] customscript type:', typeof jsonData.customscript, Array.isArray(jsonData.customscript) ? 'array' : 'object');
      if (Array.isArray(jsonData.customscript)) {
        // 이미 배열이면 그대로 사용
        botJson.customscript = jsonData.customscript;
      } else if ('type' in jsonData.customscript && jsonData.customscript.type === 'regex') {
        // MockCustomScript 형식이면 변환
        console.log('[parseBotJson] Converting MockCustomScript');
        botJson.customscript = ChangecustomscriptJSON(jsonData.customscript as MockCustomScript);
      } else {
        // 예상치 못한 형식이면 빈 배열
        console.log('[parseBotJson] Unexpected customscript format, using empty array');
        botJson.customscript = [];
      }
    } else {
      botJson.customscript = [];
    }

    // triggerscript 초기화 (없으면 빈 배열)
    if (jsonData.triggerscript && Array.isArray(jsonData.triggerscript)) {
      botJson.triggerscript = jsonData.triggerscript;
    } else {
      botJson.triggerscript = [];
    }

    // 나머지 필드들은 그대로 병합 (globalLore, customscript, triggerscript 제외)
    const { globalLore, customscript, triggerscript, ...rest } = jsonData as any;
    Object.assign(botJson, rest);
    
    console.log('[parseBotJson] Final botJson:', botJson);
    return { character: botJson, sourceMap };  // 병합된 botJson 반환
  } else {
    console.warn(`[BotJsonParser] Failed to load ${folderName}: HTTP ${response.status}`);
    return { character: botJson, sourceMap: {} };
  }
}



