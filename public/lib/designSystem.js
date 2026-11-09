/* CreatorPulse · Shared graphic design system — adapter over the layout engine.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The server renderer (services/statCard.js) needs a resolved "design state" for
 * a template: its palette, background gradient, decoration, image treatment and
 * per-layer text boxes. That used to be computed here, independently of the
 * browser preview — a second layout path, which is exactly how the preview and
 * the export drifted apart.
 *
 * This file is now an ADAPTER. It calls the one layout engine
 * (public/lib/cardLayoutEngine.js, which reads the declarative specs in
 * public/lib/cardTemplates.js) and maps its result into the shape the export
 * already consumes. There is ONE layout path; this file adds no layout logic of
 * its own — it only renames fields and parses the template's CSS gradient into a
 * descriptor both renderers can execute.
 *
 * Runs in two places, so it uses the repo's UMD pattern:
 *   - Node  : require("./cardLayoutEngine.js")
 *   - Browser: window.CPCardLayoutEngine (loaded before this script)
 */

(function (root, factory) {
  var engine, templates;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('./cardLayoutEngine.js');
    templates = require('./cardTemplates.js');
  } else {
    engine = root.CPCardLayoutEngine;
    templates = root.CPCardTemplates;
  }
  var api = factory(engine, templates);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPDesignSystem = api;
})(typeof window !== 'undefined' ? window : null, function (engine, templates) {
  'use strict';

  /* Legacy theme keys written by an earlier Create flow. They are NOT theme
   * names (there is no "gradient" or "bold_accent" theme in services/statCard),
   * so they used to fall through to the default and paint every card the same.
   * Kept as an alias table so content saved before the fix still resolves. */
  var LEGACY_THEME_ALIASES = {
    gradient: 'modern_dark',
    bold_accent: 'cyber_neon',
    bold: 'cyber_neon',
    dark: 'modern_dark',
    light: 'clean_light'
  };

  function normalizeTheme(key, fallback) {
    var k = String(key || '').trim().toLowerCase();
    if (LEGACY_THEME_ALIASES[k]) return LEGACY_THEME_ALIASES[k];
    return k || fallback || 'modern_dark';
  }

  /* Splits on commas that are NOT inside parentheses, so
   * "rgba(0,0,0,.35)" survives as one stop instead of becoming three. */
  function splitTopLevel(input) {
    var out = [];
    var depth = 0;
    var buf = '';
    for (var i = 0; i < input.length; i++) {
      var ch = input[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(buf); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf);
    return out.map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* Parses a CSS gradient string into a descriptor both renderers can execute.
   *
   * The canvas exporter and the browser preview previously disagreed here: the
   * DOM applied the raw CSS string (so radial glows worked), while the canvas
   * exporter only understood "linear-gradient" and silently skipped everything
   * else — the export lost the template's background entirely. Returning a
   * structured descriptor removes that divergence. */
  function parseGradient(css) {
    if (!css || typeof css !== 'string') return null;
    var m = /^\s*(linear|radial)-gradient\((.*)\)\s*$/i.exec(css);
    if (!m) return null;
    var kind = m[1].toLowerCase();
    var parts = splitTopLevel(m[2]);
    var angle = 180;
    var stops = [];
    parts.forEach(function (part, index) {
      var angleMatch = /^(-?[\d.]+)deg$/.exec(part);
      if (angleMatch && index === 0) { angle = Number(angleMatch[1]); return; }
      // "circle at 50% 30%" is the radial shape/position prologue, not a stop.
      if (!/#|rgb|hsl|transparent|currentcolor/i.test(part)) return;
      var posMatch = /^(.*?)(?:\s+(-?[\d.]+)%)?$/.exec(part);
      var color = (posMatch && posMatch[1] ? posMatch[1] : part).trim();
      var stop = { color: color };
      if (posMatch && posMatch[2] != null) stop.offset = Math.max(0, Math.min(1, Number(posMatch[2]) / 100));
      stops.push(stop);
    });
    if (!stops.length) return null;
    // Fill in any missing offsets so a stop list is always monotonically spaced.
    stops.forEach(function (s, i) {
      if (s.offset == null) s.offset = stops.length === 1 ? 0 : i / (stops.length - 1);
    });
    return { kind: kind, angle: angle, stops: stops, css: css };
  }

  /* The character-based line fit the server used to force on every template is
   * what truncated headlines into 3-4 chopped lines. A template that declares
   * its own box can afford more lines, so the allowance scales with the box
   * height the template asked for. */
  function maxLinesForBox(box, baseLines) {
    var h = Number(box && box.height) || 0;
    if (h <= 0) return baseLines;
    var lines = Math.round(h * 11);
    return Math.max(baseLines, Math.min(9, lines));
  }

  /* Where the photo sits on the card, as fractions of the stage.
   * fullBleed = whole card, panel = top banner, split = right column. */
  var IMAGE_FRAMES = {
    fullBleed: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
    panel: { x: 0.08, y: 0.06, width: 0.84, height: 0.42, radius: 12 },
    split: { x: 0.52, y: 0.10, width: 0.40, height: 0.72, radius: 10 }
  };

  function imageFrameFor(image, canvas) {
    var frame = IMAGE_FRAMES[(image && image.mode) || 'fullBleed'] || IMAGE_FRAMES.fullBleed;
    return Object.assign({}, frame, {
      focalY: image && image.focal === 'subject' ? 0.38 : 0.5
    });
  }

  /* The six story roles the engine resolves map onto the three the export's
   * renderers and older callers know: cover / body / closing. */
  function legacyRole(role) {
    if (role === 'hook') return 'cover';
    if (role === 'cta') return 'closing';
    return 'body';
  }

  /* Resolves one template + slide into the full design state, by delegating to
   * the single layout engine and mapping its result into the export's shape. */
  function resolve(templateId, opts) {
    opts = opts || {};
    var platform = opts.platform || null;
    var slide = opts.slide || {};
    var design = engine && engine.resolve
      ? engine.resolve({
          templateId: templateId,
          platform: platform,
          slide: slide,
          index: opts.index,
          total: opts.total,
          style: opts.style || slide._style || {}
        })
      : null;
    if (!design) return null;

    var palette = design.palette;
    var layout = {};
    var textBoxes = {};
    var typography = {};
    design.layers.forEach(function (l) {
      layout[l.key] = { x: l.box.x, y: l.box.y, width: l.box.width, height: l.box.height };
      textBoxes[l.key] = { x: l.box.x, y: l.box.y, width: l.box.width, height: l.box.height, lineFraction: l.sizePct * l.lineHeight, maxLines: l.maxLines };
      typography[l.key] = { family: l.fontId, weight: l.fontWeight, size: l.sizePct * 100, lineHeight: l.lineHeight, transform: l.uppercase ? 'uppercase' : 'none' };
    });

    return {
      templateId: design.templateId,
      platform: design.platform,
      name: design.templateName,
      canvas: design.canvas,
      role: legacyRole(design.role),
      storyRole: design.role,
      palette: palette,
      background: parseGradient(palette.gradient),
      typography: typography,
      layout: layout,
      textBoxes: textBoxes,
      image: design.image,
      decoration: design.decoration,
      safeZones: design.safeZone,
      theme: normalizeTheme(opts.theme, 'modern_dark'),
      imageFrame: design.imageFrame,
      // The engine's own result, so the export can read the pre-wrapped lines,
      // the resolved font/size and the photo treatment directly.
      layers: design.layers,
      treatment: design.treatment,
      scrim: design.scrim,
      // The white text panel (the White Panel family), so the export draws the
      // same panel the preview does.
      panel: design.panel || null,
      accentUse: design.accentUse
    };
  }

  function isKnownTemplate(id) { return !!(templates && templates.get && templates.get(id)); }

  function list(platform) {
    return (templates && templates.list) ? templates.list(platform) : [];
  }

  /* The gradient a template uses as its scrim when it has a photo, or as its
   * whole background when it does not. Returns a plain rgba stop list so the
   * canvas renderer never has to understand CSS syntax. */
  function scrimStops(design, dimOverride) {
    if (!design) return null;
    var dim = dimOverride != null ? dimOverride : Number(design.palette.dim);
    if (!Number.isFinite(dim)) dim = 0.4;
    dim = Math.max(0, Math.min(0.9, dim));
    var parsed = design.background;
    if (!parsed) {
      return { kind: 'linear', angle: 180, stops: [
        { offset: 0, color: 'rgba(0,0,0,' + (dim * 0.6).toFixed(3) + ')' },
        { offset: 1, color: 'rgba(0,0,0,' + Math.min(0.97, dim + 0.3).toFixed(3) + ')' }
      ] };
    }
    return parsed;
  }

  return {
    resolve: resolve,
    list: list,
    isKnownTemplate: isKnownTemplate,
    parseGradient: parseGradient,
    splitTopLevel: splitTopLevel,
    normalizeTheme: normalizeTheme,
    imageFrameFor: imageFrameFor,
    scrimStops: scrimStops,
    maxLinesForBox: maxLinesForBox,
    IMAGE_FRAMES: IMAGE_FRAMES,
    LEGACY_THEME_ALIASES: LEGACY_THEME_ALIASES
  };
});
