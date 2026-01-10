# RisuAI CBS (중괄호 구문)

이 문서는 @세르블루님의 원작을 기반으로 작성되었습니다.

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

## 1. 데이터 구문 (Data Syntaxes)

### 기본 정보
- `{{char}}` / `{{bot}}` - 현재 캐릭터의 이름 또는 닉네임 반환
- `{{user}}` - 현재 사용자의 이름 반환
- `{{description}}` / `{{char_desc}}` / `{{chardesc}}` - 캐릭터의 설명 필드 반환
- `{{personality}}` / `{{char_persona}}` / `{{charpersona}}` - 캐릭터의 성격 필드 반환
- `{{scenario}}` - 캐릭터 상호작용 시나리오/설정 반환
- `{{exampledialogue}}` / `{{example_dialogue}}` / `{{examplemessage}}` - 캐릭터의 예시 대화/메시지 반환
- `{{persona}}` / `{{user_persona}}` / `{{userpersona}}` - 사용자 페르소나 설명 반환
- `{{lorebook}}` / `{{world_info}}` / `{{worldinfo}}` - 활성 로어북 항목을 JSON 배열로 반환

### 채팅 관련
- `{{trigger_id}}` / `{{triggerid}}` - 수동 트리거를 발생시킨 요소의 ID 값 반환
- `{{previouscharchat}}` / `{{lastcharmessage}}` - 캐릭터가 보낸 마지막 메시지 반환
- `{{previoususerchat}}` / `{{lastusermessage}}` - 사용자가 보낸 마지막 메시지 반환
- `{{history}}` / `{{messages}}` - 채팅 기록을 JSON 배열로 반환
- `{{chatindex}}` / `{{chat_index}}` - 현재 메시지 인덱스를 문자열로 반환
- `{{lastmessage}}` - 현재 채팅의 마지막 메시지 내용 반환
- `{{lastmessageid}}` / `{{lastmessageindex}}` - 마지막 메시지의 인덱스 반환
- `{{previouschatlog}}` / `{{previous_chat_log}}` - 지정된 인덱스의 메시지 내용 반환
- `{{firstmsgindex}}` / `{{first_msg_index}}` - 선택된 첫 메시지/대체 인사말 인덱스 반환
- `{{userhistory}}` / `{{user_history}}` - 현재 채팅의 모든 사용자 메시지를 JSON 배열로 반환
- `{{charhistory}}` / `{{char_history}}` - 현재 채팅의 모든 캐릭터 메시지를 JSON 배열로 반환

### 시스템 정보
- `{{model}}` - 현재 선택된 AI 모델의 ID 반환 (예: "gpt-4", "claude-3")
- `{{axmodel}}` - 현재 선택된 보조 모델 ID 반환
- `{{role}}` - 현재 메시지의 역할 반환 ("user", "char", "system")
- `{{maxcontext}}` - 최대 컨텍스트 길이 설정을 문자열로 반환
- `{{screenwidth}}` / `{{screen_width}}` - 현재 화면/뷰포트 너비를 픽셀 단위 문자열로 반환
- `{{screenheight}}` / `{{screen_height}}` - 현재 화면/뷰포트 높이를 픽셀 단위 문자열로 반환

### 시스템 프롬프트
- `{{mainprompt}}` / `{{main_prompt}}` / `{{system_prompt}}` - AI 모델에 제공되는 메인 시스템 프롬프트 반환
- `{{jb}}` / `{{jailbreak}}` - 탈옥 프롬프트 텍스트 반환
- `{{globalnote}}` / `{{ujb}}` / `{{global_note}}` - 글로벌 노트(시스템 노트) 텍스트 반환

---

## 2. 시간 구문 (Time Syntaxes)

### 기본 시간
- `{{time}}` - 현재 로컬 시간을 HH:MM:SS 형식으로 반환
- `{{date}}` - 현재 날짜를 YYYY-M-D 형식으로 반환
- `{{isotime}}` - 현재 UTC 시간을 HH:MM:SS 형식으로 반환
- `{{isodate}}` - 현재 UTC 날짜를 YYYY-M-D 형식으로 반환
- `{{unixtime}}` - 현재 Unix 타임스탬프를 초 단위 문자열로 반환

### 메시지 시간
- `{{messagetime}}` / `{{message_time}}` - 현재 메시지가 전송된 시간을 로컬 시간 형식으로 반환
- `{{messagedate}}` / `{{message_date}}` - 현재 메시지가 전송된 날짜를 로컬 날짜 형식으로 반환
- `{{messageidleduration}}` / `{{message_idle_duration}}` - 현재 메시지와 이전 사용자 메시지 간의 시간 간격(HH:MM:SS)
- `{{idleduration}}` / `{{idle_duration}}` - 사용자의 마지막 메시지 이후 경과 시간(HH:MM:SS)
- `{{messageunixtimearray}}` / `{{message_unixtime_array}}` - 모든 메시지 타임스탬프를 JSON 배열로 반환

---

## 3. 애셋 및 미디어 구문 (Asset and Media Syntaxes)

### 애셋 표시
- `{{asset::A}}` - 추가 애셋 A를 적절한 요소 타입으로 표시
- `{{emotion::A}}` - 감정 이미지 A를 이미지 요소로 표시
- `{{audio::A}}` - 오디오 애셋 A를 오디오 요소로 표시
- `{{bg::A}}` - 배경 이미지 A를 배경 이미지 요소로 표시
- `{{bgm::A}}` - 배경 음악 컨트롤 요소 삽입
- `{{video::A}}` - 비디오 애셋 A를 비디오 요소로 표시
- `{{video-img::A}}` - 비디오 애셋 A를 이미지처럼 표시
- `{{image::A}}` - 이미지 애셋 A를 이미지 요소로 표시
- `{{img::A}}` - A를 스타일 없는 이미지 요소로 표시
- `{{path::A}}` - 추가 애셋 A의 경로 데이터 반환

### 인레이 애셋
- `{{inlay::A}}` - 스타일 없는 인레이 애셋 A 표시 (모델 요청에 삽입 안 됨)
- `{{inlayed::A}}` - 스타일 적용된 인레이 애셋 A 표시 (모델 요청에 삽입 안 됨)
- `{{inlayeddata::A}}` - 스타일 적용된 인레이 애셋 A 표시 (모델 요청에 삽입됨)

### 애셋 목록
- `{{assetlist}}` - 현재 캐릭터의 추가 애셋 이름을 JSON 배열로 반환
- `{{emotionlist}}` - 현재 캐릭터의 감정 이미지 이름을 JSON 배열로 반환
- `{{chardisplayasset}}` - 캐릭터 표시 애셋 이름을 JSON 배열로 반환
- `{{source::A}}` - 사용자 또는 캐릭터의 프로필 소스 URL 반환 (A는 "user" 또는 "char")

---

## 4. 수학 구문 (Math Syntaxes)

### 기본 계산
- `{{calc::A}}` / `{{? A}}` - 수학 표현식 A를 평가하고 결과를 문자열로 반환

### 비교 함수
- `{{equal::A::B}}` - A가 B와 같으면 "1", 아니면 "0" (문자열 비교)
- `{{notequal::A::B}}` / `{{not_equal::A::B}}` - A가 B와 다르면 "1", 아니면 "0" (문자열 비교)
- `{{greater::A::B}}` - A > B면 "1", 아니면 "0" (숫자 비교)
- `{{less::A::B}}` - A < B면 "1", 아니면 "0" (숫자 비교)
- `{{greaterequal::A::B}}` / `{{greater_equal::A::B}}` - A >= B면 "1", 아니면 "0" (숫자 비교)
- `{{lessequal::A::B}}` / `{{less_equal::A::B}}` - A <= B면 "1", 아니면 "0" (숫자 비교)

### 논리 함수
- `{{and::A::B}}` - A와 B 모두 "1"일 때만 "1" 반환
- `{{or::A::B}}` - A 또는 B 중 하나라도 "1"이면 "1" 반환
- `{{not::A}}` - A가 "1"이면 "0", 그 외는 "1" 반환

### 수학 함수
- `{{pow::A::B}}` - A의 B 거듭제곱 반환
- `{{floor::A}}` - A 이하의 최대 정수 반환
- `{{ceil::A}}` - A 이상의 최소 정수 반환
- `{{abs::A}}` - A의 절대값 반환
- `{{round::A}}` - A를 가장 가까운 정수로 반올림
- `{{remaind::A::B}}` - A를 B로 나누 나머지 반환 (오타가 보존됨)

### 집계 함수
- `{{min::A::B::C...}}` - 최소 숫자 값 반환
- `{{max::A::B::C...}}` - 최대 숫자 값 반환
- `{{sum::A::B::C...}}` - 모든 숫자 값의 합 반환
- `{{average::A::B::C...}}` - 모든 숫자 값의 산술 평균 반환

### 숫자 포매팅
- `{{fixnum::A::B}}` / `{{fix_number::A::B}}` - 숫자 A를 B 소수점 자리로 반올림
- `{{tonumber::A}}` - 문자열 A에서 숫자 문자(0-9)와 소수점 추출

---

## 5. 문자열 구문 (String Syntaxes)

### 문자열 테스트
- `{{startswith::A::B}}` - 문자열 A가 B로 시작하면 "1", 아니면 "0"
- `{{endswith::A::B}}` - 문자열 A가 B로 끝나면 "1", 아니면 "0"
- `{{contains::A::B}}` - 문자열 A가 B를 포함하면 "1", 아니면 "0"

### 문자열 변환
- `{{lower::A}}` - A의 모든 문자를 소문자로 변환
- `{{upper::A}}` - A의 모든 문자를 대문자로 변환
- `{{capitalize::A}}` - A의 첫 문자만 대문자로 변환
- `{{trim::A}}` - A의 앞뒤 공백 제거
- `{{reverse::A}}` - 문자열 A의 문자 순서 반전
- `{{replace::A::B::C}}` - A에서 B를 모두 C로 교체
- `{{length::A}}` - 문자열 A의 길이를 숫자로 반환

### 유니코드 처리
- `{{unicodeencode::A}}` / `{{unicode_encode::A}}` - A의 첫 문자 유니코드 코드 포인트 반환
- `{{unicodedecode::A}}` / `{{unicode_decode::A}}` - 유니코드 코드 포인트 A를 해당 문자로 변환
- `{{u::A}}` / `{{ue::A}}` - 16진수 유니코드 코드 A를 문자로 변환

---

## 6. 포매팅 구문 (Formatting Syntaxes)

### 줄바꿈
- `{{br}}` / `{{newline}}` - 리터럴 개행 문자 (\n) 반환
- `{{cbr}}` / `{{cnl}}` / `{{cnewline}}` - 이스케이프된 개행 문자 (\\n) 반환

### 빈 컨텐츠
- `{{blank}}` / `{{none}}` - 빈 문자열 반환

### 괄호 표시
- `{{decbo}}` / `{{bo}}` - CBS로 파싱되지 않는 { 표시
- `{{decbc}}` / `{{bc}}` - CBS로 파싱되지 않는 } 표시
- `{{displayescapedbracketopen}}` / `{{debo}}` / `{{(}}` - 파싱을 방해하지 않는 ( 표시
- `{{displayescapedbracketclose}}` / `{{debc}}` / `{{)}}` - 파싱을 방해하지 않는 ) 표시
- `{{displayescapedanglebracketopen}}` / `{{deabo}}` / `{{<}}` - HTML 파싱을 방해하지 않는 < 표시
- `{{displayescapedanglebracketclose}}` / `{{deabc}}` / `{{>}}` - HTML 파싱을 방해하지 않는 > 표시
- `{{displayescapedcolon}}` / `{{dec}}` / `{{:}}` - CBS 구분자로 파싱되지 않는 : 표시
- `{{displayescapedsemicolon}}` / `{{;}}` - 파싱을 방해하지 않는 ; 표시

---

## 7. UI 및 표시 구문 (UI and Display Syntaxes)

### 상호작용 요소
- `{{button::A::B}}` - 텍스트 A와 트리거 동작 B를 가진 HTML 버튼 생성
- `{{risu::A}}` - RisuAI 로고를 A 픽셀 크기로 표시 (기본 45px)

### 파일 표시
- `{{file::A::B}}` - 표시 모드: 파일명 A를 포맷팅된 div에 표시. 그 외: base64 컨텐츠 B를 UTF-8 텍스트로 디코딩

### 주석 및 문서화
- `{{comment::A}}` - 표시 모드에서 주석 A를 포맷팅된 div에 표시
- `{{hiddenkey::A}}` / `{{hidden_key::A}}` - 로어북 활성화 키로 작동하지만 모델 요청에는 포함 안 됨
- `{{//A}}` - 파싱 중에 제거되는 주석 A

### 특수 표시
- `{{tex}}` - TeX/LaTeX 수식 렌더링
- `{{ruby}}` - 루비 주석(독음 표시)
- `{{codeblock}}` - 코드 블록 표시
- `{{bkspc}}` - 백스페이스 문자
- `{{erase}}` - 텍스트 지우기
- `{{__}}` - 밑줄 표시

---

## 8. 랜덤 및 확률 구문 (Random and Probability Syntaxes)

### 랜덤 생성
- `{{random}}` - 0과 1 사이의 난수 반환
- `{{randint::A::B}}` - A와 B 사이의 무작위 정수 반환 (포함). 잘못된 인수면 "NaN" 반환
- `{{pick::A::B...}}` - random과 유사하지만 메시지 간 일관된 결과를 위해 해시 기반 결정적 선택 사용 (매개변수 필수, 토큰화 모드에서는 첫 번째 매개변수 반환)
- `{{roll::A}}` - RPG 표기법(XdY)을 사용한 주사위 굴림 시뮬레이션. 인수 없으면 기본 1d6. 단일 숫자는 면수로 처리
- `{{rollp::A}}` - roll과 유사하지만 같은 메시지 내에서 일관된 결과를 위해 해시 기반 무작위화 사용
- `{{dice::A}}` - 표준 RPG 표기법을 사용한 주사위 굴림 시뮬레이션. 모든 주사위의 합 반환
- `{{hash::A}}` - 입력 A로부터 결정적 7자리 해시 생성. 동일한 입력은 항상 동일한 출력 생성

---

## 9. 모듈 및 애셋 구문 (Module and Asset Syntaxes)

### 모듈 정보
- `{{module_enabled::A}}` / `{{moduleenabled::A}}` - 네임스페이스 A를 가진 모듈이 활성화되어 있으면 "1", 아니면 "0" 반환
- `{{module_assetlist::A}}` / `{{moduleassetlist::A}}` - 모듈 A에서 사용 가능한 에셋 이름의 JSON 배열 반환. 모듈을 찾을 수 없으면 빈 문자열 반환

---

## 10. 메타데이터 구문 (Metadata Syntaxes)

### 시스템 메타데이터
- `{{metadata::mobile}}` - 모바일 기기면 "1", 아니면 "0" 반환
- `{{metadata::local}}` - 로컬/Tauri 앱이면 "1", 아니면 "0" 반환
- `{{metadata::node}}` - 노드 서버면 "1", 아니면 "0" 반환
- `{{metadata::risutype}}` - 타입 반환: 'local', 'node', 또는 'web'

### 버전 정보
- `{{metadata::version}}` - 전체 버전 문자열 반환
- `{{metadata::majorversion}}` / `{{metadata::majorver}}` / `{{metadata::major}}` - 메이저 버전 번호 반환

### 언어 및 지역화
- `{{metadata::language}}` / `{{metadata::locale}}` / `{{metadata::lang}}` - 현재 언어 설정 반환
- `{{metadata::browserlanguage}}` / `{{metadata::browserlocale}}` / `{{metadata::browserlang}}` - 브라우저의 언어 설정 반환

### 모델 정보
- `{{metadata::modelshortname}}` - 모델의 짧은 이름 반환
- `{{metadata::modelname}}` - 모델의 전체 이름 반환
- `{{metadata::modelinternalid}}` - 모델의 내부 ID 반환
- `{{metadata::modelformat}}` - 모델의 포맷 타입 반환
- `{{metadata::modelprovider}}` - 모델의 제공자 반환
- `{{metadata::modeltokenizer}}` - 모델의 토크나이저 반환
- `{{metadata::maxcontext}}` - 최대 컨텍스트 설정 반환

### 특수 메타데이터
- `{{metadata::imateapot}}` - 이스터 에그: 🫖 반환
- `{{iserror::A}}` - A가 "error:"로 시작하면(대소문자 구분 없음) "1", 아니면 "0" 반환

---

## 11. 조건부 구문 (Conditional Syntaxes)

### 시스템 상태
- `{{prefill_supported}}` / `{{prefillsupported}}` / `{{prefill}}` - 현재 모델 ID가 "claude"로 시작하면 "1", 아니면 "0" 반환 (Claude 모델 여부 확인)
- `{{jbtoggled}}` - 탈옥(jailbreak) 토글이 활성화되어 있으면 "1", 아니면 "0" 반환
- `{{isfirstmsg}}` / `{{is_first_msg}}` / `{{is_first_message}}` / `{{isfirstmessage}}` - 현재 컨텍스트가 첫 번째 메시지면 "1", 아니면 "0" 반환

### 컬렉션 조건
- `{{all::A::B::C...}}` - 제공된 모든 값이 "1"이면 "1", 아니면 "0" 반환. 논리적 AND 연산 (단일 매개변수면 배열로 처리)
- `{{any::A::B::C...}}` - 제공된 값 중 하나라도 "1"이면 "1", 아니면 "0" 반환. 논리적 OR 연산 (단일 매개변수면 배열로 처리)

---

## 12. 변수 구문 (Variable Syntaxes)

### 채팅 변수
- `{{getvar::A}}` - 채팅 변수 A의 값 반환 (정의되지 않았으면 빈 문자열)
- `{{setvar::A::B}}` - 채팅 변수 A를 B로 설정 (runVar가 true일 때만 실행)
- `{{addvar::A::B}}` - 채팅 변수 A에 숫자 값 B를 더함 (runVar가 true일 때만 실행)
- `{{setdefaultvar::A::B}}` - 변수 A가 존재하지 않거나 비어있을 때만 B로 설정

### 임시 변수
- `{{tempvar::A}}` / `{{gettempvar::A}}` - 임시 변수 A의 값 반환
- `{{settempvar::A::B}}` - 임시 변수 A를 B로 설정

### 전역 변수
- `{{getglobalvar::A}}` - 전역 변수 A의 값 반환

### 제어 흐름
- `{{return::A}}` - 반환값 A를 설정하고 스크립트 강제 종료

---

## 13. 배열 구문 (Enhanced Array Syntaxes)

### 배열 생성/조작
- `{{makearray::A::B::C...}}` / `{{array::}}` / `{{a::}}` - 요소 A, B, C...로 JSON 배열 생성
- `{{arraylength::A}}` / `{{array_length::A}}` - JSON 배열 A의 길이를 문자열로 반환
- `{{arrayelement::A::B}}` / `{{array_element::A::B}}` - 배열 A의 인덱스 B 요소 반환
- `{{arraypush::A::B}}` / `{{array_push::A::B}}` - 배열 A에 요소 B를 끝에 추가한 배열 반환
- `{{arraypop::A}}` / `{{array_pop::A}}` - 배열 A에서 마지막 요소를 제거한 배열 반환
- `{{arrayshift::A}}` / `{{array_shift::A}}` - 배열 A에서 첫 요소를 제거한 배열 반환
- `{{arraysplice::A::B::C::D}}` / `{{array_splice::A::B::C::D}}` - 배열 A 수정: 인덱스 B에서 C개 요소 제거, D 삽입
- `{{arrayassert::A::B::C}}` / `{{array_assert::A::B::C}}` - 인덱스가 범위 밖일 때만 배열 A의 인덱스 B에 요소 C 설정

### 배열 변환
- `{{split::A::B}}` - 문자열 A를 구분자 B로 분할하여 JSON 배열 반환
- `{{join::A::B}}` - JSON 배열 A의 요소를 구분자 B로 결합
- `{{spread::A}}` - JSON 배열 A의 요소를 "::" 구분자로 결합
- `{{filter::A::B}}` - 배열 A를 옵션 B로 필터링: "nonempty", "unique", 또는 "all"

### 컨렉션 연산
- `{{range::A}}` - 배열 A 매개변수를 기반으로 범위 생성

---

## 14. 딕셔너리 구문 (Enhanced Dictionary Syntaxes)

### 딕셔너리 조작
- `{{makedict::A=B::C=D...}}` / `{{dict::}}` / `{{object::}}` / `{{o::}}` / `{{d::}}` - 키=값 쌍으로 JSON 객체 생성
- `{{dictelement::A::B}}` / `{{dict_element::A::B}}` / `{{object_element::A::B}}` - 딕셔너리 A에서 키 B의 값 반환
- `{{objectassert::A::B::C}}` / `{{dict_assert::A::B::C}}` - 속성이 존재하지 않을 때만 딕셔너리 A의 속성 B를 C로 설정
- `{{element::A::B}}` / `{{ele::A::B}}` - 경로 B를 사용하여 중첩된 객체/배열 탐색

---

## 15. 블록 구문 (Block Syntaxes)

### 조건부 블록
- `{{#if_pure A}}...{{/if_pure}}` - 인덴테이션/공백 처리를 보존하는 조건문
- `{{#when A}}...{{/when}}` - 연산자 지원이 있는 고급 조건문
- `{{:else}}` - #when 블록의 else 문

### 콘텐츠 보호
- `{{#pure}}...{{/pure}}` - CBS 처리 없이 콘텐츠 표시 (재파싱 문제로 더 이상 권장하지 않음)
- `{{#puredisplay}}...{{/puredisplay}}` - CBS 처리 없이 콘텐츠 표시 (raw HTML에 유용)

### 반복 블록
- `{{#each A B}}...{{/each}}` - 배열 A의 각 요소에 대해 콘텐츠 반복, 현재 요소는 B로 접근 가능
- `{{slot::A}}` - 다양한 CBS 함수에서 특정 슬롯 또는 속성에 접근하는 데 사용

### 함수 블록
- `{{position::A}}` - @@position <positionName> 데코레이터와 함께 사용할 위치 정의

---

## 16. 유틸리티 구문 (Utility Syntaxes)

### 숫자 변환
- `{{fromhex::A}}` - 16진수 A를 10진수로 변환
- `{{tohex::A}}` - 10진수 A를 16진수로 변환

### 암호화/복호화
- `{{xor::A}}` / `{{xorencrypt::A}}` / `{{xorencode::A}}` - 0xFF 키를 사용한 XOR 암호로 문자열 A 암호화, base64로 인코딩
- `{{xordecrypt::A}}` / `{{xordecode::A}}` - base64로 인코딩된 XOR 문자열 A를 원래 텍스트로 복호화
- `{{crypt::A}}` / `{{crypto::A}}` / `{{caesar::A}}` - 기본 시프트 32768을 사용한 시저 암호

## ⚠️ 주의사항

### 1. `{{#if}}` 비권장

`{{#if}}`는 더 이상 권장되지 않습니다. **`{{#when}}`을 사용하세요.**

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

`{{setvar}}`, `{{addvar}}` 같은 변수 설정 CBS는 제한적인 컨텍스트에서만 작동합니다. 복잡한 변수 조작은 [`트리거 스크립트`](./triggerscript-guide.md)를 사용하는 것을 권장합니다.

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
복잡한 데이터 구조가 필요한 경우 [`트리거 스크립트`](./triggerscript-guide.md)를 사용하세요:

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

- **CBS 함수 전체 목록**: [`src/ts/cbs.ts`](/src/ts/cbs.ts)
- **CBS 실행 로직**: [`src/ts/process/index.svelte.ts`](/src/ts/process/index.svelte.ts)