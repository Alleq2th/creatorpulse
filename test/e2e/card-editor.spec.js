// End-to-end checks for the card editor on a generated graphic: the preview is the
// editor, dim and phone overlay text update at once, and Download gives the same look.
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');
const { jpegSize } = require('./exportHelpers');

// A 1x1 PNG stands in for the rendered card image.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function setupTikTokGraphic(context, page, cardRequests) {
  await signIn(context);
  await mockApi(page, 'unused caption');
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
}

// The export that Download saves, read from the card's image.
async function exportBuffer(page) {
  const src = await page.locator('img[data-cp-export]').first().getAttribute('src');
  return Buffer.from(src.split(',')[1], 'base64');
}

async function downloadImage(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download image' }).first().click(),
  ]);
  return fs.readFileSync(await download.path());
}

test.describe('Card editor on a graphic', () => {
  test('dim and phone overlay text update the preview with no Apply step, and Download gives the edited card', async ({ context, page }) => {
    const cardRequests = [];
    await setupTikTokGraphic(context, page, cardRequests);

    const stage = page.locator('.cc-live-stage').first();
    await expect(stage).toBeAttached({ timeout: 20000 });
    await expect.poll(() => stage.locator('.cc-live-plate').evaluate((el) => el.style.backgroundImage), { timeout: 15000 }).toContain('data:image');

    // The editor has no Apply step.
    await expect(page.getByRole('button', { name: /Apply/ })).toHaveCount(0);

    // 1. Dim from the background menu, opened by tapping an empty part of the card.
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    await page.mouse.click(box.x + box.width * 0.95, box.y + box.height * 0.05);
    const menu = page.locator('.cc-bg').first();
    await expect(menu).toBeVisible();
    await menu.getByLabel('Background dimming').evaluate((el) => {
      el.value = '60';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(stage.locator('.cc-live-dim')).toHaveCSS('opacity', '0.6');

    // 2. Phone overlay text sits under Post details and updates the mockup at once.
    await page.locator('.cc-post-details summary').click();
    await page.locator('input[aria-label="Phone name"]').fill('creator_test');
    await expect(page.locator('[data-cp-mock="handle"]').first()).toHaveText('creator_test');

    // 3. Download gives the card as it looks now, with no server call.
    const before = cardRequests.length;
    const buf = await downloadImage(page);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(jpegSize(buf)).toEqual({ width: 1080, height: 1920 });
    expect(cardRequests.length).toBe(before);
  });
});

test.describe('Live card preview', () => {
  test('tap selects a text block, drag moves it, the corner resizes it, and the download follows the preview', async ({ context, page }) => {
    const cardRequests = [];
    await setupTikTokGraphic(context, page, cardRequests);

    const stage = page.locator('.cc-live-stage').first();
    await expect(stage).toBeAttached({ timeout: 20000 });
    await expect.poll(() => stage.locator('.cc-live-plate').evaluate((el) => el.style.backgroundImage), { timeout: 15000 }).toContain('data:image');
    const headline = stage.locator('[data-canvas-block="headline"]');
    await expect(headline.locator('.cc-live-text')).toBeVisible();

    // The image as it looks before any move, once the first export has finished.
    await expect.poll(() => page.locator('img[data-cp-export]').first().getAttribute('src'), { timeout: 15000 }).toMatch(/^data:image\/jpeg/);
    const before = await exportBuffer(page);

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

    // Moves and resizes made no server calls, and there is no Apply step.
    expect(cardRequests.length).toBe(requestsBeforeEdits);
    await expect(page.getByRole('button', { name: /Apply/ })).toHaveCount(0);

    // Once the export catches up with the edits, Download shows the moved and resized headline.
    const beforeSrc = await page.locator('img[data-cp-export]').first().getAttribute('src');
    await expect.poll(() => page.locator('img[data-cp-export]').first().getAttribute('src'), { timeout: 15000 }).not.toBe(beforeSrc);
    const after = await exportBuffer(page);
    // The image changed, and it is still 9:16.
    expect(after.equals(before)).toBe(false);
    expect(jpegSize(after)).toEqual({ width: 1080, height: 1920 });
    expect(cardRequests.length).toBe(requestsBeforeEdits);
    // Download saves that same image.
    const saved = await downloadImage(page);
    expect(saved.equals(after)).toBe(true);
  });
});
