import { writable, get } from "svelte/store";
import type { character } from "./storage/database.svelte";

export const currentSaveFolderBot = writable<{
  character: character,
  folderName: string,
  isDirty: boolean,
  sourceMap: Record<string, string>
} | null>(null)

// 깊은 비교를 통한 변경 경로 추적
function findChangedPaths(prev: any, curr: any, path: string = ''): string[] {
  const changes: string[] = [];

  // 타입이 다르면 변경
  if (typeof prev !== typeof curr) {
    changes.push(`${path}: type changed from ${typeof prev} to ${typeof curr}`);
    return changes;
  }

  // null 체크
  if (prev === null || curr === null) {
    if (prev !== curr) {
      changes.push(`${path}: ${prev} -> ${curr}`);
    }
    return changes;
  }

  // 배열/객체가 아니면 직접 비교
  if (typeof prev !== 'object') {
    if (prev !== curr) {
      const prevStr = String(prev).substring(0, 100);
      const currStr = String(curr).substring(0, 100);
      changes.push(`${path}: "${prevStr}" -> "${currStr}"`);
    }
    return changes;
  }

  // 배열 비교
  if (Array.isArray(prev) && Array.isArray(curr)) {
    if (prev.length !== curr.length) {
      changes.push(`${path}: array length changed from ${prev.length} to ${curr.length}`);
    }
    const maxLen = Math.max(prev.length, curr.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= prev.length) {
        changes.push(`${path}[${i}]: added`);
      } else if (i >= curr.length) {
        changes.push(`${path}[${i}]: removed`);
      } else {
        const subChanges = findChangedPaths(prev[i], curr[i], `${path}[${i}]`);
        changes.push(...subChanges);
      }
    }
    return changes;
  }

  // 객체 비교
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    if (!(key in prev)) {
      changes.push(`${newPath}: added`);
    } else if (!(key in curr)) {
      changes.push(`${newPath}: removed`);
    } else {
      const subChanges = findChangedPaths(prev[key], curr[key], newPath);
      changes.push(...subChanges);
    }
  }

  return changes;
}

// Save 폴더 봇 변경사항 추적 (subscribe 방식)
if (typeof window !== 'undefined') {
  let previousData: character | null = null;
  let checkInterval: ReturnType<typeof setInterval> | null = null;

  currentSaveFolderBot.subscribe((currentBot) => {
    if (currentBot) {
      // Save 폴더 봇이 로드되면 변경 감지 시작
      if (!checkInterval) {
        checkInterval = setInterval(() => {
          const bot = get(currentSaveFolderBot);
          if (!bot) {
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
            return;
          }

          // DBState는 동적으로 import
          import('./stores.svelte').then(({ DBState }) => {
            const currentData = DBState.db.characters?.[0];
            if (!currentData) return;

            if (previousData) {
              const changes = findChangedPaths(previousData, currentData);

              if (changes.length > 0) {
                console.log('[Save Folder Bot] Changes detected:');
                changes.forEach(change => console.log('  -', change));
                console.log('[Save Folder Bot] Source Map:', bot.sourceMap);
              }
            }

            // 현재 상태를 이전 상태로 저장 (깊은 복사)
            previousData = JSON.parse(JSON.stringify(currentData));
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