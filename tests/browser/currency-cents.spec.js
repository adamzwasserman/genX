const { test, expect } = require('@playwright/test');

test('Currency cents input type in demo page', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/examples/genx-demo.html`);
    await page.waitForLoadState('networkidle');

    // Find the currency selector
    const selector = page.locator('#currency-input-type-selector');
    await expect(selector).toBeVisible();

    // Select "cents"
    await selector.selectOption('cents');

    // Wait for update
    await page.waitForTimeout(100);

    // Check the input value display
    const inputValue = await page.locator('#currency-input-value').textContent();
    console.log('Input value display:', inputValue);
    expect(inputValue).toBe('123456');

    // Check the output
    const output = await page.locator('#currency-output').textContent();
    console.log('Output:', output);

    // Should be $1,234.56 not $12.35
    expect(output).toContain('1,234.56');
    expect(output).toContain('$');
});
