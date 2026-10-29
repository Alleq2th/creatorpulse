// Per-layer font, colour and size, and the photo dim, for generated cards.
const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { renderStatCard } = require('../services/statCard');

const base = {
  headline: 'Lamar Jackson returns to full practice',
  supportingText: 'He took part in Wednesday full practice after the ankle injury.',
  ctaLine: 'FOLLOW FOR MORE',
  totalSlides: 1, slideNumber: 1, type: 'hook'
};
const OPTS = { typography: 'impact' };
const photo = async () => 'data:image/png;base64,' + (await sharp({
  create: { width: 1080, height: 1920, channels: 3, background: { r: 230, g: 230, b: 230 } }
}).png().toBuffer()).toString('base64');

async function meanBrightness(buf) {
  const { data, info } = await sharp(buf).resize(180, 320, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += info.channels) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  return sum / (data.length / info.channels);
}

test('a per-layer colour, font or size changes the rendered card', async () => {
  const plain = await renderStatCard({ ...base }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const styled = await renderStatCard({
    ...base, layerColors: { headline: '#ff0000' }, layerFonts: { headline: 'code_mono' }, layerScale: { headline: 1.3 }
  }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  assert.ok(!plain.equals(styled), 'layer styling must change the image');
});

test('invalid layer values fall back to the card look instead of breaking the render', async () => {
  const plain = await renderStatCard({ ...base }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const junk = await renderStatCard({
    ...base, layerColors: { headline: 'red; drop' }, layerFonts: { headline: 'not_a_font' }, layerScale: { headline: 'huge' }
  }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  assert.ok(plain.equals(junk), 'bad values must be ignored');
});

test('the dim control darkens the photo behind the text', async () => {
  const src = await photo();
  const none = await renderStatCard({ ...base, dim: 0, customImage: src }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const heavy = await renderStatCard({ ...base, dim: 0.6, customImage: src }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const a = await meanBrightness(none), b = await meanBrightness(heavy);
  assert.ok(b < a - 15, `dimmed photo should be clearly darker (${a.toFixed(1)} -> ${b.toFixed(1)})`);
});

test('dim is capped so a bad value cannot blank the photo', async () => {
  const src = await photo();
  const out = await renderStatCard({ ...base, dim: 99, customImage: src }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const { info } = await sharp(out).metadata().then(m => ({ info: m }));
  assert.ok(info.width > 0 && info.height > 0);
  assert.ok((await meanBrightness(out)) > 20, 'the photo must still be visible at the 0.8 cap');
});
