import { isFavorite, toggleFavorite } from './favorites.js';

const modalEl = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');

let currentItem = null;
let onFavToggleCallback = null;

function formatRange(start, end) {
  // 모달용: 연도 포함 — "2026.5.30 — 6.5" (같은 연도) 또는 "2026.12.30 — 2027.1.3"
  const parse = (s) => s.split('-').map(Number);
  const [sy, sm, sd] = parse(start);
  const [ey, em, ed] = parse(end);
  const left = `${sy}.${sm}.${sd}`;
  if (start === end) return left;
  const right = sy === ey ? `${em}.${ed}` : `${ey}.${em}.${ed}`;
  return `${left} — ${right}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInfoTable(item) {
  const info = item.info || {};
  const rows = [];
  // 축제: place, time, fee, parking, duration, sponsor, tel, booking
  // 여행지: time, fee, restdate, parking, tel, opendate, experience
  const fields = [
    ['장소',     info.place],
    ['운영시간', info.time],
    ['입장료',   info.fee],
    ['할인',     info.discount],
    ['휴무일',   info.restdate],
    ['주차',     info.parking],
    ['소요시간', info.duration],
    ['관람연령', info.ageLimit],
    ['주최',     info.sponsor],
    ['문의',     info.tel],
    ['예매처',   info.booking],
    ['부대행사', info.subEvent],
    ['개장일',   info.opendate],
    ['체험안내', info.experience],
    ['주소',     item.address],
  ];
  for (const [label, value] of fields) {
    if (value && String(value).trim()) {
      rows.push(`<dt>${label}</dt><dd>${escapeHtml(String(value).trim())}</dd>`);
    }
  }
  if (rows.length === 0) return '';
  return `<dl class="modal-info-table">${rows.join('')}</dl>`;
}

function renderActions(item) {
  const fav = isFavorite(item.id);
  const linkHtml = item.officialUrl
    ? `<a class="modal-link" href="${escapeHtml(item.officialUrl)}" target="_blank" rel="noopener noreferrer">공식사이트 가기</a>`
    : '';
  return `
    <div class="modal-actions">
      ${linkHtml}
      <button type="button" class="modal-action-secondary" data-action="share">↗ 공유</button>
      <button type="button" class="modal-action-secondary${fav ? ' is-active-fav' : ''}" data-action="fav">
        <span class="fav-icon">${fav ? '♥' : '♡'}</span> ${fav ? '즐겨찾기 해제' : '즐겨찾기'}
      </button>
    </div>
  `;
}

export function openModal(item) {
  currentItem = item;
  const tagHtml = item.category
    ? `<span class="tag" data-category="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span>`
    : '';
  const dateLine = (item.startDate && item.endDate)
    ? `<span>${escapeHtml(formatRange(item.startDate, item.endDate))}</span>`
    : '';

  modalBody.innerHTML = `
    <img class="modal-image" alt="${escapeHtml(item.name)}" src="${escapeHtml(item.image)}"
         onerror="this.src='images/placeholder.svg'" />
    <div class="modal-body-inner">
      ${tagHtml}
      <h2 id="modal-title" class="modal-title">${escapeHtml(item.name)}</h2>
      <div class="modal-meta">
        ${dateLine}
        <span>${escapeHtml(item.region)} ${escapeHtml(item.city)}</span>
      </div>
      <p class="modal-description">${escapeHtml(item.description)}</p>
      ${renderInfoTable(item)}
      ${renderActions(item)}
    </div>
  `;

  modalEl.hidden = false;
  document.body.classList.add('modal-open');
}

export function closeModal() {
  modalEl.hidden = true;
  modalBody.innerHTML = '';
  document.body.classList.remove('modal-open');
  currentItem = null;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  // 다음 프레임에 클래스 추가 → 트랜지션 발동
  requestAnimationFrame(() => toast.classList.add('is-shown'));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('is-shown');
    setTimeout(() => { toast.hidden = true; }, 220);
  }, 1800);
}

async function shareItem(item) {
  // 공유 URL — 현재 탭 정보 + 항목 id
  const params = new URLSearchParams(window.location.search);
  params.set('festival', item.id); // 모달 깊은 링크 파라미터
  const url = `${window.location.origin}${window.location.pathname}?${params}`;
  const text = `${item.name} — ${item.region} ${item.city}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: item.name, text, url });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
  }
  // 폴백: 클립보드 복사
  try {
    await navigator.clipboard.writeText(url);
    showToast('링크가 복사되었습니다');
  } catch {
    showToast('복사에 실패했습니다');
  }
}

// 모달 내 액션 클릭 처리
modalEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn || !currentItem) return;
  const action = btn.dataset.action;
  if (action === 'share') {
    shareItem(currentItem);
  } else if (action === 'fav') {
    const isFav = toggleFavorite(currentItem.id);
    // 모달 액션 영역만 다시 렌더 (하단 영역 교체)
    const inner = modalBody.querySelector('.modal-body-inner');
    if (inner) {
      const oldActions = inner.querySelector('.modal-actions');
      if (oldActions) {
        const wrap = document.createElement('div');
        wrap.innerHTML = renderActions(currentItem);
        oldActions.replaceWith(wrap.firstElementChild);
      }
    }
    showToast(isFav ? '즐겨찾기에 추가됨' : '즐겨찾기에서 해제됨');
    if (onFavToggleCallback) onFavToggleCallback(currentItem.id);
  }
});

export function onFavToggle(cb) {
  onFavToggleCallback = cb;
}

export function bindModalClose(onClose) {
  modalEl.addEventListener('click', (e) => {
    if (e.target.matches('[data-modal-close]')) {
      onClose();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalEl.hidden) {
      onClose();
    }
  });
}

export { showToast };
