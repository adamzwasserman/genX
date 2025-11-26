const { test, expect } = require('@playwright/test');

test('Test actual drag and drop', async ({ page }) => {
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Find draggable and drop zone
    const draggable = page.locator('[dx-draggable]').first();
    const dropZone = page.locator('[dx-drop-zone]').first();

    console.log('Draggable count:', await page.locator('[dx-draggable]').count());
    console.log('Drop zone count:', await page.locator('[dx-drop-zone]').count());

    // Get positions
    const dragBox = await draggable.boundingBox();
    const dropBox = await dropZone.boundingBox();
    console.log('Draggable box:', dragBox);
    console.log('Drop zone box:', dropBox);

    if (dragBox && dropBox) {
        // Scroll to element first
        await draggable.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);

        // Try drag
        await page.mouse.move(dragBox.x + dragBox.width/2, dragBox.y + dragBox.height/2);
        await page.mouse.down();
        await page.mouse.move(dropBox.x + dropBox.width/2, dropBox.y + dropBox.height/2, { steps: 10 });
        await page.mouse.up();
        
        console.log('Drag completed');
    }

    // Check DragX state
    const dragState = await page.evaluate(() => {
        return {
            DragXExists: !!window.DragX,
            state: window.DragX?.getState?.() || 'no getState',
            isDragging: window.DragX?.isDragging?.() || false
        };
    });
    console.log('DragX state:', dragState);
});

test('Test bindX in browser console', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check bindX initialization
    const bindXInfo = await page.evaluate(() => {
        const input = document.querySelector('input[bx-model="name"]');
        const output = document.querySelector('span[bx-bind="name"]');
        
        return {
            inputFound: !!input,
            outputFound: !!output,
            inputValue: input?.value,
            outputText: output?.textContent,
            bindXExists: !!window.bindX,
            bindXMethods: window.bindX ? Object.keys(window.bindX) : []
        };
    });
    console.log('Before typing:', bindXInfo);

    // Type in the input using Playwright
    const input = page.locator('input[bx-model="name"]').first();
    const output = page.locator('span[bx-bind="name"]').first();
    
    await input.click();
    await input.fill('HelloWorld');
    await page.waitForTimeout(300);

    const afterInfo = await page.evaluate(() => {
        const input = document.querySelector('input[bx-model="name"]');
        const output = document.querySelector('span[bx-bind="name"]');
        return {
            inputValue: input?.value,
            outputText: output?.textContent
        };
    });
    console.log('After typing:', afterInfo);

    // Check if output updated
    const outputText = await output.textContent();
    console.log('Playwright output text:', outputText);

    // Print any relevant console logs
    const bindLogs = logs.filter(l => l.toLowerCase().includes('bind') || l.includes('error'));
    if (bindLogs.length) console.log('Console logs:', bindLogs);
});
