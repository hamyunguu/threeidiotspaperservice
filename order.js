/* ---------------------------------------------------------------
   Service (order) page — Poster / Book / Products.

   The order schemas are carried over from the earlier standalone
   order page: same step order (규격 → 기본정보 → 제본 → 파트 → 주문메모 →
   견적), same select options and placeholder wording, same field keys
   (goods_size, in_paper_group, in_lastJob4 …), same estimate model. Only
   the presentation is this site's — black hairlines, IBM Plex Mono
   labels, CMYK completion planes — and the live three.js preview reads
   the same normalized option data as the estimate model. That shared data
   contract lets future left-hand fields alter paper, coating, folds,
   binding and artwork without rebuilding the viewer API.

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
    uploads: [{ slot: 'front', label: '작업 파일' }],
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
      { slot: 'cover', label: '앞 표지' },
      { slot: 'coverBack', label: '뒷 표지' },
      { slot: 'inner', label: '내지' },
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

/* The redesigned service has three top-level products. Products keeps the
   existing name-card calculation as its base and exposes booklet/leaflet/
   card as a nested choice, exactly like the Figma Products state. */
MODES.product = {
  ...MODES.print,
  label: 'Products',
  goods: '제품',
  uploads: [{ slot: 'front', label: '작업 파일' }],
};

const SERVICE_MODES = {
  poster: { ko: '포스터', en: 'Poster', ink: '#ffff00' },
  book: { ko: '책', en: 'Book', ink: '#ec008c' },
  product: { ko: '제품', en: 'Products', ink: '#00a0ff' },
};

const SERVICE_FORMATS = [
  { name: 'A1', w: 594, h: 841 }, { name: 'A2', w: 420, h: 594 },
  { name: 'A3', w: 297, h: 420 }, { name: 'A4', w: 210, h: 297 },
  { name: 'A5', w: 148, h: 210 }, { name: 'A6', w: 105, h: 148 },
  { name: 'B1', w: 728, h: 1030 }, { name: 'B2', w: 515, h: 728 },
  { name: 'B3', w: 364, h: 515 }, { name: 'B4', w: 257, h: 364 },
  { name: 'B5', w: 182, h: 257 }, { name: 'B6', w: 128, h: 182 },
];

/* 제본 방식 — 사철은 실로 대장을 꿰는 방식이라 링·중철과 함께 늘 걸려 있어야 한다 */
const BINDINGS = ['무선제본', '사철제본', '중철제본_세로형', 'PUR 제본', '링(스프링)제본', '제본 없음'];

/* 참고용 추정치의 부당 제본 단가 */
const BIND_RATE = {
  '무선제본': 700,
  '사철제본': 1400,
  '중철제본_세로형': 400,
  'PUR 제본': 1100,
  '링(스프링)제본': 900,
};

/* step discs run through the CMYK marks the rest of the site uses */
const NO_COLORS = ['#0196ff', '#ffe710', '#f85485', '#302929'];

/* ---------------- state ---------------- */

const state = {
  mode: 'poster',
  opts: {},      // current form values, keyed by the original form names
  images: {},    // slot -> decoded artwork the model textures itself from
  files: {},     // slot -> { label, busy } for the upload row
  pickedSize: '',
  detailActive: false,
};

const form = document.getElementById('ordForm');
const tabs = document.getElementById('ordTabs');
const common = document.getElementById('ordCommon');
const commonPane = document.getElementById('ordCommonPane');
const detailPane = document.getElementById('ordDetailPane');
const detailTitle = document.getElementById('ordDetailTitle');
const productKinds = document.getElementById('ordProductKinds');
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
  /* 제본 방식처럼 항목이 많은 줄은 좁혀야 한 줄에 들어간다 */
  const tight = options.length > 4 ? ' is-tight' : '';
  return `<div class="ord-row">${labelCell(label)}` +
    `<div class="ord-seg${tight}" role="radiogroup" data-key="${key}">${items}</div></div>`;
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

function renderLegacyForm(mode) {
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
      out.push('</div>');

      /* 사용자입력을 고르면 바로 그 자리에서 치수를 받는다 — 아래 기본정보까지
         내려가서 재단사이즈를 찾아야 할 이유가 없다 */
      const custom = s.options.find((op) => op.custom);
      if (custom && o[s.key] === custom.n) {
        out.push('<div class="ord-custom">' +
          `<div class="ord-row"><span class="ord-label">직접 입력</span><span class="ord-wh">` +
          `<input type="number" class="ord-input" data-key="custom_w" value="${esc(o.goods_size_w)}" min="1" />` +
          '<span class="ord-unit">㎜ ×</span>' +
          `<input type="number" class="ord-input" data-key="custom_h" value="${esc(o.goods_size_h)}" min="1" />` +
          '<span class="ord-unit">㎜</span></span></div>' +
          '<p class="ord-note">재단사이즈와 실작업규격에 함께 반영됩니다.</p></div>');
      }
      out.push('</section>');

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
      out.push(segRow('제본 방식', 'goods_jebon', BINDINGS, o.goods_jebon));
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

/* ---------------- service v2: split common/detail panes ---------------- */

function commonHead(no, label, done) {
  return `<h2 class="ord-common-head${done ? ' is-complete' : ''}">` +
    `<span>${done ? '✓' : no}</span>${esc(label)}</h2>`;
}

function frameMarks() {
  return '<i class="ord-field-mark is-lt"></i><i class="ord-field-mark is-rt"></i>' +
    '<i class="ord-field-mark is-lb"></i><i class="ord-field-mark is-rb"></i>';
}

function framedControl(content, className, tag) {
  const el = tag || 'span';
  return `<${el} class="ord-field-frame ${className || ''}">${frameMarks()}` +
    `<span class="ord-field-core">${content}</span></${el}>`;
}

function formatButton(f, cls) {
  const on = state.pickedSize === f.name ? ' is-on' : '';
  return `<button type="button" class="ord-format ${cls}${on}" data-format="${f.name}" ` +
    `data-w="${f.w}" data-h="${f.h}"><span>${f.name}</span></button>`;
}

function formatBoard(prefix, label, mode) {
  const all = SERVICE_FORMATS.filter((f) => f.name[0] === prefix);
  const fs = mode === 'product' ? all.slice(2, 6) : all.slice(0, 4);
  const picked = fs.find((f) => f.name === state.pickedSize);
  const widthText = picked ? `${picked.w}×${picked.h}` : '000×000';
  return `<div class="ord-format-set is-${prefix.toLowerCase()}">` +
    `<p><span>${label}</span><b data-format-dim>${widthText}</b></p><div class="ord-format-board">` +
    formatButton(fs[0], `is-${prefix.toLowerCase()}1`) +
    formatButton(fs[1], `is-${prefix.toLowerCase()}2`) +
    formatButton(fs[2], `is-${prefix.toLowerCase()}3`) +
    formatButton(fs[3], `is-${prefix.toLowerCase()}4`) +
    '<i class="ord-format-hover" aria-hidden="true"><span></span></i></div></div>';
}

function commonDone() {
  const schema = MODES[state.mode];
  const files = schema.uploads.every((u) => state.files[u.slot] && !state.files[u.slot].busy);
  const order = Boolean(String(state.opts.customer_name || '').trim()) &&
    (parseInt(String(state.opts.goods_ea || '').replace(/[^\d]/g, ''), 10) || 0) > 0 &&
    (state.mode !== 'book' || (parseInt(state.opts.in_page_val, 10) || 0) > 0) &&
    Boolean(state.opts.quick_no);
  return { files, size: Boolean(state.pickedSize), order };
}

function renderCommon(mode) {
  const schema = MODES[mode];
  const o = state.opts;
  const done = commonDone();
  const out = [];

  out.push(`<section class="ord-common-step" data-common-step="files">${commonHead(1, '작업 파일', done.files)}`);
  out.push('<div class="ord-common-uploads">');
  schema.uploads.forEach((u) => {
    const file = state.files[u.slot];
    const upload = framedControl(
      `<span data-slot-state="${u.slot}">${file ? esc(file.label) : '파일 선택 혹은 드래그(.pdf/.png/.jpeg)'}</span>` +
      `<input type="file" accept="image/*,.pdf" data-upload="${u.slot}">`,
      `ord-common-upload${file && !file.busy ? ' is-complete' : ''}`, 'label');
    out.push(mode === 'book'
      ? `<div class="ord-book-upload-row"><b>${esc(u.label)}</b>${upload}</div>`
      : upload);
  });
  out.push('</div></section>');

  out.push(`<section class="ord-common-step" data-common-step="size">${commonHead(2, '작업 크기', done.size)}` +
    '<p class="ord-common-help">드래그 혹은 클릭하여 크기를 지정하세요.</p><div class="ord-format-groups">' +
    formatBoard('A', 'A판형', mode) + formatBoard('B', 'B판형', mode) +
    `<div class="ord-format-set is-custom"><p><span>사용자 지정</span><b data-format-dim>${state.pickedSize === 'custom' ? `${esc(o.goods_size_w)}×${esc(o.goods_size_h)}` : '000×000'}</b></p>` +
      `<button type="button" class="ord-format is-custom${state.pickedSize === 'custom' ? ' is-on' : ''}" data-format="custom">` +
        '<span>직접 입력</span></button></div></div>' +
    `<div class="ord-custom-size${state.pickedSize === 'custom' ? ' is-on' : ''}">` +
      `<input type="number" min="1" data-common-key="custom_w" value="${esc(o.goods_size_w)}" aria-label="사용자 지정 가로">` +
      '<span>×</span>' +
      `<input type="number" min="1" data-common-key="custom_h" value="${esc(o.goods_size_h)}" aria-label="사용자 지정 세로"><span>㎜</span></div>` +
    '</section>');

  const qty = parseInt(String(o.goods_ea || '').replace(/[^\d]/g, ''), 10) || 0;
  const pages = parseInt(o.in_page_val, 10) || 0;
  const titleField = framedControl(
    `<input class="ord-common-field${String(o.customer_name || '').trim() ? ' is-complete' : ''}" ` +
    `data-common-key="customer_name" value="${esc(o.customer_name)}" placeholder="제목을 입력하세요.">`,
    'is-title');
  const qtyField = framedControl(
    `<input type="number" min="0" class="ord-common-field${qty > 0 ? ' is-complete' : ''}" ` +
    `data-common-key="goods_ea" value="${qty}">`, 'is-qty');
  const pageField = framedControl(
    `<input type="number" min="0" step="2" class="ord-common-field${pages > 0 ? ' is-complete' : ''}" ` +
    `data-common-key="in_page_val" value="${pages}">`, 'is-qty');
  const rush = framedControl('<button type="button" data-common-value="긴급">긴급</button>',
    `is-schedule${o.quick_no === '긴급' ? ' is-complete' : ''}`);
  const normal = framedControl('<button type="button" data-common-value="일반">일반</button>',
    `is-schedule${o.quick_no === '일반' ? ' is-complete' : ''}`);
  const next = framedControl('<button type="button" class="ord-next" id="ordNext">다음 | 상세 정보 입력</button>',
    'ord-next-frame');
  out.push(`<section class="ord-common-step" data-common-step="order">${commonHead(3, '주문 정보', done.order)}` +
    `<div class="ord-common-row"><label>주문 제목</label>${titleField}</div>` +
    `<div class="ord-common-row"><label>주문 수량</label><div class="ord-quantity-set">${qtyField}` +
      `<span class="ord-unit-label">${mode === 'book' ? '부' : '매'}</span>` +
      (mode === 'book' ? `${pageField}<span class="ord-unit-label">페이지</span>` : '') +
    `</div></div>` +
    `<div class="ord-common-row"><label>주문 일정</label><div class="ord-common-seg">${rush}${normal}</div></div>` +
    `${next}</section>`);

  common.innerHTML = out.join('');
}

function detailChoice(key, value, label) {
  const button = `<button type="button" class="ord-detail-choice ord-seg-item${state.opts[key] === value ? ' is-on' : ''}" ` +
    `data-key="${key}" data-val="${esc(value)}">${esc(label || value)}</button>`;
  return framedControl(button, 'ord-detail-choice-frame');
}

function renderForm(mode) {
  const meta = SERVICE_MODES[mode];
  const o = state.opts;
  const papers = mode === 'book' ? PAPER_BOOK : mode === 'product' ? PAPER_CARD : PAPER_FLAT;
  const finish = mode === 'book' ? BINDINGS : ['코팅 없음', '무광 코팅', '유광 코팅', '재단'];
  const colors = ['컬러 8도', '컬러 4도', '컬러 2도', '흑백 1도', '별색 지정', '상담 필요'];

  detailTitle.innerHTML = `<strong>${meta.ko}</strong><span>작업 상세 정보</span>`;
  form.innerHTML =
    `<section class="ord-detail-step">${commonHead(1, '양면 인쇄 여부', Boolean(o.in_mun_values))}` +
      '<div class="ord-detail-options is-small">' +
      detailChoice('in_mun_values', '양면출력', '양면') +
      detailChoice('in_mun_values', '단면출력', '단면') + '</div></section>' +
    `<section class="ord-detail-step">${commonHead(2, '색상 도수', Boolean(o.in_printer))}` +
      '<div class="ord-detail-options is-colors">' +
      colors.map((c) => detailChoice('in_printer', c, c)).join('') + '</div></section>' +
    `<section class="ord-detail-step">${commonHead(3, '종이 선택', Boolean(o.in_paper_group))}` +
      framedControl(`<select class="ord-detail-select${o.in_paper_group ? ' is-complete' : ''}" data-key="in_paper_group">` +
      '<option value="">종이 선택</option>' + papers.map((p) => `<option${o.in_paper_group === p ? ' selected' : ''}>${esc(p)}</option>`).join('') +
      '</select>', 'ord-detail-select-frame') + '</section>' +
    `<section class="ord-detail-step">${commonHead(4, mode === 'book' ? '제본 및 후가공' : '후가공', Boolean(o.in_lastJob4 || (mode === 'book' && o.goods_jebon)))}` +
      framedControl(`<select class="ord-detail-select${o.in_lastJob4 || (mode === 'book' && o.goods_jebon) ? ' is-complete' : ''}" ` +
      `data-key="${mode === 'book' ? 'goods_jebon' : 'in_lastJob4'}"><option value="">후가공 선택</option>` +
      finish.map((p) => `<option${(mode === 'book' ? o.goods_jebon : o.in_lastJob4) === p ? ' selected' : ''}>${esc(p)}</option>`).join('') +
      '</select>', 'ord-detail-select-frame') + '</section>' +
    '<section class="ord-detail-step is-submit"><label for="opt-goods_memo">추가 요청</label>' +
      `<textarea id="opt-goods_memo" data-key="goods_memo" placeholder="요청 사항을 입력하세요.">${esc(o.goods_memo)}</textarea>` +
      '<button type="button" class="ord-submit" id="ordSubmit">견적 문의하기</button></section>';
}

function totalPages(o) {
  return (+o.in_page_val || 0) + (o.use_in2 ? (+o.in2_page_val || 0) : 0);
}

function paintUploads() {
  common.querySelectorAll('[data-slot-state]').forEach((el) => {
    const slot = el.getAttribute('data-slot-state');
    const f = state.files[slot];
    el.textContent = f ? f.label : '파일 선택 혹은 드래그(.pdf/.png/.jpeg)';
    el.classList.toggle('is-set', Boolean(f) && !f.busy);
    el.classList.toggle('is-busy', Boolean(f && f.busy));
    const label = el.closest('.ord-common-upload');
    if (label) label.classList.toggle('is-complete', Boolean(f) && !f.busy);
  });
  paintCommonCompletion();
}

function markUpload(slot, label, busy) {
  state.files[slot] = { label, busy: Boolean(busy) };
  paintUploads();
}

/* ---------------- defaults ---------------- */

function parseDim(str) {
  const m = String(str || '').match(/(\d+)\s*[*×xX]\s*(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : { w: 210, h: 297 };
}

function seedDefaults(mode) {
  const o = { customer_name: '', quick_no: '', goods_memo: '' };

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
  if (o.in_printer === '칼라 4도') o.in_printer = '컬러 4도';
  o.goods_ea = 0;
  o.in_mun_values = '';
  o.in_printer = '';
  o.in_lastJob4 = '';
  if (mode === 'book') {
    o.goods_jebon = '';
    o.in_page_val = 0;
  }
  if (mode === 'product') o.product_kind = '명함';
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
    bind = (BIND_RATE[o.goods_jebon] || 0) * qty;
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
  const paperLabel = `${o.in_paper_group || ''} ${o.in_paper || ''}`;
  const gsm = parseInt((paperLabel.match(/(\d+)\s*g/i) || [0, 160])[1], 10) || 160;
  const previewMode = state.mode === 'product'
    ? (o.product_kind === '소책자' ? 'book' : o.product_kind === '리플렛' ? 'leaflet' : 'print')
    : state.mode;
  return {
    mode: previewMode,
    w: Math.max(1, +o.goods_size_w || 210),
    h: Math.max(1, +o.goods_size_h || 297),
    sides: o.in_mun_values === '양면출력' ? '양면' : '단면',
    coverSides: o.cover_mun_values === '양면출력' ? '양면' : '단면',
    coating: coatOf(o.in_lastJob4),
    coverCoating: coatOf(o.cover_lastJob4),
    paper: paperLabel,
    coverPaper: `${o.cover_paper_group || ''} ${o.cover_paper || ''}`,
    gsm,
    /* These normalized print-production values are intentionally part of D:
       future left-hand controls can set them without changing the renderer's
       model API. */
    paperThicknessMm: Math.max(0.07, +(o.paper_thickness_mm || gsm * 0.00105)),
    inkCoverage: Math.max(0, Math.min(1, +(o.ink_coverage || 0.72))),
    opacity: Math.max(0.55, Math.min(1, +(o.paper_opacity || 0.94))),
    finish: o.in_lastJob4 || '',
    foil: o.in_foil || '',
    embossDepthMm: +(o.in_emboss_depth || 0),
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

  const file = state.files[MODES[state.mode].uploads[0].slot];
  const side = o.in_mun_values ? o.in_mun_values.replace('출력', '') : '인쇄 방식 미선택';
  const color = o.in_printer || '색상 미선택';
  const summary = document.getElementById('ordPreviewSummary');
  if (summary) {
    const untouched = !file && !state.pickedSize && !o.in_mun_values && !o.in_printer;
    summary.textContent = untouched
      ? '“업로드 파일 이름", 설정 크기, 단면/양면, 인쇄 기본 정보 등'
      : `“${file ? file.label : '업로드 파일 이름'}”, ${D.w}×${D.h}mm, ${side}, ${color}`;
  }

  const primary = MODES[state.mode].uploads[0].slot;
  const hasArtwork = Boolean(state.images[primary]);
  preview.classList.toggle('has-artwork', hasArtwork);
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

  /* the 사용자입력 boxes drive both size rows at once, the way a preset does */
  if (key === 'custom_w' || key === 'custom_h') {
    const mm = Math.max(1, parseInt(value, 10) || 1);
    if (key === 'custom_w') { state.opts.goods_size_w = mm; state.opts.size_w_plus = mm; }
    else { state.opts.goods_size_h = mm; state.opts.size_h_plus = mm; }
    form.querySelectorAll('[data-key="goods_size_w"], [data-key="size_w_plus"]')
      .forEach((el) => { el.value = state.opts.goods_size_w; });
    form.querySelectorAll('[data-key="goods_size_h"], [data-key="size_h_plus"]')
      .forEach((el) => { el.value = state.opts.goods_size_h; });
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
      /* keep the 사용자입력 boxes in step when the size is typed further down */
      const twin = form.querySelector(`[data-key="custom_${key === 'goods_size_w' ? 'w' : 'h'}"]`);
      if (twin) twin.value = state.opts[key];
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

function paintCommonCompletion() {
  const done = commonDone();
  ['files', 'size', 'order'].forEach((key, index) => {
    const head = common.querySelector(`[data-common-step="${key}"] .ord-common-head`);
    if (!head) return;
    head.classList.toggle('is-complete', done[key]);
    const no = head.querySelector('span');
    if (no) no.textContent = done[key] ? '✓' : String(index + 1);
  });
  common.querySelectorAll('[data-common-key="customer_name"], [data-common-key="goods_ea"], [data-common-key="in_page_val"]')
    .forEach((el) => {
      const filled = el.dataset.commonKey === 'customer_name'
        ? Boolean(el.value.trim())
        : (parseInt(el.value, 10) || 0) > 0;
      el.classList.toggle('is-complete', filled);
    });
}

function paintDetailCompletion() {
  const checks = [
    Boolean(state.opts.in_mun_values),
    Boolean(state.opts.in_printer),
    Boolean(state.opts.in_paper_group),
    Boolean(state.mode === 'book' ? state.opts.goods_jebon : state.opts.in_lastJob4),
  ];
  form.querySelectorAll('.ord-detail-step').forEach((step, index) => {
    if (index >= checks.length) return;
    const head = step.querySelector('.ord-common-head');
    if (!head) return;
    head.classList.toggle('is-complete', checks[index]);
    const no = head.querySelector('span');
    if (no) no.textContent = checks[index] ? '✓' : String(index + 1);
  });
  form.querySelectorAll('.ord-detail-select').forEach((select) =>
    select.classList.toggle('is-complete', Boolean(select.value)));
}

common.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-upload]')) {
    const file = el.files && el.files[0];
    if (file) takeFile(file, el.getAttribute('data-upload'));
  }
});

common.addEventListener('input', (e) => {
  const el = e.target;
  const key = el.getAttribute('data-common-key');
  if (!key) return;
  if (key === 'customer_name' || key === 'goods_ea' || key === 'in_page_val') {
    state.opts[key] = el.value;
    paintCommonCompletion();
    onOptionChange();
    return;
  }
  if (key === 'custom_w' || key === 'custom_h') {
    const mm = Math.max(1, parseInt(el.value, 10) || 1);
    state.pickedSize = 'custom';
    if (key === 'custom_w') state.opts.goods_size_w = state.opts.size_w_plus = mm;
    else state.opts.goods_size_h = state.opts.size_h_plus = mm;
    state.opts.goods_size = `사용자입력(${state.opts.goods_size_w}*${state.opts.goods_size_h})`;
    common.querySelectorAll('.ord-format').forEach((b) =>
      b.classList.toggle('is-on', b.dataset.format === 'custom'));
    paintCommonCompletion();
    onOptionChange();
  }
});

function formatDimensionText(format) {
  if (format.dataset.format === 'custom') {
    return `${state.opts.goods_size_w}×${state.opts.goods_size_h}`;
  }
  return `${format.dataset.w}×${format.dataset.h}`;
}

function restoreFormatDimension(set) {
  const output = set && set.querySelector('[data-format-dim]');
  if (!output) return;
  const picked = set.querySelector(`.ord-format[data-format="${state.pickedSize}"]`);
  output.textContent = picked ? formatDimensionText(picked) : '000×000';
  set.querySelector('.ord-format-hover')?.classList.remove('is-visible');
}

function previewFormatDimension(format) {
  const set = format.closest('.ord-format-set');
  const output = set?.querySelector('[data-format-dim]');
  if (output) output.textContent = formatDimensionText(format);
  const hover = set?.querySelector('.ord-format-hover');
  if (!hover) return;
  hover.style.left = `${format.offsetLeft}px`;
  hover.style.top = `${format.offsetTop}px`;
  hover.style.width = `${format.offsetWidth}px`;
  hover.style.height = `${format.offsetHeight}px`;
  hover.querySelector('span').textContent = format.dataset.format;
  hover.classList.add('is-visible');
}

common.addEventListener('pointerover', (e) => {
  const format = e.target.closest('[data-format]');
  if (!format || format.contains(e.relatedTarget)) return;
  previewFormatDimension(format);
});

common.addEventListener('pointerout', (e) => {
  const format = e.target.closest('[data-format]');
  if (!format || format.contains(e.relatedTarget)) return;
  restoreFormatDimension(format.closest('.ord-format-set'));
});

common.addEventListener('focusin', (e) => {
  const format = e.target.closest('[data-format]');
  if (format) previewFormatDimension(format);
});

common.addEventListener('focusout', (e) => {
  const format = e.target.closest('[data-format]');
  if (format) restoreFormatDimension(format.closest('.ord-format-set'));
});

common.addEventListener('click', (e) => {
  const format = e.target.closest('[data-format]');
  if (format) {
    state.pickedSize = format.dataset.format;
    if (state.pickedSize !== 'custom') {
      const f = SERVICE_FORMATS.find((x) => x.name === state.pickedSize);
      state.opts.goods_size = `${f.name}(${f.w}*${f.h})`;
      state.opts.goods_size_w = state.opts.size_w_plus = f.w;
      state.opts.goods_size_h = state.opts.size_h_plus = f.h;
    }
    renderCommon(state.mode);
    onOptionChange();
    return;
  }

  const schedule = e.target.closest('[data-common-value]');
  if (schedule) {
    state.opts.quick_no = schedule.dataset.commonValue;
    common.querySelectorAll('[data-common-value]').forEach((b) => {
      const selected = b === schedule;
      b.classList.toggle('is-on', selected);
      const frame = b.closest('.ord-field-frame');
      if (frame) frame.classList.toggle('is-complete', selected);
    });
    paintCommonCompletion();
    onOptionChange();
    return;
  }

  if (e.target.closest('#ordNext')) {
    state.detailActive = true;
    detailPane.classList.add('is-active');
    form.scrollTo({ top: 0, behavior: 'smooth' });
    detailPane.focus({ preventScroll: true });
  }
});

form.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-upload]')) {
    const file = el.files && el.files[0];
    if (file) takeFile(file, el.getAttribute('data-upload'));
    return;
  }
  if (el.matches('[data-key]')) setOpt(el.getAttribute('data-key'), el.value);
  paintDetailCompletion();
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
    paintDetailCompletion();
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
    btn2.textContent = `문의 준비 완료 — 추정 ${won(estimate().total)}`;
    btn2.classList.add('is-done');
    setTimeout(() => {
      btn2.textContent = '견적 문의하기';
      btn2.classList.remove('is-done');
    }, 3200);
  }
});

/* ---------------- artwork ---------------- */

/* the model wants a decoded image, so whatever comes in is turned into one */
function takeFile(file, slot) {
  if (!file) return;
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    takePdf(file, slot);
    return;
  }
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      landArtwork(slot, img, file.name);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function landArtwork(slot, img, label) {
  state.images[slot] = img;
  markUpload(slot, label);
  paintCaption();
  if (engine) engine.setTexture(slot, img);
}

/* pdf.js is pulled in only when a PDF is actually handed over */
let pdfjs = null;
function loadPdfJs() {
  if (!pdfjs) {
    const base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/';
    pdfjs = import(/* @vite-ignore */ `${base}pdf.min.mjs`).then((m) => {
      m.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
      return m;
    });
  }
  return pdfjs;
}

async function renderPdfPage(doc, number) {
  const page = await doc.getPage(number);
  const raw = page.getViewport({ scale: 1 });
  const view = page.getViewport({ scale: 2400 / Math.max(raw.width, raw.height) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(view.width);
  canvas.height = Math.round(view.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: view }).promise;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
}

/* A PDF says how many pages it has, so 내지 no longer has to be counted by
   hand. A two-page flat PDF also maps page 2 to the reverse side, matching
   the way a print-ready duplex file is actually supplied. */
async function takePdf(file, slot) {
  markUpload(slot, `${file.name} · 읽는 중…`, true);
  try {
    const lib = await loadPdfJs();
    const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const img = await renderPdfPage(doc, 1);
    const isInner = slot === 'inner' && state.mode === 'book';
    landArtwork(slot, img, `${file.name} · ${doc.numPages}p`);
    if (isInner) setInnerPages(doc.numPages);

    if (slot === 'front' && doc.numPages > 1) {
      const back = await renderPdfPage(doc, 2);
      state.images.back = back;
      if (engine) engine.setTexture('back', back);
    }
  } catch (err) {
    markUpload(slot, `${file.name} · 읽지 못했습니다`);
    console.error('[order] PDF read failed:', err);
  }
}

/* the 페이지 field only takes even counts within its own range */
function setInnerPages(n) {
  const row = MODES.book.steps
    .find((s) => s.t === 'part' && s.part === 'in')
    .rows.find((r) => r.key === 'in_page_val');
  const even = n % 2 ? n + 1 : n;
  state.opts.in_page_val = Math.min(row.max, Math.max(row.min, even));
  renderForm(state.mode);
  refreshDynamic();
  paintCaption();
  if (engine) engine.update(derive());
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

productKinds.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-kind]');
  if (!btn || state.mode !== 'product') return;
  state.opts.product_kind = btn.dataset.kind;
  productKinds.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('is-on', b === btn));
  paintCaption();
  if (engine) engine.update(derive());
});

function switchMode(mode) {
  if (!MODES[mode]) return;
  state.mode = mode;
  state.images = {};                 // artwork is per product
  state.files = {};
  state.pickedSize = '';
  state.detailActive = false;
  state.opts = seedDefaults(mode);
  const meta = SERVICE_MODES[mode];
  commonPane.dataset.mode = mode;
  document.body.style.setProperty('--ord-ink', meta.ink);
  commonPane.style.setProperty('--ord-ink', meta.ink);
  detailPane.style.setProperty('--ord-ink', meta.ink);
  detailPane.classList.remove('is-active');
  tabs.querySelectorAll('.ord-tab').forEach((b) => b.classList.toggle('is-on', b.dataset.mode === mode));
  productKinds.classList.toggle('is-visible', mode === 'product');
  productKinds.querySelectorAll('[data-kind]').forEach((b) =>
    b.classList.toggle('is-on', b.dataset.kind === state.opts.product_kind));
  renderCommon(mode);
  renderForm(mode);
  refreshDynamic();
  paintCaption();
  if (engine) engine.rebuild(derive(), state.images);
  common.scrollTop = 0;
  form.scrollTop = 0;
}

/* ---------------- 3D stage ----------------
   three.js is pulled in once, here, and only on this page. Until it lands
   the form is already usable; if it never lands the page says so rather
   than leaving an empty right half. */

/* not plain `stage` — script.js loads first on this page and already owns
   that global name; a duplicate top-level const would kill this whole file */
const ordStage = document.getElementById('ordStage');
const stageNote = document.getElementById('ordStageNote');
let engine = null;

switchMode('poster');

createEngine(ordStage).then((eng) => {
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

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  /* The preview is framed like a print inspection table, not a product-shot
     set. Keep physical lighting on the materials but do not project a drop
     shadow onto the white Figma canvas. */
  renderer.shadowMap.enabled = false;
  /* filmic response: the highlights on coated stock roll off instead of
     clipping to flat white, which is most of what makes paper look shot
     rather than drawn */
  /* Khronos PBR Neutral, not ACES. This is a preview of what someone is
     about to have printed, so the artwork has to come back the colour it
     went in — ACES rolls saturated ink off towards grey. Neutral keeps the
     albedo and only compresses the highlights, which is exactly the trade
     a product viewer wants. */
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.domElement.className = 'ord-canvas';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
  const fitCenter = new THREE.Vector3();
  let fitDist = 6;

  /* A sheet or a book stands up and is read from a low three-quarter on the
     left, which is where its spine and fold are. A card lies down, so it has
     to be looked at from above or it disappears edge-on. */
  const viewDir = (mode) => (mode === 'print'
    ? new THREE.Vector3(-0.3, 0.9, 0.85).normalize()
    : new THREE.Vector3(-0.38, 0.32, 1).normalize());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.52;

  /* The environment IS the light, the way a paper product is actually shot:
     a big soft source overhead falling off to a darker floor. That gradient
     puts tone across a white sheet; a low-opacity shadow catcher supplies
     the remaining contact cue without tinting the Figma-white preview. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = (() => {
    /* an equirectangular map has to be 2:1 — at any other aspect the
       projection folds in on itself and PMREM hands back a black room */
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    /* a white room, not a dark one: the softbox overhead, white walls at the
       horizon, a bounce floor below. The spread top to bottom is small — it
       only has to be enough to tell one face of a sheet from another */
    grd.addColorStop(0, '#ffffff');      // softbox
    grd.addColorStop(0.4, '#faf9f6');
    grd.addColorStop(0.52, '#e1ded7');   // horizon
    grd.addColorStop(0.82, '#aaa59b');
    grd.addColorStop(1, '#817c72');      // bounce floor
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return pmrem.fromEquirectangular(t).texture;
  })();

  /* the key only sets which way the highlight runs; the environment carries
     the exposure, so it stays gentle */
  const key = new THREE.DirectionalLight(0xfffdf8, 1.75);
  key.position.set(-3.5, 9, 6.5);
  scene.add(key);

  /* and the rim draws the bright line down every edge that used to be told
     by the drop shadow */
  const rim = new THREE.DirectionalLight(0xf4f7ff, 0.9);
  rim.position.set(2, 3, -6);
  scene.add(rim);

  const fill = new THREE.HemisphereLight(0xffffff, 0x8e887e, 0.48);
  scene.add(fill);

  let root = new THREE.Group();
  scene.add(root);
  let flexibleSheet = null;
  const flexDynamics = {
    displacement: 0, velocity: 0, motion: 0, phase: 0,
    lastTime: 0, normalFrame: 0, lastView: new THREE.Vector3(),
  };

  /* ---- textures ---- */

  const texCache = {};

  /* an unfilled face reads as blank stock with its name on it — the same
     grey the flat preview used, so nothing jumps when the model appears */
  function placeholder(label) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1448;
    const g = c.getContext('2d');
    /* not paper-white but stock-white: leaving headroom above the albedo is
       what lets the lighting model the sheet instead of clipping it */
    g.fillStyle = '#f1eee7';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#bbb7af';
    g.lineWidth = 6;
    g.strokeRect(28, 28, c.width - 56, c.height - 56);
    g.fillStyle = '#969189';
    g.font = '52px "IBM Plex Mono", monospace';
    g.textAlign = 'center';
    g.fillText(label || '', c.width / 2, c.height / 2 + 12);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function fromImage(img) {
    /* Print on white stock: transparent pixels are paper, not black texels.
       Cap the GPU texture at 4096px while retaining the supplied aspect. */
    const max = 4096;
    const scale = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    c.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
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

  /* ---- the surface of paper ----
     Flat colour reads as plastic. Real stock has a tooth that catches the
     key at grazing angles and a slightly uneven finish, so both are drawn
     once here and tiled over everything. */

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  /* fibre tooth, as a normal map: high-frequency, very shallow */
  const fibreMap = (() => {
    const n = 512;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const g = c.getContext('2d');
    const img = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const d = (Math.random() - 0.5) * 34;
      img.data[i * 4] = 128 + d;                       // x slope
      img.data[i * 4 + 1] = 128 + (Math.random() - 0.5) * 34;
      img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 9);
    t.anisotropy = maxAniso;
    return t;
  })();

  /* a low-frequency wash so the finish is never perfectly even */
  const finishMap = (() => {
    const n = 256;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 90; i++) {
      const r = 20 + Math.random() * 70;
      const v = Math.round(118 + Math.random() * 26);
      const blob = g.createRadialGradient(
        Math.random() * n, Math.random() * n, 0,
        Math.random() * n, Math.random() * n, r);
      blob.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
      blob.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = blob;
      g.fillRect(0, 0, n, n);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  })();

  /* the fore edge of a book is a stack of individual sheets, not a slab */
  const edgeStripes = (() => {
    const w = 256;
    const h = 8;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#f6f0e2';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = `rgba(176,164,140,${0.18 + Math.random() * 0.3})`;
      g.fillRect(x, 0, 1, h);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAniso;
    return t;
  })();

  /* ---- materials ---- */

  /* Coating is the whole difference between a matt and a glossy sheet, and
     uncoated stock (모조·반누보·레자크…) never gets a sheen at all. On top of
     that every sheet carries the fibre tooth and the uneven finish, which is
     what keeps a grazing highlight from looking like a plastic card. */
  function paperMat(coating, paperName, map) {
    const uncoated = /모조|미색|반누보|레자크|색지|크라프트|마쉬멜로우/.test(paperName || '');
    const gloss = coating === '유광';
    const matt = coating === '무광';
    const m = new THREE.MeshPhysicalMaterial({
      map: map || null,
      color: map ? 0xffffff : 0xf1eee7,
      roughness: gloss ? 0.13 : matt ? 0.44 : (uncoated ? 0.9 : 0.7),
      roughnessMap: finishMap,
      normalMap: fibreMap,
      normalScale: new THREE.Vector2(
        uncoated && !gloss ? 0.16 : 0.07,
        uncoated && !gloss ? 0.16 : 0.07),
      metalness: 0,
      ior: 1.47,
      anisotropy: uncoated && !gloss ? 0.22 : 0.06,
      anisotropyRotation: Math.PI / 2,
      clearcoat: gloss ? 1 : matt ? 0.28 : 0,
      clearcoatRoughness: gloss ? 0.08 : 0.4,
      /* uncoated stock scatters at the surface — that soft off-angle glow is
         sheen, not specular */
      sheen: uncoated && !gloss ? 0.5 : 0.15,
      sheenRoughness: 0.85,
      sheenColor: new THREE.Color(0xfff8ec),
      envMapIntensity: gloss ? 1.15 : 0.95,
      specularIntensity: gloss ? 1 : (uncoated ? 0.32 : 0.55),
      specularColor: new THREE.Color(uncoated ? 0xfff4df : 0xffffff),
      clearcoatNormalMap: gloss || matt ? fibreMap : null,
      clearcoatNormalScale: new THREE.Vector2(0.025, 0.025),
    });
    if (map) map.anisotropy = maxAniso;
    return m;
  }

  /* the cut edge is what makes a sheet look like paper and not a plane */
  const cutEdge = () => new THREE.MeshStandardMaterial({
    color: 0xe8e1d2, roughness: 0.94, roughnessMap: finishMap,
  });

  const pageBlock = () => new THREE.MeshStandardMaterial({
    color: 0xf4eddd, roughness: 0.95, roughnessMap: finishMap,
  });

  /* the fore edge and the head and tail of a book, ruled into sheets. The
     stripes have to run across the stack, which is a different axis on the
     side faces than on the top, so each gets its own turn of the map. */
  function stackedEdge(sheets, turn) {
    const t = cloneTex(edgeStripes);
    t.center.set(0.5, 0.5);
    t.rotation = turn ? Math.PI / 2 : 0;
    t.repeat.set(turn ? 1 : Math.max(1, sheets / 26), turn ? Math.max(1, sheets / 26) : 1);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.93 });
  }

  /* ---- helpers ---- */

  function clear() {
    flexibleSheet = null;
    flexDynamics.displacement = 0;
    flexDynamics.velocity = 0;
    flexDynamics.motion = 0;
    flexDynamics.phase = 0;
    flexDynamics.lastTime = 0;
    flexDynamics.normalFrame = 0;
    flexDynamics.lastView.set(0, 0, 0);
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

  /* One artwork has to run unbroken across the panels of a folded sheet, so
     each panel shows only its own vertical slice of it. Done on the texture
     rather than on the mesh's UVs — a bowed panel is subdivided, and walking
     its vertices by index would depend on how many segments it happens to
     have. */
  function slice(tex, i, panels) {
    const t = cloneTex(tex);
    if (!t) return null;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(1 / panels, 1);
    t.offset.set(i / panels, 0);
    return t;
  }

  /* No sheet of paper is dead flat. Bowing it very slightly across its width
     is the single thing that stops a print reading as a rectangle of colour:
     the curve walks a highlight across the face as the model turns. */
  function bow(geo, depth) {
    const p = geo.attributes.position;
    const half = geo.parameters.width / 2;
    for (let i = 0; i < p.count; i++) {
      const k = p.getX(i) / half;                 // -1 .. 1
      p.setZ(i, p.getZ(i) + depth * (1 - k * k));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  function sheet(w, h, t, frontMat, backMat, curve, flexible) {
    const geo = new THREE.BoxGeometry(
      w, h, t, curve ? 40 : 1, flexible ? 28 : 1, 1);
    if (curve) bow(geo, curve);
    const edge = cutEdge();
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, frontMat, backMat]);
    if (flexible) {
      flexibleSheet = {
        mesh,
        base: Float32Array.from(geo.attributes.position.array),
        width: w,
        height: h,
      };
    }
    return mesh;
  }

  /* ---- the four products ---- */

  /* Poster and leaflet are the same object; only the 접지 differs. Standing
     upright is how you would hold a sheet up to look at it. */
  function buildSheet(D) {
    const s = unit(D);
    const w = D.w * s;
    const h = D.h * s;
    /* True caliper, with only a small visibility floor for a one-sheet edge. */
    const t = Math.max(0.0045, D.paperThicknessMm * s * 2.4);
    const panels = Math.max(1, D.panels);

    const front = texFor('front', '앞면');
    const back = D.sides === '양면' ? texFor('back', '뒷면') : null;

    if (panels === 1) {
      const m = sheet(w, h, t, paperMat(D.coating, D.paper, front),
        paperMat(D.coating, D.paper, back), w * 0.016, D.mode === 'poster');
      m.position.y = h / 2;
      m.rotation.x = -0.03;                 // a sheet never stands plumb
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
      const geo = new THREE.BoxGeometry(pw, h, t, 20, 1, 1);
      /* each panel keeps a little of its own bow, so the fold is not a hinge
         between two perfectly flat cards */
      bow(geo, pw * 0.012);
      const edge = cutEdge();
      const panel = new THREE.Mesh(geo, [edge, edge, edge, edge,
        paperMat(D.coating, D.paper, slice(front, i, panels)),
        paperMat(D.coating, D.paper, slice(back, i, panels))]);
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
    const t = Math.max(0.009, D.paperThicknessMm * s * 2.8);

    const face = sheet(w, h, t, paperMat(D.coating, D.paper, texFor('front', '앞면')),
      paperMat(D.coating, D.paper, null), w * 0.006);
    face.rotation.x = -Math.PI / 2;
    face.position.set(0, t / 2, 0);

    if (D.sides !== '양면') {
      face.rotation.z = 0.12;
      root.add(face);
      return;
    }

    const g = new THREE.Group();
    face.position.x = -w * 0.56;
    face.rotation.z = 0.04;
    g.add(face);

    const flip = sheet(w, h, t, paperMat(D.coating, D.paper, texFor('back', '뒷면')),
      paperMat(D.coating, D.paper, null), w * 0.006);
    flip.rotation.x = -Math.PI / 2;
    flip.rotation.z = -0.05;                 // cards never land square to each other
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

    /* The pages, inset a hair so the cover overhangs like a real trim, and
       ruled on every exposed side so the stack reads as sheets. */
    const leaves = Math.max(2, D.pages / 2);
    const blockEdge = [
      stackedEdge(leaves, false),   // +x fore edge
      stackedEdge(leaves, false),   // -x spine side
      stackedEdge(leaves, true),    // +y head
      stackedEdge(leaves, true),    // -y tail
      pageBlock(), pageBlock(),     // hidden under the covers
    ];
    const block = new THREE.Mesh(new THREE.BoxGeometry(w * 0.985, h * 0.985, d), blockEdge);
    g.add(block);

    /* a bound cover lifts a little off the block towards the fore edge —
       that curve is the only thing that puts a gradient across it */
    const front = sheet(w, h, cover, coverMat('cover', '표지'), pageBlock(), w * 0.014);
    front.position.z = d / 2 + cover / 2;
    g.add(front);

    const back = sheet(w, h, cover, pageBlock(), coverMat('coverBack', '뒷표지'));
    back.position.z = -(d / 2 + cover / 2);
    g.add(back);

    if (D.bind === '링(스프링)제본') {
      const ringMat = new THREE.MeshPhysicalMaterial({
        color: D.ringColor, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2,
      });
      /* Twin loop wire, measured the way it is made: the wire runs through a
         hole about 5㎜ in from the spine and closes around the outside of the
         edge, so each loop lies FLAT — its plane horizontal, seen from the
         front as a short bar crossing the edge — and the loops stack up the
         height at a 8.5㎜ pitch. */
      const holeIn = 5 * s;
      const wire = Math.max(0.006, 0.55 * s);
      const r = Math.max(holeIn, d / 2 + cover) + 1.2 * s;
      const count = Math.max(6, Math.round(D.h / 8.5));
      for (let i = 0; i < count; i++) {
        const loop = new THREE.Mesh(new THREE.TorusGeometry(r, wire, 12, 40), ringMat);
        loop.position.set(-w / 2 + holeIn, -h / 2 + ((i + 0.5) / count) * h, 0);
        loop.rotation.x = Math.PI / 2;      // lay the loop down, axis vertical
        g.add(loop);
      }

    } else if (D.bind !== '제본 없음') {
      /* 무선·PUR·사철 wrap the cover around the back. A bound spine is not a
         flat plate — it bellies out, so it is a half round. 중철 folds and
         staples instead. */
      if (D.bind === '중철제본_세로형') {
        const fold = new THREE.Mesh(
          new THREE.CylinderGeometry(d / 2 + cover, d / 2 + cover, h, 20, 1, true,
            Math.PI / 2, Math.PI),
          pageBlock());
        fold.position.x = -w / 2;
        g.add(fold);

        const steel = new THREE.MeshPhysicalMaterial({
          color: 0x9aa0a6, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.2,
        });
        [-h * 0.22, h * 0.22].forEach((y) => {
          const st = new THREE.Mesh(
            new THREE.BoxGeometry(cover * 1.8, h * 0.075, (d + cover) * 0.55), steel);
          st.position.set(-(w / 2 + cover * 0.4), y, 0);
          g.add(st);
        });

      } else {
        const spine = new THREE.Mesh(
          new THREE.CylinderGeometry(d / 2 + cover, d / 2 + cover, h, 24, 1, true,
            Math.PI / 2, Math.PI),
          coverMat('cover', '표지'));
        spine.position.x = -w / 2;
        g.add(spine);

        if (D.bind === '사철제본') {
          /* 사철은 대장을 실로 꿰므로 책등에 땀이 줄지어 남는다 */
          const thread = new THREE.MeshStandardMaterial({
            color: 0xb2a68d, roughness: 0.8,
          });
          const stitches = Math.max(4, Math.round(D.h / 28));
          for (let i = 0; i < stitches; i++) {
            const st = new THREE.Mesh(
              new THREE.TorusGeometry(d / 2 + cover * 1.4, Math.max(0.0022, 0.28 * s),
                8, 24, Math.PI * 0.86),
              thread);
            st.position.set(-w / 2, -h / 2 + ((i + 0.5) / stitches) * h, 0);
            st.rotation.y = Math.PI / 2;
            st.rotation.z = Math.PI / 2;
            g.add(st);
          }
        }
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
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;
    });
    /* The stock itself is part of the preview, not merely a carrier for an
       uploaded texture. Keep the physical object visible from the first
       frame so size, thickness, paper finish and binding changes can be read
       before artwork exists; an upload only replaces the placeholder face. */
    root.visible = true;
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
      sphere.radius / Math.sin(hFov / 2)) * 1.08;
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

  /* A poster is not a rigid card. OrbitControls turns the camera, but to the
     person dragging it that is equivalent to turning the sheet in their
     hand. Camera angular velocity therefore drives a damped spring in the
     paper surface. The motion persists briefly after release, then settles
     back onto the original gentle bow. */
  function animateFlexibleSheet(now) {
    if (!flexibleSheet) return;
    const D = flexDynamics;
    const view = camera.position.clone().sub(controls.target).normalize();
    if (!D.lastTime || D.lastView.lengthSq() === 0) {
      D.lastTime = now;
      D.lastView.copy(view);
      return;
    }

    const dt = Math.min(0.034, Math.max(0.001, (now - D.lastTime) / 1000));
    const yaw = D.lastView.x * view.z - D.lastView.z * view.x;
    const pitch = (view.y - D.lastView.y) * 0.55;
    const angularSpeed = THREE.MathUtils.clamp((yaw + pitch) / dt, -3, 3);
    const speedAbs = Math.abs(angularSpeed);

    D.velocity += (angularSpeed * 1.15 - D.displacement * 30 - D.velocity * 7.2) * dt;
    D.displacement = THREE.MathUtils.clamp(
      D.displacement + D.velocity * dt, -0.085, 0.085);
    D.motion = Math.max(D.motion * Math.exp(-5.2 * dt), Math.min(0.036, speedAbs * 0.014));
    D.phase += dt * (6.5 + D.motion * 95);
    D.lastTime = now;
    D.lastView.copy(view);

    const geo = flexibleSheet.mesh.geometry;
    const pos = geo.attributes.position;
    const base = flexibleSheet.base;
    const halfW = flexibleSheet.width / 2;
    const h = flexibleSheet.height;
    for (let i = 0; i < pos.count; i++) {
      const n = i * 3;
      const xn = base[n] / halfW;
      const yn = base[n + 1] / h + 0.5;
      const freeEdge = 0.18 + 0.82 * Math.pow(Math.abs(xn), 1.35);
      const primary = Math.sin(yn * Math.PI * 1.55 + D.phase + xn * 0.8);
      const ripple = Math.sin(yn * Math.PI * 3.1 - D.phase * 1.4 + xn * 1.7);
      pos.array[n + 2] = base[n + 2] +
        D.displacement * freeEdge * primary + D.motion * freeEdge * ripple;
    }
    pos.needsUpdate = true;
    if ((D.normalFrame++ & 1) === 0) geo.computeVertexNormals();
  }

  function frame(now) {
    if (!running) return;
    controls.update();
    animateFlexibleSheet(now || performance.now());
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  /* the stage lives inside the scaled 1920 frame, so the drawing buffer is
     sized by the frame's own px and then multiplied by the page scale —
     otherwise the canvas softens as the window grows */
  function resize() {
    /* if the stage ever measures degenerate — a stale stylesheet, a hidden
       tab — fall back to its design size rather than shrinking the canvas */
    let w = mount.clientWidth;
    let h = mount.clientHeight;
    if (w < 80 || h < 80) { w = 900; h = 726; }
    const scale = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * scale, 4));
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
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;
      });
      root.visible = true;
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
