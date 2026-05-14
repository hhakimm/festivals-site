// 6 페르소나용 OG SVG 일괄 생성. 실행: node scripts/gen-persona-og.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PERSONAS = [
  { id: 'naturalist', emoji: '🌿', ko: '자연주의자', en: 'The Naturalist', from: '#16a34a', to: '#15803d', sub: '숲과 산이 가장 좋은 친구' },
  { id: 'cultural',   emoji: '🏛️', ko: '문화탐험가', en: 'Cultural Explorer', from: '#92400e', to: '#78350f', sub: '천년의 시간을 걷는 여행자' },
  { id: 'resort',     emoji: '🏖️', ko: '휴양가',     en: 'Resort Lover',      from: '#0891b2', to: '#0e7490', sub: '아무것도 안 하는 게 좋아' },
  { id: 'adventurer', emoji: '⛷️', ko: '모험가',     en: 'The Adventurer',    from: '#dc2626', to: '#b91c1c', sub: '심장이 뛰는 곳으로 간다' },
  { id: 'family',     emoji: '👨‍👩‍👧', ko: '가족여행자', en: 'Family Traveler',   from: '#facc15', to: '#eab308', sub: '함께 만드는 추억이 진짜 여행', dark: true },
  { id: 'urbanite',   emoji: '🏙️', ko: '도시탐험가', en: 'City Explorer',     from: '#7c3aed', to: '#5b21b6', sub: '도시의 맥동이 가장 흥미롭다' },
];

function svg(p) {
  const fg = p.dark ? '#171717' : '#fff';
  const sub = p.dark ? 'rgba(23,23,23,0.78)' : 'rgba(255,255,255,0.85)';
  const badge = p.dark ? '#171717' : '#facc15';
  const badgeText = p.dark ? '#fff' : '#171717';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.from}"/>
      <stop offset="1" stop-color="${p.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>

  <!-- 브랜드 마크 (좌상단) — 모든 OG에 일관 -->
  <g transform="translate(60 56)">
    <rect width="56" height="56" rx="12" fill="#fff" opacity="0.95"/>
    <circle cx="40" cy="17" r="5" fill="#facc15"/>
    <path d="M7 46 L18 24 L27 36 L35 19 L50 46 Z" fill="#171717"/>
  </g>
  <text x="130" y="92" font-family="Pretendard, system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${fg}" letter-spacing="-0.3">한국 가볼 만한 곳 · 여행 성향 테스트</text>

  <text x="600" y="260" text-anchor="middle" font-size="170">${p.emoji}</text>

  <text x="600" y="370" text-anchor="middle" font-family="Pretendard, system-ui, -apple-system, sans-serif" font-size="38" font-weight="500" fill="${sub}" letter-spacing="-0.5">당신의 여행 성향은</text>
  <text x="600" y="450" text-anchor="middle" font-family="Pretendard, system-ui, -apple-system, sans-serif" font-size="84" font-weight="800" fill="${fg}" letter-spacing="-3">${p.ko}</text>
  <text x="600" y="500" text-anchor="middle" font-family="Pretendard, system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="${sub}" letter-spacing="-0.5" font-style="italic">"${p.sub}"</text>

  <text x="600" y="580" text-anchor="middle" font-family="Pretendard, system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="${sub}">${p.en} · ${p.ko}</text>
</svg>
`;
}

const outDir = path.join(__dirname, '..', 'public');
for (const p of PERSONAS) {
  const file = path.join(outDir, `og-quiz-${p.id}.svg`);
  fs.writeFileSync(file, svg(p), 'utf-8');
  console.log(`✓ ${file}`);
}
console.log(`\n총 ${PERSONAS.length}장 생성`);
