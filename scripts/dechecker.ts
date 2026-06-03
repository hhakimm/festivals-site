/**
 * 캐릭터 PNG의 "투명 체크무늬가 픽셀로 구워진" 배경을 제거 → 진짜 투명으로.
 *
 * 원리: 배경(연회색 231 / 흰색 255 격자 + 옅은 그림자)은 캐릭터 외곽선(짙은 청록)
 * 바깥에 있고 이미지 가장자리와 연결돼 있다. 가장자리에서 flood-fill 하며
 * "중성(무채색) + 밝음" 픽셀을 투명(alpha=0)으로. 캐릭터 내부(크림/흰색 하이라이트)는
 * 외곽선에 둘러싸여 fill 이 도달하지 않으므로 안전.
 *
 * 입력: public/_char_orig/*.png (백업 원본) → 출력: public/char-*.png (600px, 투명)
 *   npx tsx scripts/dechecker.ts
 */
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SRC = join(PUB, '_char_orig');
const OUT_SIZE = 600;

// 배경(체크무늬/그림자) 판별: 무채색(채널 편차 작음) + 충분히 밝음
function isBg(r: number, g: number, b: number): boolean {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx - mn <= 26 && r + g + b >= 585; // 평균 ≥ 195
}

async function process(file: string) {
  const { data, info } = await sharp(join(SRC, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const buf = data; // RGBA
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];

  const pushPx = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!visited[p]) stack.push(p);
  };
  // 가장자리 전체를 시드로
  for (let x = 0; x < w; x++) { pushPx(x, 0); pushPx(x, h - 1); }
  for (let y = 0; y < h; y++) { pushPx(0, y); pushPx(w - 1, y); }

  let cleared = 0;
  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const o = p * 4;
    if (!isBg(buf[o], buf[o + 1], buf[o + 2])) continue; // 캐릭터 = 벽
    buf[o + 3] = 0; // 투명
    cleared++;
    const x = p % w, y = (p / w) | 0;
    pushPx(x + 1, y); pushPx(x - 1, y); pushPx(x, y + 1); pushPx(x, y - 1);
  }

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(join(PUB, file));

  const pct = ((cleared / (w * h)) * 100).toFixed(0);
  console.log(`  ${file}: 배경 ${cleared.toLocaleString()}px(${pct}%) 투명화 → ${OUT_SIZE}px`);
}

const files = (await readdir(SRC)).filter((f) => f.startsWith('char-') && f.endsWith('.png'));
console.log(`▶ ${files.length}개 처리`);
for (const f of files) await process(f);
console.log('✓ 완료');
