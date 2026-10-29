const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CORE_JS = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const STAT_CARD_JS = fs.readFileSync(path.join(__dirname, "..", "services", "statCard.js"), "utf8");

test("news detail keeps Create setup out of the story panel", () => {
  const start = CORE_JS.indexOf('panel = `<div class="cp cp-news-detail">');
  const end = CORE_JS.indexOf('`;', start);
  assert.ok(start >= 0);
  const panel = CORE_JS.slice(start, end);
  assert.match(panel, /Why this matters/);
  assert.match(panel, /Create content/);
  assert.doesNotMatch(panel, /hRail/);
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
