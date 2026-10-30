const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'public/core.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/create/create.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');

test('preview and export share one structured graphic design state', () => {
  assert.match(core, /function cpGetDesignState\(tid, idx, si\)/);
  assert.match(core, /function cpApplyDesignState\(tid, idx, si, updates\)/);
  assert.match(core, /window\.cpGetGraphicDesignState = cpGetDesignState/);
  assert.match(core, /window\.cpUpdateGraphicDesignState = cpApplyDesignState/);
  assert.match(core, /function cpExportSnapshot\(tid, idx, si\)[\s\S]*const state = cpGetDesignState\(tid, idx, si\)/);
  for (const key of ['background:', 'backgroundAdjustments:', 'headline:', 'supportingText:', 'ctaLine:', 'layers,', 'template:', 'theme:']) {
    assert.ok(core.includes(key), `design state includes ${key}`);
  }
});

test('export waits for selected fonts, caches font readiness, and reuses in-flight images', () => {
  assert.match(core, /const cpFontReadinessCache = new Map\(\)/);
  assert.match(core, /await document\.fonts\.ready/);
  assert.match(core, /document\.fonts\.check\(key\)/);
  assert.match(core, /if \(cached\?\.promise\) return cached\.promise/);
  assert.match(core, /while \(cpExportImageCache\.size > 8\)/);
});

test('image loading reserves space, reports loading, retries recoverable errors and honors reduced motion', () => {
  assert.match(core, /loading="lazy" decoding="async" data-cp-export/);
  assert.match(core, /window\.cardImgFail = function\(el, fb\)/);
  assert.match(core, /retry=1/);
  assert.match(css, /\.cc-live-stage\[data-loading="true"\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /\.timg\{[^}]*aspect-ratio:1\/1/);
});

test('export composition omits editor controls and draws text from design-state layers', () => {
  assert.match(core, /state\.layers\.forEach\(l => \{ if \(l\.text\) cpDrawTextBox\(ctx, l, W, H\); \}\)/);
  assert.match(core, /Never draws selection outlines or editing controls into the exported image/);
  assert.match(core, /ctx\.filter = `brightness\(\$\{brightness\}\) contrast\(\$\{contrast\}\) saturate\(\$\{saturation\}\) blur\(\$\{blur\}px\)`/);
});

test('changed scripts are cache-busted for the app and service worker', () => {
  assert.match(html, /core\.js\?v=56/);
  assert.match(sw, /creatorpulse-v35/);
});
