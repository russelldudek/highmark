const review = document.querySelector('[data-opportunity-review]');
const surface = review?.querySelector('[data-review-state]');
const rows = review ? [...review.querySelectorAll('[data-review-row]')] : [];
const memo = review?.querySelector('[data-decision-memo]');
const lock = review?.querySelector('[data-authority-lock]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let token = 0;
let timers = [];

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function populate(scenario) {
  window.dispatchEvent(new CustomEvent('review:populate', { detail: { scenario } }));
}

function setMemoLive(active) {
  if (!memo) return;
  memo.setAttribute('aria-live', active ? 'polite' : 'off');
  memo.setAttribute('aria-busy', active ? 'false' : 'true');
}

function settle() {
  if (!surface || !memo || !lock) return;
  surface.dataset.reviewState = 'resolved';
  surface.dataset.reviewStep = '5';
  rows.forEach(row => row.dataset.state = 'resolved');
  lock.dataset.state = 'signed';
  memo.dataset.state = 'resolved';
  setMemoLive(true);
}

function transitionScenario(scenario) {
  if (!surface || !memo || !lock) return;
  token += 1;
  const activeToken = token;
  clearTimers();

  if (reduceMotion) {
    populate(scenario);
    settle();
    return;
  }

  setMemoLive(false);
  surface.dataset.reviewState = 'closing';
  surface.dataset.reviewStep = '0';
  rows.forEach(row => row.dataset.state = 'pending');
  lock.dataset.state = 'pending';
  memo.dataset.state = 'withdrawn';

  const at = (delay, action) => timers.push(setTimeout(() => {
    if (activeToken === token) action();
  }, delay));

  at(140, () => {
    populate(scenario);
    surface.dataset.reviewState = 'reviewing';
  });

  rows.forEach((row, index) => {
    const delay = 280 + index * 105;
    at(delay - 55, () => row.dataset.state = 'reviewing');
    at(delay, () => {
      row.dataset.state = 'resolved';
      surface.dataset.reviewStep = String(index + 1);
    });
  });

  at(700, () => lock.dataset.state = 'signed');
  at(820, () => memo.dataset.state = 'assembling');
  at(1050, settle);
}

if (review) {
  window.addEventListener('review:scenario', event => transitionScenario(event.detail.scenario));
  window.addEventListener('pagehide', clearTimers);
  settle();
}
