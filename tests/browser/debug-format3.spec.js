const { test } = require('@playwright/test');
test('trace format time', async ({ page }) => {
    await page.goto('file:///Users/adam/dev/genX/examples/genx-demo.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
        // Check if our fix is in the code
        const str = '14:30:00';
        const regex = /^\d{1,2}:\d{2}(:\d{2})?$/;
        const matches = str.match(regex);
        
        // Try creating date
        const testDate = new Date(`1970-01-01T${str}`);
        const isValidDate = !isNaN(testDate.getTime());
        
        // Check time formatting
        const formatted = isValidDate 
            ? testDate.toLocaleTimeString('en-US', {hour:'numeric',minute:'numeric'})
            : 'FAILED';
        
        return {
            matches: !!matches,
            isValidDate,
            formatted,
            testDateStr: testDate.toString()
        };
    });
    console.log('Format trace:', JSON.stringify(result, null, 2));
});
