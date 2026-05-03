// detailCommon2 API 진단 스크립트.
// festivals.json 첫 항목의 contentId로 detail API 한 번만 호출.

import { readFileSync } from 'node:fs';

const API_KEY = process.env.TOUR_API_KEY;
if (!API_KEY) {
  console.error('TOUR_API_KEY 환경변수 없음. .env 확인.');
  process.exit(1);
}

const data = JSON.parse(readFileSync('data/festivals.json', 'utf8'));
const contentId = data[0]?.id?.replace('tourapi-', '');
if (!contentId) {
  console.error('데이터에서 contentId를 찾지 못했습니다.');
  process.exit(1);
}
console.log('테스트 contentId:', contentId, '(' + (data[0]?.name || '') + ')');

const params = new URLSearchParams({
  serviceKey: API_KEY,
  MobileOS: 'ETC',
  MobileApp: 'festivals-site',
  contentId,
  _type: 'json',
});
const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?${params}`;
console.log('요청 URL (키 마스킹):', url.replace(/serviceKey=[^&]+/, 'serviceKey=***'));
console.log('');

const res = await fetch(url);
console.log('HTTP status:', res.status, res.statusText);
console.log('Content-Type:', res.headers.get('content-type'));
console.log('');
const text = await res.text();
console.log('응답 본문 (처음 2000자):');
console.log('---');
console.log(text.slice(0, 2000));
console.log('---');
