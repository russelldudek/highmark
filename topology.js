import { DEFAULT_SCENARIO_ID, getScenario } from './assets/data/topology-scenarios.js';
import { mobileDevice, renderMobileNetwork, renderDesktopFallback } from './network-view.js';

const host = document.querySelector('[data-topology-scene]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let selected = getScenario(DEFAULT_SCENARIO_ID), mode = 'loading', desktop, timer;
const status = () => document.querySelector('[data-topology-status]');
const startStatus = scenario => { const node = status(); if (node) { node.textContent = scenario.title; node.dataset.settled = reduceMotion ? 'true' : 'false'; } };
const settleStatus = scenario => { const node = status(); if (node) { node.textContent = scenario.title; node.dataset.settled = 'true'; } };
const renderMobile = scenario => { mode = 'mobile'; document.documentElement.dataset.topologyState = mode; clearTimeout(timer); timer = renderMobileNetwork(host, scenario, reduceMotion, startStatus, settleStatus); };
const renderFallback = scenario => { mode = 'fallback'; document.documentElement.dataset.topologyState = mode; clearTimeout(timer); timer = renderDesktopFallback(host, scenario, reduceMotion, startStatus, settleStatus); };

async function init() {
  if (!host) return;
  if (mobileDevice()) { renderMobile(selected); return; }
  try {
    const [THREE, module] = await Promise.all([import('./assets/vendor/three/three.module.min.js'), import('./network-three.js')]);
    desktop = await module.createThreeNetwork({ THREE, host, stage: document.querySelector('[data-network-stage]'), scenario: selected, reduceMotion, startStatus, settleStatus });
    mode = 'desktop'; document.documentElement.dataset.topologyState = 'ready';
  } catch (error) { console.warn('Using designed semantic network fallback', error); renderFallback(selected); }
}

if (host) {
  init();
  addEventListener('topology:scenario', event => { selected = event.detail.scenario; if (mode === 'mobile') renderMobile(selected); else if (mode === 'fallback') renderFallback(selected); else desktop?.setScenario(selected); });
  addEventListener('pagehide', () => { clearTimeout(timer); desktop?.dispose(); });
}
