/* ---------------------------------------------------------------
   Program archive — Figma 476:821 (꿰기) / 476:1289 (묶기) / 476:1363 (풀기),
   session mark 476:719, all measured off the 1920 × 1080 frame.

   One page, three sessions, picked with ?p=1|2|3. Everything Figma draws
   differently between the three lives in SESSIONS below; the frame around
   it — header, rule, crop marks, back arrow — is the same on all three.

   The three frames are NOT the same layout with different photos in it.
   The mark is a different shape on each, and each gallery sits at its own
   x, y and column width. Those are the numbers, straight off the design:

              mark          gallery x, y      columns                    gutter
     꿰기     284 × 114     115, 545          408 · 408 · 408 · 408     20 / 20
     묶기     284 ×  76     115, 545          440 · 440 · 440 · 310     20 / 10 in col 1
     풀기     284 ×  76     115, 545          408 · 408 · 408 · 408     20 / 20

   The archive intro starts at y=151 in all three current frames. The gallery
   begins at y=545, leaving the same deliberate breathing room below the copy.

   The gallery runs well past the 1080 frame, so this is the page whose
   stage grows to its content (see body.archive in the stylesheet) and
   the window scrolls it.
   --------------------------------------------------------------- */

const V = '?v=77';

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
   A tile's height is the one Figma draws it at, normalised to the column
   width where Figma drew the piece wider than its column. Dealt column by
   column, so the order down each column is the order the pieces are listed
   in — which is how Figma stacks them. */

const P1_HEIGHTS = [
  [473.103, 337.224, 461.441, 436.045, 437.361, 601],
  [349.189, 520.865, 470.268, 474.963, 499, 554],
  [419.657, 785.543, 583.175, 543.866, 357],
  [550.231, 336.875, 556.714, 332.95, 579.138, 367],
];

/* The four final 꿰기 pieces are 440 wide in Figma even though their column
   tracks are 408. They intentionally overhang the track rather than scale. */
const P1_WIDTHS = [
  [null, null, null, null, null, 440],
  [null, null, null, null, null, 440],
  [null, null, null, null, 440],
  [null, null, null, null, null, 440],
];

const P2_HEIGHTS = [
  [564.831, 575, 771, 406, 549],
  [603.68, 219, 458.857, 785, 361, 512],
  [434.72, 464.129, 500, 625, 707],
  [333.323, 199.041, 272.404, 548.923, 350.538, 443.753],
];

const P3_HEIGHTS = [
  [304, 536, 468, 463, 433],
  [467.991, 360.936, 753.653, 548.257],
  [706.071, 376.405, 437.167, 692.354],
  [466, 304, 552, 570, 735],
];

const SESSIONS = {
  1: {
    ink: '#00a0ff',
    mark: ['꿰', '기'],
    ctaTop: '305px',
    copy: [
      '꿰기 세션은 바늘과 실이라는 익숙한 제본<br>방식에서 출발해, 꿸 수 있는 모든 재료와<br>방법을 탐색하는 프로그램입니다. 종이에<br>구멍을 내고 실을 통과 시키는 것부터, 천과<br>플라스틱, 철사와 케이블처럼 제본과는 멀어<br>보이는 재료까지 자유롭게 연결해 봅니다.',
      '재료의 한계도, 방식의 제약도, 정해진 결과도<br>없습니다. <span class="is-note">꿰고 연결하며 발견하는 가능성만<br>있습니다.</span>',
    ],
    grid: { x: 115, y: 545, cols: [408, 408, 408, 408], gaps: [20, 20, 20, 20] },
    count: 23,
    file: (n) => `assets/archive/a1-${String(n).padStart(2, '0')}.jpg`,
    heights: P1_HEIGHTS,
    widths: P1_WIDTHS,
  },
  2: {
    ink: '#ec008c',
    mark: ['묶', '기'],
    ctaTop: '305px',
    copy: [
      '묶기 세션은 서로 다른 종이와 재료를<br>다양한 방식으로 묶어 하나의 형태로 만드는<br>프로그램입니다. 끈을 감거나 매듭을 짓고,<br>고무줄이나 밴드처럼 주변에서 쉽게 접할 수<br>있는 재료를 활용해 여러 가지 제본 구조를<br>만들어 봅니다.',
      '어떤 형태로 완성할지는 모두 열려 있습니다.<br><span class="is-note">서로 다른 재료를 하나의 구조로 묶어보며<br>제본의 범위를 넓혀갑니다.</span>',
    ],
    /* Figma gives this one's first column a 10 gutter and the rest 20 */
    grid: { x: 115, y: 545, cols: [440, 440, 440, 310], gaps: [10, 20, 20, 20] },
    count: 20,
    file: (n) => `assets/archive/a2-${String(n).padStart(2, '0')}.jpg`,
    heights: P2_HEIGHTS,
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
    grid: { x: 115, y: 545, cols: [408, 408, 408, 408], gaps: [20, 20, 20, 20] },
    count: 20,
    file: (n) => `assets/archive/a3-${String(n).padStart(2, '0')}.jpg`,
    heights: P3_HEIGHTS,
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
const COLS = 4;

grid.style.setProperty('--grid-x', `${s.grid.x}px`);
grid.style.setProperty('--grid-y', `${s.grid.y}px`);

/* Figma fills a column before starting the next, so the pieces are dealt in
   runs rather than round-robin. A run is as long as the column Figma drew;
   where a session has more photos than Figma has tiles, the overflow keeps
   going down the last columns at its own shape. */
const runs = s.heights.map((col) => col.length);
const drawn = runs.reduce((a, b) => a + b, 0);
for (let i = 0; s.count - drawn - i > 0; i++) runs[(COLS - 1) - (i % COLS)] += 1;

const columns = [];
let n = 1;
runs.forEach((len) => {
  const col = [];
  for (let i = 0; i < len && n <= s.count; i++) col.push(n++);
  columns.push(col);
});

grid.innerHTML = columns.map((col, c) => {
  const tiles = col.map((n, r) => {
    /* a Figma height where we have one, otherwise the piece's own shape */
    const h = s.heights[c] && s.heights[c][r];
    const w = s.widths && s.widths[c] && s.widths[c][r];
    const dims = [h && `height:${h}px`, w && `width:${w}px`].filter(Boolean).join(';');
    const style = dims ? ` style="${dims}"` : '';
    const cls = h ? 'arc-tile is-cropped' : 'arc-tile';
    /* no lazy loading on the tiles that size themselves: a tile with no
       height is flat, a flat tile is never "near the viewport", and the
       image that would give it a height then never loads */
    return `<button type="button" class="${cls}"${style}>` +
      `<img src="${s.file(n)}${V}" alt="아카이브 ${n}"${h ? ' loading="lazy"' : ''} /></button>`;
  }).join('');
  return `<div class="arc-col" style="--col-w:${s.grid.cols[c]}px;--tile-gap:${s.grid.gaps[c]}px">${tiles}</div>`;
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
