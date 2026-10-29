// End-to-end checks for the Create flow: platform switching, template
// selection, caption generation, and sending a script to the Studio teleprompter.
// Selectors match the buttons rendered by public/create/steps.js.
const { test, expect } = require('@playwright/test');
const { signIn, mockApi, openCreate, startIdeaFlow } = require('./helpers');

const CAPTION = 'Most creators quit at three months because nobody told them it gets easier. #creators';
const SCRIPT = 'Three months in, it feels like nothing is working. Here is what changes next.';

async function pressed(page, onclick) {
  return page.locator(`button[onclick="${onclick}"]`).getAttribute('aria-pressed');
}

test.describe('Create flow', () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context);
    await mockApi(page, CAPTION);
  });

  test('platform switching moves the selection and changes the formats offered', async ({ page }) => {
    await openCreate(page);
    await startIdeaFlow(page);

    await page.locator(`button[onclick="cpCreateSetPlatform('instagram')"]`).click();
    expect(await pressed(page, "cpCreateSetPlatform('instagram')")).toBe('true');
    expect(await pressed(page, "cpCreateSetPlatform('youtube')")).toBe('false');

    await page.locator(`button[onclick="cpCreateSetPlatform('youtube')"]`).click();
    expect(await pressed(page, "cpCreateSetPlatform('instagram')")).toBe('false');
    expect(await pressed(page, "cpCreateSetPlatform('youtube')")).toBe('true');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Which format?')).toBeVisible();
    await expect(page.getByText('Long Form Script')).toBeVisible();
    await expect(page.getByText('IG Carousel')).toHaveCount(0);
  });

  test('template selection marks the chosen template for an image format', async ({ page }) => {
    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator(`button[onclick="cpCreateSetPlatform('instagram')"]`).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'IG Carousel' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('body')).toContainText('Template');

    await page.locator(`button[onclick="cpCreateSetTemplate('editorial')"]`).click();
    expect(await pressed(page, "cpCreateSetTemplate('editorial')")).toBe('true');
    expect(await pressed(page, "cpCreateSetTemplate('impact')")).toBe('false');
  });

  test('caption generation produces the caption in the result step', async ({ page }) => {
    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator(`button[onclick="cpCreateSetPlatform('instagram')"]`).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'Caption + Hashtags' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Generate' }).click();

    await expect(page.getByText(CAPTION)).toBeVisible({ timeout: 20_000 });
  });

  // KNOWN BUG, tracked in the PR: the "Studio" button on a generated script calls
  // svOpenWithScript(), which loads the script but never switches the Studio view on
  test('a script generated in Create opens in the Studio teleprompter', async ({ page }) => {
    await mockApi(page, SCRIPT);
    await openCreate(page);
    await startIdeaFlow(page);
    await page.locator(`button[onclick="cpCreateSetPlatform('instagram')"]`).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('button[onclick^="cpCreateSetFormat"]', { hasText: 'IG Reel Script' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByText(SCRIPT)).toBeVisible({ timeout: 20_000 });

    await page.locator('button[onclick^="studioShootScript("]').first().click();
    await expect(page.locator('#sv-prompter-wrap')).toContainText(SCRIPT, { timeout: 20_000 });
  });
});
