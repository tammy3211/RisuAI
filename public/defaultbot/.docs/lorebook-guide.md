# Lorebook Structure and Usage Guide

## 📁 Folder Structure

```
/save/{character_name}/
├── lorebook.json              # Lorebook metadata (required)
└── content/lorebook/          # Lorebook content files (.md files)
    ├── world_setting.md
    ├── character_v.md
    └── important_rules.md
```

## 📋 lorebook.json Structure

`lorebook.json` is a JSON file that defines all lorebook entries.

### Basic File Structure

```json
{
  "type": "risu",
  "ver": 1,
  "data": [
    {
      "key": "keyword1, keyword2, keyword",
      "comment": "Lorebook title",
      "insertorder": 100,
      "mode": "normal",
      "alwaysActive": false,
      "selective": false,
      "secondkey": "",
      "content": {
        "$ref": "content/lorebook/example.md"
      },
      "folder": "",
      "useRegex": false,
      "extentions": {
        "risu_case_sensitive": false
      }
    }
  ]
}
```

### Top-Level Fields

- `type` (string, required): Lorebook type, always set to `"risu"`
- `ver` (number, required): Lorebook version, currently use `1`
- `data` (array, required): Array of lorebook entries

### Each Lorebook Entry Fields

- `key` (string, required): Primary matching keyword(s)
  - Multiple keywords can be specified, separated by commas (`,`)
  - Example: `"world, worldbuilding, setting"`
  - When these keywords appear in the conversation, the lorebook entry is activated

- `comment` (string, required): Lorebook entry title/description
  - Used for management and identification
  - Example: `"Worldbuilding", "Protagonist V"`

- `insertorder` (number, required): Insertion order
  - Higher numbers are placed later in the prompt
  - When lorebook entries are trimmed due to token limits, **earlier entries (lower numbers) are excluded first**
  - Recommended: 100 for important entries, 80-90 for less important ones

- `mode` (string, required): Lorebook type
  - `"normal"`: Normal lorebook entry
  - `"folder"`: Folder (for grouping other entries)
  - ⚠️ Do not use other types (`multiple`, `constant`, `child`)

- `alwaysActive` (boolean, required): Whether always active
  - `true`: Always inserted in the prompt without keyword matching
  - `false`: Only activated when keyword is matched
  - Example: Use for important rules or base settings

- `selective` (boolean, required): Whether to use secondary keyword
  - `true`: `key`와 `secondkey` **모두** 매칭되어야 활성화
  - `false`: `key`만 매칭되면 활성화

- `secondkey` (string): 2차 매칭 키워드
  - `selective: true`일 때만 사용
  - `key`와 `secondkey` 모두 매칭되어야 활성화됨

- `content` (object or string, required): Lorebook content
  - **Recommended**: Reference `.md` files in `content/lorebook/` folder with `$ref` object
  - Example: `{"$ref": "content/lorebook/world_setting.md"}` → Uses `content/lorebook/world_setting.md` file
  - Short content can be entered directly as string: `"This is a short lorebook."`

- `folder` (string): Key of the folder it belongs to
  - Specifies which folder this lorebook entry belongs to
  - Must match the `key` value of a folder
  - Example: `"\uf000folder:world_info"`

- `useRegex` (boolean): Whether to use regular expressions
  - `true`: Interpret `key` as a regular expression
  - `false`: Match as a normal string

- `extentions` (object): Extension options
  - `risu_case_sensitive` (boolean): Whether to match case-sensitively
    - `true`: Match with case sensitivity
    - `false`: Ignore case

## 📂 Folder Usage

### Difference Between Folders and Normal Entries

- **Folder**: Container for grouping other lorebook entries
- **Normal Entry**: Lorebook entry containing actual content

### How to Define a Folder

```json
{
  "key": "\uf000folder:world_info",
  "comment": "🌍 Worldbuilding Folder",
  "insertorder": 100,
  "mode": "folder",
  "alwaysActive": false,
  "selective": false,
  "secondkey": "",
  "content": "",
  "folder": "",
  "useRegex": false,
  "extentions": {
    "risu_case_sensitive": false
  }
}
```

Folder key naming convention (recommended):
- Use `"\uf000folder:folder_name(or_uuid)"` format
- Example: `"\uf000folder:characters"`, `"\uf000folder:world_info"`, `"\uf000folder:de69f788-cd22-4561-aa0d-8579030a5f1d"`

### Adding Entries to a Folder

Enter the folder's `key` value in the `folder` field of a normal entry:

```json
{
  "key": "V, protagonist",
  "comment": "Protagonist V",
  "insertorder": 100,
  "mode": "normal",
  "alwaysActive": false,
  "selective": false,
  "secondkey": "",
  "folder": "\uf000folder:characters",
  "content": {
    "$ref": "content/lorebook/character_v.md"
  },
  "useRegex": false,
  "extentions": {
    "risu_case_sensitive": false
  }
}
```

## 💡 content Folder Usage

### Recommendation

**Strongly recommended** to manage lorebook content by creating `.md` files in the `content/` folder.

### How to Use

1. **Create file**: Create `content/lorebook/world_setting.md` file
2. **Write content**: Write lorebook content in markdown format
3. **Reference in JSON**: `"content": {"$ref": "content/lorebook/world_setting.md"}`

### Utilizing Folder Structure

You can use subfolders within the `content/lorebook/` folder:

```
content/lorebook/
├── world/setting.md       # content/lorebook/world/setting.md
├── world/locations/city.md # content/lorebook/world/locations/city.md
└── characters/hero.md     # content/lorebook/characters/hero.md
```

**Reference format**: `{"$ref": "content/lorebook/folder_name/filename"}`

### Example

**lorebook.json**:
```json
{
  "type": "risu",
  "ver": 1,
  "data": [
    {
      "key": "world, worldbuilding",
      "comment": "Worldbuilding",
      "insertorder": 100,
      "mode": "normal",
      "alwaysActive": false,
      "selective": false,
      "secondkey": "",
      "content": {
        "$ref": "content/lorebook/world_setting.md"
      },
      "folder": "",
      "useRegex": false,
      "extentions": {
        "risu_case_sensitive": false
      }
    }
  ]
}
```

**content/lorebook/world_setting.md**:
```markdown
# Worldbuilding

This world is set in a cyberpunk universe.
2077, a futuristic city dominated by mega-corporations...
```

## 🔧 CBS (Curly Braced Syntaxes) Usage

You can use CBS template syntax `{{}}` in lorebook `content`.

### Main CBS Usage Examples

```markdown
# Character Status

- Name: {{getvar::char_name}}
- Level: {{getvar::char_level}}
- HP: {{calc::{{getvar::base_hp}}+{{getvar::bonus_hp}}}}
- Current Mood: {{random::Good::Neutral::Bad}}

{{#when {{? {{getvar::char_level}}>10}}}}
## Seasoned Warrior
You are a veteran who has experienced countless battles.
{{/when}}
```

### Detailed CBS Syntax

For a complete list of CBS functions and detailed usage, refer to [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax\(cbs\)-guide.md).

## 🏷️ Decorator Syntax

Decorators are advanced options that allow fine-grained control over lorebook entry behavior. Add a line starting with `@@` at the top of a content file to apply the effect.

### Main Decorator List and Descriptions

- `@@depth N` : Insert this lorebook at the Nth depth (importance control)
- `@@reverse_depth N` : Insert at the Nth depth from the end (less important entries)
- `@@activate_only_after N` : Only activate after the Nth message
- `@@activate_only_every N` : Activate periodically every Nth time
- `@@role A` : Insert this lorebook with specific role (A) (`user`, `assistant`, `system`)
- `@@scan_depth N` : Search keywords up to specified depth
- `@@is_greeting N` : Treat as Nth greeting
- `@@position A` : Specify position in prompt (`personality`, `scenario`, `pt_<name>`, etc.)
- `@@ignore_on_max_context` : Ignore when context is full
- `@@additional_keys A,B,C...` : Only activate when additional keywords are present
- `@@exclude_keys A,B,C...` : Deactivate if excluded keywords are present
- `@@probability N` : Activate with N% probability
- `@@activate` : Always activate
- `@@dont_activate` : Never activate

### Usage Example

```markdown
@@role user
@@depth 1
@@activate_only_after 5

This character is the protagonist directly controlled by the player.
...
```

> Multiple decorators can be combined. Write one per line.
> For detailed syntax and behavior, check [`src/ts/process/lorebook.svelte.ts`](/src/ts/process/lorebook.svelte.ts) in the main RisuAI project.

### Notes
- Decorators must be placed at the top of the content file.
- Invalid values or typos may be ignored.
- Actual results may vary depending on prompt structure and token limits.

## 📚 References

- **CBS Syntax**: [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax\(cbs\)-guide.md) - CBS template usage
- **Lorebook Type Definition**: [`src/ts/storage/database.svelte.ts`](/src/ts/storage/database.svelte.ts) (Line 1122-1145)
- **Lorebook Execution Logic**: [`src/ts/process/index.svelte.ts`](/src/ts/process/index.svelte.ts)
- **Decorator Processing**: [`src/ts/process/lorebook.svelte.ts`](/src/ts/process/lorebook.svelte.ts)

## ⚠️ Notes

2. **Top-level structure**: `type`, `ver`, `data` fields are required.
3. **content reference**: Recommended to use `$ref` object format (`{"$ref": "path"}`) to reference external files.
4. **mode attribute**: Only use `normal` and `folder`. Other types are not supported in this project.
5. **Folder key format**: `\uf000folder:name` format recommended (not required)
6. **insertorder**: Use higher numbers for more important entries
7. **content files**: Recommended to save as `.md` files in `content/lorebook/` folder for easier management
8. **Keyword selection**: Avoid too common words, utilize `selective: true` and `secondkey`
