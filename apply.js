/* Program application flow draft.
   The prototype keeps every value in memory: nothing is sent or stored. */

const APPLICATION_PROGRAMS = {
  1: {
    ink: '#00a0ff',
    name: '꿰기',
    syllables: ['꿰', '기'],
    mark: { h: 114, syl: 51, discs: [[52, 0], [104, 38], [156, 0], [0, 38], [208, 38]] },
    description: '바늘과 실에서 출발해 꿸 수 있는 재료와 연결 방식을 자유롭게 탐색합니다.',
  },
  2: {
    ink: '#ec008c',
    name: '묶기',
    syllables: ['묶', '기'],
    mark: { h: 76, syl: 13, discs: [[52, 0], [104, 0], [0, 0], [156, 0], [208, 0]] },
    description: '서로 다른 종이와 재료를 묶어 새로운 책의 구조와 형태를 만들어 봅니다.',
  },
  3: {
    ink: '#ffff00',
    name: '풀기',
    syllables: ['풀', '기'],
    mark: { h: 76, syl: 13, discs: [[35, 0], [70, 0], [0, 0], [105, 0], [208, 0]] },
    description: '풀고 펼치는 손의 움직임을 통해 새로운 책의 형태와 읽기 방식을 탐색합니다.',
  },
};

const applicationState = {
  program: String(new URLSearchParams(location.search).get('p') || '1'),
  date: '',
  time: '',
  people: 1,
  step: 1,
};

if (!APPLICATION_PROGRAMS[applicationState.program]) applicationState.program = '1';

const applicationForm = document.getElementById('applyForm');
const applicationSteps = [...document.querySelectorAll('.ap-step')];
const applicationProgress = [...document.querySelectorAll('[data-progress]')];
const applicationDateButtons = [...document.querySelectorAll('[data-date]')];
const applicationTimeButtons = [...document.querySelectorAll('[data-time]')];
const applicationRequiredAgreements = [...document.querySelectorAll('.agree-required')];

function escapeApplicationHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function renderApplicationProgram() {
  const program = APPLICATION_PROGRAMS[applicationState.program];
  const mark = document.getElementById('applyMark');

  document.documentElement.style.setProperty('--ink', program.ink);
  document.body.style.setProperty('--ink', program.ink);
  document.getElementById('applyProgramNo').textContent = `PROGRAM ${applicationState.program}`;
  document.getElementById('applyProgramName').textContent = program.name;
  document.getElementById('applyProgramDesc').textContent = program.description;
  document.getElementById('backToArchive').href = `archive.html?p=${applicationState.program}`;

  mark.style.height = `${program.mark.h}px`;
  mark.style.setProperty('--syl-top', `${program.mark.syl}px`);
  mark.innerHTML = program.mark.discs
    .map(([x, y]) => `<i style="left:${x}px;top:${y}px"></i>`).join('') +
    `<b style="left:15px">${program.syllables[0]}</b>` +
    `<b style="left:223px">${program.syllables[1]}</b>`;

  document.querySelectorAll('[data-program]').forEach((button) => {
    const selected = button.dataset.program === applicationState.program;
    button.classList.toggle('is-on', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function updateApplicationSummary() {
  document.getElementById('summaryDate').textContent = applicationState.date || '선택 전';
  document.getElementById('summaryTime').textContent = applicationState.time || '선택 전';
  document.getElementById('summaryPeople').textContent = `${applicationState.people}명`;
  document.getElementById('peopleCount').textContent = `${applicationState.people}명`;
  document.getElementById('peopleMinus').disabled = applicationState.people <= 1;
  document.getElementById('peoplePlus').disabled = applicationState.people >= 4;
}

function showApplicationStep(step) {
  applicationState.step = step;
  applicationSteps.forEach((panel) => {
    const visible = Number(panel.dataset.step) === step;
    panel.hidden = !visible;
    panel.classList.toggle('is-on', visible);
  });
  applicationProgress.forEach((item) => {
    item.classList.toggle('is-on', Number(item.dataset.progress) <= Math.min(step, 3));
  });

  if (step === 3) renderApplicationReview();
  if (step === 4) renderApplicationCompletion();

  const heading = document.querySelector(`[data-step="${step}"] h2`);
  if (heading) heading.focus?.({ preventScroll: true });
}

function renderApplicationReview() {
  const program = APPLICATION_PROGRAMS[applicationState.program];
  const request = document.getElementById('applicantRequest').value.trim() || '없음';
  const rows = [
    ['프로그램', `PROGRAM ${applicationState.program} · ${program.name} 세션`],
    ['일정', `2026.${applicationState.date} · ${applicationState.time}`],
    ['인원', `${applicationState.people}명`],
    ['신청자', document.getElementById('applicantName').value.trim()],
    ['연락처', document.getElementById('applicantPhone').value.trim()],
    ['이메일', document.getElementById('applicantEmail').value.trim()],
    ['요청사항', request],
  ];
  document.getElementById('applyReview').innerHTML = rows
    .map(([label, value]) => `<div><dt>${escapeApplicationHTML(label)}</dt><dd>${escapeApplicationHTML(value)}</dd></div>`).join('');
}

function renderApplicationCompletion() {
  const program = APPLICATION_PROGRAMS[applicationState.program];
  document.getElementById('completeSummary').innerHTML =
    `<div><dt>PROGRAM</dt><dd>${program.name} 세션</dd></div>` +
    `<div><dt>DATE / TIME</dt><dd>2026.${applicationState.date} · ${applicationState.time}</dd></div>` +
    `<div><dt>PEOPLE</dt><dd>${applicationState.people}명</dd></div>`;
}

function validateApplicantInfo() {
  const name = document.getElementById('applicantName');
  const phone = document.getElementById('applicantPhone');
  const email = document.getElementById('applicantEmail');
  const phoneDigits = phone.value.replace(/\D/g, '');

  if (!name.value.trim()) return { input: name, message: '이름을 입력해 주세요.' };
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return { input: phone, message: '휴대전화 번호를 확인해 주세요.' };
  }
  if (!email.validity.valid || !email.value.trim()) {
    return { input: email, message: '이메일 주소를 확인해 주세요.' };
  }
  return null;
}

applicationDateButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applicationState.date = button.dataset.date;
    applicationDateButtons.forEach((item) => item.classList.toggle('is-on', item === button));
    document.getElementById('step1Error').textContent = '';
    updateApplicationSummary();
  });
});

applicationTimeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applicationState.time = button.dataset.time;
    applicationTimeButtons.forEach((item) => item.classList.toggle('is-on', item === button));
    document.getElementById('step1Error').textContent = '';
    updateApplicationSummary();
  });
});

document.querySelectorAll('[data-next]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = Number(button.dataset.next);
    if (next === 2 && (!applicationState.date || !applicationState.time)) {
      document.getElementById('step1Error').textContent = '날짜와 회차를 모두 선택해 주세요.';
      return;
    }
    if (next === 3) {
      const error = validateApplicantInfo();
      if (error) {
        document.getElementById('step2Error').textContent = error.message;
        error.input.focus();
        return;
      }
      document.getElementById('step2Error').textContent = '';
    }
    showApplicationStep(next);
  });
});

document.querySelectorAll('[data-prev]').forEach((button) => {
  button.addEventListener('click', () => showApplicationStep(Number(button.dataset.prev)));
});

document.getElementById('peopleMinus').addEventListener('click', () => {
  applicationState.people = Math.max(1, applicationState.people - 1);
  updateApplicationSummary();
});
document.getElementById('peoplePlus').addEventListener('click', () => {
  applicationState.people = Math.min(4, applicationState.people + 1);
  updateApplicationSummary();
});

document.getElementById('applicantPhone').addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) event.target.value = digits;
  else if (digits.length <= 7) event.target.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  else event.target.value = `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
});

document.querySelectorAll('[data-program]').forEach((button) => {
  button.addEventListener('click', () => {
    applicationState.program = button.dataset.program;
    history.replaceState(null, '', `apply.html?p=${applicationState.program}`);
    renderApplicationProgram();
  });
});

document.getElementById('applyBack').addEventListener('click', () => {
  window.location.href = `archive.html?p=${applicationState.program}`;
});

const agreeAll = document.getElementById('agreeAll');
const allAgreementInputs = [...document.querySelectorAll('.ap-agreements input:not(#agreeAll)')];
agreeAll.addEventListener('change', () => {
  allAgreementInputs.forEach((input) => { input.checked = agreeAll.checked; });
  document.getElementById('step3Error').textContent = '';
});
allAgreementInputs.forEach((input) => {
  input.addEventListener('change', () => {
    agreeAll.checked = allAgreementInputs.every((item) => item.checked);
    agreeAll.indeterminate = !agreeAll.checked && allAgreementInputs.some((item) => item.checked);
    document.getElementById('step3Error').textContent = '';
  });
});

applicationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!applicationRequiredAgreements.every((input) => input.checked)) {
    document.getElementById('step3Error').textContent = '필수 항목에 동의해 주세요.';
    return;
  }
  showApplicationStep(4);
});

document.getElementById('editApplication').addEventListener('click', () => showApplicationStep(3));

const applicationTerms = {
  privacy: {
    title: '개인정보 수집 및 이용 동의',
    copy: '신청 접수를 위해 이름, 휴대전화 번호, 이메일을 수집하는 화면을 가정합니다. 실제 운영 시 수집 목적, 보유 기간, 처리 주체를 확정해 이 문구를 교체해야 합니다.',
  },
  notice: {
    title: '프로그램 유의사항',
    copy: '일정 변경과 취소 기준, 준비물, 연령 및 참여 조건은 운영 정책 확정 후 안내합니다. 현재 표시된 일정과 소요 시간은 흐름 확인용 예시입니다.',
  },
};
const termDialog = document.getElementById('termDialog');
document.querySelectorAll('[data-term]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const term = applicationTerms[button.dataset.term];
    document.getElementById('termTitle').textContent = term.title;
    document.getElementById('termCopy').textContent = term.copy;
    termDialog.showModal();
  });
});
function closeApplicationTerms() { termDialog.close(); }
document.getElementById('termClose').addEventListener('click', closeApplicationTerms);
document.getElementById('termConfirm').addEventListener('click', closeApplicationTerms);
termDialog.addEventListener('click', (event) => {
  if (event.target === termDialog) closeApplicationTerms();
});

renderApplicationProgram();
updateApplicationSummary();
