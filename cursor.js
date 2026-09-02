/* ---------------------------------------------------------------
   Custom registration-mark cursor (site-wide).

   The mark is an actual CSS cursor, not a DOM node following pointermove.
   Safari composites those two layers on different frames, so a DOM follower
   can visibly trail the native pointer during a quick move. Letting the
   browser paint the artwork at the native hotspot keeps them permanently
   locked together.
   --------------------------------------------------------------- */

(function () {
  const root = document.documentElement;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function syncCursorMode() {
    root.classList.toggle('has-cursor', finePointer.matches);
  }

  syncCursorMode();
  if (finePointer.addEventListener) finePointer.addEventListener('change', syncCursorMode);
  else finePointer.addListener(syncCursorMode); // Safari 13 fallback
})();
