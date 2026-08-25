// Stat carousel card endpoint — see services/statCard.js for why this uses
// real SVG text rendering instead of AI image generation.
const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");

// The frontend may hand us either a raw image URL (from a news/blog RSS
// item) or one already routed through our own /api/image-proxy (Twitter
// images always get proxied client-side for CORS reasons). Either way we
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
    const { slides, niche, palette, format, imageUrl } = req.body || {};
    if (!Array.isArray(slides) || !slides.length) return res.status(400).json({ error: "Missing slides array" });
    if (slides.length > 10) return res.status(400).json({ error: "Max 10 slides per set" });
    const images = await renderCardSet(slides, niche || "", palette || "noir", format || "instagram", resolveImageUrl(imageUrl));
    res.json({ images });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
