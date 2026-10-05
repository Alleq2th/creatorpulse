// Real photo search endpoint — see services/stockPhoto.js for the legal
// licensing note on what this can and can't return.
//
// EITHER provider alone is enough. A missing Pexels key must NOT stop Unsplash
// from working, and a missing key entirely must NOT be a hard 503 failure for
// a purely cosmetic thumbnail — it returns an empty list with a clear note, so
// the calendar/story UI falls back to its icon tile instead of looking broken.
const express = require("express");
const router = express.Router();
const { searchRealPhotos, unsplashKey, pexelsKey } = require("../services/stockPhoto");

router.get("/stock-photo", async (req, res) => {
  try {
    const query = (req.query.query || "").toString();
    if (!query) return res.status(400).json({ error: "Missing query" });
    const count = Math.max(1, Math.min(12, parseInt(req.query.count) || 6));

    // No key at all: not an error, just nothing to show. Tell the caller why.
    if (!unsplashKey() && !pexelsKey()) {
      return res.json({
        photos: [],
        note: "No photo provider configured. Add UNSPLASH_ACCESS_KEY (or PEXELS_API_KEY) in Render -> your app -> Environment.",
      });
    }

    const photos = await searchRealPhotos(query, count);
    res.json({ photos });
  } catch (e) {
    // searchRealPhotos already degrades to [] — reaching here means something
    // genuinely unexpected. Still avoid a bare 503 with no context.
    res.status(503).json({ error: e.message, photos: [] });
  }
});

// Lets the client (and a human) see at a glance which provider is live without
// reading the server log. No key values are ever returned — only whether one
// is present and which spelling was found.
router.get("/stock-photo/status", (_req, res) => {
  const u = unsplashKey();
  const p = pexelsKey();
  res.json({
    unsplash: !!u,
    pexels: !!p,
    usable: !!(u || p),
    unsplashVar: u ? u.name : null,
    pexelsVar: p ? p.name : null,
  });
});

module.exports = router;
