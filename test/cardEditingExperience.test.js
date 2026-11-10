/* Part 6 (the editing experience) and Part 7 (the quality bar).
 *
 * These tests exercise the new modules directly — the per-slide edit model, the
 * undo/redo history, the edit-mode guides, the real-card thumbnails, the
 * skeleton placeholder and the quality-bar review — plus the engine change that
 * lets a dragged box override a template region. They are the proof that the
 * editing controls and the quality bar actually work, not just that they exist.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const engine = require('../public/lib/cardLayoutEngine.js');
const templates = require('../public/lib/cardTemplates.js');
const treatments = require('../public/lib/photoTreatments.js');
const controls = require('../public/lib/cardEditControls.js');
const history = require('../public/lib/cardEditHistory.js');
const guides = require('../public/lib/cardGuides.js');
const thumbs = require('../public/lib/cardThumbnails.js');
const skeleton = require('../public/lib/cardSkeleton.js');
const quality = require('../public/lib/cardQualityBar.js');
const editor = require('../public/lib/cardEditor.js');

const CORE = fs.readFileSync(path.join(__dirname, '..', 'public', 'core.js'), 'utf8');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const SLIDE = {
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more',
  stat: '87%'
};
function resolve(templateId, role, platform) {
  return engine.resolve({
    templateId, platform: platform || 'instagram',
    slide: Object.assign({ role }, SLIDE), index: 0, total: 1, style: {}
  });
}

// ── Part 6: the 8-point grid and the safe zone ───────────────────────────────

test('a dragged box snaps to the 8-point grid', () => {
  const canvas = { width: 1080, height: 1350 };
  const step = controls.GRID / canvas.width;
  const snapped = controls.snapFraction(0.203, canvas.width);
  assert.ok(controls.onGrid(snapped, canvas.width), 'the snapped value sits on the grid');
  assert.ok(Math.abs(snapped / step - Math.round(snapped / step)) < 1e-9, 'it is a whole number of 8pt steps');
  const box = controls.snapBox({ x: 0.203, y: 0.311, width: 0.5, height: 0.1 }, canvas);
  assert.ok(controls.onGrid(box.x, canvas.width) && controls.onGrid(box.y, canvas.height), 'both axes snap');
});

test('a dragged box is clamped inside the safe zone', () => {
  const zone = { top: 0.07, bottom: 0.07, left: 0.07, right: 0.07 };
  const out = controls.clampToSafeZone({ x: -0.5, y: 0.99, width: 0.9, height: 0.4 }, zone);
  assert.ok(out.x >= zone.left - 1e-9, 'x is inside the left edge');
  assert.ok(out.y + out.height <= 1 - zone.bottom + 1e-9, 'the box does not run past the bottom edge');
  assert.ok(out.x + out.width <= 1 - zone.right + 1e-9, 'the box does not run past the right edge');
});

test('the engine honours a per-slide box override, snapped and clamped', () => {
  const base = resolve('impact', 'hook');
  const before = base.layers.find(l => l.key === 'headline').box;
  // Deliberately OFF-grid values, so a box that is merely clamped (not snapped)
  // would fail this test.
  const raw = { x: 0.203, y: 0.311, width: 0.5, height: 0.1 };
  const moved = engine.resolve({
    templateId: 'impact', platform: 'instagram',
    slide: Object.assign({ role: 'hook', textLayout: { headline: raw } }, SLIDE),
    index: 0, total: 1, style: {}
  });
  const after = moved.layers.find(l => l.key === 'headline').box;
  assert.notDeepEqual(after, before, 'the override moved the headline');
  // The resolved box must equal the engine's own snap-and-clamp of the raw
  // values — proving the override path (not the plain clamp) ran.
  const expected = engine.snapBoxInZone(raw, moved.canvas, moved.safeZone);
  assert.deepEqual(after, expected, 'the override is snapped to the grid and clamped to the zone');
  assert.ok(engine.snapFraction(after.x, moved.canvas.width) === after.x, 'the moved box is on the 8pt grid');
  assert.ok(engine.snapFraction(after.y, moved.canvas.height) === after.y, 'the moved box is on the 8pt grid vertically');
  const z = moved.safeZone;
  assert.ok(after.x >= z.left - 1e-9 && after.y >= z.top - 1e-9, 'the moved box is inside the safe zone');
  assert.ok(after.x + after.width <= 1 - z.right + 1e-9 && after.y + after.height <= 1 - z.bottom + 1e-9, 'the moved box is inside the safe zone on both far edges');
});

test('a dragged box is not re-anchored to the template bottom', () => {
  // 'impact' anchors its headline to the bottom. A drag must keep the exact
  // geometry the user placed, not snap back to the template's own bottom edge.
  const raw = { x: 0.2, y: 0.1, width: 0.5, height: 0.1 };
  const d = engine.resolve({
    templateId: 'impact', platform: 'instagram',
    slide: Object.assign({ role: 'hook', textLayout: { headline: raw } }, SLIDE),
    index: 0, total: 1, style: {}
  });
  const box = d.layers.find(l => l.key === 'headline').box;
  assert.ok(box.y < 0.3, 'the dragged box stayed near the top, not at the bottom anchor');
});

test('without an override the template region is untouched', () => {
  const a = resolve('editorial', 'hook').layers.find(l => l.key === 'headline').box;
  const b = engine.resolve({ templateId: 'editorial', platform: 'instagram', slide: Object.assign({ role: 'hook' }, SLIDE), index: 0, total: 1, style: {} }).layers.find(l => l.key === 'headline').box;
  assert.deepEqual(a, b, 'the same input gives the same box');
});

// ── Part 6: the per-slide edit model ─────────────────────────────────────────

test('the layout-variant carousel offers 3-4 real compositions for this slide', () => {
  const variants = controls.layoutVariantsFor({ templateId: 'impact', platform: 'instagram', slide: Object.assign({ role: 'hook' }, SLIDE), index: 0, total: 1, style: {} });
  assert.ok(variants.length >= 3 && variants.length <= 4, 'three to four variants');
  for (const v of variants) {
    assert.ok(v.design && v.design.layers.length, v.role + ' resolves to a real design');
    assert.ok(v.name && v.name.length, v.role + ' has a name');
  }
  const roles = variants.map(v => v.role);
  assert.equal(new Set(roles).size, roles.length, 'the variants are distinct roles');
});

test('nudge moves the text to a position inside the safe zone', () => {
  const d = resolve('impact', 'hook');
  const box = d.layers.find(l => l.key === 'headline').box;
  const top = controls.nudgeBox(box, d.safeZone, 'top', 'left');
  const bottom = controls.nudgeBox(box, d.safeZone, 'bottom', 'left');
  assert.ok(top.y < bottom.y, 'top sits above bottom');
  assert.ok(top.y >= d.safeZone.top - 1e-9, 'top is inside the safe zone');
  assert.ok(bottom.y + box.height <= 1 - d.safeZone.bottom + 1e-9, 'bottom is inside the safe zone');
});

test('text size S / M / L maps to a scale and back', () => {
  assert.ok(controls.sizeScale('S') < controls.sizeScale('M'), 'S is smaller than M');
  assert.ok(controls.sizeScale('L') > controls.sizeScale('M'), 'L is larger than M');
  assert.equal(controls.sizeIdFor(controls.sizeScale('L')), 'L', 'the scale maps back to its id');
});

test('apply-to-all changes every slide but a per-slide override wins', () => {
  const slides = [
    { headline: 'a', _style: {} },
    { headline: 'b', _style: { override: true, templateId: 'editorial' } },
    { headline: 'c', _style: {} }
  ];
  const n = controls.applyToAll(slides, { templateId: 'stat_split' });
  assert.equal(n, 2, 'two slides changed');
  assert.equal(slides[0]._templateId, 'stat_split', 'the first slide followed');
  assert.equal(slides[2]._templateId, 'stat_split', 'the third slide followed');
  assert.equal(slides[1]._templateId, undefined, 'the overridden slide kept its own template');
  assert.equal(slides[1]._style.templateId, 'editorial', 'the overridden slide is untouched');
});

test('reset slide keeps the template; restore original clears it', () => {
  const s = { headline: 'x', _templateId: 'impact', _style: { templateId: 'impact', accent: '#d94f4f' }, textLayout: { headline: { x: 0.2, y: 0.2, width: 0.5, height: 0.1 } } };
  controls.resetSlide(s);
  assert.equal(s._templateId, 'impact', 'reset keeps the chosen template');
  assert.equal(s.textLayout, undefined, 'reset clears the dragged boxes');
  assert.equal(s._style.accent, undefined, 'reset clears the accent override');
  controls.restoreOriginal(s);
  assert.equal(s._templateId, undefined, 'restore clears the template too');
  assert.equal(s._style, undefined, 'restore clears the whole style');
});

// ── Part 6: undo / redo ──────────────────────────────────────────────────────

test('undo and redo step through the edits', () => {
  const h = history.create({ headline: 'one' });
  assert.equal(h.canUndo(), false, 'nothing to undo at the start');
  h.push({ headline: 'two' });
  h.push({ headline: 'three' });
  assert.equal(h.canUndo(), true, 'there is something to undo');
  assert.equal(h.undo().headline, 'two', 'undo steps back one');
  assert.equal(h.undo().headline, 'one', 'undo steps back again');
  assert.equal(h.canUndo(), false, 'back at the start');
  assert.equal(h.redo().headline, 'two', 'redo steps forward');
  assert.equal(h.redo().headline, 'three', 'redo steps forward again');
});

test('a no-op change is not recorded, and a snapshot is a deep copy', () => {
  const h = history.create({ headline: 'one' });
  assert.equal(h.push({ headline: 'one' }), false, 'an identical state is ignored');
  const state = { headline: 'two', _style: { accent: '#d94f4f' } };
  h.push(state);
  state._style.accent = '#000000';
  assert.equal(h.present()._style.accent, '#d94f4f', 'a later edit cannot mutate a past state');
});

// ── Part 6: guides, thumbnails, skeleton ─────────────────────────────────────

test('edit-mode guides appear only in edit mode', () => {
  const d = resolve('impact', 'hook');
  assert.equal(guides.guidesHTML(d, false), '', 'no guides when edit mode is off');
  const on = guides.guidesHTML(d, true);
  assert.ok(on.includes('cc-guide-safe'), 'the safe zone is drawn in edit mode');
  assert.ok(on.includes('cc-guide-box'), 'the text boxes are outlined in edit mode');
});

test('the export path never draws a guide', () => {
  // The guides are only ever emitted from the is-editing branch of the live
  // stage, so a preview or a downloaded image cannot contain one.
  assert.ok(!/cc-guide/.test(CORE.split('cpExportSnapshot')[1] || ''), 'the export snapshot has no guide markup');
  assert.ok(CORE.includes('stage.classList.contains("is-editing")'), 'guides are gated on edit mode');
});

test('a thumbnail is a miniature of the real card, with the real photo and text', () => {
  const d = resolve('editorial', 'hook');
  const html = thumbs.miniHTML(d, 'https://example.com/photo.jpg');
  const head = d.layers.find(l => l.key === 'headline');
  assert.ok(html.includes(head.displayText), 'the real headline text is shown');
  assert.ok(html.includes((head.box.x * 100).toFixed(2) + '%'), 'the real box is used');
  assert.ok(html.includes('example.com/photo.jpg'), 'the real photo is used');
  assert.ok(html.includes('cc-th-layer'), 'the layers are drawn, not a flat colour box');
});

test('the skeleton has the card shape and no spinner', () => {
  const html = skeleton.skeletonHTML({ aspect: '9/16' });
  assert.ok(html.includes('aspect-ratio:9/16'), 'the skeleton has the card shape');
  assert.ok(html.includes('cc-skel-bar'), 'it shows shimmer bars');
  assert.ok(!/spinner/i.test(html), 'it is not a spinner');
});

// ── Part 6: the editor surface ───────────────────────────────────────────────

test('the editor has at most five nav items, each an icon plus a short label', () => {
  assert.ok(editor.NAV.length <= 5, 'at most five nav items');
  for (const n of editor.NAV) {
    assert.ok(n.icon && n.icon.length, n.id + ' has an icon');
    assert.ok(n.label && n.label.length <= 12, n.id + ' has a short label');
  }
});

test('the editor exposes the Part 6 controls', () => {
  const base = {
    design: resolve('impact', 'hook'), slide: SLIDE, style: {}, templateId: 'impact', role: 'hook',
    treatmentId: 'fullBleedScrim', accent: '#d94f4f', templates: templates.list('instagram'),
    treatments: treatments.list(), roles: templates.ROLES, accents: editor.ACCENTS,
    variants: controls.layoutVariantsFor({ templateId: 'impact', platform: 'instagram', slide: Object.assign({ role: 'hook' }, SLIDE), index: 0, total: 1, style: {} })
  };
  const layout = editor.buildSheet(Object.assign({}, base, { nav: 'layout' }));
  assert.ok(layout.includes('data-ed-variant='), 'the layout-variant carousel is present');
  const text = editor.buildSheet(Object.assign({}, base, { nav: 'text' }));
  assert.ok(text.includes('data-ed-nudge-v=') && text.includes('data-ed-nudge-h='), 'the nudge controls are present');
  assert.ok(text.includes('data-ed-size="S"') && text.includes('data-ed-size="L"'), 'the S/M/L size controls are present');
  const hist = editor.buildSheet(Object.assign({}, base, { nav: 'history' }));
  assert.ok(hist.includes('data-ed-undo') && hist.includes('data-ed-redo'), 'undo and redo are present');
  assert.ok(hist.includes('data-ed-reset') && hist.includes('data-ed-restore'), 'reset slide and restore original are present');
  const style = editor.buildSheet(Object.assign({}, base, { nav: 'style' }));
  assert.ok(style.includes('data-ed-apply="template"') && style.includes('data-ed-apply="accent"'), 'apply-to-all is present');
  assert.ok(style.includes('data-ed-override'), 'the per-slide override is present');
  assert.ok(layout.includes('data-ed-guides'), 'the edit-mode guide toggle is present');
});

test('core.js wires the Part 6 controls and the editor host', () => {
  for (const fn of ['cpUndoSlide', 'cpRedoSlide', 'cpSetSlideVariant', 'cpNudgeSlide', 'cpSetSlideSize', 'cpApplyToAll', 'cpToggleSlideOverride', 'cpResetSlide', 'cpRestoreOriginal', 'cpToggleEditMode']) {
    assert.ok(CORE.includes('window.' + fn), fn + ' is exposed');
  }
  assert.ok(CORE.includes('onVariant:') && CORE.includes('onNudge:') && CORE.includes('onSize:') && CORE.includes('onApplyAll:'), 'the editor host is wired');
  assert.ok(CORE.includes('CPCardSkeleton'), 'the skeleton is wired into the live stage');
  assert.ok(CORE.includes('CPCardGuides'), 'the guides are wired into the live stage');
});

// ── Part 7: the quality bar ──────────────────────────────────────────────────

test('the quality bar passes across every template', () => {
  const r = quality.review();
  assert.equal(r.failed, 0, 'no check failed: ' + r.checks.filter(c => !c.pass).map(c => c.detail).join(' | '));
  assert.ok(r.templates.length >= 8, 'at least eight templates are reviewed');
});

test('every template has one clear hero element', () => {
  for (const t of templates.list()) {
    const c = quality.checkHero(t);
    assert.ok(c.pass, c.detail);
  }
});

test('every template uses one accent and no flat black / white / red', () => {
  for (const t of templates.list()) {
    const c = quality.checkAccent(t);
    assert.ok(c.pass, c.detail);
  }
});

test('text over a photo always has a scrim', () => {
  for (const t of templates.list()) {
    const c = quality.checkReadable(t);
    assert.ok(c.pass, c.detail);
  }
});

test('every box sits inside the safe zone', () => {
  for (const t of templates.list()) {
    const c = quality.checkSpacing(t);
    assert.ok(c.pass, c.detail);
  }
});

test('no two templates share a composition', () => {
  const c = quality.checkDistinct(templates.list());
  assert.ok(c.pass, c.detail);
});

// The checks must actually FAIL on a bad card, or a neutered check would pass
// the suite silently. These negative cases are the proof.
test('the accent check fails on a flat black / white / red', () => {
  const bad = { id: 'bad', platform: 'instagram', palette: { bg: '#000000', text: '#ffffff', accent: '#ff0000', secondary: '#232323' } };
  const c = quality.checkAccent(bad);
  assert.equal(c.pass, false, 'a flat colour is rejected');
  assert.ok(c.detail.includes('#000000') && c.detail.includes('#ffffff') && c.detail.includes('#ff0000'), 'every flat colour is named');
});

test('the hero check fails when a non-hero layer is larger than the hero', () => {
  const t = templates.get('impact');
  const badResolve = (tt, role) => {
    const d = resolve(tt.id, role);
    const hero = d.layers.find(l => l.key === d.heroKey);
    const other = d.layers.find(l => l !== hero && !l.empty);
    if (hero && !hero.empty && other) other.sizePct = hero.sizePct + 10;
    return d;
  };
  const c = quality.checkHero(t, badResolve);
  assert.equal(c.pass, false, 'a larger non-hero layer is rejected');
});

test('the spacing check fails when a box leaves the safe zone', () => {
  const t = templates.get('impact');
  const badResolve = (tt, role) => {
    const d = resolve(tt.id, role);
    const layer = d.layers.find(l => !l.empty);
    if (layer) layer.box.x = -0.5;
    return d;
  };
  const c = quality.checkSpacing(t, badResolve);
  assert.equal(c.pass, false, 'a box outside the safe zone is rejected');
});

test('the readable check fails when text over the photo has no scrim', () => {
  const t = templates.get('impact');
  const badResolve = (tt, role) => {
    const d = resolve(tt.id, role);
    d.scrim = null;
    return d;
  };
  const c = quality.checkReadable(t, badResolve);
  assert.equal(c.pass, false, 'text over the photo with no scrim is rejected');
});

test('the distinct check fails when two templates share a composition', () => {
  const list = templates.list();
  const c = quality.checkDistinct([list[0], list[0]]);
  assert.equal(c.pass, false, 'a duplicated composition is rejected');
});

test('each template has a distinct composition for all four slide roles', () => {
  const roles = ['hook', 'context', 'evidence', 'cta'];
  const sigs = new Map();
  for (const t of templates.list()) {
    const sig = roles.map(r => JSON.stringify(resolve(t.id, r).layers.map(l => [l.box.x, l.box.y, l.box.width, l.box.height]))).join('|');
    assert.ok(!sigs.has(sig), t.id + ' shares a composition with ' + sigs.get(sig));
    sigs.set(sig, t.id);
  }
});

test('the layout varies by content type', () => {
  const stat = engine.resolve({ templateId: 'impact', platform: 'instagram', contentType: 'stat', slide: Object.assign({ role: 'evidence', stat: '87%' }, SLIDE), index: 0, total: 1, style: {} });
  const quote = engine.resolve({ templateId: 'impact', platform: 'instagram', contentType: 'quote', slide: Object.assign({ role: 'evidence', quote: 'A line worth quoting' }, SLIDE), index: 0, total: 1, style: {} });
  assert.equal(stat.contentType, 'stat', 'the stat content type is honoured');
  assert.equal(quote.contentType, 'quote', 'the quote content type is honoured');
  assert.notDeepEqual(stat.layers.map(l => l.box), quote.layers.map(l => l.box), 'the two content types lay out differently');
});

test('the new modules are loaded before core.js and the versions are bumped', () => {
  for (const f of ['cardEditControls', 'cardEditHistory', 'cardGuides', 'cardThumbnails', 'cardSkeleton', 'cardQualityBar']) {
    assert.ok(HTML.includes('lib/' + f + '.js'), f + ' is loaded');
  }
  assert.ok(HTML.indexOf('lib/cardLayoutEngine.js') < HTML.indexOf('core\.js\?v=69'), 'the engine loads before core.js');
  assert.match(HTML, /core\.js\?v=69/);
  const sw = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');
  assert.match(sw, /creatorpulse-v49/);
});
