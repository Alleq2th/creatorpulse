// Preview plate recovery: server-render failures should keep the editor usable,
// show a branded local surface, and expose an explicit retry action.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = fs.readFileSync(path.join(__dirname, '..', 'public/core.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'public/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'public/sw.js'), 'utf8');
function fnBody(name) {
  const start = core.search(new RegExp(`(^|\\n)(async )?function ${name}\\(`));
  assert.ok(start >= 0, `${name} exists`);
  const rest = core.slice(start);
  const end = rest.search(/\n}\s*;?\n/);
  return rest.slice(0, end >= 0 ? end + 3 : 3000);
}

test('a plate renderer failure produces a local branded SVG fallback', () => {
  const body = fnBody('cpEnsurePlate');
  assert.match(body, /\.catch\(useFallbackPlate\)/);
  assert.match(body, /localPlateImage\(slide/);
  assert.match(fnBody('localPlateImage'), /linearGradient/);
  assert.doesNotMatch(body, /entry\.src\s*=\s*["']black/);
});

test('failed or malformed renderer images do not get treated as successful previews', () => {
  const body = fnBody('cpEnsurePlate');
  assert.match(body, /Card renderer returned no valid preview image/);
  assert.match(body, /data:image\\\//);
});

test('a failed preview has an accessible explicit retry control and retry bypasses failed cache entries', () => {
  const paint = fnBody('cpPaintPlate');
  assert.match(paint, /retry\.type = "button"/);
  assert.match(paint, /retry\.textContent = "Retry"/);
  assert.match(paint, /window\.cpRetryPlate/);
  assert.match(fnBody('cpEnsurePlate'), /entry && !forceRetry && \(entry\.src \|\| entry\.pending\)/);
  assert.match(core, /window\.cpRetryPlate = function/);
});

test('preview changes refresh the cached core and service worker assets', () => {
  assert.match(html, /core\.js\?v=56/);
  assert.match(sw, /creatorpulse-v35/);
});
