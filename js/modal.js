const modalEl = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');

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

export function openModal(festival) {
  const linkHtml = festival.officialUrl
    ? `<a class="modal-link" href="${escapeHtml(festival.officialUrl)}" target="_blank" rel="noopener noreferrer">공식사이트 가기</a>`
    : '';
  const tagHtml = festival.category
    ? `<span class="tag" data-category="${escapeHtml(festival.category)}">${escapeHtml(festival.category)}</span>`
    : '';

  modalBody.innerHTML = `
    <img class="modal-image" alt="${escapeHtml(festival.name)}" src="${escapeHtml(festival.image)}"
         onerror="this.src='images/placeholder.svg'" />
    <div class="modal-body-inner">
      ${tagHtml}
      <h2 id="modal-title" class="modal-title">${escapeHtml(festival.name)}</h2>
      <div class="modal-meta">
        <span>${escapeHtml(formatRange(festival.startDate, festival.endDate))}</span>
        <span>${escapeHtml(festival.region)} ${escapeHtml(festival.city)}</span>
      </div>
      <p class="modal-description">${escapeHtml(festival.description)}</p>
      ${linkHtml}
    </div>
  `;

  modalEl.hidden = false;
  document.body.classList.add('modal-open');
}

export function closeModal() {
  modalEl.hidden = true;
  modalBody.innerHTML = '';
  document.body.classList.remove('modal-open');
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
