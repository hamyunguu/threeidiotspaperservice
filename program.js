/* ---------------------------------------------------------------
   Program page (Figma 505:443 shut · 508:490 / 508:569 / 508:661 open).

   The four states are the same row with a different card open, so this
   only moves the `is-on` class; the CSS does the widening and the row
   re-centres itself. Nothing is open until the pointer picks a card,
   and letting go of all three shuts them again.
   --------------------------------------------------------------- */

const cards = [...document.querySelectorAll('.pg-card')];
let closing = 0;

function openCard(card) {
  clearTimeout(closing);
  cards.forEach((c) => c.classList.toggle('is-on', c === card));
}

/* the close is deferred a frame so sliding straight from one card to the
   next never flickers shut in the gap between them */
function closeSoon() {
  clearTimeout(closing);
  closing = setTimeout(() => openCard(null), 60);
}

cards.forEach((card) => {
  card.addEventListener('pointerenter', () => openCard(card));
  card.addEventListener('pointerleave', closeSoon);
  card.addEventListener('focus', () => openCard(card));
  card.addEventListener('blur', closeSoon);
  /* the whole card is the link to its session */
  card.addEventListener('click', () => {
    window.location.href = card.dataset.href;
  });
});
