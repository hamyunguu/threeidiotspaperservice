/* ==========================================================================
   회전 상태 머신 — TiPS
   --------------------------------------------------------------------------
   헤더는 고정이고, 헤더 아래 분할 영역 전체가 하나의 면으로 회전한다.
   구동 방식은 florisschrama.nl을 모티프로 재구현한 것:

   - 정사영 2장 카드 플립. 전환에는 나가는 면과 들어오는 면 두 장만
     참여한다: 나가는 면 0°→-90°(접힘), 들어오는 면 +90°→0°(펼쳐짐).
     나머지 면은 visibility로 합성에서 제외 — 매 전환 4면을 전부
     애니메이션하던 이전 구조는 합성 부하로 프레임드랍이 났다.
   - 정사영이라 공유 3D 공간이 필요 없다. preserve-3d로 두 면이 축
     평면에서 교차하면 합성기가 매 프레임 레이어를 조각내야 해서
     비싸다. z-index 쌓기(들어오는 면이 위)로 대체한다.
   - 상태는 누산 정수 abs로 들고, 이동 delta는 항상 1~3(앞으로만) —
     3→0에서 되감지 않는다(fallforward). 어느 거리든 시각적으로는
     한 번의 책장 넘김이다.
   - 움직이는 transform은 전부 JS 인라인. CSS는 transition만 선언한다.
     (var/calc 기반 transform은 Safari 트랜지션 버그를 밟는다.)
   ========================================================================== */

(function () {
  'use strict';

  var body = document.body;

  var COUNT = 3;                   /* Home / Order / Program */
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

  /* 트랜지션 없이 면 transform을 확정해야 할 때 (전환 시작 각도 배치) */
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
  var flipOutgoing = null;         /* 전환 중인 두 면 */
  var flipIncoming = null;

  function land() {
    if (!state.busy) return;       /* 이미 착지 처리됨 */
    state.busy = false;
    window.clearTimeout(landTimer);
    swapClass('flag-carrousel-loading-', 'false');

    /* 나가는 면을 합성에서 제외하고 스크롤을 조용히 되돌린다 */
    if (flipOutgoing) {
      flipOutgoing.classList.remove('is-flipping');
      [].slice.call(flipOutgoing.querySelectorAll('.panel')).forEach(function (panel) {
        panel.scrollTop = 0;
      });
    }
    flipOutgoing = null;
    flipIncoming = null;

    history.replaceState(null, '', '#' + position());
  }

  /* 면의 transitionend가 컨테이너로 버블된다. 들어오는 면 기준 한 번만. */
  carrousel.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform' && e.target === flipIncoming) land();
  });

  function go(target) {
    if (state.busy) return;

    var p0 = position();
    var delta = ((target - p0) % COUNT + COUNT) % COUNT;
    if (delta === 0) return;

    state.busy = true;
    swapClass('flag-carrousel-loading-', 'true');

    flipOutgoing = faces[p0];
    flipIncoming = faces[target];

    /* 순서 주의: is-flipping을 먼저 붙여야 상태 클래스가 넘어간 뒤에도
       나가는 면이 계속 보인다 */
    flipOutgoing.classList.add('is-flipping');

    state.abs += delta;            /* 항상 앞으로 */
    render();

    /* 시작 각도를 트랜지션 없이 배치한 뒤 목표 각도로 보낸다 */
    applyInstant(function () {
      flipOutgoing.style.transform = 'rotateY(0deg)';
      flipIncoming.style.transform = 'rotateY(90deg)';
    });
    flipOutgoing.style.transform = 'rotateY(-90deg)';
    flipIncoming.style.transform = 'rotateY(0deg)';

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
    if (e.key >= '1' && e.key <= '3') { e.preventDefault(); go(Number(e.key) - 1); }
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

  /* 로딩 화면 걷어내기 — 회전 로고를 줄여 여기로 옮겼다. 폰트·히어로
     이미지까지 받은 뒤(load) 페이드아웃한다. 이벤트를 놓쳐도 화면이
     가려진 채 남지 않도록 타임아웃 안전망을 둔다. */
  var loader = document.getElementById('loader');
  function hideLoader() {
    if (!body.classList.contains('is-loading')) return;
    body.classList.remove('is-loading');
    if (loader) {
      window.setTimeout(function () { loader.style.display = 'none'; }, 600);
    }
  }
  if (document.readyState === 'complete') window.setTimeout(hideLoader, 400);
  else window.addEventListener('load', function () { window.setTimeout(hideLoader, 400); });
  window.setTimeout(hideLoader, 5000);          /* 안전망 */
  /* 초기 transform 배치는 필요 없다 — 현재 면은 상태 클래스가 보이게
     하고, 각도는 전환이 시작될 때 applyInstant가 배치한다 */
})();
