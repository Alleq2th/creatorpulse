/* CreatorPulse · Create — one place that reads the app's shared globals,
 * and the first script loaded after core.js.
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
 *
 * BOOTSTRAP (added with spec 8.3)
 * -------------------------------
 * This is the first script in the document that runs AFTER core.js, which makes
 * it the only place a later module can be attached without editing index.html
 * or core.js — both are far too large to rewrite through the file API, and
 * editing them was the only alternative. The bootstrap below is three lines and
 * adds one thing: the long-form document view (spec 8.3). If those files are
 * missing the app behaves exactly as before, because the view attaches itself
 * by wrapping renderOut and stands aside if it cannot.
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

  /* Load the long-form document view (spec 8.3).
   *
   * `async = false` keeps execution in insertion order, so the pure rules in
   * longFormDoc.js are evaluated before the view that calls them. Any failure
   * here is swallowed: a missing optional module must never stop Create from
   * working, so the app simply keeps the old card for long scripts. */
  (function loadLongFormView() {
    if (typeof document === 'undefined') return;
    var files = ['/lib/longFormDoc.js?v=46', '/lib/longFormView.js?v=46'];
    files.forEach(function (src) {
      if (document.querySelector('script[data-cp-lf="' + src + '"]')) return;
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.cpLf = src;
      s.onerror = function () {
        if (window.console && console.warn) console.warn('[longform] could not load ' + src);
      };
      document.head.appendChild(s);
    });
  })();
})();
