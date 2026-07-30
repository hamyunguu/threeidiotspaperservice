/* ---------------------------------------------------------------
   Shared across both pages:
     1. scale the 1920-wide Figma frame to the browser width
     2. drift the white spheres around, and let the cursor grab/throw them
     3. wire up anything carrying data-href
   --------------------------------------------------------------- */

const STAGE_W = 1920;
const BALL_R  = 52.393;    // sphere radius in design px
const THROW_MAX = 2600;    // cap on release speed, design px/s
const SETTLE = 0.3;        // per-second decay of speed back towards cruise

const stage = document.getElementById('stage');

/* ---------------- frame scaling ---------------- */

/* CSS derives both the stage and the viewport height from --scale,
   so the expand transition and the resize share one source of truth. */
let resizeTimer;

function fit() {
  document.documentElement.style.setProperty('--scale', window.innerWidth / STAGE_W);
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

  balls.forEach((b) => {
    if (!b.drag && !b.frozen) step(b, dt, maxY);
    draw(b);
  });

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

const TIPS = [
  ['재단선보다 3mm 더 채우기', '배경 이미지나 색은 완성 사이즈에서 끝내지 말고 사방으로 약 3mm씩 더 연장해 주세요. 재단 오차가 나도 흰 여백이 드러나지 않습니다.'],
  ['이미지는 300dpi로 준비하기', '웹에서 선명해 보여도 인쇄하면 흐릿해질 수 있어요. 실제 출력 크기 기준 300dpi를 권장하며, 작은 이미지를 억지로 확대해도 화질은 좋아지지 않습니다.'],
  ['넓은 검정은 리치블랙으로', 'K100만 쓴 큰 검정 면은 흐린 회색처럼 보일 수 있어요. C40 M30 Y30 K100 같은 리치블랙이 더 깊습니다. 단, 얇은 글자엔 K100만 쓰세요.'],
  ['RGB로 만들면 색이 변한다', '화면(RGB)과 인쇄(CMYK)는 색 영역이 달라요. 형광 초록·쨍한 파랑은 인쇄 시 탁해집니다. 처음부터 CMYK로 작업하면 색 사고를 줄일 수 있어요.'],
  ['중요한 건 안전선 안으로', '글자·로고는 재단선에서 안쪽으로 최소 3~5mm 여유를 두세요. 가장자리에 붙으면 재단 오차로 잘려나갈 수 있습니다.'],
  ['폰트는 윤곽선화 또는 임베드', '내 컴퓨터에만 있는 폰트는 인쇄소에서 다른 글꼴로 바뀔 수 있어요. 글자를 깨거나(윤곽선화) PDF에 폰트를 포함해 넘기면 안전합니다.'],
  ['선은 0.25pt보다 굵게', '화면에선 보이던 가는 선이 인쇄에선 끊기거나 사라질 수 있어요. 최소 0.25pt(약 0.09mm) 이상을 권장합니다.'],
  ['모니터 색을 100% 믿지 말 것', '모니터마다 밝기·색온도가 달라 같은 파일도 다르게 보입니다. 색이 중요하다면 실제 출력한 색 견본(교정)을 꼭 확인하세요.'],
  ['종이에 따라 색이 달라진다', '같은 잉크도 코팅지(스노우·아트지)에선 선명하게, 비코팅지(모조·문켄)에선 스며들어 차분하게 나와요. 종이를 먼저 정하고 색을 보세요.'],
  ['두꺼운 종이는 접으면 터진다', '두꺼운 종이를 접으면 접지선이 갈라져 흰 속이 보일 수 있어요(크랙). 미리 눌러주는 오시(누름선) 가공을 넣으면 깔끔합니다.'],
  ['형광·금은색은 별색으로', '쨍한 형광이나 금·은은 CMYK 조합으로 재현되지 않아요. 별색(팬톤/스팟) 잉크를 따로 지정해야 그 색이 나옵니다.'],
  ['진한 검정 표지엔 무광 주의', '무광 코팅은 고급스럽지만 진한 검정 표지에선 지문·스크래치가 유독 잘 보여요. 유광이나 코팅 후 보호막을 함께 고려하세요.'],
  ['책 페이지는 4의 배수로', '책자는 큰 종이에 여러 쪽을 앉혀 접고 재단해요. 보통 4쪽 단위로 맞아야 빈 페이지 낭비가 없습니다.'],
  ['흰색은 인쇄되지 않는다', '인쇄에서 흰색은 잉크가 아니라 종이 색이에요. 색지나 투명 소재에 흰색을 넣으려면 별도의 화이트 인쇄를 지정해야 합니다.'],
  ['검정 글자는 오버프린트로', '검정 글자 위에 다른 색이 겹칠 때 인쇄 핀이 조금만 틀어져도 테두리가 보여요. 오버프린트로 설정하면 밀림이 눈에 띄지 않습니다.'],
  ['재단은 1mm씩 밀린다고 생각', '대량 재단은 칼이 눌리며 미세하게 밀려요. 테두리 라인이나 좌우 대칭 여백은 1mm 오차를 감안해 디자인하세요.'],
  ['작은 글씨엔 4도 겹침 금지', '아주 작은 글자를 CMYK 여러 도로 만들면 핀이 틀어져 흐릿하게 겹쳐 보여요. 작은 글자는 단일 색(K100 등)으로 쓰세요.'],
  ['유광 코팅 위엔 필기 안 됨', '유광 코팅된 명함·엽서는 볼펜 글씨가 미끄러져 안 써져요. 메모 공간이 필요하면 그 부분만 코팅을 빼면 됩니다.'],
  ['파일은 PDF/X로 넘기기', '편집 원본보다 인쇄 규격인 PDF/X로 저장하면 폰트·색상·재단 정보가 함께 담겨 사고가 줄어요.'],
  ['종이 결(지목) 방향도 중요', '종이엔 결이 있어 결과 나란히 접으면 매끈, 직각으로 접으면 거칠어요. 책은 결이 제본 방향과 같아야 잘 펼쳐집니다.'],
];

const BALL_META = {
  'ball-p':      { letter: 'P', color: '#f85485', dark: false },
  'ball-hammer': { letter: 'T', color: '#ffe710', dark: false },
  'ball-pen':    { letter: 'i', color: '#0196ff', dark: false },
  'ball-s':      { letter: 'S', color: '#302929', dark: true },
};

function metaFor(ballEl) {
  const src = ballEl.querySelector('img').getAttribute('src') || '';
  // match on the full "ball-xxx.svg" so 'ball-p' doesn't also swallow 'ball-pen'
  const key = Object.keys(BALL_META).find((k) => src.includes(k + '.svg'));
  return BALL_META[key] || BALL_META['ball-p'];
}

let tipEl = null;        // the overlay currently open
let tipBall = null;      // the sphere it grew from

function fillTip(circle) {
  const [title, body] = TIPS[Math.floor(Math.random() * TIPS.length)];
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
    `<div class="tip-circle${meta.dark ? ' is-dark' : ''}" style="--tip:${meta.color}">
       <div class="tip-letter">${meta.letter}</div>
       <div class="tip-title"></div>
       <div class="tip-body"></div>
     </div>`;
  document.body.appendChild(overlay);
  tipEl = overlay;

  const circle = overlay.querySelector('.tip-circle');
  fillTip(circle);

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
    circle.style.transform = 'translate(0, 0) scale(1)';
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
