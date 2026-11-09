/* CreatorPulse · Create: template controls.
 *
 * The two markup helpers that sit around the template grid on the "Template"
 * step: the large live preview and the 1-10 slide/post count selector. They
 * are kept in their own small file (tests pin steps.js to <400 lines) and are
 * rendered through the shared layout engine, so what the user picks here is
 * exactly what gets generated and exported.
 */
(function () {
  'use strict';

  function E(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function thumbOf(tmpl, platform) {
    var Steps = window.CPCreateSteps;
    if (Steps && Steps.templateThumb) return Steps.templateThumb(tmpl, platform);
    return '<div class="cc-template-thumb" style="' + tmpl.preview + '"><span>' + E(tmpl.label) + '</span></div>';
  }

  /* The 1-10 slide/post count selector. It sits directly under the carousel
   * preview, because the number is a property of the carousel the user is
   * looking at, not a separate settings screen. The chosen number is what the
   * generator is told to produce, so it is a real control, not decoration. */
  function slideCountSelector(st, isMulti, noun) {
    if (!isMulti) return '';
    var plan = window.CPCreateSlidePlan;
    var current = Number(st.slideCount) || (plan ? plan.defaultSlideCount(st.platform, st.format) : 4);
    var nums = [];
    for (var n = 1; n <= 10; n++) nums.push(n);
    var pills = nums.map(function (n) {
      var on = n === current;
      return '<button class="cc-count-pill' + (on ? ' on' : '') + '" type="button" ' +
        'data-cc-slidecount="' + n + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" ' +
        'aria-label="' + n + ' ' + E(noun) + '" onclick="cpCreateSetSlideCount(' + n + ')">' + n + '</button>';
    }).join('');
    return '<div class="cc-count" data-cc-slidecount-wrap>' +
      '<div class="cc-count-hd"><span class="cc-count-l">How many ' + E(noun) + '?</span>' +
      '<span class="cc-count-v">' + current + ' selected</span></div>' +
      '<div class="cc-count-row" role="radiogroup" aria-label="Number of ' + E(noun) + '">' + pills + '</div>' +
      '<p class="cc-count-hint">' + (current === 1
        ? 'One ' + E(noun === 'slides' ? 'slide' : 'post') + ' tells the whole story in a single frame.'
        : 'Each of the ' + current + ' ' + E(noun) + ' gets its own distinct beat of the story.') + '</p>' +
      '</div>';
  }

  /* A large, live preview of the template the user has selected, so the choice
   * is made by looking at the real design rather than a 150px thumbnail. It is
   * rendered by the same layout engine the export uses. */
  function templatePreview(st, tmpls) {
    var chosen = null;
    var want = st.template || (tmpls[0] && tmpls[0].id);
    tmpls.forEach(function (t) { if (t.id === want) chosen = t; });
    if (!chosen) chosen = tmpls[0];
    if (!chosen) return '';
    return '<div class="cc-tpl-preview" data-cc-tpl-preview>' +
      '<div class="cc-tpl-preview-hd"><span>Preview</span><span class="cc-tpl-preview-name">' + E(chosen.label) + '</span></div>' +
      '<div class="cc-tpl-preview-frame">' + thumbOf(chosen, st.platform) + '</div>' +
      '</div>';
  }

  window.CPCreateTemplateUi = {
    slideCountSelector: slideCountSelector,
    templatePreview: templatePreview
  };
})();
