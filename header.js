/* ---------------------------------------------------------------
   The header, shared by every page (Figma 393:531 closed · 453:1075 open ·
   393:341 search · 428:114 the per-page variants).

   On the hero, the wordmark letter turns T → i → P → S. Sub-pages keep the
   Figma header's fixed T. Putting the pointer on the header itself opens it —
   the letter grows into the full mark and the menu unfolds.

   The difference off the hero is that the page you are on is already
   named beside MENU while the header is shut (428:121 "Program"), and
   the whole header sits at its open x from the start: the letter at 39,
   MENU at 115. Opening only adds the other two names.
   --------------------------------------------------------------- */

const RULE_Y = 58;                // where the rule under the header sits, shut

const menu = document.getElementById('hdMenu');
const searchBtn = document.getElementById('hdSearch');
const searchInput = document.getElementById('hdInput');
const closeBtn = document.getElementById('hdClose');
const stageEl = document.getElementById('stage');

function isSearchOpen() {
  return document.body.classList.contains('is-search-open');
}
function setHead(open) {
  document.body.classList.toggle('is-head-open', open || isSearchOpen());
}

/* The band across the top is the hover target, not just the words — but only
   the header's own band: everything down to the rule and no further. Shut
   that is 58px; open, the rule slides down by --shift and the band grows with
   it, so the pointer can carry on into the unfolded menu without the header
   snapping closed under it. Anything below the rule — the archive page's back
   arrow sits right there — is the page, not the header. */
document.addEventListener('pointermove', (e) => {
  if (isSearchOpen() || !stageEl) return;
  /* custom properties inherit, so body carries --scale from :root as well */
  const css = getComputedStyle(document.body);
  const scale = parseFloat(css.getPropertyValue('--scale')) || 1;
  const zone = RULE_Y + (parseFloat(css.getPropertyValue('--shift')) || 0);
  const box = stageEl.getBoundingClientRect();
  const y = (e.clientY - box.top) / scale;
  const x = (e.clientX - box.left) / scale;
  setHead(y >= 0 && y <= zone && x >= 0 && x <= 1920);
});
if (menu) menu.addEventListener('pointerenter', () => setHead(true));

function openSearch() {
  document.body.classList.add('is-search-open', 'is-head-open');
  searchInput.focus();
}
function closeSearch() {
  document.body.classList.remove('is-search-open');
  searchInput.value = '';
  setHead(false);
}
if (searchBtn) searchBtn.addEventListener('click', openSearch);
if (closeBtn) closeBtn.addEventListener('click', closeSearch);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isSearchOpen()) closeSearch();
});

/* ---------------- the letter turns through the wordmark ----------------
   Optima is a licensed face, so these are the glyph outlines Figma
   exports. Each keeps its own height, scaled to an 18px T. */

const GLYPHS = [
  { file: 'glyph-t.svg', h: 62 },
  { file: 'glyph-i.svg', h: 64 },
  { file: 'glyph-p.svg', h: 57.304 },
  { file: 'glyph-s.svg', h: 60.496 },
];
const GLYPH_SCALE = 13 / 62;      // an 18px Optima cap is about 13px tall
const LETTER_MS = 2200;

const letterBox = document.getElementById('hdLetter');
const letters = letterBox ? [...letterBox.querySelectorAll('img')] : [];
let glyph = 0;
/* every script on the page shares one global scope, so this name has to stay
   out of hero.js's way — a duplicate `let` kills the whole other file */
let glyphFront = 0;               // which of the two layers is showing

function dress(img, i) {
  const g = GLYPHS[i];
  img.src = `assets/${g.file}?v=80`;
  img.style.height = `${(g.h * GLYPH_SCALE).toFixed(2)}px`;
}

/* the outgoing letter fades out while the incoming one fades in, on two
   stacked layers — a single layer can only blink through transparent */
function turnLetter() {
  glyph = (glyph + 1) % GLYPHS.length;
  const back = letters[1 - glyphFront];
  dress(back, glyph);
  letters[glyphFront].classList.remove('is-on');
  back.classList.add('is-on');
  glyphFront = 1 - glyphFront;
}

if (letters.length === 2) {
  dress(letters[0], 0);
  letters[0].classList.add('is-on');
  if (!document.body.classList.contains('page-sub') &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(turnLetter, LETTER_MS);
  }
}
