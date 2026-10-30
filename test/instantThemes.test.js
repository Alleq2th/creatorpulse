// Instant theme switching: picking or restoring a theme repaints the live card from
// the shared style with no server render, and the gallery reuses the editor's plate.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = fs.readFileSync(path.join(__dirname, '..', 'public/core.js'), 'utf8');

// The source of one top-level function or window assignment, up to its closing brace at column 0.
function fnBody(name) {
  const start = core.search(new RegExp(`(^|\\n)(async )?function ${name}\\(|window\\.${name} = `));
  assert.ok(start > -1, `${name} exists`);
  const rest = core.slice(start);
  const end = rest.search(/\n\}\s*;?\n|\n\};\n/);
  return rest.slice(0, end > -1 ? end + 3 : 2000);
}

test('picking a theme repaints the live card and does not call the server', () => {
  const body = fnBody('cpApplyThemeResult');
  assert.match(body, /cpApplyThemeLive\(tid, idx, slideIndex\)/);
  assert.doesNotMatch(body, /cpApplyCardStyle/);
  assert.doesNotMatch(body, /generateCardsWithRetry/);
});

test('restore original look is instant too', () => {
  const body = fnBody('cpRestoreTheme');
  assert.match(body, /cpApplyThemeLive\(tid, idx, slideIndex\)/);
  assert.doesNotMatch(body, /cpApplyCardStyle/);
});

test('cpApplyThemeLive updates the open stage, or re-renders when the stage is not on screen', () => {
  const body = fnBody('cpApplyThemeLive');
  assert.match(body, /data-canvas-stage="\$\{tid\}-\$\{idx\}-\$\{slideIndex\}"/);
  assert.match(body, /cpUpdateLiveStage\(tid, idx, slideIndex\)/);
  assert.match(body, /else render\(\)/);
});

test('the gallery shows the user photo directly and reuses the cached plate', () => {
  const body = fnBody('cpLoadThemePlate');
  assert.match(body, /if \(sty\.bgImage\) \{ gal\.plate = sty\.bgImage;/);
  assert.match(body, /cpEnsurePlate\(gal\.tid, gal\.idx, gal\.slideIndex\)/);
  assert.doesNotMatch(body, /generateCardsWithRetry/);
});

test('a plate that finishes loading is painted into an open gallery', () => {
  assert.match(fnBody('cpPaintPlate'), /cpSyncGalleryPlate\(cpThemeGallery\)/);
  const sync = fnBody('cpSyncGalleryPlate');
  assert.match(sync, /cpPlateCache\.get\(gal\.plateKey\)/);
  assert.match(sync, /cpRenderThemeGallery\(\)/);
});

test('the Themes label on the card follows the applied theme', () => {
  assert.match(fnBody('cpSyncStylePanel'), /\.cc-th-hint/);
});

test('the service worker and index.html both point at the new build', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'public/sw.js'), 'utf8');
  assert.ok(html.includes('core.js?v=56'));
  assert.match(sw, /creatorpulse-v35/);
});
