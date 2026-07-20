export const requiredArtifacts = [
  'index.html',
  'resume.html',
  'cover-letter.html',
  'interview-brief.html',
  '90-day-plan.html',
  'fit-brief.html',
  'opportunity-charter.html',
  'styles.css',
  'site-core.css',
  'site-responsive.css',
  'healthcare-network.css',
  'documents.css',
  'brand-tokens.css',
  'app.js',
  'topology.js',
  'network-view.js',
  'network-three.js',
  'package.json',
  'scripts/build-pdfs.mjs',
  'scripts/check-generated-pdfs.mjs',
  'scripts/validate-source.mjs',
  'scripts/validate-pdfs.mjs',
  'scripts/verify-live.mjs',
  'tests/scenario-model.test.mjs',
  'tests/healthcare-network.test.mjs',
  '.github/workflows/publish-assets.yml',
  'assets/data/topology-scenarios.js',
  'assets/brand/highmark-standalone.png',
  'assets/brand/favicon.png',
  'assets/vendor/three/three.module.min.js',
  'assets/vendor/three/LICENSE',
  'brand-intelligence.md',
  'campaign-audit.md',
  'README.md',
  '.nojekyll',
  'docs/Russell-Dudek-Highmark-Resume.pdf',
  'docs/Russell-Dudek-Highmark-Cover-Letter.pdf',
  'docs/Russell-Dudek-Highmark-Interview-Brief.pdf',
  'docs/Russell-Dudek-Highmark-90-Day-Plan.pdf',
  'docs/Russell-Dudek-Highmark-Fit-Brief.pdf',
  'docs/Russell-Dudek-Highmark-Opportunity-Charter.pdf'
];

export const liveArtifacts = requiredArtifacts.filter(file =>
  !file.startsWith('.') &&
  !file.startsWith('scripts/') &&
  !file.startsWith('tests/') &&
  file !== 'package.json' &&
  file !== 'campaign-audit.md' &&
  file !== 'brand-intelligence.md'
);
