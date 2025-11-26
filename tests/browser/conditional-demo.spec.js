const { test } = require('@playwright/test');

test('Show conditional binding working', async ({ page }) => {
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Find the showDetails checkbox and conditional element
    const checkbox = page.locator('input[bx-model="showDetails"]').first();
    const conditionalEl = page.locator('[bx-if="showDetails"]').first();

    // Scroll to the element
    await checkbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot BEFORE
    console.log('\n=== BEFORE CHECKING ===');
    const beforeVisible = await conditionalEl.isVisible();
    console.log('Conditional element visible:', beforeVisible);
    await page.screenshot({ path: '/tmp/conditional-BEFORE.png' });
    console.log('Screenshot saved: /tmp/conditional-BEFORE.png');

    // Check the checkbox
    await checkbox.check();
    await page.waitForTimeout(500);

    // Take screenshot AFTER
    console.log('\n=== AFTER CHECKING ===');
    const afterVisible = await conditionalEl.isVisible();
    console.log('Conditional element visible:', afterVisible);
    await page.screenshot({ path: '/tmp/conditional-AFTER.png' });
    console.log('Screenshot saved: /tmp/conditional-AFTER.png');

    console.log('\n=== RESULT ===');
    console.log('Conditional binding works:', !beforeVisible && afterVisible);
});
