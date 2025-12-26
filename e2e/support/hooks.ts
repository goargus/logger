import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { CustomWorld } from './world';

let browser: Browser;

BeforeAll(async function () {
  // Launch browser for UI tests
  browser = await chromium.launch({
    headless: process.env.E2E_HEADLESS !== 'false',
    slowMo: parseInt(process.env.E2E_SLOW_MO || '0'),
  });
});

AfterAll(async function () {
  await browser?.close();
});

// Setup for UI tests
Before({ tags: '@ui' }, async function (this: CustomWorld) {
  this.browser = browser;
  this.browserContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  this.page = await this.browserContext.newPage();
});

// Cleanup for UI tests
After({ tags: '@ui' }, async function (this: CustomWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }

  await this.page?.close();
  await this.browserContext?.close();
});

// Setup for API tests
Before({ tags: '@api' }, async function (this: CustomWorld) {
  // API client is initialized in world constructor
  // Reset context for each scenario
  this.context = {};
});

// General cleanup after each scenario
After(async function (this: CustomWorld) {
  await this.cleanup();
});
