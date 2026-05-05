// 한국관광공사 TourAPI 4.0 (searchFestival2)에서 축제 데이터를 가져와
// data/festivals.json 으로 저장하는 동기화 스크립트.
//
// 사용법:
//   1) .env 파일에 TOUR_API_KEY=... 작성
//   2) npm run sync

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// v2: detailCommon + detailIntro 통합 캐시 (이전 v1과 형식 다름)
const CACHE_FILE = 'data/.detail-cache-v2.json';

function loadCache() {
  if (!existsSync(CACHE_FILE)) return new Map();
  try {
    const obj = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveCache(cache) {
  const obj = Object.fromEntries(cache);
  writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

const API_KEY = process.env.TOUR_API_KEY;
if (!API_KEY) {
  console.error('TOUR_API_KEY 환경변수가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551011/KorService2/searchFestival2';
const DETAIL_BASE = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const INTRO_BASE = 'https://apis.data.go.kr/B551011/KorService2/detailIntro2';
// 기본: 2025년 12월 ~ 2027년 12월 (연도 걸치는 겨울 축제까지 포함)
const EVENT_START_DATE = process.env.EVENT_START_DATE || '20251201';
const EVENT_END_DATE = process.env.EVENT_END_DATE || '20271231';
const NUM_OF_ROWS = 100;
const DETAIL_CONCURRENCY = 4;

// 시도명 정규화: 공식 정규명 → 정규형
const REGION_PREFIX_MAP = [
  ['서울', '서울특별시'],
  ['부산', '부산광역시'],
  ['대구', '대구광역시'],
  ['인천', '인천광역시'],
  ['광주', '광주광역시'],
  ['대전', '대전광역시'],
  ['울산', '울산광역시'],
  ['세종', '세종특별자치시'],
  ['경기', '경기도'],
  ['강원', '강원특별자치도'],
  ['충청북', '충청북도'],
  ['충북', '충청북도'],
  ['충청남', '충청남도'],
  ['충남', '충청남도'],
  ['전북', '전북특별자치도'],
  ['전라북', '전북특별자치도'],
  ['전라남', '전라남도'],
  ['전남', '전라남도'],
  ['경상북', '경상북도'],
  ['경북', '경상북도'],
  ['경상남', '경상남도'],
  ['경남', '경상남도'],
  ['제주', '제주특별자치도'],
];

// addr1 또는 (옛 fallback) areacode → 공식 시도명
const AREA_CODES = {
  '1': '서울특별시',
  '2': '인천광역시',
  '3': '대전광역시',
  '4': '대구광역시',
  '5': '광주광역시',
  '6': '부산광역시',
  '7': '울산광역시',
  '8': '세종특별자치시',
  '31': '경기도',
  '32': '강원특별자치도',
  '33': '충청북도',
  '34': '충청남도',
  '35': '경상북도',
  '36': '경상남도',
  '37': '전북특별자치도',
  '38': '전라남도',
  '39': '제주특별자치도',
};

function inferRegion(item) {
  const addr = (item.addr1 || '').trim();
  if (addr) {
    for (const [prefix, full] of REGION_PREFIX_MAP) {
      if (addr.startsWith(prefix)) return full;
    }
  }
  const code = AREA_CODES[String(item.areacode)];
  if (code) return code;
  return '기타';
}

function formatDate(yyyymmdd) {
  if (!yyyymmdd || String(yyyymmdd).length !== 8) return null;
  const s = String(yyyymmdd);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function makeCity(addr1) {
  if (!addr1) return '';
  const parts = addr1.trim().split(/\s+/);
  if (parts.length < 2) return '';
  // "전라남도 보성군 ..." → "보성군"
  // "서울특별시 영등포구 ..." → "영등포구"
  return parts[1];
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractHref(html) {
  if (!html) return '';
  const m = String(html).match(/href=["']([^"']+)["']/i);
  if (m) return m[1].trim();
  // 가끔 <a> 없이 그냥 URL만 들어있는 경우
  const urlMatch = String(html).match(/https?:\/\/\S+/);
  return urlMatch ? urlMatch[0].trim() : '';
}

function parseCoord(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function transform(item, detail) {
  const overview = stripHtml(detail?.overview || '');
  const homepage = extractHref(detail?.homepage || '');
  return {
    id: `tourapi-${item.contentid}`,
    name: (item.title || '').trim(),
    region: inferRegion(item),
    city: makeCity(item.addr1),
    startDate: formatDate(item.eventstartdate),
    endDate: formatDate(item.eventenddate),
    category: '',
    description: overview || (item.eventplace || item.addr1 || '').trim(),
    image: item.firstimage || item.firstimage2 || 'images/placeholder.svg',
    officialUrl: homepage,
    lat: parseCoord(item.mapy),
    lng: parseCoord(item.mapx),
    address: (item.addr1 || '').trim(),
    info: {
      place: stripHtml(detail?.eventplace || ''),
      time: stripHtml(detail?.usetimefestival || ''),
      fee: stripHtml(detail?.usefee || ''),
      discount: stripHtml(detail?.discountinfofestival || ''),
      parking: stripHtml(detail?.parking || ''),
      duration: stripHtml(detail?.spendtimefestival || ''),
      ageLimit: stripHtml(detail?.agelimit || ''),
      sponsor: stripHtml(detail?.sponsor1 || ''),
      tel: stripHtml(detail?.sponsor1tel || ''),
      booking: stripHtml(detail?.bookingplace || ''),
      subEvent: stripHtml(detail?.subevent || ''),
    },
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(pageNo, attempt = 1) {
  const paramObj = {
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'festivals-site',
    eventStartDate: EVENT_START_DATE,
    numOfRows: String(NUM_OF_ROWS),
    pageNo: String(pageNo),
    arrange: 'A',
    _type: 'json',
  };
  if (EVENT_END_DATE) paramObj.eventEndDate = EVENT_END_DATE;
  const params = new URLSearchParams(paramObj);
  const url = `${BASE}?${params}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    // 일시적 오류면 백오프 후 재시도 (최대 4회)
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = 1000 * attempt * attempt;
      console.warn(`\n  HTTP ${res.status} (시도 ${attempt}/4) — ${wait}ms 후 재시도`);
      await sleep(wait);
      return fetchPage(pageNo, attempt + 1);
    }
    console.error('응답 본문:', text.slice(0, 800));
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('JSON 파싱 실패. 응답 일부:', text.slice(0, 800));
    throw e;
  }
  if (!json.response) {
    throw new Error('예상치 못한 응답 형식: ' + JSON.stringify(json).slice(0, 400));
  }
  if (json.response.header?.resultCode && json.response.header.resultCode !== '0000') {
    throw new Error(
      `API 오류: ${json.response.header.resultCode} ${json.response.header.resultMsg}`
    );
  }
  return json.response.body;
}

async function fetchAll() {
  const all = [];
  let pageNo = 1;
  while (true) {
    process.stdout.write(`페이지 ${pageNo} 가져오는 중... `);
    const body = await fetchPage(pageNo);
    const itemsRaw = body.items?.item;
    const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];
    const totalCount = Number(body.totalCount || 0);
    all.push(...items);
    console.log(`${items.length}개 (누적 ${all.length}/${totalCount})`);
    if (items.length === 0 || all.length >= totalCount) break;
    pageNo++;
    if (pageNo > 200) {
      console.warn('200 페이지 초과, 안전 차단');
      break;
    }
    // 초당 요청 제한 회피용 페이지 간 지연
    await sleep(400);
  }
  return all;
}

async function fetchEndpoint(baseUrl, contentId, extra = {}, attempt = 1) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'festivals-site',
    contentId: String(contentId),
    _type: 'json',
    ...extra,
  });
  const url = `${baseUrl}?${params}`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    if (attempt < 4) {
      await sleep(500 * attempt);
      return fetchEndpoint(baseUrl, contentId, extra, attempt + 1);
    }
    return null;
  }
  if (!res.ok) {
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(500 * attempt * attempt);
      return fetchEndpoint(baseUrl, contentId, extra, attempt + 1);
    }
    return null;
  }
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { return null; }
  const itemRaw = json.response?.body?.items?.item;
  const item = Array.isArray(itemRaw) ? itemRaw[0] : itemRaw;
  return item || null;
}

async function fetchDetail(contentId) {
  // detailCommon2 + detailIntro2 (축제 contentTypeId=15) 병렬 호출
  const [common, intro] = await Promise.all([
    fetchEndpoint(DETAIL_BASE, contentId),
    fetchEndpoint(INTRO_BASE, contentId, { contentTypeId: '15' }),
  ]);
  if (!common && !intro) return null;
  return {
    overview: common?.overview || '',
    homepage: common?.homepage || '',
    eventplace: intro?.eventplace || '',
    usetimefestival: intro?.usetimefestival || '',
    usefee: intro?.usefee || '',
    discountinfofestival: intro?.discountinfofestival || '',
    parking: intro?.parkingfestival || '',
    placeinfo: intro?.placeinfo || '',
    spendtimefestival: intro?.spendtimefestival || '',
    agelimit: intro?.agelimit || '',
    sponsor1: intro?.sponsor1 || '',
    sponsor1tel: intro?.sponsor1tel || '',
    bookingplace: intro?.bookingplace || '',
    subevent: intro?.subevent || '',
  };
}

async function fetchAllDetails(items) {
  const total = items.length;
  const cache = loadCache();
  const details = new Map();
  let cached = 0;
  let fetched = 0;
  let failed = 0;
  let done = 0;

  // 시작 시점에 이미 캐시된 건수 표시
  console.log(`캐시 보유: ${cache.size}건 (이미 받아둔 contentId는 API 호출 안 함)`);

  for (let i = 0; i < total; i += DETAIL_CONCURRENCY) {
    const batch = items.slice(i, i + DETAIL_CONCURRENCY);
    const tasks = batch.map(async (it) => {
      const id = String(it.contentid);
      if (cache.has(id)) {
        cached++;
        return [id, cache.get(id)];
      }
      const d = await fetchDetail(id);
      if (d) {
        fetched++;
        cache.set(id, d);
      } else {
        failed++;
      }
      return [id, d];
    });
    const results = await Promise.all(tasks);
    for (const [id, d] of results) {
      if (d) details.set(id, d);
    }
    done += batch.length;
    process.stdout.write(
      `\r상세정보: ${done}/${total} (캐시 ${cached}, 신규 ${fetched}, 실패 ${failed}) `
    );
    // 20건마다 캐시 저장 (중간에 끊겨도 손실 최소화)
    if (i % (DETAIL_CONCURRENCY * 5) === 0) {
      saveCache(cache);
    }
  }
  saveCache(cache);
  process.stdout.write('\n');
  return details;
}

const rawItems = await fetchAll();

console.log(`\n상세정보(설명·공식사이트)를 ${rawItems.length}건 추가로 가져옵니다...`);
const detailMap = await fetchAllDetails(rawItems);
const detailHits = [...detailMap.values()].filter(
  (d) => (d.overview && d.overview.trim()) || (d.homepage && d.homepage.trim())
).length;
console.log(`상세정보 수신: ${detailHits}/${rawItems.length}건 (overview 또는 homepage 보유)`);

const festivals = rawItems
  .map((it) => transform(it, detailMap.get(it.contentid)))
  .filter((f) => f.name && f.startDate && f.endDate)
  // id 중복 제거 (페이지 경계에서 중복 가능성 방지)
  .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
  .sort((a, b) => a.startDate.localeCompare(b.startDate));

writeFileSync(
  'data/festivals.json',
  JSON.stringify(festivals, null, 2) + '\n',
  'utf8'
);

const monthCount = Array(13).fill(0);
const regionCount = {};
let withDescription = 0;
let withUrl = 0;
let withCoords = 0;
for (const f of festivals) {
  const sm = Number(f.startDate.slice(5, 7));
  monthCount[sm]++;
  regionCount[f.region] = (regionCount[f.region] || 0) + 1;
  if (f.description && f.description.length > 30) withDescription++;
  if (f.officialUrl) withUrl++;
  if (f.lat != null && f.lng != null) withCoords++;
}

console.log('');
console.log(`✓ ${festivals.length}개 축제를 data/festivals.json 에 저장했습니다.`);
console.log('  월별(시작일 기준):', monthCount.slice(1).map((c, i) => `${i + 1}월:${c}`).join(' '));
console.log('  지역:', Object.entries(regionCount).map(([k, v]) => `${k}:${v}`).join(' '));
console.log(`  상세설명 보유: ${withDescription}/${festivals.length}`);
console.log(`  공식사이트 보유: ${withUrl}/${festivals.length}`);
console.log(`  좌표 보유: ${withCoords}/${festivals.length}`);
