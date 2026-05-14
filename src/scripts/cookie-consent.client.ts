/**
 * 쿠키 동의 배너 — GDPR/EEA 트래픽용.
 * - localStorage 'cookie-consent' = 'accepted' | 'rejected'
 * - 'rejected' 면 GA / AdSense 비활성 (이미 Base 레이아웃이 PUBLIC_* env 기반,
 *   다만 추가 안전장치로 dataLayer 비우고 광고 차단 가능)
 * - 첫 방문 시 표시, dismiss 후 1년간 안 보임
 */

const KEY = 'cookie-consent';
const KEY_DATE = 'cookie-consent-date';
const EXPIRY_DAYS = 365;

function getDecision(): 'accepted' | 'rejected' | null {
  try {
    const v = localStorage.getItem(KEY);
    const t = parseInt(localStorage.getItem(KEY_DATE) || '0', 10);
    if (!v) return null;
    // 만료 (1년) 되면 다시 묻기
    if (Date.now() - t > EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_DATE);
      return null;
    }
    return v as 'accepted' | 'rejected';
  } catch { return null; }
}

function setDecision(v: 'accepted' | 'rejected') {
  try {
    localStorage.setItem(KEY, v);
    localStorage.setItem(KEY_DATE, String(Date.now()));
  } catch {}
}

function hide() {
  const el = document.getElementById('cookie-banner');
  if (el) el.hidden = true;
}

function show() {
  const el = document.getElementById('cookie-banner');
  if (el) el.hidden = false;
}

// 거부 시 GA 비활성화 (Google Consent Mode v2 기본 deny)
function applyDenial() {
  // adsbygoogle 추가 푸시 중지
  try { (window as any).adsbygoogle = []; } catch {}
  // GA 옵트아웃 (gaoptout 쿠키)
  try {
    const w = window as any;
    if (w.gtag) {
      w.gtag('consent', 'update', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  } catch {}
}

window.addEventListener('DOMContentLoaded', () => {
  const decision = getDecision();
  if (decision === null) {
    // 첫 방문 — 일단 사용은 deny 상태로 컨센트 모드 초기화
    try {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      function gtag(...args: any[]) { w.dataLayer.push(args); }
      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
      });
    } catch {}
    show();
  } else if (decision === 'rejected') {
    applyDenial();
  } else {
    // accepted — granted 상태 (default가 denied여도 update로 granted 가능)
    try {
      const w = window as any;
      if (w.gtag) {
        w.gtag('consent', 'update', {
          ad_storage: 'granted',
          analytics_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } catch {}
  }

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    setDecision('accepted');
    try {
      const w = window as any;
      if (w.gtag) {
        w.gtag('consent', 'update', {
          ad_storage: 'granted',
          analytics_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } catch {}
    hide();
  });

  document.getElementById('cookie-reject')?.addEventListener('click', () => {
    setDecision('rejected');
    applyDenial();
    hide();
  });
});
