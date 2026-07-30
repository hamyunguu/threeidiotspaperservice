/* ---------------------------------------------------------------
   Program detail page — one shell, three variants chosen by ?p=1|2|3.
   Figma: 180:115 (꿰기), 182:855 (묶기), 182:923 (풀기).
   Runs before script.js so the balls it reads are already in the DOM.
   --------------------------------------------------------------- */

const PROGRAMS = {
  1: {
    word: ['꿰', '기'],
    accent: '#ffe710',
    desc1: '꿰기 세션은 바늘과 실이라는 익숙한 제본 방식에서 출발해, 꿸 수 있는 모든 재료와 방법을 탐색하는 프로그램입니다. 종이에 구멍을 내고 실을 통과 시키는 것부터, 천과 플라스틱, 철사와 케이블처럼 제본과는 멀어 보이는 재료까지 자유롭게 연결해 봅니다.',
    desc2: '재료의 한계도, 방식의 제약도, 정해진 결과도 없습니다. 꿰고 연결하며 발견하는 가능성만 있습니다!',
  },
  2: {
    word: ['묶', '기'],
    accent: '#0196ff',
    desc1: '묶기 세션은 흩어진 재료들을 기상천외한 방식으로 한데 모으며, 묶는 행위가 어떻게 하나의 제본이 될 수 있는지 경험하는 프로그램 입니다.',
    desc2: '끈을 감고 매듭을 만들거나, 고무줄과 테이프, 밴드와 철사 등 손에 잡히는 다양한 재료를 이용해 새로운 책의 구조를 만들어 봅니다.',
  },
  3: {
    word: ['풀', '기'],
    accent: '#f85485',
    desc1: '풀기는 이미 만들어진 책과 제본의 구조를 거꾸로 따라가는 세션입니다. 실을 빼고, 매듭을 풀고, 접힌 면을 펼치며 하나의 책이 어떤 순서와 방식으로 만들어졌는지 발견합니다.',
    desc2: '',
  },
};

const params = new URLSearchParams(location.search);
const p = PROGRAMS[params.get('p')] || PROGRAMS[1];

document.body.style.setProperty('--accent', p.accent);
// html paints the page canvas (base CSS gives it a white bg), so tint it too —
// otherwise white shows below the frame on windows taller than the content
document.documentElement.style.background = p.accent;
document.getElementById('syl1').textContent = p.word[0];
document.getElementById('syl2').textContent = p.word[1];
document.getElementById('desc1').textContent = p.desc1;
document.getElementById('desc2').textContent = p.desc2;
document.title = `TiPS — ${p.word.join('')}`;

// maker credit revealed on the hoverable gallery image
document.getElementById('maker').innerHTML = ['김', '수', '정'].map((c) => `<span>${c}</span>`).join('');

// let the incoming colour settle, then fade the intro panel away
const intro = document.getElementById('intro');
requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.add('gone')));
intro.addEventListener('transitionend', () => intro.remove());

// apply button is a placeholder until the application flow exists
document.getElementById('apply').addEventListener('click', () => {
  document.getElementById('apply').blur();
});
