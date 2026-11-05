// Tests for the draggable / resizable text box.
//
// The regression these guard against: dragging a text box did nothing at all.
// core.js's pointermove handler read a bare `resizeMode` variable that only
// existed inside the pointerdown handler's scope, so the first pointermove
// threw "ReferenceError: resizeMode is not defined" and the box never moved.
//
// The behaviour the user asked for, and what these tests pin down:
//   • the round dot on the side  -> stretches the text HORIZONTALLY
//   • the bar on the bottom      -> grows / shrinks the text VERTICALLY
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const g = require("../public/create/textBoxGestures.js");
const coreSrc = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");

const BOUNDS = { width: 400, height: 400 };
const START = { left: 40, top: 40, width: 200, height: 100 };

test("the side dot stretches the box horizontally and leaves the height alone", () => {
  const out = g.resizeBox(START, BOUNDS, 60, 0, "horizontal", 1);
  assert.strictEqual(out.width, 260, "width must grow by the drag distance");
  assert.strictEqual(out.height, 100, "a horizontal drag must not change the height");
  assert.strictEqual(out.scale, 1, "a horizontal stretch must not change the font size");
});

test("the bottom bar grows the box vertically AND scales the text up", () => {
  const out = g.resizeBox(START, BOUNDS, 0, 50, "vertical", 1);
  assert.strictEqual(out.height, 150, "height must grow by the drag distance");
  assert.strictEqual(out.width, 200, "a vertical drag must not change the width");
  assert.ok(out.scale > 1, `a downward drag must grow the text, got scale ${out.scale}`);
  assert.strictEqual(out.scale, 1.5, "scale must track the height ratio (150/100)");
});

test("dragging the bottom bar up shrinks the text", () => {
  const out = g.resizeBox(START, BOUNDS, 0, -50, "vertical", 1);
  assert.strictEqual(out.height, 50);
  assert.ok(out.scale < 1, `an upward drag must shrink the text, got scale ${out.scale}`);
  assert.strictEqual(out.scale, 0.5);
});

test("the corner handle changes both dimensions and scales with the width", () => {
  const out = g.resizeBox(START, BOUNDS, 100, 100, "both", 1);
  assert.strictEqual(out.width, 300);
  assert.strictEqual(out.height, 200);
  assert.strictEqual(out.scale, 1.5, "corner scale tracks the width ratio (300/200)");
});

test("the font scale is clamped so text can never vanish or explode", () => {
  const tiny = g.resizeBox(START, BOUNDS, 0, -1000, "vertical", 1);
  assert.strictEqual(tiny.scale, g.MIN_SCALE);
  const huge = g.resizeBox(START, BOUNDS, 0, 1000, "vertical", 1);
  assert.strictEqual(huge.scale, g.MAX_SCALE);
});

test("a box can never be dragged outside the stage", () => {
  const out = g.moveBox(START, BOUNDS, 1000, 1000);
  assert.strictEqual(out.left, BOUNDS.width - START.width);
  assert.strictEqual(out.top, BOUNDS.height - START.height);
  const neg = g.moveBox(START, BOUNDS, -1000, -1000);
  assert.strictEqual(neg.left, 0);
  assert.strictEqual(neg.top, 0);
});

test("a move never changes the box size", () => {
  const out = g.moveBox(START, BOUNDS, 20, 20);
  assert.strictEqual(out.width, START.width);
  assert.strictEqual(out.height, START.height);
});

test("a tap is not treated as a drag", () => {
  assert.strictEqual(g.isDrag(1, 1), false, "a 1px jitter must not count as a drag");
  assert.strictEqual(g.isDrag(10, 0), true);
  assert.strictEqual(g.isDrag(0, 0, 0), true, "an explicit zero threshold always drags");
});

test("each handle maps to the axis it is supposed to move", () => {
  assert.strictEqual(g.axisFor("horizontal"), "x");
  assert.strictEqual(g.axisFor("vertical"), "y");
  assert.strictEqual(g.axisFor("both"), "xy");
  assert.strictEqual(g.axisFor("nonsense"), "xy", "an unknown mode must fall back to both");
});

test("a box converts back to stage fractions for the exported image", () => {
  const f = g.toFractions({ left: 40, top: 40, width: 200, height: 100 }, BOUNDS);
  assert.strictEqual(f.x, 0.1);
  assert.strictEqual(f.y, 0.1);
  assert.strictEqual(f.width, 0.5);
  assert.strictEqual(f.height, 0.25);
});

test("core.js no longer reads an undefined resizeMode in pointermove", () => {
  // The exact bug: `resizeMode` was used in the move handler but only declared
  // in the down handler, so every drag threw a ReferenceError.
  const moveStart = coreSrc.indexOf('document.addEventListener("pointermove"');
  const moveEnd = coreSrc.indexOf('const finish = () => {', moveStart);
  const moveHandler = coreSrc.slice(moveStart, moveEnd);
  assert.ok(moveHandler.length > 0, "the pointermove handler must exist");
  // A BARE `resizeMode` (not `a.resizeMode`) is the bug: it was only declared in
  // the pointerdown handler's scope, so the first move threw a ReferenceError.
  assert.doesNotMatch(moveHandler, /(?<![.\w])resizeMode\b/, "pointermove must not reference a bare resizeMode");
  assert.match(moveHandler, /a\.resizeMode/, "it must read the mode off the gesture state");
});

test("core.js delegates the resize maths to the shared gesture module", () => {
  assert.match(coreSrc, /CPTextBoxGestures\.resizeBox\(start, bounds, dx, dy, a\.resizeMode, a\.initScale\)/);
  assert.match(coreSrc, /CPTextBoxGestures\.moveBox\(start, bounds, dx, dy\)/);
  assert.match(coreSrc, /CPTextBoxGestures\.isDrag\(dx, dy\)/);
});

test("a drag does not re-render the stage mid-gesture", () => {
  // Re-rendering replaces the element being dragged and kills the gesture.
  const moveStart = coreSrc.indexOf('document.addEventListener("pointermove"');
  const moveEnd = coreSrc.indexOf('const finish = () => {', moveStart);
  const moveHandler = coreSrc.slice(moveStart, moveEnd);
  assert.doesNotMatch(moveHandler, /cpSetLayerScale\(/, "the scale must be persisted on release, not per move");
  assert.match(moveHandler, /a\.textEl\.style\.fontSize/, "the font must be painted directly during the drag");
});

test("the gesture module runs in both Node and the browser (dual export)", () => {
  assert.ok(typeof g.resizeBox === "function");
  const src = fs.readFileSync(path.join(__dirname, "..", "public", "create", "textBoxGestures.js"), "utf8");
  assert.match(src, /root\.CPTextBoxGestures = api/);
  assert.match(src, /module\.exports = api/);
});
