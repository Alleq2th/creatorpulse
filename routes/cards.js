// Stat carousel card endpoint — see services/statCard.js for why this uses
// real SVG text rendering instead of AI image generation.
const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");

router.post("/generate-cards", async (req, res) => {
  try {
    const { slides, niche, palette, format } = req.body || {};
    if (!Array.isArray(slides) || !slides.length) return res.status(400).json({ error: "Missing slides array" });
    if (slides.length > 10) return res.status(400).json({ error: "Max 10 slides per set" });
    const images = await renderCardSet(slides, niche || "", palette || "default", format || "instagram");
    res.json({ images });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
