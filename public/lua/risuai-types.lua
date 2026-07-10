---@meta

-- RisuAI Lua Scripting API Type Definitions
-- This file provides type hints for RisuAI's global functions.

---JSON module exposed by RisuAI's Lua runtime.
---
---The runtime initializes this global with `json = require 'json'`.
---@class JsonModule
---@field _version string Library version string.
---@field encode fun(value: any): string Encode a Lua value as a JSON string. Errors on sparse arrays, mixed table keys, circular references, unsupported values, NaN, or infinity.
---@field decode fun(text: string): any Decode a JSON string into Lua values. JSON objects become tables and JSON arrays become sequence tables.

---@type JsonModule
json = require 'json'

---Promise-like object returned by async RisuAI Lua APIs.
---
---Use `:await()` inside an `async(function(...) ... end)` wrapper to read the
---resolved value.
---@class Promise<T>
---@field await fun(self: Promise<T>): T Wait for and return the resolved value.
---@field finally fun(self: Promise<T>, callback: fun()): Promise<T> Run a callback after the promise settles.

Promise = {}

---@generic T
---@param executor fun(resolve: fun(value: T), reject: fun(reason: any))
---@return Promise<T>
function Promise.create(executor) end

---@generic T
---@param value T
---@return Promise<T>
function Promise.resolve(value) end

---Create an async wrapper around a coroutine callback.
---@generic F: function
---@param callback F
---@return F
function async(callback) end

---Called when an input trigger runs before sending or processing user input.
---
---Return `false` to request that the current send flow stop.
---@param id string Trigger access id used by RisuAI API functions.
---@return any
function onInput(id) end

---Called when an output trigger runs after an assistant/character output exists.
---
---Return `false` to request that the current send flow stop.
---@param id string Trigger access id used by RisuAI API functions.
---@return any
function onOutput(id) end

---Called when a start trigger runs at the beginning of a send/generation flow.
---
---Return `false` to request that the current send flow stop.
---@param id string Trigger access id used by RisuAI API functions.
---@return any
function onStart(id) end

---Called when an HTML element with `risu-btn` is clicked.
---
---The `data` argument is the raw `risu-btn` attribute value.
---@param id string Trigger access id used by RisuAI API functions.
---@param data string Button event value.
---@return any
function onButtonClick(id, data) end

---Metadata passed to edit listeners.
---
---For editDisplay, index is the 0-based chat message index being rendered.
---For editRequest, editInput, and editOutput, index may be nil depending on the caller.
---@class RisuEditMeta
---@field index integer? 0-based chat message index when available.

---Multimodal attachment used by prompt messages.
---@class RisuMultiModal
---@field type 'image'|'video'|'audio'|'signature' Attachment kind.
---@field base64 string Base64-encoded attachment data.
---@field height number? Media height, when available.
---@field width number? Media width, when available.

---Single prompt message used by editRequest.
---
---This mirrors RisuAI's internal OpenAIChat shape. editRequest receives an
---array of these objects and should return the modified array.
---@class RisuRequestData
---@field role 'system'|'user'|'assistant'|'function' Prompt message role.
---@field content string Prompt message content.
---@field memo string? Optional internal memo text.
---@field name string? Optional message name.
---@field removable boolean? Whether this prompt item may be removed by later processing.
---@field attr string[]? Optional prompt attributes.
---@field multimodals RisuMultiModal[]? Optional multimodal attachments.
---@field thoughts string[]? Optional thought/tool metadata.
---@field cachePoint boolean? Whether this message is a cache checkpoint.

---Backward-compatible alias for older scripts.
---@class RequestData:RisuRequestData

---editInput listener: receives and returns the user input text.
---@alias RisuEditInputCallback fun(id: string, data: string, meta: RisuEditMeta?): string

---editOutput listener: receives and returns the assistant output text.
---@alias RisuEditOutputCallback fun(id: string, data: string, meta: RisuEditMeta?): string

---editDisplay listener: receives and returns the text/HTML shown for one chat message.
---@alias RisuEditDisplayCallback fun(id: string, data: string, meta: RisuEditMeta?): string

---editRequest listener: receives and returns the full request prompt array.
---@alias RisuEditRequestCallback fun(id: string, data: RisuRequestData[], meta: RisuEditMeta?): RisuRequestData[]

---Listen to edit events.
---@overload fun(type: 'editInput', func: RisuEditInputCallback)
---@overload fun(type: 'editOutput', func: RisuEditOutputCallback)
---@overload fun(type: 'editDisplay', func: RisuEditDisplayCallback)
---@overload fun(type: 'editRequest', func: RisuEditRequestCallback)
---@param type 'editInput'|'editOutput'|'editDisplay'|'editRequest'
---@param func function
function listenEdit(type, func) end

---Log a message to console.
---@param message string
function log(message) end

---Get state from chat storage.
---@param id string
---@param name string
---@return any
function getState(id, name) end

---Set state in chat storage.
---@param id string
---@param name string
---@param value any
function setState(id, name, value) end

---Get chat variable.
---@param id string
---@param key string
---@return string
function getChatVar(id, key) end

---Set chat variable.
---@param id string
---@param key string
---@param value string
function setChatVar(id, key, value) end

---Get global variable.
---@param id string
---@param key string
---@return string
function getGlobalVar(id, key) end

---Stop the current chat.
---@param id string
function stopChat(id) end

---Show error alert.
---@param id string
---@param value string
function alertError(id, value) end

---Show normal alert.
---@param id string
---@param value string
function alertNormal(id, value) end

---Show input alert.
---@param id string
---@param value string
---@return Promise<string>
function alertInput(id, value) end

---Show select alert.
---@param id string
---@param value string[]
---@return Promise<number>
function alertSelect(id, value) end

---Show confirm alert.
---@param id string
---@param value string
---@return Promise<boolean>
function alertConfirm(id, value) end

---Chat message stored in the current chat history.
---
---`getChat` and `getFullChat` return this decoded shape. Use `data` for the
---message body and `role` to distinguish user messages from character replies.
---@class ChatMessage
---@field role 'user'|'char' Message sender role.
---@field data string Message content.
---@field time number? Optional timestamp.

---Get chat message as a raw JSON string.
---@param id string
---@param index number
---@return string
function getChatMain(id, index) end

---Get chat message as a decoded table.
---@param id string
---@param index number
---@return ChatMessage?
function getChat(id, index) end

---Set chat message.
---@param id string
---@param index number
---@param value string
function setChat(id, index, value) end

---Set chat role.
---@param id string
---@param index number
---@param value string
function setChatRole(id, index, value) end

---Cut chat messages.
---@param id string
---@param start number
---@param end_ number
function cutChat(id, start, end_) end

---Remove chat message.
---@param id string
---@param index number
function removeChat(id, index) end

---Add chat message.
---@param id string
---@param role 'user'|'char'
---@param value string
function addChat(id, role, value) end

---Insert chat message.
---@param id string
---@param index number
---@param role string
---@param value string
function insertChat(id, index, role, value) end

---Get token count.
---@param id string
---@param value string
---@return Promise<number>
function getTokens(id, value) end

---Get chat length.
---@param id string
---@return number
function getChatLength(id) end

---Get full chat as a raw JSON string.
---@param id string
---@return string
function getFullChatMain(id) end

---Get full chat as a decoded table.
---@param id string
---@return ChatMessage[]
function getFullChat(id) end

---Sleep for milliseconds.
---@param id string
---@param time number
function sleep(id, time) end

---Parse CBS.
---@param value string
---@return string
function cbs(value) end

---Set full chat from a raw JSON string.
---@param id string
---@param value string
function setFullChatMain(id, value) end

---Set full chat from a decoded table.
---@param id string
---@param value ChatMessage[]
function setFullChat(id, value) end

---Log to main console with a raw JSON string.
---@param value string
function logMain(value) end

---Reload display.
---@param id string
function reloadDisplay(id) end

---Reload chat.
---@param id string
---@param index number
function reloadChat(id, index) end

---Calculate text similarity.
---@param id string
---@param source string
---@param value string[]
---@return Promise<string[]>
function similarity(id, source, value) end

---Make HTTP request.
---@param id string
---@param url string
---@return Promise<string>
function request(id, url) end

---Generate AI image.
---@param id string
---@param value string
---@param negValue string?
---@return Promise<string>
function generateImage(id, value, negValue) end

---Get character image asynchronously.
---@param id string
---@return Promise<string>
function getCharacterImageMain(id) end

---Get character image.
---@param id string
---@return string
function getCharacterImage(id) end

---Get persona image asynchronously.
---@param id string
---@return Promise<string>
function getPersonaImageMain(id) end

---Get persona image.
---@param id string
---@return string
function getPersonaImage(id) end

---Hash a string.
---@param id string
---@param value string
---@return Promise<string>
function hash(id, value) end

---Prompt message passed to `LLM` and `axLLM`.
---@class LLMPrompt
---@field role 'system'|'user'|'assistant'|'char'|'bot' Prompt role.
---@field content string Prompt text.

---Result returned by `LLM`, `axLLM`, and `simpleLLM`.
---@class LLMResult
---@field success boolean Whether the LLM call succeeded.
---@field result string The LLM response or error message.

---Call LLM with a raw JSON prompt string.
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return Promise<string>
function LLMMain(id, promptStr, useMultimodal) end

---Call LLM with a decoded prompt table.
---@param id string
---@param prompt LLMPrompt[]
---@param useMultimodal boolean?
---@return LLMResult
function LLM(id, prompt, useMultimodal) end

---Simple LLM call.
---@param id string
---@param prompt string
---@return Promise<LLMResult>
function simpleLLM(id, prompt) end

---Get character name.
---@param id string
---@return string
function getName(id) end

---Set character name.
---@param id string
---@param name string
function setName(id, name) end

---Get character description.
---@param id string
---@return string
function getDescription(id) end

---Set character description.
---@param id string
---@param desc string
function setDescription(id, desc) end

---Get character first message.
---@param id string
---@return string
function getCharacterFirstMessage(id) end

---Set character first message.
---@param id string
---@param data string
function setCharacterFirstMessage(id, data) end

---Get persona name.
---@param id string
---@return string
function getPersonaName(id) end

---Get persona description.
---@param id string
---@return string
function getPersonaDescription(id) end

---Get author's note.
---@param id string
---@return string
function getAuthorsNote(id) end

---Get background embedding.
---@param id string
---@return string
function getBackgroundEmbedding(id) end

---Set background embedding.
---@param id string
---@param data string
function setBackgroundEmbedding(id, data) end

---Get lorebooks as a raw JSON string.
---@param id string
---@param search string
---@return string
function getLoreBooksMain(id, search) end

---Lorebook entry returned by `getLoreBooks`.
---
---This is the raw configured lorebook data for entries matching the search text.
---@class LoreBook
---@field key string Primary activation key.
---@field secondkey string Secondary activation key.
---@field insertorder number Insertion priority order.
---@field comment string Lorebook name/comment.
---@field content string Lorebook content.
---@field mode 'normal'|'folder' Lorebook mode.
---@field alwaysActive boolean Whether always active.
---@field selective boolean Whether uses secondary key.
---@field useRegex boolean? Optional: use regex for key matching.
---@field activationPercent number? Optional: activation percentage.
---@field bookVersion number? Optional: book version.
---@field id string? Optional: unique identifier.
---@field folder string? Optional: folder path.

---Get lorebooks as a decoded table.
---@param id string
---@param search string
---@return LoreBook[]
function getLoreBooks(id, search) end

---Options used when creating or updating a local lorebook entry.
---@class LoreBookOptions
---@field alwaysActive boolean? Optional: whether the lore is always active.
---@field insertOrder number? Optional: insertion order priority.
---@field key string? Optional: primary activation key.
---@field secondKey string? Optional: secondary activation key.
---@field regex boolean? Optional: whether the key is a regex.

---Upsert local lorebook.
---@param id string
---@param name string
---@param content string
---@param options LoreBookOptions
function upsertLocalLoreBook(id, name, content, options) end

---Lorebook content already selected and loaded for the current request context.
---@class LoadedLoreBook
---@field data string Parsed lorebook content.
---@field role 'user'|'char' Message role for the lorebook entry.

---Load lorebooks as a raw JSON string.
---@param id string
---@return Promise<string>
function loadLoreBooksMain(id) end

---Load lorebooks as a decoded table.
---@param id string
---@return LoadedLoreBook[]
function loadLoreBooks(id) end

---Advanced LLM call with a raw JSON prompt string.
---@param id string
---@param promptStr string
---@param useMultimodal boolean?
---@return Promise<string>
function axLLMMain(id, promptStr, useMultimodal) end

---Advanced LLM call with a decoded prompt table.
---@param id string
---@param prompt LLMPrompt[]
---@param useMultimodal boolean?
---@return LLMResult
function axLLM(id, prompt, useMultimodal) end

---Get character's last message.
---@param id string
---@return string
function getCharacterLastMessage(id) end

---Get user's last message.
---@param id string
---@return string
function getUserLastMessage(id) end
