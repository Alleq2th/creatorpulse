const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CORE_JS = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const STAT_CARD_JS = fs.readFileSync(path.join(__dirname, "..", "services", "statCard.js"), "utf8");

test("core.js renders minimal horizontal swipe rails for generator controls", () => {
  assert.match(CORE_JS, /const hRail = \(label, value, body\) => `<div class="h-step">/);
  assert.match(CORE_JS, /class="h-rail"/);
  assert.match(CORE_JS, /hRail\('Platform', platLabel, platChips\)/);
  assert.match(CORE_JS, /hRail\('Format', ct, ctChips\)/);
  assert.match(CORE_JS, /hRail\('Tone', toneLabel, toneChips\)/);
  assert.match(CORE_JS, /hRail\('Card Color', paletteLabel, paletteChips\)/);
  assert.match(CORE_JS, /hRail\('Visual Theme', themeLabel, themeChips\)/);
  assert.match(CORE_JS, /hRail\('Typography', typoLabel, typoChips\)/);
  assert.match(CORE_JS, /hRail\('Text Density', densityLabel, densityChips\)/);
  assert.match(CORE_JS, /hRail\('Number of Slides', `\$\{slideCount\} slides`, slideCountChips\)/);
});

test("core.js always mounts responsive platform mockup into renderOut", () => {
  assert.match(CORE_JS, /const mockupHTML = renderPlatformMockup\(o, tid, idx, curPlat\);/);
});

test("index.html defines smooth touch-scrolling visual swipe rails with snap alignment", () => {
  assert.match(INDEX_HTML, /\.h-rail\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(INDEX_HTML, /\.h-rail\s*\{[^}]*scroll-snap-type:\s*x proximity/);
  assert.match(INDEX_HTML, /\.h-card\s*\{[^}]*scroll-snap-align:\s*start/);
});

test("services/statCard.js fetchCoverImage uses native AbortSignal and arrayBuffer", () => {
  assert.match(STAT_CARD_JS, /AbortSignal\.timeout\(5000\)/);
  assert.match(STAT_CARD_JS, /await r\.arrayBuffer\(\)/);
  assert.match(STAT_CARD_JS, /Buffer\.from\(arrayBuffer\)/);
});
