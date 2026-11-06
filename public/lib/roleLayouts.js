/* CreatorPulse · Story roles — how a slide's POSITION changes the layout.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A carousel is a story, not six copies of one card. Slide 1 is a HOOK (the
 * biggest type, the shortest copy, a swipe cue), slide 2 is CONTEXT (why it
 * matters), the middle slides are DETAIL / STAT (one hero element), and the last
 * slide is the CTA (a clear, friendly end state). Each role declares its own
 * layout INTENT — how large the hero may be, how many words it should hold, and
 * whether it shows a swipe cue or a counter — and the layout engine applies that
 * intent on top of the template's own per-role geometry.
 *
 * This file also owns CAROUSEL CONTINUITY: the slide counter / progress dots
 * that are drawn into the image itself, the one margin system every slide
 * shares, and the single accent that runs through the whole set.
 *
 * Runs in the browser (window.CPRoleLayouts) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPRoleLayouts = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* `heroScale` multiplies the template's headline ceiling for that role, so the
   * hook is the largest type and the CTA is a touch calmer. `maxWords` is the
   * copy target the generator aims for (it is NOT a truncation — the layout
   * never cuts a word). `swipeCue` marks the slide that carries "Swipe →". */
  var INTENT = {
    hook:     { id: 'hook',     name: 'Hook',           heroScale: 1.00, supportingScale: 0.92, maxWords: 8,  swipeCue: true,  counter: true, cta: false },
    context:  { id: 'context',  name: 'Context',        heroScale: 0.94, supportingScale: 1.00, maxWords: 14, swipeCue: false, counter: true, cta: false },
    evidence: { id: 'evidence', name: 'Detail / Stat',  heroScale: 0.96, supportingScale: 0.96, maxWords: 12, swipeCue: false, counter: true, cta: false },
    turn:     { id: 'turn',     name: 'Turn',           heroScale: 0.96, supportingScale: 0.96, maxWords: 12, swipeCue: false, counter: true, cta: false },
    payoff:   { id: 'payoff',   name: 'Payoff',         heroScale: 0.98, supportingScale: 0.96, maxWords: 12, swipeCue: false, counter: true, cta: false },
    cta:      { id: 'cta',      name: 'Call to action', heroScale: 0.90, supportingScale: 1.00, maxWords: 10, swipeCue: false, counter: true, cta: true }
  };

  function intentFor(role) { return INTENT[role] || INTENT.hook; }

  /* The one margin system every slide in a set shares, as a fraction of the
   * canvas. A template's own safe zone may be wider; this is the floor. */
  var MARGIN = 0.08;

  /* Carousel continuity: the counter label, the progress dots, the shared
   * margin and the single accent. Drawn into the image itself, so a downloaded
   * slide still shows where it sits in the set. */
  function continuity(index, total, accent) {
    var n = Math.max(1, Number(total) || 1);
    var i = Math.max(0, Math.min(n - 1, Number(index) || 0));
    var dots = [];
    for (var k = 0; k < n; k++) dots.push({ index: k, active: k === i });
    return {
      index: i,
      total: n,
      label: (i + 1) + ' / ' + n,
      dots: dots,
      margin: MARGIN,
      accent: accent || null
    };
  }

  /* The counter's geometry in card pixels, so the preview and the export draw
   * the same thing. Pinned to the bottom-left of the safe zone, clear of the
   * TikTok caption area. */
  function counterGeometry(continuityState, canvas, safeZone) {
    var c = continuityState || continuity(0, 1, null);
    var W = (canvas && canvas.width) || 1080;
    var H = (canvas && canvas.height) || 1350;
    var z = safeZone || { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 };
    var size = Math.max(14, Math.round(W * 0.020));
    var dotR = Math.max(3, Math.round(W * 0.005));
    var gap = Math.round(dotR * 3.2);
    var dotsW = c.total > 1 ? (c.total - 1) * gap : 0;
    var labelW = Math.round(String(c.label).length * size * 0.62);
    var width = Math.round(dotsW + (c.total > 1 ? gap : 0) + labelW);
    var height = Math.round(size * 1.6);
    return {
      type: 'counter',
      x: Math.round(W * z.left),
      y: Math.round(H * (1 - z.bottom) - height),
      width: width,
      height: height,
      size: size,
      dotR: dotR,
      gap: gap,
      label: c.label,
      dots: c.dots,
      accent: c.accent
    };
  }

  return {
    INTENT: INTENT,
    MARGIN: MARGIN,
    intentFor: intentFor,
    continuity: continuity,
    counterGeometry: counterGeometry
  };
});
