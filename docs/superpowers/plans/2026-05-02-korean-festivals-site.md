# 한국 축제 캘린더 사이트 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국 국내 축제를 월별·지역별로 탐색할 수 있는 정적 웹사이트를 구축한다.

**Architecture:** 빌드 도구 없는 정적 사이트 — `index.html` + 분리된 ES 모듈 (`filter.js`, `url-sync.js`, `modal.js`, `app.js`) + `festivals.json` 데이터. 필터 로직과 URL 동기화는 순수 함수로 작성해 `node --test`로 단위 테스트.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES modules), Node.js (테스트 러너 용도만)

**작업 디렉토리:** `C:/Users/김하권/OneDrive/Desktop/클로드코드/festivals-site/`
모든 경로는 이 디렉토리 기준 상대 경로로 표기.

**참고 명세:** [docs/superpowers/specs/2026-05-02-korean-festivals-site-design.md](../specs/2026-05-02-korean-festivals-site-design.md)

---

## File Structure

```
festivals-site/
├── index.html              # 단일 진입점, 시멘틱 마크업
├── package.json            # type: module, test 스크립트만
├── .gitignore
├── css/
│   └── style.css           # 전체 스타일 (base/필터/카드/모달)
├── js/
│   ├── app.js              # 메인 — fetch, 렌더링, 이벤트 바인딩
│   ├── filter.js           # 순수 함수: 월/지역/카테고리 필터
│   ├── url-sync.js         # 순수 함수: URL 쿼리 ↔ 상태
│   └── modal.js            # 모달 열기/닫기/렌더링
├── data/
│   └── festivals.json      # 축제 데이터
├── tests/
│   ├── filter.test.js
│   └── url-sync.test.js
└── docs/
    └── superpowers/
        ├── specs/2026-05-02-korean-festivals-site-design.md
        └── plans/2026-05-02-korean-festivals-site.md
```

**책임 분리:**
- `filter.js` — DOM/네트워크 의존 없음, 순수 함수만 → 단위 테스트
- `url-sync.js` — `URLSearchParams` 만 사용, 파싱/직렬화 → 단위 테스트
- `modal.js` — DOM 조작 (모달 한정)
- `app.js` — 상위 조립자: 데이터 fetch, 위 모듈 호출, 카드 렌더링

---

### Task 1: 프로젝트 스캐폴드와 git 초기화

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html` (빈 파일)
- Create: `css/style.css` (빈 파일)
- Create: `js/app.js` (빈 파일)
- Create: `js/filter.js` (빈 파일)
- Create: `js/url-sync.js` (빈 파일)
- Create: `js/modal.js` (빈 파일)
- Create: `data/festivals.json` (빈 배열 `[]`)
- Create: `tests/filter.test.js` (빈 파일)
- Create: `tests/url-sync.test.js` (빈 파일)

- [ ] **Step 1: 디렉토리 구조 생성**

```bash
cd C:/Users/김하권/OneDrive/Desktop/클로드코드/festivals-site
mkdir -p css js data tests
```

- [ ] **Step 2: `package.json` 작성**

```json
{
  "name": "festivals-site",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 3: `.gitignore` 작성**

```
node_modules/
.DS_Store
*.log
.vscode/
```

- [ ] **Step 4: 빈 소스 파일 생성**

```bash
touch index.html css/style.css js/app.js js/filter.js js/url-sync.js js/modal.js tests/filter.test.js tests/url-sync.test.js
echo "[]" > data/festivals.json
```

- [ ] **Step 5: git 초기화 + 초기 커밋**

```bash
cd C:/Users/김하권/OneDrive/Desktop/클로드코드/festivals-site
git init
git add .
git commit -m "chore: scaffold festivals-site project structure"
```

Expected: `git log` 한 개 커밋 표시.

---

### Task 2: filter.js — 월 필터 (TDD)

**Files:**
- Modify: `js/filter.js`
- Modify: `tests/filter.test.js`

축제의 시작일~종료일 기간이 선택한 월을 단 하루라도 포함하면 일치로 간주. 연도를 가로지르는 축제(예: 12/30 — 1/3)도 처리.

- [ ] **Step 1: 테스트 작성 — `monthsCovered` 와 `isInMonth`**

`tests/filter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthsCovered, isInMonth } from '../js/filter.js';

test('monthsCovered: same month festival', () => {
  const f = { startDate: '2026-05-10', endDate: '2026-05-15' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [5]);
});

test('monthsCovered: spans two months', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [3, 4]);
});

test('monthsCovered: spans three months', () => {
  const f = { startDate: '2026-06-15', endDate: '2026-08-05' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [6, 7, 8]);
});

test('monthsCovered: wraps year boundary', () => {
  const f = { startDate: '2026-12-30', endDate: '2027-01-03' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [1, 12]);
});

test('isInMonth: matches included month', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.equal(isInMonth(f, 3), true);
  assert.equal(isInMonth(f, 4), true);
});

test('isInMonth: rejects excluded month', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.equal(isInMonth(f, 5), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd C:/Users/김하권/OneDrive/Desktop/클로드코드/festivals-site
npm test
```

Expected: FAIL — `monthsCovered`, `isInMonth` 정의 안 됨.

- [ ] **Step 3: 구현 작성**

`js/filter.js`:

```js
export function monthsCovered(festival) {
  const [sy, sm] = festival.startDate.split('-').map(Number);
  const [ey, em] = festival.endDate.split('-').map(Number);
  const months = new Set();
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.add(m);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

export function isInMonth(festival, month) {
  return monthsCovered(festival).has(month);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: 6 tests pass.

- [ ] **Step 5: 커밋**

```bash
git add js/filter.js tests/filter.test.js
git commit -m "feat(filter): add month filter with year-wrap support"
```

---

### Task 3: filter.js — 지역/카테고리 필터와 다중 결합 (TDD)

**Files:**
- Modify: `js/filter.js`
- Modify: `tests/filter.test.js`

- [ ] **Step 1: 테스트 추가**

`tests/filter.test.js` 끝에 추가:

```js
import { matchesRegion, matchesCategory, applyFilters } from '../js/filter.js';

test('matchesRegion: exact match', () => {
  const f = { region: '경상남도' };
  assert.equal(matchesRegion(f, '경상남도'), true);
  assert.equal(matchesRegion(f, '경상북도'), false);
});

test('matchesRegion: null filter matches all', () => {
  const f = { region: '경상남도' };
  assert.equal(matchesRegion(f, null), true);
});

test('matchesCategory: exact match', () => {
  const f = { category: '꽃' };
  assert.equal(matchesCategory(f, '꽃'), true);
  assert.equal(matchesCategory(f, '음식'), false);
});

test('matchesCategory: null filter matches all', () => {
  const f = { category: '꽃' };
  assert.equal(matchesCategory(f, null), true);
});

test('applyFilters: combines all filters with AND', () => {
  const festivals = [
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
    { id: 'b', startDate: '2026-05-10', endDate: '2026-05-15', region: '경상남도', category: '꽃' },
    { id: 'c', startDate: '2026-06-01', endDate: '2026-06-05', region: '경상남도', category: '꽃' },
  ];
  const result = applyFilters(festivals, { month: 5, region: '경상남도', category: null });
  assert.deepEqual(result.map(f => f.id), ['b']);
});

test('applyFilters: no filters returns all', () => {
  const festivals = [
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
    { id: 'b', startDate: '2026-06-01', endDate: '2026-06-05', region: '경상남도', category: '꽃' },
  ];
  const result = applyFilters(festivals, { month: null, region: null, category: null });
  assert.deepEqual(result.map(f => f.id), ['a', 'b']);
});

test('applyFilters: result sorted by startDate ascending', () => {
  const festivals = [
    { id: 'b', startDate: '2026-05-10', endDate: '2026-05-15', region: '경상남도', category: '꽃' },
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
  ];
  const result = applyFilters(festivals, { month: 5, region: null, category: null });
  assert.deepEqual(result.map(f => f.id), ['a', 'b']);
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: 새로 추가된 테스트 FAIL.

- [ ] **Step 3: 구현 추가**

`js/filter.js` 끝에 추가:

```js
export function matchesRegion(festival, region) {
  if (region == null) return true;
  return festival.region === region;
}

export function matchesCategory(festival, category) {
  if (category == null) return true;
  return festival.category === category;
}

export function applyFilters(festivals, { month, region, category }) {
  return festivals
    .filter(f => (month == null || isInMonth(f, month)))
    .filter(f => matchesRegion(f, region))
    .filter(f => matchesCategory(f, category))
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 통과.

- [ ] **Step 5: 커밋**

```bash
git add js/filter.js tests/filter.test.js
git commit -m "feat(filter): add region/category filters and AND combinator"
```

---

### Task 4: url-sync.js — 쿼리 파싱과 직렬화 (TDD)

**Files:**
- Modify: `js/url-sync.js`
- Modify: `tests/url-sync.test.js`

- [ ] **Step 1: 테스트 작성**

`tests/url-sync.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, serializeState } from '../js/url-sync.js';

test('parseQuery: empty string returns empty state', () => {
  assert.deepEqual(parseQuery(''), { month: null, region: null, category: null, festival: null });
});

test('parseQuery: month only', () => {
  assert.deepEqual(parseQuery('?month=5'), { month: 5, region: null, category: null, festival: null });
});

test('parseQuery: all fields', () => {
  const q = '?month=5&region=' + encodeURIComponent('경상남도') + '&category=' + encodeURIComponent('꽃') + '&festival=jinhae';
  assert.deepEqual(parseQuery(q), { month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' });
});

test('parseQuery: invalid month ignored', () => {
  assert.equal(parseQuery('?month=abc').month, null);
  assert.equal(parseQuery('?month=13').month, null);
  assert.equal(parseQuery('?month=0').month, null);
});

test('parseQuery: leading "?" optional', () => {
  assert.deepEqual(parseQuery('month=5'), { month: 5, region: null, category: null, festival: null });
});

test('serializeState: empty state returns ""', () => {
  assert.equal(serializeState({ month: null, region: null, category: null, festival: null }), '');
});

test('serializeState: only set fields included', () => {
  const result = serializeState({ month: 5, region: null, category: '꽃', festival: null });
  // 순서는 month -> region -> category -> festival
  assert.equal(result, '?month=5&category=' + encodeURIComponent('꽃'));
});

test('serializeState: all fields', () => {
  const result = serializeState({ month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' });
  assert.equal(
    result,
    '?month=5&region=' + encodeURIComponent('경상남도') +
    '&category=' + encodeURIComponent('꽃') +
    '&festival=jinhae'
  );
});

test('round-trip: parseQuery(serializeState(s)) === s', () => {
  const state = { month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' };
  assert.deepEqual(parseQuery(serializeState(state)), state);
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: url-sync 테스트 FAIL.

- [ ] **Step 3: 구현 작성**

`js/url-sync.js`:

```js
export function parseQuery(queryString) {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const monthRaw = params.get('month');
  const monthNum = monthRaw == null ? NaN : Number(monthRaw);
  const month = Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12 ? monthNum : null;

  return {
    month,
    region: params.get('region'),
    category: params.get('category'),
    festival: params.get('festival'),
  };
}

export function serializeState(state) {
  const params = new URLSearchParams();
  if (state.month != null) params.set('month', String(state.month));
  if (state.region != null) params.set('region', state.region);
  if (state.category != null) params.set('category', state.category);
  if (state.festival != null) params.set('festival', state.festival);
  const s = params.toString();
  return s ? '?' + s : '';
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 통과.

- [ ] **Step 5: 커밋**

```bash
git add js/url-sync.js tests/url-sync.test.js
git commit -m "feat(url-sync): add query parsing and state serialization"
```

---

### Task 5: 축제 데이터 시드 (festivals.json)

**Files:**
- Modify: `data/festivals.json`

명세 §11에 따라 30개 축제로 시작 (카테고리/지역/월 균형 있게). 60~80개 목표는 추후 확장. 모든 항목은 `id`, `name`, `region`, `city`, `startDate`, `endDate`, `category`, `description`, `image`, `officialUrl` 필수 필드 포함.

이미지는 외부 URL(공식사이트나 위키미디어 공용 이미지) 사용. 검증된 출처가 없으면 `images/placeholder.svg`를 가리키게 두고 후속 작업으로 보완. (placeholder.svg는 Task 15에서 생성.)

- [ ] **Step 1: 데이터 작성**

`data/festivals.json`:

```json
[
  {
    "id": "jinhae-gunhangje-2026",
    "name": "진해 군항제",
    "region": "경상남도",
    "city": "창원시 진해구",
    "startDate": "2026-03-25",
    "endDate": "2026-04-03",
    "category": "꽃",
    "description": "벚꽃이 만개한 진해 일대에서 열리는 한국 대표 봄 축제. 군항 행사와 거리 퍼레이드가 특징.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://gunhang.changwon.go.kr/"
  },
  {
    "id": "gurye-sansuyu-2026",
    "name": "구례 산수유꽃축제",
    "region": "전라남도",
    "city": "구례군",
    "startDate": "2026-03-14",
    "endDate": "2026-03-22",
    "category": "꽃",
    "description": "노란 산수유 군락이 펼쳐지는 지리산 자락의 봄 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.gurye.go.kr/"
  },
  {
    "id": "hampyeong-butterfly-2026",
    "name": "함평 나비축제",
    "region": "전라남도",
    "city": "함평군",
    "startDate": "2026-04-24",
    "endDate": "2026-05-06",
    "category": "꽃",
    "description": "수만 마리 나비와 봄꽃이 어우러지는 친환경 생태 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.hampyeong.go.kr/"
  },
  {
    "id": "goyang-flower-2026",
    "name": "고양 국제꽃박람회",
    "region": "경기도",
    "city": "고양시",
    "startDate": "2026-04-24",
    "endDate": "2026-05-10",
    "category": "꽃",
    "description": "호수공원을 가득 채운 세계 각국의 꽃과 정원 전시.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.flower.or.kr/"
  },
  {
    "id": "yeongdeungpo-cherry-2026",
    "name": "영등포 여의도 봄꽃축제",
    "region": "서울특별시",
    "city": "영등포구",
    "startDate": "2026-04-04",
    "endDate": "2026-04-12",
    "category": "꽃",
    "description": "여의서로 윤중로의 벚꽃길을 따라 펼쳐지는 도심 봄축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.ydp.go.kr/"
  },
  {
    "id": "boryeong-mud-2026",
    "name": "보령 머드축제",
    "region": "충청남도",
    "city": "보령시",
    "startDate": "2026-07-17",
    "endDate": "2026-07-26",
    "category": "음식",
    "description": "대천해수욕장에서 열리는 진흙 체험형 여름 축제. 해외 여행객에게 가장 잘 알려진 축제 중 하나.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.mudfestival.or.kr/"
  },
  {
    "id": "boseong-tea-2026",
    "name": "보성 다향대축제",
    "region": "전라남도",
    "city": "보성군",
    "startDate": "2026-05-01",
    "endDate": "2026-05-05",
    "category": "음식",
    "description": "초록빛 차밭에서 즐기는 차 시음과 다양한 차 문화 행사.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.boseong.go.kr/"
  },
  {
    "id": "ganggyeong-jeotgal-2026",
    "name": "강경 젓갈축제",
    "region": "충청남도",
    "city": "논산시",
    "startDate": "2026-10-14",
    "endDate": "2026-10-18",
    "category": "음식",
    "description": "전국 최대 젓갈 시장에서 열리는 짭짤한 가을 미식 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.nonsan.go.kr/"
  },
  {
    "id": "gwangyang-maehwa-2026",
    "name": "광양 매화축제",
    "region": "전라남도",
    "city": "광양시",
    "startDate": "2026-03-13",
    "endDate": "2026-03-22",
    "category": "꽃",
    "description": "섬진강변 매화마을이 하얗게 물드는 이른 봄의 풍경.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.gwangyang.go.kr/"
  },
  {
    "id": "busan-fireworks-2026",
    "name": "부산 불꽃축제",
    "region": "부산광역시",
    "city": "수영구",
    "startDate": "2026-11-07",
    "endDate": "2026-11-07",
    "category": "불꽃",
    "description": "광안리 앞바다와 광안대교를 배경으로 펼쳐지는 한국 최대 규모의 불꽃 쇼.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.bff.or.kr/"
  },
  {
    "id": "pohang-fireworks-2026",
    "name": "포항 국제불빛축제",
    "region": "경상북도",
    "city": "포항시",
    "startDate": "2026-05-29",
    "endDate": "2026-05-31",
    "category": "불꽃",
    "description": "영일대 해수욕장을 무대로 한 한여름밤의 불꽃과 빛 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.phlf.or.kr/"
  },
  {
    "id": "seoul-fireworks-2026",
    "name": "서울세계불꽃축제",
    "region": "서울특별시",
    "city": "영등포구",
    "startDate": "2026-10-03",
    "endDate": "2026-10-03",
    "category": "불꽃",
    "description": "여의도 한강공원에서 열리는 국제 불꽃 경연.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.hanwhafireworks.com/"
  },
  {
    "id": "gangneung-danoje-2026",
    "name": "강릉 단오제",
    "region": "강원특별자치도",
    "city": "강릉시",
    "startDate": "2026-06-17",
    "endDate": "2026-06-24",
    "category": "전통",
    "description": "유네스코 인류무형문화유산으로 등재된 천년 전통의 단오 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.danojefestival.or.kr/"
  },
  {
    "id": "andong-mask-2026",
    "name": "안동 국제탈춤페스티벌",
    "region": "경상북도",
    "city": "안동시",
    "startDate": "2026-09-25",
    "endDate": "2026-10-04",
    "category": "전통",
    "description": "전 세계의 탈과 춤이 모이는 안동의 가을 대표 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.maskdance.com/"
  },
  {
    "id": "jeonju-bibimbap-2026",
    "name": "전주비빔밥축제",
    "region": "전북특별자치도",
    "city": "전주시",
    "startDate": "2026-10-15",
    "endDate": "2026-10-18",
    "category": "음식",
    "description": "전주 한옥마을에서 열리는 비빔밥과 한식 미식 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.bibimbapfest.com/"
  },
  {
    "id": "hwacheon-sancheoneo-2026",
    "name": "화천 산천어축제",
    "region": "강원특별자치도",
    "city": "화천군",
    "startDate": "2026-01-03",
    "endDate": "2026-01-25",
    "category": "겨울",
    "description": "얼음 위에서 즐기는 산천어 낚시와 다양한 겨울 체험.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.narafestival.com/"
  },
  {
    "id": "taebaeksan-snow-2026",
    "name": "태백산 눈축제",
    "region": "강원특별자치도",
    "city": "태백시",
    "startDate": "2026-01-23",
    "endDate": "2026-02-01",
    "category": "겨울",
    "description": "눈 조각 전시와 눈썰매 체험이 어우러지는 고원 도시의 겨울 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://festival.taebaek.go.kr/"
  },
  {
    "id": "jarasum-jazz-2026",
    "name": "자라섬 재즈페스티벌",
    "region": "경기도",
    "city": "가평군",
    "startDate": "2026-10-09",
    "endDate": "2026-10-11",
    "category": "음악",
    "description": "북한강 자라섬에서 펼쳐지는 한국 최대 규모의 재즈 페스티벌.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.jarasumjazz.com/"
  },
  {
    "id": "incheon-pentaport-2026",
    "name": "인천 펜타포트 록페스티벌",
    "region": "인천광역시",
    "city": "송도",
    "startDate": "2026-08-07",
    "endDate": "2026-08-09",
    "category": "음악",
    "description": "한국 록 페스티벌의 대표 주자, 송도 달빛축제공원.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.pentaportrock.com/"
  },
  {
    "id": "ulsan-whale-2026",
    "name": "울산 고래축제",
    "region": "울산광역시",
    "city": "남구",
    "startDate": "2026-06-04",
    "endDate": "2026-06-07",
    "category": "문화",
    "description": "장생포 고래문화마을을 중심으로 한 해양 생태 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.whalefestival.kr/"
  },
  {
    "id": "jinju-yudeung-2026",
    "name": "진주 남강유등축제",
    "region": "경상남도",
    "city": "진주시",
    "startDate": "2026-10-01",
    "endDate": "2026-10-15",
    "category": "전통",
    "description": "남강에 띄우는 형형색색의 유등이 만들어내는 가을밤의 절경.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.yudeung.com/"
  },
  {
    "id": "busan-biff-2026",
    "name": "부산국제영화제",
    "region": "부산광역시",
    "city": "해운대구",
    "startDate": "2026-10-01",
    "endDate": "2026-10-10",
    "category": "문화",
    "description": "아시아 최대 규모의 국제영화제. 영화의전당과 해운대 일대에서 개최.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.biff.kr/"
  },
  {
    "id": "jeju-canola-2026",
    "name": "제주 유채꽃축제",
    "region": "제주특별자치도",
    "city": "서귀포시",
    "startDate": "2026-04-04",
    "endDate": "2026-04-12",
    "category": "꽃",
    "description": "노란 유채꽃이 가득한 제주의 봄 들판에서 열리는 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.jeju.go.kr/"
  },
  {
    "id": "jeju-fire-2026",
    "name": "제주 들불축제",
    "region": "제주특별자치도",
    "city": "제주시",
    "startDate": "2026-03-12",
    "endDate": "2026-03-15",
    "category": "전통",
    "description": "새별오름을 태우는 장관과 함께하는 제주 전통 들불 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.buriburi.go.kr/"
  },
  {
    "id": "daegu-chimac-2026",
    "name": "대구 치맥페스티벌",
    "region": "대구광역시",
    "city": "두류공원",
    "startDate": "2026-07-01",
    "endDate": "2026-07-05",
    "category": "음식",
    "description": "치킨과 맥주를 주제로 한 도심 한여름 야외 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.chimacfestival.com/"
  },
  {
    "id": "muju-firefly-2026",
    "name": "무주 반딧불축제",
    "region": "전북특별자치도",
    "city": "무주군",
    "startDate": "2026-08-29",
    "endDate": "2026-09-06",
    "category": "문화",
    "description": "청정 자연에서 만나는 반딧불이와 환경을 주제로 한 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.firefly.or.kr/"
  },
  {
    "id": "daejeon-balloon-2026",
    "name": "대전 0시축제",
    "region": "대전광역시",
    "city": "중구",
    "startDate": "2026-08-08",
    "endDate": "2026-08-16",
    "category": "문화",
    "description": "원도심 일대에서 자정까지 이어지는 도심 종합 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.djoshi.com/"
  },
  {
    "id": "gwangju-kimchi-2026",
    "name": "광주 세계김치축제",
    "region": "광주광역시",
    "city": "남구",
    "startDate": "2026-10-23",
    "endDate": "2026-10-25",
    "category": "음식",
    "description": "김치를 주제로 한 시연·체험·미식 행사가 어우러진 가을 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.gjkimchi.kr/"
  },
  {
    "id": "sejong-citizen-2026",
    "name": "세종축제",
    "region": "세종특별자치시",
    "city": "세종시",
    "startDate": "2026-10-08",
    "endDate": "2026-10-11",
    "category": "문화",
    "description": "세종대왕과 한글을 테마로 한 도시 공동체 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.sejong.go.kr/"
  },
  {
    "id": "chungju-martial-2026",
    "name": "충주 세계무술축제",
    "region": "충청북도",
    "city": "충주시",
    "startDate": "2026-09-25",
    "endDate": "2026-09-29",
    "category": "전통",
    "description": "세계 각국의 무술이 한자리에 모이는 격조 높은 무예 축제.",
    "image": "images/placeholder.svg",
    "officialUrl": "https://www.martialarts.or.kr/"
  }
]
```

- [ ] **Step 2: 데이터 검증**

JSON 형식 유효성 확인:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/festivals.json','utf8')).length" 
```

Expected: `30` 출력.

- [ ] **Step 3: 커밋**

```bash
git add data/festivals.json
git commit -m "feat(data): seed 30 Korean festivals across 17 regions"
```

---

### Task 6: index.html — 시멘틱 마크업

**Files:**
- Modify: `index.html`

명세 §5.1 레이아웃 구조에 맞춰 의미 있는 시멘틱 태그로 작성. 실제 카드와 모달 내용은 JS가 채움.

- [ ] **Step 1: HTML 작성**

`index.html`:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>한국 축제 캘린더</title>
  <meta name="description" content="월별·지역별로 떠나는 한국 축제 여행" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1 class="site-title">한국 축제 캘린더</h1>
      <p class="site-subtitle">월별·지역별로 떠나는 축제 여행</p>
    </div>
  </header>

  <section class="filter-bar" aria-label="축제 필터">
    <div class="container">
      <div class="filter-group" role="group" aria-label="월 선택">
        <span class="filter-label">월</span>
        <div class="chip-group" id="month-chips">
          <button type="button" class="chip is-active" data-month="all">전체</button>
          <button type="button" class="chip" data-month="1">1월</button>
          <button type="button" class="chip" data-month="2">2월</button>
          <button type="button" class="chip" data-month="3">3월</button>
          <button type="button" class="chip" data-month="4">4월</button>
          <button type="button" class="chip" data-month="5">5월</button>
          <button type="button" class="chip" data-month="6">6월</button>
          <button type="button" class="chip" data-month="7">7월</button>
          <button type="button" class="chip" data-month="8">8월</button>
          <button type="button" class="chip" data-month="9">9월</button>
          <button type="button" class="chip" data-month="10">10월</button>
          <button type="button" class="chip" data-month="11">11월</button>
          <button type="button" class="chip" data-month="12">12월</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label" for="region-select">지역</label>
        <select id="region-select" class="select">
          <option value="all">전체</option>
          <option value="서울특별시">서울특별시</option>
          <option value="부산광역시">부산광역시</option>
          <option value="대구광역시">대구광역시</option>
          <option value="인천광역시">인천광역시</option>
          <option value="광주광역시">광주광역시</option>
          <option value="대전광역시">대전광역시</option>
          <option value="울산광역시">울산광역시</option>
          <option value="세종특별자치시">세종특별자치시</option>
          <option value="경기도">경기도</option>
          <option value="강원특별자치도">강원특별자치도</option>
          <option value="충청북도">충청북도</option>
          <option value="충청남도">충청남도</option>
          <option value="전북특별자치도">전북특별자치도</option>
          <option value="전라남도">전라남도</option>
          <option value="경상북도">경상북도</option>
          <option value="경상남도">경상남도</option>
          <option value="제주특별자치도">제주특별자치도</option>
        </select>
      </div>

      <div class="filter-group" role="group" aria-label="카테고리 선택">
        <span class="filter-label">카테고리</span>
        <div class="chip-group" id="category-chips">
          <button type="button" class="chip is-active" data-category="all">전체</button>
          <button type="button" class="chip" data-category="전통">전통</button>
          <button type="button" class="chip" data-category="음식">음식</button>
          <button type="button" class="chip" data-category="꽃">꽃</button>
          <button type="button" class="chip" data-category="불꽃">불꽃</button>
          <button type="button" class="chip" data-category="음악">음악</button>
          <button type="button" class="chip" data-category="문화">문화</button>
          <button type="button" class="chip" data-category="겨울">겨울</button>
        </div>
      </div>

      <div class="filter-meta">
        <span id="result-count" class="result-count">총 0개의 축제</span>
        <button type="button" id="reset-filters" class="reset-btn" hidden>필터 초기화</button>
      </div>
    </div>
  </section>

  <main class="main">
    <div class="container">
      <div id="cards" class="card-grid" aria-live="polite"></div>
      <div id="empty-state" class="empty-state" hidden>
        <p>선택한 조건에 맞는 축제가 없습니다.</p>
        <button type="button" class="reset-btn" data-reset>필터 초기화</button>
      </div>
      <div id="error-state" class="error-state" hidden>
        <p>데이터를 불러오지 못했습니다. 새로고침해 주세요.</p>
      </div>
    </div>
  </main>

  <div id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
    <div class="modal-backdrop" data-modal-close></div>
    <div class="modal-content">
      <button type="button" class="modal-close" data-modal-close aria-label="닫기">×</button>
      <div id="modal-body"></div>
    </div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 브라우저에서 페이지 로드 확인**

`index.html` 을 브라우저로 열어 콘솔 에러가 없는지 확인. 카드 영역은 비어 있고 필터 UI만 보이면 정상 (앱 로직은 아직 구현 전).

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat(html): scaffold semantic markup for filters, grid, and modal"
```

---

### Task 7: CSS — 베이스 토큰과 레이아웃

**Files:**
- Modify: `css/style.css`

명세 §5.5 디자인 톤 기준. 색상/간격을 CSS 변수로 토큰화해 이후 작업에서 일관 사용.

- [ ] **Step 1: CSS 작성**

`css/style.css`:

```css
:root {
  --color-bg: #FAFAF7;
  --color-text: #222222;
  --color-text-muted: #6B6B6B;
  --color-border: #E5E2DA;
  --color-accent: #E8654C;
  --color-accent-dark: #C9462C;
  --color-card-bg: #FFFFFF;
  --color-shadow: rgba(20, 16, 10, 0.08);
  --color-shadow-strong: rgba(20, 16, 10, 0.16);

  --cat-traditional: #B7906B;
  --cat-food: #F2B33D;
  --cat-flower: #F1799F;
  --cat-fireworks: #E8654C;
  --cat-music: #8A6CC7;
  --cat-culture: #4FA1A9;
  --cat-winter: #6FA3D6;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;

  --max-width: 1200px;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img { max-width: 100%; display: block; }
button { font-family: inherit; cursor: pointer; }

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-5);
}

.site-header {
  padding: var(--space-7) 0 var(--space-5);
  text-align: center;
}
.site-title {
  margin: 0 0 var(--space-2);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.site-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.main {
  padding: var(--space-6) 0 var(--space-7);
}

@media (max-width: 640px) {
  .site-title { font-size: 1.6rem; }
  .container { padding: 0 var(--space-4); }
}
```

- [ ] **Step 2: 브라우저 확인**

페이지를 다시 열어 헤더의 타이틀/부제가 중앙 정렬되고 오프화이트 배경이 보이는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add css/style.css
git commit -m "feat(style): add base tokens, typography, container, and header"
```

---

### Task 8: CSS — 필터 바

**Files:**
- Modify: `css/style.css`

스크롤 시 sticky, 칩 그룹·드롭다운·결과 개수 노출.

- [ ] **Step 1: CSS 추가**

`css/style.css` 끝에 추가:

```css
.filter-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-4) 0;
}
.filter-bar .container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
}
.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 56px;
}
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.chip {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.875rem;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.chip.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
.chip.is-active:hover {
  background: var(--color-accent-dark);
  border-color: var(--color-accent-dark);
  color: #fff;
}
.select {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text);
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  min-width: 180px;
}
.filter-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
}
.result-count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
.reset-btn {
  border: none;
  background: transparent;
  color: var(--color-accent);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: underline;
}
.reset-btn:hover { color: var(--color-accent-dark); }
```

- [ ] **Step 2: 브라우저 확인**

필터 바가 보이고, 월/카테고리 칩이 잘 정렬되며, 페이지를 스크롤해도 상단에 고정되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add css/style.css
git commit -m "feat(style): add sticky filter bar with chips and select"
```

---

### Task 9: CSS — 카드 그리드와 카드

**Files:**
- Modify: `css/style.css`

3열(데스크탑) / 2열(태블릿) / 1열(모바일) 반응형 그리드. 카드는 사진 중심.

- [ ] **Step 1: CSS 추가**

`css/style.css` 끝에 추가:

```css
.card-grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}

.card {
  background: var(--color-card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px var(--color-shadow);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px var(--color-shadow-strong);
}
.card-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #EFECE4;
}
.card-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}
.card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
}
.card-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
}
.card-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  align-self: flex-start;
}
.tag[data-category="전통"] { background: var(--cat-traditional); }
.tag[data-category="음식"] { background: var(--cat-food); color: #4A3500; }
.tag[data-category="꽃"]   { background: var(--cat-flower); }
.tag[data-category="불꽃"] { background: var(--cat-fireworks); }
.tag[data-category="음악"] { background: var(--cat-music); }
.tag[data-category="문화"] { background: var(--cat-culture); }
.tag[data-category="겨울"] { background: var(--cat-winter); }

.empty-state, .error-state {
  text-align: center;
  padding: var(--space-7) var(--space-4);
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: 임시 카드로 시각 확인**

스타일 검증 목적으로 `index.html`의 `<div id="cards">`에 임시 카드를 1개 넣어 본다 (다음 Task에서 JS가 이 영역을 덮어쓸 예정이므로 검증 후 제거):

```html
<article class="card">
  <img class="card-image" alt="" src="https://placehold.co/640x360" />
  <div class="card-body">
    <span class="tag" data-category="꽃">꽃</span>
    <h2 class="card-title">샘플 축제</h2>
    <div class="card-meta"><span>3.25 — 4.3</span><span>경상남도 창원시</span></div>
    <p class="card-description">샘플 설명 텍스트가 여기에 표시됩니다.</p>
  </div>
</article>
```

브라우저에서 카드가 그리드에 잘 들어가는지, 호버 시 살짝 들리는지 확인. 확인 후 임시 카드는 다시 지운다.

- [ ] **Step 3: 커밋**

```bash
git add css/style.css index.html
git commit -m "feat(style): add responsive card grid and card design"
```

---

### Task 10: CSS — 모달

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: CSS 추가**

`css/style.css` 끝에 추가:

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.modal[hidden] { display: none; }
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 16, 10, 0.55);
  backdrop-filter: blur(2px);
}
.modal-content {
  position: relative;
  background: var(--color-card-bg);
  border-radius: var(--radius-lg);
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}
.modal-close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.9);
  font-size: 1.4rem;
  line-height: 1;
  z-index: 1;
}
.modal-close:hover { background: #fff; }

.modal-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #EFECE4;
}
.modal-body-inner {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.modal-meta {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
}
.modal-description {
  margin: 0;
  line-height: 1.7;
}
.modal-link {
  display: inline-block;
  margin-top: var(--space-2);
  padding: 10px 20px;
  background: var(--color-accent);
  color: #fff;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  align-self: flex-start;
}
.modal-link:hover { background: var(--color-accent-dark); }

body.modal-open { overflow: hidden; }
```

- [ ] **Step 2: 커밋**

```bash
git add css/style.css
git commit -m "feat(style): add modal overlay and content styles"
```

---

### Task 11: js/modal.js — 모달 열기/닫기와 렌더링

**Files:**
- Modify: `js/modal.js`

DOM 직접 조작. `app.js`가 모달 객체를 사용해 축제 상세를 띄움.

날짜 포맷 헬퍼는 모달과 카드 둘 다 쓰므로 별도 모듈로 빼는 것이 깔끔하지만 YAGNI — 우선은 `app.js` 안에 두고 호출 시 인자로 전달받는다. (이번 Task에서는 modal에서 자체 포맷.)

- [ ] **Step 1: 구현 작성**

`js/modal.js`:

```js
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

  modalBody.innerHTML = `
    <img class="modal-image" alt="${escapeHtml(festival.name)}" src="${escapeHtml(festival.image)}"
         onerror="this.src='images/placeholder.svg'" />
    <div class="modal-body-inner">
      <span class="tag" data-category="${escapeHtml(festival.category)}">${escapeHtml(festival.category)}</span>
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
```

- [ ] **Step 2: 커밋**

```bash
git add js/modal.js
git commit -m "feat(modal): add open/close, render details, and close handlers"
```

---

### Task 12: js/app.js — 데이터 로딩과 카드 렌더링

**Files:**
- Modify: `js/app.js`

데이터 fetch → 초기 상태로 카드 렌더링. 필터/모달/URL은 다음 Task들에서 점진적으로 붙임.

- [ ] **Step 1: 구현 작성**

`js/app.js`:

```js
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
```

- [ ] **Step 2: 브라우저 확인**

`index.html` 을 브라우저로 열어 30개 카드가 나오고, "총 30개의 축제" 가 표시되며, 카드 클릭 시 모달이 열리는지 확인. ESC, X 버튼, 외부 클릭 모두 모달이 닫혀야 함.

> **로컬에서 fetch가 file:// 프로토콜로 실패할 수 있음.** 그 경우 임시 정적 서버:
> ```bash
> npx http-server . -p 8080
> ```
> 또는
> ```bash
> python -m http.server 8080
> ```
> 후 `http://localhost:8080` 접속.

- [ ] **Step 3: 커밋**

```bash
git add js/app.js
git commit -m "feat(app): load festivals and render card grid with modal handler"
```

---

### Task 13: js/app.js — 필터 UI 이벤트 바인딩

**Files:**
- Modify: `js/app.js`

월 칩, 지역 드롭다운, 카테고리 칩, 초기화 버튼을 상태에 연결. 활성 칩 토글.

- [ ] **Step 1: `js/app.js` 끝에 코드 추가 (`init()` 호출 직전)**

`js/app.js` 의 `bindModalClose(closeModal);` 줄 바로 아래에 추가:

```js
const monthChipsEl = document.getElementById('month-chips');
const categoryChipsEl = document.getElementById('category-chips');
const regionSelectEl = document.getElementById('region-select');
const resetBtnEl = document.getElementById('reset-filters');
const emptyResetBtnEl = emptyEl.querySelector('[data-reset]');

function setActiveChip(groupEl, attr, value) {
  groupEl.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset[attr] === value);
  });
}

function syncFilterUI() {
  setActiveChip(monthChipsEl, 'month', state.month == null ? 'all' : String(state.month));
  setActiveChip(categoryChipsEl, 'category', state.category == null ? 'all' : state.category);
  regionSelectEl.value = state.region == null ? 'all' : state.region;
  const anyActive = state.month != null || state.region != null || state.category != null;
  resetBtnEl.hidden = !anyActive;
}

function setMonth(value) {
  state.month = value === 'all' ? null : Number(value);
  syncFilterUI();
  update();
}
function setRegion(value) {
  state.region = value === 'all' ? null : value;
  syncFilterUI();
  update();
}
function setCategory(value) {
  state.category = value === 'all' ? null : value;
  syncFilterUI();
  update();
}
function resetAll() {
  state.month = null;
  state.region = null;
  state.category = null;
  syncFilterUI();
  update();
}

monthChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) setMonth(chip.dataset.month);
});
categoryChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) setCategory(chip.dataset.category);
});
regionSelectEl.addEventListener('change', (e) => setRegion(e.target.value));
resetBtnEl.addEventListener('click', resetAll);
emptyResetBtnEl.addEventListener('click', resetAll);
```

- [ ] **Step 2: 브라우저 확인**

- 월 칩 클릭 시 활성 표시, 결과 갯수와 카드 갱신
- 지역 드롭다운 변경 시 필터링
- 카테고리 칩 클릭 시 필터링
- 두 필터 동시 적용 (예: 5월 + 꽃) 결과 정상
- 결과 0건이면 빈 상태 표시
- "필터 초기화" 클릭 시 모든 칩이 "전체"로

- [ ] **Step 3: 커밋**

```bash
git add js/app.js
git commit -m "feat(app): wire filter UI events to state and re-render"
```

---

### Task 14: js/app.js — URL 쿼리 동기화

**Files:**
- Modify: `js/app.js`

페이지 로드 시 URL 쿼리 → 초기 상태. 필터 변경 시 `history.replaceState`로 URL 갱신. 모달 열림 상태도 `festival=<id>` 로 반영.

- [ ] **Step 1: import 추가**

`js/app.js` 상단에 추가:

```js
import { parseQuery, serializeState } from './url-sync.js';
```

- [ ] **Step 2: URL 동기화 함수 추가**

`js/app.js` 의 `update()` 함수 바로 아래에 추가:

```js
function syncUrl() {
  const query = serializeState(state);
  const newUrl = window.location.pathname + query;
  window.history.replaceState(null, '', newUrl);
}
```

- [ ] **Step 3: 상태 변경 후 syncUrl 호출하도록 수정**

`setMonth`, `setRegion`, `setCategory`, `resetAll` 의 `update()` 호출 직후에 `syncUrl()` 추가:

```js
function setMonth(value) {
  state.month = value === 'all' ? null : Number(value);
  syncFilterUI();
  update();
  syncUrl();
}
function setRegion(value) {
  state.region = value === 'all' ? null : value;
  syncFilterUI();
  update();
  syncUrl();
}
function setCategory(value) {
  state.category = value === 'all' ? null : value;
  syncFilterUI();
  update();
  syncUrl();
}
function resetAll() {
  state.month = null;
  state.region = null;
  state.category = null;
  syncFilterUI();
  update();
  syncUrl();
}
```

- [ ] **Step 4: 모달 열기/닫기 시 festival 쿼리 반영**

기존 `cardsEl.addEventListener('click', ...)` 핸들러를 다음으로 교체:

```js
cardsEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.festivalId;
  const festival = allFestivals.find(f => f.id === id);
  if (festival) {
    state.festival = festival.id;
    openModal(festival);
    syncUrl();
  }
});
```

기존 `bindModalClose(closeModal);` 호출을 다음으로 교체:

```js
bindModalClose(() => {
  closeModal();
  state.festival = null;
  syncUrl();
});
```

- [ ] **Step 5: `init()` 함수 수정 — URL에서 초기 상태 읽기**

기존 `init()` 함수를 다음으로 교체:

```js
async function init() {
  try {
    const res = await fetch('data/festivals.json');
    if (!res.ok) throw new Error('fetch failed');
    allFestivals = await res.json();
    errorEl.hidden = true;

    const initial = parseQuery(window.location.search);
    state.month = initial.month;
    state.region = initial.region;
    state.category = initial.category;
    state.festival = initial.festival;

    syncFilterUI();
    update();

    if (state.festival) {
      const f = allFestivals.find(x => x.id === state.festival);
      if (f) openModal(f);
      else state.festival = null;
    }
    syncUrl();
  } catch (err) {
    console.error(err);
    cardsEl.hidden = true;
    errorEl.hidden = false;
  }
}
```

- [ ] **Step 6: 브라우저 확인**

- 필터를 5월로 바꾸면 URL이 `?month=5` 로 바뀜
- 그 URL을 새 탭에서 열면 5월 필터가 적용된 채 로드됨
- 카드 클릭 시 URL에 `&festival=<id>` 추가, 모달 닫으면 제거
- 모달이 열린 상태의 URL을 새 탭에서 열면 모달이 자동으로 열림
- 잘못된 쿼리 (예: `?month=99`)는 무시되고 기본 상태로 로드

- [ ] **Step 7: 커밋**

```bash
git add js/app.js
git commit -m "feat(app): sync filter and modal state with URL query"
```

---

### Task 15: 이미지 placeholder와 최종 검증

**Files:**
- Create: `images/placeholder.svg`

placeholder 이미지를 추가해 외부 이미지 로드 실패 시 깨지지 않게. SVG로 작성해 어떤 크기에서도 깔끔하게 표시되고 추가 의존성도 없음.

- [ ] **Step 1: `images/` 디렉토리 생성**

```bash
mkdir -p images
```

- [ ] **Step 2: `images/placeholder.svg` 작성**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F2EDE2"/>
      <stop offset="100%" stop-color="#E5DCC8"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <g fill="#B7906B" opacity="0.7">
    <circle cx="800" cy="420" r="60"/>
    <path d="M740 420 Q800 320 860 420" stroke="#B7906B" stroke-width="14" fill="none"/>
  </g>
  <text x="800" y="560" text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', sans-serif"
        font-size="48" fill="#8A7558" font-weight="600">
    축제 이미지
  </text>
</svg>
```

- [ ] **Step 3: 최종 브라우저 검증 체크리스트**

`http-server` 또는 `python -m http.server` 로 정적 서버 실행 후 `http://localhost:8080` 에서 다음을 모두 확인:

- [ ] 페이지가 1초 이내에 표시됨
- [ ] 30개 카드 모두 정상 렌더링
- [ ] "총 30개의 축제" 정확히 표시
- [ ] 1월 칩 클릭 → 화천 산천어축제 등이 보임 (12/30 — 1/3 같은 연 걸침 축제 검증용으로 데이터를 추가하고 싶다면 후속 작업)
- [ ] 12월 빈 결과 → "선택한 조건에 맞는 축제가 없습니다." 표시
- [ ] 지역=경상남도 + 월=10월 → 진주 남강유등축제 1개
- [ ] 카테고리=불꽃 → 부산/포항/서울 불꽃축제 3개
- [ ] 필터 초기화 버튼 동작
- [ ] 카드 클릭 → 모달 열림 → ESC, X, 배경 클릭 모두 닫힘
- [ ] URL `?month=5&region=경상남도` 직접 입력 → 그 상태로 시작
- [ ] 모달 열고 URL 복사 → 새 탭에서 그 URL 열면 모달 자동 열림
- [ ] 모바일 너비(375px)에서 1열 카드, 필터 바 줄바꿈, 모달 잘 보임
- [ ] 데스크탑(1280px+)에서 3열 카드
- [ ] 콘솔 에러 없음
- [ ] `npm test` 모든 단위 테스트 통과

- [ ] **Step 4: 커밋**

```bash
git add images/
git commit -m "chore: add placeholder SVG and final verification pass"
```

---

## 완료 기준

- 명세 §2 범위에 명시된 모든 기능 작동
- `npm test` 모든 단위 테스트 통과 (filter 6개 이상, url-sync 9개 이상)
- 모바일/태블릿/데스크탑 반응형 확인
- 콘솔 에러 없음
- 브라우저 검증 체크리스트(§Task 15 Step 2) 전 항목 통과
