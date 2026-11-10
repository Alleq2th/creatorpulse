const test = require('node:test');
const assert = require('node:assert/strict');
const statCard = require('../services/statCard.js');
const fs = require('node:fs');

test('White Panel export draws a curved top seam and print texture', () => {
  const svg = statCard.renderPanelSVG(
    { backgroundStart: '#fbfaf7', accent: '#c8452c' },
    { w: 1080, h: 1350, margin: 80 },
    { slideNumber: 1, totalSlides: 4 },
    {},
    {},
    {
      panel: { x: 0, y: 0.64, width: 1, height: 0.36, bg: '#fbfaf7', radius: 38 },
      decoration: { type: 'none' },
      layers: []
    },
    { name: 'Sportsguys Media' }
  );
  assert.match(svg, /<path d="M 0 .* Q 0 .* 38 H 1042 Q 1080 .* 1080 .* V 1350 H 0 Z"/);
  assert.match(svg, /cpPanelDots/);
  assert.match(svg, />SM</);
  assert.match(svg, /SWIPE →/);
});

test('White Panel final slide does not show a redundant swipe cue', () => {
  const svg = statCard.renderPanelSVG(
    { backgroundStart: '#fbfaf7', accent: '#c8452c' },
    { w: 1080, h: 1350, margin: 80 },
    { slideNumber: 4, totalSlides: 4 },
    {},
    {},
    { panel: { x: 0, y: 0.64, width: 1, height: 0.36, bg: '#fbfaf7', radius: 38 }, decoration: { type: 'none' }, layers: [] },
    null
  );
  assert.doesNotMatch(svg, /SWIPE →/);
});

test('photo-backed templates keep their signature decoration in the export path', () => {
  const source = fs.readFileSync(require.resolve('../services/statCard.js'), 'utf8');
  assert.match(source, /if \(design && scrimStrength != null\)[\s\S]*?templateDecoration\(design, p, f\)/);
  assert.match(source, /design\.scrim \? templatePhotoScrimDefs\(design, f\) : ""/);
  assert.match(source, /if \(design\) return templateBackgroundLayer\(design, p, f, slideType\)/);
  assert.match(source, /design\.templateId === "full_bleed_quote"/);
});

test('White Panel photo seam has a curved overlap in the shared treatment', () => {
  const treatment = require('../public/lib/photoTreatments.js').resolve('whitePanel', {});
  assert.ok(treatment.panel.radius > 0);
  assert.ok(treatment.panel.overlap > 0);
});

test('template picker preview uses the selected photo treatment and panel', () => {
  const steps = fs.readFileSync(require.resolve('../public/create/steps.js'), 'utf8');
  const css = fs.readFileSync(require.resolve('../public/create/create.css'), 'utf8');
  assert.match(steps, /cc-template-photo/);
  assert.match(steps, /design\.treatment/);
  assert.match(steps, /design\.panel/);
  assert.match(steps, /news1\.jpg/);
  assert.match(css, /\.cc-template-photo/);
  assert.match(css, /\.cc-template-panel::after/);
});

test('photo export uses the shared scrim stop colours and alpha values', () => {
  const svgDefs = statCard.templatePhotoScrimDefs({
    scrim: { stops: [
      { offset: 0, color: 'rgba(0,0,0,.18)' },
      { offset: 0.45, color: 'rgba(0,0,0,.42)' },
      { offset: 1, color: 'rgba(0,0,0,.88)' }
    ] }
  }, { w: 1080, h: 1350 });
  assert.match(svgDefs, /stop-color="rgb\(0,0,0\)" stop-opacity="0\.180"/);
  assert.match(svgDefs, /offset="45\.00%"/);
  assert.match(svgDefs, /stop-opacity="0\.880"/);
});
