/* ---------------------------------------------------------------
   Custom registration-mark cursor (site-wide).
     - grey mark by default
     - dissolves to the black mark over anything clickable
     - vanishes entirely once the pointer leaves the window
   Pointer devices only; touch/coarse pointers keep the native cursor.
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

  let x = -100, y = -100, shown = false;

  function move(e) {
    x = e.clientX; y = e.clientY;
    cur.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    if (!shown) { shown = true; cur.classList.add('is-on'); }
    const el = e.target;
    const hot = el && el.closest && el.closest(CLICKABLE);
    cur.classList.toggle('is-hot', Boolean(hot));
  }

  function hide() { shown = false; cur.classList.remove('is-on'); }

  document.addEventListener('mousemove', move, { passive: true });
  document.addEventListener('mouseover', move, { passive: true });
  document.addEventListener('mousedown', () => cur.classList.add('is-down'));
  document.addEventListener('mouseup', () => cur.classList.remove('is-down'));

  // leave the window -> disappear (don't linger stuck at the edge)
  document.addEventListener('mouseleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('mouseenter', () => { shown = true; cur.classList.add('is-on'); });
})();
