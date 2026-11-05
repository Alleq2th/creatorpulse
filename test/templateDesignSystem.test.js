// Tests for the shared template design system and the server wiring that makes
// each template actually produce the look it was designed for.
//
// The regression these guard against: the server renderer never received the
// template id, so every template was painted with the same hardcoded palette,
// theme and 4-line text cap — which is why all ten templates came out looking
// like the same card.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const designSystem = require("../public/lib/designSystem.js");
const engine = require("../public/create/templateEngine.js");
const statCard = require("../services/statCard.js");

const statCardSrc = fs.readFileSync(path.join(__dirname, "..", "services", "statCard.js"), "utf8");
const cardsRouteSrc = fs.readFileSync(path.join(__dirname, "..", "routes", "cards.js"), "utf8");

test("design system resolves every template in the catalogue", () => {
  const ids = Object.keys(engine.TEMPLATES);
  assert.ok(ids.length >= 10, `expected at least 10 templates, got ${ids.length}`);
  ids.forEach(id => {
    const d = designSystem.resolve(id, { index: 0, total: 4 });
    assert.ok(d, `template ${id} must resolve`);
    assert.strictEqual(d.templateId, id);
    assert.ok(d.palette && d.palette.bg, `${id} must expose a background colour`);
    assert.ok(d.palette.accent, `${id} must expose an accent colour`);
    assert.ok(Object.keys(d.textBoxes).length > 0, `${id} must expose text boxes`);
  });
});

test("each template resolves to a DISTINCT palette (the core quality regression)", () => {
  // Before the fix every template rendered with the same palette. Assert the
  // templates are genuinely different from one another, not just non-empty.
  const seen = new Map();
  Object.keys(engine.TEMPLATES).forEach(id => {
    const d = designSystem.resolve(id, { index: 0, total: 4 });
    const key = `${d.palette.bg}|${d.palette.accent}`;
    assert.ok(!seen.has(key), `template ${id} shares its palette with ${seen.get(key)}`);
    seen.set(key, id);
  });
});

test("radial gradients parse into a structured descriptor (export parity)", () => {
  // dark_gradient uses radial-gradient. The canvas exporter only understood
  // linear-gradient, so the template's signature glow was silently dropped on
  // export while the browser preview showed it.
  const g = designSystem.parseGradient(
    "radial-gradient(circle at 50% 30%,rgba(99,102,241,.32),rgba(8,7,18,.9) 72%,#05040c)"
  );
  assert.strictEqual(g.kind, "radial");
  assert.strictEqual(g.stops.length, 3, "rgba() commas must not split a stop");
  assert.strictEqual(g.stops[0].color, "rgba(99,102,241,.32)");
  assert.strictEqual(g.stops[1].offset, 0.72);
  assert.strictEqual(g.stops[2].color, "#05040c");

  const d = designSystem.resolve("dark_gradient", { index: 0, total: 4 });
  assert.strictEqual(d.background.kind, "radial");
});

test("linear gradient angle is preserved", () => {
  const g = designSystem.parseGradient("linear-gradient(135deg,rgba(2,26,20,.78),rgba(1,15,11,.94))");
  assert.strictEqual(g.kind, "linear");
  assert.strictEqual(g.angle, 135);
  assert.strictEqual(g.stops.length, 2);
});

test("legacy theme keys map to real themes instead of silently defaulting", () => {
  // generate.js wrote "gradient" / "bold_accent", which are not theme names.
  // They fell through to modern_dark, so every card got the same background.
  assert.strictEqual(designSystem.normalizeTheme("gradient"), "modern_dark");
  assert.strictEqual(designSystem.normalizeTheme("bold_accent"), "cyber_neon");
  assert.strictEqual(designSystem.normalizeTheme("editorial_warm"), "editorial_warm");
  assert.strictEqual(designSystem.normalizeTheme(""), "modern_dark");
});

test("resolvePalette honours a legacy theme key rather than defaulting", () => {
  const viaLegacy = statCard.resolvePalette("noir_orange", "bold_accent");
  const viaReal = statCard.resolvePalette("noir_orange", "cyber_neon");
  assert.strictEqual(viaLegacy.backgroundStart, viaReal.backgroundStart);
  assert.strictEqual(viaLegacy.accent, viaReal.accent);
});

test("a template's own palette overrides the generic palette in the renderer", () => {
  const design = designSystem.resolve("neon_noir", { index: 0, total: 4 });
  const base = statCard.resolvePalette("noir_orange", "modern_dark");
  const merged = statCard.paletteFromDesign(design, base);
  assert.strictEqual(merged.accent, design.palette.accent);
  assert.notStrictEqual(merged.accent, base.accent, "template accent must win over the generic palette");
  assert.strictEqual(merged.backgroundStart, design.palette.bg);
});

test("carousel roles produce different compositions for cover, body and closing", () => {
  const cover = designSystem.resolve("impact", { index: 0, total: 4 });
  const body = designSystem.resolve("impact", { index: 1, total: 4 });
  assert.strictEqual(cover.role, "cover");
  assert.strictEqual(body.role, "body");
  assert.notDeepStrictEqual(cover.layout, body.layout, "cover and body must not share a layout");
});

test("a tall template box allows more headline lines than the old fixed cap", () => {
  // The server used to force 3-4 lines on every template, chopping headlines.
  const d = designSystem.resolve("impact", { index: 0, total: 4 });
  assert.ok(d.textBoxes.headline.maxLines >= 4, "a tall box must allow at least 4 lines");
  assert.strictEqual(designSystem.maxLinesForBox({ height: 0.3 }, 4), 4);
  assert.ok(designSystem.maxLinesForBox({ height: 0.6 }, 4) > 4);
});

test("image treatment maps to a frame both renderers can use", () => {
  assert.strictEqual(designSystem.imageFrameFor({ mode: "fullBleed" }).width, 1);
  assert.strictEqual(designSystem.imageFrameFor({ mode: "panel" }).height, 0.42);
  assert.strictEqual(designSystem.imageFrameFor({ mode: "split" }).x, 0.52);
  const d = designSystem.resolve("editorial", { index: 0, total: 4 });
  assert.strictEqual(d.image.mode, "panel");
});

test("services/statCard.js resolves the template and threads it into the renderers", () => {
  assert.match(statCardSrc, /designSystem\.resolve\(templateId/);
  assert.match(statCardSrc, /paletteFromDesign\(design, basePalette\)/);
  assert.match(statCardSrc, /renderHookSVG\(p, f, slide, cat, scrimStrength, typo, design\)/);
  assert.match(statCardSrc, /renderBodySVG\(p, f, slide, cat, scrimStrength, typo, design\)/);
  assert.match(statCardSrc, /renderOutroSVG\(p, f, slide, cat, scrimStrength, typo, design\)/);
});

test("services/statCard.js draws the template's own gradient and decoration", () => {
  assert.match(statCardSrc, /function templateGradientDefs/);
  assert.match(statCardSrc, /function templateDecoration/);
  assert.match(statCardSrc, /function templateBackgroundLayer/);
  assert.match(statCardSrc, /backgroundLayer\(p, f, scrimStrength, "hook", design\)/);
  // Every decoration type the catalogue declares must be drawable.
  const types = new Set(Object.values(engine.TEMPLATES).map(t => (t.decoration || {}).type));
  types.forEach(type => {
    if (type === "none") return;
    assert.ok(
      statCardSrc.includes(`case "${type}"`),
      `decoration type "${type}" is declared by a template but not drawn by the renderer`
    );
  });
});

test("routes/cards.js forwards templateId and platform to the renderer", () => {
  assert.match(cardsRouteSrc, /templateId, platform \} = req\.body/);
  assert.match(cardsRouteSrc, /renderCardSet\(capped, category, palette, format, imageUrl, \{[^}]*templateId, platform \}\)/);
});

test("the design system is loaded in the browser before core.js", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const designAt = html.indexOf('src="lib/designSystem.js');
  const coreAt = html.indexOf('src="core.js');
  assert.ok(designAt > -1, "index.html must load lib/designSystem.js");
  assert.ok(designAt < coreAt, "designSystem.js must load before core.js");
});

test("the design system runs in both Node and the browser (dual export)", () => {
  assert.ok(typeof designSystem.resolve === "function", "Node require must expose resolve");
  const src = fs.readFileSync(path.join(__dirname, "..", "public", "lib", "designSystem.js"), "utf8");
  assert.match(src, /root\.CPDesignSystem = api/, "browser global must be attached");
  assert.match(src, /module\.exports = api/, "Node export must be attached");
});
