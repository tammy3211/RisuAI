# HTML Guide: HTML/CSS Usage

This guide covers using HTML/CSS in regex scripts, lua, backgroundHTML.md, and more.

## 🎨 HTML/CSS Usage Precautions

There are several constraints when using HTML/CSS in Risuai.

### 💡 Recommended CSS Style Location

**Important**: It's strongly recommended to declare `<style>` tags in **`content/backgroundHTML.md`** rather than in custom script out files.

**Reasons**: 
- CSS gets duplicated every time regex matching occurs, causing **performance degradation**
- Declaring in backgroundHTML.md loads it only once, making it efficient

**Recommended Structure**:
```
content/
└── backgroundHTML.md   # Declare all CSS styles here

scripts/customscript/
└── status_display.md   # Write only HTML (exclude CSS)
```

**content/backgroundHTML.md Example**:
```html
<style>
.status-panel { background: #667eea; border-radius: 12px; }
.status-panel.x-risu-header { font-size: 1.2em; font-weight: bold; }
.status-panel.x-risu-stat { display: flex; justify-content: space-between; }
</style>
```

**scripts/customscript/status_display.md Example** (HTML only without CSS):
```html
<div class="status-panel">
  <div class="status-panel header">📊 Character Status</div>
  <div class="status-panel stat"><span>HP:</span><span>{{getvar::hp}}</span></div>
</div>
```

### ❌ Not Available

- `:root` selector
- JavaScript (`<script>` tag)
- `<input type="radio">` (not recommended due to parsing issues)
- **HTML structures with empty lines** (markdown/HTML simultaneous parsing issue)

### ⚠️ HTML Structure Writing Rules

**Important**: Inserting empty lines (`\n`) between div tags causes parsing errors.

**❌ Incorrect Usage - With Empty Lines**:
```html
<div>
  <div>Content1</div>

  <div>Content2</div>
</div>
```

**✅ Correct Usage - Continuous Without Empty Lines**:
```html
<div>
  <div>Content1</div>
  <div>Content2</div>
</div>
```

Or **write in one line**:
```html
<div><div>Content1</div><div>Content2</div></div>
```

> **Reason**: When parsing markdown and HTML simultaneously, empty lines can break the HTML structure.

### ✅ CSS Class Naming Rules

**Important**: There are parsing issues when using consecutive class selectors (`.class.subclass`) in CSS.

#### Basic Principles
**CSS Definition**:
```css
/* ❌ Incorrect usage - causes parsing errors */
.status.active { color: green; }

/* ✅ Correct usage - x-risu- prefix required */
.status.x-risu-active { color: green; }
```

**HTML Usage**:
```html
<!-- Write normally in HTML -->
<div class="status active">Active</div>
```

> **Parsing note**: HTML `class="status active"` is automatically converted to `class="x-risu-status x-risu-active"`, which matches the CSS selector `.status.x-risu-active`.

#### Parent-Child Selectors are Exception

Parent-child relationships with spaces do **not require** the `x-risu-` prefix:

```css
/* ✅ Use parent-child relationships as is */
.parent .child { color: blue; }
.container > .item { margin: 10px; }
```

**Summary**: 
- `.class.subclass` (attached) → Use `.class.x-risu-subclass`
- `.parent .child` (with space) → Use as is

## CBS Integration

HTML/CSS can be used with CBS templates. Since CBS is processed before HTML, you can insert CBS variables into HTML or apply them to CSS classes.

```html
<div class="status-panel {{getvar::status_class}}">
  <div class="status-panel header">📊 {{getvar::char_name}} Status</div>
  <div class="status-panel stat">
    <span>HP:</span>
    <span>{{getvar::hp}}/{{getvar::max_hp}}</span>
  </div>
</div>
```

For more details, refer to the [CBS Guide](curly-braced-syntax(cbs)-guide.md).

## 📝 Practical Example: Status Window Output

### customscript.json

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "Display status window",
      "in": "<status>\\[(.+?)\\]</status>",
      "out": {
        "$ref": "./customscript/status_display.md"
      },
      "type": "editdisplay",
      "flag": "g",
      "ableFlag": true
    }
  ]
}
```

### content/backgroundHTML.md

```html
<style>
.status-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: 'Segoe UI', sans-serif;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.status-panel.x-risu-header {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-panel.x-risu-stat {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}
</style>
```

### scripts/customscript/status_display.md

```html
<div class="status-panel">
  <div class="status-panel header">📊 Character Status</div>
  <div class="status-panel stat">
    <span>Name:</span>
    <span>{{getvar::char_name}}</span>
  </div>
  <div class="status-panel stat">
    <span>HP:</span>
    <span>{{getvar::hp}}/{{getvar::max_hp}}</span>
  </div>
  <div class="status-panel stat">
    <span>MP:</span>
    <span>{{getvar::mp}}/{{getvar::max_mp}}</span>
  </div>
  <div class="status-panel stat">
    <span>Level:</span>
    <span>{{getvar::level}}</span>
  </div>
  <div class="status-panel stat">
    <span>EXP:</span>
    <span>{{getvar::exp}}/{{calc::{{getvar::level}}*100}}</span>
  </div>
</div>
```

### Usage

When you type the following in chat:
```
<status>[Name: Airisu | HP: 80/100 | MP: 50/100 | Level: 15]</status>
```

A beautiful status window with applied CSS will be displayed on screen.

## 📚 References

- **CBS Syntax**: [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax(cbs)-guide.md) - CBS template usage
- **Custom Script Processing Logic**: [`src/ts/process/scripts.ts`](/src/ts/process/scripts.ts)

## ⚠️ Warnings

1. **HTML/CSS Constraints**: Cannot use `:root`, `<script>`, `radio`
2. **Class Naming**: Subclasses must have `x-risu-` prefix
3. **Performance Consideration**: Write CSS in backgroundHTML.md, only HTML in custom scripts