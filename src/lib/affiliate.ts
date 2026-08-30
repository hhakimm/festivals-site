import type { Item } from './data';
import { AREA_CODE } from './data';
import type { Lang } from './i18n';
import AFFILIATE_LINKS from '../content/affiliate/links.json';

const AGODA_LOCALE: Record<Lang, string> = {
  ko: 'ko-kr',
  en: 'en-us',
  ja: 'ja-jp',
  zh: 'zh-cn',
};

// Agoda 도시 페이지 슬러그. curl로 200 응답 확인된 도시만 매핑.
// 매핑 없는 areacode(세종, 경기, 충북/남, 경북/남, 전북/남)는 country 페이지로 폴백.
// 검색 파라미터 ?q= / ?textToSearch= 는 모두 홈으로 리다이렉트되므로 사용 금지.
const AGODA_CITY: Record<string, string> = {
  '1': 'seoul',
  '2': 'incheon',
  '3': 'daejeon',
  '4': 'daegu',
  '5': 'gwangju',
  '6': 'busan',
  '7': 'ulsan',
  '32': 'gangwon-do',
  '39': 'jeju',
};

// Booking.com 도시 페이지. 광역시 + 제주만 매핑, 나머지는 country 검색 폴백.
const BOOKING_CITY: Record<string, string> = {
  '1': 'seoul',
  '2': 'incheon',
  '3': 'daejeon',
  '4': 'daegu',
  '5': 'gwangju',
  '6': 'busan',
  '7': 'ulsan',
  '39': 'jeju',
};

// ─── 제휴 트래킹 ID 부착 ────────────────────────────────────────────
// 링크(어느 페이지로 보낼지)는 아래 함수들이 만들고, 여기서는 파트너별
// 트래킹 파라미터만 덧붙인다. env에 ID가 없으면 원본 URL을 그대로 반환하므로
// 설정 전까지는 지금과 100% 동일하게 동작한다.
//
// 설정: .env (또는 GitHub Actions secrets/vars)에
//   AGODA_AFFILIATE_ID=1234567
//   BOOKING_AFFILIATE_ID=1234567
//   KKDAY_AFFILIATE_ID=xxxx
//   SKYSCANNER_AFFILIATE_ID=xxxx
//   YANOLJA_DEEPLINK_PREFIX=https://click.linkprice.com/click.php?m=...&a=...&l=0&l_cd1=0&u=
// 파라미터 이름이 프로그램마다 다르면 <PARTNER>_AFFILIATE_PARAM 으로 덮어쓴다.

export type Partner = 'agoda' | 'booking' | 'kkday' | 'yanolja' | 'skyscanner';

// 파트너별 기본 쿼리 파라미터 이름.
// 야놀자는 국내 제휴 네트워크(링크프라이스 등) 딥링크만 지원 → PREFIX 방식 사용.
const DEFAULT_PARAM: Record<Partner, string> = {
  agoda: 'cid',
  booking: 'aid',
  kkday: 'cid',
  yanolja: '',
  skyscanner: 'associateid',
};

function readEnv(...names: string[]): string {
  const e = import.meta.env as unknown as Record<string, string | undefined>;
  for (const n of names) {
    const v = e[n];
    if (v && v.trim()) return v.trim();
  }
  return '';
}

/**
 * 세시간전(3hoursahead) 제휴링크 표 조회.
 *
 * 3ha.in/r/<숫자> 는 불투명 단축링크라 URL 규칙으로 만들 수 없다.
 * 지역별로 미리 만들어 content/affiliate/links.json 에 적어두고 여기서 찾아 쓴다.
 * 없으면 빈 문자열 → 호출부가 기존 원본 URL로 폴백한다.
 */
export function tableLink(partner: Partner, areacode: string): string {
  const table = (AFFILIATE_LINKS as unknown as Record<string, Record<string, string>>)[partner];
  if (!table) return '';
  return (table[areacode] || table.default || '').trim();
}

/** 파트너 링크에 제휴 ID를 붙인다. ID가 없으면 원본 그대로. */
export function withTracking(url: string, partner: Partner): string {
  const KEY = partner.toUpperCase();

  // 1) 네트워크 딥링크 방식 — 원본 URL을 인코딩해 프리픽스 뒤에 붙인다.
  const prefix = readEnv(`${KEY}_DEEPLINK_PREFIX`, `PUBLIC_${KEY}_DEEPLINK_PREFIX`);
  if (prefix) return prefix + encodeURIComponent(url);

  // 2) 쿼리 파라미터 방식
  const id = readEnv(`${KEY}_AFFILIATE_ID`, `PUBLIC_${KEY}_AFFILIATE_ID`);
  if (!id) return url;
  const param = readEnv(`${KEY}_AFFILIATE_PARAM`, `PUBLIC_${KEY}_AFFILIATE_PARAM`) || DEFAULT_PARAM[partner];
  if (!param) return url;
  if (new RegExp(`[?&]${param}=`).test(url)) return url; // 중복 부착 방지
  return url + (url.includes('?') ? '&' : '?') + param + '=' + encodeURIComponent(id);
}

// 여기어때 — 국내 숙소. 한국어 페이지의 1순위(국내 예약 전환율이 해외 OTA보다 높다).
// 지역 검색은 '정식 행정구역명'을 autoKeyword로 넘겨야 걸린다(2026-08-30 17개 시도 전수 확인).
const YEOGI_REGION: Record<string, string> = {
  '1': '서울특별시', '2': '인천광역시', '3': '대전광역시', '4': '대구광역시',
  '5': '광주광역시', '6': '부산광역시', '7': '울산광역시', '8': '세종특별자치시',
  '31': '경기도', '32': '강원특별자치도', '33': '충청북도', '34': '충청남도',
  '35': '경상북도', '36': '경상남도', '37': '전북특별자치도', '38': '전라남도',
  '39': '제주특별자치도',
};
export function yeogiUrl(item: Item): string {
  const mapped = tableLink('yeogi', item.areacode);
  if (mapped) return mapped;
  // 제휴링크가 아직 없는 지역 → 같은 목적지의 원본 URL로. 링크는 정상, 수수료만 0원.
  const full = YEOGI_REGION[item.areacode];
  if (!full) return 'https://www.yeogi.com/domestic-accommodations';
  const short = AREA_CODE[item.areacode]?.ko ?? full;
  return `https://www.yeogi.com/domestic-accommodations?keyword=${encodeURIComponent(short)}&autoKeyword=${encodeURIComponent(full)}`;
}

export function agodaUrl(item: Item, lang: Lang): string {
  const mapped = tableLink('agoda', item.areacode);
  if (mapped) return mapped;
  const locale = AGODA_LOCALE[lang];
  const city = AGODA_CITY[item.areacode];
  const url = city
    ? `https://www.agoda.com/${locale}/city/${city}-kr.html`
    : `https://www.agoda.com/${locale}/country/south-korea.html`;
  return withTracking(url, 'agoda');
}

// 야놀자(국문 전용). www/m/nol 도메인 모두 nol.yanolja.com/discovery/s/search 로
// 리다이렉트되므로 최종 URL 직결.
export function yanoljaUrl(item: Item): string {
  const mapped = tableLink('yanolja', item.areacode);
  if (mapped) return mapped;
  const region = AREA_CODE[item.areacode]?.ko ?? '한국';
  const url = `https://nol.yanolja.com/discovery/s/search?keyword=${encodeURIComponent(region)}`;
  return withTracking(url, 'yanolja');
}

export function bookingUrl(item: Item): string {
  const mapped = tableLink('booking', item.areacode);
  if (mapped) return mapped;
  const city = BOOKING_CITY[item.areacode];
  const url = city
    ? `https://www.booking.com/city/kr/${city}.html`
    : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('South Korea')}`;
  return withTracking(url, 'booking');
}

// KKday — 투어·액티비티·입장권. 지역 검색 페이지.
const KKDAY_LOCALE: Record<Lang, string> = {
  ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-tw',
};
export function kkdayUrl(item: Item, lang: Lang): string {
  const mapped = tableLink('kkday', item.areacode);
  if (mapped) return mapped;
  const region = AREA_CODE[item.areacode]?.[lang] || '';
  const loc = KKDAY_LOCALE[lang];
  const url = `https://www.kkday.com/${loc}/product/productlist/?keyword=${encodeURIComponent(region || 'Korea')}`;
  return withTracking(url, 'kkday');
}

// 스카이스캐너 — 항공권. 출발지는 미지정 → 사용자 입력.
const SKYSCANNER_LOCALE: Record<Lang, string> = {
  ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN',
};
// 도시 코드 (IATA 공항) — 매핑 없으면 한국 전체(KR)
const SKYSCANNER_AIRPORT: Record<string, string> = {
  '1': 'SEL',   // 서울 (인천+김포)
  '2': 'ICN',   // 인천
  '6': 'PUS',   // 부산
  '39': 'CJU',  // 제주
  '32': 'YNY',  // 양양 (강원)
  '4': 'TAE',   // 대구
  '5': 'KWJ',   // 광주
};
export function skyscannerUrl(item: Item, lang: Lang): string {
  const mapped = tableLink('skyscanner', item.areacode);
  if (mapped) return mapped;
  const code = SKYSCANNER_AIRPORT[item.areacode] || 'KR';
  const locale = SKYSCANNER_LOCALE[lang];
  const url = `https://www.skyscanner.net/transport/flights-to/${code.toLowerCase()}/?locale=${locale}`;
  return withTracking(url, 'skyscanner');
}
