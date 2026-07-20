import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const indexHtml = read('index.html');
const appJs = read('app.js');
const reviewJs = read('opportunity-review.js');
const reviewCss = read('opportunity-review.css');
const publicSource = [
  indexHtml,
  appJs,
  reviewJs,
  reviewCss,
  read('styles.css'),
  read('site-core.css'),
  read('site-responsive.css')
].join('\n');

for (const marker of [
  'data-opportunity-review',
  'data-review-case-title',
  'data-review-case-problem',
  'data-review-row="consequence"',
  'data-review-row="evidence"',
  'data-review-row="authority"',
  'data-review-row="ownership"',
  'data-review-row="proof"',
  'data-authority-lock',
  'data-decision-memo',
  'data-memo-decision',
  'data-memo-boundary',
  'data-memo-proof'
]) {
  assert.match(publicSource, new RegExp(marker), `missing AI Opportunity Review marker: ${marker}`);
}

for (const rejected of [
  'Healthcare Intelligence Network',
  'AI Value Topology',
  'scenario-analysis',
  'decision-spectrum',
  'charter-grid',
  'three.module.min.js',
  'data-topology-scene',
  '<canvas'
]) {
  assert.doesNotMatch(publicSource, new RegExp(rejected, 'i'), `obsolete or redundant system remains: ${rejected}`);
}

assert.equal((indexHtml.match(/class="pressure-item"/g) || []).length, 3, 'homepage must contain exactly three public tensions');
assert.equal((indexHtml.match(/class="question-item"/g) || []).length, 4, 'homepage must contain exactly four executive questions');
assert.match(reviewJs, /at\(700, \(\) => lock\.dataset\.state = 'signed'\)/, 'authority sign-off timing missing');
assert.match(reviewJs, /at\(820, \(\) => memo\.dataset\.state = 'assembling'\)/, 'memo assembly must follow authority sign-off');
assert.match(reviewJs, /at\(1050, settle\)/, 'review must settle within 1.05 seconds');

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.pdf', 'application/pdf']
]);

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const candidate = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!candidate.startsWith(root) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': mimeTypes.get(path.extname(candidate)) ?? 'application/octet-stream' });
  fs.createReadStream(candidate).pipe(response);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/`;
const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOptions);
const screenshotDirectory = path.join(root, '.qa', 'opportunity-review');
fs.mkdirSync(screenshotDirectory, { recursive: true });

const scenarios = [
  ['prior-auth-completeness', 'Advance to controlled proof'],
  ['claim-exception-triage', 'Assist while evidence develops'],
  ['provider-data-confidence', 'Hold for readiness'],
  ['member-service-preparation', 'Human-led; AI support bounded']
];
const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 320, height: 800 }
];

async function waitForSettled(page) {
  await page.waitForFunction(() => {
    const surface = document.querySelector('[data-review-state]');
    const memo = document.querySelector('[data-decision-memo]');
    const lock = document.querySelector('[data-authority-lock]');
    return surface?.dataset.reviewState === 'resolved' && memo?.dataset.state === 'resolved' && lock?.dataset.state === 'signed';
  });
}

try {
  const staticContext = await browser.newContext({ viewport: viewports[0], javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await staticPage.locator('[data-review-row][data-state="resolved"]').count(), 5, 'static baseline must contain five resolved decisions');
  assert.equal(await staticPage.locator('[data-decision-memo][data-state="resolved"]').count(), 1, 'static baseline must contain a resolved decision memo');
  assert.equal((await staticPage.locator('[data-memo-decision]').textContent()).trim(), 'Advance to controlled proof');
  await staticContext.close();

  const desktopContext = await browser.newContext({ viewport: viewports[0] });
  const desktopPage = await desktopContext.newPage();
  const desktopThreeRequests = [];
  const desktopErrors = [];
  desktopPage.on('request', request => {
    if (/three(?:\.module)?(?:\.min)?\.js/i.test(request.url())) desktopThreeRequests.push(request.url());
  });
  desktopPage.on('console', message => {
    if (message.type() === 'error') desktopErrors.push(message.text());
  });
  await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(desktopThreeRequests.length, 0, 'homepage must not request Three.js');
  assert.equal(await desktopPage.locator('canvas').count(), 0, 'homepage must not create a canvas');
  assert.equal(await desktopPage.locator('[data-review-row]').count(), 5);
  assert.deepEqual(desktopErrors, []);

  const seenReviews = new Set();
  for (const [id, decision] of scenarios) {
    await desktopPage.locator(`[data-scenario="${id}"]`).click();
    await waitForSettled(desktopPage);
    assert.equal((await desktopPage.locator('[data-memo-decision]').textContent()).trim(), decision);
    const snapshot = await desktopPage.locator('[data-review-row] [data-review-finding]').allTextContents();
    assert.equal(snapshot.length, 5);
    assert.equal(new Set(snapshot).size, 5, `${id} must contain five distinct review findings`);
    seenReviews.add(JSON.stringify(snapshot));
    assert.ok((await desktopPage.locator('[data-memo-boundary]').textContent()).trim().length > 25);
    assert.ok((await desktopPage.locator('[data-memo-proof]').textContent()).trim().length > 25);
    assert.ok((await desktopPage.locator('[data-memo-owner]').textContent()).trim().length > 10);
  }
  assert.equal(seenReviews.size, 4, 'all four workflow scenarios must produce materially different five-row reviews');

  await desktopPage.locator('[data-scenario="claim-exception-triage"]').click();
  await desktopPage.waitForTimeout(720);
  assert.equal(await desktopPage.locator('[data-authority-lock]').getAttribute('data-state'), 'signed', 'authority must be signed before decision assembly');
  assert.notEqual(await desktopPage.locator('[data-decision-memo]').getAttribute('data-state'), 'resolved', 'memo may not resolve before authority sign-off and assembly');
  await waitForSettled(desktopPage);

  await desktopPage.locator('[data-scenario="provider-data-confidence"]').click();
  await desktopPage.waitForTimeout(70);
  await desktopPage.locator('[data-scenario="member-service-preparation"]').click();
  await waitForSettled(desktopPage);
  assert.equal((await desktopPage.locator('[data-memo-decision]').textContent()).trim(), 'Human-led; AI support bounded', 'rapid selection must settle the final request');

  await desktopPage.locator('[data-reset-scenario]').click();
  await waitForSettled(desktopPage);
  assert.equal(await desktopPage.locator('[data-scenario="prior-auth-completeness"]').getAttribute('aria-pressed'), 'true');

  const firstButton = desktopPage.locator('[data-scenario]').first();
  await firstButton.focus();
  await desktopPage.keyboard.press('End');
  await waitForSettled(desktopPage);
  assert.equal(await desktopPage.locator('[data-scenario="member-service-preparation"]').getAttribute('aria-pressed'), 'true');
  await desktopPage.keyboard.press('Home');
  await waitForSettled(desktopPage);
  assert.equal(await desktopPage.locator('[data-scenario="prior-auth-completeness"]').getAttribute('aria-pressed'), 'true');

  const dossierBox = await desktopPage.locator('.review-dossier').boundingBox();
  const memoBox = await desktopPage.locator('[data-decision-memo]').boundingBox();
  assert.ok(dossierBox && memoBox && Math.abs((dossierBox.x + dossierBox.width) - memoBox.x) <= 2, 'desktop decision memo must remain physically connected to the review dossier');
  await desktopContext.close();

  const reducedContext = await browser.newContext({ viewport: viewports[0], reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' });
  await reducedPage.locator('[data-scenario="provider-data-confidence"]').click();
  assert.equal(await reducedPage.locator('[data-authority-lock]').getAttribute('data-state'), 'signed');
  assert.equal(await reducedPage.locator('[data-decision-memo]').getAttribute('data-state'), 'resolved');
  assert.equal((await reducedPage.locator('[data-memo-decision]').textContent()).trim(), 'Hold for readiness');
  await reducedContext.close();

  for (const viewport of viewports) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, `${viewport.width}px has horizontal overflow`);
    assert.equal(await page.locator('canvas').count(), 0);
    assert.equal(await page.locator('[data-review-row]').count(), 5);
    assert.deepEqual(errors, []);

    await page.locator('[data-opportunity-review]').screenshot({
      path: path.join(screenshotDirectory, `${viewport.width}-baseline.png`),
      animations: 'disabled'
    });
    await page.locator('[data-scenario="claim-exception-triage"]').click();
    await waitForSettled(page);
    await page.locator('[data-opportunity-review]').screenshot({
      path: path.join(screenshotDirectory, `${viewport.width}-claims.png`),
      animations: 'disabled'
    });

    if (mobile) {
      const caseBox = await page.locator('.review-case').boundingBox();
      const rowsBox = await page.locator('.review-rows').boundingBox();
      const memoBoxMobile = await page.locator('[data-decision-memo]').boundingBox();
      const selectorBox = await page.locator('.review-selector').boundingBox();
      assert.ok(caseBox && rowsBox && memoBoxMobile && selectorBox);
      assert.ok(caseBox.y < rowsBox.y && rowsBox.y < memoBoxMobile.y && memoBoxMobile.y < selectorBox.y, `${viewport.width}px mobile order must be case → decisions → memo → controls`);
      const touchTargets = await page.locator('[data-scenario]').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height));
      assert.ok(touchTargets.every(height => height >= 44), `${viewport.width}px scenario controls must meet 44px touch target`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log('AI Opportunity Review source, interaction, responsive, and performance contract passed.');
