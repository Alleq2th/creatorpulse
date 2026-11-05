/* CreatorPulse · Generation timing budget.
 *
 * The user's rule is explicit and non-negotiable:
 *   1 image                ->  5 seconds
 *   up to 5 images         -> 10 seconds
 *   more than 5 images     -> 15 seconds
 *
 * This module states that rule once, turns it into per-slide deadlines, and
 * gives the renderer a way to decide whether a slide still has time for a slow
 * remote photo fetch. Both the browser and the server read the same numbers, so
 * "did we hit the budget" is a measurable claim rather than an impression.
 *
 * Pure — no timers, no network — so it is unit-testable.
 */

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPGenerationBudget = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var TIERS = [
    { maxImages: 1, budgetMs: 5000 },
    { maxImages: 5, budgetMs: 10000 },
    { maxImages: Infinity, budgetMs: 15000 }
  ];

  /* The whole-run budget for N images, in milliseconds. */
  function budgetMs(imageCount) {
    var n = Math.max(1, Math.round(Number(imageCount) || 1));
    for (var i = 0; i < TIERS.length; i++) {
      if (n <= TIERS[i].maxImages) return TIERS[i].budgetMs;
    }
    return TIERS[TIERS.length - 1].budgetMs;
  }

  /* How long one slide may take. Slides render in parallel, so the per-slide
   * allowance is close to the whole budget, minus a safety margin for the
   * request round-trip and the final paint. */
  function perSlideMs(imageCount) {
    return Math.max(1200, budgetMs(imageCount) - 900);
  }

  /* Timeout for fetching the article photo. If the cover has not arrived by
   * this point we fall back to the template's own gradient background, which
   * still looks deliberate — better than blowing the budget waiting. */
  function coverFetchMs(imageCount) {
    return Math.max(800, Math.min(3000, Math.round(budgetMs(imageCount) * 0.35)));
  }

  /* How long the browser will wait for the server's rendered images before it
   * paints its own local cards instead of showing an empty box. */
  function serverWaitMs(imageCount) {
    return Math.max(1500, Math.min(9000, Math.round(budgetMs(imageCount) * 0.6)));
  }

  /* How many slides may render at once. Higher for bigger carousels so a
   * 6-slide post still fits in 15s, but always bounded so a small Render
   * instance cannot be pushed into an out-of-memory restart. */
  function concurrency(imageCount) {
    var n = Math.max(1, Math.round(Number(imageCount) || 1));
    if (n <= 1) return 1;
    if (n <= 5) return 3;
    return 4;
  }

  function withinBudget(imageCount, elapsedMs) {
    return Number(elapsedMs) <= budgetMs(imageCount);
  }

  /* A human-readable line for logs and the report, e.g. "3 slides · 980ms / 10000ms". */
  function describe(imageCount, elapsedMs) {
    var n = Math.max(1, Math.round(Number(imageCount) || 1));
    return n + ' slide' + (n === 1 ? '' : 's') + ' \u00b7 ' + Math.round(Number(elapsedMs) || 0) + 'ms / ' + budgetMs(n) + 'ms';
  }

  return {
    TIERS: TIERS,
    budgetMs: budgetMs,
    perSlideMs: perSlideMs,
    coverFetchMs: coverFetchMs,
    serverWaitMs: serverWaitMs,
    concurrency: concurrency,
    withinBudget: withinBudget,
    describe: describe
  };
});
