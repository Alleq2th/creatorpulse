// Regression test: a stale events cache must not be trusted forever.
//
// Why this test exists: the owner reported "still no pictures at all" on the
// Calendar even after the backend was fixed and proven healthy. The server was
// returning fresh events WITH an `importance` field, and /api/stock-photo was
// returning real Unsplash photos. The browser was the problem:
//
//   loadCalendarEvents() only refetched a niche when its cache was EMPTY:
//       if(!S.eventsCache[n]){ ... fetch ... }
//
//   The cache is written to localStorage and never expires, so a browser that
//   had loaded the app once kept rendering that first snapshot forever. The
//   owner's screenshot showed event titles that only exist in OLD commits
//   ("NBA regular season tip-off", "NBA Christmas Day slate") - proof the page
//   was drawing a months-old cache, not the live data. Those old events had no
//   `importance`, so every row fell through to the icon tile and no photo was
//   ever requested.
//
// The fix has three parts, each asserted below:
//   1. CACHE_VERSION - a cache written by an older version is discarded.
//   2. EVENTS_TTL_MS - a present-but-old cache is refetched anyway.
//   3. wantsPhoto   - every niche event is eligible for a photo, not only the
//                     "major"/"relevant" ones (in several niches ALL events are
//                     "seasonal", so the old filter left whole niches blank).
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CORE = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");

test("the cache carries a version, so an old cache can be detected", () => {
  assert.match(CORE, /const CACHE_VERSION\s*=\s*\d+/, "CACHE_VERSION must be defined");
  assert.match(
    CORE,
    /const payload\s*=\s*\{\s*_v:\s*CACHE_VERSION\s*\}/,
    "saveCaches must stamp the version into the payload"
  );
});

test("a cache written by an older version drops the events cache", () => {
  // The version check must exist AND must specifically skip eventsCache, so a
  // browser holding pre-`importance` events refetches instead of rendering them.
  assert.match(CORE, /const stale\s*=\s*data\._v\s*!==\s*CACHE_VERSION/, "restoreCaches must compare versions");
  assert.match(
    CORE,
    /if\(stale\s*&&\s*f\s*===\s*"eventsCache"\)\s*return/,
    "a stale cache must skip eventsCache so it is refetched"
  );
});

test("a present-but-old events cache is refetched, not trusted forever", () => {
  assert.match(CORE, /const EVENTS_TTL_MS\s*=\s*[0-9]/, "EVENTS_TTL_MS must be defined");
  assert.match(CORE, /function markEventsAt\(/, "markEventsAt must record when a niche was fetched");
  // The old bug was `if(!S.eventsCache[n])` - fetch only when EMPTY. The new
  // code must decide on freshness, not mere presence.
  assert.match(
    CORE,
    /const fresh\s*=\s*cached\s*&&\s*\(Date\.now\(\)\s*-\s*\(at\[n\]\s*\|\|\s*0\)\s*<\s*EVENTS_TTL_MS\)/,
    "loadCalendarEvents must refetch when the cached list is stale"
  );
  assert.doesNotMatch(
    CORE,
    /if\(!S\.eventsCache\[n\]\)\{\s*try\s*\{\s*cacheSet\("eventsCache"/,
    "the old fetch-only-when-empty condition must be gone"
  );
});

test("a transient empty response never wipes a good events cache", () => {
  assert.match(
    CORE,
    /if\(Array\.isArray\(evs\)\s*&&\s*\(evs\.length\s*\|\|\s*!cached\)\)/,
    "an empty/error result must not overwrite a populated cache"
  );
});

test("every niche event is eligible for a photo, not only major/relevant", () => {
  assert.match(CORE, /const wantsPhoto\s*=\s*!isPost;/, "wantsPhoto must not filter by importance");
  assert.doesNotMatch(
    CORE,
    /const wantsPhoto\s*=\s*!isPost\s*&&\s*\(isMajor/,
    "the old importance filter must be gone"
  );
});

test("the asset cache-bust version was bumped so browsers pick up the new core.js", () => {
  const INDEX = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const m = /core\.js\?v=(\d+)/.exec(INDEX);
  assert.ok(m, "index.html must load core.js with a ?v= cache-bust");
  assert.ok(Number(m[1]) >= 22, `core.js cache-bust must be >= 22, got ${m[1]}`);
});
