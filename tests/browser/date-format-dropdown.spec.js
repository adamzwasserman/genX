const { test, expect } = require('@playwright/test');

test.describe('Date Format Dropdown', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');
    });

    test('should display all date format options in dropdown', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        await expect(selector).toBeVisible();

        const options = await selector.locator('option').allTextContents();
        expect(options).toEqual(['Short', 'Medium', 'Long', 'Full', 'ISO']);
    });

    test('should default to "Long" format', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const selectedValue = await selector.inputValue();
        expect(selectedValue).toBe('long');

        const output = page.locator('#date-output');
        const text = await output.textContent();
        // Long format should show full month name
        expect(text).toContain('November');
    });

    test('should change to Short format when selected', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await selector.selectOption('short');

        const text = await output.textContent();
        // Short format: 11/10/2025 or similar
        expect(text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    test('should change to Medium format when selected', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await selector.selectOption('medium');

        const text = await output.textContent();
        // Medium format: Nov 10, 2025
        expect(text).toContain('Nov');
        expect(text).toContain('2025');
    });

    test('should change to Full format when selected', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await selector.selectOption('full');

        const text = await output.textContent();
        // Full format: Monday, November 10, 2025
        expect(text).toContain('November');
        expect(text).toContain('2025');
        // Should include day of week
        expect(text).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    });

    test('should change to ISO format when selected', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await selector.selectOption('iso');

        const text = await output.textContent();
        // ISO format: 2025-11-10
        expect(text).toBe('2025-11-10');
    });

    test('should update fx-date-format attribute when format changes', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await selector.selectOption('short');
        let attr = await output.getAttribute('fx-date-format');
        expect(attr).toBe('short');

        await selector.selectOption('iso');
        attr = await output.getAttribute('fx-date-format');
        expect(attr).toBe('iso');
    });

    test('should test all formats sequentially', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        const formats = ['short', 'medium', 'long', 'full', 'iso'];

        for (const format of formats) {
            await selector.selectOption(format);
            const text = await output.textContent();
            const attr = await output.getAttribute('fx-date-format');

            expect(attr).toBe(format);
            expect(text).toBeTruthy();
            expect(text.length).toBeGreaterThan(0);

            console.log(`${format}: ${text}`);
        }
    });
});
