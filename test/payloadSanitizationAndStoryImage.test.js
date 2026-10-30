const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

describe("Payload Sanitization & Story Image Guarantees", () => {
  it("core.js defines sanitizeContentForSave that strips large base64 data URIs from slides and images", () => {
    const coreCode = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
    assert.ok(coreCode.includes("function sanitizeContentForSave"), "sanitizeContentForSave must be defined");
    assert.ok(coreCode.includes("window.sanitizeContentForSave = sanitizeContentForSave"), "sanitizeContentForSave should be attached to window");

    // Evaluate sanitizeContentForSave in a sandbox
    const window = {};
    const evalFn = new Function("window", coreCode.slice(coreCode.indexOf("function sanitizeContentForSave"), coreCode.indexOf("window.saveOut")));
    evalFn(window);

    const hugeBase64 = "data:image/png;base64," + "A".repeat(1024 * 1024); // 1MB mock image
    const rawContent = {
      type: "carousel",
      headline: "Liverpool vs Chelsea Tactical Breakdown",
      slides: [
        { headline: "Slide 1", body: "Opening kickoff analysis", img: hugeBase64, localImg: "data:image/svg+xml;base64,PHN2Zz4=" },
        { headline: "Slide 2", body: "Midfield dominance", img: hugeBase64, localImg: "data:image/svg+xml;base64,PHN2Zz4=" }
      ],
      images: [hugeBase64, hugeBase64],
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2"
    };

    const sanitized = window.sanitizeContentForSave(rawContent);

    // Verify slides still have text and headlines
    assert.strictEqual(sanitized.headline, "Liverpool vs Chelsea Tactical Breakdown");
    assert.strictEqual(sanitized.slides[0].headline, "Slide 1");
    assert.strictEqual(sanitized.slides[0].body, "Opening kickoff analysis");

    // Verify huge base64 data URIs are stripped
    assert.strictEqual(sanitized.slides[0].img, undefined);
    assert.strictEqual(sanitized.slides[0].localImg, undefined);
    assert.strictEqual(sanitized.images, undefined);

    // Verify remote image URL is preserved
    assert.strictEqual(sanitized.imageUrl, "https://images.unsplash.com/photo-1508098682722-e99c43a406b2");

    // Verify JSON payload size drops from >2MB to <500 bytes
    const rawSize = JSON.stringify(rawContent).length;
    const sanitizedSize = JSON.stringify(sanitized).length;
    assert.ok(rawSize > 2000000, `Raw size should be >2MB, got ${rawSize}`);
    assert.ok(sanitizedSize < 1000, `Sanitized size should be <1KB, got ${sanitizedSize}`);
  });

  it("server.js defines sanitizeSavedContent and applies it in /api/save-post", () => {
    const serverCode = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    assert.ok(serverCode.includes("function sanitizeSavedContent(content)"), "server.js must define sanitizeSavedContent");
    assert.ok(serverCode.includes("content = sanitizeSavedContent(content)"), "server.js must sanitize content in save-post");
  });

  it("auto-save inside window.gen is wrapped in try/catch and does not fail generation", () => {
    const coreCode = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
    assert.ok(coreCode.includes("try {\n        await api(\"/api/save-post\""), "auto-save in window.gen must be inside try/catch");
    assert.ok(coreCode.includes("catch(saveErr){\n        console.warn(\"Auto-save post to calendar failed:\", saveErr);"), "auto-save must catch error gracefully");
  });

  it("api() handles 413 specifically with a clear payload size error message", () => {
    const coreCode = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
    assert.ok(coreCode.includes("r.status === 413"), "api() must check for status 413");
    assert.ok(coreCode.includes("Request payload is too large for the server (status 413)."), "api() must provide clear 413 message");
  });

  it("routes/cards.js falls back to findLiveImage when imageUrl is missing", () => {
    const cardsCode = fs.readFileSync(path.join(__dirname, "../routes/cards.js"), "utf8");
    assert.ok(cardsCode.includes("if (!imageUrl)"), "generate-cards must check if imageUrl is falsy");
    assert.ok(cardsCode.includes("const imageInfo = await findLiveImage(topic, niche);"), "generate-cards must call findLiveImage as fallback");
    assert.ok(cardsCode.includes("if (imageInfo?.url) fallbackImageUrl = imageInfo.url;"), "generate-cards must set imageUrl from live image result");
  });

  it("server.js news and blog feeds fall back to findLiveImage when sourceImage is missing", () => {
    const serverCode = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    assert.ok(serverCode.includes("const liveImg = await findLiveImage(a.title, niche);"), "news endpoint must look up live image for articles lacking images");
    assert.ok(serverCode.includes("const liveImg = await findLiveImage(item.title, niche);"), "RSS feed fallback must look up live image for items lacking images");
  });

  it("platform mockups support o.imageUrl across Instagram, YouTube, and X", () => {
    const coreCode = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
    const igMatches = coreCode.match(/curSlide\?\.img \|\| o\.img \|\| o\.imageUrl \|\| ""/g);
    assert.ok(igMatches && igMatches.length >= 3, "All platform mockups must check o.imageUrl");
  });

  it("script version in index.html and cache version in sw.js are bumped", () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
    const swJs = fs.readFileSync(path.join(__dirname, "../public/sw.js"), "utf8");
    assert.ok(indexHtml.includes("core.js?v=53"), "index.html must reference core.js?v=51");
    assert.ok(swJs.includes('const CACHE_NAME = "creatorpulse-v32";'), "sw.js cache must be bumped to creatorpulse-v32");
  });
});
