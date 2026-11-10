/* CreatorPulse · Carousel slide planning.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The carousel used to ask the AI for "exactly N slides" and then ship whatever
 * came back. When the model returned one object — or returned fewer items than
 * asked — the carousel silently became a single post. `generateSlidesWithCount`
 * retried once, but on the second attempt it returned the short array anyway
 * (see `if (slides.length === wantCount || attempt === 1) return`), so a short
 * response always won.
 *
 * This module makes the requested slide count a guarantee rather than a hope:
 * given whatever the model produced, it returns exactly `want` slides, padding
 * with real content taken from the source text (never invented facts) when the
 * model comes up short, and trimming extras when it runs long.
 *
 * Pure data in, pure data out — so the guarantee is unit-testable in Node
 * without a browser or an API key.
 */

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCreateSlidePlan = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MIN_SLIDES = 1;
  var MAX_SLIDES = 10;

  /* Splits source text into sentences without inventing anything.
   * Used only to pad a short carousel with the story's own words. */
  function sentences(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 24; });
  }

  /* A padding slide drawn from the source: a short headline plus one real
   * sentence. Deliberately marked as filler so the caller can style it as a
   * supporting beat rather than a lead. */
  function fillerSlide(headline, sentence, index) {
    var words = String(sentence || '').split(/\s+/).filter(Boolean);
    var lead = words.slice(0, 6).join(' ');
    return {
      type: 'body',
      headline: String(lead || headline || 'The detail').replace(/[,;:]$/, ''),
      body: String(sentence || '').slice(0, 220),
      sectionLabel: index === 1 ? 'WHAT HAPPENED' : 'THE DETAIL',
      _filler: true
    };
  }

  /* Guarantees exactly `want` slides.
   *
   *   hook            the opening slide (already built by the caller)
   *   bodySlides      whatever the model returned
   *   want            the number of slides the user asked for
   *   sourceText      the story text, used only to pad — never to invent
   *   makeFooter      optional builder for the closing CTA slide
   *
   * Returns { slides, padded, trimmed, requested }. */
  function plan(hook, bodySlides, want, sourceText, makeFooter) {
    var requested = clampCount(want);
    var list = (Array.isArray(bodySlides) ? bodySlides : []).filter(Boolean).slice();
    var padded = 0;
    var trimmed = 0;

    // A 1-slide request is a single post, not a carousel: the hook has to carry
    // the whole story, so the body slides become supporting copy on that slide.
    if (requested === 1) {
      var only = Object.assign({}, hook || {});
      if (!only.supportingText && list.length) {
        only.supportingText = [].concat(
          list.map(function (s) { return s.body || s.supportingText || ''; })
        ).filter(Boolean).join(' ').slice(0, 240);
      }
      only.type = 'hook';
      return { slides: [only], padded: 0, trimmed: 0, requested: requested };
    }

    // How many slides must come from the body, given the requested total.
    // A carousel always ends with a distinct CTA once it has room for a story beat.
    // Three slides = hook, one body beat, CTA. Four slides = hook, two body beats,
    // CTA. Two slides stay hook + CTA because there is no room for a middle beat.
    var useDedicatedOutro = requested >= 3;
    var bodyTarget = useDedicatedOutro ? requested - 2 : requested - 1;
    if (bodyTarget < 1) bodyTarget = 1;

    if (list.length > bodyTarget) {
      trimmed = list.length - bodyTarget;
      list = list.slice(0, bodyTarget);
    }

    if (list.length < bodyTarget) {
      var pool = sentences(sourceText).filter(function (s) {
        return !list.some(function (b) { return String(b.body || '') === s; });
      });
      var need = bodyTarget - list.length;
      for (var i = 0; i < need; i++) {
        // Prefer the story's own sentences; if they run out, reuse the hook
        // tease rather than fabricate. A blank filler is better than a lie.
        var sentence = pool[i] || (i === 0 ? (hook && hook.supportingText) : '') || '';
        list.push(fillerSlide(hook && hook.headline, sentence, i));
        padded++;
      }
    }

    var slides = [];
    if (hook) slides.push(Object.assign({}, hook, { type: 'hook' }));
    list.forEach(function (s) {
      slides.push(Object.assign({}, s, { type: s.type || 'body' }));
    });

    if (useDedicatedOutro && typeof makeFooter === 'function') {
      slides.push(makeFooter());
    } else if (slides.length) {
      // A two-slide carousel has no middle slide, so its final slide carries the CTA.
      slides[slides.length - 1].ctaLine =
        slides[slides.length - 1].ctaLine || 'FOLLOW FOR MORE \u2192';
    }

    // Final guarantee: the array length matches the request exactly. If the
    // outro builder was unavailable we still fill up rather than under-deliver.
    while (slides.length < requested) {
      slides.push(fillerSlide(hook && hook.headline, '', slides.length));
      padded++;
    }
    if (slides.length > requested) {
      trimmed += slides.length - requested;
      slides = slides.slice(0, requested);
    }

    return { slides: slides, padded: padded, trimmed: trimmed, requested: requested };
  }

  function clampCount(n) {
    var v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 4;
    return Math.max(1, Math.min(MAX_SLIDES, v));
  }

  /* The numbered page chips under an Instagram carousel: 1, 2, 3, 4, 5 …
   * Purely presentational data so the markup stays dumb and the behaviour is
   * testable. `current` is 0-based. */
  function pageNumbers(total, current, max) {
    var n = Math.max(1, Math.round(Number(total) || 1));
    var active = Math.max(0, Math.min(n - 1, Math.round(Number(current) || 0)));
    var cap = Math.max(1, Math.round(Number(max) || 10));
    var out = [];
    for (var i = 0; i < Math.min(n, cap); i++) {
      out.push({ index: i, label: String(i + 1), active: i === active });
    }
    return out;
  }

  /* Does this format produce a multi-slide carousel at all? Kept here so the
   * Create flow and the renderer cannot disagree about it. */
  function isCarouselFormat(platform, format) {
    return platform === 'instagram' && /carousel/i.test(String(format || ''));
  }

  /* Every graphic format, and how many slides it should default to.
   * Carousel is the only multi-slide one; the rest are single images, which is
   * why asking for "4 slides" on a single post used to do nothing. */
  function defaultSlideCount(platform, format) {
    if (isCarouselFormat(platform, format)) return 4;
    // TikTok graphic formats are a multi-POST set, not a single image: the user
    // swipes through several TikTok posts. Three is the sensible default.
    if (platform === 'tiktok' && /graphic|camera/i.test(String(format || ''))) return 3;
    return 1;
  }

  /* Does this format produce a swipeable multi-item set at all? Carousel on
   * Instagram, and the graphic formats on TikTok (several posts). */
  function isMultiFormat(platform, format) {
    if (isCarouselFormat(platform, format)) return true;
    return platform === 'tiktok' && /graphic|camera/i.test(String(format || ''));
  }

  return {
    plan: plan,
    clampCount: clampCount,
    sentences: sentences,
    pageNumbers: pageNumbers,
    isCarouselFormat: isCarouselFormat,
    isMultiFormat: isMultiFormat,
    defaultSlideCount: defaultSlideCount,
    MIN_SLIDES: MIN_SLIDES,
    MAX_SLIDES: MAX_SLIDES
  };
});
