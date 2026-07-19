import fs from 'node:fs';
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
  const document = await PDFDocument.load(fs.readFileSync(file));
  const actual = document.getPageCount();
  if (actual !== pages) throw new Error(`${file}: expected ${pages} pages, got ${actual}`);
  console.log(`${file}: ${actual} page${actual === 1 ? '' : 's'}`);
}
