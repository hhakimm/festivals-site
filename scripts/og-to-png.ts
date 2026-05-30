/**
 * public/og-*.svg → public/og-*.png 변환.
 * 소셜 플랫폼(카카오톡·인스타·X·페이스북)은 SVG OG 이미지를 렌더링하지 못하므로
 * 빌드 시 PNG로 변환해 og:image가 항상 미리보기로 뜨도록 한다.
 *
 * 폰트: 한글(Pretendard 또는 시스템) + 이모지. resvg는 시스템 폰트를 로드한다.
 * CI(ubuntu)에서는 fonts-noto-cjk + fonts-noto-color-emoji 설치 필요 (deploy.yml).
 */
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

async function main() {
  const files = (await readdir(PUBLIC_DIR)).filter(
    (f) => f.startsWith('og-') && f.endsWith('.svg'),
  );
  if (files.length === 0) {
    console.log('og-*.svg 없음 — 스킵');
    return;
  }
  console.log(`▶  OG SVG → PNG 변환: ${files.length}개`);

  for (const file of files) {
    const svg = await readFile(join(PUBLIC_DIR, file), 'utf-8');
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Pretendard',
      },
    });
    const png = resvg.render().asPng();
    const out = basename(file, '.svg') + '.png';
    await writeFile(join(PUBLIC_DIR, out), png);
    console.log(`  ✓ ${file} → ${out} (${(png.length / 1024).toFixed(0)} KB)`);
  }
  console.log('✓  완료');
}

main().catch((err) => {
  console.error('✗  og-to-png 실패:', err);
  process.exit(1);
});
