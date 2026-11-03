const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const core = fs.readFileSync('public/core.js', 'utf8');
const css = fs.readFileSync('public/create/create.css', 'utf8');
const tplLib = fs.readFileSync('public/create/templateLibrary.js', 'utf8');

test('all 240 templates in templateLibrary have full-bleed images', () => {
  const window = {};
  eval(tplLib);
  const lib = window.CPTemplateLibrary;
  assert.equal(lib.templates.length, 240);
  assert.ok(lib.templates.every(t =>
    t.layout.image.x === 0 &&
    t.layout.image.y === 0 &&
    t.layout.image.width === 1 &&
    t.layout.image.height === 1 &&
    t.layout.image.fit === 'cover'
  ), 'every template must have a full-bleed 100% cover image box');
});

test('empty canvas blocks are clean and invisible until selected or populated', () => {
  // CSS hides empty unselected blocks and their placeholder text so no phantom outlines or ghost text appear
  assert.match(css, /\.cp-canvas-block\.is-empty:not\(\.is-selected\)\s*\{[^}]*border-color:\s*transparent/);
  assert.match(css, /\.cp-canvas-block\.is-empty:not\(\.is-selected\)\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.cp-canvas-block\.is-empty:not\(\.is-selected\)\s+\.cc-live-text\s*\{[^}]*display:\s*none/);

  // Selected blocks still display their outline and controls
  assert.match(css, /\.cp-canvas-block\.is-selected\s*\{[^}]*border:\s*2px solid #44d7ff/);
});

test('core.js marks empty blocks in initial render and live updates', () => {
  // renderCardCanvasEditor applies .is-empty to unpopulated block
  assert.match(core, /is-empty/);
  assert.match(core, /hasText\s*\?\s*""\s*:\s*"\s*is-empty"/);

  // cpUpdateLiveStage toggles .is-empty on the parent block
  assert.match(core, /block\.classList\.toggle\("is-empty",\s*empty\)/);
});

test('core.js exposes cpAddCardLayer to add missing layers on demand', () => {
  assert.match(core, /window\.cpAddCardLayer\s*=\s*function/);
  assert.match(core, /cpSetSlideText\(tid,\s*idx,\s*slideIndex,\s*layer\.field/);
});
