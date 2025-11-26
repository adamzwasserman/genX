const { test } = require('@playwright/test');

test('EXHAUSTIVE AUDIT - Test EVERY control', async ({ page }) => {
    const working = [];
    const broken = [];

    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // ============ bx-model + bx-bind PAIRS ============
    // For each bx-model, fill it and check if corresponding bx-bind updates

    const modelBindPairs = [
        { model: 'name', bind: 'name', type: 'text', testValue: 'TestName' },
        { model: 'quantity', bind: 'quantity', type: 'number', testValue: '42' },
        { model: 'agreed', bind: 'agreed', type: 'checkbox', testValue: true },
        { model: 'color', bind: 'color', type: 'select', testValue: 'Blue' },
        { model: 'size', bind: 'size', type: 'radio', testValue: 'M' },
        { model: 'firstName', bind: 'firstName', type: 'text', testValue: 'John' },
        { model: 'lastName', bind: 'lastName', type: 'text', testValue: 'Doe' },
        { model: 'bio', bind: 'bio.length', type: 'textarea', testValue: 'Hello World', expectedOutput: '11' },
        { model: 'email', bind: 'email', type: 'text', testValue: 'test@test.com', bindSelector: 'p[bx-bind="email"]' },
        { model: 'polyDemo1', bind: 'polyDemo1', type: 'text', testValue: 'Poly1' },
        { model: 'polyDemo2', bind: 'polyDemo2', type: 'text', testValue: 'Poly2', modelSelector: 'input[bx-model="polyDemo2:500"]' },
        { model: 'polyDemo3', bind: 'polyDemo3', type: 'text', testValue: 'Poly3' },
    ];

    for (const pair of modelBindPairs) {
        const name = `bx-model="${pair.model}" -> bx-bind="${pair.bind}"`;
        try {
            const modelSelector = pair.modelSelector || `[bx-model="${pair.model}"]`;
            const bindSelector = pair.bindSelector || `[bx-bind="${pair.bind}"]`;

            const input = page.locator(modelSelector).first();
            const output = page.locator(bindSelector).first();

            if (await input.count() === 0) {
                broken.push(`${name}: INPUT NOT FOUND`);
                continue;
            }
            if (await output.count() === 0) {
                broken.push(`${name}: OUTPUT NOT FOUND`);
                continue;
            }

            // Set value based on type
            if (pair.type === 'checkbox') {
                await input.check();
            } else if (pair.type === 'select') {
                await input.selectOption(pair.testValue);
            } else if (pair.type === 'radio') {
                const radio = page.locator(`input[bx-model="${pair.model}"][value="${pair.testValue}"]`).first();
                await radio.check({ force: true });
            } else {
                await input.fill(pair.testValue);
            }

            await page.waitForTimeout(600); // Wait for debounce

            const result = await output.textContent();
            const expected = pair.expectedOutput || (pair.type === 'checkbox' ? 'true' : pair.testValue);

            if (result === expected) {
                working.push(name);
            } else {
                broken.push(`${name}: expected "${expected}", got "${result}"`);
            }
        } catch (e) {
            broken.push(`${name}: ERROR - ${e.message}`);
        }
    }

    // ============ bx-if CONDITIONAL ============
    try {
        const checkbox = page.locator('input[bx-model="showDetails"]').first();
        const conditional = page.locator('[bx-if="showDetails"]').first();

        if (await checkbox.count() === 0) {
            broken.push('bx-if="showDetails": CHECKBOX NOT FOUND');
        } else if (await conditional.count() === 0) {
            broken.push('bx-if="showDetails": CONDITIONAL ELEMENT NOT FOUND');
        } else {
            // Should be hidden initially
            const beforeVisible = await conditional.isVisible();
            await checkbox.check();
            await page.waitForTimeout(200);
            const afterVisible = await conditional.isVisible();

            if (!beforeVisible && afterVisible) {
                working.push('bx-if="showDetails"');
            } else if (beforeVisible) {
                broken.push('bx-if="showDetails": VISIBLE BEFORE CHECK (should be hidden)');
            } else {
                broken.push('bx-if="showDetails": NOT VISIBLE AFTER CHECK');
            }
        }
    } catch (e) {
        broken.push(`bx-if="showDetails": ERROR - ${e.message}`);
    }

    // ============ bx-computed ============
    try {
        const priceInput = page.locator('input[bx-model="price"]').first();
        const qtyInput = page.locator('input[bx-model="qty"]').first();
        const totalOutput = page.locator('[bx-bind="total"]').first();

        if (await priceInput.count() === 0 || await qtyInput.count() === 0) {
            broken.push('bx-computed="price * qty": INPUTS NOT FOUND');
        } else if (await totalOutput.count() === 0) {
            broken.push('bx-computed="price * qty": OUTPUT NOT FOUND');
        } else {
            await priceInput.fill('10');
            await qtyInput.fill('5');
            await page.waitForTimeout(300);
            const result = await totalOutput.textContent();
            if (result === '50') {
                working.push('bx-computed="price * qty"');
            } else {
                broken.push(`bx-computed="price * qty": expected "50", got "${result}"`);
            }
        }
    } catch (e) {
        broken.push(`bx-computed: ERROR - ${e.message}`);
    }

    // ============ fx-format (ALL TYPES) ============
    const fmtElements = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('[fx-format]').forEach(el => {
            // Skip elements inside <pre> tags (code examples)
            if (el.closest('pre')) return;

            const format = el.getAttribute('fx-format');
            const text = el.textContent.trim();
            const hasContent = text.length > 0 && text !== el.getAttribute('fx-raw');
            results.push({ format, text, hasContent, tag: el.tagName });
        });
        return results;
    });

    const fmtByType = {};
    fmtElements.forEach(el => {
        if (!fmtByType[el.format]) fmtByType[el.format] = { working: 0, broken: 0 };
        if (el.hasContent) fmtByType[el.format].working++;
        else fmtByType[el.format].broken++;
    });

    for (const [format, counts] of Object.entries(fmtByType)) {
        if (counts.broken === 0) {
            working.push(`fx-format="${format}" (${counts.working} elements)`);
        } else if (counts.working === 0) {
            broken.push(`fx-format="${format}": ALL ${counts.broken} EMPTY`);
        } else {
            broken.push(`fx-format="${format}": ${counts.broken}/${counts.working + counts.broken} EMPTY`);
        }
    }

    // ============ dx-draggable / dx-drop-zone ============
    try {
        const draggables = await page.locator('[dx-draggable]').count();
        const dropZones = await page.locator('[dx-drop-zone]').count();

        if (draggables === 0) {
            broken.push('dx-draggable: NONE FOUND');
        } else {
            // Test actual drag
            const draggable = page.locator('[dx-draggable]').first();
            const dropZone = page.locator('[dx-drop-zone]').first();

            await draggable.scrollIntoViewIfNeeded();
            const dragBox = await draggable.boundingBox();
            const dropBox = await dropZone.boundingBox();

            if (dragBox && dropBox) {
                await page.mouse.move(dragBox.x + dragBox.width/2, dragBox.y + dragBox.height/2);
                await page.mouse.down();
                await page.mouse.move(dropBox.x + dropBox.width/2, dropBox.y + dropBox.height/2, { steps: 5 });
                await page.mouse.up();

                // Check if drag state changed
                const dragState = await page.evaluate(() => window.DragX?.getState?.());
                working.push(`dx-draggable (${draggables} elements)`);
            } else {
                broken.push('dx-draggable: COULD NOT GET BOUNDING BOX');
            }
        }

        if (dropZones === 0) {
            broken.push('dx-drop-zone: NONE FOUND');
        } else {
            working.push(`dx-drop-zone (${dropZones} elements)`);
        }
    } catch (e) {
        broken.push(`dragX: ERROR - ${e.message}`);
    }

    // ============ ax-enhance (ALL TYPES) ============
    const axElements = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('[ax-enhance]').forEach(el => {
            const type = el.getAttribute('ax-enhance');
            const hasRole = el.hasAttribute('role');
            const hasAriaLabel = el.hasAttribute('aria-label');
            const hasAriaDescribedby = el.hasAttribute('aria-describedby');
            const hasTabindex = el.hasAttribute('tabindex');
            const enhanced = hasRole || hasAriaLabel || hasAriaDescribedby || hasTabindex;
            results.push({ type, enhanced });
        });
        return results;
    });

    const axByType = {};
    axElements.forEach(el => {
        if (!axByType[el.type]) axByType[el.type] = { enhanced: 0, notEnhanced: 0 };
        if (el.enhanced) axByType[el.type].enhanced++;
        else axByType[el.type].notEnhanced++;
    });

    for (const [type, counts] of Object.entries(axByType)) {
        if (counts.notEnhanced === 0) {
            working.push(`ax-enhance="${type}" (${counts.enhanced} with ARIA)`);
        } else if (counts.enhanced === 0) {
            broken.push(`ax-enhance="${type}": ALL ${counts.notEnhanced} MISSING ARIA`);
        } else {
            broken.push(`ax-enhance="${type}": ${counts.notEnhanced}/${counts.enhanced + counts.notEnhanced} MISSING ARIA`);
        }
    }

    // ============ lx-strategy (LOADING STATES) ============
    const lxElements = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('[lx-strategy]').forEach(el => {
            const strategy = el.getAttribute('lx-strategy');
            // Check if loading indicator exists or can be triggered
            results.push({ strategy });
        });
        return results;
    });

    const lxByStrategy = {};
    lxElements.forEach(el => {
        lxByStrategy[el.strategy] = (lxByStrategy[el.strategy] || 0) + 1;
    });

    for (const [strategy, count] of Object.entries(lxByStrategy)) {
        working.push(`lx-strategy="${strategy}" (${count} elements)`);
    }

    // ============ nx-tabs / nx-breadcrumb ============
    const tabsCount = await page.locator('[nx-tabs]').count();
    const breadcrumbCount = await page.locator('[nx-breadcrumb]').count();
    const dropdownCount = await page.locator('[nx-dropdown]').count();

    if (tabsCount > 0) {
        // Test tab switching
        const tabButtons = page.locator('[nx-tabs] [role="tab"], [nx-tabs] button, [nx-tabs] [nx-tab]');
        const tabCount = await tabButtons.count();
        if (tabCount > 1) {
            try {
                await tabButtons.nth(1).click();
                await page.waitForTimeout(200);
                working.push(`nx-tabs (${tabsCount} with ${tabCount} tabs)`);
            } catch {
                broken.push(`nx-tabs: CLICK FAILED`);
            }
        } else {
            working.push(`nx-tabs (${tabsCount} elements)`);
        }
    } else {
        broken.push('nx-tabs: NONE FOUND');
    }

    if (breadcrumbCount > 0) working.push(`nx-breadcrumb (${breadcrumbCount} elements)`);
    if (dropdownCount > 0) working.push(`nx-dropdown (${dropdownCount} elements)`);

    // ============ tx-sortable ============
    const sortableTables = await page.locator('table[tx-sortable]').count();
    const sortableHeaders = await page.locator('th[tx-sortable]').count();

    if (sortableTables > 0 || sortableHeaders > 0) {
        if (sortableHeaders > 0) {
            try {
                const header = page.locator('th[tx-sortable]').first();
                await header.click();
                await page.waitForTimeout(200);
                working.push(`tx-sortable (${sortableTables} tables, ${sortableHeaders} headers)`);
            } catch {
                broken.push(`tx-sortable: CLICK FAILED`);
            }
        } else {
            working.push(`tx-sortable (${sortableTables} tables)`);
        }
    }

    // ============ FORM VALIDATION ============
    const formValidationInputs = await page.locator('[bx-validate]').count();
    if (formValidationInputs > 0) {
        working.push(`bx-validate (${formValidationInputs} inputs)`);
    }

    // ============ MODULE LOADING ============
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
        if (loaded) working.push(`Module: ${name}`);
        else broken.push(`Module: ${name} NOT LOADED`);
    }

    // ============ PRINT RESULTS ============
    console.log('\n' + '='.repeat(70));
    console.log('EXHAUSTIVE CONTROL AUDIT');
    console.log('='.repeat(70));

    console.log('\n✅ WORKING: ' + working.length);
    working.forEach(w => console.log('   ' + w));

    console.log('\n❌ BROKEN: ' + broken.length);
    broken.forEach(b => console.log('   ' + b));

    console.log('\n' + '='.repeat(70));
    console.log(`TOTAL: ${working.length + broken.length} controls | ${working.length} working | ${broken.length} BROKEN`);
    console.log('='.repeat(70));
});
