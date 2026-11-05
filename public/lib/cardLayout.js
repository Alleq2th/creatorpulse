/* CreatorPulse · Shared card layout — ONE source of truth for preview + export.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The live mockup (DOM) and the downloaded image (canvas) each used to work out
 * their own font, size, line height, wrapping and box geometry. They drifted:
 * the preview used one font stack and the export another, the preview honoured
 * each template's line height while the export hardcoded 1.05, and the preview
 * let the browser wrap text while the export guessed with a character count.
 * That is why a downloaded slide 2 did not look like the mockup.
 *
 * This module resolves a template + slide + user style into ONE plain object
 * describing exactly how the card is drawn. Both painters read it and nothing
 * else, so they cannot disagree.
 *
 * Runs in the browser (window.CPCardLayout) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('../create/templateEngine.js');
  } else {
    engine = root.CPTemplateEngine;
  }
  var api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardLayout = api;
})(typeof window !== 'undefined' ? window : null, function (engine) {
  'use strict';

  /* Font stacks that exist in BOTH places: the webfonts index.html loads, plus
   * a system fallback. The export rasteriser and the browser therefore pick the
   * same face, which is the first half of "preview matches export". */
  var FONTS = {
    impact:         { family: "'Anton', 'Archivo Black', Impact, sans-serif", weight: 400, upper: true },
    modern_sans:    { family: "Inter, Arial, sans-serif",                     weight: 800, upper: false },
    editorial_serif:{ family: "'Playfair Display', Georgia, serif",           weight: 900, upper: false },
    code_mono:      { family: "'IBM Plex Mono', monospace",                   weight: 500, upper: true },
    condensed_sans: { family: "'Arial Narrow', 'Archivo Black', Impact, sans-serif", weight: 900, upper: true },
    classic_serif:  { family: "Georgia, 'Times New Roman', serif",            weight: 700, upper: false }
  };

  var LAYER_KEYS = ['headline', 'supportingText', 'ctaLine'];

  /* The text layers a card can carry, in draw order. */
  var LAYERS = [
    { key: 'headline',       field: 'headline',       label: 'Headline' },
    { key: 'supportingText', field: 'supportingText', label: 'Supporting text' },
    { key: 'ctaLine',        field: 'ctaLine',        label: 'Call to action' }
  ];

  /* Reads a layer's text from a slide, tolerating the older field names the
   * generator still emits (body / reaction / stat / sectionLabel). */
  function layerText(slide, key) {
    if (!slide) return '';
    if (key === 'headline') return String(slide.headline || slide.hookHeadline || slide.title || '');
    if (key === 'supportingText') return String(slide.supportingText || slide.body || slide.reaction || slide.stat || slide.sectionLabel || '');
    if (key === 'ctaLine') return String(slide.ctaLine || '');
    return '';
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ── Safe zones ────────────────────────────────────────────────────────────
   * TikTok draws its action rail down the right edge and its caption block
   * across the bottom. Text that lands there is unreadable in the real app, so
   * the card keeps clear of both. Instagram/YouTube/X only need a small margin.
   * Values are fractions of the card. */
  var SAFE_ZONES = {
    tiktok:    { top: 0.10, bottom: 0.20, left: 0.06, right: 0.20 },
    instagram: { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
    youtube:   { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
    twitter:   { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 }
  };

  function safeZone(platform) {
    return SAFE_ZONES[platform] || SAFE_ZONES.instagram;
  }

  /* Pushes a box inside the platform's safe zone. A box that is already inside
   * is returned untouched, so a user's own drag is never silently moved.
   *
   * ROOT CAUSE of "text collides with the nav arrows / sits under the TikTok
   * caption": this used to clamp only x and y, so a box that was too WIDE or too
   * TALL still ran past the safe edge. Width and height are clamped first, then
   * the position, so the whole box ends up inside the zone. */
  function clampToSafeZone(box, platform) {
    var z = safeZone(platform);
    var maxW = Math.max(0.1, 1 - z.left - z.right);
    var maxH = Math.max(0.05, 1 - z.top - z.bottom);
    var width = clamp(box.width, 0.05, maxW);
    var height = clamp(box.height, 0.02, maxH);
    var x = clamp(box.x, z.left, Math.max(z.left, 1 - z.right - width));
    var y = clamp(box.y, z.top, Math.max(z.top, 1 - z.bottom - height));
    return { x: x, y: y, width: width, height: height };
  }

  /* ── Decoration geometry ───────────────────────────────────────────────────
   * The badge used to be a div with `inset:0` plus left/top, so it stretched to
   * the whole card — the giant coloured blob. Its size is now computed here in
   * card pixels and clamped, so it is always a pill no matter how big the
   * preview container is. */
  function decorationGeometry(decoration, canvas, platform) {
    var d = decoration || { type: 'none' };
    var W = canvas.width, H = canvas.height;
    var z = safeZone(platform);
    if (d.type === 'badge') {
      var text = String(d.text || 'FEATURE');
      var fontSize = Math.round(W * 0.026);
      // Rough advance width for a bold uppercase label; clamped so a long label
      // can never grow into a banner.
      var textW = Math.round(text.length * fontSize * 0.62);
      var padX = Math.round(W * 0.030);
      var padY = Math.round(fontSize * 0.55);
      var w = clamp(textW + padX * 2, Math.round(W * 0.16), Math.round(W * 0.46));
      var h = clamp(fontSize + padY * 2, Math.round(H * 0.030), Math.round(H * 0.062));
      return {
        type: 'badge', text: text,
        x: Math.round(W * z.left), y: Math.round(H * z.top),
        width: w, height: h, radius: Math.round(h / 2),
        fontSize: fontSize, padX: padX, padY: padY,
        bg: d.accent || '#ffffff'
      };
    }
    if (d.type === 'rule') {
      return { type: 'rule', x: Math.round(W * z.left), y: Math.round(H * 0.135), width: Math.round(W * 0.16), height: Math.max(4, Math.round(W * 0.006)), bg: d.accent || '#ffffff' };
    }
    if (d.type === 'corner') {
      return { type: 'corner', x: 0, y: 0, width: W, height: Math.max(4, Math.round(H * 0.012)), bg: d.accent || '#ffffff' };
    }
    if (d.type === 'frame') {
      var inset = Math.round(W * 0.03);
      return { type: 'frame', x: inset, y: inset, width: W - inset * 2, height: H - inset * 2, stroke: d.accent || 'rgba(255,255,255,.22)' };
    }
    if (d.type === 'orb') {
      return { type: 'orb', cx: Math.round(W * 0.78), cy: Math.round(H * 0.2), r: Math.round(W * 0.34), bg: d.accent || '#ffffff' };
    }
    if (d.type === 'stripes') {
      return { type: 'stripes', x: 0, y: Math.round(H * 0.86), width: W, height: Math.round(H * 0.05), bg: d.accent || '#ffffff' };
    }
    if (d.type === 'split') {
      return { type: 'split', x: Math.round(W * 0.5), y: 0, width: Math.max(2, Math.round(W * 0.002)), height: H, bg: d.accent || '#ffffff' };
    }
    return { type: 'none' };
  }

  /* ── Scrim ─────────────────────────────────────────────────────────────────
   * A dark gradient behind the text area so a headline stays readable over a
   * busy photo (a source image's own logo block, for example). Returned as
   * plain rgba stops so the canvas painter never has to parse CSS. */
  function scrim(platform, dim) {
    var d = clamp(Number(dim) || 0.45, 0, 0.9);
    var z = safeZone(platform);
    return {
      from: Math.round(z.top * 1000) / 1000,
      to: 1,
      stops: [
        { offset: 0, color: 'rgba(0,0,0,' + (d * 0.35).toFixed(3) + ')' },
        { offset: 0.45, color: 'rgba(0,0,0,' + (d * 0.72).toFixed(3) + ')' },
        { offset: 1, color: 'rgba(0,0,0,' + Math.min(0.95, d + 0.28).toFixed(3) + ')' }
      ]
    };
  }

  /* ── The resolver ──────────────────────────────────────────────────────────
   * opts: { templateId, platform, slide, index, total, style }
   * Returns the complete drawing description. */
  function resolve(opts) {
    opts = opts || {};
    var slide = opts.slide || {};
    var style = opts.style || slide._style || {};
    var platform = opts.platform || (engine && engine.get && (engine.get(opts.templateId) || {}).platform) || 'instagram';
    var template = (engine && engine.get && engine.get(opts.templateId)) || null;
    if (!template && engine && engine.resolve) template = engine.resolve(opts.templateId, platform);
    if (!template) return null;

    var total = Math.max(1, Number(opts.total) || 1);
    var index = Math.max(0, Number(opts.index) || 0);
    var role = (engine && engine.roleFor) ? engine.roleFor(slide, index, total) : (index === 0 ? 'cover' : 'body');

    var canvas = Object.assign({ width: 1080, height: 1350 }, template.canvas || {});
    var roleLayout = (template.slideLayouts && template.slideLayouts[role]) || {};
    var baseLayout = template.layout || {};

    var layers = LAYERS.map(function (L) {
      var spec = (template.typography && template.typography[L.key]) || {};
      var faceId = (style.layerFonts && style.layerFonts[L.key]) || spec.family || 'impact';
      var face = FONTS[faceId] || FONTS.impact;
      var scale = clamp(Number((style.layerScale || {})[L.key]) || 1, 0.5, 1.6);
      var box = (slide.textLayout && slide.textLayout[L.key]) || roleLayout[L.key] || baseLayout[L.key] || { x: 0.08, y: 0.3, width: 0.84, height: 0.2 };
      var text = layerText(slide, L.key);
      var upper = face.upper || spec.transform === 'uppercase' || L.key === 'ctaLine';
      return {
        key: L.key,
        field: L.field,
        label: L.label,
        text: text,
        displayText: upper ? text.toUpperCase() : text,
        empty: !String(text).trim(),
        box: clampToSafeZone({ x: Number(box.x) || 0, y: Number(box.y) || 0, width: Number(box.width) || 0.8, height: Number(box.height) || 0.2 }, platform),
        fontFamily: face.family,
        fontId: faceId,
        fontWeight: face.weight,
        // Font size as a fraction of the card WIDTH. The DOM uses cqw (container
        // width) and the canvas multiplies by W, so both land on the same size.
        sizePct: (Number(spec.size) || 4) * scale / 100,
        lineHeight: Number(spec.lineHeight) || 1.1,
        color: (style.layerColors && style.layerColors[L.key]) || (L.key === 'ctaLine' ? (template.palette && template.palette.accent) : null) || style.textColor || (template.palette && template.palette.text) || '#ffffff',
        align: (style.layerAlign && style.layerAlign[L.key]) || style.textAlign || 'left',
        uppercase: upper
      };
    });

    var image = Object.assign({ mode: 'fullBleed', crop: 'cover', focal: 'center' }, template.image || {});
    var frames = {
      fullBleed: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      panel: { x: 0.08, y: 0.06, width: 0.84, height: 0.42, radius: 12 },
      split: { x: 0.52, y: 0.10, width: 0.40, height: 0.72, radius: 10 }
    };

    return {
      templateId: template.id,
      templateName: template.name,
      platform: platform,
      role: role,
      canvas: canvas,
      aspect: canvas.width / canvas.height,
      palette: Object.assign({ bg: '#0a0a0c', text: '#ffffff', accent: '#ffffff', secondary: '#a1a1aa', dim: 0.45 }, template.palette || {}),
      layers: layers,
      image: image,
      imageFrame: frames[image.mode] || frames.fullBleed,
      decoration: decorationGeometry(template.decoration, canvas, platform),
      scrim: scrim(platform, style.dim != null ? style.dim : (template.palette && template.palette.dim)),
      safeZone: safeZone(platform),
      // True when the card has no text at all — the caller can skip drawing it.
      blank: layers.every(function (l) { return l.empty; })
    };
  }

  /* ── Shared wrapping ───────────────────────────────────────────────────────
   * `measure` is a function (string) -> pixel width. The browser passes a
   * canvas 2D context; the export passes the same. One algorithm, so a line
   * breaks in the same place in both. */
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

  /* CSS for one layer, used by the DOM preview. Sizes are in cqw so the card
   * scales with its container while keeping the export's proportions. */
  function layerCss(layer) {
    return [
      'font-family:' + layer.fontFamily,
      'font-weight:' + layer.fontWeight,
      'font-size:' + (layer.sizePct * 100).toFixed(3) + 'cqw',
      'line-height:' + layer.lineHeight,
      'color:' + layer.color,
      'text-transform:' + (layer.uppercase ? 'uppercase' : 'none'),
      'text-align:' + layer.align
    ].join(';');
  }

  return {
    FONTS: FONTS,
    LAYERS: LAYERS,
    LAYER_KEYS: LAYER_KEYS,
    SAFE_ZONES: SAFE_ZONES,
    layerText: layerText,
    safeZone: safeZone,
    clampToSafeZone: clampToSafeZone,
    decorationGeometry: decorationGeometry,
    scrim: scrim,
    resolve: resolve,
    wrapLines: wrapLines,
    layerCss: layerCss
  };
});
