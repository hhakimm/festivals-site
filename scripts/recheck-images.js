// 이미지 재확인 — TourAPI 검색 결과의 좌표가 우리 좌표와 가까운 것만 채택.
// 이름 검색이 광범위해서 다른 장소 사진이 들어간 경우를 잡아냄.
//
// 사용:
//   npm run recheck-images           — 큐레이션만 (기본)
//   node scripts/recheck-images.js   — 동일
//
// 로직:
//   1. 각 큐레이션 항목에 대해 TourAPI 키워드 검색
//   2. 결과 중 우리 lat/lng 와 거리 ≤ 10km 인 것 선호
//   3. 가까운 것이 이미지 있으면 그 이미지로 교체
//   4. 가까운 것 없으면 기존 이미지 유지 (의심 표시만 출력)
//
// 멈춤: API 호출 간 200ms 슬립, 200초 정도 소요.

import { readFileSync, writeFileSync } from 'node:fs';

const API_KEY = process.env.TOUR_API_KEY;
if (!API_KEY) {
  console.error('❌ TOUR_API_KEY 환경변수 없음. .env 파일 확인.');
  process.exit(1);
}

const COORD_OK_KM = 10;        // 이 거리 이내면 같은 장소로 인정
const COORD_FAR_KM = 30;       // 이 거리보다 멀면 명백한 오매칭으로 의심

function regionKeyword(region) {
  if (!region) return '';
  return region
    .replace(/특별자치도|특별자치시|특별시|광역시/g, '')
    .replace(/도$/, '')
    .trim()
    .slice(0, 3);
}

function nameVariations(name) {
  const out = [];
  const seen = new Set();
  const add = (v) => {
    const t = (v || '').trim();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  };
  add(name);
  add(name.replace(/^\d{4}\s+/, '').trim());
  add(name.replace(/\s*\([^)]+\)\s*/g, ' ').trim());
  add(name.replace(/(도립공원|국립공원|자연휴양림|자연생활공원|국가정원|예술마을)$/, '').trim());
  // 첫 1-2 단어
  const words = name.split(/\s+/);
  if (words.length >= 2) add(words.slice(0, 2).join(' '));
  if (words.length >= 1) add(words[0]);
  return out;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  return 2 * R * Math.asin(Math.sqrt(x));
}

// TourAPI mapy=위도, mapx=경도 반환
async function searchTourAPI(keyword, region) {
  const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2` +
    `?serviceKey=${API_KEY}&MobileOS=ETC&MobileApp=festivals&_type=json` +
    `&keyword=${encodeURIComponent(keyword)}&numOfRows=15&pageNo=1`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch { return []; }
    const items = j.response?.body?.items?.item;
    const arr = Array.isArray(items) ? items : items ? [items] : [];
    return arr;
  } catch {
    return [];
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 좌표 기반으로 가장 가까운 이미지 보유 항목 찾기
async function findImageWithCoordCheck(name, region, lat, lng) {
  const variants = nameVariations(name);
  let best = null; // { dist, image, source }

  for (const v of variants) {
    const arr = await searchTourAPI(v, region);
    for (const it of arr) {
      const img = it.firstimage || it.firstimage2;
      if (!img) continue;
      const itLat = parseFloat(it.mapy);
      const itLng = parseFloat(it.mapx);
      if (!isFinite(itLat) || !isFinite(itLng)) continue;
      const dist = haversineKm(lat, lng, itLat, itLng);
      if (!best || dist < best.dist) {
        best = { dist, image: img, source: `"${v}" → ${it.title}` };
      }
    }
    await sleep(180);
    // 이미 좋은 매칭(<5km) 찾으면 조기 종료
    if (best && best.dist < 5) break;
  }
  return best;
}

async function main() {
  const file = 'data/places-curated.json';
  console.log(`=== 이미지 좌표 재확인 (${file}) ===\n`);
  const items = JSON.parse(readFileSync(file, 'utf8'));
  const withCoords = items.filter((it) => isFinite(it.lat) && isFinite(it.lng));
  console.log(`좌표 있는 항목: ${withCoords.length}/${items.length}\n`);

  let replaced = 0;
  let suspicious = 0;
  let unchanged = 0;
  let i = 0;
  for (const it of items) {
    i++;
    if (!isFinite(it.lat) || !isFinite(it.lng)) continue;

    process.stdout.write(`[${i}/${items.length}] ${it.name} `);
    const result = await findImageWithCoordCheck(it.name, it.region, it.lat, it.lng);

    if (!result) {
      console.log(`- 검색 결과 없음`);
      continue;
    }

    if (result.dist <= COORD_OK_KM) {
      // 가까운 매칭 발견 → 이미지 교체 (현재가 placeholder거나 다른 URL이어도)
      const isPlaceholder = !it.image || it.image === 'images/placeholder.svg';
      const changed = it.image !== result.image;
      if (changed) {
        it.image = result.image;
        replaced++;
        console.log(`✓ ${result.dist.toFixed(1)}km — ${isPlaceholder ? '신규' : '교체'}`);
      } else {
        unchanged++;
        console.log(`= ${result.dist.toFixed(1)}km — 동일`);
      }
    } else if (result.dist > COORD_FAR_KM) {
      // 너무 먼 결과 — 현재 이미지 신뢰도 낮음
      suspicious++;
      console.log(`⚠ 가장 가까운 후보도 ${result.dist.toFixed(0)}km — 의심`);
    } else {
      // 10~30km 사이 — 일단 두기
      unchanged++;
      console.log(`~ ${result.dist.toFixed(1)}km — 보류`);
    }
  }

  writeFileSync(file, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`\n========================`);
  console.log(`교체:   ${replaced}`);
  console.log(`동일:   ${unchanged}`);
  console.log(`의심:   ${suspicious}`);
}

main();
