/**
 * 여행 DNA 테스트 인터랙션.
 * 8 질문, 4축, 점수 → 4글자 코드 (16 유형).
 */

type Axis = 'AC' | 'NU' | 'PS' | 'BL';
const AXES: Axis[] = ['AC', 'NU', 'PS', 'BL'];
const HIGH: Record<Axis, string> = { AC: 'A', NU: 'N', PS: 'P', BL: 'B' };
const LOW:  Record<Axis, string> = { AC: 'C', NU: 'U', PS: 'S', BL: 'L' };

// 옵션 ID → { axis, score } (lib/quiz-dna.ts와 동기화)
const OPTIONS: Record<string, { axis: Axis; score: number }> = {
  'd1-1': { axis: 'AC', score: 2 }, 'd1-2': { axis: 'AC', score: 1 }, 'd1-3': { axis: 'AC', score: -1 }, 'd1-4': { axis: 'AC', score: -2 },
  'd2-1': { axis: 'AC', score: 2 }, 'd2-2': { axis: 'AC', score: 1 }, 'd2-3': { axis: 'AC', score: -1 }, 'd2-4': { axis: 'AC', score: -2 },
  'd3-1': { axis: 'NU', score: 2 }, 'd3-2': { axis: 'NU', score: 1 }, 'd3-3': { axis: 'NU', score: -1 }, 'd3-4': { axis: 'NU', score: -2 },
  'd4-1': { axis: 'NU', score: 2 }, 'd4-2': { axis: 'NU', score: 1 }, 'd4-3': { axis: 'NU', score: -1 }, 'd4-4': { axis: 'NU', score: -2 },
  'd5-1': { axis: 'PS', score: 2 }, 'd5-2': { axis: 'PS', score: 1 }, 'd5-3': { axis: 'PS', score: -1 }, 'd5-4': { axis: 'PS', score: -2 },
  'd6-1': { axis: 'PS', score: 2 }, 'd6-2': { axis: 'PS', score: 1 }, 'd6-3': { axis: 'PS', score: -1 }, 'd6-4': { axis: 'PS', score: -2 },
  'd7-1': { axis: 'BL', score: 2 }, 'd7-2': { axis: 'BL', score: 1 }, 'd7-3': { axis: 'BL', score: -1 }, 'd7-4': { axis: 'BL', score: -2 },
  'd8-1': { axis: 'BL', score: 2 }, 'd8-2': { axis: 'BL', score: 1 }, 'd8-3': { axis: 'BL', score: -1 }, 'd8-4': { axis: 'BL', score: -2 },
};

const TOTAL_Q = 8;

interface State {
  current: number;
  answers: (string | null)[];
}

export function initDna(root: HTMLElement) {
  const state: State = { current: 0, answers: new Array(TOTAL_Q).fill(null) };
  const introEl = root.querySelector<HTMLElement>('[data-screen="intro"]');
  const questionsEl = root.querySelector<HTMLElement>('[data-screen="questions"]');
  const resultEls = root.querySelectorAll<HTMLElement>('[data-screen="result"]');
  const progressFill = root.querySelector<HTMLElement>('#dna-progress-fill');
  const qCurrent = root.querySelector<HTMLElement>('#dna-q-current');
  const startBtn = root.querySelector<HTMLButtonElement>('#dna-start-btn');

  // URL ?code=ANPB 진입
  const url = new URL(window.location.href);
  const codeParam = url.searchParams.get('code');
  if (codeParam && /^[AC][NU][PS][BL]$/.test(codeParam)) {
    showResult(codeParam, { AC: codeParam[0] === 'A' ? 80 : 20, NU: codeParam[1] === 'N' ? 80 : 20, PS: codeParam[2] === 'P' ? 80 : 20, BL: codeParam[3] === 'B' ? 80 : 20 });
  } else {
    showScreen('intro');
  }

  startBtn?.addEventListener('click', () => {
    state.current = 0;
    state.answers = new Array(TOTAL_Q).fill(null);
    showScreen('questions');
    showQuestion(0);
    updateProgress();
  });

  questionsEl?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.dna-option');
    if (!btn) return;
    const id = btn.dataset.optionId;
    if (!id) return;
    btn.parentElement?.querySelectorAll('.dna-option').forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    state.answers[state.current] = id;
    setTimeout(() => {
      if (state.current < TOTAL_Q - 1) {
        state.current++;
        showQuestion(state.current);
        updateProgress();
      } else {
        const { code, percent } = compute(state.answers);
        showResult(code, percent);
        const u = new URL(window.location.href);
        u.searchParams.set('code', code);
        window.history.replaceState({}, '', u.toString());
      }
    }, 220);
  });

  root.querySelectorAll<HTMLButtonElement>('.dna-retake-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const u = new URL(window.location.href);
      u.searchParams.delete('code');
      window.history.replaceState({}, '', u.toString());
      state.current = 0;
      state.answers = new Array(TOTAL_Q).fill(null);
      root.querySelectorAll('.dna-option.is-selected').forEach((b) => b.classList.remove('is-selected'));
      showScreen('intro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 공유 버튼
  root.querySelectorAll<HTMLButtonElement>('.dna-share-btn').forEach((b) => {
    b.addEventListener('click', async () => {
      const action = b.dataset.shareAction;
      const code = (b.closest('[data-code]') as HTMLElement | null)?.dataset.code;
      const text = code ? `내 여행 DNA는 ${code} — 너의 코드는?` : '여행 DNA 분석';
      const u = window.location.href;
      if (action === 'native' && navigator.share) {
        try { await navigator.share({ title: text, text, url: u }); } catch {}
      } else {
        try { await navigator.clipboard.writeText(u); } catch {
          const ta = document.createElement('textarea'); ta.value = u;
          ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch {}
          document.body.removeChild(ta);
        }
        showToast('복사됐어요');
      }
    });
  });

  function showScreen(name: 'intro' | 'questions' | 'result', code?: string) {
    if (introEl) introEl.hidden = name !== 'intro';
    if (questionsEl) questionsEl.hidden = name !== 'questions';
    resultEls.forEach((el) => { el.hidden = !(name === 'result' && el.dataset.code === code); });
  }
  function showResult(code: string, percent: { AC: number; NU: number; PS: number; BL: number }) {
    showScreen('result', code);
    const resultEl = Array.from(resultEls).find((el) => el.dataset.code === code);
    if (!resultEl) return;
    // 4축 양방향 막대 + 라벨
    const BALANCED_LABEL = ({ ko: '균형', en: 'Balanced', ja: 'バランス', zh: '均衡' } as Record<string, string>)[lang] || '균형';
    for (const a of AXES) {
      const pct = percent[a]; // 0~100, 50=중립, 높을수록 high쪽
      const fill = resultEl.querySelector<HTMLElement>(`[data-axis-fill="${a}"]`);
      const pctEl = resultEl.querySelector<HTMLElement>(`[data-axis="${a}"] .dna-axis-pct`);
      if (fill) {
        // 50% 중앙 기준 양방향
        if (Math.abs(pct - 50) <= 5) {
          // 거의 균형
          fill.style.left = '49%';
          fill.style.width = '2%';
          fill.classList.remove('is-high', 'is-low');
        } else if (pct >= 50) {
          // 오른쪽으로 차오름 (high쪽 = right end... 우리 시각화는 좌→우)
          // 라벨 순서: high(좌측)-pct-low(우측). high가 우세면 막대를 50%→pct로 (우측 방향)
          // 하지만 보기에 high가 좌측에 있으니 high 우세는 막대가 좌측으로 차오르는 게 직관적.
          // 그래서 high 우세 시 좌측에서 50%까지, low 우세 시 50%에서 우측으로.
          // pct >= 50 (high 우세): width = pct - 50, left = 100 - pct (오른쪽 끝에서 좌측 50%까지)
          // 실은 더 직관적인 표시: left = 50 - (pct - 50), width = pct - 50 → left가 50 이하부터 50까지
          fill.style.left = `${100 - pct}%`;
          fill.style.width = `${pct - 50}%`;
          fill.classList.add('is-high');
          fill.classList.remove('is-low');
        } else {
          // low 우세 (pct < 50): 50% → (50 + (50-pct)) = (50 + 50-pct) = 100-pct? 우측 방향
          // left=50, width=50-pct
          fill.style.left = '50%';
          fill.style.width = `${50 - pct}%`;
          fill.classList.add('is-low');
          fill.classList.remove('is-high');
        }
      }
      if (pctEl) {
        if (Math.abs(pct - 50) <= 5) {
          pctEl.textContent = BALANCED_LABEL;
        } else {
          const dom = pct >= 50 ? pct : 100 - pct;
          pctEl.textContent = `${dom}%`;
        }
        pctEl.dataset.pct = String(pct);
      }
    }
    // 레이더 차트 폴리곤 — 4축을 십자가 4꼭지점에 매핑
    // 꼭지점: 위(AC), 우(NU), 아래(AC inverted), 좌(NU inverted)? 다이아몬드는 4 꼭지점만 → 4축 매핑
    // AC=위, NU=우, PS=아래, BL=좌 (값 0~100을 0~100 거리로)
    const r = (v: number) => Math.max(8, v); // 최소 반경 8 (시각화)
    const top = r(percent.AC);
    const right = r(percent.NU);
    const bottom = r(percent.PS);
    const left = r(percent.BL);
    const points = `0,${-top} ${right},0 0,${bottom} ${-left},0`;
    const shape = resultEl.querySelector<SVGPolygonElement>('[data-radar-shape]');
    if (shape) shape.setAttribute('points', points);
    const dots = [
      { sel: 'data-radar-dot="0"', x: 0, y: -top },
      { sel: 'data-radar-dot="1"', x: right, y: 0 },
      { sel: 'data-radar-dot="2"', x: 0, y: bottom },
      { sel: 'data-radar-dot="3"', x: -left, y: 0 },
    ];
    for (const d of dots) {
      const el = resultEl.querySelector<SVGCircleElement>(`[${d.sel}]`);
      if (el) { el.setAttribute('cx', String(d.x)); el.setAttribute('cy', String(d.y)); }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function showQuestion(idx: number) {
    questionsEl?.querySelectorAll<HTMLElement>('.dna-question').forEach((q, i) => { q.hidden = i !== idx; });
  }
  function updateProgress() {
    const pct = ((state.current + 1) / TOTAL_Q) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (qCurrent) qCurrent.textContent = String(state.current + 1);
  }
}

function compute(answers: (string | null)[]): { code: string; percent: { AC: number; NU: number; PS: number; BL: number } } {
  const s = { AC: 0, NU: 0, PS: 0, BL: 0 };
  for (const id of answers) {
    if (!id) continue;
    const o = OPTIONS[id];
    if (!o) continue;
    s[o.axis] += o.score;
  }
  const pct = (v: number) => Math.round(((v + 4) / 8) * 100);
  const percent = { AC: pct(s.AC), NU: pct(s.NU), PS: pct(s.PS), BL: pct(s.BL) };
  const code = AXES.map((a) => (s[a] >= 0 ? HIGH[a] : LOW[a])).join('');
  return { code, percent };
}

function showToast(msg: string) {
  const old = document.getElementById('dna-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'dna-toast';
  t.textContent = msg;
  Object.assign(t.style, { position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: '#171717', color: '#fff', padding: '11px 22px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: '9999' });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
