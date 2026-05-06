// 한국 축제 캘린더 — Service Worker
// 전략:
//   - App shell (HTML/CSS/JS/이미지/Leaflet): cache-first + 백그라운드 갱신
//   - 축제 데이터 (festivals.json): network-first + 오프라인 대비 cache fallback
//   - 외부 리소스 (지도 타일, 폰트 CDN): 캐시 안 함 (브라우저 기본 동작)
//
// 자동 업데이트:
//   - sw.js 내용이 변경되면 브라우저가 새 SW 설치
//   - skipWaiting + clients.claim 으로 즉시 활성화
//   - 다음 페이지 로드부터 새 버전 사용

const VERSION = 'v2.7.0';
const CACHE = `festivals-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/filter.js',
  './js/url-sync.js',
  './js/modal.js',
  './js/map.js',
  './js/favorites.js',
  './js/i18n.js',
  './js/pull-refresh.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
  './vendor/leaflet/markercluster/MarkerCluster.css',
  './vendor/leaflet/markercluster/MarkerCluster.Default.css',
  './vendor/leaflet/markercluster/leaflet.markercluster.js',
  './images/placeholder.svg',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './og-image.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 외부 도메인은 그대로 통과 (지도 타일, Pretendard CDN 등)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 데이터 파일 — network-first
  if (url.pathname.endsWith('/data/festivals.json') ||
      url.pathname.endsWith('/data/places.json') ||
      url.pathname.endsWith('/data/places-curated.json') ||
      url.pathname.endsWith('/data/collections.json')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // App shell — cache-first + 백그라운드 갱신
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // 백그라운드에서 최신 버전 가져와 캐시 갱신
    fetch(request)
      .then(async (res) => {
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    // 오프라인 + 미캐시 navigation → 메인 페이지로 폴백
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw e;
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}
