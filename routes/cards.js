const express = require("express");
const router = express.Router();
const { renderCardSet } = require("../services/statCard");
const { findLiveImage, fetchWikipediaKnowledge } = require("../services/liveIntelligence");

let activeGenerations = 0;
const MAX_CONCURRENT_GENERATIONS = 3;

function buildDefaultPulseSlides(topic, format, wikiData, imageInfo) {
  const isTikTok = String(format).toLowerCase().includes("tiktok") || String(format).toLowerCase().includes("9:16");
  const clean = (topic || "Trending Breakdown").replace(/^(generate|make|create|turn into|change this into|an|a|stat card for|instagram post for|tiktok post for)\s*/i, "").trim();
  const headline = clean.toUpperCase().slice(0, 36);

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
      headline: headline.length > 26 ? headline.slice(0, 26) : headline,
      supportingText: wikiData?.extract?.slice(0, 130) || "The untold dilemma, key data, and controversy everyone is debating right now.",
      slideNumber: 1,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    },
    {
      type: "body",
      headline: "THE CORE DILEMMA",
      compareA: { label: "TRADITIONAL MODEL", value: "90%" },
      compareB: { label: "NEW REALITY", value: "10X" },
      comparisonNote: "Conventional wisdom misses the underlying shift completely.",
      claim: "Most view this as a standard situation.",
      reaction: "The data shows a massive divide between perception and reality.",
      reactionTag: "MAJOR DILEMMA",
      slideNumber: 2,
      totalSlides: 4,
      imageUrl: imageInfo?.url || null
    },
    {
      type: "body",
      headline: "THE NUMBERS THAT MATTER",
      stat: "84%",
      statLabel: "OF THE OUTCOME IS DECIDED IN PHASE 1",
      body: wikiData?.extract ? wikiData.extract.slice(0, 220) : "When you break down the actual metrics, the outcome is rarely an accident.",
      sectionLabel: "TACTICAL BREAKDOWN",
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

router.post("/pulse-ai-stat-card", async (req, res) => {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return res.status(503).json({ error: "Server is a little busy right now — please try again in a few seconds." });
  }
  activeGenerations++;
  try {
    let { topic = "Trending Topic", format = "instagram", palette = "noir_orange", category, slides, imageUrl, niche } = req.body || {};
    
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
    const images = await renderCardSet(slides, catObj, palette, format, imageUrl);

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
