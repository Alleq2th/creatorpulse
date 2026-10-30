// The card preview draws text in the browser over the text-free plate. These checks
// pin the pieces that keep the saved image and the live preview on the same layout.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = fs.readFileSync(path.join(__dirname, '..', 'public', 'core.js'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '..', 'services', 'statCard.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'create', 'create.css'), 'utf8');

test('the call to action honours its text box on the saved card, like the headline and supporting text', () => {
  assert.match(renderer, /textLayoutTransform\(slide, "ctaLine", f, \{ x: m, y: footerY - 34/);
  assert.match(renderer, /textLayoutTransform\(slide, "ctaLine", f, \{ x: m, y: footerDividerY - 66/);
});

test('tap, drag and resize write one shared layout, and the live stage redraws from it', () => {
  assert.match(core, /function cpSelectCanvasBlock\(key, name\)/);
  assert.match(core, /function cpCommitBlockLayout\(block\)/);
  assert.match(core, /function cpUpdateLiveStage\(tid, idx, slideIndex\)/);
  assert.match(core, /slide\.textLayout = \{/);
  // Text, font, colour, dim and background edits all redraw the live stage.
  assert.match(core, /slide\[field\] = value;\n  cpUpdateLiveStage/);
  assert.match(core, /slide\._style\[key\] = value;\n  cpUpdateLiveStage/);
});

test('the live stage is the editor: photo, dim and text layers are rendered in the browser', () => {
  assert.match(core, /class="cp-canvas-stage cc-live-stage"/);
  assert.match(core, /data-canvas-block="\$\{name\}"/);
  assert.match(css, /\.cc-live-stage\{/);
  assert.match(css, /\.cc-live-stage \.cp-canvas-block\.is-selected/);
});
