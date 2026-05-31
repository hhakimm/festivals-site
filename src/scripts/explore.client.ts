/**
 * 홈 페이지 통합 인터랙션 — vanilla TS, 프레임워크 없음.
 * 책임:
 *  1. /index.json 로드 (경량 인덱스, fetch 1회)
 *  2. 통합 필터바 (검색·지역·테마·카테고리·정렬)
 *  3. 즐겨찾기 ♡ 토글 (localStorage)
 *  4. 내 주변 (Geolocation + Haversine)
 *  5. 목록/지도 토글 + Leaflet 마커 (lazy-load)
 *  6. 테마 컬렉션 (자동 분류 — theme/type 기반)
 *
 * SSG/SEO 영향 없음 — 모두 클라이언트 사이드.
 */

// ── 타입 ─────────────────────────────────────────────────────────────────────
export interface IndexItem {
  i: string;                  // id
  t: 0 | 1;                   // type: 0=attraction, 1=festival
  s: string;                  // slug
  n: string;                  // title
  a: string;                  // address
  r: string;                  // areacode
  th: string;                 // theme
  img: string | null;         // imageThumb
  lat: number | null;
  lng: number | null;
  sd: string | null;          // startDate (YYYYMMDD)
  ed: string | null;          // endDate (YYYYMMDD)
  bf?: 1;                     // barrierFree(무장애)
  pet?: 1;                    // pet(반려동물)
}

interface ExploreState {
  category: 'all' | 'attraction' | 'festival';
  region: string;             // areacode 키 또는 'all'
  theme: string;              // 5개 테마 또는 'all'
  search: string;
  sort: 'default' | 'name' | 'date' | 'distance';
  favoritesOnly: boolean;
  userLocation: { lat: number; lng: number } | null;
  view: 'list' | 'map';
  collection: string | null;
  visible: number;
  /** 빠른 날짜 (festival 카테고리에서만 활성). null이면 미선택 */
  quickDate: 'this-weekend' | 'this-week' | 'next-month' | null;
  /** 월 선택 (festival 카테고리에서만, 1~12 또는 'all') */
  month: string;
  /** 무장애(♿)·반려동물(🐾) 동반 가능만 보기 */
  barrierFree: boolean;
  pet: boolean;
}

interface Collection {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  /** 항목을 매칭하는 함수 — index 인덱스 항목을 받아 boolean 반환 */
  match: (it: IndexItem) => boolean;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────
const INITIAL_VISIBLE = 24;
const PAGE_VISIBLE = 24;

type Lang = 'ko' | 'en' | 'ja' | 'zh';

// 지역명 — areacode → 4개 언어 (data.ts AREA_CODE 와 일치)
const AREA_NAME: Record<Lang, Record<string, string>> = {
  ko: { '1':'서울','2':'인천','3':'대전','4':'대구','5':'광주','6':'부산','7':'울산','8':'세종','31':'경기','32':'강원','33':'충북','34':'충남','35':'경북','36':'경남','37':'전북','38':'전남','39':'제주' },
  en: { '1':'Seoul','2':'Incheon','3':'Daejeon','4':'Daegu','5':'Gwangju','6':'Busan','7':'Ulsan','8':'Sejong','31':'Gyeonggi','32':'Gangwon','33':'Chungbuk','34':'Chungnam','35':'Gyeongbuk','36':'Gyeongnam','37':'Jeonbuk','38':'Jeonnam','39':'Jeju' },
  ja: { '1':'ソウル','2':'仁川','3':'大田','4':'大邱','5':'光州','6':'釜山','7':'蔚山','8':'世宗','31':'京畿','32':'江原','33':'忠清北道','34':'忠清南道','35':'慶尚北道','36':'慶尚南道','37':'全羅北道','38':'全羅南道','39':'済州' },
  zh: { '1':'首尔','2':'仁川','3':'大田','4':'大邱','5':'光州','6':'釜山','7':'蔚山','8':'世宗','31':'京畿','32':'江原','33':'忠清北道','34':'忠清南道','35':'庆尚北道','36':'庆尚南道','37':'全罗北道','38':'全罗南道','39':'济州' },
};

// 클라이언트 라벨 (data-lang으로 분기)
const STR: Record<Lang, Record<string, string>> = {
  ko: {
    total: '총', items: '개',
    favAdded: '즐겨찾기에 추가됨',
    favRemoved: '즐겨찾기에서 해제됨',
    favAddTitle: '즐겨찾기에 추가',
    favRemoveTitle: '즐겨찾기 해제',
    nearbyApplied: '반경 50km 이내로 필터링했습니다',
    geoUnsupported: '이 브라우저는 위치 정보를 지원하지 않습니다',
    geoFailed: '위치를 가져올 수 없습니다 (권한 확인)',
    detailMore: '자세히 보기 →',
    placesUnit: '곳',
    leafletFail: '데이터를 불러오지 못했습니다. 새로고침해 주세요.',
  },
  en: {
    total: 'Total', items: '',
    favAdded: 'Added to favorites',
    favRemoved: 'Removed from favorites',
    favAddTitle: 'Add to favorites',
    favRemoveTitle: 'Remove from favorites',
    nearbyApplied: 'Filtered to within 50 km radius',
    geoUnsupported: 'This browser does not support geolocation',
    geoFailed: 'Could not get location (check permissions)',
    detailMore: 'View detail →',
    placesUnit: '',
    leafletFail: 'Failed to load data. Please refresh.',
  },
  ja: {
    total: '合計', items: '件',
    favAdded: 'お気に入りに追加',
    favRemoved: 'お気に入りから削除',
    favAddTitle: 'お気に入りに追加',
    favRemoveTitle: 'お気に入りから削除',
    nearbyApplied: '半径50km以内でフィルタリングしました',
    geoUnsupported: 'このブラウザは位置情報に対応していません',
    geoFailed: '位置情報を取得できません (権限を確認)',
    detailMore: '詳細を見る →',
    placesUnit: 'スポット',
    leafletFail: 'データを読み込めませんでした。再読み込みしてください。',
  },
  zh: {
    total: '共', items: '个',
    favAdded: '已添加到收藏',
    favRemoved: '已从收藏移除',
    favAddTitle: '添加到收藏',
    favRemoveTitle: '取消收藏',
    nearbyApplied: '已筛选到 50 公里以内',
    geoUnsupported: '此浏览器不支持位置信息',
    geoFailed: '无法获取位置 (请检查权限)',
    detailMore: '查看详情 →',
    placesUnit: '处',
    leafletFail: '数据加载失败,请刷新。',
  },
};

const FAV_KEY = 'favorites-v1';

// ── 즐겨찾기 (localStorage) ─────────────────────────────────────────────────
function loadFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function saveFavorites(set: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  } catch {}
}
let favorites = loadFavorites();

// ── 유틸 ────────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(yyyymmdd: string | null): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  return `${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

function formatDateRange(sd: string | null, ed: string | null): string {
  if (!sd) return '';
  const s = formatDate(sd);
  const e = ed && ed !== sd ? formatDate(ed) : '';
  return e ? `${s} – ${e}` : s;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ── 토스트 ──────────────────────────────────────────────────────────────────
let toastTimer: number | null = null;
function showToast(msg: string) {
  let el = document.getElementById('explore-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'explore-toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('is-visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove('is-visible'), 2200);
}

// ── 카드 렌더 ───────────────────────────────────────────────────────────────
// Astro/Vite 환경변수 (빌드 타임에 인라인됨)
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

const TAG_LABELS: Record<Lang, { bf: string; pet: string }> = {
  ko: { bf: '♿ 무장애', pet: '🐾 반려동물' },
  en: { bf: '♿ Accessible', pet: '🐾 Pet OK' },
  ja: { bf: '♿ バリアフリー', pet: '🐾 ペット可' },
  zh: { bf: '♿ 无障碍', pet: '🐾 宠物友好' },
};

function cardHtml(it: IndexItem & { _dist?: number }, lang: Lang): string {
  const isFest = it.t === 1;
  const langPrefix = lang === 'ko' ? '' : `/${lang}`;
  const href = `${BASE}${langPrefix}/${isFest ? 'festival' : 'attraction'}/${it.s}/`;
  const region = AREA_NAME[lang][it.r] || '';
  const dates = isFest ? formatDateRange(it.sd, it.ed) : '';
  const fav = favorites.has(it.i);
  const s = STR[lang];
  const distHtml = it._dist != null
    ? `<p class="card-distance">📍 ${it._dist.toFixed(1)} km</p>`
    : '';
  const imgHtml = it.img
    ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.n)}" loading="lazy" width="320" height="200" />`
    : `<div class="card-image-placeholder" aria-hidden="true"><span class="card-image-placeholder-emoji">${isFest ? '🎆' : '🗺️'}</span>${region ? `<span class="card-image-placeholder-region">${escapeHtml(region)}</span>` : ''}</div>`;
  const datesHtml = dates ? `<p class="card-dates">${escapeHtml(dates)}</p>` : '';
  const tl = TAG_LABELS[lang];
  const tagsHtml = (it.bf || it.pet)
    ? `<div class="card-tags">${it.bf ? `<span class="card-tag tag-bf">${tl.bf}</span>` : ''}${it.pet ? `<span class="card-tag tag-pet">${tl.pet}</span>` : ''}</div>`
    : '';
  return `
    <article class="explore-card" data-id="${escapeHtml(it.i)}">
      <button type="button" class="fav-btn${fav ? ' is-active' : ''}"
              data-fav-id="${escapeHtml(it.i)}"
              aria-label="${fav ? s.favRemoveTitle : s.favAddTitle}"
              title="${fav ? s.favRemoveTitle : s.favAddTitle}">${fav ? '♥' : '♡'}</button>
      <a class="card-link" href="${href}">
        <div class="card-image">${imgHtml}</div>
        <div class="card-body">
          ${region ? `<span class="card-region">${escapeHtml(region)}</span>` : ''}
          <h3 class="card-title">${escapeHtml(it.n)}</h3>
          ${datesHtml}
          ${tagsHtml}
          <p class="card-addr">${escapeHtml(it.a)}</p>
          ${distHtml}
        </div>
      </a>
    </article>
  `;
}

// ── Leaflet 지도 (lazy-load) ────────────────────────────────────────────────
let leafletPromise: Promise<typeof import('leaflet')> | null = null;
let mapInstance: any = null;
let markersLayer: any = null;

async function loadLeaflet(): Promise<any> {
  if (window.L) return window.L;
  if (leafletPromise) return leafletPromise;
  // CDN으로 leaflet + CSS 동적 로드
  const cssLoaded = new Promise<void>((resolve, reject) => {
    if (document.querySelector('link[data-leaflet-css]')) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.dataset.leafletCss = 'true';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Leaflet CSS 로드 실패'));
    document.head.appendChild(link);
  });
  const jsLoaded = new Promise<any>((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet JS 로드 실패'));
    document.head.appendChild(script);
  });
  leafletPromise = Promise.all([cssLoaded, jsLoaded]).then(() => window.L);
  return leafletPromise;
}

async function ensureMap(containerId: string): Promise<any> {
  if (mapInstance) return mapInstance;
  const L = await loadLeaflet();
  mapInstance = L.map(containerId, {
    center: [36.5, 127.8],
    zoom: 7,
    scrollWheelZoom: true,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(mapInstance);
  markersLayer = L.layerGroup().addTo(mapInstance);
  return mapInstance;
}

async function renderMarkers(items: IndexItem[], lang: Lang) {
  const L = await loadLeaflet();
  if (!mapInstance) return;
  markersLayer.clearLayers();
  const points: Array<[number, number]> = [];
  const langPrefix = lang === 'ko' ? '' : `/${lang}`;
  const detailLabel = STR[lang].detailMore;
  // 너무 많으면 성능 떨어짐 — 상위 500개만
  const slice = items.slice(0, 500);
  for (const it of slice) {
    if (it.lat == null || it.lng == null) continue;
    if (it.lat < 33 || it.lat > 39 || it.lng < 124 || it.lng > 132) continue;
    const marker = L.marker([it.lat, it.lng], { title: it.n });
    const isFest = it.t === 1;
    const href = `${BASE}${langPrefix}/${isFest ? 'festival' : 'attraction'}/${it.s}/`;
    const dates = isFest ? formatDateRange(it.sd, it.ed) : '';
    marker.bindPopup(`
      <strong>${escapeHtml(it.n)}</strong><br>
      ${dates ? `<small>${escapeHtml(dates)}</small><br>` : ''}
      <small>${escapeHtml(it.a)}</small><br>
      <a href="${href}">${detailLabel}</a>
    `);
    markersLayer.addLayer(marker);
    points.push([it.lat, it.lng]);
  }
  if (points.length) {
    mapInstance.fitBounds(points as any, { padding: [40, 40], maxZoom: 12 });
  }
  setTimeout(() => mapInstance.invalidateSize(), 50);
}

// ── 컬렉션 정의 (자동 분류) ─────────────────────────────────────────────────
// 매칭 규칙은 한국어 데이터(name/address)에 의존 — TourAPI 원본 한국어이므로 모든 언어에 동일.
// 라벨만 lang별로 분기.
const COLLECTION_LABELS: Record<Lang, Record<string, { name: string; tagline: string; iconSeason?: string; seasonalName?: string }>> = {
  ko: {
    'this-month': { name: '이번 달 추천', tagline: '{n}월에 즐기기 좋은 곳' },
    family: { name: '가족 여행', tagline: '아이와 함께 가기 좋은' },
    night: { name: '야경 명소', tagline: '밤이 더 아름다운 곳' },
    sea: { name: '바다 여행', tagline: '시원한 바다와 해변' },
    mountain: { name: '산·계곡', tagline: '자연 속 힐링' },
    history: { name: '역사·전통', tagline: '문화와 역사가 깃든' },
    seasonal_spring: { name: '봄꽃', tagline: '계절 한정' },
    seasonal_summer: { name: '여름 휴양', tagline: '계절 한정' },
    seasonal_autumn: { name: '단풍', tagline: '계절 한정' },
    seasonal_winter: { name: '겨울 별빛', tagline: '계절 한정' },
  },
  en: {
    'this-month': { name: 'Picks this month', tagline: 'Best for month {n}' },
    family: { name: 'Family Trip', tagline: 'Great for kids' },
    night: { name: 'Night Views', tagline: 'More beautiful at night' },
    sea: { name: 'By the Sea', tagline: 'Cool seas and beaches' },
    mountain: { name: 'Mountains & Valleys', tagline: 'Healing in nature' },
    history: { name: 'History & Tradition', tagline: 'Where culture meets history' },
    seasonal_spring: { name: 'Spring blossoms', tagline: 'Seasonal pick' },
    seasonal_summer: { name: 'Summer escape', tagline: 'Seasonal pick' },
    seasonal_autumn: { name: 'Autumn foliage', tagline: 'Seasonal pick' },
    seasonal_winter: { name: 'Winter lights', tagline: 'Seasonal pick' },
  },
  ja: {
    'this-month': { name: '今月のおすすめ', tagline: '{n}月におすすめ' },
    family: { name: '家族旅行', tagline: '子どもと楽しめる' },
    night: { name: '夜景スポット', tagline: '夜が美しい場所' },
    sea: { name: '海辺の旅', tagline: '爽やかな海と浜辺' },
    mountain: { name: '山と渓谷', tagline: '自然の中で癒される' },
    history: { name: '歴史と伝統', tagline: '文化と歴史が息づく' },
    seasonal_spring: { name: '春の花', tagline: '季節限定' },
    seasonal_summer: { name: '夏のリゾート', tagline: '季節限定' },
    seasonal_autumn: { name: '紅葉', tagline: '季節限定' },
    seasonal_winter: { name: '冬の灯り', tagline: '季節限定' },
  },
  zh: {
    'this-month': { name: '本月推荐', tagline: '{n}月畅游好去处' },
    family: { name: '亲子游', tagline: '适合带孩子' },
    night: { name: '夜景胜地', tagline: '夜晚更美丽' },
    sea: { name: '海滨之旅', tagline: '清凉海洋与海滩' },
    mountain: { name: '山岳与溪谷', tagline: '在大自然中治愈' },
    history: { name: '历史与传统', tagline: '文化与历史交融' },
    seasonal_spring: { name: '春花', tagline: '季节限定' },
    seasonal_summer: { name: '夏日休闲', tagline: '季节限定' },
    seasonal_autumn: { name: '秋叶', tagline: '季节限定' },
    seasonal_winter: { name: '冬日星光', tagline: '季节限定' },
  },
};

function buildCollections(month: number, lang: Lang): Collection[] {
  // 매칭은 한국어 키워드 (TourAPI 원본 한국어)
  const NIGHT_KEYWORDS = ['야경', '야시장', '나이트', '불꽃', '루미나리에', '라이트페스타', '빛축제'];
  const FAMILY_KEYWORDS = ['놀이공원', '동물원', '수목원', '아쿠아리움', '박물관', '체험농장', '테마파크'];
  const SEA_KEYWORDS = ['해수욕장', '해변', '항구', '해안', '등대', '섬'];
  const MOUNTAIN_KEYWORDS = ['국립공원', '도립공원', '계곡', '폭포', '수목원', '자연휴양림'];
  const TEMPLE_KEYWORDS = ['사', '암', '절', '서원', '향교', '한옥마을', '성', '궁'];
  // 계절별 명확 키워드 (자연/휴양 fallback 제거)
  const SPRING_KEYWORDS = ['벚꽃', '진달래', '철쭉', '매화', '튤립', '유채', '봄꽃'];
  const SUMMER_KEYWORDS = ['해수욕장', '계곡', '워터파크', '수영장', '래프팅', '서핑'];
  const AUTUMN_KEYWORDS = ['단풍', '억새', '갈대', '코스모스', '국화', '핑크뮬리'];
  const WINTER_KEYWORDS = ['눈꽃', '얼음', '빙어', '산천어', '송어', '스키', '온천', '일출'];

  const labels = COLLECTION_LABELS[lang];
  const monthThis = month;
  const seasonKey =
    month >= 3 && month <= 5 ? 'seasonal_spring' :
    month >= 6 && month <= 8 ? 'seasonal_summer' :
    month >= 9 && month <= 11 ? 'seasonal_autumn' : 'seasonal_winter';
  const seasonIcon =
    month >= 3 && month <= 5 ? '🌸' : month >= 6 && month <= 8 ? '🏖️' : month >= 9 && month <= 11 ? '🍁' : '❄️';

  return [
    {
      id: 'this-month',
      icon: '🗓️',
      name: labels['this-month'].name,
      tagline: labels['this-month'].tagline.replace('{n}', String(monthThis)),
      // 축제는 이번 달과 겹치는 것만 / 여행지는 현재 계절 키워드 + 자연/휴양 조합
      match: (it) => {
        if (it.t === 1) {
          if (!it.sd) return false;
          const sm = parseInt(it.sd.slice(4, 6), 10);
          const em = it.ed ? parseInt(it.ed.slice(4, 6), 10) : sm;
          return sm <= monthThis && monthThis <= em;
        }
        // 여행지: 계절 키워드 매칭 (광범위 fallback 제거)
        const seasonKw =
          month >= 3 && month <= 5 ? SPRING_KEYWORDS :
          month >= 6 && month <= 8 ? SUMMER_KEYWORDS :
          month >= 9 && month <= 11 ? AUTUMN_KEYWORDS : WINTER_KEYWORDS;
        return seasonKw.some((k) => it.n.includes(k));
      },
    },
    {
      id: 'family',
      icon: '👨‍👩‍👧',
      name: labels.family.name,
      tagline: labels.family.tagline,
      match: (it) =>
        FAMILY_KEYWORDS.some((k) => it.n.includes(k)) || it.th === '체험',
    },
    {
      id: 'night',
      icon: '🌃',
      name: labels.night.name,
      tagline: labels.night.tagline,
      match: (it) => NIGHT_KEYWORDS.some((k) => it.n.includes(k) || it.a.includes(k)),
    },
    {
      id: 'sea',
      icon: '🌊',
      name: labels.sea.name,
      tagline: labels.sea.tagline,
      match: (it) => SEA_KEYWORDS.some((k) => it.n.includes(k) || it.a.includes(k)),
    },
    {
      id: 'mountain',
      icon: '⛰️',
      name: labels.mountain.name,
      tagline: labels.mountain.tagline,
      match: (it) =>
        MOUNTAIN_KEYWORDS.some((k) => it.n.includes(k) || it.a.includes(k)) ||
        (it.th === '자연' && it.n.match(/[가-힣]산$/) !== null),
    },
    {
      id: 'history',
      icon: '🏛️',
      name: labels.history.name,
      tagline: labels.history.tagline,
      match: (it) =>
        it.th === '역사' ||
        TEMPLE_KEYWORDS.some((k) => it.n.endsWith(k)),
    },
    {
      id: 'seasonal',
      icon: seasonIcon,
      name: labels[seasonKey].name,
      tagline: labels[seasonKey].tagline,
      // 계절별 명확한 키워드만 매칭 (자연/휴양 fallback 제거 → 정확도 ↑)
      match: (it) => {
        const kws =
          month >= 3 && month <= 5 ? SPRING_KEYWORDS :
          month >= 6 && month <= 8 ? SUMMER_KEYWORDS :
          month >= 9 && month <= 11 ? AUTUMN_KEYWORDS : WINTER_KEYWORDS;
        return kws.some((k) => it.n.includes(k) || it.a.includes(k));
      },
    },
  ];
}

// ── 메인 ────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    L: any;
  }
}

export async function initExplorer(rootEl: HTMLElement) {
  // 언어 식별 — Explorer.astro 가 data-lang 속성으로 주입
  const lang = ((rootEl.dataset.lang || 'ko') as Lang);
  const s = STR[lang];

  // DOM 참조
  const $ = <T extends HTMLElement>(sel: string): T | null =>
    rootEl.querySelector(sel) as T | null;
  const filterBar = $('.filter-bar');
  const searchInput = $<HTMLInputElement>('#explore-search');
  const searchClear = $<HTMLButtonElement>('#explore-search-clear');
  const regionChips = $('#explore-region-chips');
  const themeChips = $('#explore-theme-chips');
  const amenityChips = $('#explore-amenity-chips');
  const categoryChips = $('#explore-category-chips');
  const sortSelect = $<HTMLSelectElement>('#explore-sort');
  const favBtn = $<HTMLButtonElement>('#explore-fav-toggle');
  const nearbyBtn = $<HTMLButtonElement>('#explore-nearby-toggle');
  const viewListBtn = $<HTMLButtonElement>('#view-list-btn');
  const viewMapBtn = $<HTMLButtonElement>('#view-map-btn');
  const resetBtn = $<HTMLButtonElement>('#explore-reset');
  const resultCountEl = $('#result-count');
  const cardsEl = $('#explore-cards');
  const mapEl = $<HTMLElement>('#explore-map');
  const emptyEl = $('#explore-empty');
  const loadMoreBtn = $<HTMLButtonElement>('#load-more-btn');
  const collectionsEl = $('#collections-row');
  const acbEl = $('#active-collection-banner');
  const acbIconEl = $('#acb-icon');
  const acbNameEl = $('#acb-name');
  const acbClearEl = $<HTMLButtonElement>('#acb-clear');

  if (!cardsEl) return;

  // 상태 초기화 (URL ?q= 등에서 복원)
  const url = new URL(window.location.href);
  const state: ExploreState = {
    category: (url.searchParams.get('cat') as ExploreState['category']) || 'all',
    region: url.searchParams.get('region') || 'all',
    theme: url.searchParams.get('theme') || 'all',
    search: url.searchParams.get('q') || '',
    sort: (url.searchParams.get('sort') as ExploreState['sort']) || 'default',
    favoritesOnly: url.searchParams.get('fav') === '1',
    userLocation: null,
    view: 'list',
    collection: url.searchParams.get('collection') || null,
    visible: INITIAL_VISIBLE,
    quickDate: (url.searchParams.get('when') as ExploreState['quickDate']) || null,
    month: url.searchParams.get('month') || 'all',
    barrierFree: url.searchParams.get('bf') === '1',
    pet: url.searchParams.get('pet') === '1',
  };

  // 데이터 로드
  let allItems: IndexItem[] = [];
  try {
    const res = await fetch(`${BASE}/index.json`, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
    allItems = await res.json();
  } catch (err) {
    console.error('인덱스 로드 실패:', err);
    if (emptyEl) {
      emptyEl.innerHTML = `<p>${s.leafletFail}</p>`;
      emptyEl.removeAttribute('hidden');
    }
    return;
  }

  const collections = buildCollections(new Date().getMonth() + 1, lang);

  // ── 빠른 날짜 헬퍼 ──────────────────────────────────────────────────────
  function fmtYMD(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  function computeQuickDateRange(key: NonNullable<ExploreState['quickDate']>): { start: string; end: string } | null {
    const today = new Date();
    if (key === 'this-weekend') {
      const dow = today.getDay(); // 0=일 ... 6=토
      const daysToSat = (6 - dow + 7) % 7;
      const sat = new Date(today); sat.setDate(today.getDate() + daysToSat);
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      return { start: fmtYMD(sat), end: fmtYMD(sun) };
    }
    if (key === 'this-week') {
      const dow = today.getDay();
      const daysSinceMon = (dow + 6) % 7;
      const mon = new Date(today); mon.setDate(today.getDate() - daysSinceMon);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start: fmtYMD(mon), end: fmtYMD(sun) };
    }
    if (key === 'next-month') {
      const first = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { start: fmtYMD(first), end: fmtYMD(last) };
    }
    return null;
  }

  // ── 필터링 ────────────────────────────────────────────────────────────────
  function getFiltered(): Array<IndexItem & { _dist?: number }> {
    let result: Array<IndexItem & { _dist?: number }> = allItems;

    // 컬렉션 활성: 다른 필터 일부 무시
    if (state.collection) {
      const c = collections.find((cc) => cc.id === state.collection);
      if (c) result = result.filter(c.match);
    }

    // 카테고리 (전체/여행지/축제)
    if (state.category !== 'all') {
      const target = state.category === 'festival' ? 1 : 0;
      result = result.filter((it) => it.t === target);
    }

    // 빠른 날짜 (festival 카테고리에서만 의미 있음 — 그 외에는 무시)
    if (state.category === 'festival' && state.quickDate) {
      const range = computeQuickDateRange(state.quickDate);
      if (range) {
        result = result.filter(
          (it) => it.sd != null && it.ed != null && it.sd <= range.end && it.ed >= range.start,
        );
      }
    }

    // 월 필터 (festival 카테고리, state.month='1'~'12')
    if (state.category === 'festival' && state.month !== 'all') {
      const m = parseInt(state.month, 10);
      if (m >= 1 && m <= 12) {
        const mPad = String(m).padStart(2, '0');
        result = result.filter((it) => {
          if (!it.sd || !it.ed) return false;
          // 축제 기간(YYYYMMDD)이 해당 월과 겹치면 매치
          const sMonth = parseInt(it.sd.slice(4, 6), 10);
          const eMonth = parseInt(it.ed.slice(4, 6), 10);
          // 같은 해 가정: sMonth <= m <= eMonth, 또는 연말~연초 걸치는 케이스 처리
          if (sMonth <= eMonth) return m >= sMonth && m <= eMonth;
          return m >= sMonth || m <= eMonth;
        });
      }
    }

    // 지역
    if (state.region !== 'all') {
      result = result.filter((it) => it.r === state.region);
    }

    // 테마 (분류)
    if (state.theme !== 'all' && !state.collection) {
      if (state.theme === '_hanok') {
        // 데이터에 '건축' 테마가 없으므로 이름·주소 키워드로 매칭
        const HANOK_KEYWORDS = ['궁', '한옥', '서원', '향교', '성', '탑', '루', '정', '문', '대왕릉', '왕릉', '종묘'];
        result = result.filter((it) =>
          HANOK_KEYWORDS.some((k) => it.n.includes(k) || it.a.includes(k)),
        );
      } else {
        result = result.filter((it) => it.th === state.theme);
      }
    }

    // 무장애(♿)·반려동물(🐾) 동반 가능만
    if (state.barrierFree) result = result.filter((it) => it.bf === 1);
    if (state.pet) result = result.filter((it) => it.pet === 1);

    // 검색 — 원본 한국어 + 외국어 지역명 별칭 매칭
    if (state.search) {
      const q = state.search.toLowerCase().trim();
      // q가 외국어 지역명(또는 한국어 지역명)과 매칭되면 그 areacode 후보 수집
      const aliasAreaCodes = new Set<string>();
      for (const langKey of ['ko', 'en', 'ja', 'zh'] as Lang[]) {
        for (const [code, name] of Object.entries(AREA_NAME[langKey])) {
          if (name.toLowerCase().includes(q)) aliasAreaCodes.add(code);
        }
      }
      result = result.filter(
        (it) =>
          it.n.toLowerCase().includes(q) ||
          it.a.toLowerCase().includes(q) ||
          aliasAreaCodes.has(it.r),
      );
    }

    // 즐겨찾기
    if (state.favoritesOnly) {
      result = result.filter((it) => favorites.has(it.i));
    }

    // 내 주변 — 거리 계산 + 50km 이내 + 거리순
    if (state.userLocation) {
      const loc = state.userLocation;
      result = result
        .map((it) => {
          if (it.lat == null || it.lng == null) return { ...it, _dist: Infinity };
          return { ...it, _dist: haversineKm(loc, { lat: it.lat, lng: it.lng }) };
        })
        .filter((it) => it._dist! <= 50)
        .sort((a, b) => a._dist! - b._dist!);
      return result;
    }

    // 정렬
    if (state.sort === 'name') {
      result = [...result].sort((a, b) => a.n.localeCompare(b.n, 'ko'));
    } else if (state.sort === 'date') {
      result = [...result].sort((a, b) => {
        if (a.sd && b.sd) return a.sd.localeCompare(b.sd);
        if (a.sd) return -1;
        if (b.sd) return 1;
        return 0;
      });
    } else if (state.sort === 'distance' && state.userLocation) {
      const loc = state.userLocation;
      result = [...result].sort((a, b) => {
        const da = a.lat != null && a.lng != null ? haversineKm(loc, { lat: a.lat, lng: a.lng }) : Infinity;
        const db = b.lat != null && b.lng != null ? haversineKm(loc, { lat: b.lat, lng: b.lng }) : Infinity;
        return da - db;
      });
    }
    // default: 입력 순서

    return result;
  }

  // ── URL 동기화 ────────────────────────────────────────────────────────────
  function syncUrl() {
    const params = new URLSearchParams();
    if (state.category !== 'all') params.set('cat', state.category);
    if (state.region !== 'all') params.set('region', state.region);
    if (state.theme !== 'all') params.set('theme', state.theme);
    if (state.search) params.set('q', state.search);
    if (state.sort !== 'default') params.set('sort', state.sort);
    if (state.favoritesOnly) params.set('fav', '1');
    if (state.collection) params.set('collection', state.collection);
    if (state.quickDate) params.set('when', state.quickDate);
    if (state.month !== 'all') params.set('month', state.month);
    if (state.barrierFree) params.set('bf', '1');
    if (state.pet) params.set('pet', '1');
    const s = params.toString();
    const newUrl = window.location.pathname + (s ? '?' + s : '');
    window.history.replaceState(null, '', newUrl);
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  function syncCollectionBanner() {
    if (!acbEl || !acbIconEl || !acbNameEl) return;
    const c = state.collection ? collections.find((cc) => cc.id === state.collection) : null;
    if (c) {
      acbEl.removeAttribute('hidden');
      acbIconEl.textContent = c.icon;
      acbNameEl.textContent = `${c.name} — ${c.tagline}`;
    } else {
      acbEl.setAttribute('hidden', '');
    }
  }

  function syncFilterUI() {
    regionChips?.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('chip-active', (c as HTMLElement).dataset.region === state.region);
    });
    if (sortSelect) sortSelect.value = state.sort;
    if (favBtn) favBtn.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
    if (nearbyBtn) nearbyBtn.setAttribute('aria-pressed', state.userLocation ? 'true' : 'false');
    if (viewListBtn) viewListBtn.setAttribute('aria-selected', state.view === 'list' ? 'true' : 'false');
    if (viewMapBtn) viewMapBtn.setAttribute('aria-selected', state.view === 'map' ? 'true' : 'false');
    if (searchClear) searchClear.hidden = !state.search;

    themeChips?.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('chip-active', (c as HTMLElement).dataset.theme === state.theme);
    });
    amenityChips?.querySelectorAll('.chip').forEach((c) => {
      const a = (c as HTMLElement).dataset.amenity;
      c.classList.toggle('chip-active', (a === 'bf' && state.barrierFree) || (a === 'pet' && state.pet));
    });
    categoryChips?.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('chip-active', (c as HTMLElement).dataset.category === state.category);
    });
    // 빠른 날짜 row: category가 festival일 때만 보임
    const quickRow = rootEl.querySelector<HTMLElement>('#quick-date-row');
    const quickChips = rootEl.querySelector<HTMLElement>('#quick-date-chips');
    if (quickRow) quickRow.hidden = state.category !== 'festival';
    // 월 row: category가 festival일 때만 보임 + 활성 칩 동기화
    const monthRow = rootEl.querySelector<HTMLElement>('#month-row');
    const monthChips = rootEl.querySelector<HTMLElement>('#month-chips');
    if (monthRow) monthRow.hidden = state.category !== 'festival';
    monthChips?.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('chip-active', (c as HTMLElement).dataset.month === state.month);
    });
    quickChips?.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle(
        'chip-active',
        state.category === 'festival' && (c as HTMLElement).dataset.quick === state.quickDate,
      );
    });
    collectionsEl?.querySelectorAll('.collection-card').forEach((c) => {
      c.classList.toggle('is-active', (c as HTMLElement).dataset.collectionId === state.collection);
    });

    // 거리순은 내 주변 활성 시에만
    if (sortSelect) {
      const distOpt = sortSelect.querySelector('option[value="distance"]') as HTMLOptionElement | null;
      if (distOpt) distOpt.disabled = state.userLocation == null;
    }

    const anyActive =
      state.category !== 'all' ||
      state.region !== 'all' ||
      state.theme !== 'all' ||
      !!state.search ||
      state.favoritesOnly ||
      state.userLocation != null ||
      state.collection != null ||
      state.barrierFree ||
      state.pet ||
      state.sort !== 'default';
    if (resetBtn) resetBtn.hidden = !anyActive;
  }

  let cachedFiltered: Array<IndexItem & { _dist?: number }> = [];

  function renderResults() {
    cachedFiltered = getFiltered();
    if (resultCountEl) {
      const num = cachedFiltered.length.toLocaleString(lang === 'ko' ? 'ko-KR' : lang);
      const parts = [s.total, num, s.items].filter(Boolean);
      resultCountEl.textContent = parts.join(' ');
    }

    if (cachedFiltered.length === 0) {
      if (cardsEl) cardsEl.innerHTML = '';
      if (mapEl) mapEl.classList.add('is-hidden');
      if (cardsEl) (cardsEl as HTMLElement).hidden = true;
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      emptyEl?.removeAttribute('hidden');
      return;
    }

    emptyEl?.setAttribute('hidden', '');

    if (state.view === 'map') {
      if (cardsEl) (cardsEl as HTMLElement).hidden = true;
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      if (mapEl) mapEl.classList.remove('is-hidden');
      ensureMap('explore-map').then(() => renderMarkers(cachedFiltered, lang));
    } else {
      if (mapEl) mapEl.classList.add('is-hidden');
      if (cardsEl) {
        (cardsEl as HTMLElement).hidden = false;
        const slice = cachedFiltered.slice(0, state.visible);
        cardsEl.innerHTML = slice.map((it) => cardHtml(it, lang)).join('');
      }
      if (loadMoreBtn) loadMoreBtn.hidden = state.visible >= cachedFiltered.length;
    }
  }

  function update() {
    syncFilterUI();
    syncCollectionBanner();
    renderResults();
    syncUrl();
  }

  // ── 컬렉션 렌더 (한 번) ───────────────────────────────────────────────────
  function renderCollections() {
    if (!collectionsEl) return;
    const locale = lang === 'ko' ? 'ko-KR' : lang;
    const html = collections
      .map((c) => {
        const count = allItems.filter(c.match).length;
        if (count === 0) return '';
        const active = state.collection === c.id ? ' is-active' : '';
        const countStr = `${count.toLocaleString(locale)}${s.placesUnit}`;
        return `
          <button type="button" class="collection-card${active}" data-collection-id="${c.id}">
            <span class="collection-icon" aria-hidden="true">${c.icon}</span>
            <h3 class="collection-name">${escapeHtml(c.name)}</h3>
            <p class="collection-tagline">${escapeHtml(c.tagline)}</p>
            <span class="collection-count">${countStr}</span>
          </button>
        `;
      })
      .join('');
    collectionsEl.innerHTML = html;
  }

  // ── 이벤트 바인딩 ─────────────────────────────────────────────────────────
  searchInput?.addEventListener('input', (e) => {
    const v = (e.target as HTMLInputElement).value;
    state.search = v;
    state.visible = INITIAL_VISIBLE;
    // 짧은 디바운스
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(update, 150);
  });
  let searchDebounce: number | null = null;
  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.search = '';
    state.visible = INITIAL_VISIBLE;
    update();
    searchInput?.focus();
  });

  regionChips?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip || !chip.dataset.region) return;
    state.region = chip.dataset.region;
    state.visible = INITIAL_VISIBLE;
    update();
  });

  themeChips?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip || !chip.dataset.theme) return;
    state.theme = chip.dataset.theme;
    state.visible = INITIAL_VISIBLE;
    update();
  });

  amenityChips?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    const a = chip?.dataset.amenity;
    if (a !== 'bf' && a !== 'pet') return;
    if (a === 'bf') state.barrierFree = !state.barrierFree;
    else state.pet = !state.pet;
    state.visible = INITIAL_VISIBLE;
    update();
  });

  categoryChips?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip || !chip.dataset.category) return;
    state.category = chip.dataset.category as ExploreState['category'];
    // festival 이 아닐 때 quickDate·month는 의미 없음 → 정리
    if (state.category !== 'festival') {
      state.quickDate = null;
      state.month = 'all';
    }
    state.visible = INITIAL_VISIBLE;
    update();
  });

  // 빠른 날짜 칩
  const quickChipsEl = rootEl.querySelector<HTMLElement>('#quick-date-chips');
  quickChipsEl?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip || !chip.dataset.quick) return;
    const key = chip.dataset.quick as NonNullable<ExploreState['quickDate']>;
    // 같은 거 누르면 해제
    state.quickDate = state.quickDate === key ? null : key;
    // 빠른 날짜와 월은 상호 배타 — 둘 중 하나만
    if (state.quickDate) state.month = 'all';
    // festival 카테고리로 자동 전환 (사용 편의)
    if (state.quickDate && state.category !== 'festival') state.category = 'festival';
    state.visible = INITIAL_VISIBLE;
    update();
  });

  // 월 칩
  const monthChipsEl = rootEl.querySelector<HTMLElement>('#month-chips');
  monthChipsEl?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip || chip.dataset.month == null) return;
    state.month = chip.dataset.month;
    // 월 선택 시 빠른 날짜 해제 (상호 배타)
    if (state.month !== 'all') state.quickDate = null;
    state.visible = INITIAL_VISIBLE;
    update();
  });

  sortSelect?.addEventListener('change', (e) => {
    state.sort = (e.target as HTMLSelectElement).value as ExploreState['sort'];
    update();
  });

  favBtn?.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    state.visible = INITIAL_VISIBLE;
    update();
  });

  nearbyBtn?.addEventListener('click', async () => {
    if (state.userLocation) {
      state.userLocation = null;
      update();
      return;
    }
    if (!navigator.geolocation) {
      showToast(s.geoUnsupported);
      return;
    }
    nearbyBtn.classList.add('is-loading');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 60000,
        });
      });
      state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      state.sort = 'distance';
      state.visible = INITIAL_VISIBLE;
      update();
      showToast(s.nearbyApplied);
    } catch (err) {
      console.warn('geolocation 실패:', err);
      showToast(s.geoFailed);
    } finally {
      nearbyBtn.classList.remove('is-loading');
    }
  });

  viewListBtn?.addEventListener('click', () => {
    if (state.view === 'list') return;
    state.view = 'list';
    update();
  });
  viewMapBtn?.addEventListener('click', () => {
    if (state.view === 'map') return;
    state.view = 'map';
    update();
  });

  resetBtn?.addEventListener('click', () => {
    state.category = 'all';
    state.region = 'all';
    state.theme = 'all';
    state.search = '';
    state.sort = 'default';
    state.favoritesOnly = false;
    state.userLocation = null;
    state.collection = null;
    state.quickDate = null;
    state.month = 'all';
    state.barrierFree = false;
    state.pet = false;
    state.visible = INITIAL_VISIBLE;
    if (searchInput) searchInput.value = '';
    update();
  });

  loadMoreBtn?.addEventListener('click', () => {
    state.visible += PAGE_VISIBLE;
    renderResults();
  });

  collectionsEl?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.collection-card');
    if (!card || !card.dataset.collectionId) return;
    const id = card.dataset.collectionId;
    state.collection = state.collection === id ? null : id;
    state.visible = INITIAL_VISIBLE;
    update();
    if (state.collection) {
      cardsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  acbClearEl?.addEventListener('click', () => {
    state.collection = null;
    update();
  });

  // 카드 영역의 ♡ 클릭 위임 (즐겨찾기 토글)
  cardsEl?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.fav-btn');
    if (!btn || !btn.dataset.favId) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.favId;
    if (favorites.has(id)) {
      favorites.delete(id);
      btn.classList.remove('is-active');
      btn.textContent = '♡';
      btn.setAttribute('aria-label', s.favAddTitle);
      btn.setAttribute('title', s.favAddTitle);
      showToast(s.favRemoved);
    } else {
      favorites.add(id);
      btn.classList.add('is-active');
      btn.textContent = '♥';
      btn.setAttribute('aria-label', s.favRemoveTitle);
      btn.setAttribute('title', s.favRemoveTitle);
      showToast(s.favAdded);
    }
    saveFavorites(favorites);
    if (state.favoritesOnly) renderResults();
  });

  // ── 이번 주말 추천 row ────────────────────────────────────────────────────
  function renderWeekendRow() {
    const sectionEl = rootEl.querySelector<HTMLElement>('#weekend-row-section');
    const rowEl = rootEl.querySelector<HTMLElement>('#weekend-row');
    if (!sectionEl || !rowEl) return;
    const weekendRange = computeQuickDateRange('this-weekend');
    if (!weekendRange) {
      sectionEl.hidden = true;
      return;
    }
    // 이번 주말과 겹치는 축제 + 이미지 있는 것 우선 + 시작/끝 우선순위
    type Cand = IndexItem & { _badge?: 'last' | 'start' };
    const cands: Cand[] = [];
    for (const it of allItems) {
      if (it.t !== 1 || !it.sd || !it.ed) continue;
      // 주말과 겹침
      if (!(it.sd <= weekendRange.end && it.ed >= weekendRange.start)) continue;
      let badge: 'last' | 'start' | undefined;
      if (it.ed >= weekendRange.start && it.ed <= weekendRange.end) badge = 'last';
      else if (it.sd >= weekendRange.start && it.sd <= weekendRange.end) badge = 'start';
      cands.push({ ...it, _badge: badge });
    }
    cands.sort((a, b) => {
      const ar = a._badge === 'last' ? 2 : a._badge === 'start' ? 1 : 0;
      const br = b._badge === 'last' ? 2 : b._badge === 'start' ? 1 : 0;
      if (ar !== br) return br - ar;
      const aImg = a.img ? 0 : 1, bImg = b.img ? 0 : 1;
      if (aImg !== bImg) return aImg - bImg;
      return (a.sd || '').localeCompare(b.sd || '');
    });
    const top = cands.slice(0, 10);
    if (top.length === 0) {
      sectionEl.hidden = true;
      return;
    }
    sectionEl.hidden = false;
    const badgeLabel: Record<Lang, { last: string; start: string }> = {
      ko: { last: '🔥 이번 주말 마지막', start: '✨ 이번 주말 시작' },
      en: { last: '🔥 Last weekend', start: '✨ Starting this weekend' },
      ja: { last: '🔥 今週末まで', start: '✨ 今週末スタート' },
      zh: { last: '🔥 本周末结束', start: '✨ 本周末开始' },
    };
    rowEl.innerHTML = top
      .map((it) => {
        const langPrefix = lang === 'ko' ? '' : `/${lang}`;
        const href = `${BASE}${langPrefix}/festival/${it.s}/`;
        const region = AREA_NAME[lang][it.r] || '';
        const dates = formatDateRange(it.sd, it.ed);
        const bHtml = it._badge
          ? `<span class="weekend-badge weekend-badge-${it._badge}">${badgeLabel[lang][it._badge]}</span>`
          : '';
        const imgHtml = it.img
          ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.n)}" loading="lazy" width="220" height="140" />`
          : `<div class="card-image-placeholder" aria-hidden="true">🎆</div>`;
        return `
          <a class="weekend-card" href="${href}">
            <div class="weekend-card-image">${imgHtml}${bHtml}</div>
            <div class="weekend-card-body">
              <h3 class="weekend-card-title">${escapeHtml(it.n)}</h3>
              <p class="weekend-card-meta">${escapeHtml(dates)} · ${escapeHtml(region)}</p>
            </div>
          </a>
        `;
      })
      .join('');
  }

  // 초기 렌더
  renderCollections();
  renderWeekendRow();
  update();

  // URL ?nearby=1 로 진입 시 자동으로 "내 주변" 활성화 (bottom-nav 연동)
  if (url.searchParams.get('nearby') === '1' && !state.userLocation) {
    nearbyBtn?.click();
  }
}

// ── 즐겨찾기 페이지 전용 (단순화 버전) ──────────────────────────────────────
export async function initFavoritesPage(rootEl: HTMLElement) {
  const lang = ((rootEl.dataset.lang || 'ko') as Lang);
  const s = STR[lang];
  const grid = rootEl.querySelector<HTMLElement>('#favorites-grid');
  const empty = rootEl.querySelector<HTMLElement>('#favorites-empty');
  const countEl = rootEl.querySelector<HTMLElement>('#favorites-count');
  if (!grid) return;

  let allItems: IndexItem[] = [];
  try {
    const res = await fetch(`${BASE}/index.json`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('index.json 로드 실패');
    allItems = await res.json();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="muted">${s.leafletFail}</p>`;
    return;
  }

  function render() {
    const items = allItems.filter((it) => favorites.has(it.i));
    if (countEl) {
      const num = items.length.toLocaleString(lang === 'ko' ? 'ko-KR' : lang);
      countEl.textContent = s.items ? `${num}${s.items}` : num;
    }
    if (items.length === 0) {
      grid!.hidden = true;
      empty?.removeAttribute('hidden');
      return;
    }
    empty?.setAttribute('hidden', '');
    grid!.hidden = false;
    grid!.innerHTML = items.map((it) => cardHtml(it, lang)).join('');
  }

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.fav-btn');
    if (!btn || !btn.dataset.favId) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.favId;
    favorites.delete(id);
    saveFavorites(favorites);
    showToast(s.favRemoved);
    render();
  });

  render();
}
