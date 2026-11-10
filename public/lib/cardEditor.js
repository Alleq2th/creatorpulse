/* CreatorPulse · Card editor — the surface for choosing a template, a slide
 * role, a photo treatment and the single accent, and for the Part 6 editing
 * experience: swap THIS slide's layout variant, nudge the text, change its size,
 * undo / redo, apply a change to every slide (with a per-slide override), reset
 * one slide, restore the original look, and toggle the edit-mode guides.
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
 * Every tile — the template picker, the layout-variant carousel, the theme
 * sheet — is a miniature of the REAL card (public/lib/cardThumbnails.js), with
 * the user's own photo and text, never a flat colour box.
 *
 * It is deliberately touch-friendly: large tap targets, one column, no hover-only
 * affordances, sized for an iPhone. At most five nav items, each an icon plus a
 * short label, and the primary choices are browsable by scrolling — never hidden
 * behind a tap-to-reveal.
 *
 * Browser-only (window.CPCardEditor). The pure helpers are exported for tests.
 */
(function (root) {
  'use strict';

  // Dual-runtime: the browser reads the globals loaded before this script; Node
  // (tests) requires the modules directly. Same code either way.
  var engine, templates, treatments, controls, thumbs;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('./cardLayoutEngine.js');
    templates = require('./cardTemplates.js');
    treatments = require('./photoTreatments.js');
    controls = require('./cardEditControls.js');
    thumbs = require('./cardThumbnails.js');
  } else {
    engine = root.CPCardLayoutEngine;
    templates = root.CPCardTemplates;
    treatments = root.CPPhotoTreatments;
    controls = root.CPCardEditControls;
    thumbs = root.CPCardThumbnails;
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
    { id: 'jade',    color: '#5fbf8b', name: 'Jade' },
    { id: 'moss',    color: '#6f8f6a', name: 'Moss' },
    { id: 'plum',    color: '#b06a9e', name: 'Plum' }
  ];

  var FONT_CHOICES = [
    {id:'impact',label:'Impact Bold'},{id:'archivo_black',label:'Archivo Black'},{id:'anton',label:'Anton'},
    {id:'bebas_neue',label:'Bebas Neue'},{id:'oswald',label:'Oswald'},{id:'roboto_condensed',label:'Roboto Condensed'},
    {id:'barlow_condensed',label:'Barlow Condensed'},{id:'montserrat',label:'Montserrat'},{id:'poppins',label:'Poppins'},
    {id:'modern_sans',label:'Modern Sans'},{id:'dm_sans',label:'DM Sans'},{id:'manrope',label:'Manrope'},
    {id:'space_grotesk',label:'Space Grotesk'},{id:'urbanist',label:'Urbanist'},{id:'outfit',label:'Outfit'},
    {id:'figtree',label:'Figtree'},{id:'editorial_serif',label:'Editorial Serif'},{id:'dm_serif_display',label:'DM Serif Display'},
    {id:'lora',label:'Lora'},{id:'merriweather',label:'Merriweather'},{id:'cormorant_garamond',label:'Cormorant Garamond'},
    {id:'libre_baskerville',label:'Libre Baskerville'},{id:'roboto_slab',label:'Roboto Slab'},{id:'code_mono',label:'Modern Mono'},
    {id:'space_mono',label:'Space Mono'},{id:'source_code_pro',label:'Source Code Pro'}
  ];

  var ROLE_LABELS = {
    hook: 'Hook', context: 'Context', evidence: 'Evidence',
    turn: 'Turn', payoff: 'Payoff', cta: 'Call to action'
  };

  // The five nav items, each an icon plus a short label. No more than five, and
  // every primary choice is browsable by scrolling rather than hidden.
  var NAV = [
    { id: 'layout',   icon: '\u25A6', label: 'Layout' },
    { id: 'photo',    icon: '\u25C9', label: 'Photo' },
    { id: 'text',     icon: 'A',      label: 'Text' },
    { id: 'elements', icon: '✦',      label: 'Elements' },
    { id: 'history',  icon: '\u21B6', label: 'History' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* A miniature of the real card, drawn from the engine's result. Delegates to
   * the one thumbnail module so the editor, the slide strip and the theme sheet
   * all show the same real card. */
  function miniCard(design, plateUrl) {
    if (!design) return '';
    if (thumbs) return thumbs.miniHTML(design, plateUrl);
    return '';
  }

  /* Builds the whole sheet's markup. Kept pure (no DOM) so it can be tested. */
  function buildSheet(model) {
    var m = model || {};
    var design = m.design;
    var templateList = m.templates || [];
    var treatmentList = m.treatments || [];
    var roles = m.roles || [];
    var accents = m.accents || ACCENTS;
    var plate = m.plateUrl || '';
    var nav = m.nav || 'layout';

    var templateTiles = templateList.map(function (t) {
      var d = engine.resolve({ templateId: t.id, platform: t.platform, slide: m.slide, index: 0, total: 1, style: Object.assign({}, m.style, { templateId: t.id, treatmentId: null, accent: null }) });
      var active = t.id === m.templateId;
      return '<button type="button" class="cc-ed-tile' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-template="' + esc(t.id) + '">' +
        miniCard(d, plate) + '<span class="cc-ed-tile-name">' + esc(t.name) + '</span></button>';
    }).join('');

    // The layout-variant carousel: 3-4 real compositions for THIS slide, each
    // resolved through the engine with the user's own photo and text.
    var variantTiles = (m.variants || []).map(function (v) {
      var active = v.role === m.role;
      return '<button type="button" class="cc-ed-tile cc-ed-variant' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-variant="' + esc(v.role) + '">' +
        miniCard(v.design, plate) + '<span class="cc-ed-tile-name">' + esc(v.name) + '</span></button>';
    }).join('');

    var roleBtns = roles.map(function (r) {
      var active = r === m.role;
      return '<button type="button" class="cc-ed-chip' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-role="' + esc(r) + '">' + esc(ROLE_LABELS[r] || r) + '</button>';
    }).join('');

    var treatmentBtns = treatmentList.map(function (t) {
      var active = t.id === m.treatmentId;
      return '<button type="button" class="cc-ed-chip' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-treatment="' + esc(t.id) + '">' + esc(t.name) + '</button>';
    }).join('');

    var accentBtns = accents.map(function (a) {
      var active = String(a.color).toLowerCase() === String(m.accent || '').toLowerCase();
      return '<button type="button" class="cc-ed-swatch' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-accent="' + esc(a.color) + '" aria-label="' + esc(a.name) + '" style="background:' + esc(a.color) + '"></button>';
    }).join('');

    // Nudge: top / middle / bottom, left / centre.
    var nudgeV = ['top', 'middle', 'bottom'].map(function (v) {
      return '<button type="button" class="cc-ed-chip" data-ed-nudge-v="' + v + '">' + esc(v.charAt(0).toUpperCase() + v.slice(1)) + '</button>';
    }).join('');
    var nudgeH = ['left', 'centre'].map(function (h) {
      return '<button type="button" class="cc-ed-chip" data-ed-nudge-h="' + h + '">' + esc(h.charAt(0).toUpperCase() + h.slice(1)) + '</button>';
    }).join('');

    // Text size S / M / L.
    var sizeBtns = (controls ? controls.SIZE_ORDER : ['S', 'M', 'L']).map(function (id) {
      var active = id === m.sizeId;
      return '<button type="button" class="cc-ed-chip' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-size="' + esc(id) + '">' + esc(id) + '</button>';
    }).join('');

    var navBtns = NAV.map(function (n) {
      var active = n.id === nav;
      return '<button type="button" class="cc-ed-nav' + (active ? ' active' : '') + '" aria-pressed="' + active + '" data-ed-nav="' + esc(n.id) + '"><span class="cc-ed-nav-ic" aria-hidden="true">' + n.icon + '</span><span class="cc-ed-nav-lb">' + esc(n.label) + '</span></button>';
    }).join('');

    var panel = '';
    if (nav === 'layout') {
      panel = '<div class="cc-ed-section">Layout for this slide</div>' +
        '<div class="cc-ed-tiles cc-ed-carousel">' + variantTiles + '</div>' +
        '<div class="cc-ed-section">Slide role</div>' +
        '<div class="cc-ed-chips">' + roleBtns + '</div>' +
        '<div class="cc-ed-section">Template</div>' +
        '<div class="cc-ed-tiles">' + templateTiles + '</div>' +
        '<div class="cc-ed-section">Accent colour</div>' +
        '<div class="cc-ed-swatches">' + accentBtns + '</div>' +
        '<div class="cc-ed-section">Apply across carousel</div>' +
        '<div class="cc-ed-chips">' +
          '<button type="button" class="cc-ed-chip" data-ed-apply="template">Template to all</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-apply="accent">Accent to all</button>' +
          '<button type="button" class="cc-ed-chip' + (m.override ? ' active' : '') + '" aria-pressed="' + !!m.override + '" data-ed-override="1">Keep this slide</button>' +
        '</div>';
    } else if (nav === 'photo') {
      var cropX = Math.max(0, Math.min(100, Number((m.style || {}).cropX ?? 50)));
      var cropY = Math.max(0, Math.min(100, Number((m.style || {}).cropY ?? 50)));
      panel = '<div class="cc-ed-section">Photo treatment</div>' +
        '<div class="cc-ed-chips">' + treatmentBtns + '</div>' +
        '<div class="cc-ed-section">Replace background photo</div>' +
        '<label class="cc-ed-upload">Choose image<input type="file" accept="image/*" hidden data-ed-replace-image /></label>' +
        '<div class="cc-ed-section">Crop position</div>' +
        '<label class="cc-ed-control"><span>Horizontal <b data-ed-crop-value="cropX">' + cropX + '%</b></span><input type="range" min="0" max="100" value="' + cropX + '" data-ed-crop="cropX" /></label>' +
        '<label class="cc-ed-control"><span>Vertical <b data-ed-crop-value="cropY">' + cropY + '%</b></span><input type="range" min="0" max="100" value="' + cropY + '" data-ed-crop="cropY" /></label>';
    } else if (nav === 'text') {
      panel = '<div class="cc-ed-section">Text position</div>' +
        '<div class="cc-ed-chips">' + nudgeV + '</div>' +
        '<div class="cc-ed-chips">' + nudgeH + '</div>' +
        '<div class="cc-ed-section">Text size</div>' +
        '<div class="cc-ed-chips">' + sizeBtns + '</div>';
    } else if (nav === 'elements') {
      var rows = (m.elements || []).map(function (el) {
        var id = esc(el.id);
        var isText = el.type === 'text' || el.type === 'badge';
        var fontOptions = FONT_CHOICES.map(function (f) {
          return '<option value="' + f.id + '"' + (el.font === f.id ? ' selected' : '') + '>' + esc(f.label) + '</option>';
        }).join('');
        return '<div class="cc-ed-element" data-ed-element-row="' + id + '">' +
          '<div class="cc-ed-element-head"><strong>' + esc(el.type.charAt(0).toUpperCase() + el.type.slice(1)) + '</strong><button type="button" class="cc-ed-chip" data-ed-element-remove="' + id + '">Remove</button></div>' +
          (isText ? '<label class="cc-ed-control"><span>Text</span><input type="text" maxlength="120" value="' + esc(el.text || '') + '" data-ed-element-field="text" data-ed-element-id="' + id + '" /></label>' : '') +
          '<label class="cc-ed-control"><span>Colour</span><input type="color" value="' + esc(el.color || '#ffffff') + '" data-ed-element-field="color" data-ed-element-id="' + id + '" /></label>' +
          '<label class="cc-ed-control"><span>Horizontal position</span><input type="range" min="0" max="96" value="' + Math.round((el.x || 0) * 100) + '" data-ed-element-field="x" data-ed-element-id="' + id + '" /></label>' +
          '<label class="cc-ed-control"><span>Vertical position</span><input type="range" min="0" max="96" value="' + Math.round((el.y || 0) * 100) + '" data-ed-element-field="y" data-ed-element-id="' + id + '" /></label>' +
          (isText ? '<label class="cc-ed-control"><span>Font</span><select data-ed-element-field="font" data-ed-element-id="' + id + '">' + fontOptions + '</select></label>' : '') +
          (isText ? '<label class="cc-ed-control"><span>Size</span><input type="range" min="12" max="100" value="' + Math.round((el.fontSize || .038) * 1000) + '" data-ed-element-field="fontSize" data-ed-element-id="' + id + '" /></label>' : '') +
          '</div>';
      }).join('');
      panel = '<div class="cc-ed-section">Add an element</div>' +
        '<div class="cc-ed-chips">' +
          '<button type="button" class="cc-ed-chip" data-ed-add="text">＋ Text</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-add="badge">＋ Badge</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-add="rule">＋ Accent line</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-add="circle">＋ Circle</button>' +
        '</div>' +
        '<div class="cc-ed-section">Your elements (' + (m.elements || []).length + ')</div>' +
        (rows || '<p class="cc-ed-empty">No extra elements yet. Add text, a badge, a line or a circle.</p>');
    } else if (nav === 'history') {
      panel = '<div class="cc-ed-section">History</div>' +
        '<div class="cc-ed-chips">' +
          '<button type="button" class="cc-ed-chip" data-ed-undo="1"' + (m.canUndo ? '' : ' disabled') + '>\u21B6 Undo</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-redo="1"' + (m.canRedo ? '' : ' disabled') + '>\u21B7 Redo</button>' +
        '</div>' +
        '<div class="cc-ed-section">This slide</div>' +
        '<div class="cc-ed-chips">' +
          '<button type="button" class="cc-ed-chip" data-ed-reset="1">Reset slide</button>' +
          '<button type="button" class="cc-ed-chip" data-ed-restore="1">Restore original look</button>' +
        '</div>';
    }

    return '' +
      '<div class="cc-ed-head"><div><h2 id="cedTitle">Edit card</h2><p class="cc-ed-hint">' + esc(m.roleLabel || '') + '</p></div>' +
      '<button type="button" class="btn bo bxs" data-ed-close aria-label="Close editor">Close</button></div>' +
      '<div class="cc-ed-body">' +
        '<div class="cc-ed-preview" aria-hidden="true">' + miniCard(design, plate) + '</div>' +
        '<div class="cc-ed-chips cc-ed-tools">' +
          '<button type="button" class="cc-ed-chip' + (m.editMode ? ' active' : '') + '" aria-pressed="' + !!m.editMode + '" data-ed-guides="1">\u25A1 Guides</button>' +
        '</div>' +
        panel +
      '</div>' +
      '<div class="cc-ed-navbar" role="tablist" aria-label="Editor sections">' + navBtns + '</div>';
  }

  /* Opens the editor for one slide. `host` supplies the app's own accessors so
   * this module never reaches into core.js internals. */
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

    var nav = 'layout';

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
      var variants = controls ? controls.layoutVariantsFor({
        templateId: templateId, platform: host.platform, slide: slide,
        index: (host.getIndex && host.getIndex()) || 0,
        total: (host.getTotal && host.getTotal()) || 1, style: sty
      }) : [];
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
        variants: variants,
        sizeId: controls ? controls.sizeIdFor(((sty.layerScale || {}).headline) || 1) : 'M',
        override: !!sty.override,
        editMode: !!(host.isEditMode && host.isEditMode()),
        canUndo: !!(host.canUndo && host.canUndo()),
        canRedo: !!(host.canRedo && host.canRedo()),
        nav: nav,
        plateUrl: (host.getPlate && host.getPlate()) || '',
        elements: (slide.elements || []).slice()
      });
      wire();
    }

    function apply(mutate) {
      mutate();
      host.onChange && host.onChange();
      host.onEdit && host.onEdit();
      render();
    }

    function wire() {
      overlay.querySelectorAll('[data-ed-nav]').forEach(function (btn) {
        btn.addEventListener('click', function () { nav = btn.getAttribute('data-ed-nav'); render(); });
      });
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
      overlay.querySelectorAll('[data-ed-variant]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var role = btn.getAttribute('data-ed-variant');
          if (host.onVariant) host.onVariant(role); else apply(function () { slide.role = role; });
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-role]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var role = btn.getAttribute('data-ed-role');
          apply(function () { slide.role = role; });
        });
      });
      overlay.querySelectorAll('[data-ed-add]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var type = btn.getAttribute('data-ed-add');
          var list = Array.isArray(slide.elements) ? slide.elements : (slide.elements = []);
          if (list.length >= 24) { host.toast && host.toast('This card has reached the 24-element limit.'); return; }
          var item = root.CPCardElementLibrary ? root.CPCardElementLibrary.create(type, list.length) : { id:'element-' + Date.now(), type:type, text:type === 'text' ? 'Add your text' : (type === 'badge' ? 'NEW' : ''), x:.08, y:.76, width:.4, height:.08, color:'#ffffff', background:'#2f7bff', font:'impact', fontSize:.038, weight:800, align:'left', opacity:1 };
          item.id = 'element-' + Date.now() + '-' + list.length;
          list.push(item);
          host.onChange && host.onChange();
          host.onEdit && host.onEdit();
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-element-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-ed-element-remove');
          slide.elements = (slide.elements || []).filter(function (el) { return String(el.id) !== id; });
          host.onChange && host.onChange();
          host.onEdit && host.onEdit();
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-element-field]').forEach(function (input) {
        function update(commit) {
          var id = input.getAttribute('data-ed-element-id');
          var field = input.getAttribute('data-ed-element-field');
          var el = (slide.elements || []).find(function (item) { return String(item.id) === id; });
          if (!el) return;
          var value = input.value;
          if (field === 'x' || field === 'y') value = Number(value) / 100;
          if (field === 'fontSize') value = Number(value) / 1000;
          el[field] = value;
          host.onChange && host.onChange();
          if (commit) host.onEdit && host.onEdit();
        }
        input.addEventListener('input', function () { update(false); });
        input.addEventListener('change', function () { update(true); });
      });
      overlay.querySelectorAll('[data-ed-crop]').forEach(function (input) {
        function update(commit) {
          var key = input.getAttribute('data-ed-crop');
          currentStyle()[key] = Number(input.value);
          var value = overlay.querySelector('[data-ed-crop-value="' + key + '"]');
          if (value) value.textContent = input.value + '%';
          host.onChange && host.onChange();
          if (commit) host.onEdit && host.onEdit();
        }
        input.addEventListener('input', function () { update(false); });
        input.addEventListener('change', function () { update(true); });
      });
      var replaceImage = overlay.querySelector('[data-ed-replace-image]');
      if (replaceImage) replaceImage.addEventListener('change', function () {
        if (host.onReplaceImage && replaceImage.files && replaceImage.files[0]) host.onReplaceImage(replaceImage);
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
      overlay.querySelectorAll('[data-ed-nudge-v]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (host.onNudge) host.onNudge(btn.getAttribute('data-ed-nudge-v'), 'left');
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-nudge-h]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (host.onNudge) host.onNudge('middle', btn.getAttribute('data-ed-nudge-h'));
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-size]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (host.onSize) host.onSize(btn.getAttribute('data-ed-size'));
          render();
        });
      });
      overlay.querySelectorAll('[data-ed-apply]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var kind = btn.getAttribute('data-ed-apply');
          if (!host.onApplyAll) return;
          if (kind === 'template') host.onApplyAll({ templateId: currentTemplateId() });
          else host.onApplyAll({ accent: (engine.resolve({ templateId: currentTemplateId(), platform: host.platform, slide: slide, index: 0, total: 1, style: currentStyle() }) || {}).palette.accent });
          render();
        });
      });
      var overrideBtn = overlay.querySelector('[data-ed-override]');
      if (overrideBtn) overrideBtn.addEventListener('click', function () { if (host.onToggleOverride) host.onToggleOverride(); render(); });
      var undoBtn = overlay.querySelector('[data-ed-undo]');
      if (undoBtn) undoBtn.addEventListener('click', function () { if (host.onUndo) host.onUndo(); render(); });
      var redoBtn = overlay.querySelector('[data-ed-redo]');
      if (redoBtn) redoBtn.addEventListener('click', function () { if (host.onRedo) host.onRedo(); render(); });
      var resetBtn = overlay.querySelector('[data-ed-reset]');
      if (resetBtn) resetBtn.addEventListener('click', function () { if (host.onReset) host.onReset(); render(); });
      var restoreBtn = overlay.querySelector('[data-ed-restore]');
      if (restoreBtn) restoreBtn.addEventListener('click', function () { if (host.onRestore) host.onRestore(); render(); });
      var guidesBtn = overlay.querySelector('[data-ed-guides]');
      if (guidesBtn) guidesBtn.addEventListener('click', function () { if (host.onToggleEditMode) host.onToggleEditMode(); render(); });
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

  var api = { open: open, close: close, buildSheet: buildSheet, miniCard: miniCard, ACCENTS: ACCENTS, ROLE_LABELS: ROLE_LABELS, NAV: NAV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardEditor = api;
})(typeof window !== 'undefined' ? window : globalThis);
