const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const statCard = require("../services/statCard");
const coreJs = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
const serverJs = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");

test("server.js viral tiering uses clean professional labels without childish emojis", () => {
  const m = serverJs.match(/function classifyViralTier\(score\)\s*{[\s\S]+?return {[\s\S]+?};?\s*}/);
  assert.ok(m, "classifyViralTier must exist in server.js");
  const classify = new Function("score", m[0] + "\nreturn classifyViralTier(score);");

  assert.equal(classify(90).label, "Trending");
  assert.equal(classify(70).label, "Mid-Tier");
  assert.equal(classify(50).label, "Curated");

  assert.doesNotMatch(classify(90).label, /🔥/);
  assert.doesNotMatch(classify(70).label, /⚡/);
  assert.doesNotMatch(classify(50).label, /📌/);
});

test("core.js and index.html use refined dot indicators and clean tier badges", () => {
  assert.match(coreJs, /stat-dot dot-trending/);
  assert.match(coreJs, /stat-dot dot-mid/);
  assert.match(coreJs, /stat-dot dot-low/);

  assert.match(indexHtml, /\.stat-dot\s*\{/);
  assert.match(indexHtml, /\.dot-trending\s*\{/);
  assert.match(indexHtml, /\.badge-img-ready/);
  assert.match(coreJs, /Photo Ready/);
});

test("core.js restores compact interactive format glyphs and tone emojis", () => {
  assert.match(coreJs, /const fmtIcon = \(c\) =>/);
  assert.match(coreJs, /h-fmt-car/);
  assert.match(coreJs, /h-emoji-glyph/);
  assert.match(coreJs, /const TONE_VIS = \{/);
  assert.match(coreJs, /"😂"/);
  assert.match(coreJs, /"🔥"/);
  assert.match(coreJs, /"🧠"/);

  assert.match(indexHtml, /\.h-fmt-car/);
  assert.match(indexHtml, /\.h-emoji-glyph/);
});

test("core.js replaces phone mockup on scripts with dedicated teleprompter card and Studio action", () => {
  assert.match(coreJs, /cp-script-card/);
  assert.match(coreJs, /script-timing-pill/);
  assert.match(coreJs, /script-reader-body/);
  assert.match(coreJs, /window\.studioShootScript\s*=/);
  assert.match(coreJs, /svOpenWithScript/);

  assert.match(indexHtml, /\.cp-script-card/);
  assert.match(indexHtml, /\.script-timing-pill/);
  assert.match(indexHtml, /\.script-reader-body/);
});

test("services/statCard.js links cover photo to slide 1 and single graphic without carousel artifacts", () => {
  assert.match(statCard.renderStatCard.toString(), /isFirstSlide/);
  assert.match(statCard.renderStatCard.toString(), /isSingle/);
  assert.match(statCard.renderStatCard.toString(), /wantsCover/);
  assert.match(statCard.renderStatCard.toString(), /photoUrl/);

  const hookSvg = statCard.renderStatCard.toString();
  assert.ok(hookSvg.includes("fetchCoverImage"), "renderStatCard must fetch cover image when photo is provided");
});
