import * as THREE from './assets/vendor/three/three.module.min.js';
import {
  DEFAULT_SCENARIO_ID,
  PLANE_LABELS,
  SCENARIOS,
  getScenario
} from './assets/data/topology-scenarios.js';

const host = document.querySelector('[data-topology-scene]');
const status = document.querySelector('[data-topology-status]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const planeKeys = ['workflow', 'evidence', 'authority', 'adoption', 'value'];
const planeColors = [0x00a2e2, 0x21d9e7, 0xf7987d, 0xb79bff, 0x8bd450];
const planePositions = [
  new THREE.Vector3(-1.55, 1.25, 2.8),
  new THREE.Vector3(-0.75, 0.65, 1.4),
  new THREE.Vector3(0, 0.03, 0),
  new THREE.Vector3(0.75, -0.62, -1.4),
  new THREE.Vector3(1.55, -1.22, -2.8)
];

let renderer;
let scene;
let camera;
let routeLine;
let routeGlow;
let routePoints = [];
let activeAnimation = 0;
let selectedScenario = getScenario(DEFAULT_SCENARIO_ID);
let disposed = false;
let fallbackMode = false;
const planeLabels = [];
const nodeMeshes = new Map();

function createPlaneLabel(key, text) {
  const element = document.createElement('div');
  element.className = 'plane-label';
  element.dataset.planeLabel = key;
  element.innerHTML = `<span>${text}</span>`;
  host.append(element);
  planeLabels.push({ key, element });
}

function nodePosition(scenario, planeIndex) {
  const item = scenario.path[planeIndex];
  const base = planePositions[planeIndex];
  return new THREE.Vector3(base.x + item.x * 1.25, base.y + 0.22, base.z);
}

function createGraphField() {
  const ambientEdges = [];
  planeKeys.forEach((key, planeIndex) => {
    const base = planePositions[planeIndex];
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.07, 2.5),
      new THREE.MeshPhysicalMaterial({
        color: planeColors[planeIndex],
        transparent: true,
        opacity: 0.085,
        roughness: 0.74,
        metalness: 0,
        clearcoat: 0.18,
        side: THREE.DoubleSide
      })
    );
    slab.position.copy(base);
    slab.rotation.set(-0.12, 0.08, -0.025);
    scene.add(slab);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(slab.geometry),
      new THREE.LineBasicMaterial({ color: planeColors[planeIndex], transparent: true, opacity: 0.28 })
    );
    edge.position.copy(slab.position);
    edge.rotation.copy(slab.rotation);
    scene.add(edge);

    createPlaneLabel(key, PLANE_LABELS[key]);

    for (const scenario of SCENARIOS) {
      const point = nodePosition(scenario, planeIndex);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 24, 16),
        new THREE.MeshStandardMaterial({
          color: planeColors[planeIndex],
          emissive: planeColors[planeIndex],
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.05,
          transparent: true,
          opacity: 0.5
        })
      );
      sphere.position.copy(point);
      sphere.userData = { scenarioId: scenario.id, planeIndex };
      scene.add(sphere);
      nodeMeshes.set(`${scenario.id}:${planeIndex}`, sphere);
    }
  });

  for (let planeIndex = 0; planeIndex < planeKeys.length - 1; planeIndex += 1) {
    for (const fromScenario of SCENARIOS) {
      for (const toScenario of SCENARIOS) {
        const from = nodePosition(fromScenario, planeIndex);
        const to = nodePosition(toScenario, planeIndex + 1);
        ambientEdges.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    }
  }
  const graphGeometry = new THREE.BufferGeometry();
  graphGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ambientEdges, 3));
  const graph = new THREE.LineSegments(
    graphGeometry,
    new THREE.LineBasicMaterial({ color: 0x2f7da7, transparent: true, opacity: 0.085 })
  );
  scene.add(graph);
}

function buildRouteGeometry(scenario) {
  const controlPoints = scenario.path.map((_, index) => nodePosition(scenario, index));
  const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);
  routePoints = curve.getPoints(120);
  const geometry = new THREE.BufferGeometry().setFromPoints(routePoints);
  geometry.setDrawRange(0, routePoints.length);
  return geometry;
}

function disposeRoute() {
  for (const object of [routeLine, routeGlow]) {
    if (!object) continue;
    scene.remove(object);
    object.geometry.dispose();
    object.material.dispose();
  }
  routeLine = undefined;
  routeGlow = undefined;
}

function setNodeState(scenario, progress = 1) {
  planeKeys.forEach((_, planeIndex) => {
    for (const candidate of SCENARIOS) {
      const mesh = nodeMeshes.get(`${candidate.id}:${planeIndex}`);
      if (!mesh) continue;
      const selected = candidate.id === scenario.id;
      const reached = progress >= planeIndex / (planeKeys.length - 1) - 0.02;
      mesh.material.opacity = selected ? (reached ? 1 : 0.32) : 0.18;
      mesh.material.emissiveIntensity = selected && reached ? 2.3 : selected ? 0.5 : 0.1;
      const scale = selected && reached ? 1.55 : selected ? 1.15 : 0.78;
      mesh.scale.setScalar(scale);
    }
  });
}

function installRoute(scenario) {
  disposeRoute();
  const baseGeometry = buildRouteGeometry(scenario);
  routeGlow = new THREE.Line(
    baseGeometry.clone(),
    new THREE.LineBasicMaterial({ color: 0x00a2e2, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending })
  );
  routeGlow.scale.setScalar(1.003);
  routeLine = new THREE.Line(
    baseGeometry,
    new THREE.LineBasicMaterial({ color: 0xb9efff, transparent: true, opacity: 0.98 })
  );
  scene.add(routeGlow, routeLine);
}

function settleScenario(scenario) {
  installRoute(scenario);
  routeLine.geometry.setDrawRange(0, routePoints.length);
  routeGlow.geometry.setDrawRange(0, routePoints.length);
  setNodeState(scenario, 1);
  if (status) {
    status.textContent = scenario.title;
    status.dataset.settled = 'true';
  }
}

function animateScenario(scenario) {
  selectedScenario = scenario;
  activeAnimation += 1;
  const animationId = activeAnimation;
  installRoute(scenario);
  setNodeState(scenario, 0);
  if (status) {
    status.textContent = scenario.title;
    status.dataset.settled = 'false';
  }
  if (reduceMotion || document.documentElement.dataset.topologyState === 'fallback') {
    settleScenario(scenario);
    return;
  }
  const duration = 1050;
  const started = performance.now();
  const step = now => {
    if (animationId !== activeAnimation) return;
    const raw = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - raw, 3);
    const count = Math.max(2, Math.floor(routePoints.length * eased));
    routeLine.geometry.setDrawRange(0, count);
    routeGlow.geometry.setDrawRange(0, count);
    setNodeState(scenario, eased);
    if (raw < 1) requestAnimationFrame(step);
    else if (status) status.dataset.settled = 'true';
  };
  requestAnimationFrame(step);
}

function projectLabels() {
  if (!camera) return;
  const width = host.clientWidth;
  const height = host.clientHeight;
  planeLabels.forEach(({ key, element }, index) => {
    const point = planePositions[index].clone();
    point.x -= 2.45;
    point.y += 0.55;
    point.project(camera);
    const labelWidth = Math.max(element.offsetWidth, 118);
    const labelHeight = Math.max(element.offsetHeight, 28);
    const x = (point.x * 0.5 + 0.5) * width;
    const y = (-point.y * 0.5 + 0.5) * height;
    const safeX = Math.max(10, Math.min(width - labelWidth - 10, x));
    const safeY = Math.max(10, Math.min(height - labelHeight - 10, y));
    element.style.transform = `translate3d(${safeX}px, ${safeY}px, 0)`;
    element.dataset.key = key;
  });
}

function resize() {
  if (!renderer || !camera) return;
  const rect = host.getBoundingClientRect();
  renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  camera.aspect = rect.width / Math.max(rect.height, 1);
  const mobile = rect.width < 640;
  camera.position.set(mobile ? 7.2 : 8.5, mobile ? 7.4 : 6.7, mobile ? 14.8 : 15.2);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  projectLabels();
}

function loop() {
  if (disposed || !renderer) return;
  projectLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function fallbackPoint(scenario, planeIndex) {
  const plane = scenario.path[planeIndex];
  const left = 72 + planeIndex * 44;
  const y = 72 + planeIndex * 88;
  return {
    x: left + 330 + plane.x * 165,
    y: y + 35
  };
}

function renderFallback(scenario) {
  host.querySelector('.fallback-topology')?.remove();
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('class', 'fallback-topology');
  svg.setAttribute('viewBox', '0 0 1000 540');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${scenario.title}: five-condition AI value path`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#00a2e2"/>
        <stop offset="0.5" stop-color="#f7987d"/>
        <stop offset="1" stop-color="#8bd450"/>
      </linearGradient>
      <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  `;
  const planeGroup = document.createElementNS(namespace, 'g');
  planeGroup.setAttribute('class', 'fallback-planes');
  const edgeGroup = document.createElementNS(namespace, 'g');
  edgeGroup.setAttribute('class', 'fallback-edges');
  const nodeGroup = document.createElementNS(namespace, 'g');
  nodeGroup.setAttribute('class', 'fallback-nodes');

  planeKeys.forEach((key, planeIndex) => {
    const left = 72 + planeIndex * 44;
    const y = 72 + planeIndex * 88;
    const polygon = document.createElementNS(namespace, 'polygon');
    polygon.setAttribute('points', `${left},${y + 22} ${left + 660},${y} ${left + 718},${y + 54} ${left + 58},${y + 76}`);
    polygon.setAttribute('class', `fallback-plane fallback-plane-${key}`);
    planeGroup.append(polygon);

    const label = document.createElementNS(namespace, 'text');
    label.setAttribute('x', String(left + 18));
    label.setAttribute('y', String(y + 50));
    label.setAttribute('data-plane-label', key);
    label.setAttribute('class', 'fallback-plane-label');
    label.textContent = PLANE_LABELS[key];
    planeGroup.append(label);

    for (const candidate of SCENARIOS) {
      const point = fallbackPoint(candidate, planeIndex);
      const circle = document.createElementNS(namespace, 'circle');
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', candidate.id === scenario.id ? '8' : '4');
      circle.setAttribute('class', candidate.id === scenario.id ? 'fallback-node selected' : 'fallback-node');
      nodeGroup.append(circle);
    }
  });

  for (let planeIndex = 0; planeIndex < planeKeys.length - 1; planeIndex += 1) {
    for (const candidate of SCENARIOS) {
      const from = fallbackPoint(candidate, planeIndex);
      const same = fallbackPoint(candidate, planeIndex + 1);
      const line = document.createElementNS(namespace, 'line');
      line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(same.x)); line.setAttribute('y2', String(same.y));
      line.setAttribute('class', 'fallback-edge');
      edgeGroup.append(line);
    }
    const from = fallbackPoint(SCENARIOS[planeIndex % SCENARIOS.length], planeIndex);
    const cross = fallbackPoint(SCENARIOS[(planeIndex + 2) % SCENARIOS.length], planeIndex + 1);
    const line = document.createElementNS(namespace, 'line');
    line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(cross.x)); line.setAttribute('y2', String(cross.y));
    line.setAttribute('class', 'fallback-edge cross');
    edgeGroup.append(line);
  }

  const activePoints = scenario.path.map((_, index) => fallbackPoint(scenario, index));
  const d = activePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const glow = document.createElementNS(namespace, 'path');
  glow.setAttribute('d', d); glow.setAttribute('class', 'fallback-active-glow'); glow.setAttribute('pathLength', '100');
  const path = document.createElementNS(namespace, 'path');
  path.setAttribute('d', d); path.setAttribute('class', 'fallback-active-path'); path.setAttribute('pathLength', '100');

  svg.append(planeGroup, edgeGroup, glow, path, nodeGroup);
  host.prepend(svg);
  if (status) {
    status.textContent = scenario.title;
    status.dataset.settled = reduceMotion ? 'true' : 'false';
    if (!reduceMotion) setTimeout(() => { if (status.textContent === scenario.title) status.dataset.settled = 'true'; }, 1050);
  }
}

function fallback(error) {
  console.warn('Using semantic topology fallback', error);
  fallbackMode = true;
  document.documentElement.dataset.topologyState = 'fallback';
  host.classList.add('topology-fallback');
  renderFallback(selectedScenario);
}

function supportsWebGL() {
  const probe = document.createElement('canvas');
  try {
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

function initScene() {
  if (!supportsWebGL()) {
    fallback(new Error('WebGL is unavailable in this browser environment.'));
    return;
  }
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x031421, 0);
  host.prepend(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xdff7ff, 0x061f31, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(5, 9, 11);
  scene.add(key);
  const rim = new THREE.PointLight(0x00a2e2, 14, 28, 1.5);
  rim.position.set(-5, 2, 7);
  scene.add(rim);

  createGraphField();
  document.documentElement.dataset.topologyState = 'ready';
  resize();
  animateScenario(selectedScenario);
  loop();
}

if (host) {
  try {
    initScene();
  } catch (error) {
    fallback(error);
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('topology:scenario', event => {
    selectedScenario = event.detail.scenario;
    if (fallbackMode) renderFallback(selectedScenario);
    else animateScenario(selectedScenario);
  });
  addEventListener('pagehide', () => { disposed = true; renderer?.dispose(); });
}
