// 즐겨찾기 관리 — localStorage 기반 (로그인 없이 기기별 저장)

const KEY = 'favorites-v1';

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function save(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {}
}

let cache = load();

export function getFavorites() {
  return new Set(cache);
}

export function isFavorite(id) {
  return cache.has(id);
}

export function toggleFavorite(id) {
  if (cache.has(id)) cache.delete(id);
  else cache.add(id);
  save(cache);
  return cache.has(id);
}

export function favoritesCount() {
  return cache.size;
}
