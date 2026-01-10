# [Character Name]

> Write a one-line introduction for the agent here.

## 📖 Character Introduction

Write freely about the character's background, personality, worldview, etc.

## 💡 Agent Guide

- **Recommended Model**: (e.g., Claude 4.5, Gemini 3, etc.)
- **Feature Description**: (trigger scripts, custom scripts, etc.)

## ✍️ Creator Notes

Write about the character creation intent, points to emphasize, and other necessary information.

---

<!-- Below is RisuAI technical documentation -->

# RisuAI Character File Structure Guide
...

This document provides the file structure and field descriptions needed when creating RisuAI characters.

---

## character.json Field Descriptions

### Basic Fields

#### `name`
- **Description**: Character name
- **Usage**: Required

#### `firstMessage`
- **Description**: First greeting message
- **Recommended**: Separate into `content/firstMessage.md` file and reference with `$ref`

#### `desc`
- **Description**: Main prompt (character's appearance, personality, background, behavior guidelines, etc.)
- **Recommended**: Separate into `content/desc.md` file and reference with `$ref`

#### `personality`
- **Description**: Personality field
- **Status**: Field for compatibility with previous v2 version
- **Recommended**: Do not use, replace with `desc`

#### `scenario`
- **Description**: Scenario field
- **Status**: Field for compatibility with previous v2 version
- **Recommended**: Do not use, replace with `desc`

#### `exampleMessage`
- **Description**: Example conversation messages
- **Recommended**: Do not use

#### `creatorNotes`
- **Description**: Creator comments (no effect on character)
- **Format**: 
  ```
  # `en`
  English comment
  # `ko`
  Korean comment
  ```
- **Syntax**: `\n# \`{lang}\`\n {comment}`

#### `systemPrompt`
- **Description**: System prompt
- **Recommended**: Do not use, include in `desc`

#### `replaceGlobalNote`
- **Description**: Use instead of global note
- **Status**: Nowadays often replaced with lorebook instead of direct use

#### `alternateGreetings`
- **Description**: Alternative first greeting messages
- **Type**: Array
- **Recommended**: Separate into `content/alternateGreetings/*.md` files

#### `postHistoryInstructions`
- **Status**: Not used

#### `tags`
- **Status**: Not used

#### `nickname`
- **Description**: When nickname is set, used in `{{char}}` instead of character name in chat

#### `source`
- **Status**: Not used

#### `creation_date`
- **Description**: Unix timestamp of creation time

---

### Extensions Fields

#### `bias`
- **Description**: Bias for LLM settings
- **Status**: Not often used as recent models don't support it

#### `viewScreen`
- **Description**: Image display method setting
- **Options**:
  - `'emotion'`: Use emotion images
  - `'none'`: Default
  - `'imggen'`: Use image generation feature
  - `'vn'`: Not used

#### `utilityBot`
- **Description**: Remove RP-related prompts
- **Purpose**: Useful for testing by outputting only character prompts

#### `sdData`
- **Status**: Not used

#### `backgroundHTML`
- **Description**: Background HTML
- **Purpose**: Used to display HTML in background or set global CSS through `<style>` blocks
- **Recommended**: Separate into `content/backgroundHTML.md` file

#### `additionalText`
- **Description**: Text to be added to character description
- **Status**: Field for compatibility with previous v2 version
- **Recommended**: Do not use, replace with `desc`

#### `largePortrait`
- **Description**: Use when icon is a vertically long image
- **Effect**: No effect on character (for UI display)

#### `inlayViewScreen`
- **Description**: Setting to display images within chat instead of separately

#### `newGenData`
- **Description**: Image generation related data
- **Condition**: Used when `viewScreen` is `emotion` or `imggen`, ignored when `none`

#### `lowLevelAccess`
- **Description**: Grants weak data access permissions to triggers, etc.

#### `defaultVariables`
- **Description**: Define default variables
- **Format**: Write in `<variable name>=<variable value>` format, separated by newlines

#### `prebuiltAssetCommand`
- **Status**: Not used

#### `prebuiltAssetExclude`
- **Status**: Not used

#### `prebuiltAssetStyle`
- **Status**: Not used

#### `depth_prompt`
- **Status**: Field for compatibility with previous v2 version, no longer used

#### `group_only_greetings`
- **Description**: Setting for group chat
- **Status**: Not used

---

### Modules

#### `customscript`
- **Description**: Define regex to be used in chat
- **Reference**: `scripts/customscript.json`

#### `triggerscript`
- **Description**: Define triggers to be used in chat
- **Reference**: `scripts/triggerscript.json`

---

### LoreBook

#### `globalLore`
- **Description**: Character's lorebook
- **Reference**: `lorebook.json`

#### `loreSettings`
- **Description**: Lorebook settings

#### `lorePlus`
- **Description**: Lorebook additional features
- **Default**: `false`
- **Status**: Currently not used as feature is not implemented

#### `loreExt`
- **Status**: Not used

---

### Assets

#### `image`
- **Description**: Default icon path
- **Recommended location**: `assets/icon/`

#### `emotionImages`
- **Description**: Emotion image paths
- **Recommended location**: `assets/emotions/`

#### `additionalAssets`
- **Description**: Additional asset paths
- **Recommended location**: `assets/other/`

#### `ccAssets`
- **Status**: Undefined

---

### Extra

#### `extentions`
- **Status**: Not used

#### `additionalData`
- **Description**: Metadata
- **Included items**: `"creator"`, `"character_version"`, `"tag": []`
- **Status**: Not used

---

## .metadata/sync.json

Contains synchronization data for chatting (chat data, chat UUID, etc.).

**Note**: This data is not reflected when exporting characters.

---

## .metadata/settings.yaml

Sets options when parsing characters.

### `triggerversion`
- **Description**: Select trigger version
- **Options**:
  - `v1`: Legacy trigger
  - `v2`: V2 Header trigger
  - `lua`: Lua trigger (recommended)
- **Recommended value**: `"lua"`

### `useluabundle`
- **Type**: `boolean`
- **Description**: Use when you want to manage Lua with multiple files using `require` instead of one file
- **Default**: `false`

---

## Recommendations Summary

### Recommended Fields
- `name`: Character name
- `desc`: Main prompt (separate into `content/desc.md`)
- `firstMessage`: First message (separate into `content/firstMessage.md`)
- `alternateGreetings`: Alternate greetings (separate into `content/alternateGreetings/*.md`)
- `globalLore`: Lorebook (`lorebook.json` and `content/lorebook/*.md`)
- `customscript`: Custom scripts
- `triggerscript`: Trigger scripts
- `viewScreen`: Image display method
- `backgroundHTML`: Background HTML/CSS

### Fields Not Recommended for Use
- `personality`, `scenario`, `additionalText`: Replace with `desc`
- `systemPrompt`: Include in `desc`
- `exampleMessage`: Minimal effect
- `bias`: Not supported by latest models
- Other deprecated fields

### File Separation Recommended
For long text content, do not write directly in JSON. Separate into `.md` files and reference with `$ref`:
- `desc` → `content/desc.md`
- `firstMessage` → `content/firstMessage.md`
- `alternateGreetings` → `content/alternateGreetings/*.md`
- `globalLore` content → `content/lorebook/*.md`
- `backgroundHTML` → `content/backgroundHTML.md`

---

## $ref File Reference System

### Basic Format
```json
{
  "desc": {"$ref": "content/desc.md"},
  "firstMessage": {"$ref": "content/firstMessage.md"}
}
```

### Path Methods

**Absolute Path**: Based on `/save/{character_name}/`
- Example: `{"$ref": "content/desc.md"}`

**Relative Path**: Based on current JSON file location
- Example: `{"$ref": "./customscript/accent.md"}`
- Parent folder from `scripts/customscript.json`: `{"$ref": "../content/shared.md"}`

### Notes
1. Must be object format: `{"$ref": "path"}` ✅  /  `"$ref:path"` ❌
2. Use slash: `/` ✅  /  `\` ❌
3. Spaces in filenames can be used as-is

## Guidelines

For detailed information about each feature, refer to the guide documents below:
- [Lorebook Guide](./.docs/lorebook-guide.md)
- [Custom Script Guide](./.docs/customscript-guide.md)
- [Trigger Script Guide](./.docs/triggerscript-guide.md)
- [CBS Syntax Guide](./.docs/curly-braced-syntax(cbs)-guide.md)
- [Asset Usage Guide](./.docs/assets-guide.md)