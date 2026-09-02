/* ---------------------------------------------------------------
   Program archive — Figma 559:606 (꿰기) / 695:886 (묶기) / 695:984 (풀기),
   session mark 476:719, all measured off the 1920 × 1080 frame.

   One page, three sessions, picked with ?p=1|2|3. Everything Figma draws
   differently between the three lives in SESSIONS below; the frame around
   it — header, rule, crop marks, back arrow — is the same on all three.

   The new archive gallery shares one system across all three sessions:
   five 322 × 384 black frames, 20px apart, with every photograph centred
   at exactly 200px wide. Only the gallery origin differs slightly:

              mark          gallery x, y      frame / gap
     꿰기     284 × 114     115, 545          322 × 384 / 20
     묶기     284 ×  76     120, 540          322 × 384 / 20
     풀기     284 ×  76     120, 545          322 × 384 / 20

   The archive intro starts at y=151 in all three current frames. The gallery
   begins at y=545, leaving the same deliberate breathing room below the copy.

   The gallery runs well past the 1080 frame, so this is the page whose
   stage grows to its content (see body.archive in the stylesheet) and
   the window scrolls it.
   --------------------------------------------------------------- */

const V = '?v=85';

/* ---------------- the session mark (476:719) ----------------
   Five 76px discs on a 284 box, with the two syllables laid over the
   first and last. Each session arranges them differently — 꿰기 is the
   only two-row one, and 풀기 spaces three discs evenly at the left before
   leaving a gap to 기 — so the discs are listed per session rather than
   shared. `syl` is the y Figma puts both syllables at. */

const MARKS = {
  1: { h: 114, syl: 51, discs: [[52, 0], [104, 38], [156, 0], [0, 38], [208, 38]] },
  2: { h: 76, syl: 13, discs: [[52, 0], [104, 0], [0, 0], [156, 0], [208, 0]] },
  3: { h: 76, syl: 13, discs: [[35, 0], [70, 0], [0, 0], [105, 0], [208, 0]] },
};

/* ---------------- the galleries ----------------
   Every tuple is [badge, photo height, photo top].  The last value matters:
   Figma rounds some vertically-centred photographs by half a pixel, so using
   top:50% would still leave a visible 1px mismatch.  These are the literal
   metadata coordinates from 559:635 / 727:1501 / 727:1534. */

const GALLERIES = {
  1: [
    [1, 232, 76], [2, 171, 107], [3, 206, 89], [4, 270, 57], [5, 165, 110],
    [6, 256, 64], [7, 165, 110], [8, 227, 79], [9, 231, 77], [10, 273, 56],
    [11, 286, 49], [12, 214, 85], [13, 233, 76], [14, 163, 111], [15, 214, 85],
    [16, 245, 70], [17, 267, 59], [18, 284, 50], [19, 273, 56], [20, 252, 66],
    [21, 163, 111], [22, 167, 109],
  ],
  2: [
    [1, 232, 76], [2, 274.400024, 55.299988], [3, 206, 89], [4, 270, 57],
    [5, 226.153809, 79.423096], [6, 256, 64], [7, 165, 110], [8, 227, 79],
    [9, 231, 77], [10, 273, 56], [11, 286, 49], [13, 233, 76], [14, 163, 111],
    [15, 214, 85], [16, 245, 70], [17, 267, 59], [18, 284, 50], [19, 273, 56],
    [20, 252, 66], [21, 249.684082, 67.657959], [22, 167, 109],
  ],
  3: [
    [1, 232, 76], [2, 249.684204, 67.657898], [3, 206, 89], [4, 270, 57],
    [5, 203.870972, 90.564514], [6, 256, 64], [7, 165, 110], [8, 227, 79],
    [9, 231, 77], [10, 273, 56], [11, 286, 49], [12, 214, 85], [13, 233, 76],
    [14, 216.901367, 84.049316], [15, 214, 85], [16, 245, 70], [17, 267, 59],
    [18, 284, 50],
  ],
};

const SESSIONS = {
  1: {
    ink: '#00a0ff',
    mark: ['꿰', '기'],
    ctaTop: '305px',
    copy: [
      '꿰기 세션은 바늘과 실이라는 익숙한 제본<br>방식에서 출발해, 꿸 수 있는 모든 재료와<br>방법을 탐색하는 프로그램입니다. 종이에<br>구멍을 내고 실을 통과 시키는 것부터, 천과<br>플라스틱, 철사와 케이블처럼 제본과는 멀어<br>보이는 재료까지 자유롭게 연결해 봅니다.',
      '재료의 한계도, 방식의 제약도, 정해진 결과도<br>없습니다. <span class="is-note">꿰고 연결하며 발견하는 가능성만<br>있습니다.</span>',
    ],
    grid: { x: 115, y: 545 },
    items: GALLERIES[1],
    file: (n) => `assets/archive/figma/p1-${String(n).padStart(2, '0')}.jpg`,
  },
  2: {
    ink: '#ec008c',
    mark: ['묶', '기'],
    ctaTop: '305px',
    copy: [
      '묶기 세션은 서로 다른 종이와 재료를<br>다양한 방식으로 묶어 하나의 형태로 만드는<br>프로그램입니다. 끈을 감거나 매듭을 짓고,<br>고무줄이나 밴드처럼 주변에서 쉽게 접할 수<br>있는 재료를 활용해 여러 가지 제본 구조를<br>만들어 봅니다.',
      '어떤 형태로 완성할지는 모두 열려 있습니다.<br><span class="is-note">서로 다른 재료를 하나의 구조로 묶어보며<br>제본의 범위를 넓혀갑니다.</span>',
    ],
    grid: { x: 120, y: 540 },
    items: GALLERIES[2],
    file: (n) => `assets/archive/figma/p2-${String(n).padStart(2, '0')}.jpg`,
  },
  3: {
    ink: '#ffff00',
    mark: ['풀', '기'],
    /* the only session whose button sits up on the copy's own line */
    ctaTop: '271px',
    copyWidth2: '460px',
    copy: [
      '풀기 세션은 책장을 펼쳐 넘겨보는 익숙한<br>방식에서 벗어나, 풀어가는 과정을 통해<br>내용을 읽는 새로운 책의 형태를 탐색하는<br>프로그램입니다. 손의 움직임에 따라<br>내용과 구조가 드러나는 책을 만들어 봅니다.',
      '<span class="is-note">풀고 펼치는 움직임 자체가 새로운 책의<br>형태이자 읽기의 방식이 됩니다.</span>',
    ],
    grid: { x: 120, y: 545 },
    items: GALLERIES[3],
    file: (n) => `assets/archive/figma/p3-${String(n).padStart(2, '0')}.jpg`,
  },
};

const which = String(new URLSearchParams(location.search).get('p') || '1');
const s = SESSIONS[which] || SESSIONS['1'];

document.body.style.setProperty('--ink', s.ink);

/* ---- the session mark ---- */

const m = MARKS[which] || MARKS['1'];
const blob = document.getElementById('arcBlob');
blob.style.height = `${m.h}px`;
blob.style.setProperty('--syl-top', `${m.syl}px`);
blob.innerHTML =
  m.discs.map(([x, y]) => `<i style="left:${x}px; top:${y}px"></i>`).join('') +
  `<b style="left:15px">${s.mark[0]}</b><b style="left:223px">${s.mark[1]}</b>`;

/* ---- copy and button ---- */

document.getElementById('arcCopy').innerHTML =
  s.copy.map((c) => `<div>${c}</div>`).join('');
document.getElementById('arcCopy').style.setProperty('--copy-col-2', s.copyWidth2 || '463px');

const cta = document.getElementById('arcCta');
cta.style.setProperty('--cta-top', s.ctaTop);
cta.addEventListener('click', () => { window.location.href = 'service.html'; });

document.getElementById('arcBack').addEventListener('click', () => {
  window.location.href = 'program.html';
});
/* the next arrow walks around the three sessions */
document.getElementById('arcNext').addEventListener('click', () => {
  const next = (Number(which) % 3) + 1;
  window.location.href = `archive.html?p=${next}`;
});

/* ---- the gallery ---- */

const grid = document.getElementById('arcGrid');
grid.style.setProperty('--grid-x', `${s.grid.x}px`);
grid.style.setProperty('--grid-y', `${s.grid.y}px`);

grid.innerHTML = s.items.map(([n, h, top]) => {
  const style = ` style="--photo-h:${h}px;--photo-top:${top}px"`;
  return `<button type="button" class="arc-tile is-cropped"${style}>` +
    `<img src="${s.file(n)}${V}" alt="아카이브 ${n}" loading="lazy" />` +
    `<span class="arc-index">${n}</span></button>`;
}).join('');

/* ---- give the frame the gallery's height ----
   .viewport and .stage both size off --stage-h, so measuring the grid once
   it has laid out and writing it back is all the scrolling needs. */

function fitStage() {
  const box = grid.getBoundingClientRect();
  const scale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
  const height = box.height / scale;
  /* 65 of that tail is room for the shift: open the header and the whole
     gallery slides down, and without the headroom the last row is cut off */
  document.body.style.setProperty('--stage-h', Math.ceil(s.grid.y + height + 88 + 65));
}

fitStage();
/* each piece that decodes can change a column's length, so re-measure as
   they land rather than guessing at the total up front */
grid.querySelectorAll('img').forEach((img) => {
  if (img.complete) return;
  img.addEventListener('load', fitStage, { once: true });
  img.addEventListener('error', fitStage, { once: true });
});
window.addEventListener('resize', fitStage);
