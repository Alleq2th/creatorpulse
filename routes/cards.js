// Carousel card endpoint — see services/statCard.js for the full rendering
// system and why it uses deterministic SVG templates instead of an image
// model per slide.
const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");

// The frontend may hand us either a raw image URL (from a news/blog RSS
// item) or one already routed through our own /api/image-proxy (Twitter
// images are always proxied client-side for CORS reasons). Either way we
// want the true underlying URL so we can fetch it directly server-side.
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  try {
    const marker = "/api/image-proxy?url=";
    const i = imageUrl.indexOf(marker);
    if (i !== -1) return decodeURIComponent(imageUrl.slice(i + marker.length));
    return imageUrl;
  } catch (e) {
    return imageUrl;
  }
}

router.post("/generate-cards", async (req, res) => {
  try {
    const { slides, category, palette, format, imageUrl } = req.body || {};
    if (!Array.isArray(slides) || !slides.length) return res.status(400).json({ error: "Missing slides array" });
    if (slides.length > 10) return res.status(400).json({ error: "Max 10 slides per set" });
    // category can be a plain string (legacy) or {name, slug} — statCard
    // normalizes either.
    const cat = typeof category === "object" && category ? { displayName: category.name || category.displayName || "", slug: category.slug || "default" } : { displayName: category || "", slug: "default" };
    const images = await renderCardSet(slides, cat, palette || "noir_orange", format || "instagram", resolveImageUrl(imageUrl));
    res.json({ images });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
