// Themes gallery on a generated graphic: the gallery shows the themes, picking one
// repaints the card at once from its shared style, and the copy and photo stay the same.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');
const { jpegSize } = require('./exportHelpers');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('Themes on a generated graphic', () => {
  test('the gallery lists the themes and picking one applies it without changing the copy', async ({ context, page }) => {
    await signIn(context);
    await mockApi(page, 'unused caption');
    const cardRequests = [];
    await page.route('**/api/generate-cards', (route) => {
      cardRequests.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ images: [PNG] }) });
    });

    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator('button[onclick="cpCreateSetPlatform(\'tiktok\')"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'TikTok No-Face Graphic' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Generate' }).first().click();

    const openThemes = async () => {
      const btn = page.locator('button.cc-th-open').first();
      await expect(btn).toBeAttached({ timeout: 20000 });
      // The editor opens by default; only open it if something closed it.
      await btn.click();
      await expect(page.locator('#cthOverlay')).toBeVisible();
    };

    // The gallery shows all five looks and all eight colour themes.
    await openThemes();
    await expect(page.locator('#cthOverlay .cc-th-tile')).toHaveCount(5);
    await expect(page.locator('#cthOverlay .cc-th-swatch')).toHaveCount(8);
    await expect(page.locator('#cthOverlay .cc-th-body')).toHaveCSS('overflow-y', 'auto');
    // Each tile shows the graphic's own headline.
    const headline = await page.locator('#cthOverlay .cc-th-tile').first().locator('.cc-th-headline').innerText();
    expect(headline.length).toBeGreaterThan(0);

    // Wait for the gallery's photo before picking, so the next count is only about the pick.
    await expect.poll(async () => page.locator('#cthOverlay .cc-th-frame').first().evaluate((el) => getComputedStyle(el).backgroundImage), { timeout: 15000 }).not.toBe('none');
    const liveStage = page.locator('[data-canvas-stage]').first();
    const headlineLayer = liveStage.locator('[data-cp-live="headline"]');
    const ctaLayer = liveStage.locator('[data-cp-live="ctaLine"]');
    const dimLayer = liveStage.locator('.cc-live-dim');
    const style = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

    // Picking a look repaints the card at once: no request to the card renderer.
    const before = cardRequests.length;
    await page.locator('#cthOverlay .cc-th-tile', { hasText: 'Electric' }).click();
    await expect(page.locator('#cthOverlay')).toHaveCount(0);
    await expect(dimLayer).toHaveCSS('opacity', '0.35');
    await expect(headlineLayer).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(ctaLayer).toHaveCSS('color', 'rgb(0, 229, 255)');
    expect(await style(headlineLayer, 'fontFamily')).toMatch(/Anton|Impact/);
    await expect(page.locator('.cc-th-hint').first()).toHaveText('Electric');
    await page.waitForTimeout(800);
    expect(cardRequests.length).toBe(before);
    expect(await headlineLayer.innerText()).toBe(headline);

    // A colour theme changes colours only; the look stays on Electric's type and dim.
    await openThemes();
    await page.locator('#cthOverlay .cc-th-swatch', { hasText: 'Black & Gold' }).click();
    await expect(ctaLayer).toHaveCSS('color', 'rgb(212, 175, 55)');
    await expect(dimLayer).toHaveCSS('opacity', '0.35');
    expect(await style(headlineLayer, 'fontFamily')).toMatch(/Anton|Impact/);
    expect(await headlineLayer.innerText()).toBe(headline);
    expect(cardRequests.length).toBe(before);

    // Restore returns to the original look straight away: no dim and white text.
    await openThemes();
    await page.locator('#cthOverlay button', { hasText: 'Restore original look' }).click();
    await expect(dimLayer).toHaveCSS('opacity', '0');
    await expect(ctaLayer).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.locator('.cc-th-hint').first()).toHaveText('Original look');
    expect(await headlineLayer.innerText()).toBe(headline);
    expect(cardRequests.length).toBe(before);

    // Download gives the chosen look straight away, with no server call.
    await openThemes();
    await page.locator('#cthOverlay .cc-th-tile', { hasText: 'Minimal' }).click();
    await expect(page.locator('#cthOverlay')).toHaveCount(0);
    const beforeDownload = cardRequests.length;
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download image' }).first().click(),
    ]);
    expect(jpegSize(fs.readFileSync(await download.path()))).toEqual({ width: 1080, height: 1920 });
    expect(cardRequests.length).toBe(beforeDownload);
  });
});
