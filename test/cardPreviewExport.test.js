// Tests for the card preview/export fixes.
//
// Each test pins one root cause, so a regression fails loudly instead of
// quietly bringing back a blob, a half-height TikTok card, a dashed outline in
// a download, or a preview that disagrees with the export.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const layout = await import('../public/lib/cardLayout.js');
const L = layout.default || layout;

const core = read('public/core.js');
const html = read('public/index.html');
const sw = read('public/sw.js');
const createCss = read('public/create/create.css');
const steps = read('public/create/steps.js');

const slide = {
  type: 'hook',
  headline: 'A headline long enough to wrap onto several lines of text',
  supportingText: 'Supporting text that explains the story in a sentence or two.',
  ctaLine: 'FOLLOW FOR MORE',
  slideNumber: 1,
  totalSlides: 1
};

// ── 1. The giant coloured blob ───────────────────────────────────────────────
test('a badge decoration is pill-sized, never a full-card block', () => {
  const d = L.decorationGeometry({ type: 'badge', text: 'HOOK', accent: '#22d3ee' }, { width: 1080, height: 1920 }, 'tiktok');
  const area = (d.width * d.height) / (1080 * 1920);
  assert.ok(area < 0.05, `badge covers ${(area * 100).toFixed(1)}% of the card — that is the blob`);
  assert.ok(d.height < 1920 * 0.1, 'badge height must stay a pill, not a column');
  assert.equal(d.radius, Math.round(d.height / 2), 'badge is a pill (radius = half its height)');
});

test('a badge stays pill-sized even with a very long label', () => {
  const d = L.decorationGeometry({ type: 'badge', text: 'A VERY LONG BADGE LABEL THAT SHOULD NOT BECOME A BANNER' }, { width: 1080, height: 1920 }, 'instagram');
  assert.ok(d.width <= 1080 * 0.46 + 1, 'badge width is clamped');
  assert.ok(d.height <= 1920 * 0.062 + 1, 'badge height is clamped');
});

test('the preview paints the badge from card pixels, not from the container', () => {
  const paint = read('public/lib/cardPaint.js');
  assert.match(paint, /pct\(d\.width, W\)/, 'badge width comes from the resolved card geometry');
  assert.match(paint, /maxWidth:\s*pct\(d\.width, W\)/, 'badge width is the resolved card width, not a container percentage');
  assert.match(paint, /maxHeight:\s*pct\(d\.height, H\)/, 'badge height is the resolved card height');
  // The old bug: inset:0 plus left/top stretched the element to the whole card.
  const decoFn = paint.slice(paint.indexOf('function paintDecoration'), paint.indexOf('function paintScrim'));
  assert.doesNotMatch(decoFn, /inset:\s*['"]?0/, 'the decoration must not be positioned with inset:0');
});

// ── 2. TikTok layout ─────────────────────────────────────────────────────────
test('the TikTok card fills the 9:16 frame instead of half of it', () => {
  assert.match(html, /\.mock-tt-shell\s*\{[^}]*position:\s*relative/, 'the TikTok shell is the positioning context');
  assert.match(html, /\.mock-tt-shell > \.cc-live-stage[\s\S]{0,200}position:\s*absolute/, 'the card is absolutely positioned in the frame');
  assert.match(html, /\.mock-tt-shell > \.cc-live-stage[\s\S]{0,300}height:\s*100%/, 'the card fills the frame height');
  // The old bug: a column flexbox with space-between shrank the card.
  assert.doesNotMatch(html, /\.mock-tt-shell\s*\{[^}]*justify-content:\s*space-between/, 'the shell must not shrink the card with space-between');
});

test('TikTok text stays inside the safe zones (clear of the rail and caption)', () => {
  const z = L.safeZone('tiktok');
  assert.ok(z.right >= 0.15, 'the right action rail is reserved');
  assert.ok(z.bottom >= 0.15, 'the bottom caption area is reserved');
  for (const key of ['headline', 'supportingText', 'ctaLine']) {
    const d = L.resolve({ templateId: 'viral_hook', platform: 'tiktok', slide, index: 0, total: 1, style: {} });
    const box = d.layers.find(l => l.key === key).box;
    assert.ok(box.x >= z.left - 1e-9, `${key} starts inside the left edge`);
    assert.ok(box.y >= z.top - 1e-9, `${key} starts below the top edge`);
    assert.ok(box.x + box.width <= 1 - z.right + 1e-9, `${key} ends before the action rail`);
    assert.ok(box.y + box.height <= 1 - z.bottom + 1e-9, `${key} ends above the caption`);
  }
});

test('a box that is too wide is shrunk into the safe zone, not just moved', () => {
  const box = L.clampToSafeZone({ x: 0.08, y: 0.3, width: 0.84, height: 0.24 }, 'tiktok');
  assert.ok(box.width <= 1 - 0.06 - 0.2 + 1e-9, 'width is clamped to the safe zone');
  assert.ok(box.x + box.width <= 1 - 0.2 + 1e-9, 'the whole box ends before the rail');
});

// ── 3. Preview vs export ─────────────────────────────────────────────────────
test('preview and export read the same resolved layout', () => {
  assert.match(core, /window\.CPCardLayout\?\.resolve\(/, 'core.js resolves the shared layout');
  assert.match(core, /function cpLiveTextStyle[\s\S]{0,600}CPCardLayout/, 'the preview text style comes from the shared layout');
  assert.match(core, /function cpGetDesignState[\s\S]{0,2000}CPCardLayout\?\.resolve/, 'the export design state comes from the shared layout');
  assert.match(core, /function cpDrawTextBox[\s\S]{0,600}CPCardLayout\.wrapLines/, 'the export wraps with the shared algorithm');
});

test('the export uses the template line height, not a hardcoded 1.05', () => {
  assert.match(core, /const lineH = px \* \(Number\(l\.lineHeight\) \|\| 1\.1\)/, 'line height comes from the layout');
  assert.doesNotMatch(core, /const lineH = px \* 1\.05/, 'the old hardcoded line height is gone');
});

test('the shared wrapper breaks lines the same way for any measure function', () => {
  const measure = (s) => s.length * 10; // 10px per character
  const lines = L.wrapLines(measure, 'one two three four five six', 100);
  assert.ok(lines.length > 1, 'long text wraps');
  for (const line of lines) assert.ok(measure(line) <= 100, `"${line}" fits the box`);
  assert.equal(lines.join(' '), 'one two three four five six', 'no words are lost');
});

test('a single word wider than the box breaks instead of overflowing', () => {
  const measure = (s) => s.length * 10;
  const lines = L.wrapLines(measure, 'supercalifragilistic', 50);
  assert.ok(lines.length > 1, 'the long word is broken');
  for (const line of lines) assert.ok(measure(line) <= 50, 'every chunk fits');
});

// ── 4. Download ──────────────────────────────────────────────────────────────
test('a font that has not arrived does not fail the download', () => {
  assert.doesNotMatch(core, /throw new Error\(`Selected font did not load/, 'a late font must not throw');
  assert.match(core, /font fell back to a system face/, 'a fallback is logged clearly');
  assert.match(core, /drawing with fallback fonts/, 'the export says which fonts fell back');
});

test('the download waits for the photo plate instead of failing on a null snapshot', () => {
  assert.match(core, /async function cpFlushExport[\s\S]{0,400}await cpWaitForPlate/, 'the flush waits for the plate');
  assert.match(core, /function cpWaitForPlate/, 'there is a plate wait helper');
  assert.match(core, /\[card download\] export failed/, 'a real failure is logged with its reason');
});

// ── 5. Text boxes and overlap ────────────────────────────────────────────────
test('dashed outlines and resize handles are hidden in the preview', () => {
  assert.match(html, /\.cc-live-stage \.cp-canvas-block\{border:0/, 'the preview block has no border');
  assert.match(html, /\.cc-live-stage \.cp-canvas-label,[\s\S]{0,120}display:none/, 'labels are hidden in the preview');
  assert.match(html, /\.cc-live-stage\.is-editing \.cp-canvas-block\{border:1px dashed/, 'the dashed outline is edit-mode only');
});

test('an empty slot is not drawn in the preview or the export', () => {
  assert.match(html, /\.cc-live-stage \.cp-canvas-block\.is-empty\{display:none\}/, 'empty slots are hidden in the preview');
  assert.match(core, /if \(!l \|\| !l\.text \|\| l\.empty\) return;/, 'empty layers are skipped in the export');
  assert.match(core, /if \(l\.text && !l\.empty\) cpDrawTextBox/, 'the export loop skips empty layers');
});

test('the placeholder label never reaches the preview text', () => {
  const d = L.resolve({ templateId: 'viral_hook', platform: 'tiktok', slide: { ...slide, supportingText: '' }, index: 0, total: 1, style: {} });
  const layer = d.layers.find(l => l.key === 'supportingText');
  assert.equal(layer.empty, true, 'the empty layer is flagged');
  assert.equal(layer.displayText, '', 'no placeholder text is produced');
});

// ── 6. Readability over photos ───────────────────────────────────────────────
test('a dark scrim is drawn behind the text in both preview and export', () => {
  const d = L.resolve({ templateId: 'viral_hook', platform: 'tiktok', slide, index: 0, total: 1, style: {} });
  assert.ok(d.scrim.stops.length >= 2, 'the scrim has gradient stops');
  const last = d.scrim.stops[d.scrim.stops.length - 1].color;
  const alpha = Number(last.match(/rgba\(0,0,0,([\d.]+)\)/)[1]);
  assert.ok(alpha >= 0.5, `the scrim is dark enough at the bottom (alpha ${alpha})`);
  assert.match(core, /function cpDrawScrim/, 'the export paints the scrim');
  // The call must be inside the compose function, before the text layers.
  const compose = core.slice(core.indexOf('function cpComposeCard'), core.indexOf('function cpDrawDecoration'));
  assert.match(compose, /cpDrawScrim\(ctx, design, W, H\)/, 'the export calls the scrim painter before drawing text');
  assert.ok(compose.indexOf('cpDrawScrim') < compose.indexOf('cpDrawTextBox'), 'the scrim is painted under the text');
  assert.match(html, /\.cc-live-scrim\{position:absolute;inset:0;z-index:1/, 'the preview has a scrim layer');
});

// ── 7. Theme picker ──────────────────────────────────────────────────────────
test('theme tiles use the real layout, not a centred black box', () => {
  const preview = read('public/lib/themePreview.js');
  assert.match(preview, /CPCardLayout/, 'tiles resolve the shared layout');
  assert.match(preview, /cc-th-layer/, 'tiles place real text layers');
  assert.match(preview, /cc-th-scrim/, 'tiles draw the real scrim');
  assert.doesNotMatch(preview, /-webkit-line-clamp|text-overflow:\s*ellipsis/, 'tiles do not truncate the supporting text');
  assert.match(core, /CPThemePreview\?\.tileHTML/, 'the gallery uses the shared tile builder');
});

// ── 8. Template-flow tiles ───────────────────────────────────────────────────
test('template tiles are mini previews of the real template', () => {
  assert.match(steps, /function templateThumb/, 'there is a real thumbnail builder');
  assert.match(steps, /CPCardLayout/, 'it uses the shared layout');
  assert.match(steps, /cc-template-layer/, 'it places real text layers');
  assert.match(steps, /cc-template-badge-pill/, 'it draws the real badge');
  assert.match(createCss, /\.cc-template-thumb-live\s*\{[\s\S]{0,300}container-type:\s*inline-size/, 'the tile is a size container for cqw sizing');
});

// ── Cache busting ────────────────────────────────────────────────────────────
test('core.js and the service worker cache are bumped together', () => {
  assert.match(html, /core\.js\?v=63/);
  assert.match(sw, /creatorpulse-v42/);
  assert.match(html, /lib\/cardLayout\.js\?v=3/, 'the shared layout facade is loaded');
  assert.match(html, /lib\/cardPaint\.js\?v=2/, 'the new painter is loaded');
  assert.match(html, /lib\/themePreview\.js\?v=1/, 'the new theme preview is loaded');
  // The design system loads in dependency order, before core.js reads it.
  assert.match(html, /lib\/cardTypography\.js\?v=1/, 'typography is loaded');
  assert.match(html, /lib\/cardTemplates\.js\?v=1/, 'the template specs are loaded');
  assert.match(html, /lib\/photoTreatments\.js\?v=1/, 'the photo treatments are loaded');
  assert.match(html, /lib\/cardLayoutEngine\.js\?v=1/, 'the layout engine is loaded');
  assert.match(html, /lib\/cardEditor\.js\?v=1/, 'the editor is loaded');
  assert.ok(html.indexOf('lib/cardLayoutEngine.js') < html.indexOf('core.js?v=63'), 'the engine loads before core.js');
});

// ── Plus AI must not be broken ───────────────────────────────────────────────
test('the Plus AI files are untouched by the card fixes', () => {
  const ui = read('public/plus-ai/ui.js');
  const cards = read('public/plus-ai/cards.js');
  assert.ok(ui.length > 0 && cards.length > 0, 'the Plus AI files still exist');
  assert.doesNotMatch(ui, /CPCardLayout/, 'Plus AI does not depend on the new card layout');
});
