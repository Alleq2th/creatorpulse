// Live card editor: tap to select, the Font and Color toolbar, and double-tap to type.
// Each change must show on the preview at once and keep the other text layers as they were.
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('Live text tools on a generated graphic', () => {
  test('tap selects, Font and Color change only the selected text, double-tap types and keeps the style', async ({ context, page }) => {
    await signIn(context);
    await mockApi(page, 'unused caption');
    await page.route('**/api/generate-cards', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ images: [PNG] }) }));

    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator('button[onclick="cpCreateSetPlatform(\'tiktok\')"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'TikTok No-Face Graphic' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Generate' }).first().click();

    const editor = page.locator('details.cp-canvas-editor').first();
    if ((await editor.getAttribute('open')) === null) await editor.locator('summary').click();
    const headline = page.locator('.cp-canvas-block[data-canvas-block="headline"]').first();
    const support = page.locator('.cp-canvas-block[data-canvas-block="supportingText"]').first();
    const toolbar = page.locator('.cc-ctx').first();
    await expect(headline).toBeAttached({ timeout: 20000 });

    // 1. Nothing is selected yet, so the toolbar is hidden.
    await expect(toolbar).toBeHidden();

    // 2. A single tap selects the headline and opens the toolbar with Font and Color only.
    await headline.click();
    await expect(headline).toHaveClass(/is-selected/);
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('.cc-ctx-name')).toHaveText('Headline');
    await expect(toolbar.locator('.cc-ctx-btn')).toHaveText(['Font', 'Color']);

    // 3. Font opens a vertical list; each name is drawn in its own face.
    const supportFontBefore = await support.locator('.cc-live-text').evaluate((el) => getComputedStyle(el).fontFamily);
    await toolbar.locator('.cc-ctx-btn', { hasText: 'Font' }).click();
    const fontItems = toolbar.locator('.cc-ctx-font');
    await expect(fontItems).toHaveCount(6);
    const boxes = await fontItems.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
    expect(Math.abs(boxes[1].left - boxes[0].left)).toBeLessThan(2);
    const serifButton = toolbar.locator('.cc-ctx-font', { hasText: 'Editorial Serif' });
    const serifFamily = await serifButton.evaluate((el) => getComputedStyle(el).fontFamily);
    await serifButton.click();
    await expect(headline.locator('.cc-live-text')).toHaveCSS('font-family', serifFamily);
    // The supporting text keeps its own font.
    expect(await support.locator('.cc-live-text').evaluate((el) => getComputedStyle(el).fontFamily)).toBe(supportFontBefore);

    // 4. Color sets the selected text colour straight away, with no Apply step.
    await toolbar.locator('.cc-ctx-btn', { hasText: 'Color' }).click();
    await toolbar.locator('.cc-ctx-swatch[aria-label="Color #ffd60a"]').click();
    await expect(headline.locator('.cc-live-text')).toHaveCSS('color', 'rgb(255, 214, 10)');
    await expect(toolbar.locator('.cc-ctx-swatch[aria-label="Color #ffd60a"]')).toHaveAttribute('aria-pressed', 'true');
    // The layer's own colour field in the panel follows the preview.
    await expect(page.locator('[data-cp-style] [data-cp-layer="headline"] input[type=color]').first()).toHaveValue('#ffd60a');

    // 5. Double-tap opens the words for typing, keeping font and colour.
    await headline.dblclick();
    const editing = headline.locator('.cc-live-text[contenteditable="true"]');
    await expect(editing).toHaveCount(1);
    await page.keyboard.press('End');
    await page.keyboard.type(' now');
    await expect(headline.locator('.cc-live-text')).toHaveText(/ now$/);
    await expect(headline.locator('.cc-live-text')).toHaveCSS('font-family', serifFamily);
    await expect(headline.locator('.cc-live-text')).toHaveCSS('color', 'rgb(255, 214, 10)');

    // 6. Escape finishes the edit, and the edited words land in the layer field.
    await page.keyboard.press('Escape');
    await expect(headline.locator('.cc-live-text[contenteditable="true"]')).toHaveCount(0);
    await expect(page.locator('[data-cp-style] [data-cp-layer="headline"] textarea').first()).toHaveValue(/ now$/);
    await expect(headline.locator('.cc-live-text')).toHaveCSS('font-family', serifFamily);
  });
});
