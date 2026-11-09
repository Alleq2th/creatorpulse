// Focused verification of the four behavioural fixes.
const { chromium } = require('playwright');
const BASE = process.env.CP_BASE || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));

  await page.addInitScript(() => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 't', refreshToken: null,
      user: { id: 'u', email: 'a@b.c', name: 'Big_Greg', handle: 'big_greg', niches: ['American Football'], platforms: ['instagram', 'tiktok'], primaryPlatform: 'instagram', postsPerDay: 3 },
      connections: {}
    }));
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof S !== 'undefined' && S.mode === 'app')) break; await page.waitForTimeout(200); }

  const r = {};

  // ── 1. Digest deep link ────────────────────────────────────────────────────
  r.digest = await page.evaluate(() => {
    S.digest = { date: 'x', stories: [
      { niche: 'Football/Soccer', headline: 'Man Utd yet to make decision', url: 'https://example.com/article-1' },
      { niche: 'NFL', headline: 'Jets hold firm', url: 'https://example.com/article-2' }
    ]};
    S.digestDismissed = false;
    const html = window.renderDigest();
    const cards = [...html.matchAll(/<div class="digest-card"[^>]*onclick="([^"]*)"/g)].map(m => m[1]);
    return { cardOnclicks: cards, hasArticle1: /article-1/.test(html), hasArticle2: /article-2/.test(html) };
  });

  // Actually click the first digest card and see where it tries to go.
  r.digestClick = await page.evaluate(() => {
    let opened = null;
    const orig = window.open;
    window.open = (u) => { opened = u; return { closed: false }; };
    window.cpOpenArticle('https://example.com/article-1');
    window.open = orig;
    return { opened };
  });

  // ── 2. Slide count selector on IG Carousel ────────────────────────────────
  await page.evaluate(() => {
    S.trends = [{ id: 's1', headline: 'Jets decline to trade DE Will McDonald amid request', summary: 'DE Will McDonald IV asked to be traded due to limited snaps; the Jets said they have no intention of moving him.', niche: 'American Football', image: null, score: 88, source: 'ESPN' }];
    S.plat = {}; S.ctype = {}; S.tone = {}; S.outs = {}; S.loading = {};
    S.cardTemplate = {}; S.cardTypography = {}; S.cardTheme = {}; S.slideCount = {}; S.previewSlideIdx = {};
    window.setTab('create');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.cpCreateSetSource('story'); window.cpCreatePickStory('s1'); });
  await page.waitForTimeout(200);
  await page.locator('.cc-next').tap();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.cpCreateSetPlatform('instagram'));
  await page.waitForTimeout(200);
  await page.locator('.cc-next').tap();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.cpCreateSetFormat('IG Carousel'));
  await page.waitForTimeout(200);
  await page.locator('.cc-next').tap();
  await page.waitForTimeout(500);

  r.countSelector = await page.evaluate(() => {
    const pills = [...document.querySelectorAll('[data-cc-slidecount]')].map(b => b.textContent.trim());
    const on = document.querySelector('.cc-count-pill.on');
    return {
      step: window.CPCreate.cs().step,
      pillCount: pills.length,
      pills,
      selected: on && on.textContent.trim(),
      hasPreview: !!document.querySelector('[data-cc-tpl-preview]'),
      templateCards: document.querySelectorAll('.cc-template-card').length
    };
  });

  // Pick 7 and confirm it lands on the flow state.
  await page.locator('[data-cc-slidecount="7"]').tap();
  await page.waitForTimeout(400);
  r.afterPick7 = await page.evaluate(() => ({
    flowCount: window.CPCreate.cs().slideCount,
    selected: (document.querySelector('.cc-count-pill.on') || {}).textContent
  }));

  // ── 3. Generation honours the count (7) ───────────────────────────────────
  r.gen7 = await page.evaluate(async () => {
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
    await window.cpCreateGenerate();
    const st = window.CPCreate.cs();
    const o = S.outs[st.trendId] && S.outs[st.trendId][0];
    return { trendId: st.trendId, type: o && o.type, slides: o && o.slides ? o.slides.length : 0, requested: st.slideCount };
  });

  // ── 4. TikTok multi-post ──────────────────────────────────────────────────
  r.tiktok = await page.evaluate(async () => {
    S.plat['s1'] = 'tiktok'; S.ctype['s1'] = 'TikTok No-Face Graphic';
    S.cardTemplate['s1'] = 'viral_hook'; S.slideCount['s1'] = 5;
    await window.gen('s1', false);
    const o = S.outs['s1'] && S.outs['s1'][0];
    return { type: o && o.type, slides: o && o.slides ? o.slides.length : 0 };
  });

  // ── 5. Template switcher on the result screen ─────────────────────────────
  r.reviewTemplates = await page.evaluate(() => {
    const html = window.CPCreateReview.reviewStep(window.CPCreate.cs());
    return { hasSwitcher: /cc-tpl-switch/.test(html), tiles: (html.match(/cc-template-card/g) || []).length };
  });

  r.errors = errs.slice(0, 5);
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
