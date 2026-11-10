/* CreatorPulse · Photo treatments — one named function per treatment.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Every template used to place its photo the same way: a full-bleed cover crop
 * with a dark gradient. The only thing that changed between templates was the
 * colour of the gradient, so the cards read as the same design in different
 * paint. A treatment is now a real, named composition — where the photo sits,
 * how it is graded, and where the text is allowed to live — and each template
 * picks exactly one.
 *
 * Every treatment returns a plain descriptor (fractions of the canvas, plain
 * rgba stops, numeric filters). The DOM preview and the canvas export both read
 * that descriptor, so a treatment looks identical in both.
 *
 * THE SCRIM RULE (enforced by the tests)
 * --------------------------------------
 * Wherever a text box overlaps the photo, a scrim must darken the photo under
 * it, so a source photo's own logo or a bright block never fights the type.
 * `scrimFor(treatment, textBoxes)` is the ONE place that decides this: it
 * returns the scrim stops when any text box overlaps the photo frame, and null
 * when the type sits on its own solid field. A treatment may also declare a
 * `scrim` of its own (a full-bleed card always wants one); the rule then keeps
 * it. `highContrastRegions()` finds the busy areas of a photo (by luminance
 * variance) so a caller can assert that a high-contrast region under text is
 * never left unscrimmed.
 *
 * Runs in the browser (window.CPPhotoTreatments) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPPhotoTreatments = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* A dark gradient behind the text area, so a headline stays readable over a
   * busy photo. Returned as plain rgba stops so the canvas painter never has to
   * parse CSS. `dim` is 0-0.9. */
  function scrimStops(dim, from, to) {
    var d = clamp(Number(dim) || 0.45, 0, 0.9);
    return {
      from: clamp(from == null ? 0 : from, 0, 1),
      to: clamp(to == null ? 1 : to, 0, 1),
      stops: [
        { offset: 0, color: 'rgba(0,0,0,' + (d * 0.30).toFixed(3) + ')' },
        { offset: 0.45, color: 'rgba(0,0,0,' + (d * 0.70).toFixed(3) + ')' },
        { offset: 1, color: 'rgba(0,0,0,' + Math.min(0.95, d + 0.30).toFixed(3) + ')' }
      ]
    };
  }

  /* 1. FULL-BLEED + SCRIM — the photo is the whole card; a gradient darkens the
   *    lower two-thirds so the headline sits on a readable field. */
  function fullBleedScrim(ctx) {
    var dim = ctx.dim;
    return {
      id: 'fullBleedScrim',
      name: 'Full-bleed + scrim',
      frame: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      filter: { brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0 },
      scrim: scrimStops(dim, 0.18, 1),
      tint: null,
      rule: null,
      backdrop: null,
      textZone: { x: 0.06, y: 0.30, width: 0.88, height: 0.62 }
    };
  }

  /* 2. DUOTONE — the photo is desaturated and tinted with the template's single
   *    accent, so the image and the type share one colour. Text sits on the
   *    darker half. */
  function duotone(ctx) {
    var accent = ctx.accent || '#f43f5e';
    return {
      id: 'duotone',
      name: 'Duotone',
      frame: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      filter: { brightness: 0.92, contrast: 1.12, saturation: 0, blur: 0, grayscale: 1 },
      scrim: scrimStops(Math.max(0.5, ctx.dim), 0.30, 1),
      tint: { color: accent, alpha: 0.42, blend: 'multiply' },
      rule: null,
      backdrop: null,
      textZone: { x: 0.07, y: 0.34, width: 0.86, height: 0.58 }
    };
  }

  /* 3. SPLIT PANEL — the photo owns one column, the type owns the other. The
   *    two never overlap, so no scrim is needed. */
  function splitPanel(ctx) {
    var side = ctx.side === 'left' ? 'left' : 'right';
    var frame = side === 'left'
      ? { x: 0, y: 0, width: 0.46, height: 1, radius: 0 }
      : { x: 0.54, y: 0, width: 0.46, height: 1, radius: 0 };
    var textZone = side === 'left'
      ? { x: 0.52, y: 0.14, width: 0.42, height: 0.72 }
      : { x: 0.06, y: 0.14, width: 0.42, height: 0.72 };
    return {
      id: 'splitPanel',
      name: 'Split panel',
      frame: frame,
      filter: { brightness: 1, contrast: 1.04, saturation: 1, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: { x: side === 'left' ? 0.46 : 0.54, y: 0, width: 0.004, height: 1, color: ctx.accent || '#38bdf8' },
      backdrop: null,
      textZone: textZone
    };
  }

  /* 4. INSET FRAME — the photo is a framed panel with a hairline border; the
   *    type sits below it on the template's own background. */
  function insetFrame(ctx) {
    return {
      id: 'insetFrame',
      name: 'Inset frame',
      frame: { x: 0.08, y: 0.07, width: 0.84, height: 0.44, radius: 0.02 },
      filter: { brightness: 1, contrast: 1.02, saturation: 1.02, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: null,
      border: { color: ctx.accent || '#e4e4e7', alpha: 0.55, width: 0.002 },
      backdrop: null,
      textZone: { x: 0.08, y: 0.55, width: 0.84, height: 0.38 }
    };
  }

  /* 4b. TALL INSET — the photo is a TALL panel on one side (a portrait crop)
   *    with a hairline border, and the type owns the other column. This is the
   *    Editorial Clean composition: a narrow type column beside a tall photo. */
  function tallInset(ctx) {
    var side = ctx.side === 'left' ? 'left' : 'right';
    var frame = side === 'left'
      ? { x: 0.06, y: 0.08, width: 0.40, height: 0.84, radius: 0.01 }
      : { x: 0.54, y: 0.08, width: 0.40, height: 0.84, radius: 0.01 };
    var textZone = side === 'left'
      ? { x: 0.50, y: 0.10, width: 0.44, height: 0.80 }
      : { x: 0.06, y: 0.10, width: 0.44, height: 0.80 };
    return {
      id: 'tallInset',
      name: 'Tall inset',
      frame: frame,
      filter: { brightness: 1, contrast: 1.02, saturation: 1.02, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: null,
      border: { color: ctx.accent || '#e4e4e7', alpha: 0.45, width: 0.002 },
      backdrop: null,
      textZone: textZone
    };
  }

  /* 5. BLURRED BACKDROP — a blurred, darkened copy of the photo fills the card
   *    and a sharp copy sits inset on top. The blur is the field the type reads
   *    against, so the sharp photo can stay bright. */
  function blurredBackdrop(ctx) {
    return {
      id: 'blurredBackdrop',
      name: 'Blurred backdrop',
      frame: { x: 0.10, y: 0.10, width: 0.80, height: 0.50, radius: 0.02 },
      filter: { brightness: 1, contrast: 1.02, saturation: 1, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: null,
      backdrop: { frame: { x: 0, y: 0, width: 1, height: 1 }, blur: 26, dim: 0.55 },
      textZone: { x: 0.08, y: 0.64, width: 0.84, height: 0.30 }
    };
  }

  /* 6. SUBJECT-AWARE CROP — the photo is full-bleed, but the crop is biased
   *    toward the UPPER-MIDDLE of the source, where a face usually is, so a
   *    portrait is not decapitated by a centre crop. The type sits low on a
   *    scrim, exactly as on a full-bleed card. */
  function subjectAwareCrop(ctx) {
    var dim = ctx.dim;
    return {
      id: 'subjectAwareCrop',
      name: 'Subject-aware crop',
      frame: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      filter: { brightness: 1, contrast: 1.03, saturation: 1, blur: 0, grayscale: 0 },
      scrim: scrimStops(dim, 0.22, 1),
      tint: null,
      rule: null,
      backdrop: null,
      // The crop bias: 0.5 = centre, 0.38 = upper-middle (faces). The export
      // and the preview both read this, so the crop cannot drift between them.
      focal: { x: 0.5, y: 0.38 },
      textZone: { x: 0.06, y: 0.34, width: 0.88, height: 0.58 }
    };
  }

  /* 7. HARD CROP + ACCENT RULE — the photo is cropped hard to a band and a
   *    single accent rule marks the edge between photo and type. */
  function hardCropRule(ctx) {
    return {
      id: 'hardCropRule',
      name: 'Hard crop + accent rule',
      frame: { x: 0, y: 0, width: 1, height: 0.52, radius: 0 },
      filter: { brightness: 0.98, contrast: 1.10, saturation: 1.05, blur: 0, grayscale: 0 },
      scrim: scrimStops(0.35, 0.30, 0.52),
      tint: null,
      rule: { x: 0.08, y: 0.52, width: 0.20, height: 0.006, color: ctx.accent || '#fbbf24' },
      backdrop: null,
      textZone: { x: 0.08, y: 0.58, width: 0.84, height: 0.34 }
    };
  }

  /* 9. WHITE PANEL — the reference design the user pointed at: the news photo
   *    fills the card as a full-bleed background layer, and a clean white panel
   *    sits over the bottom of it carrying the headline. The type is DARK on
   *    white, so no scrim is needed (a scrim would only dirty the panel). The
   *    panel geometry is a descriptor, not a hardcoded box, so the DOM preview,
   *    the canvas export and the server renderer all draw the same panel. */
  function whitePanel(ctx) {
    return {
      id: 'whitePanel',
      name: 'White panel',
      // Full-bleed: the photo is the card's background layer, edge to edge.
      frame: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      filter: { brightness: 1, contrast: 1.02, saturation: 1.02, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: null,
      backdrop: null,
      // The white text panel. `height` is the fraction of the card it covers on
      // a 4:5 card; `tallHeight` is the (shorter) fraction on a 9:16 card, where
      // the extra height belongs to the photo. `overlap` lifts the panel a
      // little over the photo so the seam reads as a deliberate card edge.
      panel: { height: 0.34, tallHeight: 0.36, bg: '#fbfaf7', radius: 0.035, overlap: 0.012 },
      textZone: { x: 0.075, y: 0.66, width: 0.85, height: 0.30 }
    };
  }

  /* 10. WHITE PANEL, INSET — the second reference layout: the same white
   *    text-under treatment, but the panel is a rounded card that overlaps the
   *    photo, and the photo is graded slightly warmer. Structurally different
   *    from whitePanel (rounded, overlapping, taller panel), not a repaint. */
  function whitePanelInset(ctx) {
    return {
      id: 'whitePanelInset',
      name: 'White panel, inset',
      frame: { x: 0, y: 0, width: 1, height: 1, radius: 0 },
      filter: { brightness: 1.01, contrast: 1.04, saturation: 1.06, blur: 0, grayscale: 0 },
      scrim: null,
      tint: null,
      rule: null,
      backdrop: null,
      panel: { height: 0.38, tallHeight: 0.40, bg: '#fbfaf7', radius: 0.028, overlap: 0.022 },
      textZone: { x: 0.075, y: 0.62, width: 0.85, height: 0.34 }
    };
  }

  var TREATMENTS = {
    fullBleedScrim: fullBleedScrim,
    whitePanel: whitePanel,
    whitePanelInset: whitePanelInset,
    duotone: duotone,
    splitPanel: splitPanel,
    insetFrame: insetFrame,
    tallInset: tallInset,
    blurredBackdrop: blurredBackdrop,
    subjectAwareCrop: subjectAwareCrop,
    hardCropRule: hardCropRule
  };

  var NAMES = {
    fullBleedScrim: 'Full-bleed + scrim',
    whitePanel: 'White panel',
    whitePanelInset: 'White panel, inset',
    duotone: 'Duotone',
    splitPanel: 'Split panel',
    insetFrame: 'Inset frame',
    tallInset: 'Tall inset',
    blurredBackdrop: 'Blurred backdrop',
    subjectAwareCrop: 'Subject-aware crop',
    hardCropRule: 'Hard crop + accent rule'
  };

  /* The six treatments the design brief names, in the order it names them. The
   * other two (tallInset, hardCropRule) are the platform's own extra variants. */
  var REQUIRED = ['fullBleedScrim', 'duotone', 'splitPanel', 'insetFrame', 'blurredBackdrop', 'subjectAwareCrop'];

  /* Resolves a treatment id into its descriptor. `ctx` carries the template's
   * accent, dim and any per-template options (e.g. which side a split sits on).
   * An unknown id falls back to full-bleed, so a bad value never blanks a card. */
  function resolve(id, ctx) {
    var fn = TREATMENTS[id] || TREATMENTS.fullBleedScrim;
    var out = fn(ctx || {});
    out.id = TREATMENTS[id] ? id : 'fullBleedScrim';
    return out;
  }

  function list() {
    return Object.keys(TREATMENTS).map(function (id) { return { id: id, name: NAMES[id] }; });
  }

  /* ── The scrim rule ────────────────────────────────────────────────────────
   * Does a box overlap the photo frame? Touching edges do not count. */
  function overlaps(a, b) {
    if (!a || !b) return false;
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  /* The scrim a card must draw, given its treatment and the text boxes the
   * engine resolved. Returns the scrim stops when ANY text box overlaps the
   * photo frame (or when the treatment declares its own scrim, e.g. a full-bleed
   * card), and null when the type sits on its own solid field. This is the ONE
   * place the rule lives, so the preview and the export cannot disagree. */
  function scrimFor(treatment, textBoxes) {
    if (!treatment) return null;
    // A treatment that carries its own solid text PANEL (the White Panel family)
    // never needs a scrim: the type sits on the panel, not on the photo, and a
    // scrim would only dirty the clean white card. This is checked first, so the
    // overlap rule below cannot add one.
    if (treatment.panel) return null;
    var frame = treatment.frame || { x: 0, y: 0, width: 1, height: 1 };
    var boxes = Array.isArray(textBoxes) ? textBoxes : [];
    var anyOverlap = boxes.some(function (b) { return b && !b.empty && overlaps(b, frame); });
    if (anyOverlap) {
      // A treatment that already declares a scrim keeps it (it is tuned to the
      // composition); otherwise a default scrim is applied over the photo.
      return treatment.scrim || scrimStops(0.45, Math.max(0, frame.y), Math.min(1, frame.y + frame.height));
    }
    return treatment.scrim || null;
  }

  /* ── High-contrast detection ───────────────────────────────────────────────
   * Finds the busy regions of a photo by luminance variance, so a caller can
   * assert that a high-contrast region under text is never left unscrimmed.
   *
   * `pixels` is a flat RGBA array (as ImageData.data), `w`/`h` its dimensions.
   * The image is divided into a grid; each cell's luminance variance is
   * measured, and cells above `threshold` are returned as boxes in canvas
   * fractions. A cell is "high contrast" when its pixels disagree about how
   * bright they are — which is exactly what makes type unreadable. */
  function highContrastRegions(pixels, w, h, opts) {
    var o = opts || {};
    var cols = Math.max(1, Number(o.cols) || 6);
    var rows = Math.max(1, Number(o.rows) || 6);
    var threshold = Number(o.threshold) || 900; // variance of 0-255 luminance
    var out = [];
    if (!pixels || !w || !h) return out;
    var cw = Math.floor(w / cols), ch = Math.floor(h / rows);
    if (cw < 1 || ch < 1) return out;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var sum = 0, sumSq = 0, n = 0;
        for (var y = r * ch; y < (r + 1) * ch; y += 2) {
          for (var x = c * cw; x < (c + 1) * cw; x += 2) {
            var i = (y * w + x) * 4;
            var lum = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
            sum += lum; sumSq += lum * lum; n++;
          }
        }
        if (!n) continue;
        var mean = sum / n;
        var variance = sumSq / n - mean * mean;
        if (variance >= threshold) {
          out.push({ x: c / cols, y: r / rows, width: 1 / cols, height: 1 / rows, variance: variance });
        }
      }
    }
    return out;
  }

  /* True when a high-contrast region sits under a text box and the card has no
   * scrim to protect it. The tests use this to prove the rule holds. */
  function unscrimmedHighContrast(regions, textBoxes, scrim) {
    if (scrim) return [];
    var boxes = Array.isArray(textBoxes) ? textBoxes : [];
    return (regions || []).filter(function (reg) {
      return boxes.some(function (b) { return b && !b.empty && overlaps(b, reg); });
    });
  }

  return {
    TREATMENTS: TREATMENTS,
    NAMES: NAMES,
    REQUIRED: REQUIRED,
    resolve: resolve,
    list: list,
    scrimStops: scrimStops,
    scrimFor: scrimFor,
    overlaps: overlaps,
    highContrastRegions: highContrastRegions,
    unscrimmedHighContrast: unscrimmedHighContrast
  };
});
