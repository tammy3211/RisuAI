import { writable, get } from "svelte/store";
import type { character } from "../storage/database.svelte";
import { getValueByPath } from "./SaveFolderFileManager";
import { overwriteAllToFiles, saveChangesToFiles } from "./SaveCharacterFileManager";
import { selectedCharID } from "../stores.svelte";
import { isEqual, cloneDeep } from 'lodash';
import { compare } from 'fast-json-patch';

export const currentSaveFolderBot = writable<{
  character: character,
  folderName: string,
  isDirty: boolean,
  sourceMap: Record<string, string>
} | null>(null)

// 파일 워치로 인한 리로드 중인지 추적 (변경 감지 방지용)
let isReloadingFromFileWatch = false;

// 웹→폴더 저장 중인지 추적 (변경 감지 방지용)
let isSavingToFolder = false;

let savedfile = false;
let isSavingFile = 0;

let reloadPendingCount = 0; // 리로드 대기 카운터 (2가 되면 리로드)
let charReload: boolean = false;

function jsonEqual(a: any, b: any): boolean {
  // lodash isEqual로 먼저 체크
  if (isEqual(a, b)) {
    return true;
  }

  // null/undefined 체크
  if (a == null || b == null) {
    return a == b;
  }

  // 원시값 비교
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  // 배열 체크
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  // 빈 값 체크 함수 (빈 문자열, null, undefined를 동일하게 간주)
  const isEmptyValue = (val: any) => val === '' || val == null;

  // 모든 키 수집 (양쪽 모두)
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  // 모든 키에 대해 비교
  for (const key of allKeys) {
    const aHasKey = key in a;
    const bHasKey = key in b;
    const aValue = aHasKey ? a[key] : undefined;
    const bValue = bHasKey ? b[key] : undefined;

    // 양쪽 모두 빈 값이면 동일하게 간주
    if (isEmptyValue(aValue) && isEmptyValue(bValue)) {
      continue;
    }

    // 한쪽만 빈 값이면 다름
    if (isEmptyValue(aValue) !== isEmptyValue(bValue)) {
      return false;
    }

    // 재귀 비교
    if (!jsonEqual(aValue, bValue)) {
      return false;
    }
  }

  return true;
}

// 파일 변경 감지 및 자동 리로드
if (typeof window !== 'undefined') {
  let lastMtime: number | null = null;
  let watchInterval: ReturnType<typeof setInterval> | null = null;

  currentSaveFolderBot.subscribe((bot) => {
    if (bot) {
      // Save Folder Bot이 로드되면 파일 워치 시작
      // console.log(`[Save Folder Sync] ${isSavingFile}`);
      if (!watchInterval) {

        // console.log('[Save Folder Sync] Started file watching for:', bot.folderName);

        watchInterval = setInterval(async () => {
          const current = get(currentSaveFolderBot);
          if (!current) {
            if (watchInterval) {
              clearInterval(watchInterval);
              watchInterval = null;
            }
            return;
          }

          if (isSavingFile > 0) {
            if (reloadPendingCount > 0) {
              reloadPendingCount = 0;
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

            // mtime 변경 또는 대기 중인 리로드가 있으면 검증
            const shouldCheck = mtime > lastMtime || reloadPendingCount > 0;

            if (shouldCheck) {
              if (mtime > lastMtime) {
                lastMtime = mtime;
              } else {
                // console.log('[Save Folder Sync] Rechecking for pending reload...');
              }

              // 리로드 플래그 설정 (변경 감지 방지)
              isReloadingFromFileWatch = true;

              // 파일이 변경되었으므로 다시 로드 (formatUpdate 스킵하여 무한 루프 방지)
              const { parseBotJson } = await import('./MockCharParser');
              const { character, sourceMap, error: err } = await parseBotJson(current.folderName, { skipFormatUpdate: true });

              if (err) {
                console.log('[Save Folder Sync] Bot parser error, skipping reload');
                isReloadingFromFileWatch = false;
                reloadPendingCount = 0;
                return;
              }

              // 현재 웹 데이터와 파일 데이터 비교
              const { DBState } = await import('../stores.svelte');
              const currentWebData = DBState.db.characters[0];

              // 파일→웹 리로드 시 무시할 필드 제거 (lastInteraction 등)
              const fileDataForCompare = cloneDeep(character);
              const webDataForCompare = cloneDeep(currentWebData);

              // lastInteraction 제거 (웹→폴더는 저장하지만, 폴더→웹은 무시)
              delete fileDataForCompare.lastInteraction;
              delete webDataForCompare.lastInteraction;

              // bookVersion 재귀 제거 (모든 경로의 bookVersion 무시)
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
              removeBookVersion(fileDataForCompare);
              removeBookVersion(webDataForCompare);

              // 웹 데이터와 파일 데이터가 같으면 카운터 초기화
              if (currentWebData && jsonEqual(webDataForCompare, fileDataForCompare)) {
                if (reloadPendingCount > 0) {
                  // console.log('[Save Folder Sync] File data matches web data on 2nd check, resetting counter');
                  reloadPendingCount = 0;
                } else {
                  // console.log('[Save Folder Sync] File data matches web data, skipping reload');
                }
                isReloadingFromFileWatch = false;
                return;
              }

              // 데이터가 다르면 카운터 증가
              reloadPendingCount++;

              // 카운터가 2 미만이면 리로드 대기
              if (reloadPendingCount < 2) {
                // console.log('[Save Folder Sync] Waiting for 2nd confirmation before reload...');
                isReloadingFromFileWatch = false;
                return;
              }

              // 카운터가 2 이상이면 리로드 실행
              // console.log('[Save Folder Sync] File data differs from web data, analyzing differences...');
              reloadPendingCount = 0; // 카운터 초기화
              charReload = true;

              // 차이점 분석
              const differences = compare(webDataForCompare, fileDataForCompare);
              if (differences.length > 0) {
                // console.log(`[Save Folder Sync] Found ${differences.length} difference(s):`);
                differences.forEach((diff, idx) => {
                  // console.log(`  [${idx + 1}] Path: ${diff.path}, Op: ${diff.op}`);
                  if (diff.op === 'replace') {
                    // console.log(`      New:`, diff.value);
                    try {
                      const webValue = getValueByPath(currentWebData, diff.path);
                      // console.log(`      Web:`, webValue);
                    } catch (e) {
                      console.error(`      Web: (error getting value)`);
                    }
                  } else if (diff.op === 'add') {
                    // console.log(`      Value:`, diff.value);
                  }
                });
              }

              console.log('[Save Folder Sync] Applying reload');

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
            // 에러 발생 시에도 카운터 리셋
            reloadPendingCount = 0;
            isReloadingFromFileWatch = false;
          }

        }, 1000); // 1초마다 체크
      }
    } else {
      // Save Folder Bot이 언로드되면 파일 워치 중지
      if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
        lastMtime = null;
        // console.log('[Save Folder Sync] Stopped file watching');
      }
    }
  });
}

// 변경 사항 추적 (fast-json-patch 사용)
function findChangedPaths(prev: any, curr: any): string[] {
  const patches = compare(prev, curr);
  return patches
    .filter(patch => {
      // bookVersion 변경 무시 (모든 경로의 bookVersion)
      if (/\/bookVersion$/.test(patch.path)) return false;
      return true;
    })
    .map(patch => {
      // patch.path는 "/globalLore/0/content" 형태
      return `${patch.path}: ${patch.op}`;
    });
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

          // 웹→폴더 저장 중이면 변경 감지 스킵
          if (isSavingToFolder) {
            // console.log('[Save Folder Bot] Saving to folder in progress, skipping change detection');
            return;
          }

          if (isSavingFile > 0) {
            isSavingFile -= 1;
          } else {
            isSavingFile = 0;
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
          import('../stores.svelte').then(async ({ DBState }) => {
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

              if (jsonEqual(previousData, currentData) === false) {
                savedfile = false;

                isSavingFile = 6;

                /* chat diff debug
                if (prevChatsLength !== currChatsLength) {
                  console.log('[Save Folder Bot DEBUG] CHATS ARRAY LENGTH CHANGED:');
                  console.log(`  - Previous length: ${prevChatsLength}`);
                  console.log(`  - Current length: ${currChatsLength}`);
                  console.log(`  - Previous chats:`, previousData.chats?.map(c => ({ name: c.name, id: c.id })));
                  console.log(`  - Current chats:`, currentData.chats?.map(c => ({ name: c.name, id: c.id })));
                }
                */
              } else {
                //console.log('[Save Folder Bot] No change');
              }

              const changes = findChangedPaths(previousData, currentData);

              if (changes.length > 0) {
                // console.log('[Save Folder Bot] Changes detected:', changes.length, 'change(s)');
                changes.forEach(change => console.log('  -', change));

                if (currentData.globalLore && Array.isArray(currentData.globalLore)) {
                  // globalLore changes - will be handled
                } else if (currentData.globalLore && typeof currentData.globalLore === 'object') {
                  console.warn('[Save Folder Bot] globalLore is object (not array) - unexpected');
                  if ('__source' in currentData.globalLore) {
                    // console.log('[Save Folder Bot]   globalLore.__source:', currentData.globalLore.__source);
                  }
                }

                // 저장 시작 플래그 설정
                isSavingToFolder = true;

                try {
                  // 변경사항을 파일에 저장
                  await saveChangesToFiles(bot.folderName, changes, currentData, bot.sourceMap);
                } finally {
                  // 저장 완료 플래그 해제
                  isSavingToFolder = false;
                  // console.log('[Save Folder Bot] Save completed, resuming change detection');
                }
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