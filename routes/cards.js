const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");

// Global concurrency limiter — this is the piece the per-request batching
// fix (in statCard.js) didn't cover. That fix only bounds how many images
// process at once WITHIN one person's request. It does nothing to stop
// several different users from all hitting "generate" in the same few
// seconds — that pile-up across requests is what actually crashes a small
// server. This caps how many generate-cards requests run AT THE SAME TIME,
// server-wide, no matter who they're from. A request that arrives while
// the server is already at capacity gets a fast, friendly "busy, try
// again" response instead of piling on top of the ones already running.
let activeGenerations = 0;
const MAX_CONCURRENT_GENERATIONS = 3;

router.post("/generate-cards", async (req, res) => {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return res.status(503).json({ error: "Server is a little busy right now — please try again in a few seconds." });
  }
  activeGenerations++;
  try {
    const { slides, category, palette, format, imageUrl } = req.body;
    if (!Array.isArray(slides) || !slides.length) return res.status(400).json({ error: "slides required" });
    const capped = slides.slice(0, 10);
    const images = await renderCardSet(capped, category, palette, format, imageUrl);
    res.json({ images });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    activeGenerations--;
  }
});

module.exports = router;
