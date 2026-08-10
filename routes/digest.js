// Daily Digest route — extracted from server.js so digest issues can be
// found and fixed in one small file instead of hunting through 1600+ lines.
const express = require("express");
const router = express.Router();
const { parser, NICHE_BLOG_RSS } = require("../config/feeds");

router.get("/daily-digest", async (req, res) => {
  const niches = (req.query.niches || "").split(",").filter(Boolean);
  if (!niches.length) return res.json({ digest: null });
  const stories = [];
  for (const n of niches.slice(0, 5)) {
    try {
      // Use the full per-niche feed list (NICHE_BLOG_RSS) instead of the
      // old 6-entry NICHE_RSS map — that map fell back to a shared "default"
      // feed for most niches, causing identical headlines across categories.
      const matched = !!NICHE_BLOG_RSS[n];
      const feeds = NICHE_BLOG_RSS[n] || NICHE_BLOG_RSS.default;
      const rssUrl = feeds[Math.floor(Math.random() * feeds.length)];
      console.log(`[digest] niche="${n}" matched=${matched} url=${rssUrl}`); // TEMP diagnostic — remove after confirming fix
      const feed = await parser.parseURL(rssUrl);
      const items = (feed.items || []).slice(0, 2);
      items.forEach(item => stories.push({ niche: n, headline: item.title, url: item.link }));
    } catch (e) {
      console.log(`[digest] niche="${n}" ERROR: ${e.message}`); // TEMP diagnostic — remove after confirming fix
    }
  }
  // 2-hour bucket instead of a full day, so the digest is treated as "new"
  // again every 2 hours on the client (see cp_digest_seen_ key in core.js).
  const now = new Date();
  const bucketHour = Math.floor(now.getUTCHours() / 2) * 2;
  const bucket = `${now.toISOString().slice(0,10)}-${String(bucketHour).padStart(2,'0')}`;
  res.json({ digest: { date: bucket, stories } });
});

module.exports = router;
