/**
 * 사이트맵 URL 생성 + 분할 로직 (sitemap.xml 색인 / sitemap-[n].xml 청크 공용).
 *
 * 네이버·표준 한도(사이트맵 1개당 최대 50,000 URL · 10MB)를 넘지 않도록
 * 전체 URL 블록을 SITEMAP_CHUNK 단위로 잘라 여러 파일로 내보낸다.
 */
import { festivals, attractions, AREA_CODE } from './data';
import { LANGS } from './i18n';
import { PERSONA_IDS } from './quiz';
import { DNA_CODES } from './quiz-dna';

export const SITEMAP_ORIGIN = 'https://hhakimm.github.io';
export const SITEMAP_BASE = '/festivals-site';
// 청크당 URL 수 — 6,000개 × 평균 ~0.9KB ≈ 5MB (10MB 한도 안전 마진).
export const SITEMAP_CHUNK = 6000;

interface Entry {
  path: string;
  lastmod?: string;
  priority?: number;
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];

  entries.push({ path: '/', priority: 1.0 });
  entries.push({ path: '/festivals/', priority: 0.9 });
  entries.push({ path: '/attractions/', priority: 0.9 });

  // 성향테스트 — 바이럴 진입점.
  entries.push({ path: '/quiz/', priority: 0.8 });
  for (const pid of PERSONA_IDS) {
    entries.push({ path: `/quiz/r/${pid}/`, priority: 0.6 });
  }
  // 여행 MBTI(16유형)
  entries.push({ path: '/quiz/dna/', priority: 0.7 });
  for (const code of DNA_CODES) {
    entries.push({ path: `/quiz/dna/r/${code}/`, priority: 0.5 });
  }

  // 지역 랜딩 — "서울 축제", "제주 관광지" 등 롱테일. 항목 있는 지역만.
  const festAreas = new Set(festivals.map((f) => f.areacode).filter(Boolean));
  const attrAreas = new Set(attractions.map((a) => a.areacode).filter(Boolean));
  for (const area of Object.keys(AREA_CODE)) {
    if (festAreas.has(area)) entries.push({ path: `/festivals/region/${area}/`, priority: 0.7 });
    if (attrAreas.has(area)) entries.push({ path: `/attractions/region/${area}/`, priority: 0.7 });
  }

  for (const item of [...festivals, ...attractions]) {
    const lastmod = item.updatedAt
      ? `${item.updatedAt.slice(0, 4)}-${item.updatedAt.slice(4, 6)}-${item.updatedAt.slice(6, 8)}`
      : undefined;
    entries.push({ path: `/${item.type}/${item.slug}/`, lastmod, priority: 0.8 });
  }

  return entries;
}

let _blocksCache: string[] | null = null;

/** 전체 <url> 블록 배열 (entry × 언어). 빌드 중 1회만 계산 후 캐시. */
export function buildUrlBlocks(): string[] {
  if (_blocksCache) return _blocksCache;
  const origin = SITEMAP_ORIGIN;
  const base = SITEMAP_BASE;
  const blocks: string[] = [];

  for (const entry of buildEntries()) {
    const altLinks = LANGS.map((l) => {
      const langPrefix = l === 'ko' ? '' : `/${l}`;
      const href = `${origin}${base}${langPrefix}${entry.path}`;
      return `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`;
    }).join('\n');
    const defaultLoc = `${origin}${base}${entry.path}`;

    for (const l of LANGS) {
      const langPrefix = l === 'ko' ? '' : `/${l}`;
      const loc = `${origin}${base}${langPrefix}${entry.path}`;
      blocks.push(`  <url>
    <loc>${loc}</loc>
${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''}    <priority>${entry.priority || 0.5}</priority>
${altLinks}
    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultLoc}"/>
  </url>`);
    }
  }

  _blocksCache = blocks;
  return blocks;
}

/** 청크(자식 사이트맵) 개수. */
export function chunkCount(): number {
  return Math.max(1, Math.ceil(buildUrlBlocks().length / SITEMAP_CHUNK));
}
