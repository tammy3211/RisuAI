# Risuai - Character Creator Branch

<picture>
  <img alt="text" src="https://raw.githubusercontent.com/kwaroran/Risuai/refs/heads/main/public/logo_typo_small.avif" width="400"/>
</picture>

[![Svelte](https://img.shields.io/badge/svelte-5-red?logo=svelte)](https://svelte.dev/) [![Typescript](https://img.shields.io/badge/typescript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![Tauri](https://img.shields.io/badge/tauri-2.5-%2324C8D8?logo=tauri)](https://tauri.app/) [![Vite](https://img.shields.io/badge/vite-7-%23646CFF?logo=vite)](https://vite.dev/) [![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4-%2306B6D4?logo=tailwindcss)](https://tailwindcss.com/)

## ⚠️ Important Notice

**This branch is designed for character creators and developers.**

If you are a general user looking to use Risuai, please visit:
- **Official Website**: [https://risuai.net](https://risuai.net)
- **Main Repository**: [https://github.com/kwaroran/Risuai](https://github.com/kwaroran/Risuai)
- **Releases**: [https://github.com/kwaroran/Risuai/releases](https://github.com/kwaroran/Risuai/releases)

This branch contains development tools and documentation for creating characters with a structured file-based system.

## About Risuai

Risuai (리수아이), or Risu for short, is a cross-platform AI chatting application that supports multiple AI models including OpenAI, Claude, Gemini, and more. It features emotion images, group chats, lorebooks, plugins, and advanced memory systems.

## Screenshots

|         Screenshot 1         |         Screenshot 2         |
| :--------------------------: | :--------------------------: |
| ![Screenshot 1][screenshot1] | ![Screenshot 2][screenshot2] |
| ![Screenshot 3][screenshot3] | ![Screenshot 4][screenshot4] |

[screenshot1]: https://github.com/kwaroran/Risuai/assets/116663078/cccb9b33-5dbd-47d7-9c85-61464790aafe
[screenshot2]: https://github.com/kwaroran/Risuai/assets/116663078/30d29f85-1380-4c73-9b82-1a40f2c5d2ea
[screenshot3]: https://github.com/kwaroran/Risuai/assets/116663078/faad0de5-56f3-4176-b38e-61c2d3a8698e
[screenshot4]: https://github.com/kwaroran/Risuai/assets/116663078/ef946882-2311-43e7-81e7-5ca2d484fa90

## About This Branch (copilot-bot-maker)

This branch focuses on providing a development environment for character creators:

- **File-based Character System**: Characters organized with separate files for descriptions, lorebooks, scripts, and assets
- **AI Agent Integration**: Built-in documentation for AI assistants to create and manage characters
- **Comprehensive Guides**: Detailed documentation in English and Korean
- **Reference System**: Use `$ref` to link content files for better organization

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

1. Clone the repository and checkout this branch:
   ```bash
   git clone https://github.com/kwaroran/Risuai.git
   cd Risuai
   git checkout copilot-bot-maker
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run development server:
   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Type Checking

```bash
pnpm check
```

## Character Structure

Characters use a file-based structure:

```
/save/{character_name}/
├── character.json          # Metadata (name, author, tags, etc.)
├── lorebook.json          # Lorebook index
├── README.md              # Character documentation
├── content/
│   ├── desc.md            # Character description
│   ├── firstMessage.md    # Opening dialogue
│   └── lorebook/          # Lorebook content files
├── scripts/
│   ├── triggerscript/     # Lua event scripts
│   └── customscript/      # Custom scripts
└── assets/
    ├── icon/              # Character icon
    ├── emotions/          # Emotion images
    └── other/             # Additional assets
```

## Documentation

For detailed guides on character creation, see:

- **[AGENTS.md](AGENTS.md)** - Complete development and character creation guide for agents
- **[Assets Guide](public/defaultbot/.docs/assets-guide.md)** - How to use images, audio, and video
- **[Lorebook Guide](public/defaultbot/.docs/lorebook-guide.md)** - Creating lorebook entries
- **[Trigger Script Guide](public/defaultbot/.docs/triggerscript-guide.md)** - Lua scripting for characters
- **[Custom Script Guide](public/defaultbot/.docs/customscript-guide.md)** - Regex scripts
- **[CBS Guide](public/defaultbot/.docs/curly-braced-syntax(cbs)-guide.md)** - Curly-Braced Syntax template system


---

<br>

# 한국어 (Korean)

## ⚠️ 중요 안내

**이 브랜치는 캐릭터 제작자와 개발자를 위해 설계되었습니다.**

일반 사용자로서 Risuai를 사용하려면 다음을 방문하세요:
- **공식 웹사이트**: [https://risuai.net](https://risuai.net)
- **메인 저장소**: [https://github.com/kwaroran/Risuai](https://github.com/kwaroran/Risuai)
- **릴리즈**: [https://github.com/kwaroran/Risuai/releases](https://github.com/kwaroran/Risuai/releases)

이 브랜치는 구조화된 파일 기반 시스템으로 캐릭터를 생성하기 위한 개발 도구와 문서를 포함하고 있습니다.

## Risuai 소개

Risuai(리수아이)는 OpenAI, Claude, Gemini 등 다양한 AI 모델을 지원하는 크로스 플랫폼 AI 채팅 애플리케이션입니다. 감정 이미지, 그룹 채팅, 로어북, 플러그인, 고급 메모리 시스템 등의 기능을 제공합니다.

## 스크린샷

|          스크린샷 1           |          스크린샷 2           |
| :--------------------------: | :--------------------------: |
| ![Screenshot 1][screenshot1] | ![Screenshot 2][screenshot2] |
| ![Screenshot 3][screenshot3] | ![Screenshot 4][screenshot4] |

[screenshot1]: https://github.com/kwaroran/Risuai/assets/116663078/cccb9b33-5dbd-47d7-9c85-61464790aafe
[screenshot2]: https://github.com/kwaroran/Risuai/assets/116663078/30d29f85-1380-4c73-9b82-1a40f2c5d2ea
[screenshot3]: https://github.com/kwaroran/Risuai/assets/116663078/faad0de5-56f3-4176-b38e-61c2d3a8698e
[screenshot4]: https://github.com/kwaroran/Risuai/assets/116663078/ef946882-2311-43e7-81e7-5ca2d484fa90

## 이 브랜치에 대하여 (copilot-bot-maker)

이 브랜치는 캐릭터 제작자를 위한 개발 환경 제공에 초점을 맞추고 있습니다:

- **파일 기반 캐릭터 시스템**: 설명, 로어북, 스크립트, 에셋을 별도 파일로 구성
- **AI 에이전트 통합**: AI 어시스턴트가 캐릭터를 생성하고 관리할 수 있도록 내장 문서 제공
- **포괄적인 가이드**: 영어와 한국어로 제공되는 프롬프트 가이드 문서
- **참조 시스템**: `$ref`를 사용하여 콘텐츠 파일을 연결

## 시작하기

### 사전 요구사항

- Node.js (최신 LTS 권장)
- pnpm

### 설치

1. 저장소 클론 및 브랜치 체크아웃:
   ```bash
   git clone https://github.com/kwaroran/Risuai.git
   cd Risuai
   git checkout copilot-bot-maker
   ```

2. 의존성 설치:
   ```bash
   pnpm install
   ```

3. 개발 서버 실행:
   ```bash
   pnpm dev
   ```

4. 브라우저에서 `http://localhost:5173` 접속

### 타입 체크

```bash
pnpm check
```

## 캐릭터 구조

캐릭터는 파일 기반 구조를 사용합니다:

```
/save/{character_name}/
├── character.json          # 메타데이터 (이름, 저자, 태그 등)
├── lorebook.json          # 로어북 인덱스
├── README.md              # 캐릭터 문서
├── content/
│   ├── desc.md            # 캐릭터 설명
│   ├── firstMessage.md    # 오프닝 대사
│   └── lorebook/          # 로어북 콘텐츠 파일
├── scripts/
│   ├── triggerscript/     # Lua 이벤트 스크립트
│   └── customscript/      # 커스텀 스크립트
└── assets/
    ├── icon/              # 캐릭터 아이콘
    ├── emotions/          # 감정 이미지
    └── other/             # 추가 에셋
```

## 문서

캐릭터 생성에 대한 상세 가이드:

- **[AGENTS.md](public/defaultbot/.docs/ko/AGENTS.md)** - 개발 및 캐릭터 생성 통합 에이전트 가이드
- **[에셋 가이드](public/defaultbot/.docs/assets-guide.md)** - 이미지, 오디오, 비디오 사용법
- **[로어북 가이드](public/defaultbot/.docs/lorebook-guide.md)** - 로어북 항목 생성
- **[트리거 스크립트 가이드](public/defaultbot/.docs/triggerscript-guide.md)** - 캐릭터를 위한 Lua 스크립팅
- **[커스텀 스크립트 가이드](public/defaultbot/.docs/customscript-guide.md)** - 정규식 스크립트
- **[CBS 가이드](public/defaultbot/.docs/curly-braced-syntax(cbs)-guide.md)** - Curly-Braced Syntax 템플릿 시스템

한국어로 변역된 문서는 `.docs/ko/` 하위 디렉토리에서 확인할 수 있습니다.