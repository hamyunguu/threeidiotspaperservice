/* ---------------------------------------------------------------
   Program page: hover a card to expand its coloured panel; click a
   card to open its detail page with a colour-widening transition.
   Only one card is ever open, matching the Figma states.
   --------------------------------------------------------------- */

const STAGE_WIDTH = 1920;
const CARD_W = 600;

/* Vertical footprint of a card in design px, from the Figma states.
   Closed (159:82) sits inside open (158:449), so growing never drops the
   pointer out of the card and the hover can't flicker. */
const FOOTPRINT = {
  closed: { top: 290, bottom: 833 },
  open:   { top: 201, bottom: 1198 },
};

const cards = [...document.querySelectorAll('.card')];
const stageEl = document.getElementById('stage');

/* ---------------- hover overlay: chip + Archive on the card image ----------------
   Built in JS to keep the markup light. Positions are design px inside the
   600x500 card image, taken from Figma 244:984 (the open Program 1 card). */
const WORDS = { 1: ['꿰', '기'], 2: ['묶', '기'], 3: ['풀', '기'] };
const PILLS = [[348, 30], [372.86, 55.57], [397.72, 81.14],
               [422.58, 106.71], [447.43, 132.28], [472.29, 157.84]];
const SYLS = [[363, 30], [486, 158]];
const ARROW = '<svg viewBox="0 0 11.5 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.5 1.5L9.5 10L1.5 18.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

cards.forEach((card) => {
  const word = WORDS[card.dataset.p] || WORDS[1];
  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';

  const chip = document.createElement('div');
  chip.className = 'card-chip';
  PILLS.forEach(([x, y]) => {
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.style.left = `${x}px`;
    pill.style.top = `${y}px`;
    chip.appendChild(pill);
  });
  SYLS.forEach(([x, y], i) => {
    const syl = document.createElement('span');
    syl.className = 'syl';
    syl.style.left = `${x}px`;
    syl.style.top = `${y}px`;
    syl.textContent = word[i];
    chip.appendChild(syl);
  });
  overlay.appendChild(chip);

  const archive = document.createElement('button');
  archive.type = 'button';
  archive.className = 'card-archive';
  archive.innerHTML = `Archive ${ARROW}`;
  overlay.appendChild(archive);

  card.querySelector('.card-img').appendChild(overlay);
});

function setActive(card) {
  cards.forEach((c) => c.classList.toggle('is-open', c === card));
  document.body.classList.toggle('is-expanded', Boolean(card));
}

/* Hit-test in design space against the footprint above, rather than using
   mouseenter/mouseleave or the live rect:
     - the spheres float above the cards, so one drifting under a resting
       cursor would otherwise fire mouseleave and collapse the card
     - the live rect is mid-transition for 450ms, so a cursor moving into the
       area a card is still growing into would read as "outside" */
function cardAt(clientX, clientY) {
  const r = stageEl.getBoundingClientRect();
  const scale = r.width / STAGE_WIDTH;
  const x = (clientX - r.left) / scale;
  const y = (clientY - r.top) / scale;

  return cards.find((c) => {
    const left = parseFloat(getComputedStyle(c).getPropertyValue('--card-x'));
    if (x < left || x > left + CARD_W) return false;
    const box = c.classList.contains('is-open') ? FOOTPRINT.open : FOOTPRINT.closed;
    return y >= box.top && y <= box.bottom;
  }) || null;
}

stageEl.addEventListener('pointermove', (e) => {
  if (document.body.dataset.dragging) return;   // busy playing with a sphere
  setActive(cardAt(e.clientX, e.clientY));
});

stageEl.addEventListener('pointerleave', () => setActive(null));

/* keyboard equivalent of hover */
cards.forEach((card) => {
  card.tabIndex = 0;
  card.addEventListener('focus', () => setActive(card));
  card.addEventListener('blur',  () => setActive(null));
});

/* ---------------- colour-widening transition to the detail page ---------------- */

/* `reduceMotion` is already declared by script.js, which loads first — reuse it
   rather than redeclaring (a second `const` in the shared global scope throws). */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function goToDetail(card) {
  const url = `program-detail.html?p=${card.dataset.p}`;
  const accent = getComputedStyle(card).getPropertyValue('--bar').trim();

  if (prefersReduced) { window.location.href = url; return; }

  // grow the card's colour bar out to fill the whole screen, then navigate
  const bar = card.querySelector('.card-bar').getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;

  const wipe = document.createElement('div');
  wipe.className = 'wipe';
  wipe.style.setProperty('--wipe', accent);
  wipe.style.clipPath =
    `inset(${bar.top}px ${W - bar.right}px ${H - bar.bottom}px ${bar.left}px)`;
  document.body.appendChild(wipe);

  requestAnimationFrame(() => {
    wipe.style.transition = 'clip-path .5s cubic-bezier(.6, 0, .3, 1)';
    wipe.style.clipPath = 'inset(0px 0px 0px 0px)';
  });

  let navigated = false;
  const go = () => { if (!navigated) { navigated = true; window.location.href = url; } };
  wipe.addEventListener('transitionend', go);
  setTimeout(go, 650);   // fallback in case transitionend is missed
}

cards.forEach((card) => {
  card.addEventListener('click', () => goToDetail(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); goToDetail(card); }
  });
});
