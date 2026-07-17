/* ==========================================================================
   회전 상태 머신
   --------------------------------------------------------------------------
   JS가 하는 일은 단 하나 — 상태값을 계산해서 body의 클래스와 커스텀
   프로퍼티에 써넣는 것. 회전도 슬라이드도 전부 CSS가 한다.

   상태는 position(0~3)이 아니라 abs(누산 정수)로 들고 있다. 그래야
   3 → 0으로 갈 때 뒤로 되감기지 않고 계속 앞으로 돈다(fallforward).
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
    abs: 0,          /* 누산 위치. position = abs mod 4 */
    busy: false,
    /* 메뉴 두 벌의 현재 오프셋(vw). 관측값과 동일한 초기 배치 */
    pa: -P_STEP,     /* primary 첫 벌  → -33.3333vw */
    pb: -P_STEP + P_MENU, /* primary 둘째 벌 → 100vw */
    sa: 0,           /* secondary 첫 벌 */
    sb: S_MENU       /* secondary 둘째 벌 */
  };

  var carrousel = document.querySelector('.container-carrousel');
  var faces     = [].slice.call(document.querySelectorAll('.container-carrousel .bodier'));
  var primary   = [].slice.call(document.querySelectorAll('.menu-container-primary .menu'));
  var secondary = [].slice.call(document.querySelectorAll('.menu-container-secondary .menu'));

  function position() {
    return ((state.abs % COUNT) + COUNT) % COUNT;
  }

  function swapClass(prefix, value) {
    var next = prefix + value;
    var list = body.className.split(/\s+/).filter(function (c) {
      return c && c.indexOf(prefix) !== 0;
    });
    list.push(next);
    body.className = list.join(' ');
  }

  function setVar(name, value) {
    body.style.setProperty(name, String(value));
  }

  /* 상태 → DOM 반영 -------------------------------------------------------- */

  function render() {
    var p = position();

    swapClass('switch-state-position-', p);
    swapClass('switch-zoetrope-position-primary-', p);
    swapClass('switch-zoetrope-position-secondary-', p);

    /* 캐러셀 각도 = turns*360 + 클래스가 정한 각도.
       abs*90 을 두 항으로 쪼개면 turns = floor(abs/4). */
    setVar('--turns', Math.floor(state.abs / COUNT));

    setVar('--zoe-a', state.pa);
    setVar('--zoe-b', state.pb);
    setVar('--zoe-c', state.sa);
    setVar('--zoe-d', state.sb);

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
     offset = -MENU 이면 오른쪽 끝이 0vw(화면 왼쪽 경계)라 이미 안 보이고,
     +MENU 이면 왼쪽 끝이 133vw라 역시 안 보인다. 두 '안 보이는 상태' 사이를
     건너뛰므로 점프가 눈에 띄지 않는다. 이게 조에트로프의 원리 그대로다. */

  function recycle(el, offset, menuW, cycle) {
    if (offset > -menuW + 0.001) return offset;   /* 아직 화면에 걸쳐 있다 */
    var next = offset + cycle;
    el.style.transition = 'none';
    el.style.transform = 'translate3d(' + next + 'vw, 0, 0)';
    void el.offsetWidth;                          /* 강제 리플로우 */
    el.style.transition = '';
    el.style.transform = '';
    return next;
  }

  function recycleAll() {
    if (primary[0])   state.pa = recycle(primary[0],   state.pa, P_MENU, P_CYCLE);
    if (primary[1])   state.pb = recycle(primary[1],   state.pb, P_MENU, P_CYCLE);
    if (secondary[0]) state.sa = recycle(secondary[0], state.sa, S_MENU, S_CYCLE);
    if (secondary[1]) state.sb = recycle(secondary[1], state.sb, S_MENU, S_CYCLE);
    render();
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

    window.setTimeout(function () {
      state.busy = false;
      swapClass('flag-carrousel-loading-', 'false');
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
    var item = link.closest('.menu-item');
    var pos = item && item.getAttribute('data-position');
    e.preventDefault();
    /* 복제된 메뉴에는 data-position이 없으므로 인덱스로 되짚는다 */
    if (pos === null || pos === undefined) {
      var siblings = [].slice.call(item.parentNode.children);
      pos = siblings.indexOf(item);
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

  /* 시작 ------------------------------------------------------------------ */

  swapClass('flag-javascript-', 'true');

  var hash = Number(window.location.hash.replace('#', ''));
  if (hash >= 0 && hash < COUNT && !isNaN(hash) && hash !== 0) {
    /* 초기 위치는 애니메이션 없이 맞춘다 */
    state.abs = hash;
    state.pa -= P_STEP * hash;
    state.pb -= P_STEP * hash;
    state.sa -= S_STEP * hash;
    state.sb -= S_STEP * hash;
    carrousel.style.transition = 'none';
    render();
    void carrousel.offsetWidth;
    carrousel.style.transition = '';
    recycleAll();
  } else {
    render();
  }
})();
