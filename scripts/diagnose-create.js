// Diagnostic: reproduce the reported Create-flow bugs in a real browser.
const { chromium } = require('playwright');
const BASE = process.env.CP_BASE || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await page.addInitScript(() => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 't', refreshToken: null,
      user: { id: 'u', email: 'a@b.c', name: 'Big_Greg', handle: 'big_greg', niches: ['American Football'], platforms: ['tiktok', 'instagram'], primaryPlatform: 'instagram', postsPerDay: 3 },
      connections: {}
    }));
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 100; i++) { if (await page.evaluate(() => typeof S !== 'undefined' && S.mode === 'app')) break; await page.waitForTimeout(200); }

  await page.evaluate(() => {
    S.trends = [{ id: 's1', headline: 'Jets decline to trade DE Will McDonald amid request', summary: 'DE Will McDonald IV asked to be traded due to limited snaps; the Jets said they have no intention of moving him.', niche: 'American Football', image: null, score: 88, source: 'ESPN' }];
    S.plat = {}; S.ctype = {}; S.tone = {}; S.outs = {}; S.loading = {};
    S.cardTemplate = {}; S.cardTypography = {}; S.cardTheme = {}; S.slideCount = {}; S.previewSlideIdx = {};
    window.setTab('create');
  });
  await page.waitForTimeout(400);

  const report = {};

  // 1. The Continue button's computed style + label on each step.
  report.step1 = await page.evaluate(() => {
    const b = document.querySelector('.cc-next');
    if (!b) return { missing: true };
    const cs = getComputedStyle(b);
    return { text: b.textContent.trim(), disabled: b.disabled, bg: cs.backgroundImage.slice(0, 60), color: cs.color, opacity: cs.opacity, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) };
  });

  // 2. Single tap on a source card -> does it register?
  await page.evaluate(() => { window.cpCreateSetSource('story'); window.cpCreatePickStory('s1'); });
  await page.waitForTimeout(200);
  report.afterSource = await page.evaluate(() => ({ step: window.CPCreate.cs().step, source: window.CPCreate.cs().source }));

  // 3. Single tap on Continue (real tap, not evaluate).
  const nextBtn = page.locator('.cc-next');
  await nextBtn.tap();
  await page.waitForTimeout(400);
  report.afterOneTapContinue = await page.evaluate(() => ({ step: window.CPCreate.cs().step }));

  // 4. Format step: check the button again.
  await page.evaluate(() => window.cpCreateSetPlatform('instagram'));
  await page.waitForTimeout(200);
  await page.locator('.cc-next').tap();
  await page.waitForTimeout(400);
  report.step3 = await page.evaluate(() => {
    const b = document.querySelector('.cc-next');
    const cs = b ? getComputedStyle(b) : null;
    return { step: window.CPCreate.cs().step, text: b && b.textContent.trim(), disabled: b && b.disabled, bg: cs && cs.backgroundImage.slice(0, 60), color: cs && cs.color, opacity: cs && cs.opacity };
  });

  // 5. Select a format with ONE tap, then Continue with ONE tap.
  await page.locator('.cc-choice').first().tap();
  await page.waitForTimeout(300);
  report.afterFormatTap = await page.evaluate(() => ({ format: window.CPCreate.cs().format, step: window.CPCreate.cs().step }));

  // 6. Template step: is there a slide-count selector?
  await page.locator('.cc-next').tap();
  await page.waitForTimeout(500);
  report.templateStep = await page.evaluate(() => ({
    step: window.CPCreate.cs().step,
    hasSlideCount: !!document.querySelector('[data-cc-slidecount]'),
    templateCards: document.querySelectorAll('.cc-template-card').length,
    thumbHeights: [...document.querySelectorAll('.cc-template-thumb')].map(t => Math.round(t.getBoundingClientRect().height)),
    thumbWidths: [...document.querySelectorAll('.cc-template-thumb')].map(t => Math.round(t.getBoundingClientRect().width))
  }));

  // 7. cpLiveTextStyle index/total bug: does slide 2 get hook-sized type?
  report.liveStyleBug = await page.evaluate(() => {
    const L = window.CPCardLayout;
    const slide = { type: 'body', headline: 'The response', supportingText: 'New York said it has no intention of moving him.', ctaLine: 'FOLLOW FOR MORE' };
    const asHook = L.resolve({ templateId: 'impact', platform: 'instagram', slide, index: 0, total: 4, style: {} });
    const asBody = L.resolve({ templateId: 'impact', platform: 'instagram', slide, index: 1, total: 4, style: {} });
    const h = asHook.layers.find(l => l.key === 'headline');
    const b = asBody.layers.find(l => l.key === 'headline');
    return { hookRole: asHook.role, bodyRole: asBody.role, hookSize: +(h.sizePct * 100).toFixed(2), bodySize: +(b.sizePct * 100).toFixed(2), hookBoxY: +h.box.y.toFixed(3), bodyBoxY: +b.box.y.toFixed(3) };
  });

  // 8. Digest: does a card carry a real article URL?
  report.digest = await page.evaluate(() => {
    S.digest = { date: 'x', stories: [{ niche: 'Football/Soccer', headline: 'Man Utd yet to make decision', url: 'https://example.com/article-1' }] };
    S.digestDismissed = false;
    const html = window.renderDigest ? window.renderDigest() : '';
    return { hasUrl: /example\.com\/article-1/.test(html), onclick: (html.match(/onclick="([^"]*)"/) || [])[1] || null };
  });

  // 9. TikTok: how many outputs for a graphic format?
  report.tiktok = await page.evaluate(async () => {
    window.generateText = async () => JSON.stringify({ headline: 'Jets hold firm on McDonald', body: 'The front office will not move him.', tag: 'NFL' });
    window.generateCardsWithRetry = async () => ({ images: [] });
    window.localCardPhotoData = async () => null;
    window.api = async () => ({ photos: [] });
    S.plat['s1'] = 'tiktok'; S.ctype['s1'] = 'TikTok No-Face Graphic'; S.cardTemplate['s1'] = 'viral_hook';
    await window.gen('s1', false);
    const o = S.outs['s1'] && S.outs['s1'][0];
    return { type: o && o.type, slides: o && o.slides ? o.slides.length : 0 };
  });

  report.errors = errs.slice(0, 10);
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
