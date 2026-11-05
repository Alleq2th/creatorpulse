/* CreatorPulse · Card typography — ONE source of truth for type.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Font pairing, scale, tracking, line height and the auto-fit maths used to be
 * spread across three places: the template catalogue declared a size, the DOM
 * preview turned it into `cqw`, and the canvas export multiplied it by the card
 * width and then guessed how many lines would fit with a character count. The
 * three drifted, so a downloaded slide did not look like the mockup.
 *
 * This module owns all of it. The layout engine (public/lib/cardLayoutEngine.js)
 * calls autoFit() once per text layer and hands the result to BOTH painters, so
 * the preview and the export cannot disagree about a font, a size or a break.
 *
 * Runs in the browser (window.CPCardTypography) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardTypography = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* The five faces the app ships. Each id maps to a real webfont that
   * index.html loads, plus a system fallback, so the browser preview and the
   * canvas export pick the same face. `tracking` is letter-spacing as a
   * fraction of the font size; `upper` is the face's natural case. */
  var FONTS = {
    impact:          { family: "'Anton', 'Archivo Black', Impact, sans-serif",        weight: 400, upper: true,  tracking: 0.005 },
    condensed_sans:  { family: "'Archivo Black', 'Anton', Impact, sans-serif",        weight: 900, upper: true,  tracking: 0 },
    modern_sans:     { family: "Inter, Arial, sans-serif",                            weight: 800, upper: false, tracking: 0 },
    modern_body:     { family: "Inter, Arial, sans-serif",                            weight: 500, upper: false, tracking: 0 },
    editorial_serif: { family: "'Playfair Display', Georgia, serif",                  weight: 900, upper: false, tracking: -0.01 },
    classic_serif:   { family: "'Playfair Display', Georgia, serif",                  weight: 700, upper: false, tracking: 0 },
    code_mono:       { family: "'IBM Plex Mono', ui-monospace, monospace",            weight: 500, upper: true,  tracking: 0.02 }
  };

  /* Named pairings: a display face for the headline and a body face for the
   * supporting copy. A template picks one pairing; a layer inherits it unless
   * the user overrides that single layer's font in the editor. */
  var PAIRINGS = {
    poster:    { headline: 'impact',          supportingText: 'modern_body',  ctaLine: 'condensed_sans' },
    broadcast: { headline: 'condensed_sans',  supportingText: 'modern_body',  ctaLine: 'condensed_sans' },
    editorial: { headline: 'editorial_serif', supportingText: 'classic_serif', ctaLine: 'modern_sans' },
    minimal:   { headline: 'modern_sans',     supportingText: 'modern_body',  ctaLine: 'modern_sans' },
    terminal:  { headline: 'code_mono',       supportingText: 'code_mono',    ctaLine: 'code_mono' }
  };

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function face(id) { return FONTS[id] || FONTS.impact; }

  /* A rough advance-width estimate, used only when no real measure function is
   * available (Node tests). The browser always passes a canvas measure, so the
   * estimate never reaches a rendered card. */
  function estimateMeasure(px) {
    return function (s) { return String(s).length * px * 0.56; };
  }

  /* Breaks text into lines. `measure` is (string) -> pixel width. The browser
   * passes a canvas 2D context; the export passes the same. One algorithm, so a
   * line breaks in the same place in both. */
  function wrapLines(measure, text, maxWidth) {
    var out = [];
    String(text == null ? '' : text).split('\n').forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); return; }
      var line = '';
      words.forEach(function (w) {
        var candidate = line ? line + ' ' + w : w;
        if (measure(candidate) <= maxWidth) { line = candidate; return; }
        if (line) { out.push(line); line = ''; }
        if (measure(w) <= maxWidth) { line = w; return; }
        // A single word wider than the box breaks anywhere, like the browser.
        var chunk = '';
        for (var i = 0; i < w.length; i++) {
          var ch = w[i];
          if (chunk && measure(chunk + ch) > maxWidth) { out.push(chunk); chunk = ''; }
          chunk += ch;
        }
        line = chunk;
      });
      out.push(line);
    });
    return out;
  }

  /* Auto-fit: pick the largest font size (as a fraction of the canvas width)
   * where the wrapped text fits BOTH the box height and the line cap. Shrinks in
   * small steps; never truncates and never adds an ellipsis. If even the minimum
   * size cannot fit, it returns the minimum and reports fits:false so the caller
   * can grow the box instead of clipping the words.
   *
   * opts.measureFor is (px) -> (string) -> width. */
  function autoFit(opts) {
    var o = opts || {};
    var W = o.canvasW || 1080, H = o.canvasH || 1350;
    var bw = Math.max(1, (o.boxW || 0.8) * W);
    var bh = Math.max(1, (o.boxH || 0.2) * H);
    var lineHeight = Number(o.lineHeight) || 1.1;
    var maxLines = Math.max(1, Number(o.maxLines) || 6);
    var minPct = Number(o.minPct) || 0.02;
    var maxPct = Number(o.maxPct) || 0.12;
    var size = clamp(Number(o.sizePct) || 0.05, minPct, maxPct);
    var text = String(o.text == null ? '' : o.text);
    var measureFor = o.measureFor || estimateMeasure;
    var best = null;
    for (var i = 0; i < 48; i++) {
      var px = size * W;
      var lines = wrapLines(measureFor(px), text, bw);
      var totalH = lines.length * px * lineHeight;
      if (lines.length <= maxLines && totalH <= bh) {
        best = { sizePct: size, lines: lines, lineHeight: lineHeight, fits: true, height: totalH / H };
        break;
      }
      if (size <= minPct + 1e-9) {
        best = { sizePct: minPct, lines: lines, lineHeight: lineHeight, fits: false, height: totalH / H };
        break;
      }
      size = Math.max(minPct, size * 0.94);
    }
    if (!best) {
      var px2 = minPct * W;
      var lines2 = wrapLines(measureFor(px2), text, bw);
      best = { sizePct: minPct, lines: lines2, lineHeight: lineHeight, fits: false, height: lines2.length * px2 * lineHeight / H };
    }
    return best;
  }

  /* The tracking (letter-spacing) for a layer, as a fraction of the font size. */
  function trackingFor(layer) {
    if (!layer) return 0;
    if (layer.tracking != null) return Number(layer.tracking) || 0;
    return face(layer.fontId).tracking || 0;
  }

  /* CSS for one layer, used by the DOM preview. Sizes are in cqw so the card
   * scales with its container while keeping the export's proportions. */
  function layerCss(layer) {
    var t = trackingFor(layer);
    return [
      'font-family:' + layer.fontFamily,
      'font-weight:' + layer.fontWeight,
      'font-size:' + (layer.sizePct * 100).toFixed(3) + 'cqw',
      'line-height:' + layer.lineHeight,
      'letter-spacing:' + (t * layer.sizePct * 100).toFixed(3) + 'cqw',
      'color:' + layer.color,
      'text-transform:' + (layer.uppercase ? 'uppercase' : 'none'),
      'text-align:' + layer.align
    ].join(';');
  }

  return {
    FONTS: FONTS,
    PAIRINGS: PAIRINGS,
    face: face,
    clamp: clamp,
    estimateMeasure: estimateMeasure,
    wrapLines: wrapLines,
    autoFit: autoFit,
    trackingFor: trackingFor,
    layerCss: layerCss
  };
});
