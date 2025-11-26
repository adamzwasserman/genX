const { test, expect } = require('@playwright/test');

test('Test textarea and radio bindings', async ({ page }) => {
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check what textarea and radio elements exist
    const elements = await page.evaluate(() => {
        const textareas = document.querySelectorAll('textarea[bx-model]');
        const radios = document.querySelectorAll('input[type="radio"][bx-model]');
        
        return {
            textareaCount: textareas.length,
            textareaModels: Array.from(textareas).map(t => t.getAttribute('bx-model')),
            radioCount: radios.length,
            radioModels: Array.from(radios).map(r => ({
                model: r.getAttribute('bx-model'),
                value: r.value
            }))
        };
    });
    console.log('Elements found:', JSON.stringify(elements, null, 2));

    // Test textarea binding
    if (elements.textareaCount > 0) {
        const textareaModel = elements.textareaModels[0];
        const textarea = page.locator(`textarea[bx-model="${textareaModel}"]`).first();
        const textareaOutput = page.locator(`span[bx-bind="${textareaModel}"]`).first();
        
        const outputExists = await textareaOutput.count() > 0;
        console.log(`Textarea model: ${textareaModel}, output exists: ${outputExists}`);
        
        if (outputExists) {
            await textarea.fill('Textarea test content');
            await page.waitForTimeout(200);
            const outputText = await textareaOutput.textContent();
            console.log(`Textarea output: "${outputText}"`);
            if (outputText === 'Textarea test content') {
                console.log('✅ Textarea binding WORKS');
            } else {
                console.log('❌ Textarea binding BROKEN');
            }
        } else {
            console.log('⚠️ No bx-bind output for textarea');
        }
    }

    // Test radio binding
    if (elements.radioCount > 0) {
        const radioModel = elements.radioModels[0].model;
        const radioValue = elements.radioModels[0].value;
        const radio = page.locator(`input[type="radio"][bx-model="${radioModel}"][value="${radioValue}"]`).first();
        const radioOutput = page.locator(`span[bx-bind="${radioModel}"]`).first();
        
        const outputExists = await radioOutput.count() > 0;
        console.log(`Radio model: ${radioModel}, value: ${radioValue}, output exists: ${outputExists}`);
        
        if (outputExists) {
            await radio.scrollIntoViewIfNeeded();
            await radio.check({ force: true });
            await page.waitForTimeout(200);
            const outputText = await radioOutput.textContent();
            console.log(`Radio output: "${outputText}"`);
            if (outputText === radioValue) {
                console.log('✅ Radio binding WORKS');
            } else {
                console.log(`❌ Radio binding BROKEN (expected "${radioValue}", got "${outputText}")`);
            }
        } else {
            console.log('⚠️ No bx-bind output for radio');
        }
    }
});
