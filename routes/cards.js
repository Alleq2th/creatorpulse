const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");
const { findLiveImage, fetchWikipediaKnowledge } = require("../services/liveIntelligence");

let activeGenerations = 0;
const MAX_CONCURRENT_GENERATIONS = 3;

function buildDefaultPulseSlides(topic, format, wikiData, imageInfo) {
  const isTikTok = String(format).toLowerCase().includes("tiktok") || String(format).toLowerCase().includes("9:16");
  const clean = (topic || "Trending Breakdown").replace(/^(generate|make|create|turn into|change this into|an|a|stat card for|instagram post for|tiktok post for)\s*/i, "").trim();
  let headline = clean.toUpperCase();
  if (headline.length > 40) {
    const trimmed = headline.slice(0, 40);
    const lastSpace = trimmed.lastIndexOf(" ");
    headline = lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed;
  }

  if (isTikTok) {
    return [
      {
        type: "hook",
        headline,
        supportingText: wikiData?.extract?.slice(0, 140) || "The dilemma breakdown everyone is talking about. Here are the numbers and reality.",
        slideNumber: 1,
        totalSlides: 1,
        imageUrl: imageInfo?.url || null
      }
    ];
  }

  return [
    {
      type: "hook",
      headline,
      supportingText: wikiData?.extract?.slice(0, 140) || "The untold dilemma, key data, and controversy everyone is debating right now.",
      slideNumber: 1,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    },
    {
      type: "body",
      headline: "THE CORE DILEMMA",
      sectionLabel: "THE CONTRAST",
      compareA: { label: "PERCEPTION", value: "90%" },
      compareB: { label: "REALITY", value: "10X" },
      comparisonNote: "Conventional wisdom misses the underlying shift completely.",
      slideNumber: 2,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    },
    {
      type: "body",
      headline: "THE KEY NUMBERS",
      sectionLabel: "TACTICAL BREAKDOWN",
      stat: "84%",
      statLabel: "OF THE OUTCOME IS DECIDED IN PHASE 1",
      body: wikiData?.extract ? wikiData.extract.slice(0, 160) : "When you break down the actual metrics, the outcome is rarely an accident.",
      slideNumber: 3,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    },
    {
      type: "outro",
      headline: "WHICH SIDE ARE YOU ON?",
      supportingText: "Save this post and comment your unfiltered thoughts below.",
      slideNumber: 4,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    }
  ];
}

router.post("/generate-cards", async (req, res) => {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return res.status(503).json({ error: "Server is a little busy right now — please try again in a few seconds." });
  }
  activeGenerations++;
  try {
    const { slides, category, palette, format, imageUrl, theme, typography, density, focalPoint, brand } = req.body;
    if (!Array.isArray(slides) || !slides.length) return res.status(400).json({ error: "slides required" });
    const capped = slides.slice(0, 10);
    let fallbackImageUrl = null;
    if (!imageUrl) {
      const topic = slides[0]?.headline || (typeof category === "string" ? category : category?.name) || "trending news";
      const niche = typeof category === "string" ? category : (category?.name || "");
      try {
        const imageInfo = await findLiveImage(topic, niche);
        if (imageInfo?.url) fallbackImageUrl = imageInfo.url;
      } catch (e) {
        console.warn("[generate-cards] live image fallback failed:", e.message);
      }
    }
    {
      const imageUrl = fallbackImageUrl || req.body.imageUrl;
      const images = await renderCardSet(capped, category, palette, format, imageUrl, { theme, typography, density, focalPoint, brand });
      res.json({ images });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    activeGenerations--;
  }
});

router.post("/pulse-ai-stat-card", async (req, res) => {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return res.status(503).json({ error: "Server is a little busy right now — please try again in a few seconds." });
  }
  activeGenerations++;
  try {
    let { topic = "Trending Topic", format = "instagram", palette = "noir_orange", category, slides, imageUrl, niche, theme, typography, density, focalPoint, brand } = req.body || {};
    
    // Resolve live image if not supplied
    let imageInfo = null;
    if (!imageUrl) {
      imageInfo = await findLiveImage(topic, niche || category?.displayName || "");
      if (imageInfo?.url) {
        imageUrl = imageInfo.url;
      }
    }

    // Resolve Wikipedia context if slides not provided
    let wikiData = null;
    if (!slides || !slides.length) {
      wikiData = await fetchWikipediaKnowledge(topic);
      slides = buildDefaultPulseSlides(topic, format, wikiData, imageInfo);
    }

    const catObj = typeof category === "string" ? { displayName: category, slug: "default" } : (category || { displayName: topic.slice(0, 24), slug: "default" });
    const images = await renderCardSet(slides, catObj, palette, format, imageUrl, { theme, typography, density, focalPoint, brand, palette });

    res.json({
      success: true,
      images,
      slides,
      format,
      palette,
      category: catObj,
      imageUrl,
      imageCredit: imageInfo?.credit || (imageUrl ? "Verified Live Photo" : null),
      topic
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    activeGenerations--;
  }
});

module.exports = router;
// Exported so server.js can reuse the same default-slide builder instead of
// calling a function that was never defined (that mismatch made
// POST /api/pulse-ai/stat-card throw "buildDefaultStatCardSlides is not
// defined" and return a 500).
module.exports.buildDefaultPulseSlides = buildDefaultPulseSlides;
