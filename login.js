/* ---------------------------------------------------------------
   Login page (Figma 515:564).

   The page is the design and nothing behind it: there is no account
   service to talk to yet, so the form is held here rather than posting
   anywhere. Swapping this for a real submit is the whole of the work
   when there is somewhere to submit to.
   --------------------------------------------------------------- */

const lgForm = document.getElementById('lgForm');

if (lgForm) {
  lgForm.addEventListener('submit', (e) => {
    /* no action, no endpoint — without this the browser would reload the
       page with the field values hung on the URL, which is both useless
       and the last place a password should end up */
    e.preventDefault();
  });
}
