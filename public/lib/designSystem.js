/* CreatorPulse · Shared graphic design system.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The template catalogue in public/create/templateEngine.js describes what each
 * template is supposed to LOOK like: its palette, gradient, typography scale,
 * per-layer text boxes, image treatment and decoration. Before this file, only
 * the browser preview read any of that. The server renderer
 * (services/statCard.js) never received the template id at all, so it drew
 * every template with the same hardcoded palette + theme + tight 4-line text
 * fit — which is exactly why every template came out looking identical.
 *
 * This module turns a template's raw config into a single resolved "design
 * state" that BOTH renderers consume. One description, two painters, so the
 * preview and the exported image cannot drift apart.
 *
 * Runs in two places, so it uses the repo's UMD pattern:
 *   - Node  : require("../create/templateEngine.js")
 *   - Browser: window.CPTemplateEngine (loaded before this script)
 */

(function (root, factory) {
  var engine;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('../create/templateEngine.js');
  } else {
    engine = root.CPTemplateEngine;
  }
  var api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPDesignSystem = api;
})(typeof window !== 'undefined' ? window : null, function (engine) {
  'use strict';

  var TEMPLATES = (engine && engine.TEMPLATES) || {};

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

  function layerNames(template) {
    var layout = (template && template.layout) || {};
    return Object.keys(layout);
  }

  /* Resolves one template + slide role into the full design state.
   *
   * role is "cover" | "body" | "closing" — matching templateEngine.roleFor, so a
   * carousel's cover and closing slides genuinely use different compositions
   * instead of repeating the cover layout on every slide. */
  function resolve(templateId, opts) {
    opts = opts || {};
    var platform = opts.platform || null;
    var template = (engine && engine.get && engine.get(templateId)) || null;
    if (!template && engine && engine.resolve) template = engine.resolve(templateId, platform);
    if (!template) return null;

    var total = Math.max(1, Number(opts.total) || 1);
    var index = Math.max(0, Number(opts.index) || 0);
    var role = (engine && engine.roleFor)
      ? engine.roleFor(opts.slide || {}, index, total)
      : (index === 0 ? 'cover' : 'body');

    var layoutSource = (template.slideLayouts && template.slideLayouts[role]) || template.layout || {};
    var layout = {};
    layerNames(template).forEach(function (name) {
      layout[name] = Object.assign({}, template.layout[name], layoutSource[name] || {});
    });
    // A role layout may introduce a layer the base layout did not have (e.g. a
    // closing CTA). Include those too.
    Object.keys(layoutSource).forEach(function (name) {
      if (!layout[name]) layout[name] = Object.assign({}, layoutSource[name]);
    });

    var palette = Object.assign({
      bg: '#0a0a0c', text: '#ffffff', accent: '#ffffff',
      secondary: '#a1a1aa', dim: 0.4, gradient: ''
    }, template.palette || {});

    var typography = {};
    Object.keys(template.typography || {}).forEach(function (name) {
      var spec = template.typography[name] || {};
      typography[name] = {
        family: spec.family || 'modern_sans',
        weight: Number(spec.weight) || 700,
        size: Number(spec.size) || 4,
        lineHeight: Number(spec.lineHeight) || 1.1,
        transform: spec.transform || 'none'
      };
    });

    var image = Object.assign({ mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'soft' }, template.image || {});

    // Text boxes as fractions of the stage, plus the line allowance each box
    // can actually hold. This is what lets a headline run to 6-7 lines inside a
    // tall template box instead of being chopped at 4.
    var textBoxes = {};
    Object.keys(layout).forEach(function (name) {
      var box = layout[name];
      var spec = typography[name] || { size: 3.4, lineHeight: 1.2 };
      textBoxes[name] = {
        x: Number(box.x) || 0,
        y: Number(box.y) || 0,
        width: Number(box.width) || 0.8,
        height: Number(box.height) || 0.2,
        // Line height in stage fractions: font size is a percentage of the
        // stage width, so one line occupies (size/100 * lineHeight) of it.
        lineFraction: (spec.size / 100) * spec.lineHeight,
        maxLines: maxLinesForBox(box, 4)
      };
    });

    var design = {
      templateId: template.id,
      platform: template.platform,
      name: template.name,
      canvas: Object.assign({ width: 1080, height: 1350 }, template.canvas || {}),
      role: role,
      palette: palette,
      background: parseGradient(palette.gradient),
      typography: typography,
      layout: layout,
      textBoxes: textBoxes,
      image: image,
      decoration: template.decoration || { type: 'none' },
      safeZones: template.safeZones || null,
      theme: normalizeTheme(opts.theme, 'modern_dark'),
      // Image treatment as box fractions, so the DOM preview and the canvas
      // export position the photo inside the identical region.
      imageFrame: imageFrameFor(image, designCanvas(template))
    };
    return design;
  }

  function designCanvas(template) {
    return Object.assign({ width: 1080, height: 1350 }, (template && template.canvas) || {});
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

  function isKnownTemplate(id) { return !!(TEMPLATES[id]); }

  function list(platform) {
    return Object.keys(TEMPLATES)
      .map(function (id) { return TEMPLATES[id]; })
      .filter(function (t) { return !platform || t.platform === platform; });
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
