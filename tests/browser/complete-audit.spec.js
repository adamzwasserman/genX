const { test } = require('@playwright/test');

test('COMPLETE AUDIT - ALL CONTROLS', async ({ page }) => {
    const working = [];
    const broken = [];

    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // ============ bx-if (ALL USAGES) ============

    // bx-if="showDetails" - simple boolean
    try {
        const checkbox = page.locator('input[bx-model="showDetails"]').first();
        const conditional = page.locator('[bx-if="showDetails"]').first();

        const beforeVisible = await conditional.isVisible();
        if (beforeVisible) {
            broken.push('bx-if="showDetails": VISIBLE BEFORE CHECK (should be hidden)');
        } else {
            await checkbox.check();
            await page.waitForTimeout(200);
            const afterVisible = await conditional.isVisible();
            if (afterVisible) working.push('bx-if="showDetails"');
            else broken.push('bx-if="showDetails": NOT VISIBLE AFTER CHECK');
        }
    } catch (e) { broken.push(`bx-if="showDetails": ${e.message}`); }

    // bx-if with expression (Live Validation)
    try {
        const emailInput = page.locator('input[bx-model="email"]').first();
        const errorSpan = page.locator('[bx-if*="email"][bx-if*="includes"]').first();

        if (await errorSpan.count() === 0) {
            broken.push('bx-if expression (email validation): ELEMENT NOT FOUND');
        } else {
            // Type invalid email
            await emailInput.fill('invalidemail');
            await page.waitForTimeout(200);
            const isVisible = await errorSpan.isVisible();
            if (isVisible) working.push('bx-if expression (email validation)');
            else broken.push('bx-if expression (email validation): ERROR NOT SHOWN');
        }
    } catch (e) { broken.push(`bx-if expression: ${e.message}`); }

    // ============ formState bindings ============
    try {
        const formStateBindings = [
            { bind: 'formState.pristine', expected: 'true' },
            { bind: 'formState.dirty', expected: 'false' },
            { bind: 'formState.valid', expected: 'false' },
            { bind: 'formState.invalid', expected: 'true' }
        ];

        for (const fs of formStateBindings) {
            const el = page.locator(`[bx-bind="${fs.bind}"]`).first();
            if (await el.count() === 0) {
                broken.push(`bx-bind="${fs.bind}": NOT FOUND`);
            } else {
                const text = await el.textContent();
                if (text === fs.expected) {
                    working.push(`bx-bind="${fs.bind}"`);
                } else {
                    broken.push(`bx-bind="${fs.bind}": expected "${fs.expected}", got "${text}"`);
                }
            }
        }
    } catch (e) { broken.push(`formState bindings: ${e.message}`); }

    // ============ bx-validate (form validation) ============
    try {
        const form = page.locator('form[bx-form]').first();
        if (await form.count() === 0) {
            broken.push('bx-form: FORM NOT FOUND');
        } else {
            // Try to submit with invalid data
            const submitBtn = form.locator('button[type="submit"]');
            if (await submitBtn.count() > 0) {
                await submitBtn.click();
                await page.waitForTimeout(300);

                // Check if error messages appear
                const errorMessages = await form.locator('.bx-error-message').allTextContents();
                const hasErrors = errorMessages.some(msg => msg.trim().length > 0);
                if (hasErrors) working.push('bx-validate (form validation errors shown)');
                else broken.push('bx-validate: NO ERROR MESSAGES SHOWN');
            } else {
                broken.push('bx-form: NO SUBMIT BUTTON');
            }
        }
    } catch (e) { broken.push(`bx-form validation: ${e.message}`); }

    // ============ fx-format (check each individually) ============
    const fmtTests = [
        { format: 'smart', selector: '[fx-format="smart"]' },
        { format: 'currency', selector: '[fx-format="currency"]' },
        { format: 'date', selector: '[fx-format="date"]' },
        { format: 'relative', selector: '[fx-format="relative"]' },
        { format: 'filesize', selector: '[fx-format="filesize"]' },
        { format: 'number', selector: '[fx-format="number"]' },
        { format: 'compact', selector: '[fx-format="compact"]' },
        { format: 'phone', selector: '[fx-format="phone"]' },
        { format: 'time', selector: '[fx-format="time"]' },
        { format: 'duration', selector: '[fx-format="duration"]' },
        { format: 'percent', selector: '[fx-format="percent"]' }
    ];

    for (const fmt of fmtTests) {
        try {
            const elements = page.locator(fmt.selector);
            const count = await elements.count();
            if (count === 0) continue; // Skip if not in demo

            let workingCount = 0;
            let emptyCount = 0;

            for (let i = 0; i < count; i++) {
                const el = elements.nth(i);
                // Skip elements inside <pre> tags
                const inPre = await el.evaluate(e => !!e.closest('pre'));
                if (inPre) continue;

                const text = await el.textContent();
                if (text && text.trim().length > 0) workingCount++;
                else emptyCount++;
            }

            if (emptyCount === 0 && workingCount > 0) {
                working.push(`fx-format="${fmt.format}" (${workingCount} ok)`);
            } else if (workingCount === 0 && emptyCount > 0) {
                broken.push(`fx-format="${fmt.format}": ALL ${emptyCount} EMPTY`);
            } else if (emptyCount > 0) {
                broken.push(`fx-format="${fmt.format}": ${emptyCount}/${workingCount + emptyCount} EMPTY`);
            }
        } catch (e) { broken.push(`fx-format="${fmt.format}": ${e.message}`); }
    }

    // ============ ax-enhance (check each type) ============
    const axTypes = ['button', 'label', 'input', 'skiplink', 'landmark', 'live', 'focus', 'error', 'tooltip', 'dialog', 'status'];

    for (const type of axTypes) {
        try {
            const elements = page.locator(`[ax-enhance="${type}"]`);
            const count = await elements.count();
            if (count === 0) continue;

            let enhanced = 0;
            for (let i = 0; i < count; i++) {
                const el = elements.nth(i);
                const hasAria = await el.evaluate(e =>
                    e.hasAttribute('role') ||
                    e.hasAttribute('aria-label') ||
                    e.hasAttribute('aria-describedby') ||
                    e.hasAttribute('tabindex')
                );
                if (hasAria) enhanced++;
            }

            if (enhanced === count) {
                working.push(`ax-enhance="${type}" (${count} with ARIA)`);
            } else if (enhanced === 0) {
                broken.push(`ax-enhance="${type}": ALL ${count} MISSING ARIA`);
            } else {
                broken.push(`ax-enhance="${type}": ${count - enhanced}/${count} MISSING ARIA`);
            }
        } catch (e) { broken.push(`ax-enhance="${type}": ${e.message}`); }
    }

    // ============ PRINT RESULTS ============
    console.log('\n' + '='.repeat(70));
    console.log('COMPLETE CONTROL AUDIT');
    console.log('='.repeat(70));

    console.log('\n❌ BROKEN: ' + broken.length);
    broken.forEach((b, i) => console.log(`   ${i+1}. ${b}`));

    console.log('\n✅ WORKING: ' + working.length);
    working.forEach(w => console.log('   ' + w));

    console.log('\n' + '='.repeat(70));
});
