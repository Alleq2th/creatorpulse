/* CreatorPulse · Card editor — the surface for choosing a template, a slide
 * role, a photo treatment and the single accent.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The only way to change a card used to be the Themes sheet, which swapped a
 * palette and nothing else — you could not change the composition, the photo
 * treatment or the accent, and the tiles were not the real card. This is a
 * proper editor: every control writes into the slide's style, and the preview
 * beside it is drawn from the SAME layout result the mockup and the export use
 * (public/lib/cardLayoutEngine.js), so what you pick is what you get.
 *
 * It is deliberately touch-friendly: large tap targets, one column, no hover-only
 * affordances, sized for an iPhone.
 *
 * Browser-only (window.CPCardEditor). The pure helpers are exported for tests.
 */
(function (root) {
  'use strict';

  // Dual-runtime: the browser reads the globals loaded before this script; Node
  // (tests) requires the modules directly. Same code either way.
  var engine, templates, treatments;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('./cardLayoutEngine.js');
    templates = require('./cardTemplates.js');
    treatments = require('./photoTreatments.js');
  } else {
    engine = root.CPCardLayoutEngine;
    templates = root.CPCardTemplates;
    treatments = root.CPPhotoTreatments;
  }

  /* Softer accent tones only — no pure red, no neon. Each template ships with
   * one of these; the editor lets the user swap it for another, still one per
   * card, still used for meaning (a keyword, a rule, the call to action). */
  var ACCENTS = [
    { id: 'amber',   color: '#e0a83c', name: 'Amber' },
    { id: 'clay',    color: '#c9553f', name: 'Clay' },
    { id: 'gold',    color: '#d8b24a', name: 'Gold' },
    { id: 'slate',   color: '#9aa0a6', name: 'Slate' },
    { id: 'rust',    color: '#d96a4a', name: 'Rust' },
    { id: 'brick',   color: '#d94f4f', name: 'Brick' },
    { id: 'brass',   color: '#c9a227', name: 'Brass' },
    { id: 'steel',   color: '#4a9ec9', name: 'Steel' },
    { id: 'indigo',  color: '#7f8fd6', name: 'Indigo' },
    { id: 'jade',    color: '#5fbf8f', name: 'Jade' },
    { id: 'moss',    color: '#6f8f6a', name: 'Moss' },
    { id: 'plum',    color: '#b06a9e', name: 'Plum' }
  ];

  var ROLE_LABELS = {
    hook: 'Hook', context: 'Context', evidence: 'Evidence',
    turn: 'Turn', payoff: 'Payoff', cta: 'Call to action'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* A miniature of the real card, drawn from the engine's result: the photo
   * treatment's frame and scrim, then every non-empty layer at its real box and
   * real font size. Used for the template tiles and the live preview. */
  function miniCard(design, plateUrl) {
    if (!design) return '';
    var t = design.treatment || {};
    var f = t.frame || { x: 0, y: 0, width: 1, height: 1, radius: 0 };
    var pct = function (n) { return (Number(n) * 100).toFixed(2) + '%'; };
    var plate = plateUrl
      ? 'background-image:url(&quot;' + esc(plateUrl) + '&quot;);background-size:cover;background-position:center'
      : 'background:' + esc(design.palette.bg);
    var scrim = '';
    if (design.scrim && design.scrim.stops) {
      var stops = design.scrim.stops.map(function (s) { return s.color + ' ' + Math.round(s.offset * 100) + '%'; }).join(',');
      scrim = '<span class="cc-ed-scrim" style="background:linear-gradient(180deg,' + stops + ')"></span>';
    }
    var tint = t.tint ? '<span class="cc-ed-tint" style="background:' + esc(t.tint.color) + ';opacity:' + t.tint.alpha + '"></span>' : '';
    var rule = t.rule ? '<span class="cc-ed-rule" style="left:' + pct(t.rule.x) + ';top:' + pct(t.rule.y) + ';width:' + pct(t.rule.width) + ';height:' + pct(t.rule.height) + ';background:' + esc(t.rule.color) + '"></span>' : '';
    var layers = design.layers.filter(function (l) { return !l.empty; }).map(function (l) {
      return '<span class="cc-ed-layer" style="left:' + pct(l.box.x) + ';top:' + pct(l.box.y) + ';width:' + pct(l.box.width) + ';height:' + pct(l.box.height) + ';' + engine.layerCss(l) + '">' + esc(l.displayText) + '</span>';
    }).join('');
    return '<span class="cc-ed-frame" style="background-color:' + esc(design.palette.bg) + '">' +
      '<span class="cc-ed-photo" style="left:' + pct(f.x) + ';top:' + pct(f.y) + ';width:' + pct(f.width) + ';height:' + pct(f.height) + ';' + plate + '"></span>' +
      tint + scrim + rule + layers +
    '</span>';
  }

  /* Builds the whole sheet's markup. Kept pure (no DOM) so it can be tested. */
  function buildSheet(model) {
    var m = model || {};
    var design = m.design;
    var templates = m.templates || [];
    var treatments = m.treatments || [];
    var roles = m.roles || [];
    var accents = m.accents || ACCENTS;
    var plate = m.plateUrl || '';

    var templateTiles = templates.map(function (t) {
      var d = engine.resolve({ templateId: t.id, platform: t.platform, slide: m.slide, index: 0, total: 1, style: Object.assign({}, m.style, { templateId: t.id, treatmentId: null, accent: null }) });
      var active = t.id === m.templateId;
      return '<button type="button" class="cc-ed-tile' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-template="' + esc(t.id) + '">' +
        miniCard(d, plate) + '<span class="cc-ed-tile-name">' + esc(t.name) + '</span></button>';
    }).join('');

    var roleBtns = roles.map(function (r) {
      var active = r === m.role;
      return '<button type="button" class="cc-ed-chip' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-role="' + esc(r) + '">' + esc(ROLE_LABELS[r] || r) + '</button>';
    }).join('');

    var treatmentBtns = treatments.map(function (t) {
      var active = t.id === m.treatmentId;
      return '<button type="button" class="cc-ed-chip' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-treatment="' + esc(t.id) + '">' + esc(t.name) + '</button>';
    }).join('');

    var accentBtns = accents.map(function (a) {
      var active = String(a.color).toLowerCase() === String(m.accent || '').toLowerCase();
      return '<button type="button" class="cc-ed-swatch' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-accent="' + esc(a.color) + '" aria-label="' + esc(a.name) + '" style="background:' + esc(a.color) + '"></button>';
    }).join('');

    return '' +
      '<div class="cc-ed-head"><div><h2 id="cedTitle">Edit card</h2><p class="cc-ed-hint">' + esc(m.roleLabel || '') + '</p></div>' +
      '<button type="button" class="btn bo bxs" data-ed-close aria-label="Close editor">Close</button></div>' +
      '<div class="cc-ed-body">' +
        '<div class="cc-ed-preview" aria-hidden="true">' + miniCard(design, plate) + '</div>' +
        '<div class="cc-ed-section">Template</div>' +
        '<div class="cc-ed-tiles">' + templateTiles + '</div>' +
        '<div class="cc-ed-section">Slide role</div>' +
        '<div class="cc-ed-chips">' + roleBtns + '</div>' +
        '<div class="cc-ed-section">Photo treatment</div>' +
        '<div class="cc-ed-chips">' + treatmentBtns + '</div>' +
        '<div class="cc-ed-section">Accent</div>' +
        '<div class="cc-ed-swatches">' + accentBtns + '</div>' +
      '</div>';
  }

  /* Opens the editor for one slide. `host` supplies the app's own accessors so
   * this module never reaches into core.js internals:
   *   { tid, idx, slideIndex, platform, getSlide, getPlate, onChange, toast } */
  function open(host) {
    if (!host || !engine || !templates) return;
    var slide = host.getSlide && host.getSlide();
    if (!slide) { host.toast && host.toast('That graphic is not ready to edit yet.'); return; }
    close();

    var overlay = document.createElement('div');
    overlay.className = 'cc-ed-overlay';
    overlay.id = 'cedOverlay';
    overlay.innerHTML = '<div class="cc-ed-sheet" role="dialog" aria-modal="true" aria-labelledby="cedTitle"></div>';
    document.body.appendChild(overlay);

    function currentStyle() { return slide._style || (slide._style = {}); }
    function currentTemplateId() {
      var sty = currentStyle();
      return slide._templateId || sty.templateId || (templates.list(host.platform)[0] || {}).id;
    }
    function currentTreatmentId() {
      var sty = currentStyle();
      if (sty.treatmentId) return sty.treatmentId;
      var t = templates.get(currentTemplateId());
      return (t && t.treatment && t.treatment.id) || 'fullBleedScrim';
    }

    function render() {
      var sty = currentStyle();
      var templateId = currentTemplateId();
      var role = templates.roleFor(slide, 0, 1);
      var design = engine.resolve({
        templateId: templateId, platform: host.platform, slide: slide, index: 0, total: 1, style: sty
      });
      var sheet = overlay.querySelector('.cc-ed-sheet');
      sheet.innerHTML = buildSheet({
        design: design,
        slide: slide,
        style: sty,
        templateId: templateId,
        role: role,
        roleLabel: 'This slide reads as: ' + (ROLE_LABELS[role] || role),
        treatmentId: currentTreatmentId(),
        accent: (design && design.palette && design.palette.accent) || '',
        templates: templates.list(host.platform),
        treatments: treatments.list(),
        roles: templates.ROLES,
        accents: ACCENTS,
        plateUrl: (host.getPlate && host.getPlate()) || ''
      });
      wire();
    }

    function apply(mutate) {
      mutate();
      host.onChange && host.onChange();
      render();
    }

    function wire() {
      overlay.querySelectorAll('[data-ed-template]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-ed-template');
          apply(function () {
            slide._templateId = id;
            var sty = currentStyle();
            sty.templateId = id;
            // A template is a whole design, so its own treatment and accent come
            // with it; the user can then re-pick either.
            delete sty.treatmentId;
            delete sty.accent;
          });
        });
      });
      overlay.querySelectorAll('[data-ed-role]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var role = btn.getAttribute('data-ed-role');
          apply(function () { slide.role = role; });
        });
      });
      overlay.querySelectorAll('[data-ed-treatment]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-ed-treatment');
          apply(function () { currentStyle().treatmentId = id; });
        });
      });
      overlay.querySelectorAll('[data-ed-accent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var color = btn.getAttribute('data-ed-accent');
          apply(function () { currentStyle().accent = color; });
        });
      });
      var closeBtn = overlay.querySelector('[data-ed-close]');
      if (closeBtn) closeBtn.addEventListener('click', close);
    }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    render();
  }

  function close() {
    var el = document.getElementById('cedOverlay');
    if (el) el.remove();
  }

  var api = { open: open, close: close, buildSheet: buildSheet, miniCard: miniCard, ACCENTS: ACCENTS, ROLE_LABELS: ROLE_LABELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardEditor = api;
})(typeof window !== 'undefined' ? window : globalThis);
