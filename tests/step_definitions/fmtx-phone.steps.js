const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const phoneFixtures = require('../fixtures/phone-fixtures');

// Support for multiple phone formats on same page
Given('elements with different phone formats:', async function(docString) {
    await this.page.setContent(`
        <html>
        <head></head>
        <body>
            ${docString}
        </body>
        </html>
    `);
    await this.page.addScriptTag({ path: './src/fmtx.js' });
});

// Support for checking specific elements by ID
Then('element {string} should display {string}', async function(selector, expected) {
    const actual = await this.page.locator(selector).textContent();
    assert.strictEqual(actual, expected, `Element ${selector}: Expected "${expected}", got "${actual}"`);
});

// Support for performance testing with specific phone format
Given('{int} elements with fx-format={string} fx-phone-format={string}', async function(count, format, phoneFormat) {
    const elements = Array(count).fill(0).map((_, i) => {
        const phoneNum = phoneFixtures.rawUS.basic; // Use a consistent test number
        return `<span fx-format="${format}" fx-phone-format="${phoneFormat}" fx-raw="${phoneNum}">${phoneNum}</span>`;
    }).join('');

    await this.page.setContent(`<html><body>${elements}</body></html>`);
    await this.page.addScriptTag({ path: './src/fmtx.js' });
});

// Enhanced step for verifying phone formatting with better error messages
Then('the phone should be formatted as {string}', async function(expected) {
    const actual = await this.page.locator('#test').textContent();
    const rawValue = await this.page.locator('#test').getAttribute('fx-raw');
    const phoneFormat = await this.page.locator('#test').getAttribute('fx-phone-format');

    assert.strictEqual(
        actual,
        expected,
        `Phone formatting failed:
         Raw value: ${rawValue}
         Format: ${phoneFormat}
         Expected: "${expected}"
         Actual: "${actual}"`
    );
});

// Test batch processing of phones from fixtures
When('phone numbers from test matrix are processed', async function() {
    const results = [];

    for (const scenario of phoneFixtures.testMatrix) {
        for (const [format, expected] of Object.entries(scenario.formats)) {
            await this.page.setContent(`
                <span id="test" fx-format="phone" fx-phone-format="${format}" fx-raw="${scenario.input}">${scenario.input}</span>
            `);
            await this.page.addScriptTag({ path: './src/fmtx.js' });
            await this.page.evaluate(() => {
                const el = document.getElementById('test');
                if (window.FormatX) {
                    window.FormatX.formatElement(el);
                }
            });

            const actual = await this.page.locator('#test').textContent();
            results.push({
                input: scenario.input,
                format: format,
                expected: expected,
                actual: actual,
                passed: actual === expected
            });
        }
    }

    this.phoneTestResults = results;
});

Then('all test matrix scenarios should pass', async function() {
    const failures = this.phoneTestResults.filter(r => !r.passed);

    if (failures.length > 0) {
        const failureReport = failures.map(f =>
            `Input: "${f.input}" | Format: ${f.format} | Expected: "${f.expected}" | Got: "${f.actual}"`
        ).join('\n');

        assert.fail(`${failures.length} phone formatting tests failed:\n${failureReport}`);
    }
});

// Verify specific formatting rules
Then('the country code should be stripped for US format', async function() {
    const actual = await this.page.locator('#test').textContent();
    const hasCountryCode = actual.startsWith('+1') || actual.startsWith('1-');
    assert.ok(!hasCountryCode, `Country code should be stripped for US format, got: "${actual}"`);
});

Then('the country code should be preserved for international format', async function() {
    const actual = await this.page.locator('#test').textContent();
    const hasCountryCode = actual.startsWith('+');
    assert.ok(hasCountryCode, `Country code should be preserved for international format, got: "${actual}"`);
});

// Test EU number detection
Then('the number should be recognized as EU format', async function() {
    const actual = await this.page.locator('#test').textContent();
    const isEUFormat = actual.startsWith('+') && !actual.startsWith('+1 ');
    assert.ok(isEUFormat, `Number should be recognized as EU format, got: "${actual}"`);
});

// Test space normalization
Then('extra spaces should be normalized', async function() {
    const actual = await this.page.locator('#test').textContent();
    const hasDoubleSpaces = actual.includes('  ');
    const hasLeadingSpace = actual.startsWith(' ');
    const hasTrailingSpace = actual.endsWith(' ');

    assert.ok(!hasDoubleSpaces, `Should not have double spaces: "${actual}"`);
    assert.ok(!hasLeadingSpace, `Should not have leading space: "${actual}"`);
    assert.ok(!hasTrailingSpace, `Should not have trailing space: "${actual}"`);
});

// Test 00 to + conversion
Then('the 00 prefix should be converted to +', async function() {
    const actual = await this.page.locator('#test').textContent();
    const has00Prefix = actual.startsWith('00');
    const hasPlusPrefix = actual.startsWith('+');

    assert.ok(!has00Prefix, `Should not have 00 prefix: "${actual}"`);
    assert.ok(hasPlusPrefix, `Should have + prefix: "${actual}"`);
});

// Helper function to create phone element with all attributes
Given('a phone element with input {string} and format {string}', async function(input, format) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="phone" fx-phone-format="${format}" fx-raw="${input}">${input}</span>
        </body></html>
    `);
    await this.page.addScriptTag({ path: './src/fmtx.js' });
});

// Verify formatting matches expected pattern
Then('the output should match pattern {string}', async function(pattern) {
    const actual = await this.page.locator('#test').textContent();
    const regex = new RegExp(pattern);
    assert.ok(regex.test(actual), `Output "${actual}" should match pattern "${pattern}"`);
});

// Common phone number patterns for validation
const phonePatterns = {
    'us': /^\(\d{3}\) \d{3}-\d{4}$/,
    'us-dash': /^\d{3}-\d{3}-\d{4}$/,
    'us-dot': /^\d{3}\.\d{3}\.\d{4}$/,
    'intl-us': /^\+1 \d{3} \d{3} \d{4}$/,
    'intl-eu': /^\+\d{1,3}(\s\d+)+$/,
};

Then('the phone format should be valid {string}', async function(formatType) {
    const actual = await this.page.locator('#test').textContent();
    const pattern = phonePatterns[formatType];

    if (!pattern) {
        throw new Error(`Unknown format type: ${formatType}`);
    }

    assert.ok(
        pattern.test(actual),
        `Phone "${actual}" should match ${formatType} pattern ${pattern}`
    );
});

module.exports = {
    phoneFixtures,
    phonePatterns
};