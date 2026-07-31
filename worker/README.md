# TiPS 챗봇 프록시 배포하기

정적 페이지에는 API 키를 둘 수 없어서, Cloudflare Worker가 중간에서 Claude API를 대신 호출합니다.
키는 Worker 시크릿에만 저장되고 브라우저에는 절대 내려가지 않습니다.

아래 순서대로 다섯 단계면 끝납니다. 1번과 2번만 회원님 계정으로 하셔야 하는 부분입니다.

---

## 1. Anthropic API 키 발급 (유료)

1. https://console.anthropic.com 로그인
2. **Billing**에서 결제 수단 등록 후 크레딧 충전 (최소 $5)
3. **API keys → Create Key** → 만들어진 `sk-ant-...` 키를 복사해 둡니다 (이 화면을 닫으면 다시 볼 수 없습니다)

> 요금은 쓴 만큼만 나갑니다. 기본값인 `claude-opus-5` 기준으로 짧은 상담 한 번에 대략 1~3원 수준입니다.
> 더 저렴하게 쓰시려면 `wrangler.toml`의 `MODEL`을 `claude-sonnet-5`나 `claude-haiku-4-5`로 바꾸면 됩니다.

## 2. Cloudflare 계정 만들기

https://dash.cloudflare.com/sign-up — 무료 플랜으로 충분합니다 (하루 10만 요청).

## 3. 배포

필요한 패키지는 이미 설치해 두었습니다 (`worker/node_modules`). 혹시 다시 설치해야 한다면:

```bash
cd "/Users/hamyunguu/Desktop/UX/웹 v3/worker" && npm install
```

> 이때 `Your cache folder contains root-owned files` 오류가 나면 npm 캐시 권한 문제입니다.
> `sudo chown -R 501:20 "/Users/hamyunguu/.npm"` 를 한 번 실행하면 해결됩니다 (비밀번호 필요).

Cloudflare 로그인 (브라우저가 열립니다):

```bash
npx wrangler login
```

API 키를 시크릿으로 등록 (붙여넣으라고 나오면 1번에서 복사한 `sk-ant-...` 키를 붙여넣고 Enter):

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

배포:

```bash
npx wrangler deploy
```

성공하면 마지막 줄에 주소가 찍힙니다:

```
https://tips-chat.<계정이름>.workers.dev
```

## 4. 사이트에 주소 붙이기

`hero.js` 맨 위 `CHAT_API`에 방금 받은 주소를 넣습니다.

```js
const CHAT_API = 'https://tips-chat.내계정.workers.dev';
```

비워 두면 지금처럼 로컬 키워드 답변으로 동작하고, 주소를 넣으면 실제 Claude가 답합니다.
API가 죽거나 크레딧이 떨어져도 자동으로 로컬 답변으로 되돌아가므로 사이트는 깨지지 않습니다.

## 5. 커밋 & 푸시

```bash
cd "/Users/hamyunguu/Desktop/UX/웹 v3" && git add -A && git commit -m "AI 챗봇: Claude API 연결" && git push
```

---

## 손보고 싶을 때

| 무엇을 | 어디를 |
| --- | --- |
| 챗봇 성격·말투·상담 방식 | `worker.js` 위쪽 `SYSTEM` 문자열 |
| 모델 (비용/속도) | `wrangler.toml`의 `MODEL` |
| 호출 허용 도메인 | `wrangler.toml`의 `ALLOWED_ORIGINS` |
| 답변 길이 상한 | `worker.js`의 `MAX_TOKENS` |
| 로컬 폴백 답변 | `hero.js`의 `INTENTS` |

고친 뒤에는 `npx wrangler deploy`를 다시 실행하면 즉시 반영됩니다.

로컬에서 먼저 시험해 보려면:

```bash
cd "/Users/hamyunguu/Desktop/UX/웹 v3/worker" && npx wrangler dev
```

`http://localhost:8787`이 뜨는데, 그 주소를 `CHAT_API`에 잠깐 넣어 두고 테스트하시면 됩니다.
로컬 실행에는 시크릿 대신 `worker/.dev.vars` 파일이 필요합니다 (`.gitignore`에 이미 등록해 두었습니다):

```
ANTHROPIC_API_KEY=sk-ant-여기에키
```

## 잘 안 될 때

- **답이 로컬 키워드 응답으로만 나온다** → `CHAT_API` 주소 오타, 크레딧 소진, 또는 `ALLOWED_ORIGINS`에
  현재 접속 중인 주소가 빠져 있는 경우입니다. 브라우저 콘솔에 `chat proxy failed` 로그가 찍힙니다.
- **로그 확인** → `npx wrangler tail` 을 켜 두면 Worker 쪽 에러가 실시간으로 보입니다.
