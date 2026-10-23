/* Playwright walk-through of the new Create flow, at iPhone size (390x844).
 *
 * Logs in through the app's real form with the API stubbed (see
 * scripts/lib/boot.js for why), so the app's own login → state → render path
 * runs unchanged. Every interaction below is a REAL click on real markup.
 *
 * Console noise is split honestly:
 *   - pageerror / uncaught exceptions        -> real bugs, must be zero
 *   - "Failed to load resource" (fonts/CDN)  -> environmental, counted apart
 */
const { chromium } = require('/tmp/verify/node_modules/playwright');
const { boot } = require('./lib/boot');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:4200';
const OUT = process.env.OUT || '/workspace/shots/create';
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
  log.signed_in = true;

  await page.click('.tab:has-text("Create")');
  await page.waitForSelector('.cc-root', { timeout: 15000 });
  await page.waitForTimeout(400);
  await shot('01-source');

  log.step1_h1 = await page.textContent('.cc-h1');
  log.step1_choices = await page.$$eval('.cc-choice .cc-choice-t', els => els.map(e => e.textContent.trim()));
  log.step1_next_disabled = await page.$eval('.cc-next', b => b.disabled);
  log.progress_dots = await page.$$eval('.cc-dot-l', els => els.map(e => e.textContent.trim()));

  // ── Step 1 · source ─────────────────────────────────────────────────────
  await page.click('.cc-choice:has-text("A discovered story")');
  await page.waitForSelector('.cc-picker', { timeout: 10000 });
  await page.waitForTimeout(250);
  log.story_picker = await page.$$eval('.cc-item .cc-item-t', els => els.map(e => e.textContent.trim()));
  await shot('02-source-story');

  await page.click('.cc-item:has-text("Lakers")');
  await page.waitForTimeout(250);
  log.next_enabled_after_pick = await page.$eval('.cc-next', b => !b.disabled);
  await page.click('.cc-next');
  await page.waitForTimeout(350);

  // ── Step 2 · platform ───────────────────────────────────────────────────
  log.step2_h1 = await page.textContent('.cc-h1');
  log.platforms = await page.$$eval('.cc-chip .cc-chip-t', els => els.map(e => e.textContent.trim()));
  await shot('03-platform');
  await page.click('.cc-chip:has-text("YouTube")');
  await page.waitForTimeout(250);
  await page.click('.cc-next');
  await page.waitForTimeout(350);

  // ── Step 3 · format ─────────────────────────────────────────────────────
  log.step3_h1 = await page.textContent('.cc-h1');
  log.formats_youtube = await page.$$eval('.cc-choice .cc-choice-t', els => els.map(e => e.textContent.trim()));
  log.format_hints = await page.$$eval('.cc-choice .cc-choice-h', els => els.map(e => e.textContent.trim()));
  log.no_truncation = await page.$$eval('.cc-choice-t', els => els.every(e => e.scrollWidth <= e.clientWidth + 1));
  await shot('04-format-youtube');

  await page.click('.cc-choice:has-text("Long Form Script")');
  await page.waitForTimeout(250);

  // ── Spec 8.5 · changing platform re-scopes the formats ──────────────────
  // The format step has no summary rails of its own, so Back is the way up.
  await page.click('.cc-back');
  await page.waitForTimeout(300);
  await page.click('.cc-chip:has-text("X")');
  await page.waitForTimeout(200);
  await page.click('.cc-next');
  await page.waitForTimeout(300);
  log.formats_x = await page.$$eval('.cc-choice .cc-choice-t', els => els.map(e => e.textContent.trim()));
  log.format_changed_with_platform = JSON.stringify(log.formats_youtube) !== JSON.stringify(log.formats_x);
  await shot('05-format-x');

  await page.click('.cc-choice:has-text("Hot Take Tweet")');
  await page.waitForTimeout(200);
  await page.click('.cc-next');
  await page.waitForTimeout(300);

  // ── Step 4 · tone ───────────────────────────────────────────────────────
  log.step4_h1 = await page.textContent('.cc-h1');
  log.tones = await page.$$eval('.cc-chip .cc-chip-t', els => els.map(e => e.textContent.trim()));
  log.rails = await page.$$eval('.cc-rail', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  await shot('06-tone');
  await page.click('.cc-chip:has-text("Educative")');
  await page.waitForTimeout(200);

  // ── Step 5 · generate ───────────────────────────────────────────────────
  await page.click('.cc-next');
  await page.waitForTimeout(3000);
  await shot('07-review');

  log.review_title = await page.textContent('.cc-bar-title').catch(() => null);
  log.review_rails = await page.$$eval('.cc-rail', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  log.review_output_blocks = (await page.$$('.cc-out')).length;
  log.review_text = (await page.textContent('.cc-out').catch(() => '')).replace(/\s+/g, ' ').slice(0, 180);
  log.review_actions = await page.$$eval('.cc-actions .btn', els => els.map(e => e.textContent.trim()));

  // ── Other tabs must still respond afterwards ────────────────────────────
  await page.click('.tab:has-text("Home")');
  await page.waitForTimeout(900);
  log.home_rendered = (await page.textContent('.app')).length > 100;
  await shot('08-home-after-create');

  await page.click('.tab:has-text("Hooks")');
  await page.waitForTimeout(900);
  log.hooks_rendered = (await page.textContent('.app')).length > 100;

  await page.click('.tab:has-text("Calendar")');
  await page.waitForTimeout(900);
  log.calendar_rendered = (await page.textContent('.app')).length > 100;

  await page.click('.tab:has-text("Profile")');
  await page.waitForTimeout(900);
  log.profile_rendered = (await page.textContent('.app')).length > 100;
  await shot('09-profile');

  // ── Back to Create: flow state must have survived ───────────────────────
  await page.click('.tab:has-text("Create")');
  await page.waitForTimeout(700);
  log.create_after_return = (await page.textContent('.cc-root').catch(() => '(no .cc-root)')).replace(/\s+/g, ' ').slice(0, 140);
  await shot('10-create-return');

  // ── Studio still reachable as one source choice ─────────────────────────
  await page.click('.cc-root button:has-text("New")').catch(() => {});
  await page.waitForTimeout(600);
  await page.click('.cc-choice:has-text("Record or upload a video")').catch(() => {});
  await page.waitForTimeout(1200);
  const studioTxt = await page.textContent('.app');
  log.studio_reachable = /Creative workspace|Record a video|Upload a video|Start recording|Upload video/i.test(studioTxt);
  await shot('11-studio-source');

  // ── Plus AI must still work ─────────────────────────────────────────────
  await page.click('.tab:has-text("Home")').catch(() => {});
  await page.waitForTimeout(800);
  const aiBtn = await page.$('#pulseFab, .pulse-fab, [onclick*="PulseAi"], [onclick*="pulseAi"]');
  if (aiBtn) await aiBtn.click().catch(() => {});
  await page.waitForTimeout(1600);
  log.plus_ai_sheet_open = (await page.$$('[class*="pa-"]')).length > 0;
  await shot('12-plus-ai-still-works');

  log.uncaught_errors = uncaught;
  log.network_noise_count = netNoise.length;
  log.network_noise_sample = netNoise.slice(0, 3);

  console.log(JSON.stringify(log, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
