const { test } = require('@playwright/test');

test('Debug what is actually broken', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Print all console errors
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach(e => console.log('ERROR:', e));

    // Check if modules loaded
    const moduleCheck = await page.evaluate(() => {
        return {
            genxCommon: !!window.genxCommon,
            bindX: !!window.bindX,
            FormatX: !!window.FormatX,
            DragX: !!window.DragX
        };
    });
    console.log('\n=== MODULE STATUS ===');
    console.log(JSON.stringify(moduleCheck, null, 2));

    // Test the first bindX control manually
    console.log('\n=== TESTING name INPUT ===');
    const nameInput = page.locator('input[bx-model="name"]').first();
    const nameOutput = page.locator('span[bx-bind="name"]').first();

    console.log('Input exists:', await nameInput.count() > 0);
    console.log('Output exists:', await nameOutput.count() > 0);

    const beforeText = await nameOutput.textContent();
    console.log('Output BEFORE:', beforeText);

    await nameInput.fill('TEST123');
    await page.waitForTimeout(500);

    const afterText = await nameOutput.textContent();
    console.log('Output AFTER:', afterText);
    console.log('BINDING WORKS:', afterText === 'TEST123');

    // Test quantity
    console.log('\n=== TESTING quantity INPUT ===');
    const qtyInput = page.locator('input[bx-model="quantity"]').first();
    const qtyOutput = page.locator('span[bx-bind="quantity"]').first();

    console.log('Input exists:', await qtyInput.count() > 0);
    console.log('Output exists:', await qtyOutput.count() > 0);

    const qtyBefore = await qtyOutput.textContent();
    console.log('Output BEFORE:', qtyBefore);

    await qtyInput.fill('999');
    await page.waitForTimeout(500);

    const qtyAfter = await qtyOutput.textContent();
    console.log('Output AFTER:', qtyAfter);
    console.log('BINDING WORKS:', qtyAfter === '999');

    // Check what the reactive data looks like
    const dataState = await page.evaluate(() => {
        // Try to find where reactive data is stored
        if (window.bindX && window.bindX._data) return window.bindX._data;
        if (window._reactiveData) return window._reactiveData;

        // Check if init was called
        return { message: 'Cannot find reactive data - init may not have been called' };
    });
    console.log('\n=== DATA STATE ===');
    console.log(JSON.stringify(dataState, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/tmp/genx-debug.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/genx-debug.png');
});
