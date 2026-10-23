/* Playwright walk-through of the "Why this platform?" affordance, at iPhone
 * size (390x844).
 *
 * Reuses scripts/lib/boot.js: the app's own login -> state -> render path runs
 * unchanged, only the network is stubbed (no Supabase/Groq in this sandbox).
 * Every interaction below is a REAL tap on real markup.
 *
 * What it proves, in order:
 *   1. the closed card shows the old "Best platform" row plus ONE small control
 *   2. tapping the control opens the panel, flips aria-expanded, flips the label
 *   3. the panel's factor values are the REAL ones for that story
 *   4. tapping again closes it
 *   5. other tabs still respond afterwards (no wedge)
 *   6. Plus AI still opens
 *   7. zero uncaught errors
 */
const { chromium } = require('/tmp/verify/node_modules/playwright');
const { boot } = require('./lib/boot');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:4402';
const OUT = process.env.OUT || '/workspace/shots/platwhy';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true
  });
  const page = await ctx.newPage();

  const uncaught = [];
  const netNoise = [];
  page.on('pageerror', e => uncaught.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource/.test(t)) netNoise.push(t);
    else uncaught.push('CONSOLE: ' + t);
  });

  const shot = n => page.screenshot({ path: OUT + '/' + n + '.png' });
  const log = {};

  await boot(page, BASE);

  // ── open a story card ────────────────────────────────────────────────────
  // Pick the card whose headline actually fires a keyword rule, so the panel
  // is proven to render REAL matched words - not just "no match" rows. The
  // stubbed feed's "New AI model tops coding benchmarks" fires the stats rule
  // ("record" in its summary); the Lakers headline only trips the strong-story
  // bonus, which would leave every factor reading "no match".
  await page.waitForSelector('.tc', { timeout: 20000 });
  const cardSel = '.tc:has-text("New AI model tops coding benchmarks")';
  const hasRuleStory = await page.$(cardSel);
  const target = hasRuleStory ? cardSel : '.tc';
  log.target_story = hasRuleStory ? 'AI model (stats rule fires)' : 'first card';
  await page.click(target + ' .th');
  await page.waitForSelector('.best-plat', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot('01-story-open');

  log.closed_has_panel = await page.$$eval('.oppw', els =>
    els.filter(e => e.closest('.best-plat-wrap')).length);
  log.toggle_label_closed = await page.textContent('.best-plat-wrap .oppw-toggle');
  log.toggle_count = await page.$$eval('.best-plat-wrap .oppw-toggle', els => els.length);
  log.row_label = await page.textContent('.best-plat-lbl');
  log.row_value = await page.$eval('.best-plat-val', e => e.textContent.trim());

  // the control must be a real focusable button with a real hit target
  log.toggle_metrics = await page.$eval('.best-plat-wrap .oppw-toggle', el => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, type: el.getAttribute('type'), h: Math.round(r.height), w: Math.round(r.width) };
  });

  // ── tap it open ──────────────────────────────────────────────────────────
  await page.click('.best-plat-wrap .oppw-toggle');
  await page.waitForSelector('.best-plat-wrap .oppw', { timeout: 10000 });
  await page.waitForTimeout(350);
  await shot('02-why-open');

  log.toggle_label_open = await page.textContent('.best-plat-wrap .oppw-toggle');
  log.aria_expanded = await page.getAttribute('.best-plat-wrap .oppw-toggle', 'aria-expanded');
  log.math_line = await page.textContent('.best-plat-wrap .oppw-math code');
  log.factor_rows = await page.$$eval('.best-plat-wrap .oppw-list:first-of-type .oppw-row', els =>
    els.map(e => ({
      k: (e.querySelector('.oppw-k') || {}).textContent,
      v: (e.querySelector('.oppw-v') || {}).textContent
    })));
  log.missing_heading = await page.textContent(".best-plat-wrap .oppw-sec");
  log.missing_rows = await page.$$eval('.best-plat-wrap .oppw-list:last-of-type .oppw-row', els =>
    els.map(e => ({
      k: (e.querySelector('.oppw-k') || {}).textContent,
      v: (e.querySelector('.oppw-v') || {}).textContent
    })));
  log.footer = await page.textContent('.best-plat-wrap .oppw-foot');

  // nothing on screen may claim a guaranteed outcome
  log.overclaims = /guaranteed|will perform|best place to post|you will get/i.test(
    await page.textContent('.best-plat-wrap'));

  // ── tap again to close ───────────────────────────────────────────────────
  await page.click('.best-plat-wrap .oppw-toggle');
  await page.waitForTimeout(350);
  log.panel_after_close = await page.$$eval('.best-plat-wrap .oppw', els => els.length);
  await shot('03-closed-again');

  // ── other tabs still respond ─────────────────────────────────────────────
  await page.click('.tab:has-text("Hooks")');
  await page.waitForTimeout(700);
  log.hooks_rendered = (await page.textContent('#root')).length > 300;
  await shot('04-hooks');

  await page.click('.tab:has-text("Calendar")');
  await page.waitForTimeout(700);
  log.calendar_rendered = (await page.textContent('#root')).length > 300;

  await page.click('.tab:has-text("Profile")');
  await page.waitForTimeout(700);
  log.profile_rendered = (await page.textContent('#root')).length > 300;

  await page.click('.tab:has-text("Home")');
  await page.waitForTimeout(900);
  log.home_rendered = (await page.textContent('#root')).length > 300;
  await shot('05-home-back');

  // ── Plus AI still opens (the hard constraint) ────────────────────────────
  // window.openPulseAi is the app's own entry point (public/plus-ai/index.js).
  log.plus_ai_exists = await page.evaluate(() => typeof window.openPulseAi === 'function');
  if (log.plus_ai_exists) {
    await page.evaluate(() => window.openPulseAi());
    await page.waitForTimeout(1200);
    log.plus_ai_open = await page.evaluate(() => {
      const el = document.getElementById('pulse-input');
      const sheet = document.querySelector('.pulse-sheet, #pulse-sheet, .pa-sheet');
      return !!(el || sheet);
    });
    log.plus_ai_input = await page.evaluate(() => !!document.getElementById('pulse-input'));
    await shot('06-plus-ai');
  }

  log.uncaught_errors = uncaught;
  log.network_noise_count = netNoise.length;

  console.log(JSON.stringify(log, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
