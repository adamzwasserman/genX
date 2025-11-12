const { test, expect } = require('@playwright/test');

test.describe('Percentage dropdown in demo page', () => {
    test('should correctly format percentage with decimal input type (0-1)', async ({ page }) => {
        // Listen to console messages
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

        await page.goto(`file://${process.cwd()}/examples/genx-demo.html?v=${Date.now()}`);
        await page.waitForLoadState('networkidle');

        // Find the percentage dropdown
        const selector = page.locator('#percent-input-type-selector');
        await expect(selector).toBeVisible();

        // Select "decimal"
        await selector.selectOption('decimal');

        // Wait for update
        await page.waitForTimeout(200);

        // Check the input value display (should show 0.1234)
        const inputValue = await page.locator('#percent-input-value').textContent();
        console.log('Input value display:', inputValue);

        // Check the output (should be 12% or 12.34%)
        const output = await page.locator('#percent-output').textContent();
        console.log('Output:', output);
        console.log('Console messages:', consoleMessages);

        // Verify output contains expected percentage
        expect(output).toMatch(/12[.%]/);
    });

    test('should correctly format percentage with percentage input type (0-100)', async ({ page }) => {
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

        await page.goto(`file://${process.cwd()}/examples/genx-demo.html?v=${Date.now()}`);
        await page.waitForLoadState('networkidle');

        const selector = page.locator('#percent-input-type-selector');
        await expect(selector).toBeVisible();

        // Select "percentage"
        await selector.selectOption('percentage');

        await page.waitForTimeout(200);

        const inputValue = await page.locator('#percent-input-value').textContent();
        console.log('Input value display:', inputValue);

        const output = await page.locator('#percent-output').textContent();
        console.log('Output:', output);
        console.log('Console messages:', consoleMessages);

        // Should be 12% (12.34 as percentage → 12%)
        expect(output).toMatch(/12[.%]/);
    });

    test('should correctly format percentage with string input type', async ({ page }) => {
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

        await page.goto(`file://${process.cwd()}/examples/genx-demo.html?v=${Date.now()}`);
        await page.waitForLoadState('networkidle');

        const selector = page.locator('#percent-input-type-selector');
        await expect(selector).toBeVisible();

        // Select "string"
        await selector.selectOption('string');

        await page.waitForTimeout(200);

        const inputValue = await page.locator('#percent-input-value').textContent();
        console.log('Input value display:', inputValue);

        const output = await page.locator('#percent-output').textContent();
        console.log('Output:', output);
        console.log('Console messages:', consoleMessages);

        // Should be 12% (string "0.1234" → 12%)
        expect(output).toMatch(/12[.%]/);
    });

    test('should show correct raw values for each input type', async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html?v=${Date.now()}`);
        await page.waitForLoadState('networkidle');

        const selector = page.locator('#percent-input-type-selector');

        // Test decimal
        await selector.selectOption('decimal');
        await page.waitForTimeout(100);
        let inputValue = await page.locator('#percent-input-value').textContent();
        expect(inputValue).toBe('0.1234');

        // Test percentage
        await selector.selectOption('percentage');
        await page.waitForTimeout(100);
        inputValue = await page.locator('#percent-input-value').textContent();
        expect(inputValue).toBe('12.34');

        // Test string
        await selector.selectOption('string');
        await page.waitForTimeout(100);
        inputValue = await page.locator('#percent-input-value').textContent();
        expect(inputValue).toBe('"0.1234"');
    });
});
