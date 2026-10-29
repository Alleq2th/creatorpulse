// End-to-end checks for the card editor on a generated graphic: text layers,
// dim, phone overlay text, and what is sent to the server when the style is applied.
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');

// A 1x1 PNG stands in for the rendered card image.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('Card editor on a graphic', () => {
  test('text layers, dim and phone overlay text are editable and sent on Apply', async ({ context, page }) => {
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

    // Open the editor on the generated graphic.
    const panel = page.locator('.cc-style-panel').first();
    await page.locator('details.cp-canvas-editor summary').first().click();
    await expect(panel).toBeAttached({ timeout: 20000 });

    // 1. Every text layer has its own text box, font, colour and size.
    for (const key of ['headline', 'supportingText', 'ctaLine']) {
      await expect(panel.locator(`[data-cp-layer="${key}"]`)).toHaveCount(1);
    }
    await panel.locator('[data-cp-layer="headline"] textarea').fill('Edited headline for the test');
    await panel.locator('[data-cp-layer="headline"] select').selectOption('code_mono');
    await panel.locator('[data-cp-layer="ctaLine"] input[type=text]').fill('SAVE THIS NOW');

    // 2. Dim slider and phone overlay text.
    await panel.locator('input[aria-label="Dim background photo"]').evaluate((el) => {
      el.value = '60';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await panel.locator('input[aria-label="Phone name"]').fill('creator_test');
    await expect(page.locator('[data-cp-mock="handle"]').first()).toHaveText('creator_test');

    // 3. Apply sends the layer settings to the card renderer.
    const before = cardRequests.length;
    await panel.getByRole('button', { name: 'Apply to card image' }).click();
    await expect.poll(() => cardRequests.length, { timeout: 15000 }).toBeGreaterThan(before);
    const slide = cardRequests[cardRequests.length - 1].slides[0];
    expect(slide.headline).toBe('Edited headline for the test');
    expect(slide.ctaLine).toBe('SAVE THIS NOW');
    expect(slide.layerFonts.headline).toBe('code_mono');
    expect(slide.dim).toBeCloseTo(0.6, 2);
  });
});
