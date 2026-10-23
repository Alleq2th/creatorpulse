/* Tests for the Create flow (spec PART 6).
 *
 * These exercise public/create/flow.js as real code, not as text: flow.js is
 * dual-exported (browser global + module.exports), so the exact functions the
 * UI calls are loaded and run here. A test that merely greps the source would
 * pass even if the rules were broken.
 *
 * `node --test test/*.test.js` picks this up with the rest of the suite.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const flow = require('../public/create/flow.js');

// The two tables the flow reads. These are the app's own lists (core.js
// PLATS/PTYPES); copied here only so the pure logic can be exercised without a
// browser. The UI reads the real ones at runtime.
const PLATS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' }
];
const PTYPES = {
  tiktok: ['Face-to-Camera Script', 'Faceless / No-Face Video', 'Silent Caption Video'],
  instagram: ['Carousel Concept', 'Caption + Hashtags', 'Reel Script'],
  youtube: ['Long Form Script', 'YouTube Short Script', 'Title + Description', 'Thumbnail'],
  twitter: ['Hot Take Tweet', 'Engagement Tweet', 'Thread (5 tweets)'],
  facebook: ['Long Form Script', 'Engagement Post'],
  linkedin: ['Long Form Script', 'Engagement Post', 'Carousel Concept']
};
const TONES = [
  { id: 'normal', label: 'Neutral' },
  { id: 'banter', label: 'Banter' },
  { id: 'educative', label: 'Educative' },
  { id: 'hottake', label: 'Hot Take' },
  { id: 'story', label: 'Storytelling' }
];

const SRC = path.join(__dirname, '..', 'public');

function fresh() {
  return flow.defaultState();
}

/* ── Step order (spec 6.2: source → platform → format → generate) ───────── */

test('flow starts on the source step', () => {
  const st = fresh();
  assert.strictEqual(st.step, 'source');
  assert.strictEqual(st.platform, null);
  assert.strictEqual(st.format, null);
  // Spec 6.2 Step 4: "Provide sensible defaults." Tone is never blank.
  assert.strictEqual(st.tone, 'normal');
});

test('steps run in the documented order', () => {
  assert.deepStrictEqual(flow.STEPS, ['source', 'platform', 'format', 'tone', 'review']);
});

test('cannot advance past the source step without choosing a source', () => {
  const st = fresh();
  assert.strictEqual(flow.canAdvance(st, PTYPES), false);
  flow.next(st, PTYPES);
  assert.strictEqual(st.step, 'source', 'stayed put instead of skipping ahead');
});

test('advancing walks source → platform → format → tone', () => {
  const st = fresh();
  flow.setSource(st, 'idea');
  flow.setIdea(st, 'Why most creators quit at 3 months');
  assert.strictEqual(flow.canAdvance(st, PTYPES), true);
  flow.next(st, PTYPES);
  assert.strictEqual(st.step, 'platform');

  flow.setPlatform(st, 'youtube', PTYPES);
  flow.next(st, PTYPES);
  assert.strictEqual(st.step, 'format');

  flow.setFormat(st, 'Long Form Script');
  flow.next(st, PTYPES);
  assert.strictEqual(st.step, 'tone');

  flow.next(st, PTYPES);
  assert.strictEqual(st.step, 'review');
});

test('the Studio is offered as one source, not as the whole tab', () => {
  // Spec 6.1: the Create experience must not be built around one output type.
  const ids = flow.SOURCES.map(s => s.id);
  assert.ok(ids.includes('story'), 'discovered story is a source');
  assert.ok(ids.includes('event'), 'upcoming event is a source');
  assert.ok(ids.includes('idea'), 'own idea is a source');
  assert.ok(ids.includes('draft'), 'existing draft is a source');
  assert.ok(ids.includes('studio'), 'video studio is a source');
  // And it is still reachable — nothing was removed.
  assert.strictEqual(flow.sourceById('studio').label, 'Record or upload a video');
});

/* ── Platform → format coupling (spec 8.5) ─────────────────────────────── */

test('formats are scoped to the chosen platform', () => {
  assert.deepStrictEqual(
    flow.formatsFor('youtube', PTYPES),
    ['Long Form Script', 'YouTube Short Script', 'Title + Description', 'Thumbnail']
  );
  assert.deepStrictEqual(
    flow.formatsFor('twitter', PTYPES),
    ['Hot Take Tweet', 'Engagement Tweet', 'Thread (5 tweets)']
  );
});

test('a format from another platform cannot be confirmed', () => {
  const st = fresh();
  flow.setSource(st, 'idea');
  flow.setIdea(st, 'Something');
  flow.setPlatform(st, 'youtube', PTYPES);
  flow.goto(st, 'format');            // the step that validates the format
  st.format = 'Hot Take Tweet';       // an X-only format
  assert.strictEqual(flow.canAdvance(st, PTYPES), false);
  st.format = 'Long Form Script';     // a real YouTube format
  assert.strictEqual(flow.canAdvance(st, PTYPES), true);
});

test('changing platform keeps the format when the new platform still offers it', () => {
  const st = fresh();
  flow.setPlatform(st, 'youtube', PTYPES);
  flow.setFormat(st, 'Long Form Script');
  // LinkedIn also has Long Form Script, so the choice survives.
  flow.setPlatform(st, 'linkedin', PTYPES);
  assert.strictEqual(st.format, 'Long Form Script');
  assert.strictEqual(st.needsRegen, false, 'nothing to flag — the format is still valid');
});

test('changing platform falls back to a valid format and flags a regenerate', () => {
  // Spec 8.5: "update the relevant options appropriately ... avoid silently
  // destroying existing work."
  const st = fresh();
  flow.setPlatform(st, 'youtube', PTYPES);
  flow.setFormat(st, 'Long Form Script');
  flow.setPlatform(st, 'tiktok', PTYPES); // TikTok has no "Long Form Script"
  assert.strictEqual(st.format, 'Face-to-Camera Script', 'fell back to the first valid format');
  assert.strictEqual(st.needsRegen, true, 'the change is flagged, not hidden');
});

test('changing format after choosing one flags a regenerate', () => {
  const st = fresh();
  flow.setPlatform(st, 'twitter', PTYPES);
  flow.setFormat(st, 'Hot Take Tweet');
  assert.strictEqual(st.needsRegen, false);
  flow.setFormat(st, 'Thread (5 tweets)');
  assert.strictEqual(st.needsRegen, true);
});

/* ── Sources ───────────────────────────────────────────────────────────── */

test('picking a different source kind drops the previous pick', () => {
  const st = fresh();
  flow.setSource(st, 'story');
  flow.setSourceRef(st, { id: 't1', headline: 'A story' });
  assert.ok(st.sourceRef);

  flow.setSource(st, 'event');
  assert.strictEqual(st.sourceRef, null, 'a story is not a valid event pick');
});

test('an own idea keeps its text and gets a stable id', () => {
  const st = fresh();
  flow.setSource(st, 'idea');
  flow.setIdea(st, 'Why most creators quit at 3 months');
  const a = flow.trendIdFor(st);
  flow.setIdea(st, 'Why most creators quit at 3 months');
  const b = flow.trendIdFor(st);
  assert.ok(a && a.startsWith('idea_'));
  assert.strictEqual(a, b, 'the same idea reuses its slot instead of leaking a new entry');
});

test('summary rows show the chosen values, not placeholders', () => {
  // Spec 7.2: "Platform — TikTok — Change"
  const st = fresh();
  flow.setSource(st, 'story');
  flow.setSourceRef(st, { id: 't1', headline: 'Lakers stun Celtics' });
  flow.setPlatform(st, 'tiktok', PTYPES);
  flow.setTone(st, 'educative');
  const sum = flow.summarize(st, PLATS, TONES);
  assert.strictEqual(sum.platform, 'TikTok');
  assert.strictEqual(sum.tone, 'Educative');
  assert.strictEqual(sum.source, 'Lakers stun Celtics');
});

/* ── The files themselves exist and stay small / single-purpose ─────────── */

test('the Create flow is split into small focused files', () => {
  const dir = path.join(SRC, 'create');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  assert.ok(files.length >= 5, 'expected several responsibility-scoped files, got ' + files.join(', '));

  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length;
    // Spec-adjacent: no file may become the next giant blob. The largest here
    // is steps.js (markup for four screens) at ~330 lines.
    assert.ok(lines < 400, f + ' is ' + lines + ' lines — split it further');
  }
});

test('nothing in the Create folder redefines the app tables', () => {
  const dir = path.join(SRC, 'create');
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    // One source of truth for what platforms/formats exist: core.js.
    assert.ok(!/const\s+PTYPES\s*=/.test(src), f + ' must not redefine PTYPES');
    assert.ok(!/const\s+PLATS\s*=/.test(src), f + ' must not redefine PLATS');
    assert.ok(!/const\s+TONES\s*=/.test(src), f + ' must not redefine TONES');
  }
});

test('generation is delegated, never reimplemented', () => {
  const gen = fs.readFileSync(path.join(SRC, 'create', 'generate.js'), 'utf8');
  // The one legitimate path to the server's generation is window.gen().
  assert.match(gen, /window\.gen\(/, 'generate.js must call the existing pipeline');
  // A second fetch to /api/generate from inside Create would be duplicated logic.
  assert.ok(!/fetch\(\s*['"`]\/api\/generate/.test(gen),
    'generate.js must not call /api/generate directly — window.gen() owns that');
});

test('the result screen reuses the app renderer instead of duplicating it', () => {
  const review = fs.readFileSync(path.join(SRC, 'create', 'review.js'), 'utf8');
  assert.match(review, /renderOut\(/, 'review.js must reuse renderOut()');
});

test('every Create screen can fail without blanking the app', () => {
  // The guard lives in the router bridge (index.html), which is the single place
  // the Create markup enters the page — so one fallback covers all five screens
  // rather than five separate ones. It must never call CPCreate.view()
  // unguarded, or a throw in any step would blank the whole tab.
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const start = html.indexOf('window.pageCreate');
  assert.ok(start > -1, 'index.html must define the pageCreate bridge');
  const body = html.slice(start, start + 400);
  assert.match(body, /CPCreate\s*&&\s*window\.CPCreate\.view/,
    'the bridge must check CPCreate.view exists before calling it');
  assert.match(body, /cc-empty/,
    'the bridge must return real fallback markup, not undefined');

  // The result screen additionally guards each individual output, so one bad
  // message cannot take the whole list down with it.
  const review = fs.readFileSync(path.join(SRC, 'create', 'review.js'), 'utf8');
  assert.match(review, /catch\s*\(e\)\s*\{[\s\S]{0,400}cc-fail/,
    'review.js must render a per-output fallback');
});

test('the Create stylesheet is scoped so it cannot collide with the Studio', () => {
  const css = fs.readFileSync(path.join(SRC, 'create', 'create.css'), 'utf8');
  assert.match(css, /\.cc-root/);
  // A bare selector like `.btn { position: fixed }` would wreck other screens.
  const rules = css.split('\n').filter(l => /^[.a-z\[]/.test(l.trim()) && l.includes('{'));
  for (const r of rules) {
    const sel = r.trim();
    assert.ok(/^\.cc-|^@|^:root/.test(sel), 'unscoped selector in create.css: ' + sel);
  }
});
