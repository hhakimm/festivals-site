import { applyFilters } from './filter.js';
import { openModal, closeModal, bindModalClose } from './modal.js';
import { parseQuery, serializeState } from './url-sync.js';
import { ensureMap, renderMarkers, invalidateSize } from './map.js';

const cardsEl = document.getElementById('cards');
const mapEl = document.getElementById('map');
const emptyEl = document.getElementById('empty-state');
const errorEl = document.getElementById('error-state');
const countEl = document.getElementById('result-count');
const viewListBtn = document.getElementById('view-list');
const viewMapBtn = document.getElementById('view-map');

let currentView = 'list'; // 'list' | 'map'

const state = {
  month: null,
  region: null,
  category: null,
  festival: null,
};

let allFestivals = [];

function formatRange(start, end) {
  const fmt = (s) => {
    const [, m, d] = s.split('-').map(Number);
    return `${m}.${d}`;
  };
  return start === end ? fmt(start) : `${fmt(start)} — ${fmt(end)}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const MAX_DURATION_DAYS = 21;

function durationDays(f) {
  const [sy, sm, sd] = f.startDate.split('-').map(Number);
  const [ey, em, ed] = f.endDate.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86400000) + 1;
}

function renderCards(festivals) {
  cardsEl.innerHTML = festivals.map(f => {
    const tagHtml = f.category
      ? `<span class="tag" data-category="${escapeHtml(f.category)}">${escapeHtml(f.category)}</span>`
      : '';
    return `
    <article class="card" data-festival-id="${escapeHtml(f.id)}">
      <div class="card-image-wrap">
        <img class="card-image" alt="${escapeHtml(f.name)}" src="${escapeHtml(f.image)}"
             onerror="this.src='images/placeholder.svg'" loading="lazy" />
      </div>
      <div class="card-body">
        ${tagHtml}
        <h2 class="card-title">${escapeHtml(f.name)}</h2>
        <div class="card-meta">
          <span>${escapeHtml(formatRange(f.startDate, f.endDate))}</span>
          <span>${escapeHtml(f.region)} ${escapeHtml(f.city)}</span>
        </div>
        <p class="card-description">${escapeHtml(f.description)}</p>
      </div>
    </article>
  `;
  }).join('');
}

function openFestivalById(id) {
  const f = allFestivals.find((x) => x.id === id);
  if (!f) return;
  state.festival = f.id;
  openModal(f);
  syncUrl();
}

function update() {
  const filtered = applyFilters(allFestivals, state);
  countEl.textContent = `총 ${filtered.length}개의 축제`;

  // 모든 뷰 컨테이너를 일단 숨기고 해당 뷰만 노출
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
    renderMarkers(filtered, openFestivalById);
  } else {
    cardsEl.hidden = false;
    renderCards(filtered);
  }
}

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

function syncUrl() {
  const query = serializeState(state);
  const newUrl = window.location.pathname + query;
  window.history.replaceState(null, '', newUrl);
}

cardsEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.festivalId;
  const festival = allFestivals.find(f => f.id === id);
  if (festival) {
    state.festival = festival.id;
    openModal(festival);
    syncUrl();
  }
});

bindModalClose(() => {
  closeModal();
  state.festival = null;
  syncUrl();
});

async function init() {
  try {
    const res = await fetch('data/festivals.json');
    if (!res.ok) throw new Error('fetch failed');
    const raw = await res.json();
    // 21일 넘게 진행되는 장기 행사·전시는 제외 (축제로서 의미 약화)
    allFestivals = raw.filter((f) => durationDays(f) <= MAX_DURATION_DAYS);
    errorEl.hidden = true;

    const initial = parseQuery(window.location.search);
    state.month = initial.month;
    state.region = initial.region;
    state.category = initial.category;
    state.festival = initial.festival;

    syncFilterUI();
    update();

    if (state.festival) {
      const f = allFestivals.find(x => x.id === state.festival);
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

init();

const monthChipsEl = document.getElementById('month-chips');
const categoryChipsEl = document.getElementById('category-chips');
const regionSelectEl = document.getElementById('region-select');
const resetBtnEl = document.getElementById('reset-filters');
const emptyResetBtnEl = emptyEl.querySelector('[data-reset]');

function setActiveChip(groupEl, attr, value) {
  groupEl.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset[attr] === value);
  });
}

function syncFilterUI() {
  setActiveChip(monthChipsEl, 'month', state.month == null ? 'all' : String(state.month));
  setActiveChip(categoryChipsEl, 'category', state.category == null ? 'all' : state.category);
  regionSelectEl.value = state.region == null ? 'all' : state.region;
  const anyActive = state.month != null || state.region != null || state.category != null;
  resetBtnEl.hidden = !anyActive;
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
  syncFilterUI();
  update();
  syncUrl();
}

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
