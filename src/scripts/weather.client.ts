/**
 * 날씨 위젯 클라이언트 — Open-Meteo 호출 + 7일 카드 렌더.
 */
import { fetchDaily7, getWeatherInfo, weatherT, dayLabel } from '@/lib/weather';
import type { Lang } from '@/lib/i18n';

export function initWeatherWidget(root: HTMLElement) {
  const lat = parseFloat(root.dataset.lat || 'NaN');
  const lng = parseFloat(root.dataset.lng || 'NaN');
  const lang = (root.dataset.lang || 'ko') as Lang;
  const content = root.querySelector<HTMLElement>('[data-weather-content]');
  const status = root.querySelector<HTMLElement>('[data-weather-status]');
  if (!content || !status) return;
  if (!isFinite(lat) || !isFinite(lng)) return;

  fetchDaily7(lat, lng).then((data) => {
    if (!data || !data.daily) {
      status.textContent = weatherT('failed', lang);
      return;
    }
    const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = data.daily;
    const days = time.map((iso, i) => {
      const info = getWeatherInfo(weather_code[i]);
      const hi = Math.round(temperature_2m_max[i]);
      const lo = Math.round(temperature_2m_min[i]);
      const pop = precipitation_probability_max?.[i] ?? null;
      const name = dayLabel(iso, lang, i);
      const todayCls = i === 0 ? ' is-today' : '';
      const popHtml = pop != null && pop > 0
        ? `<div class="weather-day-precip">💧 ${pop}%</div>`
        : '';
      return `
        <div class="weather-day${todayCls}" title="${escapeAttr(info.label[lang])}">
          <div class="weather-day-name">${escapeHtml(name)}</div>
          <div class="weather-day-icon" aria-hidden="true">${info.icon}</div>
          <div class="weather-day-temp">
            <span class="hi">${hi}°</span>
            <span class="sep">/</span>
            <span class="lo">${lo}°</span>
          </div>
          ${popHtml}
        </div>
      `;
    });
    content.innerHTML = `<div class="weather-grid">${days.join('')}</div>`;
  }).catch(() => {
    status.textContent = weatherT('failed', lang);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
