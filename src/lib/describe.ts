/**
 * 자동 description / 다국어 보조 표시.
 * TourAPI 원본 데이터에 description 필드가 없어 클라이언트/SSR에서 즉시 생성.
 *
 * 외국어 페이지에서는 title·address의 핵심 키워드를 매핑해서 보조 라벨 추가.
 * (예) "북한산국립공원" + 영어 페이지 → "Bukhansan National Park" 보조 표기
 */

import type { Lang } from './i18n';
import { AREA_CODE, type Item } from './data';

// ──────────────────────────────────────────
// 1. 자동 description (4언어)
// ──────────────────────────────────────────
const THEME_LABEL: Record<string, Record<Lang, string>> = {
  '자연':   { ko: '자연 명소',     en: 'nature spot',          ja: '自然スポット',      zh: '自然景点' },
  '역사':   { ko: '역사·문화 유적', en: 'history & culture',   ja: '歴史·文化遺産',     zh: '历史文化遗迹' },
  '휴양':   { ko: '휴양·관광 명소', en: 'leisure spot',         ja: '休養スポット',      zh: '休闲景点' },
  '체험':   { ko: '체험 명소',     en: 'experience spot',     ja: '体験スポット',      zh: '体验景点' },
};

const FESTIVAL_WORD: Record<Lang, string> = {
  ko: '축제', en: 'festival', ja: 'フェスティバル', zh: '节庆',
};
const ATTRACTION_WORD: Record<Lang, string> = {
  ko: '여행지', en: 'attraction', ja: '観光地', zh: '景点',
};

export function autoDescribe(item: Item, lang: Lang): string {
  const region = AREA_CODE[item.areacode]?.[lang] || '';
  const themeKo = (item.theme as keyof typeof THEME_LABEL) || '';
  const themeLabel = THEME_LABEL[themeKo]?.[lang] || (item.type === 'festival' ? FESTIVAL_WORD[lang] : ATTRACTION_WORD[lang]);
  const noun = item.type === 'festival' ? FESTIVAL_WORD[lang] : ATTRACTION_WORD[lang];

  // 축제는 일정도 짧게 포함
  let dateBit = '';
  if (item.startDate && item.type === 'festival') {
    const y = item.startDate.slice(0, 4);
    const m = item.startDate.slice(4, 6);
    if (lang === 'ko') dateBit = ` · ${y}.${m}월 진행`;
    else if (lang === 'en') dateBit = ` · ${y}-${m}`;
    else if (lang === 'ja') dateBit = ` · ${y}年${m}月`;
    else dateBit = ` · ${y}年${m}月`;
  }

  switch (lang) {
    case 'ko': return `${region}의 ${themeLabel}${item.type === 'festival' ? '' : ''}${dateBit}`;
    case 'en': return `A ${themeLabel} in ${region}${dateBit}`;
    case 'ja': return `${region}の${themeLabel}${dateBit}`;
    case 'zh': return `${region}的${themeLabel}${dateBit}`;
  }
  return '';
}

// ──────────────────────────────────────────
// 2. 키워드 매핑 (외국어 보조 표기용)
// ──────────────────────────────────────────
type KwMap = Record<Lang, string>;
const KW: Array<{ ko: RegExp; map: KwMap }> = [
  { ko: /국립공원$/, map: { ko: '', en: ' (National Park)',     ja: ' (国立公園)',    zh: ' (国立公园)' } },
  { ko: /도립공원$/, map: { ko: '', en: ' (Provincial Park)',   ja: ' (道立公園)',    zh: ' (道立公园)' } },
  { ko: /자연휴양림$/, map: { ko: '', en: ' (Forest Park)',     ja: ' (自然休養林)',  zh: ' (自然休养林)' } },
  { ko: /수목원$/,   map: { ko: '', en: ' (Arboretum)',         ja: ' (樹木園)',      zh: ' (植物园)' } },
  { ko: /식물원$/,   map: { ko: '', en: ' (Botanical Garden)',  ja: ' (植物園)',      zh: ' (植物园)' } },
  { ko: /해수욕장$/, map: { ko: '', en: ' (Beach)',             ja: ' (海水浴場)',    zh: ' (海水浴场)' } },
  { ko: /해변$/,     map: { ko: '', en: ' (Beach)',             ja: ' (ビーチ)',      zh: ' (海滩)' } },
  { ko: /폭포$/,     map: { ko: '', en: ' (Falls)',             ja: ' (滝)',          zh: ' (瀑布)' } },
  { ko: /계곡$/,     map: { ko: '', en: ' (Valley)',            ja: ' (渓谷)',        zh: ' (溪谷)' } },
  { ko: /동굴$/,     map: { ko: '', en: ' (Cave)',              ja: ' (洞窟)',        zh: ' (洞窟)' } },
  { ko: /시장$/,     map: { ko: '', en: ' (Market)',            ja: ' (市場)',        zh: ' (市场)' } },
  { ko: /박물관$/,   map: { ko: '', en: ' (Museum)',            ja: ' (博物館)',      zh: ' (博物馆)' } },
  { ko: /미술관$/,   map: { ko: '', en: ' (Art Museum)',        ja: ' (美術館)',      zh: ' (美术馆)' } },
  { ko: /타워$/,     map: { ko: '', en: ' (Tower)',             ja: ' (タワー)',      zh: ' (塔)' } },
  { ko: /궁$/,       map: { ko: '', en: ' Palace',              ja: ' 宮',           zh: ' 宫' } },
  { ko: /한옥마을$/, map: { ko: '', en: ' (Hanok Village)',     ja: ' (韓屋村)',      zh: ' (韩屋村)' } },
  { ko: /민속촌$/,   map: { ko: '', en: ' (Folk Village)',      ja: ' (民俗村)',      zh: ' (民俗村)' } },
  { ko: /도자공원$/, map: { ko: '', en: ' (Ceramic Park)',      ja: ' (陶磁器公園)',  zh: ' (陶瓷公园)' } },
  { ko: /수목원$/,   map: { ko: '', en: ' (Arboretum)',         ja: ' (樹木園)',      zh: ' (植物园)' } },
  { ko: /케이블카$/, map: { ko: '', en: ' (Cable Car)',         ja: ' (ケーブルカー)', zh: ' (缆车)' } },
  { ko: /전망대$/,   map: { ko: '', en: ' (Observatory)',       ja: ' (展望台)',      zh: ' (观景台)' } },
  { ko: /온천$/,     map: { ko: '', en: ' (Hot Springs)',       ja: ' (温泉)',        zh: ' (温泉)' } },
  { ko: /사찰$|^.+사$/, map: { ko: '', en: ' Temple',           ja: ' 寺',           zh: ' 寺' } },
  { ko: /왕릉$/,     map: { ko: '', en: ' Royal Tomb',          ja: ' 王陵',         zh: ' 王陵' } },
];

/** 외국어일 때 title 뒤에 키워드 영문/일/중 보조 표기 추가
 *  ko 페이지에선 빈 문자열 반환 (변경 없음). */
export function nameSuffix(title: string, lang: Lang): string {
  if (lang === 'ko') return '';
  for (const k of KW) {
    if (k.ko.test(title)) {
      const m = k.map[lang];
      if (m && m.length > 0) return m;
    }
  }
  return '';
}

// ──────────────────────────────────────────
// 3. 외국어 주소 짧게 (도시명 + region in lang)
// ──────────────────────────────────────────
export function shortAddress(item: Item, lang: Lang): string {
  if (lang === 'ko') return item.address || '';
  const region = AREA_CODE[item.areacode]?.[lang] || '';
  // address에서 '구/시/군' 단위 단어 빼내기 (단순)
  const m = item.address?.match(/\s(\S+[시군구])\s/);
  const city = m ? m[1] : '';
  // city 번역 시도 (영문 매핑 없으면 그냥 region만)
  if (region && city) return `${city}, ${region}`;
  return region || (item.address || '');
}
