/**
 * Quiz 페이지 인터랙션 — vanilla TS, 프레임워크 없음.
 *  - intro → questions → result 화면 토글
 *  - URL ?type=X 로 진입 시 결과 바로 표시
 *  - 옵션 가중치는 lib/quiz.ts 와 동일 (여기선 정적 매핑)
 *  - SNS 공유 (Web Share API, Twitter intent, clipboard)
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';
type PersonaId = 'naturalist' | 'cultural' | 'resort' | 'adventurer' | 'family' | 'urbanite';
const PERSONA_IDS: PersonaId[] = ['naturalist', 'cultural', 'resort', 'adventurer', 'family', 'urbanite'];

// quiz.ts 의 weights 와 동일. 빌드 타임 SSR로 마크업 동일하므로,
// 옵션 ID → 페르소나 가중치 매핑을 클라이언트에 복제.
const OPTION_WEIGHTS: Record<string, Partial<Record<PersonaId, number>>> = {
  'q1-nature':     { naturalist: 3, family: 1 },
  'q1-culture':    { cultural: 3 },
  'q1-relax':      { resort: 3 },
  'q1-excite':     { adventurer: 3, urbanite: 1 },
  'q2-mountain':   { naturalist: 3, adventurer: 1 },
  'q2-sea':        { resort: 3, family: 1 },
  'q2-village':    { cultural: 3 },
  'q2-city':       { urbanite: 3 },
  'q3-still':      { resort: 3 },
  'q3-walk':       { cultural: 2, naturalist: 2, urbanite: 2 },
  'q3-active':     { adventurer: 2, naturalist: 2 },
  'q3-extreme':    { adventurer: 3 },
  'q4-plan':       { family: 2, cultural: 2 },
  'q4-free':       { adventurer: 2, urbanite: 2, naturalist: 1 },
  'q4-slow':       { resort: 3 },
  'q4-many':       { urbanite: 2, adventurer: 1 },
  'q5-alone':      { naturalist: 2, cultural: 2, adventurer: 1 },
  'q5-partner':    { resort: 2, cultural: 1, urbanite: 1 },
  'q5-friends':    { urbanite: 2, adventurer: 2 },
  'q5-family':     { family: 3 },
  'q6-landscape':  { naturalist: 3 },
  'q6-heritage':   { cultural: 3 },
  'q6-food':       { urbanite: 3, family: 1 },
  'q6-experience': { adventurer: 3, family: 1 },
};

// 매칭 분포 렌더용 — 페르소나 이름 + 그라데이션 색 (lib/quiz.ts와 동기화)
const PERSONA_NAMES: Record<Lang, Record<PersonaId, string>> = {
  ko: { naturalist: '자연주의자', cultural: '문화탐험가', resort: '휴양가', adventurer: '모험가', family: '가족여행자', urbanite: '도시탐험가' },
  en: { naturalist: 'Naturalist', cultural: 'Cultural Explorer', resort: 'Resort Lover', adventurer: 'Adventurer', family: 'Family Traveler', urbanite: 'City Explorer' },
  ja: { naturalist: 'ナチュラリスト', cultural: '文化探検家', resort: 'リラックス派', adventurer: '冒険家', family: 'ファミリー', urbanite: 'シティ' },
  zh: { naturalist: '自然主义者', cultural: '文化探险家', resort: '度假爱好者', adventurer: '冒险家', family: '家庭旅行者', urbanite: '城市探险家' },
};

const SHARE_TEXT: Record<Lang, Record<PersonaId, string>> = {
  ko: {
    naturalist: '나는 주말마다 등산화부터 챙기는 「자연주의자」 🌿 너는 어떤 여행자야?',
    cultural: '나는 박물관 도슨트를 끝까지 듣는 「문화탐험가」 🏛️ 너는 어떤 여행자야?',
    resort: '나는 체크인하면 수영장에서 안 나오는 「휴양가」 🏖️ 너는 어떤 여행자야?',
    adventurer: '나는 위험할수록 더 끌리는 「모험가」 ⛷️ 너는 어떤 여행자야?',
    family: '나는 단톡방 여행 총무 「가족여행자」 👨‍👩‍👧 너는 어떤 여행자야?',
    urbanite: '나는 핫플 오픈런하는 「도시탐험가」 🏙️ 너는 어떤 여행자야?',
  },
  en: {
    naturalist: "I'm a Naturalist who grabs hiking boots every weekend 🌿 What's your travel type?",
    cultural: "I'm a Cultural Explorer who stays for the whole museum tour 🏛️ What's yours?",
    resort: "I'm a Resort Lover who never leaves the pool 🏖️ What's yours?",
    adventurer: "I'm an Adventurer — the riskier, the better ⛷️ What's yours?",
    family: "I'm the Family Traveler who plans the whole trip 👨‍👩‍👧 What's yours?",
    urbanite: "I'm a City Explorer who lines up for every hot spot 🏙️ What's yours?",
  },
  ja: {
    naturalist: '私は週末ごとに登山靴を準備する「ナチュラリスト」🌿 あなたはどんな旅人?',
    cultural: '私は博物館の解説を最後まで聞く「文化探検家」🏛️ あなたは?',
    resort: '私はチェックインしたらプールから出ない「リラックス派」🏖️ あなたは?',
    adventurer: '私は危険なほど燃える「冒険家」⛷️ あなたは?',
    family: '私は旅程を組む幹事「ファミリートラベラー」👨‍👩‍👧 あなたは?',
    urbanite: '私は話題のスポットに開店ダッシュする「シティエクスプローラー」🏙️ あなたは?',
  },
  zh: {
    naturalist: '我是每个周末都先收拾登山鞋的「自然主义者」🌿 你是哪种旅行者?',
    cultural: '我是把博物馆讲解听到最后的「文化探险家」🏛️ 你呢?',
    resort: '我是一入住就泡在泳池里的「度假爱好者」🏖️ 你呢?',
    adventurer: '我是越危险越想试的「冒险家」⛷️ 你呢?',
    family: '我是负责安排全程的「家庭旅行者」👨‍👩‍👧 你呢?',
    urbanite: '我是抢着去网红店打卡的「城市探险家」🏙️ 你呢?',
  },
};

const TOAST_COPIED: Record<Lang, string> = {
  ko: '링크가 복사됐어요',
  en: 'Link copied',
  ja: 'リンクをコピーしました',
  zh: '已复制链接',
};

interface QuizState {
  current: number;       // 현재 질문 인덱스 (0~5)
  answers: (string | null)[];  // 각 질문의 선택 옵션 ID
  lang: Lang;
}

const TOTAL_QUESTIONS = 6;

export function initQuiz(root: HTMLElement) {
  const lang = (root.dataset.lang || 'ko') as Lang;

  const state: QuizState = {
    current: 0,
    answers: new Array(TOTAL_QUESTIONS).fill(null),
    lang,
  };

  const introEl = root.querySelector<HTMLElement>('[data-screen="intro"]');
  const questionsEl = root.querySelector<HTMLElement>('[data-screen="questions"]');
  const resultEls = root.querySelectorAll<HTMLElement>('[data-screen="result"]');
  const progressFill = root.querySelector<HTMLElement>('#quiz-progress-fill');
  const qCurrent = root.querySelector<HTMLElement>('#quiz-q-current');
  const prevBtn = root.querySelector<HTMLButtonElement>('#quiz-prev-btn');
  const startBtn = root.querySelector<HTMLButtonElement>('#quiz-start-btn');

  // 0) URL state — ?type=X 로 진입했으면 바로 결과 (breakdown 없음 → 균등 분포로)
  const url = new URL(window.location.href);
  const typeParam = url.searchParams.get('type');
  if (typeParam && PERSONA_IDS.includes(typeParam as PersonaId)) {
    showResult(typeParam as PersonaId);
    // 직접 진입은 답변 없음 → 승자만 100% 비등 분포
    renderBreakdown(typeParam as PersonaId, syntheticScores(typeParam as PersonaId));
  } else {
    showScreen('intro');
  }

  // 1) 시작 버튼
  startBtn?.addEventListener('click', () => {
    state.current = 0;
    state.answers = new Array(TOTAL_QUESTIONS).fill(null);
    showScreen('questions');
    updateProgress();
    showQuestion(0);
  });

  // 2) 옵션 클릭 (이벤트 위임)
  questionsEl?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.quiz-option');
    if (!btn) return;
    const optId = btn.dataset.optionId;
    if (!optId) return;

    // 같은 질문 안의 다른 옵션 선택 해제
    btn.parentElement?.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    state.answers[state.current] = optId;

    // 0.25초 뒤 자동으로 다음 질문 — 마지막이면 결과
    setTimeout(() => {
      if (state.current < TOTAL_QUESTIONS - 1) {
        state.current++;
        showQuestion(state.current);
        updateProgress();
      } else {
        const { scores, winner } = computeScores(state.answers);
        showResult(winner);
        renderBreakdown(winner, scores);
        // URL 갱신 — 공유 가능
        const u = new URL(window.location.href);
        u.searchParams.set('type', winner);
        window.history.replaceState({}, '', u.toString());
      }
    }, 220);
  });

  // 3) 이전 버튼
  prevBtn?.addEventListener('click', () => {
    if (state.current > 0) {
      state.current--;
      showQuestion(state.current);
      updateProgress();
    }
  });

  // 4) 결과 화면 — 다시 테스트
  root.querySelectorAll<HTMLButtonElement>('.quiz-retake-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // URL 정리
      const u = new URL(window.location.href);
      u.searchParams.delete('type');
      window.history.replaceState({}, '', u.toString());
      // 상태 리셋
      state.current = 0;
      state.answers = new Array(TOTAL_QUESTIONS).fill(null);
      root.querySelectorAll('.quiz-option.is-selected').forEach((b) => b.classList.remove('is-selected'));
      showScreen('intro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 5) 공유 버튼
  root.querySelectorAll<HTMLButtonElement>('.quiz-share-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.shareAction;
      const personaId = (btn.closest('[data-persona-id]') as HTMLElement | null)?.dataset.personaId as PersonaId | undefined;
      if (!personaId) return;
      const shareText = SHARE_TEXT[lang][personaId];
      // 페르소나별 정적 라우트가 OG 메타가 풍부 — 공유는 그쪽 URL 사용
      const origin = window.location.origin;
      const langPrefix = lang === 'ko' ? '' : `/${lang}`;
      // base path 감지 — pathname의 첫 세그먼트가 'festivals-site'면 포함
      const seg = window.location.pathname.split('/').filter(Boolean)[0];
      const basePath = seg === 'festivals-site' ? '/festivals-site' : '';
      const shareUrl = `${origin}${basePath}${langPrefix}/quiz/r/${personaId}/`;

      if (action === 'native' && navigator.share) {
        try {
          await navigator.share({ title: shareText, text: shareText, url: shareUrl });
        } catch { /* user cancelled */ }
      } else if (action === 'copy') {
        await copyToClipboard(shareUrl);
        showToast(TOAST_COPIED[lang]);
      } else if (action === 'twitter') {
        const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(tw, '_blank', 'noopener,noreferrer');
      } else if (action === 'native' && !navigator.share) {
        // 폴백: 복사
        await copyToClipboard(shareUrl);
        showToast(TOAST_COPIED[lang]);
      }
    });
  });

  // ── 헬퍼 ─────────────────────────────────────────────
  function showScreen(name: 'intro' | 'questions' | 'result', personaId?: PersonaId) {
    if (introEl) introEl.hidden = name !== 'intro';
    if (questionsEl) questionsEl.hidden = name !== 'questions';
    resultEls.forEach((el) => {
      const matches = name === 'result' && el.dataset.personaId === personaId;
      el.hidden = !matches;
    });
  }

  function showResult(personaId: PersonaId) {
    showScreen('result', personaId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function showQuestion(idx: number) {
    questionsEl?.querySelectorAll<HTMLElement>('.quiz-question').forEach((q, i) => {
      q.hidden = i !== idx;
    });
    if (prevBtn) prevBtn.hidden = idx === 0;
  }

  function updateProgress() {
    const pct = ((state.current + 1) / TOTAL_QUESTIONS) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (qCurrent) qCurrent.textContent = String(state.current + 1);
  }

  function renderBreakdown(winner: PersonaId, scores: Record<PersonaId, number>) {
    const resultEl = Array.from(resultEls).find((el) => el.dataset.personaId === winner);
    const list = resultEl?.querySelector<HTMLElement>('[data-breakdown-list]');
    if (!list) return;
    const total = PERSONA_IDS.reduce((s, p) => s + Math.max(0, scores[p]), 0) || 1;
    // 정렬: 점수 높은 순
    const ranked = [...PERSONA_IDS].sort((a, b) => scores[b] - scores[a]);
    list.innerHTML = ranked.map((pid) => {
      const pct = Math.round((Math.max(0, scores[pid]) / total) * 100);
      const isW = pid === winner;
      const name = PERSONA_NAMES[lang][pid];
      return `
        <div class="quiz-bd-row${isW ? ' is-winner' : ''}">
          <span class="quiz-bd-name">${escapeHtml(name)}</span>
          <span class="quiz-bd-bar"><span class="quiz-bd-fill" style="width: ${pct}%"></span></span>
          <span class="quiz-bd-pct">${pct}%</span>
        </div>
      `;
    }).join('');
  }
}

// ── ?type=X 직접 진입 시 사용 — 승자에게 50% 배분 + 나머지 5명 균등 ──
function syntheticScores(winner: PersonaId): Record<PersonaId, number> {
  const out: Record<PersonaId, number> = {
    naturalist: 1, cultural: 1, resort: 1, adventurer: 1, family: 1, urbanite: 1,
  };
  out[winner] = 5;
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 스코어링 ─────────────────────────────────────────────
function computeScores(answers: (string | null)[]): { scores: Record<PersonaId, number>; winner: PersonaId } {
  const scores: Record<PersonaId, number> = {
    naturalist: 0, cultural: 0, resort: 0, adventurer: 0, family: 0, urbanite: 0,
  };
  for (const optId of answers) {
    if (!optId) continue;
    const w = OPTION_WEIGHTS[optId];
    if (!w) continue;
    for (const [p, v] of Object.entries(w)) {
      scores[p as PersonaId] += v || 0;
    }
  }
  let winner: PersonaId = 'naturalist';
  let max = -1;
  for (const p of PERSONA_IDS) {
    if (scores[p] > max) { max = scores[p]; winner = p; }
  }
  return { scores, winner };
}

// ── 클립보드 ─────────────────────────────────────────────
async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch { /* fallthrough */ }
  // 폴백
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

// ── 토스트 ───────────────────────────────────────────────
function showToast(msg: string) {
  // 기존 토스트가 있으면 제거
  const old = document.getElementById('quiz-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'quiz-toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%) translateY(10px)',
    background: '#171717',
    color: '#fff',
    padding: '11px 22px',
    borderRadius: '999px',
    fontSize: '0.9rem',
    fontWeight: '500',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.18s ease, transform 0.18s ease',
    pointerEvents: 'none',
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => t.remove(), 200);
  }, 2200);
}
