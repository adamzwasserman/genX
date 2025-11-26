const { test } = require('@playwright/test');
test('check fmtx source', async ({ page }) => {
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    
    const result = await page.evaluate(() => {
        // Get the format function source
        if (!window.FormatX) return 'NO FORMATX';
        const src = window.FormatX.format.toString();
        
        return {
            hasTimeOnlyFix: src.includes('1970-01-01T'),
            hasRelative: src.includes('relative'),
            excerpt: src.substring(0, 500)
        };
    });
    console.log('Source check:', JSON.stringify(result, null, 2));
});
