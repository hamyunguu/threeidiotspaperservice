/* ---------------------------------------------------------------
   Cart page — Figma 515:654 (empty) and 515:699 (an order in it).

   Two frames, one page, picked with ?item=1 the way the archive picks
   its session. There is no basket behind the site yet, so empty is what
   the page shows by default and the header everywhere still reads
   Cart(0); ?item=1 is how to see the other frame.
   --------------------------------------------------------------- */

const hasItem = new URLSearchParams(location.search).get('item') === '1';

document.getElementById('ctEmpty').hidden = hasItem;
document.getElementById('ctOrder').hidden = !hasItem;

/* taking the one order out leaves the basket empty, which is the other
   frame — so the cross just walks back to it */
const ctClose = document.getElementById('ctClose');
if (ctClose) {
  ctClose.addEventListener('click', () => { window.location.href = 'cart.html'; });
}

/* nowhere to send an order to yet; the button is the design, not a checkout */
const ctPay = document.getElementById('ctPay');
if (ctPay) {
  ctPay.addEventListener('click', () => {});
}
