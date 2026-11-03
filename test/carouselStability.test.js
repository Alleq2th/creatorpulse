// Regressions for clean carousel plates, low-memory serial rendering and
// applying one consistent theme to every slide.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const core = read('public/core.js');
const renderer = read('services/statCard.js');
const html = read('public/index.html');
const sw = read('public/sw.js');

function fnBody(source, name) {
  const start = source.search(new RegExp(`(^|\\n)(async )?function ${name}\\(`));
  assert.ok(start >= 0, `${name} exists`);
  const rest = source.slice(start);
  const end = rest.search(/\n}\s*;?\n/);
  return rest.slice(0, end >= 0 ? end + 3 : 5000);
}

test('failed clean-plate fallback never reuses a full generated card image', () => {
  const body = fnBody(core, 'cpEnsurePlate');
  assert.match(body, /localPlateImage\(slide/);
  assert.match(body, /slide\.imageDataUrl/);
  assert.doesNotMatch(body, /slide\.localImg/);
});

test('server plate rendering exits before preparing any text or brand layers', () => {
  const body = fnBody(renderer, 'renderStatCard');
  const plate = body.indexOf('if (options.plateOnly || slide.plateOnly)');
  const svg = body.indexOf('const svg =');
  const labels = body.indexOf('const labels =');
  assert.ok(plate >= 0 && plate < svg && plate < labels);
});

test('carousel card renders await one slide at a time and preserve slide order', () => {
  const body = fnBody(renderer, 'renderCardSet');
  assert.match(body, /for \(let i = 0; i < total; i\+\+\)/);
  assert.match(body, /buffers\[i\] = await renderStatCard/);
  assert.doesNotMatch(body, /Promise\.all/);
  assert.match(body, /slideNumber: i \+ 1, totalSlides: total/);
});

test('editor plate requests are serialized per carousel output', () => {
  assert.match(core, /const cpPlateRequestChains = new Map/);
  assert.match(fnBody(core, 'cpEnsurePlate'), /previousRequest\.catch\(\(\) => \{\}\)\.then\(\(\) => generateCardsWithRetry\(payload\)\)/);
});

test('carousel themes apply to every slide and restore original looks consistently', () => {
  const apply = fnBody(core, 'cpApplyThemeResult');
  const restore = core.slice(core.indexOf('window.cpRestoreTheme ='), core.indexOf('window.copyOutput ='));
  assert.match(apply, /output\.slides\.forEach/);
  assert.match(apply, /CardThemes\.applyTheme/);
  assert.match(apply, /CardThemes\.applyColourTheme/);
  assert.match(restore, /output\.slides\.forEach/);
  assert.match(restore, /cpApplyThemeLive\(tid, idx, si\)/);
});

test('carousel theme gallery explains it applies across all slides', () => {
  assert.match(core, /Your choice will apply consistently to every slide/);
  assert.doesNotMatch(core, /Themes work on a single graphic for now/);
});

test('mobile clients refresh the updated editor and offline cache', () => {
  assert.match(html, /core\.js\?v=57/);
  assert.match(sw, /creatorpulse-v36/);
});
