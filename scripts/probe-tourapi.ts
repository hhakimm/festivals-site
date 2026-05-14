/**
 * 진단용 임시 스크립트 — TourAPI 실제 응답 형태 확인.
 * 실행: npx tsx scripts/probe-tourapi.ts (--env-file=.env 필요)
 */

const KEY = process.env.TOUR_API_KEY || process.env.TOURAPI_KEY || '';
if (!KEY) {
  console.error('TOUR_API_KEY 환경변수 없음');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551011/KorService2';

async function call(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'festivals-probe');
  url.searchParams.set('_type', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`${endpoint} HTTP ${res.status}`);
    console.error((await res.text()).slice(0, 500));
    return null;
  }
  return res.json();
}

// 1) searchFestival2 — 축제 (날짜 범위 포함)
console.log('=== searchFestival2 (1 page, 3 items) ===');
const fest = await call('searchFestival2', {
  arrange: 'C',
  numOfRows: '3',
  pageNo: '1',
  eventStartDate: '20251201',
  eventEndDate: '20271231',
});
const festItems = fest?.response?.body?.items?.item;
const festFirst = Array.isArray(festItems) ? festItems[0] : festItems;
console.log('Total:', fest?.response?.body?.totalCount);
console.log('First item keys:', festFirst ? Object.keys(festFirst).sort() : 'none');
console.log('First item sample:', JSON.stringify(festFirst, null, 2));

// 2) areaBasedList2 — 여행지(12) (cat1/cat2/cat3 포함되는지)
console.log('\n=== areaBasedList2 contentTypeId=12 (3 items) ===');
const attr = await call('areaBasedList2', {
  arrange: 'C',
  contentTypeId: '12',
  numOfRows: '3',
  pageNo: '1',
});
const attrItems = attr?.response?.body?.items?.item;
const attrFirst = Array.isArray(attrItems) ? attrItems[0] : attrItems;
console.log('Total:', attr?.response?.body?.totalCount);
console.log('First item keys:', attrFirst ? Object.keys(attrFirst).sort() : 'none');
console.log('First item sample:', JSON.stringify(attrFirst, null, 2));
