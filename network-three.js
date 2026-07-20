import { numeric, outcome } from './network-view.js';

export async function createThreeNetwork({ THREE, host, stage, scenario, reduceMotion, startStatus, settleStatus }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x031421, 0); host.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(31, 1, .1, 100); camera.position.set(.35, .15, 13.2); camera.lookAt(.25, 0, 0);
  scene.add(new THREE.HemisphereLight(0xdff7ff, 0x06131f, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 5, 8); scene.add(key);
  const cyan = new THREE.PointLight(0x00a2e2, 11, 18, 1.4); cyan.position.set(-2, 1, 5); scene.add(cyan);
  const green = new THREE.PointLight(0x8bd450, 7, 12, 1.7); green.position.set(4, 0, 4); scene.add(green);
  const core = new THREE.Group(); core.position.set(.55, 0, 0); scene.add(core);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.8, 1.35), new THREE.MeshPhysicalMaterial({ color: 0x0a4668, transparent: true, opacity: .09, roughness: .22, clearcoat: .8, depthWrite: false }));
  core.add(shell, new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: 0x65ccef, transparent: true, opacity: .42 })));
  const inner = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.12, .78), new THREE.MeshPhysicalMaterial({ color: 0x0b2f46, transparent: true, opacity: .28, clearcoat: 1, depthWrite: false }));
  core.add(inner, new THREE.LineSegments(new THREE.EdgesGeometry(inner.geometry), new THREE.LineBasicMaterial({ color: 0x2fa8d5, transparent: true, opacity: .32 })));
  const authorityRing = new THREE.Mesh(new THREE.TorusGeometry(.62, .035, 12, 72), new THREE.MeshStandardMaterial({ color: 0xf7987d, emissive: 0xf7987d, emissiveIntensity: 1.2, transparent: true, opacity: .9 })); authorityRing.rotation.y = Math.PI / 2; authorityRing.position.x = -.08; core.add(authorityRing);
  const aperture = new THREE.Mesh(new THREE.TorusGeometry(.43, .028, 12, 64), new THREE.MeshStandardMaterial({ color: 0x8bd450, emissive: 0x8bd450, emissiveIntensity: .9, transparent: true, opacity: .82 })); aperture.rotation.y = Math.PI / 2; aperture.position.x = 1.1; core.add(aperture);
  let group = new THREE.Group(), transition = 0, visible = true; scene.add(group);
  const disposeGroup = () => { scene.remove(group); group.traverse(child => { child.geometry?.dispose?.(); child.material?.dispose?.(); }); group = new THREE.Group(); scene.add(group); };
  const curveFor = (node, index) => { const y = 2 - index, offset = Math.max(-1, Math.min(1, node.x / 1.35)); return new THREE.CatmullRomCurve3([new THREE.Vector3(-5.25, y, -.35 + index * .16), new THREE.Vector3(-3.45, y * .88 + offset * .18, .15 + offset * .32), new THREE.Vector3(-1.55, y * .58 + offset * .28, .18 - offset * .18), new THREE.Vector3(-.58, 1.12 - index * .56, .08 * (index - 2))], false, 'centripetal', .5); };
  const tube = (curve, radius, color, opacity) => new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 8, false), new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: .35, transparent: true, opacity, roughness: .28, clearcoat: .55, depthWrite: false }));
  const render = () => { if (visible && !document.hidden) renderer.render(scene, camera); };
  const resize = () => { const rect = host.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); render(); };
  const setScenario = next => {
    transition += 1; const current = transition; disposeGroup();
    const states = next.path.map((node, index) => { const curve = curveFor(node, index), mesh = tube(curve, .035, numeric[index], .08); group.add(mesh); const packet = new THREE.Mesh(new THREE.SphereGeometry(.085, 18, 12), new THREE.MeshStandardMaterial({ color: numeric[index], emissive: numeric[index], emissiveIntensity: 2.2, transparent: true, opacity: 0 })); group.add(packet); return { curve, mesh, packet, index }; });
    const color = outcome[next.disposition.tone] ?? outcome.advance;
    const outputCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.65, 0, 0), new THREE.Vector3(2.4, .05, .08), new THREE.Vector3(3.35, -.02, -.04), new THREE.Vector3(5.25, 0, 0)], false, 'centripetal', .5);
    const outputMesh = tube(outputCurve, .045, color, .05); group.add(outputMesh);
    const outputPacket = new THREE.Mesh(new THREE.SphereGeometry(.11, 20, 14), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5, transparent: true, opacity: 0 })); group.add(outputPacket); startStatus(next);
    const started = performance.now();
    const frame = now => {
      if (current !== transition) return;
      const p = reduceMotion || !visible || document.hidden ? 1 : Math.min(1, (now - started) / 900);
      states.forEach(({ curve, mesh, packet, index }) => { const local = Math.max(0, Math.min(1, (p - index * .085) / .56)); mesh.material.opacity = .08 + .58 * local; mesh.material.emissiveIntensity = .2 + local; packet.visible = local > 0 && local < .98; packet.material.opacity = packet.visible ? 1 : 0; packet.position.copy(curve.getPoint(Math.min(.98, local))); });
      const out = Math.max(0, Math.min(1, (p - .68) / .32)); outputMesh.material.opacity = .05 + .72 * out; outputPacket.visible = out > 0 && out < .98; outputPacket.material.opacity = outputPacket.visible ? 1 : 0; outputPacket.position.copy(outputCurve.getPoint(out)); authorityRing.material.emissiveIntensity = .4 + 2 * Math.max(0, Math.min(1, (p - .45) / .2)); render();
      if (p < 1) requestAnimationFrame(frame); else settleStatus(next);
    };
    requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; render(); }, { threshold: .05 }); observer.observe(stage);
  addEventListener('resize', resize, { passive: true }); document.addEventListener('visibilitychange', render); resize(); setScenario(scenario);
  return { setScenario, resize, dispose: () => { observer.disconnect(); renderer.dispose(); } };
}
