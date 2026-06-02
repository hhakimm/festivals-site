/**
 * 상세 소개글 조회 — overviews.json(빌드 시 fetch-overviews.ts가 누적) 래퍼.
 * 아직 수집 안 된 항목은 null → 상세 페이지가 autoDescribe로 폴백.
 */
import raw from '../content/data/overviews.json';

const OVERVIEWS = raw as Record<string, string>;

export function getOverview(id: string): string | null {
  const v = OVERVIEWS[id];
  return v && v.length > 0 ? v : null;
}
