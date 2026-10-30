const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CORE_JS = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const STAT_CARD_JS = fs.readFileSync(path.join(__dirname, "..", "services", "statCard.js"), "utf8");
const CARDS_ROUTE_JS = fs.readFileSync(path.join(__dirname, "..", "routes", "cards.js"), "utf8");

test("core.js always exposes X (Twitter) in generator platform chips even if onboarding omitted it", () => {
  assert.match(CORE_JS, /const availablePlats = Array\.from\(new Set\(\[\.\.\.\(S\.user\?\.platforms\|\|\[\]\), "instagram", "tiktok", "twitter", "youtube"\]\)\);/);
  assert.match(CORE_JS, /const label = p === "twitter" \? "X \(Twitter\)" : \(P\?\.label\|\|p\);/);
  assert.match(CORE_JS, /const platLabel = plat === "twitter" \? "X \(Twitter\)" : \(PLATS\.find\(x=>x\.id===plat\)\?\.label \|\| plat\);/);
});

test("core.js includes dedicated high-converting Twitter thread and hot-take prompt rules", () => {
  assert.match(CORE_JS, /plat === "twitter" && isThread/);
  assert.match(CORE_JS, /1\/5 \(The Hook\)/);
  assert.match(CORE_JS, /5-tweet thread for a/);
  assert.match(CORE_JS, /plat === "twitter" && \/hot take\/i\.test\(c\)/);
  assert.match(CORE_JS, /plat === "twitter" && \/engagement\/i\.test\(c\)/);
});

test("core.js includes production beats for IG Reel scripts and TikTok scripts", () => {
  assert.match(CORE_JS, /\[HOOK - 0-3s\]/);
  assert.match(CORE_JS, /\[TEXT OVERLAY\]/);
  assert.match(CORE_JS, /\[0-2s HOOK\]/);
  assert.match(CORE_JS, /\[COMMENT BAIT & CTA\]/);
});

test("core.js removes redundant duplicate text below carousel slide images", () => {
  assert.doesNotMatch(CORE_JS, /font-family:var\(--serif\);font-size:14px;font-weight:600;margin-top:6px">\$\{esc\(s\.headline\)\}/);
  assert.match(CORE_JS, /View slide text/);
});

test("services/statCard.js provides improved typography sizing and framing", () => {
  assert.match(STAT_CARD_JS, /hookHeadlineSize: 88/);
  assert.match(STAT_CARD_JS, /bodyTextSize: 36/);
  assert.match(STAT_CARD_JS, /hookHeadlineSize: 94/);
  assert.match(STAT_CARD_JS, /bodyTextSize: 38/);
  assert.match(STAT_CARD_JS, /stroke="\$\{p\.accent\}" stroke-width="1\.5" opacity="0\.14"/);
});

test("routes/cards.js truncates headlines cleanly and builds distinct dilemma comparison and stat slides", () => {
  assert.match(CARDS_ROUTE_JS, /headline = lastSpace > 20 \? trimmed\.slice\(0, lastSpace\) : trimmed;/);
  assert.match(CARDS_ROUTE_JS, /sectionLabel: "THE CONTRAST"/);
  assert.doesNotMatch(CARDS_ROUTE_JS, /reactionTag: "MAJOR DILEMMA"/);
  assert.match(CARDS_ROUTE_JS, /headline: "THE KEY NUMBERS"/);
});

test("index.html provides bottom navigation clearance for output previews", () => {
  assert.match(INDEX_HTML, /\.oa\{display:flex;flex-direction:column;gap:12px;margin-top:12px;padding-bottom:calc\(var\(--tab-h\) \+ 36px \+ env\(safe-area-inset-bottom\)\)\}/);
});
