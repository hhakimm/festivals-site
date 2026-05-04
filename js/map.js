// js/map.js — Leaflet 기반 지도 뷰
// 외부 의존: window.L (Leaflet, index.html에서 CDN 로드)

let mapInstance = null;
let markersLayer = null;
let pendingClickHandler = null;

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatRange(start, end) {
  const fmt = (s) => {
    const [, m, d] = s.split('-').map(Number);
    return `${m}.${d}`;
  };
  return start === end ? fmt(start) : `${fmt(start)} — ${fmt(end)}`;
}

export function ensureMap() {
  if (mapInstance) return mapInstance;
  const L = window.L;
  if (!L) {
    console.error('Leaflet이 로드되지 않았습니다.');
    return null;
  }

  // 로컬에서 호스팅된 Leaflet 이미지 경로 명시
  L.Icon.Default.imagePath = 'vendor/leaflet/images/';

  mapInstance = L.map('map', {
    center: [36.5, 127.8], // 한국 중앙 부근
    zoom: 7,
    scrollWheelZoom: true,
    worldCopyJump: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);

  // 팝업 안의 "자세히 보기" 링크 클릭 위임
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.popup-detail');
    if (!link) return;
    e.preventDefault();
    const id = link.dataset.festivalId;
    if (id && pendingClickHandler) pendingClickHandler(id);
  });

  return mapInstance;
}

export function renderMarkers(festivals, onDetailClick) {
  const map = ensureMap();
  if (!map) return;
  const L = window.L;

  pendingClickHandler = onDetailClick;
  markersLayer.clearLayers();

  const points = [];
  let skippedOutOfRange = 0;
  for (const f of festivals) {
    if (f.lat == null || f.lng == null) continue;
    if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng)) continue;
    // 한국 영토 범위 (제주·울릉·독도 포함) 밖이면 데이터 오류로 보고 제외
    if (f.lat < 33 || f.lat > 39 || f.lng < 124 || f.lng > 132) {
      skippedOutOfRange++;
      continue;
    }
    const marker = L.marker([f.lat, f.lng], { title: f.name });
    const popupHtml = `
      <strong>${escapeHtml(f.name)}</strong>
      <small>${escapeHtml(formatRange(f.startDate, f.endDate))}</small>
      <small>${escapeHtml(f.region)} ${escapeHtml(f.city)}</small>
      <a class="popup-detail" href="#" data-festival-id="${escapeHtml(f.id)}">자세히 보기</a>
    `;
    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
    points.push([f.lat, f.lng]);
  }

  if (points.length > 0) {
    map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
  } else {
    map.setView([36.5, 127.8], 7);
  }
  if (skippedOutOfRange > 0) {
    console.warn(`범위 밖 좌표 ${skippedOutOfRange}개 무시됨 (TourAPI 데이터 오류)`);
  }
}

// 지도가 hidden → visible 전환 직후 호출 (Leaflet 사이즈 재계산)
export function invalidateSize() {
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 50);
  }
}
