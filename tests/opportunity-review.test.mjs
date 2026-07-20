import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const indexHtml = read('index.html');
const appJs = read('app.js');
const styles = [read('styles.css'), read('site-core.css'), read('site-responsive.css')].join('\n');
const publicSource = [indexHtml, appJs, styles].join('\n');

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

console.log('AI Opportunity Review source contract passed.');
