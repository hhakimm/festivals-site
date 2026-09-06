import type { Item } from './data';
import { activeFestivals, attractions, AREA_CODE } from './data';
import type { Lang } from './i18n';

export type ListingType = 'festival' | 'attraction';

export const PAGE_SIZE = 24;

// 축제 목록에는 끝난 축제를 넣지 않는다(상세 페이지는 살아 있다 — data.ts 참고).
export function itemsByType(type: ListingType): Item[] {
  return type === 'festival' ? activeFestivals : attractions;
}

export interface RegionStat {
  code: string;
  name: string;
  count: number;
}

// 해당 type에서 1건 이상 가진 지역만, 카운트 내림차순으로 정렬해 반환.
export function regionsWithCounts(type: ListingType, lang: Lang): RegionStat[] {
  const items = itemsByType(type);
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.areacode, (counts.get(it.areacode) ?? 0) + 1);
  const out: RegionStat[] = [];
  for (const [code, names] of Object.entries(AREA_CODE)) {
    const c = counts.get(code) ?? 0;
    if (c > 0) out.push({ code, name: names[lang], count: c });
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

// /festivals/ → /festivals/2/ → /festivals/3/ 형태로 페이지 URL 생성.
// Astro의 `[...page]` 라우팅과 동일한 규칙 (1페이지는 번호 없음).
export function pageUrl(base: string, basePath: string, n: number): string {
  return n <= 1 ? `${base}${basePath}/` : `${base}${basePath}/${n}/`;
}
