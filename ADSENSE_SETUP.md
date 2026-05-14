# AdSense / 수익화 설정 가이드

## 1. Google AdSense 가입

1. https://adsense.google.com 에서 사이트 등록
2. AdSense 승인 후 **클라이언트 ID**(예: `ca-pub-1234567890123456`) 발급받음
3. 광고 단위 만들고 **광고 단위 ID** (예: `1234567890`) 받음

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 만들어서 추가:

```bash
PUBLIC_ADSENSE_CLIENT=ca-pub-1234567890123456
PUBLIC_ADSENSE_SLOT_DEFAULT=1234567890
```

`PUBLIC_` 접두사는 Astro에서 클라이언트 사이드 노출용 환경변수 표시.

## 3. 빌드 + 배포

```bash
npm run build      # fetch + 빌드
npm run preview    # 로컬 확인
```

빌드 시 환경변수가 있으면 모든 페이지에 AdSense 스크립트가 자동 삽입됨.
환경변수가 **없으면** AdSlot은 비활성 (HTML 주석만 출력, 레이아웃 영향 0).

## 4. 광고 위치 (이미 코드에 배치됨)

| 위치 | 효과 |
|---|---|
| **퀴즈 결과 상단** (매칭 % 다음) | 가장 효과적 — 사용자가 결과 보려고 머무는 시점 |
| **퀴즈 결과 하단** (추천 카드 다음) | 결과 만족도 높을 때 |
| **홈 페이지** (Explorer 다음) | 트래픽 최다 페이지 |
| **랜딩 페이지** (인기 8개 다음) | 신규 방문자 |
| **상세 페이지** (지도+날씨 다음) | 기존 위치 |

## 5. AdSense 외 수익화

코드에 이미 들어있는 다른 수익 채널:

- **호텔 예약 affiliate** (Agoda, 야놀자): `src/components/AffiliateButtons.astro` — 상세 페이지에서 호출
- **뉴스레터** (`/welcome` 페이지) — Stibee/Mailchimp 등 연동 가능 (현재 localStorage 임시)

## 6. 트래픽 → 수익 흐름

```
[랜딩/홈] → 퀴즈 유도 CTA
   ↓
[퀴즈] → 결과 페이지 (광고 ×2 표시)
   ↓
[추천 상세 페이지] → 광고 + 호텔 affiliate
   ↓
[즐겨찾기 / 공유] → 재방문 유도
```

각 단계에서 광고 노출 + 어필리에이트 클릭 기회.
