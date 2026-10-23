/* Tests for carrying a story into Create (spec 3.2 + 3.1).
 *
 * Spec 3.2: "For example, a story detail view could offer a prominent action
 * such as Create content. That action should carry the relevant story context
 * into the creation workflow."
 *
 * Spec 3.1: "Avoid discarding the selected story or previously entered
 * information when the user changes a setting or returns to a previous screen.
 * Preserve relevant state whenever appropriate."
 *
 * The rules live in public/lib/storyToCreate.js as real code, so this test
 * requires it rather than grepping for its text. A test that only matched
 * strings would pass with the logic broken.
 *
 * The wiring (public/create/index.js) is checked for the specific lines that
 * connect the card's selections to the flow's setters — that is the join where
 * a regression would silently drop the context.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const seedLib = require(path.join(root, 'public', 'lib', 'storyToCreate.js'));
const flow = require(path.join(root, 'public', 'create', 'flow.js'));

const core = fs.readFileSync(path.join(root, 'public', 'core.js'), 'utf8');
const createIndex = fs.readFileSync(path.join(root, 'public', 'create', 'index.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');

const { cpCreateSeed, cpCreateLandingStep } = seedLib;

// The app's real tables (core.js PLATS/PTYPES), copied so the pure logic can be
// run outside a browser. The UI reads the live ones at runtime.
const PTYPES = {
  tiktok: ['TikTok Script', 'TikTok No-Face Graphic', 'TikTok Silent Camera', 'Caption + Hashtags'],
  instagram: ['IG Reel Script', 'IG Carousel', 'Caption + Hashtags'],
  youtube: ['Long Form Script', 'YouTube Short Script', 'Title + Description', 'Thumbnail'],
  twitter: ['Hot Take Tweet', 'Engagement Tweet', 'Thread (5 tweets)']
};

const STORY = { id: 'st1', headline: 'WWE star stuns the crowd', summary: 'A record night.', niche: 'WWE', score: 82 };

test('a story with no card selection arrives carrying the recommended platform', () => {
  const seed = cpCreateSeed(STORY, { recommended: 'tiktok', platforms: ['instagram'], ptypes: PTYPES });
  assert.strictEqual(seed.source, 'story');
  assert.strictEqual(seed.sourceRef.id, 'st1', 'the story itself must travel with the flow');
  assert.strictEqual(seed.platform, 'tiktok', 'the card\'s recommended platform is the carried choice');
  assert.ok(seed.format, 'a platform must never arrive without a format, or step 3 strands the user');
  assert.strictEqual(seed.carried, true);
});

test('a platform the user picked on the card outranks the recommendation', () => {
  // Spec 3.1: preserve what the user already chose.
  const seed = cpCreateSeed(
    Object.assign({}, STORY, { platform: 'youtube' }),
    { picked: true, recommended: 'tiktok', platforms: ['youtube'], ptypes: PTYPES }
  );
  assert.strictEqual(seed.platform, 'youtube', 'the user\'s own pick must win over the app\'s suggestion');
});

test('a platform the card merely DEFAULTS to is not treated as a choice', () => {
  // The bug this catches, found in the real browser walk: core.js's toggle()
  // writes S.plat[tid] = primaryPlatform the moment a card opens, so the flow
  // carried Instagram while the card one line above said "Best platform:
  // TikTok". The recommendation must win when the platform was not tapped.
  const seed = cpCreateSeed(
    Object.assign({}, STORY, { platform: 'instagram' }),
    { picked: false, recommended: 'tiktok', platforms: ['instagram', 'tiktok'], ptypes: PTYPES }
  );
  assert.strictEqual(seed.platform, 'tiktok',
    'an untapped default must lose to the recommendation the card is showing');
});

test('the handler only treats the card platform as picked when it was tapped', () => {
  // Guards the join itself: the handler must consult S.hasSelected, not simply
  // forward S.plat[tid] as though it were a decision.
  assert.match(createIndex, /var picked = !!\(S\.hasSelected && S\.hasSelected\[story\.id \+ '_platform'\]\)/,
    'the handler must read the tap flag, not the defaulted map');
  assert.match(createIndex, /picked: picked/, 'and must pass it through to the seed');
});

test('a card format that belongs to the carried platform is preserved', () => {
  // Spec 3.1 again: a previously entered choice is not thrown away.
  const seed = cpCreateSeed(
    Object.assign({}, STORY, { platform: 'youtube', format: 'YouTube Short Script' }),
    { picked: true, recommended: 'tiktok', ptypes: PTYPES }
  );
  assert.strictEqual(seed.format, 'YouTube Short Script');
});

test('a stale card format is replaced, never carried into a platform that lacks it', () => {
  // The dangerous case: the card held a TikTok-only format, but the platform we
  // resolved is YouTube. Carrying it would fail flow.canAdvance() and leave the
  // user unable to continue. This is the test that catches that regression.
  const seed = cpCreateSeed(
    Object.assign({}, STORY, { platform: 'youtube', format: 'TikTok Silent Camera' }),
    { picked: true, ptypes: PTYPES }
  );
  assert.strictEqual(seed.format, PTYPES.youtube[0], 'must fall back to the platform\'s own first format');
  assert.ok(PTYPES.youtube.indexOf(seed.format) >= 0, 'the carried format must exist on the carried platform');
});

test('an unknown platform is never carried, because it has no formats', () => {
  const seed = cpCreateSeed(STORY, { recommended: 'myspace', platforms: ['myspace'], ptypes: PTYPES });
  assert.strictEqual(seed.platform, null, 'a platform absent from the format table cannot be carried');
  assert.strictEqual(seed.step, 'platform', 'and the flow must ask for one instead of guessing');
  assert.strictEqual(seed.carried, false);
});

test('the landing step skips only questions that are already answered', () => {
  assert.strictEqual(cpCreateLandingStep('tiktok', 'TikTok Script'), 'tone',
    'platform and format known -> only the optional tone choice remains');
  assert.strictEqual(cpCreateLandingStep(null, 'TikTok Script'), 'platform',
    'no platform -> must still ask for the platform');
  assert.strictEqual(cpCreateLandingStep('tiktok', null), 'platform',
    'no format -> must still ask');
});

test('the seed is a state the real flow accepts', () => {
  // The strongest check available without a browser: feed the produced values
  // through flow.js\'s own validation. If this passes for tone, the user can
  // genuinely press Continue; if it fails, the button would open a dead flow.
  const seed = cpCreateSeed(STORY, { recommended: 'youtube', ptypes: PTYPES });
  const st = flow.defaultState();
  st.source = seed.source;
  st.sourceRef = seed.sourceRef;
  st.platform = seed.platform;
  st.format = seed.format;
  st.step = 'platform';

  assert.strictEqual(flow.canAdvance(st, PTYPES), true, 'a seeded platform must be a legal choice');
  st.step = 'format';
  assert.strictEqual(flow.canAdvance(st, PTYPES), true, 'the carried format must satisfy flow.js\'s own rule');

  st.step = 'tone';
  assert.strictEqual(flow.canAdvance(st, PTYPES), true, 'tone always has a default, so generation is reachable');
});

test('no story means no seed, so the caller declines instead of opening a half-filled flow', () => {
  assert.strictEqual(cpCreateSeed(null, { ptypes: PTYPES }), null);
  assert.strictEqual(cpCreateSeed({}, { ptypes: PTYPES }), null);
  assert.strictEqual(cpCreateSeed({ headline: 'no id' }, { ptypes: PTYPES }), null);
});

test('the story card actually renders the Create content action', () => {
  assert.match(core, /class="btn bp cp-create-cta" type="button" onclick="cpCreateStartFromTrend\(/,
    'spec 3.2 asks for a prominent Create content action on the story detail view');
  assert.match(core, /<span>Create content<\/span>/,
    'the action must be named the way the brief names it');
});

test('the handler applies the seed to the flow and switches tab', () => {
  assert.match(createIndex, /window\.cpCreateStartFromTrend = function \(trend\)/,
    'the card calls this global; it must exist');
  assert.match(createIndex, /st\.sourceRef = seed\.sourceRef/,
    'the story itself must be carried, not just the platform');
  assert.match(createIndex, /st\.platform = seed\.platform/,
    'the platform must be carried');
  assert.match(createIndex, /f\.goto\(st, seed\.step\)/,
    'the flow must land on the seeded step rather than always step 1');
  assert.match(createIndex, /window\.setTab\('create'\)/,
    'the user must end up on the Create tab');
});

test('a missing helper degrades to story-only seeding instead of doing nothing', () => {
  // The freeze class this codebase already paid for: a newer core.js against a
  // stale cached helper. The button must still do something useful.
  assert.match(createIndex, /if \(!seed\) \{[\s\S]*?sourceRef: story[\s\S]*?step: 'platform'/,
    'without the helper the flow must still open at step 2 with the story attached');
});

test('the helper is loaded before core.js so the card can never call a missing function', () => {
  const helperAt = indexHtml.indexOf('lib/storyToCreate.js');
  const coreAt = indexHtml.indexOf('src="core.js');
  assert.ok(helperAt > -1, 'the helper must be referenced by the page');
  assert.ok(coreAt > -1, 'core.js must still be referenced');
  assert.ok(helperAt < coreAt, 'the helper must load BEFORE core.js');
});

test('the cached page is versioned forward so phones pick up the new button', () => {
  // Without both of these the change is invisible on a phone that already has
  // the old shell cached, which is how "it works in the browser" becomes "it
  // still doesn\'t work for me".
  assert.match(indexHtml, /lib\/storyToCreate\.js\?v=45/, 'the helper needs its own cache-busting version');
  assert.match(indexHtml, /core\.js\?v=45/, 'core.js changed, so its version must change too');
  assert.match(sw, /creatorpulse-v21/, 'the service worker cache name must move forward');
});

test('the new action is a practical touch target (spec 15.3)', () => {
  assert.match(indexHtml, /\.cp-create-cta\{[^}]*min-height:40px/,
    'spec 15.3: interactive controls must be large enough to use comfortably');
});
