/**
 * 여행 성향 테스트 — 데이터, 타입, 스코어링, 추천 알고리즘.
 *
 * 빌드 타임에 호출되어 6 페르소나 × 12 추천 항목을 미리 계산한다.
 * 클라이언트는 quiz.client.ts 에서 옵션 가중치만 사용.
 */
import type { Lang } from './i18n';
import { all as allItems, type Item } from './data';

export const PERSONA_IDS = ['naturalist', 'cultural', 'resort', 'adventurer', 'family', 'urbanite'] as const;
export type PersonaId = typeof PERSONA_IDS[number];

export interface Persona {
  id: PersonaId;
  emoji: string;
  /** 매칭 기준 — 추천 알고리즘이 사용 */
  themes: string[];          // 선호 테마 (자연/역사/휴양/체험/건축)
  regions: string[];          // 선호 areacode
  keywords: string[];         // 제목/주소에 포함되면 가산
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  description: Record<Lang, string>;
  /** 심리테스트 결과용 — 특성 3-4개 (예: "조용함을 사랑함", "혼자가 편함") */
  traits: Record<Lang, string[]>;
  /** 결과 카드 그라데이션 (CSS color) */
  gradient: { from: string; to: string };
  /** 추천 매칭 이유 (1줄) — "이 유형은 ___를 좋아해요" */
  whyRecommend: Record<Lang, string>;
  /** 여행 궁합 — 찰떡궁합 페르소나 (바이럴: 친구 태그 유도) */
  compatible: PersonaId;
  /** 여행 궁합 — 상극 페르소나 */
  clash: PersonaId;
  /** 한 줄 캐릭터 요약 — 공감·공유 유도 ("당신은 이런 사람") */
  archetype: Record<Lang, string>;
}

export const PERSONAS: Record<PersonaId, Persona> = {
  naturalist: {
    id: 'naturalist',
    emoji: '🌿',
    themes: ['자연'],
    regions: ['32', '33', '34', '35', '36'], // 강원·충청·경상
    keywords: ['국립공원', '도립공원', '수목원', '폭포', '계곡', '산'],
    name: {
      ko: '자연주의자', en: 'The Naturalist', ja: 'ナチュラリスト', zh: '自然主义者',
    },
    tagline: {
      ko: '숲과 산이 가장 좋은 친구',
      en: 'Forests and mountains are your best friends',
      ja: '森と山が一番の友達',
      zh: '森林与山是最好的朋友',
    },
    description: {
      ko: '도시의 소음을 떠나 깊은 자연 속에서 회복하는 여행자. 국립공원, 수목원, 폭포처럼 살아 숨 쉬는 자연을 사랑합니다.',
      en: 'A traveler who recovers in deep nature, away from city noise. You love national parks, arboretums, and waterfalls — places where nature breathes.',
      ja: '都会の喧騒を離れ、深い自然の中で回復する旅人。国立公園、樹木園、滝など生きた自然を愛します。',
      zh: '远离都市喧嚣,在大自然中恢复元气的旅行者。热爱国立公园、植物园、瀑布等鲜活的自然。',
    },
    traits: {
      ko: ['🌲 고요함을 사랑함', '🥾 트레킹·산책 선호', '📷 풍경 사진 마니아', '🧘 명상적 여행'],
      en: ['🌲 Loves silence', '🥾 Prefers trekking', '📷 Landscape photo addict', '🧘 Meditative travel'],
      ja: ['🌲 静けさを愛する', '🥾 トレッキング派', '📷 風景写真好き', '🧘 瞑想的な旅'],
      zh: ['🌲 热爱宁静', '🥾 喜爱徒步', '📷 风景摄影迷', '🧘 冥想之旅'],
    },
    gradient: { from: '#16a34a', to: '#15803d' },
    whyRecommend: {
      ko: '이 유형은 광활한 자연 속 평온을 가장 사랑해요. 국립공원·수목원·폭포 위주로 추천했어요.',
      en: 'This type loves peace in vast nature. Picks focus on national parks, arboretums, and waterfalls.',
      ja: 'このタイプは広大な自然の平和を愛します。国立公園・樹木園・滝中心におすすめ。',
      zh: '此类型最爱大自然中的宁静。推荐以国立公园、植物园、瀑布为主。',
    },
    compatible: 'cultural',
    clash: 'urbanite',
    archetype: {
      ko: '주말이면 등산화부터 챙기는 자연인',
      en: 'The friend who grabs hiking boots every weekend',
      ja: '週末になると登山靴から準備する自然派',
      zh: '一到周末就先收拾登山鞋的自然派',
    },
  },
  cultural: {
    id: 'cultural',
    emoji: '🏛️',
    themes: ['역사'],
    regions: ['35', '37', '1', '34'], // 경북(경주)·전북(전주)·서울·충남(부여)
    keywords: ['궁', '사', '서원', '향교', '한옥', '왕릉', '유적'],
    name: {
      ko: '문화탐험가', en: 'The Cultural Explorer', ja: '文化探検家', zh: '文化探险家',
    },
    tagline: {
      ko: '천년의 시간을 걷는 여행자',
      en: 'A traveler walking through a thousand years',
      ja: '千年の時を歩く旅人',
      zh: '行走千年时光的旅人',
    },
    description: {
      ko: '돌담 하나, 기와 한 장에도 의미를 읽어내는 깊이 있는 여행자. 궁궐과 한옥마을, 천년 사찰이 당신의 무대입니다.',
      en: 'A thoughtful traveler who reads meaning in every stone wall and roof tile. Palaces, hanok villages, and millennium-old temples are your stage.',
      ja: '一つの石垣、一枚の瓦にも意味を読み取る奥深い旅人。宮殿、韓屋村、千年の寺院があなたの舞台。',
      zh: '能从一堵石墙、一片瓦中读出意义的深度旅人。宫殿、韩屋村、千年古刹是你的舞台。',
    },
    traits: {
      ko: ['📚 역사 공부 좋아함', '🏯 한옥·궁궐 매력', '🍵 전통차 한 잔이 좋아', '✍️ 천천히 음미하는 타입'],
      en: ['📚 Loves history', '🏯 Hanok & palace fan', '🍵 Tea by the temple', '✍️ Slow savoring type'],
      ja: ['📚 歴史好き', '🏯 韓屋・宮殿の魅力', '🍵 伝統茶を一杯', '✍️ ゆっくり味わうタイプ'],
      zh: ['📚 喜爱历史', '🏯 韩屋宫殿迷', '🍵 喜欢一杯传统茶', '✍️ 慢慢品味型'],
    },
    gradient: { from: '#92400e', to: '#78350f' },
    whyRecommend: {
      ko: '이 유형은 천천히 음미하는 여행을 즐겨요. 궁궐·한옥마을·천년 사찰 위주로 추천했어요.',
      en: 'This type savors slowly. Picks focus on palaces, hanok villages, and ancient temples.',
      ja: 'このタイプはゆっくり味わう旅を好みます。宮殿・韓屋村・千年寺院中心におすすめ。',
      zh: '此类型喜欢慢慢品味。推荐以宫殿、韩屋村、千年古刹为主。',
    },
    compatible: 'naturalist',
    clash: 'adventurer',
    archetype: {
      ko: '여행지 박물관에서 도슨트를 끝까지 듣는 사람',
      en: 'The one who stays for the entire museum docent tour',
      ja: '旅先の博物館で解説を最後まで聞く人',
      zh: '在旅行地博物馆把讲解听到最后的人',
    },
  },
  resort: {
    id: 'resort',
    emoji: '🏖️',
    themes: ['휴양'],
    regions: ['6', '32', '39', '38'], // 부산·강원·제주·전남
    keywords: ['해수욕장', '해변', '온천', '리조트', '섬', '카페'],
    name: {
      ko: '휴양가', en: 'The Resort Lover', ja: 'リラックス派', zh: '度假爱好者',
    },
    tagline: {
      ko: '아무것도 안 하는 게 가장 좋다',
      en: 'Doing nothing is the best',
      ja: '何もしないのが一番',
      zh: '什么都不做最棒',
    },
    description: {
      ko: '여행은 쉬러 가는 것. 푸른 바다와 따뜻한 온천, 한적한 섬에서 시간을 흘려보내는 걸 사랑하는 사람.',
      en: 'Travel is for resting. You love letting time pass by the blue sea, in warm hot springs, on quiet islands.',
      ja: '旅は休むためのもの。青い海、温泉、静かな島で時間を流していくのが好きな人。',
      zh: '旅行就是为了休息。喜欢在蓝海、温泉、宁静的小岛上让时间流逝的人。',
    },
    traits: {
      ko: ['🛏️ 늦잠 환영', '🌊 바다·온천 사랑', '🍹 칵테일 한 잔', '☕ 노을 보며 멍'],
      en: ['🛏️ Late mornings', '🌊 Sea & hot springs', '🍹 Cocktail in hand', '☕ Sunset zoning out'],
      ja: ['🛏️ 寝坊歓迎', '🌊 海・温泉好き', '🍹 カクテル一杯', '☕ 夕日を眺める'],
      zh: ['🛏️ 欢迎赖床', '🌊 爱海与温泉', '🍹 来杯鸡尾酒', '☕ 看夕阳发呆'],
    },
    gradient: { from: '#0891b2', to: '#0e7490' },
    whyRecommend: {
      ko: '이 유형은 아무것도 안 하는 여유를 즐겨요. 해변·온천·섬 위주로 추천했어요.',
      en: 'This type enjoys doing nothing. Picks focus on beaches, hot springs, and islands.',
      ja: 'このタイプは何もしない余裕を楽しみます。ビーチ・温泉・島中心におすすめ。',
      zh: '此类型享受什么都不做的悠闲。推荐以海滩、温泉、海岛为主。',
    },
    compatible: 'family',
    clash: 'adventurer',
    archetype: {
      ko: '체크인하면 수영장에서 안 나오는 사람',
      en: 'The one who never leaves the pool after check-in',
      ja: 'チェックインしたらプールから出てこない人',
      zh: '一入住就泡在泳池里不出来的人',
    },
  },
  adventurer: {
    id: 'adventurer',
    emoji: '⛷️',
    themes: ['체험'],
    regions: ['32', '36', '38'], // 강원·경남·전남
    keywords: ['스키', '서핑', '래프팅', '캠핑', '트레킹', '암벽'],
    name: {
      ko: '모험가', en: 'The Adventurer', ja: '冒険家', zh: '冒险家',
    },
    tagline: {
      ko: '심장이 뛰는 곳으로 간다',
      en: 'I go where my heart races',
      ja: '心臓が高鳴る場所へ',
      zh: '前往心跳加速之地',
    },
    description: {
      ko: '편안함보다 짜릿함을 택하는 여행자. 스키, 서핑, 래프팅, 패러글라이딩까지 — 한국에서 즐길 수 있는 모든 액티비티가 당신을 부릅니다.',
      en: 'A traveler who chooses thrill over comfort. Skiing, surfing, rafting, paragliding — every activity Korea offers is calling you.',
      ja: '快適さよりスリルを選ぶ旅人。スキー、サーフィン、ラフティング、パラグライディングまで—韓国で楽しめるすべてのアクティビティが呼んでいます。',
      zh: '选择刺激而非舒适的旅行者。滑雪、冲浪、漂流、滑翔伞——韩国能玩的所有项目都在召唤你。',
    },
    traits: {
      ko: ['💪 체력 자신감', '🏔️ 도전 본능', '🎿 액티비티 광', '⚡ 즉흥 결정'],
      en: ['💪 Physically confident', '🏔️ Challenge-seeker', '🎿 Activity junkie', '⚡ Spontaneous'],
      ja: ['💪 体力に自信', '🏔️ 挑戦本能', '🎿 アクティビティ狂', '⚡ 即興派'],
      zh: ['💪 体力自信', '🏔️ 挑战本能', '🎿 活动狂热', '⚡ 即兴决定'],
    },
    gradient: { from: '#dc2626', to: '#b91c1c' },
    whyRecommend: {
      ko: '이 유형은 짜릿한 도전을 추구해요. 액티비티·체험·스포츠 명소 위주로 추천했어요.',
      en: 'This type seeks thrill. Picks focus on activities, experiences, and sports spots.',
      ja: 'このタイプはスリルを求めます。アクティビティ・体験・スポーツ名所中心におすすめ。',
      zh: '此类型追求刺激挑战。推荐以活动、体验、运动景点为主。',
    },
    compatible: 'urbanite',
    clash: 'resort',
    archetype: {
      ko: '"이거 위험한데?" 하면 더 하고 싶어지는 사람',
      en: 'The one who wants it MORE when you say "that looks dangerous"',
      ja: '「危なくない?」と言われるほどやりたくなる人',
      zh: '听到"这个很危险吧?"反而更想试的人',
    },
  },
  family: {
    id: 'family',
    emoji: '👨‍👩‍👧',
    themes: ['휴양', '체험'],
    regions: ['31', '39', '34'], // 경기·제주·충남
    keywords: ['공원', '동물', '체험', '농장', '수목원', '박물관'],
    name: {
      ko: '가족여행자', en: 'The Family Traveler', ja: 'ファミリートラベラー', zh: '家庭旅行者',
    },
    tagline: {
      ko: '함께 만드는 추억이 진짜 여행',
      en: 'The real trip is the memories we make together',
      ja: '一緒に作る思い出が本当の旅',
      zh: '一起创造的回忆才是真正的旅行',
    },
    description: {
      ko: '아이부터 부모님까지 모두가 즐거운 여행을 만드는 사람. 동물원, 체험농장, 테마파크, 무장애 코스 — 모두가 편하게 다닐 수 있는 곳을 찾습니다.',
      en: 'You build trips everyone enjoys, from kids to grandparents. Zoos, experience farms, theme parks, barrier-free trails — places where everyone can move comfortably.',
      ja: '子供からおじいちゃんおばあちゃんまで皆が楽しめる旅を作る人。動物園、体験農場、テーマパーク、バリアフリーコース—皆が気軽に歩ける場所を探します。',
      zh: '为从孩子到长辈所有人打造愉快旅行的人。动物园、体验农场、主题公园、无障碍步道——寻找所有人都能舒适游玩的地方。',
    },
    traits: {
      ko: ['📅 꼼꼼한 계획러', '🧒 아이 친화 우선', '♿ 모두에게 편한 곳', '📸 단체 사진 필수'],
      en: ['📅 Detail planner', '🧒 Kid-friendly first', '♿ Accessible for all', '📸 Group photo essential'],
      ja: ['📅 緻密な計画派', '🧒 子供フレンドリー優先', '♿ 皆に楽な場所', '📸 集合写真必須'],
      zh: ['📅 周密计划者', '🧒 优先考虑孩子', '♿ 所有人都方便', '📸 必拍合照'],
    },
    gradient: { from: '#facc15', to: '#eab308' },
    whyRecommend: {
      ko: '이 유형은 모두가 편한 여행을 추구해요. 평지·체험·무장애 코스 위주로 추천했어요.',
      en: 'This type wants everyone comfortable. Picks focus on flat paths, experiences, barrier-free trails.',
      ja: 'このタイプは皆が楽な旅を求めます。平地・体験・バリアフリーコース中心におすすめ。',
      zh: '此类型追求人人舒适的旅行。推荐以平地、体验、无障碍步道为主。',
    },
    compatible: 'resort',
    clash: 'adventurer',
    archetype: {
      ko: '단톡방에서 여행 일정 짜는 총무 담당',
      en: 'The group-chat planner who organizes the whole trip',
      ja: 'グループチャットで旅程を組む幹事タイプ',
      zh: '在群里负责安排整个行程的组织者',
    },
  },
  urbanite: {
    id: 'urbanite',
    emoji: '🏙️',
    themes: ['체험'],
    regions: ['1', '6', '4', '5', '2'], // 서울·부산·대구·광주·인천
    keywords: ['거리', '시장', '카페', '쇼핑', '야경', '타워', '광장'],
    name: {
      ko: '도시탐험가', en: 'The City Explorer', ja: 'シティエクスプローラー', zh: '城市探险家',
    },
    tagline: {
      ko: '도시의 맥동이 가장 흥미롭다',
      en: 'The pulse of the city is what excites you',
      ja: '都会の鼓動が一番面白い',
      zh: '城市的脉搏最令人兴奋',
    },
    description: {
      ko: '맛집, 거리 풍경, 카페, 야경 — 도시가 만들어내는 모든 디테일에 끌리는 여행자. 골목골목 숨은 가게를 발견하는 게 진짜 즐거움.',
      en: 'A traveler drawn to every detail a city creates — restaurants, street scenes, cafes, night views. The real joy is finding hidden spots in narrow alleys.',
      ja: 'グルメ、街並み、カフェ、夜景—都会が作り出すあらゆるディテールに惹かれる旅人。路地裏に隠れた店を見つけるのが本当の楽しみ。',
      zh: '被城市创造的每个细节吸引的旅行者——美食、街景、咖啡馆、夜景。在小巷中发现隐藏的店铺才是真正的乐趣。',
    },
    traits: {
      ko: ['🍜 맛집 탐색러', '🌃 야경 마니아', '☕ 카페 호퍼', '📱 SNS 인증 필수'],
      en: ['🍜 Foodie explorer', '🌃 Night view lover', '☕ Cafe hopper', '📱 SNS posts required'],
      ja: ['🍜 グルメ探検家', '🌃 夜景マニア', '☕ カフェホッパー', '📱 SNS必須'],
      zh: ['🍜 美食探险家', '🌃 夜景迷', '☕ 咖啡馆爱好者', '📱 必须发SNS'],
    },
    gradient: { from: '#7c3aed', to: '#5b21b6' },
    whyRecommend: {
      ko: '이 유형은 도시의 활기를 사랑해요. 도심 거리·시장·야경 명소 위주로 추천했어요.',
      en: 'This type loves urban energy. Picks focus on streets, markets, night-view spots.',
      ja: 'このタイプは都会の活気を愛します。繁華街・市場・夜景名所中心におすすめ。',
      zh: '此类型热爱都市活力。推荐以闹市街区、市场、夜景为主。',
    },
    compatible: 'adventurer',
    clash: 'naturalist',
    archetype: {
      ko: '핫플 오픈런하고 바로 SNS에 올리는 사람',
      en: 'The one who lines up for the hot spot and posts it instantly',
      ja: '話題のスポットに開店ダッシュして即SNSに上げる人',
      zh: '抢着去网红店打卡马上发SNS的人',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 질문 — 6문항, 각 4 옵션. 옵션마다 페르소나 가중치 부여.
// ─────────────────────────────────────────────────────────────
export interface QuizOption {
  id: string;
  label: Record<Lang, string>;
  /** 각 페르소나에 더할 점수 (0~3) */
  weights: Partial<Record<PersonaId, number>>;
}
export interface QuizQuestion {
  id: string;
  question: Record<Lang, string>;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: {
      ko: '여행에서 가장 중요한 것은?',
      en: "What's most important on a trip?",
      ja: '旅行で最も大事なことは?',
      zh: '旅行中最重要的是?',
    },
    options: [
      {
        id: 'q1-nature',
        label: { ko: '대자연 속의 평온', en: 'Peace in nature', ja: '大自然の中の平和', zh: '大自然中的宁静' },
        weights: { naturalist: 3, family: 1 },
      },
      {
        id: 'q1-culture',
        label: { ko: '오랜 시간의 흔적', en: 'Traces of long history', ja: '長い時間の痕跡', zh: '悠久历史的痕迹' },
        weights: { cultural: 3 },
      },
      {
        id: 'q1-relax',
        label: { ko: '아무것도 안 하는 자유', en: 'Freedom to do nothing', ja: '何もしない自由', zh: '什么都不做的自由' },
        weights: { resort: 3 },
      },
      {
        id: 'q1-excite',
        label: { ko: '심장이 뛰는 경험', en: 'Heart-racing experiences', ja: '心臓が高鳴る体験', zh: '心跳加速的体验' },
        weights: { adventurer: 3, urbanite: 1 },
      },
    ],
  },
  {
    id: 'q2',
    question: {
      ko: '마음에 끄는 풍경은?',
      en: 'Which landscape draws you in?',
      ja: '心惹かれる風景は?',
      zh: '最吸引你的风景是?',
    },
    options: [
      {
        id: 'q2-mountain',
        label: { ko: '깊은 산 능선', en: 'Deep mountain ridges', ja: '深い山の尾根', zh: '深山山脊' },
        weights: { naturalist: 3, adventurer: 1 },
      },
      {
        id: 'q2-sea',
        label: { ko: '에메랄드 바다와 백사장', en: 'Emerald sea and white sand', ja: 'エメラルドの海と白浜', zh: '碧海白沙' },
        weights: { resort: 3, family: 1 },
      },
      {
        id: 'q2-village',
        label: { ko: '돌담길의 한옥마을', en: 'Hanok village with stone walls', ja: '石垣の韓屋村', zh: '石墙韩屋村' },
        weights: { cultural: 3 },
      },
      {
        id: 'q2-city',
        label: { ko: '네온이 빛나는 도시 야경', en: 'Neon-lit city at night', ja: 'ネオン輝く都市夜景', zh: '霓虹闪烁的都市夜景' },
        weights: { urbanite: 3 },
      },
    ],
  },
  {
    id: 'q3',
    question: {
      ko: '활동 강도는 어느 정도가 좋아?',
      en: 'What activity level do you prefer?',
      ja: '活動の強度はどのくらいが好き?',
      zh: '喜欢什么样的活动强度?',
    },
    options: [
      {
        id: 'q3-still',
        label: { ko: '하루 종일 누워있어도 OK', en: 'Lying down all day is fine', ja: '一日中寝ていてもOK', zh: '躺一整天也行' },
        weights: { resort: 3 },
      },
      {
        id: 'q3-walk',
        label: { ko: '천천히 걷고 보고 사진', en: 'Slow walks, sights, photos', ja: 'ゆっくり歩いて見て写真', zh: '慢慢走、看、拍照' },
        weights: { cultural: 2, naturalist: 2, urbanite: 2 },
      },
      {
        id: 'q3-active',
        label: { ko: '하루 2만보는 기본', en: '20,000 steps a day is normal', ja: '一日2万歩は基本', zh: '一天两万步是基本' },
        weights: { adventurer: 2, naturalist: 2 },
      },
      {
        id: 'q3-extreme',
        label: { ko: '극한 스포츠도 도전', en: 'I try extreme sports too', ja: '極限スポーツにも挑戦', zh: '极限运动也敢挑战' },
        weights: { adventurer: 3 },
      },
    ],
  },
  {
    id: 'q4',
    question: {
      ko: '여행 스타일은?',
      en: 'Your travel style?',
      ja: '旅のスタイルは?',
      zh: '你的旅行风格?',
    },
    options: [
      {
        id: 'q4-plan',
        label: { ko: '엑셀로 시간 단위 계획', en: 'Excel itinerary by the hour', ja: 'エクセルで時間単位の計画', zh: 'Excel按小时排程' },
        weights: { family: 2, cultural: 2 },
      },
      {
        id: 'q4-free',
        label: { ko: '큰 틀만 잡고 자유롭게', en: 'Loose plan, freedom on site', ja: '大枠だけ決めて自由に', zh: '只定大方向自由发挥' },
        weights: { adventurer: 2, urbanite: 2, naturalist: 1 },
      },
      {
        id: 'q4-slow',
        label: { ko: '한 곳에 오래 머물기', en: 'Stay long in one place', ja: '一か所に長く滞在', zh: '在一个地方久住' },
        weights: { resort: 3 },
      },
      {
        id: 'q4-many',
        label: { ko: '많은 곳을 빠르게', en: 'Many places, fast', ja: 'たくさんの場所を速く', zh: '快速逛多个地方' },
        weights: { urbanite: 2, adventurer: 1 },
      },
    ],
  },
  {
    id: 'q5',
    question: {
      ko: '함께 가는 사람은?',
      en: 'Who are you traveling with?',
      ja: '一緒に行く人は?',
      zh: '和谁一起去?',
    },
    options: [
      {
        id: 'q5-alone',
        label: { ko: '혼자', en: 'Alone', ja: '一人', zh: '独自一人' },
        weights: { naturalist: 2, cultural: 2, adventurer: 1 },
      },
      {
        id: 'q5-partner',
        label: { ko: '연인 또는 배우자', en: 'Partner or spouse', ja: '恋人または配偶者', zh: '恋人或伴侣' },
        weights: { resort: 2, cultural: 1, urbanite: 1 },
      },
      {
        id: 'q5-friends',
        label: { ko: '친구들과 와글와글', en: 'Lively trip with friends', ja: '友達とワイワイ', zh: '和朋友热闹一场' },
        weights: { urbanite: 2, adventurer: 2 },
      },
      {
        id: 'q5-family',
        label: { ko: '아이·부모님과 함께', en: 'With kids and parents', ja: '子供・両親と一緒', zh: '和孩子父母一起' },
        weights: { family: 3 },
      },
    ],
  },
  {
    id: 'q6',
    question: {
      ko: '가장 찍고 싶은 사진은?',
      en: 'What photo do you want most?',
      ja: '一番撮りたい写真は?',
      zh: '最想拍的照片是?',
    },
    options: [
      {
        id: 'q6-landscape',
        label: { ko: '광활한 풍경', en: 'Vast landscape', ja: '広大な風景', zh: '辽阔风景' },
        weights: { naturalist: 3 },
      },
      {
        id: 'q6-heritage',
        label: { ko: '고즈넉한 유적', en: 'Quiet heritage site', ja: '静かな遺跡', zh: '宁静古迹' },
        weights: { cultural: 3 },
      },
      {
        id: 'q6-food',
        label: { ko: '맛있는 음식 클로즈업', en: 'Close-up of tasty food', ja: '美味しい料理のアップ', zh: '美食特写' },
        weights: { urbanite: 3, family: 1 },
      },
      {
        id: 'q6-experience',
        label: { ko: '체험 중인 내 모습', en: 'Me during an activity', ja: '体験中の自分の姿', zh: '体验中的自己' },
        weights: { adventurer: 3, family: 1 },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 스코어링 — 옵션 ID 배열 → 페르소나 점수 → 최고 페르소나
// ─────────────────────────────────────────────────────────────
export function scoreAnswers(optionIds: string[]): { scores: Record<PersonaId, number>; winner: PersonaId } {
  const scores: Record<PersonaId, number> = {
    naturalist: 0, cultural: 0, resort: 0, adventurer: 0, family: 0, urbanite: 0,
  };
  const optionMap = new Map<string, QuizOption>();
  for (const q of QUESTIONS) for (const o of q.options) optionMap.set(o.id, o);
  for (const id of optionIds) {
    const opt = optionMap.get(id);
    if (!opt) continue;
    for (const [p, w] of Object.entries(opt.weights)) {
      scores[p as PersonaId] += w || 0;
    }
  }
  // 동점이면 PERSONA_IDS 순서가 빠른 쪽 — naturalist 우선
  let winner: PersonaId = 'naturalist';
  let max = -1;
  for (const p of PERSONA_IDS) {
    if (scores[p] > max) { max = scores[p]; winner = p; }
  }
  return { scores, winner };
}

// ─────────────────────────────────────────────────────────────
// 추천 — 빌드 타임에 호출. 페르소나별 top 12 아이템.
// ─────────────────────────────────────────────────────────────
function scoreItem(item: Item, persona: Persona): number {
  let s = 0;
  if (item.theme && persona.themes.includes(item.theme)) s += 10;
  if (item.areacode && persona.regions.includes(item.areacode)) s += 5;
  if (item.image) s += 3;
  for (const k of persona.keywords) {
    if (item.title?.includes(k) || item.address?.includes(k)) { s += 4; break; }
  }
  // 축제는 약간 패널티 (장소 추천이 일반적으로 더 안정적)
  if (item.type === 'festival') s -= 1;
  // 약간의 무작위 노이즈 — 동일 점수 변별
  s += Math.random() * 0.5;
  return s;
}

export function getRecommendations(personaId: PersonaId, limit = 12): Item[] {
  const persona = PERSONAS[personaId];
  const scored = allItems
    .filter((it) => it.image) // 이미지 있는 것만
    .map((it) => ({ item: it, s: scoreItem(it, persona) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.item);
  return scored;
}

// 모든 페르소나의 추천을 미리 계산 — Astro 페이지에서 사용
export function getAllRecommendations(): Record<PersonaId, Item[]> {
  const out = {} as Record<PersonaId, Item[]>;
  for (const id of PERSONA_IDS) out[id] = getRecommendations(id, 12);
  return out;
}

// ─────────────────────────────────────────────────────────────
// 페이지 라벨 (i18n) — quiz UI 전용
// ─────────────────────────────────────────────────────────────
export const QUIZ_LABELS = {
  pageTitle: {
    ko: '여행 성향 테스트',
    en: 'Travel Personality Quiz',
    ja: '旅行性向テスト',
    zh: '旅行性格测试',
  },
  pageDesc: {
    ko: '6개의 질문으로 알아보는 나만의 여행 스타일과 맞춤 추천',
    en: 'Discover your travel style and personalized recommendations in 6 questions',
    ja: '6つの質問で見つける、あなただけの旅スタイルとおすすめ',
    zh: '通过6个问题发现你的旅行风格与专属推荐',
  },
  start: { ko: '시작하기', en: 'Start', ja: 'スタート', zh: '开始' },
  startCta: {
    ko: '6개 질문, 1분이면 끝',
    en: '6 questions, 1 minute',
    ja: '6問、1分で完了',
    zh: '6道题,1分钟搞定',
  },
  questionOf: {
    ko: '/ 6',
    en: '/ 6',
    ja: '/ 6',
    zh: '/ 6',
  },
  next: { ko: '다음', en: 'Next', ja: '次へ', zh: '下一题' },
  prev: { ko: '이전', en: 'Previous', ja: '前へ', zh: '上一题' },
  seeResult: { ko: '결과 보기', en: 'See result', ja: '結果を見る', zh: '查看结果' },
  retake: { ko: '다시 테스트', en: 'Retake', ja: 'もう一度', zh: '重新测试' },
  yourType: {
    ko: '당신의 여행 성향은',
    en: 'Your travel type is',
    ja: 'あなたの旅行タイプは',
    zh: '你的旅行性格是',
  },
  recommendations: {
    ko: '추천 여행지·축제',
    en: 'Recommended places & festivals',
    ja: 'おすすめの観光地・フェスティバル',
    zh: '推荐景点·节庆',
  },
  share: { ko: '공유하기', en: 'Share', ja: 'シェア', zh: '分享' },
  shareCopy: { ko: 'URL 복사', en: 'Copy link', ja: 'URLコピー', zh: '复制链接' },
  shareTwitter: { ko: 'X(트위터)에 공유', en: 'Share on X', ja: 'Xでシェア', zh: '分享到X' },
  shareCopied: { ko: '링크가 복사됐어요', en: 'Link copied', ja: 'リンクをコピーしました', zh: '已复制链接' },
  shareSubject: {
    ko: '나는 이런 여행자래! 너는?',
    en: "This is my travel type! What's yours?",
    ja: '私はこんな旅人らしい!あなたは?',
    zh: '我是这样的旅行者!你呢?',
  },
  traitsHeading: {
    ko: '✨ 당신의 특성',
    en: '✨ Your traits',
    ja: '✨ あなたの特性',
    zh: '✨ 你的特征',
  },
  breakdownHeading: {
    ko: '🧭 성향 매칭',
    en: '🧭 Persona match',
    ja: '🧭 性向マッチ',
    zh: '🧭 性格匹配',
  },
  whyHeading: {
    ko: '💡 이렇게 추천했어요',
    en: '💡 Why these picks',
    ja: '💡 おすすめの理由',
    zh: '💡 推荐理由',
  },
  statHeading: {
    ko: '📊 비슷한 유형이 얼마나 될까?',
    en: '📊 How common is this type?',
    ja: '📊 同じタイプはどれくらい?',
    zh: '📊 同类型有多少人?',
  },
  inviteFriend: {
    ko: '친구한테 보내기',
    en: 'Send to a friend',
    ja: '友達に送る',
    zh: '发给朋友',
  },
  inviteFriendDesc: {
    ko: '친구도 테스트하고 결과를 비교해 보세요',
    en: 'Have a friend test and compare results',
    ja: '友達もテストして結果を比べよう',
    zh: '让朋友也测一下,比较结果',
  },
  archetypeHeading: {
    ko: '🎬 한 줄 요약',
    en: '🎬 In one line',
    ja: '🎬 ひとことで言うと',
    zh: '🎬 一句话总结',
  },
  compatHeading: {
    ko: '💞 여행 궁합',
    en: '💞 Travel chemistry',
    ja: '💞 旅の相性',
    zh: '💞 旅行契合度',
  },
  compatGood: {
    ko: '찰떡궁합',
    en: 'Perfect match',
    ja: 'ベストパートナー',
    zh: '绝配',
  },
  compatBad: {
    ko: '환장의 조합',
    en: 'Total clash',
    ja: '相性最悪',
    zh: '冤家组合',
  },
  compatTapHint: {
    ko: '눌러서 이 유형도 확인 →',
    en: 'Tap to see this type →',
    ja: 'タップでこのタイプも →',
    zh: '点击查看此类型 →',
  },
} as const;

/** 페르소나별 가상 통계 (전체 100% 합) — 실제 DB 연동 전까지 시드값 */
export const PERSONA_DISTRIBUTION: Record<PersonaId, number> = {
  naturalist: 22,
  cultural: 18,
  resort: 19,
  adventurer: 12,
  family: 17,
  urbanite: 12,
};

export function quizT(key: keyof typeof QUIZ_LABELS, lang: Lang): string {
  return QUIZ_LABELS[key][lang];
}

// ─────────────────────────────────────────────────────────────
// 희귀도 — PERSONA_DISTRIBUTION 기반. 바이럴: "희귀 유형" 자랑 유도.
// ─────────────────────────────────────────────────────────────
export type RarityTier = 'rare' | 'uncommon' | 'common';
export interface RarityInfo {
  percent: number;
  tier: RarityTier;
  emoji: string;
  label: Record<Lang, string>;
}
const RARITY_LABELS: Record<RarityTier, { emoji: string; label: Record<Lang, string> }> = {
  rare: { emoji: '🦄', label: { ko: '희귀 유형', en: 'Rare type', ja: 'レアタイプ', zh: '稀有类型' } },
  uncommon: { emoji: '✨', label: { ko: '개성파 유형', en: 'Distinctive type', ja: '個性派タイプ', zh: '个性派类型' } },
  common: { emoji: '🔥', label: { ko: '대세 유형', en: 'Trending type', ja: '王道タイプ', zh: '主流类型' } },
};
export function getRarity(personaId: PersonaId): RarityInfo {
  const percent = PERSONA_DISTRIBUTION[personaId];
  const tier: RarityTier = percent <= 13 ? 'rare' : percent <= 18 ? 'uncommon' : 'common';
  return { percent, tier, emoji: RARITY_LABELS[tier].emoji, label: RARITY_LABELS[tier].label };
}
