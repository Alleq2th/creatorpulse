const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, "public", ...p), "utf8");

const INDEX_HTML = read("index.html");
const SW_JS = read("sw.js");
const PLUS_FILES = ["state.js", "api.js", "cards.js", "actions.js", "ui.js", "index.js"];
const PLUS_SRC = PLUS_FILES.map((f) => read("plus-ai", f)).join("\n");

// ── The freeze ─────────────────────────────────────────────────────────────
// Tapping Plus AI used to hang, and then every later tap did nothing until a
// reload. TWO defects stacked up; both are pinned below, in the rebuilt code.
//
// DEFECT 1 (the crash). The content-card parser built a regular expression
// from a TEMPLATE LITERAL whose backslashes were single (`\s`, `\*`). In a
// template literal `\s` is just "s" and `\*` is just "*", so the pattern
// handed to RegExp() contained a bare "**" -> "Nothing to repeat" -> throw.
//
// DEFECT 2 (the "whole app dies"). render() is a full-page rebuild: one
// innerHTML assignment for the whole app. When an exception escaped mid-build
// that assignment never ran, so the screen kept its old markup AND every later
// tap re-threw. Hence "nothing works until I reload".

// Load one plus-ai file in a browser-ish sandbox and return window.CPPlusAI.
function loadPlus(file, extra = {}) {
  const sandbox = {
    console, JSON, Date, Math, RegExp, String, Object, Array, Number, Boolean,
    setTimeout, clearTimeout,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    ...extra,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("plus-ai", file), sandbox);
  return sandbox.window.CPPlusAI;
}

// A real payload the server actually returns for a stat-card request:
// "CARD 01 — THE DILEMMA\nTitle: ...\nHook: ...".
const CARD_PAYLOAD =
  "CARD 01 \u2014 THE DILEMMA\n" +
  "Title: Boots vs. Beach\n" +
  'Hook: "seed hook"\n' +
  "Creative angle: grit against sunshine\n" +
  "Why this angle works: controversy\n" +
  "Call to action: Which one?\n" +
  "\nCARD 02 \u2014 THE UNPOPULAR OPINION\n" +
  "Title: Second Card\n" +
  'Hook: "second hook"\n' +
  "Creative angle: counter-intuitive\n";

test("parseContentCards parses a real CARD payload without throwing", () => {
  const PA = loadPlus("cards.js");
  const out = PA.cards.parseContentCards(CARD_PAYLOAD);
  assert.ok(out, "a payload containing CARD 01 must produce cards");
  assert.equal((out.cardsHtml.match(/pa-content-card/g) || []).length, 2, "both cards must render");
  assert.match(out.cardsHtml, /Boots vs\. Beach/, "the Title field must be pulled out of the card body");
});

test("parseContentCards never throws on hostile input (defect 1)", () => {
  const PA = loadPlus("cards.js");
  const nasty = [
    "CARD 01 \u2014 **broken** Title: \n\nCARD 02",
    "CARD 01 Title:\nHook: [unclosed\nCARD 02",
    "CARD 01 \u2014 x\n" + "\\".repeat(500),
    "CARD 1\nTitle: ok\n" + "CARD 2\n".repeat(200),
  ];
  nasty.forEach((n, i) => {
    assert.doesNotThrow(() => PA.cards.parseContentCards(n), `payload ${i} must not throw`);
  });
});

test("no plus-ai file builds a RegExp from a plain template literal (defect 1 guard)", () => {
  // `new RegExp(`...\s...`)` loses its escapes. String.raw is the safe form.
  const offenders = [];
  PLUS_FILES.forEach((f) => {
    read("plus-ai", f).split("\n").forEach((line, i) => {
      const m = line.match(/new RegExp\(\s*`([^`]*)`/);
      if (!m) return;
      if (/\\[snS*]/.test(m[1])) offenders.push(`${f}:${i + 1}: ${m[1].slice(0, 60)}`);
    });
  });
  assert.deepEqual(offenders, [], "template-literal regexes must use String.raw:\n" + offenders.join("\n"));
});

test("PA.safe returns the fallback instead of propagating (defect 2)", () => {
  const PA = loadPlus("cards.js");
  assert.equal(PA.safe(() => "ok", "fallback"), "ok", "the happy path passes through");
  assert.equal(PA.safe(() => { throw new Error("boom"); }, "fallback"), "fallback", "a throw yields the fallback, not a crash");
  assert.equal(PA.safe(() => null, "fallback"), "fallback", "a null result yields the fallback");
});

test("every per-message renderer is called through PA.safe (defect 2)", () => {
  const UI = read("plus-ai", "ui.js");
  assert.match(UI, /PA\.safe\(function \(\) \{ return PA\.cards\.renderStatCard\(/, "statCard render must be guarded");
  assert.match(UI, /PA\.safe\(function \(\) \{ return PA\.cards\.renderMsgContent\(/, "message body render must be guarded");
});

test("a throwing row cannot stop the sheet from being built (defect 2)", () => {
  // Simulate a message whose renderer throws, and assert floatingCoach still
  // returns a complete sheet string.
  const sandbox = {
    console, JSON, Date, Math, RegExp, String, Object, Array, Number, Boolean, setTimeout,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener: () => {} },
  };
  sandbox.window = sandbox;
  sandbox.window.S = {
    mode: "app", tab: "home", errors: {}, saved: [], connections: {}, user: { niches: ["sports"] },
    pulseAi: {
      open: true, platform: "tiktok", goal: "views", niche: "sports", input: "", loading: false,
      showMemory: false, showThreads: false, threads: [], activeThreadId: null,
      messages: [{ id: "m1", role: "assistant", content: "hi", action: "chat", statCard: { images: ["data:x"], format: "instagram" } }],
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(read("plus-ai", "state.js"), sandbox);
  vm.runInContext(read("plus-ai", "cards.js"), sandbox);
  vm.runInContext(read("plus-ai", "ui.js"), sandbox);

  // Make the body renderer explode, the way the old regex did.
  sandbox.window.CPPlusAI.cards.renderMsgContent = () => { throw new Error("Nothing to repeat"); };
  const html = sandbox.window.CPPlusAI.ui.floatingCoach();
  assert.ok(html && html.length > 100, "the sheet must still be produced despite a throwing row");
  assert.match(html, /pulse-ai-sheet/, "the sheet markup must still be present");
});

test("ui.js removes a stray backdrop if a repaint throws", () => {
  assert.match(read("plus-ai", "ui.js"), /sheet-overlay/, "repaint must clean up a stray overlay on failure");
});

test("the service worker cache and the asset version were both bumped", () => {
  const cacheName = (SW_JS.match(/const CACHE_NAME = "([^"]+)"/) || [])[1];
  assert.ok(cacheName, "sw.js must define CACHE_NAME");
  assert.notEqual(cacheName, "creatorpulse-v11", "the cache name must be bumped past the previous build");
  const appV = (INDEX_HTML.match(/app\.js\?v=(\d+)/) || [])[1];
  assert.ok(appV, "index.html must version app.js");
  assert.ok(Number(appV) >= 30, `index.html must request at least app.js?v=30 (saw ${appV})`);
  assert.doesNotMatch(INDEX_HTML, /\?v=29/, "no asset may still be pinned to the old version");
});
