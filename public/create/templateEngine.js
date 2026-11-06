// CreatorPulse production template configuration — a DERIVED view of the
// declarative specs in public/lib/cardTemplates.js.
//
// WHY THIS FILE EXISTS
// --------------------
// This used to be the template catalogue itself, with its own palette,
// typography, layout and slideLayouts. That made it a second source of truth
// alongside the layout engine, which is how the preview and the export drifted.
// The catalogue now lives in public/lib/cardTemplates.js (one spec per template,
// with a genuinely different composition per slide ROLE), and this file exposes
// the same public API the Create flow and the tests already use — get / list /
// resolve / apply / normalizeContent / roleFor / layoutFor — by deriving it from
// those specs. It adds no design decisions of its own.
(function (root, factory) {
  'use strict';
  var templates, typography;
  if (typeof module !== 'undefined' && module.exports) {
    templates = require('../lib/cardTemplates.js');
    typography = require('../lib/cardTypography.js');
  } else {
    templates = root.CPCardTemplates;
    typography = root.CPCardTypography;
  }
  var api = factory(templates, typography);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CPTemplateEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function (templates, typography) {
  'use strict';

  var LAYER_KEYS = ['headline', 'supportingText', 'ctaLine'];

  function boxOf(region) {
    var r = region || {};
    return { x: Number(r.x) || 0.08, y: Number(r.y) || 0.3, width: Number(r.width) || 0.84, height: Number(r.height) || 0.2 };
  }

  /* Builds the legacy template shape (layout / typography / slideLayouts /
   * image / decoration / safeZones) from one declarative spec. */
  function legacyTemplate(spec) {
    var roles = spec.roles || {};
    var pairing = (typography && typography.PAIRINGS && typography.PAIRINGS[spec.pairing]) || { headline: 'impact', supportingText: 'modern_body', ctaLine: 'condensed_sans' };
    var layout = {};
    var typographyMap = {};
    LAYER_KEYS.forEach(function (k) {
      var region = (roles.hook && roles.hook[k]) || {};
      layout[k] = boxOf(region);
      var face = (typography && typography.face) ? typography.face(pairing[k]) : { weight: 700, upper: false };
      typographyMap[k] = {
        family: pairing[k],
        weight: face.weight,
        size: (Number(region.maxSize) || 0.06) * 100,
        lineHeight: 1.12,
        transform: (face.upper || k === 'ctaLine') ? 'uppercase' : 'none'
      };
    });
    var slideLayouts = {
      cover: roleLayout(roles.hook),
      body: roleLayout(roles.context),
      closing: roleLayout(roles.cta)
    };
    return {
      id: spec.id,
      platform: spec.platform,
      name: spec.name,
      aspect: spec.aspect,
      canvas: spec.canvas,
      palette: spec.palette,
      typography: typographyMap,
      layout: layout,
      slideLayouts: slideLayouts,
      decoration: spec.decoration,
      image: { mode: legacyImageMode(spec.treatment && spec.treatment.id), crop: 'cover', focal: 'center' },
      safeZones: spec.safeZones && spec.safeZones[spec.platform] ? spec.safeZones[spec.platform] : null
    };
  }

  function roleLayout(role) {
    var out = {};
    LAYER_KEYS.forEach(function (k) { if (role && role[k]) out[k] = boxOf(role[k]); });
    return out;
  }

  function legacyImageMode(treatmentId) {
    if (treatmentId === 'splitPanel') return 'split';
    if (treatmentId === 'insetFrame' || treatmentId === 'blurredBackdrop' || treatmentId === 'tallInset') return 'panel';
    return 'fullBleed';
  }

  var TEMPLATES = {};
  (templates && templates.list ? templates.list() : []).forEach(function (spec) {
    TEMPLATES[spec.id] = legacyTemplate(spec);
  });

  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  function get(id) { return TEMPLATES[id] || null; }
  function list(platform) { return Object.keys(TEMPLATES).map(function (id) { return TEMPLATES[id]; }).filter(function (t) { return !platform || t.platform === platform; }); }

  function normalizeContent(slide) {
    var s = slide || {};
    var text = function (v) { return typeof v === 'string' ? v.trim() : ''; };
    return {
      headline: text(s.headline || s.hookHeadline || s.title),
      supportingText: text(s.supportingText || s.body || s.reaction || s.stat || s.sectionLabel),
      ctaLine: text(s.ctaLine),
      tag: text(s.tag || s.sectionLabel || s.sourceLabel),
      stat: text(s.stat),
      sourceLabel: text(s.sourceLabel)
    };
  }

  /* Legacy three-role view (cover / body / closing) of the six story roles the
   * spec declares. The engine itself uses the six roles; this keeps the Create
   * flow's initial composition working. */
  function roleFor(slide, index, total) {
    var s = slide || {};
    if (s.type === 'hook' || s.useCover || index === 0) return 'cover';
    if (s.type === 'outro' || (/follow|save|share/i.test(s.ctaLine || '') && index === total - 1)) return 'closing';
    return 'body';
  }

  function layoutFor(templateId, slide, index, total) {
    var t = get(templateId);
    if (!t) return null;
    var role = roleFor(slide, index || 0, total || 1);
    var roleLayout = t.slideLayouts && t.slideLayouts[role];
    return clone(roleLayout || t.layout);
  }

  function apply(slide, templateId, index, total) {
    if (!slide) return slide;
    var t = get(templateId) || (slide.silentCamera ? TEMPLATES.silent_camera : TEMPLATES.impact);
    var existing = slide.textLayout || {};
    var layout = layoutFor(t.id, slide, index || 0, total || 1) || t.layout;
    // Keep user-adjusted boxes once they've been edited; template config is the
    // initial composition only, so changing a template never discards user work.
    slide.textLayout = Object.assign({}, layout, existing);
    slide._style = Object.assign({}, slide._style || {}, {
      templateId: t.id,
      typography: t.typography.headline.family,
      textColor: t.palette.text,
      dim: t.palette.dim,
      layerColors: Object.assign({}, (slide._style && slide._style.layerColors) || {}, { ctaLine: t.palette.accent }),
      templatePalette: clone(t.palette),
      templateTypography: clone(t.typography),
      templateDecoration: clone(t.decoration),
      imageTreatment: clone(t.image)
    });
    slide._templateId = t.id;
    return slide;
  }

  function resolve(templateId, platform) {
    var t = get(templateId);
    if (t && (!platform || t.platform === platform)) return t;
    return platform === 'tiktok' ? TEMPLATES.viral_hook : TEMPLATES.impact;
  }

  return { TEMPLATES: TEMPLATES, get: get, list: list, normalizeContent: normalizeContent, roleFor: roleFor, layoutFor: layoutFor, apply: apply, resolve: resolve };
});
