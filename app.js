import {
  DEFAULT_SCENARIO_ID,
  SCENARIOS,
  getScenario
} from './assets/data/topology-scenarios.js';

const state = { scenarioId: DEFAULT_SCENARIO_ID };

function renderPathTranscript(scenario) {
  const list = document.querySelector('[data-path-transcript]');
  if (!list) return;
  list.innerHTML = scenario.path.map((node, index) => `
    <li data-path-step>
      <span class="path-index">${String(index + 1).padStart(2, '0')}</span>
      <div>
        <strong>${node.label}</strong>
        <span>${node.detail}</span>
      </div>
    </li>
  `).join('');
}

function renderScenarioReadout(scenario) {
  const assignments = {
    '[data-scenario-title]': scenario.title,
    '[data-scenario-problem]': scenario.problem,
    '[data-owner]': scenario.owner,
    '[data-adoption]': scenario.adoptionBurden,
    '[data-disposition]': scenario.disposition.label,
    '[data-disposition-basis]': scenario.disposition.basis,
    '[data-public-boundary]': scenario.publicBoundary
  };
  for (const [selector, text] of Object.entries(assignments)) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }
  const metrics = document.querySelector('[data-measurement]');
  if (metrics) metrics.innerHTML = scenario.measurement.map(item => `<li>${item}</li>`).join('');
  const sourceNotes = document.querySelector('[data-source-notes]');
  if (sourceNotes) sourceNotes.innerHTML = scenario.sourceNotes.map(item => `<li>${item}</li>`).join('');
  const disposition = document.querySelector('[data-disposition]');
  if (disposition) disposition.dataset.tone = scenario.disposition.tone;
  renderPathTranscript(scenario);
}

export function setScenario(id) {
  const scenario = getScenario(id);
  state.scenarioId = id;
  document.documentElement.dataset.activeScenario = id;
  document.querySelectorAll('[data-scenario]').forEach(button => {
    const selected = button.dataset.scenario === id;
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  renderScenarioReadout(scenario);
  window.dispatchEvent(new CustomEvent('topology:scenario', { detail: { scenario } }));
}

function populateScenarioButtons() {
  const host = document.querySelector('[data-scenario-controls]');
  if (!host) return;
  host.innerHTML = SCENARIOS.map(item => `
    <button type="button" data-scenario="${item.id}" aria-pressed="false">
      <span>${item.shortLabel}</span>
      <small>Illustrative hypothesis</small>
    </button>
  `).join('');
}

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
  populateScenarioButtons();
  bindScenarioControls();
  bindNavigation();
  bindSectionObserver();
  setScenario(DEFAULT_SCENARIO_ID);
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
