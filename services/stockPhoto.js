// Real photo search — Unsplash primary, Pexels fallback. Both are free,
// legally licensed for commercial use, and require a free API key.
//
// IMPORTANT LIMITATION, read before wiring this into a feature: these are
// general stock photo libraries, not sports/news archives. You will get real,
// legal, relevant-ish photography (e.g. "footballer silhouette", "stadium
// lights", "press conference microphone") — you will NOT get an actual photo
// of a specific real player or a specific real match. Scraping the web for
// photos of a specific real person/event and reposting them in monetized
// content is a real copyright/licensing risk (most press photography is
// licensed, not public domain) — that's why this doesn't do that.
const fetch = require("node-fetch");

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

async function searchUnsplash(query, count) {
  if (!UNSPLASH_KEY) throw new Error("no unsplash key");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!r.ok) throw new Error("unsplash " + r.status);
  const data = await r.json();
  return (data.results || []).map(p => ({
    url: p.urls.regular,
    thumb: p.urls.thumb,
    credit: p.user?.name || "Unsplash",
    creditUrl: p.user?.links?.html || "https://unsplash.com",
    source: "unsplash"
  }));
}

async function searchPexels(query, count) {
  if (!PEXELS_KEY) throw new Error("no pexels key");
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!r.ok) throw new Error("pexels " + r.status);
  const data = await r.json();
  return (data.photos || []).map(p => ({
    url: p.src.large,
    thumb: p.src.medium,
    credit: p.photographer || "Pexels",
    creditUrl: p.photographer_url || "https://pexels.com",
    source: "pexels"
  }));
}

async function searchRealPhotos(query, count = 6) {
  try { return await searchUnsplash(query, count); }
  catch (e1) {
    try { return await searchPexels(query, count); }
    catch (e2) { throw new Error("No photo provider configured or available: " + e1.message); }
  }
}

module.exports = { searchRealPhotos };
