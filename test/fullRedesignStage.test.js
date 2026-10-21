const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CORE = fs.readFileSync(path.join(ROOT, 'public', 'core.js'), 'utf8');
const STUDIO = fs.readFileSync(path.join(ROOT, 'public', 'studio.js'), 'utf8');
const STUDIO_CSS = fs.readFileSync(path.join(ROOT, 'public', 'studio.css'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');

test('Create front door offers story, recording and upload paths without replacing Studio actions', () => {
  assert.match(STUDIO, /Start with a story/);
  assert.match(STUDIO, /onclick="setTab\('home'\)"/);
  assert.match(STUDIO, /data-act="newProject"/);
  assert.match(STUDIO, /data-act="upload2"/);
  assert.match(STUDIO, /data-act="toEditor"/);
  assert.match(STUDIO, /id="sv-upload" accept="video\/\*"/);
  assert.match(STUDIO, /news:\s*'/);
  assert.match(STUDIO, /create:\s*'/);
});

test('Create front door is a normal page surface; recorder/editor remain full-screen', () => {
  assert.match(STUDIO_CSS, /\.sv-create-home\{[^}]*position:relative!important/);
  assert.match(STUDIO_CSS, /\.sv-create-home\{[^}]*overflow:visible!important/);
  assert.match(STUDIO_CSS, /\.sv-root\{[\s\S]*?position: fixed; inset: 0/);
});

test('Hooks keep Copy, Use and Blueprint actions and give niche/search states accessible labels', () => {
  assert.match(CORE, /class="hook-card-kicker"/);
  assert.match(CORE, /aria-label="Search hooks"/);
  assert.match(CORE, /aria-pressed="\$\{active===n\?'true':'false'\}"/);
  assert.match(CORE, /copyTxt\(/);
  assert.match(CORE, /prefillHook\(/);
  assert.match(CORE, /openBlueprint\(/);
});

test('bottom navigation reserves safe-area space and marks the selected page', () => {
  assert.match(INDEX, /height:calc\(var\(--tab-h\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(INDEX, /padding-bottom:calc\(var\(--tab-h\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(CORE, /aria-current="\$\{S\.tab==='create'\?'page':'false'\}"/);
});
