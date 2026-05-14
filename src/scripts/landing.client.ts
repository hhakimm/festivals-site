/**
 * 랜딩 페이지 인터랙션 — 현재는 뉴스레터 폼 (localStorage 임시).
 * 추후 Stibee 같은 외부 서비스 연동 시 fetch 추가하면 됨.
 */

const STORAGE_KEY = 'newsletter:emails:v1';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getEmails(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveEmails(emails: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(emails)); } catch {}
}

export function initNewsletter(form: HTMLElement) {
  if (!(form instanceof HTMLFormElement)) return;
  const successMsg = form.dataset.success || '구독 신청이 접수됐어요';
  const alreadyMsg = form.dataset.already || '이미 구독하신 이메일이에요';
  const invalidMsg = form.dataset.invalid || '올바른 이메일 주소를 입력해 주세요';
  const status = form.parentElement?.querySelector<HTMLElement>('[data-newsletter-status]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim().toLowerCase();
    if (!status) return;
    status.classList.remove('is-success', 'is-error');

    if (!isValidEmail(email)) {
      status.textContent = invalidMsg;
      status.classList.add('is-error');
      return;
    }

    const emails = getEmails();
    if (emails.includes(email)) {
      status.textContent = alreadyMsg;
      status.classList.add('is-error');
      return;
    }
    emails.push(email);
    saveEmails(emails);
    status.textContent = successMsg;
    status.classList.add('is-success');
    form.reset();
  });
}
