import { PLANE_LABELS } from './assets/data/topology-scenarios.js';

export const keys = ['workflow', 'evidence', 'authority', 'adoption', 'value'];
export const hex = ['#008dd1', '#21d9e7', '#f7987d', '#b79bff', '#8bd450'];
export const numeric = [0x008dd1, 0x21d9e7, 0xf7987d, 0xb79bff, 0x8bd450];
export const outcome = { advance: 0x8bd450, assist: 0x21d9e7, hold: 0xffe96a, human: 0xf7987d, stop: 0xff7d7d };
export const mobileDevice = () => matchMedia('(max-width: 760px)').matches || (matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 932px)').matches);
export const scenarioView = scenario => scenario.path.map((node, index) => ({ key: keys[index], label: PLANE_LABELS[keys[index]], detail: node.label, offset: Math.max(-1, Math.min(1, node.x / 1.35)), color: hex[index] }));
const svgNode = (name, attrs = {}) => { const node = document.createElementNS('http://www.w3.org/2000/svg', name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
const colorFor = scenario => `#${(outcome[scenario.disposition.tone] ?? outcome.advance).toString(16).padStart(6, '0')}`;

function coreSvg(x, y, scale = 1) {
  const group = svgNode('g', { transform: `translate(${x} ${y}) scale(${scale})` });
  group.append(
    svgNode('path', { d: 'M-41 -70 L39 -53 L62 2 L37 65 L-42 76 L-65 18 L-62 -22 Z', fill: '#07324a', stroke: '#66d5ff', 'stroke-width': 2 }),
    svgNode('path', { d: 'M-28 -48 L26 -37 L43 2 L25 45 L-28 53 L-44 14 L-42 -16 Z', fill: '#08283b', stroke: '#247ba1', 'stroke-width': 1.2 }),
    svgNode('circle', { cx: -6, cy: 2, r: 27, fill: 'none', stroke: '#f7987d', 'stroke-width': 4 })
  );
  return group;
}

function animateSvg(svg, scenario, reduceMotion, settle) {
  if (reduceMotion) { settle(scenario); return; }
  svg.querySelectorAll('.network-mobile-path').forEach(path => path.classList.add('is-entering'));
  requestAnimationFrame(() => requestAnimationFrame(() => svg.querySelectorAll('.network-mobile-path').forEach(path => path.classList.remove('is-entering'))));
  return setTimeout(() => settle(scenario), 920);
}

export function renderMobileNetwork(host, scenario, reduceMotion, start, settle) {
  const items = scenarioView(scenario);
  const svg = svgNode('svg', { class: 'healthcare-network-svg mobile-network-svg', viewBox: '0 0 360 430', role: 'img', 'aria-label': `${scenario.title}: healthcare intelligence decision network` });
  const defs = svgNode('defs'); defs.innerHTML = '<filter id="mobile-network-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'; svg.append(defs);
  const coreX = 252, coreY = 218;
  items.forEach((item, index) => {
    const y = 64 + index * 54, startX = 132 + item.offset * 5, endY = coreY - 58 + index * 29;
    const number = svgNode('text', { x: 2, y: y - 8, class: 'mobile-network-index' }); number.textContent = `0${index + 1}`;
    const label = svgNode('text', { x: 22, y: y - 8, class: 'mobile-network-label' }); label.textContent = item.label;
    const detail = svgNode('text', { x: 22, y: y + 9, class: 'mobile-network-detail' }); detail.textContent = item.detail.length > 31 ? `${item.detail.slice(0, 30)}…` : item.detail;
    svg.append(number, label, detail,
      svgNode('path', { d: `M ${startX} ${y} C 178 ${y}, 190 ${endY}, ${coreX - 52} ${endY}`, fill: 'none', stroke: item.color, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'network-mobile-path', pathLength: 100, filter: 'url(#mobile-network-glow)' }),
      svgNode('circle', { cx: startX, cy: y, r: 3.3, fill: item.color }));
  });
  svg.append(coreSvg(coreX, coreY, .72));
  const coreSub = svgNode('text', { x: coreX - 8, y: coreY - 6, class: 'mobile-network-core-sub', 'text-anchor': 'middle' }); coreSub.textContent = 'WORKFLOW';
  const coreTitle = svgNode('text', { x: coreX - 8, y: coreY + 10, class: 'mobile-network-core-title', 'text-anchor': 'middle' }); coreTitle.textContent = 'INTELLIGENCE';
  const outputColor = colorFor(scenario);
  const output = svgNode('path', { d: `M ${coreX + 47} ${coreY} C 330 ${coreY}, 315 315, 302 332 L 302 362`, fill: 'none', stroke: outputColor, 'stroke-width': 4, 'stroke-linecap': 'round', class: 'network-mobile-path', pathLength: 100, filter: 'url(#mobile-network-glow)' });
  const kicker = svgNode('text', { x: 68, y: 394, class: 'mobile-network-core-sub' }); kicker.textContent = 'DECISION POSTURE';
  const result = svgNode('text', { x: 68, y: 410, class: 'mobile-network-outcome' }); result.textContent = scenario.disposition.label;
  svg.append(coreSub, coreTitle, output, svgNode('circle', { cx: 302, cy: 362, r: 7, fill: outputColor, filter: 'url(#mobile-network-glow)' }), svgNode('rect', { x: 52, y: 378, width: 260, height: 42, rx: 3, fill: '#052337', stroke: outputColor, 'stroke-width': 1.2 }), kicker, result);
  host.replaceChildren(svg); start(scenario); return animateSvg(svg, scenario, reduceMotion, settle);
}

export function renderDesktopFallback(host, scenario, reduceMotion, start, settle) {
  const svg = svgNode('svg', { class: 'healthcare-network-svg desktop-fallback-svg', viewBox: '0 0 820 520', role: 'img', 'aria-label': `${scenario.title}: healthcare intelligence decision network` });
  const defs = svgNode('defs'); defs.innerHTML = '<filter id="desktop-network-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMerge><feMergeNode in="SourceGraphic"/></feMerge></filter>'.replace('<feMerge><feMergeNode in="SourceGraphic"/></feMerge>', '<feMergeNode in="SourceGraphic"/></feMerge>'); svg.append(defs);
  const coreX = 520, coreY = 260;
  scenarioView(scenario).forEach((item, index) => {
    const y = 115 + index * 72, endY = coreY - 110 + index * 55;
    svg.append(svgNode('path', { d: `M 180 ${y} C 315 ${y}, 360 ${endY}, ${coreX - 66} ${endY}`, fill: 'none', stroke: item.color, 'stroke-width': 4, 'stroke-linecap': 'round', class: 'network-mobile-path', pathLength: 100, filter: 'url(#desktop-network-glow)' }), svgNode('circle', { cx: 180, cy: y, r: 5, fill: item.color }));
  });
  svg.append(coreSvg(coreX, coreY, 1.18));
  const outputColor = colorFor(scenario);
  svg.append(svgNode('path', { d: `M ${coreX + 72} ${coreY} C 665 ${coreY}, 700 ${coreY}, 790 ${coreY}`, fill: 'none', stroke: outputColor, 'stroke-width': 5, 'stroke-linecap': 'round', class: 'network-mobile-path', pathLength: 100, filter: 'url(#desktop-network-glow)' }), svgNode('circle', { cx: 790, cy: coreY, r: 8, fill: outputColor, filter: 'url(#desktop-network-glow)' }));
  host.replaceChildren(svg); start(scenario); return animateSvg(svg, scenario, reduceMotion, settle);
}
