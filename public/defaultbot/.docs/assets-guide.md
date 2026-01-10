# Assets Usage Guide

This guide explains how to manage assets such as images, videos, and audio for RisuAI characters.

---

## 📂 Asset Folder Structure

```
/save/{character_name}/
└── assets/
    ├── icon/           # Character profile image
    ├── emotions/       # Emotion images
    └── other/          # Additional assets (images, videos, audio, etc.)
```

---

## Asset Types

### 1. `image` - Character Icon

The default profile image for the character.

**character.json configuration:**
```json
{
  "image": "assets/icon/character.png"
}
```

**Features:**
- Displayed in character lists, chat screens, etc.
- Supports image files like PNG, WebP, JPEG, GIF
- Recommended location: `assets/icon/`

---

### 2. `emotionImages` - Emotion Images

Images displayed based on the character's emotional state.

**character.json configuration:**
```json
{
  "viewScreen": "emotion",
  "emotionImages": [
    ["happy", "assets/emotions/happy.png"],
    ["sad", "assets/emotions/sad.png"],
    ["angry", "assets/emotions/angry.png"],
    ["neutral", "assets/emotions/neutral.png"]
  ]
}
```

**Array structure:** `[name, path]`
- **name**: Emotion identifier (lowercase recommended)
- **path**: Path to the image file

**Usage:**

1. **Express emotions in prompts:**
```markdown
*smiling* "Good morning!" [emotion: happy]
```

2. **Insert emotion images in CBS:**
```
{{emotion::happy}}
```

3. **Auto-change emotions with trigger scripts:**
You can automatically change images by detecting emotion-related keywords.

**Notes:**
- `viewScreen` must be set to `"emotion"` to work
- Image names are matched case-insensitively (converted to lowercase internally)
- If no default emotion image exists, the first image is used as default

---

### 3. `additionalAssets` - Additional Assets

You can include various additional assets such as images, videos, audio, fonts, CSS, etc.

**character.json configuration:**
```json
{
  "additionalAssets": [
    ["background_music", "assets/other/bgm.mp3", "mp3"],
    ["item_image", "assets/other/sword.png", "png"],
    ["cutscene_video", "assets/other/intro.mp4", "mp4"],
    ["custom_font", "assets/other/myfont.ttf", "ttf"]
  ]
}
```

**Array structure:** `[name, path, extension]`
- **name**: Asset identifier (free text, case-insensitive)
- **path**: File path
- **extension**: File extension (`png`, `mp3`, `mp4`, `ttf`, etc.)

**Supported file formats:**

| Type | Extensions | Usage |
|------|------------|-------|
| **Images** | png, webp, jpeg, jpg, gif, avif, svg | Illustrations, icons, backgrounds |
| **Videos** | mp4, webm, avi, m4v | Cutscenes, animations |
| **Audio** | mp3 | Background music, sound effects |
| **Fonts** | ttf, otf, woff, woff2 | Custom fonts |
| **Styles** | css | Custom CSS |

**Usage:**

#### Insert images
```
{{img::background_music}}
{{image::item_image}}
{{asset::item_image}}
```

#### Insert videos
```
{{video::cutscene_video}}
```

#### Insert audio
```
{{audio::sound_effect}}
{{bgm::background_music}}
```

#### Set background image
```
{{bg::background_image}}
```
- Only works in backgroundHTML property

#### Get file path
```
{{raw::item_image}}
{{path::custom_font}}
```
- Returns a path that can be used in CSS `url()` etc.

**CBS examples:**

```html
<!-- Background image -->
<div style="background-image: url('{{raw::background_image}}')">
  Content
</div>

<!-- Custom font -->
<style>
@font-face {
  font-family: 'CustomFont';
  src: url('{{raw::custom_font}}');
}
</style>

<!-- Display image -->
{{img::item}}

<!-- Display image using url -->
<style>
.item-box {
  width: 200px;
  height: 200px;
  background-image: url('{{raw::box_image}}');
  background-size: cover;
}
</style>
<div class="item-box">
  <img src="{{raw::item_image}}" alt="item">
</div>

<!-- Display video -->
{{video::intro}}

<!-- Play audio -->
{{audio::bgm}}
```

**Notes:**
- Asset names are matched **case-insensitively** (converted to lowercase internally)
- If multiple assets have the same name, one is randomly selected

---

### 4. `ccAssets` - Character Card Assets

**Note:** This field is generally **not manually created by users**.

This is metadata automatically managed by the system when changing character icons or exporting/importing character cards.

**Structure:**
```json
{
  "ccAssets": [
    {
      "type": "icon",
      "uri": "...",
      "name": "main",
      "ext": "png"
    }
  ]
}
```

**Description:**
- Used when exporting to Character Card V3 format
- Stores previous icon when changing icon
- Metadata for embedding assets inside the card
- Manual editing not recommended

---

## Asset Usage Tips

### 1. Naming Conventions
```json
{
  "additionalAssets": [
    ["battle_theme", "assets/other/battle.mp3", "mp3"],
    ["item_sword", "assets/other/sword.png", "png"],
    ["emotion_happy", "assets/other/happy_alt.png", "png"]
  ]
}
```
- Use category prefixes (battle_, item_, emotion_, etc.)
- Lowercase English recommended
- Don't include extension in asset name

### 2. Folder Organization
```
assets/
├── icon/
│   └── main.png
├── emotions/
│   ├── happy.png
│   ├── sad.png
│   └── angry.png
└── other/
    ├── bgm/
    │   ├── battle.mp3
    │   └── calm.mp3
    ├── items/
    │   ├── sword.png
    │   └── shield.png
    └── effects/
        └── explosion.gif
```

### 3. Conditional Asset Loading

**With trigger scripts:**
```lua
-- Play BGM only for specific events
if scene == "battle" then
  return "{{bgm::battle_theme}}"
end
```

**CBS conditionals:**
```
{{#when {{getvar::location}} == castle}}
  {{bg::castle_background}}
{{/when}}
```

---

## Important Notes
- When saving assets on the web, be careful as files with the same name may be overwritten.
- Even after deleting assets on the web, files may remain in the assets/ folder.

## Asset-Related CBS Functions

### `{{emotionlist}}`
Returns a JSON array of available emotion images.

```
{{emotionlist}}
// 출력: ["happy","sad","angry","neutral"]
```

### `{{assetlist}}`
Returns a JSON array of available additional assets.

```
{{assetlist}}
// Output: ["background_music","item_image","cutscene_video"]
```

---

## Summary

| Field | Purpose | Array Structure | Required |
|------|------|-----------|-----------|
| `image` | Character Icon | String | Optional |
| `emotionImages` | Emotion Images | `[name, path]` | Optional |
| `additionalAssets` | Additional Media | `[name, path, extension]` | Optional |
| `ccAssets` | Card Metadata | Object Array | Auto-generated |

**Recommended Usage:**
- `emotionImages`: When the character needs to show various expressions
- `additionalAssets`: When additional content like backgrounds, items, BGM, etc. is needed
- Combine with CBS/trigger scripts for dynamic presentations
