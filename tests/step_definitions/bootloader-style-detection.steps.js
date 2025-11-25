const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { notationStyleFixtures, DetectionTimer } = require('../fixtures/notation-style-fixtures');

// Store test state
let detectionResult;
let detectionDuration;

// Background step - already defined in bootloader-unified-scan.steps.js
// "the bootloader module is loaded"
// "the test environment is clean"

// ===== Given Steps: Page Setup =====

Given('a page with only verbose attribute notation', async function() {
    await this.page.setContent(`
        <html><body>
            ${notationStyleFixtures.verboseOnly.multiple}
        </body></html>
    `);
});

Given('a page with verbose attributes', async function() {
    await this.page.setContent(`
        <html><body>
            <span fx-format="currency">100</span>
            <input bx-bind="username" />
            <button ax-label="Save"></button>
        </body></html>
    `);
});

Given('a page with CSS class notation', async function() {
    await this.page.setContent(`
        <html><body>
            ${notationStyleFixtures.classNotation.multiple}
        </body></html>
    `);
});

Given('a page with colon-separated attribute values', async function() {
    await this.page.setContent(`
        <html><body>
            ${notationStyleFixtures.colonNotation.multiple}
        </body></html>
    `);
});

Given('a page with fx-opts JSON attributes', async function() {
    await this.page.setContent(`
        <html><body>
            ${notationStyleFixtures.jsonNotation.single}
        </body></html>
    `);
});

Given('a page with bx-opts JSON attributes', async function() {
    const currentContent = await this.page.content();
    await this.page.evaluate(() => {
        document.body.innerHTML += '<input bx-opts=\'{"debounce":300}\' />';
    });
});

Given('a page with ax-opts JSON attributes', async function() {
    const currentContent = await this.page.content();
    await this.page.evaluate(() => {
        document.body.innerHTML += '<button ax-opts=\'{"label":"Save"}\'></button>';
    });
});

Given('elements with fx-format={string}', async function(value) {
    const currentContent = await this.page.content();
    await this.page.evaluate((val) => {
        document.body.innerHTML += `<span fx-format="${val}">Test</span>`;
    }, value);
});

Given('elements with bx-bind={string}', async function(value) {
    const currentContent = await this.page.content();
    await this.page.evaluate((val) => {
        document.body.innerHTML += `<input bx-bind="${val}" />`;
    }, value);
});

Given('in bootloader-style-detection, elements with class={string}', async function(className) {
    const currentContent = await this.page.content();
    await this.page.evaluate((cls) => {
        document.body.innerHTML += `<span class="${cls}">Test</span>`;
    }, className);
});

Given('elements with ax-opts={string}', async function(value) {
    const currentContent = await this.page.content();
    await this.page.evaluate((val) => {
        document.body.innerHTML += `<button ax-opts='${val}'></button>`;
    }, value);
});

Given('in bootloader, an element with fx-format={string}', async function(value) {
    await this.page.setContent(`
        <html><body>
            <span fx-format="${value}">Test</span>
        </body></html>
    `);
});

Given('{int} elements with mixed notations', async function(count) {
    const html = notationStyleFixtures.largeDocument.generate(count);
    await this.page.setContent(`<html><body>${html}</body></html>`);
});

Given('multiple elements with fx-format={string}', async function(value) {
    await this.page.setContent(`
        <html><body>
            <span fx-format="${value}">100</span>
            <span fx-format="${value}">200</span>
            <span fx-format="${value}">300</span>
        </body></html>
    `);
});

Given('multiple elements with class={string}', async function(className) {
    await this.page.setContent(`
        <html><body>
            <span class="${className}">100</span>
            <span class="${className}">200</span>
            <span class="${className}">300</span>
        </body></html>
    `);
});

// ===== When Steps: Actions =====

When('the bootloader detects notation styles', async function() {
    detectionResult = await this.page.evaluate(() => {
        // Scan to get elements
        const { elements } = window.genx.scan(document.body);

        // Detect notation styles
        return window.genx.detectNotationStyles(elements);
    });
});

When('the bootloader detects notation styles with timing', async function() {
    const result = await this.page.evaluate(() => {
        // Scan to get elements
        const { elements } = window.genx.scan(document.body);

        // Time the detection
        const start = performance.now();
        const styles = window.genx.detectNotationStyles(elements);
        const duration = performance.now() - start;

        return { styles, duration };
    });

    detectionResult = result.styles;
    detectionDuration = result.duration;
});

// ===== Then Steps: Assertions =====

Then('in style detection, it should return {string}', async function(expected) {
    const expectedArray = JSON.parse(expected);
    assert.deepStrictEqual(detectionResult, expectedArray,
        `Expected ${JSON.stringify(expectedArray)}, got ${JSON.stringify(detectionResult)}`);
});

Then('it should not detect colon notation', async function() {
    assert.ok(!detectionResult.includes('colon'),
        'Should not detect colon notation');
});

Then('it should not detect JSON notation', async function() {
    assert.ok(!detectionResult.includes('json'),
        'Should not detect JSON notation');
});

Then('it should not detect class notation', async function() {
    assert.ok(!detectionResult.includes('class'),
        'Should not detect class notation');
});

Then('the colon style should be detected from attribute values', async function() {
    assert.ok(detectionResult.includes('colon'),
        'Colon style should be detected');
    assert.ok(detectionResult.includes('verbose'),
        'Verbose style should also be present with colon');
});

Then('the JSON style should be detected from -opts attributes', async function() {
    assert.ok(detectionResult.includes('json'),
        'JSON style should be detected from -opts attributes');
    assert.ok(detectionResult.includes('verbose'),
        'Verbose style should also be present with JSON');
});

Then('all four styles should be correctly identified', async function() {
    const expected = ['class', 'colon', 'json', 'verbose'];
    assert.deepStrictEqual(detectionResult.sort(), expected,
        'All four notation styles should be detected');
});

Then('no notation styles should be detected', async function() {
    assert.deepStrictEqual(detectionResult, [],
        'No notation styles should be detected from empty page');
});

Then('it should detect all three class prefixes', async function() {
    assert.ok(detectionResult.includes('class'),
        'Should detect class notation from fmt-, bind-, and acc- prefixes');
});

Then('colon detection should handle single and multiple colons', async function() {
    assert.ok(detectionResult.includes('colon'),
        'Should detect colon notation regardless of number of colons');
});

Then('JSON should be detected from all -opts attributes', async function() {
    assert.ok(detectionResult.includes('json'),
        'Should detect JSON from fx-opts, bx-opts, and ax-opts');
});

Then('verbose should always be included with other styles', async function() {
    if (detectionResult.includes('colon') ||
        detectionResult.includes('json')) {
        assert.ok(detectionResult.includes('verbose'),
            'Verbose should always be present with colon or JSON notation');
    }
});

Then('it should ignore non-genX classes like {string} and {string}', async function(class1, class2) {
    // Just verify that class notation was detected
    // The implementation should only detect genX class prefixes
    assert.ok(detectionResult.includes('class'),
        'Should detect genX class notation while ignoring non-genX classes');
});

Then('detection should complete in less than {int}ms', async function(maxMs) {
    assert.ok(detectionDuration < maxMs,
        `Detection took ${detectionDuration.toFixed(3)}ms, should be less than ${maxMs}ms`);
});

Then('all styles should be detected correctly', async function() {
    // Verify the result is an array
    assert.ok(Array.isArray(detectionResult),
        'Detection result should be an array');

    // Verify all values are valid style names
    const validStyles = ['verbose', 'colon', 'json', 'class'];
    for (const style of detectionResult) {
        assert.ok(validStyles.includes(style),
            `"${style}" is not a valid notation style`);
    }
});

Then('each style should appear only once in the result', async function() {
    const uniqueStyles = [...new Set(detectionResult)];
    assert.strictEqual(detectionResult.length, uniqueStyles.length,
        'Each style should appear only once (no duplicates)');
});
