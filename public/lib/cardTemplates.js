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
 * STRUCTURE, NOT COLOUR
 * ---------------------
 * Each template below is a genuinely different COMPOSITION — different geometry,
 * not a different paint job. The nine required designs are:
 *
 *   1. Bold Impact        huge condensed headline, bottom-anchored, left, full-bleed
 *                         photo, accent underline bar.
 *   2. Editorial Clean    serif headline top-left, thin hairline rule, photo cropped
 *                         to a tall inset on one side, generous whitespace.
 *   3. Data & Stat Split  photo on one half, a GIANT stat number as the hero on the
 *                         other half, a small label below it, a source line.
 *   4. Quote Card         oversized quote mark in the accent, quote text as the hero,
 *                         attribution small beneath, photo as a dim duotone field.
 *   5. Breaking Alert     a "BREAKING" tag top-left, a tight stacked headline, a
 *                         timestamp line, a high-contrast scrim.
 *   6. Headline Stack     3-4 words per line, each line a different weight/size, one
 *                         keyword highlighted in the accent, centred.
 *   7. Minimal Caption    photo full-bleed and uncropped, ONE small caption bar at
 *                         the bottom, nothing else. The photo is the hero.
 *   8. Neon/Ambient       dark background, a soft glow behind the subject, light
 *                         type, accent used only on the keyword.
 *   9. TikTok 9:16 Viral Hook  the hook sits in the upper-middle safe zone, big and
 *                         stacked, clear of the right action rail and the bottom
 *                         caption area.
 *
 * The platform-specific names are kept: the Instagram set is
 * impact / editorial / stat_split / dark_gradient / neon_noir and the TikTok set
 * is viral_hook / silent_camera / quote_punch / minimal_noir / high_retention.
 * The nine required designs map onto them as:
 *   Bold Impact -> impact            Editorial Clean -> editorial
 *   Data & Stat Split -> stat_split  Quote Card -> quote_punch
 *   Breaking Alert -> high_retention Headline Stack -> silent_camera
 *   Minimal Caption -> minimal_noir  Neon/Ambient -> dark_gradient
 *   TikTok 9:16 Viral Hook -> viral_hook
 * (neon_noir is the tenth, kept as the platform's Neon Cyber variant.)
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
   * fraction of the canvas WIDTH). maxSize is left unset by default so the
   * engine can apply a per-layer default — a supporting line must never be set
   * as large as a headline. */
  function R(x, y, w, h, o) {
    return Object.assign({ x: x, y: y, width: w, height: h, align: 'left', anchor: 'top', maxLines: 5 }, o || {});
  }

  /* The six story roles a slide can play. Each template gives every role a
   * genuinely different composition — not the same box moved around. */
  var ROLES = ['hook', 'context', 'evidence', 'turn', 'payoff', 'cta'];

  var TEMPLATES = {
    /* ── TikTok (1080×1920) ─────────────────────────────────────────────── */

    /* 9. TikTok 9:16 Viral Hook — the hook sits in the UPPER-MIDDLE safe zone,
     * big and stacked, clear of the right action rail and the bottom caption.
     * The composition is a centred stack that never reaches the lower third. */
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

    /* 6. Headline Stack — 3 to 4 words per line, each line a different
     * weight/size, one keyword highlighted in the accent, centred. The stack is
     * a narrow centred column so the line breaks read as a deliberate ladder. */
    silent_camera: {
      id: 'silent_camera', platform: 'tiktok', name: 'Headline Stack', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#c9553f', secondary: '#dedede', dim: 0.20, gradient: 'linear-gradient(180deg,rgba(35,35,35,.66),rgba(35,35,35,.10) 40%,rgba(35,35,35,.80))' },
      pairing: 'editorial',
      treatment: { id: 'insetFrame', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'corner', accent: '#c9553f' },
      roles: {
        hook:     { headline: R(.14, .12, .72, .20, { align: 'center', maxLines: 4, maxSize: .062, stack: true, keyword: true }), supportingText: R(.16, .70, .68, .16, { align: 'center', maxLines: 3 }) },
        context:  { headline: R(.14, .14, .72, .18, { align: 'center', maxLines: 4, maxSize: .058, stack: true, keyword: true }), supportingText: R(.16, .40, .68, .24, { align: 'center', maxLines: 4 }) },
        evidence: { supportingText: R(.16, .16, .68, .20, { align: 'center', maxLines: 4 }), headline: R(.14, .44, .72, .22, { align: 'center', maxLines: 4, maxSize: .060, stack: true, keyword: true }) },
        turn:     { supportingText: R(.16, .30, .68, .22, { align: 'center', maxLines: 4 }), headline: R(.14, .60, .72, .22, { align: 'center', maxLines: 4, maxSize: .060, stack: true, keyword: true }) },
        payoff:   { headline: R(.14, .40, .72, .22, { align: 'center', maxLines: 4, maxSize: .062, stack: true, keyword: true }), ctaLine: R(.18, .72, .64, .06, { align: 'center', maxLines: 1, maxSize: .028 }) },
        cta:      { headline: R(.14, .20, .72, .20, { align: 'center', maxLines: 4, maxSize: .058, stack: true, keyword: true }), ctaLine: R(.16, .52, .68, .10, { align: 'center', maxLines: 2, maxSize: .044 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .06, right: .20 } }
    },

    /* 4. Quote Card — an oversized quote mark in the accent, the quote text as
     * the hero, the attribution small beneath, the photo a dim duotone field.
     * The quote mark is a decoration, not a text layer, so it never wraps. */
    quote_punch: {
      id: 'quote_punch', platform: 'tiktok', name: 'Quote Card', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#2C2C2C', text: '#f6f6f6', accent: '#d8b24a', secondary: '#dedede', dim: 0.50, gradient: 'linear-gradient(160deg,rgba(44,44,44,.84),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'duotone', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'quote', accent: '#d8b24a' },
      roles: {
        hook:     { headline: R(.10, .26, .80, .34, { maxLines: 5, maxSize: .092 }), supportingText: R(.10, .64, .80, .14, { maxLines: 2, maxSize: .034 }) },
        context:  { headline: R(.10, .30, .80, .30, { maxLines: 5, maxSize: .082 }), supportingText: R(.10, .64, .80, .14, { maxLines: 2, maxSize: .034 }) },
        evidence: { headline: R(.10, .22, .80, .28, { maxLines: 4, maxSize: .080 }), supportingText: R(.10, .54, .80, .18, { maxLines: 3, maxSize: .034 }), ctaLine: R(.10, .78, .80, .06, { maxLines: 1, maxSize: .030 }) },
        turn:     { supportingText: R(.10, .22, .80, .18, { maxLines: 3, maxSize: .034 }), headline: R(.10, .44, .80, .32, { maxLines: 5, maxSize: .086 }) },
        payoff:   { headline: R(.10, .36, .80, .30, { align: 'center', maxLines: 4, maxSize: .084 }), ctaLine: R(.12, .70, .76, .08, { align: 'center', maxLines: 1, maxSize: .034 }) },
        cta:      { headline: R(.10, .26, .80, .26, { align: 'center', maxLines: 4, maxSize: .078 }), ctaLine: R(.10, .56, .80, .12, { align: 'center', maxLines: 2, maxSize: .050 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .05, right: .20 } }
    },

    /* 7. Minimal Caption — the photo is full-bleed and uncropped, and there is
     * ONE small caption bar at the bottom. Nothing else. The photo is the hero,
     * so the caption is a single narrow strip pinned to the bottom safe edge. */
    minimal_noir: {
      id: 'minimal_noir', platform: 'tiktok', name: 'Minimal Caption', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#161616', text: '#eeeef0', accent: '#9aa0a6', secondary: '#b9b9bd', dim: 0.38, gradient: 'linear-gradient(180deg,rgba(22,22,22,.72),rgba(22,22,22,.90))' },
      pairing: 'minimal',
      treatment: { id: 'blurredBackdrop', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'caption', accent: '#9aa0a6' },
      roles: {
        hook:     { headline: R(.08, .78, .84, .10, { maxLines: 2, maxSize: .040 }), supportingText: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) },
        context:  { headline: R(.08, .76, .84, .12, { maxLines: 2, maxSize: .038 }), supportingText: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) },
        evidence: { headline: R(.08, .80, .84, .08, { maxLines: 1, maxSize: .038 }), supportingText: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) },
        turn:     { headline: R(.08, .74, .84, .14, { maxLines: 3, maxSize: .038 }), supportingText: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) },
        payoff:   { headline: R(.08, .78, .84, .10, { maxLines: 2, maxSize: .038 }), ctaLine: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) },
        cta:      { headline: R(.08, .82, .84, .06, { maxLines: 1, maxSize: .038 }), ctaLine: R(.08, .88, .84, .06, { maxLines: 2, maxSize: .026 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .08, right: .20 } }
    },

    /* 5. Breaking Alert — a "BREAKING" tag top-left, a tight stacked headline,
     * a timestamp line, a high-contrast scrim. The headline is a narrow column
     * under the tag so the stack reads as a news flash, not a poster. */
    high_retention: {
      id: 'high_retention', platform: 'tiktok', name: 'Breaking Alert', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#d96a4a', secondary: '#dedede', dim: 0.48, gradient: 'linear-gradient(180deg,rgba(35,35,35,.62),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'duotone', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'badge', text: 'BREAKING', accent: '#d96a4a' },
      roles: {
        hook:     { headline: R(.09, .20, .70, .26, { maxLines: 4, maxSize: .070, stack: true }), supportingText: R(.09, .50, .70, .20, { maxLines: 4 }), ctaLine: R(.09, .74, .70, .07, { maxLines: 1, maxSize: .026 }) },
        context:  { headline: R(.09, .20, .70, .24, { maxLines: 4, maxSize: .066, stack: true }), supportingText: R(.09, .48, .70, .26, { maxLines: 5 }), ctaLine: R(.09, .76, .70, .07, { maxLines: 1, maxSize: .026 }) },
        evidence: { headline: R(.09, .22, .70, .24, { maxLines: 4, maxSize: .068, stack: true }), supportingText: R(.09, .50, .70, .22, { maxLines: 4 }), ctaLine: R(.09, .74, .70, .07, { maxLines: 1, maxSize: .026 }) },
        turn:     { supportingText: R(.09, .22, .70, .22, { maxLines: 4 }), headline: R(.09, .48, .70, .26, { maxLines: 4, maxSize: .070, stack: true }), ctaLine: R(.09, .76, .70, .07, { maxLines: 1, maxSize: .026 }) },
        payoff:   { headline: R(.09, .34, .70, .26, { maxLines: 4, maxSize: .068, stack: true }), ctaLine: R(.09, .64, .70, .07, { maxLines: 1, maxSize: .028 }) },
        cta:      { headline: R(.09, .24, .70, .24, { maxLines: 4, maxSize: .066, stack: true }), ctaLine: R(.09, .54, .70, .10, { maxLines: 2, maxSize: .046 }) }
      },
      safeZones: { tiktok: { top: .10, bottom: .20, left: .06, right: .20 } }
    },

    /* ── Instagram (1080×1350) ──────────────────────────────────────────── */

    /* 1. Bold Impact — a huge condensed headline (Anton), bottom-anchored,
     * left-aligned, over a full-bleed photo, with an accent underline bar. The
     * headline is the LAST thing on the card, so it is anchored to the bottom. */
    impact: {
      id: 'impact', platform: 'instagram', name: 'Bold Impact', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#f6f6f6', accent: '#d94f4f', secondary: '#dedede', dim: 0.44, gradient: 'linear-gradient(180deg,rgba(22,22,22,.34),rgba(22,22,22,.90))' },
      pairing: 'poster',
      treatment: { id: 'fullBleedScrim', options: {} },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'rule', accent: '#d94f4f' },
      roles: {
        hook:     { headline: R(.08, .58, .84, .28, { anchor: 'bottom', maxLines: 4, maxSize: .082 }), supportingText: R(.08, .44, .84, .12, { maxLines: 3 }), ctaLine: R(.08, .88, .84, .05, { maxLines: 1, maxSize: .026 }) },
        context:  { headline: R(.08, .60, .84, .28, { anchor: 'bottom', maxLines: 4, maxSize: .070 }), supportingText: R(.08, .40, .84, .18, { maxLines: 4 }) },
        evidence: { headline: R(.08, .58, .84, .30, { anchor: 'bottom', maxLines: 4, maxSize: .076 }), supportingText: R(.08, .38, .84, .18, { maxLines: 4 }) },
        turn:     { supportingText: R(.08, .40, .84, .16, { maxLines: 4 }), headline: R(.08, .58, .84, .30, { anchor: 'bottom', maxLines: 4, maxSize: .078 }) },
        payoff:   { headline: R(.08, .56, .84, .30, { anchor: 'bottom', maxLines: 4, maxSize: .076 }), ctaLine: R(.08, .86, .84, .07, { maxLines: 1, maxSize: .026 }) },
        cta:      { headline: R(.08, .58, .84, .28, { anchor: 'bottom', maxLines: 4, maxSize: .072 }), ctaLine: R(.08, .86, .84, .07, { maxLines: 1, maxSize: .026 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .07, right: .07 } }
    },

    /* 2. Editorial Clean — a serif (Playfair) headline top-left, a thin hairline
     * rule, the photo cropped to a TALL INSET on one side, generous whitespace.
     * The type column is narrow and the photo is a tall panel, so the two never
     * compete: this is the only template with a tall side inset. */
    editorial: {
      id: 'editorial', platform: 'instagram', name: 'Editorial Clean', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#232323', text: '#f6f6f6', accent: '#c9a227', secondary: '#dedede', dim: 0.34, gradient: 'linear-gradient(180deg,rgba(35,35,35,.50),rgba(35,35,35,.86))' },
      pairing: 'editorial',
      treatment: { id: 'tallInset', options: { side: 'right' } },
      accentUse: { cta: true, rule: true, keyword: false },
      decoration: { type: 'hairline', accent: '#c9a227' },
      roles: {
        hook:     { headline: R(.08, .10, .46, .30, { maxLines: 5, maxSize: .062 }), supportingText: R(.08, .44, .46, .22, { maxLines: 5 }), ctaLine: R(.08, .68, .46, .08, { maxLines: 1, maxSize: .024 }) },
        context:  { headline: R(.08, .10, .46, .28, { maxLines: 5, maxSize: .060 }), supportingText: R(.08, .42, .46, .26, { maxLines: 6 }) },
        evidence: { headline: R(.08, .10, .46, .26, { maxLines: 4, maxSize: .060 }), supportingText: R(.08, .40, .46, .28, { maxLines: 6 }) },
        turn:     { supportingText: R(.08, .10, .46, .24, { maxLines: 5 }), headline: R(.08, .38, .46, .30, { maxLines: 5, maxSize: .058 }) },
        payoff:   { headline: R(.08, .10, .46, .28, { maxLines: 5, maxSize: .058 }), ctaLine: R(.08, .40, .46, .08, { maxLines: 1, maxSize: .024 }) },
        cta:      { headline: R(.08, .10, .46, .26, { maxLines: 4, maxSize: .056 }), ctaLine: R(.08, .40, .46, .10, { maxLines: 2, maxSize: .040 }) }
      },
      safeZones: { instagram: { top: .08, bottom: .08, left: .08, right: .08 } }
    },

    /* 3. Data & Stat Split — the photo owns one half, and a GIANT stat number is
     * the hero on the other half, with a small label below it and a source line.
     * The stat is a decoration (a number drawn at hero scale), so it never wraps
     * and never competes with the headline for the same box. */
    stat_split: {
      id: 'stat_split', platform: 'instagram', name: 'Data & Stat Split', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#2C2C2C', text: '#f6f6f6', accent: '#4a9ec9', secondary: '#dedede', dim: 0.38, gradient: 'linear-gradient(180deg,rgba(44,44,44,.62),rgba(22,22,22,.94))' },
      pairing: 'broadcast',
      treatment: { id: 'splitPanel', options: { side: 'right' } },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'stat', accent: '#4a9ec9' },
      roles: {
        hook:     { headline: R(.08, .12, .40, .16, { maxLines: 3, maxSize: .052, minSize: .016 }), supportingText: R(.08, .30, .40, .11, { maxLines: 3, maxSize: .024 }), ctaLine: R(.08, .47, .40, .06, { maxLines: 1, maxSize: .022 }) },
        context:  { headline: R(.08, .14, .40, .14, { maxLines: 3, maxSize: .050, minSize: .016 }), supportingText: R(.08, .30, .40, .11, { maxLines: 3, maxSize: .024 }), ctaLine: R(.08, .47, .40, .06, { maxLines: 1, maxSize: .022 }) },
        evidence: { headline: R(.08, .10, .40, .18, { maxLines: 3, maxSize: .050, minSize: .016 }), supportingText: R(.08, .30, .40, .11, { maxLines: 3, maxSize: .024 }), ctaLine: R(.08, .47, .40, .06, { maxLines: 1, maxSize: .022 }) },
        turn:     { supportingText: R(.08, .12, .40, .11, { maxLines: 3, maxSize: .024 }), headline: R(.08, .26, .40, .18, { maxLines: 3, maxSize: .050, minSize: .016 }), ctaLine: R(.08, .49, .40, .06, { maxLines: 1, maxSize: .022 }) },
        payoff:   { headline: R(.08, .16, .40, .12, { maxLines: 2, maxSize: .050, minSize: .016 }), ctaLine: R(.08, .33, .40, .07, { maxLines: 1, maxSize: .024 }) },
        cta:      { headline: R(.08, .18, .40, .10, { maxLines: 2, maxSize: .048, minSize: .016 }), ctaLine: R(.08, .33, .40, .09, { maxLines: 2, maxSize: .034 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .08, right: .08 } }
    },

    /* 8. Neon/Ambient — a dark background with a soft glow behind the subject,
     * light type, and the accent used ONLY on the keyword. The glow is a radial
     * decoration centred on the subject, and the type is a centred column. */
    dark_gradient: {
      id: 'dark_gradient', platform: 'instagram', name: 'Neon/Ambient', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#f6f6f6', accent: '#7f8fd6', secondary: '#dedede', dim: 0.42, gradient: 'radial-gradient(circle at 50% 30%,rgba(127,143,214,.26),rgba(22,22,22,.90) 72%,#161616)' },
      pairing: 'poster',
      treatment: { id: 'blurredBackdrop', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'orb', accent: '#7f8fd6' },
      roles: {
        hook:     { headline: R(.12, .30, .76, .26, { align: 'center', maxLines: 4, maxSize: .078, keyword: true }), supportingText: R(.16, .60, .68, .18, { align: 'center', maxLines: 4 }) },
        context:  { headline: R(.12, .26, .76, .24, { align: 'center', maxLines: 4, maxSize: .072, keyword: true }), supportingText: R(.16, .54, .68, .22, { align: 'center', maxLines: 5 }) },
        evidence: { headline: R(.12, .28, .76, .24, { align: 'center', maxLines: 4, maxSize: .074, keyword: true }), supportingText: R(.16, .56, .68, .20, { align: 'center', maxLines: 4 }) },
        turn:     { supportingText: R(.16, .26, .68, .20, { align: 'center', maxLines: 4 }), headline: R(.12, .50, .76, .26, { align: 'center', maxLines: 4, maxSize: .076, keyword: true }) },
        payoff:   { headline: R(.12, .34, .76, .26, { align: 'center', maxLines: 4, maxSize: .074, keyword: true }), ctaLine: R(.16, .66, .68, .06, { align: 'center', maxLines: 1, maxSize: .032 }) },
        cta:      { headline: R(.12, .28, .76, .24, { align: 'center', maxLines: 4, maxSize: .070, keyword: true }), ctaLine: R(.16, .56, .68, .10, { align: 'center', maxLines: 2, maxSize: .046 }) }
      },
      safeZones: { instagram: { top: .07, bottom: .07, left: .07, right: .07 } }
    },

    /* Neon Cyber — the platform's tenth template, kept as the terminal/mono
     * variant of the Neon/Ambient family: a hard-cropped photo band, a mono
     * headline, and a stripe field. Structurally distinct from dark_gradient
     * (band + stripes vs centred glow). */
    neon_noir: {
      id: 'neon_noir', platform: 'instagram', name: 'Neon Cyber', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#161616', text: '#eeeef0', accent: '#5fbf8f', secondary: '#b9b9bd', dim: 0.42, gradient: 'linear-gradient(150deg,rgba(22,22,22,.80),rgba(22,22,22,.94))' },
      pairing: 'terminal',
      treatment: { id: 'hardCropRule', options: {} },
      accentUse: { cta: true, rule: true, keyword: true },
      decoration: { type: 'rule', accent: '#5fbf8f' },
      roles: {
        hook:     { headline: R(.08, .58, .84, .24, { maxLines: 4, maxSize: .072, keyword: true }), supportingText: R(.08, .84, .84, .10, { maxLines: 3 }) },
        context:  { headline: R(.08, .56, .84, .22, { maxLines: 4, maxSize: .068, keyword: true }), supportingText: R(.08, .82, .84, .12, { maxLines: 4 }) },
        evidence: { headline: R(.08, .60, .84, .20, { maxLines: 4, maxSize: .070, keyword: true }), supportingText: R(.08, .82, .84, .12, { maxLines: 4 }) },
        turn:     { supportingText: R(.08, .58, .84, .14, { maxLines: 4 }), headline: R(.08, .74, .84, .20, { maxLines: 4, maxSize: .072, keyword: true }) },
        payoff:   { headline: R(.08, .60, .84, .22, { maxLines: 4, maxSize: .070, keyword: true }), ctaLine: R(.08, .84, .84, .06, { maxLines: 1, maxSize: .030 }) },
        cta:      { headline: R(.08, .62, .84, .18, { maxLines: 4, maxSize: .066, keyword: true }), ctaLine: R(.08, .82, .84, .10, { maxLines: 2, maxSize: .044 }) }
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
