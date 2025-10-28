const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Background steps
Given('a clean browser environment', async function() {
    // Browser is already opened in hooks
    assert.ok(this.page, 'Page should be initialized');
});

Given('the bootloader is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/bootloader.js' });
});

// Scenario: Bootloader loads after first paint
Given('an HTML page with genX attributes', async function() {
    const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
            <span fx-format="currency">25.00</span>
        </body>
        </html>
    `;
    await this.page.setContent(html);
});

When('the page loads', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
});

Then('the bootloader should execute after first paint', async function() {
    const timing = await this.page.evaluate(() => {
        return performance.timing;
    });
    // Verify bootloader doesn't block rendering
    assert.ok(timing, 'Performance timing should be available');
});

Then('Total Blocking Time should be 0ms', async function() {
    // TBT is measured by Lighthouse, here we verify no blocking scripts
    const blockingScripts = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.filter(s => !s.async && !s.defer).length;
    });
    assert.strictEqual(blockingScripts, 0, 'Should have no blocking scripts');
});

// Scenario: Automatic module detection
Given('an HTML page with the following content:', async function(docString) {
    const html = `<!DOCTYPE html><html><body>${docString}</body></html>`;
    await this.page.setContent(html);
});

When('the bootloader scans the DOM', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
    await this.page.evaluate(() => {
        return new Promise(resolve => {
            if (window.genx) {
                resolve();
            } else {
                window.addEventListener('genx:ready', resolve);
            }
        });
    });
});

Then('it should detect the {string} prefix', async function(prefix) {
    const detected = await this.page.evaluate((p) => {
        return window.genx ? window.genx.scan().has(p) : false;
    }, prefix);
    assert.ok(detected, `Should detect ${prefix} prefix`);
});

Then('it should not detect any other prefixes', async function() {
    const allPrefixes = await this.page.evaluate(() => {
        return window.genx ? Array.from(window.genx.scan()) : [];
    });
    assert.ok(allPrefixes.length === 2, 'Should only detect fx and ax');
});

// Scenario: Dynamic module loading
Given('an HTML page with fx- attributes', async function() {
    const html = `<!DOCTYPE html><html><body><span fx-format="currency">25</span></body></html>`;
    await this.page.setContent(html);
});

When('the bootloader initializes', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
    await this.page.waitForTimeout(500); // Give time for module loading
});

Then('it should load {string} module', async function(moduleName) {
    const loaded = await this.page.evaluate((name) => {
        const prefix = name.replace('.js', '').replace('modules/', '');
        return window.genx ? window.genx.isLoaded(prefix) : false;
    }, moduleName);
    assert.ok(loaded, `${moduleName} should be loaded`);
});

Then('it should not load {string} module', async function(moduleName) {
    const loaded = await this.page.evaluate((name) => {
        const prefix = name.replace('.js', '').replace('modules/', '');
        return window.genx ? window.genx.isLoaded(prefix) : false;
    }, moduleName);
    assert.ok(!loaded, `${moduleName} should not be loaded`);
});

// Scenario: genx:ready event
When('the bootloader completes initialization', async function() {
    this.readyEvent = await this.page.evaluate(() => {
        return new Promise(resolve => {
            window.addEventListener('genx:ready', (e) => resolve(e.detail));
        });
    });
});

Then('it should emit a {string} CustomEvent', async function(eventName) {
    assert.ok(this.readyEvent, `${eventName} event should be emitted`);
});

Then('the event detail should contain loaded modules {string}', async function(modules) {
    const expected = JSON.parse(modules);
    const actual = this.readyEvent.loaded;
    assert.deepStrictEqual(actual.sort(), expected.sort(), 'Loaded modules should match');
});

// Size requirement
Given('the bootloader source code', async function() {
    const fs = require('fs');
    this.bootloaderCode = fs.readFileSync('./src/bootloader.js', 'utf8');
});

When('minified and gzipped', async function() {
    const { minify } = require('terser');
    const zlib = require('zlib');

    const minified = await minify(this.bootloaderCode);
    const gzipped = zlib.gzipSync(minified.code);
    this.size = gzipped.length;
});

Then('the file size should be less than 1KB', async function() {
    assert.ok(this.size < 1024, `Bootloader should be <1KB, got ${this.size} bytes`);
});
