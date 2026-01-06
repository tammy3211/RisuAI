import type { customscript, loreBook, loreSettings, triggerscript } from "src/ts/storage/database.svelte"
import { v4 as uuid } from 'uuid';
import { defaults, defaultsDeep } from 'lodash';

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
  postHistoryInstructions: string
  alternateGreetings: string[]
  tags: string[]
  nickname?: string
  source?: string[]
  creation_date: number,

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
  additionalData: {
    tag?: string[]
    creator: string
    character_version: string
  }
}

/**
 * Remove runtime-only keys from character object
 */
export const RUNTIME_ONLY_KEYS = [
  '__source',
  '__sourcePath'
] as const;

/**
 * allowed character keys
 */
const CHARACTER_KEYS = [
  'name',
  'firstMessage',
  'desc',
  'personality',
  'scenario',
  'exampleMessage',
  'creatorNotes',
  'systemPrompt',
  'replaceGlobalNote',
  'alternateGreetings',
  'postHistoryInstructions',
  'tags',
  'nickname',
  'source',
  'creation_date',

  // extenstions
  'bias',
  'viewScreen',
  'utilityBot',
  'sdData',
  'backgroundHTML',
  'additionalText',
  'largePortrait',
  'inlayViewScreen',
  'newGenData',
  'lowLevelAccess',
  'defaultVariables',
  'prebuiltAssetCommand',
  'prebuiltAssetExclude',
  'prebuiltAssetStyle',
  'depth_prompt',
  'group_only_greetings',

  // Modules
  'customscript',
  'triggerscript',

  // LoreBook
  'globalLore',
  'loreSettings',
  'lorePlus',
  'loreExt',

  // Assets
  'image',
  'emotionImages',
  'additionalAssets',
  'ccAssets',

  // Extra
  'extentions',
  'additionalData'
]

export function createMockCharacter(): MockCharacterDB {
  return {
    name: "",
    firstMessage: "",
    desc: "",
    personality: "",
    scenario: "",

    creatorNotes: "",
    systemPrompt: "",
    replaceGlobalNote: "",
    postHistoryInstructions: "",
    alternateGreetings: [],
    tags: [],

    creation_date: 0,

    // extenstions
    bias: [],
    viewScreen: 'none',
    utilityBot: false,
    sdData: [],

    lowLevelAccess: false,
    additionalText: "",

    // Modules
    customscript: [],
    triggerscript: [],

    // LoreBook
    globalLore: [],
    emotionImages: [],
    additionalData: {
      creator: "",
      character_version: "",
      tag: []
    }
  }
}

export function CreatesyncJson(): any {
  return DEFAULT_SYNC_DATA();
}

// sync.json의 기본값
export const DEFAULT_SYNC_FIELDS = {
  type: 'character',
  tags: [],
  notes: '',
  replaceGlobalNote: '',
  firstMsgIndex: -1,
  creator: '',
  characterVersion: ''
};

/**
 * 객체에 sync 필드가 없으면 기본값으로 보완
 * @param target - 보완할 대상 객체
 * @returns 필드가 추가/수정되었는지 여부
 */
function ensureSyncFields(target: any): boolean {
  let modified = false;

  // chaId 검사 및 생성 (sync.json 전용)
  if (target.chaId !== undefined && (!target.chaId || target.chaId === "")) {
    target.chaId = uuid();
    modified = true;
  }

  // 필수 필드 보완
  for (const [key, defaultValue] of Object.entries(DEFAULT_SYNC_FIELDS)) {
    if (target[key] === undefined) {
      target[key] = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue;
      modified = true;
    }
  }

  return modified;
}

/**
 * chatData 필드 보완
 */
function ensureChatData(target: any): boolean {
  if (!target.chats || !target.chatFolders || target.chatPage === undefined) {
    target.chats = structuredClone(DEFAULT_CHAT_DATA.chats);
    target.chatFolders = structuredClone(DEFAULT_CHAT_DATA.chatFolders);
    target.chatPage = structuredClone(DEFAULT_CHAT_DATA.chatPage);
    return true;
  }
  return false;
}

/**
 * sync.json 데이터를 character 객체에 병합
 */
export function mergeSyncToCharacter(botJson: any, parsedJson: any): void {
  if (!parsedJson) {
    // sync.json 로드 실패 시 기본값 설정
    ensureSyncFields(botJson);
    ensureChatData(botJson);
    return;
  }

  // lodash defaults를 사용해서 기본값 병합 (parsedJson 우선, 없으면 DEFAULT_SYNC_FIELDS 사용)
  defaults(botJson, parsedJson, DEFAULT_SYNC_FIELDS);

  // chaId는 특별 처리 (botJson에 있으면 유지)
  if (!parsedJson.chaId || parsedJson.chaId === "") {
    parsedJson.chaId = uuid();
  }
  botJson.chaId = parsedJson.chaId;
  // Chat 데이터 병합
  if (parsedJson.chats) {
    const chats = (parsedJson.chats || [structuredClone(DEFAULT_CHAT)]).map((chat: any) =>
      defaults(
        { id: chat.id || uuid() }, // id가 없으면 uuid 생성
        chat,
        DEFAULT_CHAT
      )
    );

    Object.assign(botJson, {
      chats,
      chatFolders: parsedJson.chatFolders || [],
      chatPage: parsedJson.chatPage ?? 0
    });
  } else {
    Object.assign(botJson, structuredClone(DEFAULT_CHAT_DATA));
  }
}

/**
 * sync.json 파싱 및 필수 필드 보완
 * @param syncJsonData - 파싱된 sync.json 객체 (또는 문자열)
 * @returns {parsedJson, modified} - 파싱된 JSON과 수정 여부
 */
export function validateAndCompleteSyncJson(syncJsonData: any): { parsedJson: any, modified: boolean } {
  try {
    // 이미 객체인 경우 그대로 사용, 문자열인 경우 파싱
    const parsedJson = typeof syncJsonData === 'string'
      ? JSON.parse(syncJsonData)
      : syncJsonData;

    // 공통 필드 보완 함수 사용
    const fieldsModified = ensureSyncFields(parsedJson);
    const chatModified = ensureChatData(parsedJson);

    return { parsedJson, modified: fieldsModified || chatModified };
  } catch (e) {
    console.error("Failed to parse sync.json", e);
    throw e;
  }
}

/**
 * settings.yaml 생성 (triggerversion 설정)
 */
export function createSettingsYaml(detectedVersion: string): string {
  return `# Trigger Settings\n# v1: Legacy triggers\n# v2: V2 Header triggers\n# lua: Lua triggers\ntriggerversion: "${detectedVersion}"\n\n# Use lua bundle\nuseluabundle: false\n`;
}

export function isCharacterKey(Path: string): boolean {
  const rootKey = Path.split('/')[1];
  return CHARACTER_KEYS.includes(rootKey);
}

// Trigger Header Templates
export const V2_TRIGGER_HEADER: triggerscript = {
  "comment": "",
  "type": "manual",
  "conditions": [],
  "effect": [
    {
      "type": "v2Header",
      "code": "",
      "indent": 0
    }
  ]
};

export const LUA_TRIGGER_HEADER: triggerscript = {
  "comment": "",
  "type": "start",
  "conditions": [],
  "effect": [
    {
      "type": "triggerlua",
      "code": ""
    }
  ]
};

// Default Chat Objects
export const DEFAULT_CHAT = {
  message: [],
  note: '',
  name: 'Chat 1',
  localLore: [],
  id: '',
  fmIndex: -1
};

export const DEFAULT_CHAT_DATA = {
  chats: [DEFAULT_CHAT],
  chatFolders: [],
  chatPage: 0
};

export function DEFAULT_SYNC_DATA() {
  return {
    chaId: uuid(),
    type: 'character',
    tags: [],
    notes: '',
    replaceGlobalNote: '',
    firstMsgIndex: -1,
    creator: '',
    characterVersion: '',
    chats: [{
      message: [],
      note: '',
      name: 'Chat 1',
      localLore: [],
      id: uuid(),
      fmIndex: -1
    }],
    chatFolders: [],
    chatPage: 0
  };
}

/**
 * 배열을 Wrapper 형태로 변환하는 Proxy 생성
 * 외부에서는 배열로 사용하지만, 내부적으로는 { type, ver/data } 형태로 저장됨
 */
export function createLoreBookWrapper(array: loreBook[]): MockLoreBook {
  return {
    type: 'risu',
    ver: 1,
    data: array as loreBook[]
  };
}

export function createCustomScriptWrapper(array: customscript[]): MockCustomScript {
  return {
    type: 'regex',
    data: array as customscript[]
  };
}

/**
 * Wrapper 형태를 순수 배열로 추출
 */
export function extractLoreBookArray(wrapper: loreBook[] | MockLoreBook): loreBook[] {
  if (Array.isArray(wrapper)) {
    return wrapper;
  }
  if (wrapper && typeof wrapper === 'object' && 'type' in wrapper && wrapper.type === 'risu') {
    return wrapper.data || [];
  }
  return [];
}

export function extractCustomScriptArray(wrapper: customscript[] | MockCustomScript): customscript[] {
  if (Array.isArray(wrapper)) {
    return wrapper;
  }
  if (wrapper && typeof wrapper === 'object' && 'type' in wrapper && wrapper.type === 'regex') {
    return wrapper.data || [];
  }
  return [];
}

/**
 * 순수 배열을 Wrapper로 변환
 * 이미 Wrapper면 그대로 반환
 */
export function ensureLoreBookWrapper(value: loreBook[] | MockLoreBook | undefined): MockLoreBook {
  if (!value) {
    return createLoreBookWrapper([]);
  }
  if (Array.isArray(value)) {
    return createLoreBookWrapper(value);
  }
  if (value.type === 'risu') {
    return value;
  }
  return createLoreBookWrapper([]);
}

export function ensureCustomScriptWrapper(value: customscript[] | MockCustomScript | undefined): MockCustomScript {
  if (!value) {
    return createCustomScriptWrapper([]);
  }
  if (Array.isArray(value)) {
    return createCustomScriptWrapper(value);
  }
  if (value.type === 'regex') {
    return value;
  }
  return createCustomScriptWrapper([]);
}

export interface settingsYaml {
  triggerversion: "v1" | "v2" | "lua";
  useluabundle?: boolean;
  excludeModules?: string[];
  __path?: string;
}