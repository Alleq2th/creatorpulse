const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CORE_JS = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");
const INDEX_HTML = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");

test("core.js implements progressive disclosure with Done/Change toggles and hidden attribute", () => {
  assert.match(CORE_JS, /const railOpen = \(label\) =>/);
  assert.match(CORE_JS, /role="button"/);
  assert.match(CORE_JS, /Done ✓/);
  assert.match(CORE_JS, /Change ▾/);
  assert.match(CORE_JS, /<div class="h-rail" \$\{railOpen\(label\) \? "" : "hidden"\}>/);
  assert.match(CORE_JS, /window\.toggleRail = \(tid, label\) =>/);
});

test("core.js renders compact interactive format and tone glyphs without blank boxes", () => {
  assert.match(CORE_JS, /const TONE_VIS = \{/);
  assert.match(CORE_JS, /h-emoji/);
  assert.match(CORE_JS, /const fmtIcon = \(c\) =>/);
  assert.match(CORE_JS, /h-fmt-vis/);
  assert.match(CORE_JS, /h-card-tone/);
  assert.match(CORE_JS, /h-card-fmt/);
});

test("core.js selection handlers advance progressively to next step and collapse previous", () => {
  assert.match(CORE_JS, /railExp\[tid\+"_platform"\]=false;\s*S\.railExp\[tid\+"_format"\]=true;/);
  assert.match(CORE_JS, /railExp\[tid\+"_format"\]=false;\s*S\.railExp\[tid\+"_tone"\]=true;/);
  assert.match(CORE_JS, /railExp\[tid\+"_tone"\]=false;/);
});

test("index.html defines compact card dimensions, SVG icon sizing, and hidden rail display", () => {
  assert.match(INDEX_HTML, /\.h-rail\[hidden\]\s*\{\s*display:\s*none !important;\s*\}/);
  assert.match(INDEX_HTML, /\.h-card\s*\{[^}]*min-width:\s*76px/);
  assert.match(INDEX_HTML, /\.h-card\s*\{[^}]*max-width:\s*104px/);
  assert.match(INDEX_HTML, /\.h-icon-svg\s*\{[^}]*height:\s*24px/);
  assert.match(INDEX_HTML, /\.h-step-action\s*\{/);
});
