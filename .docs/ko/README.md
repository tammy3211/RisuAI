# [캐릭터 이름]

> 에이전트에게 알려줄 한 줄 소개를 여기에 작성하세요.

## 📖 캐릭터 소개

여기에 캐릭터의 배경, 성격, 세계관 등을 자유롭게 작성하세요.

## 💡 에이전트 가이드

- **추천 모델**: (예: Claude 4.5, Gemini 3 등)
- **기능 설명**: (트리거 스크립트, 커스텀 스크립트 등)

## ✍️ 제작자 노트

캐릭터 제작 의도, 강조할 부분, 그외 필요한 정보 등을 작성하세요.

---

<!-- 이하는 RisuAI 기술 문서입니다 -->

# RisuAI 캐릭터 파일 구조 가이드
...

이 문서는 RisuAI 캐릭터를 제작할 때 필요한 파일 구조와 각 필드에 대한 설명을 제공합니다.

---

## character.json 필드 설명

### 기본 필드

#### `name`
- **설명**: 캐릭터 이름
- **사용**: 필수

#### `firstMessage`
- **설명**: 첫 시작 메시지
- **권장**: `content/firstMessage.md` 파일로 분리하고 `$ref`로 참조

#### `desc`
- **설명**: 메인 프롬프트 (캐릭터의 외모, 성격, 배경, 행동 지침 등)
- **권장**: `content/desc.md` 파일로 분리하고 `$ref`로 참조

#### `personality`
- **설명**: 성격 필드
- **상태**: 이전 v2 버전과 호환을 위한 필드
- **권장**: 사용하지 않고 `desc`로 대체

#### `scenario`
- **설명**: 시나리오 필드
- **상태**: 이전 v2 버전과 호환을 위한 필드
- **권장**: 사용하지 않고 `desc`로 대체

#### `exampleMessage`
- **설명**: 예시 대화 메시지
- **권장**: 사용하지 않음

#### `creatorNotes`
- **설명**: 제작자 코멘트 (캐릭터에 영향 없음)
- **형식**: 
  ```
  # `en`
  영어 코멘트
  # `ko`
  한국어 코멘트
  ```
- **양식**: `\n# \`{lang}\`\n {comment}`

#### `systemPrompt`
- **설명**: 시스템 프롬프트
- **권장**: 사용하지 않고 `desc`에 포함

#### `replaceGlobalNote`
- **설명**: 글로벌 노트를 대신해서 사용
- **상태**: 요즘은 직접 사용보다 로어북으로 대체해서 많이 사용

#### `alternateGreetings`
- **설명**: 또 다른 첫 시작 메시지들
- **타입**: 배열
- **권장**: `content/alternateGreetings/*.md` 파일로 분리

#### `postHistoryInstructions`
- **상태**: 사용하지 않음

#### `tags`
- **상태**: 사용하지 않음

#### `nickname`
- **설명**: 닉네임이 설정되면 채팅에서 캐릭터 이름 대신 `{{char}}`에 사용됨

#### `source`
- **상태**: 사용하지 않음

#### `creation_date`
- **설명**: 생성된 시간의 Unix timestamp

---

### Extensions 필드

#### `bias`
- **설명**: LLM 설정을 위한 바이어스
- **상태**: 최근 모델은 지원하지 않음에 따라 잘 사용되지 않음

#### `viewScreen`
- **설명**: 이미지 표시 방식 설정
- **옵션**:
  - `'emotion'`: 감정 이미지 사용
  - `'none'`: 기본값
  - `'imggen'`: 이미지 생성 기능 사용
  - `'vn'`: 사용 안 함

#### `utilityBot`
- **설명**: RP와 관련된 프롬프트 제거
- **용도**: 캐릭터의 프롬프트만 출력하여 테스트에 용이

#### `sdData`
- **상태**: 사용하지 않음

#### `backgroundHTML`
- **설명**: 배경 HTML
- **용도**: 배경에 HTML을 띄우거나 `<style>` 블록을 통한 전역 CSS 설정에 사용
- **권장**: `content/backgroundHTML.md` 파일로 분리

#### `additionalText`
- **설명**: 캐릭터 설명에 추가될 텍스트
- **상태**: 이전 v2 버전과 호환을 위한 필드
- **권장**: 사용하지 않고 `desc`로 대체

#### `largePortrait`
- **설명**: 아이콘이 세로로 긴 이미지의 경우 사용
- **영향**: 캐릭터에 영향 없음 (UI 표시용)

#### `inlayViewScreen`
- **설명**: 이미지가 별도로 표시되지 않고 채팅 안에 표시되게 하는 설정

#### `newGenData`
- **설명**: 이미지 생성 관련 데이터
- **조건**: `viewScreen`이 `emotion` 혹은 `imggen`일 경우 사용, `none`일 경우 무시

#### `lowLevelAccess`
- **설명**: 트리거 등에 약한 데이터 접근 권한을 줌

#### `defaultVariables`
- **설명**: 기본 변수 정의
- **형식**: `<변수 이름>=<변수 값>` 형식으로 작성하고 개행으로 구분

#### `prebuiltAssetCommand`
- **상태**: 사용 안 함

#### `prebuiltAssetExclude`
- **상태**: 사용 안 함

#### `prebuiltAssetStyle`
- **상태**: 사용 안 함

#### `depth_prompt`
- **상태**: 이전 v2 버전과 호환을 위한 필드, 더 이상 사용하지 않음

#### `group_only_greetings`
- **설명**: 그룹챗용 설정
- **상태**: 사용 안 함

---

### Modules

#### `customscript`
- **설명**: 채팅에 사용될 정규식을 정의
- **참조**: `scripts/customscript.json`

#### `triggerscript`
- **설명**: 채팅에 사용될 트리거를 정의
- **참조**: `scripts/triggerscript.json`

---

### LoreBook

#### `globalLore`
- **설명**: 캐릭터의 로어북
- **참조**: `lorebook.json`

#### `loreSettings`
- **설명**: 로어북 세팅

#### `lorePlus`
- **설명**: 로어북 추가 기능
- **기본값**: `false`
- **상태**: 현재 기능 미구현으로 사용 안 함

#### `loreExt`
- **상태**: 사용 안 함

---

### Assets

#### `image`
- **설명**: 기본 아이콘 경로
- **권장 위치**: `assets/icon/`

#### `emotionImages`
- **설명**: 감정 이미지 경로들
- **권장 위치**: `assets/emotions/`

#### `additionalAssets`
- **설명**: 추가 에셋 경로
- **권장 위치**: `assets/other/`

#### `ccAssets`
- **상태**: 미정의

---

### Extra

#### `extentions`
- **상태**: 사용 안 함

#### `additionalData`
- **설명**: 메타데이터
- **포함 항목**: `"creator"`, `"character_version"`, `"tag": []`
- **상태**: 사용되지 않음

---

## .metadata/sync.json

채팅을 하기 위한 동기화 데이터(chat 데이터, 채팅 UUID 등)를 포함합니다.

**주의**: 캐릭터를 export할 때 반영되지 않는 데이터들입니다.

---

## .metadata/settings.yaml

캐릭터 파싱 시 옵션을 설정합니다.

### `triggerversion`
- **설명**: 트리거 버전 선택
- **옵션**:
  - `v1`: Legacy 트리거
  - `v2`: V2 Header 트리거
  - `lua`: Lua 트리거 (권장)
- **권장값**: `"lua"`

### `useluabundle`
- **타입**: `boolean`
- **설명**: Lua를 한 파일이 아니라 `require`를 이용해 여러 파일로 관리하고 싶을 경우 사용
- **기본값**: `false`

---

## 권장 사항 요약

### 사용 권장 필드
- `name`: 캐릭터 이름
- `desc`: 메인 프롬프트 (`content/desc.md`로 분리)
- `firstMessage`: 첫 메시지 (`content/firstMessage.md`로 분리)
- `alternateGreetings`: 대체 인사말 (`content/alternateGreetings/*.md`로 분리)
- `globalLore`: 로어북 (`lorebook.json` 및 `content/lorebook/*.md`)
- `customscript`: 커스텀 스크립트
- `triggerscript`: 트리거 스크립트
- `viewScreen`: 이미지 표시 방식
- `backgroundHTML`: 배경 HTML/CSS

### 사용하지 않는 것을 권장하는 필드
- `personality`, `scenario`, `additionalText`: `desc`로 대체
- `systemPrompt`: `desc`에 포함
- `exampleMessage`: 효과 미미
- `bias`: 최신 모델 미지원
- 기타 deprecated 필드들

### 파일 분리 권장
긴 텍스트 콘텐츠는 JSON에 직접 작성하지 말고, 별도 `.md` 파일로 분리하고 `$ref`로 참조하세요:
- `desc` → `content/desc.md`
- `firstMessage` → `content/firstMessage.md`
- `alternateGreetings` → `content/alternateGreetings/*.md`
- `globalLore` 내용 → `content/lorebook/*.md`
- `backgroundHTML` → `content/backgroundHTML.md`

---

## $ref 파일 참조 시스템

### 기본 형식
```json
{
  "desc": {"$ref": "content/desc.md"},
  "firstMessage": {"$ref": "content/firstMessage.md"}
}
```

### 경로 방식

**절대 경로**: `/save/{character_name}/` 기준
- 예: `{"$ref": "content/desc.md"}`

**상대 경로**: 현재 JSON 파일 위치 기준
- 예: `{"$ref": "./customscript/accent.md"}`
- `scripts/customscript.json`에서 상위 폴더: `{"$ref": "../content/shared.md"}`

### 주의사항
1. 반드시 객체 형식: `{"$ref": "경로"}` ✅  /  `"$ref:경로"` ❌
2. 슬래시 사용: `/` ✅  /  `\` ❌
3. 파일명 공백은 그대로 사용 가능

## 가이드라인

각 기능에 대한 자세한 사항은 아래 가이드 문서를 참조하세요:
- [로어북 가이드](./.docs/lorebook-guide.md)
- [커스텀 스크립트 가이드](./.docs/customscript-guide.md)
- [트리거 스크립트 가이드](./.docs/triggerscript-guide.md)
- [CBS 문법 가이드](./.docs/curly-braced-syntax(cbs)-guide.md)
- [에셋 사용 가이드](./.docs/assets-guide.md)