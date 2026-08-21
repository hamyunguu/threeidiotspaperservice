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
    if (b.drag) return;
    e.preventDefault();
    /* the capture is worth asking for — it keeps the moves coming even over
       an iframe — but it is not what the drag depends on, see below */
    try { b.el.setPointerCapture(e.pointerId); } catch (_) { /* no capture, no matter */ }
    const p = toDesign(e.clientX, e.clientY);

    // freeze it and remember where inside the sphere it was picked up
    b.speed = 0;
    b.omega = 0;
    b.drag = {
      id: e.pointerId,              // which pointer is holding this one
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
});

/* The moves are watched on the window rather than on each sphere.
   setPointerCapture is supposed to keep sending them to the element that was
   pressed, but browsers are uneven about honouring it for a mouse, and when
   it does not hold the sphere stops dead under the pointer and only catches
   up if you happen to drag back over it. Watching the window instead means
   the sphere follows wherever the pointer goes, captured or not — a held
   sphere is found by the pointer id it was picked up with. */

const heldBy = (id) => balls.find((b) => b.drag && b.drag.id === id);

window.addEventListener('pointermove', (e) => {
  const b = heldBy(e.pointerId);
  if (!b) return;
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

  ensureLoop();
}, { passive: true });

function release(b) {
  if (!b || !b.drag) return;
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
}

window.addEventListener('pointerup', (e) => release(heldBy(e.pointerId)));
window.addEventListener('pointercancel', (e) => release(heldBy(e.pointerId)));
/* let go somewhere the page never hears about — another window, another app —
   and the sphere would otherwise stay stuck to a pointer that is gone */
window.addEventListener('blur', () => balls.forEach(release));

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
   Tapping a sphere grows it into a big centred circle carrying a print tip,
   a different one each time; tapping outside shrinks it back to the sphere.
   Rendered in screen space (not the scaled stage) so it centres on the real
   viewport. */

/* Figma Tips-T / Tips-I / Tips-P / Tips-S (428:187, 428:275, 428:287, 428:292).
   The letter and the process colour belong to the sphere; the tip does not —
   it is drawn from the pool below when the sphere is opened. `gh` is the
   glyph's own height, which is what puts it in the circle at the size Figma
   drew it. */
const LETTERS = {
  T: { file: 'glyph-t.svg', gh: 62, color: '#00a0ff', dark: false },
  i: { file: 'glyph-i.svg', gh: 64, color: '#ffff00', dark: false },
  P: { file: 'glyph-p.svg', gh: 57.304, color: '#ec008c', dark: false },
  S: { file: 'glyph-s.svg', gh: 60.496, color: '#000000', dark: true },
};

/* ---------------- the tips ----------------
   Twenty of them, and the sphere hands over a different one each time. The
   body breaks where it is written to: the copy block is 317 wide at 20px, so
   every line here is set to land inside that and inside the circle's curve —
   at most six lines, or the last one falls off the bottom of the round.
   Check any edit against that width rather than trusting the look of it. */

const TIPS = [
  { title: '큰 검정은 리치블랙으로',
    body: '넓은 면을 K100 하나로만 채우면\n잉크가 얇게 깔려 얼룩이 보입니다.\nC40 M30 Y30 K100처럼 밑색을\n받쳐 주면 깊은 검정이 됩니다.' },

  { title: '작은 글씨는 반대로 K100',
    body: '검정 글씨를 네 도로 만들면\n인쇄기 핀이 조금만 어긋나도\n글자 가장자리에 색 테두리가\n생깁니다. 작은 글씨일수록\n먹 한 도로만 쓰세요.' },

  { title: '잉크는 300%를 넘기지 않기',
    body: 'CMYK 네 값을 더한 수가 300을\n넘으면 잉크가 마르지 못해\n뒷장에 묻습니다. 어두운 사진은\n인쇄용 프로파일로 변환해\n총량을 눌러 두세요.' },

  { title: '중철은 안쪽이 밀려납니다',
    body: '접어서 겹칠수록 안쪽 장이\n바깥으로 밀려 나가고, 재단하면\n그만큼 여백이 좁아집니다.\n두꺼운 중철일수록 바깥 여백을\n넉넉히 잡으세요.' },

  { title: '무선제본은 안쪽 여백을 더',
    body: '책등에 풀로 붙는 제본은\n펼쳐도 안쪽이 끝까지 열리지\n않습니다. 안쪽 여백을 바깥보다\n5mm 안팎 넓게 두어야 글이\n말려 들어가지 않습니다.' },

  { title: '종이에는 결이 있습니다',
    body: '책은 종이 결이 책등과 나란해야\n잘 펼쳐지고 오래 갑니다.\n결을 가로질러 묶으면 페이지가\n뻣뻣해지고 접힌 자리가\n갈라지기 쉽습니다.' },

  { title: '코팅하면 색이 달라집니다',
    body: '유광은 색을 진하고 선명하게,\n무광은 한 톤 가라앉게 만듭니다.\n같은 파일이라도 코팅에 따라\n인상이 바뀌니 샘플을 먼저\n보고 정하세요.' },

  { title: '0.25pt 아래 선은 사라집니다',
    body: '화면에서는 보이던 가는 선이\n인쇄에서는 끊기거나 아예\n찍히지 않습니다. 선은 0.3pt\n이상으로 두고, 흰 선이라면\n더 굵게 잡으세요.' },

  { title: '그라데이션에는 띠가 집니다',
    body: '부드럽게 변하는 면도 인쇄에서는\n계단처럼 끊겨 보일 때가 있습니다.\n아주 옅은 노이즈를 얹으면\n경계가 흩어져 눈에 덜 띕니다.' },

  { title: '흰색에 오버프린트는 금물',
    body: '흰색 개체에 오버프린트가 걸리면\n인쇄에서 그대로 사라집니다.\n화면에는 멀쩡히 보이기 때문에\n넘기기 전에 오버프린트\n미리보기로 확인하세요.' },

  { title: '종이색이 잉크색을 바꿉니다',
    body: '미색이나 크라프트지에 찍으면\n같은 값도 노랗게 돌아갑니다.\n흰 종이에서 맞춘 색은 색지 위에서\n다른 색이 되니 종이를\n먼저 정하세요.' },

  { title: '재단은 1mm쯤 어긋납니다',
    body: '테두리를 가늘게 두른 디자인은\n한쪽만 두꺼워 보이기 쉽습니다.\n가장자리와 나란한 요소는\n재단선에서 5mm쯤 떨어뜨리면\n오차가 눈에 띄지 않습니다.' },

  { title: '접히는 자리의 글자는 갈라집니다',
    body: '두꺼운 종이일수록 접은 선에서\n잉크가 터집니다. 접히는 자리에\n글자나 얇은 선을 두지 말고,\n미리 눌러 주는 오시 가공을\n넣으세요.' },

  { title: '3단 접지는 안쪽 면을 좁게',
    body: '세 번 접어 겹치는 면은 다른 면과\n같은 폭이면 접히지 않습니다.\n안으로 들어가는 면을 2mm 안팎\n좁게 잡아야 깔끔하게 접힙니다.' },

  { title: '박은 얇은 획에서 뭉갭니다',
    body: '금박이나 은박은 열과 압력으로\n눌러 붙이는 가공이라, 가는 획과\n좁은 사이는 메워지거나 끊깁니다.\n박으로 갈 요소는 굵고\n단순하게 그리세요.' },

  { title: '형광과 금은은 CMYK 밖입니다',
    body: '네 가지 잉크를 섞어도 나오지 않는\n색이 있습니다. 형광, 금, 은은\n별색 잉크를 따로 써야 하며,\n화면에서 아무리 맞춰도\n인쇄에서는 탁해집니다.' },

  { title: '얇은 종이는 뒷면이 비칩니다',
    body: '양면 인쇄에서 뒷장의 어두운 면이\n앞으로 비쳐 올라옵니다. 평량만\n보지 말고 불투명도를 함께 보고,\n한쪽이 진하다면 조금 두꺼운\n종이를 쓰세요.' },

  { title: '폰트는 넘기기 전에 윤곽선으로',
    body: '인쇄소에 그 서체가 없으면\n제멋대로 다른 글꼴로 바뀝니다.\n글자를 윤곽선으로 변환하거나\n서체를 포함해 저장하면\n모양이 그대로 갑니다.' },

  { title: '300dpi는 출력 크기 기준',
    body: '파일에 적힌 해상도가 아니라,\n실제로 인쇄될 크기에서 300dpi가\n나와야 합니다. 작은 이미지를\n키우면 숫자만 올라갈 뿐\n선명해지지 않습니다.' },

  { title: '배경은 재단선 밖으로 3mm',
    body: '배경을 완성 크기에 딱 맞추면\n재단이 조금만 어긋나도 흰 선이\n드러납니다. 사방으로 3mm씩\n더 늘려 두면 어디를 잘라도\n배경이 이어집니다.' },
];

/* Drawn from a bag rather than rolled fresh each time: twenty independent
   picks repeat themselves often enough to look broken, and the same tip twice
   running reads as if the sphere did not hear the tap. The bag hands out all
   twenty before refilling, and a refill never puts the last one back on top. */
let tipBag = [];
let tipLast = -1;

function nextTip() {
  if (!tipBag.length) {
    tipBag = TIPS.map((_, i) => i);
    for (let i = tipBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tipBag[i], tipBag[j]] = [tipBag[j], tipBag[i]];
    }
    if (tipBag[tipBag.length - 1] === tipLast && tipBag.length > 1) {
      [tipBag[0], tipBag[tipBag.length - 1]] = [tipBag[tipBag.length - 1], tipBag[0]];
    }
  }
  tipLast = tipBag.pop();
  return TIPS[tipLast];
}

/* dress each sphere in its letter once, at load */
document.querySelectorAll('.ball[data-letter]').forEach((el) => {
  const m = LETTERS[el.dataset.letter];
  if (!m) return;
  el.style.setProperty('--tip', m.color);
  el.style.setProperty('--gh', `${m.gh}px`);
  el.classList.toggle('is-dark', m.dark);
  const img = document.createElement('img');
  img.src = `assets/${m.file}?v=66`;
  img.alt = '';
  el.appendChild(img);
});

function metaFor(ballEl) {
  return LETTERS[ballEl.dataset.letter] || LETTERS.T;
}

let tipEl = null;        // the overlay currently open
let tipBall = null;      // the sphere it grew from

function fillTip(circle, tip) {
  const { title, body } = tip;
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
       <img class="tip-letter" src="assets/${meta.file}?v=66" alt="">
       <div class="tip-copy">
         <div class="tip-title"></div>
         <div class="tip-body"></div>
       </div>
     </div>`;
  document.body.appendChild(overlay);
  tipEl = overlay;

  const circle = overlay.querySelector('.tip-circle');
  fillTip(circle, nextTip());
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
