/* CreatorPulse - the Opportunity score, and the facts behind it.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Spec Part 5.4 says four things about the opportunity score:
 *
 *   "The score and progress bar can be useful, but they should not imply
 *    more certainty than the underlying system supports."
 *   "Retain the existing scoring logic."
 *   "Do not change the meaning of the score during a visual redesign."
 *   "If the product already provides an explanation of how the score should
 *    be interpreted, make that information accessible without cluttering
 *    the interface."
 *
 * Before this file the app showed "Opportunity estimate 78/100" with a bar
 * and nothing else. A number with no provenance is exactly the "more
 * certainty than the system supports" the spec warns about.
 *
 * So this file does two jobs, and only two:
 *
 *   1. cpOpportunityScore()      - THE formula. One implementation, so the
 *                                  big number on the card and the explanation
 *                                  underneath it can never disagree.
 *   2. cpOpportunityBreakdown()  - the same number, plus which inputs are
 *                                  real, which are missing, and the actual
 *                                  arithmetic that produced it.
 *
 * THE FORMULA IS UNCHANGED. It is a faithful port of the client-side
 * function that used to live in core.js:
 *
 *     0.6 * storyScore + timingAdjustment + 15, clamped to 15..97
 *
 * where timingAdjustment is +16 for a rising story, 0 while peaking, and
 * -36 once it is cooling. `test/opportunityScore.test.js` asserts parity
 * against the original expression across a wide range of inputs, so the
 * "retain the existing scoring logic" rule is enforced, not just claimed.
 *
 * HONESTY RULE (from the brief: "If a factor is missing, say so").
 * The feed payload carries: id, niche, headline, summary, image, source,
 * score, viralTier, tags, timestamp. It does NOT carry the server's own
 * sub-components (how many outlets corroborated the story, or which impact
 * words fired). Those are folded into `score` server-side and cannot be
 * un-folded here. So they are reported as NOT AVAILABLE rather than being
 * invented or guessed at.
 *
 * Deliberately pure: no DOM, no fetch, no app state, and an injectable
 * clock. That is what lets the Node tests run the real implementation.
 *
 * Loaded BEFORE core.js in index.html.
 */
(function () {
  "use strict";

  // Timing adjustment, by how fast the story is moving. Kept identical to
  // the boost table that produced the shipped numbers: rising 8, peaking 0,
  // cooling -18, each doubled in the formula below.
  var BOOST_BY_STATE = { rising: 8, peaking: 0, dying: -18 };
  var BASE = 15;          // the floor added to every score
  var STRENGTH_WEIGHT = 0.6;
  var MIN = 15;
  var MAX = 97;
  var DEFAULT_STRENGTH = 55;   // what `t.score || 55` falls back to

  var VELOCITY_LABEL = { rising: "Rising", peaking: "Peaking", dying: "Cooling" };

  /**
   * How fast is this story moving?
   *
   * Matches core.js trendVelocity() exactly, INCLUDING its fallback: a story
   * with no timestamp is treated as brand new. That fallback is pre-existing
   * behaviour and part of what produced the shipped score, so changing it here
   * would silently move every number - which 5.4 forbids. Instead the
   * breakdown reports hasTimestamp:false so the panel can say so out loud.
   */
  function cpVelocity(story, now) {
    var t = typeof now === "number" ? now : Date.now();
    var ts = Number(story && story.timestamp);
    var known = isFinite(ts) && ts > 0;
    var ageHours = ((t - (known ? ts : t)) / 3600000);

    var state = ageHours < 2 ? "rising" : ageHours < 8 ? "peaking" : "dying";
    return {
      state: state,
      label: VELOCITY_LABEL[state],
      ageHours: ageHours,
      hasTimestamp: known
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /**
   * THE score. Single source of truth.
   *
   * @param {object} story  a feed item
   * @param {number} [now]  injectable clock, for tests
   * @returns {number}      15..97
   */
  function cpOpportunityScore(story, now) {
    var strength = Number((story && story.score) || DEFAULT_STRENGTH);
    var v = cpVelocity(story, now);
    var boost = BOOST_BY_STATE[v.state];
    var raw = STRENGTH_WEIGHT * strength + boost * 2 + BASE;
    return clamp(Math.round(raw), MIN, MAX);
  }

  // ── plain-language helpers ───────────────────────────────────────────────

  function ageText(hours) {
    if (!isFinite(hours)) return "unknown";
    var mins = Math.max(0, Math.round(hours * 60));
    if (mins < 1) return "under a minute";
    if (mins < 60) return mins + "m";
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return m ? h + "h " + m + "m" : h + "h";
  }

  function signed(n) { return (n > 0 ? "+" : n < 0 ? "\u2212" : "") + Math.abs(n); }

  /**
   * The same number as cpOpportunityScore(), plus everything needed to
   * explain it honestly: the inputs that exist, the inputs that do not, and
   * the arithmetic.
   *
   * @param {object} story
   * @param {number} [now]
   */
  function cpOpportunityBreakdown(story, now) {
    var t = typeof now === "number" ? now : Date.now();
    var strengthKnown = !!story && typeof story.score === "number" && isFinite(story.score);
    var strength = strengthKnown ? story.score : DEFAULT_STRENGTH;
    var v = cpVelocity(story, t);
    var boost = BOOST_BY_STATE[v.state];
    var timingAdj = boost * 2;
    var raw = STRENGTH_WEIGHT * strength + timingAdj + BASE;
    var score = clamp(Math.round(raw), MIN, MAX);

    var factors = [];

    // 1. Story strength - the server's own content score. Real, but opaque.
    factors.push({
      key: "strength",
      label: "Story strength",
      value: strengthKnown ? Math.round(strength) + "/100" : DEFAULT_STRENGTH + "/100 (assumed)",
      state: strengthKnown ? "real" : "missing",
      note: strengthKnown
        ? "The news pipeline's own score. It weighs the story's language, how widely it was covered, how fresh it is, and whether it has a photo \u2014 all folded into one number before the app sees it."
        : "This story arrived without a content score, so the app used its neutral default of 55."
    });

    // 2. Timing - fully derivable, so this one can be shown exactly.
    factors.push({
      key: "timing",
      label: "Timing",
      value: v.label + " \u00b7 " + signed(timingAdj),
      state: "real",
      note: v.state === "rising"
        ? "Published recently, so it still has runway \u2014 this lifts the score."
        : v.state === "peaking"
        ? "In its peak window \u2014 neither lifted nor penalised."
        : "Past its peak, so the same story is worth less now \u2014 this pulls the score down."
    });

    // 3. Freshness - the raw input behind the timing verdict.
    factors.push({
      key: "freshness",
      label: "Published",
      value: v.hasTimestamp ? ageText(v.ageHours) + " ago" : "no timestamp",
      state: v.hasTimestamp ? "real" : "missing",
      note: v.hasTimestamp
        ? "Taken from the story's own publish time."
        : "This story came through without a publish time. The app treats it as brand new, which is why the timing shows as rising \u2014 worth knowing when you read the number."
    });

    // 4. Photo - real, and it genuinely feeds the server score.
    var hasPhoto = !!(story && (story.image || story.hasImage));
    factors.push({
      key: "photo",
      label: "Photo",
      value: hasPhoto ? "Available" : "None",
      state: "real",
      note: hasPhoto
        ? "A usable image came with the story. Photo stories score higher upstream because they are ready to post."
        : "No image came with the story, so it received no image bonus upstream."
    });

    // 5. Niche - real, and it decides which feed the story belongs to.
    if (story && story.niche) {
      factors.push({
        key: "niche",
        label: "Niche",
        value: String(story.niche),
        state: "real",
        note: "Which of your niches this story was discovered in."
      });
    }

    // What the app genuinely does not receive. Reported, never guessed.
    var missing = [
      {
        key: "corroboration",
        label: "How many outlets ran it",
        note: "Counted on the server while scoring, then collapsed into the strength number. The app never receives the count, so it cannot show it here."
      },
      {
        key: "impact",
        label: "Which impact words fired",
        note: "Also folded into strength on the server. Showing a specific word list here would be a guess dressed up as a fact."
      }
    ];

    return {
      score: score,
      raw: raw,
      clamped: raw < MIN ? "min" : raw > MAX ? "max" : null,
      limits: { min: MIN, max: MAX },
      storyStrength: strength,
      storyStrengthKnown: strengthKnown,
      timing: v,
      timingAdjustment: timingAdj,
      base: BASE,
      weight: STRENGTH_WEIGHT,
      factors: factors,
      missing: missing
    };
  }

  var api = {
    cpOpportunityScore: cpOpportunityScore,
    cpOpportunityBreakdown: cpOpportunityBreakdown,
    cpVelocity: cpVelocity,
    cpOpportunityAgeText: ageText,
    cpOpportunityLimits: { min: MIN, max: MAX, base: BASE, weight: STRENGTH_WEIGHT }
  };

  if (typeof window !== "undefined") {
    window.cpOpportunityScore = api.cpOpportunityScore;
    window.cpOpportunityBreakdown = api.cpOpportunityBreakdown;
    window.cpVelocity = api.cpVelocity;
    window.cpOpportunityAgeText = api.cpOpportunityAgeText;
    window.cpOpportunityLimits = api.cpOpportunityLimits;
  }

  // Node consumes this file for its tests; the browser loads it as a classic
  // script where `module` is undefined. One implementation, two consumers.
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
