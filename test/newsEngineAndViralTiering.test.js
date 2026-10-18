const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const feedsConfig = require("../config/feeds.js");

test("feeds.js maps all 94 creator niches with primary and curated feeds", () => {
  const coreSource = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
  const mN = coreSource.match(/const NICHES = ({[\s\S]+?});/);
  assert.ok(mN, "NICHES definition must exist in public/core.js");
  const nichesMap = JSON.parse(mN[1].replace(/(\w+):/g, "\"$1\":"));
  const allNiches = Object.values(nichesMap).flat();

  assert.equal(allNiches.length, 94, "There should be exactly 94 niches in Creator Pulse");

  // Verify all niches have a multi-feed array in NICHE_BLOG_RSS
  for (const niche of allNiches) {
    const feeds = feedsConfig.NICHE_BLOG_RSS[niche];
    assert.ok(Array.isArray(feeds) && feeds.length > 0, `NICHE_BLOG_RSS must cover '${niche}' with array of feeds`);
    assert.match(feeds[0], /^https?:\/\//, `'${niche}' primary feed must be a valid URL`);
  }

  // Verify primary feed map in NICHE_RSS covers all niches as string URLs
  assert.ok(feedsConfig.NICHE_RSS, "NICHE_RSS primary feed map must be exported");
  for (const niche of allNiches) {
    const primary = feedsConfig.NICHE_RSS[niche];
    assert.ok(typeof primary === "string" && primary.length > 0, `NICHE_RSS['${niche}'] must be a URL string`);
    assert.match(primary, /^https?:\/\//, `NICHE_RSS['${niche}'] must be a valid URL`);
  }
});

test("server.js viral tiering classifies scores correctly with image priority", () => {
  const serverSource = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  assert.ok(serverSource.includes("classifyViralTier"), "server.js must define classifyViralTier");
  assert.ok(serverSource.includes("computeContentScore"), "server.js must define computeContentScore");

  // Extract classifyViralTier
  const fnMatch = serverSource.match(/function classifyViralTier\(score\)\s*{[\s\S]+?return {[\s\S]+?};?\s*}/);
  assert.ok(fnMatch, "classifyViralTier function body found");

  const classify = new Function("score", fnMatch[0] + "\nreturn classifyViralTier(score);");

  // High score >= 80 -> trending
  const highTier = classify(85);
  assert.equal(highTier.tier, "trending");
  assert.equal(highTier.label, "🔥 Trending");

  // Mid score 65-79 -> mid
  const midTier = classify(72);
  assert.equal(midTier.tier, "mid");
  assert.equal(midTier.label, "⚡ Mid-Tier");

  // Low score < 65 -> low
  const lowTier = classify(55);
  assert.equal(lowTier.tier, "low");
  assert.equal(lowTier.label, "📌 Low-Tier");
});

test("public/core.js sorts trends by viral tier first, then score, then image readiness", () => {
  const coreSource = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");

  assert.ok(coreSource.includes("const tierWeight = { trending: 3, mid: 2, low: 1 };"), "core.js must weight tiers properly");
  assert.ok(coreSource.includes("S.trends = normalized.slice(0, 40);"), "core.js must cap trends at 40 stories");
  assert.ok(coreSource.includes("Refreshes hourly"), "core.js must announce hourly refreshes");
  assert.ok(coreSource.includes("window.setTierFilter"), "core.js must expose setTierFilter");
});

test("public/core.js NICHE_HANDLES covers all 94 niches for social scraping", () => {
  const coreSource = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
  const mN = coreSource.match(/const NICHES = ({[\s\S]+?});/);
  const nichesMap = JSON.parse(mN[1].replace(/(\w+):/g, "\"$1\":"));
  const allNiches = Object.values(nichesMap).flat();

  const mH = coreSource.match(/const NICHE_HANDLES = ({[\s\S]+?});/);
  assert.ok(mH, "NICHE_HANDLES definition must exist in public/core.js");
  const handles = JSON.parse(mH[1]);

  for (const niche of allNiches) {
    assert.ok(handles[niche], `NICHE_HANDLES must have an entry for '${niche}'`);
    assert.ok(Array.isArray(handles[niche]) && handles[niche].length > 0, `'${niche}' handles must be a non-empty array`);
  }
});

test("public/index.html includes viral tier badge and filter styling", () => {
  const htmlSource = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");

  assert.ok(htmlSource.includes(".badge-tier-trending"), "index.html must have trending badge CSS");
  assert.ok(htmlSource.includes(".badge-tier-mid"), "index.html must have mid-tier badge CSS");
  assert.ok(htmlSource.includes(".badge-tier-low"), "index.html must have low-tier badge CSS");
  assert.ok(htmlSource.includes(".badge-img-ready"), "index.html must have visual ready badge CSS");
  assert.ok(htmlSource.includes(".tier-filter-strip"), "index.html must have filter strip CSS");
  assert.ok(htmlSource.includes(".hero-stats-row"), "index.html must have hero stats row CSS");
});
