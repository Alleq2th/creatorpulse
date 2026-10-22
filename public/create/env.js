/* CreatorPulse · Create — one place that reads the app's shared globals.
 *
 * core.js declares its state and tables with top-level `const`. In a browser
 * those live in the global *lexical* scope: a later classic script CAN read
 * them as bare names (`PLATS`, `S`, `esc`), but they are NOT properties of
 * `window`, so `window.PLATS` is undefined. Verified in Chromium.
 *
 * So the reads below are bare names, each guarded by `typeof`. That guard is
 * what makes the file safe: `typeof X` never throws for an undeclared name,
 * whereas a bare `X` would raise ReferenceError on the very first paint (and in
 * the Node tests, where there is no DOM at all).
 *
 * Deliberately NOT using eval(): the page runs under a Content-Security-Policy
 * that forbids it, and a blocked eval here would leave every Create screen
 * blank — the exact freeze class this rebuild exists to prevent.
 *
 * Every Create file goes through this object rather than touching the globals
 * directly, so there is exactly one place to look when the contract changes.
 */
(function () {
  'use strict';

  window.CPEnv = {
    state: function () { return typeof S !== 'undefined' ? S : null; },
    plats: function () { return typeof PLATS !== 'undefined' ? PLATS : []; },
    ptypes: function () { return typeof PTYPES !== 'undefined' ? PTYPES : {}; },
    tones: function () { return typeof TONES !== 'undefined' ? TONES : []; },
    platEmoji: function () { return typeof PLAT_EMOJI !== 'undefined' ? PLAT_EMOJI : {}; },

    setTab: function (t) { if (typeof setTab === 'function') setTab(t); },
    render: function () { if (typeof render === 'function') render(); },

    // Prefer the app's own escaper so escaping rules stay identical app-wide.
    esc: function (s) {
      if (typeof esc === 'function') return esc(s);
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  };
})();
