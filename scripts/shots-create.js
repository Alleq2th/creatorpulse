// Screenshot harness for the Create flow + template gallery + generated slides.
//
// Drives the REAL app (real core.js, real layout engine, real painters) at
// iPhone size and writes PNGs to shots/<label>/. Used to capture before/after
// evidence for the design overhaul, and to eyeball the generated output.
//
// Run: node scripts/shots-create.js <label>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.CP_BASE || 'http://localhost:4173';
const LABEL = process.argv[2] || 'current';
const OUT = path.join(__dirname, '..', 'shots', LABEL);

const STORY = {
  id: 'shot-story-1',
  headline: 'Jets decline to trade DE Will McDonald amid request',
  summary: 'DE Will McDonald IV asked to be traded due to limited snaps; the Jets said they have no intention of moving him. The front office believes he remains a core part of the rotation and expects his role to grow over the second half of the season.',
  niche: 'American Football',
  image: null,
  score: 88,
  source: 'ESPN',
  timestamp: Date.now()
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.addInitScript((story) => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 'harness-token', refreshToken: null,
      user: {
        id: 'harness-user', email: 'harness@example.com', name: 'Big_Greg', handle: 'big_greg',
        niches: ['American Football'], platforms: ['tiktok', 'instagram', 'youtube', 'twitter'],
        primaryPlatform: 'instagram', postsPerDay: 3
      },
      connections: {}
    }));
    window.__SHOT_STORY = story;
  }, STORY);

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

  async function waitFor(fn, label, tries = 100) {
    for (let i = 0; i < tries; i++) {
      if (await page.evaluate(fn)) return true;
      await page.waitForTimeout(200);
    }
    throw new Error('timed out waiting for ' + label);
  }
  await waitFor(() => typeof window.CPCardLayout !== 'undefined' && typeof window.CPCreate !== 'undefined', 'design system');
  await waitFor(() => typeof S !== 'undefined' && S.mode === 'app', 'app boot');

  // Seed a story so the flow has something real to work from.
  await page.evaluate((story) => {
    S.trends = [story];
    S.plat = S.plat || {}; S.ctype = S.ctype || {}; S.tone = S.tone || {};
    S.outs = S.outs || {}; S.loading = S.loading || {};
    S.cardTemplate = S.cardTemplate || {}; S.cardTypography = S.cardTypography || {};
    S.cardTheme = S.cardTheme || {}; S.slideCount = S.slideCount || {};
    S.previewSlideIdx = S.previewSlideIdx || {};
    window.setTab('create');
  }, STORY);
  await page.waitForTimeout(400);

  const shot = async (name) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  };

  // ── Step 1: source ────────────────────────────────────────────────────────
  await shot('01-source');

  // ── Step 2: platform ──────────────────────────────────────────────────────
  await page.evaluate(() => { window.cpCreateSetSource('story'); window.cpCreatePickStory('shot-story-1'); });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.cpCreateNext());
  await page.waitForTimeout(300);
  await shot('02-platform');

  // ── Step 3: format (Instagram) ────────────────────────────────────────────
  await page.evaluate(() => window.cpCreateSetPlatform('instagram'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.cpCreateNext());
  await page.waitForTimeout(300);
  await shot('03-format');

  // ── Step 4: template gallery (IG Carousel) ────────────────────────────────
  await page.evaluate(() => window.cpCreateSetFormat('IG Carousel'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.cpCreateNext());
  await page.waitForTimeout(500);
  await shot('04-templates-ig');

  // Full-page template gallery so every tile is visible.
  await page.screenshot({ path: path.join(OUT, '04b-templates-ig-full.png'), fullPage: true });

  // ── TikTok template gallery ───────────────────────────────────────────────
  await page.evaluate(() => { window.cpCreateSetPlatform('tiktok'); window.cpCreateSetFormat('TikTok No-Face Graphic'); });
  await page.waitForTimeout(500);
  await shot('05-templates-tiktok');
  await page.screenshot({ path: path.join(OUT, '05b-templates-tiktok-full.png'), fullPage: true });

  // ── Rendered template tiles, one per template, at card size ───────────────
  const tiles = await page.evaluate(() => {
    const out = [];
    const host = document.createElement('div');
    host.id = 'shot-tiles';
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0b0e;padding:14px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:12px';
    document.body.appendChild(host);
    const ids = Object.keys(window.CPCardTemplates.TEMPLATES);
    ids.forEach((id) => {
      const spec = window.CPCardTemplates.TEMPLATES[id];
      const tmpl = { id, label: spec.name, sub: '', preview: '' };
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#15151a;border-radius:12px;padding:8px';
      const label = document.createElement('div');
      label.textContent = spec.name + ' · ' + spec.platform;
      label.style.cssText = 'color:#cfcfd6;font:600 10px/1.4 Inter,sans-serif;margin-bottom:6px';
      const thumb = document.createElement('div');
      thumb.innerHTML = window.CPCreateSteps.templateThumb(tmpl, spec.platform);
      wrap.appendChild(label);
      wrap.appendChild(thumb.firstElementChild || thumb);
      host.appendChild(wrap);
      out.push(id);
    });
    return out;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '06-template-tiles.png'), fullPage: false });
  await page.evaluate(() => { const h = document.getElementById('shot-tiles'); if (h) h.remove(); });

  // ── Generated slides: render the real carousel at 4 slides ────────────────
  const gen = await page.evaluate(async () => {
    // Stub the network so generation runs offline but through the real code path.
    window.generateText = async () => JSON.stringify({
      hookHeadline: 'Jets shut down McDonald trade request',
      hookTease: 'The front office is not moving him.',
      slides: [
        { headline: 'The request', sectionLabel: 'WHAT HAPPENED', body: 'Will McDonald IV asked to be traded after a reduced snap count.' },
        { headline: 'The response', sectionLabel: 'THE ANSWER', body: 'New York said it has no intention of moving the edge rusher.' },
        { headline: 'Why it matters', sectionLabel: 'THE CONTEXT', body: 'He remains a core part of the rotation for the second half.' }
      ]
    });
    window.generateCardsWithRetry = async () => ({ images: [] });
    window.localCardPhotoData = async () => null;
    window.api = async () => ({ photos: [] });
    S.slideCount['shot-story-1'] = 4;
    S.cardTemplate['shot-story-1'] = 'impact';
    S.plat['shot-story-1'] = 'instagram';
    S.ctype['shot-story-1'] = 'IG Carousel';
    await window.gen('shot-story-1', false);
    const o = S.outs['shot-story-1'] && S.outs['shot-story-1'][0];
    return { type: o && o.type, slides: o && o.slides ? o.slides.length : 0 };
  });
  await page.waitForTimeout(800);

  // Show the generated carousel in the result screen.
  await page.evaluate(() => { window.cpCreateGo('review'); });
  await page.waitForTimeout(900);
  await shot('07-generated-carousel');
  await page.screenshot({ path: path.join(OUT, '07b-generated-carousel-full.png'), fullPage: true });

  // Each slide, one at a time.
  const n = gen.slides || 0;
  for (let i = 0; i < n; i++) {
    await page.evaluate((idx) => window.setPreviewSlide('shot-story-1-0', idx), i);
    await page.waitForTimeout(500);
    await shot('08-slide-' + (i + 1));
  }

  // ── TikTok generated output ───────────────────────────────────────────────
  await page.evaluate(async () => {
    S.plat['shot-story-1'] = 'tiktok';
    S.ctype['shot-story-1'] = 'TikTok No-Face Graphic';
    S.cardTemplate['shot-story-1'] = 'viral_hook';
    await window.gen('shot-story-1', false);
  });
  await page.waitForTimeout(900);
  await shot('09-generated-tiktok');

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ gen, errors: errors.slice(0, 20) }, null, 2));
  console.log('gen:', JSON.stringify(gen));
  console.log('errors:', errors.slice(0, 8));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
