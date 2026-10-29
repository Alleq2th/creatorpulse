// Themes gallery on a generated graphic: the gallery shows the themes, picking one
// sends the look to the card renderer, and the copy and photo stay the same.
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');

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
      const editor = page.locator('details.cp-canvas-editor').first();
      if ((await editor.getAttribute('open')) === null) await editor.locator('summary').click();
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

    // Picking a look applies its type, text colour and accent, and keeps the copy.
    const before = cardRequests.length;
    await page.locator('#cthOverlay .cc-th-tile', { hasText: 'Electric' }).click();
    await expect(page.locator('#cthOverlay')).toHaveCount(0);
    await expect.poll(() => cardRequests.length, { timeout: 15000 }).toBeGreaterThan(before);
    let slide = cardRequests[cardRequests.length - 1].slides[0];
    expect(cardRequests[cardRequests.length - 1].typography).toBe('impact');
    expect(slide.textColor).toBe('#FFFFFF');
    expect(slide.layerColors.ctaLine).toBe('#00E5FF');
    expect(slide.headline).toBe(headline);

    // A colour theme changes colours only; the look stays on Electric's type.
    await openThemes();
    await page.locator('#cthOverlay .cc-th-swatch', { hasText: 'Black & Gold' }).click();
    await expect.poll(() => cardRequests.length, { timeout: 15000 }).toBeGreaterThan(before + 1);
    slide = cardRequests[cardRequests.length - 1].slides[0];
    expect(slide.layerColors.ctaLine).toBe('#D4AF37');
    expect(cardRequests[cardRequests.length - 1].typography).toBe('impact');
    expect(slide.headline).toBe(headline);

    // Restore returns to the original look: no theme colours or type are sent.
    await openThemes();
    await page.locator('#cthOverlay button', { hasText: 'Restore original look' }).click();
    await expect.poll(() => cardRequests.length, { timeout: 15000 }).toBeGreaterThan(before + 2);
    slide = cardRequests[cardRequests.length - 1].slides[0];
    expect(slide.layerColors).toBeUndefined();
    expect(slide.headline).toBe(headline);
  });
});
