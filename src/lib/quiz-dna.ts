/**
 * 여행 DNA 테스트 — 4축 × 16유형 (MBTI 패러디).
 *
 * 4축:
 *   1) A vs C  — Adventure (활동) vs Calm (휴식)
 *   2) N vs U  — Nature (자연) vs Urban (도시)
 *   3) P vs S  — Planner (계획) vs Spontaneous (즉흥)
 *   4) B vs L  — Budget (가성비) vs Luxury (럭셔리)
 *
 * 코드 예: ANPB · CUSL · ANPL ...
 * 8 질문, 각 질문은 정확히 한 축에 가중치를 줌.
 */
import type { Lang } from './i18n';
import { all as allItems, type Item } from './data';

export const AXIS_KEYS = ['AC', 'NU', 'PS', 'BL'] as const;
export type AxisKey = typeof AXIS_KEYS[number];

/** 한 축의 양 끝 정의 */
export interface AxisDef {
  key: AxisKey;
  /** 첫 글자 (높은 점수일 때) */
  highCode: string;
  highName: Record<Lang, string>;
  /** 둘째 글자 (낮은 점수일 때) */
  lowCode: string;
  lowName: Record<Lang, string>;
  axisLabel: Record<Lang, string>;
}

export const AXES: AxisDef[] = [
  {
    key: 'AC', highCode: 'A', lowCode: 'C',
    highName: { ko: '활동가', en: 'Adventurer', ja: '行動派', zh: '行动派' },
    lowName:  { ko: '휴식가', en: 'Chiller',     ja: '休息派', zh: '休闲派' },
    axisLabel:{ ko: '활동 ↔ 휴식', en: 'Active ↔ Chill', ja: '活動 ↔ 休息', zh: '活动 ↔ 休闲' },
  },
  {
    key: 'NU', highCode: 'N', lowCode: 'U',
    highName: { ko: '자연파', en: 'Nature',  ja: '自然派', zh: '自然派' },
    lowName:  { ko: '도시파', en: 'Urban',   ja: '都会派', zh: '都市派' },
    axisLabel:{ ko: '자연 ↔ 도시', en: 'Nature ↔ Urban', ja: '自然 ↔ 都会', zh: '自然 ↔ 都市' },
  },
  {
    key: 'PS', highCode: 'P', lowCode: 'S',
    highName: { ko: '계획러', en: 'Planner',     ja: '計画派', zh: '计划派' },
    lowName:  { ko: '즉흥파', en: 'Spontaneous', ja: '即興派', zh: '即兴派' },
    axisLabel:{ ko: '계획 ↔ 즉흥', en: 'Planned ↔ Spontaneous', ja: '計画 ↔ 即興', zh: '计划 ↔ 即兴' },
  },
  {
    key: 'BL', highCode: 'B', lowCode: 'L',
    highName: { ko: '가성비', en: 'Budget',  ja: 'コスパ', zh: '高性价比' },
    lowName:  { ko: '럭셔리', en: 'Luxury',  ja: '高級志向', zh: '奢华派' },
    axisLabel:{ ko: '가성비 ↔ 럭셔리', en: 'Budget ↔ Luxury', ja: 'コスパ ↔ 高級', zh: '性价比 ↔ 奢华' },
  },
];

// ─────────────────────────────────────────────────────────────
// 질문 — 8문항, 축마다 2문항. 옵션마다 점수 (-2 ~ +2).
// + 점수면 highCode, - 점수면 lowCode 쪽으로.
// ─────────────────────────────────────────────────────────────
export interface DnaOption {
  id: string;
  label: Record<Lang, string>;
  axis: AxisKey;
  score: number; // -2, -1, 0, 1, 2 (양수=high쪽)
}
export interface DnaQuestion {
  id: string;
  question: Record<Lang, string>;
  options: DnaOption[];
}

export const DNA_QUESTIONS: DnaQuestion[] = [
  // 축 1: AC (활동 vs 휴식)
  {
    id: 'd1',
    question: {
      ko: '여행 첫날 아침, 가장 끌리는 일정은?',
      en: 'Day 1, morning. What sounds best?',
      ja: '旅行初日の朝、最も惹かれる予定は?',
      zh: '旅行第一天早上,最吸引你的安排?',
    },
    options: [
      { id: 'd1-1', axis: 'AC', score: 2, label: { ko: '새벽 등산·러닝', en: 'Sunrise hike or run', ja: '日の出ハイク', zh: '日出徒步' } },
      { id: 'd1-2', axis: 'AC', score: 1, label: { ko: '동네 산책 + 카페', en: 'Walk + cafe', ja: '散歩+カフェ', zh: '散步+咖啡馆' } },
      { id: 'd1-3', axis: 'AC', score: -1, label: { ko: '느긋한 호텔 조식', en: 'Slow hotel breakfast', ja: 'ゆっくり朝食', zh: '悠闲酒店早餐' } },
      { id: 'd1-4', axis: 'AC', score: -2, label: { ko: '늦잠 후 룸서비스', en: 'Sleep in + room service', ja: '寝坊+ルームサービス', zh: '睡饱+客房送餐' } },
    ],
  },
  {
    id: 'd2',
    question: {
      ko: '여행 중 만보계가 보여주면 좋을 숫자는?',
      en: 'Ideal daily step count?',
      ja: '旅行中の理想的な歩数は?',
      zh: '旅行中理想的步数?',
    },
    options: [
      { id: 'd2-1', axis: 'AC', score: 2, label: { ko: '3만 보 이상', en: '30,000+ steps', ja: '3万歩以上', zh: '3万步以上' } },
      { id: 'd2-2', axis: 'AC', score: 1, label: { ko: '1.5~2만 보', en: '15-20,000 steps', ja: '1.5万~2万歩', zh: '1.5万~2万步' } },
      { id: 'd2-3', axis: 'AC', score: -1, label: { ko: '5천~1만 보', en: '5-10,000 steps', ja: '5千~1万歩', zh: '5千~1万步' } },
      { id: 'd2-4', axis: 'AC', score: -2, label: { ko: '하루 종일 거의 안 걸음', en: 'Barely walk', ja: 'ほぼ歩かない', zh: '几乎不走' } },
    ],
  },
  // 축 2: NU (자연 vs 도시)
  {
    id: 'd3',
    question: {
      ko: '여행 사진 폴더가 가득 차면 어떤 사진이 많을까?',
      en: 'What fills your photo folder?',
      ja: '写真フォルダに最も多いのは?',
      zh: '相册中最多的是?',
    },
    options: [
      { id: 'd3-1', axis: 'NU', score: 2, label: { ko: '광활한 풍경·일출·일몰', en: 'Vast landscapes & sunrises', ja: '壮大な風景·朝焼け', zh: '壮丽风景·日出日落' } },
      { id: 'd3-2', axis: 'NU', score: 1, label: { ko: '꽃·나무·새', en: 'Flowers, trees, birds', ja: '花·木·鳥', zh: '花·树·鸟' } },
      { id: 'd3-3', axis: 'NU', score: -1, label: { ko: '카페·맛집·간판', en: 'Cafes, food, shop signs', ja: 'カフェ·グルメ·看板', zh: '咖啡馆·美食·招牌' } },
      { id: 'd3-4', axis: 'NU', score: -2, label: { ko: '야경·고층빌딩', en: 'Skylines & night views', ja: '夜景·高層ビル', zh: '夜景·摩天楼' } },
    ],
  },
  {
    id: 'd4',
    question: {
      ko: '여행지에서 가장 듣고 싶은 소리는?',
      en: 'What sound do you want to hear?',
      ja: '旅先で一番聞きたい音は?',
      zh: '旅途中最想听到的声音?',
    },
    options: [
      { id: 'd4-1', axis: 'NU', score: 2, label: { ko: '파도·바람·새소리', en: 'Waves, wind, birds', ja: '波·風·鳥のさえずり', zh: '海浪·风·鸟鸣' } },
      { id: 'd4-2', axis: 'NU', score: 1, label: { ko: '풀벌레·계곡물', en: 'Crickets, mountain streams', ja: '虫の音·渓流', zh: '虫鸣·溪水' } },
      { id: 'd4-3', axis: 'NU', score: -1, label: { ko: '거리 음악·사람들 대화', en: 'Street music & chatter', ja: '街の音楽·会話', zh: '街头音乐·人语' } },
      { id: 'd4-4', axis: 'NU', score: -2, label: { ko: '지하철·번화가 활기', en: 'Subway & city buzz', ja: '地下鉄·繁華街の活気', zh: '地铁·繁华喧嚣' } },
    ],
  },
  // 축 3: PS (계획 vs 즉흥)
  {
    id: 'd5',
    question: {
      ko: '여행 출발 1주일 전 당신은?',
      en: 'One week before the trip?',
      ja: '出発1週間前のあなたは?',
      zh: '出发前一周的你?',
    },
    options: [
      { id: 'd5-1', axis: 'PS', score: 2, label: { ko: '엑셀로 분 단위 계획 완성', en: 'Excel itinerary by the minute', ja: 'エクセルで分刻みの計画', zh: 'Excel按分钟规划' } },
      { id: 'd5-2', axis: 'PS', score: 1, label: { ko: '주요 일정·맛집 리스트업', en: 'Key spots & food list ready', ja: '主要スポット·グルメリスト', zh: '主要景点·美食列表' } },
      { id: 'd5-3', axis: 'PS', score: -1, label: { ko: '대략 큰 틀만 정함', en: 'Rough plan only', ja: '大まかな計画のみ', zh: '只有大致计划' } },
      { id: 'd5-4', axis: 'PS', score: -2, label: { ko: '비행기·숙소 예약 외엔 무계획', en: 'Just flight & stay, the rest is wild', ja: '飛行機·宿以外は無計画', zh: '只订机票住宿,其它随性' } },
    ],
  },
  {
    id: 'd6',
    question: {
      ko: '현지에서 우연히 발견한 카페가 마음에 든다. 다음 일정은?',
      en: 'Found a great cafe by chance. Now what?',
      ja: '偶然見つけたカフェがいい感じ。次は?',
      zh: '偶然发现一家很棒的咖啡馆。然后呢?',
    },
    options: [
      { id: 'd6-1', axis: 'PS', score: 2, label: { ko: '계획된 다음 일정으로 출발', en: 'Stick to plan, move on', ja: '計画通り次へ', zh: '按计划前往下一站' } },
      { id: 'd6-2', axis: 'PS', score: 1, label: { ko: '30분만 잠깐 들렀다 감', en: '30 minutes max', ja: '30分だけ', zh: '只待30分钟' } },
      { id: 'd6-3', axis: 'PS', score: -1, label: { ko: '계획 미루고 1시간 머묾', en: 'Delay plan, stay an hour', ja: '計画を延ばして1時間', zh: '推迟计划,待一小时' } },
      { id: 'd6-4', axis: 'PS', score: -2, label: { ko: '오늘 계획 다 버리고 여기서 끝', en: 'Throw out the plan, stay all day', ja: '計画を捨てて一日中いる', zh: '丢掉计划,在这待一整天' } },
    ],
  },
  // 축 4: BL (가성비 vs 럭셔리)
  {
    id: 'd7',
    question: {
      ko: '숙소를 고를 때 1순위는?',
      en: 'Top priority for lodging?',
      ja: '宿選びの1番は?',
      zh: '选住宿的首要标准?',
    },
    options: [
      { id: 'd7-1', axis: 'BL', score: 2, label: { ko: '하룻밤 4~6만 원, 깨끗하면 OK', en: '$30-50, clean enough', ja: '4~6千円、清潔ならOK', zh: '300~500元,干净就行' } },
      { id: 'd7-2', axis: 'BL', score: 1, label: { ko: '8~12만 원, 위치 좋음', en: '$70-100, good location', ja: '8~12千円、好立地', zh: '700~1000元,位置好' } },
      { id: 'd7-3', axis: 'BL', score: -1, label: { ko: '15~25만 원, 부대시설 갖춤', en: '$130-200, full amenities', ja: '1.5~2.5万円、設備完備', zh: '1300~2200元,设施齐全' } },
      { id: 'd7-4', axis: 'BL', score: -2, label: { ko: '40만 원 이상 5성급 풀빌라', en: '$350+ 5-star pool villa', ja: '4万円以上の5つ星', zh: '3500元以上五星泳池别墅' } },
    ],
  },
  {
    id: 'd8',
    question: {
      ko: '한 끼 식사로 한 번에 쓸 수 있는 최대 예산?',
      en: 'Max for a single meal?',
      ja: '一食の最大予算?',
      zh: '一餐的最高预算?',
    },
    options: [
      { id: 'd8-1', axis: 'BL', score: 2, label: { ko: '8천 원 길거리 음식', en: '$8 street food', ja: '8千円ストリートフード', zh: '70元小吃' } },
      { id: 'd8-2', axis: 'BL', score: 1, label: { ko: '2만 원 가성비 맛집', en: '$20 local favorite', ja: '2万円名物', zh: '200元当地名店' } },
      { id: 'd8-3', axis: 'BL', score: -1, label: { ko: '8만 원 분위기 좋은 곳', en: '$70 nice ambience', ja: '8万円雰囲気重視', zh: '700元氛围餐厅' } },
      { id: 'd8-4', axis: 'BL', score: -2, label: { ko: '20만 원 미슐랭', en: '$200 Michelin', ja: '20万円ミシュラン', zh: '2000元米其林' } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 스코어링 — 4축 점수 (각 -4 ~ +4) → 백분율 (0 ~ 100) → 4글자 코드
// ─────────────────────────────────────────────────────────────
export interface DnaScores {
  AC: number; NU: number; PS: number; BL: number;
}
export interface DnaResult {
  scores: DnaScores;
  /** 각 축의 high 쪽 백분율 (0~100) */
  percent: DnaScores;
  /** 4글자 코드 (예: ANPB) */
  code: string;
}

export function computeDna(optionIds: string[]): DnaResult {
  const scores: DnaScores = { AC: 0, NU: 0, PS: 0, BL: 0 };
  const optMap = new Map<string, DnaOption>();
  for (const q of DNA_QUESTIONS) for (const o of q.options) optMap.set(o.id, o);
  for (const id of optionIds) {
    const o = optMap.get(id);
    if (!o) continue;
    scores[o.axis] += o.score;
  }
  // 백분율: -4 → 0%, 0 → 50%, +4 → 100%
  const pct = (s: number) => Math.round(((s + 4) / 8) * 100);
  const percent: DnaScores = { AC: pct(scores.AC), NU: pct(scores.NU), PS: pct(scores.PS), BL: pct(scores.BL) };
  let code = '';
  for (const a of AXES) {
    const v = scores[a.key];
    code += v >= 0 ? a.highCode : a.lowCode;
  }
  return { scores, percent, code };
}

// ─────────────────────────────────────────────────────────────
// 16 유형 메타 — 코드별 별명·태그라인·설명·그라데이션
// 자동 생성 + 일부 키 유형만 커스텀. 데이터 짧게 유지.
// ─────────────────────────────────────────────────────────────
export interface DnaPersona {
  code: string;            // 4글자
  emoji: string;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  description: Record<Lang, string>;
  /** 결과 카드 그라데이션 */
  gradient: { from: string; to: string };
  /** 멘토 — 가상 캐릭터 매칭 (저작권 안전, 한 줄) */
  mentor: Record<Lang, string>;
  /** 강점 3개 */
  strengths: Record<Lang, string[]>;
  /** 주의점 3개 */
  cautions: Record<Lang, string[]>;
  /** 여행 팁 3개 */
  tips: Record<Lang, string[]>;
  /** 희귀도 — 16유형 분포 % (모두 합 100) */
  rarity: number;
  /** 잘 맞는 동행 유형 코드 2개 */
  bestMatches: string[];
  /** 안 맞는 동행 유형 코드 1개 */
  worstMatch: string;
}

/** 16 유형 — 코드 기반으로 빌드 (4축 조합) */
function buildPersonas(): Record<string, DnaPersona> {
  // 각 코드 → 키워드 메타 (이모지·이름)
  // 한국어로 4글자 조합 → "○○형" 별명
  // 예) ANPB = "활동·자연·계획·가성비" → "야생 탐험가"
  const META: Record<string, { emoji: string; key: string }> = {
    ANPB: { emoji: '🏔️', key: 'wild-explorer' },     // 활동·자연·계획·가성비
    ANPL: { emoji: '⛷️', key: 'glamping-trekker' },  // 활동·자연·계획·럭셔리
    ANSB: { emoji: '🎒', key: 'free-hiker' },         // 활동·자연·즉흥·가성비
    ANSL: { emoji: '🧗', key: 'eco-luxury' },         // 활동·자연·즉흥·럭셔리
    AUPB: { emoji: '🏙️', key: 'city-jogger' },       // 활동·도시·계획·가성비
    AUPL: { emoji: '🌃', key: 'urban-luxe' },         // 활동·도시·계획·럭셔리
    AUSB: { emoji: '🚶', key: 'street-wanderer' },    // 활동·도시·즉흥·가성비
    AUSL: { emoji: '🍷', key: 'night-luxury' },       // 활동·도시·즉흥·럭셔리
    CNPB: { emoji: '🌲', key: 'forest-meditator' },   // 휴식·자연·계획·가성비
    CNPL: { emoji: '♨️', key: 'onsen-soaker' },       // 휴식·자연·계획·럭셔리
    CNSB: { emoji: '🏕️', key: 'lazy-camper' },        // 휴식·자연·즉흥·가성비
    CNSL: { emoji: '🛀', key: 'spa-island' },         // 휴식·자연·즉흥·럭셔리
    CUPB: { emoji: '☕', key: 'cafe-planner' },       // 휴식·도시·계획·가성비
    CUPL: { emoji: '🏨', key: 'staycation' },         // 휴식·도시·계획·럭셔리
    CUSB: { emoji: '📚', key: 'bookstore-drifter' },  // 휴식·도시·즉흥·가성비
    CUSL: { emoji: '🥂', key: 'rooftop-lounger' },    // 휴식·도시·즉흥·럭셔리
  };
  const NAMES: Record<string, Record<Lang, string>> = {
    'wild-explorer': { ko: '야생 탐험가', en: 'Wild Explorer', ja: '野生の探検家', zh: '野外探险家' },
    'glamping-trekker': { ko: '글램핑 트레커', en: 'Glamping Trekker', ja: 'グランピングトレッカー', zh: '豪华野营客' },
    'free-hiker': { ko: '자유로운 산악인', en: 'Free Hiker', ja: '自由なハイカー', zh: '自由徒步者' },
    'eco-luxury': { ko: '에코 럭셔리', en: 'Eco-Luxury', ja: 'エコラグジュアリー', zh: '生态奢华派' },
    'city-jogger': { ko: '도시 러너', en: 'City Jogger', ja: '都市ランナー', zh: '都市跑者' },
    'urban-luxe': { ko: '도시 럭셔리', en: 'Urban Luxe', ja: 'アーバンラグジュアリー', zh: '都市奢华派' },
    'street-wanderer': { ko: '거리의 방랑자', en: 'Street Wanderer', ja: '街の放浪者', zh: '街头漫游者' },
    'night-luxury': { ko: '나이트 럭셔리', en: 'Night Luxury', ja: 'ナイトラグジュアリー', zh: '夜之奢华派' },
    'forest-meditator': { ko: '숲속 명상가', en: 'Forest Meditator', ja: '森の瞑想家', zh: '森林冥想者' },
    'onsen-soaker': { ko: '온천 휴양가', en: 'Onsen Soaker', ja: '温泉派', zh: '温泉度假者' },
    'lazy-camper': { ko: '게으른 캠퍼', en: 'Lazy Camper', ja: 'のんびりキャンパー', zh: '懒人露营者' },
    'spa-island': { ko: '스파 아일랜더', en: 'Spa Islander', ja: 'スパアイランダー', zh: '岛屿水疗派' },
    'cafe-planner': { ko: '카페 플래너', en: 'Cafe Planner', ja: 'カフェプランナー', zh: '咖啡馆规划师' },
    'staycation': { ko: '호캉스 마니아', en: 'Staycation Pro', ja: 'ホカンスマニア', zh: '酒店度假迷' },
    'bookstore-drifter': { ko: '책방 드리프터', en: 'Bookstore Drifter', ja: '本屋ドリフター', zh: '书店漫游者' },
    'rooftop-lounger': { ko: '루프탑 라운저', en: 'Rooftop Lounger', ja: 'ルーフトップラウンジャー', zh: '屋顶酒廊客' },
  };
  const TAGLINES: Record<string, Record<Lang, string>> = {
    'wild-explorer': { ko: '계획된 모험은 더 짜릿하다', en: 'Planned adventures hit harder', ja: '計画的な冒険ほどスリル', zh: '计划好的冒险更刺激' },
    'glamping-trekker': { ko: '땀 흘리고 럭셔리로 회복', en: 'Sweat, then luxurious recovery', ja: '汗をかいて高級で癒す', zh: '出汗后用奢华恢复' },
    'free-hiker': { ko: '발 닿는 대로 산을 탄다', en: 'Mountains, wherever feet lead', ja: '足の向くまま山へ', zh: '随脚步走的山客' },
    'eco-luxury': { ko: '자연 속의 호사', en: 'Luxury in nature', ja: '自然の中の贅沢', zh: '自然中的奢华' },
    'city-jogger': { ko: '도시를 두 발로 정복', en: 'Conquer the city on foot', ja: '街を足で制覇', zh: '用脚征服城市' },
    'urban-luxe': { ko: '최상의 도시 경험을 설계', en: 'Crafting top-tier city experiences', ja: '最高の都市体験を設計', zh: '设计极致都市体验' },
    'street-wanderer': { ko: '골목 끝까지 가본다', en: 'Down every alley', ja: '路地の果てまで', zh: '走遍每条小巷' },
    'night-luxury': { ko: '밤이 가장 빛난다', en: 'The night shines brightest', ja: '夜が一番輝く', zh: '夜晚最闪耀' },
    'forest-meditator': { ko: '나무 사이에서 비워낸다', en: 'Empty out among trees', ja: '木々の間で空にする', zh: '在树木间清空自我' },
    'onsen-soaker': { ko: '뜨거운 물 한 시간이 인생', en: 'One hour in hot water = life', ja: '熱い湯一時間が人生', zh: '泡一小时温泉就是人生' },
    'lazy-camper': { ko: '캠핑 의자가 곧 천국', en: 'A camping chair is heaven', ja: 'キャンプチェアが天国', zh: '露营椅就是天堂' },
    'spa-island': { ko: '바다 위 스파에서 시간을 잊다', en: 'Forget time at island spa', ja: '島スパで時を忘れる', zh: '在岛屿水疗中忘却时间' },
    'cafe-planner': { ko: '카페 리스트 한 권', en: 'A book of cafe lists', ja: 'カフェリスト一冊', zh: '一本咖啡馆清单' },
    'staycation': { ko: '호텔에서 안 나와도 좋아', en: 'Hotel-only is fine', ja: 'ホテルから出なくてもOK', zh: '不出酒店也行' },
    'bookstore-drifter': { ko: '책방 한 곳에서 반나절', en: 'Half a day in a bookstore', ja: '本屋で半日', zh: '在书店待半天' },
    'rooftop-lounger': { ko: '도시 야경과 칵테일', en: 'City lights & cocktails', ja: '夜景とカクテル', zh: '都市夜景与鸡尾酒' },
  };
  const GRADIENTS: Record<string, { from: string; to: string }> = {
    // 자연 = 초록 톤, 도시 = 보라/파랑 톤, 럭셔리 = 진한 톤, 가성비 = 밝은 톤
    'wild-explorer': { from: '#16a34a', to: '#0e7490' },
    'glamping-trekker': { from: '#15803d', to: '#3f3f46' },
    'free-hiker': { from: '#22c55e', to: '#0891b2' },
    'eco-luxury': { from: '#16a34a', to: '#171717' },
    'city-jogger': { from: '#7c3aed', to: '#dc2626' },
    'urban-luxe': { from: '#5b21b6', to: '#171717' },
    'street-wanderer': { from: '#a855f7', to: '#f97316' },
    'night-luxury': { from: '#312e81', to: '#171717' },
    'forest-meditator': { from: '#15803d', to: '#0e7490' },
    'onsen-soaker': { from: '#0891b2', to: '#3f3f46' },
    'lazy-camper': { from: '#84cc16', to: '#65a30d' },
    'spa-island': { from: '#06b6d4', to: '#171717' },
    'cafe-planner': { from: '#a16207', to: '#92400e' },
    'staycation': { from: '#a78bfa', to: '#1e3a8a' },
    'bookstore-drifter': { from: '#facc15', to: '#92400e' },
    'rooftop-lounger': { from: '#581c87', to: '#171717' },
  };

  // 멘토 캐릭터 — 가상 직업/유형 매칭
  const MENTORS: Record<string, Record<Lang, string>> = {
    'wild-explorer': { ko: '다큐멘터리 PD 같은 여행자', en: 'Like a documentary producer', ja: 'ドキュメンタリーPDのような旅人', zh: '像纪录片导演的旅人' },
    'glamping-trekker': { ko: '아웃도어 브랜드 모델', en: 'Outdoor brand model', ja: 'アウトドアブランドモデル', zh: '户外品牌模特' },
    'free-hiker': { ko: '도보 여행가·산악인', en: 'Foot-trail wanderer', ja: '徒歩旅行家', zh: '徒步旅行家' },
    'eco-luxury': { ko: '리조트 컨설턴트', en: 'Eco-resort consultant', ja: 'エコリゾートコンサルタント', zh: '生态度假村顾问' },
    'city-jogger': { ko: '시티 트레이너', en: 'City trainer', ja: 'シティトレーナー', zh: '城市训练师' },
    'urban-luxe': { ko: '라이프스타일 큐레이터', en: 'Lifestyle curator', ja: 'ライフスタイルキュレーター', zh: '生活策展人' },
    'street-wanderer': { ko: '거리 사진작가', en: 'Street photographer', ja: 'ストリート写真家', zh: '街头摄影师' },
    'night-luxury': { ko: '나이트 라이프 에디터', en: 'Nightlife editor', ja: 'ナイトライフエディター', zh: '夜生活编辑' },
    'forest-meditator': { ko: '명상 가이드', en: 'Mindfulness guide', ja: '瞑想ガイド', zh: '冥想引导师' },
    'onsen-soaker': { ko: '온천 소믈리에', en: 'Onsen sommelier', ja: '温泉ソムリエ', zh: '温泉品鉴师' },
    'lazy-camper': { ko: '슬로우 라이프 작가', en: 'Slow-life writer', ja: 'スローライフ作家', zh: '慢活作家' },
    'spa-island': { ko: '리트리트 디렉터', en: 'Retreat director', ja: 'リトリートディレクター', zh: '静修营总监' },
    'cafe-planner': { ko: '카페 큐레이터', en: 'Cafe curator', ja: 'カフェキュレーター', zh: '咖啡馆策展人' },
    'staycation': { ko: '호텔 리뷰어', en: 'Hotel reviewer', ja: 'ホテルレビュアー', zh: '酒店评测人' },
    'bookstore-drifter': { ko: '책방 칼럼니스트', en: 'Bookstore columnist', ja: '書店コラムニスト', zh: '书店专栏作家' },
    'rooftop-lounger': { ko: '미식 트래블 인플루언서', en: 'Foodie travel influencer', ja: 'グルメトラベルインフルエンサー', zh: '美食旅游博主' },
  };
  // 강점 3개 (페르소나별)
  const STRENGTHS: Record<string, Record<Lang, string[]>> = {
    'wild-explorer': {
      ko: ['🧭 길 찾기 직감 뛰어남', '💪 체력·인내력 강함', '📸 자연 사진 감각'],
      en: ['🧭 Strong navigation instinct', '💪 Endurance & grit', '📸 Eye for nature photos'],
      ja: ['🧭 道案内の直感', '💪 体力·忍耐力', '📸 自然写真のセンス'],
      zh: ['🧭 方向感强', '💪 体力毅力', '📸 自然摄影感'],
    },
    'glamping-trekker': {
      ko: ['🏕️ 야외와 휴양의 균형', '🍷 분위기 연출 잘함', '🎒 장비 선택 안목'],
      en: ['🏕️ Outdoor-luxury balance', '🍷 Setting the mood', '🎒 Gear curation'],
      ja: ['🏕️ 野外と休養のバランス', '🍷 雰囲気作り', '🎒 装備選び'],
      zh: ['🏕️ 户外与度假平衡', '🍷 营造氛围', '🎒 装备眼光'],
    },
    'free-hiker': {
      ko: ['🌲 자연 적응력', '🗺️ 즉흥 루트 발견', '☀️ 강한 멘탈'],
      en: ['🌲 Nature adaptability', '🗺️ Improvising routes', '☀️ Mental toughness'],
      ja: ['🌲 自然への適応力', '🗺️ 即興ルート発見', '☀️ メンタルの強さ'],
      zh: ['🌲 自然适应力', '🗺️ 即兴探路', '☀️ 心理强韧'],
    },
    'eco-luxury': {
      ko: ['🌿 지속가능 여행 의식', '✨ 디테일 안목', '🛎️ 서비스 평가 능력'],
      en: ['🌿 Sustainability mindset', '✨ Eye for detail', '🛎️ Judging service'],
      ja: ['🌿 サステナブル意識', '✨ ディテール眼', '🛎️ サービス評価'],
      zh: ['🌿 可持续意识', '✨ 细节眼光', '🛎️ 服务评估'],
    },
    'city-jogger': {
      ko: ['👟 하루 종일 걸어도 OK', '🏙️ 도시 동선 파악 빠름', '🧠 효율적 일정 짜기'],
      en: ['👟 All-day walker', '🏙️ Quick city wayfinding', '🧠 Efficient itinerary'],
      ja: ['👟 一日中歩ける', '🏙️ 都市動線把握', '🧠 効率的なスケジュール'],
      zh: ['👟 全天行走', '🏙️ 快速识路', '🧠 高效行程'],
    },
    'urban-luxe': {
      ko: ['🎯 베스트 스팟 선별', '💎 품질 보는 눈', '📋 완벽 준비'],
      en: ['🎯 Picking the best', '💎 Quality eye', '📋 Perfect prep'],
      ja: ['🎯 ベストスポット選別', '💎 品質眼', '📋 完璧な準備'],
      zh: ['🎯 优质景点筛选', '💎 品质眼光', '📋 完美准备'],
    },
    'street-wanderer': {
      ko: ['👀 관찰력 뛰어남', '🗣️ 현지인과 친해짐', '🍜 진짜 맛집 찾기'],
      en: ['👀 Keen observation', '🗣️ Befriends locals', '🍜 Finds real gems'],
      ja: ['👀 観察力', '🗣️ 地元民と仲良くなる', '🍜 本物の名店を見つける'],
      zh: ['👀 观察力强', '🗣️ 与当地人交心', '🍜 找到真正美食'],
    },
    'night-luxury': {
      ko: ['🌃 야간 활동 체력', '🎭 분위기 즐기기', '🍸 칵테일 입맛'],
      en: ['🌃 Night-energy', '🎭 Vibe appreciation', '🍸 Cocktail palate'],
      ja: ['🌃 夜間エネルギー', '🎭 雰囲気を楽しむ', '🍸 カクテルの味覚'],
      zh: ['🌃 夜间精力', '🎭 享受氛围', '🍸 鸡尾酒口味'],
    },
    'forest-meditator': {
      ko: ['🧘 내면 집중력', '🍃 작은 것에 감사', '😌 스트레스 회복'],
      en: ['🧘 Inner focus', '🍃 Gratitude for little things', '😌 Stress recovery'],
      ja: ['🧘 内面集中力', '🍃 小さなことへの感謝', '😌 ストレス回復'],
      zh: ['🧘 内心专注', '🍃 感恩小事', '😌 减压恢复'],
    },
    'onsen-soaker': {
      ko: ['♨️ 휴식의 진수', '🍵 슬로우 라이프 감각', '🧖 신체 회복'],
      en: ['♨️ Essence of rest', '🍵 Slow-life sense', '🧖 Physical recovery'],
      ja: ['♨️ 休息の真髄', '🍵 スローライフ感覚', '🧖 身体回復'],
      zh: ['♨️ 休憩精髓', '🍵 慢生活感', '🧖 身体恢复'],
    },
    'lazy-camper': {
      ko: ['🪑 머무름의 즐거움', '🌌 작은 것에 행복', '🔥 모닥불 분위기 메이커'],
      en: ['🪑 Joy in staying put', '🌌 Small-joy mindset', '🔥 Campfire vibe-maker'],
      ja: ['🪑 留まる楽しさ', '🌌 小さな幸せ', '🔥 焚き火の雰囲気作り'],
      zh: ['🪑 享受逗留', '🌌 小确幸', '🔥 营火氛围师'],
    },
    'spa-island': {
      ko: ['🌊 자연 럭셔리 감각', '🛀 셀프케어 마스터', '🏝️ 휴양지 선별력'],
      en: ['🌊 Natural-luxury sense', '🛀 Self-care master', '🏝️ Resort discernment'],
      ja: ['🌊 自然ラグジュアリー感覚', '🛀 セルフケアの達人', '🏝️ リゾート選別力'],
      zh: ['🌊 自然奢华感', '🛀 自我护理大师', '🏝️ 度假地鉴别力'],
    },
    'cafe-planner': {
      ko: ['☕ 카페 라인업 정리', '📓 디테일 메모', '🎨 미적 감각'],
      en: ['☕ Cafe lineup curation', '📓 Detailed notes', '🎨 Aesthetic sense'],
      ja: ['☕ カフェリスト整理', '📓 詳細メモ', '🎨 美的感覚'],
      zh: ['☕ 咖啡馆名单整理', '📓 详细笔记', '🎨 美感'],
    },
    'staycation': {
      ko: ['🏨 호텔 디테일 평가', '🛏️ 휴식 우선순위', '🍽️ 룸서비스 활용'],
      en: ['🏨 Hotel detail review', '🛏️ Rest first', '🍽️ Room-service savvy'],
      ja: ['🏨 ホテル評価力', '🛏️ 休息優先', '🍽️ ルームサービス活用'],
      zh: ['🏨 酒店评估力', '🛏️ 休息优先', '🍽️ 客房服务'],
    },
    'bookstore-drifter': {
      ko: ['📖 사색 능력', '🎧 혼자 노는 법', '✍️ 글 쓰는 감수성'],
      en: ['📖 Contemplative mind', '🎧 Alone-time skill', '✍️ Writing sensitivity'],
      ja: ['📖 思索力', '🎧 一人時間', '✍️ 書く感受性'],
      zh: ['📖 思考力', '🎧 独处能力', '✍️ 写作感性'],
    },
    'rooftop-lounger': {
      ko: ['🥂 미식 안목', '📷 SNS 컨텐츠 감각', '🌃 야경 포인트 발견'],
      en: ['🥂 Foodie taste', '📷 SNS content sense', '🌃 Night-view spotter'],
      ja: ['🥂 グルメ眼', '📷 SNSコンテンツ感覚', '🌃 夜景スポット発見'],
      zh: ['🥂 美食眼光', '📷 SNS内容感', '🌃 夜景点定位'],
    },
  };
  // 주의점 — 모든 페르소나 공통적인 형태로 자동 생성 (단순 + 일관성)
  const CAUTIONS_BY_AXIS_HIGH: Record<string, Record<Lang, string>> = {
    A: { ko: '⚠️ 동행자의 체력을 자주 체크하세요', en: '⚠️ Check on your companion\'s energy', ja: '⚠️ 同行者の体力をこまめに確認', zh: '⚠️ 留意同伴的体力' },
    N: { ko: '⚠️ 도시 즐길거리도 일정에 넣기', en: '⚠️ Don\'t skip urban experiences', ja: '⚠️ 都市の楽しみも予定に', zh: '⚠️ 别错过都市体验' },
    P: { ko: '⚠️ 변수 받아들이는 연습', en: '⚠️ Practice flexibility', ja: '⚠️ 柔軟性の練習', zh: '⚠️ 练习灵活应变' },
    B: { ko: '⚠️ 가끔 럭셔리도 경험해보기', en: '⚠️ Try a splurge once in a while', ja: '⚠️ たまには贅沢も', zh: '⚠️ 偶尔奢华一下' },
  };
  const CAUTIONS_BY_AXIS_LOW: Record<string, Record<Lang, string>> = {
    C: { ko: '⚠️ 너무 늘어지지 않게 활동 시간 확보', en: '⚠️ Keep some active time', ja: '⚠️ 怠けすぎないよう活動時間も', zh: '⚠️ 保留活动时间' },
    U: { ko: '⚠️ 가끔은 자연 속 디지털 디톡스', en: '⚠️ Digital-detox in nature occasionally', ja: '⚠️ たまには自然でデジタルデトックス', zh: '⚠️ 偶尔自然中数字排毒' },
    S: { ko: '⚠️ 핵심 일정·예약은 미리', en: '⚠️ Book key items in advance', ja: '⚠️ 主要予約は事前に', zh: '⚠️ 关键预订要提前' },
    L: { ko: '⚠️ 예산 관리 한 번 더 점검', en: '⚠️ Double-check the budget', ja: '⚠️ 予算管理を再確認', zh: '⚠️ 再次确认预算' },
  };
  function buildCautions(code: string): Record<Lang, string[]> {
    const langs: Lang[] = ['ko', 'en', 'ja', 'zh'];
    const out: Record<Lang, string[]> = { ko: [], en: [], ja: [], zh: [] };
    for (const lang of langs) {
      const arr: string[] = [];
      AXES.forEach((a, i) => {
        const ch = code[i];
        const map = ch === a.highCode ? CAUTIONS_BY_AXIS_HIGH : CAUTIONS_BY_AXIS_LOW;
        const msg = map[ch]?.[lang];
        if (msg) arr.push(msg);
      });
      // 3개만 (4축 중 첫 3)
      out[lang] = arr.slice(0, 3);
    }
    return out;
  }
  // 여행 팁 (페르소나별 3개)
  const TIPS: Record<string, Record<Lang, string[]>> = {
    'wild-explorer': {
      ko: ['🥾 등산화·방수자켓 필수', '🗓️ 일출 시간 미리 체크', '📡 산악구조대 번호 저장'],
      en: ['🥾 Hiking boots & rain jacket', '🗓️ Check sunrise times', '📡 Save mountain rescue number'],
      ja: ['🥾 登山靴·レインジャケット必須', '🗓️ 日の出時刻チェック', '📡 山岳救助連絡先保存'],
      zh: ['🥾 必备登山鞋·雨衣', '🗓️ 提前查日出时间', '📡 保存山地救援电话'],
    },
    'glamping-trekker': {
      ko: ['🏕️ 글램핑+등산 패키지 검색', '📱 캠핑장 예약 일찍', '🥃 모닥불용 마실거리 준비'],
      en: ['🏕️ Look for glamping+hike combos', '📱 Book campsite early', '🥃 Pack campfire drinks'],
      ja: ['🏕️ グランピング+ハイク検索', '📱 キャンプ場予約は早めに', '🥃 焚き火用ドリンク準備'],
      zh: ['🏕️ 搜索豪华野营+徒步', '📱 提早预订营地', '🥃 准备营火饮品'],
    },
    'free-hiker': {
      ko: ['🎒 30L 미만 경량 배낭', '🌧️ 일기예보 매시간 체크', '👥 인적 드문 코스 동행자 권장'],
      en: ['🎒 Lightweight 30L pack', '🌧️ Check forecast hourly', '👥 Bring company on remote routes'],
      ja: ['🎒 30L以下の軽量バックパック', '🌧️ 天気予報を毎時確認', '👥 人気のないルートは同行者と'],
      zh: ['🎒 30L以下轻装包', '🌧️ 每小时查天气', '👥 偏远路线带同伴'],
    },
    'eco-luxury': {
      ko: ['🌱 친환경 인증 숙소 우선', '📞 컨시어지에게 현지 셰프 추천 요청', '🎨 미술관·갤러리 연계'],
      en: ['🌱 Prioritize eco-certified stays', '📞 Ask concierge for chef picks', '🎨 Pair with galleries'],
      ja: ['🌱 エコ認証宿を優先', '📞 コンシェルジュにシェフ推薦', '🎨 美術館と組み合わせ'],
      zh: ['🌱 优先环保认证住宿', '📞 让礼宾推荐厨师', '🎨 搭配美术馆'],
    },
    'city-jogger': {
      ko: ['👟 가벼운 러닝화', '🗺️ 구글맵 오프라인 저장', '☕ 사이사이 카페 휴식'],
      en: ['👟 Light running shoes', '🗺️ Save Google Maps offline', '☕ Cafe breaks between'],
      ja: ['👟 軽量ランニングシューズ', '🗺️ Googleマップオフライン保存', '☕ 合間にカフェ休憩'],
      zh: ['👟 轻便跑鞋', '🗺️ Google地图离线缓存', '☕ 中间咖啡馆休息'],
    },
    'urban-luxe': {
      ko: ['🎫 미슐랭·인기 레스토랑 한달 전 예약', '🚗 공항-호텔 차량 픽업', '🛍️ 면세점 사전 쇼핑'],
      en: ['🎫 Reserve Michelin a month ahead', '🚗 Pre-book airport-hotel transfer', '🛍️ Duty-free pre-shop'],
      ja: ['🎫 ミシュランは1ヶ月前予約', '🚗 空港-ホテル送迎手配', '🛍️ 免税店事前予約'],
      zh: ['🎫 提前一个月订米其林', '🚗 预订机场-酒店接送', '🛍️ 提前免税店购物'],
    },
    'street-wanderer': {
      ko: ['📷 35mm 단렌즈 추천', '💵 작은 현금 챙기기', '🌐 현지어 인사 5개 외우기'],
      en: ['📷 35mm prime lens recommended', '💵 Carry small cash', '🌐 Learn 5 local phrases'],
      ja: ['📷 35mm単焦点推奨', '💵 小銭を持参', '🌐 現地語の挨拶を5つ'],
      zh: ['📷 推荐35mm定焦镜头', '💵 带小额现金', '🌐 学5句当地问候'],
    },
    'night-luxury': {
      ko: ['🕗 21시 이후 영업 리스트업', '🚕 야간 택시 앱 미리 설치', '👔 드레스 코드 체크'],
      en: ['🕗 List 9pm+ venues', '🚕 Install night-taxi apps', '👔 Check dress codes'],
      ja: ['🕗 21時以降営業リスト', '🚕 夜間タクシーアプリ事前', '👔 ドレスコード確認'],
      zh: ['🕗 列出21点以后营业的店', '🚕 预装夜间打车app', '👔 确认着装要求'],
    },
    'forest-meditator': {
      ko: ['🎒 가벼운 짐만', '🪕 음악·앱 차단 시간 정해두기', '🍵 좋은 차 한 종 챙기기'],
      en: ['🎒 Light luggage only', '🪕 Set music-off hours', '🍵 Bring one good tea'],
      ja: ['🎒 軽い荷物のみ', '🪕 音楽·アプリオフ時間', '🍵 良いお茶を一種'],
      zh: ['🎒 只带轻装', '🪕 设音乐app停用时段', '🍵 带一种好茶'],
    },
    'onsen-soaker': {
      ko: ['🥒 온천 후 식사·수분 보충', '🚉 료칸 송영서비스 활용', '🌡️ 체온 변화에 주의'],
      en: ['🥒 Hydrate after onsen', '🚉 Use ryokan shuttle', '🌡️ Mind temperature shifts'],
      ja: ['🥒 温泉後の食事·水分補給', '🚉 旅館送迎活用', '🌡️ 体温変化に注意'],
      zh: ['🥒 温泉后补充水分', '🚉 利用旅馆接送', '🌡️ 注意体温变化'],
    },
    'lazy-camper': {
      ko: ['🪑 캠핑 의자·해먹 챙기기', '🌌 별 관측 앱 설치', '🍳 간단 화구 1세트'],
      en: ['🪑 Bring chair + hammock', '🌌 Install star-gazing app', '🍳 One simple stove kit'],
      ja: ['🪑 キャンプチェア·ハンモック', '🌌 星観察アプリインストール', '🍳 シンプル調理セット'],
      zh: ['🪑 备好椅子和吊床', '🌌 安装观星app', '🍳 简易炊具一套'],
    },
    'spa-island': {
      ko: ['🛂 페리·항공 일정 사전 확인', '🛍️ 스파 패키지 비교 예약', '🌊 일출·일몰 시간표'],
      en: ['🛂 Check ferry/flight schedules', '🛍️ Compare spa packages', '🌊 Sunrise/sunset times'],
      ja: ['🛂 フェリー·便事前確認', '🛍️ スパパッケージ比較予約', '🌊 日の出·日の入時刻'],
      zh: ['🛂 提前查渡轮·航班', '🛍️ 比较水疗套餐', '🌊 日出日落时刻'],
    },
    'cafe-planner': {
      ko: ['📓 카페 5-7곳 미리 리스트', '🪪 카페 운영시간 체크', '🎒 노트북·책 가볍게'],
      en: ['📓 Pre-list 5-7 cafes', '🪪 Check opening hours', '🎒 Light laptop/book'],
      ja: ['📓 カフェ5-7軒事前リスト', '🪪 営業時間確認', '🎒 ノートPC·本軽め'],
      zh: ['📓 提前列5-7家咖啡馆', '🪪 查营业时间', '🎒 轻便笔电·书籍'],
    },
    'staycation': {
      ko: ['🏨 어메니티 좋은 호텔 선별', '🛀 욕조 있는 룸 우선', '🍽️ 룸서비스 메뉴 사전 확인'],
      en: ['🏨 Curate amenity-rich hotels', '🛀 Prefer rooms with tub', '🍽️ Check room-service menu'],
      ja: ['🏨 アメニティ豊富なホテル', '🛀 浴槽付きの部屋', '🍽️ ルームサービスメニュー確認'],
      zh: ['🏨 选用品丰富的酒店', '🛀 优选带浴缸房间', '🍽️ 提前查客房菜单'],
    },
    'bookstore-drifter': {
      ko: ['📖 노트·만년필 준비', '🎧 노이즈캔슬링 헤드폰', '☕ 책방 옆 카페 함께'],
      en: ['📖 Notebook + fountain pen', '🎧 Noise-cancelling headphones', '☕ Pair bookstore with cafe'],
      ja: ['📖 ノート·万年筆準備', '🎧 ノイズキャンセリングヘッドホン', '☕ 本屋+カフェ'],
      zh: ['📖 备好笔记本钢笔', '🎧 降噪耳机', '☕ 书店+咖啡馆搭配'],
    },
    'rooftop-lounger': {
      ko: ['📱 핫플 SNS 예약', '🎵 분위기 좋은 플레이리스트', '🍷 와인·칵테일 가게 리스트'],
      en: ['📱 Reserve trendy spots via SNS', '🎵 Curated playlist ready', '🍷 Wine/cocktail bar list'],
      ja: ['📱 SNSで人気店予約', '🎵 雰囲気プレイリスト', '🍷 ワイン·バーリスト'],
      zh: ['📱 SNS预订热门店', '🎵 准备氛围歌单', '🍷 葡萄酒·鸡尾酒店列表'],
    },
  };
  // 희귀도 분포 — 16개 합 100% (활동·럭셔리는 희소, 카페·도시 산책은 흔함)
  const RARITY: Record<string, number> = {
    ANPB: 8,  ANPL: 4,  ANSB: 6,  ANSL: 3,
    AUPB: 7,  AUPL: 5,  AUSB: 9,  AUSL: 4,
    CNPB: 6,  CNPL: 5,  CNSB: 7,  CNSL: 4,
    CUPB: 12, CUPL: 6,  CUSB: 8,  CUSL: 6,
  };

  /** 가장 잘 맞는 동행 — 4축 중 3개 같은 (보완적 유형) 가장 가까운 2개 */
  function bestMatchesFor(code: string): string[] {
    const candidates = DNA_CODE_LIST.filter((c) => c !== code).map((c) => {
      let same = 0;
      for (let i = 0; i < 4; i++) if (c[i] === code[i]) same++;
      return { c, same };
    });
    // same=3 우선, 그 다음 same=2
    candidates.sort((a, b) => b.same - a.same);
    return candidates.slice(0, 2).map((x) => x.c);
  }
  function worstMatchFor(code: string): string {
    // 정반대 코드 (각 축 반대)
    const flip = (ch: string, i: number) => {
      const a = AXES[i];
      return ch === a.highCode ? a.lowCode : a.highCode;
    };
    return code.split('').map(flip).join('');
  }

  const out: Record<string, DnaPersona> = {};
  for (const [code, meta] of Object.entries(META)) {
    out[code] = {
      code,
      emoji: meta.emoji,
      name: NAMES[meta.key],
      tagline: TAGLINES[meta.key],
      description: {
        ko: `${TAGLINES[meta.key].ko} — 활동·자연·계획·예산 4가지 축의 조합으로 만들어진 당신만의 여행 DNA.`,
        en: `${TAGLINES[meta.key].en} — Your unique travel DNA from the 4 axes of activity, nature, planning, budget.`,
        ja: `${TAGLINES[meta.key].ja} — 活動·自然·計画·予算の4軸から生まれたあなたの旅行DNA。`,
        zh: `${TAGLINES[meta.key].zh} — 由活动·自然·计划·预算4个轴构成的专属旅行DNA。`,
      },
      gradient: GRADIENTS[meta.key],
      mentor: MENTORS[meta.key],
      strengths: STRENGTHS[meta.key],
      cautions: buildCautions(code),
      tips: TIPS[meta.key],
      rarity: RARITY[code] ?? 6,
      bestMatches: bestMatchesFor(code),
      worstMatch: worstMatchFor(code),
    };
  }
  return out;
}
// 코드 목록 — buildPersonas 안에서 참조용
const DNA_CODE_LIST: string[] = [
  'ANPB','ANPL','ANSB','ANSL',
  'AUPB','AUPL','AUSB','AUSL',
  'CNPB','CNPL','CNSB','CNSL',
  'CUPB','CUPL','CUSB','CUSL',
];

export const DNA_PERSONAS: Record<string, DnaPersona> = buildPersonas();
export const DNA_CODES = Object.keys(DNA_PERSONAS);

// ─────────────────────────────────────────────────────────────
// 추천 — 4축 점수 기반 가중치
// ─────────────────────────────────────────────────────────────
const NATURE_KEYWORDS = ['국립공원', '도립공원', '수목원', '폭포', '계곡', '산', '바다', '해변'];
const URBAN_KEYWORDS = ['거리', '시장', '카페', '쇼핑', '백화점', '광장', '타워', '몰'];
const HANOK_KEYWORDS = ['궁', '한옥', '서원', '향교'];

function dnaScoreItem(item: Item, res: DnaResult): number {
  let s = 0;
  if (item.image) s += 2;
  // 자연 점수 — NU 백분율 75%↑ 자연, 25%↓ 도시
  const naturePref = res.percent.NU;
  const isNature = item.theme === '자연' || item.theme === '휴양' ||
    NATURE_KEYWORDS.some((k) => (item.title || '').includes(k));
  const isUrban = URBAN_KEYWORDS.some((k) => (item.title || '').includes(k) || (item.address || '').includes(k));
  if (isNature && naturePref >= 50) s += (naturePref - 50) / 10;
  if (isUrban && naturePref < 50) s += (50 - naturePref) / 10;
  // 활동 — AC 높을수록 체험·산
  const activity = res.percent.AC;
  if ((item.theme === '체험' || (item.title || '').match(/[가-힣]산$/)) && activity >= 50) s += (activity - 50) / 12;
  if (item.theme === '휴양' && activity < 50) s += (50 - activity) / 12;
  // 럭셔리 — BL 낮을수록 럭셔리 (호텔·리조트·온천)
  const luxury = 100 - res.percent.BL;
  if ((item.title || '').match(/리조트|호텔|온천|스파/) && luxury >= 50) s += (luxury - 50) / 10;
  // 도시 럭셔리 — 럭셔리 + 도시 → 타워·쇼핑몰
  if (isUrban && luxury >= 60) s += 2;
  // 무작위 노이즈
  s += Math.random() * 0.5;
  return s;
}

export function getDnaRecommendations(res: DnaResult, limit = 12): Item[] {
  return allItems
    .filter((it) => it.image)
    .map((it) => ({ item: it, s: dnaScoreItem(it, res) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.item);
}

/** 빌드 타임에 16개 코드 모두 추천 미리 계산 */
export function getAllDnaRecommendations(): Record<string, Item[]> {
  const out: Record<string, Item[]> = {};
  for (const code of DNA_CODES) {
    // code에서 합성된 더미 결과 (중간값)
    const res: DnaResult = {
      scores: { AC: 0, NU: 0, PS: 0, BL: 0 },
      percent: {
        AC: code[0] === 'A' ? 80 : 20,
        NU: code[1] === 'N' ? 80 : 20,
        PS: code[2] === 'P' ? 80 : 20,
        BL: code[3] === 'B' ? 80 : 20,
      },
      code,
    };
    out[code] = getDnaRecommendations(res, 12);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// UI 라벨
// ─────────────────────────────────────────────────────────────
export const DNA_LABELS = {
  pageTitle: {
    ko: '여행 DNA 분석', en: 'Travel DNA Analysis', ja: '旅行DNA分析', zh: '旅行DNA分析',
  },
  pageDesc: {
    ko: '4가지 축으로 분석하는 나만의 여행 유형 — 16가지 중 어떤 DNA?',
    en: 'Your travel type analyzed across 4 axes — which of 16 DNAs?',
    ja: '4軸で分析する旅タイプ — 16種類のうちどれ?',
    zh: '从4个维度分析旅行类型 — 16种DNA中你是哪一种?',
  },
  start: { ko: '분석 시작', en: 'Start analysis', ja: '分析開始', zh: '开始分析' },
  startCta: {
    ko: '8문항 · 1분 30초', en: '8 questions · 90 sec', ja: '8問·90秒', zh: '8题·90秒',
  },
  questionOf: { ko: '/ 8', en: '/ 8', ja: '/ 8', zh: '/ 8' },
  yourCode: {
    ko: '당신의 여행 DNA 코드',
    en: 'Your Travel DNA code',
    ja: 'あなたの旅行DNAコード',
    zh: '你的旅行DNA代码',
  },
  axisBreakdown: {
    ko: '4축 분석',
    en: '4-axis analysis',
    ja: '4軸分析',
    zh: '4轴分析',
  },
  recommendations: {
    ko: '당신의 DNA에 맞춘 추천 12곳',
    en: '12 picks matched to your DNA',
    ja: 'あなたのDNAに合うおすすめ12選',
    zh: '匹配你DNA的12个推荐',
  },
  retake: { ko: '다시 분석', en: 'Retake', ja: '再分析', zh: '重新分析' },
  share: { ko: '공유', en: 'Share', ja: 'シェア', zh: '分享' },
  shareCopy: { ko: 'URL 복사', en: 'Copy link', ja: 'リンクコピー', zh: '复制链接' },
  copied: { ko: '복사됐어요', en: 'Copied', ja: 'コピーしました', zh: '已复制' },
  // 결과 페이지 새 섹션 헤더
  hStrengths: { ko: '💪 당신의 강점', en: '💪 Your strengths', ja: '💪 あなたの強み', zh: '💪 你的强项' },
  hCautions: { ko: '⚠️ 이런 점에 주의', en: '⚠️ Watch out for', ja: '⚠️ 注意点', zh: '⚠️ 注意事项' },
  hTips: { ko: '💡 여행 팁', en: '💡 Travel tips', ja: '💡 旅のヒント', zh: '💡 旅行贴士' },
  hMentor: { ko: '🧑‍🏫 당신의 여행 멘토', en: '🧑‍🏫 Your travel mentor', ja: '🧑‍🏫 旅のメンター', zh: '🧑‍🏫 你的旅行导师' },
  hRarity: { ko: '📊 희귀도', en: '📊 Rarity', ja: '📊 希少度', zh: '📊 稀有度' },
  rarityText: {
    ko: '인구의 {n}% — {label}',
    en: '{n}% of people — {label}',
    ja: '人口の{n}% — {label}',
    zh: '人口的{n}% — {label}',
  },
  rarityRare: { ko: '희귀 유형', en: 'Rare type', ja: 'レアタイプ', zh: '稀有类型' },
  rarityCommon: { ko: '많은 유형', en: 'Common type', ja: '一般的なタイプ', zh: '常见类型' },
  rarityAvg: { ko: '평균적인 유형', en: 'Average type', ja: '平均的なタイプ', zh: '中等类型' },
  hCompat: { ko: '🤝 여행 호환성', en: '🤝 Travel compatibility', ja: '🤝 旅行相性', zh: '🤝 旅行兼容性' },
  cBest: { ko: '잘 맞는 동행', en: 'Best match', ja: '相性◎', zh: '最佳搭档' },
  cWorst: { ko: '주의할 동행', en: 'Caution', ja: '相性△', zh: '需注意' },
  hRadar: { ko: '🎯 성향 분석 차트', en: '🎯 Trait analysis', ja: '🎯 性向分析チャート', zh: '🎯 性格分析图' },
  balanced: { ko: '균형', en: 'Balanced', ja: 'バランス', zh: '均衡' },
  storyShare: {
    ko: '📱 스토리에 공유하기',
    en: '📱 Share to story',
    ja: '📱 ストーリーに共有',
    zh: '📱 分享到故事',
  },
  storyHint: {
    ko: '아래 카드를 캡처해서 인스타 스토리에 올려보세요',
    en: 'Screenshot the card below and post to Instagram Story',
    ja: '下のカードをキャプチャしてストーリーにアップ',
    zh: '截图下方卡片发到Instagram故事',
  },
} as const;

export function dnaT(key: keyof typeof DNA_LABELS, lang: Lang): string {
  return DNA_LABELS[key][lang];
}
