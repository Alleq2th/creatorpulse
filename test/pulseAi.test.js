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
