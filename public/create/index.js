/* CreatorPulse · Create — entry point / wiring.
 *
 * Owns exactly two things: where the flow state lives, and the handlers the
 * markup calls. All rendering lives in steps.js / review.js, all rules in
 * flow.js, all generation in generate.js.
 */
(function () {
  'use strict';

  function F() { return window.CPCreateFlow; }
  function S_() { return window.CPEnv.state(); }

  /* The flow's state lives HERE, in this module's own closure.
   *
   * It used to ride on the app's shared state object (S.create). That looked
   * tidy but was a trap: the app re-renders from several async completions
   * (feeds, saved posts, notifications), and a click that landed while one was
   * in flight could repaint from an object that no longer held the selection —
   * the choice silently reverted to nothing. Keeping the state where it is
   * read means a repaint can never lose it, no matter who calls render(). */
  var state = null;

  function cs() {
    var flow = F();
    if (!state || typeof state !== 'object') state = flow.defaultState();
    if (flow.STEPS.indexOf(state.step) < 0) state.step = 'source';
    return state;
  }

  function reset() {
    state = F().defaultState();
    return state;
  }

  function repaint() {
    if (typeof window.render === 'function') window.render();
  }

  /* ── markup entry, called by the router ──────────────────────────────── */
  var retries = 0;

  function view() {
    var st = cs();
    var Step = window.CPCreateSteps;
    var Review = window.CPCreateReview;
    var html;
    if (st.step === 'review') html = Review.reviewStep(st);
    else if (st.step === 'platform') html = Step.platformStep(st);
    else if (st.step === 'format') html = Step.formatStep(st);
    else if (st.step === 'tone') html = Step.toneStep(st);
    else html = Step.sourceStep(st);

    maybeRetry(st, html);
    // .cc-root is the scroll container and bottom-safe-area owner defined in
    // create.css. Wrapping every step here (rather than inside each step's
    // markup) means the five screens cannot drift apart, and the bottom nav
    // can never end up covering the action row.
    return '<div class="cc-root">' + html + '</div>';
  }

  /* If the first step needs a live list that has not arrived yet, look again
   * shortly instead of leaving the user on a dead-end message.
   *
   * Bounded on purpose: six attempts over ~3s. If the feeds really are empty
   * (a brand-new account, or no network) the honest empty message stays — this
   * only covers the ordinary "stories are still loading" window. */
  function needsList(st) {
    if (!st || st.step !== 'source') return false;
    var S = S_();
    if (!S) return false;
    if (st.source === 'story') return !(S.trends && S.trends.length);
    if (st.source === 'draft') return !(S.saved && S.saved.length);
    return false;
  }

  function maybeRetry(st, html) {
    if (!needsList(st)) { retries = 0; return; }
    if (retries >= 6) return;
    retries++;
    setTimeout(function () {
      // Only repaint if we are still on this screen and still waiting.
      if (needsList(state)) repaint();
      else retries = 0;
    }, 500);
  }

  /* Repaint when the feeds the first step depends on arrive.
   *
   * The app loads stories asynchronously and only repaints when you are on
   * Home (`if (S.tab === "home") render()` in core.js). So if someone opened
   * Create before the first stories landed, the "No stories loaded yet" message
   * stayed on screen forever even though the data was there a second later.
   * Watching the trend count and repainting on change fixes that without
   * touching Home's own render path.
   */
  var lastTrendCount = -1;
  function watchFeeds() {
    var S = S_();
    if (!S) return;
    var n = (S.trends && S.trends.length) || 0;
    if (lastTrendCount !== -1 && n !== lastTrendCount && state && state.step === 'source') {
      repaint();
    }
    lastTrendCount = n;
  }

  /* ── navigation ──────────────────────────────────────────────────────── */
  window.cpCreateNext = function () {
    var st = cs();
    // Step 5 is the generate action, not another question.
    if (st.step === 'tone') {
      st.step = 'review';
      repaint();
      window.cpCreateGenerate();
      return;
    }
    if (st.step === 'review') return;
    F().next(st, window.CPEnv.ptypes());
    repaint();
  };

  window.cpCreateBack = function () {
    var st = cs();
    if (st.step === 'review') { st.step = 'tone'; repaint(); return; }
    F().prev(st);
    repaint();
  };

  window.cpCreateGo = function (step) {
    var st = cs();
    st.needsRegen = false;
    F().goto(st, step);
    repaint();
  };

  window.cpCreateRestart = function () {
    reset();
    repaint();
  };

  /* ── step 1 handlers ─────────────────────────────────────────────────── */
  window.cpCreateSetSource = function (id) {
    var st = cs();
    F().setSource(st, id);
    // The Studio is a full-screen tool, not a step in this flow — hand straight
    // over to the existing, unchanged code.
    if (id === 'studio') { window.cpCreateOpenStudio(); return; }
    repaint();
  };

  window.cpCreateSetIdea = function (value) {
    F().setIdea(cs(), value);
    // No repaint while typing: it would steal the caret. The Continue button
    // reads its enabled state from the same object on the next paint.
    var btn = document.querySelector('.cc-next');
    if (btn) btn.disabled = !F().canAdvance(cs(), window.CPEnv.ptypes());
  };

  window.cpCreatePickStory = function (id) {
    var S = S_();
    var hit = null;
    (S.trends || []).forEach(function (t) { if (t.id === id) hit = t; });
    if (!hit) return;
    F().setSourceRef(cs(), hit);
    repaint();
  };

  window.cpCreatePickEvent = function (index) {
    var S = S_();
    var list = [];
    ((S.user && S.user.niches) || []).forEach(function (n) {
      ((S.eventsCache && S.eventsCache[n]) || []).forEach(function (e) { list.push(e); });
    });
    var hit = list[index];
    if (!hit) return;
    F().setSourceRef(cs(), hit);
    repaint();
  };

  window.cpCreatePickDraft = function (id) {
    var S = S_();
    var hit = null;
    (S.saved || []).forEach(function (d) { if (String(d.id) === String(id)) hit = d; });
    if (!hit) return;
    F().setSourceRef(cs(), hit);
    repaint();
  };

  /* ── steps 2–4 handlers ──────────────────────────────────────────────── */
  window.cpCreateSetPlatform = function (id) {
    F().setPlatform(cs(), id, window.CPEnv.ptypes());
    repaint();
  };

  window.cpCreateSetFormat = function (value) {
    F().setFormat(cs(), value);
    repaint();
  };

  window.cpCreateSetTone = function (id) {
    F().setTone(cs(), id);
    repaint();
  };

  /* ── the Studio hand-off ─────────────────────────────────────────────── */
  // This is the old Create tab, intact. Nothing about the camera, prompter or
  // editor changes — it is simply reached as one source choice instead of
  // being the whole tab.
  window.cpCreateOpenStudio = function () {
    if (typeof window.svEnterStudio === 'function') { window.svEnterStudio(); return; }
    // Fallback: Studio's own start view has the record / upload buttons.
    if (typeof window.svAfterRender === 'function' && typeof render === 'function') render();
  };

  /* ── generation ──────────────────────────────────────────────────────── */
  window.cpCreateGenerate = function () {
    var st = cs();
    st.error = '';
    F().goto(st, 'review');
    repaint();

    return window.CPCreateGenerate.generate(st)
      .then(function () {
        st.needsRegen = false;
        st.error = '';
      })
      .catch(function (err) {
        // Spec 18.4: never an indefinitely loading screen — a real message and
        // a retry action instead.
        st.error = (err && err.message) ? err.message : 'Generation failed.';
      })
      .then(function () { repaint(); });
  };

  window.CPCreate = {
    cs: cs,
    view: view,
    repaint: repaint
  };
})();
