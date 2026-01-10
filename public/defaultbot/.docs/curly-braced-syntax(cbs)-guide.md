# RisuAI CBS (Curly Braced Syntax)

This document is based on the original work by @Serblue.

## CBS Overview

**CBS (Curly Braced Syntaxes)** is a template syntax in the format `{{syntax}}` for inserting special values into text in RisuAI.

### Basic Rules
- **Usage Location**: Can be used in almost all text fields including `content/desc.md`, `content/firstMessage.md`, `content/lorebook/*.md`, `scripts/customscript/accent.md`, etc.
- **Case Insensitive**: `{{user}}`, `{{User}}`, `{{USER}}` are all identical
- **Nestable**: CBS can be used within CBS, like `{{calc::{{getvar::a}}+{{getvar::b}}}}`
- **Parameter Separator**: Use `::` (double colon)
- **Array Syntax**: Create arrays in format `{{array::A::B::C...}}`
- **Block Syntax**: Start with `{{#NAME A}}` and end with `{{/NAME}}` or `{{/}}`

---

## 1. Data Syntaxes

### Basic Information
- `{{char}}` / `{{bot}}` - Returns current character's name or nickname
- `{{user}}` - Returns current user's name
- `{{description}}` / `{{char_desc}}` / `{{chardesc}}` - Returns character's description field
- `{{personality}}` / `{{char_persona}}` / `{{charpersona}}` - Returns character's personality field
- `{{scenario}}` - Returns character interaction scenario/setting
- `{{exampledialogue}}` / `{{example_dialogue}}` / `{{examplemessage}}` - Returns character's example dialogues/messages
- `{{persona}}` / `{{user_persona}}` / `{{userpersona}}` - Returns user persona description
- `{{lorebook}}` / `{{world_info}}` / `{{worldinfo}}` - Returns active lorebook entries as JSON array

### Chat Related
- `{{trigger_id}}` / `{{triggerid}}` - Returns the ID value of the element that triggered manual trigger
- `{{previouscharchat}}` / `{{lastcharmessage}}` - Returns last message sent by character
- `{{previoususerchat}}` / `{{lastusermessage}}` - Returns last message sent by user
- `{{history}}` / `{{messages}}` - Returns chat history as JSON array
- `{{chatindex}}` / `{{chat_index}}` - Returns current message index as string
- `{{lastmessage}}` - Returns content of last message in current chat
- `{{lastmessageid}}` / `{{lastmessageindex}}` - Returns index of last message
- `{{previouschatlog}}` / `{{previous_chat_log}}` - Returns message content at specified index
- `{{firstmsgindex}}` / `{{first_msg_index}}` - Returns selected first message/alternate greeting index
- `{{userhistory}}` / `{{user_history}}` - Returns all user messages in current chat as JSON array
- `{{charhistory}}` / `{{char_history}}` - Returns all character messages in current chat as JSON array

### System Information
- `{{model}}` - Returns ID of currently selected AI model (e.g., "gpt-4", "claude-3")
- `{{axmodel}}` - Returns currently selected auxiliary model ID
- `{{role}}` - Returns role of current message ("user", "char", "system")
- `{{maxcontext}}` - Returns maximum context length setting as string
- `{{screenwidth}}` / `{{screen_width}}` - Returns current screen/viewport width as pixel string
- `{{screenheight}}` / `{{screen_height}}` - Returns current screen/viewport height as pixel string

### System Prompts
- `{{mainprompt}}` / `{{main_prompt}}` / `{{system_prompt}}` - Returns main system prompt provided to AI model
- `{{jb}}` / `{{jailbreak}}` - Returns jailbreak prompt text
- `{{globalnote}}` / `{{ujb}}` / `{{global_note}}` - Returns global note (system note) text

---

## 2. Time Syntaxes

### Basic Time
- `{{time}}` - Returns current local time in HH:MM:SS format
- `{{date}}` - Returns current date in YYYY-M-D format
- `{{isotime}}` - Returns current UTC time in HH:MM:SS format
- `{{isodate}}` - Returns current UTC date in YYYY-M-D format
- `{{unixtime}}` - Returns current Unix timestamp as second-based string

### Message Time
- `{{messagetime}}` / `{{message_time}}` - Returns time when current message was sent in local time format
- `{{messagedate}}` / `{{message_date}}` - Returns date when current message was sent in local date format
- `{{messageidleduration}}` / `{{message_idle_duration}}` - Time interval (HH:MM:SS) between current message and previous user message
- `{{idleduration}}` / `{{idle_duration}}` - Elapsed time (HH:MM:SS) since user's last message
- `{{messageunixtimearray}}` / `{{message_unixtime_array}}` - Returns all message timestamps as JSON array

---

## 3. Asset and Media Syntaxes

### Asset Display
- `{{asset::A}}` - Display additional asset A as appropriate element type
- `{{emotion::A}}` - Display emotion image A as image element
- `{{audio::A}}` - Display audio asset A as audio element
- `{{bg::A}}` - Display background image A as background image element
- `{{bgm::A}}` - Insert background music control element
- `{{video::A}}` - Display video asset A as video element
- `{{video-img::A}}` - Display video asset A like an image
- `{{image::A}}` - Display image asset A as image element
- `{{img::A}}` - Display A as unstyled image element
- `{{path::A}}` - Returns path data of additional asset A

### Inlay Assets
- `{{inlay::A}}` - Display unstyled inlay asset A (not inserted into model request)
- `{{inlayed::A}}` - Display styled inlay asset A (not inserted into model request)
- `{{inlayeddata::A}}` - Display styled inlay asset A (inserted into model request)

### Asset Lists
- `{{assetlist}}` - Returns current character's additional asset names as JSON array
- `{{emotionlist}}` - Returns current character's emotion image names as JSON array
- `{{chardisplayasset}}` - Returns character display asset names as JSON array
- `{{source::A}}` - Returns profile source URL of user or character (A is "user" or "char")

---

## 4. Math Syntaxes

### Basic Calculation
- `{{calc::A}}` / `{{? A}}` - Evaluate math expression A and return result as string

### Comparison Functions
- `{{equal::A::B}}` - Returns "1" if A equals B, "0" otherwise (string comparison)
- `{{notequal::A::B}}` / `{{not_equal::A::B}}` - Returns "1" if A differs from B, "0" otherwise (string comparison)
- `{{greater::A::B}}` - Returns "1" if A > B, "0" otherwise (numeric comparison)
- `{{less::A::B}}` - Returns "1" if A < B, "0" otherwise (numeric comparison)
- `{{greaterequal::A::B}}` / `{{greater_equal::A::B}}` - Returns "1" if A >= B, "0" otherwise (numeric comparison)
- `{{lessequal::A::B}}` / `{{less_equal::A::B}}` - Returns "1" if A <= B, "0" otherwise (numeric comparison)

### Logic Functions
- `{{and::A::B}}` - Returns "1" only when both A and B are "1"
- `{{or::A::B}}` - Returns "1" if either A or B is "1"
- `{{not::A}}` - Returns "0" if A is "1", "1" otherwise

### Math Functions
- `{{pow::A::B}}` - Returns A to the power of B
- `{{floor::A}}` - Returns largest integer less than or equal to A
- `{{ceil::A}}` - Returns smallest integer greater than or equal to A
- `{{abs::A}}` - Returns absolute value of A
- `{{round::A}}` - Rounds A to nearest integer
- `{{remaind::A::B}}` - Returns remainder of A divided by B (typo preserved)

### Aggregate Functions
- `{{min::A::B::C...}}` - Returns minimum numeric value
- `{{max::A::B::C...}}` - Returns maximum numeric value
- `{{sum::A::B::C...}}` - Returns sum of all numeric values
- `{{average::A::B::C...}}` - Returns arithmetic mean of all numeric values

### Number Formatting
- `{{fixnum::A::B}}` / `{{fix_number::A::B}}` - Rounds number A to B decimal places
- `{{tonumber::A}}` - Extracts numeric characters (0-9) and decimal point from string A

---

## 5. String Syntaxes

### String Tests
- `{{startswith::A::B}}` - Returns "1" if string A starts with B, "0" otherwise
- `{{endswith::A::B}}` - Returns "1" if string A ends with B, "0" otherwise
- `{{contains::A::B}}` - Returns "1" if string A contains B, "0" otherwise

### String Conversion
- `{{lower::A}}` - Converts all characters in A to lowercase
- `{{upper::A}}` - Converts all characters in A to uppercase
- `{{capitalize::A}}` - Converts only first character of A to uppercase
- `{{trim::A}}` - Removes leading and trailing whitespace from A
- `{{reverse::A}}` - Reverses character order of string A
- `{{replace::A::B::C}}` - Replaces all occurrences of B with C in A
- `{{length::A}}` - Returns length of string A as number

### Unicode Processing
- `{{unicodeencode::A}}` / `{{unicode_encode::A}}` - Returns Unicode code point of first character in A
- `{{unicodedecode::A}}` / `{{unicode_decode::A}}` - Converts Unicode code point A to corresponding character
- `{{u::A}}` / `{{ue::A}}` - Converts hexadecimal Unicode code A to character

---

## 6. Formatting Syntaxes

### Line Breaks
- `{{br}}` / `{{newline}}` - Returns literal newline character (\n)
- `{{cbr}}` / `{{cnl}}` / `{{cnewline}}` - Returns escaped newline character (\\n)

### Empty Content
- `{{blank}}` / `{{none}}` - Returns empty string

### Bracket Display
- `{{decbo}}` / `{{bo}}` - Display { not parsed as CBS
- `{{decbc}}` / `{{bc}}` - Display } not parsed as CBS
- `{{displayescapedbracketopen}}` / `{{debo}}` / `{{(}}` - Display ( without interfering with parsing
- `{{displayescapedbracketclose}}` / `{{debc}}` / `{{)}}` - Display ) without interfering with parsing
- `{{displayescapedanglebracketopen}}` / `{{deabo}}` / `{{<}}` - Display < without interfering with HTML parsing
- `{{displayescapedanglebracketclose}}` / `{{deabc}}` / `{{>}}` - Display > without interfering with HTML parsing
- `{{displayescapedcolon}}` / `{{dec}}` / `{{:}}` - Display : not parsed as CBS separator
- `{{displayescapedsemicolon}}` / `{{;}}` - Display ; without interfering with parsing

---

## 7. UI and Display Syntaxes

### Interactive Elements
- `{{button::A::B}}` - Create HTML button with text A and trigger action B
- `{{risu::A}}` - Display RisuAI logo at A pixel size (default 45px)

### File Display
- `{{file::A::B}}` - Display mode: Display filename A in formatted div. Otherwise: Decode base64 content B to UTF-8 text

### Comments and Documentation
- `{{comment::A}}` - Display comment A in formatted div in display mode
- `{{hiddenkey::A}}` / `{{hidden_key::A}}` - Acts as lorebook activation key but not included in model request
- `{{//A}}` - Comment A removed during parsing

### Special Display
- `{{tex}}` - Render TeX/LaTeX mathematical expressions
- `{{ruby}}` - Ruby annotations (pronunciation display)
- `{{codeblock}}` - Display code blocks
- `{{bkspc}}` - Backspace character
- `{{erase}}` - Erase text
- `{{__}}` - Display underscore

---

## 8. Random and Probability Syntaxes

### Random Generation
- `{{random}}` - Returns random number between 0 and 1
- `{{randint::A::B}}` - Returns random integer between A and B (inclusive). Returns "NaN" for invalid arguments
- `{{pick::A::B...}}` - Similar to random but uses hash-based deterministic selection for consistent results across messages (parameters required, returns first parameter in tokenization mode)
- `{{roll::A}}` - Simulate dice roll using RPG notation (XdY). Defaults to 1d6 without arguments. Single number treated as number of sides
- `{{rollp::A}}` - Similar to roll but uses hash-based randomization for consistent results within same message
- `{{dice::A}}` - Simulate dice roll using standard RPG notation. Returns sum of all dice
- `{{hash::A}}` - Generate deterministic 7-digit hash from input A. Same input always generates same output

---

## 9. Module and Asset Syntaxes

### Module Information
- `{{module_enabled::A}}` / `{{moduleenabled::A}}` - Returns "1" if module with namespace A is enabled, "0" otherwise
- `{{module_assetlist::A}}` / `{{moduleassetlist::A}}` - Returns JSON array of asset names available in module A. Returns empty string if module not found

---

## 10. Metadata Syntaxes

### System Metadata
- `{{metadata::mobile}}` - Returns "1" if mobile device, "0" otherwise
- `{{metadata::local}}` - Returns "1" if local/Tauri app, "0" otherwise
- `{{metadata::node}}` - Returns "1" if node server, "0" otherwise
- `{{metadata::risutype}}` - Returns type: 'local', 'node', or 'web'

### Version Information
- `{{metadata::version}}` - Returns full version string
- `{{metadata::majorversion}}` / `{{metadata::majorver}}` / `{{metadata::major}}` - Returns major version number

### Language and Localization
- `{{metadata::language}}` / `{{metadata::locale}}` / `{{metadata::lang}}` - Returns current language setting
- `{{metadata::browserlanguage}}` / `{{metadata::browserlocale}}` / `{{metadata::browserlang}}` - Returns browser's language setting

### Model Information
- `{{metadata::modelshortname}}` - Returns model's short name
- `{{metadata::modelname}}` - Returns model's full name
- `{{metadata::modelinternalid}}` - Returns model's internal ID
- `{{metadata::modelformat}}` - Returns model's format type
- `{{metadata::modelprovider}}` - Returns model's provider
- `{{metadata::modeltokenizer}}` - Returns model's tokenizer
- `{{metadata::maxcontext}}` - Returns maximum context setting

### Special Metadata
- `{{metadata::imateapot}}` - Easter egg: returns 🫖
- `{{iserror::A}}` - Returns "1" if A starts with "error:" (case insensitive), "0" otherwise

---

## 11. Conditional Syntaxes

### System State
- `{{prefill_supported}}` / `{{prefillsupported}}` / `{{prefill}}` - Returns "1" if current model ID starts with "claude", "0" otherwise (checks if Claude model)
- `{{jbtoggled}}` - Returns "1" if jailbreak toggle is enabled, "0" otherwise
- `{{isfirstmsg}}` / `{{is_first_msg}}` / `{{is_first_message}}` / `{{isfirstmessage}}` - Returns "1" if current context is first message, "0" otherwise

### Collection Conditions
- `{{all::A::B::C...}}` - Returns "1" if all provided values are "1", "0" otherwise. Logical AND operation (single parameter treated as array)
- `{{any::A::B::C...}}` - Returns "1" if any provided value is "1", "0" otherwise. Logical OR operation (single parameter treated as array)

---

## 12. Variable Syntaxes

### Chat Variables
- `{{getvar::A}}` - Returns value of chat variable A (empty string if undefined)
- `{{setvar::A::B}}` - Set chat variable A to B (only executes when runVar is true)
- `{{addvar::A::B}}` - Add numeric value B to chat variable A (only executes when runVar is true)
- `{{setdefaultvar::A::B}}` - Set variable A to B only when it doesn't exist or is empty

### Temporary Variables
- `{{tempvar::A}}` / `{{gettempvar::A}}` - Returns value of temporary variable A
- `{{settempvar::A::B}}` - Set temporary variable A to B

### Global Variables
- `{{getglobalvar::A}}` - Returns value of global variable A

### Control Flow
- `{{return::A}}` - Set return value to A and force terminate script

---

## 13. Enhanced Array Syntaxes

### Array Creation/Manipulation
- `{{makearray::A::B::C...}}` / `{{array::}}` / `{{a::}}` - Create JSON array with elements A, B, C...
- `{{arraylength::A}}` / `{{array_length::A}}` - Returns length of JSON array A as string
- `{{arrayelement::A::B}}` / `{{array_element::A::B}}` - Returns element at index B of array A
- `{{arraypush::A::B}}` / `{{array_push::A::B}}` - Returns array with element B added to end of array A
- `{{arraypop::A}}` / `{{array_pop::A}}` - Returns array with last element removed from array A
- `{{arrayshift::A}}` / `{{array_shift::A}}` - Returns array with first element removed from array A
- `{{arraysplice::A::B::C::D}}` / `{{array_splice::A::B::C::D}}` - Modify array A: remove C elements from index B, insert D
- `{{arrayassert::A::B::C}}` / `{{array_assert::A::B::C}}` - Set element C at index B of array A only when index is out of range

### Array Transformation
- `{{split::A::B}}` - Split string A by separator B and return as JSON array
- `{{join::A::B}}` - Join elements of JSON array A with separator B
- `{{spread::A}}` - Join elements of JSON array A with "::" separator
- `{{filter::A::B}}` - Filter array A with option B: "nonempty", "unique", or "all"

### Collection Operations
- `{{range::A}}` - Generate range based on array A parameters

---

## 14. Enhanced Dictionary Syntaxes

### Dictionary Manipulation
- `{{makedict::A=B::C=D...}}` / `{{dict::}}` / `{{object::}}` / `{{o::}}` / `{{d::}}` - Create JSON object with key=value pairs
- `{{dictelement::A::B}}` / `{{dict_element::A::B}}` / `{{object_element::A::B}}` - Returns value of key B in dictionary A
- `{{objectassert::A::B::C}}` / `{{dict_assert::A::B::C}}` - Set property B of dictionary A to C only when property doesn't exist
- `{{element::A::B}}` / `{{ele::A::B}}` - Navigate nested objects/arrays using path B

---

## 15. Block Syntaxes

### Conditional Blocks
- `{{#if_pure A}}...{{/if_pure}}` - Conditional statement preserving indentation/whitespace handling
- `{{#when A}}...{{/when}}` - Advanced conditional statement with operator support
- `{{:else}}` - Else statement for #when block

### Content Protection
- `{{#pure}}...{{/pure}}` - Display content without CBS processing (no longer recommended due to reparsing issues)
- `{{#puredisplay}}...{{/puredisplay}}` - Display content without CBS processing (useful for raw HTML)

### Iteration Blocks
- `{{#each A B}}...{{/each}}` - Repeat content for each element in array A, current element accessible as B
- `{{slot::A}}` - Used to access specific slot or property in various CBS functions

### Function Blocks
- `{{position::A}}` - Define position for use with @@position <positionName> decorator

---

## 16. Utility Syntaxes

### Number Conversion
- `{{fromhex::A}}` - Convert hexadecimal A to decimal
- `{{tohex::A}}` - Convert decimal A to hexadecimal

### Encryption/Decryption
- `{{xor::A}}` / `{{xorencrypt::A}}` / `{{xorencode::A}}` - Encrypt string A with XOR cipher using 0xFF key, encode to base64
- `{{xordecrypt::A}}` / `{{xordecode::A}}` - Decrypt base64-encoded XOR string A to original text
- `{{crypt::A}}` / `{{crypto::A}}` / `{{caesar::A}}` - Caesar cipher with default shift 32768

## ⚠️ Warnings

### 1. `{{#if}}` Not Recommended

`{{#if}}` is no longer recommended. **Use `{{#when}}` instead.**

❌ **Incorrect Usage**:
```cbs
{{#if {{getvar::level}}>5}}
Text
{{/if}}
```

✅ **Correct Usage**:
```cbs
{{#when {{? {{getvar::level}}>5}}}}
Text
{{/when}}
```

### 2. Trigger Scripts Recommended for Variable Setting

Variable setting CBS like `{{setvar}}` and `{{addvar}}` only work in limited contexts. For complex variable manipulation, it's recommended to use [`trigger scripts`](./triggerscript-guide.md).

**Reasons**:
- CBS variable setting only works in chat context
- Doesn't work in HTML code insertion or non-chat environments
- Trigger scripts are more powerful and stable

### 3. Be Careful with Array/Dictionary Nesting

**Prohibited Usage**:
- Dictionary inside array: ❌
- Dictionary inside dictionary: ❌
- Array inside dictionary (not recommended): ⚠️

**Correct Method**:
If you need complex data structures, use [`trigger scripts`](./triggerscript-guide.md):

---

## Usage Guidelines

### General Limitations
1. **Chat Context Dependency**: Variable setting functions (`{{setvar}}`, `{{addvar}}`, `{{setdefaultvar}}`) only work in chat context where runVar is true, and do not work in HTML code insertion or other non-chat environments
2. **Tokenization Mode**: Many time and random functions behave differently in tokenization mode (returning "00:00:00" or first parameter)
3. **Message Context**: Functions like `{{messagetime}}`, `{{role}}`, `{{chat_index}}` return different values or error messages in non-chat contexts
4. **Index Validation**: Array and chat history functions return "null", "Out of range", or error messages for invalid indices
5. **Asset Scope**: Asset-related functions only work with current character's assets
6. **Temporary Data**: Temporary variables and function arguments disappear after script execution ends
7. **Implementation Preservation**: Some functions preserve typos for compatibility (e.g., `{{remaind}}`)

### Best Practices
1. **Context Awareness**: Use variable setting functions only in appropriate chat context, not in HTML code or general text processing
2. **Error Handling**: Always check for potential null returns or error messages from context-dependent functions
3. **Tokenization Consideration**: Be aware that random and time functions may return different values in tokenization mode
4. **Index Safety**: Validate array indices and message indices before use to avoid "Out of range" errors
5. **Function Composition**: Use function blocks for complex, reusable logic
6. **Conditional Selection**: Use #when for advanced conditions with operators
7. **Asset Management**: Remember that asset functions only work with current character's assets

---

## References

- **Complete CBS Function List**: [`src/ts/cbs.ts`](/src/ts/cbs.ts)
- **CBS Execution Logic**: [`src/ts/process/index.svelte.ts`](/src/ts/process/index.svelte.ts) 