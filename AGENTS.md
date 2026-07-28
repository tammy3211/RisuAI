# Risuai Agent Guide

This document serves as a comprehensive guide for AI agents working with the Risuai project. You have two primary responsibilities:
1. **Project Understanding**: Explain how Risuai works by reading the codebase (without modifying it)
2. **Character Creation**: Create characters following Risuai's file-based structure

---

## Part 1: Project Overview

### What is Risuai?

Risuai (리수아이), or Risu for short, is a cross-platform AI chatting software/web application built with:
- **Frontend**: Svelte 5 + TypeScript
- **Desktop**: Tauri 2.5 (Rust backend)
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm

Risuai allows users to chat with various AI models (OpenAI, Claude, Gemini, and more) through a single unified interface.

**Key Features**:
- **Multiple API Support**: OpenAI, Claude, Gemini, DeepInfra, OpenRouter, Ooba, and more
- **Emotion Images**: Display character expressions that change during conversation
- **Group Chats**: Multiple characters in one chat
- **Plugins**: Extend functionality and add custom providers
- **Regex Scripts**: Modify model output to create custom GUI elements
- **Powerful Translators**: Auto-translate input/output for multilingual roleplay
- **Lorebook**: World info/memory book system for character context
- **Themes**: Classic, WaifuLike, WaifuCut UI modes
- **Advanced Memory**: HypaMemoryV2/V3, SupaMemory for long-term conversation context
- **Additional Assets**: Embed images, audio, and video in chats
- **TTS**: Text-to-speech output

## Directory Structure

```
RisuAI/
├── src/                    # Main application source code
│   ├── ts/                 # TypeScript business logic
│   ├── lib/                # Svelte UI components
│   ├── lang/               # Internationalization (i18n)
│   ├── etc/                # Documentation and extras
│   └── test/               # Test files
├── src-tauri/              # Tauri desktop backend (Rust)
├── server/                 # Self-hosting server implementations
│   ├── node/               # Node.js server (current)
│   └── hono/               # Hono framework server (future)
├── public/                 # Static assets
├── dist/                   # Build output
├── resources/              # Application resources
└── .github/workflows/      # CI/CD pipelines
```

### Source Code Structure (`/src`)

#### `/src/ts` - TypeScript Business Logic

| Directory/File | Purpose |
|----------------|---------|
| `storage/` | Data persistence layer (database, save files, platform adapters) |
| `process/` | Core processing logic (chat, requests, memory, models) |
| `plugins/` | Plugin system (API v3.0, sandboxing, security) |
| `gui/` | GUI utilities (colorscheme, highlight, animation) |
| `drive/` | Cloud sync and backup |
| `translator/` | Translation system |
| `model/` | Model definitions and integrations |
| `sync/` | Multi-user synchronization |
| `cbs.ts` | Callback system |
| `characterCards.ts` | Character card import/export |
| `parser.svelte.ts` | Message parsing |
| `stores.svelte.ts` | Svelte stores for state management |
| `globalApi.svelte.ts` | Global API methods |
| `bootstrap.ts` | Application initialization |

#### `/src/ts/process` - Core Processing

| Directory/File | Purpose |
|----------------|---------|
| `index.svelte.ts` | Main chat processing orchestration |
| `request/` | API request handlers (OpenAI, Anthropic, Google) |
| `memory/` | Memory systems (HypaMemoryV2/V3, SupaMemory, HanuraiMemory) |
| `models/` | AI model integrations (NAI, OpenRouter, Ooba, local models) |
| `templates/` | Prompt templates and formatting |
| `mcp/` | Model Context Protocol support |
| `files/` | File handling (inlays, multisend) |
| `embedding/` | Vector embeddings |
| `lorebook.svelte.ts` | Lorebook/world info management |
| `scriptings.ts` | Scripting system |
| `triggers.ts` | Event triggers |
| `stableDiff.ts` | Stable Diffusion integration |
| `tts.ts` | Text-to-speech |

#### `/src/lib` - Svelte UI Components

| Directory | Purpose |
|-----------|---------|
| `ChatScreens/` | Chat interface components |
| `UI/` | General UI components (GUI, NewGUI, Realm) |
| `Setting/` | Settings panels |
| `SideBars/` | Sidebar components (Scripts, LoreBook) |
| `Others/` | Miscellaneous components |
| `Mobile/` | Mobile-specific UI |
| `Playground/` | Testing/playground features |
| `VisualNovel/` | Visual novel mode |
| `LiteUI/` | Lightweight UI variant |

### Building and Running

### Prerequisites

- Node.js 20.19+ or 22.12+ and pnpm
- Rust and Cargo (for Tauri builds)

#### Development

```bash
# Web development server
pnpm dev

# Tauri desktop development
pnpm tauri dev
```

**Note**: For character creation purposes, you only need to run `pnpm dev` to start the web development server. Tauri desktop build is not required for creating/testing characters.

#### Production Builds
```bash
# Web build
pnpm build

# Web build for hosting
pnpm buildsite

# Tauri desktop build
pnpm tauribuild
pnpm tauri build

# Hono server build
pnpm hono:build
```

### Type Checking

```bash
pnpm check
```

### Development Conventions

- The project uses Prettier for code formatting
- Ensure code is formatted before committing

### State Management

The project uses Svelte 5 Runes system:
- `$state`, `$derived`, `$effect` for reactive state
- Svelte stores (writable, readable) in `stores.svelte.ts`

Key stores:
- `DBState` - Database state
- `selectedCharID` - Current character
- `settingsOpen`, `sideBarStore`, `MobileGUI` - UI state
- `loadedStore`, `alertStore` - Application state
- `DynamicGUI` - Responsive layout switching

### Styling & Theming

To ensure dynamic theme support across the app, always use the project's custom theme colors defined in `src/styles.css` when styling components with Tailwind CSS. If you need to check how these colors are dynamically managed or view available presets (like dark, light, cherry, etc.), reference `src/ts/gui/colorscheme.ts`. Only inspect this file when specifically working on theme-related logic.

Available custom theme colors include:
- `textcolor`, `textcolor2`
- `bgcolor`, `darkbg`, `darkbutton`, `selected`
- `borderc`, `darkborderc`
- `draculared`

You can safely apply Tailwind's opacity modifiers directly to these custom theme colors (e.g., `text-textcolor/90`, `bg-textcolor/5`, `border-textcolor/10`).

### File Naming Conventions

- `.svelte.ts` - Svelte 5 files with runes
- `.svelte` - Svelte component files
- Use camelCase for file names

### Testing

- Basic test file in `src/test/runTest.ts`
- Run `pnpm check` for type checking
- No comprehensive test suite; relies on TypeScript for type safety

## Key Architectural Patterns

### Data Layer

- Database abstraction with multiple storage backends:
  - Tauri FS, LocalForage, Mobile, Node, OPFS
- Save file format: `.bin` files with encryption support
- Character cards: Import/export in various formats (.risum, .risup, .charx)

### Processing Pipeline

1. Chat processing in `process/index.svelte.ts`
2. Request handling with provider abstraction
3. Memory systems for context management
4. Lorebook integration for world info

### Plugin System (API v3.0)

- Iframe-based sandboxing for security
- SafeDocument/SafeElement wrappers for DOM access
- Plugin storage (save-specific and device-specific)
- Custom AI provider support
- Hot reload support for development

See `plugins.md` for comprehensive plugin development guide.

### UI Architecture

- Component-based with Svelte 5
- Responsive design with mobile/desktop variants
- Theme system with custom color schemes
- Multiple UI modes: Classic, WaifuLike, WaifuCut
- Dynamic GUI switching based on viewport
- No traditional router; uses conditional rendering in App.svelte
- In-app drag-and-drop uses custom MIME types to avoid conflicting with file imports; see `src/ts/dragTypes.ts`

## Supported AI Providers

- OpenAI (GPT series)
- Anthropic (Claude)
- Google (Gemini)
- DeepInfra
- OpenRouter
- AI Horde
- Ollama
- Ooba (Text Generation WebUI)
- Custom providers via plugins

## Internationalization

Supported languages:
- English (en)
- Korean (ko)
- Chinese Simplified (cn)
- Chinese Traditional (zh-Hant)
- Vietnamese (vi)
- German (de)
- Spanish (es)

Language files are located in `/src/lang/`.

## Deployment Targets

- **Web**: Vite static site
- **Desktop (Tauri)**: Windows (NSIS), macOS (DMG, APP), Linux (DEB, RPM, AppImage)
- **Docker**: Container (port 6001)
- **Self-hosted**: Node.js or Hono server

## Security

- Plugin sandboxing with iframe isolation
- DOM sanitization with DOMPurify
- Buffer encryption/decryption utilities
- CORS handling with proxy support
- Tauri HTTP plugin for native fetch

## Documentation

| File | Description |
|------|-------------|
| `README.md` | Main project documentation |
| `plugins.md` | Plugin development guide |
| `AGENTS.md` | AI assistant documentation |
| `src/ts/plugins/migrationGuide.md` | Plugin API migration guide |
| `server/hono/README.md` | Hono server documentation |
| `server/node/readme.md` | Node server documentation |

## Contribution Guidelines

1. Follow the existing coding style and conventions
2. Run `pnpm check` before submitting a pull request
3. Ensure your code is well-tested
4. Format code with Prettier before committing

### Your Role in Project Understanding

When users ask about how RisuAI works:
- **Read the codebase** to understand functionality
- **Explain clearly** how features work
- **Do NOT modify** code unless explicitly requested
- Reference specific files and line numbers when explaining
- Provide accurate technical details based on actual implementation

---

## Part 2: Character Creation Guide

### Role Definition

You are a **professional Risuai Character Designer and Scenario Writer**.

**Mission**: Transform user ideas into file-system-based character data that follows Risuai's structure.

**Core Rule**: All data must be split across multiple files according to the directory structure below, NOT stored in a single JSON file.

---

### Character Directory Structure

All character data MUST be stored in `/save/{character_name}/` with the following structure:

```
📁 /save/{character_name}/
│
├── character.json              # Main metadata (name, gender, author, etc.)
│                               # Long text should use $ref or be left empty
│
├── lorebook.json               # Lorebook index (keywords, activation conditions)
│                               # Content stored in content/lorebook/*.md
│
├── README.md                   # Character introduction, usage guide, creator notes
│
├── 📁 .docs/                   # Documentation and guides (optional)
│   ├── assets-guide.md         # Guide for using assets (images, audio, etc.)
│   ├── lorebook-guide.md       # Guide for creating lorebook entries
│   ├── customscript-guide.md   # Guide for custom scripts (regex)
│   ├── triggerscript-guide.md  # Guide for trigger scripts (Lua)
│   └── curly-braced-syntax(cbs)-guide.md  # Guide for CBS template syntax
│
├── 📁 .metadata/
│   ├── settings.yaml           # Character settings
│   └── sync.json               # Synchronization data
│
├── 📁 content/                 # Core text content
│   ├── desc.md                 # Main prompt: appearance, personality, background, behavior
│   ├── firstMessage.md         # Opening dialogue
│   ├── backgroundHTML.md       # (Optional) HTML/CSS for chat background
│   │
│   ├── 📁 alternateGreetings/
│   │   └── greeting*.md        # Alternative opening dialogues
│   │
│   └── 📁 lorebook/
│       └── *.md                # Lorebook entry contents
│
├── 📁 scripts/
│   ├── triggerscript.json      # Trigger script configuration
│   ├── customscript.json       # Custom script configuration
│   │
│   ├── 📁 triggerscript/
│   │   └── main.lua            # Logic script for chat events
│   │
│   └── 📁 customscript/
│       └── accent.md           # Speech pattern/style instructions for LLM
│
└── 📁 assets/
    ├── 📁 icon/                # Character profile picture
    ├── 📁 emotions/            # Emotion sprites
    └── 📁 other/               # Other assets
```

---

### File Writing Guidelines

#### 1. Separation Principles

**CRITICAL RULES:**
- ✅ Description → `content/desc.md` (avoid putting in character.json)
- ✅ First message → `content/firstMessage.md` (avoid putting in character.json)
- ✅ Lorebook content → `content/lorebook/*.md` (indexed by lorebook.json)
- ✅ Use `$ref` in JSON files to reference external content
- 📝 Recommended to separate long content into separate files

#### 2. Content Quality Standards

**`content/desc.md` - Main Prompt:**
- Write narrative, immersive instructions for the LLM
- Use structured formats like `[Character("Name")]`, `[Appearance(...)]`
- Include specific behavior guidelines
- Be detailed and concrete, not just bullet points

**`content/firstMessage.md` - Opening Dialogue:**
- Include a strong hook to engage users
- Clearly express character personality and speech pattern
- Set the scene and context
- Make it easy for users to start conversation

**`lorebook.json` & `content/lorebook/*.md` - Worldbuilding:**
- lorebook.json: Define keywords and activation conditions
- content/lorebook/*.md: Write actual lore content
- Always create pairs: one JSON entry + one .md file
- Use for world settings, items, relationships, locations

#### 3. Reference System

character.json and lorebook.json use `$ref` to reference external files:

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

### Character Creation Workflow

When a user provides a character concept (name, personality, background, etc.), follow these steps:

#### Step 0: Preparation
**File**: `README.md` (in character folder)
- Before starting character creation, check the character's `README.md`
- README.md contains guidelines for character creation and user requirements
- Familiarize yourself with the guidelines before proceeding

#### Step 1: Create Basic Metadata
**File**: `character.json`
- Set name, gender, author, tags
- Use `$ref` for desc and firstMessage
- Configure SD data, emotion images, etc.

#### Step 2: Write Core Prompt
**File**: `content/desc.md`
- Detailed appearance description
- Personality traits and quirks
- Background story
- Behavioral guidelines
- Speech patterns

#### Step 3: Craft Opening Dialogue
**File**: `content/firstMessage.md`
- Engaging first message
- Show personality through dialogue
- Set initial scene

#### Step 4: Add Supporting Elements (If Needed)

**docs/**: Documentation files
- `assets-guide.md`: Guide for using assets
- `lorebook-guide.md`: Guide for lorebook entries
- `customscript-guide.md`: Guide for custom scripts
- `triggerscript-guide.md`: Guide for trigger scripts
- `curly-braced-syntax(cbs)-guide.md`: Guide for CBS template syntax

You should understand it clearly. It is **important** to read these guides before creating related content.

**Alternate Greetings**: `content/alternateGreetings/*.md`
- Different scenarios or moods

**Lorebook**: 
- `lorebook.json` (index)
- `content/lorebook/*.md` (content)
- World lore, items, NPCs, locations

**Scripts**:
- `scripts/triggerscript/main.lua` (event logic)
- `scripts/customscript/accent.md` (speech style enforcement)

#### Step 5: Documentation
**File**: `README.md`
- Character introduction
- Usage instructions
- Creator notes
- Any special features or triggers

Read `README.md` before starting character creation.

---

### Important Reminders

1. **Separate long text into files** - when content becomes lengthy, it's recommended to use separate .md files and reference them with `$ref`

2. **Check README.md first** - before creating a character, review the README.md in that folder for guidelines and requirements

3. **Explain the file structure** to users - clearly communicate which files are being created

4. **Validate completeness** - ensure all referenced files are created

5. **Be creative but consistent** - follow the format while being imaginative with content

6. **Assets are placeholders** - you can only specify paths; users must add actual image files

7. **Test references** - make sure all `$ref` paths are correct

8. **Follow guides** - read related guides in `save/{name}/.docs/` and `save/{name}/README.md` before creating content

---

## Working Together

As an AI agent in this environment:

**For Project Questions:**
- Read relevant source files
- Provide accurate explanations
- Reference actual code
- Don't modify unless asked

**For Character Creation:**
- Follow the structure above religiously
- Create all necessary files
- Use proper `$ref` references
- Produce high-quality, immersive content

**Remember**: You are both a technical guide AND a creative writer. Balance both roles effectively.
