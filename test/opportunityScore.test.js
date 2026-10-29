const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Spec Part 5.4 requires all four of these at once:
//   "The score and progress bar can be useful, but they should not imply more
//    certainty than the underlying system supports."
//   "Retain the existing scoring logic."
//   "Do not change the meaning of the score during a visual redesign."
//   "If the product already provides an explanation of how the score should be
//    interpreted, make that information accessible without cluttering the
//    interface."
//
// The whole risk of adding an explanation is that the explanation drifts from
// the number. So the first thing tested here is PARITY: the new lib must
// reproduce the old formula exactly, for every input class, including the
// awkward ones. Everything after that tests honesty and accessibility.

const root = path.join(__dirname, '..');
const scoreLib = require(path.join(root, 'public', 'lib', 'opportunityScore.js'));
const explainLib = require(path.join(root, 'public', 'lib', 'opportunityExplain.js'));

const core = fs.readFileSync(path.join(root, 'public', 'core.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');

const { cpOpportunityScore, cpOpportunityBreakdown, cpVelocity } = scoreLib;
const { cpOpportunityMarkup } = explainLib;

const NOW = 1750000000000;
const HOUR = 3600000;

// ── the original implementation, copied verbatim from core.js before this ──
// change, so "retain the existing scoring logic" is measured against the real
// thing rather than against my description of it.
function legacyVelocity(t, now) {
  const age = now - (t.timestamp || now);
  const h = age / 3600000;
  if (h < 2) return { state: 'rising' };
  if (h < 8) return { state: 'peaking' };
  return { state: 'dying' };
}
function legacyScore(t, now) {
  const v = legacyVelocity(t, now);
  const s = t.score || 55;
  const boost = v.state === 'rising' ? 8 : v.state === 'peaking' ? 0 : -18;
  return Math.max(15, Math.min(97, Math.round(0.6 * s + boost * 2 + 15)));
}

// ── parity: the score must not move ────────────────────────────────────────

test('the score is IDENTICAL to the original formula for every input class', () => {
  const scores = [undefined, null, 0, 40, 55, 64, 70, 79, 80, 85, 90, 99, 100, -5, 1e9];
  const ages = [0, 0.4, 1.9, 2, 5, 7.9, 8, 20, 200];
  let checked = 0;

  for (const score of scores) {
    for (const hours of ages) {
      const story = { score, timestamp: NOW - hours * HOUR };
      const next = cpOpportunityScore(story, NOW);
      const prev = legacyScore(story, NOW);
      assert.strictEqual(next, prev, `drifted for score=${score} age=${hours}h: ${next} vs ${prev}`);
      checked++;
    }
  }
  // A story that never had a timestamp is the edge case most likely to drift,
  // because the legacy code fell back to "now" for its age.
  const noTs = { score: 70 };
  assert.strictEqual(cpOpportunityScore(noTs, NOW), legacyScore(noTs, NOW));
  checked++;

  assert.ok(checked === 136, `expected 136 parity cases, ran ${checked}`);
});

test('velocity buckets match the legacy boundaries exactly', () => {
  assert.strictEqual(cpVelocity({ timestamp: NOW - 0.5 * HOUR }, NOW).state, 'rising');
  assert.strictEqual(cpVelocity({ timestamp: NOW - 1.99 * HOUR }, NOW).state, 'rising');
  assert.strictEqual(cpVelocity({ timestamp: NOW - 2 * HOUR }, NOW).state, 'peaking');
  assert.strictEqual(cpVelocity({ timestamp: NOW - 7.99 * HOUR }, NOW).state, 'peaking');
  assert.strictEqual(cpVelocity({ timestamp: NOW - 8 * HOUR }, NOW).state, 'dying');
});

test('the score always lands inside the documented 15..97 band', () => {
  const inputs = [
    { score: 99, timestamp: NOW },                    // best case
    { score: 40, timestamp: NOW - 500 * HOUR },       // worst case
    { score: 1e9, timestamp: NOW },
    { score: -1e9, timestamp: NOW },
    {}
  ];
  for (const story of inputs) {
    const s = cpOpportunityScore(story, NOW);
    assert.ok(s >= 15 && s <= 97, `out of band: ${s} for ${JSON.stringify(story)}`);
    assert.strictEqual(s, Math.round(s), 'score must be a whole number');
  }
});

// ── the explanation must not contradict the number ────────────────────────

test('the breakdown reports the same score the card shows', () => {
  for (const score of [40, 55, 70, 85, 99]) {
    for (const hours of [0.5, 3, 30]) {
      const story = { id: 'a', score, timestamp: NOW - hours * HOUR };
      const b = cpOpportunityBreakdown(story, NOW);
      assert.strictEqual(b.score, cpOpportunityScore(story, NOW),
        `panel says ${b.score}, card says ${cpOpportunityScore(story, NOW)}`);
    }
  }
});

test('the arithmetic in the panel actually computes the reported score', () => {
  const story = { id: 'a', score: 78, timestamp: NOW - 1 * HOUR };
  const b = cpOpportunityBreakdown(story, NOW);
  const recomputed = Math.max(15, Math.min(97,
    Math.round(0.6 * b.storyStrength + b.timingAdjustment + b.base)));
  assert.strictEqual(recomputed, b.score, 'the shown formula does not produce the shown score');
  assert.strictEqual(b.timingAdjustment, 16, 'a rising story is +16');
});

// ── honesty: missing data is reported, never invented ─────────────────────

test('a story with no timestamp is marked missing, not silently treated as fresh', () => {
  const b = cpOpportunityBreakdown({ id: 'a', score: 70 }, NOW);
  const freshness = b.factors.find(f => f.key === 'freshness');
  assert.strictEqual(freshness.state, 'missing');
  assert.strictEqual(freshness.value, 'no timestamp');
  // The score itself still matches legacy behaviour - only the LABEL changes.
  assert.strictEqual(b.score, cpOpportunityScore({ score: 70 }, NOW));
});

test('a story with no content score says the default was assumed', () => {
  const b = cpOpportunityBreakdown({ id: 'a', timestamp: NOW }, NOW);
  const strength = b.factors.find(f => f.key === 'strength');
  assert.strictEqual(strength.state, 'missing');
  assert.match(strength.value, /assumed/,
    'the panel must admit the default was used, not present 55 as measured data');
});

test('factors the app genuinely does not receive are listed as unavailable', () => {
  const b = cpOpportunityBreakdown({ id: 'a', score: 70, timestamp: NOW }, NOW);
  const keys = b.missing.map(m => m.key);
  assert.ok(keys.includes('corroboration'), 'outlet count must be declared unavailable');
  assert.ok(keys.includes('impact'), 'impact words must be declared unavailable');
  // And no fabricated number may appear in their place.
  for (const m of b.missing) {
    assert.ok(!/\d/.test(m.label), `"${m.label}" must not carry a made-up figure`);
    assert.ok(m.note.length > 20, 'each unavailable factor needs a real explanation');
  }
});

test('the panel never claims the score predicts views', () => {
  const html = cpOpportunityMarkup({ id: 'a', score: 70, timestamp: NOW }, { open: true });
  // Forbid positive predictive claims outright...
  assert.ok(!/guaranteed|will get|you will|predicted views/i.test(html),
    'must not promise an outcome');
  // ...and require the panel to say out loud what it is NOT. The footer's
  // wording is "a rule-based estimate, not a forecast of views", so the
  // disclaimer itself is the proof that the claim is absent.
  assert.match(html, /not a forecast/i);
  assert.match(html, /rule-based estimate/i);
});

test('the panel renders through the BROWSER branch too, not just Node', () => {
  // This is the test that was missing. Both resolvers originally returned
  // different key names on the two branches, so the panel rendered under Node
  // and silently vanished in the browser - every test green, nothing on the
  // phone. Re-run the markup with a fake `window` holding exactly the globals
  // index.html installs, and require the panel to appear.
  const scoreSrc = fs.readFileSync(path.join(root, 'public', 'lib', 'opportunityScore.js'), 'utf8');
  const explainSrc = fs.readFileSync(path.join(root, 'public', 'lib', 'opportunityExplain.js'), 'utf8');

  const vm = require('node:vm');
  // A browser-ish sandbox: `window` exists, `module` does not.
  const win = {};
  const sandbox = { window: win, console };
  vm.createContext(sandbox);

  vm.runInContext(scoreSrc, sandbox, { filename: 'opportunityScore.js' });
  // index.html loads the score file first, then the explain file.
  vm.runInContext(explainSrc, sandbox, { filename: 'opportunityExplain.js' });

  assert.strictEqual(typeof win.cpOpportunityScore, 'function', 'score global missing');
  assert.strictEqual(typeof win.cpOpportunityBreakdown, 'function', 'breakdown global missing');
  assert.strictEqual(typeof win.cpOpportunityMarkup, 'function', 'markup global missing');

  const story = { id: 'a', score: 82, timestamp: NOW - HOUR, niche: 'Football', image: 'x' };
  const html = win.cpOpportunityMarkup(story, { score: win.cpOpportunityScore(story, NOW), open: true });

  assert.ok(html.includes('class="oppw"'),
    'the open panel did not render in the browser branch - the module shapes disagree');
  assert.ok(html.includes('How it adds up'), 'arithmetic block missing in the browser branch');
  assert.ok(html.includes('Story strength'), 'factor list missing in the browser branch');
});

test('both resolver branches produce byte-identical markup for the same story', () => {
  // The root-cause guard. Rather than pattern-matching the source (which only
  // proves a string exists), run the REAL markup in both environments and
  // require the output to match exactly. If the two branches ever return
  // differently-named functions again, one of these two outputs loses its
  // panel and this fails.
  const scoreSrc = fs.readFileSync(path.join(root, 'public', 'lib', 'opportunityScore.js'), 'utf8');
  const explainSrc = fs.readFileSync(path.join(root, 'public', 'lib', 'opportunityExplain.js'), 'utf8');
  const vm = require('node:vm');

  const win = {};
  const sandbox = { window: win, console };
  vm.createContext(sandbox);
  vm.runInContext(scoreSrc, sandbox, { filename: 'opportunityScore.js' });
  vm.runInContext(explainSrc, sandbox, { filename: 'opportunityExplain.js' });

  const story = { id: 'a', score: 82, timestamp: NOW - HOUR, niche: 'Football', image: 'x' };
  const opts = { open: true };

  const inBrowser = win.cpOpportunityMarkup(story, Object.assign({ score: win.cpOpportunityScore(story, NOW) }, opts));
  const inNode = cpOpportunityMarkup(story, Object.assign({ score: cpOpportunityScore(story, NOW) }, opts));

  assert.strictEqual(inNode, inBrowser,
    'the browser and Node branches render different markup - the module shapes disagree');
  assert.ok(inBrowser.includes('class="oppw"'), 'panel missing from the browser output');
});

// ── accessibility without clutter (the two halves of 5.4's last line) ─────

test('closed by default, and the control is a real focusable button', () => {
  const shut = cpOpportunityMarkup({ id: 'a', score: 70, timestamp: NOW }, { score: 70 });
  assert.match(shut, /class="oppw-toggle"/);
  assert.match(shut, /aria-expanded="false"/);
  assert.match(shut, /Why this score\?/);
  assert.ok(!shut.includes('class="oppw"'), 'the explanation must not render while closed');
  // A button element, not a div with an onclick - so it is keyboard reachable.
  assert.match(shut, /<button type="button"[^>]*onclick="toggleOppWhy\('a'\)"/);
});

test('open state renders the factors and flips the label + aria', () => {
  const open = cpOpportunityMarkup({ id: 'a', score: 70, timestamp: NOW }, { score: 70, open: true });
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /Hide why/);
  assert.match(open, /class="oppw"/);
  assert.match(open, /How it adds up/);
  assert.match(open, /What the app does not receive/);
  assert.match(open, /id="oppw-a"|aria-controls="oppw-a"/);
});

test('the collapsed control stays small enough not to clutter the panel', () => {
  const css = indexHtml;
  const rule = css.match(/\.oppw-toggle\{[^}]*\}/);
  assert.ok(rule, '.oppw-toggle must have its own style rule');
  // 28px keeps it tappable without becoming a second bar under the score bar.
  assert.match(rule[0], /min-height:28px/,
    'must keep a real hit target (spec 15.3) while staying visually quiet');
  const openPanel = css.match(/\.oppw\{[^}]*\}/);
  assert.ok(openPanel, '.oppw must have its own style rule');
  assert.ok(!/box-shadow/.test(openPanel[0]), 'the open panel must not add decorative weight');
});

test('news detail panel renders clean story detail', () => {
  assert.match(core, /cp-news-detail/);
  assert.match(core, /cpCreateStartFromTrend/);
});

// ── wiring: the files are actually served ────────────────────────────────

test('both helper scripts load before core.js, with cache-busting versions', () => {
  const scoreTag = indexHtml.indexOf('lib/opportunityScore.js');
  const explainTag = indexHtml.indexOf('lib/opportunityExplain.js');
  const coreTag = indexHtml.indexOf('<script src="core.js');

  assert.ok(scoreTag > -1, 'opportunityScore.js is not referenced by index.html');
  assert.ok(explainTag > -1, 'opportunityExplain.js is not referenced by index.html');
  assert.ok(scoreTag < coreTag, 'the score lib must load before core.js');
  assert.ok(explainTag < coreTag, 'the explain lib must load before core.js');
  // Score before explain: explain reads window.cpOpportunityScore at call time.
  assert.ok(scoreTag < explainTag, 'the score lib must load before the explain lib');
  assert.match(indexHtml, /lib\/opportunityScore\.js\?v=\d+/);
  assert.match(indexHtml, /lib\/opportunityExplain\.js\?v=\d+/);
});

test('the service-worker cache was bumped so phones fetch the new files', () => {
  assert.match(sw, /CACHE_NAME = "creatorpulse-v\d+"/);
  const v = Number(sw.match(/CACHE_NAME = "creatorpulse-v(\d+)"/)[1]);
  assert.ok(v >= 19, `cache version must advance past v18, found v${v}`);
});

test('the formula is not duplicated - core.js delegates to the one implementation', () => {
  // core.js may keep the expression as a FALLBACK, but it must not be the
  // path taken when the lib is present, or the two copies will drift.
  assert.match(core, /if\(window\.cpOpportunityScore\) return window\.cpOpportunityScore\(t\)/,
    'core.js must delegate to the shared implementation');
  // And the marking logic must live in exactly one place.
  const scoreFormulas = (core.match(/0\.6\s*\*\s*s\s*\+\s*boost\s*\*\s*2/g) || []).length;
  assert.strictEqual(scoreFormulas, 1, `expected 1 fallback formula in core.js, found ${scoreFormulas}`);
});

test('the toggle is registered on window so the inline onclick can reach it', () => {
  assert.match(core, /window\.toggleOppWhy\s*=\s*\(tid\)\s*=>/);
  assert.match(core, /S\.oppWhy\[tid\] = !S\.oppWhy\[tid\]/, 'tapping again must close it');
});
