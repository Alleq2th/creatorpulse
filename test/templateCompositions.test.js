// The template COMPOSITIONS: each template must be a genuinely different
// arrangement of the card — different geometry, not a different colour. These
// tests compare the actual layout result (box positions, sizes, alignment,
// anchor, line counts, decoration) for the SAME content, and they fail if two
// templates collapse onto the same composition or if a required design loses
// the structural feature that defines it.
const test = require('node:test');
const assert = require('node:assert/strict');

const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');
const typography = require('../public/lib/cardTypography.js');
const { templateDecoration } = require('../services/statCard.js');

const SLIDE = {
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more',
  stat: '87%'
};

function resolve(templateId, platform, role, slide) {
  return engine.resolve({
    templateId, platform, role,
    slide: Object.assign({ role }, slide || SLIDE),
    index: 0, total: 1, style: {}
  });
}
function head(d) { return d.layers.find(l => l.key === 'headline'); }
function sup(d) { return d.layers.find(l => l.key === 'supportingText'); }

// The structural signature of a card: geometry + alignment + line counts +
// treatment + decoration. Deliberately EXCLUDES colour, so two templates that
// differ only in palette are reported as identical.
function signature(d) {
  const h = head(d), s = sup(d);
  return JSON.stringify([
    [h.box.x, h.box.y, h.box.width, h.box.height].map(n => +n.toFixed(3)),
    h.align, h.lines.length, +h.sizePct.toFixed(4),
    s && !s.empty ? [s.box.x, s.box.y, s.box.width, s.box.height].map(n => +n.toFixed(3)) : null,
    s && !s.empty ? s.lines.length : 0,
    d.treatment.id,
    d.decoration.type
  ]);
}

// ── The nine required designs are present, under the platform's own names ────

test('the nine required compositions are all present in the catalogue', () => {
  const required = {
    impact: 'Bold Impact',
    editorial: 'Editorial Clean',
    stat_split: 'Data & Stat Split',
    quote_punch: 'Quote Card',
    high_retention: 'Breaking Alert',
    silent_camera: 'Headline Stack',
    minimal_noir: 'Minimal Caption',
    dark_gradient: 'Neon/Ambient',
    viral_hook: '9:16 Viral Hook'
  };
  for (const [id, name] of Object.entries(required)) {
    const t = templates.get(id);
    assert.ok(t, id + ' exists');
    assert.equal(t.name, name, id + ' is named ' + name);
  }
  // The platform-specific names are kept, not replaced.
  assert.equal(templates.get('neon_noir').name, 'Neon Cyber');
  assert.equal(templates.list('tiktok').length, 5);
  // The Instagram collection now contains eight distinct compositions.
  assert.equal(templates.list('instagram').length, 8);
});

// ── Every template is structurally different from every other ────────────────

test('no two templates share a composition (geometry, not colour)', () => {
  const seen = new Map();
  for (const t of templates.list()) {
    const sig = signature(resolve(t.id, t.platform, 'hook'));
    assert.ok(!seen.has(sig), t.id + ' shares its composition with ' + seen.get(sig));
    seen.set(sig, t.id);
  }
  assert.equal(seen.size, templates.list().length);
});

test('the headline size is used with intent, not one default for every template', () => {
  const sizes = new Set();
  for (const t of templates.list()) sizes.add(+head(resolve(t.id, t.platform, 'hook')).sizePct.toFixed(4));
  assert.ok(sizes.size >= 5, 'at least five distinct headline sizes, got ' + sizes.size);
  // A "huge condensed headline" must actually be bigger than a caption card.
  const impact = head(resolve('impact', 'instagram', 'hook')).sizePct;
  const caption = head(resolve('minimal_noir', 'tiktok', 'hook')).sizePct;
  assert.ok(impact > caption * 1.5, 'Bold Impact headline is much larger than Minimal Caption');
});

// ── Each required design keeps the feature that defines it ───────────────────

test('Bold Impact: the headline is bottom-anchored, left-aligned, over a full-bleed photo', () => {
  const d = resolve('impact', 'instagram', 'hook');
  const h = head(d);
  assert.equal(h.align, 'left');
  assert.equal(h.anchor, 'bottom');
  // Bottom-anchored: the text block sits in the lower part of the card.
  assert.ok(h.box.y > 0.5, 'headline sits low on the card');
  assert.equal(d.treatment.id, 'fullBleedScrim');
  assert.equal(d.decoration.type, 'rule', 'an accent underline bar');
});

test('Editorial Clean: serif headline top-left, a hairline rule, a tall side inset', () => {
  const d = resolve('editorial', 'instagram', 'hook');
  const h = head(d);
  assert.equal(h.align, 'left');
  assert.ok(h.box.y < 0.2, 'headline is top-left');
  assert.ok(h.box.width <= 0.5, 'the type column is narrow');
  assert.equal(h.fontId, 'editorial_serif', 'a serif headline');
  assert.equal(d.treatment.id, 'tallInset');
  assert.equal(d.decoration.type, 'hairline');
  // The photo is a TALL inset on one side, not a full-bleed field.
  const frame = d.treatment.frame;
  assert.ok(frame.height > frame.width, 'the photo panel is taller than it is wide');
  assert.ok(frame.width < 0.5, 'the photo occupies one side only');
});

test('Data & Stat Split: a giant stat number is the hero on the other half', () => {
  const d = resolve('stat_split', 'instagram', 'hook');
  assert.equal(d.treatment.id, 'splitPanel');
  assert.equal(d.decoration.type, 'stat');
  assert.equal(d.decoration.text, '87%', 'the stat is real content');
  // The stat is drawn at hero scale — far larger than the headline.
  assert.ok(d.decoration.size > head(d).sizePct * 2, 'the stat dwarfs the headline');
  // The photo owns one half.
  assert.ok(d.treatment.frame.width <= 0.5, 'the photo is one half');
});

test('Data & Stat Split hides the stat when the slide has none', () => {
  const d = resolve('stat_split', 'instagram', 'hook', { headline: 'No number here' });
  assert.equal(d.decoration.type, 'none', 'an empty stat slot is hidden, not placeholdered');
});

test('Quote Card: an oversized quote mark, the quote as hero, a dim duotone photo', () => {
  const d = resolve('quote_punch', 'tiktok', 'hook');
  assert.equal(d.decoration.type, 'quote');
  assert.equal(d.treatment.id, 'duotone');
  // The photo is dimmed behind the quote: a scrim plus a duotone tint.
  assert.ok(d.treatment.scrim, 'a scrim darkens the photo');
  assert.ok(d.treatment.tint, 'a duotone tint is applied');
  // The quote text is the hero: the largest text on the card.
  const h = head(d);
  assert.ok(h.sizePct >= 0.08, 'the quote is set large');
  assert.ok(h.box.height >= 0.3, 'the quote owns a large block');
});

test('Breaking Alert: a BREAKING tag top-left, a stacked headline, a timestamp line', () => {
  const d = resolve('high_retention', 'tiktok', 'hook');
  assert.equal(d.decoration.type, 'badge');
  assert.equal(d.decoration.text, 'BREAKING');
  assert.ok(d.decoration.x <= d.canvas.width * 0.1, 'the tag is pinned to the left');
  assert.ok(d.decoration.y <= d.canvas.height * 0.12, 'the tag is pinned to the top');
  // The headline is a tight stack: short lines, several of them.
  const h = head(d);
  assert.ok(h.lines.length >= 2, 'the headline stacks');
  assert.ok(h.lines.every(l => l.split(/\s+/).length <= 4), 'a few words per line');
  // A timestamp line is present and small.
  const cta = d.layers.find(l => l.key === 'ctaLine');
  assert.ok(!cta.empty && cta.sizePct <= 0.03, 'a small timestamp line');
});

test('Headline Stack: short lines, a keyword in the accent, centred', () => {
  const d = resolve('silent_camera', 'tiktok', 'hook');
  const h = head(d);
  assert.equal(h.align, 'center');
  assert.ok(h.lines.length >= 2, 'the headline stacks');
  assert.ok(h.lines.every(l => l.split(/\s+/).length <= 4), '3-4 words per line');
  assert.ok(h.keyword, 'one keyword is highlighted');
  assert.ok(h.displayText.includes(h.keyword), 'the keyword is in the text');
  assert.equal(h.keywordColor, d.palette.accent, 'the keyword uses the accent');
});

test('Minimal Caption: the photo is the hero and there is one small caption bar', () => {
  const d = resolve('minimal_noir', 'tiktok', 'hook');
  assert.equal(d.decoration.type, 'caption');
  // The caption bar is a single strip pinned to the bottom.
  assert.ok(d.decoration.y >= d.canvas.height * 0.75, 'the bar is at the bottom');
  assert.ok(d.decoration.height <= d.canvas.height * 0.25, 'the bar is a strip, not a panel');
  // The text is small and low: the photo is the hero.
  const h = head(d);
  assert.ok(h.sizePct <= 0.045, 'the caption is small');
  assert.ok(h.box.y >= 0.7, 'the caption sits low');
});

test('Neon/Ambient: a soft glow, light type, the accent only on the keyword', () => {
  const d = resolve('dark_gradient', 'instagram', 'hook');
  assert.equal(d.decoration.type, 'orb', 'a soft glow behind the subject');
  const h = head(d);
  assert.equal(h.align, 'center');
  assert.ok(h.keyword, 'the accent is used on the keyword');
  assert.equal(h.keywordColor, d.palette.accent);
  // The background is a radial glow, not a flat fill.
  assert.ok(/radial-gradient/.test(d.palette.gradient), 'a radial glow');
});

test('TikTok 9:16 Viral Hook: the hook sits in the upper-middle safe zone', () => {
  const d = resolve('viral_hook', 'tiktok', 'hook');
  const h = head(d);
  const z = d.safeZone;
  // Upper-middle: below the top safe edge, above the bottom caption area.
  assert.ok(h.box.y >= z.top - 1e-6, 'below the top safe edge');
  assert.ok(h.box.y + h.box.height <= 1 - z.bottom + 1e-6, 'clear of the bottom caption area');
  assert.ok(h.box.y < 0.5, 'the hook sits in the upper half');
  // Clear of the right-side action rail.
  assert.ok(h.box.x + h.box.width <= 1 - z.right + 1e-6, 'clear of the right action rail');
  assert.ok(h.sizePct >= 0.08, 'the hook is big');
});

// ── The decorations are drawn, not just declared ─────────────────────────────

test('every new decoration type is actually drawn by the export renderer', () => {
  const p = { accent: '#d94f4f' };
  const f = { w: 1080, h: 1350, margin: 80 };
  const cases = {
    quote: /<text[^>]*>\u201C<\/text>/,
    hairline: /<rect[^>]*height="3"/,
    caption: /<rect[^>]*y="1080"[^>]*height="270"/,
    stat: /<text[^>]*>87%<\/text>/
  };
  for (const [type, re] of Object.entries(cases)) {
    const design = { decoration: { type, accent: '#d94f4f', value: '87%' } };
    const svg = templateDecoration(design, p, f);
    assert.ok(re.test(svg), type + ' decoration is drawn: ' + svg.slice(0, 120));
  }
  // The BREAKING tag is drawn top-left with its label.
  const badge = templateDecoration({ decoration: { type: 'badge', text: 'BREAKING', accent: '#d96a4a' } }, p, f);
  assert.ok(/BREAKING/.test(badge), 'the tag label is drawn');
  assert.ok(/x="80"/.test(badge), 'the tag is pinned to the left margin');
  // An empty stat draws nothing at all.
  assert.equal(templateDecoration({ decoration: { type: 'stat', value: '' } }, p, f), '');
});

// ── The keyword highlight is escaped, so it can never inject markup ──────────

test('the keyword highlight escapes its text and wraps only the keyword', () => {
  const html = typography.keywordHtml({
    displayText: 'GROWTH <script>alert(1)</script> NOW',
    keyword: 'GROWTH',
    keywordColor: '#d94f4f'
  });
  assert.ok(!/<script>/.test(html), 'the raw tag is escaped');
  assert.ok(/<span class="cc-kw" style="color:#d94f4f">GROWTH<\/span>/.test(html), 'the keyword is wrapped in the accent');
  assert.ok(/&lt;script&gt;/.test(html), 'the rest is escaped');
  // No keyword: the text is returned escaped and unwrapped.
  const plain = typography.keywordHtml({ displayText: 'a < b', keyword: '' });
  assert.equal(plain, 'a &lt; b');
});

// ── The same content resolves differently per role, per template ─────────────

test('every template gives the hook and the call to action different geometry', () => {
  for (const t of templates.list()) {
    const hook = resolve(t.id, t.platform, 'hook');
    const cta = resolve(t.id, t.platform, 'cta');
    assert.notEqual(signature(hook), signature(cta), t.id + ' reuses one composition for every role');
  }
});
