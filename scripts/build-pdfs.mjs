import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

const jobs = [
  ['resume.html', 'docs/Russell-Dudek-Highmark-Resume.pdf'],
  ['cover-letter.html', 'docs/Russell-Dudek-Highmark-Cover-Letter.pdf'],
  ['interview-brief.html', 'docs/Russell-Dudek-Highmark-Interview-Brief.pdf'],
  ['90-day-plan.html', 'docs/Russell-Dudek-Highmark-90-Day-Plan.pdf'],
  ['fit-brief.html', 'docs/Russell-Dudek-Highmark-Fit-Brief.pdf'],
  ['opportunity-charter.html', 'docs/Russell-Dudek-Highmark-Opportunity-Charter.pdf']
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Local server did not become ready: ${url}`);
}

await fs.mkdir('docs', { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '4173'], { stdio: 'ignore' });
let browser;
try {
  await waitForServer('http://127.0.0.1:4173/');
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  for (const [route, output] of jobs) {
    await page.goto(`http://127.0.0.1:4173/${route}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    await page.pdf({
      path: output,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      tagged: true,
      outline: true
    });
    console.log(`generated ${output}`);
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
