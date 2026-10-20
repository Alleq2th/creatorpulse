const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const statCard = require("../services/statCard");
const coreJs = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");

test("public/core.js includes TikTok Silent Camera format option", () => {
  assert.match(coreJs, /"TikTok Silent Camera"/);
  assert.match(coreJs, /isSilentCamera\s*=\s*c\s*===\s*"TikTok Silent Camera"/);
  assert.match(coreJs, /cardFormat\s*=\s*isSilentCamera\s*\?\s*"tiktok_silent"/);
});

test("services/statCard.js exports photoMissingLayer and buildEditorialPhotoCover", () => {
  assert.equal(typeof statCard.photoMissingLayer, "function");
  assert.equal(typeof statCard.buildEditorialPhotoCover, "function");
});

test("services/statCard.js photoMissingLayer renders clear visual fallback message", () => {
  const p = statCard.resolvePalette("noir_orange");
  const f = statCard.resolveFormat("tiktok");
  const typo = statCard.resolveTypography("impact");
  const svg = statCard.photoMissingLayer(p, f, typo);
  assert.match(svg, /SOURCE PHOTO UNAVAILABLE/);
  assert.match(svg, /fallbackGlow/);
  assert.match(svg, /fallbackGrid/);
});

test("services/statCard.js renders valid buffer for silent camera cards", async () => {
  const buf = await statCard.renderStatCard(
    {
      headline: "WHEN CLIENTS SAY THEY NEED IT YESTERDAY",
      supportingText: "Show up calm, point at the timeline, say nothing.",
      silentCamera: true,
      slideNumber: 1,
      totalSlides: 1
    },
    "commentary",
    "noir_orange",
    "tiktok_silent",
    null
  );
  assert.ok(Buffer.isBuffer(buf), "renderStatCard must return a Buffer");
  assert.ok(buf.length > 5000, "rendered image should not be empty");
});
