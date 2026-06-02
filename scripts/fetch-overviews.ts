/**
 * 상세 소개글 누적 수집 — TourAPI detailCommon2(overview).
 *
 * 12,000+ 항목 × 소개글 = 하루 API 한도로 한 번에 불가 →
 * 매일 OVERVIEW_LIMIT(기본 600)개씩, 아직 안 받은 항목만 받아 overviews.json에 누적.
 * 워크플로의 commit-back 단계가 overviews.json을 저장소에 영구 보존 → 며칠에 걸쳐 전부 채움.
 *
 * - 빈 소개글(원본에 없음)도 ''로 기록 → 무한 재시도 방지.
 * - 키 없으면 스킵(기존 파일 보존). 한도 걸리면 중단(모은 것까지 저장).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'content', 'data');
const OVERVIEW_FILE = join(DATA_DIR, 'overviews.json');

const KEY = process.env.TOUR_API_KEY || process.env.TOURAPI_KEY || '';
const BASE = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const LIMIT = Number(process.env.OVERVIEW_LIMIT ?? '900');
const MAX_LEN = 800;

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchOverview(id: string): Promise<string | null> {
  const url = new URL(BASE);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'festivals-site');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('contentId', id);
  url.searchParams.set('overviewYN', 'Y');
  url.searchParams.set('defaultYN', 'Y');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`detailCommon2 ${res.status}`);
  const data = await res.json();
  const item = data?.response?.body?.items?.item;
  const it = Array.isArray(item) ? item[0] : item;
  const ov = stripHtml(String(it?.overview ?? ''));
  return ov ? ov.slice(0, MAX_LEN) : null;
}

async function loadIds(): Promise<string[]> {
  const ids: string[] = [];
  for (const f of ['festivals.json', 'attractions.json']) {
    const p = join(DATA_DIR, f);
    if (!existsSync(p)) continue;
    try {
      const arr = JSON.parse(await readFile(p, 'utf-8'));
      for (const it of arr) if (it?.id) ids.push(String(it.id));
    } catch { /* skip */ }
  }
  return ids;
}

async function main() {
  if (!KEY) {
    console.log('⚠  TOURAPI_KEY 없음 — 소개글 수집 스킵(기존 유지).');
    return;
  }
  let overviews: Record<string, string> = {};
  if (existsSync(OVERVIEW_FILE)) {
    try { overviews = JSON.parse(await readFile(OVERVIEW_FILE, 'utf-8')); } catch { overviews = {}; }
  }

  const ids = await loadIds();
  const todo = ids.filter((id) => !(id in overviews)).slice(0, LIMIT);
  console.log(`▶  소개글 수집: 전체 ${ids.length}, 기존 ${Object.keys(overviews).length}, 이번 시도 ${todo.length}`);

  let added = 0;
  for (const id of todo) {
    try {
      const ov = await fetchOverview(id);
      overviews[id] = ov ?? ''; // 빈 것도 기록(재시도 방지)
      if (ov) added += 1;
    } catch (e) {
      console.log(`  중단(한도/오류 추정): ${(e as Error).message}`);
      break; // 한도 걸리면 모은 것까지 저장하고 종료
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  await writeFile(OVERVIEW_FILE, JSON.stringify(overviews), 'utf-8');
  const total = Object.keys(overviews).length;
  console.log(`✓  소개글 ${added}개 신규 → 누적 ${total}/${ids.length} (${Math.round((total / Math.max(1, ids.length)) * 100)}%)`);
}

main().catch((e) => {
  console.error('✗  fetch-overviews 실패:', e);
  process.exit(0); // 부가기능 — 빌드 막지 않음
});
