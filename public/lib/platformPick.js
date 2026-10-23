/* CreatorPulse - which platform to recommend, and the facts behind that pick.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The story card has always shown a single line: "Best platform: Instagram".
 * No reason, no way to see how it was chosen. Spec Part 5.4 states the rule
 * that governs every recommendation in the product:
 *
 *   "The score and progress bar can be useful, but they should not imply
 *    more certainty than the underlying system supports."
 *   "Retain the existing scoring logic."
 *   "Do not change the meaning of the score during a visual redesign."
 *   "If the product already provides an explanation of how the score should
 *    be interpreted, make that information accessible without cluttering
 *    the interface."
 *
 * Part 5.1 lists "Recommended approach -> Suggested platform" as one of the
 * four blocks a story must expose, and closes with an explicit instruction:
 *
 *   "Use the existing data and capabilities rather than inventing additional
 *    metrics or recommendations."
 *
 * So the pick itself is NOT changed. cpPickPlatform() is a faithful port of the
 * client-side heuristic that was already shipping in core.js, and
 * test/platformPick.test.js asserts parity against that original expression
 * across a wide matrix of inputs. This file explains the pick; it does not
 * re-make it.
 *
 * WHY THE INPUTS HERE CAN BE SHOWN (unlike the opportunity score's)
 * -----------------------------------------------------------------
 * The opportunity score is computed on the SERVER, so its sub-components
 * (outlet count, impact words) never reach the app and must be reported as
 * unavailable. This pick is computed entirely on the CLIENT, from data the app
 * genuinely holds: the headline, the summary, the content score and the
 * creator's own platform list. So the panel can name the exact words that
 * matched instead of declaring them unknown. That is the honest difference
 * between the two explainers, and this file keeps that distinction real by
 * never inventing a factor it cannot read.
 *
 * Deliberately pure: no DOM, no fetch, no app state. Loaded before core.js.
 */
(function () {
  "use strict";

  // Every candidate platform, in the exact order the original code created its
  // scores object in. The order matters: the ranking sort is stable, so an
  // equal score is broken by this order. Changing it would change the pick.
  var ALL = ["tiktok", "instagram", "youtube", "twitter"];

  // The strong-story nudge. Original: `if ((t.score||0) >= 85)`.
  var BONUS_THRESHOLD = 85;
  var BONUS_POINTS = 1;
  var BONUS_TO = ["twitter", "youtube"];

  // The five keyword rules, kept character-for-character as they were in
  // core.js so the pick cannot drift. Each carries the plain-language reason
  // the panel shows when it fires.
  var SIGNALS = [
    {
      key: "reaction",
      label: "Reaction / entertainment language",
      platform: "tiktok",
      points: 3,
      pattern: /viral|dance|challenge|meme|reacts?|shocking|stuns|wild|insane|hilarious|prank/,
      note: "Shock, humour and reaction stories are what TikTok rewards."
    },
    {
      key: "stats",
      label: "Stats / list language",
      platform: "instagram",
      points: 3,
      pattern: /\d+%|\$\d|record|stats?|numbers|ranking|top \d|list of/,
      note: "Numbers and rankings turn into a clean carousel slide, which is Instagram's strength."
    },
    {
      key: "visual",
      label: "Visual / style language",
      platform: "instagram",
      points: 2,
      pattern: /photo|aesthetic|fashion|style|design|behind the scenes/,
      note: "Visual subjects suit Instagram, where the image carries the post."
    },
    {
      key: "indepth",
      label: "Explain / analysis language",
      platform: "youtube",
      points: 3,
      pattern: /explain|breakdown|analysis|review|documentary|deep dive|how .* works|why .* happened/,
      note: "Topics that need explaining reward YouTube, where viewers stay for minutes."
    },
    {
      key: "opinion",
      label: "Hot-take / breaking language",
      platform: "twitter",
      points: 3,
      pattern: /breaking|takes?|debate|slams|blasts|responds|reacts to|opinion/,
      note: "Fast opinions and breaking news fit a quick X post or thread."
    }
  ];

  // The two things the app genuinely cannot see, so they are declared rather
  // than guessed. Spec 5.4's first line is the reason this section exists.
  var MISSING_FACTORS = [
    {
      key: "audience",
      label: "How big your audience is per platform",
      note: "The app is not connected to your follower counts, so it cannot favour the platform where you have the most reach. This pick only reads the story."
    },
    {
      key: "history",
      label: "How your past posts performed",
      note: "No analytics connection, so how well your recent posts did on each platform is not part of the decision."
    }
  ];

  /** The text the keyword rules are matched against. Identical to the original. */
  function cpHaystack(story) {
    return (((story && story.headline) || "") + " " + ((story && story.summary) || "")).toLowerCase();
  }

  /** The exact words a rule matched, deduped, in the order they appear. */
  function cpMatchedWords(hay, signal) {
    var out = [];
    if (!hay) return out;
    // A fresh global regex each call: the stored pattern has no `g`, so there
    // is no lastIndex to leak between calls.
    var re = new RegExp(signal.pattern.source, "g");
    var m;
    while ((m = re.exec(hay)) !== null) {
      if (out.indexOf(m[0]) === -1) out.push(m[0]);
      if (re.lastIndex === m.index) re.lastIndex++; // zero-length match guard
    }
    return out;
  }

  /** Human name for a platform id, preferring the caller's own label table. */
  function cpPlatformName(id, plats) {
    if (Array.isArray(plats)) {
      for (var i = 0; i < plats.length; i++) {
        if (plats[i] && plats[i].id === id && plats[i].label) return plats[i].label;
      }
    }
    var s = String(id == null ? "" : id);
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  /**
   * `S.user?.platforms || ['instagram']` - reproduced exactly, including the
   * fact that an EMPTY array stays empty (an empty array is truthy in
   * JavaScript, so it is not replaced by the default).
   */
  function cpPlatsOr(platforms) {
    if (Array.isArray(platforms)) return platforms;
    return ["instagram"];
  }

  /** Every platform's keyword points, plus which rules fired and the bonus. */
  function cpPlatformScores(story) {
    var hay = cpHaystack(story);
    var scores = {};
    ALL.forEach(function (p) { scores[p] = 0; });

    var matched = {};
    SIGNALS.forEach(function (s) {
      var words = cpMatchedWords(hay, s);
      if (words.length) {
        scores[s.platform] += s.points;
        matched[s.key] = words;
      }
    });

    var bonus = Number((story && story.score) || 0) >= BONUS_THRESHOLD;
    if (bonus) BONUS_TO.forEach(function (p) { scores[p] += BONUS_POINTS; });

    return { scores: scores, matched: matched, bonus: bonus, hay: hay };
  }

  /**
   * THE pick. A faithful port of the original core.js heuristic.
   *
   * @param {object} story
   * @param {string[]} platforms  the creator's platforms
   * @param {string} [primary]    the creator's primary platform
   * @returns {string} platform id
   */
  function cpPickPlatform(story, platforms, primary) {
    var plats = cpPlatsOr(platforms);
    var res = cpPlatformScores(story);

    var ranked = ALL
      .filter(function (p) { return plats.indexOf(p) > -1; })
      .map(function (p) { return [p, res.scores[p]]; })
      .sort(function (a, b) { return b[1] - a[1]; });

    if (ranked.length && ranked[0][1] > 0) return ranked[0][0];
    return primary || plats[0] || "instagram";
  }

  /**
   * The same pick, plus everything needed to explain it honestly: which rules
   * fired, the exact words that triggered them, how the platforms compared,
   * what was compared but excluded, and what the app cannot see.
   *
   * @param {object} story
   * @param {object} [opts] { platforms, primary, plats:[{id,label}], now }
   */
  function cpPlatformBreakdown(story, opts) {
    opts = opts || {};
    var plats = cpPlatsOr(opts.platforms);
    var primary = opts.primary == null ? null : opts.primary;
    var labelTable = opts.plats;

    var res = cpPlatformScores(story);
    var pick = cpPickPlatform(story, plats, primary);

    var eligible = ALL.filter(function (p) { return plats.indexOf(p) > -1; });
    var ranked = eligible
      .map(function (p) { return { id: p, points: res.scores[p] }; })
      .sort(function (a, b) { return b.points - a.points; });

    var topPoints = ranked.length ? ranked[0].points : 0;
    var matchedAny = !!(ranked.length && topPoints > 0);
    var fellBack = !matchedAny;

    // A platform that out-scored the pick but is not one you use. Saying so is
    // the difference between explaining the pick and hiding it.
    var ignored = ALL
      .filter(function (p) { return plats.indexOf(p) < 0 && res.scores[p] > topPoints && res.scores[p] > 0; })
      .map(function (p) { return { id: p, points: res.scores[p] }; });

    var factors = [];

    factors.push({
      key: "recommended",
      label: "Recommended",
      value: cpPlatformName(pick, labelTable),
      state: "real",
      note: fellBack
        ? "Nothing in this story's headline or summary matched any of the rules below, so the app fell back to your primary platform."
        : "This platform scored highest out of the ones you're on."
    });

    factors.push({
      key: "platforms",
      label: "Your platforms",
      value: plats.length ? plats.map(function (p) { return cpPlatformName(p, labelTable); }).join(", ") : "none set",
      state: plats.length ? "real" : "missing",
      note: plats.length
        ? "Only these were considered. A platform you haven't added is never recommended." +
          // When a rule fired for a platform the creator is NOT on, the
          // "Recommended" note above says "nothing matched". That is true of
          // the platform list but false of the story, and side by side the two
          // sentences contradict each other. Say which one is meant.
          (ignored.length ? " One rule below did match this story, but it matched a platform you are not on." : "")
        : "No platforms are set on your profile, so the app used its last-resort default."
    });

    SIGNALS.forEach(function (s) {
      var words = res.matched[s.key];
      var fired = !!(words && words.length);
      var eligiblePlatform = plats.indexOf(s.platform) > -1;
      factors.push({
        key: "sig_" + s.key,
        label: s.label,
        value: fired
          ? "+" + s.points + " to " + cpPlatformName(s.platform, labelTable) + (eligiblePlatform ? "" : " (not your platform)")
          : "no match",
        state: "real",
        note: fired
          ? "Matched " + words.map(function (w) { return '"' + w + '"'; }).join(", ") + " in the headline or summary. " + s.note
          : "None of this rule's triggers appear in the headline or summary. " + s.note
      });
    });

    if (res.bonus) {
      factors.push({
        key: "bonus",
        label: "Strong story bonus",
        value: "+" + BONUS_POINTS + " to " + BONUS_TO.map(function (p) { return cpPlatformName(p, labelTable); }).join(" and "),
        state: "real",
        note: "The story's own content score is " + BONUS_THRESHOLD + " or above, so the app nudges the fast-reaction and explainer platforms up."
      });
    }

    if (ignored.length) {
      factors.push({
        key: "ignored",
        label: "Scored higher, but not your platform",
        value: ignored.map(function (i) { return cpPlatformName(i.id, labelTable) + " " + i.points; }).join(" · "),
        state: "real",
        note: "These matched more strongly than the recommendation, but they are not in your platform list, so they cannot be suggested."
      });
    }

    return {
      pick: pick,
      pickLabel: cpPlatformName(pick, labelTable),
      scores: ranked,
      scoresText: ranked.map(function (r) { return cpPlatformName(r.id, labelTable) + " " + r.points; }).join(" · "),
      signals: SIGNALS.map(function (s) {
        return {
          key: s.key,
          label: s.label,
          platform: s.platform,
          points: s.points,
          fired: !!(res.matched[s.key] && res.matched[s.key].length),
          words: res.matched[s.key] || [],
          eligible: plats.indexOf(s.platform) > -1
        };
      }),
      bonus: { applied: res.bonus, threshold: BONUS_THRESHOLD, points: BONUS_POINTS, to: BONUS_TO.slice() },
      ignored: ignored,
      fellBack: fellBack,
      platforms: plats.slice(),
      primary: primary,
      topPoints: topPoints,
      factors: factors,
      missing: MISSING_FACTORS.map(function (m) { return { key: m.key, label: m.label, note: m.note }; })
    };
  }

  var api = {
    cpPickPlatform: cpPickPlatform,
    cpPlatformBreakdown: cpPlatformBreakdown,
    cpPlatformScores: cpPlatformScores,
    cpPlatformSignals: function () {
      return SIGNALS.map(function (s) {
        return { key: s.key, label: s.label, platform: s.platform, points: s.points };
      });
    },
    cpPlatformNames: { all: ALL.slice(), bonusThreshold: BONUS_THRESHOLD, bonusPoints: BONUS_POINTS, bonusTo: BONUS_TO.slice() }
  };

  if (typeof window !== "undefined") {
    window.cpPickPlatform = api.cpPickPlatform;
    window.cpPlatformBreakdown = api.cpPlatformBreakdown;
    window.cpPlatformScores = api.cpPlatformScores;
    window.cpPlatformSignals = api.cpPlatformSignals;
    window.cpPlatformNames = api.cpPlatformNames;
  }

  // Node consumes this file for its tests; the browser loads it as a classic
  // script where `module` is undefined. One implementation, two consumers.
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
