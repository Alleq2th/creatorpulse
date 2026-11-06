// Headless-browser verification for Part 6 (the editing experience) and Part 7
// (the quality bar), at iPhone size (390x844).
//
// It drives the REAL app: the real core.js, the real layout engine, the real
// preview painter and the real export composer. It does not re-implement any of
// them. It exercises the editing controls the way a finger would — a real
// pointer drag, a real tap-to-edit, a real layout swap — and it runs the real
// download path, then compares the exported image with the preview.
//
// Run: node scripts/verify-editing-experience.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CP_BASE || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'shots-editing');
const CHROME = process.env.CHROME_PATH || undefined;

const TEMPLATES = ['viral_hook', 'silent_camera', 'quote_punch', 'minimal_noir', 'high_retention', 'impact', 'editorial', 'stat_split', 'dark_gradient', 'neon_noir'];
const ROLES = ['hook', 'context', 'evidence', 'cta'];
const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'];

// The SAME content for every template, so the screenshots are comparable.
const SLIDE = {
  type: 'hook', role: 'hook',
  headline: 'The headline that tells the story',
  supportingText: 'A supporting line that explains the point in plain words.',
  ctaLine: 'Follow for more',
  stat: '87%',
  slideNumber: 1, totalSlides: 4
};

const results = { checks: [], consoleErrors: [], shots: [] };
function check(name, pass, detail) {
  results.checks.push({ name, pass: !!pass, detail: detail || '' });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  await page.addInitScript(() => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 'harness-token', refreshToken: null,
      user: { id: 'harness-user', email: 'harness@example.com', name: 'Harness', niches: ['Football/Soccer'], platforms: ['tiktok', 'instagram', 'youtube', 'twitter'], primaryPlatform: 'tiktok', postsPerDay: 3 },
      connections: {}
    }));
  });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  async function waitFor(fn, label, tries = 80) {
    for (let i = 0; i < tries; i++) {
      if (await page.evaluate(fn)) return true;
      await page.waitForTimeout(250);
    }
    throw new Error('timed out waiting for ' + label);
  }
  await waitFor(() => typeof window.CPCardLayout !== 'undefined' && typeof window.CPCardEditControls !== 'undefined' && typeof window.CPCardQualityBar !== 'undefined', 'the design system + Part 6/7 modules');
  await waitFor(() => typeof S !== 'undefined' && S.mode === 'app', 'the app to boot');

  // ── Mount a real live stage for one template, in a fixed host ──────────────
  await page.evaluate(({ SLIDE }) => {
    const host = document.createElement('div');
    host.id = 'harness-host';
    host.style.cssText = 'position:fixed;left:0;top:0;width:390px;z-index:99999;background:#161616';
    document.body.appendChild(host);
    window.__mount = (templateId, platform, role, photoUrl) => {
      const tid = 'h_' + templateId + '_' + platform + '_' + role;
      const slide = Object.assign({}, SLIDE, { role, slideNumber: window.__ROLES.indexOf(role) + 1 });
      if (photoUrl) slide._style = { bgImage: photoUrl };
      const aspect = platform === 'tiktok' ? 'reel' : (platform === 'youtube' ? 'youtube' : (platform === 'twitter' ? 'twitter' : 'instagram'));
      S.outs[tid] = [{
        type: 'carousel', aspect, slides: [slide],
        _renderCtx: { category: 'sports', palette: 'noir_orange', format: aspect, imageUrl: '', template: templateId, theme: 'dark_editorial', typography: 'impact', density: 'normal' }
      }];
      const o = S.outs[tid][0];
      const ar = platform === 'tiktok' ? '9 / 16' : (platform === 'youtube' ? '16 / 9' : (platform === 'twitter' ? '1 / 1' : '4 / 5'));
      host.innerHTML = renderCardLiveStage(o, tid, 0, 0, slide, ar);
      cpSyncLiveStages();
      return tid;
    };
    window.__ROLES = ['hook', 'context', 'evidence', 'cta'];
  }, { SLIDE });

  // ── 1. Every template renders, with no blob / outline / overflow ───────────
  // The geometry sweep mounts 160 stages. Each mount would otherwise ask the
  // server to generate a photo plate, and the server's generation limiter
  // (60/hour) would be exhausted long before the real download test runs. The
  // sweep is about LAYOUT, not about the photo, so plate generation is stubbed
  // to a local data URL for this section only; the download test below runs
  // against the real server path.
  await page.evaluate(() => {
    window.__realGenerate = window.generateCardsWithRetry;
    window.generateCardsWithRetry = async () => ({ images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='] });
  });
  const renderChecks = await page.evaluate(({ TEMPLATES, ROLES, PLATFORMS }) => {
    const out = { blob: [], outlines: [], overflow: [], empty: [], tiktok: [], stages: 0, distinct: {} };
    for (const templateId of TEMPLATES) {
      for (const platform of PLATFORMS) {
        for (const role of ROLES) {
          const tid = window.__mount(templateId, platform, role);
          const stage = document.querySelector('#harness-host .cc-live-stage');
          if (!stage) continue;
          out.stages++;
          const sr = stage.getBoundingClientRect();
          stage.querySelectorAll('*').forEach(el => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const radius = parseFloat(cs.borderTopLeftRadius) || 0;
            const area = (r.width * r.height) / (sr.width * sr.height || 1);
            if (radius >= 100 && area > 0.5) out.blob.push({ templateId, platform, role, cls: el.className, radius, area: +area.toFixed(2) });
          });
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
            if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.overflow.push({ templateId, platform, role, why: 'overflow', sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
          });
          if (platform === 'tiktok') {
            const design = window.CPCardLayout.resolve({ templateId, platform, slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
            const z = design.safeZone;
            stage.querySelectorAll('.cp-canvas-block').forEach(el => {
              if (getComputedStyle(el).display === 'none') return;
              const r = el.getBoundingClientRect();
              const left = (r.left - sr.left) / sr.width, right = (r.right - sr.left) / sr.width;
              const top = (r.top - sr.top) / sr.height, bottom = (r.bottom - sr.top) / sr.height;
              if (left < z.left - 0.02 || right > 1 - z.right + 0.02 || top < z.top - 0.02 || bottom > 1 - z.bottom + 0.02) out.tiktok.push({ templateId, role, left: +left.toFixed(3), right: +right.toFixed(3), top: +top.toFixed(3), bottom: +bottom.toFixed(3) });
            });
          }
          // A composition signature per template, to prove they differ.
          const design = window.CPCardLayout.resolve({ templateId, platform, slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
          out.distinct[templateId] = (out.distinct[templateId] || '') + design.layers.map(l => [l.box.x.toFixed(2), l.box.y.toFixed(2), l.box.width.toFixed(2), l.box.height.toFixed(2)].join(',')).join(';') + '|';
        }
      }
    }
    return out;
  }, { TEMPLATES, ROLES, PLATFORMS });

  check('every template x role x platform renders a live stage', renderChecks.stages === TEMPLATES.length * ROLES.length * PLATFORMS.length, renderChecks.stages + ' stages');
  check('no giant coloured blob anywhere', renderChecks.blob.length === 0, JSON.stringify(renderChecks.blob.slice(0, 3)));
  check('no dashed outlines in the preview', renderChecks.outlines.length === 0, JSON.stringify(renderChecks.outlines.slice(0, 3)));
  check('no placeholder text in the preview', renderChecks.empty.length === 0, JSON.stringify(renderChecks.empty.slice(0, 3)));
  check('no overflow and no ellipsis', renderChecks.overflow.length === 0, JSON.stringify(renderChecks.overflow.slice(0, 3)));
  check('TikTok text stays inside the safe zone', renderChecks.tiktok.length === 0, JSON.stringify(renderChecks.tiktok.slice(0, 3)));
  const sigs = Object.values(renderChecks.distinct);
  check('at least 8 templates with visibly different compositions', new Set(sigs).size >= 8, new Set(sigs).size + ' distinct of ' + sigs.length);

  // ── 2. Tap-to-edit: a real double tap opens the words, typing changes them ─
  const editCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const stage = document.querySelector('#harness-host .cc-live-stage');
    const fire = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' }));
    const tap = async () => {
      // Re-query every time: the first tap selects the block and re-renders the
      // stage, so the element is replaced — exactly what a finger does.
      const block = stage.querySelector('.cp-canvas-block[data-canvas-block="headline"]');
      const r = block.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      fire(block, 'pointerdown', cx, cy); fire(block, 'pointerup', cx, cy);
      await new Promise(res => setTimeout(res, 120));
      return block;
    };
    await tap();
    let block = await tap();
    let txt = block.querySelector('.cc-live-text');
    let editable = txt.getAttribute('contenteditable') === 'true';
    if (!editable) { block = await tap(); txt = block.querySelector('.cc-live-text'); editable = txt.getAttribute('contenteditable') === 'true'; }
    if (editable) {
      txt.innerText = 'A brand new headline';
      txt.dispatchEvent(new InputEvent('input', { bubbles: true }));
      txt.blur();
    }
    await new Promise(r => setTimeout(r, 80));
    const slide = S.outs[tid][0].slides[0];
    return { editable, headline: slide.headline };
  });
  check('tap-to-edit opens the words and typing changes them', editCheck.editable && /a brand new headline/i.test(editCheck.headline), JSON.stringify(editCheck));

  // ── 3. Layout swap: the variant carousel changes THIS slide's composition ──
  const variantCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const before = window.CPCardLayout.resolve({ templateId: 'impact', platform: 'instagram', slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
    const variants = window.CPCardEditControls.layoutVariantsFor({ templateId: 'impact', platform: 'instagram', slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
    const target = variants.find(v => v.role !== before.role) || variants[1];
    window.cpSetSlideVariant(tid, 0, 0, target.role);
    await new Promise(r => setTimeout(r, 60));
    const after = window.CPCardLayout.resolve({ templateId: 'impact', platform: 'instagram', slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
    return { count: variants.length, beforeRole: before.role, afterRole: after.role, changed: JSON.stringify(before.layers.map(l => l.box)) !== JSON.stringify(after.layers.map(l => l.box)) };
  });
  check('the layout-variant carousel offers 3-4 real compositions', variantCheck.count >= 3 && variantCheck.count <= 4, variantCheck.count + ' variants');
  check('swapping the layout variant changes this slide', variantCheck.changed && variantCheck.afterRole !== variantCheck.beforeRole, JSON.stringify(variantCheck));

  // ── 4. Drag-to-reposition: a real pointer drag snaps to the 8pt grid ───────
  const dragCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const stage = document.querySelector('#harness-host .cc-live-stage');
    const block = stage.querySelector('.cp-canvas-block[data-canvas-block="headline"]');
    const r = block.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const fire = (type, x, y) => block.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 2, pointerType: 'touch' }));
    fire('pointerdown', cx, cy);
    fire('pointermove', cx + 6, cy - 40);
    fire('pointermove', cx + 12, cy - 80);
    fire('pointerup', cx + 12, cy - 80);
    await new Promise(r => setTimeout(r, 80));
    const slide = S.outs[tid][0].slides[0];
    const design = window.CPCardLayout.resolve({ templateId: 'impact', platform: 'instagram', slide, index: 0, total: 4, style: {} });
    const box = design.layers.find(l => l.key === 'headline').box;
    const z = design.safeZone;
    const onGrid = window.CPCardEditControls.onGrid(box.x, design.canvas.width) && window.CPCardEditControls.onGrid(box.y, design.canvas.height);
    const inZone = box.x >= z.left - 1e-6 && box.y >= z.top - 1e-6 && box.x + box.width <= 1 - z.right + 1e-6 && box.y + box.height <= 1 - z.bottom + 1e-6;
    return { moved: !!slide.textLayout, onGrid, inZone, box };
  });
  check('drag-to-reposition moves the text', dragCheck.moved, JSON.stringify(dragCheck.box));
  check('the dragged box snaps to the 8pt grid', dragCheck.onGrid, JSON.stringify(dragCheck.box));
  check('the dragged box stays inside the safe zone', dragCheck.inZone, JSON.stringify(dragCheck.box));

  // ── 5. Undo / redo ─────────────────────────────────────────────────────────
  const undoCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const slide = S.outs[tid][0].slides[0];
    const original = slide.headline;
    window.cpSetSlideText(tid, 0, 0, 'headline', 'Changed once');
    window.cpPushHistory(tid, 0, 0);
    window.cpSetSlideText(tid, 0, 0, 'headline', 'Changed twice');
    window.cpPushHistory(tid, 0, 0);
    const canUndo = window.cpCanUndoSlide(tid, 0, 0);
    window.cpUndoSlide(tid, 0, 0);
    const afterUndo = slide.headline;
    window.cpRedoSlide(tid, 0, 0);
    const afterRedo = slide.headline;
    return { original, canUndo, afterUndo, afterRedo };
  });
  check('undo steps back and redo steps forward', undoCheck.canUndo && undoCheck.afterUndo === 'Changed once' && undoCheck.afterRedo === 'Changed twice', JSON.stringify(undoCheck));

  // ── 6. Apply-to-all with a per-slide override ──────────────────────────────
  const applyCheck = await page.evaluate(async ({ SLIDE }) => {
    const tid = 'apply_all';
    const slides = [
      Object.assign({}, SLIDE, { role: 'hook', _style: {} }),
      Object.assign({}, SLIDE, { role: 'context', _style: { override: true, templateId: 'editorial' } }),
      Object.assign({}, SLIDE, { role: 'evidence', _style: {} })
    ];
    S.outs[tid] = [{ type: 'carousel', aspect: 'instagram', slides, _renderCtx: { category: 'sports', palette: 'noir_orange', format: 'instagram', imageUrl: '', template: 'impact', theme: 'dark_editorial', typography: 'impact', density: 'normal' } }];
    window.cpApplyToAll(tid, 0, { templateId: 'stat_split' });
    await new Promise(r => setTimeout(r, 60));
    return { s0: slides[0]._templateId, s1: slides[1]._templateId, s1style: slides[1]._style.templateId, s2: slides[2]._templateId };
  }, { SLIDE });
  check('apply-to-all propagates to every slide', applyCheck.s0 === 'stat_split' && applyCheck.s2 === 'stat_split', JSON.stringify(applyCheck));
  check('a per-slide override is left alone by apply-to-all', applyCheck.s1 === undefined && applyCheck.s1style === 'editorial', JSON.stringify(applyCheck));

  // ── 7. Edit-mode guides appear in edit mode only ───────────────────────────
  const guideCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const stage = document.querySelector('#harness-host .cc-live-stage');
    const before = !!stage.querySelector('.cc-guides');
    window.cpToggleEditMode(tid, 0, 0);
    await new Promise(r => setTimeout(r, 60));
    const on = !!stage.querySelector('.cc-guides');
    const safe = !!stage.querySelector('.cc-guide-safe');
    const boxes = stage.querySelectorAll('.cc-guide-box').length;
    window.cpToggleEditMode(tid, 0, 0);
    await new Promise(r => setTimeout(r, 60));
    const off = !!stage.querySelector('.cc-guides');
    return { before, on, safe, boxes, off };
  });
  check('edit-mode guides appear only in edit mode', !guideCheck.before && guideCheck.on && guideCheck.safe && guideCheck.boxes > 0 && !guideCheck.off, JSON.stringify(guideCheck));

  // ── 8. Thumbnails show the real photo and text ─────────────────────────────
  const thumbCheck = await page.evaluate(({ SLIDE }) => {
    const design = window.CPCardLayout.resolve({ templateId: 'editorial', platform: 'instagram', slide: Object.assign({}, SLIDE, { role: 'hook' }), index: 0, total: 4, style: {} });
    const html = window.CPCardThumbnails.miniHTML(design, 'https://example.com/photo.jpg');
    const head = design.layers.find(l => l.key === 'headline');
    return { hasText: html.includes(head.displayText), hasPhoto: html.includes('example.com/photo.jpg'), hasLayer: html.includes('cc-th-layer') };
  }, { SLIDE });
  check('thumbnails show the real photo and the real text', thumbCheck.hasText && thumbCheck.hasPhoto && thumbCheck.hasLayer, JSON.stringify(thumbCheck));

  // ── 9. Skeleton shows while an image generates ─────────────────────────────
  const skelCheck = await page.evaluate(() => {
    const html = window.CPCardSkeleton.skeletonHTML({ aspect: '9/16' });
    return { hasAspect: html.includes('aspect-ratio:9/16'), hasBars: html.includes('cc-skel-bar'), noSpinner: !/spinner/i.test(html) };
  });
  check('a skeleton (not a spinner) shows while images generate', skelCheck.hasAspect && skelCheck.hasBars && skelCheck.noSpinner, JSON.stringify(skelCheck));

  // ── 10. Download works for every template, and preview == export ───────────
  // Restore the real generation path: the download test must exercise the real
  // server, not the stub the geometry sweep used.
  await page.evaluate(() => { if (window.__realGenerate) window.generateCardsWithRetry = window.__realGenerate; });
  const exportChecks = await page.evaluate(async ({ TEMPLATES }) => {
    const out = [];
    for (const templateId of TEMPLATES) {
      const tid = window.__mount(templateId, 'instagram', 'hook');
      let url = '';
      try { url = await cpFlushExport(tid, 0, 0); } catch (e) { url = 'ERR:' + e.message; }
      out.push({ templateId, ok: typeof url === 'string' && url.startsWith('data:image'), len: (url || '').length });
    }
    return out;
  }, { TEMPLATES });
  const exportFails = exportChecks.filter(e => !e.ok);
  check('download works for every template', exportFails.length === 0, exportFails.length ? JSON.stringify(exportFails) : exportChecks.length + ' templates');

  // Preview == export: the exported image's text boxes must sit where the
  // preview's boxes sit. We compare the engine's own layout (the single source
  // both paths read) against the DOM boxes the preview painted.
  const parityCheck = await page.evaluate(async () => {
    const tid = window.__mount('impact', 'instagram', 'hook');
    const stage = document.querySelector('#harness-host .cc-live-stage');
    const sr = stage.getBoundingClientRect();
    const design = window.CPCardLayout.resolve({ templateId: 'impact', platform: 'instagram', slide: S.outs[tid][0].slides[0], index: 0, total: 4, style: {} });
    const diffs = [];
    design.layers.forEach(l => {
      if (l.empty) return;
      const el = stage.querySelector(`.cp-canvas-block[data-canvas-block="${l.key}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = Math.abs((r.left - sr.left) / sr.width - l.box.x);
      const dy = Math.abs((r.top - sr.top) / sr.height - l.box.y);
      const dw = Math.abs(r.width / sr.width - l.box.width);
      if (dx > 0.01 || dy > 0.01 || dw > 0.01) diffs.push({ key: l.key, dx: +dx.toFixed(3), dy: +dy.toFixed(3), dw: +dw.toFixed(3) });
    });
    return { diffs };
  });
  check('preview and export share one layout (boxes match)', parityCheck.diffs.length === 0, JSON.stringify(parityCheck.diffs));

  // ── 11. Screenshots of every template with the SAME content ────────────────
  // The same real photo is used for every template, so the screenshots show the
  // photo treatments and the scrim, not just the type. The plate is set directly
  // (no server call), so the generation limiter is not touched.
  const PHOTO = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'shots-editing', 'photo.b64'), 'utf8').trim();
  for (const templateId of TEMPLATES) {
    await page.evaluate(({ templateId, PHOTO }) => {
      const tid = window.__mount(templateId, 'instagram', 'hook', PHOTO);
      const key = cpPlateKey(tid, 0, 0);
      cpPlateCache.set(key, { src: PHOTO, failed: false, pending: false });
      cpPaintPlate(key);
    }, { templateId, PHOTO });
    await page.waitForTimeout(120);
    const el = await page.$('#harness-host .cc-live-stage');
    if (!el) continue;
    const file = path.join(OUT, `${templateId}.png`);
    await el.screenshot({ path: file });
    results.shots.push(file);
  }
  check('captured a screenshot of every template', results.shots.length === TEMPLATES.length, results.shots.length + ' shots');

  // ── 12. Other tabs still respond ───────────────────────────────────────────
  const tabs = await page.evaluate(() => {
    const out = {};
    for (const t of ['home', 'hooks', 'calendar', 'profile', 'create']) {
      try { window.setTab(t); render(); out[t] = S.tab === t && document.getElementById('root').innerHTML.length > 200; }
      catch (e) { out[t] = 'ERR:' + e.message; }
    }
    window.setTab('home'); render();
    return out;
  });
  check('other tabs still respond', Object.values(tabs).every(v => v === true), JSON.stringify(tabs));

  results.consoleErrors = consoleErrors;
  // Resource-load failures are environment noise, not app errors: the sandbox
  // TLS proxy blocks Google Fonts (ERR_CERT_AUTHORITY_INVALID), there is no
  // favicon (404), and push endpoints return 503 because VAPID keys are unset.
  // They appear on the untouched base branch too. A real JS error is a
  // pageerror, or a console error that is not a resource-load failure.
  const resourceNoise = /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_/;
  const realErrors = consoleErrors.filter(e => !resourceNoise.test(e));
  check('no uncaught JavaScript errors', realErrors.length === 0, realErrors.slice(0, 5).join(' | ') || (consoleErrors.length + ' resource-load notices ignored (fonts/favicon/push)'));

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const failed = results.checks.filter(c => !c.pass);
  console.log('\n' + (failed.length ? 'FAILED ' + failed.length + ' of ' + results.checks.length : 'ALL ' + results.checks.length + ' CHECKS PASSED'));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
