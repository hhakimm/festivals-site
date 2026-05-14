export type Lang = 'ko' | 'en' | 'ja' | 'zh';

export const LANGS: Lang[] = ['ko', 'en', 'ja', 'zh'];

export const LANG_NAMES: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export const t = {
  siteName: { ko: '한국 가볼 만한 곳', en: 'Travel Korea', ja: '韓国旅行', zh: '韩国旅行' },
  siteDesc: {
    ko: '2026 한국의 월별 축제와 지역별 여행지를 한눈에',
    en: 'Korean festivals and attractions, all in one place',
    ja: '韓国の月別フェスティバルと地域別観光地',
    zh: '韩国月度节庆与各地旅游景点',
  },
  attractions: { ko: '여행지', en: 'Attractions', ja: '観光地', zh: '景点' },
  festivals: { ko: '축제', en: 'Festivals', ja: 'フェスティバル', zh: '节庆' },
  region: { ko: '지역', en: 'Region', ja: '地域', zh: '地区' },
  all: { ko: '전체', en: 'All', ja: 'すべて', zh: '全部' },
  nearMe: { ko: '내 주변', en: 'Near me', ja: '近く', zh: '附近' },
  search: { ko: '검색', en: 'Search', ja: '検索', zh: '搜索' },
  total: { ko: '총', en: 'Total', ja: '合計', zh: '共' },
  items: { ko: '개', en: 'items', ja: '件', zh: '个' },
  noResults: {
    ko: '선택한 조건에 맞는 결과가 없습니다',
    en: 'No results match your filters',
    ja: '条件に合う結果がありません',
    zh: '没有符合条件的结果',
  },
  schedule: { ko: '일정', en: 'Schedule', ja: '日程', zh: '日程' },
  address: { ko: '주소', en: 'Address', ja: '住所', zh: '地址' },
  contact: { ko: '연락처', en: 'Contact', ja: '連絡先', zh: '联系方式' },
  map: { ko: '지도', en: 'Map', ja: '地図', zh: '地图' },
  nearbyStay: {
    ko: '주변 숙소',
    en: 'Nearby stays',
    ja: '周辺の宿',
    zh: '附近住宿',
  },
  bookOn: { ko: '예약하기', en: 'Book on', ja: '予約', zh: '预订' },
  newsletterTitle: {
    ko: '이번 주말, 어디 갈래요?',
    en: 'Where to this weekend?',
    ja: '今週末、どこへ?',
    zh: '这周末去哪?',
  },
  newsletterDesc: {
    ko: '매주 금요일, 이번 주말 추천 여행지를 메일로',
    en: 'Weekly picks delivered every Friday',
    ja: '毎週金曜日にお届け',
    zh: '每周五推送',
  },
  subscribe: { ko: '구독하기', en: 'Subscribe', ja: '購読', zh: '订阅' },
  emailPlaceholder: {
    ko: '이메일 주소',
    en: 'Email address',
    ja: 'メールアドレス',
    zh: '邮箱地址',
  },
  backToList: {
    ko: '← 목록으로',
    en: '← Back to list',
    ja: '← 一覧へ',
    zh: '← 返回列表',
  },
  viewAllFestivals: {
    ko: '축제 전체 보기',
    en: 'View all festivals',
    ja: 'フェスティバル一覧',
    zh: '查看全部节庆',
  },
  viewAllAttractions: {
    ko: '여행지 전체 보기',
    en: 'View all attractions',
    ja: '観光地一覧',
    zh: '查看全部景点',
  },
  prev: { ko: '이전', en: 'Prev', ja: '前へ', zh: '上一页' },
  next: { ko: '다음', en: 'Next', ja: '次へ', zh: '下一页' },
  allFestivalsTitle: {
    ko: '전체 축제',
    en: 'All Festivals',
    ja: 'フェスティバル一覧',
    zh: '全部节庆',
  },
  allAttractionsTitle: {
    ko: '전체 여행지',
    en: 'All Attractions',
    ja: '観光地一覧',
    zh: '全部景点',
  },

  // Explorer (홈 통합 인터랙션)
  exploreSearchPlaceholder: {
    ko: '이름·주소로 검색...',
    en: 'Search by name or address...',
    ja: '名前・住所で検索...',
    zh: '按名称或地址搜索...',
  },
  exploreClearSearch: { ko: '검색 지우기', en: 'Clear search', ja: '検索クリア', zh: '清除搜索' },
  exploreCategory: { ko: '카테고리', en: 'Category', ja: 'カテゴリー', zh: '分类' },
  exploreTheme: { ko: '분류', en: 'Type', ja: '分類', zh: '类型' },
  listingAttractionsDesc: {
    ko: '전국의 명소·자연·문화재를 한곳에 모았습니다. 지역·분류·계절별로 좁혀가며 둘러보세요.',
    en: 'Sights, nature, and cultural heritage across Korea — filter by region, type, or season to browse.',
    ja: '韓国全国の観光地·自然·文化財を一覧で。地域·分類·季節で絞り込んで探せます。',
    zh: '汇集全韩国的景点、自然、文化遗产。可按地区、分类、季节筛选浏览。',
  },
  listingFestivalsDesc: {
    ko: '계절별로 열리는 축제·이벤트를 모았어요. 이번 주말·이번 달 진행 중인 축제를 빠르게 찾을 수 있습니다.',
    en: 'Seasonal festivals and events. Quickly find what\'s running this weekend or this month.',
    ja: '季節ごとのフェスティバル·イベント。今週末·今月開催中の祭りを素早く探せます。',
    zh: '应季节庆和活动一览。可快速查找本周末·本月在办的活动。',
  },
  supportCoffee: {
    ko: '커피 한 잔 후원',
    en: 'Buy me a coffee',
    ja: 'コーヒー一杯支援',
    zh: '请喝杯咖啡',
  },
  pwaInstallText: {
    ko: '앱처럼 설치하고 오프라인에서도 보세요',
    en: 'Install as app, browse offline',
    ja: 'アプリのようにインストール、オフラインでも閲覧',
    zh: '像APP一样安装,离线也能浏览',
  },
  pwaInstallBtn: {
    ko: '설치',
    en: 'Install',
    ja: 'インストール',
    zh: '安装',
  },
  cookieConsentText: {
    ko: '이 사이트는 광고 표시·방문 통계를 위해 쿠키를 사용합니다.',
    en: 'This site uses cookies for ads and analytics.',
    ja: '当サイトは広告表示・アクセス解析のためにクッキーを使用します。',
    zh: '本网站使用 Cookie 用于广告显示和访问统计。',
  },
  cookieConsentMore: {
    ko: ' 자세히',
    en: ' Learn more',
    ja: ' 詳細',
    zh: ' 了解更多',
  },
  cookieConsentAccept: {
    ko: '동의',
    en: 'Accept',
    ja: '同意',
    zh: '同意',
  },
  cookieConsentReject: {
    ko: '거부',
    en: 'Reject',
    ja: '拒否',
    zh: '拒绝',
  },
  notFoundTitle: {
    ko: '404 — 페이지를 찾을 수 없어요',
    en: '404 — Page not found',
    ja: '404 — ページが見つかりません',
    zh: '404 — 找不到页面',
  },
  notFoundDesc: {
    ko: '주소가 잘못됐거나, 페이지가 이동·삭제됐을 수 있어요. 아래에서 다시 시작해 보세요.',
    en: 'The URL may be wrong, or the page was moved or removed. Try starting from below.',
    ja: 'URLが間違っているか、ページが移動·削除された可能性があります。下から再開してみてください。',
    zh: 'URL可能错误,或页面已移动·删除。请从下方重新开始。',
  },
  notFoundHome: {
    ko: '홈으로',
    en: 'Home',
    ja: 'ホーム',
    zh: '首页',
  },
  exploreSort: { ko: '정렬', en: 'Sort', ja: '並べ替え', zh: '排序' },
  exploreView: { ko: '보기 방식', en: 'View', ja: '表示', zh: '视图' },
  exploreFilters: { ko: '필터', en: 'Filters', ja: 'フィルター', zh: '筛选' },
  exploreReset: { ko: '초기화', en: 'Reset', ja: 'リセット', zh: '重置' },
  exploreEmpty: {
    ko: '선택한 조건에 맞는 결과가 없습니다.',
    en: 'No results match your filters.',
    ja: '条件に合う結果がありません。',
    zh: '没有符合条件的结果。',
  },
  exploreEmptyHint: {
    ko: '필터를 줄이거나 다른 지역·테마를 선택해 보세요.',
    en: 'Try fewer filters or a different region/theme.',
    ja: 'フィルターを減らすか、別の地域・テーマをお試しください。',
    zh: '请减少筛选条件或尝试其他地区/主题。',
  },
  exploreLoadMore: { ko: '더 보기', en: 'Load more', ja: 'もっと見る', zh: '加载更多' },
  exploreCollections: {
    ko: '✨ 큐레이션',
    en: '✨ Curated picks',
    ja: '✨ キュレーション',
    zh: '✨ 精选合集',
  },
  weekendTitle: {
    ko: '🎯 이번 주말 추천',
    en: '🎯 This Weekend',
    ja: '🎯 今週末のおすすめ',
    zh: '🎯 本周末推荐',
  },
  exploreQuick: {
    ko: '빠른',
    en: 'Quick',
    ja: 'クイック',
    zh: '快速',
  },
  filterMonth: {
    ko: '월',
    en: 'Month',
    ja: '月',
    zh: '月份',
  },
  monthShort: {
    ko: '{n}월',
    en: '{n}',
    ja: '{n}月',
    zh: '{n}月',
  },
  quickThisWeekend: {
    ko: '이번 주말',
    en: 'This weekend',
    ja: '今週末',
    zh: '本周末',
  },
  quickThisWeek: {
    ko: '이번 주',
    en: 'This week',
    ja: '今週',
    zh: '本周',
  },
  quickNextMonth: {
    ko: '다음 달',
    en: 'Next month',
    ja: '来月',
    zh: '下月',
  },
  scrollTop: {
    ko: '맨 위로',
    en: 'Back to top',
    ja: '一番上へ',
    zh: '回到顶部',
  },
  // 모바일 bottom-nav 라벨 (favoritesShort, nearby는 이미 있음)
  bnAttractions: { ko: '여행지', en: 'Trips', ja: '観光地', zh: '景点' },
  bnFestivals: { ko: '축제', en: 'Festivals', ja: 'お祭り', zh: '节庆' },
  bnQuiz: { ko: '테스트', en: 'Quiz', ja: 'テスト', zh: '测试' },
  navQuizShort: { ko: '성향 테스트', en: 'Travel Quiz', ja: '性向テスト', zh: '性格测试' },
  // 카테고리 / 테마 / 정렬 옵션 라벨
  catAll: { ko: '전체', en: 'All', ja: 'すべて', zh: '全部' },
  catAttraction: { ko: '🗺️ 여행지', en: '🗺️ Attractions', ja: '🗺️ 観光地', zh: '🗺️ 景点' },
  catFestival: { ko: '🎆 축제', en: '🎆 Festivals', ja: '🎆 フェスティバル', zh: '🎆 节庆' },
  themeNature: { ko: '🌳 자연', en: '🌳 Nature', ja: '🌳 自然', zh: '🌳 自然' },
  themeHistory: { ko: '🏛️ 역사', en: '🏛️ History', ja: '🏛️ 歴史', zh: '🏛️ 历史' },
  themeRelax: { ko: '♨️ 휴양', en: '♨️ Relaxation', ja: '♨️ 休養', zh: '♨️ 休闲' },
  themeExperience: { ko: '🎢 체험', en: '🎢 Experience', ja: '🎢 体験', zh: '🎢 体验' },
  themeArchitecture: { ko: '🏯 궁궐·한옥', en: '🏯 Palaces & Hanok', ja: '🏯 宮殿·韓屋', zh: '🏯 宫殿·韩屋' },
  sortDefault: { ko: '기본순', en: 'Default', ja: 'おすすめ', zh: '默认' },
  sortName: { ko: '이름순', en: 'Name', ja: '名前順', zh: '名称' },
  sortDate: { ko: '시작일순', en: 'Start date', ja: '開始日順', zh: '开始日期' },
  sortDistance: { ko: '거리순', en: 'Distance', ja: '距離順', zh: '距离' },
  viewList: { ko: '목록', en: 'List', ja: 'リスト', zh: '列表' },
  viewMap: { ko: '지도', en: 'Map', ja: '地図', zh: '地图' },
  favoritesShort: { ko: '즐겨찾기', en: 'Favorites', ja: 'お気に入り', zh: '收藏' },
  nearby: { ko: '내 주변', en: 'Near me', ja: '近く', zh: '附近' },
  // 토스트/알림
  toastFavAdded: {
    ko: '즐겨찾기에 추가됨',
    en: 'Added to favorites',
    ja: 'お気に入りに追加',
    zh: '已添加到收藏',
  },
  toastFavRemoved: {
    ko: '즐겨찾기에서 해제됨',
    en: 'Removed from favorites',
    ja: 'お気に入りから削除',
    zh: '已从收藏移除',
  },
  toastNearbyApplied: {
    ko: '반경 50km 이내로 필터링했습니다',
    en: 'Filtered to within 50 km radius',
    ja: '半径50km以内でフィルタリングしました',
    zh: '已筛选到 50 公里以内',
  },
  toastGeoUnsupported: {
    ko: '이 브라우저는 위치 정보를 지원하지 않습니다',
    en: 'This browser does not support geolocation',
    ja: 'このブラウザは位置情報に対応していません',
    zh: '此浏览器不支持位置信息',
  },
  toastGeoFailed: {
    ko: '위치를 가져올 수 없습니다 (권한 확인)',
    en: 'Could not get location (check permissions)',
    ja: '位置情報を取得できません (権限を確認)',
    zh: '无法获取位置 (请检查权限)',
  },
  // (total, items 키는 위 사전에 이미 정의됨 — 재사용)
  // 즐겨찾기 페이지
  favoritesPageTitle: { ko: '내 즐겨찾기', en: 'My Favorites', ja: 'お気に入り', zh: '我的收藏' },
  favoritesPageSaved: { ko: '저장한 곳', en: 'Saved places', ja: '保存した場所', zh: '已保存' },
  favoritesPageEmpty: {
    ko: '아직 즐겨찾기에 저장한 곳이 없습니다.',
    en: 'No favorites saved yet.',
    ja: 'まだお気に入りに保存した場所がありません。',
    zh: '尚未收藏任何地点。',
  },
  favoritesPageEmptyHint: {
    ko: '카드의 ♡ 버튼을 눌러 저장해 보세요.',
    en: 'Tap the ♡ on any card to save it.',
    ja: 'カードの♡ボタンで保存できます。',
    zh: '点击卡片上的 ♡ 按钮以保存。',
  },
  favoritesPageBrowse: {
    ko: '둘러보러 가기',
    en: 'Start exploring',
    ja: '探しに行く',
    zh: '开始探索',
  },
  // 컬렉션 이름 (7종)
  colThisMonth: { ko: '이번 달 추천', en: 'Picks this month', ja: '今月のおすすめ', zh: '本月推荐' },
  colThisMonthTagline: {
    ko: '{n}월에 즐기기 좋은 곳',
    en: 'Best for month {n}',
    ja: '{n}月におすすめ',
    zh: '{n}月畅游好去处',
  },
  colFamily: { ko: '가족 여행', en: 'Family Trip', ja: '家族旅行', zh: '亲子游' },
  colFamilyTagline: {
    ko: '아이와 함께 가기 좋은',
    en: 'Great for kids',
    ja: '子どもと楽しめる',
    zh: '适合带孩子',
  },
  colNight: { ko: '야경 명소', en: 'Night Views', ja: '夜景スポット', zh: '夜景胜地' },
  colNightTagline: {
    ko: '밤이 더 아름다운 곳',
    en: 'More beautiful at night',
    ja: '夜が美しい場所',
    zh: '夜晚更美丽',
  },
  colSea: { ko: '바다 여행', en: 'By the Sea', ja: '海辺の旅', zh: '海滨之旅' },
  colSeaTagline: {
    ko: '시원한 바다와 해변',
    en: 'Cool seas and beaches',
    ja: '爽やかな海と浜辺',
    zh: '清凉海洋与海滩',
  },
  colMountain: { ko: '산·계곡', en: 'Mountains & Valleys', ja: '山と渓谷', zh: '山岳与溪谷' },
  colMountainTagline: {
    ko: '자연 속 힐링',
    en: 'Healing in nature',
    ja: '自然の中で癒される',
    zh: '在大自然中治愈',
  },
  colHistory: { ko: '역사·전통', en: 'History & Tradition', ja: '歴史と伝統', zh: '历史与传统' },
  colHistoryTagline: {
    ko: '문화와 역사가 깃든',
    en: 'Where culture meets history',
    ja: '文化と歴史が息づく',
    zh: '文化与历史交融',
  },
  colSeasonal: {
    ko_spring: '봄꽃', ko_summer: '여름 휴양', ko_autumn: '단풍', ko_winter: '겨울 별빛',
    en_spring: 'Spring blossoms', en_summer: 'Summer escape', en_autumn: 'Autumn foliage', en_winter: 'Winter lights',
    ja_spring: '春の花', ja_summer: '夏のリゾート', ja_autumn: '紅葉', ja_winter: '冬の灯り',
    zh_spring: '春花', zh_summer: '夏日休闲', zh_autumn: '秋叶', zh_winter: '冬日星光',
  } as Record<string, string>,
  colSeasonalTagline: { ko: '계절 한정', en: 'Seasonal pick', ja: '季節限定', zh: '季节限定' },
  // FAB / 보조
  collectionRelease: { ko: '컬렉션 해제', en: 'Clear collection', ja: 'コレクション解除', zh: '取消精选' },
  exploreFooterNote: {
    ko: '필터를 사용하지 않을 때 모든 데이터가 표시됩니다. 데이터: TourAPI 4.0 · 지도: OpenStreetMap',
    en: 'All data shown when no filters applied. Data: TourAPI 4.0 · Map: OpenStreetMap',
    ja: 'フィルター未使用時は全データを表示。データ: TourAPI 4.0 · 地図: OpenStreetMap',
    zh: '未应用筛选时显示全部数据。数据：TourAPI 4.0 · 地图：OpenStreetMap',
  },
  goAllFestivals: {
    ko: '전체 축제 페이지로 →',
    en: 'All festivals page →',
    ja: 'フェスティバル一覧 →',
    zh: '全部节庆 →',
  },
  goAllAttractions: {
    ko: '전체 여행지 페이지로 →',
    en: 'All attractions page →',
    ja: '観光地一覧 →',
    zh: '全部景点 →',
  },
  myFavoritesLink: {
    ko: '♥ 내 즐겨찾기',
    en: '♥ My Favorites',
    ja: '♥ お気に入り',
    zh: '♥ 我的收藏',
  },
  heroPlacesPrefix: {
    ko: '🇰🇷 전국',
    en: '🇰🇷 Korea',
    ja: '🇰🇷 韓国全国',
    zh: '🇰🇷 全韩国',
  },
  heroPlacesSuffix: { ko: '곳', en: 'places', ja: 'スポット', zh: '处' },

  // ─── 정책/소개 페이지 ──────────────────────────────────────────────────
  navAbout: { ko: '소개', en: 'About', ja: 'サイトについて', zh: '关于' },
  navPrivacy: { ko: '개인정보처리방침', en: 'Privacy', ja: 'プライバシー', zh: '隐私政策' },
  navTerms: { ko: '이용약관', en: 'Terms', ja: '利用規約', zh: '使用条款' },
  navContact: { ko: '문의', en: 'Contact', ja: 'お問い合わせ', zh: '联系' },
  // 광고/제휴 안내
  adDisclaimerShort: {
    ko: '※ 본 사이트는 제휴 마케팅을 통해 일정 수수료를 받을 수 있습니다.',
    en: '※ As an affiliate partner, this site may earn a commission from qualifying purchases.',
    ja: '※ 当サイトはアフィリエイトプログラムにより収益を得る場合があります。',
    zh: '※ 本网站可能通过联盟营销获取一定佣金。',
  },
  adLabel: { ko: '광고', en: 'Ad', ja: '広告', zh: '广告' },
  // About 페이지 본문
  aboutTitle: {
    ko: '소개 — 한국 가볼 만한 곳',
    en: 'About — Travel Korea',
    ja: 'サイトについて — 韓国旅行',
    zh: '关于 — 韩国旅行',
  },
  aboutBody: {
    ko: '<p>「한국 가볼 만한 곳」은 한국관광공사 TourAPI 데이터를 기반으로 전국의 여행지와 월별 축제를 한눈에 보여주는 무료 안내 사이트입니다.</p><p>여행 계획을 세우는 한국인과 외국인 여행자 모두를 위해 한국어·영어·일본어·중국어를 지원하며, 지역·테마·날짜·내 주변 등 다양한 방식으로 탐색할 수 있도록 설계했습니다.</p><p>본 사이트는 검색 엔진(Google)과 어필리에이트 파트너(Agoda·Booking·Yanolja·KKday·Skyscanner 등)를 통해 운영비를 충당하며, 사용자에게 추가 비용을 청구하지 않습니다.</p><h2>운영자 정보 / Contact</h2><p>이 사이트는 개인 개발자가 운영하는 비영리성 안내 사이트입니다.</p><ul><li>문의·제안·오류 신고: <a href="https://github.com/hhakimm/festivals-site/issues" target="_blank" rel="noopener">GitHub Issues</a></li><li>저장소: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></li><li>데이터 갱신: 매일 새벽 자동 (한국관광공사 TourAPI)</li><li>운영 시작: 2026년</li></ul><p class="muted" style="font-size:0.85rem">※ 일정·운영시간·요금 등은 변동될 수 있으니 방문 전 공식사이트에서 확인해 주세요.</p>',
    en: '<p>"Travel Korea" is a free guide site that helps both Koreans and international travelers discover attractions and monthly festivals across South Korea, powered by Korea Tourism Organization (KTO) TourAPI data.</p><p>Available in Korean, English, Japanese, and Chinese, the site is designed for region, theme, date, and "near me" exploration.</p><p>The site is supported by display advertising (Google) and travel affiliate programs (Agoda, Booking, Yanolja, KKday, Skyscanner, etc.). There is no charge to users.</p><h2>About the operator / Contact</h2><p>This is a non-commercial guide site run by an individual developer.</p><ul><li>Inquiries / suggestions / bug reports: <a href="https://github.com/hhakimm/festivals-site/issues" target="_blank" rel="noopener">GitHub Issues</a></li><li>Repository: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></li><li>Data refresh: daily, automatic (KTO TourAPI)</li><li>Launched: 2026</li></ul><p class="muted" style="font-size:0.85rem">※ Schedules, hours, and fees may change. Please verify on official sites before visiting.</p>',
    ja: '<p>「韓国旅行」は、韓国観光公社のTourAPIデータをもとに、韓国全国の観光地と月別フェスティバルを紹介する無料ガイドサイトです。</p><p>韓国語・英語・日本語・中国語に対応し、地域・テーマ・日付・現在地などから探索できます。</p><p>サイト運営は広告(Google)および旅行アフィリエイト(Agoda、Booking、Yanolja、KKday、Skyscanner など)に支えられており、利用は無料です。</p><h2>運営者情報 / お問い合わせ</h2><p>個人開発者が運営する非営利のガイドサイトです。</p><ul><li>お問い合わせ・ご提案・不具合報告: <a href="https://github.com/hhakimm/festivals-site/issues" target="_blank" rel="noopener">GitHub Issues</a></li><li>リポジトリ: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></li><li>データ更新: 毎日自動(韓国観光公社 TourAPI)</li><li>運営開始: 2026年</li></ul><p class="muted" style="font-size:0.85rem">※ 日程·営業時間·料金は変動する場合があります。訪問前に公式サイトでご確認ください。</p>',
    zh: '<p>"韩国旅行"是一个免费指南网站,基于韩国观光公社 TourAPI 数据,介绍韩国全国的旅游景点和每月节庆。</p><p>支持中文、韩语、英语、日语,可按地区、主题、日期、附近等多种方式探索。</p><p>本网站通过广告(Google)及旅行联盟营销(Agoda、Booking、Yanolja、KKday、Skyscanner 等)运营,免费使用。</p><h2>运营者信息 / 联系</h2><p>由个人开发者运营的非商业指南网站。</p><ul><li>咨询·建议·错误报告: <a href="https://github.com/hhakimm/festivals-site/issues" target="_blank" rel="noopener">GitHub Issues</a></li><li>仓库: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></li><li>数据更新: 每日自动(韩国观光公社 TourAPI)</li><li>启动: 2026 年</li></ul><p class="muted" style="font-size:0.85rem">※ 日程·营业时间·费用可能变动,访问前请到官方网站确认。</p>',
  },
  // Privacy 페이지 본문
  privacyTitle: {
    ko: '개인정보처리방침',
    en: 'Privacy Policy',
    ja: 'プライバシーポリシー',
    zh: '隐私政策',
  },
  privacyBody: {
    ko: '<h2>1. 수집하는 정보</h2><p>본 사이트는 회원가입을 받지 않으며, 개인을 식별할 수 있는 정보(이름·이메일·전화번호 등)를 직접 수집하지 않습니다.</p><h2>2. 자동으로 수집되는 정보</h2><p>방문 통계 분석을 위해 Google Analytics를 사용합니다. Google은 쿠키를 통해 익명화된 방문 정보(IP·브라우저·페이지 이동)를 수집합니다.</p><p>광고 표시를 위해 Google AdSense를 사용합니다. Google 및 광고 파트너는 사용자의 관심사 기반 광고 제공을 위해 쿠키를 사용할 수 있습니다.</p><h2>3. localStorage</h2><p>즐겨찾기 기능은 사용자 기기의 브라우저 localStorage에만 저장되며 서버로 전송되지 않습니다.</p><h2>4. 외부 링크</h2><p>본 사이트는 호텔·숙소 어필리에이트 링크(Agoda·Booking·Yanolja 등)를 포함합니다. 외부 링크 클릭 시 해당 사이트의 개인정보처리방침이 적용됩니다.</p><h2>5. 쿠키 거부</h2><p>브라우저 설정에서 쿠키를 거부할 수 있습니다. <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics 옵트아웃</a> · <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google 광고 설정</a></p><h2>6. 문의</h2><p>개인정보 관련 문의는 GitHub Issues로 부탁드립니다: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></p>',
    en: '<h2>1. Information We Collect</h2><p>This site does not require registration and does not directly collect personally identifiable information (name, email, phone, etc.).</p><h2>2. Automatically Collected Data</h2><p>We use Google Analytics for visitor statistics. Google uses cookies to collect anonymized data (IP, browser, page navigation).</p><p>We use Google AdSense for ads. Google and partners may use cookies to deliver interest-based advertising.</p><h2>3. localStorage</h2><p>The favorites feature stores data in your browser\'s localStorage only and is never sent to any server.</p><h2>4. External Links</h2><p>This site includes hotel/accommodation affiliate links (Agoda, Booking, Yanolja, etc.). When you click an external link, that site\'s privacy policy applies.</p><h2>5. Opting Out</h2><p>You can disable cookies in your browser settings. <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out</a> · <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google Ad Settings</a></p><h2>6. Contact</h2><p>For privacy inquiries, please open an issue on GitHub: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></p>',
    ja: '<h2>1. 収集する情報</h2><p>当サイトは会員登録を必要とせず、個人を特定できる情報(氏名・メール・電話番号など)を直接収集しません。</p><h2>2. 自動的に収集される情報</h2><p>訪問者統計分析のためGoogle Analyticsを使用します。Googleはクッキーを通じて匿名化された情報(IP・ブラウザ・ページ遷移)を収集します。</p><p>広告表示のためGoogle AdSenseを使用します。Google および広告パートナーは興味関心連動型広告のためクッキーを使用する場合があります。</p><h2>3. localStorage</h2><p>お気に入り機能はユーザー端末のブラウザのlocalStorageにのみ保存され、サーバーには送信されません。</p><h2>4. 外部リンク</h2><p>当サイトはホテル・宿泊のアフィリエイトリンク(Agoda・Booking・Yanoljaなど)を含みます。外部リンククリック時はそのサイトのプライバシーポリシーが適用されます。</p><h2>5. クッキーの拒否</h2><p>ブラウザ設定でクッキーを拒否できます。<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analyticsオプトアウト</a> · <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google広告設定</a></p><h2>6. お問い合わせ</h2><p>プライバシーに関するお問い合わせはGitHub Issuesでお願いします: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></p>',
    zh: '<h2>1. 收集的信息</h2><p>本网站不需要注册,不直接收集可识别个人身份的信息(姓名、邮箱、电话等)。</p><h2>2. 自动收集的信息</h2><p>使用 Google Analytics 进行访问统计分析。Google 通过 Cookie 收集匿名信息(IP、浏览器、页面跳转)。</p><p>使用 Google AdSense 显示广告。Google 及广告合作伙伴可能使用 Cookie 提供基于兴趣的广告。</p><h2>3. localStorage</h2><p>收藏功能仅保存在用户设备浏览器的 localStorage 中,不会发送到任何服务器。</p><h2>4. 外部链接</h2><p>本网站包含酒店/住宿联盟链接(Agoda、Booking、Yanolja 等)。点击外部链接时,适用该网站的隐私政策。</p><h2>5. 拒绝 Cookie</h2><p>可在浏览器设置中拒绝 Cookie。<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics 选择退出</a> · <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google 广告设置</a></p><h2>6. 联系</h2><p>隐私相关咨询请通过 GitHub Issues 联系: <a href="https://github.com/hhakimm/festivals-site" target="_blank" rel="noopener">github.com/hhakimm/festivals-site</a></p>',
  },
  // Terms 페이지 본문
  termsTitle: { ko: '이용약관', en: 'Terms of Use', ja: '利用規約', zh: '使用条款' },
  termsBody: {
    ko: '<h2>1. 서비스 개요</h2><p>본 사이트는 한국관광공사 TourAPI 데이터를 가공하여 무료로 제공하는 비공식 여행 안내 서비스입니다.</p><h2>2. 데이터의 정확성</h2><p>축제 일정·운영 시간·요금 등 정보는 공공데이터 및 외부 소스를 그대로 표시하며, 변경될 수 있습니다. 방문 전 반드시 공식 홈페이지에서 최종 확인해 주십시오. 본 사이트는 정보의 정확성·완전성을 보장하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</p><h2>3. 어필리에이트·광고</h2><p>본 사이트는 호텔·숙소 예약 어필리에이트 링크(Agoda·Booking·Yanolja 등) 및 Google AdSense 광고를 표시합니다. 사용자가 어필리에이트 링크를 통해 예약 시 사이트 운영자에게 일정 수수료가 지급될 수 있으나, 사용자에게 추가 비용은 발생하지 않습니다.</p><h2>4. 저작권</h2><p>여행지·축제 사진 및 일부 텍스트는 한국관광공사가 제공하는 자료를 사용합니다. 사이트의 디자인·코드 저작권은 운영자에게 있으며 GitHub에서 오픈소스로 공개됩니다.</p><h2>5. 약관 변경</h2><p>본 약관은 사전 고지 없이 변경될 수 있습니다. 변경 사항은 본 페이지에 게시됩니다.</p>',
    en: '<h2>1. Service Overview</h2><p>This site is an unofficial travel guide service that processes and provides free access to Korea Tourism Organization (KTO) TourAPI data.</p><h2>2. Data Accuracy</h2><p>Festival schedules, operating hours, fees, and other information are displayed as provided by public data sources and may change. Please verify with the official site before visiting. This site does not guarantee accuracy or completeness and is not liable for any resulting damages.</p><h2>3. Affiliate & Advertising</h2><p>This site displays hotel/accommodation affiliate links (Agoda, Booking, Yanolja, etc.) and Google AdSense ads. The site operator may receive a commission when users book via affiliate links, but no extra cost is charged to users.</p><h2>4. Copyright</h2><p>Photos and some text for attractions and festivals are sourced from KTO. Site design and code copyright belongs to the operator and is published as open source on GitHub.</p><h2>5. Changes to Terms</h2><p>These terms may change without notice. Changes will be posted on this page.</p>',
    ja: '<h2>1. サービス概要</h2><p>当サイトは韓国観光公社のTourAPIデータを加工し、無料で提供する非公式の旅行ガイドサービスです。</p><h2>2. データの正確性</h2><p>フェスティバル日程・営業時間・料金などの情報は公的データを表示しており、変更される場合があります。訪問前に必ず公式サイトで最終確認をお願いします。当サイトは情報の正確性・完全性を保証せず、これにより生じた損害に責任を負いません。</p><h2>3. アフィリエイト・広告</h2><p>当サイトはホテル・宿泊予約アフィリエイトリンク(Agoda・Booking・Yanoljaなど)およびGoogle AdSense広告を表示します。ユーザーがアフィリエイトリンク経由で予約すると、サイト運営者に手数料が支払われる場合がありますが、ユーザーに追加費用は発生しません。</p><h2>4. 著作権</h2><p>観光地・フェスティバルの写真および一部テキストは韓国観光公社の資料を使用しています。サイトのデザイン・コードの著作権は運営者にあり、GitHubでオープンソースとして公開されています。</p><h2>5. 規約の変更</h2><p>本規約は事前の告知なく変更される場合があります。変更事項は本ページに掲示されます。</p>',
    zh: '<h2>1. 服务概述</h2><p>本网站是基于韩国观光公社 TourAPI 数据加工提供的免费非官方旅游指南服务。</p><h2>2. 数据准确性</h2><p>节庆日程、营业时间、费用等信息按公共数据原样显示,可能发生变化。访问前请务必在官方网站确认。本网站不保证信息的准确性、完整性,对由此造成的损失不承担责任。</p><h2>3. 联盟营销与广告</h2><p>本网站显示酒店/住宿预订联盟链接(Agoda、Booking、Yanolja 等)及 Google AdSense 广告。用户通过联盟链接预订时,网站运营者可能获得佣金,但不会向用户收取额外费用。</p><h2>4. 版权</h2><p>景点、节庆的照片及部分文本使用韩国观光公社提供的资料。网站设计与代码版权归运营者所有,已在 GitHub 以开源形式公开。</p><h2>5. 条款变更</h2><p>本条款可能在不另行通知的情况下变更。变更事项将在本页公布。</p>',
  },
  contactInfo: {
    ko: '📧 문의 / 광고 / 제휴: GitHub Issues로 연락해 주세요 — https://github.com/hhakimm/festivals-site',
    en: '📧 Contact / Advertising / Partnership: Please open a GitHub Issue — https://github.com/hhakimm/festivals-site',
    ja: '📧 お問い合わせ / 広告 / 提携: GitHub Issuesからご連絡ください — https://github.com/hhakimm/festivals-site',
    zh: '📧 联系 / 广告 / 合作: 请通过 GitHub Issues 联系 — https://github.com/hhakimm/festivals-site',
  },
};

export function tr(key: keyof typeof t, lang: Lang): string {
  const entry = t[key] as Record<string, string>;
  return entry[lang] ?? entry.ko ?? String(key);
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function seasonalCollectionName(lang: Lang, season: Season): string {
  return t.colSeasonal[`${lang}_${season}`] ?? t.colSeasonal[`ko_${season}`];
}
