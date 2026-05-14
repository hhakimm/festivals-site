# 사용자 유입·체류·재방문 가이드

이 파일은 사이트가 "트래픽 → 머묾 → 재방문 → 수익화"로 흐르는 전체 그림과,
지금 코드에 이미 들어있는 기능 + 사용자가 외부 서비스 연동만 하면 켜지는 옵션을 모아두는 곳.

## 1. 트래픽 유입

### 1.1 SEO (정적 HTML — 이미 적용됨)
- 56,000+ 페이지 모두 빌드 타임에 정적 HTML
- 각 detail 페이지에 JSON-LD (Event / TouristAttraction)
- hreflang 4개 언어 자동 (ko/en/ja/zh)
- sitemap.xml 자동 생성
- `/quiz/r/<persona>/` — 페르소나별 SEO 친화 URL (페르소나 검색어 노출)

### 1.2 SNS 바이럴
- 퀴즈 결과 페이지에 페르소나별 OG 이미지 6장 (`public/og-quiz-<id>.svg`)
- Web Share API + Twitter intent + 클립보드 복사
- 카카오톡: OG 메타로 자동 미리보기 (별도 SDK 불필요)

### 1.3 추가 가능
- 인스타그램 스토리용 9:16 OG 이미지 별도 (현재 16:9)
- TikTok 짧은 영상으로 퀴즈 결과 공유 유도

## 2. 체류 시간 ↑

### 이미 코드에 있는 것
- **PickOfDay**: 매일 다른 명소 1개 강조 (홈 상단)
- **WeatherSection**: 5대 관광 거점 도시 비교
- **RelatedItems**: 상세 페이지에 "비슷한 명소" 4개
- **Explorer**: 무한 스크롤 형식 카드 그리드
- **즐겨찾기**: 카드를 ♥로 저장
- **지도 보기**: Leaflet 마커 클러스터

## 3. 재방문 ↑

### 이미 있는 것
- **PWA 설치 유도 배너**: 모바일에서 1회 노출 (7일 dismiss)
- **즐겨찾기 (localStorage)**: 다시 와서 자기 리스트 봄
- **PWA Service Worker**: 오프라인에서도 본 페이지 작동
- **/favorites 페이지**: 4개 언어 모두

### 외부 서비스 연동만 하면 켜지는 옵션

#### 3.1 뉴스레터 — Stibee (한국, 무료 플랜)

현재 코드: `/welcome` 페이지의 폼이 이메일을 `localStorage`에 저장 (placeholder).

**연동 방법**:
1. https://stibee.com 가입 → 주소록 만들기 → 폼 ID 발급
2. `src/components/LandingHero.astro`의 form `action` 속성 추가:
```html
<form action="https://stibee.com/api/v1.0/lists/<LIST_ID>/public/subscribers"
      method="POST" data-newsletter-form ...>
```
3. `src/scripts/landing.client.ts`에서 fetch 처리 (현재 localStorage 저장 부분을 fetch로 교체)

또는 더 간단히: **Mailchimp Embedded Form** 그대로 임베드.

#### 3.2 푸시 알림 — OneSignal (무료)

**연동 방법**:
1. https://onesignal.com 가입 → 웹 푸시 앱 만들기 → App ID 발급
2. `src/layouts/Base.astro`의 `<head>`에:
```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({ appId: "YOUR_APP_ID" });
  });
</script>
```
3. 매주 금요일 "이번 주말 추천" 알림 발송 — OneSignal 대시보드에서 스케줄링

## 4. 수익화

상세는 `ADSENSE_SETUP.md` 참고. 요약:

### 광고 (자동)
- Google AdSense — `.env`에 `PUBLIC_ADSENSE_CLIENT` 추가하면 즉시 활성화
- 광고 위치 (이미 배치됨):
  - 홈 (Explorer 다음)
  - 랜딩 인기 미리보기 다음
  - **퀴즈 결과 페이지 ×2** (상단 + 하단 — 효과 최고)
  - 상세 페이지

### 어필리에이트 (자동)
- 호텔: **Agoda · 야놀자 · Booking.com** (상세 페이지)
- 항공권: **Skyscanner** (상세 페이지)
- 투어/액티비티: **KKday** (상세 페이지)

### 후원
- **Buy Me a Coffee**: 푸터 ☕ 버튼 (URL은 `src/layouts/Base.astro`에서 수정 가능)

### 직접 판매 (수동, 별도 페이지 필요)
- PDF 가이드북 — "서울 3박4일 코스", "부산 가족여행" 등
- 프리미엄 멤버십 — 광고 제거 + 오프라인 다운로드
- 굿즈 (스티커, 엽서)

## 5. 빌드·배포 체크리스트

```bash
# 1) 데이터 수집 (최초·매일)
TOURAPI_KEY=... npm run fetch

# 2) 풀 빌드
npm run build

# 3) 로컬 확인
npm run preview

# 4) GitHub Actions에 secrets 등록
#    - TOURAPI_KEY
#    - PUBLIC_ADSENSE_CLIENT (수익화)
#    - PUBLIC_ADSENSE_SLOT_DEFAULT
```

배포는 `main` 푸시 시 자동 + 매일 새벽 데이터 재수집.

## 6. KPI

추적 권장 지표 (GA4 + AdSense):
- 일일 방문자 (DAU)
- 평균 세션 시간
- 페이지/세션
- 퀴즈 완료율 (이벤트: `quiz_complete`)
- 퀴즈 공유 클릭 (이벤트: `quiz_share`)
- 어필리에이트 클릭 (이벤트: `affiliate_click`, 이미 코드에 있음)
- AdSense RPM
- 뉴스레터 가입률
- PWA 설치 수
