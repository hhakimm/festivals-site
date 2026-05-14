import festivalsData from '../content/data/festivals.json';
import attractionsData from '../content/data/attractions.json';

export interface Item {
  id: string;
  type: 'festival' | 'attraction';
  slug: string;
  title: string;
  address: string;
  areacode: string;
  category: { cat1?: string; cat2?: string; cat3?: string };
  /** 5개 테마 중 하나: '자연' | '역사' | '휴양' | '체험' | '건축' (또는 빈 문자열) */
  theme?: string;
  image: string | null;
  imageThumb: string | null;
  lat: number | null;
  lng: number | null;
  tel: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
}

export const festivals = festivalsData as Item[];
export const attractions = attractionsData as Item[];
export const all = [...festivals, ...attractions];

// areacode → 한국어 지역명
export const AREA_CODE: Record<string, { ko: string; en: string; ja: string; zh: string }> = {
  '1': { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔' },
  '2': { ko: '인천', en: 'Incheon', ja: '仁川', zh: '仁川' },
  '3': { ko: '대전', en: 'Daejeon', ja: '大田', zh: '大田' },
  '4': { ko: '대구', en: 'Daegu', ja: '大邱', zh: '大邱' },
  '5': { ko: '광주', en: 'Gwangju', ja: '光州', zh: '光州' },
  '6': { ko: '부산', en: 'Busan', ja: '釜山', zh: '釜山' },
  '7': { ko: '울산', en: 'Ulsan', ja: '蔚山', zh: '蔚山' },
  '8': { ko: '세종', en: 'Sejong', ja: '世宗', zh: '世宗' },
  '31': { ko: '경기', en: 'Gyeonggi', ja: '京畿', zh: '京畿' },
  '32': { ko: '강원', en: 'Gangwon', ja: '江原', zh: '江原' },
  '33': { ko: '충북', en: 'Chungbuk', ja: '忠清北道', zh: '忠清北道' },
  '34': { ko: '충남', en: 'Chungnam', ja: '忠清南道', zh: '忠清南道' },
  '35': { ko: '경북', en: 'Gyeongbuk', ja: '慶尚北道', zh: '庆尚北道' },
  '36': { ko: '경남', en: 'Gyeongnam', ja: '慶尚南道', zh: '庆尚南道' },
  '37': { ko: '전북', en: 'Jeonbuk', ja: '全羅北道', zh: '全罗北道' },
  '38': { ko: '전남', en: 'Jeonnam', ja: '全羅南道', zh: '全罗南道' },
  '39': { ko: '제주', en: 'Jeju', ja: '済州', zh: '济州' },
};

export function getById(id: string): Item | undefined {
  return all.find((i) => i.id === id);
}

export function getBySlug(type: 'festival' | 'attraction', slug: string): Item | undefined {
  const arr = type === 'festival' ? festivals : attractions;
  return arr.find((i) => i.slug === slug);
}

export function formatDate(yyyymmdd: string | null): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}
