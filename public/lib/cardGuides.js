/* CreatorPulse · Card edit guides — the dashed outlines and the safe-zone
 * overlay that appear ONLY in edit mode.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 6 asks for guides while editing and for them to be absent from the
 * preview and the export. Keeping the markup here, behind a single `on` flag,
 * means there is exactly one place that can draw a guide — and it draws nothing
 * when the flag is false, so a mockup or a downloaded image can never show one.
 *
 * Runs in the browser (window.CPCardGuides) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardGuides = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function pct(n) { return (Number(n) * 100).toFixed(3) + '%'; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* The safe-zone rectangle for a resolved design. */
  function safeZoneHTML(design) {
    if (!design) return '';
    var z = design.safeZone || { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 };
    return '<span class="cc-guide-safe" aria-hidden="true" style="left:' + pct(z.left) + ';top:' + pct(z.top) + ';right:' + pct(z.right) + ';bottom:' + pct(z.bottom) + '"><span class="cc-guide-safe-tag">Safe zone</span></span>';
  }

  /* A dashed outline for every non-empty text layer. */
  function layerGuidesHTML(design) {
    if (!design || !design.layers) return '';
    return design.layers.filter(function (l) { return !l.empty; }).map(function (l) {
      return '<span class="cc-guide-box" aria-hidden="true" style="left:' + pct(l.box.x) + ';top:' + pct(l.box.y) + ';width:' + pct(l.box.width) + ';height:' + pct(l.box.height) + '"><span class="cc-guide-tag">' + esc(l.label) + '</span></span>';
    }).join('');
  }

  /* The whole guide layer. `on` is the edit-mode flag: when false, nothing is
   * drawn, so a preview or an export can never show a guide. */
  function guidesHTML(design, on) {
    if (!on || !design) return '';
    return '<span class="cc-guides" aria-hidden="true">' + safeZoneHTML(design) + layerGuidesHTML(design) + '</span>';
  }

  return { guidesHTML: guidesHTML, safeZoneHTML: safeZoneHTML, layerGuidesHTML: layerGuidesHTML };
});
