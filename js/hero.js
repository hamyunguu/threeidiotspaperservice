/* ==========================================================================
   Home 히어로 — 4슬라이드 (스크롤 · 화살표 · 스와이프)
   --------------------------------------------------------------------------
   Figma: 1/4 104:80, 2/4 69:1881, 3/4 69:1061, 4/4 116:142

   좌: 실제로 세로 스크롤된다(스크롤 스냅으로 한 장씩 맞춤).
   우: 좌측 스크롤에 맞춰 이미지만 디졸브로 바뀐다.
   카운터(n/4)와 화살표는 스크롤 컨테이너 바깥에 있어 자리가 고정된다.

   스크롤 위치가 상태의 원천이다. 휠·트랙패드·스와이프는 네이티브에
   맡기므로, 마지막 장(4/4)에서 아래로 더 내려도 처음으로 순환하지
   않는다 — 위로 올려야 되돌아간다.

   화살표 방향: 1~3은 아래(다음), 4는 위(처음으로). 방향이 바뀔 때마다
   누적 각도에 +180을 더해 항상 시계방향으로 돈다(되감지 않는다).

   Home 면이 정면(position 0)일 때만 화살표·방향키를 받는다.
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
  var arrowDeg = 90;               /* 아래를 가리키는 기본 각도 */

  /* --- 렌더 -------------------------------------------------------------- */

  function build() {
    var left = '', right = '';
    HERO.forEach(function (s, i) {
      left +=
        '<article class="hero-slide" data-slide="' + i + '">' +
          '<p class="hero-eyebrow">' + s.eyebrow + '</p>' +
          s.body +
        '</article>';
      right +=
        '<img class="hero-img' + (i === 0 ? ' is-on' : '') + '" data-slide="' + i + '" ' +
             'src="' + s.img + '" alt="' + s.alt + '" ' +
             (i === 0 ? '' : 'loading="lazy" ') + '>';
    });
    slidesEl.innerHTML = left;
    rightEl.innerHTML = right;
    if (totalEl) totalEl.textContent = HERO.length;
    setArrow(0);
    Array.prototype.forEach.call(slidesEl.children, function (el, i) {
      el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
  }

  /* 화살표는 자리를 지키고 각도만 바뀐다. 방향이 달라지면 +180씩 누적해
     언제나 시계방향으로 돈다(되감지 않는다). */
  function setArrow(next) {
    if (!arrowSvg) return;
    var wasUp = !!HERO[index].arrowUp;
    var willUp = !!HERO[next].arrowUp;
    if (wasUp !== willUp) arrowDeg += 180;
    arrowSvg.style.transform = 'rotate(' + arrowDeg + 'deg)';
    arrowEl.setAttribute('aria-label', willUp ? '처음 슬라이드로' : '다음 슬라이드');
  }

  /* 스크롤 위치가 상태의 원천이다. 좌측은 실제로 스크롤되고, 그에 맞춰
     카운터·화살표·우측 이미지만 갱신한다(우측만 디졸브). */
  function sync(next) {
    next = Math.max(0, Math.min(HERO.length - 1, next));
    if (next === index) return;

    setArrow(next);
    index = next;

    if (countEl) countEl.textContent = index + 1;

    var on = rightEl.querySelector('.hero-img.is-on');
    var into = rightEl.querySelector('.hero-img[data-slide="' + index + '"]');
    if (on && on !== into) on.classList.remove('is-on');
    if (into) into.classList.add('is-on');

    Array.prototype.forEach.call(slidesEl.children, function (el, i) {
      el.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
  }

  /* 스크롤 위치를 훑어 현재 장을 판단한다. 관성/스냅 중에도 마지막
     이벤트가 최종 위치를 담으므로 짧은 지연으로 한 번 더 확인한다. */
  var throttle = null, settle = null, lockUntil = 0;
  function onScroll() {
    /* 화살표·방향키로 이동하는 중에는 중간 위치가 상태를 되돌리지 않게
       잠근다(카운터가 2→1→2로 깜빡이던 문제). */
    if (Date.now() < lockUntil) return;
    if (throttle) return;
    throttle = window.setTimeout(function () {
      throttle = null;
      sync(Math.round(slidesEl.scrollTop / (slidesEl.clientHeight || 1)));
    }, 60);
    window.clearTimeout(settle);
    settle = window.setTimeout(function () {
      sync(Math.round(slidesEl.scrollTop / (slidesEl.clientHeight || 1)));
    }, 140);
  }
  slidesEl.addEventListener('scroll', onScroll, { passive: true });

  /* 지정한 장으로 이동 — 스냅 컨테이너에서는 scrollIntoView가 가장
     자연스럽게 맞아 들어간다. 이동이 끝난 뒤 상태도 한 번 맞춰 준다. */
  function goTo(i) {
    i = Math.max(0, Math.min(HERO.length - 1, i));
    var el = slidesEl.children[i];
    if (!el) return;
    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lockUntil = Date.now() + (reduce ? 0 : 700);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    sync(i);                       /* 클릭에 즉시 반응하고, 잠금이 풀린 뒤
                                      스크롤 핸들러가 실제 위치로 재확인한다 */
  }

  /* --- 입력 -------------------------------------------------------------- */

  /* Home 면이 정면일 때만 반응한다 */
  function homeActive() {
    return document.body.classList.contains('switch-state-position-0') &&
           !document.body.classList.contains('flag-carrousel-loading-true');
  }

  /* 스크롤(휠·트랙패드·스와이프)은 네이티브에 맡긴다 — 마지막 장에서
     아래로 더 내려도 처음으로 돌아가지 않는다. 위로 올려야 되돌아간다.
     화살표는 1~3에서 다음 장, 4에서는 위를 가리키며 처음으로 돌아간다. */
  if (arrowEl) {
    arrowEl.addEventListener('click', function () {
      if (!homeActive()) return;
      goTo(HERO[index].arrowUp ? 0 : index + 1);
    });
  }

  /* 위/아래 방향키 — 좌우는 app.js가 면 전환에 쓴다 */
  document.addEventListener('keydown', function (e) {
    if (!homeActive() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); goTo(index - 1); }
  });

  /* 창 크기가 바뀌면 스냅 기준이 달라진다 — 현재 장에 다시 맞춘다.
     애니메이션 없이 즉시 맞춰야 스냅이 어긋난 채 남지 않는다. */
  window.addEventListener('resize', function () {
    slidesEl.scrollTo({ top: index * slidesEl.clientHeight, behavior: 'instant' });
  });

  build();
})();
