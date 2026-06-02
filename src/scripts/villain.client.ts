/**
 * 여행 빌런 테스트 인터랙션 — intro → questions → result, 공유.
 * URL ?type=X 로 진입 시 결과 바로 표시(공유 링크용).
 */
import { scoreVillain, villainShareText, VILLAIN_IDS, VILLAIN_LABELS as L, type VillainId } from '@/lib/quiz-villain';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const TOTAL = 7;

export function initVillain(root: HTMLElement) {
  const screens = {
    intro: root.querySelector<HTMLElement>('[data-screen="intro"]'),
    questions: root.querySelector<HTMLElement>('[data-screen="questions"]'),
  };
  const results = root.querySelectorAll<HTMLElement>('[data-screen="result"]');
  const qBlocks = root.querySelectorAll<HTMLElement>('.vil-question');
  const progressFill = root.querySelector<HTMLElement>('#vil-progress-fill');
  const qCurrent = root.querySelector<HTMLElement>('#vil-q-current');
  const prevBtn = root.querySelector<HTMLButtonElement>('#vil-prev-btn');
  const startBtn = root.querySelector<HTMLButtonElement>('#vil-start-btn');

  const answers: (string | null)[] = new Array(TOTAL).fill(null);
  let current = 0;

  function show(name: 'intro' | 'questions' | 'result', villain?: VillainId) {
    screens.intro!.hidden = name !== 'intro';
    screens.questions!.hidden = name !== 'questions';
    results.forEach((r) => { r.hidden = !(name === 'result' && r.dataset.villain === villain); });
    if (name === 'result') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showQuestion(i: number) {
    qBlocks.forEach((b, idx) => { b.hidden = idx !== i; });
    if (qCurrent) qCurrent.textContent = String(i + 1);
    if (progressFill) progressFill.style.width = `${((i + 1) / TOTAL) * 100}%`;
    if (prevBtn) prevBtn.hidden = i === 0;
    // 선택 표시 동기화
    const ans = answers[i];
    qBlocks[i]?.querySelectorAll<HTMLElement>('.vil-option').forEach((o) => {
      o.classList.toggle('is-selected', !!ans && o.dataset.optionId === ans);
    });
  }

  function finish() {
    const { winner } = scoreVillain(answers.filter(Boolean) as string[]);
    history.replaceState(null, '', `${window.location.pathname}?type=${winner}`);
    show('result', winner);
  }

  // ?type= 직접 진입
  const typeParam = new URL(window.location.href).searchParams.get('type');
  if (typeParam && (VILLAIN_IDS as string[]).includes(typeParam)) {
    show('result', typeParam as VillainId);
  } else {
    show('intro');
  }

  startBtn?.addEventListener('click', () => {
    current = 0;
    answers.fill(null);
    show('questions');
    showQuestion(0);
  });

  screens.questions?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.vil-option');
    if (!btn || !btn.dataset.optionId) return;
    answers[current] = btn.dataset.optionId;
    qBlocks[current]?.querySelectorAll('.vil-option').forEach((o) => o.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    setTimeout(() => {
      if (current < TOTAL - 1) { current += 1; showQuestion(current); }
      else finish();
    }, 180);
  });

  prevBtn?.addEventListener('click', () => {
    if (current > 0) { current -= 1; showQuestion(current); }
  });

  root.querySelectorAll<HTMLButtonElement>('.vil-retake-btn').forEach((b) => {
    b.addEventListener('click', () => {
      current = 0; answers.fill(null);
      history.replaceState(null, '', window.location.pathname);
      show('intro');
    });
  });

  root.querySelectorAll<HTMLButtonElement>('.vil-share-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const vid = btn.dataset.villain as VillainId;
      const action = btn.dataset.shareAction;
      const text = villainShareText(vid);
      const url = `${window.location.origin}${BASE}/quiz/villain/r/${vid}/`;
      if (action === 'native' && navigator.share) {
        try { await navigator.share({ title: text, text, url }); } catch { /* cancelled */ }
      } else if (action === 'copy' || (action === 'native' && !navigator.share)) {
        try { await navigator.clipboard.writeText(url); toast(L.shareCopied); } catch { /* noop */ }
      } else if (action === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
      }
    });
  });
}

let toastTimer: number | null = null;
function toast(msg: string) {
  let el = document.getElementById('vil-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vil-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('is-visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove('is-visible'), 2000);
}
