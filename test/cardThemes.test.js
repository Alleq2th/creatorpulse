// Card themes: each theme changes the look, never the content or the layout.
const test = require('node:test');
const assert = require('node:assert/strict');
const CT = require('../public/create/cardThemes.js');

const content = {
  headline: 'Lamar Jackson returns to full practice',
  supportingText: 'He took part in Wednesday full practice.',
  ctaLine: 'FOLLOW FOR MORE',
  bgImage: 'data:image/jpeg;base64,AAAA',
  bgName: 'photo.jpg',
  layerScale: { headline: 1.2 },
  textLayout: { headline: { x: 0.1, y: 0.2, width: 0.7, height: 0.2 } }
};

test('there are five style themes and eight colour themes, each with a unique id', () => {
  assert.equal(CT.STYLE_THEMES.length, 5);
  assert.equal(CT.COLOUR_THEMES.length, 8);
  const ids = [...CT.STYLE_THEMES, ...CT.COLOUR_THEMES].map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every theme colour is a 6-digit hex value', () => {
  for (const t of [...CT.STYLE_THEMES, ...CT.COLOUR_THEMES]) {
    assert.ok(CT.isHex(t.textColor), `${t.id} textColor`);
    assert.ok(CT.isHex(t.accent), `${t.id} accent`);
  }
});

test('a style theme sets type, text colour, dim and accent', () => {
  const out = CT.applyTheme(content, 'electric');
  assert.equal(out.typography, 'impact');
  assert.equal(out.textColor, '#FFFFFF');
  assert.equal(out.dim, 0.35);
  assert.equal(out.layerColors.ctaLine, '#00E5FF');
  assert.equal(out.themeId, 'electric');
});

test('applying a style theme keeps headline, supporting text, CTA, photo and positions', () => {
  const out = CT.applyTheme(content, 'sports_broadcast');
  assert.equal(out.headline, content.headline);
  assert.equal(out.supportingText, content.supportingText);
  assert.equal(out.ctaLine, content.ctaLine);
  assert.equal(out.bgImage, content.bgImage);
  assert.equal(out.bgName, content.bgName);
  assert.deepEqual(out.textLayout, content.textLayout);
  assert.deepEqual(out.layerScale, content.layerScale);
});

test('a style theme clears per-text fonts so the whole graphic follows the theme', () => {
  const styled = { ...content, layerFonts: { headline: 'code_mono' } };
  assert.deepEqual(CT.applyTheme(styled, 'minimal').layerFonts, {});
});

test('a colour theme changes colours only, not type, dim or content', () => {
  const styled = { ...content, typography: 'editorial_serif', dim: 0.6, layerFonts: { headline: 'code_mono' } };
  const out = CT.applyColourTheme(styled, 'red_white');
  assert.equal(out.textColor, '#FFFFFF');
  assert.equal(out.layerColors.ctaLine, '#E10600');
  assert.equal(out.typography, 'editorial_serif');
  assert.equal(out.dim, 0.6);
  assert.deepEqual(out.layerFonts, { headline: 'code_mono' });
  assert.equal(out.headline, content.headline);
  assert.equal(out.colourThemeId, 'red_white');
});

test('unknown theme ids return null and do not change anything', () => {
  assert.equal(CT.applyTheme(content, 'nope'), null);
  assert.equal(CT.applyColourTheme(content, 'nope'), null);
});

test('restore returns the look from before the first theme, even after several picks', () => {
  const first = CT.applyTheme(content, 'electric');
  const second = CT.applyColourTheme(CT.applyTheme(first, 'classic_magazine'), 'purple_white');
  const back = CT.restore(second);
  assert.equal(back.restored, true);
  assert.equal(back.style.typography, undefined);
  assert.equal(back.style.textColor, undefined);
  assert.equal(back.style.themeId, undefined);
  assert.equal(back.style.headline, content.headline);
  assert.equal(back.style._themeBase, undefined);
});

test('restore reports nothing to restore when no theme was ever applied', () => {
  const res = CT.restore(content);
  assert.equal(res.restored, false);
  assert.equal(res.style.headline, content.headline);
});

test('applying does not mutate the input style', () => {
  const before = JSON.stringify(content);
  CT.applyTheme(content, 'dark_editorial');
  CT.applyColourTheme(content, 'black_gold');
  assert.equal(JSON.stringify(content), before);
});

test('preview returns the look a tile should show', () => {
  assert.equal(CT.preview('style', 'classic_magazine').typography, 'classic_serif');
  const c = CT.preview('colour', 'black_gold', { typography: 'code_mono', dim: 0.3 });
  assert.equal(c.typography, 'code_mono');
  assert.equal(c.dim, 0.3);
  assert.equal(CT.preview('style', 'missing'), null);
});
