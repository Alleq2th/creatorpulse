/* CreatorPulse - the ONE html escaper the explainer modules share.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * lib/opportunityExplain.js used to carry its own private copy of the escaper.
 * The platform explainer needs exactly the same function. Rather than paste a
 * second copy (which is how two implementations of "the same" thing start
 * disagreeing - this codebase has already paid for that lesson twice), the
 * escaper now lives here and both explainers read it.
 *
 * It is tiny on purpose: it escapes the five characters that can break out of
 * text and into markup. It is NOT an html sanitiser and must not be used as
 * one; it only makes arbitrary text safe to interpolate into a template.
 *
 * Loaded FIRST in index.html (before the explainer libs, which load before
 * core.js). Node consumes it with require() for the tests. One implementation,
 * two consumers.
 */
(function () {
  "use strict";

  function cpEsc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /**
   * Hand the caller the escaper, from whichever environment this is running in.
   *
   * Both explainers call this rather than embedding the escaping logic, so the
   * escaping rules exist in exactly one place. Returns a function always, so a
   * caller never has to null-check.
   */
  function cpEscResolve() {
    return cpEsc;
  }

  var api = { cpEsc: cpEsc, cpEscResolve: cpEscResolve };

  if (typeof window !== "undefined") {
    window.cpEsc = cpEsc;
    window.cpEscResolve = cpEscResolve;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
