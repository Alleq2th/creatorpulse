// Parts 3, 4 and 5 of the card design system: photo treatments, storytelling by
// slide role and content type, and typography. These tests are the contract for
// the new work — they fail if a treatment stops being structurally distinct, if
// text over a photo loses its scrim, if two roles or two content types collapse
// onto the same layout, or if a typography rule is broken.
const test = require('node:test');
const assert = require('node:assert/strict');

const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');
const typography = require('../public/lib/cardTypography.js');
const treatments = require('../public/lib/photoTreatments.js');
const contentTypes = require('../public/lib/contentTypes.js');
const roleLayouts = require('../public/lib/roleLayouts.js');

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'];
const SLIDE = {
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more',
  stat: '87%'
};

function resolve(templateId, platform, role, slide, extra) {
  return engine.resolve(Object.assign({
    templateId, platform, role,
    slide: Object.assign({ role }, slide || SLIDE),
    index: 0, total: 1, style: {}
  }, extra || {}));
}
function head(d) { return d.layers.find(l => l.key === 'headline'); }
function sup(d) { return d.layers.find(l => l.key === 'supportingText'); }
function geom(d) {
  return JSON.stringify(d.layers.map(l => [l.box.x, l.box.y, l.box.width, l.box.height, l.align, l.anchor, l.lines.length]));
}

// ── Part 3: photo treatments ─────────────────────────────────────────────────

test('the six treatments the brief names all exist, plus the platform extras', () => {
  for (const id of ['fullBleedScrim', 'duotone', 'splitPanel', 'insetFrame', 'blurredBackdrop', 'subjectAwareCrop']) {
    assert.ok(treatments.TREATMENTS[id], 'the brief names the ' + id + ' treatment');
    assert.ok(treatments.NAMES[id], id + ' has a human name');
  }
  assert.ok(treatments.list().length >= 6, 'at least the six named treatments');
});

test('every treatment is structurally distinct, not one treatment recoloured', () => {
  const shapes = new Set();
  for (const item of treatments.list()) {
    const d = treatments.resolve(item.id, { accent: '#e0a83c', dim: 0.4 });
    const shape = JSON.stringify([d.frame, !!d.scrim, !!d.tint, !!d.backdrop, !!d.rule, !!d.border, d.focal || null]);
    assert.ok(!shapes.has(shape), item.id + ' duplicates another treatment');
    shapes.add(shape);
  }
});

test('the subject-aware crop biases toward the upper-middle, where faces are', () => {
  const d = treatments.resolve('subjectAwareCrop', { accent: '#e0a83c', dim: 0.4 });
  assert.ok(d.focal, 'the crop declares a focal point');
  assert.ok(d.focal.y < 0.5, 'the crop is biased above centre');
  assert.ok(d.focal.y >= 0.25, 'but not off the top of the frame');
  assert.equal(d.focal.x, 0.5, 'horizontally centred');
});

test('the scrim rule holds: any text box overlapping the photo has a scrim', () => {
  let checked = 0;
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      for (const platform of PLATFORMS) {
        const d = resolve(t.id, platform, role);
        const frame = d.treatment.frame;
        const overlapping = d.layers.filter(l => !l.empty && treatments.overlaps(l.box, frame));
        if (overlapping.length) {
          assert.ok(d.scrim, t.id + '/' + role + '/' + platform + ' has text over the photo but no scrim');
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 0, 'the rule was actually exercised');
});

test('a high-contrast region under text is never left unscrimmed', () => {
  // A synthetic photo: a flat top half and a busy (checkerboard) bottom half.
  const W = 60, H = 60;
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const busy = y >= H / 2;
      // Coarse blocks, so the detector's stride-2 sampling still sees the
      // contrast (a per-pixel checkerboard would alias away).
      const v = busy ? ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 20 : 235) : 120;
      px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
  }
  const regions = treatments.highContrastRegions(px, W, H, { cols: 4, rows: 4, threshold: 400 });
  assert.ok(regions.length > 0, 'the busy half is detected as high contrast');
  assert.ok(regions.every(r => r.y >= 0.4), 'the flat half is not flagged');
  // A text box over the busy half, with no scrim, must be reported.
  const box = { x: 0.1, y: 0.6, width: 0.8, height: 0.3, empty: false };
  assert.ok(treatments.unscrimmedHighContrast(regions, [box], null).length > 0, 'unscrimmed text over a busy region is caught');
  // The same box with a scrim is safe.
  assert.equal(treatments.unscrimmedHighContrast(regions, [box], { stops: [] }).length, 0, 'a scrim clears the warning');
});

test('every template that puts text over its photo resolves a scrim', () => {
  for (const t of templates.list()) {
    const d = resolve(t.id, t.platform, 'hook');
    const frame = d.treatment.frame;
    const over = d.layers.some(l => !l.empty && treatments.overlaps(l.box, frame));
    if (over) assert.ok(d.scrim, t.id + ' must scrim the photo under its text');
  }
});

// ── Part 4: storytelling by slide role ───────────────────────────────────────

test('each of the four story roles has its own layout intent', () => {
  const hook = roleLayouts.intentFor('hook');
  const cta = roleLayouts.intentFor('cta');
  assert.ok(hook.maxWords <= 8, 'the hook is the shortest copy');
  assert.ok(hook.swipeCue, 'the hook carries the swipe cue');
  assert.ok(cta.cta, 'the last slide is the call to action');
  assert.ok(hook.heroScale >= cta.heroScale, 'the hook is the largest type');
});

test('the four roles produce structurally different layouts inside one template', () => {
  for (const t of templates.list()) {
    const seen = new Map();
    for (const role of ['hook', 'context', 'evidence', 'cta']) {
      const g = geom(resolve(t.id, t.platform, role));
      assert.ok(!seen.has(g), t.id + ' reuses one composition for ' + role + ' and ' + seen.get(g));
      seen.set(g, role);
    }
  }
});

test('the hook is the largest type and the CTA is a clear end state', () => {
  for (const t of templates.list()) {
    const hook = head(resolve(t.id, t.platform, 'hook'));
    const cta = head(resolve(t.id, t.platform, 'cta'));
    assert.ok(hook.sizePct >= cta.sizePct - 1e-9, t.id + ' hook must not be smaller than the CTA');
  }
});

test('the content type changes the layout: a stat and an opinion are not the same card', () => {
  const t = templates.get('stat_split');
  const stat = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'stat' });
  const opinion = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'opinion' });
  assert.equal(stat.contentType, 'stat');
  assert.equal(opinion.contentType, 'opinion');
  assert.notEqual(geom(stat), geom(opinion), 'the two content types must not share a layout');
});

test('each content type maps to a hero element and a supporting meaning', () => {
  for (const type of contentTypes.ORDER) {
    const v = contentTypes.variantFor(type, templates.get('impact'));
    assert.ok(v.hero, type + ' names a hero layer');
    assert.ok(v.supporting, type + ' names what the supporting line means');
  }
  assert.equal(contentTypes.variantFor('stat', templates.get('impact')).hero, 'stat');
  assert.equal(contentTypes.variantFor('quote', templates.get('impact')).hero, 'quote');
});

test('the content type is detected from the slide when it is not given', () => {
  assert.equal(contentTypes.detect({ stat: '87%' }), 'stat');
  assert.equal(contentTypes.detect({ quote: 'We go again' }), 'quote');
  assert.equal(contentTypes.detect({ headline: '42%' }), 'stat');
  assert.equal(contentTypes.detect({ headline: 'A quiet opinion' }), 'default');
  assert.equal(contentTypes.detect({}, 'transfer'), 'transfer');
});

test('carousel continuity: a counter, progress dots and one accent across the set', () => {
  const total = 6;
  const accents = new Set();
  for (let i = 0; i < total; i++) {
    const d = engine.resolve({
      templateId: 'impact', platform: 'instagram', role: i === 0 ? 'hook' : (i === total - 1 ? 'cta' : 'evidence'),
      slide: Object.assign({ role: i === 0 ? 'hook' : (i === total - 1 ? 'cta' : 'evidence') }, SLIDE),
      index: i, total, style: {}
    });
    assert.equal(d.counter.label, (i + 1) + ' / ' + total, 'the counter names the slide');
    assert.equal(d.counter.dots.length, total, 'one dot per slide');
    assert.equal(d.counter.dots.filter(x => x.active).length, 1, 'exactly one active dot');
    accents.add(d.palette.accent);
  }
  assert.equal(accents.size, 1, 'the same accent runs through the whole set');
});

test('the counter sits inside the safe zone, clear of the TikTok caption area', () => {
  const d = engine.resolve({
    templateId: 'viral_hook', platform: 'tiktok', role: 'hook',
    slide: Object.assign({ role: 'hook' }, SLIDE), index: 0, total: 5, style: {}
  });
  const c = d.counter, z = d.safeZone;
  assert.ok(c.x >= d.canvas.width * z.left - 1, 'the counter is inside the left safe edge');
  assert.ok(c.y + c.height <= d.canvas.height * (1 - z.bottom) + 1, 'the counter is above the caption area');
});

// ── Part 5: typography ───────────────────────────────────────────────────────

test('hierarchy with scale contrast: the hero is at least 2.5x the supporting text', () => {
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      const d = resolve(t.id, t.platform, role);
      const hero = d.layers.find(l => l.key === d.heroKey);
      if (!hero || hero.empty) continue;
      for (const l of d.layers) {
        if (l === hero || l.empty) continue;
        assert.ok(hero.sizePct >= l.sizePct * typography.SCALE_CONTRAST - 1e-9,
          t.id + '/' + role + ': hero ' + hero.sizePct.toFixed(4) + ' must be >= 2.5x ' + l.key + ' ' + l.sizePct.toFixed(4));
      }
    }
  }
});

test('one keyword per headline is auto-picked and drawn in the accent', () => {
  let checked = 0;
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      const d = resolve(t.id, t.platform, role);
      const h = head(d);
      if (!h || h.empty) continue;
      const wants = (t.roles[role] && t.roles[role].headline && t.roles[role].headline.keyword) ||
        (d.contentVariant && d.contentVariant.keyword);
      if (!wants) continue;
      assert.ok(h.keyword, t.id + '/' + role + ' must highlight one keyword');
      assert.equal(h.keywordColor, d.palette.accent, 'the keyword is drawn in the accent');
      assert.ok(h.displayText.indexOf(h.keyword) > -1, 'the keyword is really in the headline');
      checked++;
    }
  }
  assert.ok(checked > 0, 'at least one template highlights a keyword');
});

test('the keyword picker prefers a number, then the longest meaningful word', () => {
  assert.equal(typography.pickKeyword('Revenue up 42% this quarter'), '42%');
  assert.equal(typography.pickKeyword('The transfer is confirmed'), 'confirmed');
  assert.equal(typography.pickKeyword('the and for'), '');
});

test('stats use tabular digits', () => {
  const d = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'stat' });
  const s = sup(d);
  assert.ok(s.tabular, 'the supporting stat line asks for tabular figures');
  assert.ok(d.decoration.tabular, 'the giant stat number asks for tabular figures');
});

test('leading is tight on condensed headlines and looser on serif', () => {
  assert.ok(typography.leadingFor('impact') < typography.leadingFor('editorial_serif'), 'condensed is tighter than serif');
  assert.ok(typography.leadingFor('condensed_sans') <= 1.05, 'a condensed face is set tight');
  assert.ok(typography.leadingFor('editorial_serif') >= 1.2, 'a serif gets air between lines');
});

test('hero lines stay within the line-length limit', () => {
  let checked = 0;
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      const d = resolve(t.id, t.platform, role);
      // The limit applies to the HERO type. When the hero is a stat or a quote
      // (a decoration, not a text layer) there is no hero line to measure.
      const hero = d.layers.find(l => l.key === d.heroKey);
      if (!hero || hero.empty) continue;
      if (hero.sizePct < 0.05) continue;
      const longest = typography.longestLine(hero.lines);
      assert.ok(longest <= typography.HERO_MAX_CHARS + 2,
        t.id + '/' + role + ' hero line is ' + longest + ' chars (limit ~' + typography.HERO_MAX_CHARS + ')');
      checked++;
    }
  }
  assert.ok(checked > 0, 'the limit was actually exercised');
});

test('the engine never truncates: no ellipsis and every layer fits its box', () => {
  for (const t of templates.list()) {
    for (const role of templates.ROLES) {
      for (const platform of PLATFORMS) {
        const d = resolve(t.id, platform, role);
        for (const l of d.layers) {
          if (l.empty) continue;
          assert.equal(l.fits, true, t.id + '/' + role + '/' + platform + '/' + l.key + ' must fit');
          assert.ok(!/\u2026|\.\.\./.test(l.displayText), 'no ellipsis in ' + t.id);
        }
      }
    }
  }
});
