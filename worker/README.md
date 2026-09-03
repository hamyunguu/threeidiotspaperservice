# TiPS AI 챗봇 운영

메인 페이지의 채팅은 Cloudflare Worker를 거쳐 Anthropic Claude API를 호출합니다.
브라우저에는 API 키를 두지 않으며, 키는 Cloudflare의 암호화된 Worker 시크릿에만 저장합니다.
Worker 주소가 없거나 호출이 실패하면 `hero.js`의 로컬 안내 답변으로 자동 전환됩니다.

## 현재 준비 상태 (2026-09-03)

- Worker 배포 완료: `https://tips-chat.hcy070722.workers.dev`
- `ANTHROPIC_API_KEY`는 등록하지 않음
- `hero.js`의 `CHAT_API`는 비워 둠

따라서 현재 사이트는 기존 로컬 안내 답변만 사용하며 Anthropic API 비용이 발생하지 않습니다.
졸전 직전에 아래 **실제 AI 켜기**만 진행하면 됩니다.

## 실제 AI 켜기 — 비용 발생 직전의 마지막 단계

1. [Anthropic Console](https://console.anthropic.com/)에서 결제 설정 후 API 키를 만듭니다.
2. `worker` 폴더에서 `npx wrangler secret put ANTHROPIC_API_KEY`를 실행하고, 요청될 때 키를 터미널에 붙여넣습니다.
3. `hero.js`의 `CHAT_API`에 위 Worker 주소를 넣습니다.
4. 전체 웹 자산 버전을 한 단계 올린 뒤 커밋하고 `main`에 푸시합니다.

AI 사용료는 2번에서 등록한 키로 실제 요청이 들어갈 때부터 Anthropic에 발생합니다.
키를 저장소, 문서, 브라우저 코드 또는 대화창에 적지 않습니다.

## 새 계정에서 처음부터 배포할 때

1. [Anthropic Console](https://console.anthropic.com/)에서 결제 설정 후 API 키를 만듭니다.
2. [Cloudflare](https://dash.cloudflare.com/sign-up)에 로그인합니다.
3. 아래 명령을 `worker` 폴더에서 실행합니다.

```bash
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

`secret put`이 값을 요청할 때 API 키를 터미널에 직접 붙여넣습니다. 키를 저장소, 문서,
브라우저 코드 또는 대화창에 적지 않습니다.

배포 결과의 `https://tips-chat.<계정>.workers.dev` 주소를 `hero.js`의 `CHAT_API`에
넣고, 저장소 루트에서 자산 버전을 올린 뒤 커밋·푸시합니다.

```js
const CHAT_API = 'https://tips-chat.<계정>.workers.dev';
```

## 챗봇이 아는 정보

- TiPS 브랜드와 꿰기·묶기·풀기 프로그램
- Program, Archive, Service 등 현재 사이트의 페이지와 기능
- 인쇄물의 종이·평량·제본·후가공에 대한 일반 상담
- 아카이브 번호를 지정한 질문에 한해 `archive-data.js`의 해당 작품 제작 추정 정보

아카이브 사양은 완성품 사진을 보고 추정한 값이므로 AI도 이를 실제 제작 기록처럼
단정하지 않습니다. 정확한 종이명·평량·숨은 구조는 실물 확인과 인쇄소 협의가 필요합니다.

## 운영 안전장치

- 허용 Origin: 배포 사이트와 로컬 5179 포트만 허용
- 요청 제한: 같은 네트워크 기준 분당 20회
- 입력 제한: 메시지당 1,000자, 최근 12턴, 요청 본문 16KB
- 페이지 링크: 사이트 내부의 허용 목록만 버튼으로 렌더링
- API 키 누락·네트워크 오류: 브라우저의 로컬 답변으로 복구

기본 모델은 `claude-sonnet-5`이며 `wrangler.toml`의 `MODEL`에서 바꿀 수 있습니다.
모델 이름과 요금은 변경될 수 있으므로 배포 전 [Anthropic 모델 문서](https://docs.anthropic.com/en/docs/about-claude/models)
와 [요금 문서](https://docs.anthropic.com/en/docs/about-claude/pricing)를 확인합니다.

## 로컬 테스트

저장소 루트에서 정적 사이트를 띄웁니다.

```bash
python3 -m http.server 5179
```

별도 터미널에서 Worker를 실행합니다.

```bash
cd worker
npx wrangler dev
```

로컬 Worker에서 실제 API까지 시험하려면 git에서 제외된 `worker/.dev.vars`에 다음 한 줄을
둡니다. 화면 테스트 동안에만 `hero.js`의 `CHAT_API`를 `http://localhost:8787`로 바꿉니다.

```dotenv
ANTHROPIC_API_KEY=sk-ant-여기에키
```

단위 테스트와 배포 번들 검사는 다음과 같습니다.

```bash
node --test worker.test.mjs
npx wrangler deploy --dry-run
```

## 운영 변경 위치

| 변경할 것 | 파일 |
| --- | --- |
| 답변 범위·말투·상담 방식 | `worker.js`의 `SYSTEM` |
| 모델·허용 도메인·요청 제한 | `wrangler.toml` |
| 아카이브 제작 추정 정보 | 루트의 `archive-data.js` |
| 장애 시 로컬 답변 | 루트의 `hero.js` `INTENTS` |

Worker 변경 후에는 `npx wrangler deploy`, 웹 파일 변경 후에는 자산 버전을 올리고
`main`에 푸시합니다. 실시간 로그는 `npx wrangler tail`로 확인합니다.
