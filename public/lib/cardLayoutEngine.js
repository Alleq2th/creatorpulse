/* CreatorPulse · Card layout engine — ONE engine, ONE layout result.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The preview (DOM) and the export (canvas) each used to work out their own
 * font, size, line height, wrapping and box geometry, so they drifted and a
 * downloaded slide did not match the mockup. This engine reads a template SPEC
 * (public/lib/cardTemplates.js), the slide's ROLE, the platform's safe zones and
 * the user's style overrides, and returns ONE plain object describing exactly
 * how the card is drawn. Both painters read that object and nothing else.
 *
 * It also owns auto-fit: every text layer is shrunk until it fits its box, so
 * text never overflows and is never truncated with an ellipsis.
 *
 * Runs in the browser (window.CPCardLayout) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var templates, typography, treatments, contentTypes, roleLayouts;
  if (typeof module !== 'undefined' && module.exports) {
    templates = require('./cardTemplates.js');
    typography = require('./cardTypography.js');
    treatments = require('./photoTreatments.js');
    contentTypes = require('./contentTypes.js');
    roleLayouts = require('./roleLayouts.js');
  } else {
    templates = root.CPCardTemplates;
    typography = root.CPCardTypography;
    treatments = root.CPPhotoTreatments;
    contentTypes = root.CPContentTypes;
    roleLayouts = root.CPRoleLayouts;
  }
  var api = factory(templates, typography, treatments, contentTypes, roleLayouts);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardLayoutEngine = api;
})(typeof window !== 'undefined' ? window : null, function (templates, typography, treatments, contentTypes, roleLayouts) {
  'use strict';

  var LAYERS = [
    { key: 'headline',       field: 'headline',       label: 'Headline' },
    { key: 'supportingText', field: 'supportingText', label: 'Supporting text' },
    { key: 'ctaLine',        field: 'ctaLine',        label: 'Call to action' }
  ];
  var LAYER_KEYS = ['headline', 'supportingText', 'ctaLine'];

  // The largest size each layer may reach when its region does not say. A
  // supporting line or a call to action must stay clearly subordinate to the
  // headline; without this a supporting line defaulted to the headline's own
  // ceiling and rendered as large as the headline itself.
  var DEFAULT_MAX_SIZE = { headline: 0.10, supportingText: 0.034, ctaLine: 0.030 };
  // The smallest size each layer may shrink to when its region does not say.
  // Supporting copy and calls to action must be able to shrink further than a
  // headline, or a long line in a narrow column cannot fit its box at all.
  var DEFAULT_MIN_SIZE = { headline: 0.022, supportingText: 0.013, ctaLine: 0.013 };

  // The canvas each platform renders on. A template's own canvas is its native
  // one, but the same card is previewed and exported in a 16:9 YouTube frame and
  // a 1:1 X frame, so the layout must be resolved for the frame it is drawn in.
  var PLATFORM_CANVAS = {
    instagram: { width: 1080, height: 1350 },
    tiktok: { width: 1080, height: 1920 },
    youtube: { width: 1280, height: 720 },
    twitter: { width: 1080, height: 1080 }
  };

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* A "stack" region breaks its text into short lines (a few words each) so the
   * composition reads as a deliberate ladder rather than a paragraph. The break
   * is a real newline, so the shared wrapper keeps it in both preview and export. */
  function stackWords(text, perLine) {
    var words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    var out = [];
    for (var i = 0; i < words.length; i += perLine) out.push(words.slice(i, i + perLine).join(' '));
    return out.join('\n');
  }

  /* The one word a template may highlight in its accent. The longest meaningful
   * word wins, so the highlight lands on the idea, not on "the" or "and". */
  var STOPWORDS = { the: 1, and: 1, for: 1, that: 1, with: 1, this: 1, from: 1, your: 1, you: 1, are: 1, was: 1, has: 1, have: 1, its: 1, it: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, is: 1, be: 1, as: 1, at: 1, by: 1, or: 1, but: 1, not: 1, all: 1, can: 1, will: 1 };
  function pickKeyword(text) {
    var words = String(text == null ? '' : text).split(/\s+/).map(function (w) { return w.replace(/[^A-Za-z0-9%$]/g, ''); }).filter(Boolean);
    var best = '';
    words.forEach(function (w) {
      if (w.length >= 4 && !STOPWORDS[w.toLowerCase()] && w.length > best.length) best = w;
    });
    return best;
  }

  /* Builds the decoration spec for a card: the template's own decoration, with
   * the editor's accent override and — for the stat template — the slide's stat
   * value, so the giant number is real content and an empty slot is hidden. */
  function decorationSpec(template, style, slide) {
    var spec = Object.assign({}, (template && template.decoration) || { type: 'none' });
    if (style && style.accent) spec.accent = style.accent;
    if (spec.type === 'stat') {
      var s = slide || {};
      spec.value = String(s.stat || s.statValue || s.statNumber || '').trim();
    }
    return spec;
  }

  /* Reads a layer's text from a slide, tolerating the older field names the
   * generator still emits (body / reaction / stat / sectionLabel). */
  function layerText(slide, key) {
    if (!slide) return '';
    if (key === 'headline') return String(slide.headline || slide.hookHeadline || slide.title || '');
    if (key === 'supportingText') return String(slide.supportingText || slide.body || slide.reaction || slide.stat || slide.sectionLabel || '');
    if (key === 'ctaLine') return String(slide.ctaLine || '');
    return '';
  }

  function safeZone(platform, template) {
    return templates.safeZone(platform, template);
  }

  /* Pushes a box inside the platform's safe zone. Width and height are clamped
   * first, then the position, so a box that is too wide or too tall still ends
   * up wholly inside the zone (the old code clamped only x and y). */
  function clampToSafeZone(box, platform, template) {
    var z = safeZone(platform, template);
    var maxW = Math.max(0.1, 1 - z.left - z.right);
    var maxH = Math.max(0.05, 1 - z.top - z.bottom);
    var width = clamp(box.width, 0.05, maxW);
    var height = clamp(box.height, 0.02, maxH);
    var x = clamp(box.x, z.left, Math.max(z.left, 1 - z.right - width));
    var y = clamp(box.y, z.top, Math.max(z.top, 1 - z.bottom - height));
    return { x: x, y: y, width: width, height: height };
  }

  /* Part 6: the 8-point grid. A dragged box is snapped to whole 8-card-pixel
   * steps, so text always lands on the same rhythm as the rest of the design.
   * The snap is applied ONLY to a per-slide override, so every template's own
   * region is left exactly as authored. */
  var GRID = 8;
  function snapFraction(v, canvasSize) {
    var step = GRID / (canvasSize || 1080);
    return Math.round(Number(v) / step) * step;
  }
  function snapBox(box, canvas) {
    var w = (canvas && canvas.width) || 1080;
    var h = (canvas && canvas.height) || 1350;
    return {
      x: snapFraction(box.x, w),
      y: snapFraction(box.y, h),
      width: Math.max(GRID / w, snapFraction(box.width, w)),
      height: Math.max(GRID / h, snapFraction(box.height, h))
    };
  }

  /* Snaps a box to the 8-point grid AND keeps it inside the safe zone, without
   * ever leaving the grid. The safe-zone edges are themselves snapped to the
   * grid first, so clamping to them lands on a whole step: a dragged box is
   * always on the grid and always inside the safe area, at the same time. */
  function snapBoxInZone(box, canvas, zone) {
    var w = (canvas && canvas.width) || 1080;
    var h = (canvas && canvas.height) || 1350;
    var z = zone || { top: 0, bottom: 0, left: 0, right: 0 };
    // The safe-zone edges are snapped INWARD (left/top up, right/bottom down),
    // so a box clamped to them is always strictly inside the true safe zone and
    // still on a whole 8pt step.
    var stepW = GRID / w, stepH = GRID / h;
    var left = Math.ceil(z.left / stepW) * stepW, top = Math.ceil(z.top / stepH) * stepH;
    var right = Math.floor((1 - z.right) / stepW) * stepW, bottom = Math.floor((1 - z.bottom) / stepH) * stepH;
    var snapped = snapBox(box, canvas);
    var width = Math.min(snapped.width, Math.max(stepW, right - left));
    var height = Math.min(snapped.height, Math.max(stepH, bottom - top));
    var x = Math.min(Math.max(snapped.x, left), Math.max(left, right - width));
    var y = Math.min(Math.max(snapped.y, top), Math.max(top, bottom - height));
    return { x: x, y: y, width: width, height: height };
  }

  /* The badge used to be a div with `inset:0` plus left/top, so it stretched to
   * the whole card — the giant coloured blob. Its size is computed here in card
   * pixels and clamped, so it is always a pill. */
  function decorationGeometry(decoration, canvas, platform, template) {
    var d = decoration || { type: 'none' };
    var W = canvas.width, H = canvas.height;
    var z = safeZone(platform, template);
    if (d.type === 'badge') {
      var text = String(d.text || 'FEATURE');
      var fontSize = Math.round(W * 0.026);
      var textW = Math.round(text.length * fontSize * 0.62);
      var padX = Math.round(W * 0.030);
      var padY = Math.round(fontSize * 0.55);
      var w = clamp(textW + padX * 2, Math.round(W * 0.16), Math.round(W * 0.46));
      var h = clamp(fontSize + padY * 2, Math.round(H * 0.030), Math.round(H * 0.062));
      return { type: 'badge', text: text, x: Math.round(W * z.left), y: Math.round(H * z.top), width: w, height: h, radius: Math.round(h / 2), fontSize: fontSize, padX: padX, padY: padY, bg: d.accent || '#f6f6f6' };
    }
    if (d.type === 'rule') return { type: 'rule', x: Math.round(W * z.left), y: Math.round(H * 0.135), width: Math.round(W * 0.16), height: Math.max(4, Math.round(W * 0.006)), bg: d.accent || '#f6f6f6' };
    if (d.type === 'corner') return { type: 'corner', x: 0, y: 0, width: W, height: Math.max(4, Math.round(H * 0.012)), bg: d.accent || '#f6f6f6' };
    if (d.type === 'frame') { var inset = Math.round(W * 0.03); return { type: 'frame', x: inset, y: inset, width: W - inset * 2, height: H - inset * 2, stroke: d.accent || 'rgba(246,246,246,.22)' }; }
    if (d.type === 'orb') return { type: 'orb', cx: Math.round(W * 0.78), cy: Math.round(H * 0.2), r: Math.round(W * 0.34), bg: d.accent || '#f6f6f6' };
    if (d.type === 'stripes') return { type: 'stripes', x: 0, y: Math.round(H * 0.86), width: W, height: Math.round(H * 0.05), bg: d.accent || '#f6f6f6' };
    if (d.type === 'split') return { type: 'split', x: Math.round(W * 0.5), y: 0, width: Math.max(2, Math.round(W * 0.002)), height: H, bg: d.accent || '#f6f6f6' };
    // An oversized quote mark, drawn as a glyph in the accent (Quote Card).
    if (d.type === 'quote') return { type: 'quote', text: '\u201C', x: Math.round(W * z.left), y: Math.round(H * 0.10), size: Math.round(W * 0.30), bg: d.accent || '#f6f6f6' };
    // A thin hairline rule (Editorial Clean) — a rule, not a bar.
    if (d.type === 'hairline') return { type: 'hairline', x: Math.round(W * z.left), y: Math.round(H * 0.10), width: Math.round(W * 0.10), height: Math.max(2, Math.round(W * 0.0025)), bg: d.accent || '#f6f6f6' };
    // A single caption bar pinned to the bottom (Minimal Caption): a strip in
    // the lower quarter, wide and short, with the caption sitting on it.
    if (d.type === 'caption') return { type: 'caption', x: 0, y: Math.round(H * 0.76), width: W, height: Math.round(H * 0.24), bg: 'rgba(22,22,22,.78)' };
    // A giant stat number as the hero (Data & Stat Split). Hidden when empty.
    if (d.type === 'stat') {
      var value = String(d.value || '').trim();
      if (!value) return { type: 'none' };
      // The number is sized to FIT its box: a fixed size clipped a wide value
      // like "87%" against the box edge. The box is the left column of the
      // split, and the size is capped so the glyphs never run past it.
      var statW = Math.round(W * 0.42);
      var statH = Math.round(H * 0.30);
      var perChar = 0.66; // a wide display digit + the % sign
      var fitSize = Math.floor((statW * 0.90) / Math.max(1, value.length * perChar));
      var statSize = Math.max(Math.round(W * 0.06), Math.min(Math.round(W * 0.20), fitSize));
      // Tabular digits, so a stat's figures line up (Part 5).
      return { type: 'stat', text: value, x: Math.round(W * z.left), y: Math.round(H * 0.30), width: statW, height: statH, size: statSize, bg: d.accent || '#f6f6f6', tabular: true };
    }
    return { type: 'none' };
  }

  /* A canvas-backed measure function, so auto-fit uses the real font metrics in
   * the browser. In Node (tests) there is no canvas, so the estimate is used.
   *
   * `tracking` is the letter-spacing the DOM will apply (as a fraction of the
   * font size). The canvas measureText API ignores letter-spacing, so it is
   * added back here — without it a tracked face (the mono and condensed ones)
   * measured narrower than it renders, wrapped into more lines than the box was
   * fitted for, and overflowed. */
  var _measureCtx = null;
  function measureFor(px, family, weight, tracking) {
    var track = Number(tracking) || 0;
    if (typeof document !== 'undefined' && document.createElement) {
      if (!_measureCtx) {
        var c = document.createElement('canvas');
        _measureCtx = c.getContext('2d');
      }
      if (_measureCtx) {
        _measureCtx.font = weight + ' ' + px + 'px ' + family;
        return function (s) {
          var w = _measureCtx.measureText(s).width;
          if (track) w += String(s).length * track * px;
          return w;
        };
      }
    }
    return typography.estimateMeasure(px);
  }

  /* Maps a photo treatment onto the legacy image-mode names the older preview
   * code still reads (fullBleed / panel / split). Derived, never a second
   * source of truth. */
  function legacyImageMode(treatmentId) {
    if (treatmentId === 'splitPanel') return 'split';
    if (treatmentId === 'insetFrame' || treatmentId === 'blurredBackdrop' || treatmentId === 'tallInset') return 'panel';
    return 'fullBleed';
  }

  /* Resolves one template + slide + role into the full layout result.
   * opts: { templateId, platform, slide, index, total, style, measureFor } */
  function resolve(opts) {
    opts = opts || {};
    var slide = opts.slide || {};
    var style = opts.style || slide._style || {};
    var template = templates.get(opts.templateId) || templates.resolve(opts.templateId, opts.platform);
    if (!template) return null;
    var platform = opts.platform || template.platform || 'instagram';

    var total = Math.max(1, Number(opts.total) || 1);
    var index = Math.max(0, Number(opts.index) || 0);
    var role = templates.roleFor(slide, index, total);

    // The canvas the card is actually drawn on. A template declares its native
    // canvas, but the same card is shown in a 16:9 YouTube frame and a 1:1 X
    // frame, so the render canvas follows the PLATFORM (and an explicit
    // opts.canvas wins). Regions are clamped and auto-fitted to it — without
    // this a 4:5 template overflowed its box when rendered at 16:9.
    var canvas = Object.assign({ width: 1080, height: 1350 }, template.canvas || {});
    var platformCanvas = PLATFORM_CANVAS[platform];
    if (platformCanvas) canvas = { width: platformCanvas.width, height: platformCanvas.height };
    if (opts.canvas && opts.canvas.width > 0 && opts.canvas.height > 0) {
      canvas = { width: Number(opts.canvas.width), height: Number(opts.canvas.height) };
    }
    // ── Part 4: the slide's ROLE and CONTENT TYPE ────────────────────────────
    // The role comes from the slide's position (hook / context / detail / cta);
    // the content type from what the story IS (breaking / stat / quote / ...).
    // Both are inputs to the layout, so a stat slide and an opinion slide are
    // laid out differently even inside the same template.
    var roleIntent = roleLayouts.intentFor(role);
    var contentType = contentTypes.detect(slide, opts.contentType, template);
    var variant = contentTypes.variantFor(contentType, template);
    // The hook is governed by the role alone: slide 1 is always the largest type.
    var heroKey = role === 'hook' ? 'headline' : (variant.hero || 'headline');
    var showsStat = variant.hero === 'stat' || (template.decoration && template.decoration.type === 'stat');
    var roleLayout = (template.roles && template.roles[role]) || (template.roles && template.roles.hook) || {};
    var pairing = typography.PAIRINGS[template.pairing] || typography.PAIRINGS.poster;
    var palette = Object.assign({ bg: '#161616', text: '#f6f6f6', accent: '#f6f6f6', secondary: '#b9b9bd', dim: 0.45 }, template.palette || {});
    // The editor can override the single accent, the background and the text
    // colour. Those overrides live in the slide's style and are applied here, so
    // the preview and the export both see them.
    if (style.accent) palette.accent = style.accent;
    if (style.bg) palette.bg = style.bg;
    if (style.textColor) palette.text = style.textColor;

    var layers = LAYERS.map(function (L) {
      // A layer the template does not place gets a sensible default: the
      // headline keeps the old generic box, but a supporting line or a CTA is
      // pinned to the bottom of the card. Without this, a template that only
      // declares a headline (neon_noir's hook) drew its CTA at y=0.3 — floating
      // in the middle of the card, above the headline.
      var region = roleLayout[L.key] || (L.key === 'headline'
        ? { x: 0.08, y: 0.3, width: 0.84, height: 0.2, align: 'left', anchor: 'top', maxLines: 5, minSize: 0.022, maxSize: 0.10 }
        : L.key === 'supportingText'
          ? { x: 0.08, y: 0.80, width: 0.84, height: 0.10, align: 'left', anchor: 'top', maxLines: 3, minSize: 0.013, maxSize: 0.034 }
          : { x: 0.08, y: 0.90, width: 0.84, height: 0.06, align: 'left', anchor: 'top', maxLines: 1, minSize: 0.013, maxSize: 0.030 });
      var faceId = (style.layerFonts && style.layerFonts[L.key]) || pairing[L.key] || 'impact';
      var face = typography.face(faceId);
      var text = layerText(slide, L.key);
      var upper = face.upper || L.key === 'ctaLine';
      var displayText = upper ? text.toUpperCase() : text;
      // A "stack" region breaks the headline into short lines (3-4 words) so the
      // composition reads as a deliberate ladder rather than a paragraph.
      if (region.stack && displayText) displayText = stackWords(displayText, 4);
      // Part 6: a per-slide box override (drag-to-reposition) wins over the
      // template's own region. It is snapped to the 8-point grid and clamped to
      // the safe zone, so a dragged box lands on the grid and can never leave
      // the safe area. Without an override the template's region is used
      // unchanged, so every existing layout is untouched.
      var override = slide.textLayout && slide.textLayout[L.key];
      var geom = override || region;
      var rawBox = { x: Number(geom.x) || 0, y: Number(geom.y) || 0, width: Number(geom.width) || 0.8, height: Number(geom.height) || 0.2 };
      var box = override ? snapBoxInZone(rawBox, canvas, safeZone(platform, template)) : clampToSafeZone(rawBox, platform, template);
      // Part 4: the content type may nudge the HEADLINE block — a stat slide
      // lifts it to clear the giant number, a breaking slide sits higher. Only
      // the headline moves: shifting the supporting line too would push it into
      // the CTA below. The hook is governed by the role alone, so it is never
      // nudged.
      if (!override && role !== 'hook' && variant.shiftY && L.key === 'headline') {
        var shifted = clampToSafeZone(Object.assign({}, box, { y: box.y + variant.shiftY }), platform, template);
        // If the box already sits against the safe-zone edge, the nudge would be
        // clamped away; nudge the other way so the content type still changes
        // the layout rather than silently collapsing onto the default.
        if (Math.abs(shifted.y - box.y) < 1e-6) {
          shifted = clampToSafeZone(Object.assign({}, box, { y: box.y + (variant.fallbackShift || 0) }), platform, template);
        }
        box = shifted;
      }
      var scale = clamp(Number((style.layerScale || {})[L.key]) || 1, 0.5, 1.6);
      // BUG FIX (text size S/M/L did nothing): the scale only raised the font's
      // CEILING, but auto-fit then shrank the text right back to the template's
      // fixed box, so Large looked the same as Medium. A bigger size needs a
      // bigger box too, so the box grows with the scale (kept inside the safe
      // zone). A dragged box (override) keeps the exact geometry the user set.
      if (scale > 1 && !override) {
        box = clampToSafeZone(Object.assign({}, box, { width: box.width * scale, height: box.height * scale }), platform, template);
      }
      // The role's own intent scales the template's ceiling: the hook is the
      // largest type, the CTA a touch calmer. The content type then scales it
      // again, so a stat slide makes room for the number and a quote slide gives
      // the quote more room.
      var roleScale = L.key === 'headline' ? roleIntent.heroScale : roleIntent.supportingScale;
      // The hook is governed by the role alone: slide 1 is always the largest
      // type, whatever the story is, so the content type never shrinks it.
      var typeScale = role === 'hook' ? 1 : (L.key === 'headline' ? (variant.headlineScale || 1) : (variant.supportingScale || 1));
      var baseSize = clamp(Number(region.maxSize) || DEFAULT_MAX_SIZE[L.key] || 0.06, Number(region.minSize) || DEFAULT_MIN_SIZE[L.key] || 0.022, 0.12) * scale * roleScale * typeScale;
      // Part 5: a hero line must not run past ~18 characters, so the hero's box
      // is capped at the width that many characters need. The cap is a MAXIMUM,
      // so a template whose box is already narrower is left alone. It is only
      // applied when the hero is genuinely display-sized: a small-type template
      // (a caption card) keeps its own box, or the cap would force its short
      // copy into more lines than the box allows.
      var heroCap = null;
      if (L.key === heroKey && !region.stack && baseSize >= 0.05 && displayText) {
        // Target ~18 characters of THIS text, using its own average character
        // width, so a line of narrow letters is not allowed to run long just
        // because the box was sized for wide ones.
        var capMeasure = typography.estimateMeasure(baseSize * canvas.width);
        var avgChar = capMeasure(displayText) / Math.max(1, displayText.length);
        var capPx = avgChar * typography.HERO_MAX_CHARS;
        heroCap = clamp(capPx / canvas.width, 0.30, 0.92);
      }
      var fitBoxW = box.width * 0.90;
      if (heroCap && fitBoxW > heroCap) fitBoxW = heroCap;
      var fitBoxH = box.height * 0.90;
      // The leading the face wants (tight on condensed, looser on serif). If
      // that leading cannot fit the box, the engine steps it back toward the
      // neutral 1.12 rather than overflow — the box is the hard constraint.
      var leading = typography.leadingFor(faceId);
      var fit = typography.autoFit({
        text: displayText,
        // A safety margin: the browser's real font metrics and its own line
        // breaking are slightly wider/taller than the canvas measure, so fitting
        // to 100% of the box could still overflow by a few pixels after a late
        // font swap. 0.90/0.95 leaves enough headroom that the DOM never
        // overflows its box in a real browser.
        boxW: fitBoxW, boxH: box.height * 0.90,
        canvasW: canvas.width, canvasH: canvas.height,
        lineHeight: leading,
        heightFactor: typography.lineBoxFactor(faceId),
        maxLines: Number(region.maxLines) || 5,
        minPct: Number(region.minSize) || DEFAULT_MIN_SIZE[L.key] || 0.022,
        maxPct: baseSize,
        measureFor: opts.measureFor || function (px) { return measureFor(px, face.family, face.weight, typography.trackingFor({ fontId: faceId, tracking: region.tracking })); }
      });
      if (!fit.fits && leading > 1.12) {
        leading = 1.12;
        fit = typography.autoFit({
          text: displayText,
          boxW: fitBoxW, boxH: box.height * 0.90,
          canvasW: canvas.width, canvasH: canvas.height,
          lineHeight: leading,
          heightFactor: typography.lineBoxFactor(faceId),
          maxLines: Number(region.maxLines) || 5,
          minPct: Number(region.minSize) || DEFAULT_MIN_SIZE[L.key] || 0.022,
          maxPct: baseSize,
          measureFor: opts.measureFor || function (px) { return measureFor(px, face.family, face.weight, typography.trackingFor({ fontId: faceId, tracking: region.tracking })); }
        });
      }
      // `anchor: 'bottom'` pins the text block to the BOTTOM of its box (Bold
      // Impact's headline is the last thing on the card). The box's BOTTOM edge
      // is unchanged, so the safe-zone clamp still holds; the box is shrunk to
      // wrap the text (with a little headroom) and moved down to meet that edge.
      var anchor = region.anchor || 'top';
      // A dragged box keeps the exact geometry the user placed: the anchor
      // shrink is skipped for an override, or it would silently move the box
      // back to the template's own bottom edge.
      if (anchor === 'bottom' && !override) {
        var textH = (fit.lines.length * fit.sizePct * canvas.width * fit.lineHeight * typography.lineBoxFactor(faceId)) / canvas.height;
        var boxH = Math.min(box.height, textH);
        box = { x: box.x, y: box.y + (box.height - boxH), width: box.width, height: boxH };
      }
      return {
        key: L.key,
        field: L.field,
        label: L.label,
        text: text,
        displayText: displayText,
        empty: !String(text).trim(),
        box: box,
        align: (style.layerAlign && style.layerAlign[L.key]) || region.align || 'left',
        anchor: region.anchor || 'top',
        fontFamily: face.family,
        fontId: faceId,
        fontWeight: face.weight,
        tracking: typography.trackingFor({ fontId: faceId, tracking: region.tracking }),
        sizePct: fit.sizePct,
        lineHeight: fit.lineHeight,
        lines: fit.lines,
        // The box the fit actually ran against (after the hero line-length cap),
        // so a test can reproduce the engine's own fit exactly.
        fitBoxW: fitBoxW,
        fitBoxH: fitBoxH,
        fitMaxPct: baseSize,
        fits: fit.fits,
        maxLines: Number(region.maxLines) || 5,
        color: (style.layerColors && style.layerColors[L.key]) || (L.key === 'ctaLine' ? palette.accent : null) || style.textColor || palette.text,
        uppercase: upper,
        // Part 5: tabular digits on a stat, so the figures line up.
        tabular: L.key === 'supportingText' && showsStat,
        // Part 5: one keyword per headline, auto-picked, in the accent.
        keyword: (L.key === 'headline' && (region.keyword || variant.keyword)) ? typography.pickKeyword(displayText) : '',
        keywordColor: palette.accent
      };
    });

    // Part 5: hierarchy with scale contrast. The hero must be at least 2.5x the
    // supporting text; if it is not, the supporting layers are shrunk until it
    // is. The hero's own size is never touched, so the hook stays the largest.
    var heroLayer = layers.find(function (l) { return l.key === heroKey; });
    typography.enforceScaleContrast(layers, heroKey, heroLayer && heroLayer.sizePct);

    var treatment = treatments.resolve(style.treatmentId || (template.treatment && template.treatment.id) || 'fullBleedScrim', {
      accent: palette.accent,
      dim: style.dim != null ? style.dim : palette.dim,
      side: template.treatment && template.treatment.options && template.treatment.options.side
    });

    // Part 3: the scrim rule. Wherever a text box overlaps the photo, a scrim
    // must darken the photo under it. `scrimFor` is the ONE place that decides.
    var scrim = treatments.scrimFor(treatment, layers.map(function (l) {
      return { x: l.box.x, y: l.box.y, width: l.box.width, height: l.box.height, empty: l.empty };
    }));

    // Part 4: carousel continuity — the counter / progress dots drawn into the
    // image, the one margin system, and the single accent for the whole set.
    var continuity = roleLayouts.continuity(index, total, palette.accent);
    var counter = roleLayouts.counterGeometry(continuity, canvas, safeZone(platform, template));

    // Legacy-compatible views of the SAME result, so the export renderer
    // (services/statCard.js) and older callers keep working without a second
    // layout path. They are derived from `layers`, never computed separately.
    var textBoxes = {};
    var typographyMap = {};
    layers.forEach(function (l) {
      textBoxes[l.key] = { x: l.box.x, y: l.box.y, width: l.box.width, height: l.box.height, lineFraction: l.sizePct * l.lineHeight, maxLines: l.maxLines };
      typographyMap[l.key] = { family: l.fontId, weight: l.fontWeight, size: l.sizePct * 100, lineHeight: l.lineHeight, transform: l.uppercase ? 'uppercase' : 'none' };
    });

    return {
      templateId: template.id,
      templateName: template.name,
      name: template.name,
      platform: platform,
      role: role,
      roleIntent: roleIntent,
      contentType: contentType,
      contentVariant: variant,
      heroKey: heroKey,
      canvas: canvas,
      aspect: canvas.width / canvas.height,
      palette: palette,
      pairing: template.pairing,
      accentUse: template.accentUse || {},
      layers: layers,
      treatment: treatment,
      scrim: scrim,
      continuity: continuity,
      counter: counter,
      textBoxes: textBoxes,
      typography: typographyMap,
      image: { mode: legacyImageMode(treatment.id), crop: 'cover', focal: 'center', frame: treatment.frame, filter: treatment.filter },
      imageFrame: treatment.frame,
      decoration: decorationGeometry(decorationSpec(template, style, slide, variant), canvas, platform, template),
      safeZone: safeZone(platform, template),
      blank: layers.every(function (l) { return l.empty; })
    };
  }

  /* Shared wrapping, kept as a named export so existing callers keep working. */
  function wrapLines(measure, text, maxWidth) {
    return typography.wrapLines(measure, text, maxWidth);
  }

  /* CSS for one layer, used by the DOM preview. */
  function layerCss(layer) {
    return typography.layerCss(layer);
  }

  return {
    LAYERS: LAYERS,
    LAYER_KEYS: LAYER_KEYS,
    FONTS: typography.FONTS,
    SAFE_ZONES: templates.SAFE_ZONES,
    PLATFORM_CANVAS: PLATFORM_CANVAS,
    layerText: layerText,
    safeZone: safeZone,
    clampToSafeZone: clampToSafeZone,
    GRID: GRID,
    snapFraction: snapFraction,
    snapBox: snapBox,
    snapBoxInZone: snapBoxInZone,
    decorationGeometry: decorationGeometry,
    resolve: resolve,
    wrapLines: wrapLines,
    layerCss: layerCss
  };
});
