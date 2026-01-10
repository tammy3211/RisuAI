# Trigger Script Usage Guide

Trigger scripts are scripts that automatically execute when specific events occur during chat.

---

## 📋 Trigger Script Versions

RisuAI supports three trigger script versions:

| Version | Description | Recommended |
|---------|-------------|-------------|
| **v1** | Legacy trigger | ❌ Not recommended |
| **v2** | Button-style header trigger | ⚠️ Conditionally recommended |
| **Lua** | Lua scripting | ✅ **Strongly recommended** |

### Version Selection

Set the trigger version in **`.metadata/settings.yaml`**:

```yaml
triggerversion: "lua"  # Choose from v1, v2, lua
useluabundle: false    # Lua bundle option (enables require)
```

---

## v1 - Legacy Trigger

**Not recommended for use.** No longer recommended due to limited functionality and low flexibility.

---

## v2 - Button-style Header Trigger

A method to create triggers using GUI buttons.

### Pros
- User-friendly GUI interface
- Can create simple triggers without coding knowledge

### Cons
- **Difficult to modify in file editor** (complex JSON structure)
- Limited functionality
- Not suitable for file-based workflow

### Recommended Use Cases
- When working only within RisuAI GUI
- When only simple triggers are needed

**Not recommended for this project**. Lua triggers are much more suitable for file-based character creation.

> **Note**: If you need v2 usage instructions, refer to [src/lib/SideBars/Scripts/TriggerList2.svelte](/src/lib/SideBars/Scripts/TriggerList2.svelte) and [src/ts/process/triggers.ts](/src/ts/process/triggers.ts).

---

## Lua - Lua Scripting (Recommended)

**The most powerful and flexible method**. You can implement complex logic with Lua scripts.

### Folder Structure

```
/save/{character_name}/
├── scripts/
│   ├── triggerscript.json      # Trigger metadata
│   └── triggerscript/
│       ├── main.lua            # Main script
│       ├── utils.lua           # (Optional) Utility functions
│       └── events.lua          # (Optional) Event handlers
└── .metadata/
    └── settings.yaml           # triggerversion: "lua" setting
```

### triggerscript.json Basic Structure

```json
[] // Regular array
```

#### Example triggerscript.json
```json
[
  {
    "comment": "",
    "type": "start",
    "conditions": [],
    "effect": [
      {
        "type": "triggerlua",
        "code": {
          "$ref": "scripts/triggerscript/main.lua"
        }
      }
    ],
    "lowLevelAccess": true
  }
]
```

---

## Lua Script Writing

### Basic Template

```lua
-- main.lua

local id = triggerId -- Current chat ID

-- Executed when user sends a message (before sending)
function onInput(id)
    print("User is about to send a message")
    local lastMsg = getUserLastMessage(id)
    print("Message content: " .. lastMsg)
end

-- Executed when user sends a message (prompt generation phase)
-- More sensitive and has stronger permissions than onInput
function onStart(id)
    print("Chat is starting, processing prompt")
    -- Can modify chat messages, set variables, etc.
end

-- Executed after AI generates a response
function onOutput(id)
    print("AI response generated")
    local lastMsg = getCharacterLastMessage(id)
    print("AI said: " .. lastMsg)
end
```

### Main Event Functions

| Function | Execution Timing | Permission Level | Purpose |
|----------|------------------|------------------|---------|
| `onInput(id)` | When user sends message | Medium | Input validation, preprocessing |
| `onStart(id)` | During prompt generation | **High** | Chat modification, variable setting |
| `onOutput(id)` | After AI response generation | Medium | Output postprocessing, event triggering |

> **Important**: `onStart` has **stronger permissions** than `onInput`. If `onInput` doesn't work, try using `onStart`.

---

## Global Functions

RisuAI provides many global functions defined in `risuai-types.lua`. Here we introduce only frequently used functions.

### Logging and Alerts

```lua
-- Log output to console (using Lua's built-in print)
print("Hello, world!")

-- Display alert to user
alertNormal(id, "An event has occurred!")

-- Display error message
alertError(id, "An error occurred")

-- Get user input
local input = alertInput(id, "Please enter your name:"):await()
print("User entered: " .. input)

-- Display options (return value: selected index, starts from 1)
local choice = alertSelect(id, {"Option 1", "Option 2", "Option 3"}):await()
if choice == 1 then
    print("User selected option 1")
end

-- Confirmation dialog
local confirmed = alertConfirm(id, "Are you sure you want to proceed?"):await()
if confirmed then
    print("User confirmed")
end
```

### Variable Management

```lua
-- Chat variable (valid only for current chat)
setChatVar(id, "player_hp", "100")
local hp = getChatVar(id, "player_hp")

-- Global variable (shared across all chats, read-only)
local globalValue = getGlobalVar(id, "some_key")

-- State storage (can store complex data)
setState(id, "inventory", {sword = true, potion = 3})
local inventory = getState(id, "inventory")
print("Potions: " .. inventory.potion)
```

### Chat Message Manipulation

```lua
-- Get chat length (starts from 1!)
local length = getChatLength(id)
print("Total messages: " .. length)

-- Get specific message (index starts from 0!)
local msg = getChat(id, 0)  -- First message
print("Role: " .. msg.role)
print("Content: " .. msg.data)

-- Modify message content
setChat(id, 0, "New message content")

-- Change message role
setChatRole(id, 0, "user")  -- or "char"

-- Add message
addChat(id, "char", "Hello!")

-- Insert message
insertChat(id, 1, "user", "Hi!")

-- Remove message
removeChat(id, 0)

-- Get all chat messages
local allChats = getFullChat(id)
for i, msg in ipairs(allChats) do
    print(i .. ": " .. msg.role .. " - " .. msg.data)
end
```

### Character Info

```lua
-- Character name
local charName = getName(id):await()
setName(id, "New name"):await()

-- Character description
local desc = getDescription(id):await()
alertNormal(id, desc)

-- First message
local firstMsg = getCharacterFirstMessage(id):await()
setCharacterFirstMessage(id, "Hello!"):await()

-- Persona info
local personaName = getPersonaName(id)
local personaDesc = getPersonaDescription(id)

-- Last message
local userLast = getUserLastMessage(id)
local charLast = getCharacterLastMessage(id)
```

### LLM Calls

```lua
-- Simple LLM call (async)
local response = simpleLLM(id, "What is 1+1?"):await()
print("AI response: " .. response.result)

-- Advanced LLM call (prompt array, async)
local prompt = {
    {role = "system", content = "You are a helpful assistant."},
    {role = "user", content = "Hello!"}
}
local result = LLM(id, prompt, false):await()
print("AI: " .. result[#result].content)
```

### Lorebook

```lua
-- Search lorebook
local lores = getLoreBooks(id, "magic")
for i, lore in ipairs(lores) do
    print("Lore: " .. lore.content)
end

-- Dynamically add/update lorebook
upsertLocalLoreBook(id, "Magic System", "This world has fire, water, and wind magic.", {
    key = {"magic", "spell"}
})
```

### Utilities

```lua
-- Wait briefly (milliseconds)
sleep(id, 1000):await()  -- Wait 1 second

-- Calculate token count (async)
local tokens = getTokens(id, "How many tokens in this sentence?"):await()
print("Token count: " .. tokens)

-- Hash string
local hashed = hash(id, "my_password"):await()

-- Refresh display
reloadDisplay(id)

-- Refresh specific chat message
reloadChat(id, 0)
```

---

## Advanced Usage

### listenEdit - event listeners

You can intercept and modify data at specific points in the chat flow.

```lua
-- Modify user input
listenEdit('editInput', function(id, data, meta)
    -- data is a string or an array
    if type(data) == "string" then
        data = data:gsub("badword", "***")
    end
    return data
end)

-- Modify AI output
listenEdit('editOutput', function(id, data, meta)
    -- Add emoji to AI response
    return data .. " 😊"
end)

-- Modify prompt request (before sending to LLM)
listenEdit('editRequest', function(id, data, meta)
    -- data is an array of OpenAI format messages
    for i, msg in ipairs(data) do
        -- Modify system message, etc.
        if msg.role == "system" then
            msg.content = msg.content .. "\nAdditional instructions"
        end
    end
    return data
end)

-- Modify display (during rendering)
listenEdit('editDisplay', function(id, data, meta)
    -- Add HTML tags, etc.
    data = "<strong>" .. data .. "</strong>"
    return data
end)
```

### Async Functions

Some functions require using `:await()`:

```lua
-- Image generation (async)
local img = generateImage(id, "beautiful landscape", ""):await()
print("Generated image: " .. img)

-- LLM call (async)
local response = simpleLLM(id, "Hello!"):await()
print("Response: " .. response.result)

-- Token count (async)
local tokens = getTokens(id, "text"):await()

-- Get character image (async)
local charImg = getCharacterImageMain(id):await()
local personaImg = getPersonaImageMain(id):await()

-- Load lorebooks (async)
local lores = loadLoreBooks(id):await()

-- Hash (async)
local hashed = hash(id, "text"):await()
```

**Also** use the `async()` wrapper together:

```lua
local myAsyncFunction = async(function(id)
    local img = generateImage(id, "sunset", ""):await()
    alertNormal(id, "Image generation complete!")
    return img
end)

-- Call
myAsyncFunction(id):await()
```

**:await()**-required functions:
- `generateImage()`, `getCharacterImageMain()`, `getPersonaImageMain()`
- `LLMMain()`, `simpleLLM()`, `LLM()`, `axLLM()`, `axLLMMain()`
- `getTokens()`
- `hash()`
- `loadLoreBooksMain()`, `loadLoreBooks()`
- `sleep()` (Promise-returning but can call :await())
- `alertInput()`, `alertSelect()`, `alertConfirm()` (Promise-returning but can call :await())

---

## Button Triggers

You can execute Lua functions through HTML buttons.

### Basic Usage

Adding the `risu-trigger` attribute to an HTML element will execute the corresponding function when clicked.

**HTML**:
```html
<button risu-trigger="onButton">Click here</button>
<div risu-trigger="onDivClick" style="cursor: pointer;">Click this area</div>
```

**Lua Script**:
```lua
function onButton(triggerId)
    alertNormal(triggerId, "Button was clicked!")
end

function onDivClick(triggerId)
    print("Div clicked!")
    alertNormal(triggerId, "Area clicked!")
end
```

### How to Create Buttons

#### 1. Create with customscript

**scripts/customscript.json**:
```json
{
  "type": "regex",
  "data": [
    {
      "comment": "Status Display UI",
      "in": "",
      "out": {"$ref": "./customscript/status_ui.md"},
      "type": "editdisplay",
      "flag": "<move_top>"
    }
  ]
}
```

**scripts/customscript/status_ui.md**:
```html
<div style="padding: 10px; background: #f0f0f0; border-radius: 5px;">
  <h3>Player Status</h3>
  <p>HP: {{getvar::hp}}/100</p>
  <button risu-trigger="healButton" style="padding: 5px 10px;">Heal</button>
  <button risu-trigger="attackButton" style="padding: 5px 10px;">Attack</button>
</div>
```

**scripts/triggerscript/main.lua**:
```lua
function healButton(id)
    local hp = tonumber(getChatVar(id, "hp")) or 50
    hp = math.min(hp + 20, 100)
    setChatVar(id, "hp", tostring(hp))
    alertNormal(id, "HP +20! Current: " .. hp)
    reloadDisplay(id)
end

function attackButton(id)
    alertNormal(id, "Attack!")
    addChat(id, "char", "*takes damage*")
end
```

#### 2. Dynamic Creation with listenEdit

```lua
listenEdit('editDisplay', function(id, data, meta)
    -- Add button to chat content
    if data:find("\\[Status\\]") then
        local hp = getChatVar(id, "hp") or "100"
        local statusUI = [[<div style="padding: 10px; background: #e0e0e0; margin: 10px 0;">
            <p>HP: ]] .. hp .. [[/100</p>
            <button risu-trigger="usePotion">Use Potion</button>
        </div>]]
        
        data = data:gsub("\\[Status\\]", statusUI)
    end
    return data
end)

function usePotion(id)
    alertNormal(id, "Used potion!")
    -- HP recovery logic
end
```

#### 3. Using CBS Button Syntax

```
{{button::Click::myTriggerFunction}}
```

This renders as:
```html
<button class="button-default" risu-trigger="myTriggerFunction">Click</button>
```

**Usage Example**:
```lua
function onStart(id)
    local buttonHTML = "{{button::Open Inventory::openInventory}}"
    setChatVar(id, "ui_buttons", buttonHTML)
end

function openInventory(id)
    local inventory = getState(id, "inventory") or {}
    local items = ""
    for item, count in pairs(inventory) do
        items = items .. item .. ": " .. count .. "\\n"
    end
    alertNormal(id, "Inventory:\\n" .. items)
end
```

### Advanced Example: Dialog Choices

```lua
listenEdit('editOutput', function(id, data, meta)
    -- Add choices to AI response
    if data:find("question") then
        data = data .. [[<br><br>
        <div style="margin-top: 10px;">
            <button risu-trigger="choice1" style="margin: 5px;">Choice 1</button>
            <button risu-trigger="choice2" style="margin: 5px;">Choice 2</button>
            <button risu-trigger="choice3" style="margin: 5px;">Choice 3</button>
        </div>]]
    end
    return data
end)

function choice1(id)
    addChat(id, "user", "I chose choice 1")
end

function choice2(id)
    addChat(id, "user", "I chose choice 2")
end

function choice3(id)
    addChat(id, "user", "I chose choice 3")
end
```

### Notes

- The `risu-trigger` attribute can be used on any HTML element such as `<button>`, `<div>`, `<span>`, etc.
- Function names must be defined in global scope
- `triggerId` is automatically passed as the first parameter
- When a button is clicked, the script runs in `onButtonClick` mode

---

## JSON Library

JSON library is installed globally:

```lua
-- JSON encoding
local data = {name = "Alice", age = 30}
local jsonStr = json.encode(data)
log(jsonStr)  -- {"name":"Alice","age":30}

-- JSON decoding
local jsonStr = '{"hp":100,"mp":50}'
local data = json.decode(jsonStr)
log("HP: " .. data.hp)
```

---

## Lua Bundle Option (Using require)

Setting `useluabundle: true` enables using `require` syntax.

**`.metadata/settings.yaml`**:
```yaml
triggerversion: "lua"
useluabundle: true
```

**Folder structure**:
```
scripts/triggerscript/
├── main.lua
├── utils.lua
└── events.lua
```

**main.lua**:
```lua
local utils = require("utils")
local events = require("events")

function onStart(id)
    utils.logInfo("Chat started")
    events.handleStart(id)
end
```

**utils.lua**:
```lua
local M = {}

function M.logInfo(msg)
    print("[INFO] " .. msg)
end

return M
```

---

## Notes

### 1. 🔑️ Always use `id` as `triggerId`.

The first parameter of a trigger function is always `triggerId`. This identifies the current chat session.

```lua
function onInput(triggerId)
    print("Current chat ID: " .. triggerId)
end
```

### 2. ❌ `stopChat()` and `setDescription()` functions cannot be used

`stopChat(id)` and `setDescription(id, "description")` functions **cannot be used** due to bugs.

### 3. ⚠️ Lua String Matching Patterns (`%`)

Lua uses pattern matching with `%` instead of regular expressions.

```lua
-- Wrong example (error!)
local str = "100% complete"
local found = str:find("%")  -- ERROR!

-- Correct example
local found = str:find("%%")  -- Escape %
```

**Problem**: Even when pattern errors occur, **no error message is displayed** and the code **silently stops**!

**Solution**:
- Always escape special characters: `( ) . % + - * ? [ ] ^ $`
- Or use `string.find(str, "text", 1, true)` - Set 4th argument to `true` (literal search)
- Use `print()` debugging actively to find where code execution stops.

### 4. ⚠️ Index Mismatch

```lua
-- getChatLength is 1-based!
local length = getChatLength(id)  -- 예: 5

-- However, setChat, getChat etc. are 0-based!
for i = 0, length - 1 do
    local msg = getChat(id, i)
    log(msg.data)
end
```

### 5. ⚠️ Async Functions

**Functions requiring :await():**
- `generateImage()` - Image generation
- `getCharacterImageMain()`, `getPersonaImageMain()` - Get images
- `simpleLLM()`, `LLM()`, `LLMMain()`, `axLLM()`, `axLLMMain()` - LLM calls
- `getTokens()` - Token calculation
- `hash()` - Hash generation
- `loadLoreBooksMain()`, `loadLoreBooks()` - Load lorebook

**Functions that return Promise but are automatically awaited:**
- `sleep()` - Wait
- `alertInput()`, `alertSelect()`, `alertConfirm()` - User input

**Synchronous functions** (`:await()` not required):
- `getChatVar()`, `setChatVar()`, `getState()`, `setState()` and most functions

---

## Practical Examples

### Example 1: HP System

```lua
function onStart(id)
    -- Initialize
    local hp = getState(id, "hp")
    if hp == nil then
        setState(id, "hp", 100)
        alertNormal(id, "HP system initialized: 100/100")
    end
    
    -- Display HP
    local currentHp = getState(id, "hp")
    setChatVar(id, "hp_display", "HP: " .. currentHp .. "/100")
end

function onOutput(id)
    local lastMsg = getCharacterLastMessage(id)
    
    -- When attacked
    if lastMsg:find("attack") or lastMsg:find("hit") then
        local hp = getState(id, "hp") or 100
        hp = hp - 10
        setState(id, "hp", hp)
        
        if hp <= 0 then
            alertError(id, "HP reached 0!")
            addChat(id, "char", "*collapses*")
        else
            alertNormal(id, "HP -10! Current HP: " .. hp)
        end
    end
end
```

### Example 2: Emotion Tracking

```lua
function onOutput(id)
    local msg = getCharacterLastMessage(id)
    local emotion = "neutral"
    
    -- Emotion analysis
    if msg:find("happy") or msg:find("joy") or msg:find("😊") then
        emotion = "joy"
    elseif msg:find("sad") or msg:find("depressed") or msg:find("😢") then
        emotion = "sadness"
    elseif msg:find("angry") or msg:find("annoyed") or msg:find("😠") then
        emotion = "anger"
    end
    
    setState(id, "current_emotion", emotion)
    print("Current emotion: " .. emotion)
end
```

### Example 3: Dynamic Lorebook Addition

```lua
function onInput(id)
    local userMsg = getUserLastMessage(id)
    
    -- Add to lorebook when user mentions a new location
    if userMsg:find("castle") then
        upsertLocalLoreBook(id, "King's Castle", "A massive castle. It has tall towers and thick walls.", {
            key = {"castle", "king's castle"}
        })
        alertNormal(id, "Added 'King's Castle' to lorebook")
    end
end
```

### Example 4: AI Response Modification

```lua
listenEdit('editOutput', function(id, data, meta)
    -- Filter forbidden words from AI response
    local forbidden = {"badword1", "badword2"}
    
    for _, word in ipairs(forbidden) do
        data = data:gsub(word, "***")
    end
    
    -- Add specific speech pattern at the end
    data = data .. " ~nya"
    
    return data
end)
```

---

## Summary

| Item | Description |
|------|-------------|
| **Recommended Version** | Lua |
| **Settings File** | `.metadata/settings.yaml` |
| **Main File** | `scripts/triggerscript/main.lua` |
| **Main Events** | `onInput`, `onStart`, `onOutput` |
| **Event Listener** | `listenEdit('editInput/Output/Request/Display', fn)` |
| **Notes** | `%` escape, index mismatch, async `:await()` |
| **JSON** | Global `json.encode()`, `json.decode()` |
| **Bundle Option** | `useluabundle: true` → `require()` usage enabled |

**Additional Reference**: Check `public/lua/risuai-types.lua` for a complete list of all global functions.
