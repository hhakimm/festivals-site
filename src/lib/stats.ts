/**
 * 지역 방문 통계 — region-stats.json(빌드 시 fetch-stats.ts 생성) 조회 헬퍼.
 * 데이터 없으면(빈 객체) 모든 헬퍼가 빈 값 → 컴포넌트가 알아서 숨김.
 */
import raw from '../content/stats/region-stats.json';

export interface RegionStat {
  monthly: number[]; // 12개월 상대 방문지수(0~100, 지역 내 정규화)
  share: number;     // 전국 대비 연간 방문 비중(%)
  peak: number[];    // 성수기 월(1~12)
  low: number[];     // 비수기 월(1~12)
}

const STATS = raw as Record<string, RegionStat>;

export function hasStats(): boolean {
  return Object.keys(STATS).length > 0;
}

export function getRegionStat(areacode: string): RegionStat | null {
  const s = STATS[areacode];
  return s && Array.isArray(s.monthly) && s.monthly.length === 12 ? s : null;
}

export interface PopularRegion {
  areacode: string;
  score: number;
  stat: RegionStat;
}

/**
 * 특정 월(1~12) 기준 "지금 가기 좋은 곳".
 * 절대 인기(대도시 편중) 대신 그 달의 계절지수(monthly)를 주신호로,
 * 인기도(share)는 sqrt로 약하게 반영 → 제철 지역이 부각됨(여름 강원·봄 제주 등).
 */
export function getPopularRegions(month: number, limit = 5): PopularRegion[] {
  const m = Math.min(12, Math.max(1, month));
  return Object.entries(STATS)
    .map(([areacode, stat]) => ({
      areacode,
      stat,
      score: (stat.monthly?.[m - 1] ?? 0) * Math.sqrt(stat.share || 1),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 12개월 각각의 인기 지역 목록 — 위젯이 클라이언트에서 현재 월을 골라 쓰도록 미리 계산. */
export function getMonthlyPopular(limit = 5): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (let m = 1; m <= 12; m++) {
    out[m] = getPopularRegions(m, limit).map((r) => r.areacode);
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────
 * 지역 큐레이션 — "왜 사람들이 가는지(한 줄)" + 대표 명소.
 * 데이터(방문 통계)만으론 '무엇이 인기인지'를 못 보여주므로 편집 큐레이션으로 보강.
 * tagline은 4개 언어, spots(대표 명소)는 고유명사라 ko로 공유(국제화는 추후).
 * ───────────────────────────────────────────────────────────── */
export interface RegionGuide {
  tagline: { ko: string; en: string; ja: string; zh: string };
  spots: string[];
}

export const REGION_GUIDE: Record<string, RegionGuide> = {
  '1':  { tagline: { ko: '전통과 트렌드가 공존하는 수도', en: 'Tradition meets trend in the capital', ja: '伝統とトレンドが共存する首都', zh: '传统与潮流交融的首都' }, spots: ['경복궁', '북촌한옥마을', '성수동', '명동'] },
  '2':  { tagline: { ko: '바다·섬·차이나타운, 서해안 관문', en: 'Sea, islands & Chinatown gateway', ja: '海・島・チャイナタウンの玄関口', zh: '海岛与唐人街的西海岸门户' }, spots: ['송도', '차이나타운', '월미도', '강화도'] },
  '3':  { tagline: { ko: '과학과 자연이 어우러진 중부 거점', en: 'Science and nature hub of central Korea', ja: '科学と自然が調和する中部拠点', zh: '科学与自然交融的中部枢纽' }, spots: ['성심당', '대전오월드', '유성온천', '한밭수목원'] },
  '4':  { tagline: { ko: '근대골목과 맛이 흐르는 도시', en: 'City of modern alleys and flavors', ja: '近代路地とグルメの街', zh: '近代街巷与美食之城' }, spots: ['김광석거리', '서문시장', '앞산', '동성로'] },
  '5':  { tagline: { ko: '예술과 미식의 호남 중심', en: 'Art and cuisine heart of Honam', ja: '芸術と美食の湖南の中心', zh: '艺术与美食的湖南中心' }, spots: ['무등산', '양림동', '1913송정역시장', '국립아시아문화전당'] },
  '6':  { tagline: { ko: '바다·야경·축제의 항구도시', en: 'Port city of sea, nightscapes & festivals', ja: '海・夜景・祭りの港町', zh: '大海、夜景与庆典的港口城市' }, spots: ['해운대', '광안리', '감천문화마을', '자갈치시장'] },
  '7':  { tagline: { ko: '산업과 자연이 공존, 고래의 도시', en: 'Whale city where industry meets nature', ja: '産業と自然が共存する鯨の町', zh: '工业与自然共存的鲸鱼之城' }, spots: ['태화강국가정원', '간절곶', '대왕암공원', '장생포'] },
  '8':  { tagline: { ko: '녹색으로 설계된 행정수도', en: 'A green, planned administrative city', ja: '緑に設計された行政首都', zh: '绿色规划的行政首都' }, spots: ['세종호수공원', '국립세종수목원', '베어트리파크'] },
  '31': { tagline: { ko: '서울 근교 나들이의 모든 것', en: 'Everything for a day trip near Seoul', ja: 'ソウル近郊の日帰りの全て', zh: '首尔近郊出游全攻略' }, spots: ['에버랜드', '수원화성', '가평', '파주 임진각'] },
  '32': { tagline: { ko: '바다·계곡·설산, 자연 휴양 1번지', en: 'Sea, valleys & snowy peaks — nature retreat', ja: '海・渓谷・雪山、自然休養の聖地', zh: '海岸、溪谷与雪山的自然胜地' }, spots: ['속초', '강릉', '설악산', '평창'] },
  '33': { tagline: { ko: '내륙의 호수와 산막 힐링', en: 'Inland lakes and mountain healing', ja: '内陸の湖と山あいの癒し', zh: '内陆湖泊与山林疗愈' }, spots: ['단양', '청남대', '충주호', '속리산'] },
  '34': { tagline: { ko: '백제 역사와 서해 갯벌', en: 'Baekje heritage and west-coast tidal flats', ja: '百済の歴史と西海の干潟', zh: '百济历史与西海滩涂' }, spots: ['공주', '부여', '안면도', '보령머드'] },
  '35': { tagline: { ko: '천년 신라와 유교문화의 본향', en: 'Home of millennium Silla and Confucian culture', ja: '千年新羅と儒教文化の本郷', zh: '千年新罗与儒教文化之乡' }, spots: ['경주', '안동하회마을', '포항', '영주 부석사'] },
  '36': { tagline: { ko: '남해 비경과 한려수도의 절경', en: 'Hidden beauty of the southern sea', ja: '南海の絶景と閑麗水道', zh: '南海秘境与闲丽水道' }, spots: ['통영', '거제', '남해', '진주성'] },
  '37': { tagline: { ko: '한옥·맛·소리의 고장', en: 'Land of hanok, food and pansori', ja: '韓屋・グルメ・パンソリの郷', zh: '韩屋、美食与板索里之乡' }, spots: ['전주한옥마을', '군산', '남원', '내장산'] },
  '38': { tagline: { ko: '섬·갯벌·차밭의 남도 여행', en: 'Islands, tidal flats and tea fields', ja: '島・干潟・茶畑の南道', zh: '海岛、滩涂与茶园的南道' }, spots: ['여수', '순천만', '보성녹차밭', '담양'] },
  '39': { tagline: { ko: '한국 최고의 휴양 섬', en: "Korea's premier resort island", ja: '韓国随一のリゾートアイランド', zh: '韩国第一度假海岛' }, spots: ['성산일출봉', '한라산', '우도', '협재해변'] },
};

export function getRegionGuide(code: string): RegionGuide | null {
  return REGION_GUIDE[code] ?? null;
}

/** 그 달의 계절성 등급: peak(성수기)·rising(방문 느는 시기)·steady(사계절). idx=0~100. */
export function seasonInfo(stat: RegionStat, month: number): { tier: 'peak' | 'rising' | 'steady'; idx: number } {
  const idx = Math.round(stat.monthly?.[month - 1] ?? 0);
  const isPeak = (stat.peak ?? []).includes(month) || idx >= 88;
  const tier = isPeak ? 'peak' : idx >= 70 ? 'rising' : 'steady';
  return { tier, idx };
}
