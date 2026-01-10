# Risuai 에이전트 가이드

이 문서는 Risuai 프로젝트를 다루는 AI 에이전트를 위한 종합 가이드입니다. 두 가지 주요 역할이 있습니다:
1. **프로젝트 이해**: 코드베이스를 읽어 Risuai의 작동 방식을 설명 (수정하지 않음)
2. **캐릭터 생성**: Risuai의 파일 기반 구조를 따라 캐릭터 생성

---

## Part 1: 프로젝트 개요

### Risuai란?

Risuai (리수아이), 또는 줄여서 Risu는 다음으로 구축된 크로스 플랫폼 AI 채팅 소프트웨어/웹 애플리케이션입니다:
- **프론트엔드**: Svelte 5 + TypeScript
- **데스크톱**: Tauri 2.5 (Rust 백엔드)
- **모바일**: Capacitor 5.7 (Android)
- **빌드 도구**: Vite 7
- **스타일링**: Tailwind CSS 4
- **패키지 매니저**: pnpm

Risuai는 사용자가 단일 통합 인터페이스를 통해 다양한 AI 모델(OpenAI, Claude, Gemini 등)과 채팅할 수 있도록 합니다.

**주요 기능**:
- **다중 API 지원**: OpenAI, Claude, Gemini, DeepInfra, OpenRouter, Ooba 등
- **감정 이미지**: 대화 중 변화하는 캐릭터 표정 표시
- **그룹 채팅**: 하나의 채팅에 여러 캐릭터
- **플러그인**: 기능 확장 및 커스텀 프로바이더 추가
- **정규식 스크립트**: 모델 출력을 수정하여 커스텀 GUI 요소 생성
- **강력한 번역기**: 다국어 롤플레이를 위한 입출력 자동 번역
- **로어북**: 캐릭터 컨텍스트를 위한 세계관 정보/메모리 북 시스템
- **테마**: Classic, WaifuLike, WaifuCut UI 모드
- **고급 메모리**: 장기 대화 컨텍스트를 위한 HypaMemoryV2/V3, SupaMemory
- **추가 에셋**: 채팅에 이미지, 오디오, 비디오 삽입
- **TTS**: 텍스트 음성 변환 출력

## 디렉토리 구조

```
RisuAI/
├── src/                    # 메인 애플리케이션 소스 코드
│   ├── ts/                 # TypeScript 비즈니스 로직
│   ├── lib/                # Svelte UI 컴포넌트
│   ├── lang/               # 국제화 (i18n)
│   ├── etc/                # 문서 및 기타
│   └── test/               # 테스트 파일
├── src-tauri/              # Tauri 데스크톱 백엔드 (Rust)
├── android/                # Capacitor Android 프로젝트
├── server/                 # 자체 호스팅 서버 구현
│   ├── node/               # Node.js 서버 (현재)
│   └── hono/               # Hono 프레임워크 서버 (미래)
├── public/                 # 정적 에셋
├── dist/                   # 빌드 출력
├── resources/              # 애플리케이션 리소스
└── .github/workflows/      # CI/CD 파이프라인
```

### 소스 코드 구조 (`/src`)

#### `/src/ts` - TypeScript 비즈니스 로직

| 디렉토리/파일 | 목적 |
|----------------|---------|
| `storage/` | 데이터 지속성 레이어 (데이터베이스, 저장 파일, 플랫폼 어댑터) |
| `process/` | 핵심 처리 로직 (채팅, 요청, 메모리, 모델) |
| `plugins/` | 플러그인 시스템 (API v3.0, 샌드박싱, 보안) |
| `gui/` | GUI 유틸리티 (색 구성, 하이라이트, 애니메이션) |
| `drive/` | 클라우드 동기화 및 백업 |
| `translator/` | 번역 시스템 |
| `model/` | 모델 정의 및 통합 |
| `sync/` | 다중 사용자 동기화 |
| `creation/` | 캐릭터 생성 도구 |
| `cbs.ts` | 콜백 시스템 |
| `characterCards.ts` | 캐릭터 카드 가져오기/내보내기 |
| `parser.svelte.ts` | 메시지 파싱 |
| `stores.svelte.ts` | 상태 관리를 위한 Svelte 스토어 |
| `globalApi.svelte.ts` | 전역 API 메서드 |
| `bootstrap.ts` | 애플리케이션 초기화 |

#### `/src/ts/process` - 핵심 처리

| 디렉토리/파일 | 목적 |
|----------------|---------|
| `index.svelte.ts` | 메인 채팅 처리 오케스트레이션 |
| `request/` | API 요청 핸들러 (OpenAI, Anthropic, Google) |
| `memory/` | 메모리 시스템 (HypaMemoryV2/V3, SupaMemory, HanuraiMemory) |
| `models/` | AI 모델 통합 (NAI, OpenRouter, Ooba, 로컬 모델) |
| `templates/` | 프롬프트 템플릿 및 포매팅 |
| `mcp/` | Model Context Protocol 지원 |
| `files/` | 파일 처리 (인레이, 멀티센드) |
| `embedding/` | 벡터 임베딩 |
| `lorebook.svelte.ts` | 로어북/세계관 정보 관리 |
| `scriptings.ts` | 스크립팅 시스템 |
| `triggers.ts` | 이벤트 트리거 |
| `stableDiff.ts` | Stable Diffusion 통합 |
| `tts.ts` | 텍스트 음성 변환 |

#### `/src/lib` - Svelte UI 컴포넌트

| 디렉토리 | 목적 |
|-----------|---------|
| `ChatScreens/` | 채팅 인터페이스 컴포넌트 |
| `UI/` | 일반 UI 컴포넌트 (GUI, NewGUI, Realm) |
| `Setting/` | 설정 패널 |
| `SideBars/` | 사이드바 컴포넌트 (Scripts, LoreBook) |
| `Others/` | 기타 컴포넌트 |
| `Mobile/` | 모바일 전용 UI |
| `Playground/` | 테스팅/플레이그라운드 기능 |
| `VisualNovel/` | 비주얼 노벨 모드 |
| `LiteUI/` | 경량 UI 변형 |

### 빌드 및 실행

#### 사전 요구 사항
- Node.js 및 pnpm
- Rust 및 Cargo (Tauri 빌드용)

#### 개발

```bash
# 웹 개발 서버
pnpm dev

# Tauri 데스크톱 개발
pnpm tauri dev
```

**참고**: 캐릭터 생성 목적으로는 `pnpm dev`를 실행하여 웹 개발 서버를 시작하기만 하면 됩니다. Tauri 데스크톱 빌드는 캐릭터 생성/테스트에 필요하지 않습니다.

#### 프로덕션 빌드
```bash
# 웹 빌드
pnpm build

# 호스팅용 웹 빌드
pnpm buildsite

# Tauri 데스크톱 빌드
pnpm tauribuild
pnpm tauri build

# Hono 서버 빌드
pnpm hono:build
```

### 타입 체크

```bash
pnpm check
```

### 개발 규칙

- 프로젝트는 코드 포매팅에 Prettier를 사용합니다
- 커밋 전에 코드가 포맷되었는지 확인하세요

### 상태 관리

프로젝트는 Svelte 5 Runes 시스템을 사용합니다:
- 반응형 상태를 위한 `$state`, `$derived`, `$effect`
- `stores.svelte.ts`의 Svelte 스토어 (writable, readable)

주요 스토어:
- `DBState` - 데이터베이스 상태
- `selectedCharID` - 현재 캐릭터
- `settingsOpen`, `sideBarStore`, `MobileGUI` - UI 상태
- `loadedStore`, `alertStore` - 애플리케이션 상태
- `DynamicGUI` - 반응형 레이아웃 전환

### 파일 명명 규칙

- `.svelte.ts` - runes가 있는 Svelte 5 파일
- `.svelte` - Svelte 컴포넌트 파일
- 파일 이름에 camelCase 사용

### 테스팅

- `src/test/runTest.ts`의 기본 테스트 파일
- 타입 체크를 위해 `pnpm check` 실행
- 포괄적인 테스트 스위트 없음; 타입 안전성을 위해 TypeScript에 의존

## 주요 아키텍처 패턴

### 데이터 레이어

- 여러 스토리지 백엔드가 있는 데이터베이스 추상화:
  - Tauri FS, LocalForage, Mobile, Node, OPFS
- 저장 파일 형식: 암호화 지원이 있는 `.bin` 파일
- 캐릭터 카드: 다양한 형식으로 가져오기/내보내기 (.risum, .risup, .charx)

### 처리 파이프라인

1. `process/index.svelte.ts`의 채팅 처리
2. 프로바이더 추상화를 통한 요청 처리
3. 컨텍스트 관리를 위한 메모리 시스템
4. 세계관 정보를 위한 로어북 통합

### 플러그인 시스템 (API v3.0)

- 보안을 위한 iframe 기반 샌드박싱
- DOM 액세스를 위한 SafeDocument/SafeElement 래퍼
- 플러그인 스토리지 (저장 파일별 및 기기별)
- 커스텀 AI 프로바이더 지원
- 개발을 위한 핫 리로드 지원

포괄적인 플러그인 개발 가이드는 `plugins.md`를 참조하세요.

### UI 아키텍처

- Svelte 5 기반 컴포넌트
- 모바일/데스크톱 변형이 있는 반응형 디자인
- 커스텀 색 구성이 있는 테마 시스템
- 여러 UI 모드: Classic, WaifuLike, WaifuCut
- 뷰포트 기반 동적 GUI 전환
- 전통적인 라우터 없음; App.svelte에서 조건부 렌더링 사용

## 지원되는 AI 프로바이더

- OpenAI (GPT 시리즈)
- Anthropic (Claude)
- Google (Gemini)
- DeepInfra
- OpenRouter
- AI Horde
- Ollama
- Ooba (Text Generation WebUI)
- 플러그인을 통한 커스텀 프로바이더

## 국제화

지원 언어:
- 영어 (en)
- 한국어 (ko)
- 중국어 간체 (cn)
- 중국어 번체 (zh-Hant)
- 베트남어 (vi)
- 독일어 (de)
- 스페인어 (es)

언어 파일은 `/src/lang/`에 있습니다.

## 배포 대상

- **웹**: Vite 정적 사이트
- **데스크톱 (Tauri)**: Windows (NSIS), macOS (DMG, APP), Linux (DEB, RPM, AppImage)
- **모바일 (Capacitor)**: Android APK
- **Docker**: 컨테이너 (포트 6001)
- **자체 호스팅**: Node.js 또는 Hono 서버

## 보안

- iframe 격리를 통한 플러그인 샌드박싱
- DOMPurify를 통한 DOM 새니타이제이션
- 버퍼 암호화/복호화 유틸리티
- 프록시 지원을 통한 CORS 처리
- 네이티브 fetch를 위한 Tauri HTTP 플러그인

## 문서

| 파일 | 설명 |
|------|-------------|
| `README.md` | 메인 프로젝트 문서 |
| `plugins.md` | 플러그인 개발 가이드 |
| `AGENTS.md` | AI 어시스턴트 문서 |
| `src/ts/plugins/migrationGuide.md` | 플러그인 API 마이그레이션 가이드 |
| `server/hono/README.md` | Hono 서버 문서 |
| `server/node/readme.md` | Node 서버 문서 |

## 기여 가이드라인

1. 기존 코딩 스타일 및 규칙을 따르세요
2. Pull request를 제출하기 전에 `pnpm check`를 실행하세요
3. 코드가 잘 테스트되었는지 확인하세요
4. 커밋 전에 Prettier로 코드를 포맷하세요

### 프로젝트 이해에서의 역할

사용자가 RisuAI 작동 방식에 대해 물어볼 때:
- 기능을 이해하기 위해 **코드베이스를 읽으세요**
- 기능이 어떻게 작동하는지 **명확하게 설명하세요**
- 명시적으로 요청받지 않는 한 코드를 **수정하지 마세요**
- 설명할 때 특정 파일 및 줄 번호를 참조하세요
- 실제 구현을 기반으로 정확한 기술 세부 사항을 제공하세요

---

## Part 2: 캐릭터 생성 가이드

### 역할 정의

당신은 **전문 Risuai 캐릭터 디자이너이자 시나리오 작가**입니다.

**임무**: 사용자 아이디어를 Risuai의 구조를 따르는 파일 시스템 기반 캐릭터 데이터로 변환합니다.

**핵심 규칙**: 모든 데이터는 단일 JSON 파일에 저장하는 것이 아니라 아래 디렉토리 구조에 따라 여러 파일로 분할되어야 합니다.

---

### 캐릭터 디렉토리 구조

모든 캐릭터 데이터는 다음 구조로 `/save/{character_name}/`에 저장되어야 합니다:

```
📁 /save/{character_name}/
│
├── character.json              # 메인 메타데이터 (이름, 성별, 저자 등)
│                               # 긴 텍스트는 $ref를 사용하거나 비워둬야 함
│
├── lorebook.json               # 로어북 인덱스 (키워드, 활성화 조건)
│                               # 콘텐츠는 content/lorebook/*.md에 저장
│
├── README.md                   # 캐릭터 소개, 사용 가이드, 제작자 노트
│
├── 📁 .docs/                   # 문서 및 가이드 (선택 사항)
│   ├── assets-guide.md         # 에셋 사용 가이드 (이미지, 오디오 등)
│   ├── lorebook-guide.md       # 로어북 항목 생성 가이드
│   ├── customscript-guide.md   # 커스텀 스크립트 가이드 (정규식)
│   ├── triggerscript-guide.md  # 트리거 스크립트 가이드 (Lua)
│   └── curly-braced-syntax(cbs)-guide.md  # CBS 템플릿 구문 가이드
│
├── 📁 .metadata/
│   ├── settings.yaml           # 캐릭터 설정
│   └── sync.json               # 동기화 데이터
│
├── 📁 content/                 # 핵심 텍스트 콘텐츠
│   ├── desc.md                 # 메인 프롬프트: 외모, 성격, 배경, 행동
│   ├── firstMessage.md         # 오프닝 대화
│   ├── backgroundHTML.md       # (선택) 채팅 배경을 위한 HTML/CSS
│   │
│   ├── 📁 alternateGreetings/
│   │   └── greeting*.md        # 대체 오프닝 대화
│   │
│   └── 📁 lorebook/
│       └── *.md                # 로어북 항목 내용
│
├── 📁 scripts/
│   ├── triggerscript.json      # 트리거 스크립트 설정
│   ├── customscript.json       # 커스텀 스크립트 설정
│   │
│   ├── 📁 triggerscript/
│   │   └── main.lua            # 채팅 이벤트를 위한 로직 스크립트
│   │
│   └── 📁 customscript/
│       └── accent.md           # LLM을 위한 말투/스타일 지침
│
└── 📁 assets/
    ├── 📁 icon/                # 캐릭터 프로필 사진
    ├── 📁 emotions/            # 감정 스프라이트
    └── 📁 other/               # 기타 에셋
```

---

### 파일 작성 가이드라인

#### 1. 분리 원칙

**중요 규칙:**
- ✅ 설명 → `content/desc.md` (character.json에 넣지 않기)
- ✅ 첫 메시지 → `content/firstMessage.md` (character.json에 넣지 않기)
- ✅ 로어북 콘텐츠 → `content/lorebook/*.md` (lorebook.json으로 인덱싱)
- ✅ JSON 파일에서 외부 콘텐츠 참조 시 `$ref` 사용
- 📝 긴 콘텐츠는 별도 파일로 분리하는 것을 권장

#### 2. 콘텐츠 품질 기준

**`content/desc.md` - 메인 프롬프트:**
- LLM을 위한 서술적이고 몰입감 있는 지침 작성
- `[Character("Name")]`, `[Appearance(...)]`와 같은 구조화된 형식 사용
- 구체적인 행동 가이드라인 포함
- 단순 항목 나열이 아닌 상세하고 구체적으로 작성

**`content/firstMessage.md` - 오프닝 대화:**
- 사용자를 끌어들이는 강력한 훅 포함
- 캐릭터 성격과 말투를 명확하게 표현
- 장면과 컨텍스트 설정
- 사용자가 대화를 시작하기 쉽게 만들기

**`lorebook.json` & `content/lorebook/*.md` - 세계관 구축:**
- lorebook.json: 키워드 및 활성화 조건 정의
- content/lorebook/*.md: 실제 로어 콘텐츠 작성
- 항상 쌍으로 생성: 하나의 JSON 항목 + 하나의 .md 파일
- 세계 설정, 아이템, 관계, 위치에 사용

#### 3. 참조 시스템

character.json과 lorebook.json은 `$ref`를 사용하여 외부 파일을 참조합니다:

```json
{
  "desc": {
    "$ref": "content/desc.md"
  },
  "firstMessage": {
    "$ref": "content/firstMessage.md"
  }
}
```

```json
{
  "data": [
    {
      "key": "magic system",
      "content": {
        "$ref": "content/lorebook/magic.md"
      }
    }
  ]
}
```

---

### 캐릭터 생성 워크플로우

사용자가 캐릭터 컨셉(이름, 성격, 배경 등)을 제공하면 다음 단계를 따르세요:

#### Step 0: 준비
**파일**: `README.md` (캐릭터 폴더 내)
- 캐릭터 생성을 시작하기 전에 캐릭터의 `README.md` 확인
- README.md에는 캐릭터 생성 가이드라인 및 사용자 요구 사항 포함
- 진행하기 전에 가이드라인을 숙지하세요

#### Step 1: 기본 메타데이터 생성
**파일**: `character.json`
- 이름, 성별, 저자, 태그 설정
- desc 및 firstMessage에 `$ref` 사용
- SD 데이터, 감정 이미지 등 설정

#### Step 2: 핵심 프롬프트 작성
**파일**: `content/desc.md`
- 상세한 외모 설명
- 성격 특성 및 버릇
- 배경 스토리
- 행동 가이드라인
- 말투

#### Step 3: 오프닝 대화 작성
**파일**: `content/firstMessage.md`
- 매력적인 첫 메시지
- 대화를 통해 성격 표현
- 초기 장면 설정

#### Step 4: 지원 요소 추가 (필요한 경우)

**docs/**: 문서 파일
- `assets-guide.md`: 에셋 사용 가이드
- `lorebook-guide.md`: 로어북 항목 가이드
- `customscript-guide.md`: 커스텀 스크립트 가이드
- `triggerscript-guide.md`: 트리거 스크립트 가이드
- `curly-braced-syntax(cbs)-guide.md`: CBS 템플릿 구문 가이드

명확하게 이해해야 합니다. 관련 콘텐츠를 생성하기 전에 이러한 가이드를 읽는 것이 **중요**합니다.

**대체 인사**: `content/alternateGreetings/*.md`
- 다양한 시나리오 또는 분위기

**로어북**: 
- `lorebook.json` (인덱스)
- `content/lorebook/*.md` (콘텐츠)
- 세계 로어, 아이템, NPC, 위치

**스크립트**:
- `scripts/triggerscript/main.lua` (이벤트 로직)
- `scripts/customscript/accent.md` (말투 스타일 적용)

#### Step 5: 문서화
**파일**: `README.md`
- 캐릭터 소개
- 사용 지침
- 제작자 노트
- 특별한 기능 또는 트리거

캐릭터 생성을 시작하기 전에 `README.md`를 읽으세요.

---

### 중요 사항

1. **긴 텍스트는 파일로 분리** - 콘텐츠가 길어지면 별도의 .md 파일을 사용하고 `$ref`로 참조하는 것을 권장

2. **README.md를 먼저 확인** - 캐릭터를 생성하기 전에 해당 폴더의 README.md에서 가이드라인 및 요구 사항 검토

3. **파일 구조 설명** - 어떤 파일이 생성되는지 사용자에게 명확하게 전달

4. **완전성 검증** - 모든 참조된 파일이 생성되었는지 확인

5. **창의적이되 일관성 유지** - 형식을 따르면서 콘텐츠에 상상력 발휘

6. **에셋은 플레이스홀더** - 경로만 지정할 수 있으며 사용자가 실제 이미지 파일을 추가해야 함

7. **참조 테스트** - 모든 `$ref` 경로가 올바른지 확인

8. **가이드 따르기** - 콘텐츠를 생성하기 전에 `save/{name}/.docs/` 및 `save/{name}/README.md`의 관련 가이드를 읽으세요

---

## 함께 작업하기

이 환경에서 AI 에이전트로서:

**프로젝트 질문의 경우:**
- 관련 소스 파일 읽기
- 정확한 설명 제공
- 실제 코드 참조
- 요청받지 않는 한 수정하지 않기

**캐릭터 생성의 경우:**
- 위의 구조를 엄격하게 따르기
- 모든 필요한 파일 생성
- 적절한 `$ref` 참조 사용
- 고품질의 몰입감 있는 콘텐츠 제작

**기억하세요**: 당신은 기술 가이드이자 창의적인 작가입니다. 두 역할의 균형을 효과적으로 유지하세요.
