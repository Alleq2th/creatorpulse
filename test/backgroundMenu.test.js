// Background menu on the live card: tap an empty part of the card, change the photo
// instantly, and dim it. These checks pin the pieces the browser test relies on.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = fs.readFileSync(path.join(__dirname, '..', 'public', 'core.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'create', 'create.css'), 'utf8');

test('tapping an empty part of the card opens the background menu', () => {
  assert.match(core, /if \(!block\) \{ cpSelectCanvasBlock\(null, null\); cpBgKey = stage\.dataset\.canvasStage; cpRefreshBgMenu\(\); return; \}/);
  assert.match(core, /function cpRefreshBgMenu\(\)/);
  assert.match(core, /class="cc-bg" data-cp-bg="\$\{key\}"/);
  // Selecting a text block closes the menu.
  assert.match(core, /if \(key\) cpBgKey = null;/);
});

test('the menu offers the article photo, earlier uploads, an upload button and dimming', () => {
  assert.match(core, /thumb\(articleSrc, "Article photo"/);
  assert.match(core, /history\.map\(\(h, i\) => thumb\(h\.src/);
  assert.match(core, /Upload image<input type="file" accept="image\/\*"/);
  assert.match(core, /aria-label="Background dimming" oninput="cpSetCardStyle\('\$\{tid\}',\$\{idx\},\$\{slideIndex\},'dim',this\.value\/100\)"/);
  assert.match(core, /window\.cpUseBackgroundAt = \(tid, idx, slideIndex, i\) => \{/);
});

test('a chosen photo shows in the browser at once, with no server render', () => {
  assert.match(core, /if \(sty\.bgImage\) \{\s*\/\/ A chosen photo appears at once/);
  assert.match(core, /plateEl\.style\.backgroundImage = `url\("\$\{sty\.bgImage\}"\)`/);
});

test('uploads are kept for this card and do not replace the text', () => {
  assert.match(core, /slide\._style\.bgHistory = \[\{ src: dataUrl, name \}/);
  assert.match(core, /window\.cpSetCardStyle\(tid, idx, slideIndex, "bgImage", dataUrl\);/);
  // The text layers are not touched by a background change.
  assert.doesNotMatch(core, /cpUseBackgroundAt[\s\S]{0,400}headline/);
});

test('the dimming slider and the photo hint stay in step with the preview', () => {
  assert.match(core, /document\.querySelectorAll\(`\[data-cp-bg="\$\{key\}"\] input\[type=range\]`\)/);
  assert.match(core, /panel\.querySelector\("\.cc-bg-hint"\)/);
});

test('menu styles are in place and hide when closed', () => {
  assert.match(css, /\.cc-bg\[hidden\]\{display:none\}/);
  assert.match(css, /\.cc-bg-thumb\.active\{/);
});
