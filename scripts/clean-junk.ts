/**
 * 기존 데이터 1회성 정제 — 이미 수집된 attractions.json / public/index.json 에서
 * 비관광 업소(병원·의원 등)를 제거한다. (다음 cron 수집 전에 즉시 반영용)
 *   npx tsx scripts/clean-junk.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNonTourist } from './junk-filter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ATTR = join(ROOT, 'src', 'content', 'data', 'attractions.json');
const INDEX = join(ROOT, 'public', 'index.json');

async function cleanAttractions() {
  if (!existsSync(ATTR)) return console.log('attractions.json 없음');
  const arr = JSON.parse(await readFile(ATTR, 'utf-8')) as Array<{ title: string }>;
  const kept = arr.filter((a) => !isNonTourist(a.title));
  const removed = arr.length - kept.length;
  const names = arr.filter((a) => isNonTourist(a.title)).map((a) => a.title);
  await writeFile(ATTR, JSON.stringify(kept, null, 2), 'utf-8');
  console.log(`attractions.json: ${arr.length} → ${kept.length} (${removed}곳 제거)`);
  if (names.length) console.log('  제거:', names.join(', '));
}

async function cleanIndex() {
  if (!existsSync(INDEX)) return console.log('index.json 없음');
  const arr = JSON.parse(await readFile(INDEX, 'utf-8')) as Array<{ n: string; t: number }>;
  // t===0 (여행지)만 필터 — 축제(t===1)는 그대로
  const kept = arr.filter((it) => it.t !== 0 || !isNonTourist(it.n));
  const removed = arr.length - kept.length;
  await writeFile(INDEX, JSON.stringify(kept), 'utf-8');
  console.log(`index.json: ${arr.length} → ${kept.length} (${removed}곳 제거)`);
}

await cleanAttractions();
await cleanIndex();
console.log('✓ 정제 완료');
