import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { liveArtifacts } from './manifest.mjs';

const baseUrl = process.argv[2];
if (!baseUrl) throw new Error('Usage: node scripts/verify-live.mjs <pages-base-url>');
const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function fetchWithRetry(url, attempts = 48) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, Math.min(10000, 1500 + attempt * 250)));
  }
  throw new Error(`Live artifact unavailable after retries: ${url} (${lastError})`);
}

const rootResponse = await fetchWithRetry(base);
const rootBytes = Buffer.from(await rootResponse.arrayBuffer());
const localIndex = await fs.readFile('index.html');
if (sha256(rootBytes) !== sha256(localIndex)) throw new Error('Live root does not match index.html');
console.log(`live root: ${rootBytes.length} bytes, exact match`);

for (const file of liveArtifacts) {
  const url = new URL(file, base).href;
  const response = await fetchWithRetry(url);
  const liveBytes = Buffer.from(await response.arrayBuffer());
  const localBytes = await fs.readFile(file);
  if (sha256(liveBytes) !== sha256(localBytes)) {
    throw new Error(`${file}: live SHA-256 ${sha256(liveBytes)} does not match source ${sha256(localBytes)}`);
  }
  console.log(`${file}: ${liveBytes.length} bytes, exact match`);
}

const liveIndexText = rootBytes.toString('utf8');
for (const required of ['AI opportunity is abundant.', 'AI Opportunity Review', 'data-opportunity-review', 'data-authority-lock', 'data-decision-memo', 'Candidate vision for Artificial Intelligence (AI) Consultant']) {
  if (!liveIndexText.includes(required)) throw new Error(`Live homepage missing required content: ${required}`);
}
for (const rejected of ['Healthcare Intelligence Network', 'data-topology-scene', 'three.module.min.js', '<canvas']) {
  if (liveIndexText.toLowerCase().includes(rejected.toLowerCase())) throw new Error(`Live homepage contains obsolete system: ${rejected}`);
}
console.log(`live verification: ${liveArtifacts.length + 1} endpoints exact and current`);
