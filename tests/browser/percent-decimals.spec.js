const { test, expect } = require('@playwright/test');

test.describe('Percent decimal precision', () => {
    test('should format with default 0 decimals', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/test-percent-decimals.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.textContent('p:has-text("Default")');
        expect(output).toContain('12%');
    });

    test('should format with 1 decimal', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/test-percent-decimals.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.textContent('p:has-text("decimals:1")');
        expect(output).toContain('12.3%');
    });

    test('should format with 2 decimals', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/test-percent-decimals.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.textContent('p:has-text("decimals:2")');
        expect(output).toContain('12.34%');
    });

    test('should format with 3 decimals', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/test-percent-decimals.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.textContent('p:has-text("decimals:3")');
        expect(output).toContain('12.346%');
    });

    test('should work with percentage input type', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/test-percent-decimals.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.textContent('p:has-text("Percentage type")');
        expect(output).toContain('12.3%');
    });
});
