// 풀투리프레시 — 모바일에서 페이지 맨 위에서 아래로 당기면 새로고침
// PWA(standalone) 환경에선 브라우저 기본 풀투리프레시가 동작 안 해서 직접 구현.

const PULL_THRESHOLD = 70; // 이만큼 당겨야 새로고침 트리거
const MAX_PULL = 120;       // 시각적으로 최대 끌어 내려지는 거리
const indicator = document.getElementById('pull-refresh');

if (indicator && 'ontouchstart' in window) {
  let startY = 0;
  let pulling = false;
  let currentDelta = 0;

  function isAtTop() {
    return (window.scrollY || document.documentElement.scrollTop) <= 1;
  }

  document.addEventListener(
    'touchstart',
    (e) => {
      if (!isAtTop()) return;
      // 모달이 열려있을 땐 스킵
      if (document.body.classList.contains('modal-open')) return;
      startY = e.touches[0].clientY;
      pulling = true;
      currentDelta = 0;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!pulling) return;
      if (!isAtTop()) {
        pulling = false;
        resetIndicator();
        return;
      }
      const delta = e.touches[0].clientY - startY;
      if (delta < 0) {
        pulling = false;
        resetIndicator();
        return;
      }
      // 0.5 비율로 감속 (저항감)
      currentDelta = Math.min(delta * 0.5, MAX_PULL);
      indicator.style.transform = `translate(-50%, ${currentDelta}px) rotate(${currentDelta * 3}deg)`;
      indicator.classList.add('is-pulling');
      indicator.classList.toggle('is-ready', currentDelta >= PULL_THRESHOLD);
    },
    { passive: true }
  );

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    if (currentDelta >= PULL_THRESHOLD) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
  });

  document.addEventListener('touchcancel', () => {
    pulling = false;
    resetIndicator();
  });

  function resetIndicator() {
    indicator.classList.remove('is-pulling', 'is-ready');
    indicator.style.transform = '';
    currentDelta = 0;
  }

  function triggerRefresh() {
    indicator.classList.remove('is-pulling');
    indicator.classList.add('is-refreshing');
    indicator.style.transform = `translate(-50%, ${PULL_THRESHOLD}px)`;
    // 새로고침 — 데이터까지 갱신되도록 reload
    setTimeout(() => {
      window.location.reload();
    }, 350);
  }
}
