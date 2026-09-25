// Every local asset index.html asks for must actually exist in public/.
//
// Why this test exists: parseAuthRedirect() was extracted out of public/core.js
// into lib/authRedirect.js so it could be unit-tested. index.html then loaded it
// as "/lib/authRedirect.js" -- but express.static() only serves public/, and the
// file was at the repo root, NOT public/lib/. So the script 404'd for every real
// visitor, `parseAuthRedirect` was undefined, app.js's checkAuthRedirect() threw
// on the very first call, and the app died on a blank login screen. The entire
// app, and the whole password-reset feature, was dead in production.
//
// No unit test could catch that: the tests passed, the suite was green, and the
// file was perfectly valid JavaScript. It was only ever wrong *at runtime*.
// This test checks the one thing that broke -- does the file express.static()
// would serve actually exist on disk -- so it can never break silently again.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const INDEX = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");

// Pull every src/href out of index.html, keeping only same-origin file paths.
// Anything absolute (https://fonts.googleapis.com), a data: URI, or a bare
// fragment is not something express.static() could ever serve, so skip it.
//
// HTML comments and <style> blocks are stripped first. index.html carries large
// blocks of commented-out and inlined CSS, and one comment there mentions
// "/studio.css" in prose as a deployment suggestion -- a naive regex happily
// reads that as a real <link> and reports a phantom missing file.
function localAssetRefs(html) {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) =>
      // Keep script TAGS (their src may matter) but drop their inline bodies.
      tag.includes("src=") ? tag : "");

  const refs = new Set();
  const re = /(?:src|href)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(markup)) !== null) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith("#")) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue; // https:, data:, mailto:
    if (raw.startsWith("//")) continue;             // protocol-relative
    refs.add(raw.split("?")[0].split("#")[0]);      // drop ?v=16 cache-bust
  }
  return [...refs];
}

test("index.html references at least one local asset", () => {
  assert.ok(localAssetRefs(INDEX).length > 0, "no local asset refs found at all");
});

test("every local asset index.html references exists under public/", () => {
  const missing = [];
  for (const ref of localAssetRefs(INDEX)) {
    const rel = ref.replace(/^\/+/, "");
    if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) missing.push(ref);
  }
  assert.deepEqual(
    missing,
    [],
    `index.html asks for files express.static() cannot serve: ${missing.join(", ")}`
  );
});

// The exact bug, pinned by name so a future refactor away from public/lib/
// fails loudly here instead of silently in a browser.
test("the parseAuthRedirect script is served from under public/", () => {
  const refs = localAssetRefs(INDEX).filter((r) => r.includes("authRedirect"));
  assert.equal(refs.length, 1, "expected exactly one authRedirect.js reference");
  assert.match(refs[0], /^\/lib\//, "should be loaded from /lib/");
  assert.ok(
    fs.existsSync(path.join(PUBLIC_DIR, refs[0].replace(/^\/+/, ""))),
    `${refs[0]} is referenced but not served by express.static(public/)`
  );
});

test("the script that defines parseAuthRedirect loads before its caller", () => {
  const iRedirect = INDEX.indexOf("authRedirect.js");
  const iApp = INDEX.indexOf("app.js");
  assert.ok(iRedirect !== -1 && iApp !== -1, "both scripts should be referenced");
  // app.js calls parseAuthRedirect() at top level, so it must come second.
  assert.ok(
    iRedirect < iApp,
    "authRedirect.js must be loaded before app.js, or parseAuthRedirect is undefined when called"
  );
});

// server.js serves static files from public/ only. If someone ever points it
// elsewhere, the paths in index.html stop resolving -- so assert the two agree.
test("server.js serves static files from the public/ directory", () => {
  const server = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
  assert.match(
    server,
    /express\.static\(\s*PUBLIC_DIR/,
    "server.js should serve express.static(PUBLIC_DIR)"
  );
  assert.match(
    server,
    /const PUBLIC_DIR\s*=\s*path\.join\(__dirname,\s*"public"\)/,
    "PUBLIC_DIR should point at the public/ directory"
  );
});
