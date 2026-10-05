#!/usr/bin/env node
/**
 * Build the static face of CreatorPulse into `pages/` for GitHub Pages.
 *
 * WHY THIS EXISTS
 * ---------------
 * The github.io address used to show GitHub's auto-generated README page,
 * because GitHub Pages serves static files and CreatorPulse never had a static
 * build. Nothing in `public/` ever reached that address.
 *
 * WHY NOT A BUNDLER
 * -----------------
 * The app's scripts are plain `<script src>` files that deliberately share
 * globals across files (core.js defines `S`/`api()`, studio.js defines the
 * editor, app.js wires it up). There is nothing to bundle, and a bundler that
 * treats them as separate entries will refuse to follow them and emit an
 * index.html whose scripts it never copied - a page that looks attached but
 * is silently broken. Copying the tree and fixing the three URLs that differ
 * between a root deployment and a project page is smaller and more truthful.
 *
 * THE THREE DIFFERENCES FOR A PROJECT PAGE (/creatorpulse/):
 *   1. the service worker is registered at "/sw.js" - root, not under
 *      /creatorpulse/, so on Pages it would 404. Made page-relative.
 *   2. manifest.json is served by GitHub Pages as text/plain, which Chrome
 *      rejects as invalid JSON. The .webmanifest extension gets the correct
 *      MIME type, so the file is renamed and the link tag updated.
 *   3. manifest.json's own paths ("id": "/", "start_url": "/", icons,
 *      screenshots) are root-absolute and must become relative.
 *
 * Everything else in the tree is copied byte-for-byte. This does NOT touch the
 * Render deployment: Render runs server.js, which serves `public/` directly.
 *
 * Usage: npm run build:pages
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "pages");

// Only meaningful when an Express server is running, so not published as a
// static asset. (It is a stale copy of server.js kept under public/.)
const SKIP = new Set(["server.js"]);

// Files that must exist in the output. Checked at the end so the workflow fails
// loudly instead of publishing a page whose scripts are missing.
const REQUIRED = [
  "index.html", "core.js", "studio.js", "app.js", "studio.css", "sw.js",
  "lib/apiBase.js", "lib/authRedirect.js", "lib/studioModel.js", "lib/studioPerf.js",
  "manifest.webmanifest",
];

const NO_JS_NOTE = `
<noscript>
  <p style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;line-height:1.6">
    CreatorPulse needs JavaScript switched on before it can show anything &mdash;
    it is a single-page app, so the whole screen is drawn by script.
  </p>
</noscript>
`;

function log(...args) { console.log("[pages]", ...args); }

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) count += copyTree(src, dest);
    else { fs.copyFileSync(src, dest); count++; }
  }
  return count;
}

function buildIndex(html) {
  let out = html;

  // 1. Service worker: "/sw.js" -> "sw.js" so it resolves under /creatorpulse/.
  const before = out;
  out = out.replace(
    /(serviceWorker\.register\(\s*["'])\/(sw\.js)/g,
    "$1$2"
  );
  if (out === before) {
    throw new Error("expected to find a serviceWorker.register('/sw.js') call to make page-relative");
  }

  // 2. Manifest extension, so GitHub Pages serves it with a JSON MIME type.
  out = out.replace(/href="manifest\.json"/g, 'href="manifest.webmanifest"');

  // 3. A plain-English fallback for anyone with JavaScript switched off.
  out = out.replace("</body>", NO_JS_NOTE + "</body>");

  return out;
}

function buildManifest(json) {
  return json
    // Shortcut URLs:  "/?tab=create"        -> "./?tab=create"
    .replace(/"\/\?/g, '"./?')
    // id / start_url / scope:  "/"           -> "./"
    .replace(/"\/"/g, '"./"')
    // Icon + screenshot paths: "/icon-192.png" -> "icon-192.png"
    .replace(/"\//g, '"');
}

function main() {
  if (!fs.existsSync(SRC)) throw new Error(`missing source directory: ${SRC}`);

  fs.rmSync(OUT, { recursive: true, force: true });
  const copied = copyTree(SRC, OUT);

  const indexPath = path.join(OUT, "index.html");
  fs.writeFileSync(indexPath, buildIndex(fs.readFileSync(indexPath, "utf8")));

  const manifestIn = path.join(OUT, "manifest.json");
  if (fs.existsSync(manifestIn)) {
    fs.writeFileSync(
      path.join(OUT, "manifest.webmanifest"),
      buildManifest(fs.readFileSync(manifestIn, "utf8"))
    );
    fs.rmSync(manifestIn);
  }

  // Tell GitHub Pages to publish the tree exactly as it is, with no Jekyll
  // processing (Jekyll is what was producing the README page in the first
  // place, and it also ignores paths beginning with an underscore).
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

  const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(OUT, f)));
  if (missing.length) {
    throw new Error(`build incomplete, missing: ${missing.join(", ")}`);
  }

  log(`copied ${copied} file(s) from public/ -> pages/`);
  log(`verified ${REQUIRED.length} required file(s) present`);
  log("done");
}

main();
