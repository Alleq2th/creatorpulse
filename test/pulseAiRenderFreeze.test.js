const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const APP_JS = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
const CORE_JS = fs.readFileSync(path.join(ROOT, "public", "core.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
const SW_JS = fs.readFileSync(path.join(ROOT, "public", "sw.js"), "utf8");

// ── The freeze ────────────────────────────────────────────────────────────
// Tapping Plus AI did nothing but kill the whole app. Two separate defects
// stacked up, and both are pinned below.
//
// DEFECT 1 (the crash). app.js built a regular expression from a TEMPLATE
// LITERAL whose backslashes were single, e.g. `\s` and `\*`. In a template
// literal `\s` is just "s" and `\*` is just "*", so the pattern handed to
// RegExp() contained a bare "**" -> "Nothing to repeat" -> SyntaxError. It
// threw while the Plus AI sheet was being built.
//
// DEFECT 2 (the "whole app dies" part). render() is a full-page rebuild:
// renderApp() assigns root.innerHTML in ONE shot. When an exception escaped
// mid-build, that assignment never ran, so the page kept its previous markup
// AND every later tap re-threw the same way. That is exactly the reported
// symptom: "the moment I tap Plus AI it hangs, and after that tapping
// anything does nothing until I reload."

function extract(name, src, nextName) {
  const start = src.indexOf(name);
  assert.ok(start !== -1, `app.js must define ${name}`);
  const end = nextName ? src.indexOf(nextName, start) : -1;
  assert.ok(end !== -1, `${name} must be a complete function`);
  return src.slice(start, end);
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

function loadParser() {
  const escFn = extract("function esc(", CORE_JS, "\n");
  const parser = extract("function pulseAiParseContentCards", APP_JS, "\nfunction pulseAiParseTablesToCards");
  const factory = new Function(escFn + "\n" + parser + "\nreturn pulseAiParseContentCards;");
  return factory();
}

test("pulseAiParseContentCards parses a real CARD payload without throwing", () => {
  const parse = loadParser();
  const out = parse(CARD_PAYLOAD);
  assert.ok(out, "a payload containing CARD 01 must produce cards");
  assert.equal((out.cardsHtml.match(/pa-content-card/g) || []).length, 2, "both cards must render");
  assert.match(out.cardsHtml, /Boots vs\. Beach/, "the Title field must be pulled out of the card body");
});

test("no template-literal RegExp in app.js relies on single backslashes (defect 1)", () => {
  // A regression guard with teeth: if someone writes `new RegExp(`...\s...`)`
  // again, the pattern loses its escapes and blows up at runtime.
  const lines = APP_JS.split("\n");
  const offenders = [];
  lines.forEach((line, i) => {
    const m = line.match(/new RegExp\(\s*`([^`]*)`/);
    if (!m) return;
    const body = m[1];
    // "\s", "\n", "\*", "\S" as TWO characters in the source = broken.
    if (/\\[snS*]/.test(body)) offenders.push(`app.js:${i + 1}: ${body.slice(0, 60)}`);
  });
  assert.deepEqual(offenders, [], "template-literal regexes must use String.raw or double backslashes:\n" + offenders.join("\n"));
});

test("every render call that can throw is wrapped in paSafeRender (defect 2)", () => {
  assert.match(APP_JS, /function paSafeRender\(/, "paSafeRender must exist");
  // The two renderers that run on every Plus AI message row.
  assert.match(
    APP_JS,
    /paSafeRender\(\(\)\s*=>\s*pulseAiRenderStatCard\(/,
    "pulseAiRenderStatCard must be called through paSafeRender"
  );
  assert.match(
    APP_JS,
    /paSafeRender\(\(\)\s*=>\s*pulseAiRenderMsgContent\(/,
    "pulseAiRenderMsgContent must be called through paSafeRender"
  );
});

test("paSafeRender returns the fallback instead of propagating (defect 2)", () => {
  const fn = extract("function paSafeRender(", APP_JS, "\nfunction renderFloatingCoach");
  const factory = new Function(fn + "\nreturn paSafeRender;");
  const safe = factory();
  assert.equal(safe(() => "ok", "fallback"), "ok", "the happy path passes through");
  assert.equal(safe(() => { throw new Error("boom"); }, "fallback"), "fallback", "a throw yields the fallback, not a crash");
});

test("the service worker cache and the asset version were both bumped", () => {
  // Without a NEW cache name the installed service worker keeps serving the
  // app shell it already precached, so a shipped fix never reaches the phone.
  const cacheName = (SW_JS.match(/const CACHE_NAME = "([^"]+)"/) || [])[1];
  assert.ok(cacheName, "sw.js must define CACHE_NAME");
  assert.notEqual(cacheName, "creatorpulse-v10", "the cache name must be bumped past the broken build");
  assert.match(INDEX_HTML, /app\.js\?v=29/, "index.html must request the bumped app.js");
  assert.doesNotMatch(INDEX_HTML, /\?v=28/, "no asset may still be pinned to the old version");
});
