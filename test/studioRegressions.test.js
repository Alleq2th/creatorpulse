// Guards for the three regressions that made the Studio look broken on a real
// phone. All three were invisible to `node --check` and to the existing suite,
// because none of them is a syntax error or a pure-logic bug:
//
//   1. THE BLACK CAMERA. `renderApp()` rebuilds the whole page with innerHTML,
//      which destroys the camera <video> and drops its srcObject. studio.js
//      exposes `window.svAfterRender()` to re-attach the stream, but core.js
//      never called it. The timer re-renders every 200ms, so the preview went
//      black the instant recording started. This is the single most visible
//      bug the owner reported.
//   2. THE MISSING RAIL ICON. The frame-rate rail button rendered a bare label
//      with no icon, unlike the four buttons above it.
//   3. THE DEAD BLACK GAP. The empty "takes" strip was a tall block of black
//      between the camera and the controls.
//
// Each assertion is anchored on the real source, and each was negative-tested
// by reverting the fix in a scratch copy and confirming the test fails.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CORE = fs.readFileSync(path.join(ROOT, 'public', 'core.js'), 'utf8');
const STUDIO = fs.readFileSync(path.join(ROOT, 'public', 'studio.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'public', 'studio.css'), 'utf8');

test('core.js calls the Studio post-render hook (the black-camera fix)', () => {
  // Without this call the camera <video> is recreated on every render with no
  // stream attached, and the preview is black while recording.
  assert.ok(/window\.svAfterRender\s*\(/.test(CORE),
    'csAfterRender must call window.svAfterRender() or the camera preview goes black on re-render');
  // And the hook must actually exist on the other side.
  assert.ok(/window\.svAfterRender\s*=/.test(STUDIO),
    'studio.js must define window.svAfterRender');
});

test('the post-render hook re-attaches the live stream', () => {
  const hook = STUDIO.slice(STUDIO.indexOf('window.svAfterRender'));
  const body = hook.slice(0, hook.indexOf('/* ── SHARED CHROME'));
  assert.ok(/svAttachLive\s*\(/.test(body),
    'svAfterRender must call svAttachLive() so the camera stream survives a re-render');
});

test('every camera rail button renders an icon', () => {
  // The frame-rate button shipped as a bare label. Every rail button must carry
  // an svIcon() call so the column is visually consistent.
  const rail = STUDIO.slice(STUDIO.indexOf('<div class="sv-rail">'));
  const railBlock = rail.slice(0, rail.indexOf('</div>', rail.indexOf('data-act="fps"')));
  const buttons = railBlock.match(/<button class="sv-rail-btn[^>]*>[\s\S]*?<\/button>/g) || [];
  assert.ok(buttons.length >= 5, 'expected at least 5 rail buttons, found ' + buttons.length);
  for (const b of buttons){
    assert.ok(/svIcon\(/.test(b),
      'a rail button is missing its icon: ' + b.slice(0, 90));
  }
});

test('the empty takes strip is compact, not a block of dead black', () => {
  const m = CSS.match(/\.sv-strip-empty\{([^}]*)\}/);
  assert.ok(m, '.sv-strip-empty must be styled');
  const pad = m[1].match(/padding:\s*(\d+)px/);
  assert.ok(pad, '.sv-strip-empty must declare a padding');
  assert.ok(Number(pad[1]) <= 4,
    'the empty strip padding must stay small (<=4px) or it becomes a black gap: ' + pad[1] + 'px');
});

test('the editor preview is capped so the timeline stays reachable', () => {
  const m = CSS.match(/\.sv-ed-stage\{([^}]*)\}/);
  assert.ok(m, '.sv-ed-stage must be styled');
  assert.ok(/max-height:\s*\d+vh/.test(m[1]),
    '.sv-ed-stage must cap its height, or it eats half the phone screen in black');
});

test('toolbar labels cannot collide', () => {
  const m = CSS.match(/\.sv-tb\{([^}]*)\}/);
  assert.ok(m, '.sv-tb must be styled');
  assert.ok(/white-space:\s*nowrap/.test(m[1]),
    '.sv-tb labels must be nowrap so "Duplicate" cannot run into "Replace"');
});
