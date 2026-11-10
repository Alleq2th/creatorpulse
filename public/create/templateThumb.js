/* CreatorPulse · Create template thumbnail renderer.
 * Kept separate from the step flow so each file stays focused and small.
 */
(function (root) {
  'use strict';
  function E(s) { return root.CPEnv.esc(s); }
  function render(tmpl, platform) {
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
      // Use a real repository photo in every tile. The treatment's own frame and
      // filter control the crop, so split/inset/full-bleed templates read differently.
      var treatment = design.treatment || {};
      var frame = treatment.frame || { x: 0, y: 0, width: 1, height: 1, radius: 0 };
      var filter = treatment.filter || {};
      var photoFilter = 'brightness(' + (filter.brightness || 1) + ') contrast(' + (filter.contrast || 1) + ') saturate(' + (filter.saturation || 1) + ')' +
        (filter.grayscale ? ' grayscale(' + filter.grayscale + ')' : '') +
        (filter.blur ? ' blur(' + filter.blur + 'px)' : '');
      var photoHtml = '<span class="cc-template-photo" aria-hidden="true" style="left:' + px(frame.x, 1) + ';top:' + px(frame.y, 1) + ';width:' + px(frame.width, 1) + ';height:' + px(frame.height, 1) + ';border-radius:' + px(frame.radius || 0, 1) + ';filter:' + photoFilter + ';background-image:url(https://raw.githubusercontent.com/Alleq2th/creatorpulse/main/shots/whitepanel/news1.jpg)"></span>';
      var panelHtml = '';
      if (design.panel) {
        panelHtml = '<span class="cc-template-panel" style="top:' + px(design.panel.y, 1) + ';height:' + px(design.panel.height, 1) + ';background:' + design.panel.bg + ';border-top-left-radius:' + px(design.panel.radius || 0, W) + ';border-top-right-radius:' + px(design.panel.radius || 0, W) + '"></span>';
      }
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
        photoHtml +
        (scrim ? '<span class="cc-template-scrim" style="background:linear-gradient(180deg,' + scrim + ')"></span>' : '') +
        panelHtml + decoHtml + layers +
      '</div>';
    }
  
  root.CPCreateTemplateThumb = { render: render };
})(window);
