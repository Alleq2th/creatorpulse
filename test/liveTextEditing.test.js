// Double-tap text editing and the Font / Color toolbar on the live card preview.
// These checks pin the pieces the browser tests rely on.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = fs.readFileSync(path.join(__dirname, '..', 'public', 'core.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'create', 'create.css'), 'utf8');

test('a single tap selects and the toolbar offers only Font and Color', () => {
  assert.match(core, /function cpRefreshCtx\(\)/);
  assert.match(core, /class="cc-ctx-btn" data-cp-ctx-kind="font"[^>]*>Font</);
  assert.match(core, /class="cc-ctx-btn" data-cp-ctx-kind="color"[^>]*>Color</);
  assert.match(core, /cpSelectCanvasBlock\(null, null\)[^;]*;/);
  assert.doesNotMatch(core, /cc-ctx-btn[^\n]*Apply/);
});

test('font list is vertical and each choice is written to the selected layer only', () => {
  assert.match(core, /class="cc-ctx-list" role="listbox" aria-label="Font"/);
  assert.match(core, /CARD_TYPOGRAPHIES\.map\(x => \{\s*const vis = TYPO_VIS\[x\.id\]/);
  assert.match(core, /window\.cpPickLayerFont = \(tid, idx, slideIndex, name, typoId\) => \{\s*cpSetLayerStyle\(tid, idx, slideIndex, "layerFonts", name, typoId\)/);
  assert.match(css, /\.cc-ctx-list\{display:flex;flex-direction:column/);
});

test('colour swatches set the selected layer colour live, with a custom colour input', () => {
  assert.match(core, /const CP_CTX_COLORS = \[/);
  assert.match(core, /window\.cpPickLayerColor = \(tid, idx, slideIndex, name, color, refresh = true\) => \{\s*cpSetLayerStyle\(tid, idx, slideIndex, "layerColors", name, color\)/);
  assert.match(core, /type="color" value="\$\{cur\}" aria-label="Custom color"/);
  // The custom picker updates live without rebuilding its own panel mid-drag.
  assert.match(core, /this\.value,false\)"/);
});

test('double tap opens the words for typing and keeps the element styling', () => {
  assert.match(core, /if \(doubleTap\) cpSelectCanvasBlock\(key, name\);/);
  assert.match(core, /editOnRelease: doubleTap/);
  assert.match(core, /else if \(a\.editOnRelease\) cpStartTextEdit\(a\.block\)/);
  assert.match(core, /if \(doubleTap\) cpSelectCanvasBlock\(key, name\);/);
  assert.match(core, /editOnRelease: doubleTap/);
  assert.match(core, /else if \(a\.editOnRelease\) cpStartTextEdit\(a\.block\)/);
  assert.match(core, /txt\.setAttribute\("contenteditable", "true"\)/);
  // Typing never resets the element's font, size, colour or position.
  assert.match(core, /const typing = txt === document\.activeElement;\s*if \(!typing\) txt\.textContent = val \|\| L\.label;/);
  assert.match(core, /txt\.style\.cssText = cpLiveTextStyle\(slide, L\.key, o, tid\)/);
});

test('typing saves to the shared card state and finishes on blur, Escape or Enter on the call to action', () => {
  assert.match(core, /document\.addEventListener\("input", \(event\) => \{[\s\S]*cpSetSlideText\(t\.tid, t\.idx, t\.slideIndex, t\.field, cpEditedValue\(txt\)\)/);
  assert.match(core, /document\.addEventListener\("focusout"[\s\S]*removeAttribute\("contenteditable"\)/);
  assert.match(core, /event\.key === "Escape" \|\| \(event\.key === "Enter" && single\)/);
  assert.match(core, /getData\("text\/plain"\)/);
});

test('the layer fields under the preview stay in step with the preview', () => {
  assert.match(core, /function cpSyncStylePanel\(tid, idx, slideIndex, slide\)/);
  assert.match(core, /cpSyncStylePanel\(tid, idx, slideIndex, slide\);/);
});

test('the editing style is scoped to the text being edited', () => {
  assert.match(css, /\.cc-live-text\[contenteditable="true"\]\{pointer-events:auto/);
  assert.match(css, /\.cc-ctx\[hidden\],\.cc-ctx-panel\[hidden\]\{display:none\}/);
});
