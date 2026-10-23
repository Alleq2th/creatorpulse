/* CreatorPulse - the "Why this platform?" affordance and panel.
 *
 * Spec Part 5.4's last line applies to every recommendation in the product:
 *
 *   "If the product already provides an explanation of how the score should
 *    be interpreted, make that information accessible without cluttering
 *    the interface."
 *
 * and Part 5.1 fixes where the recommendation sits in the hierarchy:
 *
 *   "**Recommended approach**
 *    - Suggested platform.
 *    - Suggested content format.
 *    - A relevant next action."
 *   "Use the existing data and capabilities rather than inventing additional
 *    metrics or recommendations."
 *
 * Two constraints, pulling against each other as before:
 *
 *   ACCESSIBLE      -> a real, focusable button, not a tooltip (15.3 also
 *                      forbids small targets).
 *   NOT CLUTTERING  -> collapsed by default; when shut it adds one short line
 *                      under the existing "Best platform" row.
 *
 * REUSE, NOT REINVENTION
 * ----------------------
 * This file deliberately renders NO new visual pattern. It emits the same
 * `.best-plat` row the card already had, then the same `.oppw-toggle` control
 * and `.oppw` panel that the opportunity-score explainer introduced. The row
 * renderer is not copied: it is read from lib/opportunityExplain.js, which owns
 * it (window.cpExplainFactorRow / cpExplainMissingRow in the browser, the
 * module under Node). One row renderer, two panels. The escaper comes from
 * lib/htmlEsc.js.
 *
 * The numbers come from lib/platformPick.js and are never recomputed here, so
 * the recommendation and its explanation cannot drift apart.
 *
 * Loaded AFTER lib/htmlEsc.js and lib/opportunityExplain.js, BEFORE core.js.
 */
(function () {
  "use strict";

  // ── the shared escaper, with a local fallback only so a missing script
  //    degrades instead of throwing (the freeze class this codebase paid for) ─
  var HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function localEsc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return HTML_ENTITIES[c]; });
  }
  function esc(v) {
    if (typeof window !== "undefined" && typeof window.cpEsc === "function") return window.cpEsc(v);
    return localEsc(v);
  }

  // ── the shared row renderer, owned by lib/opportunityExplain.js ──────────
  //
  // NOTE: both branches MUST return the same key names. An earlier module in
  // this codebase returned differently-named functions on the browser and Node
  // branches, so it worked under test and silently rendered nothing in the
  // browser. One shape, always - and the browser branch is checked against the
  // Node branch by test/platformPick.test.js.
  function rowsModule() {
    if (typeof window !== "undefined" && typeof window.cpExplainFactorRow === "function") {
      return {
        cpExplainFactorRow: window.cpExplainFactorRow,
        cpExplainMissingRow: window.cpExplainMissingRow
      };
    }
    if (typeof module !== "undefined" && module.exports) {
      try { return require("./opportunityExplain.js"); } catch (_) { return null; }
    }
    return null;
  }

  // The pick implementation, same two-branch rule.
  function pickModule() {
    if (typeof window !== "undefined" && typeof window.cpPickPlatform === "function") {
      return {
        cpPickPlatform: window.cpPickPlatform,
        cpPlatformBreakdown: window.cpPlatformBreakdown
      };
    }
    if (typeof module !== "undefined" && module.exports) {
      try { return require("./platformPick.js"); } catch (_) { return null; }
    }
    return null;
  }

  function breakdownOf(story, opts) {
    var m = pickModule();
    if (!m || typeof m.cpPlatformBreakdown !== "function") return null;
    return m.cpPlatformBreakdown(story, opts);
  }

  /**
   * One factor row. Falls back to a plain sentence row if the row renderer is
   * missing, so the panel always shows something rather than a blank box.
   */
  function row(f, kind) {
    var m = rowsModule();
    var fn = m && (kind === "missing" ? m.cpExplainMissingRow : m.cpExplainFactorRow);
    if (typeof fn === "function") return fn(f);
    return '<li class="oppw-row oppw-' + esc(f.state || kind) + '">' +
      '<span class="oppw-k">' + esc(f.label) + '</span>' +
      '<span class="oppw-v">' + esc(f.value || "not available") + '</span>' +
      '<span class="oppw-n">' + esc(f.note) + '</span>' +
      '</li>';
  }

  /**
   * The "Best platform" block for an expanded story card: the row the card
   * already had, the "Why this platform?" control, and - when open - the
   * explanation.
   *
   * @param {object} story   the feed item
   * @param {object} [opts]  { open:boolean, platforms:string[],
   *                           primary:string, plats:[{id,label}], emoji:object,
   *                           label:string }
   */
  function cpPlatformMarkup(story, opts) {
    opts = opts || {};
    var open = !!opts.open;
    var tid = String((story && story.id) || "");
    var emojiMap = opts.emoji || {};
    var rowLabel = opts.label || "Best platform";

    var b = breakdownOf(story, {
      platforms: opts.platforms,
      primary: opts.primary,
      plats: opts.plats
    });

    // The recommendation to display. Prefer the shared implementation's pick;
    // if it is missing, fall back to whatever the caller resolved so the row
    // never renders empty.
    var pickId = b ? b.pick : (opts.pick || "");
    var pickName = b ? b.pickLabel : (opts.pickLabel || pickId);

    var head =
      '<div class="best-plat">' +
        '<span class="em">' + esc(emojiMap[pickId] || "\u25c6") + '</span>' +
        '<div style="flex:1">' +
          '<div class="best-plat-lbl">' + esc(rowLabel) + '</div>' +
          '<div class="best-plat-val">' + esc(pickName) + '</div>' +
        '</div>' +
      '</div>';

    // No breakdown means the pick lib did not load. Show the row honestly and
    // stop - a panel with invented contents would be worse than no panel.
    if (!b) return '<div class="best-plat-wrap">' + head + '</div>';

    var button =
      '<button type="button" class="oppw-toggle" aria-expanded="' + (open ? "true" : "false") + '" ' +
      'aria-controls="platw-' + esc(tid) + '" ' +
      'onclick="togglePlatWhy(\'' + esc(tid) + '\')">' +
        (open ? "Hide why" : "Why this platform?") +
      '</button>';

    if (!open) {
      return '<div class="best-plat-wrap">' + head + button + '</div>';
    }

    var compared =
      '<div class="oppw-math">' +
        '<span class="oppw-math-l">How it compared</span>' +
        '<code>' + esc(b.scoresText || "nothing matched") + '</code>' +
        (b.fellBack
          ? '<span class="oppw-clamp">Nothing in the story matched any rule, so this is your default.</span>'
          : "") +
      '</div>';

    var body =
      '<div class="oppw" id="platw-' + esc(tid) + '">' +
        compared +
        '<ul class="oppw-list">' + b.factors.map(function (f) { return row(f); }).join("") + '</ul>' +
        '<div class="oppw-sec">What the app does not receive</div>' +
        '<ul class="oppw-list">' + b.missing.map(function (m) { return row(m, "missing"); }).join("") + '</ul>' +
        '<p class="oppw-foot">A rule-based pick, read from this story\'s own wording and your platform list. ' +
        'It is not a forecast of reach or engagement.</p>' +
      '</div>';

    return '<div class="best-plat-wrap best-plat-is-open">' + head + button + body + '</div>';
  }

  var api = { cpPlatformMarkup: cpPlatformMarkup };

  if (typeof window !== "undefined") window.cpPlatformMarkup = cpPlatformMarkup;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
