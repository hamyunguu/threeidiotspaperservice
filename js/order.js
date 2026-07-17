/* ==========================================================================
   Order 페이지 — 옵션 구성 + 실시간 3D 프리뷰
   --------------------------------------------------------------------------
   좌: 모드별(Poster/Book/Leaflet/Print) 인쇄 옵션 폼 + 파일 업로드
   우: Three.js 파라메트릭 3D. 업로드한 이미지가 즉시 텍스처로 반영되고,
       옵션(판형·접지·제본·코팅…)이 지오메트리/재질에 실시간 반영된다.

   Three.js는 Order에 처음 들어올 때만 동적 import한다(다른 페이지 부하 0).
   활성/비활성은 body의 switch-state-position-2 클래스를 관찰해 판단하고,
   비활성일 때는 렌더 루프를 멈춘다.
   ========================================================================== */

/* --- 모드별 스키마: 태산인디고 등 국내 인쇄 옵션 체계를 반영 ------------- */

const MODES = {
  poster: {
    label: 'Poster',
    uploads: [{ slot: 'front', label: '포스터 이미지' }],
    fields: [
      { key: 'size', label: '사이즈', type: 'select',
        options: ['A4 · 210×297', 'A3 · 297×420', 'A2 · 420×594', 'A1 · 594×841', 'B2 · 515×728'],
        value: 'A2 · 420×594' },
      { key: 'orient', label: '방향', type: 'radio', options: ['세로', '가로'], value: '세로' },
      { key: 'paper', label: '용지', type: 'select',
        options: ['스노우지 200g', '아트지 200g', '랑데뷰 210g', '몽블랑 200g', '반누보 215g'],
        value: '스노우지 200g' },
      { key: 'coating', label: '코팅', type: 'radio', options: ['없음', '무광', '유광'], value: '무광' },
      { key: 'sides', label: '인쇄', type: 'radio', options: ['단면', '양면'], value: '단면' },
      { key: 'qty', label: '수량', type: 'number', value: 10, min: 1, max: 9999, unit: '매' },
    ],
  },

  book: {
    label: 'Book',
    uploads: [
      { slot: 'cover', label: '표지 (앞면)' },
      { slot: 'coverBack', label: '표지 (뒷면)' },
      { slot: 'inner', label: '내지 (펼침면)' },
    ],
    fields: [
      { key: 'bind', label: '제본', type: 'select',
        options: ['중철', '무선(떡)', 'PUR(각양장)', '트윈링'], value: '무선(떡)' },
      { key: 'trim', label: '판형', type: 'select',
        options: ['A5 · 148×210', 'B5 · 176×250', 'A4 · 210×297', '정사각 · 190×190'],
        value: 'A5 · 148×210' },
      { key: 'coverPaper', label: '표지 용지', type: 'select',
        options: ['랑데뷰 240g', '스노우 250g', '아르떼 230g', '크라프트 220g'], value: '랑데뷰 240g' },
      { key: 'innerPaper', label: '내지 용지', type: 'select',
        options: ['모조지 100g', '스노우 120g', '미색모조 80g', '아트지 150g'], value: '모조지 100g' },
      { key: 'pages', label: '페이지 수', type: 'number', value: 48, min: 4, max: 400, step: 2, unit: 'p' },
      { key: 'ink', label: '인쇄', type: 'radio', options: ['컬러', '흑백'], value: '컬러' },
      { key: 'qty', label: '수량', type: 'number', value: 30, min: 1, max: 9999, unit: '부' },
    ],
  },

  leaflet: {
    label: 'Leaflet',
    uploads: [
      { slot: 'front', label: '앞면' },
      { slot: 'back', label: '뒷면' },
    ],
    fields: [
      { key: 'fold', label: '접지', type: 'select',
        options: ['낱장(접지 없음)', '2단 접지', '3단 접지', '대문 접지'], value: '3단 접지' },
      { key: 'size', label: '펼친 사이즈', type: 'select',
        options: ['A4 · 210×297', 'A5 · 148×210', 'B5 · 176×250'], value: 'A4 · 210×297' },
      { key: 'paper', label: '용지', type: 'select',
        options: ['스노우지 150g', '아트지 150g', '모조지 120g'], value: '스노우지 150g' },
      { key: 'coating', label: '코팅', type: 'radio', options: ['없음', '무광', '유광'], value: '없음' },
      { key: 'qty', label: '수량', type: 'number', value: 100, min: 1, max: 99999, unit: '매' },
    ],
  },

  print: {
    label: 'Print',
    uploads: [
      { slot: 'front', label: '앞면' },
      { slot: 'back', label: '뒷면' },
    ],
    fields: [
      { key: 'kind', label: '종류', type: 'select',
        options: ['낱장 · 90×50', '엽서 · 100×148', '명함 · 90×50', '카드 · 128×182'], value: '명함 · 90×50' },
      { key: 'paper', label: '용지', type: 'select',
        options: ['스노우지 250g', '랑데뷰 240g', '반누보 240g', '크라프트 230g'], value: '스노우지 250g' },
      { key: 'coating', label: '코팅', type: 'radio', options: ['없음', '무광', '유광'], value: '없음' },
      { key: 'sides', label: '인쇄', type: 'radio', options: ['단면', '양면'], value: '양면' },
      { key: 'qty', label: '수량', type: 'number', value: 200, min: 1, max: 99999, unit: '매' },
    ],
  },
};

/* 사이즈 문자열 "라벨 · W×H(mm)"에서 mm 파싱 */
function parseDim(str) {
  const m = str.match(/(\d+)\s*[×xX]\s*(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : { w: 210, h: 297 };
}

/* --- 상태 ---------------------------------------------------------------- */

const state = {
  mode: 'poster',
  opts: {},           // 현재 폼 값
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

function fieldId(key) { return 'opt-' + key; }

function renderForm(mode) {
  const schema = MODES[mode];
  state.opts = {};
  schema.fields.forEach(f => { state.opts[f.key] = f.value; });

  const parts = [];

  // 업로드 그룹
  parts.push('<div class="opt-group opt-uploads"><div class="opt-legend">파일 업로드</div>');
  schema.uploads.forEach(u => {
    parts.push(
      '<label class="opt-upload" data-slot="' + u.slot + '">' +
        '<span class="opt-upload-label">' + u.label + '</span>' +
        '<span class="opt-upload-state" data-slot-state="' + u.slot + '">파일 선택 / 드래그</span>' +
        '<input type="file" accept="image/*" data-upload="' + u.slot + '" hidden>' +
      '</label>'
    );
  });
  parts.push('</div>');

  // 옵션 필드
  parts.push('<div class="opt-group">');
  schema.fields.forEach(f => {
    parts.push('<div class="opt-row">');
    parts.push('<label class="opt-label" for="' + fieldId(f.key) + '">' + f.label + '</label>');
    if (f.type === 'select') {
      parts.push('<select class="opt-select" id="' + fieldId(f.key) + '" data-key="' + f.key + '">');
      f.options.forEach(o => {
        parts.push('<option' + (o === f.value ? ' selected' : '') + '>' + o + '</option>');
      });
      parts.push('</select>');
    } else if (f.type === 'radio') {
      parts.push('<div class="opt-seg" role="radiogroup" data-key="' + f.key + '">');
      f.options.forEach(o => {
        parts.push('<button type="button" class="opt-seg-item' + (o === f.value ? ' is-on' : '') +
          '" data-key="' + f.key + '" data-val="' + o + '">' + o + '</button>');
      });
      parts.push('</div>');
    } else if (f.type === 'number') {
      parts.push('<span class="opt-num">');
      parts.push('<input type="number" class="opt-input" id="' + fieldId(f.key) + '" data-key="' + f.key +
        '" value="' + f.value + '" min="' + (f.min || 1) + '"' + (f.max ? ' max="' + f.max + '"' : '') +
        (f.step ? ' step="' + f.step + '"' : '') + '>');
      if (f.unit) parts.push('<span class="opt-unit">' + f.unit + '</span>');
      parts.push('</span>');
    }
    parts.push('</div>');
  });
  parts.push('</div>');

  form.innerHTML = parts.join('');
  updateUploadStates();
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

/* --- 입력 이벤트 --------------------------------------------------------- */

form.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-upload]')) {
    const file = el.files && el.files[0];
    if (file) loadImageFile(file, el.getAttribute('data-upload'));
    return;
  }
  if (el.matches('[data-key]')) {
    state.opts[el.getAttribute('data-key')] = el.value;
    onOptionChange();
  }
});

form.addEventListener('input', e => {
  if (e.target.matches('input[type=number][data-key]')) {
    state.opts[e.target.getAttribute('data-key')] = e.target.value;
    onOptionChange();
  }
});

form.addEventListener('click', e => {
  const seg = e.target.closest('.opt-seg-item');
  if (!seg) return;
  const key = seg.getAttribute('data-key');
  state.opts[key] = seg.getAttribute('data-val');
  form.querySelectorAll('.opt-seg-item[data-key="' + key + '"]').forEach(b =>
    b.classList.toggle('is-on', b === seg));
  onOptionChange();
});

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
  stage.addEventListener(ev, e => { e.preventDefault(); if (ev === 'dragleave' && stage.contains(e.relatedTarget)) return; stage.classList.remove('is-drop'); }));
stage.addEventListener('drop', e => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) loadImageFile(file, primarySlot());
});

/* --- 모드 전환 / 옵션 변경 → 3D 반영 ------------------------------------ */

function switchMode(mode) {
  if (!MODES[mode]) return;
  state.mode = mode;
  state.images = {};              // 모드마다 업로드 초기화
  renderForm(mode);
  updateDimLabel();
  if (engine) engine.rebuild(mode, state.opts, state.images);
}

function onOptionChange() {
  updateDimLabel();
  if (engine) engine.update(state.opts);
}

function updateDimLabel() {
  const o = state.opts;
  let dim = '';
  if (state.mode === 'poster' || state.mode === 'leaflet') dim = o.size;
  else if (state.mode === 'book') dim = o.trim + ' · ' + o.pages + 'p';
  else if (state.mode === 'print') dim = o.kind;
  dimLabel.textContent = dim || '';
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
    form.querySelector('.order-loading') && (form.innerHTML = '');
    renderForm(state.mode);
    updateDimLabel();
    try {
      engine = await createEngine(stage);
      engine.rebuild(state.mode, state.opts, state.images);
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
if (isOrderActive()) activate();

/* 첫 진입 전에도 폼은 보여준다(로딩 텍스트 대체) */
if (form.querySelector('.order-loading')) { renderForm(state.mode); updateDimLabel(); }
window.addEventListener('resize', () => { if (engine && active) engine.resize(); });

/* ==========================================================================
   3D 엔진 — Three.js 동적 로드 후 씬 구성
   ========================================================================== */

async function createEngine(mount) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const PAPER = 0xf5f9fe;

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
  function paperMaterial(opts, map) {
    const coating = opts.coating || '없음';
    const uncoated = /크라프트|모조|미색|반누보|비코팅/.test((opts.paper || '') + (opts.coverPaper || ''));
    const m = new THREE.MeshPhysicalMaterial({
      map: map || null,
      color: map ? 0xffffff : 0xf3f6fb,
      roughness: coating === '유광' ? 0.18 : coating === '무광' ? 0.5 : (uncoated ? 0.9 : 0.7),
      metalness: 0,
      clearcoat: coating === '유광' ? 1 : coating === '무광' ? 0.35 : 0,
      clearcoatRoughness: coating === '유광' ? 0.12 : 0.4,
      envMapIntensity: 0.7,
    });
    return m;
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

  // 판형/사이즈 → 정규화된 (w,h) 월드 단위(최대변 ≈ 3)
  function worldSize(mm, orient) {
    let { w, h } = mm;
    if (orient === '가로') { const t = w; w = h; h = t; }
    const s = 3 / Math.max(w, h);
    return { w: w * s, h: h * s, mm };
  }

  function buildFlat(opts, size, frontSlot, backSlot, frontLabel, backLabel, thick) {
    const t = thick || 0.02;
    const geo = new THREE.BoxGeometry(size.w, size.h, t);
    const front = paperMaterial(opts, texFor(frontSlot, frontLabel));
    const back = (opts.sides === '양면')
      ? paperMaterial(opts, texFor(backSlot, backLabel))
      : paperMaterial(opts, null);
    const edge = edgeMat();
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  function buildPoster(opts) {
    const size = worldSize(parseDim(opts.size), opts.orient);
    const mesh = buildFlat(opts, size, 'front', 'front', '포스터', '뒷면', 0.02);
    mesh.position.y = size.h / 2 - 1.1;   // 바닥에 서 있게
    modelRoot.add(mesh);
    controls.target.set(0, size.h / 2 - 1.1, 0);
  }

  function buildPrint(opts) {
    const size = worldSize(parseDim(opts.kind), '가로'); // 명함류는 가로
    const mesh = buildFlat(opts, size, 'front', 'back', '앞면', '뒷면', 0.03);
    mesh.rotation.x = -Math.PI / 2;         // 바닥에 눕힘
    mesh.position.y = -1.1 + 0.02;
    mesh.rotation.z = 0.15;
    modelRoot.add(mesh);
    controls.target.set(0, -0.4, 0);
  }

  function buildLeaflet(opts) {
    const fold = opts.fold || '3단 접지';
    const panels = fold === '낱장(접지 없음)' ? 1 : fold === '2단 접지' ? 2 : fold === '대문 접지' ? 4 : 3;
    const size = worldSize(parseDim(opts.size), '세로');
    const pw = size.w / Math.max(panels, 1);
    const group = new THREE.Group();
    const frontTex = texFor('front', '앞면');
    let x = -size.w / 2;
    for (let i = 0; i < panels; i++) {
      const geo = new THREE.BoxGeometry(pw, size.h, 0.015);
      // 각 패널이 전체 앞면 텍스처의 한 구획을 보이도록 UV 조정
      adjustUV(geo, i / panels, (i + 1) / panels);
      const front = paperMaterial(opts, frontTex.clone ? cloneTex(frontTex) : frontTex);
      const back = paperMaterial(opts, null);
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
    controls.target.set(0, size.h / 2 - 1.1, 0);
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

  function buildBook(opts) {
    const size = worldSize(parseDim(opts.trim), '세로');
    const pages = Math.max(4, +opts.pages || 48);
    const thick = Math.min(0.5, 0.006 + pages * 0.0016);   // 페이지 수 → 두께
    const bind = opts.bind || '무선(떡)';
    const coverMat = (slot, label) => {
      const m = new THREE.MeshPhysicalMaterial({
        map: texFor(slot, label), roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4,
        envMapIntensity: 0.6,
      });
      return m;
    };
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

    // 스파인/제본 표현
    if (bind === '트윈링') {
      const rings = Math.max(6, Math.round(size.h / 0.12));
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.35 });
      for (let i = 0; i < rings; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), ringMat);
        r.position.set(0, -size.h / 2 + (i + 0.5) * (size.h / rings), 0);
        r.rotation.y = Math.PI / 2;
        r.castShadow = true;
        book.add(r);
      }
    } else {
      const spineW = Math.max(0.02, thick);
      const spineMat = bind === '중철'
        ? new THREE.MeshStandardMaterial({ color: 0xdfe7f0, roughness: 0.6 })
        : coverMat('cover', '표지');
      const spine = new THREE.Mesh(new THREE.BoxGeometry(spineW, size.h, 0.02), spineMat);
      spine.position.z = -0.02;
      spine.castShadow = true;
      book.add(spine);
    }

    book.position.y = size.h / 2 - 1.1;
    modelRoot.add(book);
    controls.target.set(0, size.h / 2 - 1.1, 0);
  }

  function build(mode, opts) {
    disposeModel();
    if (mode === 'poster') buildPoster(opts);
    else if (mode === 'print') buildPrint(opts);
    else if (mode === 'leaflet') buildLeaflet(opts);
    else if (mode === 'book') buildBook(opts);
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
  let raf = null, running = false, currentMode = 'poster', currentOpts = {};

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
    rebuild(mode, opts, images) {
      currentMode = mode; currentOpts = opts;
      // 이미지 텍스처 갱신
      for (const slot in texCache) { texCache[slot].dispose(); delete texCache[slot]; }
      for (const slot in images) texCache[slot] = imageTexture(images[slot]);
      build(mode, opts);
    },
    update(opts) {
      currentOpts = opts;
      build(currentMode, opts);    // 옵션 변경은 재빌드(간단·안전)
    },
    setTexture(slot, img) {
      if (texCache[slot]) texCache[slot].dispose();
      texCache[slot] = imageTexture(img);
      build(currentMode, currentOpts);
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
