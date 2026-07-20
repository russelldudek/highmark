import fs from 'node:fs';
import path from 'node:path';
import { requiredArtifacts } from './manifest.mjs';

const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.md', '.txt', '.json', '.xml', '.yml', '.yaml']);

for (const file of requiredArtifacts) {
  if (!fs.existsSync(file)) throw new Error(`Missing campaign artifact: ${file}`);
  if (file !== '.nojekyll' && fs.statSync(file).size === 0) throw new Error(`Zero-byte campaign artifact: ${file}`);
}

function walk(directory = '.') {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', '.qa', 'node_modules', 'test-results'].includes(entry.name)) continue;
    const relative = path.join(directory, entry.name).replace(/^\.\//, '');
    if (entry.isDirectory()) found.push(...walk(relative));
    else found.push(relative);
  }
  return found;
}

const completeTree = walk();
const treeTextFiles = completeTree.filter(file => textExtensions.has(path.extname(file)));
const sourceText = treeTextFiles.map(file => `\n--- ${file} ---\n${fs.readFileSync(file, 'utf8')}`).join('\n');

if (fs.statSync('assets/brand/highmark-standalone.png').size < 1000) throw new Error('Highmark logo missing or too small');
if (fs.statSync('assets/brand/favicon.png').size < 500) throw new Error('Favicon missing or too small');

const tokens = fs.readFileSync('brand-tokens.css', 'utf8').toLowerCase();
for (const token of ['#008dd1', '#003963', '#00a2e2', '#0cb161', '#f7987d']) {
  if (!tokens.includes(token)) throw new Error(`Missing brand token ${token}`);
}

const forbidden = [
  new RegExp(['role', '\\s*[-_ ]?\\s*', 'forge'].join(''), 'i'),
  new RegExp(['russelldudek\\/', 'role', 'forge'].join(''), 'i'),
  new RegExp(['github\\.com\\/', 'russelldudek\\/', 'highmark'].join(''), 'i'),
  new RegExp(['Grahm', '\\.Lyon@highmarkhealth\\.org'].join(''), 'i'),
  new RegExp(['Heather', '\\.Olsavsky@highmarkhealth\\.org'].join(''), 'i'),
  new RegExp(['\\bre', 'jection\\b'].join(''), 'i'),
  new RegExp(['\\bre', 'consider(?:ation|ed|ing)?\\b'].join(''), 'i'),
  new RegExp(['\\bsecond', ' look\\b'].join(''), 'i'),
  new RegExp(['candidate', ' slate'].join(''), 'i')
];
for (const pattern of forbidden) {
  if (pattern.test(sourceText)) throw new Error(`Forbidden candidate-facing text matched: ${pattern}`);
}
const forbiddenFilename = new RegExp(['role', '[-_ ]?', 'forge'].join(''), 'i');
for (const file of completeTree) {
  if (forbiddenFilename.test(file)) throw new Error(`Forbidden candidate-facing filename: ${file}`);
}

const index = fs.readFileSync('index.html', 'utf8');
for (const required of [
  'assets/brand/highmark-standalone.png',
  'Candidate vision for Artificial Intelligence (AI) Consultant',
  'AI opportunity is abundant.',
  'AI Opportunity Review',
  'data-opportunity-review',
  'data-review-row="authority"',
  'data-authority-lock',
  'data-decision-memo',
  'https://careers.highmarkhealth.org/artificial-intelligence-ai-consultant/job/2F74264CD05D78DB8BF311E2F1A12F39'
]) {
  if (!index.includes(required)) throw new Error(`Homepage missing required content: ${required}`);
}

if ((index.match(/class="pressure-item"/g) || []).length !== 3) throw new Error('Homepage must contain exactly three public tensions');
if ((index.match(/class="question-item"/g) || []).length !== 4) throw new Error('Homepage must contain exactly four executive questions');

const homepageFiles = ['index.html', 'app.js', 'opportunity-review.js', 'styles.css', 'site-core.css', 'site-responsive.css', 'opportunity-review.css'];
const homepageSource = homepageFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
for (const rejected of [
  'Healthcare Intelligence Network',
  'data-topology-scene',
  'three.module.min.js',
  'network-three.js',
  'network-view.js',
  '<canvas',
  'scenario-analysis',
  'decision-spectrum',
  'charter-grid'
]) {
  if (homepageSource.toLowerCase().includes(rejected.toLowerCase())) throw new Error(`Obsolete homepage system found: ${rejected}`);
}

for (const obsoleteFile of [
  'topology.js',
  'network-view.js',
  'network-three.js',
  'healthcare-network.css',
  'network-boot.css',
  'tests/healthcare-network.test.mjs',
  'assets/vendor/three/three.module.min.js',
  'assets/vendor/three/LICENSE'
]) {
  if (fs.existsSync(obsoleteFile)) throw new Error(`Obsolete campaign artifact remains: ${obsoleteFile}`);
}

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
  for (const required of ['412.287.8640', 'russelldudek@gmail.com', 'linkedin.com/in/russelldudek', 'https://russelldudek.github.io/highmark/']) {
    if (!html.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
  const downloads = html.match(/<a[^>]+download=[^>]+href="docs\/[^"]+\.pdf"/g) || [];
  if (downloads.length !== 1) throw new Error(`${file}: expected one native PDF download, found ${downloads.length}`);
  if (/window\.print\(|>\s*Print\s*</i.test(html)) throw new Error(`${file}: redundant Print control found`);
  if (reciprocal && !html.includes(`href="${reciprocal}"`)) throw new Error(`${file}: missing reciprocal link to ${reciprocal}`);
}

const assetSource = treeTextFiles.filter(file => ['.html', '.css', '.js'].includes(path.extname(file))).map(file => fs.readFileSync(file, 'utf8')).join('\n');
const assetRefs = [...assetSource.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const ref of assetRefs) {
  if (/^https?:\/\//i.test(ref) || /^(?:#|mailto:|tel:|javascript:)/i.test(ref)) continue;
  const clean = ref.split(/[?#]/)[0];
  if (!clean || clean.endsWith('.html')) continue;
  if (!fs.existsSync(clean)) throw new Error(`Broken local asset reference: ${ref}`);
}

console.log(`complete campaign manifest: ${requiredArtifacts.length} artifacts`);
console.log(`complete public text scan: ${treeTextFiles.length} files`);
console.log('brand fidelity source checks: passed');
console.log('candidate-facing confidentiality: passed');
console.log('AI Opportunity Review source checks: passed');
console.log('document contact and navigation checks: passed');
