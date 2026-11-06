/* CreatorPulse · Card thumbnails — every small tile (slide strip, theme sheet,
 * template picker) is a miniature of the REAL card.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 6 asks that thumbnails everywhere be rendered from the real layout engine
 * with the user's actual photo and text, never flat colour boxes. This module is
 * the one place that turns a resolved design into a miniature, so the slide
 * strip, the theme sheet and the template picker all show the same real card.
 * It is a CONSUMER of the engine's single result — not a second render path.
 *
 * Runs in the browser (window.CPCardThumbnails) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var engine;
  if (typeof module !== 'undefined' && module.exports) engine = require('./cardLayoutEngine.js');
  else engine = root.CPCardLayoutEngine;
  var api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardThumbnails = api;
})(typeof window !== 'undefined' ? window : null, function (engine) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pct(n) { return (Number(n) * 100).toFixed(2) + '%'; }

  /* The inner markup of a miniature card, from a resolved design: the photo
   * treatment's frame and scrim, then every non-empty layer at its real box and
   * real font size. */
  function miniHTML(design, plateUrl) {
    if (!design) return '';
    var t = design.treatment || {};
    var f = t.frame || { x: 0, y: 0, width: 1, height: 1, radius: 0 };
    var plate = plateUrl
      ? 'background-image:url(&quot;' + esc(plateUrl) + '&quot;);background-size:cover;background-position:center'
      : 'background:' + esc(design.palette.bg);
    var scrim = '';
    if (design.scrim && design.scrim.stops) {
      var stops = design.scrim.stops.map(function (s) { return s.color + ' ' + Math.round(s.offset * 100) + '%'; }).join(',');
      scrim = '<span class="cc-th-scrim" style="background:linear-gradient(180deg,' + stops + ')"></span>';
    }
    var layers = design.layers.filter(function (l) { return !l.empty; }).map(function (l) {
      return '<span class="cc-th-layer" style="left:' + pct(l.box.x) + ';top:' + pct(l.box.y) + ';width:' + pct(l.box.width) + ';height:' + pct(l.box.height) + ';' + engine.layerCss(l) + '">' + esc(l.displayText) + '</span>';
    }).join('');
    return '<span class="cc-th-frame" style="background-color:' + esc(design.palette.bg) + '">' +
      '<span class="cc-th-photo" style="left:' + pct(f.x) + ';top:' + pct(f.y) + ';width:' + pct(f.width) + ';height:' + pct(f.height) + ';' + plate + '"></span>' +
      scrim + layers +
    '</span>';
  }

  /* A full thumbnail button. `design` may be passed in (already resolved) or is
   * resolved here from the template + slide, so a caller never has to know how. */
  function thumbHTML(opts) {
    var o = opts || {};
    var design = o.design || engine.resolve({
      templateId: o.templateId, platform: o.platform, slide: o.slide,
      index: o.index || 0, total: o.total || 1, style: o.style || {}
    });
    var active = !!o.active;
    var onclick = o.onclick ? ' onclick="' + esc(o.onclick) + '"' : '';
    return '<button type="button" class="cc-thumb' + (active ? ' active' : '') + '" aria-pressed="' + active + '"' + onclick + '>' +
      miniHTML(design, o.plateUrl) +
      (o.label ? '<span class="cc-thumb-name">' + esc(o.label) + '</span>' : '') +
    '</button>';
  }

  return { miniHTML: miniHTML, thumbHTML: thumbHTML };
});
