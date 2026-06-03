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
  naturalist: { from: '#16a34a', to: '#15803d', char: '숲멍 마스터 사슴', type: '자연주의자' },
  cultural:   { from: '#92400e', to: '#78350f', char: '천년 지식 부엉이', type: '문화탐험가' },
  resort:     { from: '#0891b2', to: '#0e7490', char: '프로 휴식러 나무늘보', type: '휴양가' },
  adventurer: { from: '#dc2626', to: '#b91c1c', char: '아드레날린 원숭이', type: '모험가' },
  family:     { from: '#facc15', to: '#eab308', char: '정 많은 곰', type: '가족여행자' },
  urbanite:   { from: '#7c3aed', to: '#5b21b6', char: '핫플 헌터 여우', type: '도시탐험가' },
};

// 여행 빌런 카드 (이모지 기반, 일러스트 없음) — quiz-villain.ts와 일치
const VILLAIN_OG: Record<string, { from: string; to: string; emoji: string; name: string; line: string }> = {
  photo:   { from: '#ec4899', to: '#be185d', emoji: '📸', name: '인생샷 강요 빌런', line: '여기서 한 장만 더! …다시!' },
  planner: { from: '#3b82f6', to: '#1d4ed8', emoji: '📋', name: '분 단위 계획 빌런', line: '지금 일정보다 7분 늦었어.' },
  late:    { from: '#6366f1', to: '#4338ca', emoji: '😴', name: '늦잠 빌런', line: '먼저 가 있어… 5분만…' },
  budget:  { from: '#16a34a', to: '#15803d', emoji: '💸', name: '가계부 빌런', line: '그거 굳이 사야 돼?' },
  foodie:  { from: '#f97316', to: '#c2410c', emoji: '🍢', name: '먹부림 빌런', line: '일단 이것도 시켜. 저것도.' },
  lost:    { from: '#0d9488', to: '#0f766e', emoji: '🗺️', name: '길치 빌런', line: '어? 아까 여기 지나갔나…?' },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function villainOgSvg(v: { from: string; to: string; name: string; line: string }): string {
  const F = 'Pretendard, system-ui, -apple-system, sans-serif';
  // 이모지는 CI(resvg+Noto)에서 렌더 불안정 → 한글·도형만 사용한 타이포그래픽 카드.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v.from}"/><stop offset="1" stop-color="${v.to}"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="1080" cy="110" r="260" fill="#fff" opacity="0.06"/>
  <circle cx="120" cy="560" r="200" fill="#fff" opacity="0.05"/>
  <text x="600" y="170" font-family="${F}" font-size="60" font-weight="800" fill="#fff" opacity="0.22" text-anchor="middle">VILLAIN</text>
  <text x="600" y="232" font-family="${F}" font-size="30" font-weight="700" fill="#fff" opacity="0.9" text-anchor="middle">여행 빌런 테스트</text>
  <text x="600" y="350" font-family="${F}" font-size="86" font-weight="800" fill="#fff" letter-spacing="-2" text-anchor="middle">${esc(v.name)}</text>
  <text x="600" y="416" font-family="${F}" font-size="32" font-weight="500" fill="#fff" opacity="0.92" font-style="italic" text-anchor="middle">"${esc(v.line)}"</text>
  <rect x="441" y="480" width="318" height="64" rx="32" fill="#fff"/>
  <text x="600" y="521" font-family="${F}" font-size="26" font-weight="800" fill="#171717" text-anchor="middle">나도 빌런 찾기 →</text>
  <text x="600" y="592" font-family="${F}" font-size="24" font-weight="600" fill="#fff" opacity="0.72" text-anchor="middle">한국 가볼 만한 곳 · TravelKorea</text>
</svg>`;
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

  // 1.5) 여행 빌런 카드 (이모지 기반)
  for (const [id, v] of Object.entries(VILLAIN_OG)) {
    try {
      const png = renderPng(villainOgSvg(v));
      await writeFile(join(PUBLIC_DIR, `og-villain-${id}.png`), png);
      console.log(`  ✓ 빌런 카드 og-villain-${id}.png (${(png.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`  ✗ og-villain-${id} 실패: ${(e as Error).message}`);
    }
  }
  try {
    const png = renderPng(villainOgSvg({ from: '#7c3aed', to: '#4338ca', name: '나는 어떤 여행 빌런?', line: '같이 여행 가면… 당신은 어떤 빌런?' }));
    await writeFile(join(PUBLIC_DIR, 'og-villain.png'), png);
    console.log('  ✓ 기본 빌런 카드 og-villain.png');
  } catch { /* noop */ }

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
