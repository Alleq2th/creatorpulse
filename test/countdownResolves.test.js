const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Spec Part 5.3: "Never leave a loading label visible indefinitely because a
// request failed silently." The suggested-window label used to be written ONLY
// by a 30-second setInterval, so a freshly expanded story card showed
// "calculating…" for up to 30s — which reads as a broken screen.
const core = fs.readFileSync(path.join(__dirname, '..', 'public', 'core.js'), 'utf8');

test('a paintCountdowns helper exists and writes real states', () => {
  assert.match(core, /function paintCountdowns\s*\(/, 'paintCountdowns must exist');
  const fn = core.slice(core.indexOf('function paintCountdowns'));
  const body = fn.slice(0, fn.indexOf('\nfunction startGlobalTimer'));
  assert.match(body, /No window estimate/, 'must show an honest fallback when no timestamp is usable');
  assert.match(body, /Post now/, 'must resolve to "Post now" when the window has passed');
  assert.match(body, /left`/, 'must render an actual remaining time');
});

test('startGlobalTimer paints immediately, not only on the interval', () => {
  const start = core.indexOf('function startGlobalTimer');
  assert.ok(start > -1, 'startGlobalTimer must exist');
  const body = core.slice(start, core.indexOf('\n}', start) + 2);
  const paintAt = body.indexOf('paintCountdowns()');
  const intervalAt = body.indexOf('setInterval');
  assert.ok(paintAt > -1, 'startGlobalTimer must call paintCountdowns()');
  assert.ok(intervalAt > -1, 'startGlobalTimer must still run an interval');
  assert.ok(paintAt < intervalAt,
    'paintCountdowns() must be called BEFORE setInterval, so the first paint is immediate');
});

test('render() repaints countdowns so expanding a card never shows a stuck label', () => {
  const renderIdx = core.indexOf('function render()');
  assert.ok(renderIdx > -1, 'render() must exist');
  // Render body ends at the first line that is exactly "}" at column 0.
  const rest = core.slice(renderIdx);
  const end = rest.search(/\n\}\n/);
  const body = rest.slice(0, end === -1 ? rest.length : end);
  assert.match(body, /renderApp\(\)/, 'render must still call renderApp()');
  assert.match(body, /paintCountdowns\(\)/, 'render must repaint the labels it just replaced');
});

test('the placeholder is never the only value a label can ever hold', () => {
  // The data-countdown attribute must always carry a real number so the label
  // has something to compute from.
  assert.match(core, /data-countdown="\$\{postBy\}"/);
  assert.match(core, /function trendPostBefore/);
});
