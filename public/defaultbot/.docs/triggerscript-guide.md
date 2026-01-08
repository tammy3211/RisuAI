# 트리거 스크립트 (Trigger Script) 사용 가이드

트리거 스크립트는 채팅 중 특정 이벤트가 발생했을 때 자동으로 실행되는 스크립트입니다.

---

## 📋 트리거 스크립트 버전

RisuAI는 세 가지 트리거 스크립트 버전을 지원합니다:

| 버전 | 설명 | 권장 여부 |
|------|------|-----------|
| **v1** | 레거시 트리거 | ❌ 권장하지 않음 |
| **v2** | 버튼식 헤더 트리거 | ⚠️ 조건부 권장 |
| **Lua** | Lua 스크립팅 | ✅ **강력 권장** |

### 버전 선택

**`.metadata/settings.yaml`**에서 트리거 버전을 설정합니다:

```yaml
triggerversion: "lua"  # v1, v2, lua 중 선택
useluabundle: false    # Lua 번들 옵션 (require 사용 가능)
```

---

## v1 - 레거시 트리거

**사용을 권장하지 않습니다.** 제한적인 기능과 낮은 유연성으로 인해 더 이상 권장되지 않습니다.

---

## v2 - 버튼식 헤더 트리거

GUI 버튼으로 트리거를 만들 수 있는 방식입니다.

### 장점
- 사용자 친화적인 GUI 인터페이스
- 코딩 지식 없이도 간단한 트리거 생성 가능

### 단점
- **파일 에디터에서 수정하기 어려움** (JSON 구조가 복잡함)
- 제한적인 기능
- 파일 기반 워크플로우에 적합하지 않음

### 권장 사용 케이스
- RisuAI GUI 내에서만 작업하는 경우
- 간단한 트리거만 필요한 경우

**이 프로젝트에서는 비추천**합니다. 파일 기반 캐릭터 제작에는 Lua 트리거가 훨씬 적합합니다.

> **참고**: v2 사용법이 필요한 경우 [src/lib/SideBars/Scripts/TriggerList2.svelte](../../../src/lib/SideBars/Scripts/TriggerList2.svelte)와 [src/ts/process/triggers.ts](../../../src/ts/process/triggers.ts)를 참고하세요.

---

## Lua - Lua 스크립팅 (권장)

**가장 강력하고 유연한 방식**입니다. Lua 스크립트로 복잡한 로직을 구현할 수 있습니다.

### 폴더 구조

```
/save/{character_name}/
├── scripts/
│   ├── triggerscript.json      # 트리거 메타데이터
│   └── triggerscript/
│       ├── main.lua            # 메인 스크립트
│       ├── utils.lua           # (선택) 유틸리티 함수
│       └── events.lua          # (선택) 이벤트 핸들러
└── .metadata/
    └── settings.yaml           # triggerversion: "lua" 설정
```

### triggerscript.json 기본 구조

```json
{
  "type": "lua",
  "data": {
    "$ref": "./triggerscript/main.lua"
  }
}
```

---

## Lua 스크립트 작성법

### 기본 템플릿

```lua
-- main.lua

-- 사용자가 메시지를 보낼 때 실행 (메시지 전송 전)
function onInput(id)
    print("User is about to send a message")
    local lastMsg = getUserLastMessage(id)
    print("Message content: " .. lastMsg)
end

-- 사용자가 메시지를 보낼 때 실행 (프롬프트 생성 단계)
-- onInput보다 더 민감하고 권한이 강함
function onStart(id)
    print("Chat is starting, processing prompt")
    -- 여기서 채팅 메시지 수정, 변수 설정 등 가능
end

-- AI가 응답을 생성한 후 실행
function onOutput(id)
    print("AI response generated")
    local lastMsg = getCharacterLastMessage(id)
    print("AI said: " .. lastMsg)
end
```

### 주요 이벤트 함수

| 함수 | 실행 시점 | 권한 레벨 | 용도 |
|------|-----------|-----------|------|
| `onInput(id)` | 사용자 메시지 전송 시 | 중간 | 입력 검증, 전처리 |
| `onStart(id)` | 프롬프트 생성 시 | **높음** | 채팅 수정, 변수 설정 |
| `onOutput(id)` | AI 응답 생성 후 | 중간 | 출력 후처리, 이벤트 발생 |

> **중요**: `onStart`는 `onInput`보다 **훨씬 민감하고 권한이 강합니다**. 채팅 메시지 직접 수정 등 강력한 기능이 필요할 때 사용하세요.

---

## 전역 함수 (Global Functions)

RisuAI는 `risuai-types.lua`에 정의된 많은 전역 함수를 제공합니다. 여기서는 자주 사용되는 함수만 소개합니다.

### 로깅 및 알림

```lua
-- 콘솔에 로그 출력 (Lua 내장 print 사용)
print("Hello, world!")

-- 사용자에게 알림 표시
alertNormal(id, "이벤트가 발생했습니다!")

-- 에러 메시지 표시
alertError(id, "오류가 발생했습니다")

-- 사용자 입력 받기
local input = alertInput(id, "이름을 입력하세요:")
print("User entered: " .. input)

-- 선택지 표시 (반환값: 선택된 인덱스, 1부터 시작)
local choice = alertSelect(id, {"옵션 1", "옵션 2", "옵션 3"})
if choice == 1 then
    print("User selected option 1")
end

-- 확인 대화상자
local confirmed = alertConfirm(id, "정말로 실행하시겠습니까?")
if confirmed then
    print("User confirmed")
end
```

### 변수 관리

```lua
-- 채팅 변수 (현재 채팅에만 유효)
setChatVar(id, "player_hp", "100")
local hp = getChatVar(id, "player_hp")

-- 글로벌 변수 (모든 채팅에서 공유, 읽기 전용)
local globalValue = getGlobalVar(id, "some_key")

-- State 저장 (복잡한 데이터 저장 가능)
setState(id, "inventory", {sword = true, potion = 3})
local inventory = getState(id, "inventory")
print("Potions: " .. inventory.potion)
```

### 채팅 메시지 조작

```lua
-- 채팅 길이 가져오기 (1부터 시작!)
local length = getChatLength(id)
print("Total messages: " .. length)

-- 특정 메시지 가져오기 (인덱스는 0부터 시작!)
local msg = getChat(id, 0)  -- 첫 번째 메시지
print("Role: " .. msg.role)
print("Content: " .. msg.data)

-- 메시지 내용 수정
setChat(id, 0, "새로운 메시지 내용")

-- 메시지 역할 변경
setChatRole(id, 0, "user")  -- 또는 "char"

-- 메시지 추가
addChat(id, "char", "안녕하세요!")

-- 메시지 삽입
insertChat(id, 1, "user", "안녕!")

-- 메시지 제거
removeChat(id, 0)

-- 전체 채팅 가져오기
local allChats = getFullChat(id)
for i, msg in ipairs(allChats) do
    print(i .. ": " .. msg.role .. " - " .. msg.data)
end
```

### 캐릭터 정보

```lua
-- 캐릭터 이름
local charName = getName(id)
setName(id, "새 이름")

-- 캐릭터 설명
local desc = getDescription(id)
setDescription(id, "새로운 설명")

-- 첫 메시지
local firstMsg = getCharacterFirstMessage(id)
setCharacterFirstMessage(id, "안녕하세요!")

-- 페르소나 정보
local personaName = getPersonaName(id)
local personaDesc = getPersonaDescription(id)

-- 마지막 메시지
local userLast = getUserLastMessage(id)
local charLast = getCharacterLastMessage(id)
```

### LLM 호출

```lua
-- 간단한 LLM 호출 (비동기)
local response = simpleLLM(id, "1+1은?"):await()
print("AI response: " .. response.result)

-- 고급 LLM 호출 (프롬프트 배열, 비동기)
local prompt = {
    {role = "system", content = "당신은 친절한 조수입니다."},
    {role = "user", content = "안녕하세요!"}
}
local result = LLM(id, prompt, false):await()
print("AI: " .. result[#result].content)
```

### 로어북

```lua
-- 로어북 검색
local lores = getLoreBooks(id, "마법")
for i, lore in ipairs(lores) do
    print("Lore: " .. lore.content)
end

-- 로어북 동적 추가/업데이트
upsertLocalLoreBook(id, "마법 시스템", "이 세계에는 불, 물, 바람 마법이 있다.", {
    key = {"마법", "주문"}
})
```

### 유틸리티

```lua
-- 잠시 대기 (밀리초)
sleep(id, 1000)  -- 1초 대기

-- 토큰 수 계산 (비동기)
local tokens = getTokens(id, "이 문장의 토큰 수는?"):await()
print("Token count: " .. tokens)

-- 문자열 해시
local hashed = hash(id, "my_password")

-- 디스플레이 새로고침
reloadDisplay(id)

-- 특정 채팅 메시지 새로고침
reloadChat(id, 0)
```

---

## 고급 기능

### listenEdit - 이벤트 리스너

채팅 흐름의 특정 시점에 끼어들어 데이터를 수정할 수 있습니다.

```lua
-- 사용자 입력 수정
listenEdit('editInput', function(id, data, meta)
    -- data는 문자열 또는 배열
    if type(data) == "string" then
        data = data:gsub("나쁜단어", "***")
    end
    return data
end)

-- AI 출력 수정
listenEdit('editOutput', function(id, data, meta)
    -- AI 응답에 이모티콘 추가
    return data .. " 😊"
end)

-- 프롬프트 요청 수정 (LLM에 전송되기 전)
listenEdit('editRequest', function(id, data, meta)
    -- data는 OpenAI 형식 메시지 배열
    for i, msg in ipairs(data) do
        -- 시스템 메시지 수정 등
        if msg.role == "system" then
            msg.content = msg.content .. "\n추가 지시사항"
        end
    end
    return data
end)

-- 화면 표시 수정 (렌더링 시)
listenEdit('editDisplay', function(id, data, meta)
    -- HTML 태그 추가 등
    data = "<strong>" .. data .. "</strong>"
    return data
end)
```

### 비동기 함수 (Async Functions)

일부 함수는 `:await()`를 사용해야 합니다:

```lua
-- 이미지 생성 (비동기)
local img = generateImage(id, "beautiful landscape", ""):await()
print("Generated image: " .. img)

-- LLM 호출 (비동기)
local response = simpleLLM(id, "Hello!"):await()
print("Response: " .. response.result)

-- 토큰 계산 (비동기)
local tokens = getTokens(id, "text"):await()

-- 캐릭터 이미지 가져오기 (비동기)
local charImg = getCharacterImageMain(id):await()
local personaImg = getPersonaImageMain(id):await()

-- 로어북 로드 (비동기)
local lores = loadLoreBooks(id):await()

-- 해시 (비동기)
local hashed = hash(id, "text"):await()
```

**또는** `async()` 래퍼 사용:

```lua
local myAsyncFunction = async(function(id)
    local img = generateImage(id, "sunset", ""):await()
    alertNormal(id, "이미지 생성 완료!")
    return img
end)

-- 호출
myAsyncFunction(id):await()
```

**:await()가 필요한 함수들:**
- `generateImage()`, `getCharacterImageMain()`, `getPersonaImageMain()`
- `LLMMain()`, `simpleLLM()`, `LLM()`, `axLLM()`, `axLLMMain()`
- `getTokens()`
- `hash()`
- `loadLoreBooksMain()`, `loadLoreBooks()`
- `sleep()` (Promise를 반환하지만 :await() 호출 가능)
- `alertInput()`, `alertSelect()`, `alertConfirm()` (Promise를 반환하지만 :await() 호출 가능)

---

## 버튼 트리거

HTML 버튼을 통해 Lua 함수를 실행할 수 있습니다.

### 기본 사용법

HTML 요소에 `risu-trigger` 속성을 추가하면 클릭 시 해당 함수가 실행됩니다.

**HTML**:
```html
<button risu-trigger="onButton">클릭하세요</button>
<div risu-trigger="onDivClick" style="cursor: pointer;">이 영역을 클릭</div>
```

**Lua 스크립트**:
```lua
function onButton(triggerId)
    alertNormal(triggerId, "버튼이 클릭되었습니다!")
end

function onDivClick(triggerId)
    print("Div clicked!")
    alertNormal(triggerId, "영역 클릭!")
end
```

### 버튼 생성 방법

#### 1. customscript로 생성

**scripts/customscript.json**:
```json
{
  "type": "regex",
  "data": [
    {
      "comment": "상태 표시 UI",
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
  <h3>플레이어 상태</h3>
  <p>HP: {{getvar::hp}}/100</p>
  <button risu-trigger="healButton" style="padding: 5px 10px;">회복</button>
  <button risu-trigger="attackButton" style="padding: 5px 10px;">공격</button>
</div>
```

**scripts/triggerscript/main.lua**:
```lua
function healButton(id)
    local hp = tonumber(getChatVar(id, "hp")) or 50
    hp = math.min(hp + 20, 100)
    setChatVar(id, "hp", tostring(hp))
    alertNormal(id, "HP +20! 현재: " .. hp)
    reloadDisplay(id)
end

function attackButton(id)
    alertNormal(id, "공격!")
    addChat(id, "char", "*공격을 받는다*")
end
```

#### 2. listenEdit로 동적 생성

```lua
listenEdit('editDisplay', function(id, data, meta)
    -- 채팅 내용에 버튼 추가
    if data:find("\\[상태창\\]") then
        local hp = getChatVar(id, "hp") or "100"
        local statusUI = [[<div style="padding: 10px; background: #e0e0e0; margin: 10px 0;">
            <p>HP: ]] .. hp .. [[/100</p>
            <button risu-trigger="usePotion">물약 사용</button>
        </div>]]
        
        data = data:gsub("\\[상태창\\]", statusUI)
    end
    return data
end)

function usePotion(id)
    alertNormal(id, "물약을 사용했습니다!")
    -- HP 회복 로직
end
```

#### 3. CBS 버튼 문법 사용

```
{{button::클릭::myTriggerFunction}}
```

이는 다음과 같이 렌더링됩니다:
```html
<button class="button-default" risu-trigger="myTriggerFunction">클릭</button>
```

**사용 예시**:
```lua
function onStart(id)
    local buttonHTML = "{{button::인벤토리 열기::openInventory}}"
    setChatVar(id, "ui_buttons", buttonHTML)
end

function openInventory(id)
    local inventory = getState(id, "inventory") or {}
    local items = ""
    for item, count in pairs(inventory) do
        items = items .. item .. ": " .. count .. "\\n"
    end
    alertNormal(id, "인벤토리:\\n" .. items)
end
```

### 고급 예시: 대화 선택지

```lua
listenEdit('editOutput', function(id, data, meta)
    -- AI 응답에 선택지 추가
    if data:find("질문이야") then
        data = data .. [[<br><br>
        <div style="margin-top: 10px;">
            <button risu-trigger="choice1" style="margin: 5px;">선택 1</button>
            <button risu-trigger="choice2" style="margin: 5px;">선택 2</button>
            <button risu-trigger="choice3" style="margin: 5px;">선택 3</button>
        </div>]]
    end
    return data
end)

function choice1(id)
    addChat(id, "user", "선택 1을 골랐어")
end

function choice2(id)
    addChat(id, "user", "선택 2를 골랐어")
end

function choice3(id)
    addChat(id, "user", "선택 3을 골랐어")
end
```

### 주의사항

- `risu-trigger` 속성은 `<button>`, `<div>`, `<span>` 등 모든 HTML 요소에 사용 가능
- 함수명은 전역 스코프에서 정의되어야 함
- `triggerId`는 자동으로 전달되는 첫 번째 매개변수
- 버튼 클릭 시 `onButtonClick` 모드로 스크립트가 실행됨

---

## JSON 라이브러리

JSON 라이브러리는 전역으로 설치되어 있습니다:

```lua
-- JSON 인코딩
local data = {name = "Alice", age = 30}
local jsonStr = json.encode(data)
log(jsonStr)  -- {"name":"Alice","age":30}

-- JSON 디코딩
local jsonStr = '{"hp":100,"mp":50}'
local data = json.decode(jsonStr)
log("HP: " .. data.hp)
```

---

## Lua 번들 옵션 (require 사용)

`useluabundle: true`로 설정하면 `require` 문법을 사용할 수 있습니다.

**`.metadata/settings.yaml`**:
```yaml
triggerversion: "lua"
useluabundle: true
```

**폴더 구조**:
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

## 주의사항

### 1. 🗝️ `id`는 언제나 `triggerId`로 사용하세요.

트리거 함수의 첫 번째 매개변수는 항상 `triggerId`입니다. 이를 통해 현재 채팅 세션을 식별할 수 있습니다.

```lua
function onInput(triggerId)
    print("Current chat ID: " .. triggerId)
end
```

### 2. ❌ `stopChat()` 함수 사용 불가

`stopChat(id)` 함수는 **현재 사용할 수 없습니다**. 채팅을 중단하려면 다른 방법을 사용하세요.

### 3. ⚠️ Lua 문자열 매칭 패턴 (`%`)

Lua는 정규식 대신 `%`를 사용하는 패턴 매칭을 사용합니다.

```lua
-- 잘못된 예 (오류 발생!)
local str = "100% complete"
local found = str:find("%")  -- ERROR!

-- 올바른 예
local found = str:find("%%")  -- % 이스케이프
```

**문제점**: 패턴 오류가 발생해도 **에러 메시지가 표시되지 않고** 코드가 **조용히 중단**됩니다!

**해결법**:
- 특수 문자를 항상 이스케이프하세요: `( ) . % + - * ? [ ] ^ $`
- 또는 `string.find(str, "text", 1, true)` - 4번째 인자를 `true`로 설정 (리터럴 검색)

### 4. ⚠️ 인덱스 불일치

```lua
-- getChatLength는 1부터 시작
local length = getChatLength(id)  -- 예: 5

-- 하지만 setChat, getChat 등은 0부터 시작!
for i = 0, length - 1 do
    local msg = getChat(id, i)
    log(msg.data)
end
```

### 5. ⚠️ onInput vs onStart

| | onInput | onStart |
|---|---------|---------|
| **실행 시점** | 메시지 전송 시 | 프롬프트 생성 시 |
| **권한 레벨** | 중간 | **높음** |
| **민감도** | 낮음 | **높음** |
| **용도** | 입력 검증 | 채팅 수정, 변수 설정 |

**권장**: 강력한 기능이 필요하면 `onStart`를, 간단한 입력 처리는 `onInput`을 사용하세요.

### 6. ⚠️ 비동기 함수

**반드시 `:await()`를 사용해야 하는 함수들:**
- `generateImage()` - 이미지 생성
- `getCharacterImageMain()`, `getPersonaImageMain()` - 이미지 가져오기
- `simpleLLM()`, `LLM()`, `LLMMain()`, `axLLM()`, `axLLMMain()` - LLM 호출
- `getTokens()` - 토큰 계산
- `hash()` - 해시 생성
- `loadLoreBooksMain()`, `loadLoreBooks()` - 로어북 로드

**Promise를 반환하지만 자동으로 대기되는 함수들:**
- `sleep()` - 대기
- `alertInput()`, `alertSelect()`, `alertConfirm()` - 사용자 입력

**동기 함수** (`:await()` 불필요):
- `getChatVar()`, `setChatVar()`, `getState()`, `setState()` 등 대부분의 함수

---

## 실전 예시

### 예시 1: HP 시스템

```lua
function onStart(id)
    -- 초기화
    local hp = getState(id, "hp")
    if hp == nil then
        setState(id, "hp", 100)
        alertNormal(id, "HP 시스템 초기화: 100/100")
    end
    
    -- HP 표시
    local currentHp = getState(id, "hp")
    setChatVar(id, "hp_display", "HP: " .. currentHp .. "/100")
end

function onOutput(id)
    local lastMsg = getCharacterLastMessage(id)
    
    -- 공격 받았을 때
    if lastMsg:find("공격") or lastMsg:find("타격") then
        local hp = getState(id, "hp") or 100
        hp = hp - 10
        setState(id, "hp", hp)
        
        if hp <= 0 then
            alertError(id, "HP가 0이 되었습니다!")
            addChat(id, "char", "*쓰러진다*")
        else
            alertNormal(id, "HP -10! 현재 HP: " .. hp)
        end
    end
end
```

### 예시 2: 감정 추적

```lua
function onOutput(id)
    local msg = getCharacterLastMessage(id)
    local emotion = "중립"
    
    -- 감정 분석
    if msg:find("기쁘") or msg:find("행복") or msg:find("😊") then
        emotion = "기쁨"
    elseif msg:find("슬프") or msg:find("우울") or msg:find("😢") then
        emotion = "슬픔"
    elseif msg:find("화나") or msg:find("짜증") or msg:find("😠") then
        emotion = "분노"
    end
    
    setState(id, "current_emotion", emotion)
    print("Current emotion: " .. emotion)
end
```

### 예시 3: 동적 로어북 추가

```lua
function onInput(id)
    local userMsg = getUserLastMessage(id)
    
    -- 사용자가 새로운 장소를 언급하면 로어북에 추가
    if userMsg:find("성") then
        upsertLocalLoreBook(id, "왕의 성", "거대한 성이다. 높은 탑과 두꺼운 성벽이 있다.", {
            key = {"성", "왕성", "castle"}
        })
        alertNormal(id, "로어북에 '왕의 성' 추가됨")
    end
end
```

### 예시 4: AI 응답 수정

```lua
listenEdit('editOutput', function(id, data, meta)
    -- AI 응답에서 금지어 필터링
    local forbidden = {"금지어1", "금지어2"}
    
    for _, word in ipairs(forbidden) do
        data = data:gsub(word, "***")
    end
    
    -- 말끝에 특정 어투 추가
    data = data .. " ~냥"
    
    return data
end)
```

---

## 요약

| 항목 | 설명 |
|------|------|
| **권장 버전** | Lua |
| **설정 파일** | `.metadata/settings.yaml` |
| **메인 파일** | `scripts/triggerscript/main.lua` |
| **주요 이벤트** | `onInput`, `onStart`, `onOutput` |
| **이벤트 리스너** | `listenEdit('editInput/Output/Request/Display', fn)` |
| **주의사항** | `%` 이스케이프, 인덱스 불일치, 비동기 `:await()` |
| **JSON** | 전역 `json.encode()`, `json.decode()` |
| **번들 옵션** | `useluabundle: true` → `require()` 사용 가능 |

**추가 참고**: 모든 전역 함수 목록은 `public/lua/risuai-types.lua`를 확인하세요.
