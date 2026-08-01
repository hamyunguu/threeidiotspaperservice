/* ---------------------------------------------------------------
   Program archive (Figma 476:821 / 476:1289 / 476:1363).

   One page, three sessions, picked with ?p=1|2|3 the way the detail
   page already works. Everything that changes between the three lives
   in SESSIONS below — the colour, the two syllables, the copy and the
   pieces; the frame around it is the same on all three.

   The gallery runs well past the 1080 frame, so this is the page whose
   stage grows to its content (see body.archive in the stylesheet) and
   the window scrolls it.
   --------------------------------------------------------------- */

const V = '?v=52';

/* the five discs of the session mark, at the offsets Figma sets them:
   x every 52, alternating between the two rows */
const DISCS = [
  [0, 38], [52, 0], [104, 38], [156, 0], [208, 38],
];

/* Programme 1 is the one Figma gave tile heights for, so its columns
   stagger exactly as drawn. The other two size from their own images. */
const P1_HEIGHTS = [
  [473.103, 337.24, 461.441, 436.045, 437.361, 557.3],
  [349.19, 520.865, 470.268, 474.963, 499, 513.7],
  [419.66, 785.543, 583.175, 543.866, 331.1],
  [550.24, 336.875, 556.714, 332.95, 579.138, 340.4],
];

const SESSIONS = {
  1: {
    ink: '#00a0ff',
    mark: ['꿰', '기'],
    ctaTop: '305px',
    copy: [
      '꿰기 세션은 바늘과 실이라는 익숙한 제본<br>방식에서 출발해, 꿸 수 있는 모든 재료와<br>방법을 탐색하는 프로그램입니다. 종이에<br>구멍을 내고 실을 통과 시키는 것부터, 천과<br>플라스틱, 철사와 케이블처럼 제본과는 멀어<br>보이는 재료까지 자유롭게 연결해 봅니다.',
      '재료의 한계도, 방식의 제약도, 정해진 결과도<br>없습니다.<br><span class="is-note">꿰고 연결하며 발견하는 가능성만 있습니다.</span>',
    ],
    count: 23,
    file: (n) => `assets/archive/a1-${String(n).padStart(2, '0')}.jpg`,
    heights: P1_HEIGHTS,
  },
  2: {
    ink: '#ec008c',
    mark: ['묶', '기'],
    ctaTop: '305px',
    copy: [
      '묶기 세션은 흩어진 재료들을 기상천외한<br>방식으로 한데 모으며, 묶는 행위가 어떻게<br>하나의 제본이 될 수 있는지 경험하는<br>프로그램입니다.',
      '끈을 감고 매듭을 만들거나, 고무줄과 테이프,<br>밴드와 철사 등 손에 잡히는 다양한 재료를<br><span class="is-note">이용해 새로운 책의 구조를 만들어 봅니다.</span>',
    ],
    count: 20,
    file: (n) => `assets/archive/a2-${String(n).padStart(2, '0')}.jpg`,
  },
  3: {
    ink: '#ffff00',
    mark: ['풀', '기'],
    ctaTop: '175px',
    copy: [
      '풀기는 이미 만들어진 책과 제본의 구조를<br>거꾸로 따라가는 세션입니다. 실을 빼고,<br>매듭을 풀고, 접힌 면을 펼치며 하나의 책이<br>어떤 순서와 방식으로 만들어졌는지<br>발견합니다.',
    ],
    count: 20,
    file: (n) => `assets/archive/a3-${String(n).padStart(2, '0')}.jpg`,
  },
};

const which = String(new URLSearchParams(location.search).get('p') || '1');
const s = SESSIONS[which] || SESSIONS['1'];

document.body.style.setProperty('--ink', s.ink);

/* ---- the session mark ---- */

const blob = document.getElementById('arcBlob');
blob.innerHTML =
  DISCS.map(([x, y]) => `<i style="left:${x}px; top:${y}px"></i>`).join('') +
  `<b style="left:15px">${s.mark[0]}</b><b style="left:223px">${s.mark[1]}</b>`;

/* ---- copy and button ---- */

document.getElementById('arcCopy').innerHTML =
  s.copy.map((c) => `<div>${c}</div>`).join('');

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

/* ---- the gallery ----
   Dealt column by column so the order down each column is the order the
   pieces are listed in, which is how Figma stacks them. */

const grid = document.getElementById('arcGrid');
const COLS = 4;

/* Figma fills a column before starting the next, so the pieces are dealt in
   runs rather than round-robin. Programme 1 uses the run lengths its tile
   heights come in; the other two split as evenly as they divide. */
const runs = s.heights
  ? s.heights.map((col) => col.length)
  : Array.from({ length: COLS }, (_, c) =>
    Math.floor(s.count / COLS) + (c < s.count % COLS ? 1 : 0));

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
    const h = s.heights && s.heights[c] && s.heights[c][r];
    const style = h ? ` style="height:${h}px"` : '';
    const cls = h ? 'arc-tile is-cropped' : 'arc-tile';
    /* no lazy loading on the tiles that size themselves: a tile with no
       height is flat, a flat tile is never "near the viewport", and the
       image that would give it a height then never loads */
    return `<button type="button" class="${cls}"${style}>` +
      `<img src="${s.file(n)}${V}" alt="아카이브 ${n}"${h ? ' loading="lazy"' : ''} /></button>`;
  }).join('');
  return `<div class="arc-col">${tiles}</div>`;
}).join('');

/* ---- give the frame the gallery's height ----
   .viewport and .stage both size off --stage-h, so measuring the grid once
   it has laid out and writing it back is all the scrolling needs. */

function fitStage() {
  const box = grid.getBoundingClientRect();
  const scale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
  const top = parseFloat(getComputedStyle(grid).top) || 414;
  const height = box.height / scale;
  document.body.style.setProperty('--stage-h', Math.ceil(top + height + 88));
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
