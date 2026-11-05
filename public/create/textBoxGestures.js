/* CreatorPulse · Text box gesture geometry.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Dragging a text box stopped working entirely because of one bug: core.js's
 * pointermove handler read a bare `resizeMode` variable that only existed in
 * the *pointerdown* handler's scope. Every drag therefore threw
 * "ReferenceError: resizeMode is not defined" on the first move — the box
 * never budged, and the error was invisible because it fired inside a DOM
 * event listener.
 *
 * The fix also makes the two handles mean what they look like, which is what
 * the user asked for:
 *
 *   • the round dot on the right edge  -> stretches the text HORIZONTALLY
 *                                          (the box gets wider; the font does
 *                                          not grow)
 *   • the bar on the bottom edge       -> grows / shrinks the text VERTICALLY
 *                                          (the box gets taller and the font
 *                                          scales with it)
 *
 * Keeping the arithmetic here — pure, no DOM — is what makes it testable. The
 * event wiring in core.js only applies these results.
 */

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPTextBoxGestures = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MIN_W = 44;
  var MIN_H = 36;
  var MIN_SCALE = 0.5;
  var MAX_SCALE = 2.4;

  // Which axis each handle moves. This is the entire fix for "the dot should
  // stretch horizontally and the down button should grow vertically".
  var HANDLE_AXIS = {
    horizontal: 'x',   // right-edge dot / vertical bar on the side
    vertical: 'y',     // bottom handle
    both: 'xy'         // corner
  };

  function axisFor(mode) {
    return HANDLE_AXIS[mode] || 'xy';
  }

  /* Computes the next box + font scale for a resize gesture.
   *
   *   start   { left, top, width, height }  box at pointerdown, in px
   *   bounds  { width, height }             the stage, in px
   *   dx, dy  pointer movement since pointerdown, in px
   *   mode    'horizontal' | 'vertical' | 'both'
   *   scale   the layer's font scale before this gesture
   *
   * Returns { left, top, width, height, scale } in the SAME px units as start. */
  function resizeBox(start, bounds, dx, dy, mode, scale) {
    var axis = axisFor(mode);
    var w = start.width;
    var h = start.height;

    if (axis.indexOf('x') >= 0) {
      w = Math.max(MIN_W, Math.min(Math.max(MIN_W, bounds.width - start.left), start.width + dx));
    }
    if (axis.indexOf('y') >= 0) {
      h = Math.max(MIN_H, Math.min(Math.max(MIN_H, bounds.height - start.top), start.height + dy));
    }

    var nextScale = Number(scale) || 1;

    // The bottom handle drives the font size: growing the box vertically makes
    // the text bigger, shrinking it makes the text smaller. Measured against
    // the height the box started at, so a drag maps 1:1 to perceived size.
    if (mode === 'vertical' && start.height > 0) {
      nextScale = clamp(scale * (h / start.height));
    }

    // The corner handle does both: the box grows and the text scales with the
    // width, which is the familiar "corner handle" behaviour.
    if (mode === 'both' && start.width > 0) {
      nextScale = clamp(scale * (w / start.width));
    }

    return {
      left: start.left,
      top: start.top,
      width: Math.round(w),
      height: Math.round(h),
      scale: Math.round(nextScale * 20) / 20
    };
  }

  /* Computes the next box for a move (drag the body of the box). */
  function moveBox(start, bounds, dx, dy) {
    var maxLeft = Math.max(0, bounds.width - start.width);
    var maxTop = Math.max(0, bounds.height - start.height);
    return {
      left: Math.max(0, Math.min(maxLeft, start.left + dx)),
      top: Math.max(0, Math.min(maxTop, start.top + dy)),
      width: start.width,
      height: start.height
    };
  }

  /* True once the pointer has travelled enough to count as a drag rather than a
   * tap. Without this a tap jitters the box by a pixel and swallows the tap. */
  function isDrag(dx, dy, threshold) {
    var t = threshold == null ? 4 : threshold;
    return Math.sqrt(dx * dx + dy * dy) >= t;
  }

  /* Converts an on-screen box back to stage fractions, which is what the design
   * state (and therefore the exported image) stores. */
  function toFractions(box, bounds) {
    if (!bounds.width || !bounds.height) return { x: 0, y: 0, width: 1, height: 1 };
    return {
      x: round4(box.left / bounds.width),
      y: round4(box.top / bounds.height),
      width: round4(box.width / bounds.width),
      height: round4(box.height / bounds.height)
    };
  }

  function round4(n) { return Math.round(Number(n) * 10000) / 10000; }
  function clamp(n) { return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(n) || 1)); }

  return {
    resizeBox: resizeBox,
    moveBox: moveBox,
    isDrag: isDrag,
    toFractions: toFractions,
    axisFor: axisFor,
    HANDLE_AXIS: HANDLE_AXIS,
    MIN_W: MIN_W,
    MIN_H: MIN_H,
    MIN_SCALE: MIN_SCALE,
    MAX_SCALE: MAX_SCALE
  };
});
