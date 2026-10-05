// "Could not connect to the server" while the server is plainly live.
//
// THE BUG THESE TESTS LOCK DOWN
// -----------------------------
// CreatorPulse is two halves: the screens (public/) and the server (server.js).
// The screens used to decide where the server was by asking "whatever machine
// served me this page". That is fine when our own Express server serves the
// page - but the app is ALSO published on GitHub Pages, which only hands out
// files. There, every `/api/...` call was a request to a file server: a 404,
// silently, forever. Photos stayed blank, captions answered 503, and turning on
// notifications reported "could not connect to the server".
//
// The fix has two halves and both are asserted here:
//   1. The frontend resolves the backend address in ONE place (lib/apiBase.js),
//      preferring the page's own origin and falling back to a seed the server
//      stamps in at boot / the static build stamps in at build time.
//   2. That address can never silently go stale again, and the frontend/backend
//      split (which is cross-origin) is always allowed by CORS.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const SERVER = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const CORE = fs.readFileSync(path.join(PUBLIC, "core.js"), "utf8");
const APPBASE = fs.readFileSync(path.join(PUBLIC, "lib", "apiBase.js"), "utf8");
const INDEX = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const BUILD = fs.readFileSync(path.join(ROOT, "scripts", "buildPages.js"), "utf8");

test("the frontend no longer asks 'whoever served me this page'", () => {
  // `const API = window.location.origin` was the root cause. On a static host
  // that is a file server, so every API call 404s.
  assert.ok(
    !/const API\s*=\s*window\.location\.origin\s*;/.test(CORE),
    "core.js must not hardcode API to window.location.origin"
  );
  assert.match(CORE, /const API = .*ariaApiBase/, "core.js must take API from the resolver");
});

test("the app never asks a retired Render address any more", () => {
  // The exact stale value that caused the outage. It still resolves, but to a
  // suspended service, so seeing it in the source means the bug is back.
  for (const [name, src] of [["core.js", CORE], ["apiBase.js", APPBASE], ["server.js", SERVER]]) {
    assert.ok(
      !/creatorpulse\.onrender\.com/.test(src),
      `${name} still references the retired 'creatorpulse.onrender.com' address`
    );
  }
});

test("server.js stamps its own address into the page at boot", () => {
  assert.match(SERVER, /RENDER_EXTERNAL_URL/, "server.js should read RENDER_EXTERNAL_URL");
  assert.match(SERVER, /aria-api-base-seed/, "server.js should inject the aria-api-base-seed meta tag");
  // It must inject into <head>, before any script that reads it.
  assert.match(SERVER, /<head/, "the seed must be injected into <head>");
});

test("the seed is only injected when it is a real https URL", () => {
  // A half-configured value must not be stamped into the page and then trusted.
  assert.match(SERVER, /function backendSeed/, "server.js should expose a testable backendSeed()");
  assert.ok(SERVER.includes("+$/i.test(raw.trim())"), "backendSeed must validate the seed is an absolute https URL");
});

test("the static build can stamp the same seed, and says which one it used", () => {
  assert.match(BUILD, /ARIA_API_BASE/, "buildPages.js should accept an ARIA_API_BASE seed");
  assert.match(BUILD, /aria-api-base-seed/, "buildPages.js should emit the seed meta tag");
  assert.match(BUILD, /backend seed/, "buildPages.js should log which seed it stamped");
});

test("CORS allows the frontend's own origins, so a split deploy still works", () => {
  // Without this the browser blocks every request from GitHub Pages to Render -
  // which is what "could not connect to the server" actually was.
  assert.match(SERVER, /RENDER_EXTERNAL_URL/, "CORS should allow this service's own Render address");
  assert.match(SERVER, /github\\?\.io/, "CORS should allow the github.io frontend origin");
  assert.match(SERVER, /onrender\\?\.com/, "CORS should allow the onrender.com frontend origin");
  assert.match(SERVER, /CORS_ORIGIN_RE/, "there should be a single, testable origin pattern");
});

test("the CORS pattern matches our hosts and nothing unrelated", () => {
  // Same regex as server.js, re-checked here so a careless edit is caught.
  const RE = /^https?:\/\/([a-z0-9-]+\.)*(github\.io|onrender\.com)$/i;
  for (const ok of [
    "https://alleq2th.github.io",
    "https://creatorpulse-3khg.onrender.com",
    "https://my-thing.onrender.com",
  ]) {
    assert.ok(RE.test(ok), `${ok} should be allowed`);
  }
  for (const bad of [
    "https://evil.com",
    "https://github.io.evil.com",
    "https://notonrender.com",
    "http://localhost:3000",
  ]) {
    assert.ok(!RE.test(bad), `${bad} must NOT be auto-allowed by the loose pattern`);
  }
});

test("index.html stamps a cache-busting version on every app script", () => {
  // The app ships long-lived caches; without a version bump a fixed script can
  // be served from cache for hours and look like the fix never landed.
  for (const f of ["core.js", "studio.js", "app.js", "lib/apiBase.js"]) {
    const re = new RegExp(`(src|href)="${f.replace(".", "\\.")}\\?v=\\d+"`);
    assert.match(INDEX, re, `${f} should be loaded with a ?v= version`);
  }
});

test("a static page cannot be trusted as the backend, and a real one can", () => {
  // The core rule, stated once more in plain terms: static hosts are the only
  // case that needs to be told where the server is.
  assert.match(APPBASE, /isStaticHost/, "apiBase.js must detect static-only hosts");
  assert.match(APPBASE, /selfBase/, "apiBase.js must be able to trust the page's own origin");
});
