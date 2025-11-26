const { test } = require('@playwright/test');
test('debug format call', async ({ page }) => {
    page.on('console', msg => console.log('PAGE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
        // Try calling format directly
        if (!window.FormatX) return { error: 'FormatX not loaded' };
        
        try {
            const result = window.FormatX.format('time', '14:30:00', { timeFormat: 'short' });
            return { formatResult: result };
        } catch (e) {
            return { error: e.message, stack: e.stack };
        }
    });
    console.log('Format call result:', JSON.stringify(result, null, 2));
});
