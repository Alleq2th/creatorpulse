const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const INDEX = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf8"));
const CORE = fs.readFileSync(path.join(PUBLIC, "core.js"), "utf8");
const APP = fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8");

test("index.html includes inline animated splash overlay with brand typography and progress track", () => {
  assert.ok(INDEX.includes('id="cp-app-splash"'), "must include #cp-app-splash overlay");
  assert.ok(INDEX.includes('class="cp-splash-logo"'), "must include splash logo element");
  assert.ok(INDEX.includes("CreatorPulse"), "must include brand name");
  assert.ok(INDEX.includes("AI Content Engine for Creators"), "must include brand tagline");
  assert.ok(INDEX.includes('class="cp-splash-progress-bar"'), "must include animated shimmer progress bar");
  assert.ok(INDEX.includes('id="cp-splash-status"'), "must include dynamic creator micro-status line");
});

test("index.html defines dismissal hook and fluid animations", () => {
  assert.ok(INDEX.includes("window.dismissCpSplash"), "must expose window.dismissCpSplash");
  assert.ok(INDEX.includes("cpSplashPulse"), "must define pulse keyframe");
  assert.ok(INDEX.includes("cpSplashShimmer"), "must define shimmer keyframe");
  assert.ok(INDEX.includes("cpSplashGlow"), "must define glow keyframe");
});

test("manifest.json defines cohesive brand background and maskable launch icons", () => {
  assert.equal(MANIFEST.background_color, "#0E0C17", "manifest background must match app theme");
  assert.equal(MANIFEST.theme_color, "#7C3AED", "manifest theme color must be CreatorPulse purple");
  const maskable = MANIFEST.icons.filter(i => i.purpose === "maskable");
  assert.ok(maskable.length >= 2, "must provide maskable icons for Android PWA splash");
  for (const icon of maskable) {
    const iconPath = path.join(PUBLIC, icon.src.replace(/^\/+/, ""));
    assert.ok(fs.existsSync(iconPath), `maskable icon ${icon.src} must exist on disk`);
  }
});

test("core.js and app.js invoke dismissCpSplash on hydration", () => {
  assert.ok(CORE.includes("dismissCpSplash"), "core.js must call dismissCpSplash");
  assert.ok(APP.includes("dismissCpSplash"), "app.js must call dismissCpSplash");
});
