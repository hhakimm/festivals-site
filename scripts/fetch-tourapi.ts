/**
 * 빌드 타임에 TourAPI를 호출해서 src/content/data/*.json 으로 저장한다.
 * 이 스크립트가 SEO의 핵심: 런타임 API 호출을 빌드타임 정적 데이터로 바꿈.
 *
 * 사용법:
 *   TOUR_API_KEY=xxx npm run fetch
 *   (TOURAPI_KEY 도 호환)
 *
 * 환경 변수가 없으면 mock 데이터로 폴백 — 처음 셋업할 때 키 없이도 돌아감.
 *
 * 데이터 보강 전략 (KorService2 API 한계 회피):
 *   - areacode 필드는 TourAPI가 빈 값으로 줄 때가 많음 → lDongRegnCd(법정동 시도코드)로 보강
 *   - cat1/cat2/cat3도 비어 옴 → lclsSystm1(새 분류체계)로 보강
 *   - 축제 날짜(eventstartdate/eventenddate)는 searchFestival2 엔드포인트에서만 정상 반환
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'data');

const TOURAPI_KEY = process.env.TOUR_API_KEY || process.env.TOURAPI_KEY || '';
const TOURAPI_BASE = 'https://apis.data.go.kr/B551011/KorService2';

// 축제 날짜 범위 (커버할 일정 범위 — 연도 걸치는 겨울 축제 포함)
const EVENT_START_DATE = process.env.EVENT_START_DATE || '20251201';
const EVENT_END_DATE = process.env.EVENT_END_DATE || '20271231';

// 축제 최대 기간 (일) — 그보다 긴 건 사실상 상시 행사로 보고 제외
const MAX_FESTIVAL_DURATION_DAYS = 30;

// TourAPI contentTypeId — 여행지(12) 만 areaBasedList2로 받음 (축제는 searchFestival2)
const CONTENT_TYPE = {
  ATTRACTION: 12,
} as const;

// 법정동 시도코드(lDongRegnCd, 2자리) → TourAPI areacode 체계로 변환
// 두 체계가 달라서 매핑 필요. src/lib/data.ts AREA_CODE 키와 일치해야 함.
const L_DONG_TO_AREACODE: Record<string, string> = {
  '11': '1',   // 서울
  '26': '6',   // 부산
  '27': '4',   // 대구
  '28': '2',   // 인천
  '29': '5',   // 광주
  '30': '3',   // 대전
  '31': '7',   // 울산
  '36': '8',   // 세종
  '41': '31',  // 경기
  '43': '33',  // 충북
  '44': '34',  // 충남
  '45': '37',  // 전북
  '46': '38',  // 전남
  '47': '35',  // 경북
  '48': '36',  // 경남
  '50': '39',  // 제주
  '51': '32',  // 강원
};

// 주소 prefix → areacode (lDong 결측 시 폴백)
const ADDR_PREFIX_TO_AREACODE: Array<[string, string]> = [
  ['서울', '1'],
  ['부산', '6'],
  ['대구', '4'],
  ['인천', '2'],
  ['광주', '5'],
  ['대전', '3'],
  ['울산', '7'],
  ['세종', '8'],
  ['경기', '31'],
  ['강원', '32'],
  ['충청북', '33'], ['충북', '33'],
  ['충청남', '34'], ['충남', '34'],
  ['경상북', '35'], ['경북', '35'],
  ['경상남', '36'], ['경남', '36'],
  ['전라북', '37'], ['전북', '37'],
  ['전라남', '38'], ['전남', '38'],
  ['제주', '39'],
];

// lclsSystm1 (TourAPI 새 분류체계, 2자) → 기존 사이트 5개 테마로 매핑
// 자세히: NA=자연, HS=역사, VE=휴양, EX=체험, LS=레저스포츠, AC=문화시설, SH=쇼핑, FD=음식, LD=숙박, EV=축제, TR=여행코스
const LCLS_TO_THEME: Record<string, string> = {
  NA: '자연',
  HS: '역사',
  VE: '휴양',
  EX: '체험',
  LS: '체험',  // 레저스포츠도 체험으로
  AC: '건축',  // 문화시설(미술관/박물관 등)은 건축으로 분류
};

interface TourApiItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  tel?: string;
  eventstartdate?: string;
  eventenddate?: string;
  modifiedtime?: string;
  createdtime?: string;
  // 보강용 추가 필드
  lDongRegnCd?: string;
  lDongSignguCd?: string;
  lclsSystm1?: string;
  lclsSystm2?: string;
  lclsSystm3?: string;
}

interface NormalizedItem {
  id: string;
  type: 'festival' | 'attraction';
  slug: string;
  title: string;
  address: string;
  areacode: string;
  category: { cat1?: string; cat2?: string; cat3?: string };
  /** 기존 사이트 호환 — 5개 테마 중 하나 ('자연'|'역사'|'휴양'|'체험'|'건축') 또는 빈 문자열 */
  theme: string;
  image: string | null;
  imageThumb: string | null;
  lat: number | null;
  lng: number | null;
  tel: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
}

// 한글/영문 혼합 문자열을 URL-safe slug로
function toSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return base ? `${base}-${id}` : id;
}

function inferAreacode(item: TourApiItem): string {
  // 1) TourAPI가 직접 채워준 값
  if (item.areacode && item.areacode.trim()) return item.areacode.trim();
  // 2) 법정동 시도코드 매핑
  const ld = item.lDongRegnCd;
  if (ld && L_DONG_TO_AREACODE[ld]) return L_DONG_TO_AREACODE[ld];
  // 3) 주소 prefix 매칭
  const addr = (item.addr1 || '').trim();
  for (const [prefix, code] of ADDR_PREFIX_TO_AREACODE) {
    if (addr.startsWith(prefix)) return code;
  }
  return '';
}

function inferTheme(item: TourApiItem): string {
  const l1 = item.lclsSystm1;
  if (l1 && LCLS_TO_THEME[l1]) return LCLS_TO_THEME[l1];
  return '';
}

/** 축제 기간(일). YYYYMMDD 두 값을 받아 일수 차이 + 1 (당일도 1일). */
function festivalDurationDays(start: string | null, end: string | null): number | null {
  if (!start || !end || start.length !== 8 || end.length !== 8) return null;
  const sy = +start.slice(0, 4), sm = +start.slice(4, 6) - 1, sd = +start.slice(6, 8);
  const ey = +end.slice(0, 4), em = +end.slice(4, 6) - 1, ed = +end.slice(6, 8);
  return Math.round((Date.UTC(ey, em, ed) - Date.UTC(sy, sm, sd)) / 86400000) + 1;
}

function normalize(item: TourApiItem, type: 'festival' | 'attraction'): NormalizedItem {
  const mapx = item.mapx ? parseFloat(item.mapx) : NaN;
  const mapy = item.mapy ? parseFloat(item.mapy) : NaN;
  return {
    id: item.contentid,
    type,
    slug: toSlug(item.title, item.contentid),
    title: item.title.trim(),
    address: [item.addr1, item.addr2].filter(Boolean).join(' ').trim(),
    areacode: inferAreacode(item),
    category: { cat1: item.cat1 || '', cat2: item.cat2 || '', cat3: item.cat3 || '' },
    theme: inferTheme(item),
    image: item.firstimage || null,
    imageThumb: item.firstimage2 || item.firstimage || null,
    lat: Number.isFinite(mapy) ? mapy : null,
    lng: Number.isFinite(mapx) ? mapx : null,
    tel: item.tel || null,
    startDate: item.eventstartdate || null,
    endDate: item.eventenddate || null,
    updatedAt: item.modifiedtime || item.createdtime || '',
  };
}

async function fetchPage(
  endpoint: string,
  extraParams: Record<string, string>,
  pageNo: number,
  numOfRows = 100,
): Promise<TourApiItem[]> {
  const url = new URL(`${TOURAPI_BASE}/${endpoint}`);
  url.searchParams.set('serviceKey', TOURAPI_KEY);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'festivals-site');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('arrange', 'C');
  url.searchParams.set('numOfRows', String(numOfRows));
  url.searchParams.set('pageNo', String(pageNo));
  for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TourAPI ${endpoint} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const items = data?.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

async function fetchAll(
  endpoint: string,
  extraParams: Record<string, string>,
  label: string,
  maxPages = 200,
): Promise<TourApiItem[]> {
  const collected: TourApiItem[] = [];
  let pageNo = 1;
  while (pageNo <= maxPages) {
    process.stdout.write(`  [${label}] page ${pageNo}... `);
    const items = await fetchPage(endpoint, extraParams, pageNo);
    console.log(`${items.length} items`);
    if (items.length === 0) break;
    collected.push(...items);
    if (items.length < 100) break;
    pageNo += 1;
    await new Promise((r) => setTimeout(r, 200)); // rate limit 여유
  }
  return collected;
}

function mockData(): { festivals: NormalizedItem[]; attractions: NormalizedItem[] } {
  // 키 없을 때 폴백 — 첫 셋업이 막히지 않도록.
  const sample = (
    id: string,
    title: string,
    type: 'festival' | 'attraction',
    addr: string,
    lat: number,
    lng: number,
    theme: string,
  ): NormalizedItem => ({
    id,
    type,
    slug: toSlug(title, id),
    title,
    address: addr,
    areacode: '3',
    category: { cat1: '', cat2: '', cat3: '' },
    theme,
    image: null,
    imageThumb: null,
    lat,
    lng,
    tel: null,
    startDate: type === 'festival' ? '20260801' : null,
    endDate: type === 'festival' ? '20260805' : null,
    updatedAt: '20260101120000',
  });

  return {
    festivals: [
      sample('m1', '대전 0시 축제', 'festival', '대전광역시 중구 중앙로', 36.328, 127.428, '체험'),
      sample('m2', '유성온천문화축제', 'festival', '대전광역시 유성구 온천로', 36.354, 127.341, '휴양'),
      sample('m3', '대전 사이언스 페스티벌', 'festival', '대전광역시 유성구 엑스포로', 36.376, 127.388, '체험'),
    ],
    attractions: [
      sample('m4', '한밭수목원', 'attraction', '대전광역시 서구 둔산대로', 36.367, 127.388, '자연'),
      sample('m5', '대전 오월드', 'attraction', '대전광역시 중구 사정공원로', 36.292, 127.397, '체험'),
      sample('m6', '계족산 황톳길', 'attraction', '대전광역시 대덕구 장동', 36.405, 127.456, '자연'),
    ],
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let festivals: NormalizedItem[] = [];
  let attractions: NormalizedItem[] = [];

  if (!TOURAPI_KEY) {
    console.log('⚠  TOUR_API_KEY 환경변수가 없음 — mock 데이터로 폴백');
    const mock = mockData();
    festivals = mock.festivals;
    attractions = mock.attractions;
  } else {
    console.log('▶  TourAPI 페치 시작');

    // 축제(15) — searchFestival2 (날짜 범위 지정, eventstartdate/eventenddate 정상 반환)
    console.log(`  축제(searchFestival2, ${EVENT_START_DATE}–${EVENT_END_DATE}) 수집 중...`);
    const rawFest = await fetchAll(
      'searchFestival2',
      { eventStartDate: EVENT_START_DATE, eventEndDate: EVENT_END_DATE },
      '축제',
    );
    const allFest = rawFest.map((i) => normalize(i, 'festival'));
    // 30일 초과 축제 제외 (사실상 상시 운영) + 날짜 누락도 안전하게 제외하지 않음(포함)
    const beforeFilter = allFest.length;
    festivals = allFest.filter((f) => {
      const d = festivalDurationDays(f.startDate, f.endDate);
      // 날짜가 없으면 일단 포함 (필터 기준 적용 불가)
      if (d == null) return true;
      return d <= MAX_FESTIVAL_DURATION_DAYS;
    });
    const excluded = beforeFilter - festivals.length;
    if (excluded > 0) console.log(`  ↳ 30일 초과 축제 ${excluded}개 제외`);

    // 여행지(12) — areaBasedList2
    console.log('  여행지(areaBasedList2, contentTypeId=12) 수집 중...');
    const rawAttr = await fetchAll(
      'areaBasedList2',
      { contentTypeId: String(CONTENT_TYPE.ATTRACTION) },
      '여행지',
    );
    attractions = rawAttr.map((i) => normalize(i, 'attraction'));
  }

  await writeFile(join(OUT_DIR, 'festivals.json'), JSON.stringify(festivals, null, 2), 'utf-8');
  await writeFile(
    join(OUT_DIR, 'attractions.json'),
    JSON.stringify(attractions, null, 2),
    'utf-8',
  );

  // 매핑 통계 — 보강 결과 검증
  const stats = (arr: NormalizedItem[]) => {
    const withArea = arr.filter((i) => i.areacode).length;
    const withTheme = arr.filter((i) => i.theme).length;
    const withDate = arr.filter((i) => i.startDate).length;
    return { total: arr.length, area: withArea, theme: withTheme, date: withDate };
  };
  const fs = stats(festivals);
  const as = stats(attractions);
  console.log(`✓  festivals.json: ${fs.total}개 (지역 ${fs.area}, 테마 ${fs.theme}, 날짜 ${fs.date})`);
  console.log(`✓  attractions.json: ${as.total}개 (지역 ${as.area}, 테마 ${as.theme})`);
  console.log(`✓  saved to ${OUT_DIR}`);

  // 클라이언트 필터용 경량 인덱스 (필요 필드만)
  await writeIndex([...festivals, ...attractions]);
}

interface IndexItem {
  i: string;     // id
  t: 0 | 1;      // type: 0=attraction, 1=festival
  s: string;     // slug
  n: string;     // title (name)
  a: string;     // address
  r: string;     // areacode (region key)
  th: string;    // theme
  img: string | null; // imageThumb
  lat: number | null;
  lng: number | null;
  sd: string | null; // startDate
  ed: string | null; // endDate
}

async function writeIndex(items: NormalizedItem[]) {
  const idx: IndexItem[] = items.map((it) => ({
    i: it.id,
    t: it.type === 'festival' ? 1 : 0,
    s: it.slug,
    n: it.title,
    a: it.address,
    r: it.areacode,
    th: it.theme,
    img: it.imageThumb,
    lat: it.lat,
    lng: it.lng,
    sd: it.startDate,
    ed: it.endDate,
  }));
  // public/index.json 으로도 복사해 클라이언트 fetch 가능
  const publicDir = join(__dirname, '..', 'public');
  await mkdir(publicDir, { recursive: true });
  // JSON.stringify 없이 압축 (들여쓰기 X)
  const json = JSON.stringify(idx);
  await writeFile(join(publicDir, 'index.json'), json, 'utf-8');
  console.log(`✓  index.json (filter용 경량 인덱스): ${(json.length / 1024).toFixed(0)} KB, ${idx.length}개`);
}

main().catch((err) => {
  console.error('✗  fetch failed:', err);
  process.exit(1);
});
