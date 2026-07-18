/* ==========================================================================
   identity — 로고 익스트루드 입방체
   --------------------------------------------------------------------------
   assets/logo-unit.svg(iPS 유닛 벡터)를 SVGLoader로 읽어 ExtrudeGeometry로
   입체 글리프를 만들고, 평면 로고와 같은 배치(유닛 4개, 0/±90/180°)로
   정사각 한 면을 조립한 뒤, 그 면 6세트로 정육면체를 세운다.
   OrbitControls 드래그로 자유 회전.

   Three.js는 identity가 정면일 때만 동적 import(Order의 order.js와 같은
   패턴 — 모듈은 한 번만 로드되어 둘이 공유한다). 다른 면에서는 렌더
   루프를 멈춘다.
   ========================================================================== */

const mount = document.getElementById('logoCubeScene');

let engine = null;
let active = false;

function isIdentityActive() {
  return document.body.classList.contains('switch-state-position-0');
}

async function activate() {
  if (active) return;
  active = true;
  if (!engine) {
    try {
      engine = await createCube(mount);
    } catch (err) {
      console.error('[identity3d] init failed:', err);
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

const observer = new MutationObserver(() => {
  if (isIdentityActive()) activate();
  else deactivate();
});
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
if (isIdentityActive()) activate();
window.addEventListener('resize', () => { if (engine && active) engine.resize(); });

/* 큐브 드래그가 페이지 스와이프 내비(app.js의 document 터치 리스너)로
   번지지 않게 버블을 끊는다 */
['touchstart', 'touchmove', 'touchend'].forEach(ev =>
  mount.addEventListener(ev, e => e.stopPropagation(), { passive: true }));

/* --------------------------------------------------------------------------
   씬 구성
   -------------------------------------------------------------------------- */

async function createCube(el) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');

  const F = 54;          /* 면 크기 — 평면 로고 정사각(≈51.6)과 같은 스케일 */
  const D = 3;           /* 익스트루드 두께 */

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'none';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableZoom = false;      /* 회전만 — 오브젝트를 돌리는 감각 */
  controls.rotateSpeed = 0.9;

  /* 조명: 종이 판이 배경(#f5f9fe)에 가까운 흰색으로 뜨도록 밝게.
     면별 밝기 차이(주광 각도)가 입체감을, 글리프 측면 음영이 돋을새김을
     읽게 한다. 어두우면 상자가 콘크리트 회색으로 보인다. */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8eef6, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(4, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xeaf2ff, 0.6);
  fill.position.set(-5, -2, -4);
  scene.add(fill);

  /* 흰 글리프 — 검정 상자 위에서 어느 각도든 또렷하다 */
  const glyphMat = new THREE.MeshStandardMaterial({
    color: 0xf5f9fe, roughness: 0.5, metalness: 0,
  });

  /* --- SVG → 입체 유닛 --- */
  const svg = await new SVGLoader().loadAsync('assets/logo-unit.svg');
  const shapes = svg.paths.flatMap(p => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: D, bevelEnabled: false, curveSegments: 10,
  });
  /* 유닛 중심을 원점으로. y 뒤집기(SVG는 y가 아래로 자란다)는 지오메트리에
     굽지 않고 메시 scale로 처리한다 — 지오메트리에 음수 스케일을 구우면
     삼각형 감김이 뒤집혀 앞면 캡이 깨져 렌더된다(정면에서 글리프가
     허옇게 빠지던 원인). 메시 행렬의 음수 스케일은 Three.js가 감김·법선을
     자동 보정한다. */
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(
    -(bb.min.x + bb.max.x) / 2,
    -(bb.min.y + bb.max.y) / 2,
    -(bb.min.z + bb.max.z) / 2
  );

  /* --- 유닛 4개 → 정사각 한 면 (평면 배치의 좌표·회전 그대로.
         CSS는 y가 아래로, 회전이 시계방향이라 부호를 뒤집는다) --- */
  const s = 24.1 / 241;              /* 241×246(SVG) → 24.1×24.6(배치) */
  const LAYOUT = [
    { x: -13.85, y: -13.65, rot: 0 },            /* bl */
    { x:  13.5,  y: -13.65, rot:  Math.PI / 2 }, /* br (css -90°) */
    { x:  13.75, y:  13.65, rot:  Math.PI },     /* tr (css 180°) */
    { x: -13.6,  y:  13.65, rot: -Math.PI / 2 }, /* tl (css 90°) */
  ];
  const faceAssembly = new THREE.Group();
  LAYOUT.forEach(u => {
    const mesh = new THREE.Mesh(geo, glyphMat);
    mesh.scale.set(s, -s, 1);        /* y 뒤집기 + 배치 스케일 (메시 레벨) */
    mesh.position.set(u.x, u.y, 0);
    mesh.rotation.z = u.rot;
    faceAssembly.add(mesh);
  });

  /* --- 닫힌 종이 상자 + 면 6세트 --------------------------------------------
     속이 빈 골조는 뒷면 글리프가 앞면 사이로 비쳐 24개 덩어리가 겹쳐
     보였다(가독성 붕괴). 배경색 판(솔리드 박스)을 넣어 불투명 상자로
     만들면 한 번에 1~3면만 보인다 — 인쇄물이 찍힌 종이 상자.
     글리프는 반쯤 표면 위로 돋아나 돋을새김으로 읽힌다. */
  const cube = new THREE.Group();

  /* 검정 상자 — 흰 글리프가 어느 각도에서든 또렷하게 뜬다 */
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x131313, roughness: 0.62, metalness: 0,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(F, F, F), boxMat);
  cube.add(box);

  /* 모서리 헤어라인 — 검정 면끼리 맞닿는 경계를 옅은 흰 선이 잡아준다 */
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(box.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  );
  cube.add(edges);

  const FACES = [
    { rx: 0, ry: 0 },                 /* front  */
    { rx: 0, ry: Math.PI },           /* back   */
    { rx: 0, ry: Math.PI / 2 },       /* right  */
    { rx: 0, ry: -Math.PI / 2 },      /* left   */
    { rx: -Math.PI / 2, ry: 0 },      /* top    */
    { rx: Math.PI / 2, ry: 0 },       /* bottom */
  ];
  FACES.forEach(f => {
    const wrap = new THREE.Group();
    wrap.rotation.x = f.rx;
    wrap.rotation.y = f.ry;
    const face = faceAssembly.clone();
    face.position.z = F / 2;          /* 절반은 상자에 묻히고 절반은 돋는다 */
    wrap.add(face);
    cube.add(wrap);
  });
  scene.add(cube);

  /* 처음부터 입방체로 읽히는 3/4 시점 */
  const VIEW_DIR = new THREE.Vector3(0.5, 0.38, 1).normalize();

  function fit() {
    const half = (F * Math.sqrt(3)) / 2;   /* 큐브 대각 반경 */
    const vFov = camera.fov * Math.PI / 180;
    const dH = half / Math.tan(vFov / 2);
    const dW = half / (Math.tan(vFov / 2) * camera.aspect);
    const dist = Math.max(dH, dW) * 1.12;
    camera.position.copy(VIEW_DIR).multiplyScalar(dist);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h);      /* 캔버스 CSS 크기도 인라인 지정(방어적) */
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit();
  }

  let raf = null, running = false;
  function loop() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  return {
    resize,
    start() { if (running) return; running = true; resize(); loop(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); },
  };
}
