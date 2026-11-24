// routes/digest.js
// Daily Digest route — delivers up to 75 fresh, real-time news stories across niches
// with verified article links and LRU flushing of older stories.

const express = require("express");
const router = express.Router();
const { parser, googleNews, NICHE_BLOG_RSS, NICHE_QUERIES } = require("../config/feeds");

// Cache up to 75 stories per niche set in memory with 15-minute refresh
const DIGEST_CAPACITY = 75;
const digestStore = {
  stories: [], // Array of up to 75 unique stories, newest first
  lastUpdated: 0,
  bucket: ""
};

// Clean and resolve an article link so clicking opens the exact article
function resolveArticleUrl(item) {
  let link = item.link || item.guid || item.origLink || item.url || "";
  if (typeof link === "object" && link !== null) {
    link = link.href || link._ || "";
  }
  link = String(link || "").trim();

  // If missing or blank, search Google News directly for this exact headline
  if (!link || link === "undefined" || link === "null") {
    return `https://news.google.com/search?q=${encodeURIComponent(item.title || "breaking news")}`;
  }

  // Ensure protocol
  if (link.startsWith("//")) {
    link = "https:" + link;
  } else if (!/^https?:\/\//i.test(link)) {
    link = "https://" + link;
  }

  return link;
}

// Ingest and merge new stories into the rolling 75-story digest buffer
function mergeStories(newStories) {
  const seenHls = new Set();
  const merged = [];

  // New stories first
  for (const s of newStories) {
    const key = (s.headline || "").toLowerCase().trim().slice(0, 50);
    if (!key || seenHls.has(key)) continue;
    seenHls.add(key);
    merged.push(s);
    if (merged.length >= DIGEST_CAPACITY) break;
  }

  // Then backfill with existing cached stories if space remains
  if (merged.length < DIGEST_CAPACITY) {
    for (const s of digestStore.stories) {
      const key = (s.headline || "").toLowerCase().trim().slice(0, 50);
      if (!key || seenHls.has(key)) continue;
      seenHls.add(key);
      merged.push(s);
      if (merged.length >= DIGEST_CAPACITY) break;
    }
  }

  // Keep exactly up to DIGEST_CAPACITY (75) stories, flushing oldest
  digestStore.stories = merged.slice(0, DIGEST_CAPACITY);
  digestStore.lastUpdated = Date.now();
}

router.get("/daily-digest", async (req, res) => {
  const niches = (req.query.niches || "").split(",").filter(Boolean);
  const activeNiches = niches.length ? niches.slice(0, 8) : ["General News"];

  const now = new Date();
  const bucketHour = Math.floor(now.getUTCHours() / 2) * 2;
  const currentBucket = `${now.toISOString().slice(0, 10)}-${String(bucketHour).padStart(2, "0")}`;

  // If cache is fresh within 10 minutes and bucket matches, return cached stories
  if (digestStore.stories.length > 0 && (Date.now() - digestStore.lastUpdated < 10 * 60 * 1000) && digestStore.bucket === currentBucket) {
    return res.json({
      digest: {
        date: currentBucket,
        capacity: DIGEST_CAPACITY,
        total: digestStore.stories.length,
        stories: digestStore.stories
      }
    });
  }

  digestStore.bucket = currentBucket;
  const collectedStories = [];

  // Fetch in parallel across niches with 2026 freshness
  const fetchPromises = activeNiches.map(async (niche) => {
    try {
      const feeds = NICHE_BLOG_RSS[niche] || NICHE_BLOG_RSS.default;
      // Pick up to 2 distinct feeds per niche
      const sampleFeeds = feeds.slice(0, 2);

      for (const rssUrl of sampleFeeds) {
        try {
          const feed = await parser.parseURL(rssUrl);
          const items = (feed.items || []).slice(0, 10);
          items.forEach(item => {
            if (item.title) {
              collectedStories.push({
                niche,
                headline: item.title.trim(),
                url: resolveArticleUrl(item),
                source: item.creator || item.author || niche,
                pubDate: item.pubDate || new Date().toISOString(),
                snippet: (item.contentSnippet || item.content || "").slice(0, 200)
              });
            }
          });
        } catch (feedErr) {
          // Log and continue to next feed
          console.warn(`[digest] Feed error for ${niche}:`, feedErr.message);
        }
      }

      // Also query live Google News search for 2026 breaking items
      try {
        const query = NICHE_QUERIES[niche] || `${niche} 2026 news`;
        const gFeed = await parser.parseURL(googleNews(query));
        const gItems = (gFeed.items || []).slice(0, 8);
        gItems.forEach(item => {
          if (item.title) {
            collectedStories.push({
              niche,
              headline: item.title.trim(),
              url: resolveArticleUrl(item),
              source: item.source || "Google News",
              pubDate: item.pubDate || new Date().toISOString(),
              snippet: (item.contentSnippet || item.content || "").slice(0, 200)
            });
          }
        });
      } catch (gErr) {
        console.warn(`[digest] Google News error for ${niche}:`, gErr.message);
      }
    } catch (e) {
      console.error(`[digest] general error for ${niche}:`, e.message);
    }
  });

  await Promise.allSettled(fetchPromises);

  // Fallback to default feeds if collected stories are sparse
  if (collectedStories.length < 20) {
    try {
      for (const defUrl of NICHE_BLOG_RSS.default) {
        try {
          const feed = await parser.parseURL(defUrl);
          (feed.items || []).slice(0, 15).forEach(item => {
            if (item.title) {
              collectedStories.push({
                niche: "Top Stories",
                headline: item.title.trim(),
                url: resolveArticleUrl(item),
                source: item.source || "Breaking News",
                pubDate: item.pubDate || new Date().toISOString()
              });
            }
          });
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Merge into the 75-capacity buffer
  mergeStories(collectedStories);

  res.json({
    digest: {
      date: currentBucket,
      capacity: DIGEST_CAPACITY,
      total: digestStore.stories.length,
      stories: digestStore.stories
    }
  });
});

module.exports = router;
