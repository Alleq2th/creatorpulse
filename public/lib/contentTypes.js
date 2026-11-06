/* CreatorPulse · Content types — how a story's KIND changes the layout.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The generator already knows what a slide IS: a breaking-news flash, a stat, a
 * quote, a transfer, a match result, an opinion. That knowledge used to be
 * thrown away at render time, so a stat slide and an opinion slide were laid out
 * identically. A content type is now a first-class input to the layout engine.
 *
 * A content type maps to a LAYOUT VARIANT: which layer is the hero (the headline,
 * a big number, or a quote), how the supporting copy is treated (a source line,
 * an attribution, a timestamp), how large the headline may be, and whether one
 * keyword is highlighted in the accent. A template may override any of it in its
 * own `contentVariants` map, which is how "each template maps a content type to
 * a layout variant".
 *
 * The variant is applied to the MIDDLE roles and the CTA. The HOOK is governed
 * by the role alone — slide 1 is always the largest type, whatever the story is.
 *
 * Runs in the browser (window.CPContentTypes) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPContentTypes = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* Each variant: `hero` is the layer that carries the slide, `supporting` is
   * what the small line under it means, `headlineScale` multiplies the
   * template's own headline ceiling (so a stat slide makes room for the number
   * and a quote slide gives the quote more room), `shiftY` nudges the headline
   * block, and `keyword` turns on the one-word accent highlight. */
  var TYPES = {
    breaking: { id: 'breaking', name: 'Breaking news', hero: 'headline', supporting: 'timestamp', headlineScale: 0.96, supportingScale: 0.92, keyword: false, decoration: null, shiftY: -0.030, fallbackShift: -0.030 },
    stat:     { id: 'stat',     name: 'Stat',          hero: 'stat',     supporting: 'source',      headlineScale: 0.72, supportingScale: 0.90, keyword: false, decoration: 'stat', shiftY: -0.050, fallbackShift: -0.010 },
    quote:    { id: 'quote',    name: 'Quote',         hero: 'quote',    supporting: 'attribution', headlineScale: 1.06, supportingScale: 0.90, keyword: false, decoration: 'quote', shiftY: 0.030, fallbackShift: -0.020 },
    transfer: { id: 'transfer', name: 'Transfer',      hero: 'headline', supporting: 'detail',      headlineScale: 0.94, supportingScale: 1.00, keyword: true,  decoration: null, shiftY: 0.010, fallbackShift: -0.040 },
    match:    { id: 'match',    name: 'Match result',  hero: 'headline', supporting: 'detail',      headlineScale: 0.90, supportingScale: 1.00, keyword: true,  decoration: null, shiftY: -0.015, fallbackShift: -0.015 },
    opinion:  { id: 'opinion',  name: 'Opinion',       hero: 'headline', supporting: 'line',        headlineScale: 0.88, supportingScale: 1.00, keyword: true,  decoration: null, shiftY: 0.050, fallbackShift: -0.050 },
    default:  { id: 'default',  name: 'Story',         hero: 'headline', supporting: 'line',        headlineScale: 1.00, supportingScale: 1.00, keyword: false, decoration: null, shiftY: 0, fallbackShift: 0 }
  };
  var ORDER = ['breaking', 'stat', 'quote', 'transfer', 'match', 'opinion', 'default'];

  function isKnown(id) { return !!(id && TYPES[String(id).toLowerCase()]); }

  /* Works out a slide's content type. An explicit value wins; then the
   * template's own decoration (a quote card IS a quote, a stat split IS a stat,
   * a BREAKING badge IS breaking news); then the fields the generator filled in.
   * Never guesses wildly — an unknown slide is just a plain story. */
  function detect(slide, explicit, template) {
    var s = slide || {};
    if (isKnown(explicit)) return String(explicit).toLowerCase();
    if (isKnown(s.contentType)) return String(s.contentType).toLowerCase();
    var deco = template && template.decoration;
    if (deco) {
      if (deco.type === 'stat') return 'stat';
      if (deco.type === 'quote') return 'quote';
      if (deco.type === 'badge' && /breaking/i.test(String(deco.text || ''))) return 'breaking';
    }
    if (s.stat || s.statValue || s.statNumber) return 'stat';
    if (s.quote) return 'quote';
    if (s.timeline) return 'breaking';
    if (s.compareA || s.compareB) return 'match';
    if (s.subject || s.action || s.outcome) return 'transfer';
    if (s.claim || s.reaction) return 'opinion';
    // A headline that is mostly a number is a stat, even without a stat field.
    if (/^[\s$€£]?\d[\d.,]*\s*%?[\s\w]{0,12}$/.test(String(s.headline || '').trim())) return 'stat';
    return 'default';
  }

  /* The variant for a content type, with the template's own override merged on
   * top. A template that declares `contentVariants: { stat: { decoration: 'stat' } }`
   * gets exactly that; every other template gets the shared default. */
  function variantFor(contentType, template) {
    var base = TYPES[contentType] || TYPES.default;
    var override = template && template.contentVariants && template.contentVariants[contentType];
    return override ? Object.assign({}, base, override) : Object.assign({}, base);
  }

  function list() { return ORDER.map(function (id) { return TYPES[id]; }); }

  return {
    TYPES: TYPES,
    ORDER: ORDER,
    isKnown: isKnown,
    detect: detect,
    variantFor: variantFor,
    list: list
  };
});
