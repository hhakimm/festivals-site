/**
 * 여행 빌런 테스트 — 자조 개그형 바이럴 테스트 (한국어 전용).
 * "같이 여행 가면 당신은 어떤 빌런?" → 친구 태그 유발.
 * 6 빌런 유형 · 7문항 · 클라이언트 채점.
 */

export type VillainId = 'photo' | 'planner' | 'late' | 'budget' | 'foodie' | 'lost';
export const VILLAIN_IDS: VillainId[] = ['photo', 'planner', 'late', 'budget', 'foodie', 'lost'];

export interface Villain {
  id: VillainId;
  emoji: string;
  name: string;       // 빌런명
  tagline: string;    // 한마디(대사)
  crime: string;      // 죄목 (한 줄)
  desc: string;       // 설명 (1~2문장)
  index: number;      // 빌런 지수 % (재미용)
  victim: VillainId;  // 환장의 피해자(궁합)
  gradient: { from: string; to: string };
}

export const VILLAINS: Record<VillainId, Villain> = {
  photo: {
    id: 'photo', emoji: '📸', name: '인생샷 강요 빌런',
    tagline: '여기서 한 장만 더! …다시!',
    crime: '동행자를 인간 삼각대로 부린다. "한 장만"이 50장.',
    desc: '풍경만 보면 동행자에게 카메라를 쥐여준다. 본인 만족할 때까지 "다시"를 외치며, 일정은 자연스레 밀린다.',
    index: 88, victim: 'planner', gradient: { from: '#ec4899', to: '#be185d' },
  },
  planner: {
    id: 'planner', emoji: '📋', name: '분 단위 계획 빌런',
    tagline: '지금 일정보다 7분 늦었어.',
    crime: '엑셀 일정표에서 3분만 밀려도 불안에 떤다.',
    desc: '여행 전부터 시간 단위 엑셀을 만든다. 즉흥은 곧 재앙. 일정이 밀리면 표정이 굳고 동행자는 눈치를 본다.',
    index: 76, victim: 'late', gradient: { from: '#3b82f6', to: '#1d4ed8' },
  },
  late: {
    id: 'late', emoji: '😴', name: '늦잠 빌런',
    tagline: '먼저 가 있어… 5분만…',
    crime: '"5분만"으로 첫 일정을 통째로 날린다.',
    desc: '알람을 다섯 번 끈다. 조식 마감, 첫 명소 오픈런은 남의 일. 모두가 로비에서 기다리는 동안 샤워를 시작한다.',
    index: 92, victim: 'planner', gradient: { from: '#6366f1', to: '#4338ca' },
  },
  budget: {
    id: 'budget', emoji: '💸', name: '가계부 빌런',
    tagline: '그거 굳이 사야 돼? 숙소 가서 먹자.',
    crime: '1,000원 차이로 30분 토론을 연다.',
    desc: '모든 지출에 "굳이?"를 붙인다. 입장료·기념품 앞에서 계산기를 두드리고, 더치페이 정산은 소수점까지 정확하다.',
    index: 70, victim: 'foodie', gradient: { from: '#16a34a', to: '#15803d' },
  },
  foodie: {
    id: 'foodie', emoji: '🍢', name: '먹부림 빌런',
    tagline: '일단 이것도 시켜. 저것도.',
    crime: '배불러도 "이건 또 다른 맛"이라며 주문한다.',
    desc: '여행은 곧 먹방. 줄 서는 맛집은 무조건 가야 하고, 다 못 먹어도 일단 시킨다. 일행의 위장과 지갑이 함께 운다.',
    index: 81, victim: 'budget', gradient: { from: '#f97316', to: '#c2410c' },
  },
  lost: {
    id: 'lost', emoji: '🗺️', name: '길치 빌런',
    tagline: '어? 아까 여기 지나갔나…?',
    crime: '구글맵을 들고도 반대로 간다.',
    desc: '"이쪽 맞는데?"를 외치며 3바퀴를 돈다. 지도 앱도 포기한 길찾기 실력으로, 도착 예정 시간은 늘 전설이 된다.',
    index: 85, victim: 'planner', gradient: { from: '#0d9488', to: '#0f766e' },
  },
};

export interface VQOption { id: string; label: string; weights: Partial<Record<VillainId, number>>; }
export interface VQuestion { id: string; q: string; options: VQOption[]; }

export const VILLAIN_QUESTIONS: VQuestion[] = [
  {
    id: 'v1', q: '여행 첫날 아침, 알람이 울렸다. 나는?',
    options: [
      { id: 'v1a', label: '벌떡! 첫 일정 오픈런 가야지', weights: { planner: 2 } },
      { id: 'v1b', label: '5분만… 딱 5분만…', weights: { late: 3 } },
      { id: 'v1c', label: '일어나자마자 조식 사진부터', weights: { photo: 2, foodie: 1 } },
      { id: 'v1d', label: '오늘 예산부터 다시 점검', weights: { budget: 2 } },
    ],
  },
  {
    id: 'v2', q: '멋진 풍경을 만났다. 첫 반응은?',
    options: [
      { id: 'v2a', label: '"거기 서봐! 한 장만!" (×50)', weights: { photo: 3 } },
      { id: 'v2b', label: '일정상 5분 안에 떠야 함', weights: { planner: 2 } },
      { id: 'v2c', label: '근처 맛집부터 검색', weights: { foodie: 2 } },
      { id: 'v2d', label: '여기 어디지…? (지도 보는 중)', weights: { lost: 2 } },
    ],
  },
  {
    id: 'v3', q: '맛집 앞에 줄이 길다. 나는?',
    options: [
      { id: 'v3a', label: '무조건 먹어야 해. 줄 서자', weights: { foodie: 3 } },
      { id: 'v3b', label: '이 시간이면 다음 일정 못 가', weights: { planner: 2 } },
      { id: 'v3c', label: '대기 줄에서도 인증샷', weights: { photo: 2 } },
      { id: 'v3d', label: '이 돈 주고 굳이? 편의점 가자', weights: { budget: 3 } },
    ],
  },
  {
    id: 'v4', q: '예상보다 비싼 기념품을 발견. 나는?',
    options: [
      { id: 'v4a', label: '"그거 굳이 사야 돼?" 30분 토론', weights: { budget: 3 } },
      { id: 'v4b', label: '일단 사진만 찍어둠', weights: { photo: 2 } },
      { id: 'v4c', label: '먹는 거면 산다', weights: { foodie: 2 } },
      { id: 'v4d', label: '계획에 없던 지출이라 패스', weights: { planner: 1, budget: 1 } },
    ],
  },
  {
    id: 'v5', q: '일행이 "이쪽인 것 같아"라고 한다. 나는?',
    options: [
      { id: 'v5a', label: '"아닌데? 이쪽 맞는데?" (3바퀴째)', weights: { lost: 3 } },
      { id: 'v5b', label: '지도 앱 켜고 분 단위로 계산', weights: { planner: 2 } },
      { id: 'v5c', label: '헤매는 김에 사진 명소 발견', weights: { photo: 2 } },
      { id: 'v5d', label: '아직 안 일어남(늦잠 중)', weights: { late: 2 } },
    ],
  },
  {
    id: 'v6', q: '일행이 갑자기 일정 변경을 제안한다. 나는?',
    options: [
      { id: 'v6a', label: '"엑셀에 없는데…" 불안해짐', weights: { planner: 3 } },
      { id: 'v6b', label: '추가 비용 먼저 따짐', weights: { budget: 2 } },
      { id: 'v6c', label: '새 맛집 가는 거면 콜', weights: { foodie: 2 } },
      { id: 'v6d', label: '어디로 가는지 또 헷갈림', weights: { lost: 2 } },
    ],
  },
  {
    id: 'v7', q: '여행 마지막 날, 가장 후회되는 건?',
    options: [
      { id: 'v7a', label: '사진 더 못 찍은 거', weights: { photo: 3 } },
      { id: 'v7b', label: '늦잠으로 놓친 첫 일정', weights: { late: 3 } },
      { id: 'v7c', label: '못 먹어본 그 집', weights: { foodie: 3 } },
      { id: 'v7d', label: '계획대로 안 흘러간 거', weights: { planner: 2, lost: 1 } },
    ],
  },
];

export function scoreVillain(optionIds: string[]): { winner: VillainId; scores: Record<VillainId, number> } {
  const scores: Record<VillainId, number> = { photo: 0, planner: 0, late: 0, budget: 0, foodie: 0, lost: 0 };
  const map = new Map<string, VQOption>();
  for (const q of VILLAIN_QUESTIONS) for (const o of q.options) map.set(o.id, o);
  for (const id of optionIds) {
    const o = map.get(id);
    if (!o) continue;
    for (const [v, w] of Object.entries(o.weights)) scores[v as VillainId] += w || 0;
  }
  let winner: VillainId = 'photo';
  let max = -1;
  for (const v of VILLAIN_IDS) if (scores[v] > max) { max = scores[v]; winner = v; }
  return { winner, scores };
}

export const VILLAIN_LABELS = {
  pageTitle: '여행 빌런 테스트',
  pageDesc: '같이 여행 가면… 당신은 어떤 빌런? 7문항으로 알아보는 내 여행 민폐력',
  start: '시작하기',
  startCta: '7문항 · 1분',
  questionOf: '/ 7',
  prev: '이전',
  result: '결과 보기',
  retake: '다시 하기',
  yourVillain: '당신의 여행 빌런 유형은',
  crimeLabel: '🚨 죄목',
  villainIndex: '🔥 빌런 지수',
  victimLabel: '😇 환장의 피해자',
  share: '공유하기',
  shareCopy: '링크 복사',
  shareCopied: '링크가 복사됐어요',
  shareTwitter: 'X에 공유',
  tagFriend: '이 빌런이 떠오르는 친구에게 보내기 😏',
} as const;

/** 공유 문구 — "나 ○○래 ㅋㅋ 너는?" */
export function villainShareText(id: VillainId): string {
  return `나 「${VILLAINS[id].emoji} ${VILLAINS[id].name}」래 ㅋㅋ 너는 어떤 여행 빌런?`;
}
