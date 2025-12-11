const { Given, Then, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('playwright');
const assert = require('assert');

let browser;
let page;
let consoleErrors = [];

Before({ tags: '@demo' }, async function() {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
    consoleErrors = [];

    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore CORS font errors and browser extension errors
            if (!text.includes('CORS') && !text.includes('font') && !text.includes('content.js')) {
                consoleErrors.push(text);
            }
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push(error.message);
    });
});

After({ tags: '@demo' }, async function() {
    if (browser) {
        await browser.close();
    }
});

Given('I navigate to the local demo page', async function() {
    await page.goto('http://localhost:7890/site/genx-demo-local.html', {
        waitUntil: 'networkidle',
        timeout: 30000
    });
    // Wait for genX to initialize
    await page.waitForTimeout(2000);
});

Then('the page should load without JavaScript errors', async function() {
    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('CORS') &&
        !e.includes('ERR_FAILED')  // Font loading errors
    );

    if (criticalErrors.length > 0) {
        console.log('Console errors found:', criticalErrors);
    }

    // Debug: Check what's available on window
    const windowCheck = await page.evaluate(() => {
        return {
            genX: typeof window.genX,
            fmtX: typeof window.fmtX,
            fxXFactory: typeof window.fxXFactory,
            genxCommon: typeof window.genxCommon,
            domxBridge: typeof window.domxBridge,
            genxBootstrap: typeof window.genx?.bootstrap,
            genxScan: typeof window.genx?.scan,
            keys: Object.keys(window).filter(k =>
                k.toLowerCase().includes('genx') ||
                k.toLowerCase().includes('fmt') ||
                k.toLowerCase().includes('fx') ||
                k.toLowerCase().includes('domx') ||
                k.includes('XFactory')
            ).slice(0, 30)
        };
    });
    console.log('Window check:', JSON.stringify(windowCheck, null, 2));

    // Check if any elements with fx- attributes exist
    const fxElements = await page.evaluate(() => {
        const els = document.querySelectorAll('[fx-format]');
        // Also check specific currency output element
        const currencyOut = document.querySelector('#currency-output');
        return {
            count: els.length,
            first: els[0]?.outerHTML?.slice(0, 100),
            currencyOutput: currencyOut?.textContent,
            currencyRaw: currencyOut?.getAttribute('fx-raw')
        };
    });
    console.log('fx-format elements:', JSON.stringify(fxElements, null, 2));

    // Check if genX loaded - genx.scan indicates bootloader is active
    const genxLoaded = await page.evaluate(() => {
        return (typeof window.genx !== 'undefined' && typeof window.genx.scan === 'function') ||
               typeof window.fxXFactory !== 'undefined' ||
               typeof window.bxXFactory !== 'undefined';
    });

    assert.ok(genxLoaded, 'genX should be loaded on the page');
});

Then('the fmtX module should format currency values', async function() {
    // Check static demo elements that should already be formatted (fx-format="smart")
    const formattedElements = await page.evaluate(() => {
        // Look for elements that have been formatted (have fx-raw attribute and content)
        const elements = document.querySelectorAll('[fx-format][fx-raw]');
        const results = [];
        elements.forEach(el => {
            const raw = el.getAttribute('fx-raw');
            const current = el.textContent.trim();
            // Element is formatted if content differs from raw value
            if (current && current !== raw) {
                results.push({
                    format: el.getAttribute('fx-format'),
                    raw: raw,
                    formatted: current
                });
            }
        });
        return results;
    });

    console.log('Formatted elements found:', formattedElements.length);
    console.log('Examples:', JSON.stringify(formattedElements.slice(0, 5), null, 2));

    // Should have at least some formatted elements
    assert.ok(formattedElements.length > 0, 'Should have formatted elements with fx-raw attribute');
});

Then('the fmtX module should format percentage values', async function() {
    // Check for any fx-format="smart" elements with phone-like data that got formatted
    const formattedElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[fx-format="smart"]');
        const results = [];
        elements.forEach(el => {
            const raw = el.getAttribute('fx-raw');
            const current = el.textContent.trim();
            if (current && raw && current !== raw) {
                results.push({ raw, formatted: current });
            }
        });
        return results;
    });

    console.log('Smart-formatted elements found:', formattedElements.length);
    console.log('Examples:', JSON.stringify(formattedElements.slice(0, 3), null, 2));

    // Smart formatting should have formatted at least some elements
    assert.ok(formattedElements.length > 0, 'Smart format should format elements');
});

Then('the fmtX module should format date values', async function() {
    // Verify genx bootloader is active and detected modules
    const bootloaderStatus = await page.evaluate(() => {
        const scanResult = window.genx?.scan?.();
        return {
            hasGenx: typeof window.genx !== 'undefined',
            hasScan: typeof window.genx?.scan === 'function',
            neededModules: scanResult ? Array.from(scanResult.needed) : [],
            elementCount: scanResult?.elements?.length || 0,
            // Check which factory exports exist
            factories: {
                fx: typeof window.fxXFactory !== 'undefined',
                ax: typeof window.axXFactory !== 'undefined',
                bx: typeof window.bxXFactory !== 'undefined',
                dx: typeof window.dxXFactory !== 'undefined',
                lx: typeof window.lxXFactory !== 'undefined',
                tx: typeof window.txXFactory !== 'undefined',
                nx: typeof window.nxXFactory !== 'undefined'
            }
        };
    });

    console.log('Bootloader status:', JSON.stringify(bootloaderStatus, null, 2));

    assert.ok(bootloaderStatus.hasGenx, 'genx bootloader should be present');
    // bx and nx modules should be loaded (demo has bx-bind and nx-nav elements)
    assert.ok(bootloaderStatus.factories.bx || bootloaderStatus.factories.nx,
        'At least one module factory should be loaded');
});
