/* ---------------------------------------------------------------
   TiPS chat proxy — Cloudflare Worker.
   Keeps the Anthropic API key server-side (Worker secret) and streams
   the reply back as plain text so hero.js can type it out as it arrives.

   Request : POST { "messages": [{ "role": "user"|"assistant", "content": "..." }] }
   Response: text/plain, streamed. Empty body means "failed" — the page
             falls back to its local keyword answers.
   --------------------------------------------------------------- */

import Anthropic from '@anthropic-ai/sdk';
import { ARCHIVE_SPECS } from '../archive-data.js';

/* ---------------- 상담 캐릭터 ---------------- */

const SYSTEM = `너는 TiPS(Three Idiots Paper Service)의 인쇄·제본 상담 챗봇이다.

# TiPS와 사이트에서 확인된 정보
"인쇄 앞에서는 우리 모두가 조금은 얼간이가 됩니다."라는 생각에서 시작한 인쇄·제본 브랜드다.
- 꿰기(archive.html?p=1): 바늘과 실에서 출발해 종이·천·플라스틱·철사·케이블 등 꿸 수 있는 재료와 방법을 실험한다.
- 묶기(archive.html?p=2): 끈·매듭·고무줄·밴드·철사 등으로 서로 다른 재료를 묶어 책의 구조를 만든다.
- 풀기(archive.html?p=3): 책을 해체하거나 풀고 펼치는 움직임을 통해 구조와 새로운 읽기 방식을 발견한다.
- Program(program.html): 세 프로그램의 개요를 본다.
- 각 Archive: 작품 이미지를 누르면 형태, 종이·재료, 평량·두께, 제본 방식, 인쇄·후가공 추정치를 본다.
- Service(service.html): 포스터·책·제품의 사양을 입력하고 파일을 올려 미리보며 견적 문의를 준비한다.
- Identity(identity.html), 로그인, 장바구니의 일부 기능은 아직 준비 중이다.

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
- 일반적인 제작 추천과 TiPS 사이트에서 확인된 사실을 구분한다.
- 가격·일정·재고를 확정하지 않는다. 조건을 물은 뒤 Service에서 견적 문의를 준비하도록 안내한다.
- 아카이브 제작 정보는 완성품 사진을 보고 추정한 값이다. 실제 제작 기록처럼 단정하지 않고,
  정확한 종이명·평량·숨은 구조는 실물 확인과 인쇄소 협의가 필요하다고 밝힌다.

# 링크
답변 끝에, 도움이 될 페이지가 있을 때만 아래 형식을 정확히 한 줄 덧붙인다. 없으면 붙이지 않는다.
[[link:주소|버튼 문구 →]]
예: [[link:archive.html?p=1|꿰기 아카이브 →]]
허용 주소는 index.html, identity.html, program.html, archive.html?p=1, archive.html?p=2,
archive.html?p=3, service.html뿐이다. 본문에서는 이 형식을 절대 언급하지 않는다.

# 범위
인쇄·제본·종이·책 만들기·TiPS 프로그램에 관한 질문만 답한다. 그 밖의 주제는
"인쇄와 제본에 대해서라면 무엇이든 도와드릴게요."라고 짧게 돌린다.`;

/* ---------------- 설정 ---------------- */

const MAX_TURNS = 12;      // 프록시로 넘기는 최근 대화 수
const MAX_CHARS = 1000;    // 한 메시지 최대 길이
const MAX_TOKENS = 1024;   // 채팅 말풍선이라 짧게
const MAX_BODY_BYTES = 16 * 1024;

/* ---------------- 핸들러 ---------------- */

export default {
  async fetch(request, env) {
    const { allowed, headers: cors } = corsFor(request, env);

    if (!allowed) return fail(403, 'origin not allowed', cors);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return fail(405, 'POST only', cors);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return fail(415, 'application/json required', cors);
    }

    const declaredSize = Number(request.headers.get('Content-Length') || 0);
    if (declaredSize > MAX_BODY_BYTES) return fail(413, 'request too large', cors);

    if (env.CHAT_RATE_LIMITER) {
      try {
        const key = request.headers.get('CF-Connecting-IP') || 'unknown';
        const { success } = await env.CHAT_RATE_LIMITER.limit({ key });
        if (!success) return fail(429, 'too many requests', cors, { 'Retry-After': '60' });
      } catch (err) {
        console.error('rate limiter failed open', err);
      }
    }

    let messages;
    try {
      const raw = await readLimitedBody(request, MAX_BODY_BYTES);
      if (raw === null) return fail(413, 'request too large', cors);
      messages = clean(JSON.parse(raw).messages);
    } catch {
      return fail(400, 'bad request body', cors);
    }
    if (!messages.length) return fail(400, 'no messages', cors);
    if (messages.at(-1).role !== 'user') return fail(400, 'last message must be user', cors);
    if (!env.ANTHROPIC_API_KEY) return fail(500, 'chat service is not configured', cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const stream = client.messages.stream({
      model: env.MODEL || 'claude-sonnet-5',
      max_tokens: MAX_TOKENS,
      system: SYSTEM + archiveContext(messages),
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

// The model receives one matching archive record, only when the conversation
// names both a session and an item. This keeps ordinary requests small while
// allowing follow-up questions such as "그 작품 평량은?".
function archiveContext(messages) {
  let session;
  let number;
  const userMessages = messages.filter((m) => m.role === 'user').slice(-6).reverse();

  for (const { content } of userMessages) {
    if (!session) {
      if (content.includes('꿰기')) session = '1';
      else if (content.includes('묶기')) session = '2';
      else if (content.includes('풀기')) session = '3';
    }
    if (!number) {
      const numbered = content.match(/(?:아카이브|작품|사진|이미지)\s*#?\s*(\d{1,2})|\b(\d{1,2})\s*(?:번|번째)/);
      number = Number(numbered?.[1] || numbered?.[2] || 0) || undefined;
    }
    if (session && number) break;
  }

  if (!session || !number) return '';
  const archive = ARCHIVE_SPECS[session];
  const item = archive?.items[number];
  if (!item) {
    return `\n\n# 이번 대화의 아카이브 조회\n${archive?.name || '해당'} 아카이브에는 ${number}번 작품 정보가 없다. 없는 정보를 만들지 않는다.`;
  }

  return `\n\n# 이번 대화의 아카이브 참고 정보\n` +
    `${archive.name} 아카이브 ${number}번 (archive.html?p=${session})\n` +
    `형태: ${item.form}\n종이·재료: ${item.material}\n평량·두께: ${item.weight}\n` +
    `제본 방식: ${item.binding}\n인쇄·후가공: ${item.finish}\n` +
    `위 값은 완성품 사진을 보고 추정한 정보다. 정확한 제작 사양으로 단정하지 않는다.`;
}

async function readLimitedBody(request, limit) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

// ALLOWED_ORIGINS 가 있으면 그 목록만, 없으면 전부 허용.
function corsFor(request, env) {
  const origin = request.headers.get('Origin') || '';
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowed = !list.length || list.includes(origin);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed) headers['Access-Control-Allow-Origin'] = list.length ? origin : '*';
  return { allowed, headers };
}

function fail(status, message, cors, extra = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, ...extra, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export { archiveContext, clean, corsFor, readLimitedBody };
