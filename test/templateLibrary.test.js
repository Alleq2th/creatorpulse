const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
function library() {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/create/templateLibrary.js'), 'utf8'), { window });
  return window.CPTemplateLibrary;
}

test('library contains 240 unique data-driven templates in 12 groups', () => {
  const lib = library();
  assert.equal(lib.templates.length, 240);
  assert.equal(lib.categories.length, 12);
  assert.ok(lib.categories.every(c => lib.byCategory(c.id).length === 20));
  assert.equal(new Set(lib.templates.map(t => t.id)).size, 240);
  assert.equal(new Set(lib.templates.map(t => t.layout.id)).size, 240);
  assert.equal(new Set(lib.templates.map(t => JSON.stringify(t.layout.elements))).size, 240);
});

test('template definitions are editable, replaceable, versioned, and generate previews on demand', () => {
  const lib = library();
  const template = lib.templates[0];
  assert.ok(template.textElements.every(e => e.editable));
  assert.ok(template.imageElements.some(e => e.replaceable));
  assert.ok(template.supportedAspectRatios.includes('4:5'));
  assert.equal(template.version, 1);
  assert.equal(template.thumbnail.src, undefined);
  const src = lib.thumbnail(template.id);
  assert.match(src, /^data:image\/svg\+xml/);
  assert.equal(template.thumbnail.src, src);
});

test('the five original Instagram and TikTok picker IDs remain present', () => {
  const steps = fs.readFileSync(path.join(root, 'public/create/steps.js'), 'utf8');
  ['impact','editorial','stat_split','dark_gradient','neon_noir','viral_hook','silent_camera','quote_punch','minimal_noir','high_retention'].forEach(id => assert.ok(steps.includes("id: '" + id + "'"), id));
});

test('catalog is loaded before Create flow and category/search controls exist', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.ok(html.indexOf('create/templateLibrary.js') < html.indexOf('create/steps.js'));
  const steps = fs.readFileSync(path.join(root, 'public/create/steps.js'), 'utf8');
  const core = fs.readFileSync(path.join(root, 'public/core.js'), 'utf8');
  assert.ok(core.includes('state.templatePalette && state.templatePalette.background'));
  assert.ok(core.includes('state.imageLayout'));
  assert.ok(core.includes('templateDecoration'));
  assert.ok(steps.includes('cpFilterCreateTemplates'));
  assert.ok(steps.includes('cpSearchCreateTemplates'));
  assert.ok(steps.includes('loading=\"lazy\"'));
});
