import { isTauri } from "../globalApi.svelte"

export interface SaveFolderBot {
  folderName: string
  characterName: string
  iconPath?: string
}

/**
 * 웹: HTTP로 save 폴더의 봇 목록 로드
 */
async function loadBotsFromWeb(): Promise<SaveFolderBot[]> {
  const bots: SaveFolderBot[] = []

  try {
    // API를 통해 폴더 목록 가져오기
    const response = await fetch('/api/save/list');
    if (!response.ok) {
      console.warn('[SaveFolder] Failed to fetch folder list:', response.status);
      return [];
    }
    
    const data = await response.json();
    const folders = data.folders || [];
    console.log('[SaveFolder] Found folders:', folders);

    for (const folderName of folders) {
      try {
        const response = await fetch(`/api/save/${folderName}/character.json`)
        if (response.ok) {
          const charData = await response.json()
          bots.push({
            folderName: folderName,
            characterName: charData.name || folderName
          })
        }
      } catch (e) {
        console.warn(`[SaveFolder] Failed to load ${folderName}:`, e)
      }
    }
  } catch (e) {
    console.error('[SaveFolder] Failed to load bot list:', e);
  }

  bots.sort((a, b) => a.folderName.localeCompare(b.folderName))
  return bots
}

/**
 * Save 폴더에서 봇 목록을 로드합니다
 * - Tauri: 앱 데이터 디렉토리의 save 폴더 사용
 * - Web: HTTP로 /save/* 경로에서 로드
 */
export async function loadSaveFolderBots(): Promise<SaveFolderBot[]> {
  try {
    console.log('[SaveFolderLoader] isTauri:', isTauri)

    if (!isTauri) {
      // 웹 환경: HTTP로 직접 로드
      const bots = await loadBotsFromWeb()
      console.log('[SaveFolderLoader] Loaded bots from web:', bots)
      return bots
    }

    const { readDir, exists, readTextFile } = await import("@tauri-apps/plugin-fs")
    const { BaseDirectory } = await import("@tauri-apps/plugin-fs")
    const { appDataDir, join } = await import("@tauri-apps/api/path")

    const appDir = await appDataDir()
    const savePath = await join(appDir, "save")
    console.log('[SaveFolderLoader] Save path:', savePath)

    const saveExists = await exists(savePath)
    console.log('[SaveFolderLoader] Save folder exists:', saveExists)
    if (!saveExists) return []

    const folders = await readDir(savePath)
    console.log('[SaveFolderLoader] Found folders:', folders)
    const bots: SaveFolderBot[] = []

    for (const folder of folders) {
      if (folder.isDirectory && folder.name) {
        const charJsonPath = await join(savePath, folder.name, "character.json")
        const charExists = await exists(charJsonPath)

        if (charExists) {
          try {
            const content = await readTextFile(charJsonPath)
            const charData = JSON.parse(content)

            bots.push({
              folderName: folder.name,
              characterName: charData.name || folder.name,
              iconPath: charData.image // assets/icon/...
            })
          } catch (e) {
            // JSON 파싱 실패 시 폴더 이름만 사용
            console.warn(`Failed to parse character.json in ${folder.name}:`, e)
            bots.push({
              folderName: folder.name,
              characterName: folder.name
            })
          }
        }
      }
    }

    // 폴더 이름 순으로 정렬
    bots.sort((a, b) => a.folderName.localeCompare(b.folderName))
    console.log('[SaveFolderLoader] Final bots:', bots)
    return bots

  } catch (e) {
    console.error("[SaveFolderLoader] Failed to load save folder bots:", e)
    return []
  }
}

/**
 * Save 폴더의 특정 봇의 아이콘 경로를 반환합니다
 * @param folderName 봇 폴더 이름
 * @returns 아이콘 파일의 전체 경로 또는 null
 */
export async function getSaveBotIconPath(folderName: string): Promise<string | null> {
  try {
    if (!isTauri) return null

    const { exists } = await import("@tauri-apps/plugin-fs")
    const { appDataDir, join } = await import("@tauri-apps/api/path")
    const { convertFileSrc } = await import("@tauri-apps/api/core")

    const appDir = await appDataDir()
    const iconPath = await join(appDir, "save", folderName, "assets", "icon")

    const iconExists = await exists(iconPath)
    if (!iconExists) return null

    // 일반적인 아이콘 파일명 시도
    const extensions = ['png', 'webp', 'jpg', 'jpeg']
    for (const ext of extensions) {
      const fullPath = await join(iconPath, `icon.${ext}`)
      if (await exists(fullPath)) {
        return convertFileSrc(fullPath)
      }
    }

    return null
  } catch (e) {
    console.error(`Failed to get icon for ${folderName}:`, e)
    return null
  }
}
