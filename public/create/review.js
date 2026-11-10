/* CreatorPulse · Create: the result screen (spec Step 6 Refine + Step 7 Save).
 *
 * Spec 7.1 asks for "A. Content preview or working area ... B. Contextual
 * editing controls ... C. Primary actions". renderOut() in core.js already IS
 * that working area, and it already knows how to render a script differently
 * from a tweet differently from a carousel. Spec 8.1: "For an X hot-take tweet,
 * the user should not have to navigate through image framing, typography
 * presets, or card colours." Re-using renderOut() is how that stays true with
 * no duplicate renderer to keep in sync.
 */
(function () {
  'use strict';

  function E(s) {
    return window.CPEnv.esc(s);
  }
  function S_() { return window.CPEnv.state(); }
  function F() { return window.CPCreateFlow; }

  function busy(st) {
    var S = S_();
    return !!(S && S.loading && st.trendId && S.loading[st.trendId]);
  }
  function outputs(st) {
    var S = S_();
    if (!S || !st.trendId) return [];
    return (S.outs && S.outs[st.trendId]) || [];
  }

  // Status lines that rotate while the generator works. Each one fades in for
  // a couple of seconds (CSS in create.css), so the wait never looks frozen.
  var BUSY_LINES = [
    'Reading your source',
    'Writing the words',
    'Designing the layout',
    'Adding the finishing touches'
  ];

  function busyMarkup(st) {
    var fmt = String(st.format || 'content').toLowerCase();
    var lines = BUSY_LINES.map(function (text, i) {
      return '<li class="cc-busy-line" style="animation-delay:' + (i * 2.2) + 's">' + E(text) + '</li>';
    }).join('');
    return '<div class="cc-busy" role="status" aria-live="polite">' +
      '<div class="cc-busy-brand">' +
      '<img src="/logo-64.png" class="cc-busy-logo" alt=""/>' +
      '<div class="cc-busy-brand-title">Creator+</div>' +
      '</div>' +
      '<div class="cc-busy-bar-wrap" role="progressbar" aria-label="Generating content" aria-busy="true"><div class="cc-busy-bar"></div></div>' +
      '<p class="cc-busy-format">Generating ' + E(fmt) + '</p>' +
      '<ul class="cc-busy-lines">' + lines + '</ul>' +
      '</div>';
  }

  function reviewStep(st) {
    var f = F();
    var S = S_();
    var isBusy = busy(st);
    var outs = outputs(st);
    var sum = f.summarize(st, window.CPEnv.plats(), window.CPEnv.tones());

    var body;
    if (st.error) {
      // Spec 18.4: "Do not leave users staring at an indefinitely loading
      // screen. Where appropriate, offer a retry action."
      body = '<div class="cc-fail"><p class="cc-fail-t">' + E(st.error) + '</p>' +
        '<button class="btn bo bxs" type="button" onclick="cpCreateGenerate()">Try again</button></div>';
    } else if (isBusy) {
      body = busyMarkup(st);
    } else if (!outs.length) {
      body = '<div class="cc-empty"><p>Nothing generated yet.</p>' +
        '<button class="btn bp bxs" type="button" onclick="cpCreateGenerate()">Generate</button></div>';
    } else {
      body = outs.map(function (o, i) {
        // renderOut() is the app's own renderer: script reader, text reader,
        // carousel mockup, card editor and all. One call, no second copy.
        try {
          if (typeof renderOut === 'function') return '<div class="cc-out">' + renderOut(o, st.trendId, i) + '</div>';
          return '<div class="cc-out"><div class="cp-text-reader">' + E(o.content || '') + '</div></div>';
        } catch (e) {
          // One bad output can never blank the screen.
          return '<div class="cc-out"><div class="cc-fail"><p class="cc-fail-t">That result could not be shown. The text is below.</p>' +
            '<pre class="cc-pre">' + E(o && o.content ? o.content : '') + '</pre></div></div>';
        }
      }).join('');
    }

    var stale = (typeof window.CPCreateGenerate !== 'undefined') && window.CPCreateGenerate.isStale(st);
    var staleNote = stale
      ? '<div class="cc-stale">You changed the setup after generating. ' +
        '<button class="cc-stale-b" type="button" onclick="cpCreateGenerate()">Regenerate</button></div>'
      : '';

    // After generating, the template is still a live choice: the user can see
    // the design they got and switch to another one without restarting the
    // flow. This is the "preview and select templates after generating" half of
    // the requirement; the template step covers the "before" half.
    // Template selection belongs to the Template step. The result screen is
    // for reviewing, editing and exporting the finished output — not a second
    // copy of the same picker.
    var templateBlock = '';

    // Spec 7.4: make the most relevant action prominent: after generating,
    // that is saving, not generating again.
    var actions = outs.length ? primaryActions(st, outs) : '';

    return '<div class="cc-bar"><div class="cc-bar-l">' +
      '<div class="cc-bar-title">Your ' + E(sum.format || 'content') + '</div>' +
      '<div class="cc-bar-sub">' + E(sum.platform || '') + '</div></div>' +
      '<button class="btn bo bxs" type="button" onclick="cpCreateRestart()">New</button></div>' +
      '<div class="cc-body">' +
      '<div class="cc-rails cc-rails-tight">' +
      stepRail('Source', sum.source, 'source') +
      stepRail('Platform', sum.platform, 'platform') +
      stepRail('Format', sum.format, 'format') +
      stepRail('Tone', sum.tone, 'tone') +
      '</div>' +
      staleNote +
      templateBlock +
      body +
      actions +
      '</div>';
  }

  /* The template picker on the result screen. It renders the SAME live
   * miniature the template step uses, so what the user sees here is exactly
   * what the export will draw. Choosing one regenerates in place. */
  function templateSwitcher(st) {
    var Steps = window.CPCreateSteps;
    var T = window.CPCardTemplates;
    if (!Steps || !T || !Steps.templateThumb) return '';
    var isImage = (st.platform === 'instagram' && /IG (Single Post|Carousel)/.test(st.format || '')) ||
      (st.platform === 'tiktok' && /graphic|camera/i.test(st.format || ''));
    if (!isImage) return '';
    var list = T.list(st.platform);
    if (!list.length) return '';
    var current = st.template || (list[0] && list[0].id);
    var tiles = list.map(function (t) {
      var on = t.id === current;
      return '<button class="cc-template-card ' + (on ? 'on' : '') + '" type="button" ' +
        'onclick="cpCreateSetTemplate(\'' + t.id + '\', true)" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        Steps.templateThumb(t, st.platform) +
        '<div class="cc-template-meta"><span class="cc-template-title">' + E(t.name) + '</span></div>' +
        '<span class="cc-template-badge">' + (on ? '\u2713 In use' : 'Switch') + '</span></button>';
    }).join('');
    return '<div class="cc-tpl-switch">' +
      '<div class="cc-tpl-switch-hd"><span>Template</span>' +
      '<span class="cc-tpl-switch-note">Tap one to regenerate in that style</span></div>' +
      '<div class="cc-templates-grid">' + tiles + '</div></div>';
  }

  function stepRail(label, value, step) {
    return '<div class="cc-rail"><span class="cc-rail-l">' + E(label) + '</span>' +
      '<span class="cc-rail-v">' + E(value || '-') + '</span>' +
      '<button class="cc-rail-c" type="button" onclick="cpCreateGo(\'' + step + '\')">Change</button></div>';
  }

  /* Step 7: "The user can save the result, generate another version, or
   * continue to another supported workflow." Save and Studio are the app's own
   * saveOut() / studioShootScript(), so a script saved here behaves exactly
   * like one saved from Home. */
  function primaryActions(st, outs) {
    var tid = JSON.stringify(st.trendId);
    // Studio is the teleprompter, so it only makes sense for a spoken script.
    var isScript = /script/i.test(String(st.format || '')) && !!(outs[0] && outs[0].content);
    var studioBtn = isScript
      ? '<button class="btn bo cc-a" type="button" onclick="studioShootScript(' + tid + ',0)">Studio</button>'
      : '';
    return '<div class="cc-actions">' +
      '<button class="btn bp cc-a-main" type="button" onclick="saveOut(' + tid + ',0)">Save</button>' +
      '<button class="btn bo cc-a" type="button" onclick="cpCreateGenerate()">Regenerate</button>' +
      studioBtn +
      '</div>';
  }

  window.CPCreateReview = {
    reviewStep: reviewStep
  };
})();
