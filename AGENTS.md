# TiPS — 작업 인수인계

이 저장소를 처음 여는 사람(또는 AI 도구)이 먼저 읽는 문서입니다. 코드를 읽으면
알 수 있는 것은 적지 않았습니다. **왜 그렇게 되어 있는지**, 그리고 **모르고 건드리면
깨지는 것**만 적습니다.

## 무엇인가

Three idiots Paper Service(TiPS)의 소개 사이트. 빌드 도구 없는 정적 페이지 —
HTML + CSS + 바닐라 JS뿐입니다. 번들러도 프레임워크도 없습니다.

- 배포: GitHub Pages, `main`에 푸시하면 그대로 올라갑니다
- 저장소: `hamyunguu/threeidiotspaperservice`
- 주소: https://hamyunguu.github.io/threeidiotspaperservice/
- 로컬 확인: `python3 -m http.server 5179` 후 http://localhost:5179

---

## 1. 프레임 규약 — 모든 좌표는 1920 × 1080 기준

Figma 아트보드가 1920 × 1080이고, 페이지도 그 좌표계를 그대로 씁니다.

- `.stage`가 1920px 폭의 실제 캔버스이고, `script.js`가 창 크기를 보고
  `--scale`을 계산해 통째로 `transform: scale()` 합니다
- 그래서 CSS에 적히는 값은 전부 **Figma 픽셀 그대로**입니다. 화면 픽셀로
  환산하지 마세요
- 세로로 긴 페이지(아카이브)는 `--stage-h`를 JS가 재서 씁니다

### `--shift` — 헤더가 열리면 본문이 내려간다

```
body            { --shift: 0px; }
body.is-head-open { --shift: 65px; }
```

괘선(`.h-rule`)은 닫히면 58, 열리면 123에 있습니다. **본문은 괘선에서 68 아래**가
기본이고, `--shift`를 받아 함께 내려갑니다.

- 자리를 옮기는 규칙에는 반드시 `transition: top .32s cubic-bezier(.4, 0, .2, 1)`을
  같이 답니다. 안 그러면 헤더를 지날 때마다 툭툭 끊깁니다
- 높이가 정해진 판은 내려가는 만큼 위에서 줄입니다
  (`height: calc(XXXpx - var(--shift))`) — 안 그러면 아래로 넘칩니다
- 키가 큰 것(아카이브 갤러리, 로그인 폼, 카트 주문서)은 `top` 대신
  `transform: translateY(var(--shift))`로 옮깁니다. `top`은 레이아웃이라
  움직이는 0.32초 동안 매 프레임 다시 계산됩니다

**예외 둘**: 로그인과 identity의 본문은 헤더에 매달린 것이 아니라 프레임 안에
떠 있는 덩어리라, 68로 당기지 않고 제자리를 지킵니다(로그인은 괘선에서 191).
`--shift`만 받습니다.

---

## 2. ⚠️ 스크립트는 전역 스코프를 공유합니다

모든 JS가 평범한 `<script>`입니다. 모듈이 아닙니다. **한 페이지에 함께 실리는
두 파일이 최상위에서 같은 이름을 선언하면, 나중 파일이 통째로 죽습니다.**
콘솔에 에러 한 줄 남기고 조용히 죽기 때문에 찾기 어렵습니다.

실제로 두 번 났습니다 — `front`(header.js ↔ hero.js), `stage`(script.js ↔ order.js).
히어로가 로딩 화면에서 멈춰 있던 원인이 이것이었습니다.

**JS를 건드렸으면 매번 돌리세요:**

```bash
node -e '
const fs=require("fs");
const names=f=>{const o=[];fs.readFileSync(f,"utf8").split("\n").forEach((l,i)=>{const m=l.match(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);if(m)o.push([m[1],i+1]);});return o;};
for(const h of fs.readdirSync(".").filter(x=>x.endsWith(".html"))){
  const srcs=[...fs.readFileSync(h,"utf8").matchAll(/src="([^"]+\.js)[^"]*"/g)].map(m=>m[1]);
  const seen=new Map();const dup=[];
  for(const s of srcs) for(const [n,ln] of names(s)){ if(seen.has(n)) dup.push(`${n} (${seen.get(n)} ↔ ${s}:${ln})`); else seen.set(n,`${s}:${ln}`);}
  console.log(h.padEnd(22), dup.length?"DUPES: "+dup.join(", "):"OK");
}'
```

---

## 3. ⚠️ 캐시 — 자산 버전을 매번 올립니다

모든 자산이 `?v=NN`을 답니다. **고치고 나면 전 파일의 번호를 함께 올리세요.**

```bash
sed -i '' 's|v=59|v=60|g' *.html *.js *.css
```

안 올리면 브라우저가 옛 파일을 그대로 씁니다. 실제로 헤더를 고쳐 놓고
`header.js?v=51`을 그대로 둬서, 배포는 됐는데 화면은 안 바뀌는 일이 있었습니다.

HTML 자체는 버전 쿼리를 달 손잡이가 없고 GitHub Pages가 `max-age=600`으로
내려보내므로, 각 페이지에 재검증 메타를 넣어 두었습니다:

```html
<meta http-equiv="cache-control" content="no-cache" />
<meta http-equiv="expires" content="0" />
```

---

## 4. Figma 대응표

파일 키 `fkseEjWBveRNFbec1SKeZQ` (Web-Mobile)

| 페이지 | 노드 |
| --- | --- |
| 헤더 (공용) | 393:531 닫힘 · 453:1075 열림 · 393:341 검색 · 428:121 하위 페이지 |
| 히어로 `index.html` | 393:531 |
| 프로그램 `program.html` | 505:443 닫힘 · 508:490 / 508:569 / 508:661 열림 · 카드 505:563 |
| 아카이브 `archive.html?p=1\|2\|3` | 476:821 꿰기 · 476:1289 묶기 · 476:1363 풀기 |
| 세션 마크 | 476:719 (Program1/2/3) |
| 로그인 `login.html` | 515:564 |
| 카트 `cart.html`, `?item=1` | 515:654 빈 카트 · 515:699 주문 있음 |

시안을 다시 읽을 때는 Figma MCP의 `get_design_context`(코드) + `get_metadata`(정확한
x/y/w/h)를 같이 씁니다. **좌표는 metadata 쪽이 정확합니다** — design_context는
퍼센트로 환산해 주는데 반올림이 섞입니다.

---

## 5. 페이지 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` + `hero.js` | 히어로. 포스터 슬라이드, 챗봇, 프로그램 카트리지 |
| `program.html` + `program.js` | 색 블록 세 장이 좌우로 열리는 아코디언 (94 ↔ 1560) |
| `archive.html` + `archive.js` | 세션별 갤러리. `?p=`로 고름. 페이지가 길어 스크롤 |
| `service.html` + `order.js` | 주문서. 3D 미리보기(three.js). 가장 큰 파일 |
| `login.html` + `login.js` | 로그인 |
| `cart.html` + `cart.js` | 카트. `?item=1`이면 주문이 든 상태 |
| `identity.html` | 준비 중 페이지 |
| `program-detail.html` | **옛 프로그램 상세 페이지. 이제 어디서도 링크되지 않음** |
| `script.js` | 공용 — `--scale`, 떠다니는 구, 프린트 팁, 검색, `data-href` |
| `header.js` | 공용 헤더 |
| `cursor.js` | 커스텀 커서 |

---

## 6. 시안을 일부러 따르지 않은 곳

되돌리기 전에 이유를 보세요. 대부분 시안 쪽 실수이거나, 시안이 다루지 않은
상태입니다.

- **로그인 본문 위치** — 괘선에서 191 (다른 페이지는 68). 떠 있는 구성이라
  68까지 올리면 아래로 464가 빕니다
- **'다른 프로그램' 화살표** — 시안은 꿰기(476:821)에만 그려 두었지만 세 장 모두에
  남겼습니다. 세션을 넘길 방법이 그것뿐입니다
- **풀기 MENU 위치** — 시안(476:1363)은 71이지만 115. 나머지 두 장과 공용 헤더가 115
- **떠다니는 구(T·i·P·S)** — 프로그램 시안에 없지만 남겼습니다. 페이지 고유가 아니라
  사이트의 장치입니다
- **아카이브 좌상단** — 재단 마크는 있고 타깃(⊕)만 없습니다. 시안이 그렇습니다
  (뒤로 가기 화살표가 그 자리라서)
- **카트의 부가세 / 공급가액** — 시안에 라벨이 서로 바뀐 것으로 보입니다
  (`부가세 14.300` / `공급가액 1.430`). 합계는 맞아서 **시안 그대로** 두었습니다
- **로그인 폼** — 계정 서버가 없어 `preventDefault()`로 붙잡습니다. 그냥 두면
  아이디와 비밀번호가 주소창에 실립니다

### 풀기 마크는 두 페이지에서 원 위치가 다릅니다

같은 컴포넌트(476:716)인데 인스턴스 값이 달라 서로 다르게 그려집니다. 오타가
아닙니다.

| | 원 x |
| --- | --- |
| 아카이브 | 0 · 28 · 56 · 120 · 208 |
| 프로그램 카드 | 0 · 35 · 70 · 105 · 208 |

### 아카이브 사진 수가 시안 칸 수와 다릅니다

| | 시안 칸 | 실제 사진 |
| --- | --- | --- |
| 꿰기 | 23 | 23 ✓ |
| 묶기 | 22 | 20 → 마지막 단이 두 칸 짧음 |
| 풀기 | 18 | 20 → 남는 두 장이 제 비율로 붙음 |

---

## 7. 알아두면 좋은 동작들

- **헤더는 헤더 위에서만 열립니다.** 호버 존은 괘선까지 — 닫히면 58, 열리면
  `--shift`만큼 늘어 펼쳐진 메뉴로 커서를 옮겨도 닫히지 않습니다. 괘선 아래는
  페이지입니다
- **구 드래그는 `window`에서 듣습니다.** `setPointerCapture`는 마우스에서
  브라우저마다 지켜 주는 정도가 달라, 놓치면 구가 포인터 아래 멈춰 섭니다.
  집을 때의 포인터 번호로 어느 구가 잡혔는지 찾습니다
- **커서는 포인터 이벤트만 씁니다.** 구를 집을 때 `preventDefault()`가 브라우저가
  대신 만들어 주던 마우스 이벤트까지 막아서, `mousemove`로 움직이면 드래그 내내
  얼어붙습니다
- **아카이브 `fitStage()`는 65를 더 얹습니다.** 헤더를 열면 갤러리째 내려가는데
  여유가 없으면 마지막 줄이 잘립니다

---

## 8. 챗봇 (선택)

히어로의 챗봇은 Cloudflare Worker를 거쳐 Claude API를 부릅니다. 정적 페이지에
키를 둘 수 없어서입니다. `worker/README.md`에 배포 순서가 있습니다.

`hero.js`의 `CHAT_API`가 비어 있으면 미리 적어 둔 답변으로 대신 동작합니다.
**지금은 비어 있습니다** — 배포하지 않아도 사이트는 멀쩡합니다.

---

## 9. 남은 일

- `assets/tips-lockup.png`가 1배수 PNG입니다. THREE / idiots / PAPER / SERVICE
  락업인데 Futura와 Avara가 웹폰트 없는 유료 서체라 그림으로 내보냈고, Figma MCP가
  원본 크기까지만 내줍니다. **고해상도 화면에서 무릅니다 — Figma에서 SVG로 뽑아
  바꾸는 것이 좋습니다**
- `program-detail.html` / `program-detail.js`는 어디서도 링크되지 않습니다. 지울지
  결정이 필요합니다
- 로그인의 회원가입 · 아이디 찾기 · 비밀번호 찾기 · 소셜 버튼, 카트의 주문하기는
  아직 갈 곳이 없습니다
- `assets/prog-thread.jpg`, `prog-book.jpg`, `arrow-chevron.svg`, `logo.svg`는
  지금 쓰이지 않습니다

---

## 10. 작업 방식

- **끝나면 커밋하고 `origin/main`에 푸시합니다.** 푸시하지 않으면 배포되지 않습니다
- 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 씁니다. 이 저장소에서는 커밋 메시지가
  결정의 기록입니다
- 자산 버전 올리는 것을 잊지 마세요 (3번)
- 레이아웃을 바꿨으면 브라우저에서 좌표를 재서 시안과 대조합니다. 눈으로 보고
  넘기면 몇 px씩 어긋납니다
