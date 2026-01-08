# 에셋 (Assets) 사용 가이드

RisuAI 캐릭터에서 사용할 수 있는 이미지, 동영상, 오디오 등의 에셋 관리 방법을 설명합니다.

---

## 📂 에셋 폴더 구조

```
/save/{character_name}/
└── assets/
    ├── icon/           # 캐릭터 프로필 이미지
    ├── emotions/       # 감정 이미지들
    └── other/          # 추가 에셋 (이미지, 동영상, 오디오 등)
```

---

## 에셋 유형

### 1. `image` - 캐릭터 아이콘

캐릭터의 기본 프로필 이미지입니다.

**character.json 설정:**
```json
{
  "image": "assets/icon/character.png"
}
```

**특징:**
- 캐릭터 목록, 채팅 화면 등에 표시됩니다
- PNG, WebP, JPEG, GIF 등 이미지 파일 지원
- 권장 위치: `assets/icon/`

---

### 2. `emotionImages` - 감정 이미지

캐릭터의 감정 상태에 따라 표시되는 이미지들입니다.

**character.json 설정:**
```json
{
  "viewScreen": "emotion",
  "emotionImages": [
    ["happy", "assets/emotions/happy.png"],
    ["sad", "assets/emotions/sad.png"],
    ["angry", "assets/emotions/angry.png"],
    ["neutral", "assets/emotions/neutral.png"]
  ]
}
```

**배열 구조:** `[이름, 경로]`
- **이름**: 감정의 식별자 (소문자 권장)
- **경로**: 이미지 파일의 경로

**사용 방법:**

1. **프롬프트에서 감정 표현:**
```markdown
*웃으며* "좋은 아침이야!" [emotion: happy]
```

2. **CBS에서 감정 이미지 삽입:**
```
{{emotion::happy}}
```

3. **트리거 스크립트로 자동 감정 변경:**
감정 관련 키워드를 감지하여 자동으로 이미지를 변경할 수 있습니다.

**주의사항:**
- `viewScreen`이 `"emotion"`으로 설정되어야 작동합니다
- 이미지 이름은 대소문자 구분 없이 매칭됩니다 (내부적으로 소문자로 변환)
- 기본 감정 이미지가 없으면 첫 번째 이미지가 기본값으로 사용됩니다

---

### 3. `additionalAssets` - 추가 에셋

이미지, 동영상, 오디오, 폰트, CSS 등 다양한 추가 에셋을 포함할 수 있습니다.

**character.json 설정:**
```json
{
  "additionalAssets": [
    ["배경음악", "assets/other/bgm.mp3", "mp3"],
    ["아이템 이미지", "assets/other/sword.png", "png"],
    ["컷신 영상", "assets/other/intro.mp4", "mp4"],
    ["커스텀 폰트", "assets/other/myfont.ttf", "ttf"]
  ]
}
```

**배열 구조:** `[이름, 경로, 확장자]`
- **이름**: 에셋의 식별자 (자유 작성, 대소문자 구분 없음)
- **경로**: 파일의 경로
- **확장자**: 파일 확장자 (`png`, `mp3`, `mp4`, `ttf` 등)

**지원 파일 형식:**

| 유형 | 확장자 | 용도 |
|------|--------|------|
| **이미지** | png, webp, jpeg, jpg, gif, avif, svg | 일러스트, 아이콘, 배경 |
| **동영상** | mp4, webm, avi, m4v | 컷신, 애니메이션 |
| **오디오** | mp3 | 배경음악, 효과음 |
| **폰트** | ttf, otf, woff, woff2 | 커스텀 폰트 |
| **스타일** | css | 커스텀 CSS |

**사용 방법:**

#### 이미지 삽입
```
{{img::배경음악}}
{{image::아이템 이미지}}
{{asset::아이템 이미지}}
```

#### 동영상 삽입
```
{{video::컷신 영상}}
```

#### 오디오 삽입
```
{{audio::배경음악}}
{{bgm::배경음악}}
```

#### 배경 이미지 설정
```
{{bg::배경이미지}}
```

#### 파일 경로 가져오기
```
{{raw::아이템 이미지}}
{{path::커스텀 폰트}}
```
- CSS `url()` 등에서 사용할 수 있는 경로를 반환합니다

**CBS 예시:**

```html
<!-- 배경 이미지 -->
<div style="background-image: url('{{raw::배경이미지}}')">
  콘텐츠
</div>

<!-- 커스텀 폰트 -->
<style>
@font-face {
  font-family: 'CustomFont';
  src: url('{{raw::커스텀 폰트}}');
}
</style>

<!-- 이미지 표시 -->
{{img::아이템}}

<!-- 비디오 표시 -->
{{video::인트로}}

<!-- 오디오 재생 -->
{{audio::bgm}}
```

**주의사항:**
- 에셋 이름은 **대소문자 구분 없이** 매칭됩니다 (내부적으로 소문자로 변환)
- 같은 이름의 에셋이 여러 개 있으면 첫 번째 것이 사용됩니다
- 큰 파일은 성능에 영향을 줄 수 있으니 적절한 크기로 최적화하세요

---

### 4. `ccAssets` - Character Card Assets

**참고:** 이 필드는 일반적으로 **사용자가 직접 작성하지 않습니다**.

캐릭터 카드를 export/import할 때 시스템이 자동으로 관리하는 메타데이터입니다.

**구조:**
```json
{
  "ccAssets": [
    {
      "type": "icon",
      "uri": "...",
      "name": "main",
      "ext": "png"
    }
  ]
}
```

**설명:**
- Character Card V3 형식으로 export할 때 사용
- 에셋을 카드 내부에 임베드하기 위한 메타데이터
- 수동 편집 권장하지 않음

---

## 에셋 사용 팁

### 1. 에셋 크기 최적화
- 이미지: WebP 형식 사용 권장 (PNG보다 작은 용량)
- 동영상: 짧은 컷신은 GIF 또는 WebM 사용
- 오디오: MP3 비트레이트 조절 (128kbps 권장)

### 2. 네이밍 규칙
```json
{
  "additionalAssets": [
    ["battle_theme", "assets/other/battle.mp3", "mp3"],
    ["item_sword", "assets/other/sword.png", "png"],
    ["emotion_happy", "assets/other/happy_alt.png", "png"]
  ]
}
```
- 카테고리 접두사 사용 (battle_, item_, emotion_ 등)
- 언더스코어로 단어 구분
- 영문 소문자 권장

### 3. 폴더 구조화
```
assets/
├── icon/
│   └── main.png
├── emotions/
│   ├── happy.png
│   ├── sad.png
│   └── angry.png
└── other/
    ├── bgm/
    │   ├── battle.mp3
    │   └── calm.mp3
    ├── items/
    │   ├── sword.png
    │   └── shield.png
    └── effects/
        └── explosion.gif
```

### 4. 조건부 에셋 로딩

**트리거 스크립트와 조합:**
```lua
-- 특정 이벤트에서만 BGM 재생
if scene == "battle" then
  return "{{bgm::battle_theme}}"
end
```

**CBS 조건문:**
```
{{#when {{getvar::location}} == castle}}
  {{bg::castle_background}}
{{/when}}
```

---

## 디버깅

### 에셋이 표시되지 않을 때

1. **경로 확인**
   - 파일이 실제로 해당 위치에 있는지 확인
   - 대소문자, 확장자 확인

2. **이름 확인**
   - CBS에서 사용한 이름이 정확한지 확인
   - 대소문자는 무시되므로 `{{img::MyImage}}` = `{{img::myimage}}`

3. **파일 형식 확인**
   - 지원되는 형식인지 확인
   - 손상되지 않은 파일인지 확인

4. **viewScreen 설정 (감정 이미지)**
   - `viewScreen`이 `"emotion"`으로 설정되어 있는지 확인

---

## 에셋 관련 CBS 함수

### `{{emotionlist}}`
사용 가능한 감정 이미지 목록을 JSON 배열로 반환합니다.

```
{{emotionlist}}
// 출력: ["happy","sad","angry","neutral"]
```

### `{{assetlist}}`
사용 가능한 추가 에셋 목록을 JSON 배열로 반환합니다.

```
{{assetlist}}
// 출력: ["배경음악","아이템 이미지","컷신 영상"]
```

---

## 요약

| 필드 | 용도 | 배열 구조 | 필수 여부 |
|------|------|-----------|-----------|
| `image` | 캐릭터 아이콘 | 문자열 | 선택 |
| `emotionImages` | 감정별 이미지 | `[이름, 경로]` | 선택 |
| `additionalAssets` | 기타 미디어 | `[이름, 경로, 확장자]` | 선택 |
| `ccAssets` | 카드 메타데이터 | 객체 배열 | 자동 생성 |

**권장 사용법:**
- `emotionImages`: 캐릭터가 다양한 표정을 보여야 할 때
- `additionalAssets`: 배경, 아이템, BGM 등 추가 콘텐츠가 필요할 때
- CBS/트리거와 조합하여 동적인 연출 구현
