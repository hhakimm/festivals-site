/**
 * PWA 설치 유도 배너 — 모바일에서만 노출.
 * - beforeinstallprompt 이벤트 캐치 → 사용자 클릭 시 prompt 표시
 * - 사용자 dismiss 시 7일간 안 보이게 localStorage
 * - iOS는 beforeinstallprompt 미지원 → 메뉴 안내 텍스트
 */

const DISMISS_KEY = 'pwa-prompt:dismiss-until';
const DISMISS_DAYS = 7;

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: BIPEvent | null = null;

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
function isStandalone(): boolean {
  // 이미 설치된 PWA
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}
function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function getDismissUntil(): number {
  try { return parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10) || 0; } catch { return 0; }
}
function dismissFor(days: number) {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000)); } catch {}
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BIPEvent;
  maybeShow();
});

// iOS는 beforeinstallprompt 이벤트가 안 옴 → 페이지 로드 후 직접 노출
window.addEventListener('load', () => {
  if (isIOS()) maybeShow();
});

function maybeShow() {
  if (!isMobile() || isStandalone()) return;
  if (Date.now() < getDismissUntil()) return;
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.hidden = false;
}

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
  if (deferred) {
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === 'accepted') {
      hideBanner();
    } else {
      dismissFor(DISMISS_DAYS);
      hideBanner();
    }
    deferred = null;
  } else if (isIOS()) {
    // iOS: 안내 alert
    const lang = document.documentElement.lang || 'ko';
    const msg = {
      ko: 'Safari 공유 메뉴 → "홈 화면에 추가"를 눌러주세요',
      en: 'Tap Safari Share → "Add to Home Screen"',
      ja: 'Safariの共有 → "ホーム画面に追加" をタップ',
      zh: '点击Safari分享 → "添加到主屏幕"',
    }[lang as 'ko'|'en'|'ja'|'zh'] || 'Add to Home Screen';
    alert(msg);
  }
});

document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
  dismissFor(DISMISS_DAYS);
  hideBanner();
});

function hideBanner() {
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.hidden = true;
}
