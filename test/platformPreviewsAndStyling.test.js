const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const statCard = require("../services/statCard");
const coreJs = fs.readFileSync(path.join(__dirname, "../public/core.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
const cardsRoute = fs.readFileSync(path.join(__dirname, "../routes/cards.js"), "utf8");

test("services/statCard.js provides theme, typography, and density presets", () => {
  assert.ok(statCard.THEMES, "THEMES should be defined");
  assert.ok(statCard.TYPOGRAPHIES, "TYPOGRAPHIES should be defined");
  assert.ok(statCard.DENSITIES, "DENSITIES should be defined");

  assert.ok(statCard.THEMES.modern_dark, "modern_dark theme should exist");
  assert.ok(statCard.THEMES.clean_light, "clean_light theme should exist");
  assert.ok(statCard.THEMES.cyber_neon, "cyber_neon theme should exist");
  assert.ok(statCard.THEMES.editorial_warm, "editorial_warm theme should exist");

  assert.ok(statCard.TYPOGRAPHIES.impact, "impact typography should exist");
  assert.ok(statCard.TYPOGRAPHIES.modern_sans, "modern_sans typography should exist");
  assert.ok(statCard.TYPOGRAPHIES.editorial_serif, "editorial_serif typography should exist");
  assert.ok(statCard.TYPOGRAPHIES.code_mono, "code_mono typography should exist");

  assert.ok(statCard.DENSITIES.punchy, "punchy density should exist");
  assert.ok(statCard.DENSITIES.balanced, "balanced density should exist");
  assert.ok(statCard.DENSITIES.detailed, "detailed density should exist");
});

test("services/statCard.js resolves palette according to theme", () => {
  const pLight = statCard.resolvePalette("noir_orange", "clean_light");
  assert.equal(pLight.isLight, true);
  assert.equal(pLight.primaryText, "#111216");
  assert.equal(pLight.accent, statCard.PALETTE.noir_orange.accent);

  const pDark = statCard.resolvePalette("noir_orange", "modern_dark");
  assert.equal(pDark.backgroundStart, "#08090C");
});

test("services/statCard.js scales dimensions according to density", () => {
  const fPunchy = statCard.resolveFormat("instagram", "punchy");
  const fBalanced = statCard.resolveFormat("instagram", "balanced");
  const fDetailed = statCard.resolveFormat("instagram", "detailed");

  assert.ok(fPunchy.hookHeadlineSize > fBalanced.hookHeadlineSize, "punchy headline should be larger than balanced");
  assert.ok(fBalanced.hookHeadlineSize > fDetailed.hookHeadlineSize, "balanced headline should be larger than detailed");
  assert.ok(fDetailed.bodyTextChars > fBalanced.bodyTextChars, "detailed should fit more chars per line");
});

test("routes/cards.js forwards theme, typography, and density to renderCardSet", () => {
  assert.match(cardsRoute, /const\s*\{\s*slides,\s*category,\s*palette,\s*format,\s*imageUrl,\s*theme,\s*typography,\s*density,\s*focalPoint,\s*brand(?:,\s*plateOnly)?\s*\}\s*=\s*req\.body/);
  assert.match(cardsRoute, /renderCardSet\(\s*capped,\s*category,\s*palette,\s*format,\s*imageUrl,\s*\{\s*theme,\s*typography,\s*density,\s*focalPoint,\s*brand(?:,\s*plateOnly(?::\s*plateOnly\s*===\s*true)?)?\s*\}\s*\)/);
});

test("core.js exposes theme, typography, and density controls in the generator", () => {
  assert.match(coreJs, /CARD_THEMES/);
  assert.match(coreJs, /CARD_TYPOGRAPHIES/);
  assert.match(coreJs, /CARD_DENSITIES/);
  assert.match(coreJs, /window\.setCardTheme\s*=/);
  assert.match(coreJs, /window\.setCardTypography\s*=/);
  assert.match(coreJs, /window\.setCardDensity\s*=/);
  assert.match(coreJs, /generateCardsWithRetry\(\{[\s\S]*?theme:[^,]+,[\s\S]*?typography:[^,]+,[\s\S]*?density:[^,]+,[\s\S]*?\}\)/);
});

test("core.js includes dedicated generation rules for Instagram, TikTok, YouTube, and X", () => {
  // YouTube rules
  assert.match(coreJs, /Long-Form YouTube Video Script|Long Form Script/i);
  assert.match(coreJs, /INFINITE LOOP/i, "YouTube Shorts must include infinite loop technique");
  assert.match(coreJs, /YouTube Video Titles, Description/i);
  assert.match(coreJs, /YouTube Thumbnail/i);

  // Instagram rules
  assert.match(coreJs, /Instagram Reel/i);
  assert.match(coreJs, /Caption\s*\+\s*Hashtags/i);

  // TikTok rules
  assert.match(coreJs, /TikTok script/i);

  // X rules
  assert.match(coreJs, /5-tweet thread/i);
  assert.match(coreJs, /hot take tweet/i);
  assert.match(coreJs, /engagement question\/poll tweet/i);
});

test("core.js and index.html support responsive previews for Instagram, TikTok, YouTube, and X", () => {
  assert.match(coreJs, /window\.setPreviewPlat\s*=/);
  assert.match(coreJs, /renderPlatformMockup/);
  assert.match(coreJs, /mock-ig/);
  assert.match(coreJs, /mock-tt/);
  assert.match(coreJs, /mock-yt/);
  assert.match(coreJs, /mock-x/);

  assert.match(indexHtml, /\.mock-shell/);
  assert.match(indexHtml, /\.mock-ig/);
  assert.match(indexHtml, /\.mock-tt/);
  assert.match(indexHtml, /\.mock-yt/);
  assert.match(indexHtml, /\.mock-x/);
});
