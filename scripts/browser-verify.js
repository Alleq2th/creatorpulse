// Headless-browser verification for Parts 3, 4 and 5, at iPhone size (390x844).
//
// It drives the REAL app: the real core.js, the real layout engine, the real
// preview painter and the real export composer. It does not re-implement any of
// them. For every template x role x platform it renders the live stage, then
// asserts the things the brief asks for, and it runs the real download path.
//
// Run: node scripts/browser-verify.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.CP_BASE || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'shots');
const CHROME = process.env.CHROME_PATH || undefined;

const TEMPLATES = ['impact', 'editorial', 'stat_split', 'quote_card', 'breaking_alert', 'headline_stack', 'minimal_caption', 'neon_ambient', 'viral_hook'];
const ROLES = ['hook', 'context', 'evidence', 'cta'];
const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'];

const SLIDES = {
  hook: { type: 'hook', headline: 'City win the title', supportingText: 'A late goal seals it', ctaLine: 'Follow for more', stat: '87%' },
  context: { type: 'context', headline: 'Why it matters now', supportingText: 'The board backed the manager all season', ctaLine: 'Follow for more', stat: '87%' },
  evidence: { type: 'evidence', headline: 'The number that decided it', supportingText: '87% of the possession', ctaLine: 'Follow for more', stat: '87%' },
  cta: { type: 'cta', headline: 'Follow for more', supportingText: 'Daily football stories', ctaLine: 'Follow for more', stat: '87%' }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  // A signed-in session, so the app boots straight into the main UI.
  await page.addInitScript(() => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 'harness-token', refreshToken: null,
      user: { id: 'harness-user', email: 'harness@example.com', name: 'Harness', niches: ['Football/Soccer'], platforms: ['tiktok', 'instagram', 'youtube', 'twitter'], primaryPlatform: 'tiktok', postsPerDay: 3 },
      connections: {}
    }));
  });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  // The app's CSP has no 'unsafe-eval', so page.waitForFunction (which evals a
  // string in the page) is refused. Poll from the driver side instead.
  async function waitFor(fn, label, tries = 80) {
    for (let i = 0; i < tries; i++) {
      if (await page.evaluate(fn)) return true;
      await page.waitForTimeout(250);
    }
    throw new Error('timed out waiting for ' + label);
  }
  await waitFor(() => typeof window.CPCardLayout !== 'undefined' && typeof window.CPCardPaint !== 'undefined', 'the design system');
  await waitFor(() => typeof S !== 'undefined' && S.mode === 'app', 'the app to boot');

  const results = { stages: [], export: [], consoleErrors: [], blob: [], overflow: [], outlines: [], tiktok: [], scrim: [], counter: [], empty: [] };

  // ── Render every template x role x platform into the real live stage ──────
  const renderAll = await page.evaluate(({ TEMPLATES, ROLES, PLATFORMS, SLIDES }) => {
    const out = [];
    const host = document.createElement('div');
    host.id = 'harness-host';
    host.style.cssText = 'position:fixed;left:0;top:0;width:390px;z-index:99999;background:#000';
    document.body.appendChild(host);
    for (const templateId of TEMPLATES) {
      for (const platform of PLATFORMS) {
        for (const role of ROLES) {
          const tid = 'h_' + templateId + '_' + platform + '_' + role;
          const slide = Object.assign({}, SLIDES[role], { role, slideNumber: ROLES.indexOf(role) + 1, totalSlides: 4 });
          const aspect = platform === 'tiktok' ? 'reel' : (platform === 'youtube' ? 'youtube' : (platform === 'twitter' ? 'twitter' : 'instagram'));
          S.outs[tid] = [{
            type: 'carousel', aspect,
            slides: [slide],
            _renderCtx: { category: 'sports', palette: 'noir_orange', format: aspect, imageUrl: '', template: templateId, theme: 'dark_editorial', typography: 'impact', density: 'normal' }
          }];
          const o = S.outs[tid][0];
          const ar = platform === 'tiktok' ? '9 / 16' : (platform === 'youtube' ? '16 / 9' : (platform === 'twitter' ? '1 / 1' : '4 / 5'));
          const html = renderCardLiveStage(o, tid, 0, 0, slide, ar);
          host.innerHTML = html;
          cpSyncLiveStages();
          const stage = host.querySelector('.cc-live-stage');
          const design = window.CPCardLayout.resolve({ templateId, platform, slide, index: 0, total: 4, style: {} });
          out.push({ templateId, platform, role, stageFound: !!stage, design: { role: design.role, contentType: design.contentType, heroKey: design.heroKey, treatment: design.treatment.id, hasScrim: !!design.scrim, counter: design.counter.label, layers: design.layers.map(l => ({ key: l.key, x: +l.box.x.toFixed(3), y: +l.box.y.toFixed(3), w: +l.box.width.toFixed(3), h: +l.box.height.toFixed(3), size: +l.sizePct.toFixed(4), lines: l.lines.length, align: l.align, anchor: l.anchor, empty: l.empty })) } });
        }
      }
    }
    return out;
  }, { TEMPLATES, ROLES, PLATFORMS, SLIDES });
  results.stages = renderAll;

  // ── DOM assertions on the rendered stage (one template at a time) ─────────
  const domChecks = await page.evaluate(({ TEMPLATES, ROLES, PLATFORMS, SLIDES }) => {
    const host = document.getElementById('harness-host');
    const out = { blob: [], overflow: [], outlines: [], tiktok: [], scrim: [], counter: [], empty: [], overlap: [] };
    for (const templateId of TEMPLATES) {
      for (const platform of PLATFORMS) {
        for (const role of ROLES) {
          const tid = 'h_' + templateId + '_' + platform + '_' + role;
          const slide = Object.assign({}, SLIDES[role], { role, slideNumber: ROLES.indexOf(role) + 1, totalSlides: 4 });
          const o = S.outs[tid][0];
          const ar = platform === 'tiktok' ? '9 / 16' : (platform === 'youtube' ? '16 / 9' : (platform === 'twitter' ? '1 / 1' : '4 / 5'));
          host.innerHTML = renderCardLiveStage(o, tid, 0, 0, slide, ar);
          cpSyncLiveStages();
          const stage = host.querySelector('.cc-live-stage');
          if (!stage) continue;
          const sr = stage.getBoundingClientRect();
          const design = window.CPCardLayout.resolve({ templateId, platform, slide, index: 0, total: 4, style: {} });

          // 1. No giant coloured blob: nothing in the stage may be a huge
          //    rounded capsule covering most of the card.
          stage.querySelectorAll('*').forEach(el => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const radius = parseFloat(cs.borderTopLeftRadius) || 0;
            const area = (r.width * r.height) / (sr.width * sr.height || 1);
            if (radius >= 100 && area > 0.5) out.blob.push({ templateId, platform, role, cls: el.className, radius, area: +area.toFixed(2) });
          });

          // 2. No dashed outlines and no placeholder text in the preview.
          stage.querySelectorAll('.cp-canvas-block').forEach(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none') return;
            if (cs.borderTopStyle === 'dashed' || cs.borderBottomStyle === 'dashed') out.outlines.push({ templateId, platform, role, cls: el.className });
            if (el.classList.contains('is-empty')) out.empty.push({ templateId, platform, role, cls: el.className });
          });
          stage.querySelectorAll('.cc-live-text').forEach(el => {
            if (getComputedStyle(el).display === 'none') return;
            if (el.classList.contains('is-empty')) out.empty.push({ templateId, platform, role, cls: 'cc-live-text is-empty' });
            const t = (el.textContent || '');
            if (/\u2026|\.\.\./.test(t)) out.overflow.push({ templateId, platform, role, why: 'ellipsis', text: t.slice(0, 40) });
          });

          // 3. No overflow: every visible text box holds its own text.
          stage.querySelectorAll('.cc-live-text').forEach(el => {
            if (getComputedStyle(el).display === 'none') return;
            if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
              out.overflow.push({ templateId, platform, role, why: 'overflow', sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight, text: (el.textContent || '').slice(0, 30) });
            }
          });

          // 3b. No two rendered TEXT boxes may overlap each other (a content-type
          //     nudge must never push one block's text into another's). The
          //     layout REGIONS may touch by design; the visible text may not.
          const boxes = [];
          stage.querySelectorAll('.cc-live-text').forEach(el => {
            if (getComputedStyle(el).display === 'none') return;
            if (!(el.textContent || '').trim()) return;
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) boxes.push({ cls: el.className, r });
          });
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i].r, b = boxes[j].r;
              const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (ox > 2 && oy > 2) out.overlap.push({ templateId, platform, role, a: boxes[i].cls, b: boxes[j].cls, ox: +ox.toFixed(1), oy: +oy.toFixed(1) });
            }
          }

          // 4. TikTok: text inside the safe zone (clear of the right action rail
          //    and the bottom caption area).
          if (platform === 'tiktok') {
            const z = design.safeZone;
            stage.querySelectorAll('.cp-canvas-block').forEach(el => {
              if (getComputedStyle(el).display === 'none') return;
              const r = el.getBoundingClientRect();
              const left = (r.left - sr.left) / sr.width, right = (r.right - sr.left) / sr.width;
              const top = (r.top - sr.top) / sr.height, bottom = (r.bottom - sr.top) / sr.height;
              if (left < z.left - 0.02 || right > 1 - z.right + 0.02 || top < z.top - 0.02 || bottom > 1 - z.bottom + 0.02) {
                out.tiktok.push({ templateId, role, left: +left.toFixed(3), right: +right.toFixed(3), top: +top.toFixed(3), bottom: +bottom.toFixed(3), z });
              }
            });
          }

          // 5. The scrim rule, in the DOM: if a text box overlaps the photo
          //    plate, the scrim element must be visible.
          const plate = stage.querySelector('.cc-live-plate');
          const scrim = stage.querySelector('.cc-live-scrim');
          const pr = plate ? plate.getBoundingClientRect() : null;
          const scrimVisible = scrim && getComputedStyle(scrim).backgroundImage !== 'none' && getComputedStyle(scrim).display !== 'none';
          let overlaps = false;
          if (pr && pr.width > 0) {
            stage.querySelectorAll('.cp-canvas-block').forEach(el => {
              if (getComputedStyle(el).display === 'none') return;
              const r = el.getBoundingClientRect();
              if (r.left < pr.right && r.right > pr.left && r.top < pr.bottom && r.bottom > pr.top) overlaps = true;
            });
          }
          if (overlaps && !scrimVisible) out.scrim.push({ templateId, platform, role, why: 'text over photo with no visible scrim' });

          // 6. The carousel counter is drawn into the card.
          const counter = stage.querySelector('.cc-live-counter');
          const counterVisible = counter && !counter.hidden && (counter.textContent || '').trim().length > 0;
          if (!counterVisible) out.counter.push({ templateId, platform, role });
        }
      }
    }
    return out;
  }, { TEMPLATES, ROLES, PLATFORMS, SLIDES });
  Object.assign(results, domChecks);

  // ── The real download path, for every template ────────────────────────────
  const exportChecks = await page.evaluate(async ({ TEMPLATES, SLIDES }) => {
    const out = [];
    for (const templateId of TEMPLATES) {
      const tid = 'x_' + templateId;
      const slide = Object.assign({}, SLIDES.hook, { role: 'hook', slideNumber: 1, totalSlides: 1 });
      S.outs[tid] = [{
        type: 'carousel', aspect: 'instagram', slides: [slide],
        _renderCtx: { category: 'sports', palette: 'noir_orange', format: 'instagram', imageUrl: '', template: templateId, theme: 'dark_editorial', typography: 'impact', density: 'normal' }
      }];
      let url = '';
      try { url = await cpFlushExport(tid, 0, 0); } catch (e) { url = 'ERR:' + e.message; }
      out.push({ templateId, ok: typeof url === 'string' && url.startsWith('data:image'), len: (url || '').length, head: String(url).slice(0, 30) });
    }
    return out;
  }, { TEMPLATES, SLIDES });
  results.export = exportChecks;

  // ── Screenshots of representative stages ──────────────────────────────────
  const shots = [];
  const shotList = [
    ['impact', 'instagram', 'hook'], ['impact', 'tiktok', 'hook'],
    ['editorial', 'instagram', 'context'], ['stat_split', 'instagram', 'evidence'],
    ['quote_card', 'instagram', 'evidence'], ['breaking_alert', 'instagram', 'hook'],
    ['headline_stack', 'instagram', 'hook'], ['minimal_caption', 'instagram', 'context'],
    ['neon_ambient', 'instagram', 'evidence'], ['viral_hook', 'tiktok', 'hook'],
    ['impact', 'instagram', 'cta'], ['stat_split', 'tiktok', 'evidence']
  ];
  for (const [templateId, platform, role] of shotList) {
    const tid = 'h_' + templateId + '_' + platform + '_' + role;
    const ok = await page.evaluate(({ tid, platform, role, SLIDES }) => {
      const host = document.getElementById('harness-host');
      const slide = Object.assign({}, SLIDES[role], { role, slideNumber: 1, totalSlides: 4 });
      const o = S.outs[tid] && S.outs[tid][0];
      if (!o) return false;
      const ar = platform === 'tiktok' ? '9 / 16' : (platform === 'youtube' ? '16 / 9' : (platform === 'twitter' ? '1 / 1' : '4 / 5'));
      host.innerHTML = renderCardLiveStage(o, tid, 0, 0, slide, ar);
      cpSyncLiveStages();
      return true;
    }, { tid, platform, role, SLIDES });
    if (!ok) continue;
    const el = await page.$('#harness-host .cc-live-stage');
    if (!el) continue;
    const file = path.join(OUT, `${templateId}_${platform}_${role}.png`);
    await el.screenshot({ path: file });
    shots.push(file);
  }
  results.shots = shots;

  // ── Other tabs still respond ──────────────────────────────────────────────
  const tabs = await page.evaluate(() => {
    const out = {};
    for (const t of ['home', 'hooks', 'calendar', 'profile', 'create']) {
      try { window.setTab(t); render(); out[t] = S.tab === t && document.getElementById('root').innerHTML.length > 200; }
      catch (e) { out[t] = 'ERR:' + e.message; }
    }
    window.setTab('home'); render();
    return out;
  });
  results.tabs = tabs;

  results.consoleErrors = consoleErrors;
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({
    stages: results.stages.length,
    blob: results.blob.length,
    overflow: results.overflow.length,
    outlines: results.outlines.length,
    empty: results.empty.length,
    overlap: results.overlap.length,
    overlapSamples: results.overlap.slice(0, 6),
    tiktok: results.tiktok.length,
    scrim: results.scrim.length,
    counter: results.counter.length,
    exportOk: results.export.filter(e => e.ok).length,
    exportTotal: results.export.length,
    exportFails: results.export.filter(e => !e.ok),
    tabs: results.tabs,
    consoleErrors: results.consoleErrors.slice(0, 10),
    shots: results.shots.length
  }, null, 2));
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
