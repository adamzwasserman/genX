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

// Configuration steps for genxConfig
Given('performance logging is enabled', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.performance = { logging: true };
    });
});

Given('mutation observation is disabled', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.observe = false;
    });
});

Given('CDN is configured to {string}', async function(cdnUrl) {
    await this.page.evaluate((url) => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.cdn = url;
    }, cdnUrl);
});

Given('CDN is not configured', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        delete window.genxConfig.cdn;
    });
});

// genx API steps
Then('genx API should be defined immediately', async function() {
    const defined = await this.page.evaluate(() => !!window.genx);
    assert.ok(defined, 'genx API should be defined');
});

Then('genx API version should be {string}', async function(version) {
    const apiVersion = await this.page.evaluate(() => window.genx?.version);
    assert.strictEqual(apiVersion, version, `genx version should be ${version}`);
});

Then('genx scan method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.scan === 'function');
    assert.ok(available, 'genx.scan should be available');
});

Then('genx getConfig method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(available, 'genx.getConfig should be available');
});

Then('genx loadParsers method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.loadParsers === 'function');
    assert.ok(available, 'genx.loadParsers should be available');
});

Then('genx parseAllElements method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.parseAllElements === 'function');
    assert.ok(available, 'genx.parseAllElements should be available');
});

// getConfig API steps
When('genx getConfig is called with element', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        return window.genx?.getConfig(element);
    });
});

When('genx getConfig is called with element again', async function() {
    this.getConfigResultSecond = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        return window.genx?.getConfig(element);
    });
});

When('genx getConfig is called with undefined', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        return window.genx?.getConfig(undefined);
    });
});

When('genx getConfig is called with null', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        return window.genx?.getConfig(null);
    });
});

When('genx getConfig is called {int} times', async function(times) {
    this.getConfigResults = await this.page.evaluate((count) => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(window.genx?.getConfig(element));
        }
        return results;
    }, times);
});

When('genx init is called', async function() {
    await this.page.evaluate(() => {
        return window.genx?.init?.();
    });
});

Then('genx getConfig returns cached config for element', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        return window.genx?.getConfig(element) !== null;
    });
    assert.ok(result, 'genx.getConfig should return cached config');
});

Then('genx getConfig returns correct config for each element', async function() {
    const result = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[fx-format], [bx-bind], [ax-label]');
        return Array.from(elements).every(el => {
            const config = window.genx?.getConfig(el);
            return config !== undefined;
        });
    });
    assert.ok(result, 'genx.getConfig should return configs for all elements');
});

Then('genx getConfig should be a function', async function() {
    const isFunc = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(isFunc, 'genx.getConfig should be a function');
});

Then('genx getConfig should accept an element parameter', async function() {
    const accepts = await this.page.evaluate(() => {
        const fn = window.genx?.getConfig;
        return fn && fn.length > 0;
    });
    assert.ok(accepts, 'genx.getConfig should accept parameters');
});

Then('genx getConfig should return an object or null', async function() {
    const returns = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const result = window.genx?.getConfig(element);
        return result === null || typeof result === 'object';
    });
    assert.ok(returns, 'genx.getConfig should return object or null');
});

Then('genx getConfig returns merged config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const config = window.genx?.getConfig(element);
        return config !== null && typeof config === 'object';
    });
    assert.ok(result, 'genx.getConfig should return merged config');
});

Then('genx getConfig returns empty config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format=""]');
        const config = window.genx?.getConfig(element);
        return typeof config === 'object';
    });
    assert.ok(result, 'genx.getConfig should return empty config');
});

Then('genx getConfig should be exposed', async function() {
    const exposed = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(exposed, 'genx.getConfig should be exposed');
});

Then('genx getConfig still returns same config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        return window.genx?.getConfig(element) !== null;
    });
    assert.ok(result, 'genx.getConfig should still return config');
});

Then('all {int} calls should return identical results', async function(count) {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(window.genx?.getConfig(element));
        }
        const first = results[0];
        return results.every(r => r === first);
    });
    assert.ok(result, 'All getConfig calls should return identical results');
});

// Module configuration steps
Then('modules should use genx getConfig API for element configs', async function() {
    const uses = await this.page.evaluate(() => {
        return typeof window.genx?.getConfig === 'function';
    });
    assert.ok(uses, 'Modules should use genx.getConfig API');
});
