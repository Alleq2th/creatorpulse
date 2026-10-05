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
//
// KEY RESOLUTION: either provider alone is enough — you do NOT need both. The
// key is read under any of its common spellings and trimmed, so a key stored
// under a slightly different name (or with a trailing newline pasted in) is
// still found. This mirrors the Groq alias handling: the owner had a valid key
// set on Render and the route still said "not configured" because the code
// read exactly one name.
const fetch = require("node-fetch");

// First non-blank value wins. Blank strings and whitespace-only values are
// treated as "not set", which is what a half-finished Render entry looks like.
function firstNonBlank(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (typeof v === "string" && v.trim()) return { value: v.trim(), name };
  }
  return null;
}

// Recognised spellings, in priority order. UNSPLASH_ACCESS_KEY is what
// .env.example and render.yaml document; the rest are the names people
// actually paste in (Unsplash calls it an "Access Key" in some places and an
// "API key" in others).
const UNSPLASH_NAMES = ["UNSPLASH_ACCESS_KEY", "UNSPLASH_API_KEY", "UNSPLASH_KEY", "UNSPLASH_CLIENT_ID"];
const PEXELS_NAMES = ["PEXELS_API_KEY", "PEXELS_KEY"];

// Resolved fresh on each call (not at module load) so a test — or a Render
// restart — that changes the environment is picked up without a stale cache.
function unsplashKey() { return firstNonBlank(...UNSPLASH_NAMES); }
function pexelsKey() { return firstNonBlank(...PEXELS_NAMES); }

// What the user should type on Render, named exactly, so the error is
// actionable rather than "no provider configured".
const UNSPLASH_HINT = "UNSPLASH_ACCESS_KEY";
const PEXELS_HINT = "PEXELS_API_KEY";

async function searchUnsplash(query, count) {
  const key = unsplashKey();
  if (!key) {
    const e = new Error(`No Unsplash key set. Add ${UNSPLASH_HINT} in Render -> your app -> Environment.`);
    e.code = "NO_KEY";
    e.provider = "unsplash";
    throw e;
  }
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${key.value}` } });
  if (!r.ok) {
    // 401/403 means the key reached Unsplash and was refused — a different
    // problem from "no key", and the user needs to be told which one it is.
    const e = new Error(
      r.status === 401 || r.status === 403
        ? `Unsplash rejected the key in ${key.name}. Check it is the Access Key (not the Secret Key) and was copied in full.`
        : `Unsplash returned ${r.status}.`
    );
    e.code = r.status === 401 || r.status === 403 ? "BAD_KEY" : "UPSTREAM";
    e.provider = "unsplash";
    e.status = r.status;
    throw e;
  }
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
  const key = pexelsKey();
  if (!key) {
    const e = new Error(`No Pexels key set. Add ${PEXELS_HINT} in Render -> your app -> Environment.`);
    e.code = "NO_KEY";
    e.provider = "pexels";
    throw e;
  }
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: key.value } });
  if (!r.ok) {
    const e = new Error(
      r.status === 401 || r.status === 403
        ? `Pexels rejected the key in ${key.name}.`
        : `Pexels returned ${r.status}.`
    );
    e.code = r.status === 401 || r.status === 403 ? "BAD_KEY" : "UPSTREAM";
    e.provider = "pexels";
    e.status = r.status;
    throw e;
  }
  const data = await r.json();
  return (data.photos || []).map(p => ({
    url: p.src.large,
    thumb: p.src.medium,
    credit: p.photographer || "Pexels",
    creditUrl: p.photographer_url || "https://pexels.com",
    source: "pexels"
  }));
}

// Try Unsplash first, then Pexels. Either alone is sufficient. If BOTH fail,
// return an EMPTY LIST rather than throwing: an empty list is a normal "no
// photo for this item" to every caller (the story-card and calendar code
// already treat a missing photo as "show the icon fallback"), whereas a thrown
// error turns into a 503 that the UI surfaces as a hard failure. An empty
// result is the graceful degradation; the reason is logged so it is not silent.
async function searchRealPhotos(query, count = 6) {
  const errors = [];
  for (const attempt of [searchUnsplash, searchPexels]) {
    try {
      // An empty array from a working provider is a legitimate "nothing found".
      return await attempt(query, count);
    } catch (e) {
      errors.push(e);
    }
  }
  const detail = errors.map(e => `${e.provider}: ${e.message}`).join(" | ");
  console.warn(`[stock-photo] no photos for "${query}" — ${detail}`);
  return [];
}

module.exports = { searchRealPhotos, unsplashKey, pexelsKey, UNSPLASH_NAMES, PEXELS_NAMES };
