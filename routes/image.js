// Image generation endpoint — kept separate from server.js so image issues
// can be found and fixed in one place. See services/imageGen.js for the
// actual provider logic and the note on why this stopped working.
const express = require("express");
const router = express.Router();
const rateLimit = (() => { try { return require("express-rate-limit"); } catch (e) { return null; } })();
const { generateOneImage } = require("../services/imageGen");

const imageLimiter = rateLimit
  ? rateLimit({ windowMs: 60 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { error: "Generation limit reached. Try again in an hour." } })
  : (req, res, next) => next();

router.post("/generate-image", imageLimiter, async (req, res) => {
  const { prompt, format, count } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  const n = Math.max(1, Math.min(5, parseInt(count) || 1));
  try {
    if (n === 1) {
      const image = await generateOneImage(prompt, format);
      return res.json({ image, format: format || "square" });
    }
    // parallel for carousel/multi
    const results = await Promise.allSettled(
      Array.from({ length: n }, (_, i) => generateOneImage(`${prompt} — slide ${i + 1} of ${n}`, format))
    );
    const images = results.filter(r => r.status === "fulfilled").map(r => r.value);
    if (!images.length) return res.status(500).json({ error: "All image models unavailable" });
    return res.json({ images, image: images[0], format: format || "square" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
