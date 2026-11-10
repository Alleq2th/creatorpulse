const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const elements = require('../public/lib/cardElementLibrary.js');
const editor = require('../public/lib/cardEditor.js');
const core = fs.readFileSync(path.join(__dirname, '../public/core.js'), 'utf8');
const typography = fs.readFileSync(path.join(__dirname, '../public/lib/cardTypography.js'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '../services/statCard.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('the Elements library creates all four supported element types', () => {
  for (const type of ['text', 'badge', 'rule', 'circle']) {
    const item = elements.create(type, 0);
    assert.equal(item.type, type);
    assert.ok(item.id);
  }
});

test('element normalization clamps geometry, rejects unsafe colours and caps the library', () => {
  const list = elements.normalize([
    { id: 'x', type: 'text', text: '<script>', x: 4, y: -2, width: 5, height: 0, color: 'url(javascript:alert(1))', font: 'not-a-font' },
    ...Array.from({ length: 30 }, (_, i) => ({ id: 'e' + i, type: 'circle', x: .2, y: .2, width: .1, height: .1, color: '#112233' }))
  ]);
  assert.equal(list.length, 24);
  assert.equal(list[0].x, .96);
  assert.equal(list[0].y, 0);
  assert.equal(list[0].width, 1);
  assert.equal(list[0].height, .008);
  assert.equal(list[0].color, '#ffffff');
  assert.equal(list[0].font, 'impact');
});

test('live element markup escapes text and emits the same saved position and colour', () => {
  const html = elements.renderHTML([{ id: 'tag', type: 'text', text: '<b>hello</b>', x: .2, y: .3, width: .5, height: .1, color: '#ff0000', font: 'impact', fontSize: .04 }]);
  assert.match(html, /&lt;b&gt;hello&lt;\/b&gt;/);
  assert.match(html, /left:20\.000%/);
  assert.match(html, /top:30\.000%/);
  assert.match(html, /color:#ff0000/);
});

test('canvas element painter handles text, badge, rule and circle elements', () => {
  const calls = [];
  const ctx = {
    save(){}, restore(){}, translate(){}, rotate(){}, fillRect(){calls.push('rect');},
    beginPath(){}, arc(){calls.push('circle');}, fill(){}, roundRect(){},
    fillText(){calls.push('text');}
  };
  elements.drawCanvas(ctx, [
    { id:'t', type:'text', text:'Text', x:.1, y:.1, width:.5, height:.1, fontSize:.03 },
    { id:'b', type:'badge', text:'NEW', x:.1, y:.2, width:.2, height:.06, fontSize:.02 },
    { id:'r', type:'rule', x:.1, y:.3, width:.4, height:.01 },
    { id:'c', type:'circle', x:.8, y:.1, width:.1, height:.1 }
  ], 1080, 1350);
  assert.ok(calls.includes('text'));
  assert.ok(calls.includes('rect'));
  assert.ok(calls.includes('circle'));
});

test('editor exposes five sections and a working Elements library', () => {
  assert.equal(editor.NAV.length, 5);
  assert.ok(editor.NAV.some(x => x.id === 'elements'));
  const markup = editor.buildSheet({ design:null, templates:[], treatments:[], roles:[], elements:[] });
  assert.match(markup, /data-ed-add="text"/);
  assert.match(markup, /data-ed-add="badge"/);
  assert.match(markup, /data-ed-add="rule"/);
  assert.match(markup, /data-ed-add="circle"/);
});

test('all 26 fonts are available to the live text controls and layout engine', () => {
  const match = core.match(/const CARD_TYPOGRAPHIES = \[([\s\S]*?)\];/);
  assert.ok(match);
  assert.equal((match[1].match(/\{ id:/g) || []).length, 26);
  for (const id of ['archivo_black','bebas_neue','barlow_condensed','dm_serif_display','space_mono','source_code_pro']) {
    assert.match(typography, new RegExp(id + ':'));
    assert.match(renderer, new RegExp(id + ':'));
  }
});

test('photo crop position and replacement flow update the shared design state', () => {
  const cardEditor = fs.readFileSync(path.join(__dirname, '../public/lib/cardEditor.js'), 'utf8');
  assert.match(cardEditor, /data-ed-crop="cropX"/);
  assert.match(cardEditor, /data-ed-crop="cropY"/);
  assert.match(cardEditor, /data-ed-replace-image/);
  assert.match(core, /onReplaceImage: \(input\) => window\.cpPickCardBackground/);
  assert.match(core, /sty\.cropX/);
  assert.match(core, /sty\.cropY/);
});

test('elements are included in undo snapshots, live preview and final image export', () => {
  assert.match(core, /elements: Array\.isArray\(slide\.elements\)/);
  assert.match(core, /slide\.elements = JSON\.parse\(JSON\.stringify\(snap\.elements\)\)/);
  assert.match(core, /CPCardElementLibrary\.renderHTML\(slide\.elements \|\| \[\]\)/);
  assert.match(core, /CPCardElementLibrary\.drawCanvas\(ctx, state\.elements \|\| \[\], W, H\)/);
  assert.match(core, /elements: window\.CPCardElementLibrary/);
  assert.match(html, /lib\/cardElementLibrary\.js\?v=1/);
});
