# 커스텀 스크립트 (Custom Script) 사용법

커스텀 스크립트는 정규식을 사용하여 채팅의 입력, 출력, 프롬프트, 화면 표시 등을 동적으로 수정할 수 있는 강력한 기능입니다.

## 📁 폴더 구조

```
/save/{character_name}/
├── scripts/
│   ├── customscript.json       # 커스텀 스크립트 메타데이터 (필수)
│   └── customscript/           # 출력 내용 파일들 (.md 파일)
│       ├── accent.md
│       ├── action_emphasis.md
│       └── filters/
│           └── text_emphasis.md
```

## 📋 customscript.json 구조

`customscript.json`은 모든 커스텀 스크립트를 정의하는 JSON 파일입니다.

### 기본 파일 구조

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "스크립트 제목",
      "in": "정규식 패턴",
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

### 최상위 필드

- **`type`** (string, 필수): 스크립트 타입, 항상 `"regex"`로 설정
- **`data`** (array, 필수): 커스텀 스크립트 항목들의 배열

### 각 스크립트 항목 필드

- **`comment`** (string, 필수): 스크립트 제목/설명
  - 관리 및 식별용
  - 예: `"이모티콘을 텍스트로 변환"`, `"행동 묘사 강조"`

- **`in`** (string, 필수): 매칭할 정규식 패턴
  - JavaScript 정규식 문법 사용
  - 예: `":(\\)|\\(|D|P|O)"`, `"\\*([^*]+)\\*"`
  - **CBS 사용 가능**: flag에 `<cbs>`를 포함하면 CBS 문법 사용 가능

- **`out`** (object 또는 string): 출력 내용
  - **권장**: `$ref` 객체로 `customscript/` 폴더의 `.md` 파일 참조
  - 간단한 치환은 직접 문자열로 입력 가능: `"*$1*"`
  - **CBS 사용 가능**: `{{getvar::변수명}}` 등 사용 가능
  - **경로**: 상대 경로(`./customscript/`) 또는 절대 경로(`scripts/customscript/`) 사용 가능
  - **상세 설명**: [README.md의 $ref 시스템 섹션](../README.md#ref-파일-참조-시스템) 참조

- **`type`** (string, 필수): 스크립트 적용 시점
  - `"editinput"`: 사용자 입력 수정 (전송 전)
  - `"editoutput"`: AI 응답 수정 (생성 후)
  - `"editprocess"`: 프롬프트 수정 (API 전송 전)
  - `"editdisplay"`: 화면 표시 수정 (렌더링 시)

- **`flag`** (string): 정규식 플래그 및 특수 플래그
  
  **정규식 플래그** (조합 가능):
  - `"g"`: 전역 매칭 (모든 일치 항목)
  - `"i"`: 대소문자 무시
  - `"m"`: 멀티라인 모드 (^와 $가 각 줄의 시작/끝에 매칭)
  - `"u"`: 유니코드 모드
  - `"s"`: dotAll 모드 (`.`이 줄바꿈 문자도 매칭)
  
  **특수 플래그** (정규식 플래그와 함께 사용 가능):
  - `"<order {number}>"`: 매칭 우선순위 조정 (높은 숫자일수록 우선순위 높음)
  - `"<cbs>"`: CBS 문법 활성화 (in 필드에서 CBS 사용 가능)
  - `"<move_top>"`: 매칭된 내용을 텍스트 맨 위로 이동
  - `"<move_bottom>"`: 매칭된 내용을 텍스트 맨 아래로 이동
  - `"<repeat_back>"`: 매칭된 내용을 원본 뒤에 반복
  - `"<no_end_nl>"`: 출력 끝의 줄바꿈 제거
  
  **조합 예시**:
  - `"gi"`: 전역 + 대소문자 무시
  - `"gm"`: 전역 + 멀티라인
  - `"g<cbs>"`: 전역 + CBS 활성화
  - `"gi<move_top>"`: 전역 + 대소문자 무시 + 맨 위로 이동

- **`ableFlag`** (boolean, 필수): 플래그 사용 여부
  - `true`: flag 필드의 플래그 사용
  - `false`: 플래그 무시 (기본값 g<order 0> 적용)

## 🎯 타입(Type) 상세 설명

### editinput
사용자가 입력한 텍스트를 **전송 전**에 수정합니다.

**사용 예시**:
- 이모티콘 변환
- 오타 자동 수정
- 띄어쓰기 정규화

### editoutput
AI가 생성한 응답을 **생성 후**에 수정합니다.

**사용 예시**:
- 행동 묘사 강조 (`*행동*` → `<em>행동</em>`)
- 특정 단어 치환
- 출력 형식 통일

### editprocess
LLM에 전송되는 **프롬프트**를 수정합니다. 채팅 데이터에 반영되지 않습니다.

**사용 예시**:
- 시스템 프롬프트 동적 변경
- 특정 키워드 삽입
- 컨텍스트 조정

### editdisplay
채팅 화면에 **표시되는 내용**을 수정합니다. 채팅 데이터에 반영되지 않습니다.

**사용 예시**:
- HTML/CSS로 시각적 효과 추가
- 상태창 렌더링
- 커스텀 UI 요소 삽입
- 특정 문구 숨기기

## 📂 customscript 폴더 사용법

### 권장 사항

간단한 치환을 제외하고는 **`scripts/customscript/` 폴더에 `.md` 파일을 만들어 관리하는 것을 강력히 권장**합니다.

### 사용 방법

1. **파일 생성**: `scripts/customscript/accent.md` 파일 생성
2. **내용 작성**: 출력할 텍스트 작성 (CBS 사용 가능)
3. **JSON에서 참조**: `"out": {"$ref": "./customscript/accent.md"}`

### 서브폴더 활용

```
scripts/customscript/
├── accent.md
├── action_emphasis.md
└── filters/
    ├── text_emphasis.md
    └── profanity_filter.md
```

**참조 예시**: `{"$ref": "./customscript/filters/text_emphasis.md"}`

> 경로 지정에 대한 자세한 설명은 [README.md의 $ref 시스템 섹션](../README.md#ref-파일-참조-시스템)을 참조하세요.

## 💡 CBS (Curly Braced Syntaxes) 사용

커스텀 스크립트에서 CBS 문법을 사용할 수 있습니다.

### out 파일에서 CBS 사용

**scripts/customscript/character_status.md**:
```markdown
<div class="status-card">
  <h3>{{getvar::char_name}}</h3>
  <p>HP: {{getvar::hp}}/{{getvar::max_hp}}</p>
  <p>레벨: {{getvar::level}}</p>
</div>
```

**customscript.json에서 참조**:
```json
{
  "type": "regex",
  "data": [
    {
      "comment": "상태창 표시",
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

### in 필드에서 CBS 사용

`flag`에 `<cbs>`를 포함하면 `in` 필드에서도 CBS를 사용할 수 있습니다.

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "변수 기반 매칭",
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

### 주요 CBS 함수

- `{{getvar::변수명}}` : 변수 가져오기
- `{{calc::수식}}` : 수식 계산
- `{{random::옵션1::옵션2}}` : 랜덤 선택
- `{{roll::2d6}}` : 주사위 굴리기
- `{{#when 조건}}...{{/when}}` : 조건문
- `{{raw::assetname}}` : 에셋 경로

> 자세한 CBS 문법은 [`cbs.md`](cbs.md)를 참고하세요.

## HTML/CSS 사용

`out` 필드에서 HTML과 CSS를 자유롭게 사용할 수 있습니다. 

```html
<div class="custom-box">
  <h2>상태 정보</h2>
  <p>체력: {{getvar::hp}} / {{getvar::max_hp}}</p>
</div>
```

최신 HTML 문법과 CSS 스타일을 지원합니다. 단, 일부 CSS 선택자에는 제약이 있을 수 있습니다.
`html-guide.md`에서 제약에 관한 내용을 숙지하시기 바랍니다.

자세한 내용은 [`html-guide.md`](html-guide.md)를 참고하세요.

## ⚠️ 주의사항

1. **최상위 구조**: customscript.json은 반드시 `{"type": "regex", "data": [...]}` 구조여야 합니다
2. **$ref 형식**: out 필드는 `{"$ref": "./customscript/파일명.md"}` 객체 형식 사용 권장
3. **정규식 이스케이프**: JSON에서 백슬래시(`\`)는 이중으로 작성해야 합니다 (`\\d`, `\\*` 등)
4. **flag 조합**: 여러 플래그는 연속으로 작성합니다 (`"gi"`, `"gm"`, `"g<cbs>"`)
5. **파일 경로**: 상대 경로는 `./customscript/`로 시작 (예: `{"$ref": "./customscript/accent.md"}`)