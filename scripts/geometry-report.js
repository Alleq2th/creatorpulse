// Geometry report: proves the layouts differ STRUCTURALLY (box positions, sizes,
// alignment, anchor, line counts) — not just in colour — across
// template x slide role x content type x platform.
//
// Run: node scripts/geometry-report.js
const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');
const contentTypes = require('../public/lib/contentTypes.js');

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'];
const ROLES = ['hook', 'context', 'evidence', 'cta'];
const SLIDE = {
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more',
  stat: '87%'
};

function resolve(templateId, platform, role, contentType) {
  return engine.resolve({
    templateId, platform, role,
    slide: Object.assign({ role }, SLIDE),
    index: 0, total: 4, style: {},
    contentType
  });
}
function sig(d) {
  return d.layers.map(l => [l.key, +l.box.x.toFixed(3), +l.box.y.toFixed(3), +l.box.width.toFixed(3), +l.box.height.toFixed(3), l.align, l.anchor, l.lines.length].join(':')).join('|');
}
function heroSig(d) {
  const h = d.layers.find(l => l.key === d.heroKey);
  return h ? [d.heroKey, +h.box.x.toFixed(3), +h.box.y.toFixed(3), +h.box.width.toFixed(3), +h.box.height.toFixed(3), h.align, h.anchor, h.lines.length, +h.sizePct.toFixed(4)].join(':') : 'none';
}

const report = { roles: {}, contentTypes: {}, platforms: {}, treatments: {}, summary: {} };

// 1. Roles differ inside every template.
let rolePairs = 0, roleDistinct = 0;
for (const t of templates.list()) {
  const sigs = {};
  for (const role of ROLES) sigs[role] = sig(resolve(t.id, t.platform, role));
  const uniq = new Set(Object.values(sigs));
  rolePairs += ROLES.length;
  roleDistinct += uniq.size;
  report.roles[t.id] = {
    distinct: uniq.size, of: ROLES.length,
    hero: ROLES.map(r => r + '=' + heroSig(resolve(t.id, t.platform, r))),
    same: Object.entries(sigs).filter(([r, s], i, a) => a.findIndex(([r2, s2]) => s2 === s) !== i).map(([r]) => r)
  };
}

// 2. Content types differ on the middle role.
let ctPairs = 0, ctDistinct = 0;
for (const t of templates.list()) {
  const sigs = {};
  for (const ct of contentTypes.ORDER) sigs[ct] = sig(resolve(t.id, t.platform, 'evidence', ct));
  const uniq = new Set(Object.values(sigs));
  ctPairs += contentTypes.ORDER.length;
  ctDistinct += uniq.size;
  report.contentTypes[t.id] = { distinct: uniq.size, of: contentTypes.ORDER.length, hero: contentTypes.ORDER.map(ct => ct + '=' + heroSig(resolve(t.id, t.platform, 'evidence', ct))) };
}

// 3. Platforms differ (safe zones change the geometry).
let platPairs = 0, platDistinct = 0;
for (const t of templates.list()) {
  const sigs = {};
  for (const p of PLATFORMS) sigs[p] = sig(resolve(t.id, p, 'hook'));
  const uniq = new Set(Object.values(sigs));
  platPairs += PLATFORMS.length;
  platDistinct += uniq.size;
  report.platforms[t.id] = { distinct: uniq.size, of: PLATFORMS.length };
}

// 4. Treatments are distinct per template.
for (const t of templates.list()) {
  const d = resolve(t.id, t.platform, 'hook');
  report.treatments[t.id] = { treatment: d.treatment.id, frame: d.treatment.frame, scrim: !!d.scrim, focal: d.treatment.focal || null };
}

report.summary = {
  roleLayoutsDistinct: roleDistinct + '/' + rolePairs,
  contentTypeLayoutsDistinct: ctDistinct + '/' + ctPairs,
  platformLayoutsDistinct: platDistinct + '/' + platPairs,
  templates: templates.list().length,
  roles: ROLES.length,
  contentTypes: contentTypes.ORDER.length,
  platforms: PLATFORMS.length,
  combinations: templates.list().length * ROLES.length * contentTypes.ORDER.length * PLATFORMS.length
};

console.log(JSON.stringify(report, null, 2));
