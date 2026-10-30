// Regression checks for: the generation loader ("undefined" text), the card
// font fix on Vercel, the per-card style panel, and the Studio/teleprompter launch.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('the busy branch in review.js always produces markup, never an empty branch', () => {
  const review = read('public/create/review.js');
  assert.doesNotMatch(review, /else if \(isBusy\) \{\s*\} else if \(isBusy\)/,
    'an empty busy branch leaves body undefined and prints "undefined" on screen');
  assert.match(review, /body = busyMarkup\(st\);/);
  assert.match(review, /cc-busy-lines/);
});

test('the loader animations exist and respect reduced motion', () => {
  const css = read('public/create/create.css');
  assert.match(css, /@keyframes cc-busy-bounce/);
  assert.match(css, /@keyframes cc-busy-slide/);
  assert.match(css, /@keyframes cc-busy-line/);
  assert.match(css, /prefers-reduced-motion/);
});

test('fontconfig is pointed at the bundled fonts at runtime', () => {
  const { configureFontconfig } = require(path.join(ROOT, 'scripts/setupFonts'));
  const file = configureFontconfig();
  assert.ok(file, 'bundled fonts directory must exist');
  const xml = fs.readFileSync(file, 'utf8');
  assert.ok(xml.includes(path.join(ROOT, 'assets', 'fonts')), 'fontconfig must scan assets/fonts');
  assert.equal(process.env.FONTCONFIG_FILE, file);
  assert.ok(file.startsWith(os.tmpdir()), 'generated config lives in a writable temp dir');
});

test('card text colour is applied only for a valid hex colour', () => {
  const statCard = read('services/statCard.js');
  assert.match(statCard, /withTextColor\(resolvePalette\(paletteKey, themeKey\), slide\.textColor\)/);
  assert.match(statCard, /\^#\[0-9a-f\]\{6\}\$\/i/);
});

test('the style panel uses the scoped cc- prefix and is wired to its handlers', () => {
  const core = read('public/core.js');
  for (const fn of ['cpSetCardStyle', 'cpPickCardBackground']) {
    assert.match(core, new RegExp('window\\.' + fn + ' = '), fn + ' must be defined');
  }
  assert.match(core, /class="cc-tools"/);
  assert.doesNotMatch(core, /Apply to card image/);
});

test('the Studio opens the teleprompter view for script outputs', () => {
  const core = read('public/core.js');
  const studio = read('public/studio.js');
  assert.match(core, /cs\.studioDirect = true;/, 'Studio must be switched on before the script loads');
  assert.match(studio, /window\.svDirectView = function\(\)\{[\s\S]{0,300}st\.mode === 'camera'/,
    'svDirectView must follow the camera mode, not always show the start screen');
  const review = read('public/create/review.js');
  assert.match(review, /\/script\/i\.test\(String\(st\.format/, 'Studio button only for script formats');
});
