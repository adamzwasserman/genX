const { test, expect } = require('@playwright/test');

test('Batch audit all demo controls', async ({ page }) => {
    const results = { passed: [], failed: [] };
    
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Run all checks via evaluate
    const audit = await page.evaluate(() => {
        const r = { passed: [], failed: [] };
        
        // Module checks
        const modules = {
            'genxCommon': !!window.genxCommon,
            'FormatX (fmtX)': !!window.FormatX,
            'bindX': !!window.bindX,
            'DragX': !!window.DragX,
            'navX': !!window.navX,
            'AccessX (accX)': !!window.AccessX,
            'loadX': !!window.loadX,
            'tableX': !!window.tableX
        };
        
        for (const [name, loaded] of Object.entries(modules)) {
            if (loaded) r.passed.push(`Module: ${name}`);
            else r.failed.push(`Module: ${name} NOT LOADED`);
        }
        
        // Element counts
        const counts = {
            'bx-model elements': document.querySelectorAll('[bx-model]').length,
            'bx-bind elements': document.querySelectorAll('[bx-bind]').length,
            'dx-draggable elements': document.querySelectorAll('[dx-draggable]').length,
            'dx-drop-zone elements': document.querySelectorAll('[dx-drop-zone]').length,
            'fx-format elements': document.querySelectorAll('[fx-format]').length,
            'ax-enhance elements': document.querySelectorAll('[ax-enhance]').length,
            'lx-loading elements': document.querySelectorAll('[lx-strategy]').length,
            'nx-tabs elements': document.querySelectorAll('[nx-tabs]').length,
            'tx-sort tables': document.querySelectorAll('[tx-sortable]').length
        };
        
        for (const [name, count] of Object.entries(counts)) {
            if (count > 0) r.passed.push(`Found ${count} ${name}`);
            else r.failed.push(`No ${name} found`);
        }
        
        return r;
    });
    
    results.passed.push(...audit.passed);
    results.failed.push(...audit.failed);
    
    // Interactive tests
    // bindX two-way binding
    const nameInput = page.locator('input[bx-model="name"]').first();
    const nameOutput = page.locator('span[bx-bind="name"]').first();
    await nameInput.fill('AuditTest');
    await page.waitForTimeout(150);
    const nameResult = await nameOutput.textContent();
    if (nameResult === 'AuditTest') results.passed.push('bindX: Two-way binding works');
    else results.failed.push(`bindX: Two-way binding broken (got "${nameResult}")`);
    
    // bindX number binding
    const qtyInput = page.locator('input[bx-model="quantity"]').first();
    const qtyOutput = page.locator('span[bx-bind="quantity"]').first();
    await qtyInput.fill('99');
    await page.waitForTimeout(150);
    const qtyResult = await qtyOutput.textContent();
    if (qtyResult === '99') results.passed.push('bindX: Number binding works');
    else results.failed.push(`bindX: Number binding broken (got "${qtyResult}")`);
    
    // bindX checkbox binding
    const checkbox = page.locator('input[bx-model="agreed"]').first();
    const checkOutput = page.locator('span[bx-bind="agreed"]').first();
    await checkbox.check();
    await page.waitForTimeout(150);
    const checkResult = await checkOutput.textContent();
    if (checkResult === 'true') results.passed.push('bindX: Checkbox binding works');
    else results.failed.push(`bindX: Checkbox binding broken (got "${checkResult}")`);
    
    // bindX select binding
    const select = page.locator('select[bx-model="color"]').first();
    const selectOutput = page.locator('span[bx-bind="color"]').first();
    await select.selectOption('Blue');
    await page.waitForTimeout(150);
    const selectResult = await selectOutput.textContent();
    if (selectResult === 'Blue') results.passed.push('bindX: Select binding works');
    else results.failed.push(`bindX: Select binding broken (got "${selectResult}")`);
    
    // fmtX currency formatting
    const currencyFormatted = await page.evaluate(() => {
        const el = document.querySelector('[fx-format="currency"]');
        return el ? el.textContent : null;
    });
    if (currencyFormatted && currencyFormatted.includes('$')) results.passed.push('fmtX: Currency formatting works');
    else results.failed.push(`fmtX: Currency formatting broken (got "${currencyFormatted}")`);
    
    // Polymorphic notation - test all three styles
    const poly1 = page.locator('input[bx-model="polyDemo1"]').first();
    const poly1Out = page.locator('span[bx-bind="polyDemo1"]').first();
    await poly1.fill('PolyTest');
    await page.waitForTimeout(600);
    const poly1Result = await poly1Out.textContent();
    if (poly1Result === 'PolyTest') results.passed.push('Polymorphic: Verbose notation works');
    else results.failed.push(`Polymorphic: Verbose notation broken (got "${poly1Result}")`);
    
    // Print results
    console.log('\n========== BATCH AUDIT RESULTS ==========');
    console.log(`✅ PASSED: ${results.passed.length}`);
    results.passed.forEach(r => console.log(`   ${r}`));
    console.log(`\n❌ FAILED: ${results.failed.length}`);
    results.failed.forEach(r => console.log(`   ${r}`));
    console.log('==========================================\n');
    
    expect(results.failed.length).toBe(0);
});
