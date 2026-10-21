const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('shared design tokens define typography, spacing, surfaces, and focus treatment', () => {
  for (const token of ['--type-display:', '--type-title:', '--type-section:', '--type-body:', '--type-support:', '--type-label:', '--space-1:', '--space-5:', '--shadow-card:', '--focus-ring:']) {
    assert.ok(html.includes(token), `missing ${token}`);
  }
});

test('light and dark themes retain distinct palettes and token-aware card shadows', () => {
  assert.match(html, /:root\s*\{[\s\S]*?--ac:#5B4A9A/);
  assert.match(html, /:root\[data-theme="dark"\]\s*\{[\s\S]*?--ac:#9B86E8/);
  assert.match(html, /--or:#C98F2B/);
  assert.match(html, /--or:#E0AE55/);
  assert.match(html, /\.tc\{[^}]*box-shadow:var\(--shadow-card\)/);
});

test('shared controls have visible keyboard focus and consistent active navigation', () => {
  assert.match(html, /:where\(button,a,input,select,textarea,\[role="button"\],\[tabindex\]\):focus-visible/);
  assert.match(html, /\.btn\{[^}]*min-height:38px/);
  assert.match(html, /\.tab\.active\{color:var\(--ac\)/);
});
