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

function receiptText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value === undefined || value === null || value === '' ? '-' : value;
}

function receiptOrder() {
  if (cartDraft) return cartDraft;
  return {
    product: document.getElementById('ctProductName')?.textContent,
    title: document.getElementById('ctTitleValue')?.textContent,
    size: document.getElementById('ctSize')?.textContent?.replace(/^재단 사이즈:\s*/, ''),
    quantity: document.getElementById('ctQuantity')?.textContent,
    options: document.getElementById('ctOptions')?.textContent,
    finish: document.getElementById('ctFinish')?.textContent,
    supply: document.getElementById('ctSupplyVisual')?.textContent?.replace(/\./g, ''),
    vat: document.getElementById('ctVatVisual')?.textContent?.replace(/\./g, ''),
    total: document.getElementById('ctTotal')?.textContent?.replace(/\./g, ''),
  };
}

function nextReceiptNumber(now) {
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')].join('');
  const key = 'tips-receipt-sequence';
  try {
    const saved = JSON.parse(localStorage.getItem(key)) || {};
    const sequence = saved.date === date ? Number(saved.sequence || 0) + 1 : 1;
    localStorage.setItem(key, JSON.stringify({ date, sequence }));
    return `${date}-${String(sequence).padStart(3, '0')}`;
  } catch (_) {
    return `${date}-${String(now.getTime()).slice(-6)}`;
  }
}

function storedReceipt() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('tips-cart-receipt'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
}

function prepareReceipt() {
  const existing = storedReceipt();
  if (existing) return existing;
  const now = new Date();
  const receipt = {
    ...receiptOrder(),
    receiptNumber: nextReceiptNumber(now),
    receiptDate: now.toLocaleString('ko-KR'),
  };
  try { sessionStorage.setItem('tips-cart-receipt', JSON.stringify(receipt)); } catch (_) { /* printable without storage */ }
  return receipt;
}

function paintReceipt(receipt) {
  receiptText('rcNumber', receipt.receiptNumber);
  receiptText('rcDate', receipt.receiptDate);
  receiptText('rcProduct', receipt.product);
  receiptText('rcTitle', receipt.title);
  receiptText('rcSize', receipt.size);
  receiptText('rcQuantity', receipt.quantity);
  receiptText('rcOptions', receipt.options);
  receiptText('rcFinish', receipt.finish);
  receiptText('rcSupply', `${cartNumber(receipt.supply)}원`);
  receiptText('rcVat', `${cartNumber(receipt.vat)}원`);
  receiptText('rcTotal', `${cartNumber(receipt.total)}원`);
}

/* The static site issues a local receipt and hands it to the venue printer.
   Browser print settings choose the connected 80 mm printer. */
const ctPay = document.getElementById('ctPay');
if (ctPay) {
  const previousReceipt = storedReceipt();
  if (previousReceipt) {
    paintReceipt(previousReceipt);
    ctPay.textContent = '주문 접수증 다시 인쇄';
    cartText('ctPrintStatus', `접수번호 ${previousReceipt.receiptNumber} · 다시 인쇄할 수 있습니다.`);
  }
  ctPay.addEventListener('click', () => {
    const receipt = prepareReceipt();
    paintReceipt(receipt);
    ctPay.textContent = '주문 접수증 다시 인쇄';
    cartText('ctPrintStatus', `접수번호 ${receipt.receiptNumber} · 인쇄 창이 열렸습니다.`);
    window.print();
  });
}
