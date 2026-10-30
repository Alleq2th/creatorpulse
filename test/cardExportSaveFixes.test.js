const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

describe("card export, downloads and save", () => {
  const core = read("public/core.js");
  const server = read("server.js");

  it("slide downloads are named as the JPEG they contain", () => {
    assert.ok(!core.includes("slide-${s.slideNumber}.png"));
    assert.ok(!core.includes("slide-${i+1}.png"));
    assert.ok(core.includes("slide-${i + 1}.jpg"));
  });

  it("Download all and Download start inside the tap when the image is ready", () => {
    assert.ok(core.includes("cpExportReady(tid, idx, si)) { window.dl("));
    assert.ok(core.includes("slideIdxs.every(si => cpExportReady(tid, idx, si))"));
  });

  it("failed exports are never replaced by an older image", () => {
    assert.ok(!core.includes("cpFlushExport(tid, idx, si).catch(() => cpCurrentExportImg"));
    assert.ok(!core.includes("(await cpFlushExport(tid, idx, si)) || cpCurrentExportImg"));
  });

  it("Save uploads exported images and saves the stored copy", () => {
    assert.ok(core.includes("cpStoreCardImages(tid, idx, flushed)"));
    assert.ok(core.includes('"/api/card-image"'));
    assert.ok(core.includes("content:sanitizeContentForSave(savedCopy)"));
  });

  it("server exposes an authenticated card image upload", () => {
    assert.ok(server.includes('app.post("/api/card-image"'));
    assert.ok(server.includes("supabase.auth.getUser(token)"));
    assert.ok(server.includes(".storage.from(CARD_IMAGE_BUCKET).upload("));
  });
});
