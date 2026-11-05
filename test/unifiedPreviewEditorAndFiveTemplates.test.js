const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const core = fs.readFileSync(path.join(root, "public/core.js"), "utf8");
const steps = fs.readFileSync(path.join(root, "public/create/steps.js"), "utf8");
const css = fs.readFileSync(path.join(root, "public/create/create.css"), "utf8");

test("tone step renders strictly the 5 original Instagram and 5 original TikTok templates", () => {
  const igExpected = ["impact", "editorial", "stat_split", "dark_gradient", "neon_noir"];
  const ttExpected = ["viral_hook", "silent_camera", "quote_punch", "minimal_noir", "high_retention"];

  igExpected.forEach(id => assert.ok(steps.includes("id: '" + id + "'"), "missing IG template: " + id));
  ttExpected.forEach(id => assert.ok(steps.includes("id: '" + id + "'"), "missing TikTok template: " + id));

  // Renders platform-scoped radio group cards
  assert.match(steps, /var tmpls = st\.platform === 'tiktok' \? TEMPLATES_TT : TEMPLATES_IG;/);
  assert.match(steps, /class="cc-templates-grid"/);
  assert.match(steps, /onclick="cpCreateSetTemplate/);
});

test("platform mockup directly embeds the live editable card stage with no duplicate card", () => {
  // renderCardLiveStage is embedded inside mockups
  assert.match(core, /function renderCardLiveStage\(/);
  assert.match(core, /isCardGraphic \? renderCardLiveStage\(o, tid, idx, exportSi, activeSlideObj, "4\/5"\) : imgEl/);
  assert.match(core, /isCardGraphic\s*\?\s*renderCardLiveStage\(o, tid, idx, exportSi, activeSlideObj, "9\/16"\)/);

  // renderOut passes controlsOnly: true so no second stage is created below mockup
  assert.match(core, /renderCardCanvasEditor\(o,tid,idx,0,[\s\S]*?controlsOnly:\s*true/);
  assert.match(core, /renderCardCanvasEditor\(o,tid,idx,si,s,s\.img,"4\/5",\s*\{\s*controlsOnly:\s*true\s*\}\)/);
});

test("carousel provides integrated slide tabs right below phone mockup", () => {
  assert.match(core, /class="cc-carousel-bar"/);
  assert.match(core, /class="cc-carousel-tabs"/);
  assert.match(core, /class="cc-slide-tab/);
  assert.match(core, /onclick="setPreviewSlide\('\$\{prevKey\}',\$\{i\}\)"/);
  assert.match(css, /\.cc-carousel-bar\{/);
  assert.match(css, /\.cc-slide-tab\.on\{/);
});

test("text context toolbar provides Font, Size, Color, and in-place Edit", () => {
  assert.match(core, /data-cp-ctx-kind="font"/);
  assert.match(core, /data-cp-ctx-kind="size"/);
  assert.match(core, /data-cp-ctx-kind="color"/);
  assert.match(core, /onclick="cpTriggerTextEdit/);
  assert.match(core, /window\.cpSetLayerScale\s*=/);
  assert.match(core, /window\.cpAdjustLayerScale\s*=/);
  assert.match(css, /\.cc-ctx-size-panel\{/);
});

test("background controls feature 0-100% dimming and blurring with live numeric readouts and tick buttons", () => {
  assert.match(core, /id="dim-val-\$\{tid\}-\$\{idx\}-\$\{slideIndex\}"/);
  assert.match(core, /window\.cpSetCardDimVal\s*=/);
  assert.match(core, /id="blur-val-\$\{tid\}-\$\{idx\}-\$\{slideIndex\}"/);
  assert.match(core, /window\.cpSetCardBlurPct\s*=/);
  assert.match(css, /\.cc-bg-val\{/);
  assert.match(css, /\.cc-bg-ticks\{/);
  assert.match(css, /\.cc-bg-tick\{/);
});

test("background controls support solid colors and two-color gradients with presets and export support", () => {
  assert.match(core, /window\.cpSetCardBgColor\s*=/);
  assert.match(core, /window\.cpSetCardGradientColor\s*=/);
  assert.match(core, /window\.cpApplyGradientPreset\s*=/);
  assert.match(core, /linear-gradient\(\$\{angle\}deg, \$\{color1\}, \$\{color2\}\)/);
  assert.match(css, /\.cc-bg-color-swatches\{/);
  assert.match(css, /\.cc-bg-grad-presets\{/);
});

test("resizing block with touch or mouse updates layer scale live", () => {
  // The resize maths now lives in the shared, unit-tested gesture module
  // (public/create/textBoxGestures.js) and the handler applies its result.
  // The guarantee is unchanged: a resize gesture must update the layer scale.
  assert.match(core, /CPTextBoxGestures\.resizeBox\(/);
  assert.match(core, /cpSetLayerScale\(stage\.dataset\.tid, Number\(stage\.dataset\.idx\), Number\(stage\.dataset\.slideIndex\), a\.block\.dataset\.canvasBlock, a\.scale\)/);
  const gestures = require("../public/create/textBoxGestures.js");
  const out = gestures.resizeBox({ left: 0, top: 0, width: 200, height: 100 }, { width: 400, height: 400 }, 0, 50, "vertical", 1);
  assert.ok(out.scale > 1, "a vertical drag must grow the text scale");
});
