/* CreatorPulse - the "Why this score?" affordance and panel.
 *
 * Spec Part 5.4, last line:
 *
 *   "If the product already provides an explanation of how the score should
 *    be interpreted, make that information accessible without cluttering
 *    the interface."
 *
 * Two constraints came out of that sentence, and they pull against each other:
 *
 *   ACCESSIBLE      -> a visible, tappable control, not a tooltip or a
 *                      long-press. 15.3 also forbids small targets.
 *   NOT CLUTTERING  -> collapsed by default, one short line when shut, and
 *                      it must not push the story's real actions down.
 *
 * The compromise: a single small text button sitting right under the existing
 * progress bar, inside the block that already exists. Closed it adds ~18px.
 * Open it reveals the arithmetic and the factor list, then disappears again on
 * the next tap.
 *
 * This file is pure markup - it imports the numbers from
 * lib/opportunityScore.js and never recomputes them. That is what stops the
 * big number and the explanation from drifting apart.
 *
 * Loaded AFTER lib/opportunityScore.js, BEFORE core.js.
 */
(function () {
  "use strict";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // The score implementation lives in lib/opportunityScore.js, which loads
  // first and attaches itself to `window` in the browser. Under Node there is
  // no `window`, so these two resolvers fall back to requiring the sibling
  // file. That is what lets the tests exercise this real markup function
  // instead of asserting against a copy of its text - and it is why the
  // panel is now rendered identically in both environments.
  //
  // Both are lazy and guarded: if the score file genuinely failed to load,
  // the caller gets null and degrades to the plain score markup rather than
  // throwing, which is the freeze class this codebase already fixed twice.
  // NOTE: both branches MUST return the same key names. An earlier version
  // returned {score, breakdown} here and the real Node module there, so the
  // lookup below found the function under Node and silently got undefined in
  // the browser - tests green, panel missing on the phone. One shape, always.
  function scoreModule() {
    if (typeof window !== "undefined" && window.cpOpportunityScore) {
      return {
        cpOpportunityScore: window.cpOpportunityScore,
        cpOpportunityBreakdown: window.cpOpportunityBreakdown
      };
    }
    if (typeof module !== "undefined" && module.exports) {
      try { return require("./opportunityScore.js"); } catch (_) { return null; }
    }
    return null;
  }

  function scoreOf(story, now) {
    var m = scoreModule();
    if (!m || typeof m.cpOpportunityScore !== "function") return null;
    return m.cpOpportunityScore(story, now);
  }

  function breakdownOf(story, now) {
    var m = scoreModule();
    if (m && typeof m.cpOpportunityBreakdown === "function") {
      return m.cpOpportunityBreakdown(story, now);
    }
    return null;
  }

  // Each factor renders as one row: label, value, and - when open - a plain
  // sentence about where that value came from. Missing inputs get a marker so
  // they are visibly different from real ones.
  function factorRow(f) {
    var mark = f.state === "real" ? "" : '<span class="oppw-flag">not available</span>';
    return '<li class="oppw-row oppw-' + esc(f.state) + '">' +
      '<span class="oppw-k">' + esc(f.label) + '</span>' +
      '<span class="oppw-v">' + esc(f.value) + mark + '</span>' +
      '<span class="oppw-n">' + esc(f.note) + '</span>' +
      '</li>';
  }

  function missingRow(m) {
    return '<li class="oppw-row oppw-missing">' +
      '<span class="oppw-k">' + esc(m.label) + '</span>' +
      '<span class="oppw-v"><span class="oppw-flag">not available</span></span>' +
      '<span class="oppw-n">' + esc(m.note) + '</span>' +
      '</li>';
  }

  /**
   * The opportunity block for an expanded story card: the score, the bar, the
   * "Why this score?" control, and - when open - the explanation.
   *
   * @param {object} story   the feed item
   * @param {object} [opts]  { open:boolean, now:number, bar:boolean }
   */
  function cpOpportunityMarkup(story, opts) {
    opts = opts || {};
    var open = !!opts.open;
    var tid = String((story && story.id) || "");
    var score = typeof opts.score === "number" ? opts.score : scoreOf(story, opts.now);
    // If neither the caller nor the score module supplied a number, show the
    // honest floor rather than the string "null" in the middle of the card.
    if (typeof score !== "number" || !isFinite(score)) score = 0;
    var b = breakdownOf(story, opts.now);

    var head =
      '<div class="opp-head">' +
        '<span class="opp-lbl">Opportunity estimate</span>' +
        '<span class="opp-val">' + esc(score) + '/100</span>' +
      '</div>' +
      '<div class="opp-bar" role="img" aria-label="Opportunity estimate ' + esc(score) + ' out of 100">' +
        '<div class="opp-fill" style="width:' + esc(Math.max(0, Math.min(100, score))) + '%"></div>' +
      '</div>';

    var button =
      '<button type="button" class="oppw-toggle" aria-expanded="' + (open ? "true" : "false") + '" ' +
      'aria-controls="oppw-' + esc(tid) + '" ' +
      'onclick="toggleOppWhy(\'' + esc(tid) + '\')">' +
        (open ? "Hide why" : "Why this score?") +
      '</button>';

    if (!open || !b) {
      return '<div class="opp" aria-label="Heuristic opportunity estimate, not a forecast">' +
        head + button + '</div>';
    }

    var arithmetic =
      '<div class="oppw-math">' +
        '<span class="oppw-math-l">How it adds up</span>' +
        '<code>0.6 &times; ' + esc(Math.round(b.storyStrength)) +
        ' + (' + esc(b.timingAdjustment >= 0 ? "+" : "\u2212") + esc(Math.abs(b.timingAdjustment)) + ')' +
        ' + ' + esc(b.base) +
        ' = ' + esc(Math.round(b.raw)) + '</code>' +
        (b.clamped
          ? '<span class="oppw-clamp">Held at the ' + esc(b.clamped === "min" ? "floor" : "ceiling") +
            ' of ' + esc(b.clamped === "min" ? b.limits.min : b.limits.max) + '.</span>'
          : "") +
      '</div>';

    var body =
      '<div class="oppw" id="oppw-' + esc(tid) + '">' +
        arithmetic +
        '<ul class="oppw-list">' +
          b.factors.map(factorRow).join("") +
        '</ul>' +
        '<div class="oppw-sec">What the app does not receive</div>' +
        '<ul class="oppw-list">' + b.missing.map(missingRow).join("") + '</ul>' +
        '<p class="oppw-foot">A rule-based estimate, not a forecast of views. ' +
        'Higher means the app thinks this story is more worth covering right now.</p>' +
      '</div>';

    return '<div class="opp opp-is-open" aria-label="Heuristic opportunity estimate, not a forecast">' +
      head + button + body + '</div>';
  }

  var api = { cpOpportunityMarkup: cpOpportunityMarkup };

  if (typeof window !== "undefined") window.cpOpportunityMarkup = cpOpportunityMarkup;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
