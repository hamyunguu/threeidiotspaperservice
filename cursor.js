/* ---------------------------------------------------------------
   Custom registration-mark cursor (site-wide).
     - grey mark by default
     - dissolves to the black mark over anything clickable
     - vanishes entirely once the pointer leaves the window
   Pointer devices only; touch/coarse pointers keep the native cursor.

   Everything here listens for pointer events rather than mouse ones. A
   sphere on the hero calls preventDefault() when it is picked up, and
   that stops the browser sending the mouse events it would otherwise
   synthesise — so a mark driven by mousemove freezes for as long as the
   button is down, which is exactly when it is being watched.
   --------------------------------------------------------------- */

(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const root = document.documentElement;
  root.classList.add('has-cursor');   // hides the native cursor via CSS

  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML =
    '<img class="cur-g" src="assets/cursor-gray.svg?v=15" alt="">' +
    '<img class="cur-b" src="assets/cursor-black.svg?v=15" alt="">';
  document.body.appendChild(cur);

  const CLICKABLE = 'a[href], button, input, textarea, select, label, summary,' +
    '[data-href], [role="button"], .prow, .pg, .ball, .maker, .card,' +
    '.card-archive, .apply-btn, .chat-send, .nav-item[href], .gal.hoverable, .tip-circle';

  let shown = false;

  function move(e) {
    if (e.pointerType === 'touch') return;
    cur.style.transform =
      `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    if (!shown) { shown = true; cur.classList.add('is-on'); }
    const el = e.target;
    const hot = el && el.closest && el.closest(CLICKABLE);
    cur.classList.toggle('is-hot', Boolean(hot));
  }

  function hide() { shown = false; cur.classList.remove('is-on'); }

  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', move, { passive: true });
  document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  document.addEventListener('pointerup', () => cur.classList.remove('is-down'));

  /* Leaving the window has to take the mark with it, or it sits stranded
     wherever it was last seen. `mouseleave` on the document is not
     dependable for this — the reading that is, is a pointerout carrying no
     relatedTarget, which is the browser saying the pointer went to nothing
     at all. The rest are the ways a window can lose the pointer without
     ever being crossed on the way out. */
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) hide(); });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) hide(); });
  root.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
})();
