/**
 * 한국관광공사 관광빅데이터(DataLabService) — 광역지자체 방문자수 수집.
 * 빌드 타임에 호출 → src/content/stats/region-stats.json (지역×월 방문지수) 생성.
 *
 * - metcoRegnVisitrDDList: 일자별·광역별·방문자유형별 방문자수(touNum).
 *   touDivCd 1=현지인(제외), 2=외지인, 3=외국인 → 2+3 = 실제 여행객.
 * - 최근 ~24개월(완결 데이터)만 받아 '달별' 합산 → 상대지수(0~100)·성수기/비수기·연간비중.
 * - 키 없으면 기존 파일 보존(덮어쓰지 않음). 실패는 best-effort.
 *
 * 일일 호출 한도 1,000(개발계정, KorService2와 별도 quota). 6개월 청크×페이지네이션 ≈ 수십 회.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'stats');
const OUT_FILE = join(OUT_DIR, 'region-stats.json');

const KEY = process.env.TOUR_API_KEY || process.env.TOURAPI_KEY || '';
const BASE = 'https://apis.data.go.kr/B551011/DataLabService/metcoRegnVisitrDDList';

// 데이터 수집 개월 수(완결 데이터 안정성 위해 최근 2개월은 건너뜀)
const MONTHS_BACK = Number(process.env.STATS_MONTHS ?? '24');
const LAG_MONTHS = 2;

// 관광빅데이터 areaCode(법정동 시도코드) → 사이트 AREA_CODE 키 (fetch-tourapi.ts와 동일)
const AREACODE_MAP: Record<string, string> = {
  '11': '1', '26': '6', '27': '4', '28': '2', '29': '5', '30': '3', '31': '7',
  '36': '8', '41': '31', '43': '33', '44': '34', '45': '37', '46': '38',
  '47': '35', '48': '36', '50': '39', '51': '32',
};

interface VisitItem {
  areaCode?: string;
  touDivCd?: string;
  touNum?: string | number;
  baseYmd?: string;
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** 수집 윈도우를 6개월 청크 [startYmd, endYmd] 배열로 분할 */
function buildWindows(): Array<[string, string]> {
  const now = new Date();
  // 종료: 현재달 - LAG_MONTHS 의 말일
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - LAG_MONTHS + 1, 0));
  // 시작: 종료 - MONTHS_BACK 개월의 1일
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - MONTHS_BACK + 1, 1));
  const windows: Array<[string, string]> = [];
  let cur = new Date(start);
  while (cur <= end) {
    const chunkEnd = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 6, 0));
    const e = chunkEnd < end ? chunkEnd : end;
    windows.push([ymd(cur), ymd(e)]);
    cur = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth() + 1, 1));
  }
  return windows;
}

async function fetchWindow(startYmd: string, endYmd: string): Promise<VisitItem[]> {
  const out: VisitItem[] = [];
  let pageNo = 1;
  const numOfRows = 900;
  while (pageNo <= 60) {
    const url = new URL(BASE);
    url.searchParams.set('serviceKey', KEY);
    url.searchParams.set('MobileOS', 'ETC');
    url.searchParams.set('MobileApp', 'festivals-site');
    url.searchParams.set('_type', 'json');
    url.searchParams.set('numOfRows', String(numOfRows));
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('startYmd', startYmd);
    url.searchParams.set('endYmd', endYmd);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`DataLab ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    if (!items) break;
    const list: VisitItem[] = Array.isArray(items) ? items : [items];
    out.push(...list);
    const total = Number(data?.response?.body?.totalCount ?? 0);
    if (pageNo * numOfRows >= total || list.length < numOfRows) break;
    pageNo += 1;
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}

export interface RegionStat {
  monthly: number[]; // 12개, 상대지수 0~100
  share: number;     // 전국 대비 연간 방문 비중(%)
  peak: number[];    // 성수기 월(1~12)
  low: number[];     // 비수기 월(1~12)
}

function aggregate(items: VisitItem[]): Record<string, RegionStat> {
  // areacodeKey -> month(0~11) -> 합계 (외지인+외국인)
  const acc: Record<string, number[]> = {};
  for (const it of items) {
    const key = AREACODE_MAP[String(it.areaCode ?? '').trim()];
    if (!key) continue;
    const div = String(it.touDivCd ?? '');
    if (div !== '2' && div !== '3') continue; // 현지인 제외
    const ymdStr = String(it.baseYmd ?? '');
    if (ymdStr.length !== 8) continue;
    const month = Number(ymdStr.slice(4, 6)) - 1;
    if (month < 0 || month > 11) continue;
    const n = Number(it.touNum);
    if (!Number.isFinite(n)) continue;
    (acc[key] ??= new Array(12).fill(0))[month] += n;
  }

  const nationalTotal = Object.values(acc).reduce((s, m) => s + m.reduce((a, b) => a + b, 0), 0) || 1;
  const out: Record<string, RegionStat> = {};
  for (const [key, months] of Object.entries(acc)) {
    const max = Math.max(...months) || 1;
    const monthly = months.map((v) => Math.round((v / max) * 100));
    const regionTotal = months.reduce((a, b) => a + b, 0);
    const peak = monthly.map((v, i) => ({ v, m: i + 1 })).filter((x) => x.v >= 85).map((x) => x.m);
    const low = monthly.map((v, i) => ({ v, m: i + 1 })).filter((x) => x.v <= 55).map((x) => x.m);
    out[key] = {
      monthly,
      share: Math.round((regionTotal / nationalTotal) * 1000) / 10,
      peak,
      low,
    };
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  if (!KEY) {
    if (existsSync(OUT_FILE)) {
      console.log('⚠  TOURAPI_KEY 없음 — 기존 region-stats.json 유지(덮어쓰지 않음).');
      return;
    }
    console.log('⚠  TOURAPI_KEY 없음 & 통계 파일 없음 — 빈 객체 생성.');
    await writeFile(OUT_FILE, '{}', 'utf-8');
    return;
  }

  console.log('▶  관광빅데이터(DataLabService) 방문자 통계 수집...');
  const windows = buildWindows();
  const all: VisitItem[] = [];
  for (const [s, e] of windows) {
    process.stdout.write(`  [${s}~${e}] `);
    try {
      const got = await fetchWindow(s, e);
      console.log(`${got.length} rows`);
      all.push(...got);
    } catch (err) {
      console.log(`실패(건너뜀): ${(err as Error).message}`);
    }
  }

  if (all.length === 0) {
    if (existsSync(OUT_FILE)) {
      console.log('✗  수집 0건 — 기존 파일 유지.');
      return;
    }
    await writeFile(OUT_FILE, '{}', 'utf-8');
    console.log('✗  수집 0건 — 빈 객체 생성.');
    return;
  }

  const stats = aggregate(all);
  await writeFile(OUT_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  const regions = Object.keys(stats).length;
  console.log(`✓  region-stats.json: ${regions}개 지역, 원본 ${all.length} rows → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('✗  fetch-stats 실패:', err);
  // 통계는 부가기능 — 실패해도 빌드 막지 않음
  process.exit(0);
});
