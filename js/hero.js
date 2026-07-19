/* ==========================================================================
   Home 히어로 — 4슬라이드 (스크롤 · 화살표 · 스와이프)
   --------------------------------------------------------------------------
   Figma: 1/4 104:80, 2/4 69:1881, 3/4 69:1061, 4/4 116:142

   좌: 슬라이드별 본문, 우: 슬라이드별 이미지. 둘 다 교차 페이드로 바뀐다.
   카운터(n/4)와 화살표는 슬라이드 바깥에 고정돼 있어 전환 중에도 자리가
   움직이지 않는다 — 본문만 갈아끼운다.

   화살표 방향: 1~3은 아래(다음), 4는 위(1로 복귀). 방향이 바뀔 때마다
   누적 각도에 +180을 더해 항상 시계방향으로 돈다. 4→1도 되감지 않고
   같은 방향으로 이어 돈다.

   Home 면이 정면(position 0)일 때만 입력을 받는다. 다른 면에서 스크롤이
   히어로를 넘기면 안 되기 때문이다.
   ========================================================================== */

(function () {
  'use strict';

  /* --- 슬라이드 데이터 (Figma 실측 문구 그대로) ------------------------- */

  var HERO = [
    {
      eyebrow: 'For who feels like',
      img: 'assets/hero-1.jpg',
      alt: 'TiPS 브랜딩 포스터 목업',
      body:
        '<div class="hero-cols">' +
          '<div class="hero-kr">' +
            '인쇄 앞에서는 우리 모두가 조금은 얼간이가 됩니다. 어떤 종이를 고를지, ' +
            '어떤 방법으로 묶을지, 무엇을 물어봐야 할지 몰라 매번 묻고, 찾고, 다시 확인합니다.' +
            '<br><br>팁스는 그 경험에서 시작합니다.<br>' +
            '<span class="hl">인쇄 앞에서 얼간이가 되는 사람들을 위해.</span>' +
          '</div>' +
          '<div class="hero-en">' +
            '<p>In front of a printing, we all become idiots. Not knowing paper to choose, ' +
            'how to bind, or even what to ask, we find ourselves questioning, searching, ' +
            'and double-checking every single time.</p>' +
            '<p>TiPS starts from that very experience. ' +
            '<span class="hl">For everyone who feels like an idiot in front of print.</span></p>' +
          '</div>' +
        '</div>',
    },

    {
      eyebrow: 'Three idiots paper service',
      img: 'assets/hero-2.jpg',
      alt: 'TiPS 티셔츠',
      body:
        '<div class="hero-cols">' +
          '<div class="hero-kr">' +
            'TiPS(Three idiots Paper Service)는 낯설고 막막하게만 느껴지던 인쇄소에서의 ' +
            '경험을 능동적인 실험과 탐구의 장으로 탈바꿈시키는 인쇄 브랜드입니다.' +
          '</div>' +
          '<div class="hero-kr hero-kr-loose">' +
            '<p>제본에 익숙한 창작자에게는 새로운 형식과 구조를 실험하며 교류할 수 있는 환경을,</p>' +
            '<p>처음 제본을 접하는 사람에게는 재료와 방식을 탐색할 수 있는 경험을 제공합니다. ' +
            '오픈 스튜디오, 워크숍, 전시, 토크 등 다양한 프로그램을 통해 제본의 과정과 ' +
            '가능성을 함께 발견하는 문화를 만들어갑니다.</p>' +
          '</div>' +
        '</div>' +
        /* 값 다이어그램 — 원 위에 라벨을 얹고, 라벨 배경으로 원 선을 가른다 */
        '<div class="hero-circle-wrap" aria-hidden="true">' +
          '<div class="hero-circle"></div>' +
          '<div class="circle-label label-testing">' +
            '<p class="w1">TESTING</p><p class="w2">impressions</p></div>' +
          '<div class="circle-label label-tying">' +
            '<p class="w1">TYING</p><p class="w2">insights</p></div>' +
          '<div class="circle-label label-three">' +
            '<p class="w1">THREE</p><p class="w2">ideas</p></div>' +
        '</div>',
    },

    {
      /* 원문 표기 그대로 — Figma에 'INDENDITY'로 되어 있다 */
      eyebrow: 'Visual indendity',
      img: 'assets/hero-3.jpg',
      alt: 'TiPS 책등',
      body:
        '<div class="hero-logo">' +
          '<img class="hero-logo-guides" src="assets/logo-guides.png" alt="">' +
          '<img class="hero-logo-mark" src="assets/logo-lockup.png" alt="TiPS 로고">' +
        '</div>' +
        '<p class="hero-wordmark">' +
          '<span class="w-script">an idiots</span>' +
          '<span class="w-caps">AT THE PRINT SHOP</span>' +
        '</p>',
    },

    {
      eyebrow: 'Idiots info.',
      img: 'assets/hero-4.jpg',
      alt: 'TiPS 명함',
      arrowUp: true,
      body:
        '<div class="hero-cols hero-info">' +
          '<div>' +
            '<p class="info-key">Member</p>' +
            '<p class="info-val">김한주<span class="sep">I</span>Kim Hanju<br>' +
              '윤찬혁<span class="sep">I</span>Yoon Chanhyeok<br>' +
              '함윤규<span class="sep">I</span>Ham Yungyu</p>' +
            '<p class="info-key">Location</p>' +
            '<p class="info-val">서울 광진구 능동로 145 B1-2F, 05010<br>' +
              '05010, B1-2F, 145 Neungdong-ro,<br>' +
              'Gwangjin-gu, Seoul, South Korea</p>' +
          '</div>' +
          '<div>' +
            '<p class="info-key">Contact</p>' +
            '<p class="info-val">donejuicy@gmail.com<br>' +
              'hauhynk@gmail.com<br>' +
              'hamyunguu@gmail.com</p>' +
          '</div>' +
        '</div>',
    },
  ];

  var slidesEl = document.getElementById('heroSlides');
  var rightEl  = document.getElementById('heroRight');
  var countEl  = document.getElementById('heroCount');
  var totalEl  = document.getElementById('heroTotal');
  var arrowEl  = document.getElementById('heroArrow');
  var arrowSvg = arrowEl ? arrowEl.querySelector('svg') : null;
  if (!slidesEl || !rightEl) return;

  var index = 0;
  var busy = false;
  var arrowDeg = 90;               /* 아래를 가리키는 기본 각도 */

  /* --- 렌더 -------------------------------------------------------------- */

  function build() {
    var left = '', right = '';
    HERO.forEach(function (s, i) {
      var on = i === 0 ? ' is-on' : '';
      left +=
        '<article class="hero-slide' + on + '" data-slide="' + i + '" ' +
                 'aria-hidden="' + (i === 0 ? 'false' : 'true') + '">' +
          '<p class="hero-eyebrow">' + s.eyebrow + '</p>' +
          s.body +
        '</article>';
      right +=
        '<img class="hero-img' + on + '" data-slide="' + i + '" ' +
             'src="' + s.img + '" alt="' + s.alt + '" ' +
             (i === 0 ? '' : 'loading="lazy" ') + '>';
    });
    slidesEl.innerHTML = left;
    rightEl.innerHTML = right;
    if (totalEl) totalEl.textContent = HERO.length;
    applyArrow(0);
  }

  /* 화살표는 자리를 지키고 각도만 바뀐다. 방향이 달라지면 +180씩 누적해
     언제나 시계방향으로 돈다(4→1 복귀도 되감지 않는다). */
  function applyArrow(next) {
    if (!arrowSvg) return;
    var wasUp = !!HERO[index].arrowUp;
    var willUp = !!HERO[next].arrowUp;
    if (wasUp !== willUp) arrowDeg += 180;
    arrowSvg.style.transform = 'rotate(' + arrowDeg + 'deg)';
    arrowEl.setAttribute('aria-label', willUp ? '처음 슬라이드로' : '다음 슬라이드');
  }

  function show(next) {
    next = ((next % HERO.length) + HERO.length) % HERO.length;
    if (next === index || busy) return;
    busy = true;

    applyArrow(next);

    var prev = index;
    index = next;

    [slidesEl, rightEl].forEach(function (root) {
      var out = root.querySelector('[data-slide="' + prev + '"]');
      var into = root.querySelector('[data-slide="' + next + '"]');
      if (out) { out.classList.remove('is-on'); out.setAttribute('aria-hidden', 'true'); }
      if (into) { into.classList.add('is-on'); into.setAttribute('aria-hidden', 'false'); }
    });

    if (countEl) countEl.textContent = index + 1;
    slidesEl.scrollTop = 0;

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

  /* 휠 — 한 번의 제스처가 여러 이벤트를 쏟아내므로 잠금으로 걸러낸다.
     본문이 패널보다 길면(2/4의 원 다이어그램) 먼저 스크롤하고, 끝에
     닿았을 때만 슬라이드를 넘긴다. */
  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    if (!homeActive()) return;
    if (Math.abs(e.deltaY) < 8) return;

    var down = e.deltaY > 0;
    var max = slidesEl.scrollHeight - slidesEl.clientHeight;
    var atEnd = down ? slidesEl.scrollTop >= max - 1 : slidesEl.scrollTop <= 1;
    if (max > 1 && !atEnd) return;          /* 패널 내부 스크롤에 양보 */

    e.preventDefault();
    if (wheelLock || busy) return;
    wheelLock = true;
    show(index + (down ? 1 : -1));
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
