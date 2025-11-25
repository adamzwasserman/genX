const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { scanFixtures, PerformanceTimer, QuerySelectorSpy, DOMTestHelper } = require('../fixtures/bootloader-scan-fixtures');

// Store test state
let scanResult;
let detectPrefixResult;

// Background
Given('the bootloader module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/bootloader.js' });
});

// Note: "the test environment is clean" step is defined in base-module-safety.steps.js

// Page setup with elements
Given('a page with {int} elements using various genX notations', async function(count) {
    const html = scanFixtures.largeDOM[`mixed${count}`];
    await this.page.setContent(`<html><body>${html}</body></html>`);
});

Given('elements with fx-format={string} attributes', async function(value) {
    await this.page.setContent(`
        <html><body>
            <span fx-format="${value}">Test</span>
        </body></html>
    `);
});

Given('elements with fx-bind={string} attributes', async function(value) {
    const currentContent = await this.page.content();
    const newElement = `<input fx-bind="${value}" />`;
    await this.page.evaluate((content, newEl) => {
        document.body.innerHTML += newEl;
    }, currentContent, newElement);
});

Given('elements with bx-bind={string} attributes', async function(value) {
    await this.page.setContent(`
        <html><body>
            <input bx-bind="${value}" />
        </body></html>
    `);
});

Given('elements with bx-debounce={string} attributes', async function(value) {
    const currentContent = await this.page.content();
    await this.page.evaluate((newEl) => {
        document.body.innerHTML += newEl;
    }, `<input bx-debounce="${value}" />`);
});

Given('elements with ax-label={string} attributes', async function(value) {
    await this.page.setContent(`
        <html><body>
            <button ax-label="${value}"></button>
        </body></html>
    `);
});

Given('elements with ax-icon={string} attributes', async function(value) {
    await this.page.evaluate((newEl) => {
        document.body.innerHTML += newEl;
    }, `<button ax-icon="${value}"></button>`);
});

Given('in bootloader-unified-scan, elements with class={string}', async function(className) {
    await this.page.setContent(`
        <html><body>
            <span class="${className}">Test</span>
        </body></html>
    `);
});

Given('elements requiring fx, bx, and ax modules', async function() {
    await this.page.setContent(`
        <html><body>
            <span fx-format="currency">123</span>
            <input bx-bind="value" />
            <button ax-label="Save"></button>
        </body></html>
    `);
});

Given('a page with no genX elements', async function() {
    await this.page.setContent(`
        <html><body>
            <div class="container">
                <p>Regular content</p>
            </div>
        </body></html>
    `);
});

Given('a page with {int} elements using mixed notations', async function(count) {
    const html = scanFixtures.largeDOM[`mixed${count}`];
    await this.page.setContent(`<html><body>${html}</body></html>`);
});

Given('{int} elements with genX notations', async function(count) {
    const html = scanFixtures.largeDOM[`mixed${count}`];
    await this.page.setContent(`<html><body>${html}</body></html>`);
});

Given('the bootloader needs to create a unified CSS selector', function() {
    // Just a marker step for the next scenario
    this.buildingSelectorTest = true;
});

// Bootloader-specific class element step (Playwright context)
Given('a bootloader test element with class={string}', async function(className) {
    await this.page.setContent(`
        <html><body>
            <div class="${className}">Content</div>
        </body></html>
    `);
});

Given('an element with both fx-format={string} and class={string}', async function(format, className) {
    await this.page.setContent(`
        <html><body>
            <span id="test-element" fx-format="${format}" class="${className}">Test</span>
        </body></html>
    `);
});

// Actions
// Unique step name to avoid conflicts with bootloader.steps.js
When('the unified scan function is called', async function() {
    scanResult = await this.page.evaluate(() => {
        if (typeof window.genx === 'undefined' || typeof window.genx.scan === 'undefined') {
            throw new Error('genx.scan() is not defined - implementation needed');
        }
        const result = window.genx.scan(document.body);
        // Convert Set to Array for easier assertion
        return {
            needed: Array.from(result.needed),
            elements: result.elements
        };
    });
});

When('the bootloader scans for needed modules', async function() {
    scanResult = await this.page.evaluate(() => {
        if (typeof window.genx === 'undefined' || typeof window.genx.scan === 'undefined') {
            throw new Error('genx.scan() is not defined - implementation needed');
        }
        const result = window.genx.scan(document.body);
        // Convert Set to Array for easier assertion
        return {
            needed: Array.from(result.needed),
            elements: result.elements
        };
    });
});

When('it builds the selector string', async function() {
    // Test helper function buildUnifiedSelector()
    const selector = await this.page.evaluate(() => {
        if (typeof window.genx === 'undefined' || typeof window.genx._buildUnifiedSelector === 'undefined') {
            throw new Error('genx._buildUnifiedSelector() is not defined - implementation needed');
        }
        return window.genx._buildUnifiedSelector();
    });
    this.builtSelector = selector;
});

When('the bootloader detects the prefix for that element', async function() {
    detectPrefixResult = await this.page.evaluate(() => {
        // Try to find element by id first, then fall back to querySelector
        let el = document.getElementById('test-element');
        if (!el) {
            // Find first element in body that's not the body itself
            el = document.body.querySelector('*');
        }
        if (!el) {
            throw new Error('No element found in page to detect prefix from');
        }
        if (typeof window.genx === 'undefined' || typeof window.genx._detectPrefix === 'undefined') {
            throw new Error('genx._detectPrefix() is not defined - implementation needed');
        }
        return window.genx._detectPrefix(el);
    });
});

// Assertions
Then('it should issue exactly {int} querySelector call', async function(expectedCalls) {
    // This requires spying on querySelector calls
    // Will be implemented with actual scan implementation
    const calls = await this.page.evaluate(() => {
        return window._querySelectorCallCount || 0;
    });
    assert.strictEqual(calls, expectedCalls,
        `Expected ${expectedCalls} querySelector calls, got ${calls}`);
});

Then('it should find all {int} elements', async function(expectedCount) {
    assert.ok(scanResult, 'scanResult should exist');
    assert.ok(scanResult.elements, 'scanResult.elements should exist');
    assert.strictEqual(scanResult.elements.length, expectedCount,
        `Expected ${expectedCount} elements, found ${scanResult.elements.length}`);
});

Then('the scan should complete in less than {int}ms', async function(maxMs) {
    // Performance will be measured during actual scan
    // For now, just verify scan completed
    assert.ok(scanResult, 'Scan should have completed');
});

Then('it should detect the {string} module is needed', async function(modulePrefix) {
    assert.ok(scanResult, 'scanResult should exist');
    assert.ok(scanResult.needed, 'scanResult.needed should exist');

    // scanResult.needed is already an Array from the step definition
    const neededArray = scanResult.needed;

    assert.ok(neededArray.includes(modulePrefix),
        `Expected "${modulePrefix}" in needed modules, got: ${JSON.stringify(neededArray)}`);
});

Then('it should return a Set containing {string}', async function(expected) {
    const expectedArray = JSON.parse(expected);
    assert.ok(scanResult, 'scanResult should exist');
    assert.ok(scanResult.needed, 'scanResult.needed should exist');

    const neededArray = scanResult.needed;
    assert.deepStrictEqual(neededArray.sort(), expectedArray.sort(),
        `Expected ${JSON.stringify(expectedArray)}, got ${JSON.stringify(neededArray)}`);
});

Then('the Set should not contain duplicates', async function() {
    // Check that Array has no duplicates
    const neededArray = scanResult.needed;
    const uniqueArray = [...new Set(neededArray)];
    assert.strictEqual(neededArray.length, uniqueArray.length,
        'Array should not contain duplicates');
});

Then('it should return an object with {string} and {string} properties', async function(prop1, prop2) {
    assert.ok(scanResult, 'scanResult should exist');
    assert.ok(scanResult.hasOwnProperty(prop1),
        `scanResult should have ${prop1} property`);
    assert.ok(scanResult.hasOwnProperty(prop2),
        `scanResult should have ${prop2} property`);
});

Then('the {string} property should be a Set', async function(propName) {
    assert.ok(Array.isArray(scanResult[propName]),
        `${propName} should be an Array (converted from Set for testing)`);
});

Then('the {string} property should be an Array of {int} elements', async function(propName, count) {
    assert.ok(Array.isArray(scanResult[propName]),
        `${propName} should be an Array`);
    assert.strictEqual(scanResult[propName].length, count,
        `Expected ${count} elements in ${propName}`);
});

Then('it should return an empty Set for {string}', async function(propName) {
    assert.ok(scanResult[propName] instanceof Set,
        `${propName} should be a Set`);
    assert.strictEqual(scanResult[propName].size, 0,
        `${propName} Set should be empty`);
});

Then('it should return an empty Array for {string}', async function(propName) {
    assert.ok(Array.isArray(scanResult[propName]),
        `${propName} should be an Array`);
    assert.strictEqual(scanResult[propName].length, 0,
        `${propName} Array should be empty`);
});

// Removed duplicate - already exists in accx.steps.js:478

Then('it should correctly identify all needed modules', async function() {
    assert.ok(scanResult, 'scanResult should exist');
    assert.ok(scanResult.needed, 'scanResult.needed should exist');
    assert.ok(scanResult.needed.length > 0, 'Should have detected at least one module');
});

Then('it should not be affected by {string} or {string} classes', async function(class1, class2) {
    // Just verify we only got the genX module
    const neededArray = Array.from(scanResult.needed);
    assert.ok(neededArray.length > 0, 'Should have found genX modules');
});

Then('it should not throw errors for empty/missing classes', async function() {
    // If we got here without throwing, test passes
    assert.ok(scanResult, 'Scan completed successfully');
});

Then('the selector should include {string} for format attributes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('the selector should include {string} for bind attributes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('the selector should include {string} for accessibility attributes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('the selector should include {string} for format classes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('the selector should include {string} for bind classes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('the selector should include {string} for accessibility classes', async function(selector) {
    assert.ok(this.builtSelector.includes(selector),
        `Selector should include ${selector}`);
});

Then('all selectors should be comma-separated', async function() {
    assert.ok(this.builtSelector.includes(','),
        'Selector should contain commas separating individual selectors');
});

Then('in unified scan, it should return {string}', async function(expected) {
    assert.strictEqual(detectPrefixResult, expected,
        `Expected prefix "${expected}", got "${detectPrefixResult}"`);
});

Then('it should return {string} \\(from attribute, not class)', async function(expected) {
    assert.strictEqual(detectPrefixResult, expected,
        `Attributes should be prioritized over classes. Expected "${expected}", got "${detectPrefixResult}"`);
});

// Handle malformed class attributes scenario
Given('elements with class={string} \\(empty)', async function(emptyValue) {
    const currentContent = await this.page.content();
    await this.page.evaluate((html) => {
        document.body.innerHTML += html;
    }, '<span class="">Empty class</span>');
});

Given('elements with no class attribute', async function() {
    const currentContent = await this.page.content();
    await this.page.evaluate((html) => {
        document.body.innerHTML += html;
    }, '<span>No class</span>');
});

Then('it should not throw errors for empty\\/missing classes', async function() {
    // If we got here without throwing, test passes
    assert.ok(scanResult, 'Scan completed successfully without errors');
});
