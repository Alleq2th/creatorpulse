// Every helper public/studio.js calls must actually be defined.
//
// Why this test exists: studio.js renders its UI by building template strings,
// so a call to a helper that does not exist is perfectly valid JavaScript — it
// only throws when that line is reached at runtime. A single typo
// (`svFormatMs` instead of `smFormatMs`) sat inside the clip-strip template and
// threw during render, which left the strip showing "Takes · 0" while the take
// itself existed in state. Pressing record-stop looked like it had done
// nothing at all.
//
// `node --check` passed. The whole 100-test suite passed. It took a real
// browser with a fake camera to surface it, which is far too late. This test
// closes that gap: it resolves every sv*/sm* identifier in studio.js against
// the functions actually defined in studio.js and the exports of
// lib/studioModel.js, so a typo is caught the moment it is written.
//
// The scan reads the RAW source, template literals included — that is where
// the markup (and therefore the data-act attributes) actually lives.
//
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const STUDIO_SRC = fs.readFileSync(path.join(PUBLIC, 'studio.js'), 'utf8');
const MODEL_SRC = fs.readFileSync(path.join(PUBLIC, 'lib', 'studioModel.js'), 'utf8');
const INDEX_SRC = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');

// Is `name` defined in this source? Covers a function declaration, a
// window/global assignment, and an object-literal property.
function isDefined(name, src){
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [
    new RegExp('function\\s+' + esc + '\\s*\\('),
    new RegExp('\\b' + esc + '\\s*[:=]\\s*(async\\s+)?(function|\\()'),
    new RegExp('\\b' + esc + '\\s*[:=]'),
  ].some(re => re.test(src));
}

function usedHelpers(src){
  const used = new Set();
  const re = /\b(sv|sm)[A-Z][A-Za-z0-9]*/g;
  let m;
  while ((m = re.exec(src)) !== null) used.add(m[0]);
  return used;
}

test('every sv*/sm* helper studio.js calls is actually defined', () => {
  const used = usedHelpers(STUDIO_SRC);
  assert.ok(used.size > 30, 'expected to find many studio helpers, found ' + used.size);

  const missing = [...used].filter(n => !isDefined(n, STUDIO_SRC) && !isDefined(n, MODEL_SRC));
  assert.deepEqual(
    missing,
    [],
    'studio.js calls helpers that are never defined (a typo here throws only at ' +
    'render time, leaving the UI silently stale): ' + missing.join(', ')
  );
});

test('the model file is the only place sm* helpers live', () => {
  // sm* names belong to the pure model. Redefining one inside studio.js would
  // let the DOM layer and the tested layer drift apart.
  const smUsed = [...usedHelpers(STUDIO_SRC)].filter(n => n.startsWith('sm'));
  assert.ok(smUsed.length > 10, 'expected studio.js to use the model, found ' + smUsed.length);
  const redefined = smUsed.filter(n => new RegExp('function\\s+' + n + '\\s*\\(').test(STUDIO_SRC));
  assert.deepEqual(redefined, [], 'sm* helpers must stay in lib/studioModel.js: ' + redefined.join(', '));
});

// Every sm* name studio.js relies on must be a real export, or it is undefined
// in the browser despite existing as a function in the file.
test('studio.js only calls sm* helpers the model actually exports', () => {
  const exported = new Set((MODEL_SRC.match(/module\.exports\s*=\s*\{([\s\S]*?)\}/) || ['', ''])[1]
    .split(',')
    .map(s => s.replace(/\/\/.*/g, '').trim())
    .filter(Boolean));
  assert.ok(exported.size > 15, 'expected the model to export its surface, found ' + exported.size);

  const used = [...usedHelpers(STUDIO_SRC)].filter(n => n.startsWith('sm'));
  const notExported = used.filter(n => !exported.has(n));
  assert.deepEqual(notExported, [], 'sm* helpers missing from module.exports: ' + notExported.join(', '));
});

test('studio.js never targets the retired cs-* element ids it replaced', () => {
  // The old markup used #cs-cam-live / #cs-ed-video / #cs-cam-time. The new
  // Studio uses sv-*. A leftover reference would silently match nothing.
  const stale = ['cs-cam-live', 'cs-ed-video', 'cs-cam-time', 'cs-cam-prompter-inner']
    .filter(id => STUDIO_SRC.includes(id));
  assert.deepEqual(stale, [], 'studio.js still targets removed elements: ' + stale.join(', '));
});

test('the strip template always renders, so a take is never invisible', () => {
  // The regression that mattered most for the user: pressing stop produced a
  // real clip but the strip was not painted, so nothing appeared to happen.
  assert.match(STUDIO_SRC, /\$\{svStrip\(st\)\}/, 'the camera view must call svStrip(st)');
  assert.doesNotMatch(
    STUDIO_SRC,
    /clips\s*\|\|\s*st\.running\s*\?\s*svStrip/,
    'svStrip must not be gated behind a condition — that is what hid the take'
  );
});

test('every action the markup can dispatch has a handler', () => {
  // data-act="foo" resolves through SV_ACT[foo]. An unhandled name is a dead
  // button.
  const acts = new Set();
  const re = /data-act="([a-zA-Z][A-Za-z0-9]*)"/g;
  let m;
  while ((m = re.exec(STUDIO_SRC)) !== null) acts.add(m[1]);
  assert.ok(acts.size > 25, 'expected many data-act attributes, found ' + acts.size);

  const handlers = new Set((STUDIO_SRC.match(/const SV_ACT\s*=\s*\{([\s\S]*?)\n\};/) || ['', ''])[1]
    .split('\n')
    .map(l => (l.match(/^\s*([a-zA-Z][A-Za-z0-9]*)\s*:/) || [])[1])
    .filter(Boolean));
  assert.ok(handlers.size > 25, 'expected many SV_ACT handlers, found ' + handlers.size);

  const missing = [...acts].filter(a => !handlers.has(a));
  assert.deepEqual(missing, [], 'data-act values with no SV_ACT handler: ' + missing.join(', '));
});

test('every pointer gesture the markup declares has a handler', () => {
  const ptrs = new Set();
  const re = /data-ptr="([a-zA-Z][A-Za-z0-9]*)"/g;
  let m;
  while ((m = re.exec(STUDIO_SRC)) !== null) ptrs.add(m[1]);
  assert.ok(ptrs.size >= 4, 'expected the gesture set, found ' + ptrs.size);

  const handlers = new Set((STUDIO_SRC.match(/const SV_PTR\s*=\s*\{([\s\S]*?)\n\};/) || ['', ''])[1]
    .split('\n')
    .map(l => (l.match(/^\s*([a-zA-Z][A-Za-z0-9]*)\s*:/) || [])[1])
    .filter(Boolean));

  const missing = [...ptrs].filter(p => !handlers.has(p));
  assert.deepEqual(missing, [], 'data-ptr values with no SV_PTR handler: ' + missing.join(', '));
});

test('index.html loads the model before studio, and both are served', () => {
  // same ordering trap as authRedirect.js: studio.js calls sm* helpers at
  // render time, so the model script has to exist first.
  const iModel = INDEX_SRC.indexOf('studioModel.js');
  const iStudio = INDEX_SRC.indexOf('src="studio.js');
  assert.ok(iModel !== -1, 'index.html must load lib/studioModel.js');
  assert.ok(iStudio !== -1, 'index.html must load studio.js');
  assert.ok(iModel < iStudio, 'studioModel.js must be loaded before studio.js');
  assert.ok(
    fs.existsSync(path.join(PUBLIC, 'studio.css')),
    'index.html links /studio.css but the file is missing'
  );
});

test('the export engine is self-hosted and every piece is committed', () => {
  // @ffmpeg/ffmpeg boots its core in a Web Worker, and a Worker can only be
  // constructed from a SAME-ORIGIN script. It was previously loaded from
  // unpkg.com, which sends no Access-Control-Allow-Origin, so the constructor
  // threw "Script at ... cannot be accessed from origin" and EVERY export
  // failed — while the progress ring sat on "Loading the video engine...".
  // Nothing in the suite could see that. These assertions keep it that way.
  const svff = (STUDIO_SRC.match(/const SVFF\s*=\s*\{[\s\S]*?\};/) || [''])[0];
  assert.ok(svff, 'the SVFF engine config must exist');
  assert.ok(
    !/https?:\/\//.test(svff),
    'the export engine must be served from our own origin, not a CDN: ' + svff
  );
  assert.match(svff, /'\/vendor\/ffmpeg'/, 'SVFF.core must point at /vendor/ffmpeg');

  // Every file the loader fetches has to be present, or export dies at runtime.
  for (const f of ['ffmpeg.js', '814.ffmpeg.js', 'util.js', 'ffmpeg-core.js', 'ffmpeg-core.wasm']){
    const p = path.join(PUBLIC, 'vendor', 'ffmpeg', f);
    assert.ok(fs.existsSync(p), 'missing vendored engine file: public/vendor/ffmpeg/' + f);
    assert.ok(fs.statSync(p).size > 1000, 'vendored engine file looks truncated: ' + f);
  }

  // A failed engine load must be recoverable — otherwise one failure poisons
  // every later export until the page is reloaded.
  assert.match(STUDIO_SRC, /function svFfmpegReset\(\)/, 'svFfmpegReset must exist');
  const loader = (STUDIO_SRC.match(/SVFF\.loading = \(async[\s\S]*?\}\)\(\);/m) || [''])[0];
  assert.match(loader, /catch[\s\S]*svFfmpegReset\(\)/, 'a failed load must call svFfmpegReset()');
});
