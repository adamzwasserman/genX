const { test, expect } = require('@playwright/test');

test('Debug input type issues', async ({ page }) => {
    const messages = [];
    page.on('console', msg => messages.push(`${msg.type()}: ${msg.text()}`));

    await page.goto(`file://${process.cwd()}/test-input-types-debug.html`);
    await page.waitForLoadState('networkidle');

    // Wait for scripts to execute
    await page.waitForTimeout(500);

    console.log('\n=== Console Output ===');
    messages.forEach(msg => console.log(msg));

    // Get results
    const result1 = await page.locator('#result-1').textContent();
    const result2 = await page.locator('#result-2').textContent();
    const result3 = await page.locator('#result-3').textContent();
    const result4 = await page.locator('#result-4').textContent();

    console.log('\n=== Results ===');
    console.log('1. Currency cents (123456):', result1);
    console.log('   Expected: $1,234.56');
    console.log('   Status:', result1.includes('1,234.56') ? '✓ PASS' : '✗ FAIL');

    console.log('\n2. Percentage percentage (12.34):', result2);
    console.log('   Expected: 12% (not 1234%)');
    console.log('   Status:', result2 === '12%' ? '✓ PASS' : '✗ FAIL');

    console.log('\n3. Percentage string ("0.5"):', result3);
    console.log('   Expected: 50%');
    console.log('   Status:', result3 === '50%' ? '✓ PASS' : '✗ FAIL');

    console.log('\n4. Date milliseconds (1762732800000):', result4);
    console.log('   Expected: November 10, 2025');
    console.log('   Status:', result4.includes('November') && result4.includes('2025') ? '✓ PASS' : '✗ FAIL');
});
