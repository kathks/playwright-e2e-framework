import { defineConfig, devices } from '@playwright/test';

/**
 * Central test configuration.
 *
 * Design notes:
 * - `baseURL` is environment-driven so the same suite runs against local, staging or demo.
 * - Retries are enabled only in CI: locally a failure should fail loudly and immediately.
 * - Traces/video/screenshots are captured on failure only, keeping artefacts small but
 *   giving a full replay of anything that actually broke.
 */
export default defineConfig({
  testDir: './tests',

  /* Run every file in parallel; individual files stay serial-safe by design. */
  fullyParallel: true,

  /* Fail the build if someone commits test.only */
  forbidOnly: !!process.env.CI,

  /* Retry in CI to absorb infrastructure noise, never to hide real flake. */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  timeout: 45_000,
  expect: { timeout: 7_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-test',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
