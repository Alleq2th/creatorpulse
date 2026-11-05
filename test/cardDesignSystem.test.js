// The card design system: template specs, the layout engine, photo treatments,
// typography and the editor. These tests are the contract for the redesign —
// they fail if a template stops being genuinely different, if text overflows or
// is truncated, if a colour rule is broken, or if the export stops drawing the
// same lines the preview shows.
const test = require('node:test');
const assert = require('node:assert/strict');

const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');
const typography = require('../public/lib/cardTypography.js');
const treatments = require('../public/lib/photoTreatments.js');
const designSystem = require('../public/lib/designSystem.js');
const editor = require('../public/lib/cardEditor.js');
const { designLines } = require('../services/statCard.js');

const SLIDE = {
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more'
};
const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'];

function resolve(templateId, platform, role, slide) {
  return engine.resolve({
    templateId, platform, role,
    slide: Object.assign({ role }, slide || SLIDE),
    index: 0, total: 1, style: {}
  });
}

// ── Part 1: the spec + engine ────────────────────────────────────────────────

test('every template declares a spec with regions for all six story roles', () => {
  const list = templates.list();
  assert.ok(list.length >= 10, 'at least ten templates');
  for (const t of list) {
    assert.ok(t.canvas && t.canvas.width > 0 && t.canvas.height > 0, t.id + ' has a canvas');
    assert.ok(t.palette && t.palette.bg && t.palette.accent, t.id + ' has a palette');
    assert.ok(t.treatment && t.treatment.id, t.id + ' picks a photo treatment');
    for (const role of templates.ROLES) {
      assert.ok(t.roles[role], t.id + ' declares the ' + role + ' role');
      assert.ok(t.roles[role].headline, t.id + '/' + role + ' places a headline');
    }
  }
});

test('the engine resolves every template x role x platform without overflow or ellipsis', () => {
  let count = 0;
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      for (const platform of PLATFORMS) {
        const d = resolve(t.id, platform, role);
        assert.ok(d, t.id + '/' + role + '/' + platform + ' resolves');
        count++;
        for (const l of d.layers) {
          if (l.empty) continue;
          assert.equal(l.fits, true, t.id + '/' + role + '/' + platform + '/' + l.key + ' must fit its box');
          assert.ok(!/\u2026|\.\.\./.test(l.displayText), 'no ellipsis in ' + t.id);
          assert.ok(l.box.x >= d.safeZone.left - 1e-6, 'left inside safe zone: ' + t.id + '/' + role);
          assert.ok(l.box.x + l.box.width <= 1 - d.safeZone.right + 1e-6, 'right inside safe zone: ' + t.id + '/' + role);
          assert.ok(l.box.y >= d.safeZone.top - 1e-6, 'top inside safe zone: ' + t.id + '/' + role);
          assert.ok(l.box.y + l.box.height <= 1 - d.safeZone.bottom + 1e-6, 'bottom inside safe zone: ' + t.id + '/' + role);
        }
      }
    }
  }
  assert.equal(count, templates.list().length * templates.ROLES.length * PLATFORMS.length);
});

test('auto-fit shrinks a long headline to fit instead of overflowing or truncating', () => {
  const long = 'A very long headline that keeps going and going and going and going and going and going and going and going and going and going and going and going and going';
  const d = resolve('impact', 'instagram', 'hook', { headline: long, supportingText: 'x' });
  const head = d.layers.find(l => l.key === 'headline');
  assert.equal(head.fits, true);
  assert.ok(head.lines.length <= head.maxLines, 'within the line cap');
  assert.ok(head.sizePct < 0.082, 'shrank below the template maximum');
  assert.ok(!/\u2026/.test(head.displayText), 'never truncated with an ellipsis');
});

test('a slot with no content is hidden, not filled with placeholder copy', () => {
  const d = resolve('impact', 'instagram', 'hook', { headline: 'Only a headline' });
  const support = d.layers.find(l => l.key === 'supportingText');
  const cta = d.layers.find(l => l.key === 'ctaLine');
  assert.equal(support.empty, true);
  assert.equal(cta.empty, true);
});

// ── Part 2: per-slide storytelling ───────────────────────────────────────────

test('a six-slide carousel reads as a sequence of six different roles', () => {
  const roles = [];
  for (let i = 0; i < 6; i++) roles.push(templates.roleFor({}, i, 6));
  assert.deepEqual(roles, ['hook', 'context', 'evidence', 'turn', 'payoff', 'cta']);
});

test('each template gives the hook and the call to action a genuinely different composition', () => {
  for (const t of templates.list()) {
    const hook = resolve(t.id, t.platform, 'hook');
    const cta = resolve(t.id, t.platform, 'cta');
    const geom = d => JSON.stringify(d.layers.map(l => [l.box.x, l.box.y, l.box.width, l.box.height, l.align]));
    assert.notEqual(geom(hook), geom(cta), t.id + ' must not reuse one composition for every role');
  }
});

test('the templates are different from each other, not one design in different colours', () => {
  const seen = new Set();
  for (const t of templates.list()) {
    const d = resolve(t.id, t.platform, 'hook');
    const geom = JSON.stringify(d.layers.map(l => [l.box.x, l.box.y, l.box.width, l.box.height, l.align]));
    assert.ok(!seen.has(geom), t.id + ' shares its composition with another template');
    seen.add(geom);
  }
});

// ── Part 3: photo treatments ─────────────────────────────────────────────────

test('there are six named photo treatments and each template picks exactly one', () => {
  const list = treatments.list();
  assert.equal(list.length, 6);
  for (const t of templates.list()) {
    const d = resolve(t.id, t.platform, 'hook');
    assert.ok(treatments.NAMES[d.treatment.id], t.id + ' uses a named treatment');
  }
});

test('the treatments are structurally distinct, not one treatment recoloured', () => {
  const shapes = new Set();
  for (const item of treatments.list()) {
    const d = treatments.resolve(item.id, { accent: '#e0a83c', dim: 0.4 });
    const shape = JSON.stringify([d.frame, !!d.scrim, !!d.tint, !!d.backdrop, !!d.rule, !!d.border]);
    assert.ok(!shapes.has(shape), item.id + ' duplicates another treatment');
    shapes.add(shape);
  }
});

test('text stays legible over every treatment: a scrim, a tint, or a non-overlapping zone', () => {
  for (const item of treatments.list()) {
    const d = treatments.resolve(item.id, { accent: '#e0a83c', dim: 0.4 });
    const hasField = !!(d.scrim || d.tint || d.backdrop);
    const frame = d.frame;
    const zone = d.textZone;
    const overlaps = zone.x < frame.x + frame.width && zone.x + zone.width > frame.x &&
                     zone.y < frame.y + frame.height && zone.y + zone.height > frame.y;
    assert.ok(hasField || !overlaps, item.id + ' must darken the photo or keep text off it');
  }
});

// ── Part 4: typography ───────────────────────────────────────────────────────

test('typography is one source of truth: the engine uses its faces and its auto-fit', () => {
  const d = resolve('impact', 'instagram', 'hook');
  const head = d.layers.find(l => l.key === 'headline');
  assert.equal(head.fontFamily, typography.face('impact').family);
  const fit = typography.autoFit({
    text: SLIDE.headline.toUpperCase(), boxW: 0.84 * 0.98, boxH: 0.3 * 0.96, canvasW: 1080, canvasH: 1350,
    lineHeight: 1.12, maxLines: 4, minPct: 0.022, maxPct: 0.082
  });
  assert.equal(head.sizePct, fit.sizePct);
  assert.deepEqual(head.lines, fit.lines);
});

test('wrapping is deterministic and never drops a word', () => {
  const measure = typography.estimateMeasure(40);
  const lines = typography.wrapLines(measure, 'one two three four five six seven eight nine ten', 200);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(' ').replace(/\s+/g, ' '), 'one two three four five six seven eight nine ten');
});

// ── Colour rule ──────────────────────────────────────────────────────────────

test('no template uses a flat #000000, #ffffff or #ff0000', () => {
  const banned = ['#000000', '#ffffff', '#ff0000', '#000', '#fff'];
  for (const t of templates.list()) {
    const values = [t.palette.bg, t.palette.text, t.palette.accent, t.palette.secondary];
    if (t.decoration && t.decoration.accent) values.push(t.decoration.accent);
    for (const v of values) {
      assert.ok(!banned.includes(String(v).toLowerCase()), t.id + ' uses a banned flat colour: ' + v);
    }
  }
});

test('each template has exactly one accent, used for meaning', () => {
  for (const t of templates.list()) {
    // A decoration may carry the accent, or a neutral hairline (a frame is a
    // border, not an accent) — never a second accent colour.
    const deco = t.decoration && t.decoration.accent;
    const neutral = !deco || /^rgba\(246,246,246/.test(deco);
    assert.ok(neutral || deco === t.palette.accent, t.id + ' must not introduce a second accent colour');
    assert.ok(t.accentUse && (t.accentUse.cta || t.accentUse.rule || t.accentUse.keyword), t.id + ' uses its accent for meaning');
  }
});

// ── The decoration is a pill, not a blob ─────────────────────────────────────

test('a badge decoration is pill-sized and never stretches across the card', () => {
  for (const t of templates.list()) {
    const d = resolve(t.id, t.platform, 'hook');
    if (d.decoration.type !== 'badge') continue;
    assert.ok(d.decoration.width <= d.canvas.width * 0.5, t.id + ' badge is pill-sized');
    assert.ok(d.decoration.height <= d.canvas.height * 0.08, t.id + ' badge is not full height');
    assert.ok(d.decoration.radius >= d.decoration.height / 2 - 1, t.id + ' badge is rounded');
  }
});

// ── The export draws the same lines the preview shows ────────────────────────

test('the export draws the engine\'s wrapped lines, so the download matches the preview', () => {
  const design = designSystem.resolve('impact', { platform: 'instagram', slide: SLIDE, index: 0, total: 1 });
  const head = design.layers.find(l => l.key === 'headline');
  const out = designLines(design, 'headline', { w: 1080, h: 1350 }, SLIDE.headline, 60, 20, 4);
  assert.deepEqual(out.lines, head.lines, 'the export must not re-wrap the text');
  assert.equal(out.size, Math.round(head.sizePct * 1080));
  assert.equal(out.layer.fontFamily, head.fontFamily);
});

test('the design-system adapter exposes the export\'s expected shape', () => {
  const design = designSystem.resolve('viral_hook', { platform: 'tiktok', slide: SLIDE, index: 0, total: 1 });
  assert.ok(design.textBoxes.headline && design.textBoxes.headline.maxLines >= 1);
  assert.ok(design.typography.headline && design.typography.headline.family);
  assert.ok(design.image && design.image.mode);
  assert.ok(design.decoration && design.decoration.type);
  assert.ok(design.background && design.background.stops.length >= 2);
  assert.equal(design.storyRole, 'hook');
  assert.equal(design.role, 'cover');
});

test('a radial gradient and rgba stops survive parsing (the export used to drop them)', () => {
  const parsed = designSystem.parseGradient('radial-gradient(circle at 50% 30%,rgba(127,143,214,.26),rgba(22,22,22,.90) 72%,#161616)');
  assert.equal(parsed.kind, 'radial');
  assert.equal(parsed.stops.length, 3);
  assert.equal(parsed.stops[0].color, 'rgba(127,143,214,.26)');
  assert.equal(parsed.stops[2].color, '#161616');
});

// ── Part 5: the editor ───────────────────────────────────────────────────────

test('the editor offers every template, role, treatment and accent', () => {
  const design = resolve('impact', 'instagram', 'hook');
  const html = editor.buildSheet({
    design,
    slide: SLIDE,
    style: {},
    templateId: 'impact',
    role: 'hook',
    treatmentId: 'fullBleedScrim',
    accent: '#d94f4f',
    templates: templates.list('instagram'),
    treatments: treatments.list(),
    roles: templates.ROLES,
    accents: editor.ACCENTS
  });
  for (const t of templates.list('instagram')) assert.ok(html.includes('data-ed-template="' + t.id + '"'), 'tile for ' + t.id);
  for (const r of templates.ROLES) assert.ok(html.includes('data-ed-role="' + r + '"'), 'chip for ' + r);
  for (const tr of treatments.list()) assert.ok(html.includes('data-ed-treatment="' + tr.id + '"'), 'chip for ' + tr.id);
  assert.ok(html.includes('data-ed-accent="#d94f4f"'), 'the current accent is offered');
  assert.ok(html.includes('cc-ed-preview'), 'a live preview is shown');
});

test('the editor preview is drawn from the same layout result as the card', () => {
  const design = resolve('editorial', 'instagram', 'hook');
  const html = editor.miniCard(design, '');
  const head = design.layers.find(l => l.key === 'headline');
  assert.ok(html.includes((head.box.x * 100).toFixed(2) + '%'), 'the headline box is placed by the engine');
  assert.ok(html.includes(head.displayText), 'the real text is shown');
});

test('the editor accent list contains no banned flat colours', () => {
  for (const a of editor.ACCENTS) {
    assert.ok(!['#000000', '#ffffff', '#ff0000'].includes(a.color.toLowerCase()), a.name + ' is a banned colour');
  }
});
