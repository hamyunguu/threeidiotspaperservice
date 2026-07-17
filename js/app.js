/* ==========================================================================
   회전 상태 머신
   --------------------------------------------------------------------------
   JS가 상태값(누산 위치)을 계산해 인라인 transform과 body 클래스에 쓴다.
   보간(1초 ease-in-out)은 CSS의 transition이 담당한다.

   이전 버전은 CSS 커스텀 프로퍼티(var/calc)로 각도를 구동했는데, Safari는
   커스텀 프로퍼티 변경 → 의존하는 transform의 트랜지션 경로에 버그가 있어
   면과 메뉴가 제자리를 잃었다. 인라인 transform 값 변경은 모든 브라우저가
   동일하게 보간하므로 이 방식으로 통일한다. (원본 사이트도 같은 방식이다.)

   상태는 position(0~3)이 아니라 abs(누산 정수)로 들고 있다. 각도가
   abs × 90°로 계속 자라므로 3 → 0으로 갈 때 뒤로 되감기지 않고 앞으로
   돈다(fallforward).
   ========================================================================== */

(function () {
  'use strict';

  var body = document.body;

  var COUNT = 4;
  var DURATION = 1000;             // CSS --duration과 맞춘다

  /* 조에트로프 기하 — CSS의 vw 값과 반드시 일치해야 한다 */
  var P_STEP  = 100 / 3;           // primary: 항목 하나 = 33.3333vw
  var P_MENU  = P_STEP * COUNT;    // 메뉴 한 벌 = 133.333vw
  var P_CYCLE = P_MENU * 2;        // 두 벌이 한 바퀴 = 266.667vw

  var S_STEP  = 100;               // secondary: 제목 하나 = 100vw
  var S_MENU  = S_STEP * COUNT;    // 400vw
  var S_CYCLE = S_MENU * 2;        // 800vw

  var state = {
    abs: 0,          /* 누산 위치. position = abs mod 4, 각도 = abs × 90° */
    busy: false,
    /* 메뉴 두 벌의 현재 오프셋(vw). 원본 관측값과 동일한 초기 배치 */
    pa: -P_STEP,             /* primary 첫 벌  → -33.3333vw */
    pb: -P_STEP + P_MENU,    /* primary 둘째 벌 → 100vw */
    sa: 0,                   /* secondary 첫 벌 */
    sb: S_MENU               /* secondary 둘째 벌 */
  };

  var carrousel = document.querySelector('.container-carrousel');
  var faces     = [].slice.call(document.querySelectorAll('.container-carrousel .bodier'));
  var primary   = [].slice.call(document.querySelectorAll('.menu-container-primary .menu'));
  var secondary = [].slice.call(document.querySelectorAll('.menu-container-secondary .menu'));

  function position() {
    return ((state.abs % COUNT) + COUNT) % COUNT;
  }

  function swapClass(prefix, value) {
    var list = body.className.split(/\s+/).filter(function (c) {
      return c && c.indexOf(prefix) !== 0;
    });
    list.push(prefix + value);
    body.className = list.join(' ');
  }

  /* 상태 → 인라인 transform ------------------------------------------------

     컨테이너 각도는 매 전환마다 0°에서 출발해 delta×90°까지만 돈다.
     착지 후에는 컨테이너를 0°로 리셋하고 면들의 사전 각도를 새 위치
     기준으로 재배치한다(rebase). 원본 사이트가 착지 상태에서 항상
     컨테이너 transform이 항등행렬인 이유가 이것이다.

     리베이스 없이 각도를 누산하면(abs×90°) 컨테이너의 affine 회전과
     그 안의 perspective가 합성될 때 ±90° 위치의 면에 원근 잔여 왜곡이
     남는다 — 착지했는데 면이 사다리꼴로 뒤틀려 보이는 원인. 0°/180°
     에서는 상쇄되어 멀쩡하기 때문에 절반의 면에서만 드러난다. */

  function menuTransforms() {
    if (primary[0])   primary[0].style.transform   = 'translate3d(' + state.pa + 'vw, 0, 0)';
    if (primary[1])   primary[1].style.transform   = 'translate3d(' + state.pb + 'vw, 0, 0)';
    if (secondary[0]) secondary[0].style.transform = 'translate3d(' + state.sa + 'vw, 0, 0)';
    if (secondary[1]) secondary[1].style.transform = 'translate3d(' + state.sb + 'vw, 0, 0)';
  }

  /* 위치 p 기준 면 i의 사전 각도: 현재 면 0°, 다음 -90°, 반대 180°, 이전 +90° */
  function faceAngle(i, p) {
    return -(((i - p) % COUNT + COUNT) % COUNT) * 90;
  }

  function rebase() {
    var p = position();
    carrousel.style.transform = 'rotateY(0deg)';
    faces.forEach(function (face, i) {
      face.style.transform = 'rotateY(' + faceAngle(i, p) + 'deg)';
    });
  }

  /* 트랜지션 없이 transform을 확정해야 할 때 (초기 배치, 조에트로프 재활용) */
  function applyInstant(els, fn) {
    els.forEach(function (el) { el.style.transition = 'none'; });
    fn();
    els.forEach(function (el) { void el.offsetWidth; el.style.transition = ''; });
  }

  function render() {
    var p = position();

    /* 잉크색(Studio 빨강/나머지 파랑)과 상태 표시는 이 클래스가 정한다 */
    swapClass('switch-state-position-', p);

    /* 정면인 면에만 스크롤과 포커스를 허용한다.
       스크롤 컨테이너는 .bodier가 아니라 그 안의 .content다 — .bodier는
       3D 변환 대상이라 overflow를 걸 수 없다(style.css 참고). */
    faces.forEach(function (face, i) {
      var current = (i === p);
      face.classList.toggle('is-current', current);
      face.setAttribute('aria-hidden', current ? 'false' : 'true');
      if (!current) {
        var scroller = face.querySelector('.content');
        if (scroller) scroller.scrollTop = 0;
      }
    });

    /* 현재 섹션 링크 표시 */
    [].slice.call(document.querySelectorAll('.menu-item')).forEach(function (item) {
      var pos = item.getAttribute('data-position');
      if (pos !== null) item.classList.toggle('current', Number(pos) === p);
    });
  }

  /* 조에트로프 재활용 ------------------------------------------------------
     메뉴가 화면 밖으로 완전히 빠져나간 순간에만 반대편으로 순간이동시킨다.
     offset = -MENU 면 오른쪽 끝이 0vw(화면 왼쪽 경계)라 이미 안 보이고,
     +MENU 면 왼쪽 끝이 133vw라 역시 안 보인다. 두 '안 보이는 상태' 사이를
     건너뛰므로 점프가 눈에 띄지 않는다. 조에트로프의 원리 그대로다. */

  function recycleAll() {
    var moved = false;
    if (state.pa <= -P_MENU + 0.001) { state.pa += P_CYCLE; moved = true; }
    if (state.pb <= -P_MENU + 0.001) { state.pb += P_CYCLE; moved = true; }
    if (state.sa <= -S_MENU + 0.001) { state.sa += S_CYCLE; moved = true; }
    if (state.sb <= -S_MENU + 0.001) { state.sb += S_CYCLE; moved = true; }
    if (moved) applyInstant(primary.concat(secondary), menuTransforms);
  }

  /* 이동 ------------------------------------------------------------------ */

  function go(target) {
    if (state.busy) return;

    var delta = ((target - position()) % COUNT + COUNT) % COUNT;
    if (delta === 0) return;       /* 이미 그 면이다 */

    state.busy = true;
    swapClass('flag-carrousel-loading-', 'true');

    state.abs += delta;            /* 항상 앞으로 — 되감지 않는다 */
    state.pa  -= P_STEP * delta;
    state.pb  -= P_STEP * delta;
    state.sa  -= S_STEP * delta;
    state.sb  -= S_STEP * delta;

    render();

    /* 컨테이너는 0°에서 delta×90°로 돈다. delta는 1~3(항상 앞) */
    carrousel.style.transform = 'rotateY(' + (delta * 90) + 'deg)';
    menuTransforms();              /* 인라인 값 변경 → CSS transition이 보간 */

    window.setTimeout(function () {
      state.busy = false;
      swapClass('flag-carrousel-loading-', 'false');
      applyInstant([carrousel], rebase);   /* 착지 → 0°로 리베이스 */
      recycleAll();
      history.replaceState(null, '', '#' + position());
    }, DURATION);
  }

  function advance(step) {
    go(((position() + step) % COUNT + COUNT) % COUNT);
  }

  /* 입력 ------------------------------------------------------------------ */

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('.menu-item a') : null;
    if (!link) return;
    e.preventDefault();
    var item = link.closest('.menu-item');
    var pos = item.getAttribute('data-position');
    if (pos === null) {
      pos = [].slice.call(item.parentNode.children).indexOf(item);
    }
    go(Number(pos));
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); advance(-1); }
    if (e.key >= '1' && e.key <= '4') { e.preventDefault(); go(Number(e.key) - 1); }
  });

  /* 터치 스와이프 */
  var touchX = null;
  document.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 60) return;
    advance(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* 시작 ------------------------------------------------------------------
     초기 배치는 애니메이션 없이 확정한다. */

  var hash = Number(window.location.hash.replace('#', ''));
  if (hash >= 1 && hash < COUNT) {
    state.abs = hash;
    state.pa -= P_STEP * hash;
    state.pb -= P_STEP * hash;
    state.sa -= S_STEP * hash;
    state.sb -= S_STEP * hash;
  }
  render();
  applyInstant([carrousel].concat(primary).concat(secondary), function () {
    rebase();
    menuTransforms();
  });
  recycleAll();
})();
