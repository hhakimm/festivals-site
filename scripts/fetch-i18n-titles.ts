/**
 * TourAPI 다국어 endpoint에서 기존 contentId의 title/addr 만 조회해 캐시.
 * EngService2 / JpnService2 / ChsService2 사용.
 *
 * 결과: src/content/data/i18n-titles.json
 *   { [contentId]: { en?: {title, address}, ja?: {...}, zh?: {...} } }
 *
 * 사용:
 *   TOURAPI_KEY=xxx npm run fetch:i18n
 *   # 한 번에 한 언어만 (선택):
 *   TOURAPI_KEY=xxx TARGET_LANG=en npm run fetch:i18n
 *
 * 안전장치:
 *   - 기존 캐시 (있으면) 이어서 보강 — 같은 contentId 결과 있으면 건너뜀
 *   - rate limit 회피: 호출 간 80ms sleep
 *   - 50회마다 진행률 출력 + 즉시 저장 (중단되어도 부분 결과 보존)
 *   - 키 없으면 종료 (빌드 fail 안 시킴 — workflow에서 continue-on-error)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'content', 'data');
const I18N_FILE = join(DATA_DIR, 'i18n-titles.json');

const TOURAPI_KEY = process.env.TOUR_API_KEY || process.env.TOURAPI_KEY || '';
if (!TOURAPI_KEY) {
  console.warn('⚠ TOURAPI_KEY 미설정 — 다국어 fetch 스킵 (기존 캐시 유지).');
  process.exit(0);
}

type Lang = 'en' | 'ja' | 'zh';
const TARGET_LANG = (process.env.TARGET_LANG || '').toLowerCase() as Lang | '';

const SERVICES: Record<Lang, string> = {
  en: 'https://apis.data.go.kr/B551011/EngService2',
  ja: 'https://apis.data.go.kr/B551011/JpnService2',
  zh: 'https://apis.data.go.kr/B551011/ChsService2',
};
const LANGS: Lang[] = TARGET_LANG ? [TARGET_LANG] : ['en', 'ja', 'zh'];

interface Mapping {
  [contentId: string]: Partial<Record<Lang, { title: string; address: string }>>;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchDetail(lang: Lang, contentId: string): Promise<{ title?: string; address?: string } | null> {
  const base = SERVICES[lang];
  const url =
    `${base}/detailCommon2?serviceKey=${TOURAPI_KEY}` +
    `&MobileOS=ETC&MobileApp=festivals-site&_type=json` +
    `&contentId=${contentId}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j: any = await r.json();
    const item = j?.response?.body?.items?.item;
    const it = Array.isArray(item) ? item[0] : item;
    if (!it) return null;
    return {
      title: typeof it.title === 'string' ? it.title.trim() : undefined,
      address: typeof it.addr1 === 'string' ? it.addr1.trim() : undefined,
    };
  } catch {
    return null;
  }
}

async function main() {
  // 1) 기존 데이터에서 contentId 목록 수집
  const fests = JSON.parse(await readFile(join(DATA_DIR, 'festivals.json'), 'utf-8'));
  const attrs = JSON.parse(await readFile(join(DATA_DIR, 'attractions.json'), 'utf-8'));
  const allIds: string[] = [...fests, ...attrs].map((x: any) => String(x.id));

  // 2) 기존 캐시 로드
  let cache: Mapping = {};
  if (existsSync(I18N_FILE)) {
    try { cache = JSON.parse(await readFile(I18N_FILE, 'utf-8')); } catch {}
  }

  console.log(`총 ${allIds.length} contentId × ${LANGS.length}언어 (${LANGS.join('/')})`);
  console.log(`기존 캐시: ${Object.keys(cache).length} contentId`);

  let processed = 0;
  let added = 0;
  const total = allIds.length * LANGS.length;
  for (const lang of LANGS) {
    console.log(`\n=== ${lang.toUpperCase()} 시작 ===`);
    for (const id of allIds) {
      processed++;
      if (cache[id]?.[lang]) continue; // 이미 캐시됨
      const detail = await fetchDetail(lang, id);
      if (detail?.title) {
        cache[id] = cache[id] || {};
        cache[id][lang] = {
          title: detail.title,
          address: detail.address || '',
        };
        added++;
      }
      // 진행률
      if (processed % 50 === 0) {
        console.log(`  [${processed}/${total}] +${added} cached (lang=${lang}, id=${id})`);
        // 50개마다 중간 저장
        await writeFile(I18N_FILE, JSON.stringify(cache, null, 0), 'utf-8');
      }
      await sleep(80); // rate limit
    }
  }

  // 최종 저장
  await writeFile(I18N_FILE, JSON.stringify(cache, null, 0), 'utf-8');
  console.log(`\n✅ 완료. 총 ${Object.keys(cache).length} contentId 캐시 (+${added} 신규)`);
}

main().catch((e) => {
  console.error('❌ 오류:', e);
  process.exit(1);
});
