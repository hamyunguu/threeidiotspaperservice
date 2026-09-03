/* ---------------------------------------------------------------
   Program archive — Figma 559:606 (꿰기) / 695:886 (묶기) / 695:984 (풀기),
   session mark 476:719, all measured off the 1920 × 1080 frame.

   One page, three sessions, picked with ?p=1|2|3. Everything Figma draws
   differently between the three lives in SESSIONS below; the frame around
   it — header, rule, crop marks, back arrow — is the same on all three.

   The new archive gallery shares one system across all three sessions:
   five 322 × 384 black frames, 20px apart, with every photograph centred
   at exactly 200px wide. Only the gallery origin differs slightly:

              mark          gallery x, y      frame / gap
     꿰기     284 × 114     115, 545          322 × 384 / 20
     묶기     284 ×  76     120, 540          322 × 384 / 20
     풀기     284 ×  76     120, 545          322 × 384 / 20

   The archive intro starts at y=151 in all three current frames. The gallery
   begins at y=545, leaving the same deliberate breathing room below the copy.

   The gallery runs well past the 1080 frame, so this is the page whose
   stage grows to its content (see body.archive in the stylesheet) and
   the window scrolls it.
   --------------------------------------------------------------- */

const V = '?v=87';

/* ---------------- the session mark (476:719) ----------------
   Five 76px discs on a 284 box, with the two syllables laid over the
   first and last. Each session arranges them differently — 꿰기 is the
   only two-row one, and 풀기 spaces three discs evenly at the left before
   leaving a gap to 기 — so the discs are listed per session rather than
   shared. `syl` is the y Figma puts both syllables at. */

const MARKS = {
  1: { h: 114, syl: 51, discs: [[52, 0], [104, 38], [156, 0], [0, 38], [208, 38]] },
  2: { h: 76, syl: 13, discs: [[52, 0], [104, 0], [0, 0], [156, 0], [208, 0]] },
  3: { h: 76, syl: 13, discs: [[35, 0], [70, 0], [0, 0], [105, 0], [208, 0]] },
};

/* ---------------- the galleries ----------------
   Every tuple is [badge, photo height, photo top].  The last value matters:
   Figma rounds some vertically-centred photographs by half a pixel, so using
   top:50% would still leave a visible 1px mismatch.  These are the literal
   metadata coordinates from 559:635 / 727:1501 / 727:1534. */

const GALLERIES = {
  1: [
    [1, 232, 76], [2, 171, 107], [3, 206, 89], [4, 270, 57], [5, 165, 110],
    [6, 256, 64], [7, 165, 110], [8, 227, 79], [9, 231, 77], [10, 273, 56],
    [11, 286, 49], [12, 214, 85], [13, 233, 76], [14, 163, 111], [15, 214, 85],
    [16, 245, 70], [17, 267, 59], [18, 284, 50], [19, 273, 56], [20, 252, 66],
    [21, 163, 111], [22, 167, 109],
  ],
  2: [
    [1, 232, 76], [2, 274.400024, 55.299988], [3, 206, 89], [4, 270, 57],
    [5, 226.153809, 79.423096], [6, 256, 64], [7, 165, 110], [8, 227, 79],
    [9, 231, 77], [10, 273, 56], [11, 286, 49], [13, 233, 76], [14, 163, 111],
    [15, 214, 85], [16, 245, 70], [17, 267, 59], [18, 284, 50], [19, 273, 56],
    [20, 252, 66], [21, 249.684082, 67.657959], [22, 167, 109],
  ],
  3: [
    [1, 232, 76], [2, 249.684204, 67.657898], [3, 206, 89], [4, 270, 57],
    [5, 203.870972, 90.564514], [6, 256, 64], [7, 165, 110], [8, 227, 79],
    [9, 231, 77], [10, 273, 56], [11, 286, 49], [12, 214, 85], [13, 233, 76],
    [14, 216.901367, 84.049316], [15, 214, 85], [16, 245, 70], [17, 267, 59],
    [18, 284, 50],
  ],
};

const SESSIONS = {
  1: {
    ink: '#00a0ff',
    mark: ['꿰', '기'],
    ctaTop: '305px',
    copy: [
      '꿰기 세션은 바늘과 실이라는 익숙한 제본<br>방식에서 출발해, 꿸 수 있는 모든 재료와<br>방법을 탐색하는 프로그램입니다. 종이에<br>구멍을 내고 실을 통과 시키는 것부터, 천과<br>플라스틱, 철사와 케이블처럼 제본과는 멀어<br>보이는 재료까지 자유롭게 연결해 봅니다.',
      '재료의 한계도, 방식의 제약도, 정해진 결과도<br>없습니다. <span class="is-note">꿰고 연결하며 발견하는 가능성만<br>있습니다.</span>',
    ],
    grid: { x: 115, y: 545 },
    items: GALLERIES[1],
    file: (n) => `assets/archive/figma/p1-${String(n).padStart(2, '0')}.jpg`,
  },
  2: {
    ink: '#ec008c',
    mark: ['묶', '기'],
    ctaTop: '305px',
    copy: [
      '묶기 세션은 서로 다른 종이와 재료를<br>다양한 방식으로 묶어 하나의 형태로 만드는<br>프로그램입니다. 끈을 감거나 매듭을 짓고,<br>고무줄이나 밴드처럼 주변에서 쉽게 접할 수<br>있는 재료를 활용해 여러 가지 제본 구조를<br>만들어 봅니다.',
      '어떤 형태로 완성할지는 모두 열려 있습니다.<br><span class="is-note">서로 다른 재료를 하나의 구조로 묶어보며<br>제본의 범위를 넓혀갑니다.</span>',
    ],
    grid: { x: 120, y: 540 },
    items: GALLERIES[2],
    file: (n) => `assets/archive/figma/p2-${String(n).padStart(2, '0')}.jpg`,
  },
  3: {
    ink: '#ffff00',
    mark: ['풀', '기'],
    /* the only session whose button sits up on the copy's own line */
    ctaTop: '271px',
    copyWidth2: '460px',
    copy: [
      '풀기 세션은 책장을 펼쳐 넘겨보는 익숙한<br>방식에서 벗어나, 풀어가는 과정을 통해<br>내용을 읽는 새로운 책의 형태를 탐색하는<br>프로그램입니다. 손의 움직임에 따라<br>내용과 구조가 드러나는 책을 만들어 봅니다.',
      '<span class="is-note">풀고 펼치는 움직임 자체가 새로운 책의<br>형태이자 읽기의 방식이 됩니다.</span>',
    ],
    grid: { x: 120, y: 545 },
    items: GALLERIES[3],
    file: (n) => `assets/archive/figma/p3-${String(n).padStart(2, '0')}.jpg`,
  },
};

/* ---------------- archive specifications ----------------
   These are visual readings of the photographs, not production records.
   Exact paper names, weights and hidden construction cannot be confirmed
   from a finished object, so ranges and material families are used on
   purpose. The dialog repeats that caveat for every piece. */

const spec = (form, material, weight, binding, finish) => ({
  form, material, weight, binding, finish,
});

const ARCHIVE_SPECS = {
  1: {
    name: '꿰기',
    items: {
      1: spec('가로형 펼침 책', '미색 비도공지 내지 · 컬러 보드 표지', '내지 120–180g/㎡ · 표지 250–350g/㎡ 추정', '등 노출 실 제본', '이미지 인쇄 · 삽입 이미지 · 가장자리 재단'),
      2: spec('정방형 아트북', '백색 인쇄지 · 올이 풀린 반투명 직물', '내지 100–150g/㎡ 추정 · 직물 평량 확인 필요', '직물과 본문을 함께 꿰는 노출 제본', '흑백 텍스트 인쇄 · 직물 커버'),
      3: spec('두꺼운 소책자', '적색 색지 여러 겹', '내지 100–160g/㎡ 추정', '접지 묶음을 실로 꿰는 섹션 제본', '단색 텍스트 인쇄 · 가장자리 노출'),
      4: spec('낱장 조형책', '청색 투명 필름 또는 아크릴 · 다색 실', '필름 두께 확인 필요', '모서리와 가장자리를 잇는 자유 손바느질', '백색 타이포 인쇄 · 실 술 장식'),
      5: spec('텍스타일 샘플북', '니트·레이스·직물 혼합', '직물별 평량 확인 필요', '원단 가장자리를 잇는 손바느질', '자수 또는 실 드로잉 · 올 풀림 마감'),
      6: spec('사진 오브제', '인스턴트 사진 · 녹색 철사 또는 피복선', '인화지 평량 확인 필요', '사진 하단을 관통한 와이어 연결', '사진 인화 · 와이어 성형'),
      7: spec('세로형 소책자', '백색 비도공지 · 다색 실', '내지 100–150g/㎡ · 표지 180–250g/㎡ 추정', '등과 하단을 드러낸 실 제본', '손그림·사진 삽입 · 실 꼬리 노출'),
      8: spec('패브릭 사진책', '생지 직물 · 인화 이미지', '직물 평량 확인 필요', '직물 접지와 손바느질', '사진 전사 또는 봉제 부착 · 올 풀림 마감'),
      9: spec('수제지 앨범', '두꺼운 백색 수제지 · 황마끈', '200–350g/㎡ 추정', '다중 구멍 끈 제본', '손글씨 · 데클 엣지 · 긴 끈 장식'),
      10: spec('소재 레이어 북', '반투명지·직물·레이스·가죽 유사 소재', '종이 100–200g/㎡ 추정 · 직물 별도', '상단 끈 묶음 및 측면 봉제', '타이포 인쇄 · 소재 혼합 콜라주'),
      11: spec('반투명 레이어 북', '트레이싱지 또는 반투명 필름', '90–180g/㎡ 추정', '등 또는 모서리 실 연결 추정', '사진 인쇄 · 겹침에 의한 이미지 합성'),
      12: spec('포켓형 책', '백색 색지 · 직조 종이 띠', '내지 120–180g/㎡ · 띠 160–220g/㎡ 추정', '접지 구조와 종이 엮기', '직조 커버 · 사각 창 구성'),
      13: spec('복수 책등 책', '미색 내지 · 회색 보드·천 표지 · 청색 실', '내지 100–160g/㎡ · 표지 보드 1–2mm 추정', '노출 콥틱 또는 체인 스티치', '두꺼운 표지 · 등 구조 노출'),
      14: spec('가로형 펼침 책', '반투명 백색지 · 적색 실과 술', '100–160g/㎡ 추정', '중앙 실 제본', '연한 색상 인쇄 · 태슬 장식'),
      15: spec('비정형 낱장책', '보라색 색지 · 사진 인쇄지 · 검정 실', '120–220g/㎡ 추정', '가장자리 단일 실 연결', '형태 재단 · 사진 콜라주'),
      16: spec('두꺼운 세로형 책', '백색 수제지 또는 거친 비도공지', '180–300g/㎡ 추정', '등 노출 다중 실 제본', '데클 엣지 · 표면 드로잉'),
      17: spec('천과 보드의 레이어 북', '회색 직물 · 백색 수제지 · 인화 이미지', '종이 180–300g/㎡ 추정 · 직물 별도', '측면 손바느질', '사진 부착 · 올 풀림 마감'),
      18: spec('카드 묶음', '흑색 보드지 · 분홍색 끈', '250–400g/㎡ 추정', '상단 다중 끈 묶음', '이미지 인쇄 · 긴 끈 장식'),
      19: spec('세로형 링북', '적색 보드지 · 사진 인쇄지', '표지 300–500g/㎡ · 내지 150–250g/㎡ 추정', '좌측 2공 금속 링 제본', '중앙 창 재단 · 사진 삽입'),
      20: spec('목재 표지 책', '얇은 무늬목 또는 합판 · 종이 내지', '목재 두께와 내지 평량 확인 필요', '숨은 실 또는 피스 제본 추정', '레이저 각인 또는 전사 인쇄 추정'),
      21: spec('투명 패브릭 북', '투명 비닐·오간자 유사 직물 · 적색 원단', '필름·직물 두께 확인 필요', '가장자리 봉제', '원단 레이어 · 봉제선 노출'),
      22: spec('보자기형 패브릭 북', '적색·흑색 직물 · 사진 패치', '직물별 평량 확인 필요', '접어 싸는 랩 구조와 봉제', '사진 전사 또는 패치 부착 · 술 장식'),
    },
  },
  2: {
    name: '묶기',
    items: {
      1: spec('클립형 메모책', '백색 비도공지 · 회색 보드 · 금속 클립', '내지 100–160g/㎡ · 보드 1–2mm 추정', '상단 집게 클립 제본', '흑백 텍스트 인쇄 · 모서리 라운딩'),
      2: spec('부채형 카드북', '사진 인쇄 카드 · 반투명 색지', '180–300g/㎡ 추정', '하단 1점 리벳 또는 볼트 제본', '컬러 사진 인쇄 · 부채꼴 전개'),
      3: spec('금속 봉투 오브제', '알루미늄 또는 얇은 금속판 · 금속 경첩', '판 두께 확인 필요', '경첩과 잠금장치 조립', '금속 절곡 · 표면 해머링'),
      4: spec('긴 띠형 책', '백색 인쇄지 · 보라색 두꺼운 색지', '내지 100–150g/㎡ · 받침 200–300g/㎡ 추정', '접지 후 말거나 감는 구조', '텍스트 인쇄 · 롱 폴드'),
      5: spec('꽃잎 회전책', '분홍·녹색 색지 · 인쇄 이미지', '180–250g/㎡ 추정', '중앙 1점 할핀 제본', '꽃잎 형태 재단 · 이미지 콜라주'),
      6: spec('별 모양 카드 묶음', '백색 두꺼운 색지 · 볼 체인', '200–300g/㎡ 추정', '타공 후 볼 체인 연결', '별 모양 톰슨 재단 · 사진 인쇄'),
      7: spec('수제지 소형책', '두꺼운 백색 수제지 · 회색 보드', '200–350g/㎡ 추정', '등 노출 롱 스티치 또는 콥틱 제본', '데클 엣지 · 소량 텍스트 인쇄'),
      8: spec('금속 표지 블록북', '백색 내지 · 그을린 금속 표지 · 적색 끈', '내지 100–160g/㎡ · 금속 두께 확인 필요', '등을 감아 묶는 끈 제본', '금속 열처리 · 세 면 재단'),
      9: spec('슬롯형 보드 오브제', '회색 보드 · 반투명 삽입 띠', '보드 1–2mm · 띠 150–250g/㎡ 추정', '절개 슬롯에 낱장을 끼우는 구조', '슬릿 재단 · 형압 또는 각인 추정'),
      10: spec('검정 보드 북', '검정 보드지 · 반투명 인쇄지 · 백색 끈', '표지 300–500g/㎡ · 내지 100–180g/㎡ 추정', '좌측 3점 매듭 제본', '사진 인쇄 · 매듭 노출'),
      11: spec('두루마리형 직물책', '백색 직물 또는 수제지 · 나뭇가지·끈', '소재 평량 확인 필요', '막대에 감고 끈으로 고정', '드로잉·콜라주 · 자연물 결합'),
      13: spec('레이스 프레임 책', '종이 레이스 · 반투명 사진 필름 · 금속 링', '소재별 평량 확인 필요', '우측 타공 링 또는 고리 연결', '레이스 다이컷 · 사진 오버레이'),
      14: spec('받침형 가로 책', '백색 내지 · 금속 장식 프레임', '내지 100–160g/㎡ · 금속 두께 확인 필요', '금속 프레임에 본문을 끼우는 구조', '금속 절단·성형 · 텍스트 인쇄'),
      15: spec('재료 샘플 묶음', '수제지·검정 직물·보드 혼합', '종이 180–350g/㎡ 추정 · 직물 별도', '등 또는 중앙을 끈으로 묶는 구조 추정', '데클 엣지 · 소재 대비'),
      16: spec('텍스타일 소형책', '갈색 털 원단 · 금속 참·고리', '직물 평량 확인 필요', '상단 금속 고리와 봉제', '동물무늬 직조 · 참 장식'),
      17: spec('금속 힌지 북', '반투명 플라스틱 · 알루미늄 경첩·피스', '판 두께 확인 필요', '다공 금속 경첩 제본', '투명 판 재단 · 볼트 조립'),
      18: spec('투명 링 바인더', '골판형 반투명 플라스틱 · 금속 링', '판 두께 확인 필요', '좌측 다공 금속 링 제본', '백색 타이포 인쇄 · 모서리 라운딩'),
      19: spec('수제지 링북', '두꺼운 수제지 · 금속 링', '200–350g/㎡ 추정', '좌측 4공 링 제본', '데클 엣지 · 손바느질 보강 추정'),
      20: spec('원통형 롤 북', '금속 원통 · 종이 띠 · 가죽 또는 고무 밴드', '종이 100–180g/㎡ · 기타 두께 확인 필요', '원통을 밴드로 묶는 조립 구조', '말기·감기 · 태그 부착'),
      21: spec('프로파일 클립 책', '알루미늄 프로파일 · 백색 인쇄 카드', '카드 180–300g/㎡ 추정', '금속 레일에 카드를 끼우는 구조', '흑백 타이포 인쇄 · 금속 절단'),
      22: spec('타공 금속 커버 북', '타공 금속판 · 금속 링 · 종이 내지', '금속 두께 확인 필요 · 내지 100–160g/㎡ 추정', '좌측 3공 링 제본', '금속 펀칭 이미지 · 표면 산화 마감 추정'),
    },
  },
  3: {
    name: '풀기',
    items: {
      1: spec('사진 병풍책', '사진 인화지 · 회색 보드', '인화지 180–250g/㎡ · 보드 1–2mm 추정', '아코디언 접지 또는 힌지 연결', '흑백 사진 인쇄 · 자립형 구조'),
      2: spec('포장형 책', '백색 반투명지 또는 얇은 직물 · 백색 끈', '90–160g/㎡ 추정', '십자 끈 묶음', '반투명 레이어 · 손글씨'),
      3: spec('밴드 잠금 소형책', '흑색 보드 · 검정 고무 밴드 · 금속 버클', '보드 1–2mm 추정', '고무 밴드로 감아 잠그는 구조', '사각 창 또는 흑백 이미지 부착'),
      4: spec('초소형 세로 책', '흑색 인쇄지 · 백색 또는 미색 내지', '내지 80–120g/㎡ · 표지 180–250g/㎡ 추정', '중철 또는 무선 제본 추정', '2도 컬러 인쇄 · 세 면 재단'),
      5: spec('그라데이션 접지책', '백색·회색·흑색 색지', '120–220g/㎡ 추정', '아코디언 접지', '타공 또는 소량 텍스트 인쇄 · 색지 배열'),
      6: spec('장형 아코디언 북', '백색 인쇄지 · 흑색 보드', '내지 120–200g/㎡ · 표지 300–500g/㎡ 추정', '연속 아코디언 접지', '사진·타이포 인쇄 · 긴 펼침 구조'),
      7: spec('변형 기존책', '인쇄된 책 본문 · 흑색 직물 또는 종이', '기존 내지 80–120g/㎡ 추정', '기존 책 제본을 유지한 변형 구조', '페이지 창 재단 · 검정 덧댐·콜라주'),
      8: spec('사진 롤 오브제', '인화지 스트립 · 금속 또는 종이 원통', '인화지 150–250g/㎡ 추정', '원통 안에서 사진 띠를 당겨 푸는 구조', '흑백 사진 연속 인쇄 · 말기'),
      9: spec('염색 소형책', '보라색 염색지 또는 직물 · 금박 유사 표지', '소재 평량 확인 필요', '접지 묶음의 숨은 실 제본 추정', '수작업 염색 · 금색 표면 마감'),
      10: spec('슬릿형 장형 책', '청색 두꺼운 색지 · 백색 삽입 띠', '180–300g/㎡ 추정', '연속 슬릿에 띠를 끼우는 엮기 구조', '정밀 칼선 · 부분 타공'),
      11: spec('하트형 끈 책', '두꺼운 수제지 · 적색 끈', '250–400g/㎡ 추정', '외곽 타공 후 끈을 통과시키는 제본', '하트 형태 재단 · 텍스트 인쇄'),
      12: spec('영수증 롤 북', '감열지 또는 얇은 백색 롤지 · 보드 상자', '롤지 55–80g/㎡ 추정 · 보드 1–2mm', '상자에서 종이를 당겨 푸는 구조', '단색 텍스트 인쇄 · 롤 급지'),
      13: spec('터널·팝업 북', '얇은 백색 인쇄지', '80–120g/㎡ 추정', '연속 접지와 절개 조립', '텍스트 인쇄 · 사각 창 재단 · 입체 접지'),
      14: spec('끌어당기는 변형책', '기성 인쇄책 · 백색 끈과 삽입 조각', '기존 내지 80–120g/㎡ 추정', '기존 책에 끈과 가동 부품 추가', '다이컷·슬릿 · 풀탭 인터랙션'),
      15: spec('폴드아웃 사진책', '백색 인쇄지 · 반투명 삽입지', '100–160g/㎡ 추정', '중철 또는 접지 제본에 펼침면 추가', '컬러·흑백 사진 인쇄 · 게이트폴드 추정'),
      16: spec('휴대형 접지 리플릿', '녹색·주황색 인쇄지', '100–180g/㎡ 추정', '다단 접지', '컬러 타이포·이미지 인쇄 · 가장자리 재단'),
      17: spec('미니 카드 랩북', '크라프트 보드 · 백색 원형 카드 · 검정 고무 밴드', '보드 250–400g/㎡ 추정', '고무 밴드로 감싸는 랩 구조', '원형 다이컷 · 레이어 구성'),
      18: spec('포어엣지 인터랙션 북', '다량의 인쇄 내지 · 두꺼운 표지', '내지 80–120g/㎡ 추정', '무선 또는 사철 제본 추정', '책배 이미지 또는 플립 애니메이션 · 세 면 재단'),
    },
  },
};

const which = String(new URLSearchParams(location.search).get('p') || '1');
const s = SESSIONS[which] || SESSIONS['1'];

document.body.style.setProperty('--ink', s.ink);

/* ---- the session mark ---- */

const m = MARKS[which] || MARKS['1'];
const blob = document.getElementById('arcBlob');
blob.style.height = `${m.h}px`;
blob.style.setProperty('--syl-top', `${m.syl}px`);
blob.innerHTML =
  m.discs.map(([x, y]) => `<i style="left:${x}px; top:${y}px"></i>`).join('') +
  `<b style="left:15px">${s.mark[0]}</b><b style="left:223px">${s.mark[1]}</b>`;

/* ---- copy and button ---- */

document.getElementById('arcCopy').innerHTML =
  s.copy.map((c) => `<div>${c}</div>`).join('');
document.getElementById('arcCopy').style.setProperty('--copy-col-2', s.copyWidth2 || '463px');

const cta = document.getElementById('arcCta');
cta.style.setProperty('--cta-top', s.ctaTop);
cta.addEventListener('click', () => { window.location.href = 'service.html'; });

document.getElementById('arcBack').addEventListener('click', () => {
  window.location.href = 'program.html';
});
/* the next arrow walks around the three sessions */
document.getElementById('arcNext').addEventListener('click', () => {
  const next = (Number(which) % 3) + 1;
  window.location.href = `archive.html?p=${next}`;
});

/* ---- the gallery ---- */

const grid = document.getElementById('arcGrid');
grid.style.setProperty('--grid-x', `${s.grid.x}px`);
grid.style.setProperty('--grid-y', `${s.grid.y}px`);

grid.innerHTML = s.items.map(([n, h, top]) => {
  const style = ` style="--photo-h:${h}px;--photo-top:${top}px"`;
  return `<button type="button" class="arc-tile is-cropped" data-archive-no="${n}" aria-label="아카이브 ${n} 제작 정보 보기"${style}>` +
    `<img src="${s.file(n)}${V}" alt="아카이브 ${n}" loading="lazy" />` +
    `<span class="arc-index">${n}</span></button>`;
}).join('');

/* ---- archive information dialog ---- */

const modal = document.getElementById('arcModal');
const modalPanel = modal.querySelector('.arc-modal-panel');
const modalImage = document.getElementById('arcModalImage');
const modalIndex = document.getElementById('arcModalIndex');
const modalSession = document.getElementById('arcModalSession');
const modalTitle = document.getElementById('arcModalTitle');
const modalSpecs = document.getElementById('arcModalSpecs');
const modalCount = document.getElementById('arcModalCount');
const modalClose = document.getElementById('arcModalClose');
const modalPrev = document.getElementById('arcModalPrev');
const modalNext = document.getElementById('arcModalNext');
const archiveData = ARCHIVE_SPECS[which] || ARCHIVE_SPECS[1];
const archiveNumbers = s.items.map(([n]) => n);
let activeArchiveIndex = 0;
let archiveReturnFocus = null;

const SPEC_LABELS = [
  ['form', '형태'],
  ['material', '종이·재료'],
  ['weight', '평량·두께'],
  ['binding', '제본 방식'],
  ['finish', '인쇄·후가공'],
];

function renderArchiveInfo(index) {
  activeArchiveIndex = (index + archiveNumbers.length) % archiveNumbers.length;
  const no = archiveNumbers[activeArchiveIndex];
  const data = archiveData.items[no];
  const padded = String(no).padStart(2, '0');

  modalImage.src = `${s.file(no)}${V}`;
  modalImage.alt = `${archiveData.name} 아카이브 ${no}`;
  modalIndex.textContent = no;
  modalSession.textContent = `PROGRAM ${which} · ${archiveData.name}`;
  modalTitle.textContent = `ARCHIVE ${padded}`;
  modalCount.textContent = `${activeArchiveIndex + 1} / ${archiveNumbers.length}`;
  modalSpecs.innerHTML = SPEC_LABELS.map(([key, label]) =>
    `<div><dt>${label}</dt><dd>${data[key]}</dd></div>`).join('');
}

function openArchiveInfo(no, opener) {
  archiveReturnFocus = opener;
  renderArchiveInfo(archiveNumbers.indexOf(no));
  modal.hidden = false;
  document.body.classList.add('is-archive-modal-open');
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    modalClose.focus({ preventScroll: true });
  });
}

function closeArchiveInfo() {
  modal.classList.remove('is-open');
  document.body.classList.remove('is-archive-modal-open');
  const finish = () => {
    modal.hidden = true;
    archiveReturnFocus?.focus({ preventScroll: true });
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else modal.addEventListener('transitionend', finish, { once: true });
}

grid.addEventListener('click', (event) => {
  const tile = event.target.closest('.arc-tile');
  if (!tile) return;
  openArchiveInfo(Number(tile.dataset.archiveNo), tile);
});
document.getElementById('arcModalShade').addEventListener('click', closeArchiveInfo);
modalClose.addEventListener('click', closeArchiveInfo);
modalPrev.addEventListener('click', () => renderArchiveInfo(activeArchiveIndex - 1));
modalNext.addEventListener('click', () => renderArchiveInfo(activeArchiveIndex + 1));

document.addEventListener('keydown', (event) => {
  if (modal.hidden) return;
  if (event.key === 'Escape') closeArchiveInfo();
  if (event.key === 'ArrowLeft') renderArchiveInfo(activeArchiveIndex - 1);
  if (event.key === 'ArrowRight') renderArchiveInfo(activeArchiveIndex + 1);
  if (event.key !== 'Tab') return;

  const focusable = [...modalPanel.querySelectorAll('button:not([disabled])')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

/* ---- give the frame the gallery's height ----
   .viewport and .stage both size off --stage-h, so measuring the grid once
   it has laid out and writing it back is all the scrolling needs. */

function fitStage() {
  const box = grid.getBoundingClientRect();
  const scale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
  const height = box.height / scale;
  /* 65 of that tail is room for the shift: open the header and the whole
     gallery slides down, and without the headroom the last row is cut off */
  document.body.style.setProperty('--stage-h', Math.ceil(s.grid.y + height + 88 + 65));
}

fitStage();
/* each piece that decodes can change a column's length, so re-measure as
   they land rather than guessing at the total up front */
grid.querySelectorAll('img').forEach((img) => {
  if (img.complete) return;
  img.addEventListener('load', fitStage, { once: true });
  img.addEventListener('error', fitStage, { once: true });
});
window.addEventListener('resize', fitStage);
