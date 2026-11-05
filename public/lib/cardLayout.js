/* CreatorPulse · Shared card layout — thin facade over the layout engine.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * This used to be the layout resolver itself. It has been superseded by
 * public/lib/cardLayoutEngine.js, which reads a declarative template SPEC
 * (public/lib/cardTemplates.js) and produces the one layout result both the
 * preview and the export consume. Keeping a second resolver here is exactly the
 * drift this work set out to remove, so this file is now only a compatibility
 * facade: it forwards to the engine and exposes the same names the rest of the
 * app already calls (window.CPCardLayout.resolve / layerCss / wrapLines / ...).
 *
 * There is ONE layout path. This file adds no logic of its own.
 *
 * Runs in the browser (window.CPCardLayout) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var engine;
  if (typeof module !== 'undefined' && module.exports) {
    engine = require('./cardLayoutEngine.js');
  } else {
    engine = root.CPCardLayoutEngine;
  }
  var api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardLayout = api;
})(typeof window !== 'undefined' ? window : null, function (engine) {
  'use strict';

  function missing() { return null; }

  return {
    FONTS: (engine && engine.FONTS) || {},
    LAYERS: (engine && engine.LAYERS) || [],
    LAYER_KEYS: (engine && engine.LAYER_KEYS) || [],
    SAFE_ZONES: (engine && engine.SAFE_ZONES) || {},
    layerText: (engine && engine.layerText) || missing,
    safeZone: (engine && engine.safeZone) || missing,
    clampToSafeZone: (engine && engine.clampToSafeZone) || missing,
    decorationGeometry: (engine && engine.decorationGeometry) || missing,
    resolve: (engine && engine.resolve) || missing,
    wrapLines: (engine && engine.wrapLines) || missing,
    layerCss: (engine && engine.layerCss) || missing
  };
});
