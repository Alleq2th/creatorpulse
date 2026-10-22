/* CreatorPulse - the "Suggested window" estimate, and what to do when there
 * isn't one.
 *
 * THE PROBLEM THIS FILE SOLVES
 * ---------------------------
 * Spec Part 5.3 says three things about this label, and they pulled in
 * different directions:
 *
 *   "If the calculation fails, show a meaningful fallback or error state."
 *   "Never leave a loading label visible indefinitely."
 *   "Do not fabricate a posting time to make the interface look complete."
 *
 * The previous fix covered the second one: the label is now painted on the
 * first frame instead of waiting up to 30 seconds for a timer. But when a story
 * genuinely has no usable timestamp, the label degraded to the static text
 * "No window estimate" - a true statement with nothing to do about it. That is
 * not an error *state*; it is a dead end.
 *
 * So this file holds the two pieces that make the fallback actionable:
 *
 *   1. cpWindowTarget()      - the ONE place the window is computed, so the
 *                              first paint and the retry button can never
 *                              disagree about what the number is.
 *   2. cpWindowRetryMarkup() - the fallback markup: honest text plus a "Try
 *                              again" control.
 *
 * Deliberately pure: no DOM reads, no fetch, no app state. That is what lets
 * test/countdownRetry.test.js exercise it directly in Node, and it is why the
 * click handler itself lives in core.js (it needs the app's own state).
 *
 * Loaded BEFORE core.js in index.html, so these globals already exist by the
 * time core.js renders anything.
 */
(function () {
  "use strict";

  // How many hours of runway a story is given, by how fast it is moving.
  // Kept identical to the velocity buckets in core.js: a rising story can wait,
  // a peaking one cannot, and a cooling one is nearly spent.
  var HOURS_BY_STATE = { rising: 12, peaking: 6, dying: 2 };

  function hoursForState(state) {
    var h = HOURS_BY_STATE[state];
    return (typeof h === "number") ? h : 2;
  }

  /**
   * When should this story be posted by?
   *
   * @param {object} story            the feed item
   * @param {string} state            trendVelocity().state — rising|peaking|dying
   * @param {number} [now]            injectable clock, for tests
   * @returns {number|null}           epoch ms, or null when it cannot be known
   *
   * Returns null — never a guess — when the story carries no usable timestamp.
   * A window invented from "right now" would look like a real calculation while
   * being pure decoration, which is exactly what the spec forbids.
   */
  function cpWindowTarget(story, state, now) {
    if (!story) return null;
    var ts = Number(story.timestamp);
    if (!isFinite(ts) || ts <= 0) return null;

    var hours = hoursForState(state);
    var target = ts + hours * 3600000;

    // A target in the past is still a real answer ("post now" territory), so it
    // is returned as-is rather than being rounded up to something friendlier.
    void now;
    return target;
  }

  function escAttr(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /**
   * The fallback the label shows when there is no estimate.
   * Plain words first (what is true), then a control (what can be done).
   *
   * @param {string} tid  the story id, so the handler knows what to retry
   */
  function cpWindowRetryMarkup(tid) {
    return 'No window estimate' +
      '<button type="button" class="retry-link" ' +
      'aria-label="Try again to estimate the suggested posting window" ' +
      'onclick="retryWindowEstimate(\'' + escAttr(tid) + '\')">Try again</button>';
  }

  // Node has no `window`; the browser does. Guarding the export keeps this one
  // file usable from both, instead of needing a second copy for the tests.
  if (typeof window !== "undefined") {
    window.cpWindowTarget = cpWindowTarget;
    window.cpWindowRetryMarkup = cpWindowRetryMarkup;
    window.cpWindowHoursForState = hoursForState;
  }

  // Node consumes this file for its tests; the browser loads it as a classic
  // script where `module` is undefined and the guard is skipped. One
  // implementation, two consumers — same pattern as lib/authRedirect.js.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { cpWindowTarget: cpWindowTarget, cpWindowRetryMarkup: cpWindowRetryMarkup, hoursForState: hoursForState };
  }
})();
