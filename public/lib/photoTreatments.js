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

  /* 6. HARD CROP + ACCENT RULE — the photo is cropped hard to a band and a
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

  var TREATMENTS = {
    fullBleedScrim: fullBleedScrim,
    duotone: duotone,
    splitPanel: splitPanel,
    insetFrame: insetFrame,
    blurredBackdrop: blurredBackdrop,
    hardCropRule: hardCropRule
  };

  var NAMES = {
    fullBleedScrim: 'Full-bleed + scrim',
    duotone: 'Duotone',
    splitPanel: 'Split panel',
    insetFrame: 'Inset frame',
    blurredBackdrop: 'Blurred backdrop',
    hardCropRule: 'Hard crop + accent rule'
  };

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

  return {
    TREATMENTS: TREATMENTS,
    NAMES: NAMES,
    resolve: resolve,
    list: list,
    scrimStops: scrimStops
  };
});
