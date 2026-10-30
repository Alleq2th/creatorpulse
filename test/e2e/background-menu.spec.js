// Live card editor: tap an empty part of the card to change the background.
// A photo appears at once without a server call, the text is untouched, and dimming updates live.
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const PNG_BYTES = Buffer.from(PNG.split(',')[1], 'base64');

test.describe('Background menu on a generated graphic', () => {
  test('tap the empty card, choose a photo, and dim it without changing the text', async ({ context, page }) => {
    await signIn(context);
    await mockApi(page, 'unused caption');
    let cardRequests = 0;
    await page.route('**/api/generate-cards', (route) => {
      cardRequests += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ images: [PNG] }) });
    });

    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator('button[onclick="cpCreateSetPlatform(\'tiktok\')"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'TikTok No-Face Graphic' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Generate' }).first().click();

    const stage = page.locator('.cc-live-stage').first();
    const menu = page.locator('.cc-bg').first();
    const headlineText = page.locator('.cp-canvas-block[data-canvas-block="headline"] .cc-live-text').first();
    await expect(stage).toBeAttached({ timeout: 20000 });
    await expect(menu).toBeHidden();

    // 1. Tapping an empty part of the card (top right, clear of the text blocks) opens the menu.
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    await page.mouse.click(box.x + box.width * 0.95, box.y + box.height * 0.05);
    await expect(menu).toBeVisible();
    await expect(menu.locator('.cc-bg-thumb[aria-label="Article photo"]')).toHaveCount(1);
    await expect(menu.getByLabel('Background dimming')).toBeVisible();

    // 2. Dimming moves the darkening on the preview straight away.
    await menu.getByLabel('Background dimming').evaluate((el) => {
      el.value = '60';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(stage.locator('.cc-live-dim')).toHaveCSS('opacity', '0.6');
    // The dimming field stays at the same value.
    await expect(menu.getByLabel('Background dimming')).toHaveValue('60');

    // 3. Uploading a photo shows it at once, with no server render, and keeps the text.
    const textBefore = await headlineText.textContent();
    const requestsBefore = cardRequests;
    await menu.locator('input[type=file]').setInputFiles({ name: 'street-photo.png', mimeType: 'image/png', buffer: PNG_BYTES });
    await expect(stage.locator('.cc-live-plate')).toHaveCSS('background-image', /data:image\/jpeg/);
    await expect(menu.locator('.cc-bg-thumb')).toHaveCount(2);
    await expect(menu.locator('.cc-bg-thumb.active')).toHaveAttribute('aria-label', 'street-photo.png');
    await page.waitForTimeout(400);
    expect(cardRequests).toBe(requestsBefore);
    expect(await headlineText.textContent()).toBe(textBefore);

    // 4. Choosing the article photo again switches back.
    await menu.locator('.cc-bg-thumb[aria-label="Article photo"]').click();
    await expect(menu.locator('.cc-bg-thumb.active')).toHaveAttribute('aria-label', 'Article photo');
    await expect(stage.locator('.cc-live-plate')).not.toHaveCSS('background-image', /data:image\/jpeg/);
    expect(await headlineText.textContent()).toBe(textBefore);
  });
});
