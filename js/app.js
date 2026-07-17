/* ==========================================================================
   회전 상태 머신 — TiPS
   --------------------------------------------------------------------------
   헤더는 고정이고, 헤더 아래 분할 영역 전체가 하나의 면으로 회전한다.
   구동 방식은 florisschrama.nl을 모티프로 재구현한 것:

   - 네 면이 한 점에 겹친 카드 스택. 컨테이너는 돌지 않고 원근만
     제공하며, 회전은 네 면이 동시에 자기 각도를 바꾸는 것이다.
     정적 원근 아래에서 도는 면은 착지 순간 정확히 평면이 된다 —
     회전하는 요소 자신에게 원근을 붙이면 착지 순간에도 원근 잔여
     왜곡이 남아 매 전환 끝에 스냅이 보인다.
   - 정면인 면만 보이는 것은 backface-visibility와 모서리 각도가 처리.
   - 상태는 누산 정수 abs로 들고, 이동 delta는 항상 1~3(앞으로만) —
     3→0에서 되감지 않는다(fallforward).
   - 착지 후 각도 정규화(rebase)는 mod 360이라 렌더가 동일 — 무음이다.
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

  /* 회전 구조: 컨테이너는 원근만 제공하고 돌지 않는다. 회전은 네 면이
     동시에 자기 각도를 바꾸는 것이다. 위치 p 기준 면 i의 정규화 각도:
     현재 면 0°, 다음 90°, 반대 180°, 이전 270°. */
  function faceAngle(i, p) {
    return (((i - p) % COUNT + COUNT) % COUNT) * 90;
  }

  /* 착지 후 각도 정규화. 전환 중 각도는 0~270에서 delta×90만큼 내려가
     음수가 되는데, rotateY(-90°)와 rotateY(270°)는 렌더가 동일하므로
     이 리셋은 눈에 보이지 않는다. */
  function rebase() {
    var p = position();
    faces.forEach(function (face, i) {
      face.style.transform = 'rotateY(' + faceAngle(i, p) + 'deg)';
    });
  }

  /* 트랜지션 없이 면 transform을 확정해야 할 때 */
  function applyInstant(fn) {
    faces.forEach(function (face) { face.style.transition = 'none'; });
    fn();
    void carrousel.offsetWidth;
    faces.forEach(function (face) { face.style.transition = ''; });
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

  /* 면들의 transitionend가 컨테이너로 버블된다. 네 면이 동시에 끝나지만
     land()는 busy 플래그로 한 번만 실행된다. */
  carrousel.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform' && faces.indexOf(e.target) !== -1) land();
  });

  function go(target) {
    if (state.busy) return;

    var p0 = position();
    var delta = ((target - p0) % COUNT + COUNT) % COUNT;
    if (delta === 0) return;

    state.busy = true;
    swapClass('flag-carrousel-loading-', 'true');

    state.abs += delta;            /* 항상 앞으로 */
    render();

    /* 모든 면이 이전 위치 기준 정규화 각도에서 delta×90°만큼 감소 —
       도착 면(p0+delta)은 delta×90 − delta×90 = 정확히 0°에 착지한다 */
    faces.forEach(function (face, i) {
      face.style.transform = 'rotateY(' + (faceAngle(i, p0) - delta * 90) + 'deg)';
    });

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
