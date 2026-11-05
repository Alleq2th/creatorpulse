/* CreatorPulse · Card template specs — the declarative design catalogue.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A template used to be a palette plus one layout that every slide reused, so a
 * carousel read as six copies of one card and two templates differed only in
 * colour. A template is now a SPEC: it declares, per slide ROLE, where each text
 * region sits, how it aligns, how many lines it may take and how small it may
 * shrink; which photo treatment it uses; and how its single accent is allowed to
 * be used. One engine (public/lib/cardLayoutEngine.js) reads the spec and
 * produces the layout; the DOM preview and the canvas export both consume that
 * one result.
 *
 * COLOUR RULE (enforced by the tests): no flat #000000 / #ffffff / #ff0000.
 * Blacks are #161616 / #232323 / #2C2C2C, whites are #f6f6f6 / #eeeef0 / #dedede,
 * accents are softer tones, and each template has exactly ONE accent used for
 * meaning (a keyword, a rule, or the call to action) — never as decoration.
 *
 * Runs in the browser (window.CPCardTemplates) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardTemplates = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* A region: x/y/w/h are fractions of the canvas. `align` is horizontal text
   * alignment, `anchor` is where the text block sits vertically inside its box,
   * `maxLines` caps the wrap, and minSize/maxSize bound the auto-fit (as a
   * fraction of the canvas WIDTH). */
  function R(x, y, w, h, o) {
    return Object.assign({ x: x, y: y, width: w, height: h, align: 'left', anchor: 'top', maxLines: 5, minSize: 0.022, maxSize: 0.10 }, o || {});
  }

  /* The six story roles a slide can play. Each template gives every role a
   * genuinely different composition — not the same box moved around. */
  var ROLES = ['hook', 'context', 'evidence', 'turn', 'payoff', 'cta'];

  var TEMPLATES = {
    /* ── TikTok (1080×1920) ─────────────────────────────────────────────── */
    viral_hook: {
      id: 'viral_hook', platform: 'tiktok', name: '9:16 Viral Hook', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#161616', text: '#f6f6f6', accent: '#e0a83c', secondary: '#b9b9bd', dim: 0.46, gradient: 'linear-gradient(180deg,rgba(22,22,22,.30),rgba(22,22,22,.92))' },
      pairing: 'poster',
      treatment: { id: 'fullBleedScrim', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'badge', text: 'VIRAL HOOK', accent: '#e0a83c' },
      roles: {
        hook:     { headline: R(.08, .30, .84, .26, { maxLines: 4, maxSize: .085 }), supportingText: R(.10, .58, .80, .18, { maxLines: 3 }), ctaLine: R(.12, .86, .76, .06, { maxLines: 1, maxSize: .030 }) },
        context:  { headline: R(.08, .16, .84, .20, { maxLines: 3, maxSize: .070 }), supportingText: R(.08, .42, .80, .30, { maxLines: 5 }) },
        evidence: { headline: R(.08, .34, .84, .24, { align: 'center', maxLines: 3, maxSize: .080 }), supportingText: R(.12, .62, .76, .20, { align: 'center', maxLines: 4 }) },
        turn:     { supportingText: R(.08, .20, .84, .24, { maxLines: 4 }), headline: R(.08, .50, .84, .28, { maxLines: 4, maxSize: .082 }) },
        payoff:   { headline: R(.08, .36, .84, .26, { align: 'center', maxLines: 3, maxSize: .078 }), ctaLine: R(.12, .70, .76, .06, { align: 'center', maxLines: 1, maxSize: .030 }) },
        cta:      { headline: R(.08, .22, .84, .22, { align: 'center', maxLines: 3, maxSize: .072 }), ctaLine: R(.10, .56, .80, .10, { align: 'center', maxLines: 2, maxSize: .046 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .06, right: .20 } }
    },

    silent_camera: {
      id: 'silent_camera', platform: 'tiktok', name: 'Silent Camera', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#c9553f', secondary: '#dedede', dim: 0.20, gradient: 'linear-gradient(180deg,rgba(35,35,35,.66),rgba(35,35,35,.10) 40%,rgba(35,35,35,.80))' },
      pairing: 'editorial',
      treatment: { id: 'insetFrame', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'corner', accent: '#c9553f' },
      roles: {
        hook:     { headline: R(.08, .12, .84, .18, { maxLines: 3, maxSize: .062 }), supportingText: R(.08, .70, .84, .16, { maxLines: 3 }) },
        context:  { headline: R(.08, .14, .84, .16, { maxLines: 3, maxSize: .058 }), supportingText: R(.08, .40, .84, .24, { maxLines: 4 }) },
        evidence: { supportingText: R(.08, .16, .84, .20, { maxLines: 4 }), headline: R(.08, .44, .84, .22, { maxLines: 3, maxSize: .060 }) },
        turn:     { supportingText: R(.08, .30, .84, .22, { maxLines: 4 }), headline: R(.08, .60, .84, .22, { maxLines: 3, maxSize: .060 }) },
        payoff:   { headline: R(.10, .40, .80, .22, { align: 'center', maxLines: 3, maxSize: .062 }), ctaLine: R(.12, .72, .76, .06, { align: 'center', maxLines: 1, maxSize: .028 }) },
        cta:      { headline: R(.08, .20, .84, .20, { align: 'center', maxLines: 3, maxSize: .058 }), ctaLine: R(.10, .52, .80, .10, { align: 'center', maxLines: 2, maxSize: .044 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .06, right: .20 } }
    },

    quote_punch: {
      id: 'quote_punch', platform: 'tiktok', name: 'Bold Statement', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#2C2C2C', text: '#f6f6f6', accent: '#d8b24a', secondary: '#dedede', dim: 0.50, gradient: 'linear-gradient(160deg,rgba(44,44,44,.84),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'hardCropRule', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'rule', accent: '#d8b24a' },
      roles: {
        hook:     { headline: R(.06, .20, .88, .34, { maxLines: 4, maxSize: .092 }), supportingText: R(.08, .58, .84, .20, { maxLines: 3 }) },
        context:  { headline: R(.06, .26, .88, .28, { maxLines: 4, maxSize: .082 }), supportingText: R(.08, .58, .84, .20, { maxLines: 3 }) },
        evidence: { headline: R(.06, .16, .88, .26, { maxLines: 3, maxSize: .080 }), supportingText: R(.08, .46, .84, .26, { maxLines: 4 }), ctaLine: R(.08, .78, .84, .06, { maxLines: 1, maxSize: .030 }) },
        turn:     { supportingText: R(.08, .18, .84, .24, { maxLines: 4 }), headline: R(.06, .48, .88, .30, { maxLines: 4, maxSize: .086 }) },
        payoff:   { headline: R(.06, .34, .88, .28, { align: 'center', maxLines: 3, maxSize: .084 }), ctaLine: R(.10, .68, .80, .08, { align: 'center', maxLines: 1, maxSize: .034 }) },
        cta:      { headline: R(.06, .22, .88, .24, { align: 'center', maxLines: 3, maxSize: .078 }), ctaLine: R(.08, .54, .84, .12, { align: 'center', maxLines: 2, maxSize: .050 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .05, right: .20 } }
    },

    minimal_noir: {
      id: 'minimal_noir', platform: 'tiktok', name: 'Dark Minimalist', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#161616', text: '#eeeef0', accent: '#9aa0a6', secondary: '#b9b9bd', dim: 0.38, gradient: 'linear-gradient(180deg,rgba(22,22,22,.72),rgba(22,22,22,.90))' },
      pairing: 'minimal',
      treatment: { id: 'blurredBackdrop', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'none', accent: '#9aa0a6' },
      roles: {
        hook:     { headline: R(.10, .36, .80, .22, { maxLines: 3, maxSize: .062 }), supportingText: R(.12, .62, .76, .16, { maxLines: 3 }) },
        context:  { headline: R(.10, .20, .80, .20, { maxLines: 3, maxSize: .058 }), supportingText: R(.12, .46, .76, .24, { maxLines: 4 }) },
        evidence: { headline: R(.10, .30, .80, .22, { maxLines: 3, maxSize: .060 }), supportingText: R(.12, .58, .76, .20, { maxLines: 4 }) },
        turn:     { supportingText: R(.12, .24, .76, .20, { maxLines: 4 }), headline: R(.10, .50, .80, .22, { maxLines: 3, maxSize: .060 }) },
        payoff:   { headline: R(.12, .40, .76, .20, { align: 'center', maxLines: 3, maxSize: .058 }), ctaLine: R(.15, .66, .70, .06, { align: 'center', maxLines: 1, maxSize: .026 }) },
        cta:      { headline: R(.10, .26, .80, .20, { align: 'center', maxLines: 3, maxSize: .056 }), ctaLine: R(.12, .54, .76, .10, { align: 'center', maxLines: 2, maxSize: .042 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .08, right: .20 } }
    },

    high_retention: {
      id: 'high_retention', platform: 'tiktok', name: 'High-Retention Alert', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#d96a4a', secondary: '#dedede', dim: 0.48, gradient: 'linear-gradient(180deg,rgba(35,35,35,.62),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'duotone', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'badge', text: 'MUST WATCH', accent: '#d96a4a' },
      roles: {
        hook:     { headline: R(.08, .18, .84, .24, { maxLines: 3, maxSize: .078 }), supportingText: R(.08, .46, .84, .28, { maxLines: 4 }), ctaLine: R(.10, .80, .80, .06, { maxLines: 1, maxSize: .030 }) },
        context:  { headline: R(.08, .16, .84, .22, { maxLines: 3, maxSize: .072 }), supportingText: R(.08, .44, .84, .30, { maxLines: 5 }) },
        evidence: { headline: R(.08, .28, .84, .24, { maxLines: 3, maxSize: .076 }), supportingText: R(.08, .58, .84, .22, { maxLines: 4 }) },
        turn:     { supportingText: R(.08, .20, .84, .24, { maxLines: 4 }), headline: R(.08, .50, .84, .26, { maxLines: 3, maxSize: .078 }) },
        payoff:   { headline: R(.08, .34, .84, .26, { align: 'center', maxLines: 3, maxSize: .076 }), ctaLine: R(.10, .66, .80, .08, { align: 'center', maxLines: 1, maxSize: .032 }) },
        cta:      { headline: R(.08, .22, .84, .22, { align: 'center', maxLines: 3, maxSize: .072 }), ctaLine: R(.10, .52, .80, .12, { align: 'center', maxLines: 2, maxSize: .048 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .06, right: .20 } }
    },

    /* ── Instagram (1080×1350) ──────────────────────────────────────────── */
    impact: {
      id: 'impact', platform: 'instagram', name: 'Bold Impact', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#f6f6f6', accent: '#d94f4f', secondary: '#dedede', dim: 0.44, gradient: 'linear-gradient(180deg,rgba(22,22,22,.34),rgba(22,22,22,.90))' },
      pairing: 'poster',
      treatment: { id: 'fullBleedScrim', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'rule', accent: '#d94f4f' },
      roles: {
        hook:     { headline: R(.08, .18, .84, .30, { maxLines: 4, maxSize: .082 }), supportingText: R(.08, .52, .84, .22, { maxLines: 4 }), ctaLine: R(.08, .84, .84, .06, { maxLines: 1, maxSize: .030 }) },
        context:  { headline: R(.08, .12, .84, .22, { maxLines: 3, maxSize: .070 }), supportingText: R(.08, .38, .84, .36, { maxLines: 6 }) },
        evidence: { headline: R(.08, .24, .84, .24, { maxLines: 3, maxSize: .076 }), supportingText: R(.08, .54, .84, .26, { maxLines: 5 }) },
        turn:     { supportingText: R(.08, .16, .84, .26, { maxLines: 5 }), headline: R(.08, .48, .84, .26, { maxLines: 3, maxSize: .078 }) },
        payoff:   { headline: R(.08, .30, .84, .26, { align: 'center', maxLines: 3, maxSize: .076 }), ctaLine: R(.08, .64, .84, .08, { align: 'center', maxLines: 1, maxSize: .032 }) },
        cta:      { headline: R(.08, .20, .84, .24, { align: 'center', maxLines: 3, maxSize: .072 }), ctaLine: R(.08, .52, .84, .12, { align: 'center', maxLines: 2, maxSize: .048 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .07, right: .07 } }
    },

    editorial: {
      id: 'editorial', platform: 'instagram', name: 'Editorial Clean', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#c9a227', secondary: '#dedede', dim: 0.34, gradient: 'linear-gradient(180deg,rgba(35,35,35,.50),rgba(35,35,35,.86))' },
      pairing: 'editorial',
      treatment: { id: 'insetFrame', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'frame', accent: 'rgba(246,246,246,.22)' },
      roles: {
        hook:     { headline: R(.10, .54, .80, .20, { maxLines: 3, maxSize: .062 }), supportingText: R(.10, .76, .80, .14, { maxLines: 3 }) },
        context:  { headline: R(.10, .52, .80, .20, { maxLines: 3, maxSize: .060 }), supportingText: R(.10, .74, .80, .16, { maxLines: 3 }) },
        evidence: { headline: R(.10, .50, .80, .20, { maxLines: 3, maxSize: .060 }), supportingText: R(.10, .72, .80, .18, { maxLines: 4 }) },
        turn:     { headline: R(.10, .50, .80, .18, { maxLines: 3, maxSize: .058 }), supportingText: R(.10, .70, .80, .18, { maxLines: 4 }) },
        payoff:   { headline: R(.10, .50, .80, .18, { maxLines: 3, maxSize: .058 }), ctaLine: R(.10, .72, .80, .06, { maxLines: 1, maxSize: .028 }) },
        cta:      { headline: R(.10, .48, .80, .18, { align: 'center', maxLines: 3, maxSize: .056 }), ctaLine: R(.10, .70, .80, .10, { align: 'center', maxLines: 2, maxSize: .044 }) }
      },
      safeZones: { instagram: { top: .08, bottom: .08, left: .10, right: .10 } }
    },

    stat_split: {
      id: 'stat_split', platform: 'instagram', name: 'Data & Stat Split', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#2C2C2C', text: '#f6f6f6', accent: '#4a9ec9', secondary: '#dedede', dim: 0.38, gradient: 'linear-gradient(180deg,rgba(44,44,44,.62),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'splitPanel', options: { side: 'right' } },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'split', accent: '#4a9ec9' },
      roles: {
        hook:     { headline: R(.08, .18, .40, .30, { maxLines: 4, maxSize: .070 }), supportingText: R(.08, .51, .38, .25, { maxLines: 5 }) },
        context:  { headline: R(.08, .15, .40, .28, { maxLines: 4, maxSize: .066 }), supportingText: R(.08, .47, .38, .30, { maxLines: 6 }) },
        evidence: { headline: R(.08, .20, .40, .26, { maxLines: 3, maxSize: .068 }), supportingText: R(.08, .50, .38, .26, { maxLines: 5 }) },
        turn:     { supportingText: R(.08, .18, .38, .26, { maxLines: 5 }), headline: R(.08, .48, .40, .28, { maxLines: 4, maxSize: .068 }) },
        payoff:   { headline: R(.08, .22, .40, .26, { maxLines: 3, maxSize: .066 }), ctaLine: R(.08, .54, .38, .08, { maxLines: 1, maxSize: .030 }) },
        cta:      { headline: R(.08, .20, .40, .24, { align: 'center', maxLines: 3, maxSize: .062 }), ctaLine: R(.08, .50, .38, .12, { align: 'center', maxLines: 2, maxSize: .044 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .08, right: .08 } }
    },

    dark_gradient: {
      id: 'dark_gradient', platform: 'instagram', name: 'Dark Ambient Glow', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#f6f6f6', accent: '#7f8fd6', secondary: '#dedede', dim: 0.42, gradient: 'radial-gradient(circle at 50% 30%,rgba(127,143,214,.26),rgba(22,22,22,.90) 72%,#161616)' },
      pairing: 'poster',
      treatment: { id: 'blurredBackdrop', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'orb', accent: '#7f8fd6' },
      roles: {
        hook:     { headline: R(.08, .22, .84, .26, { maxLines: 4, maxSize: .078 }), supportingText: R(.08, .52, .84, .24, { maxLines: 5 }) },
        context:  { headline: R(.08, .14, .84, .24, { maxLines: 3, maxSize: .072 }), supportingText: R(.08, .42, .84, .32, { maxLines: 6 }) },
        evidence: { headline: R(.08, .26, .84, .24, { maxLines: 3, maxSize: .074 }), supportingText: R(.08, .56, .84, .24, { maxLines: 5 }) },
        turn:     { supportingText: R(.08, .18, .84, .26, { maxLines: 5 }), headline: R(.08, .48, .84, .26, { maxLines: 3, maxSize: .076 }) },
        payoff:   { headline: R(.08, .32, .84, .26, { align: 'center', maxLines: 3, maxSize: .074 }), ctaLine: R(.12, .64, .76, .08, { align: 'center', maxLines: 1, maxSize: .032 }) },
        cta:      { headline: R(.08, .22, .84, .24, { align: 'center', maxLines: 3, maxSize: .070 }), ctaLine: R(.10, .52, .80, .12, { align: 'center', maxLines: 2, maxSize: .046 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .07, right: .07 } }
    },

    neon_noir: {
      id: 'neon_noir', platform: 'instagram', name: 'Neon Cyber', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#eeeef0', accent: '#5fbf8f', secondary: '#b9b9bd', dim: 0.42, gradient: 'linear-gradient(150deg,rgba(22,22,22,.80),rgba(22,22,22,.94))' },
      pairing: 'terminal',
      treatment: { id: 'hardCropRule', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'stripes', accent: '#5fbf8f' },
      roles: {
        hook:     { headline: R(.08, .16, .84, .26, { maxLines: 4, maxSize: .072 }), supportingText: R(.08, .46, .84, .30, { maxLines: 5 }), ctaLine: R(.08, .82, .84, .06, { maxLines: 1, maxSize: .028 }) },
        context:  { headline: R(.08, .14, .84, .24, { maxLines: 3, maxSize: .068 }), supportingText: R(.08, .42, .84, .34, { maxLines: 6 }) },
        evidence: { headline: R(.08, .20, .84, .22, { maxLines: 3, maxSize: .070 }), supportingText: R(.08, .46, .84, .30, { maxLines: 6 }), ctaLine: R(.08, .80, .84, .06, { maxLines: 1, maxSize: .026 }) },
        turn:     { supportingText: R(.08, .16, .84, .26, { maxLines: 5 }), headline: R(.08, .46, .84, .28, { maxLines: 4, maxSize: .072 }) },
        payoff:   { headline: R(.08, .30, .84, .26, { align: 'center', maxLines: 3, maxSize: .070 }), ctaLine: R(.08, .62, .84, .08, { align: 'center', maxLines: 1, maxSize: .030 }) },
        cta:      { headline: R(.08, .20, .84, .24, { align: 'center', maxLines: 3, maxSize: .066 }), ctaLine: R(.08, .50, .84, .12, { align: 'center', maxLines: 2, maxSize: .044 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .07, right: .07 } }
    }
  };

  /* Platform safe zones. TikTok reserves the right action rail and the bottom
   * caption; the others only need a margin. A template may override any of
   * these in its own `safeZones`. */
  var SAFE_ZONES = {
    tiktok:    { top: 0.10, bottom: 0.20, left: 0.06, right: 0.20 },
    instagram: { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
    youtube:   { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
    twitter:   { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 }
  };

  function get(id) { return TEMPLATES[id] || null; }
  function list(platform) {
    return Object.keys(TEMPLATES).map(function (id) { return TEMPLATES[id]; })
      .filter(function (t) { return !platform || t.platform === platform; });
  }
  function safeZone(platform, template) {
    var override = template && template.safeZones && template.safeZones[platform];
    return override || SAFE_ZONES[platform] || SAFE_ZONES.instagram;
  }
  function resolve(templateId, platform) {
    var t = get(templateId);
    if (t && (!platform || t.platform === platform)) return t;
    return platform === 'tiktok' ? TEMPLATES.viral_hook : TEMPLATES.impact;
  }

  /* Maps a slide to one of the six story roles. The generator may set an
   * explicit role; otherwise the position in the carousel decides it, so a
   * carousel reads as a sequence (hook → context → evidence → turn → payoff →
   * cta) rather than six copies of the cover. */
  function roleFor(slide, index, total) {
    var s = slide || {};
    var explicit = String(s.role || s.type || '').toLowerCase();
    if (ROLES.indexOf(explicit) > -1) return explicit;
    if (explicit === 'hook' || explicit === 'cover' || s.useCover) return 'hook';
    if (explicit === 'outro' || explicit === 'closing') return 'cta';
    var n = Math.max(1, Number(total) || 1);
    var i = Math.max(0, Number(index) || 0);
    if (i === 0) return 'hook';
    if (i === n - 1) return 'cta';
    if (n <= 2) return 'payoff';
    // Middle slides walk the story: context → evidence → turn → payoff.
    var middle = ['context', 'evidence', 'turn', 'payoff'];
    return middle[(i - 1) % middle.length];
  }

  return {
    TEMPLATES: TEMPLATES,
    ROLES: ROLES,
    SAFE_ZONES: SAFE_ZONES,
    get: get,
    list: list,
    safeZone: safeZone,
    resolve: resolve,
    roleFor: roleFor
  };
});
