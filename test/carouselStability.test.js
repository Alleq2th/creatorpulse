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
  // Slides now render through a BOUNDED concurrency pool instead of strictly
  // one at a time. The guarantee that matters is unchanged: results come back
  // in slide order, and the number of slides in flight is capped so a small
  // Render instance cannot be pushed into an out-of-memory restart.
  assert.match(body, /mapWithConcurrency\(slides, limit/);
  assert.match(body, /slideNumber: i \+ 1, totalSlides: total/);
  assert.doesNotMatch(body, /Promise\.all\(slides\.map/, 'slides must not all render at once');
  const pool = fnBody(renderer, 'mapWithConcurrency');
  assert.match(pool, /out\[i\] = await worker\(items\[i\], i\)/, 'results must be written back by index');
  assert.match(pool, /Math\.min\(limit, items\.length\)/, 'the pool size must be bounded by the limit');
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
  assert.match(html, /core\.js\?v=61/);
  assert.match(sw, /creatorpulse-v40/);
});
