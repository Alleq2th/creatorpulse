// Shared setup for the Create and Studio end-to-end tests.

// A signed-in session, so the app skips the login screen. The token is fake:
// every /api call is answered by mockApi() below.
async function signIn(context) {
  await context.addInitScript(() => {
    localStorage.setItem('cp_cookie_ack', '1');
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 'e2e-token',
      refreshToken: 'e2e-refresh',
      user: { id: 'e2e-user', email: 'e2e@example.com', name: 'E2E', niches: ['tech'] },
      connections: {},
    }));
  });
}

// Answers the API calls the Create flow makes. `generateText` is what the
// single-text generator (/api/generate) returns for captions and scripts.
async function mockApi(page, generateText) {
  await page.route('**/api/**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/api/generate') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: generateText }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [], trends: [], events: [], drafts: [], saved: [], niches: ['tech'], photos: [] }),
    });
  });
}

// Opens the app and moves to the Create tab using the app's own tab router.
async function openCreate(page) {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.setTab === 'function');
  await page.evaluate(() => window.setTab('create'));
  await page.getByText('What are you creating from?').waitFor();
}

// Walks the source step with the real "My own idea" path up to the platform step.
async function startIdeaFlow(page) {
  await page.evaluate(() => {
    window.cpCreateSetSource('idea');
    // "My own idea" opens the Plus AI panel; close it so it does not cover the steps.
    if (typeof window.closePulseAi === 'function') window.closePulseAi();
    window.cpCreateSetIdea('Why most creators quit at three months');
    window.cpCreateGo('platform');
  });
  await page.getByText('Where is this going?').waitFor();
}

module.exports = { signIn, mockApi, openCreate, startIdeaFlow };
