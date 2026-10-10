const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SERVER_JS = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
const CORE_JS = fs.readFileSync(path.join(ROOT, "public", "core.js"), "utf8");
const APP_JS = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8");

test("server.js defines /api/pulse-ai endpoint", () => {
  assert.match(SERVER_JS, /\/api\/pulse-ai/, "server.js must expose /api/pulse-ai");
});

test("server.js preserves /api/coach backward compatibility", () => {
  assert.match(SERVER_JS, /\/api\/coach/, "server.js must keep /api/coach for backward compatibility");
});

test("core.js defines Pulse AI workspace functions", () => {
  assert.match(CORE_JS, /window\.openPulseAi\s*=/, "core.js must export window.openPulseAi");
  assert.match(CORE_JS, /window\.closePulseAi\s*=/, "core.js must export window.closePulseAi");
  assert.match(CORE_JS, /window\.sendPulseAiMessage\s*=/, "core.js must export window.sendPulseAiMessage");
  assert.match(CORE_JS, /window\.pulseAiShootScript\s*=/, "core.js must export window.pulseAiShootScript");
});

test("Pulse AI Shoot in Studio wires directly into svOpenWithScript", () => {
  assert.match(CORE_JS, /svOpenWithScript/, "pulseAiShootScript must wire directly to svOpenWithScript");
});

test("index.html preserves .fab-coach z-index and media query for test safety", () => {
  assert.match(INDEX_HTML, /\.fab-coach\s*\{[^}]*z-index:\s*80/);
  assert.match(INDEX_HTML, /@media\(min-width:900px\)\{\.fab-coach\{display:none\}\}/);
});

test("floating elements maintain correct z-index hierarchy below sheet overlay", () => {
  const sheetMatch = INDEX_HTML.match(/\.sheet-overlay\s*\{[^}]*z-index:\s*(\d+)/);
  assert.ok(sheetMatch, "sheet-overlay must have z-index");
  const sheetZ = Number(sheetMatch[1]);
  assert.equal(sheetZ, 200, "sheet overlay z-index must be 200");

  const coachMatch = INDEX_HTML.match(/\.fab-coach\s*\{[^}]*z-index:\s*(\d+)/);
  assert.ok(coachMatch, "fab-coach must declare z-index");
  assert.ok(Number(coachMatch[1]) < sheetZ, "fab-coach must sit below sheet-overlay");
});

test("server.js exposes /api/pulse-ai/memory and /api/pulse-ai/live-news endpoints", () => {
  assert.match(SERVER_JS, /\/api\/pulse-ai\/memory/, "server.js must expose /api/pulse-ai/memory");
  assert.match(SERVER_JS, /\/api\/pulse-ai\/live-news/, "server.js must expose /api/pulse-ai/live-news");
});

test("core.js defines Pulse AI memory management functions", () => {
  assert.match(CORE_JS, /window\.loadPulseAiMemory\s*=/, "core.js must export window.loadPulseAiMemory");
  assert.match(CORE_JS, /window\.togglePulseAiMemory\s*=/, "core.js must export window.togglePulseAiMemory");
  assert.match(CORE_JS, /window\.addPulseAiCustomRule\s*=/, "core.js must export window.addPulseAiCustomRule");
  assert.match(CORE_JS, /window\.resetPulseAiMemory\s*=/, "core.js must export window.resetPulseAiMemory");
});

test("app.js defines table-to-card parsing and interactive follow-ups", () => {
  assert.match(APP_JS, /pulseAiParseTablesToCards/, "app.js must define pulseAiParseTablesToCards");
  assert.match(APP_JS, /pulseAiGetFollowupChips/, "app.js must define pulseAiGetFollowupChips");
  assert.match(APP_JS, /renderPulseAiMemoryDrawer/, "app.js must define renderPulseAiMemoryDrawer");
});

test("index.html defines styles for interactive cards, memory drawer, and follow-ups", () => {
  assert.match(INDEX_HTML, /\.pa-card\s*\{/, "index.html must style .pa-card");
  assert.match(INDEX_HTML, /\.pa-mem-drawer\s*\{/, "index.html must style .pa-mem-drawer");
  assert.match(INDEX_HTML, /\.pa-followups\s*\{/, "index.html must style .pa-followups");
});

test("core.js defines multi-thread conversation management functions", () => {
  assert.match(CORE_JS, /window\.loadPulseAiThreads\s*=/, "core.js must export window.loadPulseAiThreads");
  assert.match(CORE_JS, /window\.switchPulseAiThread\s*=/, "core.js must export window.switchPulseAiThread");
  assert.match(CORE_JS, /window\.newPulseAiThread\s*=/, "core.js must export window.newPulseAiThread");
  assert.match(CORE_JS, /window\.deletePulseAiThread\s*=/, "core.js must export window.deletePulseAiThread");
  assert.match(CORE_JS, /window\.togglePulseAiThreads\s*=/, "core.js must export window.togglePulseAiThreads");
  assert.match(CORE_JS, /window\.saveContentCard\s*=/, "core.js must export window.saveContentCard");
});

test("app.js defines Static Content Card parsing and multi-thread drawer", () => {
  assert.match(APP_JS, /pulseAiParseContentCards/, "app.js must define pulseAiParseContentCards");
  assert.match(APP_JS, /renderPulseAiThreadsDrawer/, "app.js must define renderPulseAiThreadsDrawer");
});

test("index.html defines styles for Static Content Cards and Threads drawer", () => {
  assert.match(INDEX_HTML, /\.pa-content-card\s*\{/, "index.html must style .pa-content-card");
  assert.match(INDEX_HTML, /\.pa-threads-drawer\s*\{/, "index.html must style .pa-threads-drawer");
  assert.match(INDEX_HTML, /\.pa-cc-hook-box\s*\{/, "index.html must style .pa-cc-hook-box");
});

test("server.js defines /api/pulse-ai/stat-card and /api/pulse-ai/live-sources", () => {
  assert.match(SERVER_JS, /\/api\/pulse-ai\/stat-card/, "server.js must expose /api/pulse-ai/stat-card");
  assert.match(SERVER_JS, /\/api\/pulse-ai\/live-sources/, "server.js must expose /api/pulse-ai/live-sources");
});

test("core.js defines stat card generation and format switching helpers", () => {
  assert.match(CORE_JS, /window\.generatePulseStatCard\s*=/, "core.js must export window.generatePulseStatCard");
  assert.match(CORE_JS, /window\.switchStatCardFormat\s*=/, "core.js must export window.switchStatCardFormat");
  assert.match(CORE_JS, /window\.downloadPulseSlide\s*=/, "core.js must export window.downloadPulseSlide");
  assert.match(CORE_JS, /window\.downloadPulseAllSlides\s*=/, "core.js must export window.downloadPulseAllSlides");
  assert.match(CORE_JS, /window\.savePulseStatCardToLibrary\s*=/, "core.js must export window.savePulseStatCardToLibrary");
});

test("app.js defines pulseAiRenderStatCard for interactive visual carousels", () => {
  assert.match(APP_JS, /function pulseAiRenderStatCard\s*\(/, "app.js must define pulseAiRenderStatCard");
});

test("index.html defines styles for .pa-statcard-box and carousel track", () => {
  assert.match(INDEX_HTML, /\.pa-statcard-box\s*\{/, "index.html must style .pa-statcard-box");
  assert.match(INDEX_HTML, /\.pa-sc-slides-track\s*\{/, "index.html must style .pa-sc-slides-track");
});

test("liveIntelligence.js exports catalog and retrieval methods", () => {
  const intel = require("../services/liveIntelligence");
  assert.ok(Array.isArray(intel.LIVE_SOURCES_CATALOG), "LIVE_SOURCES_CATALOG must be an array");
  assert.ok(intel.LIVE_SOURCES_CATALOG.length >= 60, "Catalog must have at least 60 authoritative sources");
  assert.equal(typeof intel.fetchWikipediaKnowledge, "function");
  assert.equal(typeof intel.findLiveImage, "function");
  assert.equal(typeof intel.fetchMultiSourceLiveData, "function");
});

test("routes/cards.js defines /pulse-ai-stat-card route", () => {
  const CARDS_JS = fs.readFileSync(path.join(ROOT, "routes", "cards.js"), "utf8");
  assert.match(CARDS_JS, /\/pulse-ai-stat-card/, "routes/cards.js must expose /pulse-ai-stat-card");
});
