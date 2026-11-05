/* CreatorPulse · Theme-picker preview tiles.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The Themes sheet used to draw each tile as a plain black rectangle with the
 * text floating in the middle: it had its own hardcoded font, its own centred
 * layout, and it truncated the supporting text with an ellipsis. So a user could
 * not judge a theme, and what they picked did not look like what they got.
 *
 * A tile is now a miniature of the REAL card: the same photo, the same scrim,
 * the same resolved layout (public/lib/cardLayout.js) and the same wrapping
 * rules as the live mockup and the export. One render path, three consumers.
 */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Builds one tile's inner markup.
   * opts: { templateId, platform, slide, style, plateUrl, themeName, active, onclick }
   * Returns an HTML string for a <button class="cc-th-tile">. */
  function tileHTML(opts) {
    var L = root.CPCardLayout;
    if (!L) return '';
    var design = L.resolve({
      templateId: opts.templateId,
      platform: opts.platform || 'instagram',
      slide: opts.slide,
      index: 0,
      total: 1,
      style: opts.style || {}
    });
    if (!design) return '';

    var plate = opts.plateUrl
      ? 'background-image:url(&quot;' + esc(opts.plateUrl) + '&quot;);background-size:cover;background-position:center'
      : 'background:' + esc(design.palette.bg);

    // The scrim, from the same stops the real card uses.
    var scrimStops = design.scrim.stops.map(function (s) {
      return s.color + ' ' + Math.round(s.offset * 100) + '%';
    }).join(',');

    // Every layer is placed with the real box, in percentages of the tile, and
    // sized with the real font size (cqw = % of the tile's own width).
    var layers = design.layers.filter(function (l) { return !l.empty; }).map(function (l) {
      return '<span class="cc-th-layer" style="' +
        'left:' + (l.box.x * 100).toFixed(2) + '%;' +
        'top:' + (l.box.y * 100).toFixed(2) + '%;' +
        'width:' + (l.box.width * 100).toFixed(2) + '%;' +
        'height:' + (l.box.height * 100).toFixed(2) + '%;' +
        L.layerCss(l) + '">' + esc(l.displayText) + '</span>';
    }).join('');

    return '<button type="button" class="cc-th-tile' + (opts.active ? ' active' : '') + '"' +
      ' aria-pressed="' + (opts.active ? 'true' : 'false') + '"' +
      (opts.onclick ? ' onclick="' + opts.onclick + '"' : '') + '>' +
      '<span class="cc-th-frame" style="' + plate + ';background-color:' + esc(design.palette.bg) + '">' +
        '<span class="cc-th-scrim" style="background:linear-gradient(180deg,' + scrimStops + ')"></span>' +
        layers +
      '</span>' +
      '<span class="cc-th-name">' + esc(opts.themeName || '') + '</span>' +
    '</button>';
  }

  var api = { tileHTML: tileHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPThemePreview = api;
})(typeof window !== 'undefined' ? window : null);
