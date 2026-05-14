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
    };
  }
  return out;
}

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
} as const;

export function dnaT(key: keyof typeof DNA_LABELS, lang: Lang): string {
  return DNA_LABELS[key][lang];
}
