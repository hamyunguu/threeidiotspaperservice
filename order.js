/* ---------------------------------------------------------------
   Service (order) page — Poster / Book / Leaflet / Print.

   The four order flows are carried over from the earlier standalone
   order page: same step order (규격 → 기본정보 → 제본 → 파트 → 주문메모 →
   견적), same select options and placeholder wording, same field keys
   (goods_size, in_paper_group, in_lastJob4 …), same estimate model. Only
   the presentation is this site's — black hairlines, IBM Plex Mono
   labels, CMYK step discs — and the three.js viewer that page used is
   replaced by the flat scale preview, which now reads per product:
   fold lines for a leaflet, a spine and a page block for a book.

   Flow source — 태산인디고 POD_goods.php:
     Poster  : goods 83  · 포스터
     Book    : goods 73  · 인디고 책자인쇄
     Leaflet : goods 121 · 일반 전단 리플렛
     Print   : goods 114 · 명함
   --------------------------------------------------------------- */

/* ---------------- shared option lists (as on the original selects) ---------- */

const WEIGHTS = ['100g', '130g', '160g', '190g', '210g', '240g'];

const PAPER_FLAT = ['- 선방입고', '뉴플러스', '랑데뷰 울트라', '미색모조', '반누보',
                    '백색모조', '스노우', '아트', '인스퍼M러프EW(구.몽블랑)'];
const PAPER_BOOK = ['- 선방입고', '뉴플러스', '랑데뷰 울트라', '레자크연미', '미색모조',
                    '반누보', '백색모조', '색지', '스노우', '아트', '인스퍼M러프EW(구.몽블랑)'];
const PAPER_CARD = ['- 선방입고', '랑데뷰 울트라', '마쉬멜로우', '반누보', '스노우', '아트',
                    '인스퍼M러프EW(구.몽블랑)'];

const MUN_VALUES = ['단면출력', '양면출력'];
const DOSU_FULL  = ['칼라 4도', '흑백 1도'];
const DOSU_COLOR = ['칼라 4도'];

/* the five 후가공 selects (poster / leaflet share them) */
const LAST_COAT   = { key: 'lastJob4',  ph: '::: 코팅선택 :::',
  options: ['단면무광코팅', '단면유광코팅', '양면무광코팅', '양면유광코팅'] };
const LAST_CUT    = { key: 'lastJob7',  ph: '::: 재단선택 :::',
  options: ['재단', '재단 없음'] };
const LAST_FOLD   = { key: 'lastJob27', ph: '::: 접지-낱장선택 :::',
  options: ['2단 접지', '3단접지', '4단접지', '3단N접지', '4단N병풍접지', '대문접지'] };
const LAST_OSI    = { key: 'lastJob47', ph: '::: 오시-낱장선택 :::',
  options: ['오시만 1줄', '오시만 2줄', '오시만 3줄'] };
const LAST_OSIFLD = { key: 'lastJob54', ph: '::: 오시-접지선택 :::',
  options: ['오시+접지 2단', '오시+접지 3단', '오시+접지 4단', '오시+접지 3단N접지',
            '오시+4단N병풍접지', '오시+대문접지'] };

/* a cover coats differently — no 양면, but 코팅없음 is offered */
const LAST_COAT_COVER = { key: 'lastJob4', ph: '::: 코팅선택 :::',
  options: ['단면무광코팅', '단면유광코팅', '코팅없음'] };

/* ---------------- mode schemas ---------------- */

const MODES = {
  poster: {
    label: 'Poster', goods: '포스터', code: 'S0083',
    uploads: [{ slot: 'front', label: '앞면 (인쇄면)' }, { slot: 'back', label: '뒷면' }],
    steps: [
      { t: 'size', label: '규격 사이즈 선택', key: 'goods_size', value: 'A2(594*420)',
        note: '오전 11시~오후 5시 주문은 익일 오전 10시 출고, 오후 5시~익일 오전 11시 ' +
              '주문은 익일 오후 3시 출고됩니다.',
        options: [
          { n: 'B2(740*510)', w: 740, h: 510 },
          { n: 'A2(594*420)', w: 594, h: 420 },
          { n: 'B3(360*500)', w: 360, h: 500 },
          { n: 'A3(297*420)', w: 297, h: 420 },
          { n: 'B4(257*364)', w: 257, h: 364 },
          { n: '사용자입력', custom: true },
        ] },
      { t: 'basic', qty: [{ key: 'goods_ea', unit: '매', value: 10 },
                          { key: 'goods_ea2', unit: '종', value: 1 }] },
      { t: 'part', title: '포스터', part: 'in', rows: [
        { t: 'dosu', part: 'in', printer: DOSU_FULL },
        { t: 'paper', part: 'in', label: '용지선택', groups: PAPER_FLAT },
        { t: 'last', part: 'in', items: [LAST_COAT, LAST_CUT, LAST_FOLD, LAST_OSI, LAST_OSIFLD] },
        { t: 'notice', text: '해당 제품은 재단 후 출고되는 완제품입니다.' },
      ] },
      { t: 'memo' },
      { t: 'estimate' },
    ],
  },

  book: {
    label: 'Book', goods: '인디고 책자인쇄', code: 'S0073',
    uploads: [
      { slot: 'cover', label: '표지 (앞면)' },
      { slot: 'coverBack', label: '표지 (뒷면)' },
      { slot: 'inner', label: '내지 (펼침면)' },
    ],
    steps: [
      { t: 'size', label: '규격 사이즈 선택', key: 'goods_size', value: 'A5(148*210)',
        options: [
          { n: 'A4(210*297)', w: 210, h: 297 },
          { n: 'B5(188*257)', w: 188, h: 257 },
          { n: '신국판(150*220)', w: 150, h: 220 },
          { n: 'A5(148*210)', w: 148, h: 210 },
          { n: '사용자입력', custom: true },
        ] },
      { t: 'basic', qty: [{ key: 'goods_ea', unit: '부', value: 30 }] },
      { t: 'jebon' },
      /* the original ships 표지 on by default, with a 사용/사용 안 함 switch */
      { t: 'part', title: '표지', part: 'cover', optional: true, on: true, rows: [
        { t: 'dosu', part: 'cover', printer: DOSU_FULL },
        { t: 'select', key: 'cover_nalgae', label: '표지날개', options: ['날개없음', '날개있음'],
          value: '날개없음' },
        { t: 'paper', part: 'cover', label: '용지선택', groups: PAPER_BOOK },
        { t: 'seneca' },
        { t: 'last', part: 'cover', items: [LAST_COAT_COVER] },
      ] },
      { t: 'part', title: '내지', part: 'in', rows: [
        { t: 'dosu', part: 'in', printer: DOSU_FULL },
        { t: 'paper', part: 'in', label: '용지선택', groups: PAPER_BOOK },
        { t: 'num', key: 'in_page_val', label: '페이지', unit: 'p', value: 48,
          min: 4, max: 400, step: 2 },
      ] },
      { t: 'part', title: '추가내지', part: 'in2', optional: true, rows: [
        { t: 'dosu', part: 'in2', printer: DOSU_FULL },
        { t: 'paper', part: 'in2', label: '용지선택', groups: PAPER_BOOK },
        { t: 'num', key: 'in2_page_val', label: '추가페이지', unit: 'p', value: 8,
          min: 2, max: 400, step: 2 },
      ] },
      { t: 'part', title: '면지', part: 'mun', optional: true, rows: [
        { t: 'select', key: 'mun_page_values', label: '면지 장수',
          options: ['앞뒤1장씩', '앞뒤2장씩'], value: '앞뒤1장씩' },
        { t: 'paper', part: 'mun', label: '면지용지', groups: PAPER_BOOK },
        { t: 'select', key: 'mun_type_mun', label: '면지인쇄',
          options: ['인쇄없음', '단면출력', '양면출력'], value: '인쇄없음' },
        /* 인쇄없음이면 원본은 도수 셀렉트를 감춘다 */
        { t: 'select', key: 'mun_printer', label: '인쇄 도수', options: DOSU_FULL,
          value: '칼라 4도', showIf: { key: 'mun_type_mun', not: '인쇄없음' } },
      ] },
      { t: 'part', title: '간지', part: 'ganji', optional: true, rows: [
        { t: 'paper', part: 'ganji', label: '간지용지', groups: PAPER_BOOK },
        { t: 'num', key: 'ganji_page_values', label: '페이지', unit: '장', value: 1,
          min: 1, max: 50 },
        { t: 'text', key: 'ganji_print_page', label: '삽입 위치',
          placeholder: '삽입할 페이지 번호 (예: 5, 12, 20)' },
        { t: 'select', key: 'ganji_type_mun', label: '간지인쇄',
          options: ['인쇄없음', '단면출력', '양면출력'], value: '인쇄없음' },
        { t: 'select', key: 'ganji_printer', label: '인쇄 도수', options: DOSU_FULL,
          value: '칼라 4도', showIf: { key: 'ganji_type_mun', not: '인쇄없음' } },
      ] },
      { t: 'memo' },
      { t: 'estimate' },
    ],
  },

  leaflet: {
    label: 'Leaflet', goods: '일반 전단 리플렛', code: 'S0121',
    uploads: [{ slot: 'front', label: '앞면' }, { slot: 'back', label: '뒷면' }],
    steps: [
      { t: 'size', label: '규격 사이즈 선택', key: 'goods_size', value: 'A4(210*297)',
        options: [
          { n: 'A3(297*420)', w: 297, h: 420 },
          { n: 'B4(257*364)', w: 257, h: 364 },
          { n: 'A4(210*297)', w: 210, h: 297 },
          { n: 'A5(148*210)', w: 148, h: 210 },
          { n: '사용자입력', custom: true },
        ] },
      { t: 'basic', qty: [{ key: 'goods_ea', unit: '매', value: 100 },
                          { key: 'goods_ea2', unit: '종', value: 1 }] },
      { t: 'part', title: '리플렛', part: 'in', rows: [
        { t: 'dosu', part: 'in', printer: DOSU_FULL },
        { t: 'paper', part: 'in', label: '용지선택', groups: PAPER_FLAT },
        { t: 'last', part: 'in', items: [LAST_COAT, LAST_CUT, LAST_FOLD, LAST_OSI, LAST_OSIFLD] },
      ] },
      { t: 'memo' },
      { t: 'estimate' },
    ],
  },

  print: {
    label: 'Print', goods: '명함', code: 'S0114',
    uploads: [{ slot: 'front', label: '앞면' }, { slot: 'back', label: '뒷면' }],
    steps: [
      { t: 'size', label: '규격 사이즈 선택', key: 'goods_size', value: '명함(90*50)',
        options: [{ n: '명함(90*50)', w: 90, h: 50 }] },
      { t: 'basic',
        /* the original 명함 quantity is a 100~1000매 select, not free entry */
        qtySelect: { key: 'goods_ea', value: '200 매',
          options: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((n) => n + ' 매') },
        qty: [{ key: 'goods_ea2', unit: '종', value: 1 }] },
      { t: 'part', title: '명함', part: 'in', rows: [
        { t: 'dosu', part: 'in', printer: DOSU_COLOR },
        { t: 'paper', part: 'in', label: '용지선택', groups: PAPER_CARD },
      ] },
      { t: 'memo' },
      { t: 'estimate' },
    ],
  },
};

/* step discs run through the CMYK marks the rest of the site uses */
const NO_COLORS = ['#0196ff', '#ffe710', '#f85485', '#302929'];

/* ---------------- state ---------------- */

const state = {
  mode: 'poster',
  opts: {},      // current form values, keyed by the original form names
  images: {},    // slot -> object URL of the uploaded artwork
};

const form = document.getElementById('ordForm');
const tabs = document.getElementById('ordTabs');
const preview = document.getElementById('ordPreview');
const dropHint = document.getElementById('ordDropHint');
const dimLabel = document.getElementById('ordDim');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const won = (n) => n.toLocaleString('ko-KR') + '원';

/* ---------------- row builders ---------------- */

function labelCell(text, forId) {
  if (!text) return '<span class="ord-label"></span>';
  return forId
    ? `<label class="ord-label" for="${forId}">${esc(text)}</label>`
    : `<span class="ord-label">${esc(text)}</span>`;
}

function selectRow(label, key, options, value, placeholder) {
  const opts = [];
  if (placeholder) {
    opts.push(`<option value=""${value ? '' : ' selected'}>${esc(placeholder)}</option>`);
  }
  options.forEach((o) => {
    opts.push(`<option${o === value ? ' selected' : ''}>${esc(o)}</option>`);
  });
  return `<div class="ord-row">${labelCell(label, 'opt-' + key)}` +
    `<select class="ord-select" id="opt-${key}" data-key="${key}">${opts.join('')}</select></div>`;
}

function segRow(label, key, options, value) {
  const items = options.map((o) =>
    `<button type="button" class="ord-seg-item${o === value ? ' is-on' : ''}" ` +
    `data-key="${key}" data-val="${esc(o)}">${esc(o)}</button>`).join('');
  return `<div class="ord-row">${labelCell(label)}` +
    `<div class="ord-seg" role="radiogroup" data-key="${key}">${items}</div></div>`;
}

function numRow(label, key, value, unit, min, max, step) {
  return `<div class="ord-row">${labelCell(label, 'opt-' + key)}<span class="ord-wh">` +
    `<input type="number" class="ord-input" id="opt-${key}" data-key="${key}" ` +
    `value="${esc(value)}" min="${min || 1}"${max ? ` max="${max}"` : ''}` +
    `${step ? ` step="${step}"` : ''} />` +
    (unit ? `<span class="ord-unit">${esc(unit)}</span>` : '') + '</span></div>';
}

function textRow(label, key, value, placeholder, wide) {
  return `<div class="ord-row">${labelCell(label, 'opt-' + key)}` +
    `<input type="text" class="ord-input${wide ? ' is-wide' : ''}" id="opt-${key}" ` +
    `data-key="${key}" value="${esc(value || '')}" placeholder="${esc(placeholder || '')}" /></div>`;
}

/* 가로 × 세로 in mm, as two boxes — the original 재단사이즈 / 실작업규격 rows */
function whRow(label, kw, kh, o) {
  return `<div class="ord-row">${labelCell(label)}<span class="ord-wh">` +
    `<input type="number" class="ord-input" data-key="${kw}" value="${esc(o[kw])}" min="1" />` +
    '<span class="ord-unit">㎜ ×</span>' +
    `<input type="number" class="ord-input" data-key="${kh}" value="${esc(o[kh])}" min="1" />` +
    '<span class="ord-unit">㎜</span></span></div>';
}

/* 용지 그룹 → 평량, the second select staying shut until a paper is picked */
function paperRows(p, label, groups, o) {
  const g = o[p + '_paper_group'];
  const weights = g
    ? WEIGHTS.map((w) => `<option${w === o[p + '_paper'] ? ' selected' : ''}>${w}</option>`).join('')
    : '<option value="">용지를 먼저 선택하세요</option>';
  return selectRow(label, p + '_paper_group', groups, g, '::: 용지선택 :::') +
    `<div class="ord-row is-sub${g ? '' : ' is-off'}">` +
      '<span class="ord-label">평량</span>' +
      `<select class="ord-select" data-key="${p}_paper"${g ? '' : ' disabled'}>${weights}</select>` +
    '</div>';
}

/* 세네카 — a readout, not an input: the spine thickness the page count buys.
   100g ≈ 0.1mm a sheet, and two pages make one sheet. */
function senecaMm(o) {
  const pages = Math.max(0, +o.in_page_val || 0) + (o.use_in2 ? (+o.in2_page_val || 0) : 0);
  const gsm = parseInt(String(o.in_paper || '100'), 10) || 100;
  return Math.max(0.5, Math.round((pages / 2) * (gsm / 1000) * 10) / 10);
}

function rowVisible(row, o) {
  if (!row.showIf) return true;
  const v = o[row.showIf.key];
  if (row.showIf.not !== undefined) return v !== row.showIf.not;
  if (row.showIf.is !== undefined) return v === row.showIf.is;
  return true;
}

/* ---------------- form render ---------------- */

let stepNo = 0;
function disc() {
  stepNo++;
  return `<span class="ord-no" style="--no:${NO_COLORS[(stepNo - 1) % NO_COLORS.length]}">${stepNo}</span>`;
}

function stepHead(title, note) {
  return `<h2 class="ord-step-head">${disc()}${esc(title)}</h2>` +
    (note ? `<p class="ord-note">${esc(note)}</p>` : '');
}

/* one part block (표지 / 내지 / 면지 …) — head carries its own subtotal,
   and the optional ones carry the 사용 / 사용 안 함 switch */
function renderPart(step, o) {
  const p = step.part;
  const off = step.optional && !o['use_' + p];
  const rows = [];

  (step.rows || []).forEach((r) => {
    /* conditional rows stay in the DOM and are only toggled, so typing in a
       number field never rebuilds the form under the cursor (refreshDynamic) */
    const before = rows.length;

    if (r.t === 'dosu') {
      rows.push(segRow('인쇄 도수', r.part + '_mun_values', MUN_VALUES, o[r.part + '_mun_values']));
      rows.push(segRow('칼라', r.part + '_printer', r.printer, o[r.part + '_printer']));

    } else if (r.t === 'paper') {
      rows.push(paperRows(r.part, r.label, r.groups, o));

    } else if (r.t === 'select') {
      rows.push(selectRow(r.label, r.key, r.options, o[r.key], r.ph));

    } else if (r.t === 'num') {
      rows.push(numRow(r.label, r.key, o[r.key], r.unit, r.min, r.max, r.step));

    } else if (r.t === 'text') {
      rows.push(textRow(r.label, r.key, o[r.key], r.placeholder, true));

    } else if (r.t === 'seneca') {
      rows.push('<div class="ord-row"><span class="ord-label">세네카</span>' +
        `<span class="ord-readout" data-readout="seneca">${senecaMm(o)} ㎜</span></div>`);

    } else if (r.t === 'last') {
      r.items.forEach((l, i) => {
        rows.push(selectRow(i === 0 ? '후가공' : '', r.part + '_' + l.key, l.options,
          o[r.part + '_' + l.key], l.ph));
      });

    } else if (r.t === 'notice') {
      rows.push(`<p class="ord-notice">! ${esc(r.text)}</p>`);
    }

    if (r.showIf) {
      const body = rows.splice(before).join('');
      rows.push(`<div class="ord-cond${rowVisible(r, o) ? '' : ' is-off'}" ` +
        `data-cond="${r.showIf.key}" data-cond-not="${esc(r.showIf.not || '')}">${body}</div>`);
    }
  });

  return `<section class="ord-step${off ? ' is-off' : ''}">` +
    `<h2 class="ord-step-head">${disc()}${esc(step.title)}` +
      (off ? '' : `<span class="ord-part-total" data-part-total="${p}">TOTAL ${won(partPrice(p))}</span>`) +
      (step.optional
        ? `<button type="button" class="ord-toggle${off ? '' : ' is-on'}" ` +
          `data-toggle="use_${p}">${off ? '사용 안 함' : '사용'}</button>`
        : '') +
    '</h2>' + (off ? '' : rows.join('')) + '</section>';
}

function renderForm(mode) {
  const schema = MODES[mode];
  const o = state.opts;
  const out = [];
  stepNo = 0;

  /* 1 — the original hands artwork over by web disk; here it feeds the preview */
  out.push(`<section class="ord-step">${stepHead('작업파일 등록')}<div class="ord-uploads">`);
  schema.uploads.forEach((u) => {
    out.push('<label class="ord-upload">' +
      `<span class="ord-upload-label">${esc(u.label)}</span>` +
      `<span class="ord-upload-state" data-slot-state="${u.slot}">파일 선택 / 드래그</span>` +
      `<input type="file" accept="image/*,.pdf" data-upload="${u.slot}" /></label>`);
  });
  out.push('</div></section>');

  schema.steps.forEach((s) => {
    if (s.t === 'size') {
      out.push(`<section class="ord-step">${stepHead(s.label, s.note)}` +
        `<div class="ord-sizes" data-key="${s.key}">`);
      s.options.forEach((op) => {
        const short = op.custom ? 'Free' : op.n.replace(/\s*\(.*$/, '');
        out.push(`<button type="button" class="ord-size${op.n === o[s.key] ? ' is-on' : ''}" ` +
          `data-key="${s.key}" data-val="${esc(op.n)}">` +
          `<span class="ord-size-icon${op.custom ? ' is-free' : ''}` +
          `${short.length > 2 ? ' is-long' : ''}">${esc(short)}</span>` +
          `<span class="ord-size-name">${esc(op.n)}</span></button>`);
      });
      out.push('</div></section>');

    } else if (s.t === 'basic') {
      out.push(`<section class="ord-step">${stepHead('기본정보')}`);
      out.push(textRow('주문제목', 'customer_name', o.customer_name,
        '주문 건을 구분할 제목', true));
      out.push(whRow('재단사이즈', 'goods_size_w', 'goods_size_h', o));
      out.push(whRow('실작업규격', 'size_w_plus', 'size_h_plus', o));
      if (s.qtySelect) {
        out.push(selectRow('수량', s.qtySelect.key, s.qtySelect.options, o[s.qtySelect.key]));
      }
      (s.qty || []).forEach((q) => {
        out.push(numRow('수량', q.key, o[q.key], q.unit, 1, 99999));
      });
      out.push(segRow('작업일정', 'quick_no', ['일반', '긴급'], o.quick_no));
      if (mode === 'book') {
        out.push('<div class="ord-row"><span class="ord-label">총페이지</span>' +
          `<span class="ord-readout" data-readout="totalPage">${totalPages(o)} p</span></div>`);
      }
      out.push('</section>');

    } else if (s.t === 'jebon') {
      out.push(`<section class="ord-step">${stepHead('제본')}`);
      out.push(segRow('제본 방식', 'goods_jebon',
        ['무선제본', '중철제본_세로형', 'PUR 제본', '링(스프링)제본', '제본 없음'], o.goods_jebon));
      out.push(segRow('제본 방향', 'goods_jebon_direction', ['가로', '세로'], o.goods_jebon_direction));
      out.push(selectRow('링제본 시 링색상', 'goods_opt_ring', ['검정색', '흰색'],
        o.goods_opt_ring, '::: 선택하세요 :::'));
      out.push(selectRow('링제본 시 PP 추가 (투명PP)', 'goods_opt_pp',
        ['앞 1장', '앞뒤 1장씩'], o.goods_opt_pp, '::: 선택하세요 :::'));
      out.push('</section>');

    } else if (s.t === 'part') {
      out.push(renderPart(s, o));

    } else if (s.t === 'memo') {
      /* memo and the estimate share the one step, as on the poster page */
      out.push(`<section class="ord-step">${stepHead('옵션 및 가격정보')}`);
      out.push('<div class="ord-row is-top"><label class="ord-label" for="opt-goods_memo">주문메모</label>' +
        '<textarea class="ord-input is-wide" id="opt-goods_memo" data-key="goods_memo" rows="3" ' +
        `placeholder="요청 사항이 있으면 적어 주세요.">${esc(o.goods_memo)}</textarea></div>`);

    } else if (s.t === 'estimate') {
      out.push(`<h3 class="ord-est-head">${esc(schema.goods)} 견적보기</h3>`);
      out.push('<dl class="ord-est" id="ordEstimate">' +
        '<div><dt>지류대</dt><dd data-est="paper">0원</dd></div>' +
        '<div><dt>인쇄비</dt><dd data-est="print">0원</dd></div>' +
        '<div><dt>제본비</dt><dd data-est="bind">0원</dd></div>' +
        '<div><dt>후가공</dt><dd data-est="last">0원</dd></div>' +
        '<div class="ord-est-sum"><dt>공급가액 (부가세)</dt><dd data-est="supply">0원</dd></div>' +
        '<div class="ord-est-total"><dt>청구금액</dt><dd data-est="total">0원</dd></div></dl>');
      out.push('<p class="ord-note">※ 실제 단가가 아닌 참고용 추정치입니다. ' +
        '주문접수는 로그인 후 가능합니다.</p>');
      out.push('<button type="button" class="ord-submit" id="ordSubmit">주문 접수</button>');
      out.push('</section>');
    }
  });

  form.innerHTML = out.join('');
  paintUploads();
}

function totalPages(o) {
  return (+o.in_page_val || 0) + (o.use_in2 ? (+o.in2_page_val || 0) : 0);
}

function paintUploads() {
  form.querySelectorAll('[data-slot-state]').forEach((el) => {
    const slot = el.getAttribute('data-slot-state');
    const set = Boolean(state.images[slot]);
    el.textContent = set ? '등록됨 · 바꾸려면 클릭' : '파일 선택 / 드래그';
    el.classList.toggle('is-set', set);
  });
}

/* ---------------- defaults ---------------- */

function parseDim(str) {
  const m = String(str || '').match(/(\d+)\s*[*×xX]\s*(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : { w: 210, h: 297 };
}

function seedDefaults(mode) {
  const o = { customer_name: '', quick_no: '일반', goods_memo: '' };

  MODES[mode].steps.forEach((s) => {
    if (s.t === 'size') {
      o[s.key] = s.value;
      const d = parseDim(s.value);
      o.goods_size_w = d.w; o.goods_size_h = d.h;
      o.size_w_plus = d.w; o.size_h_plus = d.h;

    } else if (s.t === 'basic') {
      (s.qty || []).forEach((q) => { o[q.key] = q.value; });
      if (s.qtySelect) o[s.qtySelect.key] = s.qtySelect.value;

    } else if (s.t === 'jebon') {
      o.goods_jebon = '무선제본';
      o.goods_jebon_direction = '세로';
      o.goods_opt_ring = '';
      o.goods_opt_pp = '';

    } else if (s.t === 'part') {
      if (s.optional) o['use_' + s.part] = Boolean(s.on);
      (s.rows || []).forEach((r) => {
        if (r.t === 'dosu') {
          o[r.part + '_mun_values'] = MUN_VALUES[0];
          o[r.part + '_printer'] = r.printer[0];
        } else if (r.t === 'paper') {
          o[r.part + '_paper_group'] = '';
          o[r.part + '_paper'] = '';
        } else if (r.t === 'last') {
          r.items.forEach((l) => { o[r.part + '_' + l.key] = ''; });
        } else if (r.key) {
          o[r.key] = r.value !== undefined ? r.value : '';
        }
      });
    }
  });
  return o;
}

/* ---------------- estimate ----------------
   Carried over unchanged, so the numbers match the earlier page: area is
   measured in A4s, paper 12원 and print 46원 per A4 per sheet, double-sided
   ×1.8, mono ×0.4, rush ×1.3, then binding and the finishing lines. */

function activeParts() {
  return MODES[state.mode].steps
    .filter((s) => s.t === 'part' && !(s.optional && !state.opts['use_' + s.part]))
    .map((s) => s.part);
}

/* how many sheets a part eats per copy */
function partSheets(p) {
  const o = state.opts;
  if (p === 'in') return state.mode === 'book' ? Math.max(1, (+o.in_page_val || 0) / 2) : 1;
  if (p === 'in2') return Math.max(1, (+o.in2_page_val || 0) / 2);
  if (p === 'mun') return o.mun_page_values === '앞뒤2장씩' ? 4 : 2;
  if (p === 'ganji') return Math.max(1, +o.ganji_page_values || 1);
  return 1;                                   // cover, and every flat product
}

function partCost(p) {
  const o = state.opts;
  const area = ((+o.goods_size_w || 210) * (+o.goods_size_h || 297)) / (210 * 297);  // A4 = 1
  const qty = parseInt(String(o.goods_ea).replace(/[^\d]/g, ''), 10) || 1;
  const kinds = +o.goods_ea2 || 1;
  const sheets = partSheets(p);

  /* 면지·간지 print through their own select, and 인쇄없음 costs no print */
  const typeKey = p === 'mun' ? o.mun_type_mun : p === 'ganji' ? o.ganji_type_mun : null;
  const noPrint = typeKey === '인쇄없음';
  const munVal = typeKey || o[p + '_mun_values'];
  const duplex = munVal === '양면출력' ? 1.8 : 1;
  const mono = o[p + '_printer'] === '흑백 1도' ? 0.4 : 1;

  const paper = Math.round(area * sheets * qty * kinds * 12);
  let print = noPrint ? 0 : Math.round(area * sheets * qty * kinds * 46 * duplex * mono);
  if (o.quick_no === '긴급') print = Math.round(print * 1.3);
  return { paper, print };
}

function partPrice(p) {
  const c = partCost(p);
  return c.paper + c.print;
}

function estimate() {
  const o = state.opts;
  const area = ((+o.goods_size_w || 210) * (+o.goods_size_h || 297)) / (210 * 297);
  const qty = parseInt(String(o.goods_ea).replace(/[^\d]/g, ''), 10) || 1;
  const kinds = +o.goods_ea2 || 1;

  let paper = 0;
  let print = 0;
  activeParts().forEach((p) => {
    const c = partCost(p);
    paper += c.paper;
    print += c.print;
  });

  let bind = 0;
  if (state.mode === 'book' && o.goods_jebon !== '제본 없음') {
    const rate = { '무선제본': 700, '중철제본_세로형': 400, 'PUR 제본': 1100,
                   '링(스프링)제본': 900 }[o.goods_jebon] || 0;
    bind = rate * qty;
    if (o.goods_opt_pp) bind += 300 * qty;                  // 투명PP
    if (o.cover_nalgae === '날개있음') bind += 250 * qty;
  }

  let last = 0;
  activeParts().forEach((p) => {
    if (o[p + '_lastJob4'] && o[p + '_lastJob4'] !== '코팅없음') {
      last += Math.round(area * qty * kinds * 18);
    }
    if (o[p + '_lastJob7'] === '재단') last += Math.round(qty * kinds * 6);
    if (o[p + '_lastJob27'] || o[p + '_lastJob54']) last += Math.round(qty * kinds * 22);
    if (o[p + '_lastJob47']) last += Math.round(qty * kinds * 10);
  });

  const supply = paper + print + bind + last;
  const vat = Math.round(supply * 0.1);
  return { paper, print, bind, last, supply, vat, total: supply + vat };
}

/* ---------------- what the form describes, in numbers the model can build --- */

/* how many panels the chosen 접지 folds the sheet into */
function foldPanels() {
  const s = state.opts.in_lastJob54 || state.opts.in_lastJob27 || '';
  if (/2단/.test(s)) return 2;
  if (/3단/.test(s)) return 3;
  if (/4단/.test(s) || /대문/.test(s)) return 4;
  return 1;
}

const coatOf = (s) => (/무광/.test(s || '') ? '무광' : /유광/.test(s || '') ? '유광' : '없음');

function derive() {
  const o = state.opts;
  const bind = o.goods_jebon || '무선제본';
  return {
    mode: state.mode,
    w: Math.max(1, +o.goods_size_w || 210),
    h: Math.max(1, +o.goods_size_h || 297),
    sides: o.in_mun_values === '양면출력' ? '양면' : '단면',
    coverSides: o.cover_mun_values === '양면출력' ? '양면' : '단면',
    coating: coatOf(o.in_lastJob4),
    coverCoating: coatOf(o.cover_lastJob4),
    paper: `${o.in_paper_group || ''} ${o.in_paper || ''}`,
    coverPaper: `${o.cover_paper_group || ''} ${o.cover_paper || ''}`,
    panels: foldPanels(),
    bind,
    spine: bind === '제본 없음' ? 0 : senecaMm(o),
    direction: o.goods_jebon_direction || '세로',
    pages: totalPages(o),
    wings: o.cover_nalgae === '날개있음',
    cover: Boolean(o.use_cover),
    ringColor: o.goods_opt_ring === '흰색' ? 0xf2f2f2 : 0x2b2b2b,
  };
}

/* the caption under the stage reads back what is on screen */
function paintCaption() {
  const o = state.opts;
  const D = derive();
  let extra = '';
  if (state.mode === 'book') {
    extra = ` · ${D.pages}p · ${D.bind}` + (D.spine ? ` · 세네카 ${D.spine}㎜` : '');
  } else if (D.panels > 1) {
    extra = ` · ${o.in_lastJob54 || o.in_lastJob27}`;
  } else if (D.sides === '양면') {
    extra = ' · 양면';
  }
  dimLabel.textContent = `${D.w}×${D.h}mm${extra}`;

  const primary = MODES[state.mode].uploads[0].slot;
  dropHint.textContent = state.images[primary]
    ? '드래그로 돌려 보세요 · 휠로 확대'
    : '1번에서 파일을 올리거나 여기에 끌어다 놓으면 바로 3D에 반영됩니다';
}

/* ---------------- live refresh, without rebuilding the form ---------------- */

function refreshDynamic() {
  const o = state.opts;

  form.querySelectorAll('[data-cond]').forEach((el) => {
    el.classList.toggle('is-off', o[el.getAttribute('data-cond')] === el.getAttribute('data-cond-not'));
  });

  const seneca = form.querySelector('[data-readout="seneca"]');
  if (seneca) seneca.textContent = `${senecaMm(o)} ㎜`;

  const tp = form.querySelector('[data-readout="totalPage"]');
  if (tp) tp.textContent = `${totalPages(o)} p`;

  form.querySelectorAll('[data-part-total]').forEach((el) => {
    el.textContent = `TOTAL ${won(partPrice(el.getAttribute('data-part-total')))}`;
  });

  const e = estimate();
  const put = (key, text) => {
    const el = form.querySelector(`[data-est="${key}"]`);
    if (el) el.textContent = text;
  };
  put('paper', won(e.paper));
  put('print', won(e.print));
  put('bind', won(e.bind));
  put('last', won(e.last));
  put('supply', `${won(e.supply)} (${won(e.vat)})`);
  put('total', won(e.total));
}

function onOptionChange() {
  refreshDynamic();
  paintCaption();
  if (engine) engine.update(derive());
}

/* ---------------- inputs ---------------- */

function setOpt(key, value) {
  state.opts[key] = value;

  /* picking a preset fills both size rows, as the original sizeInput did */
  const sizeStep = MODES[state.mode].steps.find((s) => s.t === 'size');
  if (sizeStep && key === sizeStep.key) {
    const op = sizeStep.options.find((x) => x.n === value);
    if (op && !op.custom) {
      state.opts.goods_size_w = op.w;
      state.opts.goods_size_h = op.h;
      state.opts.size_w_plus = op.w;
      state.opts.size_h_plus = op.h;
    }
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  /* 평량 only opens once a paper is chosen */
  if (/_paper_group$/.test(key)) {
    state.opts[key.replace('_paper_group', '') + '_paper'] = value ? WEIGHTS[0] : '';
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  /* typing a size by hand moves the preset highlight to the match, or to 사용자입력 */
  if (key === 'goods_size_w' || key === 'goods_size_h') {
    if (sizeStep) {
      const w = +state.opts.goods_size_w;
      const h = +state.opts.goods_size_h;
      const hit = sizeStep.options.find((op) => !op.custom && op.w === w && op.h === h)
        || sizeStep.options.find((op) => op.custom);
      if (hit) {
        state.opts[sizeStep.key] = hit.n;
        form.querySelectorAll(`.ord-size[data-key="${sizeStep.key}"]`).forEach((b) =>
          b.classList.toggle('is-on', b.getAttribute('data-val') === hit.n));
      }
    }
    onOptionChange();
    return;
  }

  /* segmented controls repaint themselves rather than rebuilding the form */
  form.querySelectorAll(`.ord-seg-item[data-key="${key}"]`).forEach((b) =>
    b.classList.toggle('is-on', b.getAttribute('data-val') === value));
  form.querySelectorAll(`.ord-size[data-key="${key}"]`).forEach((b) =>
    b.classList.toggle('is-on', b.getAttribute('data-val') === value));

  onOptionChange();
}

form.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-upload]')) {
    const file = el.files && el.files[0];
    if (file) takeFile(file, el.getAttribute('data-upload'));
    return;
  }
  if (el.matches('[data-key]')) setOpt(el.getAttribute('data-key'), el.value);
});

form.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('input[type=number][data-key], input[type=text][data-key], textarea[data-key]')) {
    setOpt(el.getAttribute('data-key'), el.value);
  }
});

form.addEventListener('click', (e) => {
  const btn = e.target.closest('.ord-seg-item, .ord-size');
  if (btn) {
    setOpt(btn.getAttribute('data-key'), btn.getAttribute('data-val'));
    return;
  }

  const tog = e.target.closest('[data-toggle]');
  if (tog) {
    const k = tog.getAttribute('data-toggle');
    state.opts[k] = !state.opts[k];
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  if (e.target.closest('#ordSubmit')) {
    const btn2 = e.target.closest('#ordSubmit');
    btn2.textContent = `주문 접수는 준비 중입니다 — 추정 ${won(estimate().total)}`;
    btn2.classList.add('is-done');
    setTimeout(() => {
      btn2.textContent = '주문 접수';
      btn2.classList.remove('is-done');
    }, 3200);
  }
});

/* ---------------- artwork ---------------- */

/* the model wants a decoded image, so the file is read before it lands */
function takeFile(file, slot) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.images[slot] = img;
      paintUploads();
      paintCaption();
      if (engine) engine.setTexture(slot, img);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* dropping on the preview feeds the first slot of the current product */
['dragenter', 'dragover'].forEach((ev) =>
  preview.addEventListener(ev, (e) => { e.preventDefault(); preview.classList.add('is-drop'); }));
['dragleave', 'drop'].forEach((ev) =>
  preview.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragleave' && preview.contains(e.relatedTarget)) return;
    preview.classList.remove('is-drop');
  }));
preview.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) takeFile(file, MODES[state.mode].uploads[0].slot);
});

document.getElementById('ordViewReset').addEventListener('click', () => {
  if (engine) engine.resetView();
});

/* ---------------- product tabs ---------------- */

tabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.ord-tab');
  if (!btn || btn.classList.contains('is-on')) return;
  tabs.querySelectorAll('.ord-tab').forEach((b) => b.classList.toggle('is-on', b === btn));
  switchMode(btn.dataset.mode);
});

function switchMode(mode) {
  if (!MODES[mode]) return;
  state.mode = mode;
  state.images = {};                 // artwork is per product
  state.opts = seedDefaults(mode);
  renderForm(mode);
  refreshDynamic();
  paintCaption();
  if (engine) engine.rebuild(derive(), state.images);
  form.scrollTop = 0;
}

/* ---------------- 3D stage ----------------
   three.js is pulled in once, here, and only on this page. Until it lands
   the form is already usable; if it never lands the page says so rather
   than leaving an empty right half. */

const stage = document.getElementById('ordStage');
const stageNote = document.getElementById('ordStageNote');
let engine = null;

switchMode('poster');

createEngine(stage).then((eng) => {
  engine = eng;
  stageNote.remove();
  engine.rebuild(derive(), state.images);
  engine.start();
}).catch((err) => {
  stageNote.textContent = '3D 미리보기를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.';
  stageNote.classList.add('is-error');
  console.error('[order] 3D init failed:', err);
});

window.addEventListener('resize', () => { if (engine) engine.resize(); });

/* ==========================================================================
   The model — one paper object, rebuilt whenever the form changes.

   Everything is measured in mm off the form and normalised so the longest
   edge of the product spans 3 world units, which keeps a name card and a
   B2 poster equally readable in the same frame.
   ========================================================================== */

async function createEngine(mount) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'ord-canvas';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const fitCenter = new THREE.Vector3();
  let fitDist = 6;

  /* A sheet or a book stands up and is read from a low three-quarter on the
     left, which is where its spine and fold are. A card lies down, so it has
     to be looked at from above or it disappears edge-on. */
  const viewDir = (mode) => (mode === 'print'
    ? new THREE.Vector3(-0.3, 0.9, 0.85).normalize()
    : new THREE.Vector3(-0.38, 0.22, 1).normalize());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.52;

  /* white stock on a white page only reads through its own shading, so the
     fill stays low and the key comes in steeply from the left */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdedede, 0.32));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-3, 10, 4.5);      // steep, so a standing sheet casts a short shadow
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 24;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 8;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(4, 1.5, -2);
  scene.add(fill);

  /* the environment is only there to give coated stock something to reflect */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* the object sits on this; nothing but its shadow is drawn */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.004;      // clear of the object's own bottom face
  ground.receiveShadow = true;
  scene.add(ground);

  let root = new THREE.Group();
  scene.add(root);

  /* ---- textures ---- */

  const texCache = {};

  /* an unfilled face reads as blank stock with its name on it — the same
     grey the flat preview used, so nothing jumps when the model appears */
  function placeholder(label) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 724;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#d6d6d6';
    g.lineWidth = 4;
    g.strokeRect(16, 16, c.width - 32, c.height - 32);
    g.fillStyle = '#b4b4b4';
    g.font = '34px "IBM Plex Mono", monospace';
    g.textAlign = 'center';
    g.fillText(label || '', c.width / 2, c.height / 2 + 12);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function fromImage(img) {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.needsUpdate = true;
    return t;
  }

  /* blank stock is drawn once per label and shared; per-panel clones are
     tracked so a rebuild does not leave textures behind */
  const blanks = {};
  const perBuild = [];

  function texFor(slot, label) {
    if (texCache[slot]) return texCache[slot];
    if (!blanks[label]) blanks[label] = placeholder(label);
    return blanks[label];
  }

  function cloneTex(t) {
    if (!t) return null;
    const c = t.clone();
    c.needsUpdate = true;
    perBuild.push(c);
    return c;
  }

  /* ---- materials ---- */

  /* coating is the whole difference between a matt and a glossy sheet, and
     uncoated stock (모조·반누보·레자크…) never gets a sheen at all */
  function paperMat(coating, paperName, map) {
    const uncoated = /모조|미색|반누보|레자크|색지|크라프트|마쉬멜로우/.test(paperName || '');
    return new THREE.MeshPhysicalMaterial({
      map: map || null,
      color: map ? 0xffffff : 0xfafafa,
      roughness: coating === '유광' ? 0.15 : coating === '무광' ? 0.46 : (uncoated ? 0.92 : 0.72),
      metalness: 0,
      clearcoat: coating === '유광' ? 1 : coating === '무광' ? 0.3 : 0,
      clearcoatRoughness: coating === '유광' ? 0.1 : 0.42,
      envMapIntensity: 0.6,
    });
  }

  /* the cut edge is what makes a sheet look like paper and not a plane */
  const cutEdge = () => new THREE.MeshStandardMaterial({ color: 0xe4ddcd, roughness: 0.95 });
  const pageBlock = () => new THREE.MeshStandardMaterial({ color: 0xf2ebdb, roughness: 0.96 });

  /* ---- helpers ---- */

  function clear() {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    perBuild.splice(0).forEach((t) => t.dispose());
    scene.remove(root);
    root = new THREE.Group();
    scene.add(root);
  }

  /* mm -> world, longest edge of the product spanning 3 units */
  function unit(D) {
    return 3 / Math.max(D.w, D.h);
  }

  /* map the ±z faces of a box onto the [u0,u1] slice of its texture, so a
     folded sheet shows one continuous artwork across its panels */
  function sliceUV(geo, u0, u1) {
    const uv = geo.attributes.uv;
    for (const base of [16, 20]) {
      for (let i = 0; i < 4; i++) {
        uv.setX(base + i, u0 + uv.getX(base + i) * (u1 - u0));
      }
    }
    uv.needsUpdate = true;
  }

  function sheet(w, h, t, frontMat, backMat) {
    const edge = cutEdge();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, t),
      [edge, edge, edge, edge, frontMat, backMat]);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ---- the four products ---- */

  /* Poster and leaflet are the same object; only the 접지 differs. Standing
     upright is how you would hold a sheet up to look at it. */
  function buildSheet(D) {
    const s = unit(D);
    const w = D.w * s;
    const h = D.h * s;
    const t = 0.018;
    const panels = Math.max(1, D.panels);

    const front = texFor('front', '앞면');
    const back = D.sides === '양면' ? texFor('back', '뒷면') : null;

    if (panels === 1) {
      const m = sheet(w, h, t, paperMat(D.coating, D.paper, front),
        paperMat(D.coating, D.paper, back));
      m.position.y = h / 2;
      root.add(m);
      return;
    }

    /* an accordion: each panel turns ±angle about the fold before the next */
    const pw = w / panels;
    const angle = 0.5;
    const g = new THREE.Group();
    let x = 0;
    let z = 0;
    for (let i = 0; i < panels; i++) {
      const rot = (i % 2 === 0 ? 1 : -1) * angle;
      const geo = new THREE.BoxGeometry(pw, h, t);
      sliceUV(geo, i / panels, (i + 1) / panels);
      const edge = cutEdge();
      const panel = new THREE.Mesh(geo, [edge, edge, edge, edge,
        paperMat(D.coating, D.paper, cloneTex(front)),
        paperMat(D.coating, D.paper, cloneTex(back))]);
      panel.castShadow = true;
      panel.receiveShadow = true;
      const dx = Math.cos(rot) * pw;
      const dz = -Math.sin(rot) * pw;
      panel.position.set(x + dx / 2, h / 2, z + dz / 2);
      panel.rotation.y = rot;
      g.add(panel);
      x += dx;
      z += dz;
    }
    centre(g);
    root.add(g);
  }

  /* A card is looked at lying down. 양면 shows both, one turned over. */
  function buildCard(D) {
    const s = unit(D);
    const w = D.w * s;
    const h = D.h * s;
    const t = 0.032;

    const face = sheet(w, h, t, paperMat(D.coating, D.paper, texFor('front', '앞면')),
      paperMat(D.coating, D.paper, null));
    face.rotation.x = -Math.PI / 2;
    face.position.set(0, t / 2, 0);

    if (D.sides !== '양면') {
      face.rotation.z = 0.12;
      root.add(face);
      return;
    }

    const g = new THREE.Group();
    face.position.x = -w * 0.56;
    g.add(face);

    const flip = sheet(w, h, t, paperMat(D.coating, D.paper, texFor('back', '뒷면')),
      paperMat(D.coating, D.paper, null));
    flip.rotation.x = -Math.PI / 2;
    flip.position.set(w * 0.56, t / 2, 0);
    g.add(flip);

    g.rotation.y = 0.1;
    root.add(g);
  }

  /* A book, closed, seen from the spine side: cover, page block, spine —
     with rings, staples or a glued back depending on 제본 방식. */
  function buildBook(D) {
    const s = unit(D);
    const w = D.w * s;
    const h = D.h * s;
    /* a 0-page book would be a plane; give the block a floor so it reads */
    const d = Math.max(0.02, D.spine * s);
    const cover = 0.006;

    const g = new THREE.Group();
    const coverMat = (slot, label) =>
      paperMat(D.coverCoating, D.coverPaper, D.cover ? texFor(slot, label) : null);

    /* the pages, inset a hair so the cover overhangs like a real trim */
    const block = new THREE.Mesh(new THREE.BoxGeometry(w * 0.985, h * 0.985, d), pageBlock());
    block.castShadow = true;
    block.receiveShadow = true;
    g.add(block);

    const front = sheet(w, h, cover, coverMat('cover', '표지'), pageBlock());
    front.position.z = d / 2 + cover / 2;
    g.add(front);

    const back = sheet(w, h, cover, pageBlock(), coverMat('coverBack', '뒷표지'));
    back.position.z = -(d / 2 + cover / 2);
    g.add(back);

    if (D.bind === '링(스프링)제본') {
      const ringMat = new THREE.MeshStandardMaterial({
        color: D.ringColor, metalness: 0.55, roughness: 0.4,
      });
      /* the coil has to clear the block front and back, and sit right on the
         edge, or at this size it disappears inside the covers */
      const r = Math.max(0.055, (d / 2 + cover) * 1.5);
      const count = Math.max(8, Math.round(h / (r * 2.1)));
      for (let i = 0; i < count; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.2, 8, 22), ringMat);
        ring.position.set(-w / 2 + r * 0.25, -h / 2 + ((i + 0.5) / count) * h, 0);
        ring.rotation.y = Math.PI / 2;
        ring.castShadow = true;
        g.add(ring);
      }
    } else if (D.bind !== '제본 없음') {
      /* 무선·PUR wrap the cover around the back; 중철 folds and staples it */
      const spineMat = D.bind === '중철제본_세로형'
        ? pageBlock()
        : coverMat('cover', '표지');
      const spine = new THREE.Mesh(new THREE.BoxGeometry(cover, h, d + cover * 2), spineMat);
      spine.position.x = -(w / 2 + cover / 2);
      spine.castShadow = true;
      g.add(spine);

      if (D.bind === '중철제본_세로형') {
        const steel = new THREE.MeshStandardMaterial({
          color: 0x9aa0a6, metalness: 0.85, roughness: 0.3,
        });
        [-h * 0.22, h * 0.22].forEach((y) => {
          const st = new THREE.Mesh(new THREE.BoxGeometry(cover * 1.6, h * 0.08, d * 0.5), steel);
          st.position.set(-(w / 2 + cover / 2), y, 0);
          st.castShadow = true;
          g.add(st);
        });
      }
    }

    /* 표지날개 — the cover folds back in at the fore edge */
    if (D.wings && D.cover) {
      [1, -1].forEach((side) => {
        const wing = sheet(w * 0.4, h, cover, coverMat('cover', '표지'), pageBlock());
        const pivot = new THREE.Group();
        pivot.position.set(w / 2, 0, side * (d / 2 + cover / 2));
        wing.position.x = -w * 0.2;
        wing.rotation.y = side * 0.55;
        pivot.add(wing);
        g.add(pivot);
      });
    }

    /* 가로 제본 is bound on the long edge, so the whole thing turns */
    if (D.direction === '가로') g.rotation.z = -Math.PI / 2;

    centre(g);
    root.add(g);
  }

  /* drop a group onto the ground and centre it over the origin */
  function centre(g) {
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    const c = new THREE.Vector3();
    box.getCenter(c);
    g.position.x -= c.x;
    g.position.z -= c.z;
    g.position.y -= box.min.y;
  }

  function build(D) {
    clear();
    if (D.mode === 'book') buildBook(D);
    else if (D.mode === 'print') buildCard(D);
    else buildSheet(D);
    root.updateMatrixWorld(true);
    fitCamera();
  }

  /* Frame by the bounding sphere rather than by width and height: the object
     is orbited, so what has to fit is the same from every angle. keepAngle
     holds whatever the user has turned to across an option change. */
  function fitCamera(keepAngle) {
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    fitCenter.copy(sphere.center);

    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    fitDist = Math.max(sphere.radius / Math.sin(vFov / 2),
      sphere.radius / Math.sin(hFov / 2)) * 1.06;
    controls.minDistance = fitDist * 0.35;
    controls.maxDistance = fitDist * 2.2;

    const dir = keepAngle
      ? camera.position.clone().sub(controls.target).normalize()
      : viewDir(current ? current.mode : state.mode);
    controls.target.copy(fitCenter);
    camera.position.copy(fitCenter).add(dir.multiplyScalar(fitDist));
    controls.update();
  }

  /* ---- loop ---- */

  let raf = null;
  let running = false;
  let current = null;

  function frame() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  /* the stage lives inside the scaled 1920 frame, so the drawing buffer is
     sized by the frame's own px and then multiplied by the page scale —
     otherwise the canvas softens as the window grows */
  function resize() {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    const scale = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * scale, 2.5));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera(true);
  }

  return {
    rebuild(D, images) {
      Object.keys(texCache).forEach((slot) => { texCache[slot].dispose(); delete texCache[slot]; });
      Object.keys(images).forEach((slot) => { texCache[slot] = fromImage(images[slot]); });
      current = D;
      build(D);
    },
    update(D) {
      current = D;
      clear();
      if (D.mode === 'book') buildBook(D);
      else if (D.mode === 'print') buildCard(D);
      else buildSheet(D);
      root.updateMatrixWorld(true);
      fitCamera(true);              // an option change must not steal the view
    },
    setTexture(slot, img) {
      if (texCache[slot]) texCache[slot].dispose();
      texCache[slot] = fromImage(img);
      if (current) this.update(current);
    },
    resetView() { fitCamera(false); },
    resize,
    start() {
      if (running) return;
      running = true;
      resize();
      frame();
    },
  };
}
