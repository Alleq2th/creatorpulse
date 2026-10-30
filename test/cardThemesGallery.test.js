// Wiring for the Themes gallery in the card editor: the theme script loads before
// core.js, the editor exposes the Themes button, and the gallery uses plate previews.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const html = read('public/index.html');
const core = read('public/core.js');
const css = read('public/create/create.css');

test('index.html loads the theme script before core.js', () => {
  const themes = html.indexOf('create/cardThemes.js');
  const coreAt = html.indexOf('src="core.js');
  assert.ok(themes > -1, 'cardThemes.js is loaded');
  assert.ok(coreAt > themes, 'cardThemes.js loads before core.js');
});

test('the style panel has a Themes button that opens the gallery', () => {
  assert.match(core, /class="btn bp bxs cc-th-open" onclick="cpOpenThemes\(/);
  assert.match(core, /window\.cpOpenThemes = \(tid, idx, slideIndex\)/);
});

test('the gallery applies themes and restores the original look', () => {
  for (const fn of ['cpCloseThemes', 'cpPickTheme', 'cpPickColourTheme', 'cpRestoreTheme']) {
    assert.match(core, new RegExp(`window\\.${fn} = `), `${fn} is defined`);
  }
  assert.match(core, /Restore original look/);
  assert.match(core, /cpApplyThemeResult\(tid, idx, slideIndex, window\.CardThemes\.applyTheme/);
});

test('gallery previews use a text-free plate so the photo is the same on every tile', () => {
  assert.match(core, /plateOnly: true/);
  assert.match(core, /dim: 0,/);
  assert.match(core, /Dim 0: the dim is drawn live/);
});

test('gallery scrolls vertically and is styled for a phone sheet', () => {
  assert.match(css, /\.cc-th-body \{[^}]*overflow-y: auto/);
  assert.match(css, /\.cc-th-list \{[^}]*flex-direction: column/);
});
