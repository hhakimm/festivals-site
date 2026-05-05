// 이미지가 없는 항목(placeholder)에 대해 자동으로 이미지를 찾아 채워주는 스크립트.
//
// 사용:
//   npm run enrich-images
//
// 처리 대상:
//   - data/places-curated.json (큐레이션 추천)
//   - data/festivals.json (축제)
//
// 검색 전략:
//   1. 한국관광공사 TourAPI (searchKeyword2)
//      이름 변형 여러 개를 시도:
//        - 원본 이름
//        - "2026 " 같은 연도 접두 제거
//        - "도립공원/국립공원" 같은 접미 제거
//        - 괄호 부분 제거
//        - 첫 1-2 단어만
//   2. 위키피디아 한국어판 (pageimages) — TourAPI 못 찾으면 폴백
//
// 정책:
//   - 같은 시·도 결과 우선
//   - 200ms 간격 호출
//   - 못 찾으면 placeholder 유지

import { readFileSync, writeFileSync } from 'node:fs';

const API_KEY = process.env.TOUR_API_KEY;

function regionKeyword(region) {
  if (!region) return '';
  return region
    .replace(/특별자치도|특별자치시|특별시|광역시/g, '')
    .replace(/도$/, '')
    .trim()
    .slice(0, 3);
}

// 이름의 다양한 변형 — 매칭 가능성 높이려고
function nameVariations(name) {
  const out = [];
  const seen = new Set();
  const add = (v) => {
    const t = (v || '').trim();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  };
  add(name);

  // 연도 접두 제거: "2026 ..." → "..."
  const noYear = name.replace(/^\d{4}\s+/, '').trim();
  add(noYear);

  // 괄호 부분 제거: "남해 다랑이논" 식
  const noParen = noYear.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  add(noParen);

  // "·" 같은 점 구분 다시: "공주 무령왕릉과 왕릉원" → "무령왕릉"
  const noDot = noParen.replace(/[·]/g, ' ').replace(/\s+/g, ' ').trim();
  add(noDot);

  // 공원·공원 접미 제거
  const noPark = noDot.replace(/(국립공원|도립공원|시립공원|군립공원|자연휴양림|수목원)$/, '').trim();
  add(noPark);

  // "고택", "유적", "유적지", "마을" 같은 일반 접미 — 그대로 두는 게 매칭에 더 좋을 수도. 안 바꿈.

  // 첫 2 단어, 첫 단어
  const words = noPark.split(/\s+/);
  if (words.length > 2) add(words.slice(0, 2).join(' '));
  if (words.length > 1) add(words[0]);

  // 시·군 명 제거: "강화 보문사" → "보문사"
  if (words.length >= 2) add(words.slice(1).join(' '));

  return out.slice(0, 5); // 너무 많이 시도하지 않도록 5개로 제한
}

async function searchTourAPI(name, region) {
  if (!API_KEY) return null;
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'festivals-site',
    keyword: name,
    numOfRows: '20',
    pageNo: '1',
    _type: 'json',
  });
  const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?${params}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch { return null; }
    const items = j.response?.body?.items?.item;
    const arr = Array.isArray(items) ? items : items ? [items] : [];
    if (arr.length === 0) return null;

    const regKey = regionKeyword(region);
    // 같은 지역 + 이미지 보유 우선
    const inRegion = arr.find((it) =>
      (it.addr1 || '').includes(regKey) && (it.firstimage || it.firstimage2)
    );
    if (inRegion) return inRegion.firstimage || inRegion.firstimage2;

    // 이미지 있는 아무 결과
    const withImage = arr.find((it) => it.firstimage || it.firstimage2);
    return withImage ? (withImage.firstimage || withImage.firstimage2) : null;
  } catch {
    return null;
  }
}

async function searchWiki(name) {
  const searchUrl = `https://ko.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&utf8=1`;
  let title = null;
  try {
    const r = await fetch(searchUrl);
    const j = await r.json();
    title = j.query?.search?.[0]?.title;
  } catch { return null; }
  if (!title) return null;

  const imgUrl = `https://ko.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json&redirects=1`;
  try {
    const r = await fetch(imgUrl);
    const j = await r.json();
    const pages = j.query?.pages || {};
    for (const k of Object.keys(pages)) {
      const p = pages[k];
      if (p.thumbnail?.source) return p.thumbnail.source;
    }
  } catch {}
  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function findImage(name, region, log) {
  const variants = nameVariations(name);
  // 1. TourAPI 먼저 (변형 모두 시도)
  for (const v of variants) {
    const img = await searchTourAPI(v, region);
    if (img) {
      if (log) log(`✓ TourAPI ("${v}")`);
      return img;
    }
    await sleep(180);
  }
  // 2. 위키 폴백 (변형 상위 3개만)
  for (const v of variants.slice(0, 3)) {
    const img = await searchWiki(v);
    if (img) {
      if (log) log(`✓ Wiki ("${v}")`);
      return img;
    }
    await sleep(180);
  }
  if (log) log('-');
  return null;
}

async function processFile(file, label) {
  console.log(`\n=== ${label} (${file}) ===`);
  const items = JSON.parse(readFileSync(file, 'utf8'));
  const targets = items.filter((it) => !it.image || it.image === 'images/placeholder.svg');
  console.log(`총 ${items.length}개 중 ${targets.length}개가 placeholder.\n`);

  let updated = 0;
  let i = 0;
  for (const it of items) {
    i++;
    const isPlaceholder = !it.image || it.image === 'images/placeholder.svg';
    if (!isPlaceholder) continue;

    const log = (msg) => console.log(`[${i}/${items.length}] ${it.name} ... ${msg}`);
    process.stdout.write(`[${i}/${items.length}] ${it.name} `);
    const img = await findImage(it.name, it.region, log);
    if (img) {
      it.image = img;
      updated++;
    } else {
      // findImage 가 이미 '-' 출력함
    }
  }

  writeFileSync(file, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`\n${label}: ${updated}/${targets.length} 채움`);
  return { updated, targets: targets.length };
}

if (!API_KEY) {
  console.warn('⚠ TOUR_API_KEY 없음 — 위키만 사용 (성공률 낮음). .env 파일 확인.');
}

const r1 = await processFile('data/places-curated.json', '큐레이션 여행지');
const r2 = await processFile('data/festivals.json', '축제');

console.log(`\n========================`);
console.log(`총 결과:`);
console.log(`  큐레이션: ${r1.updated}/${r1.targets} 채움`);
console.log(`  축제:    ${r2.updated}/${r2.targets} 채움`);
