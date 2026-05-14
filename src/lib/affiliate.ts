import type { Item } from './data';
import { AREA_CODE } from './data';
import type { Lang } from './i18n';

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

export function agodaUrl(item: Item, lang: Lang): string {
  const locale = AGODA_LOCALE[lang];
  const city = AGODA_CITY[item.areacode];
  return city
    ? `https://www.agoda.com/${locale}/city/${city}-kr.html`
    : `https://www.agoda.com/${locale}/country/south-korea.html`;
}

// 야놀자(국문 전용). www/m/nol 도메인 모두 nol.yanolja.com/discovery/s/search 로
// 리다이렉트되므로 최종 URL 직결.
export function yanoljaUrl(item: Item): string {
  const region = AREA_CODE[item.areacode]?.ko ?? '한국';
  return `https://nol.yanolja.com/discovery/s/search?keyword=${encodeURIComponent(region)}`;
}

export function bookingUrl(item: Item): string {
  const city = BOOKING_CITY[item.areacode];
  return city
    ? `https://www.booking.com/city/kr/${city}.html`
    : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('South Korea')}`;
}

// KKday — 투어·액티비티·입장권. 지역 검색 페이지.
const KKDAY_LOCALE: Record<Lang, string> = {
  ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-tw',
};
export function kkdayUrl(item: Item, lang: Lang): string {
  const region = AREA_CODE[item.areacode]?.[lang] || '';
  const loc = KKDAY_LOCALE[lang];
  return `https://www.kkday.com/${loc}/product/productlist/?keyword=${encodeURIComponent(region || 'Korea')}`;
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
  const code = SKYSCANNER_AIRPORT[item.areacode] || 'KR';
  const locale = SKYSCANNER_LOCALE[lang];
  return `https://www.skyscanner.net/transport/flights-to/${code.toLowerCase()}/?locale=${locale}`;
}
