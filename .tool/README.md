# JSON Content Splitter

Automatically split long content in `lorebook.json` and `customscript.json` files into separate `.md` files and update JSON with `$ref` references.

## Installation

No installation needed. This is a standalone Node.js script.

## Usage

```bash
node .tool/split-json-content.js --input <path> [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--input` | `-i` | Input JSON file path (required) | - |
| `--threshold` | `-t` | Minimum character length to split | 100 |
| `--output` | `-o` | Output directory | Same as input directory |
| `--backup` | `-b` | Create backup file | true |
| `--no-backup` | - | Don't create backup file | - |
| `--dry-run` | `-d` | Preview changes without creating files | false |
| `--help` | `-h` | Show help | - |

### Examples

**1. Process lorebook with default settings:**
```bash
node .tool/split-json-content.js -i save/char1/lorebook.json
```

**2. Process with custom threshold (200 characters):**
```bash
node .tool/split-json-content.js -i save/char1/lorebook.json -t 200
```

**3. Preview changes (dry-run mode):**
```bash
node .tool/split-json-content.js -i save/char1/lorebook.json --dry-run
```

**4. Process customscript with custom output directory:**
```bash
node .tool/split-json-content.js -i save/Luna/scripts/customscript.json -o save/Luna
```

**5. Process without creating backup:**
```bash
node .tool/split-json-content.js -i save/char1/lorebook.json --no-backup
```

## How It Works

### For Lorebook (`lorebook.json`)

1. Reads the `lorebook.json` file
2. Checks each entry's `content` field
3. If content length >= threshold:
   - Extracts content to `content/lorebook/{key-name}.md`
   - Replaces content with `{"$ref": "content/lorebook/{key-name}.md"}`

**Example:**

Before:
```json
{
  "type": "risu",
  "data": [
    {
      "key": "magic system",
      "content": "This is a very long description of the magic system..."
    }
  ]
}
```

After:
```json
{
  "type": "risu",
  "data": [
    {
      "key": "magic system",
      "content": {
        "$ref": "content/lorebook/magic-system.md"
      }
    }
  ]
}
```

And creates: `save/char1/content/lorebook/magic-system.md`

### For Custom Scripts (`customscript.json`)

1. Reads the `customscript.json` file
2. Checks each entry's `out` field (output script)
3. If out length >= threshold:
   - Extracts to `scripts/customscript/{type}-{index}.md`
   - Replaces with `$ref`

**Example:**

Before:
```json
{
  "type": "regex",
  "data": [
    {
      "type": "editoutput",
      "out": "Very long regex script here..."
    }
  ]
}
```

After:
```json
{
  "type": "regex",
  "data": [
    {
      "type": "editoutput",
      "out": {
        "$ref": "scripts/customscript/editoutput-0.md"
      }
    }
  ]
}
```

## Security

⚠️ **Path Traversal Protection**

- Only files within `save/` directory can be processed
- All paths are validated to prevent directory traversal attacks
- Attempts to access files outside `save/` will be blocked

## Output

### Success Example
```
🚀 JSON Content Splitter

📄 Processing: save/char1/lorebook.json
   Type: Lorebook (risu)
   Items: 10
   Threshold: 100 characters
   Output directory: save/char1

📊 Statistics:
   Total items: 10
   Processed: 5
   Skipped (already $ref): 2
   Skipped (below threshold): 3

📁 Files to create:
   ✓ save/char1/content/lorebook/magic-system.md (345 chars)
   ✓ save/char1/content/lorebook/world-history.md (567 chars)
   ✓ save/char1/content/lorebook/character-background.md (234 chars)

💾 Backup created: save/char1/lorebook.json.backup
✅ Updated: save/char1/lorebook.json

✨ Done!
```

### Dry-Run Example
```
📊 Statistics:
   Total items: 10
   Processed: 5
   Skipped (already $ref): 2
   Skipped (below threshold): 3

📁 Files to create:
   ✓ save/char1/content/lorebook/magic-system.md (345 chars)

⚠️  DRY-RUN MODE: No files were actually created
   Remove --dry-run flag to apply changes
```

## Notes

- **Backup files**: Automatically created with `.backup` extension
- **File naming**: 
  - Lorebook: Uses first keyword from `key` field
  - Customscript: Uses `type` field
  - Special characters are sanitized to hyphens
- **Idempotent**: Running multiple times won't create duplicates (skips existing `$ref`)
