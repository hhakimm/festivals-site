// 한국관광공사 '열린관광지' 인증 무장애 명소 일괄 추가
// 실행: node scripts/add-barrier-free-places.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const placesPath = path.join(__dirname, '..', 'data', 'places-curated.json');
const collectionsPath = path.join(__dirname, '..', 'data', 'collections.json');

const PLACEHOLDER = 'images/placeholder.svg';

const newPlaces = [
  {
    id: 'curated-gonjiam-ceramic-park',
    name: '곤지암 도자공원',
    region: '경기도',
    city: '광주시',
    category: '체험',
    description: '한국관광공사 인증 열린관광지. 도자 박물관·체험관·야외 조각공원이 평지로 이어져 휠체어·유모차 진입 OK. 가족 나들이로 인기.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.kocef.org/',
    lat: 37.3439, lng: 127.2647,
  },
  {
    id: 'curated-hantaek-arboretum',
    name: '한택식물원',
    region: '경기도',
    city: '용인시',
    category: '자연',
    description: '국내 최대 사립식물원. 9,700여 종 식물을 36개 전문 정원으로 분류. 일부 구간 무장애 데크 코스 보유. 봄 봄꽃, 가을 단풍 명소.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.hantaek.co.kr/',
    lat: 37.2099, lng: 127.2962,
  },
  {
    id: 'curated-anmyeondo-forest',
    name: '안면도 자연휴양림',
    region: '충청남도',
    city: '태안군',
    category: '자연',
    description: '국내 유일의 안면송 자연림. 무장애 데크길과 산림체험관으로 휠체어·유모차 산책 가능. 인근 꽃지해수욕장과 함께 코스로 추천.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.foresttrip.go.kr/',
    lat: 36.5070, lng: 126.3540,
  },
  {
    id: 'curated-ganghwa-tidal-center',
    name: '강화 갯벌센터',
    region: '인천광역시',
    city: '강화군',
    category: '자연',
    description: '람사르 습지로 등록된 강화남단 갯벌의 생태탐방 공간. 데크 산책로로 휠체어 진입 가능. 저어새 서식지로 유명한 철새 관찰 명소.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 37.6306, lng: 126.4111,
  },
  {
    id: 'curated-naksan-beach',
    name: '낙산 해수욕장',
    region: '강원특별자치도',
    city: '양양군',
    category: '휴양',
    description: '한국관광공사 열린관광지 인증 해수욕장. 백사장 진입용 매트와 수상 휠체어 운영. 옆에 낙산사가 있어 함께 둘러보기 좋다.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 38.1216, lng: 128.6309,
  },
  {
    id: 'curated-busan-citizens-park',
    name: '부산시민공원',
    region: '부산광역시',
    city: '부산진구',
    category: '자연',
    description: '미군 하야리아 부대 부지가 도심 공원으로 재탄생. 4개 테마(기억·문화·즐길·자연)의 평지 산책로와 잔디광장. 휠체어 대여소 운영.',
    image: PLACEHOLDER,
    officialUrl: 'https://www.citizenpark.or.kr/',
    lat: 35.1665, lng: 129.0584,
  },
  {
    id: 'curated-odongdo',
    name: '여수 오동도',
    region: '전라남도',
    city: '여수시',
    category: '자연',
    description: '여수 앞바다 작은 동백섬. 768m 방파제로 육지와 연결. 동백숲 평지 산책로와 등대까지 휠체어 진입 가능. 봄철 동백 절정.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 34.7470, lng: 127.7587,
  },
  {
    id: 'curated-gyeongpodae',
    name: '강릉 경포대·경포호',
    region: '강원특별자치도',
    city: '강릉시',
    category: '자연',
    description: '관동팔경의 하나인 누각과 둘레 4.4km 경포호. 호수 둘레길은 평지·데크길로 휠체어·유모차 한 바퀴 OK. 해변까지 이어지는 산책 코스.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 37.7944, lng: 128.9036,
  },
  {
    id: 'curated-saeyeongyo',
    name: '제주 새연교',
    region: '제주특별자치도',
    city: '서귀포시',
    category: '자연',
    description: '서귀포항과 새섬을 잇는 169m 보행 다리. 평지 다리와 새섬 둘레 산책로 모두 휠체어 OK. 야경 명소이자 칠십리시공원과 연결.',
    image: PLACEHOLDER,
    officialUrl: '',
    lat: 33.2402, lng: 126.5605,
  },
  {
    id: 'curated-tongyeong-cablecar',
    name: '통영 한려수도 조망 케이블카',
    region: '경상남도',
    city: '통영시',
    category: '체험',
    description: '미륵산(461m) 정상까지 약 2km 케이블카. 객실은 휠체어 진입 가능, 정상 전망대 일부도 무장애. 한려해상국립공원의 비경을 360도로.',
    image: PLACEHOLDER,
    officialUrl: 'https://cablecar.ttdc.kr/',
    lat: 34.8347, lng: 128.4271,
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

// ── 2) collections.json 의 barrier-free 컬렉션에 ID 추가 ──
const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
const bf = collections.find((c) => c.id === 'barrier-free');
if (!bf) { console.error('❌ barrier-free 컬렉션 없음'); process.exit(1); }
const newIds = newPlaces.map((p) => p.id);
const before = bf.ids.length;
bf.ids = [...bf.ids, ...newIds];
fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2) + '\n', 'utf-8');
console.log(`✅ barrier-free 컬렉션: ${before} → ${bf.ids.length}곳`);
