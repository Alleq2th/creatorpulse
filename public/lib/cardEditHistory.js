/* CreatorPulse · Card edit history — undo / redo for one slide's edits.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Part 6 asks for undo and redo. A history is pure bookkeeping over the slide's
 * editable state, so it lives here — no DOM, no rendering — and the editor and
 * core.js only push a snapshot after a change and read one back on undo. The
 * snapshot is a deep copy, so a later edit can never mutate a past state.
 *
 * Runs in the browser (window.CPCardEditHistory) and in Node (module.exports).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardEditHistory = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // How many steps back a user can go. Deep enough to feel unlimited, bounded so
  // a long session cannot grow without limit.
  var LIMIT = 60;

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /* Creates a history seeded with the slide's current state. */
  function create(initial) {
    var past = [];
    var future = [];
    var present = clone(initial) || {};
    return {
      present: function () { return clone(present); },
      /* Records a new state. A no-op change is ignored, so a stray repaint does
       * not fill the stack with identical steps. */
      push: function (next) {
        var n = clone(next) || {};
        if (same(n, present)) return false;
        past.push(present);
        if (past.length > LIMIT) past.shift();
        present = n;
        future = [];
        return true;
      },
      undo: function () {
        if (!past.length) return null;
        future.push(present);
        present = past.pop();
        return clone(present);
      },
      redo: function () {
        if (!future.length) return null;
        past.push(present);
        present = future.pop();
        return clone(present);
      },
      canUndo: function () { return past.length > 0; },
      canRedo: function () { return future.length > 0; },
      depth: function () { return { past: past.length, future: future.length }; },
      reset: function (state) { past = []; future = []; present = clone(state) || {}; }
    };
  }

  return { create: create, LIMIT: LIMIT };
});
