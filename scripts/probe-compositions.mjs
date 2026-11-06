// Dumps the real layout geometry for every template for the SAME content, so
// the composition differences can be inspected (and asserted) rather than
// assumed. Run: node scripts/probe-compositions.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const templates = require('../public/lib/cardTemplates.js');
const engine = require('../public/lib/cardLayoutEngine.js');

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

const rows = [];
for (const t of templates.list()) {
  const d = resolve(t.id, t.platform, 'hook');
  const head = d.layers.find(l => l.key === 'headline');
  const sup = d.layers.find(l => l.key === 'supportingText');
  rows.push({
    id: t.id,
    name: t.name,
    treatment: d.treatment.id,
    deco: d.decoration.type + (d.decoration.text ? ':' + d.decoration.text : '') + (d.decoration.value ? ':' + d.decoration.value : ''),
    headBox: [head.box.x, head.box.y, head.box.width, head.box.height].map(n => +n.toFixed(3)).join(','),
    headAlign: head.align,
    headLines: head.lines.length,
    headSize: +head.sizePct.toFixed(4),
    headKw: head.keyword || '',
    headStacked: /\n/.test(head.displayText),
    supBox: sup && !sup.empty ? [sup.box.x, sup.box.y, sup.box.width, sup.box.height].map(n => +n.toFixed(3)).join(',') : '(hidden)',
    supLines: sup && !sup.empty ? sup.lines.length : 0
  });
}
console.log(JSON.stringify(rows, null, 1));

// Structural signature: geometry + alignment + line counts, NOT colour.
const sigs = new Map();
for (const r of rows) {
  const sig = [r.headBox, r.headAlign, r.headLines, r.supBox, r.supLines, r.treatment, r.deco].join('|');
  if (sigs.has(sig)) console.log('DUPLICATE SIGNATURE:', r.id, '==', sigs.get(sig));
  sigs.set(sig, r.id);
}
console.log('distinct signatures:', sigs.size, 'of', rows.length);
