const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Plus AI was rebuilt out of the two giant files into its own folder with one
// file per responsibility. These tests assert the SAME capabilities still
// exist — they now read the new locations. Nothing was dropped in the move.
const ROOT = path.join(__dirname, "..");
const P = (...p) => path.join(ROOT, "public", ...p);
const read = (...p) => fs.readFileSync(P(...p), "utf8");

const SERVER_JS = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const INDEX_HTML = read("index.html");

const STATE_JS = read("plus-ai", "state.js");
const API_JS = read("plus-ai", "api.js");
const CARDS_JS = read("plus-ai", "cards.js");
const ACTIONS_JS = read("plus-ai", "actions.js");
const UI_JS = read("plus-ai", "ui.js");
const INDEX_JS = read("plus-ai", "index.js");
const ALL_PLUS_AI = [STATE_JS, API_JS, CARDS_JS, ACTIONS_JS, UI_JS, INDEX_JS].join("\n");

// ── The split itself ───────────────────────────────────────────────────────
test("Plus AI is split into focused files under public/plus-ai/", () => {
  ["state.js", "api.js", "ui.js", "cards.js", "actions.js", "index.js"].forEach((f) => {
    assert.ok(fs.existsSync(P("plus-ai", f)), `public/plus-ai/${f} must exist`);
  });
});

test("no single plus-ai file is a giant one (each under 800 lines)", () => {
  ["state.js", "api.js", "ui.js", "cards.js", "actions.js", "index.js"].forEach((f) => {
    const n = read("plus-ai", f).split("\n").length;
    assert.ok(n < 800, `public/plus-ai/${f} should stay small, got ${n} lines`);
  });
});

test("index.html loads every plus-ai file", () => {
  ["state.js", "api.js", "cards.js", "ui.js", "actions.js", "index.js"].forEach((f) => {
    assert.match(INDEX_HTML, new RegExp(`plus-ai/${f.replace(".", "\\.")}`), `index.html must load plus-ai/${f}`);
  });
});

test("the old inline Plus AI code is gone from core.js and app.js", () => {
  const CORE = read("core.js");
  const APP = read("app.js");
  assert.doesNotMatch(CORE, /window\.openPulseAi\s*=/, "core.js must no longer define window.openPulseAi");
  assert.doesNotMatch(CORE, /window\.sendPulseAiMessage\s*=/, "core.js must no longer define window.sendPulseAiMessage");
  assert.doesNotMatch(APP, /function pulseAiParseContentCards\s*\(/, "app.js must no longer define the old parser");
  assert.doesNotMatch(APP, /function renderFloatingCoach\s*\(/, "app.js must no longer define renderFloatingCoach");
});

// ── Server side (unchanged) ────────────────────────────────────────────────
test("server.js defines /api/pulse-ai endpoint", () => {
  assert.match(SERVER_JS, /\/api\/pulse-ai/, "server.js must expose /api/pulse-ai");
});
test("server.js preserves /api/coach backward compatibility", () => {
  assert.match(SERVER_JS, /\/api\/coach/, "server.js must keep /api/coach for backward compatibility");
});
test("server.js exposes /api/pulse-ai/memory, /live-news, /stat-card and /live-sources", () => {
  assert.match(SERVER_JS, /\/api\/pulse-ai\/memory/);
  assert.match(SERVER_JS, /\/api\/pulse-ai\/live-news/);
  assert.match(SERVER_JS, /\/api\/pulse-ai\/stat-card/);
  assert.match(SERVER_JS, /\/api\/pulse-ai\/live-sources/);
});

// ── Every capability still present, in its new home ────────────────────────
test("index.js exports the Plus AI workspace entry points", () => {
  ["openPulseAi", "closePulseAi", "sendPulseAiMessage", "pulseAiShootScript"]
    .forEach((fn) => assert.match(INDEX_JS, new RegExp(`window\\.${fn}\\s*=`), `index.js must export window.${fn}`));
  assert.match(INDEX_JS, /window\.renderFloatingCoach\s*=/, "index.js must export renderFloatingCoach");
});

test("index.js exports the memory management entry points", () => {
  ["loadPulseAiMemory", "togglePulseAiMemory", "addPulseAiCustomRule", "resetPulseAiMemory"]
    .forEach((fn) => assert.match(INDEX_JS, new RegExp(`window\\.${fn}\\s*=`), `index.js must export window.${fn}`));
});

test("index.js exports the multi-thread conversation entry points", () => {
  ["loadPulseAiThreads", "switchPulseAiThread", "newPulseAiThread", "deletePulseAiThread", "togglePulseAiThreads", "saveContentCard"]
    .forEach((fn) => assert.match(INDEX_JS, new RegExp(`window\\.${fn}\\s*=`), `index.js must export window.${fn}`));
});

test("index.js exports the stat-card entry points", () => {
  ["generatePulseStatCard", "switchStatCardFormat", "downloadPulseSlide", "downloadPulseAllSlides", "savePulseStatCardToLibrary"]
    .forEach((fn) => assert.match(INDEX_JS, new RegExp(`window\\.${fn}\\s*=`), `index.js must export window.${fn}`));
});

test("cards.js defines content-card parsing, stat-card rendering and follow-ups", () => {
  assert.match(CARDS_JS, /cards\.parseContentCards\s*=/, "cards.js must define parseContentCards");
  assert.match(CARDS_JS, /cards\.renderStatCard\s*=/, "cards.js must define renderStatCard");
  assert.match(CARDS_JS, /cards\.parseTablesToCards\s*=/, "cards.js must define parseTablesToCards");
  assert.match(CARDS_JS, /cards\.getFollowupChips\s*=/, "cards.js must define getFollowupChips");
});

test("ui.js renders the sheet, the memory drawer and the threads drawer", () => {
  assert.match(UI_JS, /ui\.floatingCoach\s*=/, "ui.js must define floatingCoach");
  assert.match(UI_JS, /ui\.memoryDrawer\s*=/, "ui.js must define memoryDrawer");
  assert.match(UI_JS, /ui\.threadsDrawer\s*=/, "ui.js must define threadsDrawer");
});

test("actions.js owns save-to-calendar, shoot-in-studio and photo attach", () => {
  assert.match(ACTIONS_JS, /actions\.saveContentCard\s*=/);
  assert.match(ACTIONS_JS, /actions\.saveScript\s*=/);
  assert.match(ACTIONS_JS, /actions\.shootScript\s*=/);
  assert.match(ACTIONS_JS, /actions\.attachPhoto\s*=/);
});

test("Shoot in Studio still wires into svOpenWithScript", () => {
  assert.match(ALL_PLUS_AI, /svOpenWithScript/, "shootScript must wire to svOpenWithScript");
});

// ── THE BUG: the stat-card button must hit the stat-card engine ────────────
test("api.js calls the real stat-card endpoint, not the chat endpoint", () => {
  assert.match(API_JS, /api\.statCard\s*=/, "api.js must define api.statCard");
  assert.match(API_JS, /"\/api\/pulse-ai\/stat-card"/, "statCard must POST to /api/pulse-ai/stat-card");
  assert.match(API_JS, /api\.chat\s*=/, "api.js must still define api.chat");
  assert.match(API_JS, /"\/api\/pulse-ai"/, "chat must POST to /api/pulse-ai");
});

test("a stat_card action routes to the stat-card engine, not the chat engine", () => {
  assert.match(INDEX_JS, /isStatCard/, "sendPulseAiMessage must detect a stat_card action");
  assert.match(INDEX_JS, /PA\.actions\.runStatCard\(/, "a stat_card action must call runStatCard");
});

test("the stat-card mode card calls the stat-card generator", () => {
  assert.match(UI_JS, /generatePulseStatCard\(/, "the Stat Cards mode card must call generatePulseStatCard");
});

// ── Photo upload actually reads the image ──────────────────────────────────
test("attachPhoto reads the file and downscales it on a canvas", () => {
  assert.match(ACTIONS_JS, /FileReader/, "attachPhoto must read the file");
  assert.match(ACTIONS_JS, /readAsDataURL/, "attachPhoto must read the image data, not just the name");
  assert.match(ACTIONS_JS, /createElement\("canvas"\)/, "attachPhoto must downscale via canvas");
});

// ── Styles ─────────────────────────────────────────────────────────────────
test("index.html defines styles for interactive cards, memory drawer, and follow-ups", () => {
  assert.match(INDEX_HTML, /\.pa-card\s*\{/);
  assert.match(INDEX_HTML, /\.pa-mem-drawer\s*\{/);
  assert.match(INDEX_HTML, /\.pa-followups\s*\{/);
});
test("index.html defines styles for Static Content Cards and Threads drawer", () => {
  assert.match(INDEX_HTML, /\.pa-content-card\s*\{/);
  assert.match(INDEX_HTML, /\.pa-threads-drawer\s*\{/);
  assert.match(INDEX_HTML, /\.pa-cc-hook-box\s*\{/);
});
test("index.html defines styles for .pa-statcard-box and carousel track", () => {
  assert.match(INDEX_HTML, /\.pa-statcard-box\s*\{/);
  assert.match(INDEX_HTML, /\.pa-sc-slides-track\s*\{/);
});

// ── Service side of the stat-card engine (unchanged) ───────────────────────
test("liveIntelligence.js exports catalog and retrieval methods", () => {
  const intel = require("../services/liveIntelligence");
  assert.ok(Array.isArray(intel.LIVE_SOURCES_CATALOG));
  assert.ok(intel.LIVE_SOURCES_CATALOG.length >= 60);
  assert.equal(typeof intel.fetchWikipediaKnowledge, "function");
  assert.equal(typeof intel.findLiveImage, "function");
  assert.equal(typeof intel.fetchMultiSourceLiveData, "function");
});

test("routes/cards.js defines /pulse-ai-stat-card route", () => {
  const CARDS = fs.readFileSync(path.join(ROOT, "routes", "cards.js"), "utf8");
  assert.match(CARDS, /\/pulse-ai-stat-card/);
});

test("routes/cards.js exports buildDefaultPulseSlides as a function", () => {
  const cards = require("../routes/cards");
  assert.equal(typeof cards.buildDefaultPulseSlides, "function");
  const slides = cards.buildDefaultPulseSlides("United States Marines", "instagram", null, null);
  assert.ok(Array.isArray(slides) && slides.length > 0);
  assert.equal(slides[0].type, "hook");
});

test("server.js never calls the undefined buildDefaultStatCardSlides", () => {
  assert.doesNotMatch(SERVER_JS, /buildDefaultStatCardSlides\s*\(/);
  assert.match(SERVER_JS, /buildDefaultPulseSlides\s*\(/);
});
