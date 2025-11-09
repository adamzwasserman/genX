/**
 * Test that modules load correctly in browser fixtures
 */

const { test, expect } = require('@playwright/test');

test.describe('Module Loading', () => {
  test('fmtx loads via fixture', async ({ page }) => {
    // Navigate to fixture
    await page.goto('/tests/browser/fixtures/fmtx-test.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if module loaded
    const formatXExists = await page.evaluate(() => typeof window.FormatX !== 'undefined');
    const testReady = await page.evaluate(() => window.testReady === true);

    expect(formatXExists).toBe(true);
    expect(testReady).toBe(true);
  });

  test('fmtx script path resolves correctly', async ({ page }) => {
    await page.goto('/tests/browser/fixtures/fmtx-test.html');

    // Wait for all scripts to load or fail
    await page.waitForLoadState('networkidle');

    // Check console for script errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Try to access FormatX
    const result = await page.evaluate(() => {
      return {
        formatXExists: typeof window.FormatX !== 'undefined',
        formatXType: typeof window.FormatX,
        globalKeys: Object.keys(window).filter(k => k.includes('Format') || k.includes('fx'))
      };
    });

    console.log('Result:', result);
    console.log('Errors:', errors);

    expect(result.formatXExists).toBe(true);
  });
});
