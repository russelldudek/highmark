import {
  DEFAULT_SCENARIO_ID,
  SCENARIOS,
  getScenario
} from './assets/data/topology-scenarios.js';

const state = { scenarioId: DEFAULT_SCENARIO_ID };

function ensureNetworkMarkup() {
  const shell = document.querySelector('#value-topology');
  if (!shell) return;
  shell.className = 'network-shell';
  shell.setAttribute('aria-labelledby', 'topology-heading');
  shell.innerHTML = `
    <div class="network-heading-row">
      <div>
        <p class="section-number">01 · Decision instrument</p>
        <h2 id="topology-heading">Healthcare Intelligence Network</h2>
      </div>
      <p class="network-status" data-topology-status data-settled="false" aria-live="polite">Prior authorization completeness</p>
    </div>
    <div class="network-layout">
      <aside class="network-selector" data-network-selector>
        <p class="rail-kicker">Illustrative workflow</p>
        <div class="scenario-controls" data-scenario-controls aria-label="Illustrative workflow scenarios"></div>
        <button class="reset-control" type="button" data-reset-scenario>Reset baseline</button>
      </aside>
      <div class="network-stage" data-network-stage>
        <ol class="network-channel-list" data-network-channel-list aria-hidden="true"></ol>
        <div class="network-scene" data-topology-scene aria-hidden="true"></div>
        <div class="network-core-label" data-network-core>
          <span>Workflow intelligence</span>
          <strong>Evidence converges into a governed decision.</strong>
        </div>
        <div class="network-output-port" aria-hidden="true"><span></span></div>
      </div>
      <aside class="network-output" data-network-output>
        <p class="readout-label">Decision posture</p>
        <h3 data-network-posture data-tone="advance">Advance to controlled proof</h3>
        <dl>
          <div><dt>Operating owner</dt><dd data-network-owner></dd></div>
          <div><dt>Primary constraint</dt><dd data-network-constraint></dd></div>
          <div><dt>Evidence required next</dt><dd data-network-next-evidence></dd></div>
        </dl>
      </aside>
    </div>`;
}

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

function renderNetworkReadout(scenario) {
  const evidence = scenario.path.find(node => node.plane === 'evidence');
  const authority = scenario.path.find(node => node.plane === 'authority');
  const assignments = {
    '[data-network-posture]': scenario.disposition.label,
    '[data-network-owner]': scenario.owner,
    '[data-network-constraint]': evidence?.label ?? scenario.adoptionBurden,
    '[data-network-next-evidence]': `${authority?.label ?? 'Human authority'} · ${scenario.measurement.slice(0, 2).join(' + ')}`,
    '[data-topology-status]': scenario.title
  };
  for (const [selector, text] of Object.entries(assignments)) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }
  const posture = document.querySelector('[data-network-posture]');
  if (posture) posture.dataset.tone = scenario.disposition.tone;

  const channels = document.querySelector('[data-network-channel-list]');
  if (channels) {
    channels.innerHTML = scenario.path.map((node, index) => `
      <li data-channel="${node.plane}">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <div>
          <strong>${node.label}</strong>
          <small>${node.detail}</small>
        </div>
      </li>
    `).join('');
  }
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
  renderNetworkReadout(scenario);
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
  host.innerHTML = SCENARIOS.map((item, index) => `
    <button type="button" data-scenario="${item.id}" aria-pressed="false">
      <span class="scenario-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="scenario-copy">
        <strong>${item.shortLabel}</strong>
        <small>${item.title}</small>
      </span>
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
  ensureNetworkMarkup();
  populateScenarioButtons();
  bindScenarioControls();
  bindNavigation();
  bindSectionObserver();
  setScenario(DEFAULT_SCENARIO_ID);
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
