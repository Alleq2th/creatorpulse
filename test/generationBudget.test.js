// Tests for the generation timing budget and the shared cover-photo cache.
//
// The user's rule, stated once and enforced everywhere:
//   1 image            ->  5 seconds
//   up to 5 images     -> 10 seconds
//   more than 5 images -> 15 seconds
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const budget = require("../public/lib/generationBudget.js");
const coverCache = require("../services/coverCache.js");
const statCard = require("../services/statCard.js");

const statCardSrc = fs.readFileSync(path.join(__dirname, "..", "services", "statCard.js"), "utf8");
const coreSrc = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");

test("the three budget tiers are exactly 5s / 10s / 15s", () => {
  assert.strictEqual(budget.budgetMs(1), 5000);
  assert.strictEqual(budget.budgetMs(2), 10000);
  assert.strictEqual(budget.budgetMs(5), 10000);
  assert.strictEqual(budget.budgetMs(6), 15000);
  assert.strictEqual(budget.budgetMs(10), 15000);
});

test("the budget is monotonic and never below the smallest tier", () => {
  let prev = 0;
  for (let n = 1; n <= 12; n++) {
    const b = budget.budgetMs(n);
    assert.ok(b >= prev, `budget must not shrink as slides are added (n=${n})`);
    assert.ok(b >= 5000, `budget must never be below 5s (n=${n})`);
    prev = b;
  }
});

test("a nonsense slide count still yields a real budget", () => {
  assert.strictEqual(budget.budgetMs(0), 5000);
  assert.strictEqual(budget.budgetMs(-3), 5000);
  assert.strictEqual(budget.budgetMs(undefined), 5000);
  assert.strictEqual(budget.budgetMs("4"), 10000);
});

test("per-slide and cover-fetch allowances stay inside the whole-run budget", () => {
  for (const n of [1, 3, 5, 6, 10]) {
    assert.ok(budget.perSlideMs(n) <= budget.budgetMs(n), `per-slide allowance must fit the budget (n=${n})`);
    assert.ok(budget.coverFetchMs(n) <= budget.budgetMs(n), `cover fetch must fit the budget (n=${n})`);
    assert.ok(budget.serverWaitMs(n) <= budget.budgetMs(n), `server wait must fit the budget (n=${n})`);
  }
});

test("concurrency rises with the carousel but stays bounded", () => {
  assert.strictEqual(budget.concurrency(1), 1);
  assert.strictEqual(budget.concurrency(3), 3);
  assert.strictEqual(budget.concurrency(6), 4);
  assert.ok(budget.concurrency(50) <= 4, "concurrency must stay bounded to protect a small instance");
});

test("withinBudget reports honestly on both sides of the line", () => {
  assert.strictEqual(budget.withinBudget(1, 4999), true);
  assert.strictEqual(budget.withinBudget(1, 5001), false);
  assert.strictEqual(budget.withinBudget(6, 14999), true);
  assert.strictEqual(budget.withinBudget(6, 15001), false);
});

test("the cover cache keys on url, size and focal point", () => {
  const a = coverCache.keyFor("https://x/a.jpg", 1080, 1350, null);
  const b = coverCache.keyFor("https://x/a.jpg", 1080, 1350, null);
  const c = coverCache.keyFor("https://x/a.jpg", 1080, 1350, { x: 0.2, y: 0.8 });
  const d = coverCache.keyFor("https://x/b.jpg", 1080, 1350, null);
  assert.strictEqual(a, b, "the same request must hit the same cache entry");
  assert.notStrictEqual(a, c, "a different focal point is a different crop");
  assert.notStrictEqual(a, d, "a different url is a different entry");
});

test("the cover cache returns null for a missing url instead of throwing", async () => {
  assert.strictEqual(await coverCache.loadCover(null, 100, 100), null);
  assert.strictEqual(await coverCache.loadCover("", 100, 100), null);
});

test("the renderer fetches the cover photo once per carousel, not once per slide", () => {
  // The old code called fetchCoverImage inside renderStatCard, so a 6-slide
  // carousel downloaded and decoded the same photo six times.
  assert.match(statCardSrc, /coverCache\.loadCover\(photoUrl/);
  assert.doesNotMatch(
    statCardSrc,
    /if \(!cover && photoUrl\) cover = await fetchCoverImage\(/,
    "renderStatCard must not fetch the cover directly any more"
  );
});

test("the renderer runs slides concurrently instead of strictly one at a time", () => {
  assert.match(statCardSrc, /const CARD_RENDER_CONCURRENCY = 3;/);
  assert.match(statCardSrc, /async function mapWithConcurrency\(items, limit, worker\)/);
  assert.match(statCardSrc, /budget\.concurrency\(total\)/);
});

test("mapWithConcurrency preserves order and respects the limit", async () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  let inFlight = 0;
  let peak = 0;
  const out = await statCard.mapWithConcurrency(items, 3, async (n) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise(r => setTimeout(r, 5));
    inFlight--;
    return n * 2;
  });
  assert.deepStrictEqual(out, [2, 4, 6, 8, 10, 12, 14], "results must come back in input order");
  assert.ok(peak <= 3, `at most 3 workers may run at once, saw ${peak}`);
});

test("the browser enforces the budget on the request itself", () => {
  assert.match(coreSrc, /window\.CPGenerationBudget\.budgetMs\(n\)/);
  assert.match(coreSrc, /timeoutMs\}/);
  assert.match(coreSrc, /const timeoutMs = Number\(opts && opts\.timeoutMs\) \|\| 60000;/);
});

test("the budget module runs in both Node and the browser (dual export)", () => {
  assert.ok(typeof budget.budgetMs === "function");
  const src = fs.readFileSync(path.join(__dirname, "..", "public", "lib", "generationBudget.js"), "utf8");
  assert.match(src, /root\.CPGenerationBudget = api/);
  assert.match(src, /module\.exports = api/);
});
