/* ==========================================================================
   Order 페이지 — 옵션 구성 + 실시간 3D 프리뷰
   --------------------------------------------------------------------------
   좌: 태산인디고(t-print.co.kr) POD 주문 플로우를 그대로 옮긴 단계별 폼
   우: Three.js 파라메트릭 3D. 업로드한 이미지가 즉시 텍스처로 반영되고,
       옵션(판형·접지·제본·코팅…)이 지오메트리/재질에 실시간 반영된다.

   플로우 출처 — 태산인디고 POD_goods.php 각 상품 페이지:
     Poster  : cate 26020200 / goods 83  · 포스터
     Book    : cate 26010100 / goods 73  · 인디고 책자인쇄
     Leaflet : cate 26030200 / goods 121 · 일반 전단 리플렛
     Print   : cate 26070100 / goods 114 · 명함
   단계 순서(규격 → 기본정보 → 인쇄/용지/후가공 → 주문메모 → 견적)와 각
   셀렉트의 선택지·플레이스홀더 문구를 원본 그대로 유지한다. 필드 key는
   원본 폼의 name(goods_size, in_paper_group, in_lastJob4 …)을 그대로 쓴다.

   Three.js는 Order에 처음 들어올 때만 동적 import한다(다른 페이지 부하 0).
   활성/비활성은 body의 switch-state-position-2 클래스를 관찰해 판단하고,
   비활성일 때는 렌더 루프를 멈춘다.
   ========================================================================== */

/* --- 공통 선택지(원본 셀렉트 그대로) ------------------------------------ */

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

/* 후가공 셀렉트 5종(포스터·리플렛 공통) */
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

/* 표지 코팅은 선택지가 다르다(원본: 코팅없음 포함, 양면 없음) */
const LAST_COAT_COVER = { key: 'lastJob4', ph: '::: 코팅선택 :::',
  options: ['단면무광코팅', '단면유광코팅', '코팅없음'] };

/* --- 모드별 스키마 ------------------------------------------------------- */

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
      /* 페이지 수는 원본에서 기본정보가 아니라 '내지' 파트에 있다 */
      { t: 'basic', qty: [{ key: 'goods_ea', unit: '부', value: 30 }] },
      { t: 'jebon' },
      /* 표지도 원본에는 '표지 사용' 체크박스가 있다(기본 사용) */
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
        /* 원본은 면지인쇄가 '인쇄없음'이면 도수 셀렉트를 감춘다 */
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
      { t: 'size', label: '규격 사이즈 선택', key: 'goods_size', value: '명함(90x50)',
        options: [{ n: '명함(90x50)', w: 90, h: 50 }] },
      { t: 'basic',
        /* 원본 명함은 수량이 100~1000매 셀렉트다(자유 입력이 아님) */
        qtySelect: { key: 'goods_ea', value: '200 매',
          options: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(n => n + ' 매') },
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

/* 사이즈 문자열 "라벨(W*H)"에서 mm 파싱 */
function parseDim(str) {
  const m = String(str || '').match(/(\d+)\s*[*×xX]\s*(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : { w: 210, h: 297 };
}

/* --- 상태 ---------------------------------------------------------------- */

const state = {
  mode: 'poster',
  opts: {},           // 현재 폼 값 (key = 원본 폼 name)
  images: {},         // slot -> HTMLImageElement (업로드된 것)
};

let engine = null;    // 3D 엔진 (lazy)
let active = false;   // Order 면이 현재 정면인가

const form = document.getElementById('orderOptions');
const stage = document.getElementById('orderStage');
const dropHint = document.getElementById('orderDropHint');
const dimLabel = document.getElementById('orderDim');
const resetBtn = document.getElementById('orderResetView');
const subnav = document.querySelector('.subheader-order .subnav');

/* --- 옵션 폼 렌더 -------------------------------------------------------- */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* 셀렉트 한 줄 */
function selectRow(label, key, options, value, placeholder) {
  const opts = [];
  if (placeholder) {
    opts.push('<option value=""' + (value ? '' : ' selected') + '>' + esc(placeholder) + '</option>');
  }
  options.forEach(o => {
    opts.push('<option' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>');
  });
  return '<div class="opt-row">' +
    '<label class="opt-label" for="opt-' + key + '">' + esc(label) + '</label>' +
    '<select class="opt-select" id="opt-' + key + '" data-key="' + key + '">' +
    opts.join('') + '</select></div>';
}

/* 세그먼트(라디오) 한 줄 */
function segRow(label, key, options, value) {
  const items = options.map(o =>
    '<button type="button" class="opt-seg-item' + (o === value ? ' is-on' : '') +
    '" data-key="' + key + '" data-val="' + esc(o) + '">' + esc(o) + '</button>').join('');
  return '<div class="opt-row">' +
    '<span class="opt-label">' + esc(label) + '</span>' +
    '<div class="opt-seg" role="radiogroup" data-key="' + key + '">' + items + '</div></div>';
}

/* 숫자 입력 한 줄 */
function numRow(label, key, value, unit, min, max, step) {
  return '<div class="opt-row">' +
    '<label class="opt-label" for="opt-' + key + '">' + esc(label) + '</label>' +
    '<span class="opt-num"><input type="number" class="opt-input" id="opt-' + key + '" ' +
    'data-key="' + key + '" value="' + value + '" min="' + (min || 1) + '"' +
    (max ? ' max="' + max + '"' : '') + (step ? ' step="' + step + '"' : '') + '>' +
    (unit ? '<span class="opt-unit">' + esc(unit) + '</span>' : '') + '</span></div>';
}

/* 규격 카드 아이콘 — 원본은 판형별 용지 썸네일이다.
   실제 mm 비율대로 그린 모서리 접힌 종이 + 안쪽에 판형 약칭.
   사용자입력은 점선 사각 + Free. */
function sizeIcon(op) {
  const BOX = 40;                                   // 아이콘 최대 변(px)
  if (op.custom) {
    return '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
      '<rect x="8" y="6" width="32" height="36" fill="none" stroke="currentColor" ' +
      'stroke-width="1.4" stroke-dasharray="3 2.5"/>' +
      '<text x="24" y="27" text-anchor="middle" font-size="9" fill="currentColor" ' +
      'font-family="IBM Plex Mono, monospace">Free</text></svg>';
  }
  const s = BOX / Math.max(op.w, op.h);
  const w = Math.round(op.w * s), h = Math.round(op.h * s);
  const x = (48 - w) / 2, y = (48 - h) / 2;
  const fold = Math.min(9, w * 0.32, h * 0.32);     // 접힌 모서리 크기
  const short = op.n.replace(/\s*\(.*$/, '');       // "A4(210*297)" → "A4"
  // 오른쪽 위 모서리가 접힌 종이 실루엣
  const path = 'M' + x + ' ' + y + ' H' + (x + w - fold) + ' L' + (x + w) + ' ' + (y + fold) +
               ' V' + (y + h) + ' H' + x + ' Z';
  const flap = 'M' + (x + w - fold) + ' ' + y + ' V' + (y + fold) + ' H' + (x + w) + ' Z';
  return '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
    '<path d="' + path + '" fill="#fff" stroke="currentColor" stroke-width="1.4" ' +
    'stroke-linejoin="round"/>' +
    '<path d="' + flap + '" fill="none" stroke="currentColor" stroke-width="1.4" ' +
    'stroke-linejoin="round"/>' +
    '<text x="24" y="' + (y + h / 2 + 3.5) + '" text-anchor="middle" ' +
    'font-size="' + (short.length > 2 ? 7.5 : 10) + '" fill="currentColor" ' +
    'font-family="IBM Plex Mono, monospace">' + esc(short) + '</text></svg>';
}

/* 단계 머리글 */
function stepHead(no, title, note) {
  return '<div class="opt-step-head"><span class="opt-step-no">' + no + '</span>' +
    '<span class="opt-step-title">' + esc(title) + '</span></div>' +
    (note ? '<p class="opt-note">' + esc(note) + '</p>' : '');
}

/* 조건부 행 — 원본이 특정 값일 때만 노출하는 셀렉트가 있다 */
function rowVisible(row, o) {
  if (!row.showIf) return true;
  const v = o[row.showIf.key];
  if (row.showIf.not !== undefined) return v !== row.showIf.not;
  if (row.showIf.is !== undefined) return v === row.showIf.is;
  return true;
}

/* 용지 그룹 → 평량 2단 연동 셀렉트 */
function paperRows(p, label, groups, o) {
  const g = o[p + '_paper_group'];
  return selectRow(label, p + '_paper_group', groups, g, '::: 용지선택 :::') +
    '<div class="opt-row opt-row-sub' + (g ? '' : ' is-off') + '">' +
      '<span class="opt-label">평량</span>' +
      '<select class="opt-select" data-key="' + p + '_paper"' + (g ? '' : ' disabled') + '>' +
      (g ? WEIGHTS.map(w => '<option' + (w === o[p + '_paper'] ? ' selected' : '') + '>' + w +
            '</option>').join('')
         : '<option value="">용지를 먼저 선택하세요</option>') +
      '</select></div>';
}

/* 세네카(책등 두께) — 원본은 입력이 아니라 계산 표시값이다 */
function senecaMm(o) {
  const pages = Math.max(0, +o.in_page_val || 0) + (o.use_in2 ? (+o.in2_page_val || 0) : 0);
  const gsm = parseInt(String(o.in_paper || '100'), 10) || 100;
  // 평량 100g ≈ 0.1mm/장 기준, 페이지 수의 절반이 장수
  return Math.max(0.5, Math.round((pages / 2) * (gsm / 1000) * 10) / 10);
}

/* 파트(표지/내지/…) 한 블록 — 단계 번호·제목·소계를 함께 렌더한다 */
function renderPart(step, o, no) {
  const p = step.part;
  const off = step.optional && !o['use_' + p];
  const rows = [];

  (step.rows || []).forEach(r => {
    /* 조건부 행은 DOM에 항상 두고 표시만 토글한다 — 숫자 입력 중 전체
       재렌더로 포커스가 날아가는 것을 피하기 위해서다(refreshDynamic 참조). */
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
      rows.push('<div class="opt-row"><label class="opt-label" for="opt-' + r.key + '">' +
        esc(r.label) + '</label><input type="text" class="opt-input" id="opt-' + r.key + '" ' +
        'data-key="' + r.key + '" value="' + esc(o[r.key] || '') + '" placeholder="' +
        esc(r.placeholder || '') + '"></div>');

    } else if (r.t === 'seneca') {
      rows.push('<div class="opt-row"><span class="opt-label">세네카</span>' +
        '<span class="opt-readout" data-readout="seneca">' + senecaMm(o) + ' ㎜</span></div>');

    } else if (r.t === 'last') {
      r.items.forEach((l, i) => {
        rows.push(selectRow(i === 0 ? '후가공' : '', r.part + '_' + l.key, l.options,
          o[r.part + '_' + l.key], l.ph));
      });

    } else if (r.t === 'notice') {
      rows.push('<p class="opt-notice">! ' + esc(r.text) + '</p>');
    }

    if (r.showIf) {
      const vis = rowVisible(r, o) ? '' : ' is-off';
      const body = rows.splice(before).join('');
      rows.push('<div class="opt-cond' + vis + '" data-cond="' + r.showIf.key +
        '" data-cond-not="' + esc(r.showIf.not || '') + '">' + body + '</div>');
    }
  });

  /* 원본 각 파트 캡션에는 해당 파트의 TOTAL 금액이 붙는다 */
  const sub = off ? 0 : partPrice(p);

  return '<div class="opt-group opt-part' + (off ? ' is-off' : '') + '">' +
    '<div class="opt-part-head">' +
      '<span class="opt-step-no">' + no + '</span>' +
      '<span class="opt-step-title">' + esc(step.title) + '</span>' +
      (off ? '' : '<span class="opt-part-total" data-part-total="' + p + '">TOTAL ' +
        sub.toLocaleString('ko-KR') + '원</span>') +
      (step.optional
        ? '<button type="button" class="opt-toggle' + (off ? '' : ' is-on') +
          '" data-toggle="use_' + p + '">' + (off ? '사용 안 함' : '사용') + '</button>'
        : '') +
    '</div>' + (off ? '' : rows.join('')) + '</div>';
}

/* 스키마의 기본값을 state.opts에 채운다 */
function seedDefaults(mode) {
  const o = {};
  o.customer_name = '';
  o.quick_no = '일반';
  o.goods_memo = '';

  MODES[mode].steps.forEach(s => {
    if (s.t === 'size') {
      o[s.key] = s.value;
      const d = parseDim(s.value);
      o.goods_size_w = d.w; o.goods_size_h = d.h;
      o.size_w_plus = d.w; o.size_h_plus = d.h;
    } else if (s.t === 'basic') {
      (s.qty || []).forEach(q => { o[q.key] = q.value; });
      if (s.qtySelect) o[s.qtySelect.key] = s.qtySelect.value;
      if (s.pages) o[s.pages.key] = s.pages.value;
    } else if (s.t === 'jebon') {
      o.goods_jebon = '무선제본';
      o.goods_jebon_direction = '세로';
      o.goods_opt_ring = '';
      o.goods_opt_pp = '';
    } else if (s.t === 'part') {
      if (s.optional) o['use_' + s.part] = !!s.on;
      (s.rows || []).forEach(r => {
        if (r.t === 'dosu') {
          o[r.part + '_mun_values'] = MUN_VALUES[0];
          o[r.part + '_printer'] = r.printer[0];
        } else if (r.t === 'paper') {
          o[r.part + '_paper_group'] = ''; o[r.part + '_paper'] = '';
        } else if (r.t === 'last') {
          r.items.forEach(l => { o[r.part + '_' + l.key] = ''; });
        } else if (r.key) {
          o[r.key] = r.value !== undefined ? r.value : '';
        }
      });
    }
  });
  return o;
}

function renderForm(mode) {
  const schema = MODES[mode];
  const o = state.opts;
  const parts = [];
  let no = 0;

  /* 상품 머리글 */
  parts.push('<div class="opt-goods"><span class="opt-goods-name">' + esc(schema.goods) +
    '</span><span class="opt-goods-code">' + esc(schema.code) + '</span></div>');

  /* 업로드 — 원본은 웹하드 전송이지만, 여기서는 3D 반영을 위한 단계로 둔다 */
  no++;
  parts.push('<div class="opt-group">' + stepHead(no, '작업파일 등록') +
    '<div class="opt-uploads">');
  schema.uploads.forEach(u => {
    parts.push(
      '<label class="opt-upload" data-slot="' + u.slot + '">' +
        '<span class="opt-upload-label">' + esc(u.label) + '</span>' +
        '<span class="opt-upload-state" data-slot-state="' + u.slot + '">파일 선택 / 드래그</span>' +
        '<input type="file" accept="image/*" data-upload="' + u.slot + '" hidden>' +
      '</label>');
  });
  parts.push('</div></div>');

  schema.steps.forEach(s => {
    if (s.t === 'size') {
      no++;
      parts.push('<div class="opt-group">' + stepHead(no, s.label, s.note));
      parts.push('<div class="opt-size-list" data-key="' + s.key + '">');
      s.options.forEach(op => {
        parts.push('<button type="button" class="opt-size' + (op.n === o[s.key] ? ' is-on' : '') +
          '" data-key="' + s.key + '" data-val="' + esc(op.n) + '">' +
          '<span class="opt-size-icon">' + sizeIcon(op) + '</span>' +
          '<span class="opt-size-name">' + esc(op.n) + '</span></button>');
      });
      parts.push('</div></div>');

    } else if (s.t === 'basic') {
      no++;
      parts.push('<div class="opt-group">' + stepHead(no, '기본정보'));
      parts.push('<div class="opt-row"><label class="opt-label" for="opt-customer_name">주문제목' +
        '</label><input type="text" class="opt-input" id="opt-customer_name" ' +
        'data-key="customer_name" value="' + esc(o.customer_name || '') +
        '" placeholder="주문 건을 구분할 제목"></div>');

      /* 재단사이즈 / 실작업규격 — 원본과 동일하게 가로×세로 2칸 */
      parts.push(wh('재단사이즈', 'goods_size_w', 'goods_size_h', o));
      parts.push(wh('실작업규격', 'size_w_plus', 'size_h_plus', o));

      if (s.qtySelect) {
        parts.push(selectRow('수량', s.qtySelect.key, s.qtySelect.options, o[s.qtySelect.key]));
      }
      (s.qty || []).forEach(q => {
        parts.push(numRow('수량', q.key, o[q.key], q.unit, 1, 99999));
      });
      parts.push(segRow('작업일정', 'quick_no', ['일반', '긴급'], o.quick_no));
      /* 원본 기본정보 캡션의 총페이지 표시 */
      if (state.mode === 'book') {
        const total = (+o.in_page_val || 0) + (o.use_in2 ? (+o.in2_page_val || 0) : 0);
        parts.push('<div class="opt-row"><span class="opt-label">총페이지</span>' +
          '<span class="opt-readout" data-readout="totalPage">' + total + ' p</span></div>');
      }
      parts.push('</div>');

    } else if (s.t === 'jebon') {
      no++;
      parts.push('<div class="opt-group">' + stepHead(no, '제본'));
      parts.push(segRow('제본 방식', 'goods_jebon',
        ['무선제본', '중철제본_세로형', 'PUR 제본', '링(스프링)제본', '제본 없음'], o.goods_jebon));
      parts.push(segRow('제본 방향', 'goods_jebon_direction', ['가로', '세로'],
        o.goods_jebon_direction));
      /* 원본은 이 두 셀렉트를 항상 노출하고, 라벨로 "링제본 시"를 알린다 */
      parts.push(selectRow('링제본 시 링색상', 'goods_opt_ring', ['검정색', '흰색'],
        o.goods_opt_ring, '::: 선택하세요 :::'));
      parts.push(selectRow('링제본 시 PP 추가 (투명PP)', 'goods_opt_pp',
        ['앞 1장', '앞뒤 1장씩'], o.goods_opt_pp, '::: 선택하세요 :::'));
      parts.push('</div>');

    } else if (s.t === 'part') {
      no++;
      parts.push(renderPart(s, o, no));

    } else if (s.t === 'memo') {
      no++;
      parts.push('<div class="opt-group">' + stepHead(no, '옵션 및 가격정보'));
      parts.push('<div class="opt-row"><label class="opt-label" for="opt-goods_memo">주문메모' +
        '</label><textarea class="opt-input opt-textarea" id="opt-goods_memo" ' +
        'data-key="goods_memo" rows="2" placeholder="요청사항을 적어 주세요">' +
        esc(o.goods_memo || '') + '</textarea></div>');
      parts.push('</div>');

    } else if (s.t === 'estimate') {
      parts.push('<div class="opt-group opt-estimate" id="optEstimate"></div>');
    }
  });

  form.innerHTML = parts.join('');
  updateUploadStates();
  renderEstimate();
}

/* 가로×세로 mm 입력 한 줄 */
function wh(label, kw, kh, o) {
  return '<div class="opt-row"><span class="opt-label">' + esc(label) + '</span>' +
    '<span class="opt-wh">' +
    '<input type="number" class="opt-input" data-key="' + kw + '" value="' + (o[kw] || '') + '">' +
    '<span class="opt-unit">㎜ ×</span>' +
    '<input type="number" class="opt-input" data-key="' + kh + '" value="' + (o[kh] || '') + '">' +
    '<span class="opt-unit">㎜</span></span></div>';
}

function updateUploadStates() {
  form.querySelectorAll('[data-slot-state]').forEach(el => {
    const slot = el.getAttribute('data-slot-state');
    if (state.images[slot]) {
      el.textContent = '반영됨 · 변경하려면 클릭';
      el.closest('.opt-upload').classList.add('is-set');
    } else {
      el.textContent = '파일 선택 / 드래그';
      el.closest('.opt-upload').classList.remove('is-set');
    }
  });
}

/* --- 견적 (원본 견적보기 블록의 항목 구성을 따른 참고용 추정치) ---------- */

function renderEstimate() {
  const box = document.getElementById('optEstimate');
  if (!box) return;
  const e = estimate();
  const won = n => n.toLocaleString('ko-KR') + '원';
  box.innerHTML =
    '<div class="opt-step-head"><span class="opt-step-title">' +
      esc(MODES[state.mode].goods) + ' 견적보기</span></div>' +
    '<dl class="est-list">' +
      '<div><dt>지류대</dt><dd>' + won(e.paper) + '</dd></div>' +
      '<div><dt>인쇄비</dt><dd>' + won(e.print) + '</dd></div>' +
      '<div><dt>제본비</dt><dd>' + won(e.bind) + '</dd></div>' +
      '<div><dt>후가공</dt><dd>' + won(e.last) + '</dd></div>' +
      '<div class="est-sum"><dt>공급가액 (부가세)</dt><dd>' + won(e.supply) +
        ' (' + won(e.vat) + ')</dd></div>' +
      '<div class="est-total"><dt>청구금액</dt><dd>' + won(e.total) + '</dd></div>' +
    '</dl>' +
    '<p class="opt-note">※ 실제 단가가 아닌 참고용 추정치입니다. 주문접수는 로그인 후 가능합니다.</p>' +
    '<button type="button" class="opt-submit" data-submit>주문 접수</button>';
}

/* --- 견적 추정 모델 -------------------------------------------------------
   실제 태산인디고 단가표는 공개돼 있지 않다. 아래는 면적·장수·수량·옵션에
   비례하는 추정치이며, 화면에도 참고용임을 명시한다.
   -------------------------------------------------------------------------- */

/* 현재 폼에서 활성화된 파트 목록 */
function activeParts() {
  return MODES[state.mode].steps
    .filter(s => s.t === 'part' && !(s.optional && !state.opts['use_' + s.part]))
    .map(s => s.part);
}

/* 파트가 소비하는 장수 */
function partSheets(p) {
  const o = state.opts;
  if (p === 'in') return state.mode === 'book' ? Math.max(1, (+o.in_page_val || 0) / 2) : 1;
  if (p === 'in2') return Math.max(1, (+o.in2_page_val || 0) / 2);
  if (p === 'mun') return o.mun_page_values === '앞뒤2장씩' ? 4 : 2;
  if (p === 'ganji') return Math.max(1, +o.ganji_page_values || 1);
  return 1;                                    // cover, 낱장류
}

/* 파트 소계(지류대 + 인쇄비) */
function partPrice(p) {
  const c = partCost(p);
  return c.paper + c.print;
}

function partCost(p) {
  const o = state.opts;
  const area = ((+o.goods_size_w || 210) * (+o.goods_size_h || 297)) / (210 * 297);  // A4 = 1
  const qty = parseInt(String(o.goods_ea).replace(/[^\d]/g, ''), 10) || 1;
  const kinds = +o.goods_ea2 || 1;
  const sheets = partSheets(p);

  /* 면지·간지는 별도 인쇄 셀렉트를 쓰고, '인쇄없음'이면 인쇄비가 0이다 */
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

function estimate() {
  const o = state.opts;
  const area = ((+o.goods_size_w || 210) * (+o.goods_size_h || 297)) / (210 * 297);
  const qty = parseInt(String(o.goods_ea).replace(/[^\d]/g, ''), 10) || 1;
  const kinds = +o.goods_ea2 || 1;

  let paper = 0, print = 0;
  activeParts().forEach(p => {
    const c = partCost(p);
    paper += c.paper; print += c.print;
  });

  let bind = 0;
  if (state.mode === 'book' && o.goods_jebon !== '제본 없음') {
    const rate = { '무선제본': 700, '중철제본_세로형': 400, 'PUR 제본': 1100,
                   '링(스프링)제본': 900 }[o.goods_jebon] || 0;
    bind = rate * qty;
    if (o.goods_opt_pp) bind += 300 * qty;          // 투명PP 추가
    if (o.cover_nalgae === '날개있음') bind += 250 * qty;
  }

  let last = 0;
  activeParts().forEach(p => {
    if (o[p + '_lastJob4']) last += Math.round(area * qty * kinds * 18);
    if (o[p + '_lastJob7'] === '재단') last += Math.round(qty * kinds * 6);
    if (o[p + '_lastJob27'] || o[p + '_lastJob54']) last += Math.round(qty * kinds * 22);
    if (o[p + '_lastJob47']) last += Math.round(qty * kinds * 10);
  });

  const supply = paper + print + bind + last;
  const vat = Math.round(supply * 0.1);
  return { paper, print, bind, last, supply, vat, total: supply + vat };
}

/* --- 입력 이벤트 --------------------------------------------------------- */

form.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-upload]')) {
    const file = el.files && el.files[0];
    if (file) loadImageFile(file, el.getAttribute('data-upload'));
    return;
  }
  if (el.matches('[data-key]')) {
    setOpt(el.getAttribute('data-key'), el.value);
  }
});

form.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('input[type=number][data-key], input[type=text][data-key], textarea[data-key]')) {
    setOpt(el.getAttribute('data-key'), el.value);
  }
});

form.addEventListener('click', e => {
  /* 세그먼트 / 사이즈 카드 */
  const btn = e.target.closest('.opt-seg-item, .opt-size');
  if (btn) {
    const key = btn.getAttribute('data-key');
    const val = btn.getAttribute('data-val');
    setOpt(key, val);
    return;
  }
  /* 선택 파트 사용/미사용 */
  const tog = e.target.closest('[data-toggle]');
  if (tog) {
    const k = tog.getAttribute('data-toggle');
    state.opts[k] = !state.opts[k];
    renderForm(state.mode);
    onOptionChange();
    return;
  }
  if (e.target.closest('[data-submit]')) {
    alert('데모 화면입니다. 실제 주문 접수는 연결되어 있지 않습니다.');
  }
});

/* 값 변경 → 연동 처리 → 3D/견적 반영 */
function setOpt(key, value) {
  state.opts[key] = value;

  /* 규격을 고르면 재단/실작업 규격을 채운다(원본 sizeInput 동작) */
  const sizeStep = MODES[state.mode].steps.find(s => s.t === 'size');
  if (sizeStep && key === sizeStep.key) {
    const op = sizeStep.options.find(x => x.n === value);
    if (op && !op.custom) {
      state.opts.goods_size_w = op.w; state.opts.goods_size_h = op.h;
      state.opts.size_w_plus = op.w; state.opts.size_h_plus = op.h;
    }
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  /* 용지 그룹 → 평량 셀렉트 활성화 */
  if (/_paper_group$/.test(key)) {
    const p = key.replace('_paper_group', '');
    state.opts[p + '_paper'] = value ? WEIGHTS[0] : '';
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  /* 링제본일 때만 링 옵션 노출 */
  if (key === 'goods_jebon') {
    renderForm(state.mode);
    onOptionChange();
    return;
  }

  /* 세그먼트 즉시 반영(재렌더 없이) */
  form.querySelectorAll('.opt-seg-item[data-key="' + key + '"]').forEach(b =>
    b.classList.toggle('is-on', b.getAttribute('data-val') === value));
  form.querySelectorAll('.opt-size[data-key="' + key + '"]').forEach(b =>
    b.classList.toggle('is-on', b.getAttribute('data-val') === value));

  onOptionChange();
}

/* 서브헤더 모드 전환 */
subnav.addEventListener('click', e => {
  const btn = e.target.closest('.subnav-item[data-mode]');
  if (!btn) return;
  subnav.querySelectorAll('.subnav-item').forEach(b => b.classList.toggle('is-active', b === btn));
  switchMode(btn.getAttribute('data-mode'));
});

resetBtn.addEventListener('click', () => { if (engine) engine.resetView(); });

/* --- 파일 로드 → 이미지 → 텍스처 ---------------------------------------- */

function loadImageFile(file, slot) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.images[slot] = img;
      updateUploadStates();
      if (engine) engine.setTexture(slot, img);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* 스테이지 드래그&드롭: 현재 모드의 첫 업로드 슬롯(또는 표지)에 반영 */
function primarySlot() {
  return MODES[state.mode].uploads[0].slot;
}
['dragenter', 'dragover'].forEach(ev =>
  stage.addEventListener(ev, e => { e.preventDefault(); stage.classList.add('is-drop'); }));
['dragleave', 'drop'].forEach(ev =>
  stage.addEventListener(ev, e => {
    e.preventDefault();
    if (ev === 'dragleave' && stage.contains(e.relatedTarget)) return;
    stage.classList.remove('is-drop');
  }));
stage.addEventListener('drop', e => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) loadImageFile(file, primarySlot());
});

/* --- 모드 전환 / 옵션 변경 → 3D 반영 ------------------------------------ */

function switchMode(mode) {
  if (!MODES[mode]) return;
  state.mode = mode;
  state.images = {};              // 모드마다 업로드 초기화
  state.opts = seedDefaults(mode);
  renderForm(mode);
  updateDimLabel();
  if (engine) engine.rebuild(mode, derive(), state.images);
}

function onOptionChange() {
  updateDimLabel();
  refreshDynamic();
  renderEstimate();
  if (engine) engine.update(derive());
}

/* 재렌더 없이 갱신해야 하는 것들 — 조건부 행의 표시 여부, 계산 표시값,
   파트별 소계. 숫자·텍스트 입력 중에도 호출되므로 DOM을 새로 만들지 않는다. */
function refreshDynamic() {
  const o = state.opts;

  form.querySelectorAll('[data-cond]').forEach(el => {
    const v = o[el.getAttribute('data-cond')];
    el.classList.toggle('is-off', v === el.getAttribute('data-cond-not'));
  });

  const seneca = form.querySelector('[data-readout=seneca]');
  if (seneca) seneca.textContent = senecaMm(o) + ' ㎜';

  const tp = form.querySelector('[data-readout=totalPage]');
  if (tp) {
    tp.textContent = ((+o.in_page_val || 0) +
      (o.use_in2 ? (+o.in2_page_val || 0) : 0)) + ' p';
  }

  form.querySelectorAll('[data-part-total]').forEach(el => {
    el.textContent = 'TOTAL ' +
      partPrice(el.getAttribute('data-part-total')).toLocaleString('ko-KR') + '원';
  });
}

function updateDimLabel() {
  const o = state.opts;
  const d = o.goods_size_w + '×' + o.goods_size_h + 'mm';
  let extra = '';
  if (state.mode === 'book') extra = ' · ' + (o.in_page_val || 0) + 'p · ' + (o.goods_jebon || '');
  else if (o.in_lastJob54) extra = ' · ' + o.in_lastJob54;
  else if (o.in_lastJob27) extra = ' · ' + o.in_lastJob27;
  dimLabel.textContent = d + extra;
}

/* 폼 값 → 3D 빌더가 쓰는 기하/재질 파라미터 */
function derive() {
  const o = state.opts;
  const coatOf = s => /무광/.test(s || '') ? '무광' : /유광/.test(s || '') ? '유광' : '없음';
  const foldStr = o.in_lastJob54 || o.in_lastJob27 || '';
  let panels = 1;
  if (/2단/.test(foldStr)) panels = 2;
  else if (/3단/.test(foldStr)) panels = 3;
  else if (/4단/.test(foldStr)) panels = 4;
  else if (/대문/.test(foldStr)) panels = 4;

  return {
    w: +o.goods_size_w || 210,
    h: +o.goods_size_h || 297,
    sides: o.in_mun_values === '양면출력' ? '양면' : '단면',
    coating: coatOf(o.in_lastJob4),
    coverCoating: coatOf(o.cover_lastJob4),
    paper: (o.in_paper_group || '') + ' ' + (o.in_paper || ''),
    coverPaper: (o.cover_paper_group || '') + ' ' + (o.cover_paper || ''),
    panels,
    bind: o.goods_jebon || '무선제본',
    direction: o.goods_jebon_direction || '세로',
    pages: +o.in_page_val || 48,
    wings: o.cover_nalgae === '날개있음',
  };
}

/* --- 활성화 관찰: Order(위치 2)일 때만 3D를 돌린다 ---------------------- */

function isOrderActive() {
  return document.body.classList.contains('switch-state-position-2');
}

async function activate() {
  if (active) return;
  active = true;
  dropHint.style.display = state.images[primarySlot()] ? 'none' : '';
  if (!engine) {
    try {
      engine = await createEngine(stage);
      engine.rebuild(state.mode, derive(), state.images);
    } catch (err) {
      stage.innerHTML = '<p class="order-error">3D 프리뷰를 불러오지 못했습니다.<br>' +
        '네트워크 연결을 확인해 주세요.</p>';
      console.error('[order] 3D init failed:', err);
      return;
    }
  }
  engine.resize();
  engine.start();
}

function deactivate() {
  if (!active) return;
  active = false;
  if (engine) engine.stop();
}

const bodyObserver = new MutationObserver(() => {
  if (isOrderActive()) activate();
  else deactivate();
});
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

/* 첫 진입 전에도 폼은 보여준다 */
state.opts = seedDefaults(state.mode);
renderForm(state.mode);
updateDimLabel();
if (isOrderActive()) activate();

window.addEventListener('resize', () => { if (engine && active) engine.resize(); });

/* ==========================================================================
   3D 엔진 — Three.js 동적 로드 후 씬 구성
   ========================================================================== */

async function createEngine(mount) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.classList.add('order-canvas');
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const VIEW_DIR = new THREE.Vector3(0.42, 0.34, 1).normalize();  // 3/4 시점
  let fitCenter = new THREE.Vector3(0, 0, 0);
  let fitDist = 6;
  camera.position.copy(VIEW_DIR).multiplyScalar(fitDist);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.target.set(0, 0.2, 0);

  // 조명: 반구광 + 주광(그림자) + 필
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe6f2, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xeaf2ff, 0.6);
  fill.position.set(-4, 2, -2);
  scene.add(fill);

  // 환경맵(코팅 반사용)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // 접지 그림자 바닥
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.15;
  ground.receiveShadow = true;
  scene.add(ground);

  let modelRoot = new THREE.Group();
  scene.add(modelRoot);

  /* --- 텍스처 유틸 --- */
  const texCache = {};   // slot -> THREE.Texture

  function placeholderTexture(label) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 724;
    const g = c.getContext('2d');
    g.fillStyle = '#eef4fb'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#c7d8ea'; g.lineWidth = 4;
    g.strokeRect(12, 12, c.width - 24, c.height - 24);
    g.fillStyle = '#9db4cc';
    g.font = '30px "IBM Plex Mono", monospace';
    g.textAlign = 'center';
    g.fillText(label || 'artwork', c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function imageTexture(img) {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.needsUpdate = true;
    return t;
  }

  function texFor(slot, label) {
    if (texCache[slot]) return texCache[slot];
    return placeholderTexture(label);
  }

  /* --- 재질(용지/코팅) --- */
  function paperMaterial(coating, paperName, map) {
    const uncoated = /크라프트|모조|미색|반누보|레자크|색지/.test(paperName || '');
    return new THREE.MeshPhysicalMaterial({
      map: map || null,
      color: map ? 0xffffff : 0xf3f6fb,
      roughness: coating === '유광' ? 0.18 : coating === '무광' ? 0.5 : (uncoated ? 0.9 : 0.7),
      metalness: 0,
      clearcoat: coating === '유광' ? 1 : coating === '무광' ? 0.35 : 0,
      clearcoatRoughness: coating === '유광' ? 0.12 : 0.4,
      envMapIntensity: 0.7,
    });
  }

  const edgeMat = () => new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.95 });

  /* --- 모델 빌더 --- */
  function disposeModel() {
    modelRoot.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
    scene.remove(modelRoot);
    modelRoot = new THREE.Group();
    scene.add(modelRoot);
  }

  // mm → 정규화된 (w,h) 월드 단위(최대변 ≈ 3)
  function worldSize(w, h) {
    const s = 3 / Math.max(w, h);
    return { w: w * s, h: h * s };
  }

  function buildFlat(D, size, frontSlot, backSlot, frontLabel, backLabel, thick) {
    const t = thick || 0.02;
    const geo = new THREE.BoxGeometry(size.w, size.h, t);
    const front = paperMaterial(D.coating, D.paper, texFor(frontSlot, frontLabel));
    const back = (D.sides === '양면')
      ? paperMaterial(D.coating, D.paper, texFor(backSlot, backLabel))
      : paperMaterial(D.coating, D.paper, null);
    const edge = edgeMat();
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  function buildPoster(D) {
    const size = worldSize(D.w, D.h);
    const mesh = buildFlat(D, size, 'front', 'back', '앞면', '뒷면', 0.02);
    mesh.position.y = size.h / 2 - 1.1;   // 바닥에 서 있게
    modelRoot.add(mesh);
  }

  function buildPrint(D) {
    const size = worldSize(D.w, D.h);
    const mesh = buildFlat(D, size, 'front', 'back', '앞면', '뒷면', 0.03);
    mesh.rotation.x = -Math.PI / 2;         // 바닥에 눕힘
    mesh.position.y = -1.1 + 0.02;
    mesh.rotation.z = 0.15;
    modelRoot.add(mesh);
  }

  function buildLeaflet(D) {
    const panels = Math.max(1, D.panels);
    const size = worldSize(D.w, D.h);
    const pw = size.w / panels;
    const group = new THREE.Group();
    const frontTex = texFor('front', '앞면');
    let x = -size.w / 2;
    for (let i = 0; i < panels; i++) {
      const geo = new THREE.BoxGeometry(pw, size.h, 0.015);
      // 각 패널이 전체 앞면 텍스처의 한 구획을 보이도록 UV 조정
      adjustUV(geo, i / panels, (i + 1) / panels);
      const front = paperMaterial(D.coating, D.paper, cloneTex(frontTex));
      const back = paperMaterial(D.coating, D.paper, null);
      const edge = edgeMat();
      const panel = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
      panel.castShadow = true; panel.receiveShadow = true;
      const pivot = new THREE.Group();
      pivot.position.x = x;
      panel.position.x = pw / 2;
      // 지그재그 접힘 각도
      const sign = i % 2 === 0 ? 1 : -1;
      panel.rotation.y = panels > 1 ? sign * 0.5 : 0;
      pivot.add(panel);
      group.add(pivot);
      x += pw * Math.cos(0.5);
    }
    group.position.y = size.h / 2 - 1.1;
    modelRoot.add(group);
  }

  function cloneTex(t) { const c = t.clone(); c.needsUpdate = true; return c; }

  // BoxGeometry의 앞/뒤면(±z) UV를 [u0,u1] 구간으로 매핑
  function adjustUV(geo, u0, u1) {
    const uv = geo.attributes.uv;
    // Box UV: 각 면 4버텍스씩. +z 면 = 인덱스 16..19, -z 면 = 20..23
    for (const base of [16, 20]) {
      for (let i = 0; i < 4; i++) {
        const u = uv.getX(base + i);
        uv.setX(base + i, u0 + u * (u1 - u0));
      }
    }
    uv.needsUpdate = true;
  }

  function buildBook(D) {
    const size = worldSize(D.w, D.h);
    const pages = Math.max(4, D.pages);
    const thick = Math.min(0.5, 0.006 + pages * 0.0016);   // 페이지 수 → 두께
    const coverMat = (slot, label) =>
      paperMaterial(D.coverCoating, D.coverPaper, texFor(slot, label));
    const innerMat = () => new THREE.MeshStandardMaterial({
      map: texFor('inner', '내지'), roughness: 0.92, color: 0xffffff,
    });
    const pageEdge = new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.95 });

    // 두 리프(좌: 뒷표지/왼쪽 내지, 우: 앞표지/오른쪽 내지) — 스파인에서 펼침
    const dihedral = 0.62;     // 펼침 각(라디안)
    const book = new THREE.Group();

    function leaf(outerSlot, outerLabel, side) {
      // side: +1 오른쪽(앞표지), -1 왼쪽(뒷표지)
      const g = new THREE.BoxGeometry(size.w, size.h, thick / 2 + 0.02);
      const outer = coverMat(outerSlot, outerLabel);
      const inner = innerMat();
      // +z 면이 바깥(표지), -z 면이 안쪽(내지). 오른쪽 리프(side>0)는
      // 바깥이 뷰어를 향하고, 왼쪽 리프는 안쪽(내지)이 뷰어를 향한다.
      const mats = [pageEdge, pageEdge, pageEdge, pageEdge,
                    side > 0 ? outer : inner, side > 0 ? inner : outer];
      const m = new THREE.Mesh(g, mats);
      m.castShadow = true; m.receiveShadow = true;
      const pivot = new THREE.Group();
      m.position.x = side * size.w / 2;
      pivot.add(m);
      pivot.rotation.y = -side * dihedral;
      return pivot;
    }

    book.add(leaf('cover', '표지', +1));
    book.add(leaf('coverBack', '뒷표지', -1));

    // 제본 방식 표현
    if (D.bind === '링(스프링)제본') {
      const rings = Math.max(6, Math.round(size.h / 0.12));
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.35 });
      for (let i = 0; i < rings; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), ringMat);
        r.position.set(0, -size.h / 2 + (i + 0.5) * (size.h / rings), 0);
        r.rotation.y = Math.PI / 2;
        r.castShadow = true;
        book.add(r);
      }
    } else if (D.bind !== '제본 없음') {
      const spineW = Math.max(0.02, thick);
      const spineMat = D.bind === '중철제본_세로형'
        ? new THREE.MeshStandardMaterial({ color: 0xdfe7f0, roughness: 0.6 })
        : coverMat('cover', '표지');
      const spine = new THREE.Mesh(new THREE.BoxGeometry(spineW, size.h, 0.02), spineMat);
      spine.position.z = -0.02;
      spine.castShadow = true;
      book.add(spine);
    }

    book.position.y = size.h / 2 - 1.1;
    // 가로(좌철) 제본이면 눕혀서 보여준다
    if (D.direction === '가로') book.rotation.z = Math.PI / 2;
    modelRoot.add(book);
  }

  function build(mode, D) {
    disposeModel();
    if (mode === 'poster') buildPoster(D);
    else if (mode === 'print') buildPrint(D);
    else if (mode === 'leaflet') buildLeaflet(D);
    else if (mode === 'book') buildBook(D);
    fitCamera();
  }

  /* 모델 바운딩 박스를 뷰포트(가로·세로 모두)에 담는 거리 계산 */
  function fitCamera() {
    const box = new THREE.Box3().setFromObject(modelRoot);
    if (box.isEmpty()) return;
    const size = new THREE.Vector3(); box.getSize(size);
    box.getCenter(fitCenter);
    const vFov = camera.fov * Math.PI / 180;
    const halfH = size.y / 2, halfW = size.x / 2, halfD = size.z / 2;
    const dH = halfH / Math.tan(vFov / 2);
    const dW = halfW / (Math.tan(vFov / 2) * camera.aspect);
    fitDist = Math.max(dH, dW) * 1.35 + halfD;
    controls.minDistance = fitDist * 0.55;
    controls.maxDistance = fitDist * 1.8;
    controls.target.copy(fitCenter);
    camera.position.copy(fitCenter).add(VIEW_DIR.clone().multiplyScalar(fitDist));
    controls.update();
  }

  /* --- 렌더 루프 --- */
  let raf = null, running = false, currentMode = 'poster', currentD = {};

  function loop() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    const w = mount.clientWidth || 1, h = mount.clientHeight || 1;
    // setSize의 updateStyle=true(기본): 캔버스의 CSS width/height를 인라인으로
    // 지정한다. CSS(.order-canvas)가 없거나 캐시가 낡아도 캔버스가 드로잉버퍼
    // 크기(예: 1610px)로 표시돼 패널을 넘치는 것을 방지한다.
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera();          // 비율이 바뀌면 다시 담는다
  }

  /* --- 외부 API --- */
  return {
    rebuild(mode, D, images) {
      currentMode = mode; currentD = D;
      // 이미지 텍스처 갱신
      for (const slot in texCache) { texCache[slot].dispose(); delete texCache[slot]; }
      for (const slot in images) texCache[slot] = imageTexture(images[slot]);
      build(mode, D);
    },
    update(D) {
      currentD = D;
      build(currentMode, D);    // 옵션 변경은 재빌드(간단·안전)
    },
    setTexture(slot, img) {
      if (texCache[slot]) texCache[slot].dispose();
      texCache[slot] = imageTexture(img);
      build(currentMode, currentD);
      if (slot === MODES[state.mode].uploads[0].slot) dropHint.style.display = 'none';
    },
    resetView() {
      camera.position.copy(fitCenter).add(VIEW_DIR.clone().multiplyScalar(fitDist));
      controls.target.copy(fitCenter);
      controls.update();
    },
    resize,
    start() { if (running) return; running = true; resize(); loop(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); },
  };
}
