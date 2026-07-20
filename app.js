import {
  DEFAULT_SCENARIO_ID,
  REVIEW_ORDER,
  SCENARIOS,
  getScenario
} from './assets/data/topology-scenarios.js';

const state = { scenarioId: DEFAULT_SCENARIO_ID };

function text(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderScenario(scenario) {
  text('[data-review-case-title]', scenario.title);
  text('[data-review-case-problem]', scenario.problem);

  for (const key of REVIEW_ORDER) {
    const row = document.querySelector(`[data-review-row="${key}"]`);
    if (!row) continue;
    row.querySelector('[data-review-finding]').textContent = scenario.review[key].finding;
    row.querySelector('[data-review-implication]').textContent = scenario.review[key].implication;
  }

  text('[data-memo-decision]', scenario.disposition.label);
  text('[data-memo-boundary]', scenario.humanBoundary);
  text('[data-memo-proof]', scenario.proofDesign);
  text('[data-memo-owner]', scenario.owner);
  text('[data-public-boundary]', scenario.publicBoundary);

  const memoDecision = document.querySelector('[data-memo-decision]');
  if (memoDecision) memoDecision.dataset.tone = scenario.disposition.tone;

  const sourceNotes = document.querySelector('[data-source-notes]');
  if (sourceNotes) sourceNotes.innerHTML = scenario.sourceNotes.map(item => `<li>${item}</li>`).join('');
}

function applySelection(id) {
  state.scenarioId = id;
  document.documentElement.dataset.activeScenario = id;
  document.querySelectorAll('[data-scenario]').forEach(button => {
    const selected = button.dataset.scenario === id;
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

export function setScenario(id, { animate = true } = {}) {
  const scenario = getScenario(id);
  applySelection(id);
  if (animate) {
    window.dispatchEvent(new CustomEvent('review:scenario', { detail: { scenario } }));
  } else {
    renderScenario(scenario);
  }
}

window.addEventListener('review:populate', event => renderScenario(event.detail.scenario));

function bindScenarioControls() {
  const buttons = [...document.querySelectorAll('[data-scenario]')];
  for (const button of buttons) {
    button.addEventListener('click', () => setScenario(button.dataset.scenario));
    button.addEventListener('keydown', event => {
      const current = buttons.indexOf(button);
      let next = current;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % buttons.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== current) {
        event.preventDefault();
        buttons[next].focus();
        setScenario(buttons[next].dataset.scenario);
      }
    });
  }
  document.querySelector('[data-reset-scenario]')?.addEventListener('click', () => setScenario(DEFAULT_SCENARIO_ID));
}

function bindNavigation() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.dataset.open = String(!open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.dataset.open = 'false';
  }));
}

function bindSectionObserver() {
  const links = [...document.querySelectorAll('[data-site-nav] a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach(link => link.toggleAttribute('aria-current', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-30% 0px -60%', threshold: [0.05, 0.2, 0.5] });
  sections.forEach(section => observer.observe(section));
}

function init() {
  bindScenarioControls();
  bindNavigation();
  bindSectionObserver();
  setScenario(DEFAULT_SCENARIO_ID, { animate: false });
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
