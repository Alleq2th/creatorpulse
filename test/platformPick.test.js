const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Spec Part 5.4 governs the platform recommendation exactly as it governs the
// opportunity score:
//
//   "The score and progress bar can be useful, but they should not imply more
//    certainty than the underlying system supports."
//   "Retain the existing scoring logic."
//   "Do not change the meaning of the score during a visual redesign."
//   "If the product already provides an explanation of how the score should be
//    interpreted, make that information accessible without cluttering the
//    interface."
//
// and Part 5.1 closes with the rule that shapes everything here:
//
//   "Use the existing data and capabilities rather than inventing additional
//    metrics or recommendations."
//
// The central risk of adding an explanation is that the explanation drifts
// from the pick. So the first test is PARITY: the new lib must reproduce the
// old heuristic exactly, for every input class. Everything after that tests
// honesty, accessibility and wiring.

const root = path.join(__dirname, '..');
const pickLib = require(path.join(root, 'public', 'lib', 'platformPick.js'));
const explainLib = require(path.join(root, 'public', 'lib', 'platformExplain.js'));

const core = fs.readFileSync(path.join(root, 'public', 'core.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');

const { cpPickPlatform, cpPlatformBreakdown } = pickLib;
const { cpPlatformMarkup } = explainLib;

const PLATS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X' }
];

// ── the original implementation, copied verbatim from core.js before this ──
// change, so "retain the existing scoring logic" is measured against the real
// thing rather than against my description of it.
function legacyBestPlatform(t, user) {
  const plats = user?.platforms || ['instagram'];
  const hay = ((t.headline || '') + ' ' + (t.summary || '')).toLowerCase();
  const scores = { tiktok: 0, instagram: 0, youtube: 0, twitter: 0 };
  if (/viral|dance|challenge|meme|reacts?|shocking|stuns|wild|insane|hilarious|prank/.test(hay)) scores.tiktok += 3;
  if (/\d+%|\$\d|record|stats?|numbers|ranking|top \d|list of/.test(hay)) scores.instagram += 3;
  if (/photo|aesthetic|fashion|style|design|behind the scenes/.test(hay)) scores.instagram += 2;
  if (/explain|breakdown|analysis|review|documentary|deep dive|how .* works|why .* happened/.test(hay)) scores.youtube += 3;
  if (/breaking|takes?|debate|slams|blasts|responds|reacts to|opinion/.test(hay)) scores.twitter += 3;
  if ((t.score || 0) >= 85) { scores.twitter += 1; scores.youtube += 1; }
  const ranked = Object.entries(scores).filter(([p]) => plats.includes(p)).sort((a, b) => b[1] - a[1]);
  if (ranked.length && ranked[0][1] > 0) return ranked[0][0];
  return user?.primaryPlatform || plats[0] || 'instagram';
}

// ── parity: the pick must not move ─────────────────────────────────────────
// The headline/summary classes below deliberately include every rule firing,
// several rules firing at once, ties, and total non-matches - plus the
// sports-style plain headline that used to fall through silently.

test('the pick is IDENTICAL to the original heuristic for every input class', () => {
  const stories = [
    { headline: 'Star stuns crowd with insane viral dance challenge' },          // reaction
    { headline: 'Club record broken as striker hits 30% conversion rate' },       // stats
    { headline: 'Behind the scenes of the new kit photoshoot' },                  // visual
    { headline: 'Explained: why the transfer happened and how it works' },        // indepth
    { headline: 'Pundit slams referee in breaking rant' },                        // opinion
    { headline: 'Gaffer responds to critics after defeat', summary: 'A debate' }, // opinion
    { headline: 'Record breaking deal explained: analysis', summary: 'photo' },   // many at once
    { headline: 'United beat City 2-1' },                                         // NONE - the old silent path
    { headline: '' },
    { headline: 'Neutral headline about weather' },
    { headline: 'Big story', score: 85 },                                         // bonus only
    { headline: 'Big story', score: 92 },                                         // bonus, high
    { headline: 'Viral meme', score: 90 },                                        // reaction + bonus
    { headline: 'Stats dive 12%', score: 30 },
    { score: 85 }
  ];
  const platformSets = [
    ['instagram'],                          // single
    ['tiktok', 'youtube'],                  // no instagram/twitter
    ['twitter', 'instagram', 'youtube', 'tiktok'],
    ['youtube'],
    ['linkedin'],                           // unsupported id - must fall back
    [],                                     // empty (truthy) - must NOT default
    undefined,                              // must default to ['instagram']
    null
  ];
  const primaries = [undefined, null, 'youtube', 'twitter', 'tiktok'];

  let checked = 0;
  for (const story of stories) {
    for (const platforms of platformSets) {
      for (const primary of primaries) {
        const user = { platforms, primaryPlatform: primary };
        const next = cpPickPlatform(story, platforms, primary);
        const prev = legacyBestPlatform(story, user);
        assert.strictEqual(next, prev,
          `drifted for ${JSON.stringify(story)} platforms=${JSON.stringify(platforms)} primary=${primary}: ${next} vs ${prev}`);
        checked++;
      }
    }
  }
  assert.ok(checked === 600, `expected 600 parity cases, ran ${checked}`);
});

test('the recommendation is always a string and never empty', () => {
  const inputs = [undefined, null, {}, { headline: 'x' }, { score: NaN }];
  for (const s of inputs) {
    const p = cpPickPlatform(s, undefined, undefined);
    assert.strictEqual(typeof p, 'string', 'pick must be a string');
    assert.ok(p.length > 0, 'pick must not be empty');
  }
});

// ── the explanation must not contradict the pick ───────────────────────────

test('the breakdown reports the same platform the card shows', () => {
  const stories = [
    { id: 'a', headline: 'Viral challenge takes over' },
    { id: 'b', headline: 'Explained: how the deal works' },
    { id: 'c', headline: 'Neutral story about weather' },
    { id: 'd', headline: 'Stats 40% record', summary: 'photo aesthetic' }
  ];
  const sets = [['instagram'], ['tiktok', 'twitter', 'youtube', 'instagram'], ['youtube']];
  for (const story of stories) {
    for (const platforms of sets) {
      const b = cpPlatformBreakdown(story, { platforms, plats: PLATS });
      assert.strictEqual(b.pick, cpPickPlatform(story, platforms, undefined),
        `panel says ${b.pick}, row says ${cpPickPlatform(story, platforms, undefined)}`);
    }
  }
});

// ── honesty: missing data is reported, never invented ──────────────────────

test('a story that matches no rule is shown as a fallback, not as a recommendation', () => {
  const b = cpPlatformBreakdown({ id: 'a', headline: 'United beat City 2-1' }, { platforms: ['youtube'], plats: PLATS });
  assert.strictEqual(b.fellBack, true, 'a non-matching story must be flagged as a fallback');
  assert.strictEqual(b.pick, 'youtube', 'and must fall back to the primary/platform list');
  const rec = b.factors.find(f => f.key === 'recommended');
  assert.match(rec.note, /fell back/i, 'the panel must say the pick is a fallback');
  assert.ok(!/scored highest/i.test(rec.note), 'must not claim it won on merit');
});

test('a matched rule names the exact words that fired', () => {
  const b = cpPlatformBreakdown({ id: 'a', headline: 'Star stuns crowd in insane viral dance' }, { platforms: ['tiktok'], plats: PLATS });
  const sig = b.signals.find(s => s.key === 'reaction');
  assert.strictEqual(sig.fired, true);
  assert.ok(sig.words.includes('stuns'), 'must report the real matched word');
  assert.ok(sig.words.includes('viral'), 'must report every real match');
  const factor = b.factors.find(f => f.key === 'sig_reaction');
  assert.match(factor.note, /"stuns"/, 'the note must quote the matched word');
});

test('factors the app genuinely does not receive are listed as unavailable', () => {
  const b = cpPlatformBreakdown({ id: 'a', headline: 'x' }, { platforms: ['instagram'], plats: PLATS });
  const keys = b.missing.map(m => m.key);
  assert.ok(keys.includes('audience'), 'follower counts must be declared unavailable');
  assert.ok(keys.includes('history'), 'post performance must be declared unavailable');
  for (const m of b.missing) {
    assert.ok(!/\d/.test(m.label), `"${m.label}" must not carry a made-up figure`);
    assert.strictEqual(m.value, undefined, 'an unavailable factor must not carry a value');
    assert.ok(m.note.length > 20, 'each unavailable factor needs a real explanation');
  }
});

test('a platform that out-scored the pick is disclosed, not hidden', () => {
  // Twitter matches "breaking" but is not one of the creator's platforms.
  const b = cpPlatformBreakdown({ id: 'a', headline: 'Breaking news slams' }, { platforms: ['instagram'], plats: PLATS });
  assert.strictEqual(b.pick, 'instagram', 'the pick is confined to the creator platforms');
  assert.strictEqual(b.ignored.length, 1, 'the stronger non-platform match must be listed');
  assert.strictEqual(b.ignored[0].id, 'twitter');
  const f = b.factors.find(x => x.key === 'ignored');
  assert.match(f.note, /not in your platform list/i, 'must explain why it was not chosen');
});

test('the panel never claims the pick predicts performance', () => {
  const html = cpPlatformMarkup(
    { id: 'a', headline: 'Viral dance', score: 90 },
    { open: true, platforms: ['tiktok'], plats: PLATS }
  );
  assert.ok(!/guaranteed|will perform|best place to post|you will get/i.test(html),
    'must not promise an outcome');
  assert.match(html, /not a forecast/i);
  assert.match(html, /rule-based pick/i);
});

// ── accessibility without clutter ──────────────────────────────────────────

test('closed by default, and the control is a real focusable button', () => {
  const shut = cpPlatformMarkup({ id: 'a', headline: 'Viral dance' }, { platforms: ['tiktok'], plats: PLATS });
  assert.match(shut, /class="oppw-toggle"/, 'must reuse the existing collapsed control style');
  assert.match(shut, /aria-expanded="false"/);
  assert.match(shut, /Why this platform\?/);
  assert.ok(!shut.includes('class="oppw"'), 'the explanation must not render while closed');
  assert.match(shut, /<button type="button"[^>]*onclick="togglePlatWhy\('a'\)"/);
  // And the original row survives, so nothing was taken away (spec 17.2).
  assert.match(shut, /class="best-plat"/);
  assert.match(shut, /Best platform/);
});

test('the row still shows the recommended platform name', () => {
  const html = cpPlatformMarkup({ id: 'a', headline: 'Viral dance' }, { platforms: ['tiktok'], plats: PLATS });
  assert.match(html, /class="best-plat-val">TikTok</, 'the recommendation itself must still be visible');
});

test('open state renders the factors and flips the label + aria', () => {
  const open = cpPlatformMarkup(
    { id: 'a', headline: 'Explained: the record deal', score: 90 },
    { open: true, platforms: ['youtube', 'instagram'], plats: PLATS }
  );
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /Hide why/);
  assert.match(open, /class="oppw"/);
  assert.match(open, /How it compared/);
  assert.match(open, /What the app does not receive/);
  assert.match(open, /id="platw-a"|aria-controls="platw-a"/);
});

test('the collapsed control stays small enough not to clutter the panel', () => {
  // \s* before the brace: the rule is `.oppw-toggle{...}`, but a DESCENDANT
  // rule such as `.best-plat-wrap .oppw-toggle{margin-top:4px}` also contains
  // the literal `.oppw-toggle{`, so an unanchored match can pick up the wrong
  // block. Anchoring to `{` immediately after the class name selects the
  // control's own rule only - the same trap `.oppw-toggle{` fell into here.
  const rule = indexHtml.match(/\.oppw-toggle\s*\{[^}]*\}/);
  assert.ok(rule, '.oppw-toggle must keep its own style rule');
  assert.match(rule[0], /min-height:28px/, 'must keep a real hit target (spec 15.3)');
  const wrap = indexHtml.match(/\.best-plat-wrap\s*\{[^}]*\}/);
  assert.ok(wrap, '.best-plat-wrap must have its own style rule');
  assert.ok(!/box-shadow/.test(wrap[0]), 'the wrapper must not add decorative weight');
});

test('a missing script degrades to the old row instead of throwing', () => {
  assert.match(core, /window\.cpPlatformMarkup\s*\n?\s*\?/,
    'core.js must check the helper exists before calling it');
  assert.match(core, /class="best-plat-lbl">Best platform/,
    'the old row markup must survive as the fallback');
});

// ── the browser branch, not just Node ──────────────────────────────────────
//
// This is the failure this codebase has already hit once: a module whose two
// branches return differently-named functions passes every Node test and then
// renders nothing in the browser. Run the REAL files under a fake `window` and
// demand byte-identical output from both.

function runInBrowserSandbox() {
  const vm = require('node:vm');
  const win = {};
  const sandbox = { window: win, console };
  vm.createContext(sandbox);
  const load = (f) => vm.runInContext(
    fs.readFileSync(path.join(root, 'public', 'lib', f), 'utf8'), sandbox, { filename: f });
  // Exactly index.html's order.
  load('htmlEsc.js');
  load('opportunityScore.js');
  load('opportunityExplain.js');
  load('platformPick.js');
  load('platformExplain.js');
  return win;
}

test('the panel renders through the BROWSER branch too, not just Node', () => {
  const win = runInBrowserSandbox();
  assert.strictEqual(typeof win.cpPickPlatform, 'function', 'pick global missing');
  assert.strictEqual(typeof win.cpPlatformBreakdown, 'function', 'breakdown global missing');
  assert.strictEqual(typeof win.cpPlatformMarkup, 'function', 'markup global missing');
  assert.strictEqual(typeof win.cpEsc, 'function', 'shared escaper global missing');
  assert.strictEqual(typeof win.cpExplainFactorRow, 'function', 'shared row renderer global missing');

  const story = { id: 'a', headline: 'Explained: the record deal', score: 90, niche: 'Football' };
  const html = win.cpPlatformMarkup(story, { open: true, platforms: ['youtube', 'instagram'], plats: PLATS });
  assert.ok(html.includes('class="oppw"'), 'the open panel did not render in the browser branch');
  assert.ok(html.includes('How it compared'), 'the comparison block is missing in the browser branch');
  assert.ok(html.includes('Explain / analysis language'), 'the factor list is missing in the browser branch');
});

test('both branches produce byte-identical markup for the same story', () => {
  const win = runInBrowserSandbox();
  const story = { id: 'a', headline: 'Viral challenge stuns fans', score: 90, niche: 'Football' };
  const opts = { open: true, platforms: ['tiktok', 'youtube'], plats: PLATS };

  const inBrowser = win.cpPlatformMarkup(story, opts);
  const inNode = cpPlatformMarkup(story, opts);
  assert.strictEqual(inNode, inBrowser,
    'the browser and Node branches render different markup - the module shapes disagree');

  const shutBrowser = win.cpPlatformMarkup(story, Object.assign({}, opts, { open: false }));
  const shutNode = cpPlatformMarkup(story, Object.assign({}, opts, { open: false }));
  assert.strictEqual(shutNode, shutBrowser, 'the closed state must also match across branches');
});

test('escaping the same input gives the same output on both branches', () => {
  const win = runInBrowserSandbox();
  const nasty = '<img src=x onerror="alert(1)">&\'';
  const html = cpPlatformMarkup({ id: nasty, headline: nasty, summary: nasty }, { open: true, platforms: ['instagram'], plats: PLATS });
  assert.ok(!html.includes('<img src=x'), 'a raw tag must never survive into markup');
  assert.ok(!html.includes('<script>'), 'angle brackets must not survive into markup');
  assert.match(html, /&#39;/, 'a single quote must be encoded');
  // And the shared escaper is actually the one being used in the browser.
  assert.strictEqual(win.cpEsc(nasty), pickExplainEsc(nasty));
});

function pickExplainEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── wiring ─────────────────────────────────────────────────────────────────

test('the helper scripts load before core.js, in the right order, versioned', () => {
  const score = indexHtml.indexOf('lib/opportunityScore.js');
  const explain = indexHtml.indexOf('lib/opportunityExplain.js');
  const esc = indexHtml.indexOf('lib/htmlEsc.js');
  const pick = indexHtml.indexOf('lib/platformPick.js');
  const platExplain = indexHtml.indexOf('lib/platformExplain.js');
  const coreTag = indexHtml.indexOf('<script src="core.js');

  assert.ok(esc > -1 && esc < score, 'htmlEsc.js must load before the modules that escape');
  assert.ok(score < explain, 'the score lib must load before the explain lib');
  assert.ok(explain < platExplain, 'platformExplain.js reuses the row renderer from opportunityExplain.js');
  assert.ok(pick < platExplain, 'the pick lib must load before the markup that reads it');
  assert.ok(platExplain < coreTag, 'every helper must load before core.js');
  assert.match(indexHtml, /lib\/htmlEsc\.js\?v=\d+/);
  assert.match(indexHtml, /lib\/platformPick\.js\?v=\d+/);
  assert.match(indexHtml, /lib\/platformExplain\.js\?v=\d+/);
});

test('the service-worker cache was bumped so phones fetch the new files', () => {
  assert.match(sw, /CACHE_NAME = "creatorpulse-v\d+"/);
  const v = Number(sw.match(/CACHE_NAME = "creatorpulse-v(\d+)"/)[1]);
  assert.ok(v >= 20, `cache version must advance past v19, found v${v}`);
});

test('the pick is not duplicated - core.js delegates to the one implementation', () => {
  assert.match(core, /if\(window\.cpPickPlatform\) return window\.cpPickPlatform\(t, S\.user\?\.platforms, S\.user\?\.primaryPlatform\)/,
    'core.js must delegate to the shared implementation');
  // The keyword rules must exist in exactly one place.
  const rules = (core.match(/scores\.tiktok \+= 3/g) || []).length;
  assert.strictEqual(rules, 1, `expected 1 fallback rule set in core.js, found ${rules}`);
  const str = fs.readFileSync(path.join(root, 'public', 'lib', 'platformPick.js'), 'utf8');
  assert.strictEqual((str.match(/scores\[s\.platform\] \+= s\.points/g) || []).length, 1,
    'the lib must apply points in exactly one place');
});

test('the escaper is not duplicated - only one htmlEsc owns it', () => {
  const htmlEsc = fs.readFileSync(path.join(root, 'public', 'lib', 'htmlEsc.js'), 'utf8');
  const oppExplain = fs.readFileSync(path.join(root, 'public', 'lib', 'opportunityExplain.js'), 'utf8');
  assert.match(htmlEsc, /function cpEsc\(v\)/, 'htmlEsc.js must own the escaper');
  assert.match(oppExplain, /window\.cpEsc\(v\)/, 'opportunityExplain.js must prefer the shared escaper');
  // Its private copy may remain only as a named degradation path.
  assert.match(oppExplain, /function localEsc\(v\)/, 'the fallback must be explicit, not a second primary');
});

test('the toggle is registered on window and uses its own flag', () => {
  assert.match(core, /window\.togglePlatWhy\s*=\s*\(tid\)\s*=>/);
  assert.match(core, /S\.platWhy\[tid\] = !S\.platWhy\[tid\]/, 'tapping again must close it');
  // A separate flag from the score panel, so opening one never toggles the other.
  assert.match(core, /S\.platWhy = S\.platWhy \|\| \{\}/);
});

test('Plus AI and the Studio were not touched by this change', () => {
  // The brief's hard constraint. A syntax-only check: the files must still
  // parse and still expose their entry points.
  for (const f of ['plus-ai/state.js', 'plus-ai/api.js', 'plus-ai/cards.js', 'plus-ai/ui.js', 'plus-ai/actions.js', 'plus-ai/index.js', 'studio.js']) {
    const p = path.join(root, 'public', f);
    assert.ok(fs.existsSync(p), `${f} must still exist`);
    assert.doesNotThrow(() => new (require('node:vm').Script)(fs.readFileSync(p, 'utf8'), { filename: f }),
      `${f} must still parse`);
  }
});
