import type { customscript, loreBook, loreSettings, triggerscript } from "src/ts/storage/database.svelte"

export interface MockLoreBook {
  type: 'risu',
  ver: number,
  data: loreBook[]
}

export interface MockCustomScript {
  type: 'regex',
  data: customscript[]
}

export interface MockCharacterDB {
  name: string
  firstMessage: string
  desc: string
  personality: string
  scenario: string
  exampleMessage?: string
  creatorNotes: string
  systemPrompt: string
  replaceGlobalNote: string
  alternateGreetings: string[]
  tags: string[]
  nickname?: string
  source?: string[]
  creation_date: number,
  creator: string
  characterVersion: string

  // extenstions
  bias: [string, number][]
  viewScreen: 'emotion' | 'none' | 'imggen' | 'vn',
  utilityBot: boolean
  sdData: [string, string][]
  backgroundHTML?: string
  additionalText: string
  largePortrait?: boolean
  inlayViewScreen?: boolean
  newGenData?: {
    prompt: string,
    negative: string,
    instructions: string,
    emotionInstructions: string,
  }
  lowLevelAccess?: boolean
  defaultVariables?: string
  prebuiltAssetCommand?: boolean
  prebuiltAssetExclude?: string[]
  prebuiltAssetStyle?: string
  depth_prompt?: { depth: number, prompt: string }
  group_only_greetings?: string[]

  // Modules
  customscript: customscript[] | MockCustomScript
  triggerscript: triggerscript[]

  // LoreBook
  globalLore: loreBook[] | MockLoreBook
  loreSettings?: loreSettings
  lorePlus?: boolean
  loreExt?: any

  // Assets
  image?: string
  emotionImages: [string, string][]
  additionalAssets?: [string, string, string][]
  ccAssets?: Array<{
    type: string
    uri: string
    name: string
    ext: string
  }>

  // Extra
  extentions?: { [key: string]: any }
}