import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const topologyJs = fs.readFileSync(path.join(root, 'topology.js'), 'utf8');
const networkCss = fs.readFileSync(path.join(root, 'healthcare-network.css'), 'utf8');
const rendererSource = [topologyJs, 'network-view.js', 'network-three.js'].map((file, index) => index ? fs.readFileSync(path.join(root, file), 'utf8') : file).join('\n');

const composedSource = `${indexHtml}\n${appJs}`;
for (const marker of [
  'data-network-selector', 'data-network-stage', 'data-network-core',
  'data-network-output', 'data-network-owner', 'data-network-constraint',
  'data-network-next-evidence'
]) assert.match(composedSource, new RegExp(marker), `missing ${marker}`);
assert.match(appJs, /ensureNetworkMarkup/);
assert.doesNotMatch(networkCss, /border-radius:\s*50%[^}]*transform:\s*rotate\(-7deg\)/i);
assert.match(appJs, /renderNetworkReadout/);
assert.match(topologyJs, /three\.module\.min\.js/);
assert.match(rendererSource, /900/);
assert.doesNotMatch(rendererSource, /function loop\s*\(/);

const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
]);
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const candidate = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!candidate.startsWith(root) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'content-type': types.get(path.extname(candidate)) ?? 'application/octet-stream' });
  fs.createReadStream(candidate).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}/`;

const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOptions);
const scenarios = [
  ['prior-auth-completeness', 'Advance to controlled proof'],
  ['claim-exception-triage', 'Assist while evidence develops'],
  ['provider-data-confidence', 'Hold for readiness'],
  ['member-service-preparation', 'Human-led; AI support bounded']
];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 800 }]) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const threeRequests = [];
    const consoleErrors = [];
    page.on('request', request => { if (request.url().includes('three.module.min.js')) threeRequests.push(request.url()); });
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    assert.equal(threeRequests.length, 0, `mobile ${viewport.width}px requested Three.js`);
    assert.equal(await page.locator('[data-network-stage] canvas').count(), 0);
    assert.equal(await page.locator('[data-network-stage] .healthcare-network-svg').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
    for (const [id, posture] of scenarios) {
      await page.locator(`[data-scenario="${id}"]`).click();
      await page.waitForTimeout(950);
      assert.equal((await page.locator('[data-network-posture]').textContent()).trim(), posture);
      assert.ok((await page.locator('[data-network-owner]').textContent()).trim().length > 10);
      assert.ok((await page.locator('[data-network-constraint]').textContent()).trim().length > 5);
      assert.ok((await page.locator('[data-network-next-evidence]').textContent()).trim().length > 10);
      assert.equal(await page.locator('[data-topology-status]').getAttribute('data-settled'), 'true');
    }
    const stageBounds = await page.locator('[data-network-stage]').boundingBox();
    const svgBounds = await page.locator('.healthcare-network-svg').boundingBox();
    assert.ok(stageBounds && svgBounds && svgBounds.x >= stageBounds.x - 1 && svgBounds.x + svgBounds.width <= stageBounds.x + stageBounds.width + 1);
    assert.deepEqual(consoleErrors, []);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const canvasCount = await page.locator('[data-network-stage] canvas').count();
  const fallbackCount = await page.locator('[data-network-stage] .desktop-fallback-svg').count();
  assert.equal(canvasCount + fallbackCount, 1, 'desktop must render exactly one designed network');
  await page.locator('[data-scenario="claim-exception-triage"]').click();
  await page.locator('[data-scenario="member-service-preparation"]').click();
  await page.waitForTimeout(950);
  assert.equal((await page.locator('[data-network-posture]').textContent()).trim(), 'Human-led; AI support bounded');
  assert.equal(await page.locator('[data-topology-status]').getAttribute('data-settled'), 'true');
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log('Healthcare Intelligence Network contract passed.');
