// Guards for the two things that silently broke the Studio's export.
//
// Both failures were invisible to every other kind of test:
//
//   1. The app's own Content Security Policy forbade WebAssembly. ffmpeg.wasm
//      cannot compile its core without it, so export could NEVER work in
//      production — while every unit test passed, because none of them touch a
//      browser. The only symptom was "export does nothing".
//   2. The engine loader wrapped the core in blob: URLs. That needs script-src
//      to allow blob scripts, which is exactly what a CSP is there to prevent.
//
// Neither shows up in `node --check` or in a normal unit suite. These tests pin
// the header and the loader shape so a future edit cannot quietly undo them.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const AUTH_SRC = fs.readFileSync(path.join(ROOT, 'middleware', 'auth.js'), 'utf8');
const STUDIO_SRC = fs.readFileSync(path.join(ROOT, 'public', 'studio.js'), 'utf8');
const VENDOR = path.join(ROOT, 'public', 'vendor', 'ffmpeg');

// The exact directive value from the CSP block, so the assertions below read
// against the header that actually ships rather than a re-typed copy.
function directive(name){
  const re = new RegExp('"' + name + '"\\s*:\\s*\\[([^\\]]*)\\]');
  const m = AUTH_SRC.match(re);
  return m ? m[1] : null;
}

test('script-src permits WebAssembly, without which the video engine cannot boot', () => {
  const scriptSrc = directive('script-src');
  assert.ok(scriptSrc, 'script-src must be declared in the CSP');
  // Without this, Chrome aborts with:
  //   Aborted(CompileError: WebAssembly.instantiate(): Compiling or
  //   instantiating WebAssembly module violates the Content Security policy
  // and every export fails. 'wasm-unsafe-eval' grants wasm compilation ONLY —
  // it does not open up eval() — so it is the narrow choice over 'unsafe-eval'.
  assert.ok(/'wasm-unsafe-eval'/.test(scriptSrc),
    "script-src must include 'wasm-unsafe-eval' or the ffmpeg core cannot compile: " + scriptSrc);
  assert.ok(!/'unsafe-eval'/.test(scriptSrc),
    "'wasm-unsafe-eval' is sufficient; do not widen to the broader 'unsafe-eval'");
});

test('script-src does not allow blob scripts', () => {
  const scriptSrc = directive('script-src');
  assert.ok(!/blob:/.test(scriptSrc),
    'blob: must never be allowed in script-src — the engine runs from same-origin paths instead');
});

test('a worker-src is declared so the encoder worker can be created', () => {
  assert.ok(directive('worker-src'), 'worker-src must be declared');
  assert.ok(/blob:/.test(directive('worker-src')),
    'ffmpeg.wasm builds its worker from a blob: URL, so worker-src must allow blob:');
});

test('the engine is loaded from same-origin URLs, not blob: wrappers', () => {
  // toBlobURL() turns the engine into blob: URLs. That works only if blob
  // scripts are allowed, which they are not and should not be. The vendored
  // files are already same-origin, so plain paths are both correct and tighter.
  const loadBlock = STUDIO_SRC.slice(STUDIO_SRC.indexOf('async function svFfmpeg()'));
  const upToLoad = loadBlock.slice(0, loadBlock.indexOf('SVFF.inst = inst'));
  assert.ok(!/toBlobURL/.test(upToLoad),
    'svFfmpeg must not wrap the core in blob: URLs — use the same-origin /vendor paths');
  assert.ok(/coreURL:\s*SVFF\.core/.test(upToLoad),
    'svFfmpeg must load the core from SVFF.core (same-origin /vendor/ffmpeg)');
  assert.ok(/wasmURL:\s*SVFF\.core/.test(upToLoad),
    'svFfmpeg must load the wasm from SVFF.core (same-origin /vendor/ffmpeg)');
});

test('every vendored engine file is present and not truncated', () => {
  // A missing or half-written file here is a dead export, and the failure is
  // remote and confusing. Sizes are checked so a truncated download is caught
  // rather than surfacing as an obscure loader error.
  const want = {
    'ffmpeg.js': 2000,          // UMD loader
    'util.js': 1000,            // helpers
    '814.ffmpeg.js': 1000,      // the worker chunk the loader fetches by name
    'ffmpeg-core.js': 50000,    // emscripten core (glue JS)
    'ffmpeg-core.wasm': 5000000, // the actual codec — tens of MB
  };
  for (const [name, min] of Object.entries(want)){
    const p = path.join(VENDOR, name);
    assert.ok(fs.existsSync(p), 'missing vendored engine file: ' + name);
    const size = fs.statSync(p).size;
    assert.ok(size >= min,
      name + ' looks truncated (' + size + ' bytes, expected at least ' + min + ')');
  }
});

test('the wasm is served with the type the browser demands', () => {
  // WebAssembly.instantiateStreaming refuses anything but application/wasm, and
  // `nosniff` is on, so a wrong content-type is fatal. Express's static handler
  // needs the mime type registered for it.
  const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  const hasMime = /application\/wasm/.test(serverSrc) ||
    fs.existsSync(path.join(ROOT, 'node_modules', 'mime-types'));
  assert.ok(hasMime, 'server must resolve application/wasm for .wasm files');
});
