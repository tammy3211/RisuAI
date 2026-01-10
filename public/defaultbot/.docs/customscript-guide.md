# Custom Script Usage Guide

Custom scripts are a powerful feature that allows you to dynamically modify chat input, output, prompts, screen display, and more using regular expressions.

## 📁 Folder Structure

```
/save/{character_name}/
├── scripts/
│   ├── customscript.json       # Custom script metadata (required)
│   └── customscript/           # Output content files (.md files)
│       ├── accent.md
│       ├── action_emphasis.md
│       └── filters/
│           └── text_emphasis.md
```

## 📋 customscript.json Structure

`customscript.json` is a JSON file that defines all custom scripts.

### Basic File Structure

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "Script title",
      "in": "Regular expression pattern",
      "out": {
        "$ref": "./customscript/accent.md"
      },
      "type": "editoutput",
      "flag": "g",
      "ableFlag": true
    }
  ]
}
```

### Top-Level Fields

- **`type`** (string, required): Script type, always set to `"regex"`
- **`data`** (array, required): Array of custom script items

### Script Item Fields

- **`comment`** (string, required): Script title/description
  - For management and identification
  - Example: `"Convert emoticons to text"`, `"Emphasize action descriptions"`

- **`in`** (string, required): Regular expression pattern to match
  - Uses JavaScript regex syntax
  - Example: `":(\\)|\\(|D|P|O)"`, `"\\*([^*]+)\\*"`
  - **CBS Available**: Can use CBS syntax if `<cbs>` is included in flag

- **`out`** (object or string): Output content
  - **Recommended**: Reference `.md` file in `customscript/` folder using `$ref` object
  - Simple replacements can use direct string: `"*$1*"`
  - **CBS Available**: Can use `{{getvar::variable_name}}` etc.
  - **Path**: Use relative path (`./customscript/`) or absolute path (`scripts/customscript/`)
  - **Details**: See [$ref system section in README.md](../README.md#ref-file-reference-system)

- **`type`** (string, required): When to apply the script
  - `"editinput"`: Modify user input (before sending)
  - `"editoutput"`: Modify AI response (after generation)
  - `"editprocess"`: Modify prompt (before API send)
  - `"editdisplay"`: Modify screen display (during rendering)

- **`flag`** (string): Regular expression flags and special flags
  
  **Regular Expression Flags** (can be combined):
  - `"g"`: Global matching (all matches)
  - `"i"`: Case insensitive
  - `"m"`: Multiline mode (^ and $ match start/end of each line)
  - `"u"`: Unicode mode
  - `"s"`: dotAll mode (. matches newline characters too)
  
  **Special Flags** (can be used with regex flags):
  - `"<order {number}>"`: Adjust matching priority (higher number = higher priority)
  - `"<cbs>"`: Enable CBS syntax (can use CBS in in field)
  - `"<move_top>"`: Move matched content to top of text
  - `"<move_bottom>"`: Move matched content to bottom of text
  - `"<repeat_back>"`: Repeat matched content after original
  - `"<no_end_nl>"`: Remove newline at end of output
  
  **Combination Examples**:
  - `"gi"`: Global + case insensitive
  - `"gm"`: Global + multiline
  - `"g<cbs>"`: Global + CBS enabled
  - `"gi<move_top>"`: Global + case insensitive + move to top

- **`ableFlag`** (boolean, required): Whether to use flags
  - `true`: Use flags from flag field
  - `false`: Ignore flags (default g<order 0> applied)

## 🎯 Type Detailed Explanation

### editinput
Modifies user-entered text **before sending**.

**Usage Examples**:
- Emoticon conversion
- Automatic typo correction
- Spacing normalization

### editoutput
Modifies AI-generated response **after generation**.

**Usage Examples**:
- Emphasize action descriptions (`*action*` → `<em>action</em>`)
- Replace specific words
- Unify output format

### editprocess
Modifies **prompt** sent to LLM. Not reflected in chat data.

**Usage Examples**:
- Dynamically change system prompt
- Insert specific keywords
- Adjust context

### editdisplay
Modifies **content displayed** on chat screen. Not reflected in chat data.

**Usage Examples**:
- Add visual effects with HTML/CSS
- Render status window
- Insert custom UI elements
- Hide specific phrases

## 📂 customscript Folder Usage

### Recommendations

Except for simple replacements, **it's strongly recommended to create and manage `.md` files in the `scripts/customscript/` folder**.

### Usage Method

1. **Create File**: Create `scripts/customscript/accent.md` file
2. **Write Content**: Write text to output (CBS available)
3. **Reference in JSON**: `"out": {"$ref": "./customscript/accent.md"}`

### Using Subfolders

```
scripts/customscript/
├── accent.md
├── action_emphasis.md
└── filters/
    ├── text_emphasis.md
    └── profanity_filter.md
```

**Reference Example**: `{"$ref": "./customscript/filters/text_emphasis.md"}`

> For detailed explanation of path specification, see the [$ref system section in README.md](../README.md#ref-file-reference-system).

## 💡 CBS (Curly Braced Syntaxes) 사용

커스텀 스크립트에서 CBS 문법을 사용할 수 있습니다.

### out 파일에서 CBS 사용

**scripts/customscript/character_status.md**:
```markdown
<div class="status-card">
  <h3>{{getvar::char_name}}</h3>
  <p>HP: {{getvar::hp}}/{{getvar::max_hp}}</p>
  <p>Level: {{getvar::level}}</p>
</div>
```

**Reference in customscript.json**:
```json
{
  "type": "regex",
  "data": [
    {
      "comment": "Display status window",
      "in": "<status>",
      "out": {
        "$ref": "./customscript/character_status.md"
      },
      "type": "editdisplay",
      "flag": "g",
      "ableFlag": true
    }
  ]
}
```

### Using CBS in in Field

If you include `<cbs>` in `flag`, you can also use CBS in the `in` field.

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "Variable-based matching",
      "in": "{{getvar::trigger_word}}",
      "out": {
        "$ref": "./customscript/matched.md"
      },
      "type": "editinput",
      "flag": "g<cbs>",
      "ableFlag": true
    }
  ]
}
```

### Main CBS Functions

- `{{getvar::variable_name}}` : Get variable
- `{{calc::expression}}` : Calculate expression
- `{{random::option1::option2}}` : Random selection
- `{{roll::2d6}}` : Roll dice
- `{{#when condition}}...{{/when}}` : Conditional statement
- `{{raw::assetname}}` : Asset path

> For detailed CBS syntax, refer to [`cbs.md`](cbs.md).

## HTML/CSS Usage

You can freely use HTML and CSS in the `out` field.

```html
<div class="custom-box">
  <h2>Status Information</h2>
  <p>HP: {{getvar::hp}} / {{getvar::max_hp}}</p>
</div>
```

Supports latest HTML syntax and CSS styles. However, there may be constraints on some CSS selectors.
Please familiarize yourself with the constraints in `html-guide.md`.

For more details, refer to [`html-guide.md`](html-guide.md).

## ⚠️ Warnings

1. **Top-level Structure**: customscript.json must have `{"type": "regex", "data": [...]}` structure
2. **$ref Format**: out field should use `{"$ref": "./customscript/filename.md"}` object format (recommended)
3. **Regex Escaping**: In JSON, backslashes (`\`) must be written twice (`\\d`, `\\*`, etc.)
4. **flag Combination**: Multiple flags are written consecutively (`"gi"`, `"gm"`, `"g<cbs>"`)
5. **File Path**: Relative paths start with `./customscript/` (e.g., `{"$ref": "./customscript/accent.md"}`)