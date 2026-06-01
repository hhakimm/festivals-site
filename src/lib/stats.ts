/**
 * 지역 방문 통계 — region-stats.json(빌드 시 fetch-stats.ts 생성) 조회 헬퍼.
 * 데이터 없으면(빈 객체) 모든 헬퍼가 빈 값 → 컴포넌트가 알아서 숨김.
 */
import raw from '../content/stats/region-stats.json';

export interface RegionStat {
  monthly: number[]; // 12개월 상대 방문지수(0~100, 지역 내 정규화)
  share: number;     // 전국 대비 연간 방문 비중(%)
  peak: number[];    // 성수기 월(1~12)
  low: number[];     // 비수기 월(1~12)
}

const STATS = raw as Record<string, RegionStat>;

export function hasStats(): boolean {
  return Object.keys(STATS).length > 0;
}

export function getRegionStat(areacode: string): RegionStat | null {
  const s = STATS[areacode];
  return s && Array.isArray(s.monthly) && s.monthly.length === 12 ? s : null;
}

export interface PopularRegion {
  areacode: string;
  score: number;
  stat: RegionStat;
}

/**
 * 특정 월(1~12) 기준 "지금 가기 좋은 곳".
 * 절대 인기(대도시 편중) 대신 그 달의 계절지수(monthly)를 주신호로,
 * 인기도(share)는 sqrt로 약하게 반영 → 제철 지역이 부각됨(여름 강원·봄 제주 등).
 */
export function getPopularRegions(month: number, limit = 5): PopularRegion[] {
  const m = Math.min(12, Math.max(1, month));
  return Object.entries(STATS)
    .map(([areacode, stat]) => ({
      areacode,
      stat,
      score: (stat.monthly?.[m - 1] ?? 0) * Math.sqrt(stat.share || 1),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 12개월 각각의 인기 지역 목록 — 위젯이 클라이언트에서 현재 월을 골라 쓰도록 미리 계산. */
export function getMonthlyPopular(limit = 5): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (let m = 1; m <= 12; m++) {
    out[m] = getPopularRegions(m, limit).map((r) => r.areacode);
  }
  return out;
}
