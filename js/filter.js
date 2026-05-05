export function monthsCovered(festival) {
  const [sy, sm] = festival.startDate.split('-').map(Number);
  const [ey, em] = festival.endDate.split('-').map(Number);
  const months = new Set();
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.add(m);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

export function isInMonth(festival, month) {
  return monthsCovered(festival).has(month);
}

export function matchesRegion(festival, region) {
  if (region == null) return true;
  return festival.region === region;
}

export function matchesCategory(festival, category) {
  if (category == null) return true;
  return festival.category === category;
}

export function applyFilters(festivals, { month, region, category }) {
  return festivals
    .filter(f => (month == null || isInMonth(f, month)))
    .filter(f => matchesRegion(f, region))
    .filter(f => matchesCategory(f, category))
    .slice()
    .sort((a, b) => {
      // 축제는 startDate 기준, 여행지(startDate 없음)는 이름 기준
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
}
