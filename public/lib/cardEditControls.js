/* CreatorPulse · Card edit controls — the per-slide editing model.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 6 asks for a real editing experience: swap the layout variant for THIS
 * slide, nudge the text, change its size, drag it onto the 8-point grid, reset
 * one slide, restore the original look, and apply a change to every slide while
 * a single slide can still override it. All of that is arithmetic over the
 * slide's style, so it lives here — pure, no DOM — and the editor and core.js
 * only apply the results. Every variant is resolved through the ONE layout
 * engine, so a variant preview is the real card, not a mock.
 *
 * Runs in the browser (window.CPCardEditControls) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var engine;
  if (typeof module !== 'undefined' && module.exports) engine = require('./cardLayoutEngine.js');
  else engine = root.CPCardLayoutEngine;
  var api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardEditControls = api;
})(typeof window !== 'undefined' ? window : null, function (engine) {
  'use strict';

  // The 8-point spacing grid, in card pixels. A dragged box snaps to whole
  // steps of this, so text always lands on the same rhythm as the design.
  var GRID = 8;

  var VARIANT_NAMES = { hook: 'Big hook', context: 'Context', evidence: 'Detail', turn: 'Turn', payoff: 'Payoff', cta: 'Call to action' };
  var VARIANT_ROLES = ['hook', 'context', 'evidence', 'cta'];

  // Text size presets. S / M / L map onto the layer's own scale multiplier.
  var SIZES = { S: 0.8, M: 1.0, L: 1.3 };
  var SIZE_ORDER = ['S', 'M', 'L'];

  // Nudge positions: where in the safe zone the text block is pushed to.
  var NUDGE_V = { top: 0, middle: 0.5, bottom: 1 };
  var NUDGE_H = { left: 0, centre: 0.5 };

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* Snaps a fraction to the 8-point grid for the given canvas size. */
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
  /* True when a fraction already sits on the grid (within half a step). */
  function onGrid(v, canvasSize) {
    var step = GRID / (canvasSize || 1080);
    return Math.abs(Number(v) / step - Math.round(Number(v) / step)) < 1e-6;
  }

  /* Pushes a box inside the platform safe zone (width/height first, then x/y). */
  function clampToSafeZone(box, zone) {
    var z = zone || { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 };
    var maxW = Math.max(0.05, 1 - z.left - z.right);
    var maxH = Math.max(0.02, 1 - z.top - z.bottom);
    var width = clamp(box.width, 0.05, maxW);
    var height = clamp(box.height, 0.02, maxH);
    var x = clamp(box.x, z.left, Math.max(z.left, 1 - z.right - width));
    var y = clamp(box.y, z.top, Math.max(z.top, 1 - z.bottom - height));
    return { x: x, y: y, width: width, height: height };
  }

  /* The 3-4 layout variants for THIS slide: the slide's own role first, then the
   * template's other role compositions. Each is resolved through the real engine
   * with the user's own photo and text, so a variant tile is the real card. */
  function layoutVariantsFor(opts) {
    var o = opts || {};
    var base = engine.resolve({ templateId: o.templateId, platform: o.platform, slide: o.slide, index: o.index, total: o.total, style: o.style });
    var natural = (base && base.role) || 'hook';
    var order = [natural].concat(VARIANT_ROLES.filter(function (r) { return r !== natural; }));
    var out = [];
    order.slice(0, 4).forEach(function (role, i) {
      var slide = Object.assign({}, o.slide, { role: role });
      var d = engine.resolve({ templateId: o.templateId, platform: o.platform, slide: slide, index: o.index, total: o.total, style: o.style });
      if (!d) return;
      out.push({ id: 'v' + i + '_' + role, role: role, name: VARIANT_NAMES[role] || role, design: d });
    });
    return out;
  }

  /* Moves a box to a nudge position (top/middle/bottom, left/centre) inside the
   * safe zone, keeping its size. */
  function nudgeBox(box, zone, v, h) {
    var z = zone || { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 };
    var availH = Math.max(0, 1 - z.top - z.bottom - box.height);
    var availW = Math.max(0, 1 - z.left - z.right - box.width);
    var y = z.top + availH * (NUDGE_V[v] != null ? NUDGE_V[v] : 0);
    var x = z.left + availW * (NUDGE_H[h] != null ? NUDGE_H[h] : 0);
    return { x: x, y: y, width: box.width, height: box.height };
  }

  function sizeScale(id) { return SIZES[id] || 1; }
  function sizeIdFor(scale) {
    var s = Number(scale) || 1;
    var best = 'M', bestD = Infinity;
    SIZE_ORDER.forEach(function (id) { var d = Math.abs(SIZES[id] - s); if (d < bestD) { bestD = d; best = id; } });
    return best;
  }

  /* Applies a change to every slide, but a slide that carries a per-slide
   * override keeps its own value. Returns the number of slides changed. */
  function applyToAll(slides, change, opts) {
    var list = Array.isArray(slides) ? slides : [];
    var c = change || {};
    var n = 0;
    list.forEach(function (slide) {
      if (!slide) return;
      slide._style = slide._style || {};
      if (slide._style.override) return; // a per-slide override wins
      if (c.templateId) { slide._templateId = c.templateId; slide._style.templateId = c.templateId; delete slide._style.treatmentId; }
      if (c.accent) slide._style.accent = c.accent;
      if (c.treatmentId) slide._style.treatmentId = c.treatmentId;
      n++;
    });
    return n;
  }

  /* Marks one slide as carrying a per-slide override, so apply-to-all leaves it. */
  function setOverride(slide, on) {
    if (!slide) return;
    slide._style = slide._style || {};
    if (on) slide._style.override = true; else delete slide._style.override;
  }

  /* Resets ONE slide to the template's own look: clears the style and the
   * dragged boxes, but keeps the template the user chose. */
  function resetSlide(slide) {
    if (!slide) return;
    var templateId = slide._templateId || (slide._style && slide._style.templateId);
    slide._style = templateId ? { templateId: templateId } : {};
    delete slide.textLayout;
  }

  /* Restores the ORIGINAL look: clears everything, including the template. */
  function restoreOriginal(slide) {
    if (!slide) return;
    delete slide._templateId;
    delete slide._style;
    delete slide.textLayout;
  }

  return {
    GRID: GRID,
    SIZES: SIZES,
    SIZE_ORDER: SIZE_ORDER,
    VARIANT_ROLES: VARIANT_ROLES,
    VARIANT_NAMES: VARIANT_NAMES,
    snapFraction: snapFraction,
    snapBox: snapBox,
    onGrid: onGrid,
    clampToSafeZone: clampToSafeZone,
    layoutVariantsFor: layoutVariantsFor,
    nudgeBox: nudgeBox,
    sizeScale: sizeScale,
    sizeIdFor: sizeIdFor,
    applyToAll: applyToAll,
    setOverride: setOverride,
    resetSlide: resetSlide,
    restoreOriginal: restoreOriginal
  };
});
