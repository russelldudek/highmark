import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';

const expected = new Map([
  ['docs/Russell-Dudek-Highmark-Resume.pdf', 2],
  ['docs/Russell-Dudek-Highmark-Cover-Letter.pdf', 1],
  ['docs/Russell-Dudek-Highmark-Interview-Brief.pdf', 3],
  ['docs/Russell-Dudek-Highmark-90-Day-Plan.pdf', 3],
  ['docs/Russell-Dudek-Highmark-Fit-Brief.pdf', 2],
  ['docs/Russell-Dudek-Highmark-Opportunity-Charter.pdf', 1]
]);

for (const [file, pages] of expected) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 5000) throw new Error(`${file}: missing or too small`);
  const bytes = fs.readFileSync(file);
  const document = await PDFDocument.load(bytes);
  const actual = document.getPageCount();
  if (actual !== pages) throw new Error(`${file}: expected ${pages} pages, got ${actual}`);
  const text = execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' });
  for (const required of [
    'Russell Dudek',
    '412.287.8640',
    'russelldudek@gmail.com',
    'linkedin.com/in/russelldudek',
    'russelldudek.github.io/highmark'
  ]) {
    if (!text.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
  if (/role\s*[-_ ]?\s*forge/i.test(text)) throw new Error(`${file}: forbidden internal name`);
  if (/\b(?:rejection|reconsider(?:ation|ed|ing)?|second look|candidate slate)\b/i.test(text)) throw new Error(`${file}: defensive decision-reversal language`);
  if (/github\.com\/russelldudek\/highmark/i.test(text)) throw new Error(`${file}: source repository exposed`);
  const metadata = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  if (/role\s*[-_ ]?\s*forge/i.test(metadata)) throw new Error(`${file}: forbidden internal name in metadata`);
  console.log(`${file}: ${actual} page${actual === 1 ? '' : 's'}`);
}
console.log('PDF contracts: passed');
