/* CreatorPulse · Create — step markup.
 *
 * Renders the four "choose" screens from spec PART 6.2. Deliberately contains
 * no business rules: what counts as a valid choice lives in flow.js, and what
 * generation does lives in generate.js.
 *
 * PLATS / PTYPES / TONES / esc are the app's existing globals from core.js —
 * read, never redefined, so there is one source of truth for what exists.
 */
(function () {
  'use strict';

  function E(s) {
    return window.CPEnv.esc(s);
  }
  function F() { return window.CPCreateFlow; }

  function bar(title, sub) {
    return '<div class="cc-bar">' +
      '<div class="cc-bar-l"><div class="cc-bar-title">' + E(title) + '</div>' +
      (sub ? '<div class="cc-bar-sub">' + E(sub) + '</div>' : '') + '</div>' +
      '</div>';
  }

  /* Progress rail. Spec 6.2: "This flow should feel connected, not like a
   * sequence of unrelated settings panels." A visible position in the flow is
   * what makes it read as one journey instead of five cards. */
  function progress(st) {
    var f = F();
    return '<div class="cc-progress" role="list" aria-label="Create progress">' +
      f.STEPS.map(function (s, i) {
        var cur = i === f.STEPS.indexOf(st.step);
        var done = i < f.STEPS.indexOf(st.step);
        return '<div class="cc-dot ' + (cur ? 'on' : '') + ' ' + (done ? 'done' : '') + '" role="listitem">' +
          '<span class="cc-dot-i">' + (done ? '✓' : String(i + 1)) + '</span>' +
          '<span class="cc-dot-l">' + E(f.STEP_LABELS[s]) + '</span></div>';
      }).join('') + '</div>';
  }

  function foot(st, opts) {
    var f = F();
    var back = f.STEPS.indexOf(st.step) > 0
      ? '<button class="btn bo cc-back" type="button" onclick="cpCreateBack()">Back</button>'
      : '';
    var go = opts && opts.noNext ? '' :
      '<button class="btn bp cc-next" type="button" ' + (opts && opts.canNext ? '' : 'disabled') +
      ' onclick="cpCreateNext()">' + E((opts && opts.nextLabel) || 'Continue') + '</button>';
    return '<div class="cc-foot">' + back + go + '</div>';
  }

  /* ── Step 1 · Source ───────────────────────────────────────────────────── */
  function sourceStep(st) {
    var f = F();
    var savedDrafts = ((window.CPEnv.state() || {}).saved || []);
    var sources = f.SOURCES.filter(function (x) { return x.id !== 'draft' || savedDrafts.length; });
    var cards = sources.map(function (item) {
      var meta = {
        story: ['✦','story','Discover news','Turn a live story into a post.'],
        event: ['◷','event','Upcoming event','Plan content around what’s next.'],
        idea: ['✳','idea','My own idea','Shape a fresh idea with Plus AI.'],
        draft: ['▤','draft','Existing draft',savedDrafts.length + (savedDrafts.length === 1 ? ' saved draft' : ' saved drafts')],
        studio: ['▶','studio','Record or upload','Make a video in Studio.']
      }[item.id];
      return '<button class="cc-choice cc-choice-card cc-choice-' + meta[1] + '" type="button" onclick="cpCreateSetSource(\'' + item.id + '\')" aria-label="' + E(meta[2]) + '">' +
        '<span class="cc-choice-art" aria-hidden="true"><span>' + meta[0] + '</span><i></i><i></i><i></i></span>' +
        '<span class="cc-choice-main"><span class="cc-choice-t">' + E(meta[2]) + '</span><span class="cc-choice-h">' + E(meta[3]) + '</span></span><span class="cc-choice-a" aria-hidden="true">↗</span></button>';
    }).join('');
    return bar('Create', 'Step 1 of 5') + '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">What are you creating from?</h1><p class="cc-lede">Choose a route and jump straight into the right workspace.</p>' +
      '<div class="cc-choices">' + cards + '</div>' +
      (st.source === 'draft' && savedDrafts.length ? draftPicker(st) : '') + (st.source === 'story' ? storyPicker(st) : '') +
      foot(st, { canNext: f.canAdvance(st, window.CPEnv.ptypes()) }) + '</div>';
  }

  function emptyNote(text, cta) {
    return '<div class="cc-empty">' +
      '<p>' + E(text) + '</p>' +
      (cta ? '<button class="btn bo bxs" type="button" onclick="setTab(\'home\')">' + E(cta) + '</button>' : '') +
      '</div>';
  }

  function storyPicker(st) {
    var list = (window.CPEnv.state() && window.CPEnv.state().trends) || [];
    if (!list.length) return emptyNote('No stories loaded yet. Open Home once so live stories can load, then come back.', 'Go to Home');
    var rows = list.slice(0, 8).map(function (t) {
      var on = st.sourceRef && st.sourceRef.id === t.id;
      return '<button class="cc-item ' + (on ? 'on' : '') + '" type="button" onclick="cpCreatePickStory(\'' + t.id + '\')">' +
        '<span class="cc-item-t">' + E(t.headline) + '</span>' +
        '<span class="cc-item-m">' + E(t.niche || '') + '</span></button>';
    }).join('');
    return '<div class="cc-picker"><div class="cc-picker-hd">Choose a story</div>' + rows + '</div>';
  }

  function eventPicker(st) {
    var evs = [];
    var ST = window.CPEnv.state() || {};
    var niches = (ST.user && ST.user.niches) || [];
    niches.forEach(function (n) {
      var arr = (ST.eventsCache && ST.eventsCache[n]) || [];
      arr.forEach(function (e) { evs.push(e); });
    });
    if (!evs.length) return emptyNote('No upcoming events loaded yet. Open Calendar once so your events can load, then come back.', 'Go to Home');
    var rows = evs.slice(0, 8).map(function (e, i) {
      var on = st.sourceRef && st.sourceRef.title === e.title;
      return '<button class="cc-item ' + (on ? 'on' : '') + '" type="button" onclick="cpCreatePickEvent(' + i + ')">' +
        '<span class="cc-item-t">' + E(e.title) + '</span>' +
        '<span class="cc-item-m">' + E(e.date || '') + '</span></button>';
    }).join('');
    return '<div class="cc-picker"><div class="cc-picker-hd">Choose an event</div>' + rows + '</div>';
  }

  function draftPicker(st) {
    var saved = (window.CPEnv.state() && window.CPEnv.state().saved) || [];
    if (!saved.length) return emptyNote('No saved drafts yet. Anything you save shows up here.', 'Go to Home');
    var rows = saved.slice(0, 8).map(function (d) {
      var on = st.sourceRef && st.sourceRef.id === d.id;
      return '<button class="cc-item ' + (on ? 'on' : '') + '" type="button" onclick="cpCreatePickDraft(\'' + d.id + '\')">' +
        '<span class="cc-item-t">' + E(d.headline || 'Untitled') + '</span>' +
        '<span class="cc-item-m">' + E(d.content_type || '') + '</span></button>';
    }).join('');
    return '<div class="cc-picker"><div class="cc-picker-hd">Choose a draft</div>' + rows + '</div>';
  }

  function ideaField(st) {
    // Spec 6.2 Step 1: "A creator's own idea." One field, no extra ceremony.
    return '<div class="cc-picker"><label class="cc-picker-hd" for="cc-idea">Your idea</label>' +
      '<textarea id="cc-idea" class="cc-textarea" placeholder="e.g. Why most creators quit at 3 months" ' +
      'oninput="cpCreateSetIdea(this.value)">' + E(st.idea) + '</textarea></div>';
  }

  function studioNote() {
    return '<div class="cc-picker"><div class="cc-picker-hd">Video Studio</div>' +
      '<p class="cc-note">The Studio opens with your camera, prompter and editor — the existing tools, unchanged.</p>' +
      '<button class="btn bp bxs" type="button" onclick="cpCreateOpenStudio()">Open the Studio</button></div>';
  }

  /* ── Step 2 · Platform ─────────────────────────────────────────────────── */
  function platformStep(st) {
    var f = F();
    // Spec 6.2: "Do not display unnecessarily large platform cards if smaller
    // controls can communicate the same information." Compact chips here.
    var chips = window.CPEnv.plats().map(function (p) {
      var on = st.platform === p.id;
      return '<button class="cc-chip ' + (on ? 'on' : '') + '" type="button" ' +
        'onclick="cpCreateSetPlatform(\'' + p.id + '\')" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="cc-chip-e" aria-hidden="true">' + E(window.CPEnv.platEmoji()[p.id] || '◆') + '</span>' +
        '<span class="cc-chip-t">' + E(p.label) + '</span></button>';
    }).join('');

    return bar('Create', 'Step 2 of 5') +
      '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">Where is this going?</h1>' +
      '<p class="cc-lede">The formats offered next depend on this choice.</p>' +
      '<div class="cc-chips">' + chips + '</div>' +
      foot(st, { canNext: f.canAdvance(st, window.CPEnv.ptypes()) }) +
      '</div>';
  }

  /* ── Step 3 · Format ───────────────────────────────────────────────────── */
  function formatStep(st) {
    var f = F();
    var list = f.formatsFor(st.platform, window.CPEnv.ptypes());
    // Spec 7.3: "Ensure users can understand every option without having to
    // guess what a truncated label means." Full-width labelled rows, no
    // horizontal scroll, nothing cut off.
    var rows = list.map(function (c) {
      var on = st.format === c;
      return '<button class="cc-choice ' + (on ? 'on' : '') + '" type="button" onclick="cpCreateSetFormat(' + JSON.stringify(c).replace(/"/g, '&quot;') + ')">' +
        '<span class="cc-choice-main"><span class="cc-choice-t">' + E(c) + '</span>' +
        '<span class="cc-choice-h">' + E(formatHint(c)) + '</span></span>' +
        '<span class="cc-choice-a" aria-hidden="true">' + (on ? '✓' : '→') + '</span></button>';
    }).join('');

    return bar('Create', 'Step 3 of 5') +
      '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">Which format?</h1>' +
      '<p class="cc-lede">' + E(platformLabel(st.platform)) + ' · ' + list.length + ' formats.</p>' +
      '<div class="cc-choices">' + (rows || emptyNote('Pick a platform first.')) + '</div>' +
      foot(st, { canNext: f.canAdvance(st, window.CPEnv.ptypes()) }) +
      '</div>';
  }

  function platformLabel(id) {
    var hit = null;
    window.CPEnv.plats().forEach(function (p) { if (p.id === id) hit = p.label; });
    return hit || 'Platform';
  }

  // One plain sentence per format so the choice is obvious without guessing.
  function formatHint(c) {
    var s = String(c || '');
    if (/thumbnail/i.test(s)) return 'A concept and on-image text for a video thumbnail.';
    if (/title/i.test(s)) return 'Titles, description and chapter timestamps.';
    if (/thread/i.test(s)) return 'A connected multi-post thread.';
    if (/carousel/i.test(s)) return 'A multi-slide visual post.';
    if (/silent/i.test(s)) return 'A silent on-screen-caption video concept.';
    if (/no-face/i.test(s)) return 'A graphic-led post that needs no face on camera.';
    if (/caption/i.test(s)) return 'A caption with hashtags, ready to paste.';
    if (/long form/i.test(s)) return 'A longer, sectioned script you can read and edit.';
    if (/short/i.test(s)) return 'A tight short-video script.';
    if (/script|reel/i.test(s)) return 'A spoken script you can read on camera.';
    if (/hot take/i.test(s)) return 'A short opinionated post built to spark replies.';
    if (/engagement/i.test(s)) return 'A question post built to drive comments.';
    if (/post|update/i.test(s)) return 'A written post for this platform.';
    return 'Ready-to-post text for this platform.';
  }

  /* ── Step 4 · Tone ─────────────────────────────────────────────────────── */
  function toneStep(st) {
    var f = F();
    var chips = window.CPEnv.tones().map(function (t) {
      var on = st.tone === t.id;
      return '<button class="cc-chip ' + (on ? 'on' : '') + '" type="button" ' +
        'onclick="cpCreateSetTone(\'' + t.id + '\')" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="cc-chip-t">' + E(t.label) + '</span></button>';
    }).join('');
    var sum = f.summarize(st, window.CPEnv.plats(), window.CPEnv.tones());
    // Spec 7.2's compact "value — Change" rows, read-only here so the user can
    // confirm the whole setup on one line before spending a generation.
    var rails =
      '<div class="cc-rails">' +
      rail('Platform', sum.platform, 'cpCreateGo(\'platform\')') +
      rail('Format', sum.format, 'cpCreateGo(\'format\')') +
      '</div>';

    return bar('Create', 'Step 4 of 5') +
      '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">Tone</h1>' +
      '<p class="cc-lede">Optional — a sensible default is already chosen.</p>' +
      '<div class="cc-chips">' + chips + '</div>' +
      rails +
      foot(st, { canNext: true, nextLabel: 'Generate' }) +
      '</div>';
  }

  function rail(label, value, onclick) {
    return '<div class="cc-rail"><span class="cc-rail-l">' + E(label) + '</span>' +
      '<span class="cc-rail-v">' + E(value || '—') + '</span>' +
      '<button class="cc-rail-c" type="button" onclick="' + onclick + '">Change</button></div>';
  }

  window.CPCreateSteps = {
    sourceStep: sourceStep,
    platformStep: platformStep,
    formatStep: formatStep,
    toneStep: toneStep,
    rail: rail,
    formatHint: formatHint
  };
})();
