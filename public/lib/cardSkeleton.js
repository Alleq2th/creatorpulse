/* CreatorPulse · Card skeleton — a shimmering placeholder shown while an image
 * generates, instead of a spinner.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 6 asks for skeleton loading rather than spinners. A skeleton that has the
 * card's own shape tells the user what is coming and keeps the layout from
 * jumping when the image arrives. The markup is built here so every place that
 * waits for a card shows the same placeholder.
 *
 * Runs in the browser (window.CPCardSkeleton) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardSkeleton = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* A skeleton with the card's own aspect ratio. `aspect` is a CSS ratio such as
   * '4/5' or '9/16'; `label` is the short status line under the bars. */
  function skeletonHTML(opts) {
    var o = opts || {};
    var aspect = o.aspect || '4/5';
    var label = o.label || 'Generating your card\u2026';
    return '<div class="cc-skel" role="status" aria-live="polite" style="aspect-ratio:' + esc(aspect) + '">' +
      '<span class="cc-skel-bar cc-skel-bar-1"></span>' +
      '<span class="cc-skel-bar cc-skel-bar-2"></span>' +
      '<span class="cc-skel-bar cc-skel-bar-3"></span>' +
      '<span class="cc-skel-label">' + esc(label) + '</span>' +
    '</div>';
  }

  return { skeletonHTML: skeletonHTML };
});
