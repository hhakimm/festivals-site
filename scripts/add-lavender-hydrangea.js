// 라벤더·수국 명소 일괄 추가 + collections.json lavender 컬렉션 채우기
// 실행: node scripts/add-lavender-hydrangea.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const placesPath = path.join(__dirname, '..', 'data', 'places-curated.json');
const collectionsPath = path.join(__dirname, '..', 'data', 'collections.json');

const PLACEHOLDER = 'images/placeholder.svg';

const newPlaces = [
  // ───────────── 라벤더 ─────────────
  {
    id: 'curated-goseong-lavender-farm',
    name: '고성 하늬라벤더팜',
    region: '강원특별자치도',
    city: '고성군',
    category: '자연',
    description: '국내 최대 라벤더 농장. 매년 6월 중순~7월 초 보랏빛 라벤더 5만 평이 만개. 라벤더 축제와 사진존, 라벤더 차·아이스크림이 인기.',
    image: PLACEHOLDER,
    officialUrl: 'https://lavenderfarm.co.kr/',
    lat: 38.2944, lng: 128.4647,
  },
  {
    id: 'curated-pyeongchang-herbnara',
    name: '평창 허브나라농원',
    region: '강원특별자치도',
    city: '평창군',
    category: '자연',
    description: '국내 최초 허브 테마 정원. 라벤더·로즈마리 등 수백 종의 허브가 계절별로 향기를 내뿜는다. 6~7월 라벤더 절정.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.herbnara.com/',
    lat: 37.6478, lng: 128.6717,
  },

  // ───────────── 수국 ─────────────
  {
    id: 'curated-yugu-saekdong-hydrangea',
    name: '공주 유구색동수국정원',
    region: '충청남도',
    city: '공주시',
    category: '자연',
    description: '한국 최대급 수국 군락지. 매년 6월 말~7월 초 형형색색 수국이 9,000평 정원에 가득 핀다. 수국 축제 기간 야간 조명도 운영.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 36.5172, lng: 126.9128,
  },
  {
    id: 'curated-hueree',
    name: '휴애리 자연생활공원',
    region: '제주특별자치도',
    city: '서귀포시',
    category: '자연',
    description: '사계절 꽃축제로 유명한 자연생태공원. 6~7월 수국, 봄 매화·유채, 가을 핑크뮬리·동백 등 시즌마다 다른 풍경. 흑돼지 먹이주기 체험도 인기.',
    image: PLACEHOLDER,
    officialUrl: 'https://hueree.com/',
    lat: 33.3478, lng: 126.7236,
  },
  {
    id: 'curated-docho-hydrangea',
    name: '신안 도초도 수국공원',
    region: '전라남도',
    city: '신안군',
    category: '자연',
    description: '"수국 섬" 도초도의 핵심 명소. 7만 그루 수국이 산책로 양쪽으로 끝없이 이어져 보랏빛 터널을 이룬다. 6월 말~7월 초 절정.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 34.6989, lng: 125.9711,
  },
  {
    id: 'curated-cheollipo-arboretum',
    name: '태안 천리포수목원',
    region: '충청남도',
    city: '태안군',
    category: '자연',
    description: '국제수목학회 인증 "세계의 아름다운 수목원" 12호. 1만 5천여 종의 식물 중 수국·동백·목련 컬렉션이 특히 유명. 6월 수국 시즌 절경.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.chollipo.org/',
    lat: 36.8081, lng: 126.1481,
  },
  // 거제 외도 보타니아: 이미 존재(curated-oedo-botania) — 컬렉션 추가만
  {
    id: 'curated-yangpyeong-deulkkot',
    name: '양평 들꽃수목원',
    region: '경기도',
    city: '양평군',
    category: '자연',
    description: '남한강변에 자리한 야생화·들꽃 전문 수목원. 6월 수국·연꽃, 봄 야생화, 가을 단풍이 시즌별 볼거리. 가족 나들이·산책 코스로 인기.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.nemunimo.co.kr/',
    lat: 37.4922, lng: 127.4906,
  },
];

// ── 1) places-curated.json 에 추가 ──
const places = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
const placeIds = new Set(places.map((p) => p.id));
const dups = newPlaces.filter((p) => placeIds.has(p.id));
if (dups.length) {
  console.error('❌ ID 충돌:', dups.map((d) => d.id).join(', '));
  process.exit(1);
}
const mergedPlaces = [...places, ...newPlaces];
fs.writeFileSync(placesPath, JSON.stringify(mergedPlaces, null, 2) + '\n', 'utf-8');
console.log(`✅ places-curated.json: ${newPlaces.length}개 추가 (총 ${mergedPlaces.length})`);

// ── 2) collections.json 의 lavender 컬렉션에 ID 추가 ──
const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
const lav = collections.find((c) => c.id === 'lavender');
if (!lav) { console.error('❌ lavender 컬렉션 없음'); process.exit(1); }
// 새로 추가 + 기존에 수국·라벤더 시즌으로 유명한 큐레이션도 포함
const additionalIds = [
  ...newPlaces.map((p) => p.id),
  // 기존 데이터 중 수국·라벤더 시즌도 유명한 곳들
  'curated-camellia-hill',  // 카멜리아힐 — 수국 시즌
  'curated-anseong-farmland', // 안성팜랜드 — 라벤더 시즌
  'curated-oedo-botania',   // 외도 보타니아 — 수국 시즌
];
const before = lav.ids.length;
const validAdditions = additionalIds.filter((id) => placeIds.has(id) || newPlaces.some((p) => p.id === id));
lav.ids = Array.from(new Set([...lav.ids, ...validAdditions]));
fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2) + '\n', 'utf-8');
console.log(`✅ lavender 컬렉션: ${before} → ${lav.ids.length}곳`);
