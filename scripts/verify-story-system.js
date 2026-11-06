// Geometry + rule report for Parts 3, 4 and 5. Prints the structural
// differences between templates, roles, content types and platforms, and proves
// the scrim and typography rules hold. Run: node scripts/verify-story-system.js
const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');
const typography = require('../public/lib/cardTypography.js');
const treatments = require('../public/lib/photoTreatments.js');
const contentTypes = require('../public/lib/contentTypes.js');

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
function sig(d) {
  return d.layers.map(l => [l.key, +l.box.x.toFixed(3), +l.box.y.toFixed(3), +l.box.width.toFixed(3), +l.box.height.toFixed(3), l.align, l.anchor, l.lines.length].join(':')).join('|');
}
const line = (s) => console.log(s);

line('=== PART 3: the six named photo treatments ===');
for (const id of treatments.REQUIRED) {
  const d = treatments.resolve(id, { accent: '#e0a83c', dim: 0.4 });
  line('  ' + id.padEnd(18) + ' frame=' + JSON.stringify(d.frame) + ' scrim=' + !!d.scrim + ' tint=' + !!d.tint + ' backdrop=' + !!d.backdrop + ' border=' + !!d.border + ' focal=' + JSON.stringify(d.focal || null));
}

line('');
line('=== PART 3: scrim rule — text over the photo always has a scrim ===');
let over = 0, scrimmed = 0;
for (const t of templates.list()) {
  for (const role of templates.ROLES) {
    for (const platform of PLATFORMS) {
      const d = resolve(t.id, platform, role);
      const frame = d.treatment.frame;
      const overlapping = d.layers.filter(l => !l.empty && treatments.overlaps(l.box, frame));
      if (overlapping.length) { over++; if (d.scrim) scrimmed++; }
    }
  }
}
line('  cards with text over the photo: ' + over + '; of those, scrimmed: ' + scrimmed + '  => ' + (over === scrimmed ? 'PASS' : 'FAIL'));

line('');
line('=== PART 4: role layouts differ structurally (per template) ===');
let roleFails = 0;
for (const t of templates.list()) {
  const seen = new Map();
  for (const role of ['hook', 'context', 'evidence', 'cta']) {
    const s = sig(resolve(t.id, t.platform, role));
    if (seen.has(s)) { roleFails++; line('  FAIL ' + t.id + ': ' + role + ' == ' + seen.get(s)); }
    seen.set(s, role);
  }
}
line('  templates checked: ' + templates.list().length + '; role collisions: ' + roleFails + '  => ' + (roleFails === 0 ? 'PASS' : 'FAIL'));

line('');
line('=== PART 4: content types differ structurally (stat_split, evidence) ===');
const stat = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'stat' });
const opinion = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'opinion' });
line('  stat    hero=' + stat.heroKey + ' deco=' + stat.decoration.type + ' sig=' + sig(stat).slice(0, 90));
line('  opinion hero=' + opinion.heroKey + ' deco=' + opinion.decoration.type + ' sig=' + sig(opinion).slice(0, 90));
line('  differ: ' + (sig(stat) !== sig(opinion) ? 'PASS' : 'FAIL'));

line('');
line('=== PART 4: carousel continuity (6 slides, impact) ===');
for (let i = 0; i < 6; i++) {
  const role = i === 0 ? 'hook' : (i === 5 ? 'cta' : 'evidence');
  const d = engine.resolve({ templateId: 'impact', platform: 'instagram', role, slide: Object.assign({ role }, SLIDE), index: i, total: 6, style: {} });
  line('  slide ' + (i + 1) + ' role=' + role.padEnd(9) + ' counter=' + d.counter.label + ' dots=' + d.counter.dots.length + ' active=' + d.counter.dots.filter(x => x.active).length + ' accent=' + d.palette.accent);
}

line('');
line('=== PART 5: scale contrast (hero >= 2.5x supporting) ===');
let scFails = 0, scChecked = 0;
for (const t of templates.list()) {
  for (const role of templates.ROLES) {
    const d = resolve(t.id, t.platform, role);
    const hero = d.layers.find(l => l.key === d.heroKey);
    if (!hero || hero.empty) continue;
    for (const l of d.layers) {
      if (l === hero || l.empty) continue;
      scChecked++;
      if (hero.sizePct < l.sizePct * typography.SCALE_CONTRAST - 1e-9) { scFails++; line('  FAIL ' + t.id + '/' + role + ' hero ' + hero.sizePct.toFixed(4) + ' vs ' + l.key + ' ' + l.sizePct.toFixed(4)); }
    }
  }
}
line('  comparisons: ' + scChecked + '; violations: ' + scFails + '  => ' + (scFails === 0 ? 'PASS' : 'FAIL'));

line('');
line('=== PART 5: hero line length (<= ~18 chars) ===');
let llFails = 0, llChecked = 0, llMax = 0;
for (const t of templates.list()) {
  for (const role of templates.ROLES) {
    const d = resolve(t.id, t.platform, role);
    const hero = d.layers.find(l => l.key === d.heroKey);
    if (!hero || hero.empty || hero.sizePct < 0.05) continue;
    const longest = typography.longestLine(hero.lines);
    llChecked++; llMax = Math.max(llMax, longest);
    if (longest > typography.HERO_MAX_CHARS + 2) { llFails++; line('  FAIL ' + t.id + '/' + role + ' ' + longest + ' chars'); }
  }
}
line('  hero layers checked: ' + llChecked + '; longest line: ' + llMax + ' chars; violations: ' + llFails + '  => ' + (llFails === 0 ? 'PASS' : 'FAIL'));

line('');
line('=== PART 5: keyword highlight + tabular digits ===');
let kw = 0;
for (const t of templates.list()) {
  for (const role of templates.ROLES) {
    const d = resolve(t.id, t.platform, role);
    const h = d.layers.find(l => l.key === 'headline');
    if (h && h.keyword) kw++;
  }
}
line('  headlines with an accent keyword: ' + kw);
const sd = resolve('stat_split', 'instagram', 'evidence', SLIDE, { contentType: 'stat' });
line('  stat supporting tabular: ' + sd.layers.find(l => l.key === 'supportingText').tabular + '; stat decoration tabular: ' + sd.decoration.tabular);
line('  leading impact=' + typography.leadingFor('impact') + ' serif=' + typography.leadingFor('editorial_serif'));

line('');
line('=== PART 4: platform geometry differs (impact/hook) ===');
for (const p of PLATFORMS) {
  const d = resolve('impact', p, 'hook');
  line('  ' + p.padEnd(10) + ' canvas=' + d.canvas.width + 'x' + d.canvas.height + ' sig=' + sig(d).slice(0, 80));
}
