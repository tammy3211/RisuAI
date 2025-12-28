import type { character, loreBook, customscript } from 'src/ts/storage/database.svelte'
import { createBlankChar } from 'src/ts/characters'
import type { MockLoreBook, MockCharacterDB, MockCustomScript } from 'src/ts/BotMaker/MockCharacterDB.svelte'

export type SourceMap = Record<string, string>;

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
        const res = await fetch(resolvedUrl);
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
          // 불러온 자식 데이터에 대해 재귀 탐색 (파일 컨텍스트 변경)
          childData = await recursiveTraverse(childData, nextPointer, resolvedUrl, sourceMap, rootUrl);
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

function ChangelorebookJSON(oldLoreBook: MockLoreBook): loreBook[] {
  return oldLoreBook.data;
}

function ChangecustomscriptJSON(oldCustomScript: MockCustomScript): customscript[] {
  return oldCustomScript.data;
}

export async function parseBotJson(folderName: string): Promise<{ character: character, sourceMap: SourceMap }> {
  let botJson: character = createBlankChar();
  // rootUrl을 /file/ 경로를 포함하도록 수정하여, 이후 모든 상대 경로가 /file/ 아래로 해석되게 함
  const rootUrl = `/api/save/${folderName}/file/`; 
  const entryUrl = `/api/save/${folderName}/character.json`;
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

    // 데이터 변환 및 병합
    
    // Global Lore 처리
    if (jsonData.globalLore) {
      if (Array.isArray(jsonData.globalLore)) {
        botJson.globalLore = jsonData.globalLore;
      } else if (typeof jsonData.globalLore === 'object' && 'type' in jsonData.globalLore && jsonData.globalLore.type === 'risu') {
        botJson.globalLore = ChangelorebookJSON(jsonData.globalLore as MockLoreBook);
      } else {
        botJson.globalLore = [];
      }
    }

    // Custom Script 처리
    if (jsonData.customscript) {
      if (Array.isArray(jsonData.customscript)) {
        botJson.customscript = jsonData.customscript;
      } else if (typeof jsonData.customscript === 'object' && 'type' in jsonData.customscript && jsonData.customscript.type === 'regex') {
        botJson.customscript = ChangecustomscriptJSON(jsonData.customscript as MockCustomScript);
      } else {
        botJson.customscript = [];
      }
    }

    // Trigger Script 처리
    if (jsonData.triggerscript && Array.isArray(jsonData.triggerscript)) {
      botJson.triggerscript = jsonData.triggerscript;
    }

    // 나머지 필드 병합
    const { globalLore, customscript, triggerscript, ...rest } = jsonData as any;
    Object.assign(botJson, rest);

    // Asset Path 변환 함수
    const convertAssetUrl = (path: string) => {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
      return `/api/save/${folderName}/file/${path}`;
    };

    // 1. Main Image
    if (botJson.image) {
      botJson.image = convertAssetUrl(botJson.image);
    }

    // 2. Emotion Images
    if (botJson.emotionImages) {
      botJson.emotionImages = botJson.emotionImages.map(item => {
        if (item[1]) item[1] = convertAssetUrl(item[1]);
        return item;
      });
    }

    // 3. Additional Assets
    if (botJson.additionalAssets) {
      botJson.additionalAssets = botJson.additionalAssets.map(item => {
        if (item[1]) item[1] = convertAssetUrl(item[1]);
        return item;
      });
    }

    // 4. CC Assets
    if (botJson.ccAssets) {
      botJson.ccAssets = botJson.ccAssets.map(item => {
        if (item.uri) item.uri = convertAssetUrl(item.uri);
        return item;
      });
    }
    
    return { character: botJson, sourceMap };

  } catch (error) {
    console.error('[parseBotJson] Error:', error);
    return { character: botJson, sourceMap: {} };
  }
}



