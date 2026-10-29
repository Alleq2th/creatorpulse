// End-to-end test configuration. Tests run in Chromium against public/ served
// by test/e2e/serve.js. Set CHROME_PATH to use an installed Chromium instead of
// the one Playwright downloads.
const { defineConfig } = require('@playwright/test');

const PORT = Number(process.env.PORT) || 4173;

module.exports = defineConfig({
  testDir: 'test/e2e',
  testMatch: /.*\.spec\.js/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block',
    permissions: ['camera', 'microphone'],
    trace: 'retain-on-failure',
    viewport: { width: 420, height: 900 },
    // A fake camera and microphone let the Studio open its recording view,
    // which is where the teleprompter is drawn.
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    },
  },
  webServer: {
    command: 'node test/e2e/serve.js',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
