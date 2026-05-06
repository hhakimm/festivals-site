// 다국어 — UI 라벨 번역. 장소 이름·설명은 한국어 데이터 그대로.
// 지원: 한국어(ko, 기본), English(en), 日本語(ja), 中文(zh)

const STRINGS = {
  ko: {
    'site.subtitle': '2026 월별 축제와 지역별 여행지를 한눈에',
    'tab.festivals': '2026 축제',
    'tab.places': '여행지',
    'filter.month': '월',
    'filter.region': '지역',
    'filter.theme': '테마',
    'filter.all': '전체',
    'filter.reset': '필터 초기화',
    'filter.filters': '필터',
    'filter.search.placeholder': '이름·지역으로 검색…',
    'view.list': '목록',
    'view.map': '지도',
    'meta.favorites': '즐겨찾기',
    'meta.nearby': '내 주변',
    'bn.festivals': '축제',
    'bn.places': '여행지',
    'bn.favorites': '즐겨찾기',
    'bn.nearby': '내 주변',
    'sort.default': '기본순',
    'sort.name': '이름순',
    'sort.date': '시작일순',
    'count.festivals': '총 {n}개의 축제',
    'count.places': '총 {n}개의 여행지',
    'weekend.title': '이번 주말',
    'weekend.viewAll': '전체 보기 →',
    'collections.title': '테마 컬렉션',
    'modal.officialSite': '공식사이트 가기',
    'modal.share': '↗ 공유',
    'modal.fav.add': '즐겨찾기',
    'modal.fav.remove': '즐겨찾기 해제',
    'empty.text': '선택한 조건에 맞는 축제가 없습니다.',
    'error.text': '데이터를 불러오지 못했습니다. 새로고침해 주세요.',
    'toast.shareCopied': '링크가 복사되었습니다',
    'toast.favAdded': '즐겨찾기에 추가됨',
    'toast.favRemoved': '즐겨찾기에서 해제됨',
    'toast.nearbyOn': '반경 50km 이내로 필터링했습니다',
    'toast.geoFail': '위치를 가져올 수 없습니다. 권한을 확인해 주세요',
    'footer.notice': '일정은 변동될 수 있으니 공식사이트에서 확인해 주세요.',
    'footer.source': '자료',
    'lang.note': '*장소 정보는 한국어로 제공됩니다',
  },
  en: {
    'site.subtitle': 'Korea\'s 2026 festivals and travel destinations at a glance',
    'tab.festivals': '2026 Festivals',
    'tab.places': 'Places',
    'filter.month': 'Month',
    'filter.region': 'Region',
    'filter.theme': 'Theme',
    'filter.all': 'All',
    'filter.reset': 'Reset filters',
    'filter.filters': 'Filters',
    'filter.search.placeholder': 'Search by name or region…',
    'view.list': 'List',
    'view.map': 'Map',
    'meta.favorites': 'Favorites',
    'meta.nearby': 'Near me',
    'bn.festivals': 'Festivals',
    'bn.places': 'Places',
    'bn.favorites': 'Saved',
    'bn.nearby': 'Nearby',
    'sort.default': 'Default',
    'sort.name': 'By name',
    'sort.date': 'By start date',
    'count.festivals': '{n} festivals',
    'count.places': '{n} places',
    'weekend.title': 'This weekend',
    'weekend.viewAll': 'View all →',
    'collections.title': 'Themed collections',
    'modal.officialSite': 'Official website',
    'modal.share': '↗ Share',
    'modal.fav.add': 'Save',
    'modal.fav.remove': 'Saved',
    'empty.text': 'No items match your filters.',
    'error.text': 'Failed to load data. Please refresh.',
    'toast.shareCopied': 'Link copied to clipboard',
    'toast.favAdded': 'Added to favorites',
    'toast.favRemoved': 'Removed from favorites',
    'toast.nearbyOn': 'Filtered to within 50 km',
    'toast.geoFail': 'Could not get location. Check permissions.',
    'footer.notice': 'Dates may change. Verify on official websites.',
    'footer.source': 'Data',
    'lang.note': '*Place details are in Korean',
  },
  ja: {
    'site.subtitle': '2026年 韓国の月別祭りと地域別観光地',
    'tab.festivals': '2026 祭り',
    'tab.places': '観光地',
    'filter.month': '月',
    'filter.region': '地域',
    'filter.theme': 'テーマ',
    'filter.all': '全て',
    'filter.reset': 'リセット',
    'filter.filters': 'フィルター',
    'filter.search.placeholder': '名前・地域で検索…',
    'view.list': 'リスト',
    'view.map': '地図',
    'meta.favorites': 'お気に入り',
    'meta.nearby': '現在地周辺',
    'bn.festivals': '祭り',
    'bn.places': '観光地',
    'bn.favorites': 'お気に入り',
    'bn.nearby': '周辺',
    'sort.default': 'デフォルト',
    'sort.name': '名前順',
    'sort.date': '開始日順',
    'count.festivals': '祭り {n}件',
    'count.places': '観光地 {n}件',
    'weekend.title': '今週末',
    'weekend.viewAll': '全て見る →',
    'collections.title': 'テーマコレクション',
    'modal.officialSite': '公式サイト',
    'modal.share': '↗ 共有',
    'modal.fav.add': '保存',
    'modal.fav.remove': '保存済み',
    'empty.text': '条件に一致する項目がありません。',
    'error.text': 'データを読み込めません。再読み込みしてください。',
    'toast.shareCopied': 'リンクをコピーしました',
    'toast.favAdded': 'お気に入りに追加',
    'toast.favRemoved': 'お気に入りから削除',
    'toast.nearbyOn': '50km以内に絞り込みました',
    'toast.geoFail': '位置情報を取得できません。権限を確認してください。',
    'footer.notice': '日程は変更される場合があります。公式サイトで確認してください。',
    'footer.source': '出典',
    'lang.note': '*詳細情報は韓国語のみ',
  },
  zh: {
    'site.subtitle': '2026年韩国月度节日和地区旅游目的地一览',
    'tab.festivals': '2026 节日',
    'tab.places': '景点',
    'filter.month': '月份',
    'filter.region': '地区',
    'filter.theme': '主题',
    'filter.all': '全部',
    'filter.reset': '重置筛选',
    'filter.filters': '筛选',
    'filter.search.placeholder': '按名称或地区搜索…',
    'view.list': '列表',
    'view.map': '地图',
    'meta.favorites': '收藏',
    'meta.nearby': '附近',
    'bn.festivals': '节日',
    'bn.places': '景点',
    'bn.favorites': '收藏',
    'bn.nearby': '附近',
    'sort.default': '默认',
    'sort.name': '按名称',
    'sort.date': '按开始日期',
    'count.festivals': '共 {n} 个节日',
    'count.places': '共 {n} 个景点',
    'weekend.title': '本周末',
    'weekend.viewAll': '查看全部 →',
    'collections.title': '主题集合',
    'modal.officialSite': '官方网站',
    'modal.share': '↗ 分享',
    'modal.fav.add': '收藏',
    'modal.fav.remove': '已收藏',
    'empty.text': '没有符合条件的项目。',
    'error.text': '加载失败,请刷新。',
    'toast.shareCopied': '链接已复制',
    'toast.favAdded': '已添加到收藏',
    'toast.favRemoved': '已从收藏移除',
    'toast.nearbyOn': '已筛选至50公里内',
    'toast.geoFail': '无法获取位置,请检查权限。',
    'footer.notice': '日期可能变动,请到官方网站确认。',
    'footer.source': '资料',
    'lang.note': '*景点详细信息仅韩语提供',
  },
};

const KEY = 'lang-v1';

let currentLang = (() => {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && STRINGS[stored]) return stored;
  } catch {}
  // 브라우저 언어 자동 감지
  const nav = (navigator.language || 'ko').toLowerCase();
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('zh')) return 'zh';
  return 'ko';
})();

export function getLang() { return currentLang; }

export function setLang(lang) {
  if (!STRINGS[lang]) return;
  currentLang = lang;
  try { localStorage.setItem(KEY, lang); } catch {}
  document.documentElement.lang = lang;
  applyTranslations();
}

export function t(key, vars = {}) {
  let s = STRINGS[currentLang]?.[key] ?? STRINGS.ko[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(`{${k}}`, v);
  }
  return s;
}

// data-i18n="key" 가 붙은 모든 요소의 textContent를 갱신
// data-i18n-attr="placeholder:key,aria-label:key2" 식으로 속성 번역도 가능
export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}
