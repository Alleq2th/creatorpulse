/* CreatorPulse · Carrying a story into the Create flow (spec 3.2).
 *
 * Spec 3.2: "For example, a story detail view could offer a prominent action
 * such as **Create content**. That action should carry the relevant story
 * context into the creation workflow."
 *
 * And spec 3.1: "Avoid discarding the selected story or previously entered
 * information when the user changes a setting or returns to a previous screen.
 * Preserve relevant state whenever appropriate."
 *
 * This file is ONLY the decision of *what* gets carried across, as pure data.
 * It touches no DOM and makes no network calls, so the tests can run the real
 * rules in Node. The wiring lives in create/index.js, the button in core.js.
 *
 * Loaded two ways, exactly like lib/opportunityScore.js:
 *   * Node reads it as CommonJS (module.exports at the bottom) for the tests.
 *   * index.html loads it as a classic <script>, where `module` is undefined,
 *     the guard is skipped, and window.cpCreateSeed becomes available.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.cpCreateSeed = api.cpCreateSeed;
    root.cpCreateLandingStep = api.cpCreateLandingStep;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* The format a story should arrive with.
   *
   * The card already remembers a per-story format (S.ctype). If the user picked
   * one and it still belongs to the platform we are about to carry over, keep
   * it — that is spec 3.1's "preserve relevant state". If it does not belong,
   * fall back to the platform's first format rather than carrying a value that
   * would fail flow.js's canAdvance() check and strand the user on step 3. */
  function formatFor(story, platform, ptypes) {
    if (!platform) return null;
    var list = (ptypes && ptypes[platform]) || [];
    if (!list.length) return null;
    var chosen = story && story.format;
    if (chosen && list.indexOf(chosen) >= 0) return chosen;
    return list[0];
  }

  /* Which platform to carry.
   *
   * Order of authority, most specific first:
   *   1. the platform the user EXPLICITLY picked on the card
   *   2. the app's recommended platform for this story ("Best platform")
   *   3. the first platform the user actually has, if neither applies
   * A platform that is not in the format table is never carried, because the
   * next step would then have no formats to show.
   *
   * Why `opts.picked` exists: core.js's toggle() writes
   *   S.plat[tid] = S.user?.primaryPlatform || "instagram"
   * the moment a card opens, purely so the rails have something selected. That
   * value looks exactly like a choice but is not one. Reading it as a choice
   * made the flow carry Instagram while the card one line above said
   * "Best platform: TikTok" — the app contradicting itself. So a card platform
   * only counts when the user actually tapped it (S.hasSelected). */
  function platformFor(story, opts) {
    var ptypes = opts.ptypes || {};
    var candidates = [];
    if (opts.picked && story && story.platform) candidates.push(story.platform);
    candidates.push(opts.recommended);
    var userPlats = opts.platforms || [];
    for (var i = 0; i < userPlats.length; i++) candidates.push(userPlats[i]);

    for (var j = 0; j < candidates.length; j++) {
      var p = candidates[j];
      if (p && ptypes[p] && ptypes[p].length) return p;
    }
    return null;
  }

  /* Spec 6.2 says the flow runs source -> platform -> format -> tone, but also
   * warns: "Avoid forcing users to configure every available preference before
   * they can generate content."
   *
   * So we skip only the questions we already have the answer to — never past a
   * step whose value is missing. Landing on 'tone' with both a platform and a
   * format known leaves exactly one optional choice before generating, which is
   * the shortest honest path. */
  function cpCreateLandingStep(platform, format) {
    if (platform && format) return 'tone';
    return 'platform';
  }

  /* Build the seed the Create flow starts from.
   *
   * Returns null when there is no story to carry, so the caller can decline
   * rather than navigate to a half-filled flow.
   *
   * `story` here is the story object as the card sees it, with two additions
   * the caller may supply:
   *   platform — the platform currently selected on the card (S.plat[tid])
   *   format   — the format currently selected on the card (S.ctype[tid])
   * Neither is invented here; absent means "no preference", not a guess.
   * `opts.picked` says whether that card platform was a real tap or just the
   * default core.js writes when the card opens (see platformFor above). */
  function cpCreateSeed(story, opts) {
    if (!story || !story.id) return null;
    opts = opts || {};

    var platform = platformFor(story, opts);
    var format = formatFor(story, platform, opts.ptypes);

    return {
      source: 'story',
      sourceRef: story,
      platform: platform,
      format: format,
      tone: (opts.tone && String(opts.tone)) || 'normal',
      step: cpCreateLandingStep(platform, format),
      // A story we could not resolve a platform for still lands on step 2 with
      // the story attached, so the user continues from a real starting point
      // instead of an empty flow.
      carried: !!(platform && format)
    };
  }

  return {
    cpCreateSeed: cpCreateSeed,
    cpCreateLandingStep: cpCreateLandingStep
  };
});
