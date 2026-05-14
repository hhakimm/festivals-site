/**
 * 날씨 모듈 — Open-Meteo API 클라이언트 사이드 래퍼.
 * Open-Meteo: 무료, API 키 불필요, CORS OK.
 *   https://open-meteo.com/en/docs
 */

import type { Lang } from './i18n';

// WMO Weather interpretation codes
//  https://open-meteo.com/en/docs#weathervariables
// 그룹별로 묶어서 아이콘·라벨 매핑
export interface WeatherInfo {
  icon: string;
  label: Record<Lang, string>;
  /** 야외 활동 점수 (0~100) — 홈 비교에 사용 */
  outdoorScore: number;
}

function info(icon: string, ko: string, en: string, ja: string, zh: string, outdoorScore: number): WeatherInfo {
  return { icon, label: { ko, en, ja, zh }, outdoorScore };
}

const CODE_MAP: Record<number, WeatherInfo> = {
  0:  info('☀️', '맑음', 'Clear', '晴れ', '晴朗', 100),
  1:  info('🌤️', '대체로 맑음', 'Mostly clear', 'おおむね晴れ', '基本晴朗', 92),
  2:  info('⛅', '구름 조금', 'Partly cloudy', '一部曇り', '局部多云', 80),
  3:  info('☁️', '흐림', 'Overcast', '曇り', '阴天', 65),
  45: info('🌫️', '안개', 'Fog', '霧', '雾', 40),
  48: info('🌫️', '서리 안개', 'Rime fog', '霧氷', '雾凇', 35),
  51: info('🌦️', '약한 이슬비', 'Light drizzle', '弱い霧雨', '小毛毛雨', 50),
  53: info('🌦️', '이슬비', 'Drizzle', '霧雨', '毛毛雨', 40),
  55: info('🌧️', '강한 이슬비', 'Dense drizzle', '濃い霧雨', '浓毛毛雨', 30),
  56: info('🌧️', '약한 어는비', 'Light freezing drizzle', '弱い着氷性霧雨', '轻冻毛毛雨', 25),
  57: info('🌧️', '어는비', 'Freezing drizzle', '着氷性霧雨', '冻毛毛雨', 20),
  61: info('🌧️', '약한 비', 'Light rain', '弱い雨', '小雨', 40),
  63: info('🌧️', '비', 'Rain', '雨', '中雨', 25),
  65: info('🌧️', '강한 비', 'Heavy rain', '強い雨', '大雨', 10),
  66: info('🌧️', '약한 어는비', 'Light freezing rain', '弱い着氷性雨', '轻冻雨', 15),
  67: info('🌧️', '어는비', 'Freezing rain', '着氷性雨', '冻雨', 8),
  71: info('🌨️', '약한 눈', 'Light snow', '弱い雪', '小雪', 50),
  73: info('🌨️', '눈', 'Snow', '雪', '中雪', 35),
  75: info('❄️', '폭설', 'Heavy snow', '大雪', '大雪', 15),
  77: info('🌨️', '눈싸라기', 'Snow grains', '霧雪', '雪粒', 30),
  80: info('🌦️', '약한 소나기', 'Light showers', '弱いにわか雨', '小阵雨', 45),
  81: info('🌧️', '소나기', 'Showers', 'にわか雨', '阵雨', 25),
  82: info('⛈️', '강한 소나기', 'Heavy showers', '強いにわか雨', '强阵雨', 10),
  85: info('🌨️', '약한 눈 소나기', 'Light snow showers', '弱いにわか雪', '小阵雪', 35),
  86: info('🌨️', '눈 소나기', 'Snow showers', 'にわか雪', '阵雪', 20),
  95: info('⛈️', '천둥', 'Thunderstorm', '雷雨', '雷暴', 5),
  96: info('⛈️', '약한 우박을 동반한 천둥', 'Thunder with light hail', '雷雨と弱い雹', '雷暴伴小冰雹', 3),
  99: info('⛈️', '우박을 동반한 천둥', 'Thunder with hail', '雷雨と雹', '雷暴伴冰雹', 1),
};

const FALLBACK_INFO: WeatherInfo = info('❓', '알 수 없음', 'Unknown', '不明', '未知', 50);

export function getWeatherInfo(code: number | null | undefined): WeatherInfo {
  if (code == null) return FALLBACK_INFO;
  return CODE_MAP[code] ?? FALLBACK_INFO;
}

// ─────────────────────────────────────────────────────────────
// Open-Meteo API 응답 타입 (필요한 부분만)
// ─────────────────────────────────────────────────────────────
export interface DailyForecast {
  time: string[];                        // YYYY-MM-DD
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
}
export interface CurrentForecast {
  time: string;
  temperature_2m: number;
  weather_code: number;
}
export interface MeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: DailyForecast;
  current?: CurrentForecast;
}

// ─────────────────────────────────────────────────────────────
// fetch 래퍼 — 캐시 적용 (sessionStorage, 1시간 TTL)
// ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

interface CacheEntry { data: MeteoResponse; expires: number; }

function cacheKey(lat: number, lng: number, kind: 'daily7' | 'current'): string {
  // 좌표는 소수점 2자리로 라운드 (캐시 효율)
  const la = lat.toFixed(2);
  const ln = lng.toFixed(2);
  return `meteo:${kind}:${la}:${ln}`;
}

function readCache(key: string): MeteoResponse | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expires) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: MeteoResponse) {
  try {
    const entry: CacheEntry = { data, expires: Date.now() + CACHE_TTL_MS };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch { /* quota */ }
}

const API_BASE = 'https://api.open-meteo.com/v1/forecast';

/** 7일 일별 예보 + 현재 — 상세 페이지용 */
export async function fetchDaily7(lat: number, lng: number): Promise<MeteoResponse | null> {
  const key = cacheKey(lat, lng, 'daily7');
  const cached = readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=Asia%2FSeoul&forecast_days=7`;

  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return null;
    const data = (await r.json()) as MeteoResponse;
    writeCache(key, data);
    return data;
  } catch {
    return null;
  }
}

/** 현재 + 오늘만 — 홈 도시 비교용 (가벼움) */
export async function fetchCurrent(lat: number, lng: number): Promise<MeteoResponse | null> {
  const key = cacheKey(lat, lng, 'current');
  const cached = readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=Asia%2FSeoul&forecast_days=1`;

  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return null;
    const data = (await r.json()) as MeteoResponse;
    writeCache(key, data);
    return data;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 5대 도시 좌표 — 홈 비교용
// ─────────────────────────────────────────────────────────────
export interface City { id: string; lat: number; lng: number; name: Record<Lang, string>; }
export const MAJOR_CITIES: City[] = [
  { id: 'seoul',   lat: 37.5665, lng: 126.9780, name: { ko: '서울', en: 'Seoul',   ja: 'ソウル', zh: '首尔' } },
  { id: 'busan',   lat: 35.1796, lng: 129.0756, name: { ko: '부산', en: 'Busan',   ja: '釜山',   zh: '釜山' } },
  { id: 'jeju',    lat: 33.4996, lng: 126.5312, name: { ko: '제주', en: 'Jeju',    ja: '済州',   zh: '济州' } },
  { id: 'gangneung',lat: 37.7519, lng: 128.8761, name: { ko: '강릉', en: 'Gangneung', ja: '江陵', zh: '江陵' } },
  { id: 'jeonju',  lat: 35.8242, lng: 127.1480, name: { ko: '전주', en: 'Jeonju',  ja: '全州',   zh: '全州' } },
];

// ─────────────────────────────────────────────────────────────
// UI 라벨
// ─────────────────────────────────────────────────────────────
export const WEATHER_LABELS = {
  forecast7: { ko: '7일 날씨', en: '7-day forecast', ja: '7日間の天気', zh: '7日天气' },
  today: { ko: '오늘', en: 'Today', ja: '今日', zh: '今日' },
  tomorrow: { ko: '내일', en: 'Tomorrow', ja: '明日', zh: '明日' },
  tempMax: { ko: '최고', en: 'High', ja: '最高', zh: '最高' },
  tempMin: { ko: '최저', en: 'Low', ja: '最低', zh: '最低' },
  precip: { ko: '강수확률', en: 'Precip.', ja: '降水確率', zh: '降水概率' },
  loading: { ko: '날씨 정보 불러오는 중…', en: 'Loading weather…', ja: '天気を読み込み中…', zh: '正在加载天气…' },
  failed: { ko: '날씨 정보를 가져올 수 없습니다', en: 'Could not load weather', ja: '天気情報を取得できません', zh: '无法获取天气信息' },
  weatherSourceNote: {
    ko: '날씨 데이터: Open-Meteo',
    en: 'Weather: Open-Meteo',
    ja: '天気データ: Open-Meteo',
    zh: '天气数据: Open-Meteo',
  },
  homeTitle: {
    ko: '오늘의 추천 — 날씨 좋은 곳',
    en: "Today's picks — best weather",
    ja: '今日のおすすめ — 天気の良い場所',
    zh: '今日推荐 — 天气最佳的地方',
  },
  homeSubtitle: {
    ko: '5대 관광 거점 도시 비교 (수도권·영남·제주·강원·호남)',
    en: '5 tourism hubs: Seoul · Busan · Jeju · Gangneung · Jeonju',
    ja: '主要観光5都市: ソウル·釜山·済州·江陵·全州',
    zh: '5大旅游重镇: 首尔·釜山·济州·江陵·全州',
  },
  outdoorScore: {
    ko: '야외 활동',
    en: 'Outdoor',
    ja: '屋外活動',
    zh: '户外活动',
  },
} as const;

export function weatherT(key: keyof typeof WEATHER_LABELS, lang: Lang): string {
  return WEATHER_LABELS[key][lang];
}

/** YYYY-MM-DD → 요일 라벨 (오늘/내일/요일명) */
export function dayLabel(isoDate: string, lang: Lang, idx: number): string {
  if (idx === 0) return weatherT('today', lang);
  if (idx === 1) return weatherT('tomorrow', lang);
  const d = new Date(isoDate + 'T00:00:00');
  const wdayKo = ['일', '월', '화', '수', '목', '금', '토'];
  const wdayEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wdayJa = ['日', '月', '火', '水', '木', '金', '土'];
  const wdayZh = ['日', '一', '二', '三', '四', '五', '六'];
  const table = { ko: wdayKo, en: wdayEn, ja: wdayJa, zh: wdayZh }[lang];
  return table[d.getDay()];
}
