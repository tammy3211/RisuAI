import { writable, get } from "svelte/store";
import type { character } from "./storage/database.svelte";
import { isCharacterKey } from "./BotMaker/MockCharacterDB.svelte";
import {
  getValueByPath,
  saveToFile,
  saveCharacterJson,
  saveToSyncJson,
  saveCharacterData
} from "./BotMaker/SaveFolderFileManager";
import { selectedCharID } from "./stores.svelte";
import { DBState } from 'src/ts/stores.svelte';
import { isEqual, cloneDeep } from 'lodash';
import * as Diff from 'diff';

export const currentSaveFolderBot = writable<{
  character: character,
  folderName: string,
  isDirty: boolean,
  sourceMap: Record<string, string>
} | null>(null)

// 파일 워치로 인한 리로드 중인지 추적 (변경 감지 방지용)
let isReloadingFromFileWatch = false;

let savedfile = false;
let isSavingFile = 0;

// 파일 변경 감지 및 자동 리로드
if (typeof window !== 'undefined') {
  let lastMtime: number | null = null;
  let watchInterval: ReturnType<typeof setInterval> | null = null;

  currentSaveFolderBot.subscribe((bot) => {
    if (bot) {
      // Save Folder Bot이 로드되면 파일 워치 시작
      if (!watchInterval) {
        if (isSavingFile === 0) {
          console.log('[Save Folder Sync] Currently saving file, delaying watch start');
          return;
        }

        console.log('[Save Folder Sync] Started file watching for:', bot.folderName);

        watchInterval = setInterval(async () => {
          const current = get(currentSaveFolderBot);
          if (!current) {
            if (watchInterval) {
              clearInterval(watchInterval);
              watchInterval = null;
            }
            return;
          }

          try {
            const res = await fetch(`/api/save/${current.folderName}/mtime`);
            if (!res.ok) return;

            const { mtime } = await res.json();

            if (lastMtime === null) {
              // 첫 로드 시 mtime만 저장
              lastMtime = mtime;
              return;
            }

            if (mtime > lastMtime) {
              console.log('[Save Folder Sync] File change detected, reloading...');
              lastMtime = mtime;

              // 리로드 플래그 설정 (변경 감지 방지)
              isReloadingFromFileWatch = true;

              // 파일이 변경되었으므로 다시 로드
              const { parseBotJson } = await import('./BotMaker/BotJsonParser');
              const { character, sourceMap } = await parseBotJson(current.folderName);

              // 현재 웹 데이터와 파일 데이터 비교
              const { DBState } = await import('./stores.svelte');
              const currentWebData = DBState.db.characters[0];

              // 웹 데이터와 파일 데이터가 같으면 리로드 스킵 (lodash isEqual 사용)
              if (currentWebData && isEqual(currentWebData, character)) {
                console.log('[Save Folder Sync] File data matches web data, skipping reload');
                isReloadingFromFileWatch = false;
                return;
              }

              console.log('[Save Folder Sync] File data differs from web data, applying reload');

              // currentSaveFolderBot 업데이트
              currentSaveFolderBot.set({
                character,
                folderName: current.folderName,
                isDirty: false,
                sourceMap
              });

              // 실제 배열에 직접 할당 (Svelte 반응성 트리거)
              DBState.db.characters[0] = character;

              console.log('[Save Folder Sync] Reloaded successfully');

              // 리로드 플래그 해제 (다음 틱에서)
              setTimeout(() => {
                isReloadingFromFileWatch = false;
              }, 1000);
            }
          } catch (error) {
            console.error('[Save Folder Sync] Error checking file changes:', error);
          }
        }, 1000); // 1초마다 체크
      }
    } else {
      // Save Folder Bot이 언로드되면 파일 워치 중지
      if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
        lastMtime = null;
        console.log('[Save Folder Sync] Stopped file watching');
      }
    }
  });
}

// 변경 사항 추적 (diff 라이브러리 사용)
function findChangedPaths(prev: any, curr: any): string[] {
  const changes: string[] = [];

  // JSON diff를 사용하여 변경사항 추출
  const diff = Diff.diffJson(prev, curr);

  // diff 결과를 순회하며 변경사항 파싱
  diff.forEach((part) => {
    if (part.added || part.removed) {
      try {
        const obj = JSON.parse(part.value);
        extractChanges(obj, '', part.added ? 'added' : 'removed');
      } catch (e) {
        // JSON 파싱 실패 시 원본 값 사용
        const lines = part.value.split('\n').filter(l => l.trim());
        lines.forEach(line => {
          const match = line.match(/"([^"]+)":/);
          if (match) {
            const key = match[1];
            changes.push(`${key}: ${part.added ? 'added' : 'removed'}`);
          }
        });
      }
    }
  });

  // 깊은 비교로 업데이트된 필드 찾기
  function extractChanges(obj: any, prefix: string, type: 'added' | 'removed') {
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        extractChanges(value, path, type);
      } else {
        if (type === 'added') {
          changes.push(`${path}: added`);
        } else {
          changes.push(`${path}: removed`);
        }
      }
    }
  }

  // updated 필드 찾기 (추가도 삭제도 아닌 경우)
  function findUpdated(prevObj: any, currObj: any, prefix: string = '') {
    if (!prevObj || !currObj) return;
    if (typeof prevObj !== 'object' || typeof currObj !== 'object') return;

    for (const key in currObj) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (!(key in prevObj)) continue; // 추가된 것은 이미 처리됨

      if (typeof currObj[key] === 'object' && currObj[key] !== null) {
        if (Array.isArray(currObj[key]) && Array.isArray(prevObj[key])) {
          if (isEqual(prevObj[key], currObj[key]) === false) {
            const prevValue = String(prevObj[key]).substring(0, 100);
            const currValue = String(currObj[key]).substring(0, 100);
            changes.push(`${path}: "${prevValue}" -> "${currValue}"`);
          }
        } else {
          findUpdated(prevObj[key], currObj[key], path);
        }
      } else {
        if (isEqual(prevObj[key], currObj[key]) === false) {
          const prevValue = String(prevObj[key]).substring(0, 100);
          const currValue = String(currObj[key]).substring(0, 100);
          changes.push(`${path}: "${prevValue}" -> "${currValue}"`);
        }
      }
    }
  }

  findUpdated(prev, curr);

  return changes;
}

/**
 * 변경사항을 파일에 저장
 */
async function saveChangesToFiles(
  folderName: string,
  changes: string[],
  currentData: character,
  sourceMap: Record<string, string>
): Promise<void> {
  for (const changeStr of changes) {
    // 변경 문자열 파싱: "path: oldValue -> newValue" 형식
    const colonIndex = changeStr.indexOf(':');
    if (colonIndex === -1) continue;

    const path = changeStr.substring(0, colonIndex).trim();

    // 경로를 JSON 포인터 형식으로 변환 (/name 형식)
    const jsonPointer = '/' + path.replace(/\./g, '/').replace(/\[/g, '/').replace(/\]/g, '');

    // 예외 처리: 에셋 관련 필드는 건너뛰기
    if (jsonPointer.startsWith('/image') ||
      jsonPointer.startsWith('/emotionImages') ||
      jsonPointer.startsWith('/additionalAssets') ||
      jsonPointer.startsWith('/ccAssets')) {
      console.log(`[Save Folder] Skipping asset field: ${jsonPointer}`);
      continue;
    }

    if (jsonPointer.startsWith('/chats')) {
      console.log(`[Save Folder] CHAT CHANGE DETECTED:`);
    }

    // 예외 처리: globalLore, customscript는 로그만 출력
    if (jsonPointer.startsWith('/globalLore') || jsonPointer.startsWith('/customscript')) {
      console.log(`[Save Folder] Change detected in ${jsonPointer} : ${path} : ${getValueByPath(currentData, jsonPointer)} but auto-save is not supported yet`);
      continue;
    }

    // isCharacterKey 체크
    if (isCharacterKey(jsonPointer)) {
      // Character 데이터 - SourceMap을 참조하여 저장 (외부 파일 또는 character.json)
      const newValue = getValueByPath(currentData, jsonPointer);
      await saveCharacterData(folderName, jsonPointer, newValue, sourceMap);
    } else {
      // Non-character 데이터 - sync.json에 저장
      // console.log(`[Save Folder] TEMPORARILY DISABLED sync.json save: ${jsonPointer}`);

      const newValue = getValueByPath(currentData, jsonPointer);

      // sync.json 저장 중 플래그 설정 (파일 변경 감지 방지)
      isReloadingFromFileWatch = true;
      await saveToSyncJson(folderName, path, newValue);
      setTimeout(() => {
        isReloadingFromFileWatch = false;
      }, 1000);

      console.log(`[Save Folder] Saved ${jsonPointer} : ${path} : ${newValue} to sync.json`);
    }
  }
}

// Save 폴더 봇 변경사항 추적 (subscribe 방식)
if (typeof window !== 'undefined') {
  let previousData: character | null = null;
  let checkInterval: ReturnType<typeof setInterval> | null = null;

  currentSaveFolderBot.subscribe((currentBot) => {
    if (currentBot) {
      // 리로드나 초기 로드 시 previousData를 최신 상태로 리셋
      // 이를 통해 리로드 직후 런타임 데이터가 사라진 것을 '삭제됨'으로 오인하는 문제 방지
      if (savedfile === false) {
        previousData = cloneDeep(currentBot.character);
        savedfile = true;
      }

      if (isSavingFile > 0) {
        isSavingFile -= 1;
      } else {
        isSavingFile = 0;
      }

      // Save 폴더 봇이 로드되면 변경 감지 시작
      if (!checkInterval) {
        // 초기 데이터 설정 (위에서 이미 했으므로 생략 가능하지만, 안전을 위해 유지)
        // import('./stores.svelte').then(({ DBState }) => {
        //   const currentData = DBState.db.characters?.[0];
        //   if (currentData) {
        //     previousData = JSON.parse(JSON.stringify(currentData));
        //   }
        // });

        checkInterval = setInterval(() => {
          // 파일 워치로 인한 리로드 중이면 변경 감지 스킵
          if (isReloadingFromFileWatch) {
            return;
          }

          const bot = get(currentSaveFolderBot);
          if (!bot) {
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
            return;
          }

          // DBState는 동적으로 import
          import('./stores.svelte').then(async ({ DBState }) => {
            const currentData = DBState.db.characters?.[0];
            // console.log(`[Save Folder Bot DEBUG] chats array: ${JSON.stringify(DBState.db.characters[0].chats)}`);
            if (!currentData) return;

            // Save Folder Bot은 항상 character 타입이어야 함
            if (currentData.type === 'group') return;

            if (previousData) {
              // chats 배열 비교 디버깅
              const prevChatsLength = previousData.chats?.length ?? 0;
              const currChatsLength = currentData.chats?.length ?? 0;

              // console.log(`  - Previous chats: ${JSON.stringify(previousData.chats[previousData.chatPage])}`);
              // console.log(`  - Current chats: ${JSON.stringify(currentData.chats[currentData.chatPage])}`);

              if (isEqual(previousData, currentData) === false) {
                savedfile = false;

                isSavingFile = 6;

                if (prevChatsLength !== currChatsLength) {
                  console.log('[Save Folder Bot DEBUG] CHATS ARRAY LENGTH CHANGED:');
                  console.log(`  - Previous length: ${prevChatsLength}`);
                  console.log(`  - Current length: ${currChatsLength}`);
                  console.log(`  - Previous chats:`, previousData.chats?.map(c => ({ name: c.name, id: c.id })));
                  console.log(`  - Current chats:`, currentData.chats?.map(c => ({ name: c.name, id: c.id })));
                }
              } else {
                //console.log('[Save Folder Bot] No change');
              }

              const changes = findChangedPaths(previousData, currentData);

              if (changes.length > 0) {
                console.log('[Save Folder Bot] Changes detected:');
                changes.forEach(change => console.log('  -', change));


                // 변경사항을 파일에 저장
                await saveChangesToFiles(bot.folderName, changes, currentData, bot.sourceMap);
              }
            }

            // 현재 상태를 이전 상태로 저장 (깊은 복사)
            previousData = cloneDeep(currentData);
          });
        }, 500); // 0.5초마다 체크
      }

    } else {
      // Save 폴더 봇이 언로드되면 변경 감지 중지
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      previousData = null;
    }
  });
}