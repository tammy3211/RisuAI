# RisuAI CBS (Curly Braced Syntaxes)

## CBS 개요

**CBS (Curly Braced Syntaxes)**는 RisuAI에서 텍스트에 특수 값을 삽입하기 위한 `{{syntax}}` 형식의 템플릿 문법입니다.

### 기본 규칙
- **사용 위치**: `content/desc.md`, `content/firstMessage.md`, `content/lorebook/*.md`, `scripts/customscript/accent.md` 등 거의 모든 텍스트 필드에서 사용 가능
- **대소문자 구분 없음**: `{{user}}`, `{{User}}`, `{{USER}}` 모두 동일
- **중첩 가능**: `{{calc::{{getvar::a}}+{{getvar::b}}}}` 처럼 CBS 안에 CBS 사용 가능
- **매개변수 구분자**: `::` (더블 콜론) 사용
- **배열 문법**: `{{array::A::B::C...}}` 형식으로 배열 생성
- **블록 문법**: `{{#NAME A}}`로 시작하여 `{{/NAME}}` 또는 `{{/}}`로 종료

---

## 1. Data Syntaxes

### Basic Information
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{user}}` | - | Returns the current user's name. In consistent character mode, returns "username" | - |
| `{{char}}` | `{{bot}}` | Returns current character name or nickname. In consistent character mode returns "botname". Changes based on context in group chat | - |
| `{{description}}` | `{{char_desc}}`, `{{chardesc}}` | Returns character's description field. Text is processed through chat parser. Returns empty string for group chats | - |
| `{{personality}}` | `{{char_persona}}`, `{{charpersona}}` | Returns character's personality field. Text is processed through chat parser. Returns empty string for group chats | - |
| `{{scenario}}` | - | Returns scenario/setting for character interaction. Text is processed through chat parser. Returns empty string for group chats | - |
| `{{exampledialogue}}` | `{{example_dialogue}}`, `{{examplemessage}}` | Returns character's example dialogue/message field. Text is processed through chat parser. Returns empty string for group chats | - |
| `{{persona}}` | `{{user_persona}}`, `{{userpersona}}` | Returns persona description. Text is processed through chat parser | - |
| `{{lorebook}}` | `{{world_info}}`, `{{worldinfo}}` | Returns all active lorebook entries as JSON array. Combines character, chat-specific, and module lorebooks | - |

### Chat Related
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{trigger_id}}` | `{{triggerid}}` | Returns the ID value from the risu-id attribute of the clicked element that triggered the manual trigger. Returns "null" if no ID was provided | Manual trigger only |
| `{{history}}` | `{{messages}}` | Returns chat history as JSON array. Without arguments: full message objects including first message. With "role" argument: messages prefixed with "role: " | - |
| `{{chat_index}}` | `{{chatindex}}` | Returns current message index in chat as string. -1 indicates no specific message context | Returns -1 in non-chat context |
| `{{lastmessage}}` | - | Returns content of the last message in current chat regardless of role. Returns empty string if no character selected | - |
| `{{lastmessageid}}` | `{{lastmessageindex}}` | Returns index of the last message in chat as string (0-based). Returns empty string if no character selected | - |
| `{{previouscharchat}}` | `{{previouscharchat}}`, `{{lastcharmessage}}` | Returns last message sent by character in current chat. Searches backwards from current position to find most recent character message. If no character messages exist, returns first message or selected alternate greeting | - |
| `{{previoususerchat}}` | `{{previoususerchat}}`, `{{lastusermessage}}` | Returns last message sent by user in current chat. Only works when chatID is available (not -1) | Returns empty string if chatID is -1 |
| `{{previouschatlog}}` | `{{previous_chat_log}}` | Retrieves message content at specified index in chat history. Returns "Out of range" if index is invalid | Takes index parameter, returns "Out of range" if index doesn't exist |
| `{{first_msg_index}}` | `{{firstmessageindex}}`, `{{firstmsgindex}}` | Returns index of selected first message/alternate greeting as string. -1 indicates default first message is used | - |
| `{{user_history}}` | `{{user_messages}}`, `{{userhistory}}`, `{{usermessages}}` | Returns all user messages in current chat as JSON array. Each message contains role, data and metadata | - |
| `{{char_history}}` | `{{char_messages}}`, `{{charhistory}}`, `{{charmessages}}` | Returns all character messages in current chat as JSON array. Each message contains role, data and metadata | - |

### System Information
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{model}}` | - | Returns ID of currently selected AI model (e.g. "gpt-4", "claude-3-opus") | - |
| `{{axmodel}}` | - | Returns currently selected sub/auxiliary model ID used for specialized tasks | - |
| `{{role}}` | - | Returns role of current message ("user", "char", "system"). Uses chatRole from conditions if available, "char" for first messages, or actual message role | Returns matcherArg.role ?? 'null' in non-chat context |
| `{{maxcontext}}` | - | Returns maximum context length setting as string (e.g. "4096", "8192") | - |
| `{{screen_width}}` | `{{screenwidth}}` | Returns current screen/viewport width in pixels as string. Updates dynamically with window resizing | - |
| `{{screen_height}}` | `{{screenheight}}` | Returns current screen/viewport height in pixels as string. Updates dynamically with window resizing | - |

### System Prompts
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{main_prompt}}` | `{{mainprompt}}`, `{{system_prompt}}`, `{{systemprompt}}` | Returns main system prompt that provides instructions to AI model. Text is processed through chat parser | - |
| `{{jb}}` | `{{jailbreak}}` | Returns jailbreak prompt text. Text is processed through chat parser | - |
| `{{ujb}}` | `{{globalnote}}`, `{{global_note}}`, `{{systemnote}}`, `{{system_note}}` | Returns global note (system note) text. Text is processed through chat parser | - |

---

## 2. Time Syntaxes

### Basic Time
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{time}}` | - | Returns current local time in HH:MM:SS format. Updates in real-time when called | - |
| `{{date}}` | - | Returns current date in YYYY-M-D format (without arguments) | - |
| `{{isotime}}` | - | Returns current UTC time in HH:MM:SS format | - |
| `{{isodate}}` | - | Returns current UTC date in YYYY-M-D format (month not zero-padded) | - |
| `{{unixtime}}` | - | Returns current unix timestamp in seconds as string | - |

### Formatted Time
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{time::A}}` | `{{datetimeformat::A}}`, `{{date::A}}`, `{{date_time_format::A}}` | Formats current time using custom format string A | - |
| `{{time::A::B}}` | `{{datetimeformat::A::B}}`, `{{date::A::B}}`, `{{date_time_format::A::B}}` | Formats unix timestamp B using format string A | - |

**Supported Format Codes:**
- `YYYY`: Year (4 digits)
- `YY`: Year (2 digits)
- `MM`: Month
- `DD`: Day
- `DDDD`: Day of year
- `HH`: Hour (24-hour)
- `hh`: Hour (12-hour)
- `mm`: Minute
- `ss`: Second
- `A`: AM/PM
- `X`: Unix timestamp
- `x`: Unix timestamp (milliseconds)
- `MMMM`: Full month name
- `MMM`: Short month name
- `dddd`: Full weekday name
- `ddd`: Short weekday name

### Message Time
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{message_time}}` | `{{messagetime}}` | Returns time when current message was sent in local time format. Returns "00:00:00" in tokenization mode | Returns "[Cannot get time]" if chatID is -1, returns "[Cannot get time, message was sent in older version]" for messages without timestamps |
| `{{message_date}}` | `{{messagedate}}` | Returns date when current message was sent in local date format. Returns "00:00:00" in tokenization mode | Returns "[Cannot get time]" if chatID is -1, returns "[Cannot get time, message was sent in older version]" for messages without timestamps |
| `{{message_idle_duration}}` | `{{messageidleduration}}` | Returns time duration between current and previous user messages in HH:MM:SS format | Returns "00:00:00" in tokenization mode, returns "[Cannot get time]" if chatID is -1, returns "[No user message found]" or "[No previous user message found]" if no user messages, returns error for messages without timestamps |
| `{{idle_duration}}` | `{{idleduration}}` | Returns time elapsed since user's last message in HH:MM:SS format | Returns "00:00:00" in tokenization mode or if no messages, returns error for messages without timestamps |
| `{{message_unixtime_array}}` | `{{messageunixtimearray}}` | Returns all message timestamps as JSON array of unix timestamps (milliseconds). Messages without timestamps show as 0 | - |

---

## 3. Asset and Media Syntaxes

### Asset Display
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{asset::A}}` | Display additional asset A as appropriate element type | Current character's assets only |
| `{{emotion::A}}` | Display emotion image A as image element | Current character's assets only |
| `{{audio::A}}` | Display audio asset A as audio element | Current character's assets only |
| `{{bg::A}}` | Display background image A as background image element | Current character's assets only |
| `{{bgm::A}}` | Insert background music control element | Current character's assets only |
| `{{video::A}}` | Display video asset A as video element | Current character's assets only |
| `{{video-img::A}}` | Display video asset A as image-like element | Current character's assets only |
| `{{image::A}}` | Display image asset A as image element | Current character's assets only |
| `{{img::A}}` | Display A as unstyled image element | Current character's assets only |
| `{{raw::A}}` | Returns additional asset A's path data | Current character's assets only |
| `{{path::A}}` | Alias for raw - Returns additional asset A's path data | Current character's assets only |

### Inlay Assets
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{inlay::A}}` | - | Display unstyled inlay asset A, which doesn't insert at model request | - |
| `{{inlayed::A}}` | - | Display styled inlay asset A, which doesn't insert at model request | - |
| `{{inlayeddata::A}}` | - | Display styled inlay asset A, which inserts at model request | - |

### Asset Lists
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{assetlist}}` | Returns JSON array of current character's additional asset names. Returns empty string for groups or characters without assets | Current character only |
| `{{emotionlist}}` | Returns JSON array of current character's emotion image names. Only includes names, not image data | Current character only |
| `{{chardisplayasset}}` | Returns JSON array of character display asset names, filtered by prebuilt asset exclusion settings | Current character only |
| `{{source::A}}` | Returns source URL of user or character's profile. Argument must be "user" or "char" | A="char" for character, "user" for user |

---

## 4. Math Syntaxes

### Basic Calculation
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{? A}}` | `{{calc::A}}` | Evaluates mathematical expression A and returns result as string. Supports basic arithmetic operations | Numbers/boolean values only |

**Supported Operators:**
- `A+B`: Addition
- `A-B`: Subtraction
- `A*B`: Multiplication
- `A/B`: Division
- `A%B`: Modulo
- `A^B`: Exponentiation
- `A||B`: Logical OR (alias: `|`)
- `A&&B`: Logical AND (alias: `&`)
- `!A`: Logical NOT
- `A==B`: Equality (alias: `=`)
- `A!=B`: Inequality
- `A>B`: Greater than
- `A>=B`: Greater than or equal (alias: `≥`)
- `A<B`: Less than
- `A<=B`: Less than or equal (alias: `≤`)
- `$<n>`: Value of chat variable <n>

### Comparison Functions
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{equal::A::B}}` | - | Returns "1" if A equals B exactly (string comparison), "0" otherwise | All types supported |
| `{{not_equal::A::B}}` | `{{notequal::A::B}}` | Returns "1" if A doesn't equal B (string comparison), "0" otherwise | All types supported |
| `{{greater::A::B}}` | - | Returns "1" if A > B (numeric comparison), "0" otherwise | Converts arguments to numbers |
| `{{greater_equal::A::B}}` | `{{greaterequal::A::B}}` | Returns "1" if A >= B (numeric comparison), "0" otherwise | Converts arguments to numbers |
| `{{less::A::B}}` | - | Returns "1" if A < B (numeric comparison), "0" otherwise | Converts arguments to numbers |
| `{{less_equal::A::B}}` | `{{lessequal::A::B}}` | Returns "1" if A <= B (numeric comparison), "0" otherwise | Converts arguments to numbers |

### Logical Functions
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{and::A::B}}` | Returns "1" only if both A and B are "1", "0" otherwise | - |
| `{{or::A::B}}` | Returns "1" if either A or B is "1", "0" otherwise | - |
| `{{not::A}}` | Returns "0" if A is "1", "1" for any other value | - |

### Mathematical Functions
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{pow::A::B}}` | Returns A raised to power B | - |
| `{{floor::A}}` | Returns largest integer less than or equal to A | - |
| `{{ceil::A}}` | Returns smallest integer greater than or equal to A | - |
| `{{abs::A}}` | Returns absolute value of A | - |
| `{{round::A}}` | Returns A rounded to nearest integer | - |
| `{{remaind::A::B}}` | Returns remainder of A divided by B | Note: Implementation has typo "remaind" |

### Aggregate Functions
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{min::A::B::C...}}` | Returns minimum numeric value. Non-numeric values treated as 0 | Treated as array if single parameter |
| `{{max::A::B::C...}}` | Returns maximum numeric value. Non-numeric values treated as 0 | Treated as array if single parameter |
| `{{sum::A::B::C...}}` | Returns sum of all numeric values. Non-numeric values treated as 0 | Treated as array if single parameter |
| `{{average::A::B::C...}}` | Returns arithmetic mean of all numeric values. Non-numeric values treated as 0 | Treated as array if single parameter |

### Number Formatting
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{fix_number::A::B}}` | `{{fixnum::A::B}}`, `{{fix_num::A::B}}`, `{{fixnumber::A::B}}` | Rounds number A to B decimal places using toFixed() | - |
| `{{tonumber::A}}` | - | Extracts numeric characters (0-9) and decimal points from string A | Doesn't guarantee valid number |

---

## 5. String Syntaxes

### String Testing
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{startswith::A::B}}` | Returns "1" if string A starts with substring B, "0" otherwise | Case-sensitive |
| `{{endswith::A::B}}` | Returns "1" if string A ends with substring B, "0" otherwise | Case-sensitive |
| `{{contains::A::B}}` | Returns "1" if string A contains substring B anywhere, "0" otherwise | Case-sensitive |

### String Transformation
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{lower::A}}` | Converts all characters in A to lowercase using locale-aware conversion | - |
| `{{upper::A}}` | Converts all characters in A to uppercase using locale-aware conversion | - |
| `{{capitalize::A}}` | Capitalizes only first character of A, leaves rest unchanged | - |
| `{{trim::A}}` | Removes leading and trailing whitespace from A | - |
| `{{reverse::A}}` | Reverses character order in string A | - |
| `{{replace::A::B::C}}` | Replaces all occurrences of B in A with C. Global replacement | Case-sensitive |
| `{{length::A}}` | Returns character length of string A as number | Works on strings, may not work as expected with JSON arrays |

### Unicode Processing
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{unicode_encode::A}}` | `{{unicodeencode::A}}` | Returns Unicode code point of first character (index 0) in A | - |
| `{{unicode_encode::A::B}}` | `{{unicodeencode::A::B}}` | Returns Unicode code point of character at index B in string A | - |
| `{{unicode_decode::A}}` | `{{unicodedecode::A}}` | Converts Unicode code point A to its corresponding character | A must be numeric |
| `{{u::A}}` | `{{ue::A}}`, `{{unicodedecodefromhex::A}}`, `{{unicodeencodefromhex::A}}` | Converts hexadecimal Unicode code A to character | A must be valid hexadecimal |

---

## 6. Formatting Syntaxes

### Line Breaks
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{br}}` | `{{newline}}` | Returns literal newline character (\\n) | - |
| `{{cbr}}` | `{{cnl}}`, `{{cnewline}}` | Returns escaped newline character (\\\\n). With numeric argument, repeats that many times | - |
| `{{cbr::A}}` | `{{cnl::A}}`, `{{cnewline::A}}` | Returns A escaped newline characters (minimum 1) | - |

### Empty Content
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{none}}` | `{{blank}}` | Returns empty string | May invalidate message if used inappropriately in first message |

### Bracket Display
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{displayescapedcurlybracketopen}}` | `{{decbo}}`, `{{bo}}` | Returns special Unicode character that displays as { but won't be parsed as CBS | - |
| `{{displayescapedcurlybracketclose}}` | `{{decbc}}`, `{{bc}}` | Returns special Unicode character that displays as } but won't be parsed as CBS | - |
| `{{doubledisplayescapedcurlybracketopen}}` | `{{ddecbo}}` | Returns special Unicode characters that display as {{ but won't be parsed as CBS | - |
| `{{doubledisplayescapedcurlybracketclose}}` | `{{ddecbc}}` | Returns special Unicode characters that display as }} but won't be parsed as CBS | - |
| `{{displayescapedbracketopen}}` | `{{debo}}`, `{{(}}` | Returns special Unicode character that displays as ( but won't interfere with parsing | - |
| `{{displayescapedbracketclose}}` | `{{debc}}`, `{{)}}` | Returns special Unicode character that displays as ) but won't interfere with parsing | - |
| `{{displayescapedanglebracketopen}}` | `{{deabo}}`, `{{<}}` | Returns special Unicode character that displays as < but won't interfere with HTML parsing | - |
| `{{displayescapedanglebracketclose}}` | `{{deabc}}`, `{{>}}` | Returns special Unicode character that displays as > but won't interfere with HTML parsing | - |
| `{{displayescapedcolon}}` | `{{dec}}`, `{{:}}` | Returns special Unicode character that displays as : but won't be parsed as CBS separator | - |
| `{{displayescapedsemicolon}}` | `{{;}}` | Returns special Unicode character that displays as ; but won't interfere with parsing | - |

---

## 7. UI and Display Syntaxes

### Interactive Elements
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{button::A::B}}` | Creates HTML button with text A and trigger action B. When clicked, executes trigger command | - |
| `{{risu::A}}` | Displays RisuAI logo with size A pixels. Default 45px if no argument | - |

### File Display
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{file::A::B}}` | In display mode: shows filename A in formatted div. Otherwise: decodes base64 content B to UTF-8 text | - |

### Comments and Documentation
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{comment::A}}` | In display mode: shows comment A in formatted div. Otherwise returns empty string | Only visible in display mode |
| `{{//A}}` | Comment A that is removed during parsing | Comment only, not displayed |
| `{{hidden_key::A}}` | Works as key for lorebook activation while not being included in model request | - |

---

## 8. Random and Probability Syntaxes

### Random Generation
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{random}}` | Returns random number between 0 and 1 | - |
| `{{random::A::B...}}` | Returns random selection from parameters or from array/comma-colon separated string | Returns first parameter in tokenization mode |
| `{{randint::A::B}}` | Returns random integer between A and B (inclusive). Returns "NaN" if invalid arguments | - |
| `{{pick::A::B...}}` | Like random but uses hash-based deterministic selection for consistent results across messages | Parameters required, returns first parameter in tokenization mode |
| `{{roll::A}}` | Simulates dice rolling using RPG notation (XdY). Default 1d6 if no arguments. Single number treated as sides | - |
| `{{rollp::A}}` | Like roll but uses hash-based randomization for consistent results within same message | - |
| `{{dice::A}}` | Simulates dice rolling using standard RPG notation. Returns sum of all dice | - |
| `{{hash::A}}` | Generates deterministic 7-digit hash from input A. Same input always produces same output | - |

---

## 9. Module and Asset Syntaxes

### Module Information
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{module_enabled::A}}` | `{{moduleenabled::A}}` | Returns "1" if module with namespace A is enabled, "0" otherwise | - |
| `{{module_assetlist::A}}` | `{{moduleassetlist::A}}` | Returns JSON array of asset names available in module A. Returns empty string if module not found | - |

---

## 10. Metadata Syntaxes

### System Metadata
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{metadata::mobile}}` | Returns "1" if mobile device, "0" otherwise | - |
| `{{metadata::local}}` | Returns "1" if local/Tauri app, "0" otherwise | - |
| `{{metadata::node}}` | Returns "1" if node server, "0" otherwise | - |
| `{{metadata::risutype}}` | Returns type: 'local', 'node', or 'web' | - |

### Version Information
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{metadata::version}}` | - | Returns full version string | - |
| `{{metadata::majorversion}}` | `{{metadata::majorver}}`, `{{metadata::major}}` | Returns major version number | - |

### Language and Localization
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{metadata::language}}` | `{{metadata::locale}}`, `{{metadata::lang}}` | Returns current language setting | - |
| `{{metadata::browserlanguage}}` | `{{metadata::browserlocale}}`, `{{metadata::browserlang}}` | Returns browser's language setting | - |

### Model Information
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{metadata::modelshortname}}` | Returns model's short name | - |
| `{{metadata::modelname}}` | Returns model's full name | - |
| `{{metadata::modelinternalid}}` | Returns model's internal ID | - |
| `{{metadata::modelformat}}` | Returns model's format type | - |
| `{{metadata::modelprovider}}` | Returns model's provider | - |
| `{{metadata::modeltokenizer}}` | Returns model's tokenizer | - |
| `{{metadata::maxcontext}}` | Returns maximum context setting | - |

### Special Metadata
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{metadata::imateapot}}` | Easter egg: returns 🫖 | - |
| `{{iserror::A}}` | Returns "1" if A starts with "error:" (case-insensitive), "0" otherwise | - |

---

## 11. Conditional Syntaxes

### System State
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{prefill_supported}}` | `{{prefillsupported}}`, `{{prefill}}` | Returns "1" if current model ID starts with "claude", "0" otherwise | Specifically checks if model ID starts with "claude" |
| `{{jbtoggled}}` | - | Returns "1" if jailbreak toggle is enabled, "0" otherwise | - |
| `{{isfirstmsg}}` | `{{is_first_msg}}`, `{{is_first_message}}`, `{{isfirstmessage}}` | Returns "1" if current context is first message, "0" otherwise | - |

### Collection Conditions
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{all::A::B::C...}}` | Returns "1" if all provided values are "1", "0" otherwise. Logical AND | Treated as array if single parameter |
| `{{any::A::B::C...}}` | Returns "1" if any provided value is "1", "0" otherwise. Logical OR | Treated as array if single parameter |

---

## 12. Variable Syntaxes

### Chat Variables
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{getvar::A}}` | Returns value of chat variable A. Returns empty string if undefined | - |
| `{{setvar::A::B}}` | Sets chat variable A to value B. Only executes when runVar is true | Chat context only, returns null if rmVar is true, not available in HTML code insertion |
| `{{addvar::A::B}}` | Adds numeric value B to chat variable A. Only executes when runVar is true | Chat context only, returns null if rmVar is true, not available in HTML code insertion |
| `{{setdefaultvar::A::B}}` | Sets variable A to B only if A doesn't exist or is empty. Only executes when runVar is true | Chat context only, returns null if rmVar is true, not available in HTML code insertion |

### Temporary Variables
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{settempvar::A::B}}` | - | Sets temporary variable A to value B. Returns empty string | Current script execution only, lost when execution ends |
| `{{gettempvar::A}}` | `{{tempvar::A}}` | Returns value of temporary variable A. Returns empty string if undefined | Current script execution only, lost when execution ends |

### Global Variables
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{getglobalvar::A}}` | Returns value of global variable A. Returns empty string if undefined | - |

### Control Flow
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{return::A}}` | Sets return value A and forces script exit. Sets internal __return__ and __force_return__ variables | - |

---

## 13. Enhanced Array Syntaxes

### Array Creation/Manipulation
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{array::A::B::C...}}` | `{{makearray::}}`, `{{a::}}`, `{{make_array::}}` | Creates JSON array with elements A, B, C... | Uses § separator internally |
| `{{array_length::A}}` | `{{arraylength::A}}` | Returns length of JSON array A as string | Requires valid JSON array input, attempts to parse string as JSON |
| `{{array_element::A::B}}` | `{{arrayelement::A::B}}` | Returns element at index B of array A. Returns null if out of range. Negative indices count from end | - |
| `{{array_push::A::B}}` | `{{arraypush::A::B}}` | Returns array A with element B added to end | - |
| `{{array_pop::A}}` | `{{arraypop::A}}` | Returns array A with last element removed | - |
| `{{array_shift::A}}` | `{{arrayshift::A}}` | Returns array A with first element removed | - |
| `{{array_splice::A::B::C::D}}` | `{{arraysplice::A::B::C::D}}` | Modifies array A: removes C elements at index B, inserts D | Parameters: array, startIndex, deleteCount, newElement |
| `{{array_assert::A::B::C}}` | `{{arrayassert::A::B::C}}` | Sets element C at index B in array A only if index is out of bounds (extends array) | - |

### Array Conversion
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{split::A::B}}` | Splits string A by delimiter B, returns JSON array | - |
| `{{join::A::B}}` | Joins JSON array A elements with separator B | - |
| `{{spread::A}}` | Joins JSON array A elements with "::" separator. For creating multi-parameter syntaxes | - |
| `{{filter::A::B}}` | Filters array A with option B: "nonempty", "unique", or "all" | - |

### Collection Operations
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{range::A}}` | Generates range based on array A parameters. Different behavior than simple range generation | - |

---

## 14. Enhanced Dictionary Syntaxes

| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{dict::A=B::C=D...}}` | `{{makedict::}}`, `{{make_dict::}}`, `{{object::}}`, `{{makeobject::}}`, `{{make_object::}}`, `{{o::}}`, `{{d::}}` | Creates JSON object from key=value pairs. Invalid pairs ignored | - |
| `{{dict_element::A::B}}` | `{{dictelement::A::B}}`, `{{object_element::A::B}}`, `{{objectelement::A::B}}` | Returns value of key B in dictionary A. Returns "null" if key doesn't exist | - |
| `{{dict_assert::A::B::C}}` | `{{dictassert::A::B::C}}`, `{{object_assert::A::B::C}}`, `{{objectassert::A::B::C}}` | Sets property B to C in dictionary A only if property doesn't exist | - |
| `{{element::A::B}}` | `{{ele::A::B}}` | Navigates nested objects/arrays using path B. Returns "null" if any step fails | - |

---

## 15. Block Syntaxes

### Conditional Blocks - #if System
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{#if A}}content{{/if}}` | Traditional conditional statement. Displays content if A is "1" or "true" | Basic functionality only |
| `{{#if_pure A}}content{{/if_pure}}` | Conditional with preserved indentation/whitespace handling | Basic functionality only |

### Conditional Blocks - #when System (Enhanced)
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{#when A}}content{{/when}}` | Advanced conditional statement with operator support. Displays content if A is "1" or "true" | - |

**#when Operators:**

**Basic operators:**
- `{{#when::A::and::B}}...{{/when}}` - checks if both conditions are true
- `{{#when::A::or::B}}...{{/when}}` - checks if at least one condition is true
- `{{#when::A::is::B}}...{{/when}}` - checks if A equals B
- `{{#when::A::isnot::B}}...{{/when}}` - checks if A doesn't equal B
- `{{#when::A::>::B}}...{{/when}}` - checks if A is greater than B
- `{{#when::A::<::B}}...{{/when}}` - checks if A is less than B
- `{{#when::A::>=::B}}...{{/when}}` - checks if A is greater than or equal to B
- `{{#when::A::<=::B}}...{{/when}}` - checks if A is less than or equal to B
- `{{#when::not::A}}...{{/when}}` - negates condition

**Advanced operators:**
- `{{#when::keep::A}}...{{/when}}` - keep whitespace handling
- `{{#when::legacy::A}}...{{/when}}` - legacy whitespace handling like #if
- `{{#when::var::A}}...{{/when}}` - checks if variable A is truthy
- `{{#when::A::vis::B}}...{{/when}}` - checks if variable A equals literal B
- `{{#when::A::vnotis::B}}...{{/when}}` - checks if variable A doesn't equal literal B
- `{{#when::toggle::togglename}}...{{/when}}` - checks if toggle is enabled
- `{{#when::A::tis::B}}...{{/when}}` - checks if toggle A equals literal B
- `{{#when::A::tnotis::B}}...{{/when}}` - checks if toggle A doesn't equal literal B

**Operators can be combined:**
- `{{#when::keep::not::condition}}...{{/when}}`
- `{{#when::keep::condition1::and::condition2}}...{{/when}}`

**Usage alternatives:**
- `{{#when condition}}...{{/when}}` (whitespace instead of ::)
- `{{#when::not::condition}}...{{/when}}`

### Else Support
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{:else}}` | Else statement for #when blocks. Must be used inside {{#when}}. For multiline blocks, :else must be on line without additional string | Doesn't work with 'legacy' operator |

**Usage Examples:**
```
{{#when condition}}...{{:else}}...{{/when}}
{{#when::not::condition}}...{{:else}}...{{/when}}
```

### Content Protection
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{#puredisplay}}content{{/puredisplay}}` | - | Displays content without CBS processing. Useful for raw HTML | - |
| `{{#pure}}content{{/pure}}` | - | Displays content without CBS processing. Deprecated due to reparsing issues | Use #puredisplay instead |
| `{{#code}}content{{/code}}` | - | Normalizes code by removing whitespace and handling escape sequences | - |
| `{{#escape}}content{{/escape}}` | - | Escapes curly braces in content | - |

### Loop Blocks
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{#each A B}}content{{/each}}` | Repeats content for each element of array A, with current element accessible as B | - |
| `{{#each A as B}}content with {{slot::B}}{{/each}}` | Alternative syntax - iterates over array A, replacing {{slot::B}} with each element value | B must match variable name in {{slot::B}} |

**Example Usage:**
```
{{#each {{array::apple::banana::orange}} as fruit}}
Current fruit: {{slot::fruit}}
{{/each}}
```

### Function Blocks
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{#func A}}content{{/func}}` | Defines function A | Call with {{call::A::B::C...}} |
| `{{#func A param1 param2}}content{{/func}}` | Defines function A with named parameters | Access with {{arg::N}} |

---

## 16. Function System Syntaxes

### Function Definition and Calling
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{call::A::B::C...}}` | Calls function A with arguments B,C... | Function must be defined first |
| `{{arg::A}}` | Returns function argument A (indexed or named) | Inside functions only |

### Slot System
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{slot::A}}` | Used in various CBS functions to access specific slots or properties | Context dependent |
| `{{slot}}` | Accesses default slot | Context dependent |
| `{{position::A}}` | Defines position for use with @@position <positionName> decorator | - |

---

## 17. Advanced Block Syntax Features

### Block Closure Alternatives
CBS blocks can be closed with alternative syntax:

| Standard Closure | Alternative Closures | Description |
|------------------|---------------------|-------------|
| `{{/when}}` | `{{/}}` or `{{/anylabel}}` | Empty closure or custom labels |
| `{{/if}}` | `{{/}}` or `{{/anylabel}}` | Empty closure or custom labels |
| `{{/each}}` | `{{/}}` or `{{/loop}}` | Custom labels improve readability |
| `{{/func}}` | `{{/}}` or `{{/function}}` | Any label works for identification |

---

## 18. Utility Syntaxes

### Number Conversion
| CBS | Description | Limitations |
|-----|-------------|-------------|
| `{{fromhex::A}}` | Converts hexadecimal A to decimal | - |
| `{{tohex::A}}` | Converts decimal A to hexadecimal | - |

### Encryption/Decryption
| CBS | Alias | Description | Limitations |
|-----|-------|-------------|-------------|
| `{{xor::A}}` | `{{xorencrypt::A}}`, `{{xorencode::A}}`, `{{xore::A}}` | Encrypts string A using XOR cipher with 0xFF key, encodes as base64 | Simple obfuscation method |
| `{{xordecrypt::A}}` | `{{xordecode::A}}`, `{{xord::A}}` | Decrypts base64-encoded XOR string A back to original text | Reverses xor function |
| `{{crypt::A}}` | `{{crypto::A}}`, `{{caesar::A}}`, `{{encrypt::A}}`, `{{decrypt::A}}` | Caesar cipher with default shift 32768. By using default shift, can be used for both encrypt/decrypt | Shifts Unicode character codes |
| `{{crypt::A::B}}` | `{{crypto::A::B}}`, `{{caesar::A::B}}`, `{{encrypt::A::B}}`, `{{decrypt::A::B}}` | Caesar cipher with custom shift B on string A | Shifts Unicode character codes |

---

## Usage Guidelines

### General Limitations
1. **Chat Context Dependency**: Variable-setting functions (`{{setvar}}`, `{{addvar}}`, `{{setdefaultvar}}`) only work in chat context when runVar is true, not in HTML code insertion or other non-chat environments
2. **Tokenization Mode**: Many time and random functions behave differently in tokenization mode (return default values like "00:00:00" or first parameter)
3. **Message Context**: Functions like `{{messagetime}}`, `{{role}}`, `{{chat_index}}` return different values or error messages in non-chat contexts
4. **Index Validation**: Array and chat history functions return "null", "Out of range", or error messages for invalid indices
5. **Asset Scope**: Asset-related functions only work with current character's assets
6. **Temporary Data**: Temporary variables and function arguments are lost when script execution ends
7. **Implementation Preservations**: Some functions contain preserved typos for compatibility (e.g. `{{remaind}}`)

### Best Practices
1. **Context Awareness**: Use variable-setting functions only in appropriate chat contexts, not in HTML code or general text processing
2. **Error Handling**: Always check for potential null returns or error messages from context-dependent functions
3. **Tokenization Consideration**: Be aware that random and time functions may return different values in tokenization mode
4. **Index Safety**: Validate array indices and message indices before use to avoid "Out of range" errors
5. **Function Organization**: Use function blocks for complex, reusable logic that needs consistent execution context
6. **Conditional Choice**: Use #when for advanced conditions with operators, #if for simple true/false cases
7. **Asset Management**: Remember that asset functions only work with current character's assets

---

## ⚠️ 중요 주의사항

### 1. `{{#if}}` 사용 금지

`{{#if}}`는 더 이상 권장되지 않습니다. **반드시 `{{#when}}`을 사용하세요.**

❌ **잘못된 사용**:
```cbs
{{#if {{getvar::level}}>5}}
텍스트
{{/if}}
```

✅ **올바른 사용**:
```cbs
{{#when {{? {{getvar::level}}>5}}}}
텍스트
{{/when}}
```

### 2. 변수 설정은 트리거 스크립트 권장

`{{setvar}}`, `{{addvar}}` 같은 변수 설정 CBS는 제한적인 컨텍스트에서만 작동합니다. 복잡한 변수 조작은 **Lua 트리거 스크립트** (`scripts/triggerscript/main.lua`)를 사용하는 것을 권장합니다.

**이유**:
- CBS 변수 설정은 채팅 컨텍스트에서만 작동
- HTML 코드 삽입이나 비채팅 환경에서 작동 안 함
- 트리거 스크립트는 보다 강력하고 안정적임

### 3. 배열/딕셔너리 중첩 주의

**금지되는 사용**:
- 배열 안에 딕셔너리 넣기: ❌
- 딕셔너리 안에 딕셔너리 넣기: ❌
- 딕셔너리 안에 배열 넣기 (권장하지 않음): ⚠️

**올바른 방법**:
복잡한 데이터 구조가 필요한 경우 **여러 변수로 분리**하세요:

```cbs
{{setvar::player_names::{{array::Alice::Bob::Charlie}}}}
{{setvar::player_levels::{{array::5::10::8}}}}

플레이어: {{array_element::{{getvar::player_names}}::0}}
레벨: {{array_element::{{getvar::player_levels}}::0}}
```

---

## 사용 가이드라인

### 일반적인 제한사항
1. **채팅 컨텍스트 종속성**: 변수 설정 함수(`{{setvar}}`, `{{addvar}}`, `{{setdefaultvar}}`)는 runVar가 true인 채팅 컨텍스트에서만 작동하며, HTML 코드 삽입이나 기타 비채팅 환경에서는 작동하지 않음
2. **토큰화 모드**: 많은 시간 및 랜덤 함수들이 토큰화 모드에서 다르게 동작함 ("00:00:00"이나 첫 번째 매개변수 반환)
3. **메시지 컨텍스트**: `{{messagetime}}`, `{{role}}`, `{{chat_index}}` 같은 함수들은 비채팅 컨텍스트에서 다른 값이나 에러 메시지 반환
4. **인덱스 검증**: 배열 및 채팅 기록 함수들은 유효하지 않은 인덱스에 대해 "null", "Out of range" 또는 에러 메시지 반환
5. **에셋 범위**: 에셋 관련 함수들은 현재 캐릭터의 에셋에만 작동
6. **임시 데이터**: 임시 변수와 함수 인수들은 스크립트 실행이 끝나면 사라짐
7. **구현 보존**: 일부 함수들은 호환성을 위해 오타가 보존됨 (예: `{{remaind}}`)

### 모범 사례
1. **컨텍스트 인식**: 변수 설정 함수는 적절한 채팅 컨텍스트에서만 사용하고, HTML 코드나 일반 텍스트 처리에서는 사용하지 말 것
2. **에러 처리**: 컨텍스트 종속적 함수들의 잠재적 null 반환이나 에러 메시지를 항상 확인
3. **토큰화 고려**: 랜덤 및 시간 함수들이 토큰화 모드에서 다른 값을 반환할 수 있음을 인지
4. **인덱스 안전성**: "Out of range" 에러를 피하기 위해 사용 전 배열 인덱스와 메시지 인덱스 검증
5. **함수 구성**: 복잡하고 재사용 가능한 로직에는 함수 블록 사용
6. **조건문 선택**: 연산자를 사용한 고급 조건에는 #when 사용
7. **에셋 관리**: 에셋 함수들은 현재 캐릭터의 에셋에만 작동함을 기억

---

## 참고 자료

- **CBS 함수 전체 목록**: [`src/ts/cbs.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/cbs.ts)
- **CBS 실행 로직**: [`src/ts/process/index.svelte.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/index.svelte.ts)
