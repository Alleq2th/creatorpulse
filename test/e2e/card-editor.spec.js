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
    const editor = page.locator('details.cp-canvas-editor').first();
    if ((await editor.getAttribute('open')) === null) await editor.locator('summary').click();
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

test.describe('Live card preview', () => {
  test('tap selects a text block, drag moves it, the corner resizes it, and the preview updates without a server call', async ({ context, page }) => {
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

    const stage = page.locator('.cc-live-stage').first();
    await expect(stage).toBeAttached({ timeout: 20000 });
    // The plate loads into the preview and the text is drawn on top of it.
    await expect.poll(() => stage.locator('.cc-live-plate').evaluate((el) => el.style.backgroundImage), { timeout: 15000 }).toContain('data:image');
    const headline = stage.locator('[data-canvas-block="headline"]');
    await expect(headline.locator('.cc-live-text')).toBeVisible();

    // Tap selects: outline and resize handle appear.
    await headline.click({ position: { x: 30, y: 12 } });
    await expect(headline).toHaveClass(/is-selected/);
    const requestsBeforeEdits = cardRequests.length;

    // Drag moves the block.
    const b0 = await headline.boundingBox();
    await page.mouse.move(b0.x + 30, b0.y + 15);
    await page.mouse.down();
    await page.mouse.move(b0.x + 90, b0.y + 55, { steps: 8 });
    await page.mouse.up();
    const b1 = await headline.boundingBox();
    expect(b1.x).toBeGreaterThan(b0.x + 40);
    expect(b1.y).toBeGreaterThan(b0.y + 25);

    // The corner handle resizes the block: narrower and taller.
    const handle = await headline.locator('[data-canvas-resize]').boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 - 60, handle.y + handle.height / 2 + 30, { steps: 6 });
    await page.mouse.up();
    const b2 = await headline.boundingBox();
    expect(b2.width).toBeLessThan(b1.width - 25);
    expect(b2.height).toBeGreaterThan(b1.height + 15);

    // Typing updates the live text straight away, and moves and resizes made no server calls.
    await page.locator('.cc-style-panel [data-cp-layer="headline"] textarea').fill('Live text check');
    await expect(headline.locator('.cc-live-text')).toHaveText('Live text check');
    expect(cardRequests.length).toBe(requestsBeforeEdits);

    // Save: the same layout goes to the card renderer.
    await page.locator('.cc-style-panel').first().getByRole('button', { name: 'Apply to card image' }).click();
    await expect.poll(() => cardRequests.length, { timeout: 15000 }).toBeGreaterThan(requestsBeforeEdits);
    const slide = cardRequests[cardRequests.length - 1].slides[0];
    expect(slide.textLayout.headline.width).toBeGreaterThan(0.2);
    expect(slide.textLayout.headline.x).toBeGreaterThan(0.1);
  });
});

