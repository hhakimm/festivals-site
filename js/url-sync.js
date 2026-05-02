export function parseQuery(queryString) {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const monthRaw = params.get('month');
  const monthNum = monthRaw == null ? NaN : Number(monthRaw);
  const month = Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12 ? monthNum : null;

  return {
    month,
    region: params.get('region'),
    category: params.get('category'),
    festival: params.get('festival'),
  };
}

export function serializeState(state) {
  const params = new URLSearchParams();
  if (state.month != null) params.set('month', String(state.month));
  if (state.region != null) params.set('region', state.region);
  if (state.category != null) params.set('category', state.category);
  if (state.festival != null) params.set('festival', state.festival);
  const s = params.toString();
  return s ? '?' + s : '';
}
