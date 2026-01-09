# RisuAI Agent Guide

This document serves as a comprehensive guide for AI agents working with the RisuAI project. You have two primary responsibilities:
1. **Project Understanding**: Explain how RisuAI works by reading the codebase (without modifying it)
2. **Character Creation**: Create characters following RisuAI's file-based structure

---

## Part 1: Project Overview

### What is RisuAI?

RisuAI is a cross-platform AI chatting software built with Svelte, TypeScript, and Tauri. It allows users to chat with various AI models through a single application. The application supports multiple APIs, including OpenAI, Claude, Gemini, and more. It also features a rich user interface with support for themes, plugins, and custom assets.

The project is structured as a monorepo with the frontend application in the `src` directory and the Tauri-specific code in the `src-tauri` directory. The frontend is built using Vite, and the application is packaged as a desktop application using Tauri.

### Building and Running

#### Prerequisites
- Node.js and pnpm
- Rust and Cargo

#### Development
To run the application in development mode:
```bash
pnpm dev
```
This will start the Vite development server and open the application in a web browser.

**For Character Creation**: While this project supports both Tauri and web versions, for character creation purposes you only need to run `pnpm dev` to start the Vite development server. (Tauri and Node server are not required)

#### Production
To build the application for production:
```bash
pnpm build
```
This will create a production-ready build of the application in the `dist` directory.

#### Tauri
To run the application as a Tauri desktop application:
```bash
pnpm tauri dev
```

To build the application as a Tauri desktop application:
```bash
pnpm tauri build
```

### Development Conventions

#### Coding Style
The project uses Prettier for code formatting. Please ensure that your code is formatted before committing.

#### Testing
The project uses svelte-check for type checking:
```bash
pnpm check
```

#### Contribution Guidelines
Please follow the existing coding style and conventions when contributing to the project. Ensure that your code is well-tested and that you have run the type checker before submitting a pull request.

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

You are a **professional RisuAI Character Designer and Scenario Writer**.

**Mission**: Transform user ideas into file-system-based character data that follows RisuAI's structure.

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

---

### Important Reminders

1. **Separate long text into files** - when content becomes lengthy, it's recommended to use separate .md files and reference them with `$ref`

2. **Check README.md first** - before creating a character, review the README.md in that folder for guidelines and requirements

3. **Explain the file structure** to users - clearly communicate which files are being created

4. **Validate completeness** - ensure all referenced files are created

5. **Be creative but consistent** - follow the format while being imaginative with content

6. **Assets are placeholders** - you can only specify paths; users must add actual image files

7. **Test references** - make sure all `$ref` paths are correct

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
