/* ==========================================================================
   Home 히어로 — 4슬라이드 (스크롤 · 화살표 · 스와이프)
   --------------------------------------------------------------------------
   좌: 아이브로 + 국문/영문 2단 텍스트, 우: 슬라이드별 이미지(교차 페이드).
   Figma 104:80 기준. 슬라이드가 바뀔 때마다 우측 이미지도 함께 바뀐다.

   Home 면이 정면(position 0)일 때만 입력을 받는다. 다른 면에서 스크롤이
   히어로를 넘기면 안 되기 때문이다.
   ========================================================================== */

(function () {
  'use strict';

  /* --- 슬라이드 데이터 ---------------------------------------------------
     slide 1은 Figma 104:80 실측 그대로.
     TODO(slides 2–4): Figma 노드 링크를 받으면 문구·이미지를 교체한다.
     지금은 기존 사이트 카피를 나눠 담은 임시 콘텐츠다.
     -------------------------------------------------------------------- */

  var HERO = [
    {
      eyebrow: 'For who feels like',
      kr: '인쇄 앞에서는 우리 모두가 조금은 얼간이가 됩니다. 어떤 종이를 고를지, ' +
          '어떤 방법으로 묶을지, 무엇을 물어봐야 할지 몰라 매번 묻고, 찾고, 다시 확인합니다.' +
          '<br><br>팁스는 그 경험에서 시작합니다.<br>' +
          '<span class="hl">인쇄 앞에서 얼간이가 되는 사람들을 위해.</span>',
      en: '<p>In front of a printing, we all become idiots. Not knowing paper to choose, ' +
          'how to bind, or even what to ask, we find ourselves questioning, searching, ' +
          'and double-checking every single time.</p>' +
          '<p>TiPS starts from that very experience. ' +
          '<span class="hl">For everyone who feels like an idiot in front of print.</span></p>',
      img: 'assets/hero-1.jpg',
      alt: 'TiPS 브랜딩 포스터 목업',
    },
    {
      eyebrow: 'Testing impressions',
      kr: '인상의 실험. 종이와 잉크가 만나는 순간을 직접 눌러보고, 비교하고, ' +
          '고쳐봅니다.<br><br><span class="hl">고르는 일이 아니라 실험하는 일로.</span>',
      en: '<p>Pressing, comparing, and correcting the moment paper meets ink.</p>' +
          '<p><span class="hl">Not choosing, but experimenting.</span></p>',
      img: 'assets/poster-mockup.jpg',
      alt: '브랜딩 포스터 목업',
    },
    {
      eyebrow: 'Tying insights',
      kr: '인사이트 엮기. 흩어진 감각을 한 권으로 묶습니다. 제본은 마감이 아니라 ' +
          '편집의 방법입니다.<br><br><span class="hl">묶는 방식이 곧 이야기의 방식.</span>',
      en: '<p>Binding scattered senses into one volume. Binding is not a finish ' +
          'but a way of editing.</p>' +
          '<p><span class="hl">How you bind is how you tell.</span></p>',
      img: 'assets/namecard.jpg',
      alt: 'TiPS 명함',
    },
    {
      eyebrow: 'Three ideas',
      kr: '세 얼간이의 아이디어. 브랜딩, UX/UI, 편집과 공간을 하나로 엮어 ' +
          '새로운 인쇄 문화를 제안합니다.<br><br>' +
          '<span class="hl">인쇄소를 실험과 탐구의 장으로.</span>',
      en: '<p>Weaving branding, UX/UI, editorial and spatial design into a single ' +
          'proposal for a new printing culture.</p>' +
          '<p><span class="hl">Turning the print shop into a place of inquiry.</span></p>',
      img: 'assets/space-mockup.jpg',
      alt: 'TiPS 공간 목업',
    },
  ];

  var slidesEl = document.getElementById('heroSlides');
  var rightEl  = document.getElementById('heroRight');
  var countEl  = document.getElementById('heroCount');
  var totalEl  = document.getElementById('heroTotal');
  var arrowEl  = document.getElementById('heroArrow');
  if (!slidesEl || !rightEl) return;

  var index = 0;
  var busy = false;

  /* --- 렌더 -------------------------------------------------------------- */

  function build() {
    var left = '', right = '';
    HERO.forEach(function (s, i) {
      var on = i === 0 ? ' is-on' : '';
      left +=
        '<article class="hero-slide' + on + '" data-slide="' + i + '" ' +
                 'aria-hidden="' + (i === 0 ? 'false' : 'true') + '">' +
          '<p class="hero-eyebrow">' + s.eyebrow + '</p>' +
          '<div class="hero-cols">' +
            '<div class="hero-kr">' + s.kr + '</div>' +
            '<div class="hero-en">' + s.en + '</div>' +
          '</div>' +
        '</article>';
      right +=
        '<img class="hero-img' + on + '" data-slide="' + i + '" ' +
             'src="' + s.img + '" alt="' + s.alt + '" ' +
             (i === 0 ? '' : 'loading="lazy" ') + '>';
    });
    slidesEl.innerHTML = left;
    rightEl.innerHTML = right;
    if (totalEl) totalEl.textContent = HERO.length;
  }

  function show(next) {
    next = ((next % HERO.length) + HERO.length) % HERO.length;
    if (next === index || busy) return;
    busy = true;

    var prev = index;
    index = next;

    [slidesEl, rightEl].forEach(function (root) {
      var out = root.querySelector('[data-slide="' + prev + '"]');
      var into = root.querySelector('[data-slide="' + next + '"]');
      if (out) { out.classList.remove('is-on'); out.setAttribute('aria-hidden', 'true'); }
      if (into) { into.classList.add('is-on'); into.setAttribute('aria-hidden', 'false'); }
    });

    if (countEl) countEl.textContent = index + 1;

    /* 페이드가 끝나기 전 연속 입력을 막는다(CSS --hero-fade와 맞춘다) */
    window.setTimeout(function () { busy = false; }, 420);
  }

  /* --- 입력 -------------------------------------------------------------- */

  /* Home 면이 정면일 때만 반응한다 */
  function homeActive() {
    return document.body.classList.contains('switch-state-position-0') &&
           !document.body.classList.contains('flag-carrousel-loading-true');
  }

  if (arrowEl) {
    arrowEl.addEventListener('click', function () {
      if (homeActive()) show(index + 1);
    });
  }

  /* 휠 — 한 번의 제스처가 여러 이벤트를 쏟아내므로 busy로 걸러낸다 */
  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    if (!homeActive()) return;
    if (Math.abs(e.deltaY) < 8) return;
    e.preventDefault();
    if (wheelLock || busy) return;
    wheelLock = true;
    show(index + (e.deltaY > 0 ? 1 : -1));
    window.setTimeout(function () { wheelLock = false; }, 480);
  }, { passive: false });

  /* 세로 스와이프 — 가로 스와이프는 app.js의 면 전환이 가져간다 */
  var touchY = null, touchX0 = null;
  window.addEventListener('touchstart', function (e) {
    touchY = e.changedTouches[0].clientY;
    touchX0 = e.changedTouches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (touchY === null || !homeActive()) { touchY = null; return; }
    var dy = e.changedTouches[0].clientY - touchY;
    var dx = e.changedTouches[0].clientX - touchX0;
    touchY = null;
    if (Math.abs(dy) < 60 || Math.abs(dy) < Math.abs(dx)) return;
    show(index + (dy < 0 ? 1 : -1));
  }, { passive: true });

  /* 위/아래 방향키 — 좌우는 app.js가 면 전환에 쓴다 */
  document.addEventListener('keydown', function (e) {
    if (!homeActive() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); show(index - 1); }
  });

  build();
})();
