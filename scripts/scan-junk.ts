/** dry-run: 현재 attractions.json 에서 강화된 필터가 무엇을 지울지 미리 본다(삭제 X). */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNonTourist } from './junk-filter.ts';

const ATTR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'data', 'attractions.json');
const arr = JSON.parse(await readFile(ATTR, 'utf-8')) as Array<{ title: string }>;
const hit = arr.filter((a) => isNonTourist(a.title)).map((a) => a.title);
console.log(`전체 ${arr.length} 중 제거 대상 ${hit.length}곳:`);
for (const t of hit) console.log('  -', t);
