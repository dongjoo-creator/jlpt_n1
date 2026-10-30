# JLPT N1 연습 (PWA)

서버 없이 동작하는 정적 PWA입니다. 빌드 단계가 없고, 폴더 전체를 정적 호스팅(GitHub Pages, Netlify 등)에 올리면 됩니다.
HTTPS(또는 localhost)에서 열어야 홈 화면 추가와 오프라인이 동작합니다.

## 폴더 구조

```
config/exam.js        시험일·시험 안내·영역 이름·오늘의 문제 기본 구성 (여기만 고치면 됨)
questions/index.json  읽어 올 문제 파일 목록
questions/*.json      문제 (스키마는 아래)
src/                  앱 코드 (views/ 화면, ui/ 공용 UI, store.js 기록 저장)
styles/app.css        디자인 토큰과 레이아웃 (600px 기준 compact/medium)
sw.js                 오프라인 캐시
tools/serve.mjs       로컬 미리보기 서버 (npm run dev, 의존성 없음)
tools/check.mjs       배포 전 점검 (npm run check)
tools/make-icons.ps1  홈 화면 아이콘 PNG 생성 (npm run icons)
docs/screenshots/     450×720, 672×896, 896×672 확인 화면
```

## 오늘의 문제

- 평일(월–금)은 어휘 20·문법 20·독해 10, 주말(토·일)은 10·10·5 가 기본이고, 설정 화면에서 바꿀 수 있습니다.
- 날짜마다 한 번 뽑아 저장하므로 하루 동안은 같은 세트입니다.
- 안 푼 문제 → 마지막에 틀린 문제 → 맞힌 지 오래된 문제 순으로 뽑고, 같은 지문의 독해 문제는 함께 넣습니다.
- 홈의 영역 카드와 연습 탭도 오늘 세트 안에서만 풉니다. 세트 밖은 오답노트 복습뿐입니다.

## 단어장

- 예문은 따로 저장하지 않고, 단어를 저장한 문제에서 그 단어가 든 문장을 꺼내 씁니다 (빈칸·문장배열은 정답으로 채움).
- 일본어·후리가나·한글 가리기는 이 기기에 기억되고, 카드를 누르면 그 카드만 잠깐 보입니다.

## 문제 추가하기

1. `questions/` 에 JSON 파일을 추가하거나 기존 파일 배열에 문제를 덧붙입니다.
2. 새 파일이면 `questions/index.json` 의 `files` 에 파일 이름을 넣습니다.
3. 코드와 `sw.js` 는 고치지 않아도 됩니다. 문제는 온라인일 때 새로 받아 캐시합니다.
4. `npm run check` 로 형식 오류와, 지문에 없어 밑줄이 안 그어지는 단어를 확인합니다.

- `answer` 는 **1부터** 셉니다 (1 = 첫 번째 보기).
- `translation_ko` 는 해설 아래 "본문 번역"으로 나옵니다. 빈칸은 정답으로 채운 문장, 독해는 `지문: …\n\n질문: …`, 용법은 보기 네 문장의 번역입니다.
- `verified: true` 가 아니면 "검수 전" 표시가 붙습니다.
- `words[].surface` 가 지문에 **표기 그대로** 있으면 점선 밑줄이 그어집니다 (활용형은 못 잡음).
- 문제 문장 끝의 `（밑줄: 覆す）` 표기는 지우고, 문장 안의 `覆す` 에 실선 밑줄을 긋습니다. `"underline": "覆す"` 필드로 지정해도 됩니다.
- `correct_order`, `star_position` 이 있으면 해설에 정답 순서를 함께 보여 줍니다.
- 형식이 잘못된 문제는 건너뛰고, 설정 화면의 "불러오지 못한 문제"에 이유가 나옵니다.

## 코드를 고쳐 배포할 때

`sw.js` 의 `VERSION` 을 올리고, 새 파일을 만들었다면 `SHELL_FILES` 에 추가합니다.
`npm run check` 가 `SHELL_FILES` 에 빠진 파일을 알려 줍니다.
사용자는 앱을 한 번 더 열면 새 버전을 받습니다.

빌드 단계가 없으므로 `npm install` 은 필요 없습니다 (의존성 0개). Node 는 미리보기와 점검에만 씁니다.

## 로컬 미리보기

```
npm run dev
```

http://localhost:5173 을 엽니다. localhost 에서는 수정이 바로 보이도록 service worker 를 기본으로 끕니다.
오프라인을 시험하려면 `http://localhost:5173/?sw=1` 로 한 번 엽니다.

## 나중에 추가할 자리

- 청해: `config/exam.js` 의 `SECTIONS.listening.enabled` 를 true 로 하고, 문제에 음성 필드를 더한 뒤 `views/quiz.js` 에서 재생 UI를 그립니다.
- 다크모드: `styles/app.css` 의 `:root` 토큰을 `prefers-color-scheme: dark` 에서 다시 정의합니다.
- 동기화: 기록은 `src/store.js` 한 곳에서만 저장하므로, 여기에 서버 전송을 붙이면 됩니다.
