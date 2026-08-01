/* ---------------------------------------------------------------
   Program page (Figma 500:477 / 500:618 / 500:735).

   The three states are the same layout with a different card open, so
   this only moves the `is-on` class; the CSS does the rise and the
   panel. One card is always open — Figma has no state where none is —
   so leaving a card does not close it, entering another moves it.
   --------------------------------------------------------------- */

const cards = [...document.querySelectorAll('.pg-card')];

function openCard(card) {
  cards.forEach((c) => c.classList.toggle('is-on', c === card));
}

cards.forEach((card) => {
  card.addEventListener('pointerenter', () => openCard(card));
  card.addEventListener('focus', () => openCard(card));
  /* the whole card is the link to its session */
  card.addEventListener('click', () => {
    window.location.href = card.dataset.href;
  });
});
