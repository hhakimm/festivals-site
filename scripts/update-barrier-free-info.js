// 국립/도립공원의 구체적 무장애 코스 정보를 description에 추가
// 실행: node scripts/update-barrier-free-info.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const placesPath = path.join(__dirname, '..', 'data', 'places-curated.json');

// id → { trail: 코스명, length: 거리, note: 참고사항 }
// 출처: 국립공원공단 '장애물 없는 탐방로' 인증 구간 + 한국관광공사 '열린관광지'
const BARRIER_FREE_INFO = {
  'curated-np-odaesan': {
    trail: '월정사 전나무숲길',
    length: '약 1km',
    note: '국내 대표 무장애 숲길. 매표소~일주문 평탄한 데크길.',
  },
  'curated-np-songnisan': {
    trail: '세조길',
    length: '1.6km',
    note: '법주사 매표소~세심정 구간. 데크와 평탄한 흙길로 휠체어 OK.',
  },
  'curated-np-hallasan': {
    trail: '어승생악 탐방로',
    length: '1.3km (편도)',
    note: '어리목 탐방안내소~정상. 산정까지 휠체어 진입 가능한 유일한 한라산 코스.',
  },
  'curated-np-deogyusan': {
    trail: '곤돌라 + 향적봉 정상부 데크',
    length: '곤돌라 2.6km + 정상 데크',
    note: '무주리조트~설천봉 곤돌라(휠체어 가능) → 정상 데크 일부 평탄.',
  },
  'curated-np-naejangsan': {
    trail: '우화정·일주문 단풍 산책로',
    length: '약 0.7km',
    note: '주차장~우화정 평탄 산책로. 가을 단풍 시즌 무장애 명소.',
  },
  'curated-np-jirisan': {
    trail: '구례 와룡 자연관찰로 / 성삼재~노고단 무장애 구간',
    length: '와룡 약 0.5km',
    note: '성삼재 휴게소까지 차량 접근 가능, 노고단 방향 일부 데크.',
  },
  'curated-np-seoraksan': {
    trail: '권금성 케이블카 + 비룡폭포 입구 일부',
    length: '케이블카 + 약 0.5km',
    note: '소공원~권금성 케이블카 휠체어 가능. 정상 일부 평탄.',
  },
  'curated-np-mudeungsan': {
    trail: '증심사 입구 무장애 데크',
    length: '약 0.6km',
    note: '증심교 주차장~증심사 평탄 데크. 일주문까지 휠체어 OK.',
  },
  'curated-np-bukhansan': {
    trail: '둘레길 사색의 길·소나무숲길 일부',
    length: '구간별 0.5~1km',
    note: '도봉·우이 구간 일부 무장애 인증. 둘레길 안내센터에서 코스 확인.',
  },
  'curated-np-juwangsan': {
    trail: '대전사~주방계곡 입구',
    length: '약 1km (편도)',
    note: '대전사 일주문~주방계곡 진입로. 평탄한 흙길로 유모차 OK.',
  },
  'curated-np-byeonsanbando': {
    trail: '채석강 해안 산책로',
    length: '약 0.4km',
    note: '격포항~채석강 절벽 전망대까지 평탄. 썰물 때만 절벽 가까이.',
  },
  'curated-np-taeanhaean': {
    trail: '학암포·꽃지 해변 데크',
    length: '구간별 0.3~1km',
    note: '학암포 해수욕장 진입 데크, 꽃지 할미·할아비바위 데크 산책로.',
  },
  'curated-pp-mungyeongsaejae': {
    trail: '제1관문~제2관문 옛길',
    length: '약 3km',
    note: '한국 대표 무장애 코스. 평탄한 흙길로 유모차·휠체어 자유롭게.',
  },
  'curated-pp-maisan': {
    trail: '탑사 입구 코스',
    length: '약 0.5km',
    note: '북부주차장~탑사 평탄 구간. 탑사 안쪽은 일부 계단.',
  },
};

function appendBarrierFreeNote(desc, info) {
  const note = `\n\n♿ 무장애 코스: ${info.trail} (${info.length}). ${info.note}`;
  // 이미 ♿ 무장애 코스가 들어있으면 스킵 (재실행 대비)
  if (desc.includes('♿ 무장애 코스')) return desc;
  return desc + note;
}

const places = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
let updated = 0;
let skipped = 0;

for (const p of places) {
  const info = BARRIER_FREE_INFO[p.id];
  if (!info) continue;
  const before = p.description || '';
  const after = appendBarrierFreeNote(before, info);
  if (after !== before) {
    p.description = after;
    updated++;
    console.log(`✓ ${p.id} → ${info.trail} (${info.length})`);
  } else {
    skipped++;
    console.log(`= ${p.id} (이미 추가됨)`);
  }
}

fs.writeFileSync(placesPath, JSON.stringify(places, null, 2) + '\n', 'utf-8');
console.log(`\n업데이트: ${updated}곳, 스킵: ${skipped}곳`);
