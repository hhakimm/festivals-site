// 한국관광공사 TourAPI 4.0 (areaBasedList2)에서 관광지 데이터를 가져와
// data/places.json 으로 저장하는 동기화 스크립트.
//
// contentTypeId=12 (관광지) 만 받아오며,
// cat2 기준으로 다음 카테고리만 포함:
//   A0101/A0102: 자연
//   A0201      : 역사
//   A0202      : 휴양
//   A0203      : 체험
//   A0205      : 건축
//   A0206      : 문화
// 축제(A0207)/공연(A0208)/산업관광(A0204)은 제외.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const API_KEY = process.env.TOUR_API_KEY;
if (!API_KEY) {
  console.error('TOUR_API_KEY 환경변수가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';
const DETAIL_BASE = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const INTRO_BASE = 'https://apis.data.go.kr/B551011/KorService2/detailIntro2';
// v2: detailCommon + detailIntro 통합 캐시
const CACHE_FILE = 'data/.places-detail-cache-v2.json';
const NUM_OF_ROWS = 100;
const MAX_PER_AREA = 30;        // 시도당 최대 30개 (총 ~500)
const DETAIL_CONCURRENCY = 4;

// 시도명 정규화
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

const AREA_CODES = {
  '1': '서울특별시', '2': '인천광역시', '3': '대전광역시',
  '4': '대구광역시', '5': '광주광역시', '6': '부산광역시',
  '7': '울산광역시', '8': '세종특별자치시',
  '31': '경기도', '32': '강원특별자치도',
  '33': '충청북도', '34': '충청남도',
  '35': '경상북도', '36': '경상남도',
  '37': '전북특별자치도', '38': '전라남도',
  '39': '제주특별자치도',
};

// cat2 → 우리 카테고리 매핑
const CAT2_TO_CATEGORY = {
  A0101: '자연', // 자연관광지
  A0102: '자연', // 관광자원
  A0201: '역사', // 역사관광지
  A0202: '휴양', // 휴양관광지
  A0203: '체험', // 체험관광지
  A0205: '건축', // 건축/조형물
  A0206: '문화', // 문화시설
};

const ALL_AREA_CODES = Object.keys(AREA_CODES);

function inferRegion(item) {
  const addr = (item.addr1 || '').trim();
  if (addr) {
    for (const [prefix, full] of REGION_PREFIX_MAP) {
      if (addr.startsWith(prefix)) return full;
    }
  }
  return AREA_CODES[String(item.areacode)] || '기타';
}

function makeCity(addr1) {
  if (!addr1) return '';
  const parts = addr1.trim().split(/\s+/);
  return parts[1] || '';
}

function parseCoord(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractHref(html) {
  if (!html) return '';
  const m = String(html).match(/href=["']([^"']+)["']/i);
  if (m) return m[1].trim();
  const u = String(html).match(/https?:\/\/\S+/);
  return u ? u[0].trim() : '';
}

function loadCache() {
  if (!existsSync(CACHE_FILE)) return new Map();
  try {
    const obj = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    return new Map(Object.entries(obj));
  } catch { return new Map(); }
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache), null, 2) + '\n', 'utf8');
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchAreaPage(areaCode, pageNo, attempt = 1) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'festivals-site',
    numOfRows: String(NUM_OF_ROWS),
    pageNo: String(pageNo),
    arrange: 'O',     // 이미지 있는 것 + 제목순
    contentTypeId: '12',
    areaCode,
    _type: 'json',
  });
  const url = `${BASE}?${params}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(1000 * attempt * attempt);
      return fetchAreaPage(areaCode, pageNo, attempt + 1);
    }
    console.error('응답 본문:', text.slice(0, 500));
    throw new Error(`HTTP ${res.status} ${res.statusText} (areaCode=${areaCode})`);
  }
  let json;
  try { json = JSON.parse(text); }
  catch (e) {
    console.error('JSON 파싱 실패:', text.slice(0, 500));
    throw e;
  }
  if (!json.response) throw new Error('예상치 못한 응답');
  if (json.response.header?.resultCode && json.response.header.resultCode !== '0000') {
    throw new Error(`API 오류: ${json.response.header.resultMsg}`);
  }
  return json.response.body;
}

async function fetchByArea(areaCode) {
  const collected = [];
  let pageNo = 1;
  while (collected.length < MAX_PER_AREA && pageNo <= 5) {
    const body = await fetchAreaPage(areaCode, pageNo);
    const itemsRaw = body.items?.item;
    const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];
    if (items.length === 0) break;
    for (const it of items) {
      // cat2 화이트리스트
      if (!CAT2_TO_CATEGORY[it.cat2]) continue;
      // 좌표·이미지 필수
      if (!it.firstimage && !it.firstimage2) continue;
      if (!parseCoord(it.mapx) || !parseCoord(it.mapy)) continue;
      collected.push(it);
      if (collected.length >= MAX_PER_AREA) break;
    }
    if (Number(body.totalCount || 0) <= pageNo * NUM_OF_ROWS) break;
    pageNo++;
    await sleep(300);
  }
  return collected;
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
  let res;
  try { res = await fetch(`${baseUrl}?${params}`); }
  catch {
    if (attempt < 4) { await sleep(500 * attempt); return fetchEndpoint(baseUrl, contentId, extra, attempt + 1); }
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
  // detailCommon2 + detailIntro2 (관광지 contentTypeId=12) 병렬
  const [common, intro] = await Promise.all([
    fetchEndpoint(DETAIL_BASE, contentId),
    fetchEndpoint(INTRO_BASE, contentId, { contentTypeId: '12' }),
  ]);
  if (!common && !intro) return null;
  return {
    overview: common?.overview || '',
    homepage: common?.homepage || '',
    usetime: intro?.usetime || '',
    usefee: intro?.usefee || '',
    restdate: intro?.restdate || '',
    parking: intro?.parking || '',
    infocenter: intro?.infocenter || '',
    chkbabycarriage: intro?.chkbabycarriage || '',
    chkcreditcard: intro?.chkcreditcard || '',
    chkpet: intro?.chkpet || '',
    opendate: intro?.opendate || '',
    expguide: intro?.expguide || '',
  };
}

async function fetchAllDetails(items) {
  const total = items.length;
  const cache = loadCache();
  const details = new Map();
  let cached = 0, fetched = 0, failed = 0, done = 0;
  console.log(`캐시 보유: ${cache.size}건`);

  for (let i = 0; i < total; i += DETAIL_CONCURRENCY) {
    const batch = items.slice(i, i + DETAIL_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (it) => {
        const id = String(it.contentid);
        if (cache.has(id)) { cached++; return [id, cache.get(id)]; }
        const d = await fetchDetail(id);
        if (d) { fetched++; cache.set(id, d); } else { failed++; }
        return [id, d];
      })
    );
    for (const [id, d] of results) if (d) details.set(id, d);
    done += batch.length;
    process.stdout.write(`\r상세정보: ${done}/${total} (캐시 ${cached}, 신규 ${fetched}, 실패 ${failed}) `);
    if (i % (DETAIL_CONCURRENCY * 5) === 0) saveCache(cache);
  }
  saveCache(cache);
  process.stdout.write('\n');
  return details;
}

function transform(item, detail) {
  const overview = stripHtml(detail?.overview || '');
  const homepage = extractHref(detail?.homepage || '');
  return {
    id: `tourapi-place-${item.contentid}`,
    name: (item.title || '').trim(),
    region: inferRegion(item),
    city: makeCity(item.addr1),
    category: CAT2_TO_CATEGORY[item.cat2] || '기타',
    description: overview || (item.addr1 || '').trim(),
    image: item.firstimage || item.firstimage2 || 'images/placeholder.svg',
    officialUrl: homepage,
    lat: parseCoord(item.mapy),
    lng: parseCoord(item.mapx),
    address: (item.addr1 || '').trim(),
    info: {
      time: stripHtml(detail?.usetime || ''),
      fee: stripHtml(detail?.usefee || ''),
      restdate: stripHtml(detail?.restdate || ''),
      parking: stripHtml(detail?.parking || ''),
      tel: stripHtml(detail?.infocenter || ''),
      stroller: stripHtml(detail?.chkbabycarriage || ''),
      creditcard: stripHtml(detail?.chkcreditcard || ''),
      pet: stripHtml(detail?.chkpet || ''),
      opendate: stripHtml(detail?.opendate || ''),
      experience: stripHtml(detail?.expguide || ''),
    },
  };
}

console.log(`17개 시도에서 시도당 최대 ${MAX_PER_AREA}개씩 관광지 수집 중...`);
const raw = [];
for (const ac of ALL_AREA_CODES) {
  process.stdout.write(`  ${AREA_CODES[ac]} (areaCode=${ac})... `);
  const items = await fetchByArea(ac);
  raw.push(...items);
  console.log(`${items.length}개`);
  await sleep(200);
}
console.log(`\n수집 완료: ${raw.length}개`);

console.log(`\n상세정보(설명·공식사이트) 추가 수집...`);
const detailMap = await fetchAllDetails(raw);

const places = raw
  .map((it) => transform(it, detailMap.get(String(it.contentid))))
  .filter((p) => p.name && p.lat != null && p.lng != null)
  // 한국 영토 범위 외 제외
  .filter((p) => p.lat >= 33 && p.lat <= 39 && p.lng >= 124 && p.lng <= 132)
  // id 중복 제거
  .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
  .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));

writeFileSync('data/places.json', JSON.stringify(places, null, 2) + '\n', 'utf8');

const regionCount = {};
const catCount = {};
let withDescription = 0, withUrl = 0;
for (const p of places) {
  regionCount[p.region] = (regionCount[p.region] || 0) + 1;
  catCount[p.category] = (catCount[p.category] || 0) + 1;
  if (p.description && p.description.length > 30) withDescription++;
  if (p.officialUrl) withUrl++;
}

console.log('');
console.log(`✓ ${places.length}개 관광지를 data/places.json 에 저장했습니다.`);
console.log('  지역:', Object.entries(regionCount).map(([k, v]) => `${k}:${v}`).join(' '));
console.log('  카테고리:', Object.entries(catCount).map(([k, v]) => `${k}:${v}`).join(' '));
console.log(`  상세설명 보유: ${withDescription}/${places.length}`);
console.log(`  공식사이트 보유: ${withUrl}/${places.length}`);
