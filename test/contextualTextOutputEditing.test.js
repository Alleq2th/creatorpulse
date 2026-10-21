const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = fs.readFileSync(path.join(__dirname, '../public/core.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('script outputs have an optional, format-appropriate editable text surface', () => {
  assert.ok(core.includes('window.toggleOutputEdit ='));
  assert.ok(core.includes('window.setOutputContent ='));
  assert.match(core, /class="cp-output-editor" aria-label="Edit \$\{esc\(o\.label\|\|'script'\)\}"/);
  assert.ok(core.includes('script-reader-body'));
  assert.ok(core.includes('studioShootScript(\'${tid}\',${idx})'));
  assert.ok(core.includes('toggleOutputEdit(\'${tid}\',${idx})'));
});

test('text drafts can be edited in place without graphic framing controls', () => {
  assert.ok(core.includes('class="oc cp-text-output"'));
  assert.ok(core.includes('class="cp-text-reader"'));
  assert.ok(core.includes('setOutputContent(\'${tid}\',${idx},this.value)'));
  assert.ok(core.includes('Edits stay in this draft until you save.'));
});

test('text editor is readable, responsive, and keyboard-focus visible', () => {
  assert.match(html, /\.cp-output-editor\s*\{/);
  assert.match(html, /\.cp-output-editor:focus-visible/);
  assert.match(html, /@media\s*\(min-width:700px\)[\s\S]*?\.cp-output-editor/);
});
