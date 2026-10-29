// Plate mode: the card background without any text, so the browser can draw live text on top.
const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { renderStatCard } = require('../services/statCard');

const slide = { headline: 'Lamar Jackson returns to full practice', supportingText: 'He took part in full practice.', ctaLine: 'FOLLOW FOR MORE', totalSlides: 1, slideNumber: 1, type: 'hook' };
const OPTS = { typography: 'impact' };
const grey = async (v) => 'data:image/png;base64,' + (await sharp({ create: { width: 1080, height: 1920, channels: 3, background: { r: v, g: v, b: v } } }).png().toBuffer()).toString('base64');

async function stats(buf) {
  const { data, info } = await sharp(buf).resize(240, 427, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, min = 255, max = 0, n = data.length / info.channels;
  for (let i = 0; i < data.length; i += info.channels) { const v = data[i]; sum += v; if (v < min) min = v; if (v > max) max = v; }
  return { mean: sum / n, min, max, width: info.width, height: info.height };
}

test('plate has no text: a flat photo stays flat', async () => {
  const plate = await renderStatCard({ ...slide, customImage: await grey(230), plateOnly: true }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const s = await stats(plate);
  assert.ok(s.max - s.min <= 2, `expected a flat plate, got range ${s.max - s.min}`);
});

test('plate keeps the card size', async () => {
  const plate = await renderStatCard({ ...slide, customImage: await grey(200), plateOnly: true }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const m = await sharp(plate).metadata();
  assert.equal(m.width, 1080);
  assert.equal(m.height, 1920);
});

test('plate applies the dim the same way as the full card', async () => {
  const src = await grey(230);
  const plate = await renderStatCard({ ...slide, customImage: src, dim: 0.5, plateOnly: true }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const s = await stats(plate);
  assert.ok(Math.abs(s.mean - 115) < 6, `230 dimmed by 50% should be near 115, got ${s.mean.toFixed(1)}`);
});

test('plate without a photo is the palette gradient', async () => {
  const plate = await renderStatCard({ ...slide, plateOnly: true }, 'NFL', 'noir_orange', 'tiktok', null, OPTS);
  const s = await stats(plate);
  assert.ok(s.mean < 40, 'dark palette background expected');
});
