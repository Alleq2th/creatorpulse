/* CreatorPulse · Create: step markup.
 *
 * Renders the four "choose" screens from spec PART 6.2. Deliberately contains
 * no business rules: what counts as a valid choice lives in flow.js, and what
 * generation does lives in generate.js.
 *
 * PLATS / PTYPES / TONES / esc are the app's existing globals from core.js -
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
    var isImage = (st.platform === 'instagram' && /IG (Single Post|Carousel)/.test(st.format || '')) || (st.platform === 'tiktok' && /graphic|camera/i.test(st.format || ''));
    var stepIcons = {
      source: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M8 7h8M8 11h6"/></svg>',
      platform: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
      format: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
      tone: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      review: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>'
    };

    return '<div class="cc-progress" role="list" aria-label="Create progress">' +
      f.STEPS.map(function (s, i) {
        var cur = i === f.STEPS.indexOf(st.step);
        var done = i < f.STEPS.indexOf(st.step);
        var label = (s === 'tone' && isImage) ? 'Template' : f.STEP_LABELS[s];
        var iconHtml = done ? '<span class="cc-dot-check">✓</span>' : (stepIcons[s] || String(i + 1));
        return '<div class="cc-dot ' + (cur ? 'on' : '') + ' ' + (done ? 'done' : '') + '" role="listitem">' +
          '<span class="cc-dot-i">' + iconHtml + '</span>' +
          '<span class="cc-dot-l">' + E(label) + '</span></div>';
      }).join('') + '</div>';
  }

  function foot(st, opts) {
    var f = F();
    var back = f.STEPS.indexOf(st.step) > 0
      ? '<button class="btn bo cc-back" type="button" onclick="cpCreateBack()">Back</button>'
      : '';
    // The action is NEVER rendered disabled. A disabled button swallows the tap
    // silently, which is exactly what made Create feel like it needed two taps:
    // the first tap hit a dead button, the user tapped again, and by then a
    // repaint had landed. It is always tappable now; when the step is not ready
    // yet, cpCreateNext() explains what is missing instead of doing nothing.
    var ready = !!(opts && opts.canNext);
    var go = opts && opts.noNext ? '' :
      '<button class="btn bp cc-next' + (ready ? '' : ' cc-next-wait') + '" type="button" ' +
      'aria-disabled="' + (ready ? 'false' : 'true') + '" ' +
      'onclick="cpCreateNext()">' + E((opts && opts.nextLabel) || 'Continue') + '</button>';
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
      '<p class="cc-note">The Studio opens with your camera, prompter and editor with the existing tools ready.</p>' +
      '<button class="btn bp bxs" type="button" onclick="cpCreateOpenStudio()">Open the Studio</button></div>';
  }

  /* ── Step 2 · Platform ─────────────────────────────────────────────────── */
  function platformStep(st) {
    var f = F();
    var logos = (window.CPEnv && window.CPEnv.platLogo) ? window.CPEnv.platLogo() : {};
    var cards = window.CPEnv.plats().map(function (p) {
      var on = st.platform === p.id;
      var logoSvg = logos[p.id] || ('<span class="cc-plat-fb">' + E(window.CPEnv.platEmoji()[p.id] || '◆') + '</span>');
      return '<button class="cc-plat-card ' + (on ? 'on' : '') + '" type="button" ' +
        'onclick="cpCreateSetPlatform(\'' + p.id + '\')" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<div class="cc-plat-icon">' + logoSvg + '</div>' +
        '<span class="cc-plat-title">' + E(p.label) + '</span>' +
        '<span class="cc-plat-pill">' + (on ? 'Selected' : 'Select') + '</span>' +
        '</button>';
    }).join('');

    return bar('Create', 'Step 2 of 5') +
      '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">Where is this going?</h1>' +
      '<p class="cc-lede">Slide sideways and tap the app you are creating for.</p>' +
      '<div class="cc-plat-rail" role="region" aria-label="Platform selection">' + cards + '</div>' +
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
  var TEMPLATES_IG = [
    { id: 'impact', label: 'Bold Impact', sub: 'High contrast text with hero focal point', preview: 'background:#18181b;color:#f43f5e;font-weight:900;' },
    { id: 'editorial', label: 'Editorial Clean', sub: 'Refined serif typography with generous spacing', preview: 'background:#09090b;color:#fafafa;font-family:serif;' },
    { id: 'stat_split', label: 'Data & Stat Split', sub: 'Accent highlight for key numbers and facts', preview: 'background:#1c1917;color:#38bdf8;font-weight:800;' },
    { id: 'dark_gradient', label: 'Dark Ambient Glow', sub: 'Soft radial backdrop with glowing accents', preview: 'background:radial-gradient(circle,#312e81,#09090b);color:#e0e7ff;' },
    { id: 'neon_noir', label: 'Neon Cyber', sub: 'Electric lime & cyan punchy layout', preview: 'background:#022c22;color:#4ade80;font-weight:800;' },
    { id: 'white_panel', label: 'White Panel', sub: 'Photo on top, clean white text panel below', preview: 'background:#fbfaf7;color:#1a1a1a;font-family:serif;' },
    { id: 'white_panel_inset', label: 'White Panel Inset', sub: 'Rounded white card overlapping the photo', preview: 'background:#fbfaf7;color:#1a1a1a;font-family:serif;' },
    { id: 'full_bleed_quote', label: 'Full-Bleed Quote', sub: 'Full photo, oversized quote typography and slide counter', preview: 'background:#171717;color:#f6f6f6;font-weight:900;' }
  ];

  var TEMPLATES_TT = [
    { id: 'viral_hook', label: '9:16 Viral Hook', sub: 'Centrally anchored headline above creator safe zones', preview: 'background:#000;color:#22d3ee;font-weight:900;' },
    { id: 'silent_camera', label: 'Silent Camera', sub: 'Clean top overlay tuned for silent phone scrolling', preview: 'background:#18181b;color:#fff;border-top:3px solid #f43f5e;' },
    { id: 'quote_punch', label: 'Bold Statement', sub: 'Tight contrast for quotes and breaking news', preview: 'background:#111;color:#fbbf24;font-weight:800;' },
    { id: 'minimal_noir', label: 'Dark Minimalist', sub: 'Clean distraction-free dark typography', preview: 'background:#050505;color:#e4e4e7;' },
    { id: 'high_retention', label: 'High-Retention Alert', sub: 'Attention-grabbing badge and stacked punchlines', preview: 'background:#1e1b4b;color:#a855f7;font-weight:800;' }
  ];

  // A template tile is a miniature of the real template, not a flat colour with
  // a label. It is built from the same shared layout the card and the export
  // use (public/lib/cardLayout.js), so the colours, the font, the badge and the
  // text placement are the template's own. Falls back to the flat preview only
  // if that module is unavailable.
  function templateThumb(tmpl, platform) {
    var L = window.CPCardLayout;
    if (!L) return '<div class="cc-template-thumb" style="' + tmpl.preview + '"><span>' + E(tmpl.label) + '</span></div>';
    var sample = {
      type: 'hook',
      headline: tmpl.label,
      supportingText: tmpl.sub,
      ctaLine: 'FOLLOW FOR MORE',
      slideNumber: 1, totalSlides: 1
    };
    var design = L.resolve({ templateId: tmpl.id, platform: platform, slide: sample, index: 0, total: 1, style: {} });
    if (!design) return '<div class="cc-template-thumb" style="' + tmpl.preview + '"><span>' + E(tmpl.label) + '</span></div>';
    // A treatment with no scrim (split panel, inset frame, blurred backdrop)
    // returns scrim:null. Reading .stops off it threw and blanked the whole
    // template gallery, so the scrim is optional here.
    var scrim = (design.scrim && design.scrim.stops && design.scrim.stops.length)
      ? design.scrim.stops.map(function (s) { return s.color + ' ' + Math.round(s.offset * 100) + '%'; }).join(',')
      : '';
    var layers = design.layers.filter(function (l) { return !l.empty; }).map(function (l) {
      return '<span class="cc-template-layer" style="left:' + (l.box.x * 100).toFixed(1) + '%;top:' + (l.box.y * 100).toFixed(1) + '%;width:' + (l.box.width * 100).toFixed(1) + '%;height:' + (l.box.height * 100).toFixed(1) + '%;' + L.layerCss(l) + '">' + E(l.displayText) + '</span>';
    }).join('');
    var deco = design.decoration;
    var W = design.canvas.width, H = design.canvas.height;
    var px = function (v, total) { return (v / total * 100).toFixed(2) + '%'; };
    var decoHtml = '';
    if (deco.type === 'badge') {
      decoHtml = '<span class="cc-template-badge-pill" style="left:' + px(deco.x, W) + ';top:' + px(deco.y, H) + ';width:' + px(deco.width, W) + ';height:' + px(deco.height, H) + ';background:' + deco.bg + ';color:' + design.palette.bg + '">' + E(deco.text) + '</span>';
    } else if (deco.type === 'corner') {
      decoHtml = '<span class="cc-template-rule" style="left:0;top:0;width:100%;height:' + px(deco.height, H) + ';background:' + deco.bg + '"></span>';
    } else if (deco.type === 'rule' || deco.type === 'hairline') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.x, W) + ';top:' + px(deco.y, H) + ';width:' + px(deco.width, W) + ';height:' + px(deco.height, H) + ';background:' + deco.bg + '"></span>';
    } else if (deco.type === 'frame') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.x, W) + ';top:' + px(deco.y, H) + ';width:' + px(deco.width, W) + ';height:' + px(deco.height, H) + ';border:1px solid ' + deco.stroke + ';border-radius:8px"></span>';
    } else if (deco.type === 'orb') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.cx - deco.r, W) + ';top:' + px(deco.cy - deco.r, H) + ';width:' + px(deco.r * 2, W) + ';height:' + px(deco.r * 2, W) + ';border-radius:50%;background:radial-gradient(circle,' + deco.bg + '55,transparent 70%)"></span>';
    } else if (deco.type === 'stripes') {
      decoHtml = '<span class="cc-template-rule" style="left:0;top:' + px(deco.y, H) + ';width:100%;height:' + px(deco.height, H) + ';opacity:.42;background:repeating-linear-gradient(0deg,' + deco.bg + ' 0 1px,transparent 1px 6px)"></span>';
    } else if (deco.type === 'split') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.x, W) + ';top:0;width:' + px(deco.width, W) + ';height:100%;background:' + deco.bg + ';opacity:.28"></span>';
    } else if (deco.type === 'caption') {
      decoHtml = '<span class="cc-template-rule" style="left:0;top:' + px(deco.y, H) + ';width:100%;height:' + px(deco.height, H) + ';background:' + deco.bg + '"></span>';
    } else if (deco.type === 'quote') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.x, W) + ';top:' + px(deco.y, H) + ';color:' + deco.bg + ';font:900 ' + (deco.size / W * 100).toFixed(2) + 'cqw/0.8 Georgia,serif;opacity:.9">\u201C</span>';
    } else if (deco.type === 'stat') {
      decoHtml = '<span class="cc-template-rule" style="left:' + px(deco.x, W) + ';top:' + px(deco.y, H) + ';width:' + px(deco.width, W) + ';height:' + px(deco.height, H) + ';color:' + deco.bg + ';font:900 ' + (deco.size / W * 100).toFixed(2) + 'cqw/0.9 Inter,sans-serif;letter-spacing:-.02em;display:flex;align-items:center;white-space:nowrap;overflow:hidden">' + E(deco.text) + '</span>';
    }
    return '<div class="cc-template-thumb cc-template-thumb-live" data-aspect="' + (design.platform === 'tiktok' ? 'tiktok' : 'ig') + '" style="background:' + design.palette.bg + '">' +
      (scrim ? '<span class="cc-template-scrim" style="background:linear-gradient(180deg,' + scrim + ')"></span>' : '') +
      decoHtml + layers +
    '</div>';
  }

  /* The 1-10 slide/post count selector and the large template preview live in
   * templateUi.js (their own small file) — rendering them here would push this
   * file past its size contract. */
  function slideCountSelector(st, isMulti, noun) {
    var Ui = window.CPCreateTemplateUi;
    return Ui && Ui.slideCountSelector ? Ui.slideCountSelector(st, isMulti, noun) : '';
  }
  function templatePreview(st, tmpls) {
    var Ui = window.CPCreateTemplateUi;
    return Ui && Ui.templatePreview ? Ui.templatePreview(st, tmpls) : '';
  }

  function toneStep(st) {
    var f = F();
    var isImage = (st.platform === 'instagram' && /IG (Single Post|Carousel)/.test(st.format || '')) || (st.platform === 'tiktok' && /graphic|camera/i.test(st.format || ''));
    var title = isImage ? 'Template' : 'Tone';
    var lede = isImage
      ? 'Choose the template style for your ' + (st.platform === 'tiktok' ? 'TikTok post' : (st.format === 'IG Single Post' ? 'Instagram post' : 'Instagram carousel')) + '.'
      : 'Optional: a sensible voice is already selected for your script or draft.';

    var content = '';
    var isMulti = false;
    var noun = 'slides';
    if (isImage) {
      var tmpls = st.platform === 'tiktok' ? TEMPLATES_TT : TEMPLATES_IG;
      var plan = window.CPCreateSlidePlan;
      isMulti = plan ? plan.isMultiFormat(st.platform, st.format) : /carousel/i.test(st.format || '');
      noun = st.platform === 'tiktok' ? 'posts' : 'slides';
      content = templatePreview(st, tmpls) +
        slideCountSelector(st, isMulti, noun) +
        '<div class="cc-templates-grid" role="radiogroup" aria-label="Graphic templates">' + tmpls.map(function (tmpl) {
        var on = (st.template || tmpls[0].id) === tmpl.id;
        return '<button class="cc-template-card ' + (on ? 'on' : '') + '" type="button" ' +
          'onclick="cpCreateSetTemplate(\'' + tmpl.id + '\')" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          templateThumb(tmpl, st.platform) +
          '<div class="cc-template-meta">' +
          '<span class="cc-template-title">' + E(tmpl.label) + '</span>' +
          '<span class="cc-template-sub">' + E(tmpl.sub) + '</span>' +
          '</div>' +
          '<span class="cc-template-badge">' + (on ? '✓ Selected' : 'Use style') + '</span>' +
          '</button>';
      }).join('') + '</div>';
    } else {
      var chips = window.CPEnv.tones().map(function (t) {
        var on = st.tone === t.id;
        return '<button class="cc-chip ' + (on ? 'on' : '') + '" type="button" ' +
          'onclick="cpCreateSetTone(\'' + t.id + '\')" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          '<span class="cc-chip-t">' + E(t.label) + '</span></button>';
      }).join('');
      content = '<div class="cc-chips">' + chips + '</div>';
    }

    var logos = (window.CPEnv && window.CPEnv.platLogo) ? window.CPEnv.platLogo() : {};
    var platMiniSwitcher = '<div class="cc-switch-plat-bar"><span class="cc-switch-lbl">Change Platform directly:</span><div class="cc-switch-plats">' +
      window.CPEnv.plats().map(function (p) {
        var on = st.platform === p.id;
        return '<button class="cc-switch-plat ' + (on ? 'on' : '') + '" type="button" onclick="cpCreateSetPlatform(\'' + p.id + '\')" title="' + E(p.label) + '">' +
          (logos[p.id] || ('<span>' + E(p.label.slice(0, 2)) + '</span>')) +
          '<span>' + E(p.label) + '</span></button>';
      }).join('') + '</div></div>';

    var sum = f.summarize(st, window.CPEnv.plats(), window.CPEnv.tones());
    var rails =
      '<div class="cc-rails">' +
      rail('Platform', sum.platform, "cpCreateGo('platform')") +
      rail('Format', sum.format, "cpCreateGo('format')") +
      '</div>';

    return bar('Create', 'Step 4 of 5') +
      '<div class="cc-body">' + progress(st) +
      '<h1 class="cc-h1">' + E(title) + '</h1>' +
      '<p class="cc-lede">' + E(lede) + '</p>' +
      platMiniSwitcher +
      content +
      rails +
      foot(st, { canNext: true, nextLabel: 'Generate' }) +
      '</div>';
  }

  function rail(label, value, onclick) {
    return '<div class="cc-rail"><span class="cc-rail-l">' + E(label) + '</span>' +
      '<span class="cc-rail-v">' + E(value || '-') + '</span>' +
      '<button class="cc-rail-c" type="button" onclick="' + onclick + '">Change</button></div>';
  }

  window.CPCreateSteps = {
    templateThumb: templateThumb,
    slideCountSelector: slideCountSelector,
    templatePreview: templatePreview,
    sourceStep: sourceStep,
    platformStep: platformStep,
    formatStep: formatStep,
    toneStep: toneStep,
    rail: rail,
    formatHint: formatHint
  };
})();