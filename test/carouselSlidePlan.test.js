// Tests for the carousel slide planner and the numbered page chips.
//
// The regression these guard against: "on IG carousel, only one post is
// created". The generator asked the model for N slides and shipped whatever
// came back, so a short response collapsed the carousel to a single post.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const plan = require("../public/create/slidePlan.js");
const coreSrc = fs.readFileSync(path.join(__dirname, "..", "public", "core.js"), "utf8");
const cssSrc = fs.readFileSync(path.join(__dirname, "..", "public", "create", "carouselPages.css"), "utf8");

const HOOK = { type: "hook", headline: "The story everyone is talking about", supportingText: "Here is what actually happened." };
const SOURCE = "The team announced the change on Monday. Fans reacted within hours. Analysts expect a lasting effect on the league. The club has not commented further.";

test("a short model response is padded up to the requested slide count", () => {
  // The model returned ONE body slide when four were asked for.
  const out = plan.plan(HOOK, [{ headline: "Only one", body: "The model came up short." }], 4, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.strictEqual(out.slides.length, 4, "must produce exactly the requested number of slides");
  assert.strictEqual(out.requested, 4);
  assert.ok(out.padded > 0, "padding must be reported");
});

test("an empty model response still produces the full carousel", () => {
  const out = plan.plan(HOOK, [], 5, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.strictEqual(out.slides.length, 5);
  assert.strictEqual(out.slides[0].type, "hook");
});

test("an over-long model response is trimmed to the requested count", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ headline: `Slide ${i}`, body: `Body ${i}` }));
  const out = plan.plan(HOOK, many, 3, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.strictEqual(out.slides.length, 3);
  assert.ok(out.trimmed > 0, "trimming must be reported");
});

test("padding never invents facts — it reuses the story's own sentences", () => {
  const out = plan.plan(HOOK, [], 4, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  const filler = out.slides.filter(s => s._filler);
  assert.ok(filler.length > 0, "there must be filler slides");
  filler.forEach(s => {
    if (!s.body) return;
    assert.ok(SOURCE.includes(s.body), `filler body must come from the source text, got: ${s.body}`);
  });
});

test("a 1-slide request is a single post, not a carousel", () => {
  const out = plan.plan(HOOK, [{ headline: "Extra", body: "Extra body" }], 1, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.strictEqual(out.slides.length, 1);
  assert.strictEqual(out.slides[0].type, "hook");
});

test("6+ slides earns a dedicated closing slide; fewer folds the CTA in", () => {
  const short = plan.plan(HOOK, [], 4, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.ok(!short.slides.some(s => s.type === "outro"), "a 4-slide carousel must not spend a slide on the outro");
  assert.ok(short.slides[short.slides.length - 1].ctaLine, "the CTA must ride on the last body slide");

  const long = plan.plan(HOOK, [], 6, SOURCE, () => ({ type: "outro", headline: "Follow" }));
  assert.strictEqual(long.slides[long.slides.length - 1].type, "outro");
});

test("the slide count is clamped to a sane range", () => {
  assert.strictEqual(plan.clampCount(0), 1);
  assert.strictEqual(plan.clampCount(99), plan.MAX_SLIDES);
  assert.strictEqual(plan.clampCount("4"), 4);
  assert.strictEqual(plan.clampCount(undefined), 4);
});

test("page numbers are 1-based, mark the current slide, and cap the list", () => {
  const pages = plan.pageNumbers(5, 2);
  assert.deepStrictEqual(pages.map(p => p.label), ["1", "2", "3", "4", "5"]);
  assert.strictEqual(pages[2].active, true, "the third chip (index 2) must be active");
  assert.strictEqual(pages.filter(p => p.active).length, 1, "exactly one chip is active");
  assert.strictEqual(plan.pageNumbers(20, 0, 8).length, 8, "the chip list must be capped");
});

test("only an Instagram carousel is multi-slide", () => {
  assert.strictEqual(plan.isCarouselFormat("instagram", "IG Carousel"), true);
  assert.strictEqual(plan.isCarouselFormat("instagram", "IG Single Post"), false);
  assert.strictEqual(plan.isCarouselFormat("tiktok", "IG Carousel"), false);
  assert.strictEqual(plan.defaultSlideCount("instagram", "IG Carousel"), 4);
  assert.strictEqual(plan.defaultSlideCount("instagram", "IG Single Post"), 1);
});

test("core.js uses the planner to guarantee the carousel length", () => {
  assert.match(coreSrc, /window\.CPCreateSlidePlan\.plan\(hookSlide, rawSlides, requestedCount, sourceText/);
  // The old code shipped whatever the model returned on its final attempt.
  assert.doesNotMatch(coreSrc, /if \(slides\.length === wantCount \|\| attempt === 1\) return \{ parsed, slides \};/);
});

test("core.js renders numbered page chips under the carousel", () => {
  assert.match(coreSrc, /CPCreateSlidePlan\.pageNumbers\(totalSlides, sIdx\)/);
  assert.match(coreSrc, /class="cc-carousel-pages"/);
  assert.match(coreSrc, /class="cc-carousel-page\$\{p\.active \? " on" : ""\}"/);
});

test("the page chips are styled and tappable", () => {
  assert.match(cssSrc, /\.cc-carousel-pages\s*\{/);
  assert.match(cssSrc, /\.cc-carousel-page\s*\{/);
  assert.match(cssSrc, /\.cc-carousel-page\.on\s*\{/);
});

test("the slide planner runs in both Node and the browser (dual export)", () => {
  assert.ok(typeof plan.plan === "function");
  const src = fs.readFileSync(path.join(__dirname, "..", "public", "create", "slidePlan.js"), "utf8");
  assert.match(src, /root\.CPCreateSlidePlan = api/);
  assert.match(src, /module\.exports = api/);
});
