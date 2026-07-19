import fs from 'node:fs';
import path from 'node:path';
import { expectedFiles } from './manifest.mjs';

const publicTextExtensions = new Set(['.html', '.css', '.js', '.mjs', '.md', '.txt', '.json', '.xml', '.yml', '.yaml']);
const publicFiles = [
  ...expectedFiles,
  'docs/Russell-Dudek-Highmark-Resume.pdf',
  'docs/Russell-Dudek-Highmark-Cover-Letter.pdf',
  'docs/Russell-Dudek-Highmark-Interview-Brief.pdf',
  'docs/Russell-Dudek-Highmark-90-Day-Plan.pdf',
  'docs/Russell-Dudek-Highmark-Fit-Brief.pdf',
  'docs/Russell-Dudek-Highmark-Opportunity-Charter.pdf'
];

for (const file of publicFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing public artifact: ${file}`);
  if (file !== '.nojekyll' && fs.statSync(file).size === 0) throw new Error(`Zero-byte public artifact: ${file}`);
}

const logoPath = 'assets/brand/highmark-standalone.png';
if (fs.statSync(logoPath).size < 1000) throw new Error('Highmark logo missing or too small');
if (fs.statSync('assets/brand/favicon.png').size < 500) throw new Error('Favicon missing or too small');

const tokens = fs.readFileSync('brand-tokens.css', 'utf8').toLowerCase();
for (const token of ['#008dd1', '#003963', '#00a2e2', '#0cb161', '#f7987d']) {
  if (!tokens.includes(token)) throw new Error(`Missing brand token ${token}`);
}

const sourceText = publicFiles
  .filter(file => publicTextExtensions.has(path.extname(file)))
  .map(file => `\n--- ${file} ---\n${fs.readFileSync(file, 'utf8')}`)
  .join('\n');

const forbidden = [
  /role\s*[-_ ]?\s*forge/i,
  /russelldudek\/roleforge/i,
  /github\.com\/russelldudek\/highmark/i,
  /Grahm\.Lyon@highmarkhealth\.org/i,
  /Heather\.Olsavsky@highmarkhealth\.org/i,
  /\brejection\b/i,
  /\breconsider(?:ation|ed|ing)?\b/i,
  /\bsecond look\b/i,
  /candidate slate/i
];
for (const pattern of forbidden) {
  if (pattern.test(sourceText)) throw new Error(`Forbidden candidate-facing text matched: ${pattern}`);
}

const index = fs.readFileSync('index.html', 'utf8');
if (!index.includes('assets/brand/highmark-standalone.png')) throw new Error('Visible Highmark identity missing');
if (!index.includes('Candidate vision for Artificial Intelligence (AI) Consultant')) throw new Error('Independent-candidate qualifier missing');
if (!index.includes('AI opportunity is abundant.')) throw new Error('Candidate thesis missing');
if (!index.includes('data-scenario-controls')) throw new Error('Scenario controls missing');
if (!index.includes('data-path-transcript')) throw new Error('Semantic path transcript missing');
if (!index.includes('https://careers.highmarkhealth.org/artificial-intelligence-ai-consultant/job/2F74264CD05D78DB8BF311E2F1A12F39')) throw new Error('Canonical job posting link missing');

const documents = [
  ['resume.html', 'cover-letter.html'],
  ['cover-letter.html', 'resume.html'],
  ['interview-brief.html', null],
  ['90-day-plan.html', null],
  ['fit-brief.html', null],
  ['opportunity-charter.html', null]
];
for (const [file, reciprocal] of documents) {
  const html = fs.readFileSync(file, 'utf8');
  for (const required of [
    '412.287.8640',
    'russelldudek@gmail.com',
    'linkedin.com/in/russelldudek',
    'https://russelldudek.github.io/highmark/'
  ]) {
    if (!html.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
  const downloads = html.match(/<a[^>]+download=[^>]+href="docs\/[^\"]+\.pdf"/g) || [];
  if (downloads.length !== 1) throw new Error(`${file}: expected one native PDF download, found ${downloads.length}`);
  if (/window\.print\(|>\s*Print\s*</i.test(html)) throw new Error(`${file}: redundant Print control found`);
  if (reciprocal && !html.includes(`href="${reciprocal}"`)) throw new Error(`${file}: missing reciprocal link to ${reciprocal}`);
}

const assetRefs = [...sourceText.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const ref of assetRefs) {
  if (/^https?:\/\//i.test(ref)) continue;
  if (/^(?:#|mailto:|tel:|javascript:)/i.test(ref)) continue;
  const clean = ref.split(/[?#]/)[0];
  if (!clean || clean.endsWith('.html')) continue;
  if (!fs.existsSync(clean)) throw new Error(`Broken local asset reference: ${ref}`);
}

console.log(`manifest: ${publicFiles.length} artifacts present`);
console.log('brand fidelity source checks: passed');
console.log('candidate-facing confidentiality: passed');
console.log('document contact and navigation checks: passed');
