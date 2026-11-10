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
    code_mono:       { family: "'IBM Plex Mono', ui-monospace, monospace",            weight: 500, upper: true,  tracking: 0.02 },
    archivo_black:   { family: "'Archivo Black', Impact, sans-serif",                    weight: 900, upper: true,  tracking: 0 },
    anton:           { family: "'Anton', Impact, sans-serif",                            weight: 400, upper: true,  tracking: 0 },
    bebas_neue:      { family: "'Bebas Neue', Impact, sans-serif",                       weight: 400, upper: true,  tracking: 0.02 },
    oswald:          { family: "'Oswald', Impact, sans-serif",                           weight: 700, upper: true,  tracking: 0 },
    roboto_condensed:{ family: "'Roboto Condensed', Arial, sans-serif",                  weight: 800, upper: true,  tracking: 0 },
    barlow_condensed:{ family: "'Barlow Condensed', Arial, sans-serif",                  weight: 800, upper: true,  tracking: 0 },
    montserrat:      { family: "'Montserrat', Arial, sans-serif",                        weight: 800, upper: false, tracking: 0 },
    poppins:         { family: "'Poppins', Arial, sans-serif",                           weight: 700, upper: false, tracking: 0 },
    dm_sans:         { family: "'DM Sans', Arial, sans-serif",                           weight: 700, upper: false, tracking: 0 },
    manrope:         { family: "'Manrope', Arial, sans-serif",                           weight: 700, upper: false, tracking: 0 },
    space_grotesk:   { family: "'Space Grotesk', Arial, sans-serif",                     weight: 700, upper: false, tracking: 0 },
    urbanist:        { family: "'Urbanist', Arial, sans-serif",                          weight: 800, upper: false, tracking: 0 },
    outfit:          { family: "'Outfit', Arial, sans-serif",                            weight: 700, upper: false, tracking: 0 },
    figtree:         { family: "'Figtree', Arial, sans-serif",                           weight: 700, upper: false, tracking: 0 },
    dm_serif_display:{ family: "'DM Serif Display', Georgia, serif",                     weight: 400, upper: false, tracking: -0.01 },
    lora:            { family: "'Lora', Georgia, serif",                                weight: 700, upper: false, tracking: 0 },
    merriweather:    { family: "'Merriweather', Georgia, serif",                         weight: 700, upper: false, tracking: 0 },
    cormorant_garamond:{ family: "'Cormorant Garamond', Georgia, serif",                 weight: 700, upper: false, tracking: 0 },
    libre_baskerville:{ family: "'Libre Baskerville', Georgia, serif",                   weight: 700, upper: false, tracking: 0 },
    roboto_slab:     { family: "'Roboto Slab', Georgia, serif",                          weight: 700, upper: false, tracking: 0 },
    space_mono:      { family: "'Space Mono', monospace",                               weight: 700, upper: true,  tracking: 0.01 },
    source_code_pro: { family: "'Source Code Pro', monospace",                          weight: 600, upper: false, tracking: 0 }
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
    // The browser's line box is slightly taller than fontSize * lineHeight
    // (it uses the font's own ascent + descent), so the height check reserves a
    // little extra. Without it the DOM text overflowed its box by a few pixels
    // even though the canvas measure said it fitted.
    var heightFactor = Number(o.heightFactor) || 1;
    var maxLines = Math.max(1, Number(o.maxLines) || 6);
    var minPct = Number(o.minPct) || 0.02;
    var maxPct = Number(o.maxPct) || 0.12;
    // Start at the LARGEST size the region allows and shrink from there. The
    // engine passes the region's maxSize as maxPct; starting at a fixed 0.05
    // instead made every headline render at the same size, so a "huge condensed
    // headline" template looked no bigger than a caption one.
    var size = clamp(Number(o.sizePct) || Number(o.maxPct) || 0.05, minPct, maxPct);
    var text = String(o.text == null ? '' : o.text);
    var measureFor = o.measureFor || estimateMeasure;
    var best = null;
    for (var i = 0; i < 48; i++) {
      var px = size * W;
      var lines = wrapLines(measureFor(px), text, bw);
      var totalH = lines.length * px * lineHeight * heightFactor;
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

  /* Escapes text for safe insertion into HTML. Every dynamic string that reaches
   * the DOM or an SVG goes through this (or the app's own escXml), so a headline
   * can never inject markup. */
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Renders a layer's text as HTML, wrapping the ONE keyword in the accent
   * colour when the template asks for a highlight. The text is escaped first, so
   * the only markup in the result is the span this function adds. */
  function keywordHtml(layer) {
    var text = String((layer && layer.displayText) || '');
    var kw = String((layer && layer.keyword) || '');
    if (!kw) return escHtml(text);
    var idx = text.indexOf(kw);
    if (idx < 0) return escHtml(text);
    var color = (layer && layer.keywordColor) || 'inherit';
    return escHtml(text.slice(0, idx)) +
      '<span class="cc-kw" style="color:' + escHtml(color) + '">' + escHtml(kw) + '</span>' +
      escHtml(text.slice(idx + kw.length));
  }

  /* ── Part 5: the typography rules ─────────────────────────────────────────
   * These are the rules the design brief sets, in one place so the engine, the
   * preview and the export all obey the same numbers. */

  /* Hierarchy with scale contrast: the hero must be at least this many times
   * the supporting text. */
  var SCALE_CONTRAST = 2.5;

  /* Line-length limit: a hero line should not run past this many characters, or
   * the eye loses the line. The engine uses it to cap the hero's box width. */
  var HERO_MAX_CHARS = 18;

  /* The room a line really needs, as a multiple of the font size. A browser's
   * line box is taller than fontSize * line-height (it uses the font's own
   * ascent + descent), and a display face like Anton is taller still — about
   * 1.25x. The engine reserves this much per line when it checks a fit, so a
   * tight leading never lets the glyphs spill out of the box. The VISUAL leading
   * is still `leadingFor`, so the type stays tight; only the reserved room is
   * generous. */
  var LINE_BOX_FACTOR = 1.32;

  /* The room a line needs depends on the face: a display face (Anton, Archivo
   * Black) has tall glyphs and needs the most; a text face (Inter) needs less.
   * Reserving the display figure for every face would waste a small box's
   * height and force a needless shrink. */
  function lineBoxFactor(fontId) {
    var id = String(fontId || '');
    if (id === 'impact' || id === 'condensed_sans') return 1.32;
    if (id === 'editorial_serif' || id === 'classic_serif') return 1.30;
    if (id === 'code_mono') return 1.26;
    return 1.20; // modern_sans / modern_body
  }

  /* Tight leading on condensed headlines, looser on serif. A condensed face is
   * set tight so a stack reads as one block; a serif needs air between lines. */
  function leadingFor(fontId) {
    var id = String(fontId || '');
    if (id === 'editorial_serif' || id === 'classic_serif') return 1.24;
    if (id === 'impact' || id === 'condensed_sans') return 1.02;
    if (id === 'code_mono') return 1.18;
    return 1.12;
  }

  /* Tabular digits: a stat must line up, so a numeric face is asked for
   * tabular (fixed-width) figures. Only the faces that carry numbers get it. */
  function tabularDigits(fontId) {
    var id = String(fontId || '');
    return id === 'modern_sans' || id === 'modern_body' || id === 'code_mono' || id === 'condensed_sans';
  }

  /* Auto-picks the ONE keyword a headline may highlight in the accent: the
   * number if there is one (a stat is the point), else the longest meaningful
   * word (the name or the verb), never a stopword. */
  var STOPWORDS = { the: 1, and: 1, for: 1, that: 1, with: 1, this: 1, from: 1, your: 1, you: 1, are: 1, was: 1, has: 1, have: 1, its: 1, it: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, is: 1, be: 1, as: 1, at: 1, by: 1, or: 1, but: 1, not: 1, all: 1, can: 1, will: 1, how: 1, why: 1, what: 1, who: 1, when: 1, new: 1, more: 1, most: 1 };
  function pickKeyword(text) {
    var raw = String(text == null ? '' : text);
    // A number (with an optional % or $) is the strongest keyword.
    var num = raw.match(/[$€£]?\d[\d.,]*%?/);
    if (num && num[0].replace(/[^\d]/g, '').length >= 1) return num[0];
    var words = raw.split(/\s+/).map(function (w) { return w.replace(/[^A-Za-z0-9%$]/g, ''); }).filter(Boolean);
    var best = '';
    words.forEach(function (w) {
      if (w.length >= 4 && !STOPWORDS[w.toLowerCase()] && w.length > best.length) best = w;
    });
    return best;
  }

  /* The longest line, in characters, of a wrapped block. The tests use it to
   * prove the hero never runs past HERO_MAX_CHARS. */
  function longestLine(lines) {
    return (lines || []).reduce(function (m, l) { return Math.max(m, String(l).length); }, 0);
  }

  /* Enforces the scale contrast on a resolved set of layers: if the hero is not
   * at least SCALE_CONTRAST times the largest supporting layer, the supporting
   * layers are shrunk until it is. Returns the layers, adjusted in place, so the
   * preview and the export both read the corrected sizes. */
  function enforceScaleContrast(layers, heroKey, heroSizePct) {
    var list = Array.isArray(layers) ? layers : [];
    var hero = list.find(function (l) { return l.key === (heroKey || 'headline'); });
    var heroSize = Number(heroSizePct) > 0 ? Number(heroSizePct) : (hero && hero.sizePct);
    if (!heroSize) return list;
    var others = list.filter(function (l) { return l !== hero && !l.empty && l.sizePct; });
    if (!others.length) return list;
    var biggest = others.reduce(function (m, l) { return Math.max(m, l.sizePct); }, 0);
    var ceiling = heroSize / SCALE_CONTRAST;
    if (biggest > ceiling) {
      var k = ceiling / biggest;
      others.forEach(function (l) { l.sizePct = l.sizePct * k; });
    }
    return list;
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
      'text-align:' + layer.align,
      // Tabular digits on a stat, so the numbers line up.
      'font-variant-numeric:' + (layer.tabular ? 'tabular-nums' : 'normal')
    ].join(';');
  }

  return {
    FONTS: FONTS,
    PAIRINGS: PAIRINGS,
    SCALE_CONTRAST: SCALE_CONTRAST,
    HERO_MAX_CHARS: HERO_MAX_CHARS,
    LINE_BOX_FACTOR: LINE_BOX_FACTOR,
    lineBoxFactor: lineBoxFactor,
    face: face,
    clamp: clamp,
    estimateMeasure: estimateMeasure,
    wrapLines: wrapLines,
    autoFit: autoFit,
    trackingFor: trackingFor,
    leadingFor: leadingFor,
    tabularDigits: tabularDigits,
    pickKeyword: pickKeyword,
    longestLine: longestLine,
    enforceScaleContrast: enforceScaleContrast,
    layerCss: layerCss,
    escHtml: escHtml,
    keywordHtml: keywordHtml
  };
});