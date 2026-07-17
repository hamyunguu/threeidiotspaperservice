/* ==========================================================================
   회전 상태 머신 — TiPS
   --------------------------------------------------------------------------
   헤더는 고정이고, 헤더 아래 분할 영역 전체가 하나의 면으로 회전한다.
   구동 방식은 florisschrama.nl을 모티프로 재구현한 것:

   - 네 면이 한 점에 겹친 카드 스택. 각 면이 사전 회전각(0/-90/180/90)을
     갖고, 컨테이너가 돌면 정면인 면만 보인다(backface-visibility).
   - 상태는 누산 정수 abs로 들고, 이동 delta는 항상 1~3(앞으로만) —
     3→0에서 되감지 않는다(fallforward).
   - 매 전환은 0°에서 delta×90°까지만 돌고, 착지 즉시 컨테이너를 0°로
     리셋하며 면들의 사전 각도를 새 위치 기준으로 재배치한다(리베이스).
     리베이스 없이 각도를 누산하면 ±90° 면에 원근 잔여 왜곡이 남는다.
   - 움직이는 transform은 전부 JS 인라인. CSS는 transition만 선언한다.
     (var/calc 기반 transform은 Safari 트랜지션 버그를 밟는다.)
   ========================================================================== */

(function () {
  'use strict';

  var body = document.body;

  var COUNT = 4;
  var DURATION = 1000;             /* CSS --duration과 맞춘다 */

  var state = { abs: 0, busy: false };

  var carrousel = document.querySelector('.container-carrousel');
  var faces     = [].slice.call(document.querySelectorAll('.container-carrousel .bodier'));

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

  /* 위치 p 기준 면 i의 사전 각도: 현재 0°, 다음 -90°, 반대 180°, 이전 +90° */
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

  /* 트랜지션 없이 transform을 확정해야 할 때 */
  function applyInstant(fn) {
    carrousel.style.transition = 'none';
    fn();
    void carrousel.offsetWidth;
    carrousel.style.transition = '';
  }

  function render() {
    var p = position();
    swapClass('switch-state-position-', p);   /* GNB 활성 색은 CSS가 처리 */

    faces.forEach(function (face, i) {
      var current = (i === p);
      face.classList.toggle('is-current', current);
      face.setAttribute('aria-hidden', current ? 'false' : 'true');
      /* 스크롤 리셋은 여기서 하지 않는다 — 떠나는 면이 아직 화면에
         보이는 시점이라, 여기서 되돌리면 회전 직전에 콘텐츠가 맨 위로
         튕겨 올라가는 게 보인다. 착지 후 land()가 처리한다. */
    });
  }

  /* 착지 처리 --------------------------------------------------------------
     시계(setTimeout)가 아니라 transitionend로 잡는다. 타이머는 트랜지션의
     실제 종료와 어긋날 수 있고, 몇 프레임이라도 먼저 발화하면 회전이
     88~89°인 상태에서 0°로 리베이스되어 끊기는 스냅이 보인다.
     타임아웃은 이벤트가 안 오는 경우(숨긴 탭 등)의 안전망으로만 둔다. */

  var landTimer = null;

  function land() {
    if (!state.busy) return;       /* 이미 착지 처리됨 */
    state.busy = false;
    window.clearTimeout(landTimer);
    swapClass('flag-carrousel-loading-', 'false');
    applyInstant(rebase);          /* 착지 → 0° 리베이스 */

    /* 이제 정면이 아닌 면들은 안 보이므로 스크롤을 조용히 되돌린다 */
    var p = position();
    faces.forEach(function (face, i) {
      if (i === p) return;
      [].slice.call(face.querySelectorAll('.panel')).forEach(function (panel) {
        panel.scrollTop = 0;
      });
    });

    history.replaceState(null, '', '#' + position());
  }

  carrousel.addEventListener('transitionend', function (e) {
    if (e.target === carrousel && e.propertyName === 'transform') land();
  });

  function go(target) {
    if (state.busy) return;

    var delta = ((target - position()) % COUNT + COUNT) % COUNT;
    if (delta === 0) return;

    state.busy = true;
    swapClass('flag-carrousel-loading-', 'true');

    state.abs += delta;            /* 항상 앞으로 */
    render();
    carrousel.style.transform = 'rotateY(' + (delta * 90) + 'deg)';

    landTimer = window.setTimeout(land, DURATION + 200);   /* 안전망 */
  }

  function advance(step) {
    go(((position() + step) % COUNT + COUNT) % COUNT);
  }

  /* 입력 ------------------------------------------------------------------ */

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('.gnb-item') : null;
    if (!link) return;
    e.preventDefault();
    go(Number(link.getAttribute('data-position')));
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); advance(-1); }
    if (e.key >= '1' && e.key <= '4') { e.preventDefault(); go(Number(e.key) - 1); }
  });

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

  var hash = Number(window.location.hash.replace('#', ''));
  if (hash >= 1 && hash < COUNT) state.abs = hash;
  render();
  applyInstant(rebase);
})();
