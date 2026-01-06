---@meta

-- RisuAI Lua Scripting API Type Definitions
-- This file provides type hints for RisuAI's global functions

---Listen to edit events
---@param type 'editInput'|'editOutput'|'editDisplay'|'editRequest'
---@param func function
function listenEdit(type, func) end

---Log a message to console
---@param message string
function log(message) end

---Get state from chat storage
---@param id string
---@param name string
---@return any
function getState(id, name) end

---Set state in chat storage
---@param id string
---@param name string
---@param value any
function setState(id, name, value) end

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
---@return string
function alertInput(id, value) end

---Show select alert
---@param id string
---@param value string[]
---@return number
function alertSelect(id, value) end

---Show confirm alert
---@param id string
---@param value string
---@return boolean
function alertConfirm(id, value) end

---Get chat message (raw JSON string)
---@param id string
---@param index number
---@return string
function getChatMain(id, index) end

---Get chat message (decoded table)
---@param id string
---@param index number
---@return table
function getChat(id, index) end

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
---@return number
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
---@return table
function getFullChat(id) end

---Sleep for milliseconds
---@param id string
---@param time number
function sleep(id, time) end

---Parse CBS for (raw JSON string)
---@param id string
---@param value string
function setFullChatMain(id, value) end

---Set full chat (from table)
---@param id string
---@param value table
function setFullChat(id, value) end

---Set full chat
---@param id string
---@param value string
function setFullChatMain(id, value) end

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
---@return table
function similarity(id, source, value) end

---Make HTTP request
---@param id string
---@param url string
---@return string
function request(id, url) end

---Generate AI image
---@param id string
---@param value string
---@param negValue string?
---@return string
function generateImage(id, value, negValue) end

---Get character image (async, returns promise)
---@param id string
---@return string
function getCharacterImageMain(id) end

---Get character ima (async, returns promise)
---@param id string
---@return string
function getPersonaImageMain(id) end

---Get persona image (awaited)
---@param id string
---@return string
function getPersonaImage(id) end

---Get persona image
---@param id string
---@return string
function getPersonaImageMain(id) end

---Hash a string
---@param id string
---@param value string
---@return string
function hash(id, value) end

---Call LLM (raw JSON prompt string, async)
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return string
function LLMMain(id, promptStr, useMultimodal) end

---Call LLM (table prompt)
---@param id string
---@param prompt table
---@param useMultimodal boolean?
---@return table
function LLM(id, prompt, useMultimodal) end

---Simple LLM call
---@param id string
---@param prompt string
---@return string
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

---Get lorebooks (decoded table)
---@param id string
---@param search string
---@return table
function getLoreBooks(id, search) end

---Upsert local lorebook
---@param id string
---@param name string
---@param content string
---@param options table
function upsertLocalLoreBook(id, name, content, options) end

---Load lorebooks (raw JSON string, async)
---@param id string
---@param reserve number
---@return string
function loadLoreBooksMain(id, reserve) end

---Load lorebooks (decoded table)
---@param id string
---@return table
function loadLoreBooks(id) end

---Advanced LLM call (raw JSON prompt string, async)
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return string
function axLLMMain(id, promptStr, useMultimodal) end

---Advanced LLM call (table prompt)
---@param id string
---@param prompt table
---@param useMultimodal boolean?
---@return table
function axLLM(id, prompt, useMultimodal) end

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
function async(callback) end

---JSON library (already defined in json.lua)
json = {}

---Promise library
Promise = {}
