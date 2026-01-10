# 로어북 (Lorebook) 구조 및 사용법

## 📁 폴더 구조

```
/save/{character_name}/
├── lorebook.json              # 로어북 메타데이터 (필수)
└── content/lorebook/          # 로어북 내용 파일들 (.md 파일)
    ├── world_setting.md
    ├── character_v.md
    └── important_rules.md
```

## 📋 lorebook.json 구조

`lorebook.json`은 로어북의 모든 항목을 정의하는 JSON 파일입니다.

### 기본 파일 구조

```json
{
  "type": "risu",
  "ver": 1,
  "data": [
    {
      "key": "키워드1, 키워드2, keyword",
      "comment": "로어북 제목",
      "insertorder": 100,
      "mode": "normal",
      "alwaysActive": false,
      "selective": false,
      "secondkey": "",
      "content": {
        "$ref": "content/lorebook/example.md"
      },
      "folder": "",
      "useRegex": false,
      "extentions": {
        "risu_case_sensitive": false
      }
    }
  ]
}
```

### 최상위 필드

- `type` (string, 필수): 로어북 타입, 항상 `"risu"`로 설정
- `ver` (number, 필수): 로어북 버전, 현재 `1` 사용
- `data` (array, 필수): 로어북 항목들의 배열

### 각 로어북 항목 필드

- `key` (string, 필수): 주요 매칭 키워드
  - 쉼표(`,`)로 구분하여 여러 키워드 지정 가능
  - 예: `"세계, 세계관, world, setting"`
  - 대화에 이 키워드가 등장하면 로어북이 활성화됨

- `comment` (string, 필수): 로어북 항목의 제목/설명
  - 관리 및 식별용
  - 예: `"세계관 설정"`, `"주인공 V"`

- `insertorder` (number, 필수): 삽입 순서
  - 숫자가 높을수록 프롬프트 뒤쪽에 배치됨
  - 토큰 한계로 로어북이 잘릴 경우 **앞 순서(낮은 숫자)부터 제외**됨
  - 권장: 중요한 항목은 100, 덜 중요한 항목은 80-90

- `mode` (string, 필수): 로어북 타입
  - `"normal"`: 일반 로어북 항목
  - `"folder"`: 폴더 (다른 항목을 그룹화)
  - ⚠️ 다른 타입(`multiple`, `constant`, `child`)은 사용하지 않음

- `alwaysActive` (boolean, 필수): 항상 활성화 여부
  - `true`: 키워드 매칭 없이 항상 프롬프트에 삽입
  - `false`: 키워드가 매칭될 때만 활성화
  - 예: 중요한 규칙이나 기본 설정에 사용

- `selective` (boolean, 필수): 2차 키워드 사용 여부
  - `true`: `key`와 `secondkey` **모두** 매칭되어야 활성화
  - `false`: `key`만 매칭되면 활성화

- `secondkey` (string): 2차 매칭 키워드
  - `selective: true`일 때만 사용
  - `key`와 `secondkey` 모두 매칭되어야 활성화됨

- `content` (object 또는 string, 필수): 로어북 내용
  - **권장**: `$ref` 객체로 `content/lorebook/` 폴더의 `.md` 파일 참조
  - 예: `{"$ref": "content/lorebook/world_setting.md"}` → `content/lorebook/world_setting.md` 파일 사용
  - 짧은 내용은 직접 문자열로 입력 가능: `"이것은 짧은 로어북입니다."`

- `folder` (string): 속한 폴더의 key
  - 해당 로어북이 어느 폴더에 속하는지 지정
  - 폴더의 `key` 값과 일치해야 함
  - 예: `"\uf000folder:world_info"`

- `useRegex` (boolean): 정규식 사용 여부
  - `true`: `key`를 정규식으로 해석
  - `false`: 일반 문자열로 매칭

- `extentions` (object): 확장 옵션
  - `risu_case_sensitive` (boolean): 대소문자 구분 여부
    - `true`: 대소문자를 구분하여 매칭
    - `false`: 대소문자 무시

## 📂 폴더(Folder) 사용법

### 폴더와 일반 항목의 차이

- **폴더**: 다른 로어북 항목을 그룹화하는 컨테이너
- **일반 항목**: 실제 내용을 담고 있는 로어북

### 폴더 정의 방법

```json
{
  "key": "\uf000folder:world_info",
  "comment": "🌍 세계관 폴더",
  "insertorder": 100,
  "mode": "folder",
  "alwaysActive": false,
  "selective": false,
  "secondkey": "",
  "content": "",
  "folder": "",
  "useRegex": false,
  "extentions": {
    "risu_case_sensitive": false
  }
}
```

폴더 key 네이밍 규칙 (권장):
- `"\uf000folder:폴더이름(혹은 uuid)"` 형식 사용
- 예: `"\uf000folder:characters"`, `"\uf000folder:world_info"`, `"\uf000folder:de69f788-cd22-4561-aa0d-8579030a5f1d"`

### 폴더에 항목 넣기

일반 항목의 `folder` 필드에 폴더의 `key` 값을 입력:

```json
{
  "key": "V, 브이, 주인공",
  "comment": "주인공 V",
  "insertorder": 100,
  "mode": "normal",
  "alwaysActive": false,
  "selective": false,
  "secondkey": "",
  "folder": "\uf000folder:characters",
  "content": {
    "$ref": "content/lorebook/character_v.md"
  },
  "useRegex": false,
  "extentions": {
    "risu_case_sensitive": false
  }
}
```

## 💡 content 폴더 사용법

### 권장 사항

로어북의 content 내용은 **`content/` 폴더에 `.md` 파일을 만들어 관리하는 것을 강력히 권장**합니다.

### 사용 방법

1. **파일 생성**: `content/lorebook/world_setting.md` 파일 생성
2. **내용 작성**: 마크다운 형식으로 로어북 내용 작성
3. **JSON에서 참조**: `"content": {"$ref": "content/lorebook/world_setting.md"}`

### 폴더 구조 활용

`content/lorebook/` 폴더에서 서브폴더를 사용할 수 있습니다:

```
content/lorebook/
├── world/setting.md       # content/lorebook/world/setting.md
├── world/locations/city.md # content/lorebook/world/locations/city.md
└── characters/hero.md     # content/lorebook/characters/hero.md
```

**참조 형식**: `{"$ref": "content/lorebook/폴더명/파일명"}`

### 예시

**lorebook.json**:
```json
{
  "type": "risu",
  "ver": 1,
  "data": [
    {
      "key": "세계, 세계관",
      "comment": "세계관 설정",
      "insertorder": 100,
      "mode": "normal",
      "alwaysActive": false,
      "selective": false,
      "secondkey": "",
      "content": {
        "$ref": "content/lorebook/world_setting.md"
      },
      "folder": "",
      "useRegex": false,
      "extentions": {
        "risu_case_sensitive": false
      }
    }
  ]
}
```

**content/lorebook/world_setting.md**:
```markdown
# 세계관 설정

이 세계는 사이버펑크 세계관입니다.
2077년, 거대 기업이 지배하는 미래 도시...
```

## 🔧 CBS (Curly Braced Syntaxes) 사용

로어북 `content`에서 CBS 템플릿 문법 `{{}}` 를 사용할 수 있습니다.

### 주요 CBS 사용 예시

```markdown
# 캐릭터 상태

- 이름: {{getvar::char_name}}
- 레벨: {{getvar::char_level}}
- HP: {{calc::{{getvar::base_hp}}+{{getvar::bonus_hp}}}}
- 현재 기분: {{random::좋음::보통::나쁨}}

{{#when {{? {{getvar::char_level}}>10}}}}
## 숙련된 전사
당신은 수많은 전투를 겪은 베테랑입니다.
{{/when}}
```

### 자세한 CBS 문법

CBS의 전체 함수 목록과 상세 사용법은 [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax\(cbs\)-guide.md)를 참고하세요.

## 🏷️ 데코레이터(Decoration) 문법

데코레이터는 로어북 항목의 동작을 세밀하게 제어할 수 있는 고급 옵션입니다. content 파일의 맨 위에 `@@`로 시작하는 한 줄을 추가하면 해당 효과가 적용됩니다.

### 주요 데코레이터 목록 및 설명

- `@@depth N` : 해당 로어북을 N번째 깊이에 삽입 (중요도 조절)
- `@@reverse_depth N` : 뒤에서 N번째 깊이에 삽입 (덜 중요한 항목)
- `@@activate_only_after N` : N번째 메시지 이후에만 활성화
- `@@activate_only_every N` : N번째마다 주기적으로 활성화
- `@@role A` : 해당 로어북을 특정 역할(A)로 삽입 (`user`, `assistant`, `system`)
- `@@scan_depth N` : 지정한 깊이만큼 키워드 검색
- `@@is_greeting N` : N번째 인사말로 간주
- `@@position A` : 프롬프트 내 위치 지정 (`personality`, `scenario`, `pt_<name>` 등)
- `@@ignore_on_max_context` : 컨텍스트가 가득 찼을 때 무시
- `@@additional_keys A,B,C...` : 추가 키워드가 있을 때만 활성화
- `@@exclude_keys A,B,C...` : 제외 키워드가 있으면 비활성화
- `@@probability N` : N% 확률로 활성화
- `@@activate` : 무조건 활성화
- `@@dont_activate` : 무조건 비활성화

### 사용 예시

```markdown
@@role user
@@depth 1
@@activate_only_after 5

이 캐릭터는 플레이어가 직접 조작하는 주인공입니다.
...
```

> 여러 데코레이터를 조합하여 사용할 수 있습니다. 한 줄에 하나씩 작성하세요.
> 자세한 문법과 동작은 RisuAI 메인 프로젝트의 [`src/ts/process/lorebook.svelte.ts`](/src/ts/process/lorebook.svelte.ts)에서 확인할 수 있습니다.

### 주의사항
- 데코레이터는 반드시 content 파일의 맨 위에 위치해야 합니다.
- 잘못된 값이나 오타가 있으면 무시될 수 있습니다.
- 실제 적용 결과는 프롬프트 구조와 토큰 한계에 따라 달라질 수 있습니다.

## 📚 참고 자료

- **CBS 문법**: [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax\(cbs\)-guide.md) - CBS 템플릿 사용법
- **로어북 타입 정의**: [`src/ts/storage/database.svelte.ts`](/src/ts/storage/database.svelte.ts) (Line 1122-1145)
- **로어북 실행 로직**: [`src/ts/process/index.svelte.ts`](/src/ts/process/index.svelte.ts)
- **데코레이터 처리**: [`src/ts/process/lorebook.svelte.ts`](/src/ts/process/lorebook.svelte.ts)

## ⚠️ 주의사항

2. **최상위 구조**: `type`, `ver`, `data` 필드는 필수입니다.
3. **content 참조**: `$ref` 객체 형식(`{"$ref": "경로"}`)을 사용하여 외부 파일 참조를 권장합니다.
4. **mode 속성**: `normal`과 `folder`만 사용하세요. 다른 타입은 이 프로젝트에서 지원하지 않습니다.
5. **폴더 key 형식**: `\uf000folder:이름` 형식 권장 (필수 아님)
6. **insertorder**: 중요한 항목일수록 높은 숫자 사용
7. **content 파일**: 관리 용이성을 위해 `content/lorebook/` 폴더에 `.md` 파일로 저장 권장
8. **키워드 선택**: 너무 흔한 단어는 피하고, `selective: true`와 `secondkey` 활용
