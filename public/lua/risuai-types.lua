---@meta

-- RisuAI Lua Scripting API Type Definitions
-- This file provides type hints for RisuAI's global functions

json = require 'json'

local editRequestFuncs = {}
local editDisplayFuncs = {}
local editInputFuncs = {}
local editOutputFuncs = {}

---@class Promise
---@field await fun(self: Promise): any

---Internal function to call edit listeners
---@param type 'editInput'|'editOutput'|'editDisplay'|'editRequest'
---@param id string
---@param value string
---@param meta string
callListenMain = async(function(type, id, value, meta)
  local realValue = json.decode(value)
  local realMeta = json.decode(meta)

  if type == 'editRequest' then
    for _, func in ipairs(editRequestFuncs) do
      realValue = func(id, realValue, realMeta)
    end
  end

  if type == 'editDisplay' then
    for _, func in ipairs(editDisplayFuncs) do
      realValue = func(id, realValue, realMeta)
    end
  end

  if type == 'editInput' then
    for _, func in ipairs(editInputFuncs) do
      realValue = func(id, realValue, realMeta)
    end
  end

  if type == 'editOutput' then
    for _, func in ipairs(editOutputFuncs) do
      realValue = func(id, realValue, realMeta)
    end
  end

  return json.encode(realValue)
end)

---Listen to edit events
---@param type 'editInput'|'editOutput'|'editDisplay'|'editRequest'
---@param func function
function listenEdit(type, func)
  if type == 'editRequest' then
    editRequestFuncs[#editRequestFuncs + 1] = func
    return
  end

  if type == 'editDisplay' then
    editDisplayFuncs[#editDisplayFuncs + 1] = func
    return
  end

  if type == 'editInput' then
    editInputFuncs[#editInputFuncs + 1] = func
    return
  end

  if type == 'editOutput' then
    editOutputFuncs[#editOutputFuncs + 1] = func
    return
  end

  throw('Invalid type')
end

---Log a message to console
---@param message string
function log(message)
  logMain(json.encode(message))
end

---Get state from chat storage
---@param id string
---@param name string
---@return any
function getState(id, name)
  local escapedName = "__" .. name
  return json.decode(getChatVar(id, escapedName))
end

---Set state in chat storage
---@param id string
---@param name string
---@param value any
function setState(id, name, value)
  local escapedName = "__" .. name
  setChatVar(id, escapedName, json.encode(value))
end

---Get chat variable
---@param id string
---@param key string
---@return string
function getChatVar(id, key) end

---Set chat variable
---@param id string
---@param key string
---@param value string
function setChatVar(id, key, value) end

---Get global variable
---@param id string
---@param key string
---@return string
function getGlobalVar(id, key) end

---Stop the current chat
---@param id string
function stopChat(id) end

---Show error alert
---@param id string
---@param value string
function alertError(id, value) end

---Show normal alert
---@param id string
---@param value string
function alertNormal(id, value) end

---Show input alert
---@param id string
---@param value string
---@return Promise<string>
function alertInput(id, value) end

---Show select alert
---@param id string
---@param value string[]
---@return Promise<number>
function alertSelect(id, value) end

---Show confirm alert
---@param id string
---@param value string
---@return Promise<boolean>
function alertConfirm(id, value) end

---@class ChatMessage
---@field role 'user'|'char'  # Message sender role
---@field data string          # Message content
---@field time number?         # Optional timestamp (always present in getChat, optional in setFullChat)

---Get chat message (raw JSON string)
---@param id string
---@param index number
---@return string
function getChatMain(id, index) end

---Get chat message (decoded table)
---@param id string
---@param index number
---@return ChatMessage | nil
function getChat(id, index)
  return json.decode(getChatMain(id, index))
end

---Set chat message
---@param id string
---@param index number
---@param value string
function setChat(id, index, value) end

---Set chat role
---@param id string
---@param index number
---@param value string
function setChatRole(id, index, value) end

---Cut chat messages
---@param id string
---@param start number
---@param end_ number
function cutChat(id, start, end_) end

---Remove chat message
---@param id string
---@param index number
function removeChat(id, index) end

---Add chat message
---@param id string
---@param role string
---@param value string
function addChat(id, role, value) end

---Insert chat message
---@param id string
---@param index number
---@param role string
---@param value string
function insertChat(id, index, role, value) end

---Get token count
---@param id string
---@param value string
---@return Promise<number>
function getTokens(id, value) end

---Get chat length
---@param id string
---@return number
function getChatLength(id) end

---Get full chat (raw JSON string)
---@param id string
---@return string
function getFullChatMain(id) end

---Get full chat (decoded table)
---@param id string
---@return ChatMessage[]
function getFullChat(id)
  return json.decode(getFullChatMain(id))
end

---Sleep for milliseconds
---@param id string
---@param time number
function sleep(id, time) end

---Parse CBS for (raw JSON string)
---@param id string
---@param value string
function cbs(id, value) end

---Set full chat
---@param id string
---@param value string
function setFullChatMain(id, value) end

---Set full chat (from table)
---@param id string
---@param value ChatMessage[]
function setFullChat(id, value)
  setFullChatMain(id, json.encode(value))
end

---Log to main console (raw JSON string)
---@param value string
function logMain(value) end

---Reload display
---@param id string
function reloadDisplay(id) end

---Reload chat
---@param id string
---@param index number
function reloadChat(id, index) end

---Calculate text similarity
---@param id string
---@param source string
---@param value string[]
---@return Promise<string[]>
function similarity(id, source, value) end

---Make HTTP request
---@param id string
---@param url string
---@return Promise<string>
function request(id, url) end

---Generate AI image
---@param id string
---@param value string
---@param negValue string?
---@return Promise<string>
function generateImage(id, value, negValue) end

---Get character image (async, returns promise)
---@param id string
---@return Promise<string>
function getCharacterImageMain(id) end

---Get character image (awaited)
---@param id string
---@return string
function getCharacterImage(id)
  return getCharacterImageMain(id):await()
end

---Get character ima (async, returns promise)
---@param id string
---@return Promise<string>
function getPersonaImageMain(id) end

---Get persona image (awaited)
---@param id string
---@return string
function getPersonaImage(id)
  return getPersonaImageMain(id):await()
end

---Get persona image
---@param id string
---@return string
function getPersonaImageMain(id) end

---Hash a string
---@param id string
---@param value string
---@return Promise<string>
function hash(id, value) end

---Call LLM (raw JSON prompt string, async)
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return Promise<string>
function LLMMain(id, promptStr, useMultimodal) end

---@class LLMPrompt
---@field role 'system'|'user'|'assistant'|'char'|'bot'
---@field content string

---@class LLMResult
---@field success boolean  # Whether the LLM call succeeded
---@field result string    # The LLM response or error message

---Call LLM (table prompt)
---@param id string
---@param prompt LLMPrompt[]
---@param useMultimodal boolean?
---@return LLMResult
function LLM(id, prompt, useMultimodal)
  useMultimodal = useMultimodal or false
  return json.decode(LLMMain(id, json.encode(prompt), useMultimodal):await())
end

---Simple LLM call
---@param id string
---@param prompt string
---@return Promise<LLMResult>
function simpleLLM(id, prompt) end

---Get character name
---@param id string
---@return string
function getName(id) end

---Set character name
---@param id string
---@param name string
function setName(id, name) end

---Get character description
---@param id string
---@return string
function getDescription(id) end

---Set character description
---@param id string
---@param desc string
function setDescription(id, desc) end

---Get character first message
---@param id string
---@return string
function getCharacterFirstMessage(id) end

---Set character first message
---@param id string
---@param data string
function setCharacterFirstMessage(id, data) end

---Get persona name
---@param id string
---@return string
function getPersonaName(id) end

---Get persona description
---@param id string
---@return string
function getPersonaDescription(id) end

---Get author's note
---@param id string
---@return string
function getAuthorsNote(id) end

---Get background embedding
---@param id string
---@return string
function getBackgroundEmbedding(id) end

---Set background embedding
---@param id string
---@param data string
function setBackgroundEmbedding(id, data) end

---Get lorebooks (raw JSON string)
---@param id string
---@param search string
---@return string
function getLoreBooksMain(id, search) end

---@class LoreBook
---@field key string                                     # Primary activation key
---@field secondkey string                               # Secondary activation key
---@field insertorder number                             # Insertion priority order
---@field comment string                                 # Lorebook name/comment
---@field content string                                 # Lorebook content (parsed with CBS)
---@field mode 'normal'|'folder'                         # Lorebook mode
---@field alwaysActive boolean                           # Whether always active
---@field selective boolean                              # Whether uses secondary key
---@field useRegex boolean?                              # Optional: use regex for key matching
---@field activationPercent number?                      # Optional: activation percentage
---@field bookVersion number?                            # Optional: book version
---@field id string?                                     # Optional: unique identifier
---@field folder string?                                 # Optional: folder path

---Get lorebooks (decoded table)
---@param id string
---@param search string
---@return LoreBook[]
function getLoreBooks(id, search)
  return json.decode(getLoreBooksMain(id, search))
end

---@class LoreBookOptions
---@field alwaysActive boolean?    # Optional: whether the lore is always active
---@field insertOrder number?      # Optional: insertion order priority
---@field key string?              # Optional: primary activation key
---@field secondKey string?        # Optional: secondary activation key
---@field regex boolean?           # Optional: whether the key is a regex

---Upsert local lorebook
---@param id string
---@param name string
---@param content string
---@param options LoreBookOptions
function upsertLocalLoreBook(id, name, content, options) end

---@class LoadedLoreBook
---@field data string         # Parsed lorebook content
---@field role 'user'|'char'  # Message role for the lorebook entry

---Load lorebooks (raw JSON string, async)
---@param id string
---@return Promise<string>
function loadLoreBooksMain(id) end

---Load lorebooks (decoded table)
---@param id string
---@return LoadedLoreBook[]
function loadLoreBooks(id)
  return json.decode(loadLoreBooksMain(id):await())
end

---Advanced LLM call (raw JSON prompt string, async)
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return Promise<string>
function axLLMMain(id, promptStr, useMultimodal) end

---Advanced LLM call (table prompt)
---@param id string
---@param prompt LLMPrompt[]
---@param useMultimodal boolean?
---@return LLMResult
function axLLM(id, prompt, useMultimodal)
  useMultimodal = useMultimodal or false
  return json.decode(axLLMMain(id, json.encode(prompt), useMultimodal):await())
end

---Get character's last message
---@param id string
---@return string
function getCharacterLastMessage(id) end

---Get user's last message
---@param id string
---@return string
function getUserLastMessage(id) end

---Create async wrapper
---@param callback function
---@return function
function async(callback)
  return function(...)
    local co = coroutine.create(callback)
    local safe, result = coroutine.resume(co, ...)

    return Promise.create(function(resolve, reject)
      local checkresult
      local step = function()
        if coroutine.status(co) == "dead" then
          local send = safe and resolve or reject
          return send(result)
        end

        safe, result = coroutine.resume(co)
        checkresult()
      end

      checkresult = function()
        if safe and result == Promise.resolve(result) then
          result:finally(step)
        else
          step()
        end
      end

      checkresult()
    end)
  end
end


