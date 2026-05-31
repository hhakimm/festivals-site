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
import { existsSync } from 'node:fs';
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

// firstimage 없는 항목을 detailImage2로 보강할 때, 타입별 최대 호출 수.
// 갤러리 매칭(아래)이 먼저 많이 채우므로 detailImage2는 잔여분만 — 한도 절약 위해 축소.
// (API 일일 호출 한도가 빡빡한 개발용 키라면 env로 낮추세요. 0이면 보강 비활성)
const IMAGE_ENRICH_LIMIT = Number(process.env.IMAGE_ENRICH_LIMIT ?? '1000');

// 관광사진(포토코리아) 갤러리 — 전체 카탈로그를 받아 제목/키워드 매칭으로 빈 이미지 채움.
// galleryList1: 제목으로 그룹화된 사진 목록(galWebImageUrl·galTitle·galPhotographyLocation 등).
const GALLERY_BASE = 'https://apis.data.go.kr/B551011/PhotoGalleryService1/galleryList1';
const GALLERY_MAX_PAGES = Number(process.env.GALLERY_MAX_PAGES ?? '120'); // 0이면 비활성

// 무장애(♿)·반려동물(🐾) 동반 가능 장소 — 각 서비스의 areaBasedList2로 contentid 목록 수집.
// 별도 API(별도 quota). contentid가 국문 관광정보와 동일 체계라 정확 매칭.
const BARRIER_FREE_BASE = 'https://apis.data.go.kr/B551011/KorWithService2/areaBasedList2';
const PET_TOUR_BASE = 'https://apis.data.go.kr/B551011/KorPetTourService2/areaBasedList2';
const TAG_MAX_PAGES = Number(process.env.TAG_MAX_PAGES ?? '60'); // 0이면 비활성

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
  /** 무장애(♿)·반려동물(🐾) 동반 가능 여부 */
  barrierFree?: boolean;
  pet?: boolean;
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

/**
 * detailImage2 — contentId 하나의 상세 이미지 목록을 받아 첫 이미지를 반환.
 * firstimage가 비어 있는 항목 보강용. 실패/없음이면 null.
 */
async function fetchDetailImage(
  contentId: string,
): Promise<{ origin: string; small: string | null } | null> {
  const url = new URL(`${TOURAPI_BASE}/detailImage2`);
  url.searchParams.set('serviceKey', TOURAPI_KEY);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'festivals-site');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('contentId', contentId);
  url.searchParams.set('imageYN', 'Y');
  url.searchParams.set('numOfRows', '5');
  url.searchParams.set('pageNo', '1');

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const items = data?.response?.body?.items?.item;
  if (!items) return null;
  const list = Array.isArray(items) ? items : [items];
  for (const img of list) {
    const origin = (img?.originimgurl || '').trim();
    if (origin) return { origin, small: (img?.smallimageurl || '').trim() || null };
  }
  return null;
}

/**
 * firstimage 없는 항목들을 detailImage2로 보강 (in-place).
 * 호출 수는 IMAGE_ENRICH_LIMIT로 제한 — best-effort, 실패는 조용히 건너뜀.
 */
async function enrichMissingImages(items: NormalizedItem[], label: string): Promise<void> {
  if (IMAGE_ENRICH_LIMIT <= 0) return;
  const missing = items.filter((it) => !it.image);
  if (missing.length === 0) {
    console.log(`  [${label}] 이미지 누락 0개 — 보강 생략`);
    return;
  }
  const target = missing.slice(0, IMAGE_ENRICH_LIMIT);
  console.log(
    `  [${label}] 이미지 누락 ${missing.length}개 중 ${target.length}개 detailImage2 보강 시도...`,
  );
  let filled = 0;
  for (const it of target) {
    try {
      const img = await fetchDetailImage(it.id);
      if (img) {
        it.image = img.origin;
        if (!it.imageThumb) it.imageThumb = img.small || img.origin;
        filled += 1;
      }
    } catch {
      /* best-effort — 개별 실패 무시 */
    }
    await new Promise((r) => setTimeout(r, 120)); // rate limit 여유
  }
  console.log(`  [${label}] ↳ ${filled}/${target.length}개 이미지 보강 완료`);
}

interface GalleryPhoto {
  title: string;
  keyword: string;
  url: string;
}

/** 관광사진 갤러리 전체 카탈로그 수집 (제목·키워드·웹이미지URL). 실패 시 빈 배열. */
async function fetchGalleryCatalog(): Promise<GalleryPhoto[]> {
  if (GALLERY_MAX_PAGES <= 0) return [];
  const out: GalleryPhoto[] = [];
  for (let pageNo = 1; pageNo <= GALLERY_MAX_PAGES; pageNo++) {
    const url = new URL(GALLERY_BASE);
    url.searchParams.set('serviceKey', TOURAPI_KEY);
    url.searchParams.set('MobileOS', 'ETC');
    url.searchParams.set('MobileApp', 'festivals-site');
    url.searchParams.set('_type', 'json');
    url.searchParams.set('arrange', 'B'); // 제목순
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', String(pageNo));

    let data: any;
    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.log(`  [갤러리] page ${pageNo} HTTP ${res.status} — 중단`);
        break;
      }
      data = await res.json();
    } catch (e) {
      console.log(`  [갤러리] page ${pageNo} 오류 — 중단: ${(e as Error).message}`);
      break;
    }
    const items = data?.response?.body?.items?.item;
    if (!items) break;
    const list = Array.isArray(items) ? items : [items];
    for (const it of list) {
      // http → https (혼합콘텐츠 차단 방지; tong.visitkorea.or.kr는 https 지원)
      const url2 = String(it.galWebImageUrl || it.galWebImageURL || '').trim().replace(/^http:\/\//, 'https://');
      if (!url2) continue;
      out.push({
        title: String(it.galTitle || '').trim(),
        keyword: String(it.galSearchKeyword || it.galPhotographyLocation || '').trim(),
        url: url2,
      });
    }
    const total = Number(data?.response?.body?.totalCount ?? 0);
    if (pageNo * 1000 >= total || list.length < 1000) break;
    await new Promise((r) => setTimeout(r, 120));
  }
  return out;
}

/** 정규화: 공백·특수문자 제거(매칭용) */
function normTitle(s: string): string {
  return s.toLowerCase().replace(/[\s()\[\]{}·,./'"-]/g, '');
}

/**
 * 갤러리 사진을 제목/키워드로 매칭해 빈 이미지 채움(in-place, 보수적).
 * 항목 제목(4자 이상)이 사진 제목/키워드에 포함될 때만 사용 → 엉뚱한 사진 방지.
 */
function enrichFromGallery(items: NormalizedItem[], catalog: GalleryPhoto[], label: string): number {
  if (catalog.length === 0) return 0;
  // 사진을 정규화 텍스트로 인덱싱
  const idx = catalog.map((p) => ({ norm: normTitle(`${p.title} ${p.keyword}`), url: p.url, title: normTitle(p.title) }));
  let filled = 0;
  for (const it of items) {
    if (it.image) continue;
    const t = normTitle(it.title);
    if (t.length < 4) continue;
    // 1) 사진 제목이 항목명과 정확히 일치, 2) 사진 텍스트가 항목명을 포함
    const hit = idx.find((p) => p.title === t) || idx.find((p) => p.norm.includes(t));
    if (hit) {
      it.image = hit.url;
      if (!it.imageThumb) it.imageThumb = hit.url;
      filled++;
    }
  }
  console.log(`  [갤러리:${label}] ${filled}개 이미지 매칭 완료`);
  return filled;
}

/** areaBasedList2(무장애/반려동물)에서 contentid 집합 수집. 실패 시 빈 집합. */
async function fetchContentIdSet(baseUrl: string, label: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (TAG_MAX_PAGES <= 0) return set;
  for (let pageNo = 1; pageNo <= TAG_MAX_PAGES; pageNo++) {
    const url = new URL(baseUrl);
    url.searchParams.set('serviceKey', TOURAPI_KEY);
    url.searchParams.set('MobileOS', 'ETC');
    url.searchParams.set('MobileApp', 'festivals-site');
    url.searchParams.set('_type', 'json');
    url.searchParams.set('arrange', 'C');
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', String(pageNo));
    let data: any;
    try {
      const res = await fetch(url.toString());
      if (!res.ok) { console.log(`  [${label}] page ${pageNo} HTTP ${res.status} — 중단`); break; }
      data = await res.json();
    } catch (e) {
      console.log(`  [${label}] page ${pageNo} 오류 — 중단: ${(e as Error).message}`);
      break;
    }
    const items = data?.response?.body?.items?.item;
    if (!items) break;
    const list = Array.isArray(items) ? items : [items];
    for (const it of list) {
      const cid = String(it.contentid ?? '').trim();
      if (cid) set.add(cid);
    }
    const total = Number(data?.response?.body?.totalCount ?? 0);
    if (pageNo * 1000 >= total || list.length < 1000) break;
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`  [${label}] contentid ${set.size}개 수집`);
  return set;
}

/** 무장애·반려동물 플래그를 항목에 적용(in-place) */
function applyTags(items: NormalizedItem[], bf: Set<string>, pet: Set<string>): void {
  for (const it of items) {
    if (bf.has(it.id)) it.barrierFree = true;
    if (pet.has(it.id)) it.pet = true;
  }
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
    // 키가 없을 때 기존 커밋 데이터를 mock(6개)으로 덮어쓰면 사이트가 망가짐.
    // 데이터 파일이 이미 있으면 보존하고 종료(=CI에서 키 미설정 시 안전).
    const festPath = join(OUT_DIR, 'festivals.json');
    const attrPath = join(OUT_DIR, 'attractions.json');
    if (existsSync(festPath) && existsSync(attrPath)) {
      console.log('⚠  TOURAPI_KEY 없음 — 기존 데이터 유지(덮어쓰지 않음). CI Secrets에 TOURAPI_KEY를 설정하세요.');
      return;
    }
    console.log('⚠  TOURAPI_KEY 없음 & 데이터 파일 없음 — mock 데이터로 초기 생성');
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

    // 이미지 보강 1/2: 관광사진 갤러리 — 전체 카탈로그 1회 수집 후 제목/키워드 매칭(한도 절약)
    console.log('  이미지 보강 1/2: 관광사진 갤러리 카탈로그 수집...');
    const galleryCatalog = await fetchGalleryCatalog();
    console.log(`  [갤러리] 카탈로그 ${galleryCatalog.length}장 수집`);
    enrichFromGallery(festivals, galleryCatalog, '축제');
    enrichFromGallery(attractions, galleryCatalog, '여행지');

    // 이미지 보강 2/2: 남은 빈 이미지 detailImage2 폴백 (per-item, 한도 제한)
    console.log('  이미지 보강 2/2: detailImage2(잔여분)...');
    await enrichMissingImages(festivals, '축제');
    await enrichMissingImages(attractions, '여행지');

    // 무장애·반려동물 태그 수집 → 항목에 플래그 적용 (별도 quota)
    console.log('  태그 수집: 무장애·반려동물...');
    const [bfSet, petSet] = await Promise.all([
      fetchContentIdSet(BARRIER_FREE_BASE, '무장애'),
      fetchContentIdSet(PET_TOUR_BASE, '반려동물'),
    ]);
    applyTags(festivals, bfSet, petSet);
    applyTags(attractions, bfSet, petSet);
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
    const withImage = arr.filter((i) => i.image).length;
    return { total: arr.length, area: withArea, theme: withTheme, date: withDate, image: withImage };
  };
  const fs = stats(festivals);
  const as = stats(attractions);
  const pct = (n: number, t: number) => (t ? Math.round((100 * n) / t) : 0);
  console.log(`✓  festivals.json: ${fs.total}개 (지역 ${fs.area}, 테마 ${fs.theme}, 날짜 ${fs.date}, 이미지 ${fs.image} ${pct(fs.image, fs.total)}%)`);
  console.log(`✓  attractions.json: ${as.total}개 (지역 ${as.area}, 테마 ${as.theme}, 이미지 ${as.image} ${pct(as.image, as.total)}%)`);
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
  bf?: 1;            // barrierFree(무장애) — true일 때만
  pet?: 1;           // pet(반려동물) — true일 때만
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
    ...(it.barrierFree ? { bf: 1 as const } : {}),
    ...(it.pet ? { pet: 1 as const } : {}),
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
