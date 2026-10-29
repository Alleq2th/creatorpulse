const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const statCard = require("../services/statCard");
const core = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
const routes = fs.readFileSync(path.join(__dirname, "../routes/cards.js"), "utf8");

test("YouTube thumbnails resolve to widescreen 1280x720 card canvas", () => {
  const format = statCard.resolveFormat("youtube_thumbnail", "balanced");
  assert.equal(format.w, 1280);
  assert.equal(format.h, 720);
  assert.equal(typeof statCard.renderYouTubeThumbnail, "function");
});

test("manual focal point is used in the server crop pipeline", () => {
  const source = fs.readFileSync(path.join(__dirname, "../services/statCard.js"), "utf8");
  assert.match(source, /async function fetchCoverImage\(imageUrl, w, h, focalPoint\)/);
  assert.match(source, /focalPoint\?\.x/);
  assert.match(source, /focalPoint\?\.y/);
  assert.match(source, /options\.focalPoint \|\| slide\.focalPoint/);
});

test("generator exposes brand, focal point, silent-camera, and text editing controls", () => {
  assert.match(core, /const BRAND_PRESETS =/);
  assert.match(core, /window\.setBrandPreset\s*=/);
  assert.match(core, /window\.setFocalPoint\s*=/);
  assert.match(core, /TEXT SAFE ZONE/);
  assert.match(core, /Text is \$\{silentText\.length\} characters/);
  assert.match(core, /window\.applyCardText\s*=/);
  assert.match(core, /Text size/);
  assert.match(core, /Font<select/);
  assert.match(core, /Edit layout on canvas/);
});

test("card generation route forwards focal point and brand preset options", () => {
  assert.match(routes, /focalPoint, brand/);
  assert.match(routes, /renderCardSet\(capped,[\s\S]*?focalPoint, brand/);
});
