/* CreatorPulse · Create flow: pure step logic.
 *
 * Spec PART 6.2 asks for a guided workflow: "Step 1: Choose the content source
 * ... Step 2: Choose the platform ... Step 3: Choose the format ... Step 4:
 * Configure optional preferences ... Step 5: Generate ... Step 6: Refine
 * ... Step 7: Save or continue".
 *
 * This file is that workflow as data + pure functions. It touches no DOM and
 * makes no network calls, which is what lets the tests exercise the real rules
 * in Node instead of asserting against a copy of the markup.
 *
 * Loaded as a classic script, so it also exposes window.CPCreateFlow.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCreateFlow = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* The five screens of the flow. "Refine" and "Save" from the brief both
   * live inside the last screen, because after generating there is exactly one
   * thing to look at: the output: with its actions attached. */
  var STEPS = ['source', 'platform', 'format', 'tone', 'review'];

  var STEP_LABELS = {
    source: 'Source',
    platform: 'Platform',
    format: 'Format',
    tone: 'Tone',
    review: 'Result'
  };

  /* Spec 6.2 Step 1: "The source may be: A discovered story. An upcoming
   * event. A creator's own idea. An existing draft. Another supported source."
   *
   * The video recorder/uploader is kept as a source rather than as the whole
   * tab (which is what it was before) so nothing is lost: spec 6.1 says "Do
   * not design the entire Create experience around graphic generation alone",
   * and the same logic applies to video. */
  var SOURCES = [
    { id: 'story',  label: 'A discovered story', hint: 'Pick one of the live stories already found for you.' },
    { id: 'event',  label: 'An upcoming event',  hint: 'Turn a date on your calendar into content before it happens.' },
    { id: 'idea',   label: 'My own idea',        hint: 'Type the idea. Content is built around it.' },
    { id: 'draft',  label: 'An existing draft',  hint: 'Start from something you already saved.' },
    { id: 'studio', label: 'Record or upload a video', hint: 'Opens the video Studio with your camera and editor.' }
  ];

  function defaultState() {
    return {
      step: 'source',
      source: null,      // one of SOURCES[].id
      sourceRef: null,   // the picked story / event / draft, or null
      idea: '',          // free text when source === 'idea'
      platform: null,
      format: null,
      tone: 'normal',
      trendId: null,     // the S.trends id the output is keyed by
      needsRegen: false, // set when a change invalidated existing output
      error: ''
    };
  }

  function sourceById(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return SOURCES[i];
    return null;
  }

  /* Spec 6.2 Step 3: "Show only the formats relevant to the selected platform."
   * ptypes is the app's existing PTYPES table: passed in, never redefined here,
   * so there is exactly one place that decides what formats exist. */
  function formatsFor(platform, ptypes) {
    if (!platform || !ptypes) return [];
    var list = ptypes[platform];
    return Array.isArray(list) ? list.slice() : [];
  }

  function canAdvance(st, ptypes) {
    if (!st) return false;
    switch (st.step) {
      case 'source':
        // The Studio path leaves the flow entirely, so it never needs to pass
        // this check: it is intercepted by the caller.
        return !!st.source;
      case 'platform':
        return !!st.platform;
      case 'format':
        // Both conditions matter: a format must be chosen AND it must belong to
        // the chosen platform. Without the second check, a stale format left
        // over from a previous platform could be carried into generation.
        return !!st.format && formatsFor(st.platform, ptypes).indexOf(st.format) >= 0;
      case 'tone':
        // Spec 6.2 Step 4: "Avoid forcing users to configure every available
        // preference before they can generate content. Provide sensible
        // defaults." Tone always has a default, so this is always passable.
        return true;
      default:
        return false;
    }
  }

  function next(st, ptypes) {
    if (!canAdvance(st, ptypes)) return st;
    var i = STEPS.indexOf(st.step);
    if (i < 0 || i >= STEPS.length - 1) return st;
    st.step = STEPS[i + 1];
    return st;
  }

  function prev(st) {
    var i = STEPS.indexOf(st.step);
    if (i <= 0) return st;
    st.step = STEPS[i - 1];
    return st;
  }

  function goto(st, step) {
    if (STEPS.indexOf(step) >= 0) st.step = step;
    return st;
  }

  function setSource(st, id) {
    st.source = id;
    st.sourceRef = null;   // picking a different kind of source drops the old pick
    if (id !== 'idea') st.idea = '';
    return st;
  }

  function setSourceRef(st, ref) {
    st.sourceRef = ref || null;
    return st;
  }

  function setIdea(st, text) {
    st.idea = String(text == null ? '' : text);
    return st;
  }

  /* Spec 8.5: "When a user changes platforms or formats, update the relevant
   * options appropriately. However, avoid silently destroying existing work."
   * So: keep the chosen format if the new platform still offers it; otherwise
   * fall back to that platform's first format: and flag that the existing
   * output no longer matches, rather than pretending it does. */
  function setPlatform(st, platform, ptypes) {
    st.platform = platform;
    var list = formatsFor(platform, ptypes);
    if (list.indexOf(st.format) < 0) {
      var hadOutput = !!st.format;
      st.format = list.length ? list[0] : null;
      if (hadOutput) st.needsRegen = true;
    }
    return st;
  }

  function setFormat(st, format) {
    if (st.format && st.format !== format) st.needsRegen = true;
    st.format = format;
    return st;
  }

  function setTone(st, tone) {
    st.tone = tone;
    return st;
  }

  /* Spec 7.2: "a compact row could show: Platform: TikTok: Change".
   * summarize() produces the value half of those rows. */
  function summarize(st, plats, toneList) {
    var out = { source: '', platform: '', format: '', tone: '' };
    if (st.source === 'story' && st.sourceRef) out.source = st.sourceRef.headline || 'Story';
    else if (st.source === 'event' && st.sourceRef) out.source = st.sourceRef.title || 'Event';
    else if (st.source === 'draft' && st.sourceRef) out.source = st.sourceRef.headline || 'Draft';
    else if (st.source === 'idea') out.source = (st.idea || '').slice(0, 40) || 'Your idea';
    else {
      var s = sourceById(st.source);
      out.source = s ? s.label : '';
    }
    (plats || []).forEach(function (p) {
      if (p.id === st.platform) out.platform = p.label;
    });
    out.format = st.format || '';
    (toneList || []).forEach(function (t) {
      if (t.id === st.tone) out.tone = t.label;
    });
    return out;
  }

  /* A stable id for the synthesized story object the existing generation
   * pipeline needs. Kept deterministic per source so regenerating the same
   * idea reuses its slot instead of leaking a new entry into S.trends. */
  function trendIdFor(st) {
    if (st.source === 'story' || st.source === 'event') {
      return (st.sourceRef && st.sourceRef.id) || null;
    }
    if (st.source === 'draft') {
      return 'draft_' + ((st.sourceRef && st.sourceRef.id) || 'x');
    }
    if (st.source === 'idea') {
      var n = 0;
      var s = String(st.idea || '');
      for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 2147483647;
      return 'idea_' + n.toString(36);
    }
    return null;
  }

  return {
    STEPS: STEPS,
    STEP_LABELS: STEP_LABELS,
    SOURCES: SOURCES,
    defaultState: defaultState,
    sourceById: sourceById,
    formatsFor: formatsFor,
    canAdvance: canAdvance,
    next: next,
    prev: prev,
    goto: goto,
    setSource: setSource,
    setSourceRef: setSourceRef,
    setIdea: setIdea,
    setPlatform: setPlatform,
    setFormat: setFormat,
    setTone: setTone,
    summarize: summarize,
    trendIdFor: trendIdFor
  };
});
