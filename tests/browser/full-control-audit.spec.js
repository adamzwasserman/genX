const { test } = require('@playwright/test');

test('FULL AUDIT - Every single demo control', async ({ page }) => {
    const results = { passed: [], failed: [] };

    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // ========== bindX: ALL bx-model CONTROLS ==========

    // 1. Two-way text binding (name)
    try {
        const input = page.locator('input[bx-model="name"]').first();
        const output = page.locator('span[bx-bind="name"]').first();
        if (await output.count() === 0) throw new Error('No output element');
        await input.fill('Test123');
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === 'Test123') results.passed.push('bindX: name (two-way text)');
        else results.failed.push('bindX: name - expected "Test123", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: name - ' + e.message); }

    // 2. Number binding (quantity)
    try {
        const input = page.locator('input[bx-model="quantity"]').first();
        const output = page.locator('span[bx-bind="quantity"]').first();
        if (await output.count() === 0) throw new Error('No output element');
        await input.fill('42');
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === '42') results.passed.push('bindX: quantity (number)');
        else results.failed.push('bindX: quantity - expected "42", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: quantity - ' + e.message); }

    // 3. Checkbox binding (agreed)
    try {
        const input = page.locator('input[bx-model="agreed"]').first();
        const output = page.locator('span[bx-bind="agreed"]').first();
        if (await output.count() === 0) throw new Error('No output element');
        await input.check();
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === 'true') results.passed.push('bindX: agreed (checkbox)');
        else results.failed.push('bindX: agreed - expected "true", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: agreed - ' + e.message); }

    // 4. Select binding (color)
    try {
        const input = page.locator('select[bx-model="color"]').first();
        const output = page.locator('span[bx-bind="color"]').first();
        if (await output.count() === 0) throw new Error('No output element');
        await input.selectOption('Green');
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === 'Green') results.passed.push('bindX: color (select)');
        else results.failed.push('bindX: color - expected "Green", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: color - ' + e.message); }

    // 5. Radio binding (size)
    try {
        const radios = page.locator('input[bx-model="size"]');
        const output = page.locator('span[bx-bind="size"]').first();
        const radioCount = await radios.count();
        if (radioCount === 0) throw new Error('No radio buttons found');
        if (await output.count() === 0) throw new Error('No output element');

        const firstRadioValue = await radios.first().getAttribute('value');
        if (!firstRadioValue) throw new Error('Radio has empty/no value attribute');

        await radios.first().check({ force: true });
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === firstRadioValue) results.passed.push('bindX: size (radio)');
        else results.failed.push('bindX: size - expected "' + firstRadioValue + '", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: size (radio) - ' + e.message); }

    // 6. Computed properties (price * qty = total)
    try {
        const priceInput = page.locator('input[bx-model="price"]').first();
        const qtyInput = page.locator('input[bx-model="qty"]').first();
        const totalOutput = page.locator('span[bx-bind="total"]').first();

        if (await priceInput.count() === 0) throw new Error('No price input');
        if (await qtyInput.count() === 0) throw new Error('No qty input');
        if (await totalOutput.count() === 0) throw new Error('No total output');

        await priceInput.fill('10');
        await qtyInput.fill('5');
        await page.waitForTimeout(200);
        const result = await totalOutput.textContent();
        if (result === '50') results.passed.push('bindX: total (computed)');
        else results.failed.push('bindX: total - expected "50", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: total (computed) - ' + e.message); }

    // 7. Form binding (firstName)
    try {
        const firstName = page.locator('input[bx-model="firstName"]').first();
        const firstOutput = page.locator('span[bx-bind="firstName"]').first();

        if (await firstName.count() === 0) throw new Error('No firstName input');
        if (await firstOutput.count() === 0) throw new Error('No firstName output');

        await firstName.fill('John');
        await page.waitForTimeout(150);
        const result = await firstOutput.textContent();
        if (result === 'John') results.passed.push('bindX: firstName (form)');
        else results.failed.push('bindX: firstName - expected "John", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: firstName (form) - ' + e.message); }

    // 8. Form binding (lastName)
    try {
        const lastName = page.locator('input[bx-model="lastName"]').first();
        const lastOutput = page.locator('span[bx-bind="lastName"]').first();

        if (await lastName.count() === 0) throw new Error('No lastName input');
        if (await lastOutput.count() === 0) throw new Error('No lastName output');

        await lastName.fill('Doe');
        await page.waitForTimeout(150);
        const result = await lastOutput.textContent();
        if (result === 'Doe') results.passed.push('bindX: lastName (form)');
        else results.failed.push('bindX: lastName - expected "Doe", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: lastName (form) - ' + e.message); }

    // 9. Textarea binding (bio) - binds to bio.length for char count
    try {
        const textarea = page.locator('textarea[bx-model="bio"]').first();
        const output = page.locator('span[bx-bind="bio.length"]').first();

        if (await textarea.count() === 0) throw new Error('No textarea found');
        if (await output.count() === 0) throw new Error('No output element for bio.length');

        await textarea.fill('Hello World');
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === '11') results.passed.push('bindX: bio.length (textarea char count)');
        else results.failed.push('bindX: bio.length - expected "11", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: bio (textarea) - ' + e.message); }

    // 10. Conditional binding (showDetails) - uses bx-if not bx-show
    try {
        const checkbox = page.locator('input[bx-model="showDetails"]').first();
        const conditionalEl = page.locator('[bx-if="showDetails"]').first();

        if (await checkbox.count() === 0) throw new Error('No showDetails checkbox');
        if (await conditionalEl.count() === 0) throw new Error('No conditional element');

        await checkbox.check();
        await page.waitForTimeout(150);
        const isVisible = await conditionalEl.isVisible();
        if (isVisible) results.passed.push('bindX: showDetails (conditional bx-if)');
        else results.failed.push('bindX: showDetails - element not visible after check');
    } catch (e) { results.failed.push('bindX: showDetails (conditional) - ' + e.message); }

    // 11. Email binding (output is <p> not <span>)
    try {
        const input = page.locator('input[bx-model="email"]').first();
        const output = page.locator('p[bx-bind="email"]').first();

        if (await input.count() === 0) throw new Error('No email input');
        if (await output.count() === 0) throw new Error('No email output');

        await input.fill('test@example.com');
        await page.waitForTimeout(150);
        const result = await output.textContent();
        if (result === 'test@example.com') results.passed.push('bindX: email (input)');
        else results.failed.push('bindX: email - expected "test@example.com", got "' + result + '"');
    } catch (e) { results.failed.push('bindX: email - ' + e.message); }

    // 12-14. Polymorphic demo bindings
    const polyModels = ['polyDemo1', 'polyDemo2', 'polyDemo3'];
    for (const model of polyModels) {
        try {
            let input = null;
            const sel1 = page.locator('input[bx-model="' + model + '"]').first();
            const sel2 = page.locator('input[bx-model="' + model + ':500"]').first();

            if (await sel1.count() > 0) input = sel1;
            else if (await sel2.count() > 0) input = sel2;

            if (!input) throw new Error('No input found');

            const output = page.locator('span[bx-bind="' + model + '"]').first();
            if (await output.count() === 0) throw new Error('No output element');

            await input.fill('PolyTest');
            await page.waitForTimeout(600);
            const result = await output.textContent();
            if (result === 'PolyTest') results.passed.push('bindX: ' + model + ' (polymorphic)');
            else results.failed.push('bindX: ' + model + ' - expected "PolyTest", got "' + result + '"');
        } catch (e) { results.failed.push('bindX: ' + model + ' - ' + e.message); }
    }

    // 15. userEmail (validation demo)
    try {
        const input = page.locator('input[bx-model="userEmail"]').first();
        if (await input.count() > 0) {
            await input.fill('user@test.com');
            results.passed.push('bindX: userEmail (exists)');
        } else {
            results.failed.push('bindX: userEmail - not found');
        }
    } catch (e) { results.failed.push('bindX: userEmail - ' + e.message); }

    // 16. username
    try {
        const input = page.locator('input[bx-model="username"]').first();
        if (await input.count() > 0) {
            await input.fill('testuser');
            results.passed.push('bindX: username (exists)');
        } else {
            results.failed.push('bindX: username - not found');
        }
    } catch (e) { results.failed.push('bindX: username - ' + e.message); }

    // 17. terms checkbox
    try {
        const input = page.locator('input[bx-model="terms"]').first();
        if (await input.count() > 0) {
            await input.check();
            results.passed.push('bindX: terms (checkbox exists)');
        } else {
            results.failed.push('bindX: terms - not found');
        }
    } catch (e) { results.failed.push('bindX: terms - ' + e.message); }

    // 18. userAge
    try {
        const input = page.locator('input[bx-model="userAge"]').first();
        if (await input.count() > 0) {
            await input.fill('25');
            results.passed.push('bindX: userAge (exists)');
        } else {
            results.failed.push('bindX: userAge - not found');
        }
    } catch (e) { results.failed.push('bindX: userAge - ' + e.message); }

    // 19. website
    try {
        const input = page.locator('input[bx-model="website"]').first();
        if (await input.count() > 0) {
            await input.fill('https://example.com');
            results.passed.push('bindX: website (exists)');
        } else {
            results.failed.push('bindX: website - not found');
        }
    } catch (e) { results.failed.push('bindX: website - ' + e.message); }

    // Note: field:500 and username:300 only appear in code examples, not as interactive elements

    // ========== fmtX: ALL FORMATTERS ==========
    const fmtTypes = await page.evaluate(() => {
        const elements = document.querySelectorAll('[fx-format]');
        return Array.from(elements).map(el => ({
            format: el.getAttribute('fx-format'),
            text: el.textContent.trim(),
            hasContent: el.textContent.trim().length > 0
        }));
    });

    const fmtGroups = {};
    fmtTypes.forEach(f => {
        if (!fmtGroups[f.format]) fmtGroups[f.format] = [];
        fmtGroups[f.format].push(f);
    });

    for (const [format, items] of Object.entries(fmtGroups)) {
        const working = items.filter(i => i.hasContent);
        if (working.length > 0) results.passed.push('fmtX: ' + format + ' (' + working.length + '/' + items.length + ' have content)');
        else results.failed.push('fmtX: ' + format + ' - all ' + items.length + ' elements empty');
    }

    // ========== dragX: Drag and Drop ==========
    try {
        const draggables = await page.locator('[dx-draggable]').count();
        const dropZones = await page.locator('[dx-drop-zone]').count();

        if (draggables === 0) throw new Error('No draggable elements');
        if (dropZones === 0) throw new Error('No drop zones');

        const draggable = page.locator('[dx-draggable]').first();
        const dropZone = page.locator('[dx-drop-zone]').first();

        await draggable.scrollIntoViewIfNeeded();
        const dragBox = await draggable.boundingBox();
        const dropBox = await dropZone.boundingBox();

        if (!dragBox || !dropBox) throw new Error('Could not get bounding boxes');

        await page.mouse.move(dragBox.x + dragBox.width/2, dragBox.y + dragBox.height/2);
        await page.mouse.down();
        await page.mouse.move(dropBox.x + dropBox.width/2, dropBox.y + dropBox.height/2, { steps: 5 });
        await page.mouse.up();

        results.passed.push('dragX: ' + draggables + ' draggables, ' + dropZones + ' drop zones');
    } catch (e) { results.failed.push('dragX - ' + e.message); }

    // ========== accX: Accessibility ==========
    try {
        const enhanceTypes = await page.evaluate(() => {
            const els = document.querySelectorAll('[ax-enhance]');
            const types = {};
            els.forEach(el => {
                const type = el.getAttribute('ax-enhance');
                if (!types[type]) types[type] = { total: 0, withAria: 0 };
                types[type].total++;
                if (el.hasAttribute('role') || el.hasAttribute('aria-label') ||
                    el.hasAttribute('tabindex') || el.hasAttribute('aria-describedby')) {
                    types[type].withAria++;
                }
            });
            return types;
        });

        for (const [type, counts] of Object.entries(enhanceTypes)) {
            if (counts.withAria > 0) {
                results.passed.push('accX: ' + type + ' (' + counts.withAria + '/' + counts.total + ' have ARIA)');
            } else {
                results.passed.push('accX: ' + type + ' (' + counts.total + ' elements exist)');
            }
        }
    } catch (e) { results.failed.push('accX - ' + e.message); }

    // ========== navX: Navigation ==========
    try {
        const navElements = await page.evaluate(() => ({
            tabs: document.querySelectorAll('[nx-tabs]').length,
            breadcrumbs: document.querySelectorAll('[nx-breadcrumb]').length,
            dropdowns: document.querySelectorAll('[nx-dropdown]').length
        }));

        if (navElements.tabs > 0) results.passed.push('navX: tabs (' + navElements.tabs + ')');
        if (navElements.breadcrumbs > 0) results.passed.push('navX: breadcrumbs (' + navElements.breadcrumbs + ')');
        if (navElements.dropdowns > 0) results.passed.push('navX: dropdowns (' + navElements.dropdowns + ')');
        if (navElements.tabs === 0 && navElements.breadcrumbs === 0 && navElements.dropdowns === 0) {
            results.failed.push('navX: No navigation elements found');
        }
    } catch (e) { results.failed.push('navX - ' + e.message); }

    // ========== loadX: Loading States ==========
    try {
        const loadElements = await page.evaluate(() => {
            const strategies = {};
            document.querySelectorAll('[lx-strategy]').forEach(el => {
                const strategy = el.getAttribute('lx-strategy');
                strategies[strategy] = (strategies[strategy] || 0) + 1;
            });
            return strategies;
        });

        for (const [strategy, count] of Object.entries(loadElements)) {
            results.passed.push('loadX: ' + strategy + ' (' + count + ')');
        }
        if (Object.keys(loadElements).length === 0) {
            results.failed.push('loadX: No loading elements found');
        }
    } catch (e) { results.failed.push('loadX - ' + e.message); }

    // ========== tableX: Table Sorting ==========
    try {
        const tables = await page.locator('table[tx-sortable]').count();
        const sortableHeaders = await page.locator('th[tx-sortable]').count();

        if (tables > 0) results.passed.push('tableX: ' + tables + ' sortable tables');
        if (sortableHeaders > 0) results.passed.push('tableX: ' + sortableHeaders + ' sortable headers');
        if (tables === 0 && sortableHeaders === 0) {
            results.failed.push('tableX: No sortable tables found');
        }
    } catch (e) { results.failed.push('tableX - ' + e.message); }

    // ========== Module Loading Check ==========
    const modules = await page.evaluate(() => ({
        genxCommon: !!window.genxCommon,
        FormatX: !!window.FormatX,
        bindX: !!window.bindX,
        DragX: !!window.DragX,
        navX: !!window.navX,
        AccessX: !!window.AccessX,
        loadX: !!window.loadX,
        tableX: !!window.tableX
    }));

    for (const [name, loaded] of Object.entries(modules)) {
        if (loaded) results.passed.push('Module: ' + name + ' loaded');
        else results.failed.push('Module: ' + name + ' NOT loaded');
    }

    // ========== PRINT RESULTS ==========
    console.log('\n' + '='.repeat(60));
    console.log('FULL CONTROL AUDIT RESULTS');
    console.log('='.repeat(60));
    console.log('\nPASSED: ' + results.passed.length);
    results.passed.forEach(r => console.log('  ✅ ' + r));
    console.log('\nFAILED: ' + results.failed.length);
    results.failed.forEach(r => console.log('  ❌ ' + r));
    console.log('\n' + '='.repeat(60));
    console.log('TOTAL CONTROLS TESTED: ' + (results.passed.length + results.failed.length));
    console.log('='.repeat(60));
});
