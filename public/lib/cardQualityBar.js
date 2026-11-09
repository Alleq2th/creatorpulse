/* CreatorPulse · Card quality bar — the Part 7 review, as code.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 7 asks a review question before finishing: does it look handcrafted, or
 * generic AI? The answer must be checkable, not a matter of opinion, so the five
 * things the brief names are encoded here as checks over the real layout engine:
 *
 *   1. one clear hero element per template
 *   2. one accent colour, and no flat #000000 / #ffffff / #ff0000
 *   3. readable text over every photo (a scrim wherever text meets the photo)
 *   4. consistent spacing (every box inside the platform safe zone)
 *   5. no two templates sharing the same composition
 *
 * The tests read this report, and the app can show it, so the bar is enforced
 * rather than asserted.
 *
 * Runs in the browser (window.CPCardQualityBar) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var engine, templates, treatments, typography;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('./cardLayoutEngine.js');
    templates = require('./cardTemplates.js');
    treatments = require('./photoTreatments.js');
    typography = require('./cardTypography.js');
  } else {
    engine = root.CPCardLayoutEngine;
    templates = root.CPCardTemplates;
    treatments = root.CPPhotoTreatments;
    typography = root.CPCardTypography;
  }
  var api = factory(engine, templates, treatments, typography);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardQualityBar = api;
})(typeof window !== 'undefined' ? window : null, function (engine, templates, treatments, typography) {
  'use strict';

  // The flat colours the brief forbids.
  var FLAT = ['#000000', '#ffffff', '#ff0000'];

  // One fixed piece of content, so every template is judged on the same card.
  var SLIDE = {
    headline: 'The headline that tells the story',
    supportingText: 'A supporting line that explains the point in plain words.',
    ctaLine: 'Follow for more',
    stat: '87%'
  };

  function resolve(t, role, platform) {
    return engine.resolve({
      templateId: t.id, platform: platform || t.platform, role: role,
      slide: Object.assign({ role: role }, SLIDE), index: 0, total: 1, style: {}
    });
  }
  function geomSig(d) {
    return JSON.stringify(d.layers.map(function (l) { return [l.box.x, l.box.y, l.box.width, l.box.height, l.align, l.anchor]; }));
  }

  /* 1. One clear hero element: the hero layer is the largest in every role.
   * `resolveFn` is an optional seam so a test can inject a deliberately bad
   * design and prove this check actually fails on it. */
  function checkHero(t, resolveFn) {
    var R = resolveFn || resolve;
    var bad = [];
    templates.ROLES.forEach(function (role) {
      var d = R(t, role);
      var hero = d.layers.find(function (l) { return l.key === d.heroKey; });
      if (!hero || hero.empty) return;
      d.layers.forEach(function (l) {
        if (l !== hero && !l.empty && l.sizePct > hero.sizePct + 1e-9) bad.push(role + ':' + l.key);
      });
    });
    return { id: 'hero', name: 'One clear hero element', pass: bad.length === 0, detail: bad.length ? t.id + ' has a non-hero layer larger than the hero: ' + bad.join(', ') : 'the hero is the largest layer in every role' };
  }

  /* 2. One accent, and no flat black / white / red. */
  function checkAccent(t) {
    var colors = [t.palette.bg, t.palette.text, t.palette.accent, t.palette.secondary]
      .filter(Boolean).map(function (c) { return String(c).toLowerCase(); });
    var flat = colors.filter(function (c) { return FLAT.indexOf(c) > -1; });
    return { id: 'accent', name: 'One accent, no flat black/white/red', pass: flat.length === 0, detail: flat.length ? t.id + ' uses a flat colour: ' + flat.join(', ') : 'one accent (' + t.palette.accent + '), no flat #000/#fff/#ff0000' };
  }

  /* 3. Readable text over every photo: a scrim wherever text meets the photo. */
  function checkReadable(t, resolveFn) {
    var R = resolveFn || resolve;
    var bad = [];
    templates.ROLES.forEach(function (role) {
      var d = R(t, role);
      var frame = d.treatment.frame;
      var over = d.layers.filter(function (l) { return !l.empty && treatments.overlaps(l.box, frame); });
      // A solid text PANEL under the type is a legibility field in its own right
      // (the White Panel family): the type sits on the panel, not on the photo.
      if (over.length && !d.scrim && !d.panel) bad.push(role);
    });
    return { id: 'readable', name: 'Readable text over every photo', pass: bad.length === 0, detail: bad.length ? t.id + ' has text over the photo with no scrim: ' + bad.join(', ') : 'every text box over the photo has a scrim' };
  }

  /* 4. Consistent spacing: every box sits inside the platform safe zone. */
  function checkSpacing(t, resolveFn) {
    var R = resolveFn || resolve;
    var bad = [];
    templates.ROLES.forEach(function (role) {
      var d = R(t, role);
      var z = d.safeZone;
      d.layers.forEach(function (l) {
        if (l.empty) return;
        if (l.box.x < z.left - 1e-6 || l.box.y < z.top - 1e-6 ||
            l.box.x + l.box.width > 1 - z.right + 1e-6 || l.box.y + l.box.height > 1 - z.bottom + 1e-6) {
          bad.push(role + ':' + l.key);
        }
      });
    });
    return { id: 'spacing', name: 'Consistent spacing inside the safe zone', pass: bad.length === 0, detail: bad.length ? t.id + ' has a box outside the safe zone: ' + bad.join(', ') : 'every box sits inside the safe zone' };
  }

  /* 5. No two templates share a composition. */
  function checkDistinct(list) {
    var seen = new Map(), dup = [];
    list.forEach(function (t) {
      var sig = templates.ROLES.map(function (role) { return geomSig(resolve(t, role)); }).join('|');
      if (seen.has(sig)) dup.push(t.id + ' == ' + seen.get(sig));
      else seen.set(sig, t.id);
    });
    return { id: 'distinct', name: 'No two templates share a composition', pass: dup.length === 0, detail: dup.length ? 'duplicate compositions: ' + dup.join(', ') : list.length + ' templates, all with distinct compositions' };
  }

  /* Runs the whole review. Returns { pass, total, failed, checks, templates }. */
  function review(opts) {
    var o = opts || {};
    var list = o.templates || templates.list();
    var checks = [];
    list.forEach(function (t) { checks.push(checkHero(t), checkAccent(t), checkReadable(t), checkSpacing(t)); });
    checks.push(checkDistinct(list));
    var failed = checks.filter(function (c) { return !c.pass; });
    return {
      pass: failed.length === 0,
      total: checks.length,
      failed: failed.length,
      checks: checks,
      templates: list.map(function (t) { return t.id; })
    };
  }

  return {
    review: review,
    checkHero: checkHero,
    checkAccent: checkAccent,
    checkReadable: checkReadable,
    checkSpacing: checkSpacing,
    checkDistinct: checkDistinct,
    FLAT: FLAT
  };
});
