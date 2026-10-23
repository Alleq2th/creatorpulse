/* CreatorPulse · Create — generation wiring.
 *
 * Spec 6.2 Step 5: "The user generates the selected output."
 * Spec 7.4: "Preserve their actual behaviour. Do not turn these into decorative
 * buttons or change their semantics."
 *
 * So this file contains NO generation logic of its own. It prepares the inputs
 * that the app's single existing pipeline expects — window.gen() in core.js —
 * and hands over. Everything that already works (the prompt library for every
 * format, carousel rendering, slide images, saving) keeps working because it is
 * the same code path Home uses.
 */
(function () {
  'use strict';

  function S_() { return window.CPEnv.state(); }
  function F() { return window.CPCreateFlow; }

  /* Turn any Create source into the trend-shaped object the pipeline consumes.
   * Spec 6.2 Step 1 lists stories, events, own ideas and drafts — all four end
   * up as a {id, headline, summary, niche, image} record here, which is exactly
   * what a discovered story already is. */
  function toTrend(st) {
    var user = (S_() && S_().user) || {};
    var niche = (user.niches && user.niches[0]) || '';
    var ref = st.sourceRef || {};

    if (st.source === 'idea') {
      var text = String(st.idea || '').trim();
      return {
        id: F().trendIdFor(st),
        headline: text.slice(0, 160) || 'Your idea',
        summary: text,          // the whole idea is the source material
        niche: niche,
        image: null,
        score: 70
      };
    }
    if (st.source === 'event') {
      return {
        id: F().trendIdFor(st),
        headline: ref.title || 'Event',
        summary: ref.desc || ref.title || '',
        niche: ref.niche || niche,
        image: null,
        score: 75,
        timestamp: ref.date ? new Date(ref.date).getTime() : null
      };
    }
    if (st.source === 'draft') {
      var body = '';
      if (ref.content && typeof ref.content === 'object') {
        body = ref.content.content || ref.content.headline || '';
      } else {
        body = String(ref.content || '');
      }
      return {
        id: F().trendIdFor(st),
        headline: ref.headline || 'Draft',
        summary: body,
        niche: ref.niche || niche,
        image: null,
        score: 70
      };
    }
    // A live story — already the right shape, just re-use it by reference.
    return {
      id: ref.id,
      headline: ref.headline,
      summary: ref.summary || '',
      niche: ref.niche || niche,
      image: ref.image || null,
      score: ref.score || 70,
      timestamp: ref.timestamp || null,
      source: ref.source || null
    };
  }

  /* Make sure the trend the flow will generate into exists in S.trends, then
   * point the pipeline's per-story selections at the user's choices. The
   * existing gen() reads exactly these three keys. */
  function prepare(st) {
    var S = S_();
    var trend = toTrend(st);
    if (!trend.id) return null;

    var found = false;
    for (var i = 0; i < S.trends.length; i++) {
      if (S.trends[i].id === trend.id) {
        // Refresh the payload but keep the slot, so re-generating an edited
        // idea does not accumulate duplicate entries.
        S.trends[i] = Object.assign({}, S.trends[i], trend);
        found = true;
        break;
      }
    }
    if (!found) S.trends = [trend].concat(S.trends);

    S.plat[trend.id] = st.platform;
    S.ctype[trend.id] = st.format;
    S.tone[trend.id] = st.tone || 'normal';
    st.trendId = trend.id;
    return trend.id;
  }

  /* The single entry point the flow calls. Returns a promise that resolves when
   * the pipeline has finished, so the UI can keep its own busy state honest
   * instead of guessing. */
  function generate(st) {
    var tid = prepare(st);
    if (!tid) {
      return Promise.reject(new Error('Nothing to generate from yet.'));
    }
    if (typeof window.gen !== 'function') {
      return Promise.reject(new Error('Generation is unavailable right now.'));
    }
    // gen() is async but resolves before its final render; awaiting the call
    // and then reading S.loading[tid] is how we know it is really done.
    return Promise.resolve()
      .then(function () { return window.gen(tid, false); })
      .then(function () {
        var S = S_();
        if (S.loading && S.loading[tid]) {
          // gen() clears the flag itself in a finally-style block; give it one
          // macrotask to land rather than reporting a false failure.
          return new Promise(function (res) { setTimeout(res, 0); });
        }
        return null;
      })
      .then(function () {
        var S = S_();
        var outs = (S.outs && S.outs[tid]) || [];
        var first = outs[0];
        if (first && first.label === 'Error') {
          throw new Error(String(first.content || '').replace(/^Generation failed\.\s*/, '') || 'Generation failed.');
        }
        return tid;
      });
  }

  /* A change after generating (new platform, new format, new tone) means the
   * output on screen no longer matches the settings. Spec 8.5: "If the output
   * needs to be regenerated for a different format, explain that clearly and
   * provide a predictable action." */
  function isStale(st) {
    var S = S_();
    if (!st || !st.trendId || !S) return false;
    var outs = (S.outs && S.outs[st.trendId]) || [];
    if (!outs.length) return false;
    var plat = (S.plat && S.plat[st.trendId]) || null;
    var fmt = (S.ctype && S.ctype[st.trendId]) || null;
    return plat !== st.platform || fmt !== st.format;
  }

  window.CPCreateGenerate = {
    toTrend: toTrend,
    prepare: prepare,
    generate: generate,
    isStale: isStale
  };
})();
