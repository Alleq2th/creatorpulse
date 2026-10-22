const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = fs.readFileSync(path.join(__dirname, '../public/core.js'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '../services/statCard.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('card editor renders moveable and resizable blocks over each card preview', () => {
  assert.match(core, /function renderCardCanvasEditor\(/);
  assert.match(core, /data-canvas-block="\$\{name\}"/);
  assert.match(core, /data-canvas-resize="true"/);
  assert.match(core, /document\.addEventListener\("pointerdown"/);
  assert.match(core, /document\.addEventListener\("pointermove"/);
});

test('canvas layout changes are sent to card rendering and available for single cards and carousel slides', () => {
  assert.match(core, /window\.applyCanvasLayout\s*=/);
  assert.match(core, /slide\.textLayout=layout/);
  assert.match(core, /renderCardCanvasEditor\(o,tid,idx,si,s/);
  assert.match(core, /editSlide:slideArr\[0\]/);
});

test('server renderer supports saved positions and sizes for headline and supporting text', () => {
  assert.match(renderer, /function textLayoutTransform\(slide, key, f, base\)/);
  assert.match(renderer, /textLayoutTransform\(slide, "headline"/);
  assert.match(renderer, /textLayoutTransform\(slide, "supportingText"/);
});

test('canvas editor is responsive, touch-enabled, and has a fresh browser cache key', () => {
  assert.match(html, /cp-canvas-stage[^}]*touch-action:none/);
  assert.match(html, /cp-canvas-resize/);
  // Assert the version is at least this build's, rather than pinning one
  // exact number — a cache bump is a deliberate act, not a regression, and
  // pinning turned every legitimate bump into a red test.
  const coreV = (html.match(/core\.js\?v=(\d+)/) || [])[1];
  assert.ok(coreV, 'index.html must version core.js');
  assert.ok(Number(coreV) >= 39, `core.js version must be >= 39 (saw ${coreV})`);
});
