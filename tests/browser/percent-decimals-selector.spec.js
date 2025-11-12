const { test, expect } = require('@playwright/test');

test.describe('Percent decimals selector in demo page', () => {
    test('should format with 0 decimals by default', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        const output = await page.locator('#percent-output').textContent();
        console.log('Default output:', output);
        expect(output).toBe('12%');
    });

    test('should format with 1 decimal when selected', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        // Select 1 decimal
        await page.locator('#percent-decimals-selector').selectOption('1');
        await page.waitForTimeout(100);

        const output = await page.locator('#percent-output').textContent();
        console.log('1 decimal output:', output);
        expect(output).toBe('12.3%');
    });

    test('should format with 2 decimals when selected', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        // Select 2 decimals
        await page.locator('#percent-decimals-selector').selectOption('2');
        await page.waitForTimeout(100);

        const output = await page.locator('#percent-output').textContent();
        console.log('2 decimals output:', output);
        expect(output).toBe('12.34%');
    });

    test('should format with 3 decimals when selected', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        // Select 3 decimals
        await page.locator('#percent-decimals-selector').selectOption('3');
        await page.waitForTimeout(100);

        const output = await page.locator('#percent-output').textContent();
        console.log('3 decimals output:', output);
        // Input is 0.1234, so 0.1234 * 100 = 12.34 with 3 decimals = 12.340%
        expect(output).toBe('12.340%');
    });

    test('should work with percentage input type', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        // Select percentage type and 2 decimals
        await page.locator('#percent-input-type-selector').selectOption('percentage');
        await page.locator('#percent-decimals-selector').selectOption('2');
        await page.waitForTimeout(100);

        const output = await page.locator('#percent-output').textContent();
        console.log('Percentage type with 2 decimals:', output);
        expect(output).toBe('12.34%');
    });

    test('should dynamically update when changing decimals', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');

        // Start with 0 decimals
        let output = await page.locator('#percent-output').textContent();
        expect(output).toBe('12%');

        // Change to 1 decimal
        await page.locator('#percent-decimals-selector').selectOption('1');
        await page.waitForTimeout(100);
        output = await page.locator('#percent-output').textContent();
        expect(output).toBe('12.3%');

        // Change to 2 decimals
        await page.locator('#percent-decimals-selector').selectOption('2');
        await page.waitForTimeout(100);
        output = await page.locator('#percent-output').textContent();
        expect(output).toBe('12.34%');

        // Back to 0 decimals
        await page.locator('#percent-decimals-selector').selectOption('0');
        await page.waitForTimeout(100);
        output = await page.locator('#percent-output').textContent();
        expect(output).toBe('12%');
    });
});
