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
