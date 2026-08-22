/* ---------------------------------------------------------------
   Hero (Figma 393:531 · header open 453:1075 · search 393:341).

   The poster and the chatbot. The header moved out to header.js once
   every page started wearing it; data-href navigation lives in script.js
   (both load alongside this one).
   --------------------------------------------------------------- */

/* ---------------- loading page (shown deliberately ~1.5s on entry) ---------------- */

const loader = document.getElementById('loader');
if (loader) {
  const dismiss = () => {
    loader.classList.add('is-done');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  };
  // hold for at least 1.5s, then a touch longer if the page is still loading
  const start = performance.now();
  window.addEventListener('load', () => {
    const held = performance.now() - start;
    setTimeout(dismiss, Math.max(0, 1500 - held));
  });
  // safety net if 'load' already fired / is blocked
  setTimeout(dismiss, 2600);
}

/* ---------------- left: the poster the numbering pages through ---------------- */

const POSTERS = [
  'assets/fig-poster.jpg?v=76',
  'assets/card-hand.jpg?v=76',
  'assets/gal-wood-a.jpg?v=76',
];

const layers = [...document.querySelectorAll('.poster img')];
const pages = [...document.querySelectorAll('.numbering button')];
const AUTO_MS = 4500;
let current = 0;
let front = 0;                 // which of the two layers is showing
let timer;

/* the incoming frame is decoded on the spare layer first, then cross-faded in,
   so the dissolve never flashes a half-loaded image */
function show(i) {
  const next = (i + POSTERS.length) % POSTERS.length;
  pages.forEach((p, n) => p.classList.toggle('is-on', n === next));
  if (next === current && layers[front].getAttribute('src')) return;
  current = next;

  const back = layers[1 - front];
  const swap = () => {
    layers[front].classList.remove('is-on');
    back.classList.add('is-on');
    front = 1 - front;
  };
  if (back.getAttribute('src') === POSTERS[current]) { swap(); return; }
  back.onload = swap;
  back.src = POSTERS[current];
}

function play() {
  clearInterval(timer);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) timer = setInterval(() => show(current + 1), AUTO_MS);
}

pages.forEach((p) => p.addEventListener('click', () => { show(Number(p.dataset.i)); play(); }));
show(0);
play();

/* ---------------- AI chatbot ----------------
   Answers come from Claude via the Cloudflare Worker in worker/ — the API
   key lives there, never on this page. Paste the deployed Worker URL into
   CHAT_API below. Leave it empty (or let a call fail) and the chat falls
   back to the local keyword map underneath, so the site never breaks. */

const CHAT_API = ''; // ← 배포한 Worker 주소. 예: 'https://tips-chat.내계정.workers.dev'

const log = document.getElementById('chatLog');
const form = document.getElementById('chatForm');
const field = document.getElementById('chatField');

const SEEDS = [
  '빈티지하고 클래식한 제본을 하고 싶어요.',
  '잘 어울리는 종이는?',
  '내 책에 어울리는 제본은 뭘까요?',
];

const INTENTS = [
  { re: /(꿰|바늘|실\b)/, text: '실과 바늘로 꿰는 제본이 궁금하시군요. 꿰기 세션에서 종이·천·철사까지 자유롭게 연결해봐요.', to: 'archive.html?p=1', label: '꿰기 세션 →' },
  { re: /(묶|매듭|끈|고무줄|밴드)/, text: '묶어서 만드는 제본이라면 묶기 세션이 맞아요. 다양한 재료로 책의 구조를 만들어봅니다.', to: 'archive.html?p=2', label: '묶기 세션 →' },
  { re: /(풀|해체|분해|뜯)/, text: '이미 만들어진 책을 거꾸로 따라가며 구조를 발견하는 풀기 세션을 추천해요.', to: 'archive.html?p=3', label: '풀기 세션 →' },
  { re: /(제본|바인딩|bind)/, text: '제본은 꿰기·묶기·풀기 세 방향으로 실험할 수 있어요. 프로그램에서 세션별로 살펴보세요.', to: 'program.html', label: '프로그램 보기 →' },
  { re: /(종이|용지|평량|무광|유광|paper)/, text: '종이는 용도와 질감, 평량(g)에 따라 크게 달라져요. 제본 방식과 함께 고르면 실패가 줄어요. 프로그램에서 재료 실험을 참고해보세요.', to: 'program.html', label: '프로그램 보기 →' },
  { re: /(빈티지|클래식|고전)/, text: '빈티지·클래식한 느낌은 실제본(꿰기)과 크라프트·미색 계열 종이가 잘 어울려요.', to: 'archive.html?p=1', label: '꿰기 세션 →' },
  { re: /(가격|비용|견적|price|얼마)/, text: '가격 안내는 서비스 페이지에서 곧 제공될 예정이에요.', to: 'service.html', label: '서비스 →' },
  { re: /(아이덴티티|브랜드|identity|로고)/, text: 'TiPS의 브랜드 아이덴티티는 Identity 페이지에서 확인할 수 있어요.', to: 'identity.html', label: 'Identity →' },
];

/* offline fallback — used when CHAT_API is unset or the call fails */
function replyFor(q) {
  const hit = INTENTS.find((i) => i.re.test(q));
  return hit || { text: '인쇄·제본·종이 무엇이든 물어보세요. 관련 프로그램으로 안내해드릴게요.', to: 'program.html', label: '프로그램 보기 →' };
}

/* faint, tappable example prompts shown before the first message */
function seed() {
  const wrap = document.createElement('div');
  wrap.className = 'cb-seed';
  wrap.id = 'chatSeed';
  SEEDS.forEach((s) => {
    const p = document.createElement('p');
    p.textContent = s;
    p.style.cursor = 'pointer';
    p.addEventListener('click', () => send(s));
    wrap.appendChild(p);
  });
  log.appendChild(wrap);
}

function bubble(role, text, hint) {
  const m = document.createElement('div');
  m.className = `msg ${role}`;
  const b = document.createElement('span');
  b.className = 'bubble';
  b.textContent = text;
  m.appendChild(b);
  if (hint) {
    const h = document.createElement('span');
    h.className = 'hint';
    h.textContent = hint;
    m.appendChild(h);
  }
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}

function navbtn(m, to, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'navbtn';
  btn.textContent = label;
  btn.addEventListener('click', () => { window.location.href = to; });
  m.appendChild(btn);
  log.scrollTop = log.scrollHeight;
}

/* the model may close an answer with [[link:page.html|버튼 문구 →]] — the tag is
   parsed into a button and never shown, so hide anything from '[[' while typing */
const LINK = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/;
const shown = (s) => s.split('[[')[0];

const history = [];
const MAX_TURNS = 12;
let busy = false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function askLocal(q) {
  await wait(350); // brief "typing" beat
  const r = replyFor(q);
  const m = bubble('bot', r.text);
  if (r.to) navbtn(m, r.to, r.label);
}

async function askClaude(q) {
  history.push({ role: 'user', content: q });

  const m = bubble('bot', '');
  m.classList.add('is-typing');
  const b = m.querySelector('.bubble');
  let full = '';

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-MAX_TURNS) }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      m.classList.remove('is-typing');
      b.textContent = shown(full);
      log.scrollTop = log.scrollHeight;
    }
    if (!full.trim()) throw new Error('empty response');
  } catch (err) {
    console.warn('chat proxy failed, using local answers:', err);
    history.pop();
    m.remove();
    await askLocal(q);
    return;
  }

  const text = shown(full).trim();
  b.textContent = text;
  history.push({ role: 'assistant', content: text });

  const hit = full.match(LINK);
  if (hit) navbtn(m, hit[1].trim(), hit[2].trim());
  log.scrollTop = log.scrollHeight;
}

async function send(text) {
  const q = text.trim();
  if (!q || busy) return;
  document.getElementById('chatSeed')?.remove();
  bubble('user', q);
  field.value = '';

  busy = true;
  field.disabled = true;
  try {
    if (CHAT_API) await askClaude(q);
    else await askLocal(q);
  } finally {
    busy = false;
    field.disabled = false;
    field.focus();
  }
}

form.addEventListener('submit', (e) => { e.preventDefault(); send(field.value); });
seed();
