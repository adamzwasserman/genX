const { test, expect } = require('@playwright/test');

test.describe('Date Input Types and Output Formats', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
        await page.waitForLoadState('networkidle');
    });

    test('should display all input type options', async ({ page }) => {
        const selector = page.locator('#date-input-type-selector');
        await expect(selector).toBeVisible();

        const options = await selector.locator('option').allTextContents();
        expect(options.length).toBe(4);
        expect(options[0]).toContain('ISO String');
        expect(options[1]).toContain('Unix Timestamp');
        expect(options[2]).toContain('Milliseconds');
        expect(options[3]).toContain('JavaScript Date');
    });

    test('should display all output format options', async ({ page }) => {
        const selector = page.locator('#date-format-selector');
        await expect(selector).toBeVisible();

        const options = await selector.locator('option').allTextContents();
        expect(options).toEqual(['Short', 'Medium', 'Long', 'Full', 'ISO']);
    });

    test('should default to ISO input type and Long output format', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');

        const inputType = await inputTypeSelector.inputValue();
        const outputFormat = await outputFormatSelector.inputValue();

        expect(inputType).toBe('iso');
        expect(outputFormat).toBe('long');
    });

    test('should update input value display when input type changes', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const inputValueDisplay = page.locator('#date-input-value');

        // ISO (default)
        let displayedValue = await inputValueDisplay.textContent();
        expect(displayedValue).toBe('2025-11-10');

        // Unix timestamp
        await inputTypeSelector.selectOption('unix');
        displayedValue = await inputValueDisplay.textContent();
        expect(displayedValue).toBe('1731196800');

        // Milliseconds
        await inputTypeSelector.selectOption('milliseconds');
        displayedValue = await inputValueDisplay.textContent();
        expect(displayedValue).toBe('1731196800000');

        // JavaScript Date
        await inputTypeSelector.selectOption('date');
        displayedValue = await inputValueDisplay.textContent();
        expect(displayedValue).toBe('2025-11-10T00:00:00Z');
    });

    test('should update fx-type attribute when input type changes', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const output = page.locator('#date-output');

        await inputTypeSelector.selectOption('unix');
        let attr = await output.getAttribute('fx-type');
        expect(attr).toBe('unix');

        await inputTypeSelector.selectOption('milliseconds');
        attr = await output.getAttribute('fx-type');
        expect(attr).toBe('milliseconds');
    });

    test('should format ISO input correctly with all output formats', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await inputTypeSelector.selectOption('iso');

        // Test each output format
        const formats = [
            { value: 'short', pattern: /\d{1,2}\/\d{1,2}\/\d{4}/ },
            { value: 'medium', contains: 'Nov' },
            { value: 'long', contains: 'November' },
            { value: 'full', contains: 'November' },
            { value: 'iso', exact: '2025-11-10' }
        ];

        for (const format of formats) {
            await outputFormatSelector.selectOption(format.value);
            const text = await output.textContent();

            if (format.pattern) {
                expect(text).toMatch(format.pattern);
            } else if (format.contains) {
                expect(text).toContain(format.contains);
            } else if (format.exact) {
                expect(text).toBe(format.exact);
            }

            console.log(`ISO → ${format.value}: ${text}`);
        }
    });

    test('should format Unix timestamp correctly with all output formats', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await inputTypeSelector.selectOption('unix');

        // Test each output format
        const formats = ['short', 'medium', 'long', 'full', 'iso'];

        for (const format of formats) {
            await outputFormatSelector.selectOption(format);
            const text = await output.textContent();

            expect(text).toBeTruthy();
            expect(text.length).toBeGreaterThan(0);
            // All should contain 2025 (the year)
            expect(text).toContain('2025');

            console.log(`Unix → ${format}: ${text}`);
        }
    });

    test('should format milliseconds correctly with all output formats', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await inputTypeSelector.selectOption('milliseconds');

        const formats = ['short', 'medium', 'long', 'full', 'iso'];

        for (const format of formats) {
            await outputFormatSelector.selectOption(format);
            const text = await output.textContent();

            expect(text).toBeTruthy();
            expect(text.length).toBeGreaterThan(0);
            expect(text).toContain('2025');

            console.log(`Milliseconds → ${format}: ${text}`);
        }
    });

    test('should format JavaScript Date string correctly', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        await inputTypeSelector.selectOption('date');

        const formats = ['short', 'medium', 'long', 'full', 'iso'];

        for (const format of formats) {
            await outputFormatSelector.selectOption(format);
            const text = await output.textContent();

            expect(text).toBeTruthy();
            expect(text).toContain('2025');

            console.log(`Date string → ${format}: ${text}`);
        }
    });

    test('should test all input/output combinations (matrix test)', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        const inputTypes = ['iso', 'unix', 'milliseconds', 'date'];
        const outputFormats = ['short', 'medium', 'long', 'full', 'iso'];

        console.log('\n=== Full Input/Output Matrix ===');

        for (const inputType of inputTypes) {
            await inputTypeSelector.selectOption(inputType);

            for (const outputFormat of outputFormats) {
                await outputFormatSelector.selectOption(outputFormat);

                const fxType = await output.getAttribute('fx-type');
                const fxFormat = await output.getAttribute('fx-date-format');
                const text = await output.textContent();

                expect(fxType).toBe(inputType);
                expect(fxFormat).toBe(outputFormat);
                expect(text).toBeTruthy();
                expect(text.length).toBeGreaterThan(0);

                console.log(`${inputType.padEnd(12)} → ${outputFormat.padEnd(6)}: ${text}`);
            }
        }
    });

    test('should handle rapid input type changes', async ({ page }) => {
        const inputTypeSelector = page.locator('#date-input-type-selector');
        const output = page.locator('#date-output');

        const types = ['unix', 'iso', 'milliseconds', 'date', 'iso'];

        for (const type of types) {
            await inputTypeSelector.selectOption(type);
            const text = await output.textContent();
            expect(text).toBeTruthy();
        }
    });

    test('should handle rapid output format changes', async ({ page }) => {
        const outputFormatSelector = page.locator('#date-format-selector');
        const output = page.locator('#date-output');

        const formats = ['short', 'medium', 'long', 'full', 'iso', 'long'];

        for (const format of formats) {
            await outputFormatSelector.selectOption(format);
            const text = await output.textContent();
            expect(text).toBeTruthy();
        }
    });
});
