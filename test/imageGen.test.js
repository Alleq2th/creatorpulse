// Unit tests for the aspect-ratio helper used by image generation and cards.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { dimsForFormat } = require("../services/imageGen");

test("square is the default", () => {
  assert.deepEqual(dimsForFormat(), { w: 1024, h: 1024 });
  assert.deepEqual(dimsForFormat("square"), { w: 1024, h: 1024 });
  assert.deepEqual(dimsForFormat(undefined), { w: 1024, h: 1024 });
});

test("16:9 formats are 1280x720", () => {
  for (const f of ["thumbnail", "youtube", "16:9", "THUMBNAIL"]) {
    assert.deepEqual(dimsForFormat(f), { w: 1280, h: 720 });
  }
});

test("9:16 formats are 720x1280", () => {
  for (const f of ["reel", "tiktok", "story", "9:16", "portrait"]) {
    assert.deepEqual(dimsForFormat(f), { w: 720, h: 1280 });
  }
});

test("4:5 carousel is 1080x1350", () => {
  for (const f of ["carousel", "4:5"]) {
    assert.deepEqual(dimsForFormat(f), { w: 1080, h: 1350 });
  }
});

test("an unknown format falls back to square", () => {
  assert.deepEqual(dimsForFormat("banana"), { w: 1024, h: 1024 });
});
