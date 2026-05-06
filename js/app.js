import { applyFilters } from './filter.js';
import { openModal, closeModal, bindModalClose, onFavToggle, showToast } from './modal.js';
import { parseQuery, serializeState } from './url-sync.js';
import { ensureMap, renderMarkers, invalidateSize } from './map.js';
import { isFavorite, toggleFavorite, getFavorites } from './favorites.js';
import { t, getLang, setLang, applyTranslations } from './i18n.js';

// ── DOM 참조 ──
const cardsEl = document.getElementById('cards');
const mapEl = document.getElementById('map');
const emptyEl = document.getElementById('empty-state');
const errorEl = document.getElementById('error-state');
const countEl = document.getElementById('result-count');
const viewListBtn = document.getElementById('view-list');
const viewMapBtn = document.getElementById('view-map');
const tabFestivalsBtn = document.getElementById('tab-festivals');
const tabPlacesBtn = document.getElementById('tab-places');
const monthFilterGroup = document.getElementById('month-filter-group');
const categoryFilterGroup = document.getElementById('category-filter-group');
const searchInputEl = document.getElementById('search-input');
const searchClearEl = document.getElementById('search-clear');
const favoritesToggleEl = document.getElementById('favorites-toggle');
const nearbyToggleEl = document.getElementById('nearby-toggle');
const sortSelectEl = document.getElementById('sort-select');
const weekendSectionEl = document.getElementById('weekend-recommend');
const weekendTitleEl = document.getElementById('weekend-title');
const weekendCardsEl = document.getElementById('weekend-cards');
const weekendLinkEl = document.getElementById('weekend-link');
const collectionsRowEl = document.getElementById('collections-row');
const acbEl = document.getElementById('active-collection-banner');
const acbIconEl = document.getElementById('acb-icon');
const acbNameEl = document.getElementById('acb-name');
const acbClearEl = document.getElementById('acb-clear');

// ── 상태 ──
let currentTab = 'places'; // 'festivals' | 'places' — 기본값을 여행지로
let currentView = 'list';     // 'list' | 'map'
let allFestivals = [];
let allPlaces = [];

const state = {
  month: null,
  region: null,
  category: null,
  festival: null,        // 모달 열린 항목의 id
  search: '',            // 검색어
  favoritesOnly: false,  // 즐겨찾기 필터
  userLocation: null,    // {lat, lng} — geolocation 활성 시
  sort: 'default',       // 'default' | 'name' | 'date'
  collection: null,      // 활성 컬렉션 id (테마)
};

let allCollections = [];
const NEARBY_RADIUS_KM = 50;

// ── 유틸 ──
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

const MAX_DURATION_DAYS = 30;

function durationDays(f) {
  const [sy, sm, sd] = f.startDate.split('-').map(Number);
  const [ey, em, ed] = f.endDate.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86400000) + 1;
}

// ── 데이터 헬퍼 ──
function getCurrentDataset() {
  return currentTab === 'festivals' ? allFestivals : allPlaces;
}

// 두 좌표 사이 거리 (km) — Haversine
function haversineKm(a, b) {
  if (a == null || b == null) return Infinity;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function matchesSearch(item, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  const fields = [item.name, item.region, item.city, item.description, item.category];
  return fields.some((f) => (f || '').toLowerCase().includes(lower));
}

function matchesCollection(item, collection) {
  if (!collection) return true;
  const idMatch = collection.ids?.includes(item.id);
  const nameMatch = collection.namePatterns?.some((p) =>
    (item.name || '').includes(p)
  );
  return idMatch || nameMatch;
}

function getFiltered() {
  // 컬렉션 활성: festivals + places 합쳐서 검색
  let ds = getCurrentDataset();
  const collection = state.collection
    ? allCollections.find((c) => c.id === state.collection)
    : null;
  if (collection) {
    // 컬렉션은 두 데이터셋에서 모두 매칭 시도 — 더 풍부한 결과
    ds = [...allFestivals, ...allPlaces].filter((it) =>
      matchesCollection(it, collection)
    );
  }

  // 여행지 탭에선 month 필터 무시 (장소는 시기와 무관)
  const baseFilterState = currentTab === 'festivals'
    ? { month: state.month, region: state.region, category: state.category }
    : { month: null, region: state.region, category: state.category };
  let result = collection ? ds : applyFilters(ds, baseFilterState);
  // 컬렉션이 활성이면 카테고리/월 필터는 무시하고 region·검색만 적용
  if (collection) {
    if (state.region) result = result.filter((it) => it.region === state.region);
  }

  // 검색
  const q = state.search.trim();
  if (q) result = result.filter((it) => matchesSearch(it, q));

  // 즐겨찾기
  if (state.favoritesOnly) {
    const favs = getFavorites();
    result = result.filter((it) => favs.has(it.id));
  }

  // 내 주변 (반경 NEARBY_RADIUS_KM 이내)
  if (state.userLocation) {
    result = result
      .map((it) => ({ ...it, _dist: haversineKm(state.userLocation, it) }))
      .filter((it) => it._dist <= NEARBY_RADIUS_KM)
      .sort((a, b) => a._dist - b._dist);
    return result;  // 거리순이면 다른 정렬 무시
  }

  // 사용자 정렬 옵션
  if (state.sort === 'name') {
    result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (state.sort === 'date') {
    result = [...result].sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return 0;
    });
  }
  // default: applyFilters 결과 순서 유지 (festivals=시작일순, places=이름순)

  return result;
}

// ── 카드 렌더 ──
function renderCards(items) {
  // 컬렉션 활성화 중이면 카드에 타입(축제/여행지) 배지 표시
  const showTypeBadge = state.collection != null;
  cardsEl.innerHTML = items.map((item) => {
    // 컬렉션 모드에서는 혼합되므로 항목 자체로 판단
    const hasDate = !!(item.startDate && item.endDate);
    const fav = isFavorite(item.id);
    const tagHtml = item.category
      ? `<span class="tag" data-category="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span>`
      : '';
    const dateOrTag = hasDate
      ? `<span>${escapeHtml(formatRange(item.startDate, item.endDate))}</span>`
      : '';
    const distHtml = item._dist != null
      ? `<span class="distance-label">📍 ${item._dist.toFixed(1)} km</span>`
      : '';
    const typeBadgeHtml = showTypeBadge
      ? `<span class="card-type-badge ${hasDate ? 'is-festival' : 'is-place'}">${hasDate ? '🎆 ' + t('tab.festivals').replace('2026 ', '') : '🗺️ ' + t('tab.places')}</span>`
      : '';
    return `
    <article class="card" data-item-id="${escapeHtml(item.id)}">
      <div class="card-image-wrap">
        <img class="card-image" alt="${escapeHtml(item.name)}" src="${escapeHtml(item.image)}"
             onerror="this.src='images/placeholder.svg'" loading="lazy" />
        ${typeBadgeHtml}
        <button type="button" class="fav-btn${fav ? ' is-active' : ''}"
                data-fav-id="${escapeHtml(item.id)}"
                aria-label="${fav ? '즐겨찾기 해제' : '즐겨찾기에 추가'}"
                title="${fav ? '즐겨찾기 해제' : '즐겨찾기에 추가'}">${fav ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        ${tagHtml}
        <h2 class="card-title">${escapeHtml(item.name)}</h2>
        <div class="card-meta">
          ${dateOrTag}
          <span>${escapeHtml(item.region)} ${escapeHtml(item.city)}</span>
          ${distHtml}
        </div>
        <p class="card-description">${escapeHtml(item.description)}</p>
      </div>
    </article>
  `;
  }).join('');
}

function openItemById(id) {
  const item = getCurrentDataset().find((x) => x.id === id);
  if (!item) return;
  state.festival = item.id;
  openModal(item);
  syncUrl();
}

// ── 테마 컬렉션 ──
function countCollectionMatches(collection) {
  return [...allFestivals, ...allPlaces].filter((it) =>
    matchesCollection(it, collection)
  ).length;
}

function renderCollections() {
  if (!collectionsRowEl) return;
  collectionsRowEl.innerHTML = allCollections
    .map((c) => {
      const count = countCollectionMatches(c);
      if (count === 0) return '';
      const active = state.collection === c.id ? ' is-active' : '';
      return `
      <button type="button" class="collection-card${active}" data-collection-id="${escapeHtml(c.id)}">
        <span class="collection-icon" aria-hidden="true">${c.icon || '✦'}</span>
        <h3 class="collection-name">${escapeHtml(c.name)}</h3>
        <p class="collection-tagline">${escapeHtml(c.tagline || '')}</p>
        <span class="collection-count">${count}곳</span>
      </button>
    `;
    })
    .join('');
}

collectionsRowEl?.addEventListener('click', (e) => {
  const card = e.target.closest('.collection-card');
  if (!card) return;
  const id = card.dataset.collectionId;
  // 토글: 같은 거 클릭하면 해제
  state.collection = state.collection === id ? null : id;
  // 컬렉션 활성 시 month·category 필터는 효과 없음
  renderCollections();
  syncFilterUI();
  update();
  syncUrl();
  if (state.collection) {
    document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

acbClearEl?.addEventListener('click', () => {
  state.collection = null;
  renderCollections();
  syncFilterUI();
  update();
  syncUrl();
});

// ── "이번 주말" 추천 섹션 ──
function nextWeekendDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=일, 6=토
  // 토요일까지 며칠? (오늘이 토요일이면 0, 일요일이면 6)
  const daysToSat = (6 - dow + 7) % 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    sat: fmt(sat),
    sun: fmt(sun),
    label: `${sat.getMonth() + 1}월 ${sat.getDate()}일·${sun.getDate()}일`,
  };
}

function dateRangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

function currentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// 축제 주말 뱃지: '🔥 이번 주말 마지막' / '✨ 이번 주말 시작' / null
function festivalWeekendBadge(f, sat, sun) {
  if (!f.startDate || !f.endDate) return null;
  // 종료일이 이번 주말 안 → "마지막"
  if (f.endDate >= sat && f.endDate <= sun) return { kind: 'last', text: '🔥 이번 주말 마지막' };
  // 시작일이 이번 주말 안 → "시작"
  if (f.startDate >= sat && f.startDate <= sun) return { kind: 'start', text: '✨ 이번 주말 시작' };
  return null;
}

function renderWeekendRow() {
  if (!weekendSectionEl) return;
  const { sat, sun, label } = nextWeekendDates();
  let items;
  if (currentTab === 'festivals') {
    items = allFestivals
      .filter((f) => dateRangesOverlap(f.startDate, f.endDate, sat, sun))
      .map((f) => ({ ...f, _badge: festivalWeekendBadge(f, sat, sun) }));
    // 우선순위: 마지막 주말(2) > 시작 주말(1) > 진행중(0)
    // 동일 우선순위 내: 이미지 있는 것 우선, 시작일 가까운 순
    items.sort((a, b) => {
      const ar = a._badge?.kind === 'last' ? 2 : a._badge?.kind === 'start' ? 1 : 0;
      const br = b._badge?.kind === 'last' ? 2 : b._badge?.kind === 'start' ? 1 : 0;
      if (ar !== br) return br - ar;
      const aImg = a.image && a.image !== 'images/placeholder.svg' ? 0 : 1;
      const bImg = b.image && b.image !== 'images/placeholder.svg' ? 0 : 1;
      if (aImg !== bImg) return aImg - bImg;
      return a.startDate.localeCompare(b.startDate);
    });
  } else {
    // 여행지 탭: 계절 가중치 + 이미지 우선 + 약간의 무작위
    const season = currentSeason();
    const seasonalCollections = allCollections.filter(
      (c) => Array.isArray(c.season) && c.season.includes(season)
    );
    const scoreOf = (place) => {
      let s = 0;
      // 계절 컬렉션에 들어 있으면 큰 가중치
      for (const c of seasonalCollections) {
        if (c.ids?.includes(place.id)) s += 10;
        if (c.namePatterns?.some((p) => (place.name || '').includes(p))) s += 5;
      }
      // 큐레이션 데이터 우선
      if (place.curated) s += 2;
      // 이미지 있으면 +1
      if (place.image && place.image !== 'images/placeholder.svg') s += 1;
      // 동률 셔플용 약한 노이즈
      return s + Math.random() * 0.5;
    };
    items = allPlaces
      .filter((p) => p.curated && p.image && p.image !== 'images/placeholder.svg')
      .map((p) => ({ ...p, _score: scoreOf(p) }));
    items.sort((a, b) => b._score - a._score);
  }
  const top = items.slice(0, 10);
  if (top.length === 0) {
    weekendSectionEl.hidden = true;
    return;
  }
  weekendSectionEl.hidden = false;
  weekendTitleEl.innerHTML = `이번 주말 <small>${label}</small>`;
  weekendCardsEl.innerHTML = top
    .map((it) => {
      const badgeHtml = it._badge
        ? `<span class="weekend-badge weekend-badge-${it._badge.kind}">${escapeHtml(it._badge.text)}</span>`
        : '';
      return `
    <article class="weekend-card" data-item-id="${escapeHtml(it.id)}">
      <div class="weekend-card-image-wrap">
        <img class="weekend-card-image" alt="${escapeHtml(it.name)}" src="${escapeHtml(it.image)}"
             onerror="this.src='images/placeholder.svg'" loading="lazy" />
        ${badgeHtml}
      </div>
      <div class="weekend-card-body">
        <h3 class="weekend-card-title">${escapeHtml(it.name)}</h3>
        <div class="weekend-card-meta">${
          it.startDate
            ? escapeHtml(formatRange(it.startDate, it.endDate)) + ' · '
            : ''
        }${escapeHtml(it.region)}</div>
      </div>
    </article>
  `;
    })
    .join('');
}

weekendCardsEl?.addEventListener('click', (e) => {
  const card = e.target.closest('.weekend-card');
  if (!card) return;
  const id = card.dataset.itemId;
  if (id) openItemById(id);
});

weekendLinkEl?.addEventListener('click', (e) => {
  e.preventDefault();
  // 축제 탭이면 이번 주말이 포함된 월을 자동 선택
  if (currentTab === 'festivals') {
    const { sat } = nextWeekendDates();
    const month = Number(sat.split('-')[1]);
    state.month = month;
    syncFilterUI();
    update();
    syncUrl();
  }
  // 메인 영역으로 스크롤
  document
    .querySelector('.main')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── 메인 갱신 ──
function syncCollectionBanner() {
  if (!acbEl) return;
  const collection = state.collection
    ? allCollections.find((c) => c.id === state.collection)
    : null;
  if (collection) {
    acbEl.hidden = false;
    acbIconEl.textContent = collection.icon || '✦';
    acbNameEl.textContent = `${collection.name} — ${collection.tagline || ''}`;
  } else {
    acbEl.hidden = true;
  }
}

function update() {
  syncCollectionBanner();
  const filtered = getFiltered();
  const key = (currentTab === 'festivals' && !state.collection)
    ? 'count.festivals'
    : 'count.places';
  countEl.textContent = t(key, { n: filtered.length });

  cardsEl.hidden = true;
  mapEl.hidden = true;
  emptyEl.hidden = true;

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  if (currentView === 'map') {
    mapEl.hidden = false;
    invalidateSize();
    renderMarkers(filtered, openItemById);
  } else {
    cardsEl.hidden = false;
    renderCards(filtered);
  }
}

// ── 뷰(목록/지도) 토글 ──
function setView(view) {
  if (view !== 'list' && view !== 'map') return;
  if (view === currentView) return;
  currentView = view;
  viewListBtn.classList.toggle('is-active', view === 'list');
  viewMapBtn.classList.toggle('is-active', view === 'map');
  viewListBtn.setAttribute('aria-selected', view === 'list' ? 'true' : 'false');
  viewMapBtn.setAttribute('aria-selected', view === 'map' ? 'true' : 'false');
  if (view === 'map') ensureMap();
  update();
}
viewListBtn.addEventListener('click', () => setView('list'));
viewMapBtn.addEventListener('click', () => setView('map'));

// ── 탭(축제/여행지) 전환 ──
function setTab(tab) {
  if (tab !== 'festivals' && tab !== 'places') return;
  if (tab === currentTab) return;
  currentTab = tab;
  // 탭별 필터 가용성 조정
  monthFilterGroup.hidden = tab === 'places';
  categoryFilterGroup.hidden = tab === 'festivals';
  // 탭별 카테고리 옵션이 다르므로 카테고리 상태 초기화
  state.category = null;
  // 모달 깊은 링크는 탭 간 의미 없으므로 닫기
  state.festival = null;
  closeModal();
  // 탭 버튼 시각 갱신
  tabFestivalsBtn.classList.toggle('is-active', tab === 'festivals');
  tabPlacesBtn.classList.toggle('is-active', tab === 'places');
  tabFestivalsBtn.setAttribute('aria-selected', tab === 'festivals' ? 'true' : 'false');
  tabPlacesBtn.setAttribute('aria-selected', tab === 'places' ? 'true' : 'false');
  syncSortOptionVisibility();
  syncFilterUI();
  renderWeekendRow();
  update();
  syncUrl();
}
tabFestivalsBtn.addEventListener('click', () => setTab('festivals'));
tabPlacesBtn.addEventListener('click', () => setTab('places'));

// ── 모바일 하단 네비게이션 ──
const bottomNavEl = document.querySelector('.bottom-nav');
if (bottomNavEl) {
  bottomNavEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.bn-item');
    if (!btn) return;
    const action = btn.dataset.bn;
    if (action === 'festivals') setTab('festivals');
    else if (action === 'places') setTab('places');
    else if (action === 'favorites') favoritesToggleEl.click();
    else if (action === 'nearby') nearbyToggleEl.click();
    // 클릭 후 페이지 맨 위로 살짝 스크롤 (탭 전환 시 결과 보이게)
    if (action === 'festivals' || action === 'places') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function syncBottomNav() {
  if (!bottomNavEl) return;
  bottomNavEl.querySelectorAll('.bn-item').forEach((btn) => {
    const action = btn.dataset.bn;
    let active = false;
    if (action === 'festivals') active = currentTab === 'festivals';
    else if (action === 'places') active = currentTab === 'places';
    else if (action === 'favorites') active = state.favoritesOnly === true;
    else if (action === 'nearby') active = state.userLocation != null;
    btn.classList.toggle('is-active', active);
  });
}

// ── 모바일 필터 토글 ──
const mobileFilterToggleEl = document.getElementById('mobile-filter-toggle');
const mobileFilterBadgeEl = document.getElementById('mobile-filter-badge');
if (mobileFilterToggleEl) {
  mobileFilterToggleEl.addEventListener('click', () => {
    const open = document.body.classList.toggle('filters-open');
    mobileFilterToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function syncMobileFilterBadge() {
  if (!mobileFilterBadgeEl) return;
  let count = 0;
  if (currentTab === 'festivals' && state.month != null) count++;
  if (state.region != null) count++;
  if (currentTab === 'places' && state.category != null) count++;
  if (state.collection != null) count++;
  if (count > 0) {
    mobileFilterBadgeEl.hidden = false;
    mobileFilterBadgeEl.textContent = String(count);
  } else {
    mobileFilterBadgeEl.hidden = true;
  }
}

// ── 모바일 우하단 "맨 위로" 플로팅 버튼 ──
const scrollTopBtnEl = document.getElementById('scroll-top-btn');
if (scrollTopBtnEl) {
  const SCROLL_THRESHOLD = 300; // 이 만큼 내려야 버튼 등장
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const visible = y > SCROLL_THRESHOLD;
      scrollTopBtnEl.classList.toggle('is-visible', visible);
      // hidden 속성 토글 — 처음 등장 시 transition 살아나도록 약간 지연
      if (visible && scrollTopBtnEl.hasAttribute('hidden')) {
        scrollTopBtnEl.removeAttribute('hidden');
      }
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // 초기 상태 한 번 체크
  onScroll();

  scrollTopBtnEl.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── URL 동기화 ──
function syncUrl() {
  const params = new URLSearchParams();
  // 기본 탭이 'places' 이므로, 'festivals' 일 때만 URL 에 표기
  if (currentTab === 'festivals') params.set('tab', 'festivals');
  const q = serializeState(state);
  if (q) {
    const inner = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q);
    inner.forEach((v, k) => params.set(k, v));
  }
  const s = params.toString();
  const newUrl = window.location.pathname + (s ? '?' + s : '');
  window.history.replaceState(null, '', newUrl);
}

// ── 카드 클릭 → 상세 모달 (하트 버튼 클릭은 즐겨찾기 토글) ──
cardsEl.addEventListener('click', (e) => {
  const favBtn = e.target.closest('.fav-btn');
  if (favBtn) {
    e.stopPropagation();
    const id = favBtn.dataset.favId;
    const isFav = toggleFavorite(id);
    favBtn.classList.toggle('is-active', isFav);
    favBtn.textContent = isFav ? '♥' : '♡';
    favBtn.setAttribute('aria-label', isFav ? '즐겨찾기 해제' : '즐겨찾기에 추가');
    favBtn.setAttribute('title', isFav ? '즐겨찾기 해제' : '즐겨찾기에 추가');
    showToast(isFav ? '즐겨찾기에 추가됨' : '즐겨찾기에서 해제됨');
    // 즐겨찾기만 보기 활성 상태면 즉시 갱신
    if (state.favoritesOnly) update();
    return;
  }
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.itemId;
  if (id) openItemById(id);
});

// 모달 안 즐겨찾기 토글되면 카드 리스트도 갱신
onFavToggle((id) => {
  // 카드 영역의 해당 항목 하트 갱신
  const isFav = isFavorite(id);
  const btn = cardsEl.querySelector(`.fav-btn[data-fav-id="${CSS.escape(id)}"]`);
  if (btn) {
    btn.classList.toggle('is-active', isFav);
    btn.textContent = isFav ? '♥' : '♡';
  }
  if (state.favoritesOnly) update();
});

bindModalClose(() => {
  closeModal();
  state.festival = null;
  syncUrl();
});

// ── 필터 UI ──
const monthChipsEl = document.getElementById('month-chips');
const categoryChipsEl = document.getElementById('category-chips');
const regionSelectEl = document.getElementById('region-select');
const resetBtnEl = document.getElementById('reset-filters');
const emptyResetBtnEl = emptyEl.querySelector('[data-reset]');

function setActiveChip(groupEl, attr, value) {
  groupEl.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset[attr] === value);
  });
}

function syncFilterUI() {
  setActiveChip(monthChipsEl, 'month', state.month == null ? 'all' : String(state.month));
  setActiveChip(categoryChipsEl, 'category', state.category == null ? 'all' : state.category);
  regionSelectEl.value = state.region == null ? 'all' : state.region;
  searchClearEl.hidden = !state.search;
  favoritesToggleEl.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
  nearbyToggleEl.setAttribute('aria-pressed', state.userLocation != null ? 'true' : 'false');
  const anyActive =
    (currentTab === 'festivals' && state.month != null) ||
    state.region != null ||
    (currentTab === 'places' && state.category != null) ||
    !!state.search ||
    state.favoritesOnly ||
    state.userLocation != null ||
    state.collection != null;
  resetBtnEl.hidden = !anyActive;
  syncBottomNav();
  syncMobileFilterBadge();
}

function setMonth(value) {
  state.month = value === 'all' ? null : Number(value);
  syncFilterUI();
  update();
  syncUrl();
}
function setRegion(value) {
  state.region = value === 'all' ? null : value;
  syncFilterUI();
  update();
  syncUrl();
}
function setCategory(value) {
  state.category = value === 'all' ? null : value;
  syncFilterUI();
  update();
  syncUrl();
}
function resetAll() {
  state.month = null;
  state.region = null;
  state.category = null;
  state.search = '';
  state.favoritesOnly = false;
  state.userLocation = null;
  state.sort = 'default';
  state.collection = null;
  searchInputEl.value = '';
  sortSelectEl.value = 'default';
  renderCollections();
  syncFilterUI();
  update();
  syncUrl();
}

// ── 검색 ──
let searchDebounce = null;
searchInputEl.addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  const v = e.target.value;
  searchDebounce = setTimeout(() => {
    state.search = v;
    syncFilterUI();
    update();
  }, 150);
});
searchClearEl.addEventListener('click', () => {
  searchInputEl.value = '';
  state.search = '';
  syncFilterUI();
  update();
  searchInputEl.focus();
});

// ── 정렬 ──
sortSelectEl.addEventListener('change', (e) => {
  state.sort = e.target.value;
  update();
});

function syncSortOptionVisibility() {
  // "시작일순" 옵션은 축제 탭에서만 의미 있음
  const dateOpt = sortSelectEl.querySelector('option[value="date"]');
  if (dateOpt) dateOpt.disabled = currentTab !== 'festivals';
  // 여행지 탭에서 sort=date였으면 default로
  if (currentTab !== 'festivals' && state.sort === 'date') {
    state.sort = 'default';
    sortSelectEl.value = 'default';
  }
}

// ── 즐겨찾기만 보기 토글 ──
favoritesToggleEl.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  syncFilterUI();
  update();
});

// ── 내 주변 (geolocation) ──
nearbyToggleEl.addEventListener('click', async () => {
  if (state.userLocation) {
    // 토글 끄기
    state.userLocation = null;
    syncFilterUI();
    update();
    return;
  }
  if (!navigator.geolocation) {
    showToast('이 브라우저는 위치 정보를 지원하지 않습니다');
    return;
  }
  nearbyToggleEl.classList.add('is-loading');
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 60000,
      });
    });
    state.userLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    syncFilterUI();
    update();
    showToast(`반경 ${NEARBY_RADIUS_KM}km 이내로 필터링했습니다`);
  } catch (err) {
    console.warn('geolocation 실패:', err);
    showToast('위치를 가져올 수 없습니다. 권한을 확인해 주세요');
  } finally {
    nearbyToggleEl.classList.remove('is-loading');
  }
});

monthChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) setMonth(chip.dataset.month);
});
categoryChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) setCategory(chip.dataset.category);
});
regionSelectEl.addEventListener('change', (e) => setRegion(e.target.value));
resetBtnEl.addEventListener('click', resetAll);
emptyResetBtnEl.addEventListener('click', resetAll);

// ── 초기화 ──
async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path} failed: ${res.status}`);
  return res.json();
}

// 두 좌표가 100m 이내면 같은 곳으로 간주 (큐레이션 ↔ TourAPI 중복 제거용)
function isCloseLocation(a, b, kmThreshold = 0.1) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return false;
  const dLatKm = (a.lat - b.lat) * 111;
  const dLngKm = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm) < kmThreshold;
}

async function init() {
  try {
    // 데이터셋 병렬 로드. 없으면 빈 배열로 폴백.
    const [festRaw, placesRaw, curatedRaw, collectionsRaw] = await Promise.all([
      fetchJson('data/festivals.json'),
      fetchJson('data/places.json').catch(() => []),
      fetchJson('data/places-curated.json').catch(() => []),
      fetchJson('data/collections.json').catch(() => []),
    ]);
    allCollections = Array.isArray(collectionsRaw) ? collectionsRaw : [];
    allFestivals = festRaw.filter((f) => durationDays(f) <= MAX_DURATION_DAYS);

    // 큐레이션 + TourAPI 합치기
    const curated = (Array.isArray(curatedRaw) ? curatedRaw : []).map((p) => ({
      ...p, curated: true,
    }));
    const tourapiList = Array.isArray(placesRaw) ? placesRaw : [];

    // 큐레이션 placeholder 이미지 → TourAPI에서 가까운 매칭 찾아 이미지 빌려오기
    const enrichedCurated = curated.map((c) => {
      const isPlaceholder = !c.image || c.image === 'images/placeholder.svg';
      if (!isPlaceholder) return c;
      const match = tourapiList.find(
        (t) =>
          isCloseLocation(c, t, 0.2) &&
          t.image &&
          t.image !== 'images/placeholder.svg'
      );
      return match ? { ...c, image: match.image } : c;
    });

    // TourAPI 중 큐레이션과 같은 위치(100m 이내) 항목 제거 (중복 방지)
    const tourapiFiltered = tourapiList.filter(
      (t) => !curated.some((c) => isCloseLocation(c, t))
    );
    allPlaces = [...enrichedCurated, ...tourapiFiltered];

    errorEl.hidden = true;

    // URL → 초기 탭/필터 상태 (기본 'places', 'festivals'은 URL ?tab=festivals로 진입)
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get('tab');
    if (tabParam === 'festivals') {
      currentTab = 'festivals';
      tabFestivalsBtn.classList.add('is-active');
      tabPlacesBtn.classList.remove('is-active');
      tabFestivalsBtn.setAttribute('aria-selected', 'true');
      tabPlacesBtn.setAttribute('aria-selected', 'false');
      monthFilterGroup.hidden = false;
      categoryFilterGroup.hidden = true;
    } else {
      // 기본 places
      monthFilterGroup.hidden = true;
      categoryFilterGroup.hidden = false;
    }

    const initial = parseQuery(window.location.search);
    state.month = initial.month;
    state.region = initial.region;
    state.category = initial.category;
    state.festival = initial.festival;

    syncSortOptionVisibility();
    syncFilterUI();
    renderWeekendRow();
    renderCollections();
    syncLangButtons();
    document.documentElement.lang = getLang();
    applyTranslations();
    update();

    if (state.festival) {
      const f = getCurrentDataset().find((x) => x.id === state.festival);
      if (f) openModal(f);
      else state.festival = null;
    }
    syncUrl();
  } catch (err) {
    console.error(err);
    cardsEl.hidden = true;
    errorEl.hidden = false;
  }
}

// ── 언어 switcher ──
function syncLangButtons() {
  const lang = getLang();
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
}
document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang);
    syncLangButtons();
    // 동적으로 생성되는 카운트·컬렉션 라벨 등은 update로 재렌더
    renderCollections();
    renderWeekendRow();
    update();
  });
});

init();

// PWA 서비스 워커 등록 — 오프라인 + 자동 업데이트
// 새 SW가 활성화되면 즉시 페이지 자동 새로고침 (사용자가 캐시 비울 필요 없음)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // 주기적으로 업데이트 체크 (페이지 열려있는 동안 새 버전 감지)
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); // 1시간마다
      })
      .catch((err) => console.warn('Service Worker 등록 실패:', err));

    // 새 SW가 페이지 컨트롤 가져오면 자동 새로고침 — 1번만
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
