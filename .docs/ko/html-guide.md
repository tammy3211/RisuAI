# HTML 가이드: HTML/CSS 사용법

정규식 스크립트, lua, backgroundHTML.md 등에서 HTML/CSS를 사용할 때의 가이드입니다.

## 🎨 HTML/CSS 사용 시 주의사항

Risuai에서 HTML/CSS를 사용할 때 몇 가지 제약이 있습니다.

### 💡 CSS 스타일 권장 위치

**중요**: `<style>` 태그는 커스텀 스크립트의 out 파일이 아닌 **`content/backgroundHTML.md`**에 선언하는 것을 강력히 권장합니다.

**이유**: 
- 정규식 매칭이 일어날 때마다 CSS가 중복 삽입되어 **성능 저하** 발생
- backgroundHTML.md에 선언하면 한 번만 로드되어 효율적

**권장 구조**:
```
content/
└── backgroundHTML.md   # 모든 CSS 스타일을 여기에 선언

scripts/customscript/
└── status_display.md   # HTML만 작성 (CSS 제외)
```

**content/backgroundHTML.md 예시**:
```html
<style>
.status-panel { background: #667eea; border-radius: 12px; }
.status-panel.x-risu-header { font-size: 1.2em; font-weight: bold; }
.status-panel.x-risu-stat { display: flex; justify-content: space-between; }
</style>
```

**scripts/customscript/status_display.md 예시** (CSS 없이 HTML만):
```html
<div class="status-panel">
  <div class="status-panel header">📊 캐릭터 상태</div>
  <div class="status-panel stat"><span>HP:</span><span>{{getvar::hp}}</span></div>
</div>
```

### ❌ 사용 불가

- `:root` 선택자
- JavaScript (`<script>` 태그)
- `<input type="radio">` (파싱 문제로 비추천)
- **빈 줄이 포함된 HTML 구조** (마크다운/HTML 동시 파싱 문제)

### ⚠️ HTML 구조 작성 규칙

**중요**: div 태그 사이에 빈 줄(`\n`)을 넣으면 파싱 오류가 발생합니다.

**❌ 잘못된 사용 - 빈 줄 포함**:
```html
<div>
  <div>내용1</div>

  <div>내용2</div>
</div>
```

**✅ 올바른 사용 - 빈 줄 없이 연속**:
```html
<div>
  <div>내용1</div>
  <div>내용2</div>
</div>
```

또는 **한 줄로 작성**:
```html
<div><div>내용1</div><div>내용2</div></div>
```

> **이유**: 마크다운과 HTML을 동시에 파싱하면서 빈 줄이 있으면 HTML 구조가 깨질 수 있습니다.

### ✅ CSS 클래스 네이밍 규칙

**중요**: CSS에서 연속된 클래스 선택자(`.class.subclass`)를 사용할 때 파싱 문제가 있습니다.

#### 기본 원칙

**CSS 정의**:
```css
/* ❌ 잘못된 사용 - 파싱 오류 발생 */
.status.active { color: green; }

/* ✅ 올바른 사용 - x-risu- 접두사 필수 */
.status.x-risu-active { color: green; }
```

**HTML 사용**:
```html
<!-- HTML에서는 일반적인 방식으로 작성 -->
<div class="status active">활성</div>
```

> **파싱 과정**: HTML의 `class="status active"`는 자동으로 `class="x-risu-status x-risu-active"`로 변환되어, CSS의 `.status.x-risu-active` 선택자와 매칭됩니다.

#### 부모-자식 선택자는 예외

띄어쓰기가 있는 부모-자식 관계는 `x-risu-` 접두사가 **불필요**합니다:

```css
/* ✅ 부모-자식 관계는 그대로 사용 */
.parent .child { color: blue; }
.container > .item { margin: 10px; }
```

**요약**: 
- `.class.subclass` (붙어있음) → `.class.x-risu-subclass` 사용
- `.parent .child` (띄어쓰기) → 그대로 사용

## CBS와의 조합

HTML/CSS는 CBS 템플릿과 함께 사용할 수 있습니다. CBS가 HTML보다 먼저 처리되므로, CBS 변수를 HTML에 삽입하거나 CSS 클래스에 적용할 수 있습니다.

```html
<div class="status-panel {{getvar::status_class}}">
  <div class="status-panel header">📊 {{getvar::char_name}} 상태</div>
  <div class="status-panel stat">
    <span>HP:</span>
    <span>{{getvar::hp}}/{{getvar::max_hp}}</span>
  </div>
</div>
```

자세한 내용은 [CBS 가이드](curly-braced-syntax(cbs)-guide.md)를 참고하세요.

## 📝 실전 예시: 상태창 출력

### customscript.json

```json
{
  "type": "regex",
  "data": [
    {
      "comment": "상태창 표시",
      "in": "<status>\\[(.+?)\\]</status>",
      "out": {
        "$ref": "./customscript/status_display.md"
      },
      "type": "editdisplay",
      "flag": "g",
      "ableFlag": true
    }
  ]
}
```

### content/backgroundHTML.md

```html
<style>
.status-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: 'Segoe UI', sans-serif;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.status-panel.x-risu-header {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-panel.x-risu-stat {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}
</style>
```

### scripts/customscript/status_display.md

```html
<div class="status-panel">
  <div class="status-panel header">📊 캐릭터 상태</div>
  <div class="status-panel stat">
    <span>이름:</span>
    <span>{{getvar::char_name}}</span>
  </div>
  <div class="status-panel stat">
    <span>HP:</span>
    <span>{{getvar::hp}}/{{getvar::max_hp}}</span>
  </div>
  <div class="status-panel stat">
    <span>MP:</span>
    <span>{{getvar::mp}}/{{getvar::max_mp}}</span>
  </div>
  <div class="status-panel stat">
    <span>레벨:</span>
    <span>{{getvar::level}}</span>
  </div>
  <div class="status-panel stat">
    <span>경험치:</span>
    <span>{{getvar::exp}}/{{calc::{{getvar::level}}*100}}</span>
  </div>
</div>
```

### 사용법

채팅에서 다음과 같이 입력하면:
```
<status>[Name: Airisu | HP: 80/100 | MP: 50/100 | Level: 15]</status>
```

화면에는 CSS가 적용된 예쁜 상태창이 표시됩니다.

## 📚 참고 자료

- **CBS 문법**: [`curly-braced-syntax(cbs)-guide.md`](curly-braced-syntax(cbs)-guide.md) - CBS 템플릿 사용법
- **커스텀 스크립트 처리 로직**: [`src/ts/process/scripts.ts`](/src/ts/process/scripts.ts)

## ⚠️ 주의사항

1. **HTML/CSS 제약**: `:root`, `<script>`, `radio` 사용 불가
2. **클래스 네이밍**: 서브클래스는 `x-risu-` 접두사 필수
3. **성능 고려**: CSS는 backgroundHTML.md에, HTML만 커스텀 스크립트에 작성