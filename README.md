# 한국 가볼 만한 곳 — Astro Edition

기존 `festivals-site`의 SEO를 잡기 위한 Astro 마이그레이션.
**SEO 핵심**: TourAPI를 빌드 타임에 호출 → 페이지별 정적 HTML 생성 → 구글이 콘텐츠를 직접 읽음.

---

## 🚀 1주차 셋업 (Day 1)

```bash
# 1. 의존성 설치
npm install

# 2. (선택) TourAPI 키 없이도 mock 데이터로 일단 떠보기
npm run fetch       # mock 데이터 3+3개로 src/content/data/*.json 생성
npm run dev         # http://localhost:4321/festivals-site/

# 3. (권장) 실제 TourAPI 키로 풀 데이터 가져오기
export TOURAPI_KEY="발급받은_키"
npm run fetch       # 축제 + 여행지 전체 수집 → JSON 저장
npm run build       # dist/ 에 정적 HTML 700+개 생성
npm run preview     # 빌드 결과 미리보기
```

### TourAPI 키 발급

1. https://www.data.go.kr/ 가입 → 한국관광공사 TourAPI 4.0 신청
2. 승인되면 `serviceKey` 받음 (디코딩된 키 사용)
3. 위 `TOURAPI_KEY` 환경변수에 그대로 입력

---

## 📁 디렉토리 구조

```
festivals-astro/
├── astro.config.mjs        # i18n, base path, sitemap 설정
├── package.json
├── scripts/
│   └── fetch-tourapi.ts    # ⭐ SEO 핵심 — 빌드타임 API 호출
├── src/
│   ├── content/data/       # fetch 결과 JSON (.gitignore됨)
│   ├── layouts/
│   │   └── Base.astro      # 메타태그, JSON-LD, hreflang
│   ├── components/
│   │   └── ItemCard.astro
│   ├── lib/
│   │   ├── data.ts         # JSON 로더, 지역코드 매핑
│   │   ├── i18n.ts         # 다국어 사전
│   │   └── schema.ts       # Event/TouristAttraction JSON-LD
│   └── pages/
│       ├── index.astro                    # 한국어 홈
│       ├── festival/[slug].astro          # 동적 라우트 (축제 700개)
│       ├── attraction/[slug].astro        # 동적 라우트 (여행지)
│       ├── en/                            # 영어 페이지
│       ├── ja/                            # 일본어
│       └── zh/                            # 중국어
├── public/
│   ├── styles.css
│   ├── robots.txt
│   └── og-image.svg
└── .github/workflows/deploy.yml           # 자동 배포 + 매일 데이터 갱신
```

---

## 🌐 라우팅 구조 (SEO 핵심)

| URL | 설명 |
|---|---|
| `/festivals-site/` | 한국어 홈 |
| `/festivals-site/festival/대전-0시-축제-m1/` | 축제 상세 (정적 HTML, 구글이 읽음) |
| `/festivals-site/attraction/한밭수목원-m4/` | 여행지 상세 |
| `/festivals-site/en/` | 영어 홈 |
| `/festivals-site/en/festival/<slug>/` | 영어 축제 상세 |
| `/festivals-site/ja/` `/festivals-site/zh/` | 일본어/중국어 |
| `/festivals-site/sitemap-index.xml` | 자동 생성 sitemap |

**이전 사이트와 가장 큰 차이**: 모든 페이지가 빌드 타임에 정적 HTML로 만들어져, 구글봇이 첫 요청에서 풍부한 콘텐츠를 받음. 클라이언트 사이드 렌더링 X.

---

## 🚢 배포 (Day 5)

### GitHub Pages 자동 배포

1. 레포 Settings → Pages → Source를 **GitHub Actions**로 설정
2. Settings → Secrets and variables → Actions → `TOURAPI_KEY` 추가
3. `main` 브랜치에 push → 자동 빌드/배포
4. 매일 새벽 자동 리빌드 (cron 스케줄)

### 커스텀 도메인 사용 시

`astro.config.mjs`에서:
- `site: 'https://your-domain.com'`
- `base: '/'`

---

## 📊 첫 측정

배포 후:

1. https://pagespeed.web.dev/ 에 신규 URL 입력 → Lighthouse 점수 확인 (목표: 95+)
2. Google Search Console에서 `sitemap-index.xml` 제출
3. 색인 요청 — 우선 상위 100개 URL

기존 사이트와 비교:
- **기존**: "총 0개의 여행지" (구글봇이 봄)
- **새 사이트**: 풍부한 콘텐츠 + JSON-LD 스키마

---

## 🔜 다음 단계 (2주차 이후)

- [ ] 페이지별 OG 이미지 동적 생성 (Satori)
- [ ] 뉴스레터 가입 폼 (Stibee)
- [ ] 야놀자·아고다 실 제휴 ID 적용 (현재는 검색 URL)
- [ ] 인바운드 외국인 영문 SEO 키워드 매핑
