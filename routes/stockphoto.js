// Real photo search endpoint — see services/stockPhoto.js for the legal
// licensing note on what this can and can't return.
const express = require("express");
const router = express.Router();
const { searchRealPhotos } = require("../services/stockPhoto");

router.get("/stock-photo", async (req, res) => {
  try {
    const query = (req.query.query || "").toString();
    if (!query) return res.status(400).json({ error: "Missing query" });
    const count = Math.max(1, Math.min(12, parseInt(req.query.count) || 6));
    const photos = await searchRealPhotos(query, count);
    res.json({ photos });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

module.exports = router;
