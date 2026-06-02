/**
 * OG 이미지 PNG 생성.
 *  1) 페르소나 결과 카드(og-quiz-{id}.png): 캐릭터 일러스트(char-{id}.png)를 합성한
 *     "캐릭터 공유 카드"를 동적 생성 → 카톡·인스타 공유 시 캐릭터가 크게 노출(바이럴).
 *  2) 그 외 og-*.svg(og-image, og-quiz 등): 기존처럼 SVG→PNG 변환.
 *
 * 소셜은 SVG를 못 읽으므로 PNG 필수. resvg는 시스템 폰트 로드(CI: fonts-noto-cjk).
 * resvg는 <image href="data:image/png;base64,..."> 임베드 래스터를 렌더한다.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// 페르소나별 그라데이션 + 캐릭터명(ko) + 유형 — quiz.ts와 일치
const PERSONA_OG: Record<string, { from: string; to: string; char: string; type: string }> = {
  naturalist: { from: '#16a34a', to: '#15803d', char: '숲멍 마스터 사슴', type: '🌿 자연주의자' },
  cultural:   { from: '#92400e', to: '#78350f', char: '천년 지식 부엉이', type: '🏛️ 문화탐험가' },
  resort:     { from: '#0891b2', to: '#0e7490', char: '프로 휴식러 나무늘보', type: '🏖️ 휴양가' },
  adventurer: { from: '#dc2626', to: '#b91c1c', char: '아드레날린 원숭이', type: '⛷️ 모험가' },
  family:     { from: '#facc15', to: '#eab308', char: '정 많은 곰', type: '👨‍👩‍👧 가족여행자' },
  urbanite:   { from: '#7c3aed', to: '#5b21b6', char: '핫플 헌터 여우', type: '🏙️ 도시탐험가' },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function personaOgSvg(p: { from: string; to: string; char: string; type: string }, charB64: string): string {
  const F = 'Pretendard, system-ui, -apple-system, sans-serif';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.5" r="0.6">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <image href="data:image/png;base64,${charB64}" x="60" y="80" width="470" height="470" preserveAspectRatio="xMidYMid meet"/>
  <text x="582" y="206" font-family="${F}" font-size="30" font-weight="700" fill="#ffffff" opacity="0.85">여행 성향 테스트</text>
  <text x="580" y="312" font-family="${F}" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="-1.5">${esc(p.char)}</text>
  <text x="582" y="372" font-family="${F}" font-size="34" font-weight="600" fill="#ffffff" opacity="0.92">${esc(p.type)}</text>
  <rect x="582" y="452" width="318" height="62" rx="31" fill="#ffffff"/>
  <text x="741" y="492" font-family="${F}" font-size="26" font-weight="800" fill="#171717" text-anchor="middle">나도 캐릭터 찾기 →</text>
  <text x="584" y="582" font-family="${F}" font-size="24" font-weight="600" fill="#ffffff" opacity="0.72">한국 가볼 만한 곳 · TravelKorea</text>
</svg>`;
}

function renderPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Pretendard' },
  });
  return resvg.render().asPng();
}

async function main() {
  const generated = new Set<string>();

  // 1) 페르소나 캐릭터 카드 (char-{id}.png 있을 때만 합성, 없으면 기존 SVG로 폴백)
  for (const [id, p] of Object.entries(PERSONA_OG)) {
    const charPath = join(PUBLIC_DIR, `char-${id}.png`);
    if (!existsSync(charPath)) {
      console.log(`  char-${id}.png 없음 — 기본 og-quiz-${id}.svg로 폴백`);
      continue;
    }
    try {
      const b64 = (await readFile(charPath)).toString('base64');
      const png = renderPng(personaOgSvg(p, b64));
      const out = `og-quiz-${id}.png`;
      await writeFile(join(PUBLIC_DIR, out), png);
      generated.add(`og-quiz-${id}`);
      console.log(`  ✓ 캐릭터 카드 ${out} (${(png.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`  ✗ og-quiz-${id} 합성 실패(폴백): ${(e as Error).message}`);
    }
  }

  // 2) 그 외 og-*.svg → PNG (이미 생성한 페르소나 카드는 스킵)
  const files = (await readdir(PUBLIC_DIR)).filter((f) => f.startsWith('og-') && f.endsWith('.svg'));
  for (const file of files) {
    const base = basename(file, '.svg');
    if (generated.has(base)) continue;
    const svg = await readFile(join(PUBLIC_DIR, file), 'utf-8');
    const png = renderPng(svg);
    await writeFile(join(PUBLIC_DIR, base + '.png'), png);
    console.log(`  ✓ ${file} → ${base}.png (${(png.length / 1024).toFixed(0)} KB)`);
  }
  console.log('✓  OG 이미지 생성 완료');
}

main().catch((err) => {
  console.error('✗  og-to-png 실패:', err);
  process.exit(1);
});
