/* ---------------------------------------------------------------
   Cart page — Figma 515:654 (empty) and 515:699 (an order in it).

   Two frames, one page, picked with ?item=1 the way the archive picks
   its session. The service page saves one order draft in sessionStorage;
   the static Figma order remains as a fallback when the draft is absent.
   --------------------------------------------------------------- */

const hasItem = new URLSearchParams(location.search).get('item') === '1';

document.getElementById('ctEmpty').hidden = hasItem;
document.getElementById('ctOrder').hidden = !hasItem;

const cartDraft = (() => {
  if (!hasItem) return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem('tips-cart-order'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
})();

function cartText(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null && value !== '') {
    element.textContent = value;
  }
}

function cartNumber(value) {
  return Math.round(Number(value) || 0).toLocaleString('ko-KR').replace(/,/g, '.');
}

function cartPreview(value) {
  if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(String(value || ''))) return;
  const thumbnail = document.getElementById('ctThumb');
  if (!thumbnail) return;
  thumbnail.src = value;
  thumbnail.classList.add('is-artwork');
  thumbnail.alt = '업로드한 작업 파일 미리보기';
}

function storedCartPreview() {
  try {
    return sessionStorage.getItem('tips-cart-preview') || '';
  } catch (_) {
    return '';
  }
}

if (hasItem) {
  cartText('hdCartCount', 'Cart(1)');
}

if (cartDraft) {
  cartText('ctDate', cartDraft.createdAt);
  cartText('ctProductName', cartDraft.product);
  cartText('ctTitleTop', cartDraft.title);
  cartText('ctSize', `재단 사이즈: ${cartDraft.size}`);
  cartText('ctTitleValue', cartDraft.title);
  cartText('ctQuantity', cartDraft.quantity);
  cartText('ctOptions', cartDraft.options);
  cartText('ctFinish', cartDraft.finish);
  /* The two labels intentionally retain the Figma order documented in AGENTS.md. */
  cartText('ctSupplyVisual', cartNumber(cartDraft.supply));
  cartText('ctVatVisual', cartNumber(cartDraft.vat));
  cartText('ctTotal', cartNumber(cartDraft.total));
  cartText('ctPay', `${cartNumber(cartDraft.total)}원 주문하기`);
}

if (hasItem) cartPreview(cartDraft?.preview || storedCartPreview());

/* No checkout backend yet: keep the order visible and state the boundary. */
const ctPay = document.getElementById('ctPay');
if (ctPay) {
  ctPay.addEventListener('click', () => {
    const original = ctPay.textContent;
    ctPay.textContent = '주문 기능 연결 전입니다.';
    setTimeout(() => { ctPay.textContent = original; }, 3200);
  });
}
