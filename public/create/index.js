/* CreatorPulse · Create: entry point / wiring.
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
   * in flight could repaint from an object that no longer held the selection -
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
    window.setTimeout(function(){
      var library=window.CPTemplateLibrary;
      if(!library)return;
      var images=Array.prototype.slice.call(document.querySelectorAll('.cc-template-thumb-img[data-template-id]:not([src])'));
      function load(img){if(!img||img.src)return;var src=library.thumbnail(img.dataset.templateId);if(src)img.src=src;}
      if('IntersectionObserver' in window){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){load(entry.target);observer.unobserve(entry.target);}});},{rootMargin:'180px'});images.forEach(function(img){observer.observe(img);});}
      else images.slice(0,24).forEach(load);
    },0);
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
   * (a brand-new account, or no network) the honest empty message stays: this
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

  /* ── arrival from a story card (spec 3.2) ──────────────────────────────────
   *
   * Spec 3.2: "a story detail view could offer a prominent action such as
   * Create content. That action should carry the relevant story context into
   * the creation workflow."
   *
   * BEFORE: the story card's own controls generated in place, and the Create
   * tab always opened on an empty "What are you creating from?" screen: so the
   * opportunity score and "Why this platform?" explainers both dead-ended.
   *
   * NOW: this seeds the real flow with the story already chosen, the platform
   * the card was showing, and that platform's format, then opens Create on the
   * first step that still needs an answer.
   *
   * All the WHAT lives in lib/storyToCreate.js so it can be tested in Node; this
   * function only applies the result to the flow's own setters. If that helper
   * is missing (a stale cached page), we fall back to plain story-only seeding
   * rather than navigating nowhere. */
  window.cpCreateStartFromTrend = function (trend) {
    var f = F();
    var S = S_() || {};

    /* Accept either a story object or just an id. The card passes the id (it is
     * the one thing always in scope in the markup), so resolve it here against
     * the same list the card rendered from. */
    var story = trend;
    if (typeof trend === 'string') {
      story = null;
      (S.trends || []).forEach(function (t) { if (t.id === trend) story = t; });
    }
    if (!story || !story.id) return false;

    /* The card's live selections, read from the app's own per-story maps: the
     * same keys setPlat/setCT write. Never a second copy of the choice.
     *
     * `picked` matters: core.js's toggle() fills S.plat[tid] with the user's
     * primary platform the instant a card opens, purely so the rails show
     * something. That is not a decision. Only a real tap (S.hasSelected) makes
     * it one: otherwise the flow would carry Instagram while the card read
     * "Best platform: TikTok". */
    var picked = !!(S.hasSelected && S.hasSelected[story.id + '_platform']);
    var seed = (typeof window.cpCreateSeed === 'function')
      ? window.cpCreateSeed({
          id: story.id,
          headline: story.headline,
          summary: story.summary,
          niche: story.niche,
          image: story.image,
          score: story.score,
          timestamp: story.timestamp,
          source: story.source,
          platform: (S.plat && S.plat[story.id]) || null,
          format: (S.ctype && S.ctype[story.id]) || null
        }, {
          recommended: (typeof window.cpPickPlatform === 'function' && window.cpPickPlatform(story, S.user && S.user.platforms, S.user && S.user.primaryPlatform)) || null,
          platforms: (S.user && S.user.platforms) || [],
          ptypes: window.CPEnv.ptypes(),
          tone: (S.tone && S.tone[story.id]) || 'normal',
          picked: picked
        })
      : null;

    /* Degraded path: no helper, but we still carry the story itself. The user
     * lands on step 2 and picks the platform: strictly better than dropping
     * them on an empty step 1. */
    if (!seed) {
      seed = {
        source: 'story',
        sourceRef: story,
        platform: (S.hasSelected && S.hasSelected[story.id + '_platform'] ? ((S.plat && S.plat[story.id]) || null) : null),
        format: null,
        tone: 'normal',
        step: 'platform'
      };
    }

    var st = reset();
    st.source = seed.source;
    st.sourceRef = seed.sourceRef;
    st.platform = seed.platform;
    st.format = seed.format;
    st.tone = seed.tone;
    f.goto(st, seed.step);

    /* Move to the Create tab and paint. setTab() is the app's own router call -
     * using it (rather than assigning S.tab) keeps back-navigation and the
     * per-tab data loading working exactly as they do for a normal tap. */
    if (typeof window.setTab === 'function') window.setTab('create');
    else repaint();
    return true;
  };

  /* ── step 1 handlers ─────────────────────────────────────────────────── */
  window.cpCreateSetSource = function (id) {
    var st = cs();
    F().setSource(st, id);
    if (id === 'event') { window.setTab('calendar'); return; }
    if (id === 'idea') { window.openPulseAi('I have my own content idea. Help me turn it into a compelling post, and ask me what the idea is.', 'create'); return; }
    if (id === 'story') { window.setTab('home'); return; }
    // The Studio is a full-screen tool, not a step in this flow: hand straight
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

  window.cpCreateSetTemplate = function (id, autoAdvance) {
    var st = cs();
    st.template = id;
    if (autoAdvance) {
      window.cpCreateNext();
      return;
    }
    repaint();
  };
  window.cpFilterCreateTemplates = function (select) {
    var category = select && select.value || 'all';
    var search = String(document.querySelector('[aria-label="Search templates"]')?.value || '').trim().toLowerCase();
    document.querySelectorAll('[data-create-template-grid] [data-template-category]').forEach(function(card){card.hidden=(category!=='all'&&card.dataset.templateCategory!==category)||!!search&&!card.dataset.templateSearch.includes(search);});
  };
  window.cpSearchCreateTemplates = function (input) {
    var query = String(input && input.value || '').trim().toLowerCase();
    var category = document.querySelector('[aria-label="Filter templates by category"]')?.value || 'all';
    document.querySelectorAll('[data-create-template-grid] [data-template-search]').forEach(function(card){card.hidden=!!query&&!card.dataset.templateSearch.includes(query)||(category!=='all'&&card.dataset.templateCategory!==category);});
  };

  /* ── the Studio hand-off ─────────────────────────────────────────────── */
  // This is the old Create tab, intact. Nothing about the camera, prompter or
  // editor changes: it is simply reached as one source choice instead of
  // being the whole tab.
  window.cpCreateOpenStudio = function () {
    var S = S_();
    if (!S) return;
    S.studioDirect = true;
    S.studio = S.studio || {};
    S.studio.mode = 'idle';
    if (typeof window.setTab === 'function') window.setTab('create');
    else repaint();
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
        // Spec 18.4: never an indefinitely loading screen: a real message and
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
