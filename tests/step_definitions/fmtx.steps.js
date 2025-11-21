const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Background
Given('the fmtX module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/fmtx.js' });
});

// Currency Formatting
Given('an element with attributes:', async function(dataTable) {
    const attrs = {};
    dataTable.rows().forEach(([key, value]) => {
        attrs[key] = value;
    });

    const attrString = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');

    await this.page.setContent(`
        <html><body>
            <span id="test" ${attrString}>${attrs['fx-raw'] || ''}</span>
        </body></html>
    `);
});

When('the element is processed', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test');
        if (window.FormatX) {
            window.FormatX.formatElement(el);
        }
    });
});

Then('the element should display {string}', async function(expected) {
    const actual = await this.page.locator('#test').textContent();
    assert.strictEqual(actual, expected, `Expected "${expected}", got "${actual}"`);
});

// Different locales
Given('an element with fx-format={string} fx-currency={string} fx-locale={string}', async function(format, currency, locale) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-currency="${currency}" fx-locale="${locale}">1234.56</span>
        </body></html>
    `);
});

Given('the fx-raw value is {string}', async function(value) {
    await this.page.evaluate((v) => {
        const el = document.getElementById('test');
        el.setAttribute('fx-raw', v);
    }, value);
});

// Scenario Outline support
Given('an element with fx-format={string} fx-currency={string}', async function(format, currency) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-currency="${currency}" fx-raw="99.99">99.99</span>
        </body></html>
    `);
});

Given('an element with fx-format={string} fx-date-format={string}', async function(format, dateFormat) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-date-format="${dateFormat}" fx-raw="2024-03-15">2024-03-15</span>
        </body></html>
    `);
});

Given('an element with fx-format={string}', async function(format) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}">placeholder</span>
        </body></html>
    `);
});

// Phone formatting
Given('an element with fx-format={string} fx-phone-format={string}', async function(format, phoneFormat) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-phone-format="${phoneFormat}">5551234567</span>
        </body></html>
    `);
});

// Text truncation
Given('an element with fx-format={string} fx-length={string}', async function(format, length) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-length="${length}" fx-raw="This is a very long text">This is a very long text</span>
        </body></html>
    `);
});

// Duration formatting
Given('an element with fx-format={string} fx-duration-format={string}', async function(format, durationFormat) {
    await this.page.setContent(`
        <html><body>
            <span id="test" fx-format="${format}" fx-duration-format="${durationFormat}">93784</span>
        </body></html>
    `);
});

// Dynamic content
Given('the fmtX module is initialized', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/fmtx.js' });
    await this.page.waitForTimeout(100);
});

When('a new element is added to the DOM:', async function(docString) {
    await this.page.evaluate((html) => {
        document.body.insertAdjacentHTML('beforeend', html);
    }, docString);
    await this.page.waitForTimeout(200); // Wait for MutationObserver
});

Then('the element should automatically be formatted', async function() {
    const isFormatted = await this.page.evaluate(() => {
        const span = document.querySelector('span[fx-format]');
        return span && span.textContent !== span.getAttribute('fx-raw');
    });
    assert.ok(isFormatted, 'Element should be automatically formatted');
});

// Error handling
Then('the element should display the original value {string}', async function(expected) {
    const actual = await this.page.locator('#test').textContent();
    assert.strictEqual(actual, expected);
});

Then('no error should be thrown', async function() {
    const errors = await this.page.evaluate(() => {
        return window.__errors || [];
    });
    assert.strictEqual(errors.length, 0, 'No errors should be thrown');
});

// Missing fx-raw
Given('the element content is {string}', async function(content) {
    await this.page.evaluate((c) => {
        document.getElementById('test').textContent = c;
    }, content);
});

Then('it should use the text content as the raw value', async function() {
    const rawAttr = await this.page.evaluate(() => {
        return document.getElementById('test').getAttribute('fx-raw');
    });
    assert.ok(rawAttr, 'fx-raw attribute should be set from content');
});

// Performance
Given('{int} elements with fx-format={string}', async function(count, format) {
    const elements = Array(count).fill(0).map((_, i) =>
        `<span fx-format="${format}" fx-raw="99.99">99.99</span>`
    ).join('');

    await this.page.setContent(`<html><body>${elements}</body></html>`);
    await this.page.addScriptTag({ path: './src/fmtx.js' });
});

When('all elements are processed', async function() {
    this.startTime = Date.now();
    await this.page.evaluate(() => {
        if (window.FormatX && window.FormatX.scan) {
            window.FormatX.scan();
        }
    });
    this.duration = Date.now() - this.startTime;
    // Also set operationTime for common step compatibility
    this.operationTime = this.duration;
});

// Unformat
Given('the element has been formatted to {string}', async function(formatted) {
    const actual = await this.page.locator('#test').textContent();
    assert.strictEqual(actual, formatted);
});

When('FormatX.unformatElement\\(\\) is called', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test');
        window.FormatX.unformatElement(el);
    });
});

Then('the fx-raw attribute should be preserved', async function() {
    const rawAttr = await this.page.evaluate(() => {
        return document.getElementById('test').getAttribute('fx-raw');
    });
    assert.ok(rawAttr, 'fx-raw should be preserved');
});
