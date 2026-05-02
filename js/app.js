import { applyFilters } from './filter.js';
import { openModal, closeModal, bindModalClose } from './modal.js';

const cardsEl = document.getElementById('cards');
const emptyEl = document.getElementById('empty-state');
const errorEl = document.getElementById('error-state');
const countEl = document.getElementById('result-count');

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

function renderCards(festivals) {
  cardsEl.innerHTML = festivals.map(f => `
    <article class="card" data-festival-id="${escapeHtml(f.id)}">
      <img class="card-image" alt="${escapeHtml(f.name)}" src="${escapeHtml(f.image)}"
           onerror="this.src='images/placeholder.svg'" loading="lazy" />
      <div class="card-body">
        <span class="tag" data-category="${escapeHtml(f.category)}">${escapeHtml(f.category)}</span>
        <h2 class="card-title">${escapeHtml(f.name)}</h2>
        <div class="card-meta">
          <span>${escapeHtml(formatRange(f.startDate, f.endDate))}</span>
          <span>${escapeHtml(f.region)} ${escapeHtml(f.city)}</span>
        </div>
        <p class="card-description">${escapeHtml(f.description)}</p>
      </div>
    </article>
  `).join('');
}

function update() {
  const filtered = applyFilters(allFestivals, state);
  countEl.textContent = `총 ${filtered.length}개의 축제`;
  if (filtered.length === 0) {
    cardsEl.hidden = true;
    emptyEl.hidden = false;
  } else {
    cardsEl.hidden = false;
    emptyEl.hidden = true;
    renderCards(filtered);
  }
}

cardsEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.festivalId;
  const festival = allFestivals.find(f => f.id === id);
  if (festival) openModal(festival);
});

bindModalClose(closeModal);

async function init() {
  try {
    const res = await fetch('data/festivals.json');
    if (!res.ok) throw new Error('fetch failed');
    allFestivals = await res.json();
    errorEl.hidden = true;
    update();
  } catch (err) {
    console.error(err);
    cardsEl.hidden = true;
    errorEl.hidden = false;
  }
}

init();
