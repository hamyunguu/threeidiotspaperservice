/* ---------------------------------------------------------------
   Shared across both pages:
     1. scale the 1920-wide Figma frame to the browser width
     2. drift the white spheres around, and let the cursor grab/throw them
     3. wire up anything carrying data-href
   --------------------------------------------------------------- */

const STAGE_W = 1920;
const STAGE_H = 1080;      // base frame; taller states scroll (see fit())
const BALL_R  = 52.393;    // sphere radius in design px
const THROW_MAX = 2600;    // cap on release speed, design px/s
const SETTLE = 0.3;        // per-second decay of speed back towards cruise

const stage = document.getElementById('stage');

/* ---------------- frame scaling ---------------- */

/* CSS derives both the stage and the viewport height from --scale,
   so the expand transition and the resize share one source of truth. */
let resizeTimer;

/* Contain-fit: the frame is sized to whichever axis runs out first, so a wide
   or short window letterboxes instead of cropping. The design frame is 16:9,
   so a 16:9 window fills exactly. Measured against the base 1080 height —
   states that are deliberately taller (expanded cards, detail pages) keep this
   scale and scroll, as they always have. */
function fit() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  document.documentElement.style.setProperty('--scale', scale);
}

function onResize() {
  // suppress the height transition while the window is being dragged
  document.body.classList.add('no-transition');
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => document.body.classList.remove('no-transition'), 120);
  fit();
}

fit();
window.addEventListener('resize', onResize);

/* ---------------- data-href links ---------------- */

/* Plain click-to-navigate for static targets like the logo P glyph.
   Spheres are excluded — they carry data-href too but navigate through their
   own tap-vs-throw logic below, so a click firing after a drag must not here. */
document.querySelectorAll('[data-href]:not(.ball)').forEach((el) => {
  el.addEventListener('click', () => { window.location.href = el.dataset.href; });
});

/* ---------------- spheres ---------------- */

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/* spheres roam the visible frame, which grows when a program card opens */
const stageH = () =>
  parseFloat(getComputedStyle(document.body).getPropertyValue('--stage-h'));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const balls = [...document.querySelectorAll('.ball')].map((el) => {
  const cruise = reduceMotion ? 0 : rand(70, 140);   // resting drift speed, px/s
  const idleSpin = reduceMotion ? 0 : rand(-22, 22); // resting rotation, deg/s
  return {
    el,
    // start exactly where Figma placed them, then wander off
    x: parseFloat(el.dataset.x),
    y: parseFloat(el.dataset.y),
    rot: parseFloat(el.dataset.rot),
    heading: rand(0, Math.PI * 2),  // direction of travel, radians
    cruise,
    speed: cruise,
    omega: 0,                       // angular velocity of the heading (steering)
    baseSpin: idleSpin,             // gentle resting rotation
    spin: idleSpin,                 // graphic rotation, deg/s
    drag: null,                     // { offX, offY, samples } while held
  };
});

function draw(b) {
  b.el.style.transform =
    `translate3d(${b.x - BALL_R}px, ${b.y - BALL_R}px, 0) rotate(${b.rot}deg)` +
    (b.drag ? ' scale(1.08)' : '');
}

function step(b, dt, maxY) {
  // a hard throw flies straight; the wander fades back in as it slows down
  const wander = clamp(b.cruise / Math.max(b.speed, 1), 0, 1);
  b.omega += (Math.random() - 0.5) * 1.4 * dt * wander;
  b.omega *= Math.pow(0.5, dt);            // damping, ~1s half-life
  b.omega = clamp(b.omega, -0.7, 0.7);
  b.heading += b.omega * dt * wander;

  // bleed a throw back down to the resting drift speed (or up to it, if dropped),
  // and let the sidespin unwind to its idle rate the same way
  const k = Math.pow(SETTLE, dt);
  b.speed = b.cruise + (b.speed - b.cruise) * k;
  b.spin  = b.baseSpin + (b.spin - b.baseSpin) * k;

  b.x += Math.cos(b.heading) * b.speed * dt;
  b.y += Math.sin(b.heading) * b.speed * dt;

  // bounce off the frame edges
  if (b.x < BALL_R)           { b.x = BALL_R;           b.heading = Math.PI - b.heading; }
  if (b.x > STAGE_W - BALL_R) { b.x = STAGE_W - BALL_R; b.heading = Math.PI - b.heading; }
  if (b.y < BALL_R)           { b.y = BALL_R;           b.heading = -b.heading; }
  if (b.y > maxY - BALL_R)    { b.y = maxY - BALL_R;    b.heading = -b.heading; }

  b.rot += b.spin * dt;
}

/* ---------------- sphere-to-sphere collisions ---------------- */

const BALL_D = BALL_R * 2;

/* heading+speed is the polar form the drift uses; collisions are easier in
   cartesian, so convert on the way out */
function setVel(b, vx, vy) {
  const s = Math.hypot(vx, vy);
  if (s > 0.001) b.heading = Math.atan2(vy, vx);
  b.speed = s;
}

/* equal-mass elastic bounce. A sphere being held counts as immovable, so you
   can shove the others around with the one in your hand. */
function collide(a, b) {
  if (a.frozen || b.frozen) return;          // hidden behind an open tip
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let d = Math.hypot(dx, dy);
  if (d >= BALL_D) return;
  if (d < 0.001) { dx = 1; dy = 0; d = 0.001; }   // exactly stacked: pick an axis

  const nx = dx / d;
  const ny = dy / d;
  const aFixed = !!a.drag;
  const bFixed = !!b.drag;

  // unstack them first, so the pair can't sink into each other over frames
  if (!(aFixed && bFixed)) {
    const overlap = BALL_D - d;
    const aShare = aFixed ? 0 : bFixed ? 1 : 0.5;
    a.x -= nx * overlap * aShare;
    a.y -= ny * overlap * aShare;
    b.x += nx * overlap * (1 - aShare);
    b.y += ny * overlap * (1 - aShare);
  }

  const avx = Math.cos(a.heading) * a.speed;
  const avy = Math.sin(a.heading) * a.speed;
  const bvx = Math.cos(b.heading) * b.speed;
  const bvy = Math.sin(b.heading) * b.speed;

  const vn = (bvx - avx) * nx + (bvy - avy) * ny;
  if (vn > 0) return;                        // already moving apart

  // equal masses swap their velocity along the contact normal; against a held
  // sphere the free one reflects off it instead, so double the exchange
  const k = aFixed || bFixed ? 2 : 1;
  if (!aFixed) setVel(a, avx + k * vn * nx, avy + k * vn * ny);
  if (!bFixed) setVel(b, bvx - k * vn * nx, bvy - k * vn * ny);

  // a glancing hit sets them spinning
  if (!reduceMotion) {
    const vt = (bvx - avx) * -ny + (bvy - avy) * nx;
    if (!aFixed) a.spin = clamp(a.spin - vt / 8, -260, 260);
    if (!bFixed) b.spin = clamp(b.spin + vt / 8, -260, 260);
  }
}

function resolveCollisions(maxY) {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) collide(balls[i], balls[j]);
  }
  // a shove can push a sphere past the frame edge — pull it back inside
  balls.forEach((b) => {
    if (b.drag || b.frozen) return;
    b.x = clamp(b.x, BALL_R, STAGE_W - BALL_R);
    b.y = clamp(b.y, BALL_R, maxY - BALL_R);
  });
}

/* ---------------- grab / drag / throw ---------------- */

/* client px -> design px, reading the live scale off the stage itself */
function toDesign(clientX, clientY) {
  const r = stage.getBoundingClientRect();
  const s = r.width / STAGE_W;
  return { x: (clientX - r.left) / s, y: (clientY - r.top) / s };
}

let held = 0;

balls.forEach((b) => {
  b.el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    b.el.setPointerCapture(e.pointerId);
    const p = toDesign(e.clientX, e.clientY);

    // freeze it and remember where inside the sphere it was picked up
    b.speed = 0;
    b.omega = 0;
    b.drag = {
      offX: p.x - b.x,
      offY: p.y - b.y,
      downX: e.clientX,             // client px, for the tap-vs-drag test
      downY: e.clientY,
      downT: performance.now(),
      travel: 0,                    // total pointer travel in client px
      lastX: e.clientX,
      lastY: e.clientY,
      samples: [{ t: performance.now(), x: b.x, y: b.y }],
    };

    b.el.classList.add('is-held');
    if (++held === 1) document.body.dataset.dragging = '1';
    ensureLoop();
  });

  b.el.addEventListener('pointermove', (e) => {
    if (!b.drag) return;
    const p = toDesign(e.clientX, e.clientY);
    const maxY = stageH();
    b.x = clamp(p.x - b.drag.offX, BALL_R, STAGE_W - BALL_R);
    b.y = clamp(p.y - b.drag.offY, BALL_R, maxY - BALL_R);

    b.drag.travel += Math.hypot(e.clientX - b.drag.lastX, e.clientY - b.drag.lastY);
    b.drag.lastX = e.clientX;
    b.drag.lastY = e.clientY;

    // keep a short trail so the release can be turned into a throw
    b.drag.samples.push({ t: performance.now(), x: b.x, y: b.y });
    if (b.drag.samples.length > 8) b.drag.samples.shift();
  });

  const release = (e) => {
    if (!b.drag) return;
    const drag = b.drag;
    const now = performance.now();

    // a quick press that barely moved is a tap, not a throw -> reveal a print tip
    const isTap = drag.travel < 8 && (now - drag.downT) < 350;

    b.drag = null;
    b.el.classList.remove('is-held');
    if (--held === 0) delete document.body.dataset.dragging;

    if (isTap) { openTip(b); return; }

    const recent = drag.samples.filter((s) => now - s.t < 120);
    let vx = 0, vy = 0;
    if (recent.length >= 2) {
      const a = recent[0];
      const z = recent[recent.length - 1];
      const dt = (z.t - a.t) / 1000;
      if (dt > 0.001) { vx = (z.x - a.x) / dt; vy = (z.y - a.y) / dt; }
    }

    const thrown = Math.hypot(vx, vy);
    if (thrown > 20) {
      b.heading = Math.atan2(vy, vx);
      b.speed = Math.min(thrown, THROW_MAX);
      b.spin = reduceMotion ? 0 : clamp(vx / 14, -260, 260);  // sidespin from the flick
    }
    // released without a flick: speed stays 0 and step() eases it back to cruise

    ensureLoop();
  };

  b.el.addEventListener('pointerup', release);
  b.el.addEventListener('pointercancel', release);
});

/* ---------------- loop ---------------- */

let running = false;
let last = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);   // clamp after tab switches
  last = now;
  const maxY = stageH();

  balls.forEach((b) => { if (!b.drag && !b.frozen) step(b, dt, maxY); });
  resolveCollisions(maxY);
  balls.forEach(draw);

  // with reduced motion the spheres settle to a stop, so let the loop idle out
  if (balls.some((b) => b.drag || b.speed > 0.5 || b.cruise > 0)) {
    requestAnimationFrame(frame);
  } else {
    running = false;
  }
}

function ensureLoop() {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

balls.forEach(draw);
if (balls.length) ensureLoop();

/* ---------------- print-tip overlay ----------------
   Tapping a sphere grows it into a big centred circle carrying a random
   print tip. Tapping the circle rolls a new tip; tapping outside shrinks
   it back to the sphere. Rendered in screen space (not the scaled stage)
   so it centres on the real viewport. */

/* Figma Tips-T / Tips-I / Tips-P / Tips-S (428:187, 428:275, 428:287, 428:292).
   Each letter owns one tip and one process colour; `gh` is the glyph's own
   height, which is what puts it in the circle at the size Figma drew it. */
const LETTERS = {
  T: { file: 'glyph-t.svg', gh: 62, color: '#00a0ff', dark: false,
       title: '이미지는 300dpi로 준비하기',
       body: '웹에서 선명해 보이는 이미지도\n인쇄하면 흐릿해질 수 있습니다.\n실제 출력 크기를 기준으로 300dpi를\n권장하며, 작은 이미지를 억지로\n확대하면 화질이 개선되지\n않습니다.' },
  i: { file: 'glyph-i.svg', gh: 64, color: '#ffff00', dark: false,
       title: '재단선보다 3mm 더 채우기',
       body: '배경 이미지나 색상은 완성 사이즈에서\n끝내지 말고, 사방으로 약 3mm씩 더\n연장해 주세요. 재단 시 생길 수 있는\n미세한 오차에도 흰 여백이\n드러나지 않습니다.' },
  P: { file: 'glyph-p.svg', gh: 57.304, color: '#ec008c', dark: false,
       title: '제본 방식에 맞춰 페이지를 설계하기',
       body: '중철은 보통 전체 페이지가\n4의 배수여야 하며, 무선제본은\n페이지 수와 종이 두께에 따라 책등\n너비가 달라집니다.' },
  S: { file: 'glyph-s.svg', gh: 60.496, color: '#000000', dark: true,
       title: 'RGB보다 CMYK로 확인하기',
       body: '모니터는 빛으로 색을 표현하고,\n인쇄물은 잉크로 색을 표현합니다.\n형광빛이나 선명한 파란색처럼 일부\nRGB 색상은 인쇄 시 탁해질 수 있으니\nCMYK 변환 후 색감을\n다시 확인하세요.' },
};

/* dress each sphere in its letter once, at load */
document.querySelectorAll('.ball[data-letter]').forEach((el) => {
  const m = LETTERS[el.dataset.letter];
  if (!m) return;
  el.style.setProperty('--tip', m.color);
  el.style.setProperty('--gh', `${m.gh}px`);
  el.classList.toggle('is-dark', m.dark);
  const img = document.createElement('img');
  img.src = `assets/${m.file}?v=54`;
  img.alt = '';
  el.appendChild(img);
});

function metaFor(ballEl) {
  return LETTERS[ballEl.dataset.letter] || LETTERS.T;
}

let tipEl = null;        // the overlay currently open
let tipBall = null;      // the sphere it grew from

function fillTip(circle, meta) {
  const { title, body } = meta;
  const t = circle.querySelector('.tip-title');
  const b = circle.querySelector('.tip-body');
  // brief fade so a re-roll reads as a change
  t.style.opacity = b.style.opacity = '0';
  requestAnimationFrame(() => {
    t.textContent = title;
    b.textContent = body;
    t.style.opacity = b.style.opacity = '1';
  });
}

function openTip(b) {
  if (tipEl) return;                     // one at a time
  const meta = metaFor(b.el);
  b.frozen = true;
  b.el.style.opacity = '0';              // hide the sphere; the circle takes over
  tipBall = b;

  const overlay = document.createElement('div');
  overlay.className = 'tip-overlay';
  overlay.innerHTML =
    `<div class="tip-circle${meta.dark ? ' is-dark' : ''}" style="--tip:${meta.color}; --gh:${meta.gh}px">
       <img class="tip-letter" src="assets/${meta.file}?v=54" alt="">
       <div class="tip-copy">
         <div class="tip-title"></div>
         <div class="tip-body"></div>
       </div>
     </div>`;
  document.body.appendChild(overlay);
  tipEl = overlay;

  const circle = overlay.querySelector('.tip-circle');
  fillTip(circle, meta);
  /* the circle is drawn at its real 385, so shrink the whole thing rather than
     any of its parts when the window cannot hold it */
  const room = Math.min(window.innerWidth, window.innerHeight) * 0.86;
  circle.dataset.fit = String(Math.min(1, room / 385));

  // grow from the sphere's on-screen position to the centred circle
  const br = b.el.getBoundingClientRect();
  const cr = circle.getBoundingClientRect();      // measured while untransformed (centred)
  const dx = (br.left + br.width / 2) - (cr.left + cr.width / 2);
  const dy = (br.top + br.height / 2) - (cr.top + cr.height / 2);
  const s0 = br.width / cr.width;
  // start small, at the sphere; flush layout; then transition to full/centre so
  // the browser actually animates instead of jumping straight to the end state
  circle.style.transition = 'none';
  circle.style.transform = `translate(${dx}px, ${dy}px) scale(${s0})`;
  circle.style.opacity = '0';
  void circle.offsetWidth;                        // force reflow to register the start
  circle.style.transition = '';                   // back to the CSS transition
  requestAnimationFrame(() => {
    circle.style.transform = `translate(0, 0) scale(${circle.dataset.fit})`;
    circle.style.opacity = '1';
  });

  // keep the tip while open (clicking the circle no longer re-rolls); dismiss on backdrop
  circle.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
  circle.addEventListener('click', (e) => { e.stopPropagation(); });
  overlay.addEventListener('pointerdown', closeTip);
}

function closeTip() {
  if (!tipEl) return;
  const overlay = tipEl;
  const circle = overlay.querySelector('.tip-circle');
  const b = tipBall;
  tipEl = null; tipBall = null;

  const br = b.el.getBoundingClientRect();
  const cr = circle.getBoundingClientRect();
  const dx = (br.left + br.width / 2) - (cr.left + cr.width / 2);
  const dy = (br.top + br.height / 2) - (cr.top + cr.height / 2);
  const s0 = br.width / cr.width;
  circle.style.transform = `translate(${dx}px, ${dy}px) scale(${s0})`;
  circle.style.opacity = '0';

  const done = () => {
    overlay.remove();
    b.el.style.opacity = '';
    b.frozen = false;
    ensureLoop();
  };
  circle.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 500);   // safety net
}

window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTip(); });

/* ---------------- header: search / login / cart ----------------
   These three carry no href — they slide a panel up from the bottom of the
   viewport instead. Built here rather than in each page's markup so all five
   pages get the same panel from the one script they already load. */

const NAV_ACTIONS = {
  search: {
    label: 'SEARCH',
    placeholder: '무엇을 찾고 계신가요? 예: 제본, 종이, 꿰기',
  },
  login: {
    label: 'LOGIN',
    note: '로그인은 준비 중입니다. 지금은 로그인 없이 모든 페이지를 보실 수 있어요.',
  },
  cart: {
    label: 'CART',
    note: '장바구니는 준비 중입니다. 프로그램 신청이 열리면 여기에 담을 수 있어요.',
  },
};

/* a search term routes to the page that answers it */
const SEARCH_ROUTES = [
  { re: /(꿰|바늘|실\b)/,                    to: 'archive.html?p=1', name: '꿰기 세션' },
  { re: /(묶|매듭|끈|고무줄|밴드)/,           to: 'archive.html?p=2', name: '묶기 세션' },
  { re: /(풀기|해체|분해|뜯)/,                to: 'archive.html?p=3', name: '풀기 세션' },
  { re: /(프로그램|세션|워크숍|수업|program)/i, to: 'program.html',            name: '프로그램' },
  { re: /(아이덴티티|브랜드|로고|identity)/i,  to: 'identity.html',           name: 'Identity' },
  { re: /(서비스|가격|비용|견적|문의|service)/i, to: 'service.html',          name: 'Service' },
  { re: /(제본|종이|용지|인쇄|바인딩|paper|print|bind)/i, to: 'program.html',  name: '프로그램' },
  { re: /(홈|메인|처음|home|tips|팁스)/i,      to: 'index.html',              name: '홈' },
];

let headbar = null;      // the panel element, built on first use
let headbarKey = null;   // which nav item it is currently showing

function buildHeadbar() {
  const el = document.createElement('div');
  el.className = 'headbar';
  el.innerHTML =
    `<span class="headbar-label"></span>
     <div class="headbar-body"></div>
     <button type="button" class="headbar-close" aria-label="닫기">&times;</button>`;
  el.querySelector('.headbar-close').addEventListener('click', closeHeadbar);
  document.body.appendChild(el);
  return el;
}

function runSearch(q, hint) {
  const term = q.trim();
  if (!term) return;
  const hit = SEARCH_ROUTES.find((r) => r.re.test(term));
  if (hit) {
    hint.textContent = `${hit.name} 페이지로 이동합니다…`;
    window.location.href = hit.to;
  } else {
    hint.textContent = `'${term}'에 해당하는 페이지가 없어요. 제본·종이·프로그램처럼 검색해 보세요.`;
  }
}

function openHeadbar(key) {
  const action = NAV_ACTIONS[key];
  if (!action) return;
  headbar = headbar || buildHeadbar();
  headbarKey = key;

  headbar.querySelector('.headbar-label').textContent = action.label;
  const body = headbar.querySelector('.headbar-body');

  if (key === 'search') {
    body.innerHTML =
      `<input type="text" autocomplete="off" placeholder="${action.placeholder}" aria-label="검색어" />
       <span class="headbar-hint"></span>`;
    const input = body.querySelector('input');
    const hint = body.querySelector('.headbar-hint');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); runSearch(input.value, hint); }
    });
    // let the slide-up start before focusing, so the page doesn't jump
    setTimeout(() => input.focus(), 60);
  } else {
    body.innerHTML = `<p class="headbar-note">${action.note}</p>`;
  }

  // flush layout first so the panel actually slides instead of appearing
  void headbar.offsetWidth;
  headbar.classList.add('is-open');
  markNavOpen(key);
}

function closeHeadbar() {
  if (!headbar) return;
  headbar.classList.remove('is-open');
  headbarKey = null;
  markNavOpen(null);
}

function markNavOpen(key) {
  document.querySelectorAll('.nav-item.is-action').forEach((el) => {
    el.classList.toggle('is-open', el.dataset.action === key);
  });
}

document.querySelectorAll('.nav-item:not([href])').forEach((el) => {
  const key = el.textContent.trim().toLowerCase();
  if (!NAV_ACTIONS[key]) return;

  el.classList.add('is-action');
  el.dataset.action = key;
  el.tabIndex = 0;                       // no href, so make it keyboard reachable
  el.setAttribute('role', 'button');

  const toggle = (e) => {
    e.preventDefault();
    if (headbarKey === key) closeHeadbar();
    else openHeadbar(key);
  };
  el.addEventListener('click', toggle);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggle(e);
  });
});

window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeHeadbar(); });
