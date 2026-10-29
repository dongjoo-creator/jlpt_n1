// 시험 일정과 시험 안내 데이터는 이 파일 한 곳에서만 관리한다.
// D-day, 시험 안내 화면, 영역 이름이 모두 여기 값을 읽는다.

export const EXAM = {
  title: 'JLPT N1',
  date: '2026-12-06', // 시험일 (현지 날짜, YYYY-MM-DD)
};

// 문제 JSON의 section 값과 화면 이름. enabled가 false면 "준비 중"으로 표시한다.
export const SECTIONS = {
  vocab: { label: '문자·어휘', enabled: true },
  grammar: { label: '문법', enabled: true },
  reading: { label: '독해', enabled: true },
  listening: { label: '청해', enabled: false, note: '음성 문제는 준비 중이에요' },
};

// 오늘의 문제: 영역별 문제 수. 주말은 토·일. 설정 화면에서 바꾼 값이 있으면 그 값을 쓴다.
export const DAILY_PLAN_DEFAULT = {
  weekday: { vocab: 20, grammar: 20, reading: 10 },
  weekend: { vocab: 10, grammar: 10, reading: 5 },
};

export const COMPOSITION = {
  parts: [
    { label: '언어지식(문자·어휘·문법)·독해', minutes: 110 },
    { label: '청해', minutes: 55, star: true },
  ],
  sections: [
    {
      label: '문자·어휘', approx: 25,
      items: [['한자 읽기', 6], ['문맥 규정', 7], ['유의어', 6], ['용법', 6]],
    },
    {
      label: '문법', approx: 20,
      items: [['문법 형식 판단', 10], ['문장 배열', 5], ['글의 문법', 5]],
    },
    {
      label: '독해', approx: 26,
      items: [['단문', 4], ['중문', 9], ['장문', 4], ['통합 이해', 3], ['주장 이해', 4], ['정보 검색', 2]],
    },
    {
      label: '청해', approx: 37, star: true,
      items: [['과제 이해', 6], ['포인트 이해', 7], ['개요 이해', 6], ['즉시 응답', 14], ['통합 이해', 4]],
    },
  ],
  note: '문항 수는 공식 가이드북의 목표치라 회차마다 조금 달라질 수 있어요. 청해 시간은 공식 영문 안내 55분, 일부 공식 자료는 60분이라 수험표로 꼭 확인하세요.',
};

export const TIME_PLAN = {
  total: 110,
  segments: [
    { label: '어휘', minutes: 15 },
    { label: '문법', minutes: 15 },
    { label: '독해', minutes: 75 },
    { label: '검토', minutes: 5 },
  ],
  tips: [
    '독해가 시간의 약 70%를 차지해요. 어휘·문법은 빠르게 끝내고 독해 시간을 확보하세요.',
    '한 문제에서 2분 넘게 막히면 문제지에 표시하고 넘어가세요.',
    '장문은 질문을 먼저 읽고, 찾을 내용을 정한 뒤 지문을 읽으세요.',
    '청해는 음성이 나오기 전에 선택지를 미리 읽고, 들으면서 짧게 메모하세요.',
    '모르는 문제도 빈칸 없이 마킹하세요. 오답 감점은 없어요.',
  ],
  disclaimer: '일반적인 전략 제안이고 공식 권장 시간이 아니에요.',
};

export const SCORING = {
  total: 180,
  pass: 100,
  sections: [
    { label: '언어지식(문자·어휘·문법)', max: 60, min: 19 },
    { label: '독해', max: 60, min: 19 },
    { label: '청해', max: 60, min: 19 },
  ],
};
