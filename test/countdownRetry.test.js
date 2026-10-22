const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Spec Part 5.3 requires all three of these at once for the "Suggested window"
// label:
//   "If the calculation fails, show a meaningful fallback or error state."
//   "Never leave a loading label visible indefinitely."
//   "Do not fabricate a posting time to make the interface look complete."
//
// PR #39 covered the middle one (paint on the first frame). These tests cover
// the first one: the fallback must be something the user can ACT on, and the
// action must never leave the label stuck on a loading word.

const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'public', 'core.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');

// The helper is a browser file, but it exports for Node behind a guard -
// exactly like lib/authRedirect.js. Requiring it means these tests run the
// REAL implementation instead of asserting against a copy of its text.
const { cpWindowTarget, cpWindowRetryMarkup } = require(path.join(root, 'public', 'lib', 'windowRetry.js'));

// ── the pure resolver ────────────────────────────────────────────────────────

test('a story with a real timestamp gets a real window', () => {
  const ts = Date.now() - 60 * 60 * 1000; // 1 hour old
  const target = cpWindowTarget({ timestamp: ts }, 'peaking');
  assert.strictEqual(typeof target, 'number');
  // peaking = 6 hours of runway, so the target is 5 hours from now
  assert.strictEqual(target, ts + 6 * 3600000);
});

test('every velocity state gets a distinct, longer-for-faster runway', () => {
  const ts = 1700000000000;
  const rising = cpWindowTarget({ timestamp: ts }, 'rising');
  const peaking = cpWindowTarget({ timestamp: ts }, 'peaking');
  const dying = cpWindowTarget({ timestamp: ts }, 'dying');
  assert.ok(rising > peaking, 'a rising story can wait longer than a peaking one');
  assert.ok(peaking > dying, 'a cooling story has the shortest runway');
});

test('a story with NO timestamp returns null — never an invented time', () => {
  // This is the "do not fabricate a posting time" rule. Before, the code did
  // `t.timestamp || Date.now()`, which turned a missing timestamp into a
  // confident-looking window anchored to the moment you opened the app.
  assert.strictEqual(cpWindowTarget({}, 'rising'), null);
  assert.strictEqual(cpWindowTarget({ timestamp: null }, 'rising'), null);
  assert.strictEqual(cpWindowTarget({ timestamp: 0 }, 'rising'), null);
  assert.strictEqual(cpWindowTarget({ timestamp: '' }, 'rising'), null);
  assert.strictEqual(cpWindowTarget({ timestamp: 'not-a-number' }, 'rising'), null);
  assert.strictEqual(cpWindowTarget(null, 'rising'), null);
});

// ── the fallback markup ──────────────────────────────────────────────────────

test('the no-estimate fallback offers an action, not just a sentence', () => {
  const html = cpWindowRetryMarkup('story-123');
  assert.match(html, /No window estimate/, 'still states the honest fact');
  assert.match(html, /<button/, 'must render a real control, not static text');
  assert.match(html, /retryWindowEstimate\('story-123'\)/, 'must call the handler with the story id');
  assert.match(html, />Try again</, 'the control must be labelled in plain words');
});

test('the story id is escaped into the onclick, so a quote cannot break out', () => {
  const html = cpWindowRetryMarkup("o'brien\"<script>");
  assert.ok(!html.includes('<script>'), 'angle brackets must not survive into markup');
  assert.match(html, /&#39;/, 'a single quote must be encoded');
});

test('the fallback never contains a loading word', () => {
  const html = cpWindowRetryMarkup('s1');
  assert.ok(!/calculating/i.test(html), 'the fallback must not look like it is still loading');
  assert.ok(!/\.\.\./.test(html), 'no ellipsis that reads as a stuck spinner');
});

// ── the wiring in core.js ────────────────────────────────────────────────────

test('paintCountdowns uses the retry markup on the no-estimate branch', () => {
  const start = core.indexOf('function paintCountdowns');
  assert.ok(start > -1, 'paintCountdowns must exist');
  const end = core.indexOf('function startGlobalTimer', start);
  const body = core.slice(start, end);

  assert.match(body, /if\(!target \|\| !isFinite\(target\)\)/, 'must handle a missing OR non-numeric target');
  assert.match(body, /cpWindowRetryMarkup/, 'must render the retry markup, not a bare string');
  assert.match(body, /retryState/, 'must guard against rebuilding the same markup every 30s tick');
});

test('the handler exists and repaints through render(), so nothing can stay stuck', () => {
  const start = core.indexOf('window.retryWindowEstimate');
  assert.ok(start > -1, 'retryWindowEstimate must be defined');
  const body = core.slice(start, start + 900);

  assert.match(body, /render\(\)/, 'must repaint so the label resolves from real state');
  assert.ok(
    !/calculating/i.test(body),
    'must never write a loading word itself — render() owns the label'
  );
  assert.ok(
    !/textContent\s*=\s*['"]calculating/.test(body),
    'must not set a stuck loading state'
  );
});

test('the label carries the story id and can never emit "undefined"', () => {
  assert.match(core, /data-countdown="\$\{postBy == null \? '' : postBy\}"/,
    'a null window must render as an empty attribute, not the string "undefined"');
  assert.match(core, /data-tid="\$\{esc\(t\.id\)\}"/,
    'the handler needs the story id from the DOM');
});

test('the helper loads BEFORE core.js, and both are cache-busted', () => {
  const helperIdx = indexHtml.indexOf('lib/windowRetry.js');
  const coreIdx = indexHtml.indexOf('src="core.js');
  assert.ok(helperIdx > -1, 'index.html must load the helper');
  assert.ok(coreIdx > -1, 'index.html must load core.js');
  assert.ok(helperIdx < coreIdx, 'the helper must be defined before core.js runs');
  assert.match(indexHtml, /lib\/windowRetry\.js\?v=\d+/, 'the helper must be version-tagged');
  assert.match(indexHtml, /core\.js\?v=\d+/, 'core.js must be version-tagged');
});

test('the offline cache version was bumped, so phones fetch the new code', () => {
  const m = sw.match(/CACHE_NAME\s*=\s*"([^"]+)"/);
  assert.ok(m, 'sw.js must declare a cache name');
  const n = parseInt(m[1].replace(/\D/g, ''), 10);
  assert.ok(n >= 16, `cache name must be at least v16 (found "${m[1]}")`);
});

test('the retry control is big enough to tap (spec 15.3)', () => {
  // 28px is the floor used elsewhere in this stylesheet for small buttons;
  // anything smaller fails the "do not reduce buttons to tiny icons" rule.
  const rule = indexHtml.match(/\.retry-link\{[^}]*\}/);
  assert.ok(rule, '.retry-link must be styled');
  const minH = rule[0].match(/min-height:\s*(\d+)px/);
  assert.ok(minH, '.retry-link must declare a min-height');
  assert.ok(parseInt(minH[1], 10) >= 28, 'touch target must be at least 28px tall');
});
