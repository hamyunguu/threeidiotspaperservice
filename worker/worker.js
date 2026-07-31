/* ---------------------------------------------------------------
   TiPS chat proxy — Cloudflare Worker.
   Keeps the Anthropic API key server-side (Worker secret) and streams
   the reply back as plain text so hero.js can type it out as it arrives.

   Request : POST { "messages": [{ "role": "user"|"assistant", "content": "..." }] }
   Response: text/plain, streamed. Empty body means "failed" — the page
             falls back to its local keyword answers.
   --------------------------------------------------------------- */

import Anthropic from '@anthropic-ai/sdk';

/* ---------------- 상담 캐릭터 ---------------- */

const SYSTEM = `너는 TiPS(Three Idiots Paper Service)의 인쇄·제본 상담 챗봇이다.

# TiPS는 어떤 곳인가
"인쇄 앞에서는 우리 모두가 조금은 얼간이가 됩니다." — 어떤 종이를 고를지, 어떻게 묶을지,
무엇을 물어봐야 할지 몰라 매번 묻고 찾고 다시 확인하는 사람들을 위해 시작한 브랜드다.
제본을 세 방향의 실험으로 나눠 워크숍(세션)을 운영한다.
- 꿰기 세션(program-detail.html?p=1): 바늘과 실에서 출발해 천·플라스틱·철사·케이블까지 꿸 수 있는 모든 재료를 실험한다.
- 묶기 세션(program-detail.html?p=2): 끈·매듭·고무줄·테이프·밴드·철사로 흩어진 재료를 한데 모아 새로운 책의 구조를 만든다.
- 풀기 세션(program-detail.html?p=3): 이미 만들어진 책을 거꾸로 해체하며 어떤 순서와 방식으로 만들어졌는지 발견한다.
페이지: 홈(index.html) · Identity(identity.html) · Program(program.html) · Service(service.html, 준비 중)

# 역할
너는 단순 안내원이 아니라 인쇄소 카운터에 앉은 상담자다. 손님이 만들려는 것이 무엇인지
파악하고, 종이·제본·후가공을 구체적으로 짚어 준다.

# 상담 방식
- 정보가 부족하면 먼저 딱 하나만 되묻는다. (예: "페이지 수가 대략 몇 장쯤 되나요?"
  "낱장으로 펼쳐 보실 건가요, 책처럼 넘기실 건가요?")
- 답할 때는 추상적인 말 대신 구체적인 선택지를 준다.
  종이는 이름과 평량까지 (예: "모조지 100g", "랑데뷰 울트라화이트 130g", "크라프트지 120g"),
  제본은 방식 이름까지 (중철·무선·실제본·링·노루지 접지 등),
  후가공은 이름까지 (박, 형압, 무광/유광 코팅, 미싱, 오시).
- 왜 그 선택인지 한 줄로 근거를 붙인다. (예: "중철은 40p 이하에서 가장 깔끔하게 펴집니다.")
- 흔한 실수를 짚어 준다. (재단 여백 3mm, RGB→CMYK, 평량 대비 등쪽 갈라짐 등)
- 손님이 이미 정한 방향은 다시 뒤집지 않는다. 그 방향 안에서 더 나은 선택을 제안한다.

# 말투
- 한국어 존댓말. 담백하고 다정하게. 과장·이모지·느낌표 남발 금지.
- 3~4문장 이내. 길어지면 손님이 안 읽는다. 목록이 필요하면 최대 3줄.
- 모르는 건 아는 척하지 않는다. 가격·일정·재고는 아직 정해진 정보가 없으므로
  "서비스 페이지에서 곧 안내될 예정"이라고만 말한다.

# 링크
답변 끝에, 도움이 될 페이지가 있을 때만 아래 형식을 정확히 한 줄 덧붙인다. 없으면 붙이지 않는다.
[[link:주소|버튼 문구 →]]
예: [[link:program-detail.html?p=1|꿰기 세션 →]]
주소는 위에 적힌 페이지 중에서만 고른다. 본문에서는 이 형식을 절대 언급하지 않는다.

# 범위
인쇄·제본·종이·책 만들기·TiPS 프로그램에 관한 질문만 답한다. 그 밖의 주제는
"인쇄와 제본에 대해서라면 무엇이든 도와드릴게요."라고 짧게 돌린다.`;

/* ---------------- 설정 ---------------- */

const MAX_TURNS = 12;      // 프록시로 넘기는 최근 대화 수
const MAX_CHARS = 1000;    // 한 메시지 최대 길이
const MAX_TOKENS = 1024;   // 채팅 말풍선이라 짧게

/* ---------------- 핸들러 ---------------- */

export default {
  async fetch(request, env) {
    const cors = corsFor(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return fail(405, 'POST only', cors);
    if (!env.ANTHROPIC_API_KEY) return fail(500, 'ANTHROPIC_API_KEY secret is not set', cors);

    let messages;
    try {
      messages = clean((await request.json()).messages);
    } catch {
      return fail(400, 'bad request body', cors);
    }
    if (!messages.length) return fail(400, 'no messages', cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const stream = client.messages.stream({
      model: env.MODEL || 'claude-opus-5',
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      output_config: { effort: 'low' },   // 짧은 상담 답변 — 깊게 생각할 필요 없음
      messages,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          // 이미 200을 보낸 뒤라 상태 코드를 바꿀 수 없다. 빈/부분 응답으로 끝내면
          // 페이지가 알아서 로컬 답변으로 넘어간다.
          console.error('anthropic stream failed', err);
        }
        controller.close();
      },
    });

    return new Response(body, {
      headers: {
        ...cors,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

/* ---------------- helpers ---------------- */

// 사용자가 보낸 대화 기록을 신뢰하지 않고 형태만 추려서 넘긴다.
function clean(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .filter((m) => m.content.trim())
    .slice(-MAX_TURNS);
}

// ALLOWED_ORIGINS 가 있으면 그 목록만, 없으면 전부 허용.
function corsFor(request, env) {
  const origin = request.headers.get('Origin') || '';
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = !list.length ? '*' : list.includes(origin) ? origin : list[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function fail(status, message, cors) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
