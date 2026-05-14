/* 한국 가볼 만한 곳 — Service Worker
 * 전략: stale-while-revalidate (오프라인 보강 + 빠른 응답)
 * - HTML/JSON: network-first (최신 데이터 우선)
 * - 정적 자산(이미지·폰트·JS·CSS): cache-first (재방문 빠르게)
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;
const BASE = '/festivals-site';

// 설치 시 핵심 셸만 미리 캐시 (홈 + 인덱스 데이터 + CSS + 폰트 미리 받기)
const SHELL_URLS = [`${BASE}/`, `${BASE}/styles.css`, `${BASE}/favicon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(SHELL_URLS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 외부 도메인(CDN, TourAPI 이미지 등)은 그대로 통과
  if (url.origin !== self.location.origin) return;

  // index.json (탐색용 데이터): network-first, 폴백 캐시
  if (url.pathname.endsWith('/index.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || new Response('[]', { headers: { 'Content-Type': 'application/json' } }))),
    );
    return;
  }

  // 정적 자산(.js .css .svg .png .jpg 등): cache-first
  if (/\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      }),
    );
    return;
  }

  // HTML 페이지: network-first, 오프라인 시 캐시 폴백 → 그래도 없으면 홈 셸
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match(`${BASE}/`))),
    );
  }
});
