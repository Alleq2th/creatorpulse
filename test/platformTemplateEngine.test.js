const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../public/create/templateEngine.js');

test('platform template engine exposes five distinct compositions for each platform', () => {
  const ig = engine.list('instagram');
  const tt = engine.list('tiktok');
  assert.equal(ig.length, 5);
  assert.equal(tt.length, 5);
  assert.ok(ig.every(t => t.canvas.width === 1080 && t.canvas.height === 1350));
  assert.ok(tt.every(t => t.canvas.width === 1080 && t.canvas.height === 1920));
  for (const group of [ig, tt]) {
    assert.equal(new Set(group.map(t => JSON.stringify(t.layout))).size, group.length, 'each template has a distinct text composition');
    assert.ok(group.every(t => t.typography && t.image && t.decoration && t.safeZones));
  }
});

test('template apply maps legacy generated copy and applies carousel role layout', () => {
  const slide = { headline: 'A clear headline', body: 'Supporting detail', type: 'body' };
  engine.apply(slide, 'editorial', 1, 3);
  assert.equal(slide._templateId, 'editorial');
  assert.equal(slide._style.templateId, 'editorial');
  assert.equal(slide.textLayout.headline.y, engine.get('editorial').slideLayouts.body.headline.y);
  assert.equal(engine.normalizeContent(slide).supportingText, 'Supporting detail');
});

test('template resolution never crosses platform collections', () => {
  assert.equal(engine.resolve('impact', 'tiktok').id, 'viral_hook');
  assert.equal(engine.resolve('viral_hook', 'instagram').id, 'impact');
});

test('core.js declares templateEngine before evaluating selectedTemplate', () => {
  const fs = require('fs');
  const path = require('path');
  const coreJs = fs.readFileSync(path.join(__dirname, '../public/core.js'), 'utf8');
  const declIdx = coreJs.indexOf('const templateEngine =');
  const useIdx = coreJs.indexOf('templateEngine.resolve(null, plat)');
  assert.ok(declIdx !== -1, 'templateEngine must be declared');
  assert.ok(useIdx !== -1, 'templateEngine.resolve must be invoked');
  assert.ok(declIdx < useIdx, 'templateEngine declaration must precede its usage to avoid TDZ ReferenceError');
});
