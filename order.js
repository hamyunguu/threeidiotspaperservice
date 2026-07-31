/* ---------------------------------------------------------------
   Service (order) page.

   Ported from the earlier standalone order page. The option lists and
   the estimate formula are carried over unchanged, so the numbers match
   what that page produced; only the presentation moved into this site's
   system. The 3D sheet viewer it used (three.js) is replaced here by a
   flat scale preview.

   Poster is the mode that is ported. Book / Leaflet / Print keep their
   tabs but are not built yet.
   --------------------------------------------------------------- */

const WEIGHTS = ['100g', '130g', '160g', '190g', '210g', '240g'];

const form = document.getElementById('ordForm');
const sizeList = document.getElementById('ordSizes');
const paperSel = document.getElementById('ordPaper');
const gsmSel = document.getElementById('ordGsm');
const gsmRow = document.getElementById('ordGsmRow');
const paperView = document.getElementById('ordPaperView');
const faceLabel = document.getElementById('ordPaperFace');
const dropHint = document.getElementById('ordDropHint');
const dimLabel = document.getElementById('ordDim');
const partTotal = document.getElementById('ordPartTotal');
const estBox = document.getElementById('ordEstimate');
const submitBtn = document.getElementById('ordSubmit');

const $ = (id) => document.getElementById(id);
const num = (el, fallback) => Math.max(1, parseInt(el.value, 10) || fallback);
const won = (n) => n.toLocaleString('ko-KR') + '원';

/* which half of a segmented control is currently on */
function seg(name) {
  const on = form.querySelector(`.ord-seg[data-name="${name}"] .ord-seg-item.is-on`);
  return on ? on.dataset.value : '';
}

/* ---------------- estimate ----------------
   Carried over from the order page as-is:
     area is measured in A4s, paper 12원 and print 46원 per A4 per sheet,
     double-sided x1.8, mono x0.4, rush x1.3, then the finishing lines. */

function estimate() {
  const w = num($('ordCutW'), 210);
  const h = num($('ordCutH'), 297);
  const area = (w * h) / (210 * 297);
  const qty = num($('ordQty'), 1);
  const kinds = num($('ordKinds'), 1);

  const duplex = seg('mun') === '양면출력' ? 1.8 : 1;
  const mono = seg('printer') === '흑백 1도' ? 0.4 : 1;

  const paper = Math.round(area * qty * kinds * 12);
  let print = Math.round(area * qty * kinds * 46 * duplex * mono);
  if (seg('quick') === '긴급') print = Math.round(print * 1.3);

  let last = 0;
  if ($('ordCoat').value) last += Math.round(area * qty * kinds * 18);
  if ($('ordCut').value === '재단') last += Math.round(qty * kinds * 6);
  if ($('ordFold').value || $('ordOsiFold').value) last += Math.round(qty * kinds * 22);
  if ($('ordOsi').value) last += Math.round(qty * kinds * 10);

  const bind = 0;                                  // 포스터는 제본이 없다
  const supply = paper + print + bind + last;
  const vat = Math.round(supply * 0.1);
  return { paper, print, bind, last, supply, vat, total: supply + vat };
}

function paintEstimate() {
  const e = estimate();
  const put = (key, text) => {
    const el = estBox.querySelector(`[data-est="${key}"]`);
    if (el) el.textContent = text;
  };
  put('paper', won(e.paper));
  put('print', won(e.print));
  put('bind', won(e.bind));
  put('last', won(e.last));
  put('supply', `${won(e.supply)} (${won(e.vat)})`);
  put('total', won(e.total));
  partTotal.textContent = `TOTAL ${won(e.paper + e.print)}`;
}

/* ---------------- sheet preview ---------------- */

const PREVIEW_W = 620;   // design px the sheet may span
const PREVIEW_H = 560;

function paintPreview() {
  const w = num($('ordCutW'), 210);
  const h = num($('ordCutH'), 297);
  const scale = Math.min(PREVIEW_W / w, PREVIEW_H / h);
  paperView.style.width = `${Math.round(w * scale)}px`;
  paperView.style.height = `${Math.round(h * scale)}px`;
  dimLabel.textContent = `${w}×${h}mm`;
  faceLabel.textContent = seg('mun') === '양면출력' ? '앞면 / 뒷면' : '앞면';
}

function repaint() {
  paintEstimate();
  paintPreview();
}

/* ---------------- inputs ---------------- */

/* size presets fill the two size rows; 사용자입력 just hands over to them */
sizeList.addEventListener('click', (e) => {
  const btn = e.target.closest('.ord-size');
  if (!btn) return;
  sizeList.querySelectorAll('.ord-size').forEach((b) => b.classList.toggle('is-on', b === btn));

  if (!btn.dataset.custom) {
    $('ordCutW').value = btn.dataset.w;
    $('ordCutH').value = btn.dataset.h;
    $('ordJobW').value = btn.dataset.w;
    $('ordJobH').value = btn.dataset.h;
  } else {
    $('ordCutW').focus();
    $('ordCutW').select();
  }
  repaint();
});

/* segmented controls behave like radios */
form.addEventListener('click', (e) => {
  const item = e.target.closest('.ord-seg-item');
  if (!item) return;
  item.parentElement.querySelectorAll('.ord-seg-item')
    .forEach((b) => b.classList.toggle('is-on', b === item));
  repaint();
});

/* 평량 only opens once a paper is chosen */
paperSel.addEventListener('change', () => {
  const chosen = paperSel.value;
  gsmSel.innerHTML = chosen
    ? WEIGHTS.map((w) => `<option>${w}</option>`).join('')
    : '<option value="">용지를 먼저 선택하세요</option>';
  gsmSel.disabled = !chosen;
  gsmRow.classList.toggle('is-off', !chosen);
  repaint();
});

/* typing a size by hand drops the preset highlight */
['ordCutW', 'ordCutH'].forEach((id) => {
  $(id).addEventListener('input', () => {
    const w = $('ordCutW').value;
    const h = $('ordCutH').value;
    let matched = null;
    sizeList.querySelectorAll('.ord-size[data-w]').forEach((b) => {
      if (b.dataset.w === w && b.dataset.h === h) matched = b;
    });
    sizeList.querySelectorAll('.ord-size').forEach((b) => {
      b.classList.toggle('is-on', matched ? b === matched : Boolean(b.dataset.custom));
    });
    repaint();
  });
});

form.addEventListener('input', repaint);
form.addEventListener('change', repaint);

/* ---------------- file upload ---------------- */

form.addEventListener('change', (e) => {
  const input = e.target;
  if (!input.matches('[data-upload]')) return;
  const file = input.files && input.files[0];
  const state = form.querySelector(`[data-state="${input.dataset.upload}"]`);
  if (!file) return;

  state.textContent = file.name;
  state.classList.add('is-set');

  // the front sheet doubles as the preview when it is an image
  if (input.dataset.upload === 'front' && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    paperView.style.backgroundImage = `url("${url}")`;
    paperView.classList.add('has-file');
    dropHint.textContent = '앞면 미리보기';
  }
});

/* ---------------- submit ---------------- */

submitBtn.addEventListener('click', () => {
  const e = estimate();
  submitBtn.textContent = `주문 접수는 준비 중입니다 — 추정 ${won(e.total)}`;
  submitBtn.classList.add('is-done');
  setTimeout(() => {
    submitBtn.textContent = '주문 접수';
    submitBtn.classList.remove('is-done');
  }, 3200);
});

/* ---------------- product tabs ----------------
   Only Poster is built. The other three keep their tab so the page reads
   the same as the original, but say so instead of silently doing nothing. */

const tabs = document.getElementById('ordTabs');
const tabNote = document.createElement('p');
tabNote.className = 'ord-note';
// beside the tabs, not under them — the form starts right below at 214px
tabNote.style.cssText = 'position:absolute; left:600px; top:164px; width:340px; margin:0; z-index:5;';
tabs.parentElement.insertBefore(tabNote, tabs.nextSibling);

tabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.ord-tab');
  if (!btn || btn.dataset.mode === 'poster') {
    if (btn) {
      tabs.querySelectorAll('.ord-tab').forEach((b) => b.classList.toggle('is-on', b === btn));
      tabNote.textContent = '';
    }
    return;
  }
  tabNote.textContent = `${btn.textContent} 주문서는 준비 중입니다. 지금은 Poster로 견적을 내실 수 있어요.`;
});

repaint();
