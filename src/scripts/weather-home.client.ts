/**
 * 홈 페이지 5도시 날씨 비교 — 야외 활동 점수로 정렬.
 */
import { fetchCurrent, getWeatherInfo, weatherT } from '@/lib/weather';
import type { Lang } from '@/lib/i18n';

interface CityCardData {
  el: HTMLElement;
  cityId: string;
  lat: number;
  lng: number;
  score?: number;
}

export async function initWeatherHome(root: HTMLElement) {
  const lang = (root.dataset.lang || 'ko') as Lang;
  const cards: CityCardData[] = [];
  root.querySelectorAll<HTMLElement>('[data-city-id]').forEach((el) => {
    cards.push({
      el,
      cityId: el.dataset.cityId || '',
      lat: parseFloat(el.dataset.lat || '0'),
      lng: parseFloat(el.dataset.lng || '0'),
    });
  });

  // 병렬로 5개 도시 fetch
  await Promise.all(cards.map(async (c) => {
    const data = await fetchCurrent(c.lat, c.lng);
    if (!data) {
      c.el.querySelector('.weather-city-label')!.textContent = weatherT('failed', lang);
      return;
    }
    const cur = data.current;
    const daily = data.daily;
    const code = cur?.weather_code ?? daily.weather_code[0];
    const temp = cur ? Math.round(cur.temperature_2m) : Math.round((daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2);
    const info = getWeatherInfo(code);

    // 야외 점수 = 날씨 점수 - 강수확률 패널티
    const pop = daily.precipitation_probability_max?.[0] ?? 0;
    const score = Math.max(0, Math.min(100, info.outdoorScore - Math.floor(pop / 3)));
    c.score = score;

    c.el.classList.remove('skeleton');
    const iconEl = c.el.querySelector<HTMLElement>('.weather-city-icon');
    if (iconEl) iconEl.textContent = info.icon;
    const tempEl = c.el.querySelector<HTMLElement>('.weather-city-temp');
    if (tempEl) tempEl.textContent = `${temp}°`;
    const labelEl = c.el.querySelector<HTMLElement>('.weather-city-label');
    if (labelEl) labelEl.textContent = info.label[lang];
    const pctEl = c.el.querySelector<HTMLElement>('.weather-city-score-pct');
    if (pctEl) pctEl.textContent = `${score}`;
    const fillEl = c.el.querySelector<HTMLElement>('.weather-city-score-fill');
    if (fillEl) fillEl.style.width = `${score}%`;
  }));

  // 점수 정렬 — 최고 점수에 강조
  const sorted = [...cards]
    .filter((c) => typeof c.score === 'number')
    .sort((a, b) => (b.score! - a.score!));
  // DOM 재정렬
  const container = root.querySelector<HTMLElement>('[data-weather-cities]');
  if (container) {
    sorted.forEach((c) => container.appendChild(c.el));
  }
  // 최고 도시 강조
  if (sorted.length > 0 && sorted[0].score! >= 60) {
    sorted[0].el.classList.add('is-top');
  }
}
