/**
 * Step definitions for bindX One-Way Data Binding
 * Covers: bindx-one-way-binding.feature
 *
 * Markup and data go onto the bindX fixture page; the first check or change
 * renders (scan + observer), so bindings run as they would in an app.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { addMarkup, render, setData, nextFrames } = require('../support/bindx-fixture');

const setAllData = async (world, data) => {
    await addMarkup(world, '');
    await world.page.evaluate(d => {
        window._testData = d;
    }, data);
};

const text = async (world, selector) => {
    await render(world);
    await nextFrames(world);
    return world.page.evaluate(sel => document.querySelector(sel)?.textContent ?? null, selector);
};

// ============================================================================
// SETUP STEPS
// ============================================================================

Given('I have a span element with bx-bind={string}', async function(path) {
    await addMarkup(this, `<span id="test-span" bx-bind="${path}"></span>`);
});

Given('I have a span with bx-bind={string}', async function(path) {
    await addMarkup(this, `<span id="test-span" bx-bind="${path}"></span>`);
});

Given('I have a div with bx-bind={string}', async function(path) {
    await addMarkup(this, `<div id="test-div" bx-bind="${path}"></div>`);
});

Given('I have an input with bx-bind={string} readonly', async function(path) {
    await addMarkup(this, `<input id="test-input" bx-bind="${path}" readonly />`);
});

Given('I have {int} spans with bx-bind={string}', async function(count, path) {
    await addMarkup(this, `<span class="test-span" bx-bind="${path}"></span>`.repeat(count));
});

Given('reactive data \\{ user: \\{ name: {string} } }', async function(name) {
    await setAllData(this, { user: { name } });
});

Given('reactive data \\{ {word}: {int} }', async function(key, value) {
    await setAllData(this, { [key]: value });
});

Given('reactive data \\{ {word}: {string} }', async function(key, value) {
    await setAllData(this, { [key]: value });
});

Given('reactive data with nested properties', async function() {
    await setAllData(this, { user: { profile: { city: 'San Francisco' } } });
});

Given('data containing {string}', async function(content) {
    await setAllData(this, { malicious: content });
    await this.page.evaluate(() => {
        window._alertTriggered = false;
        window.alert = () => {
            window._alertTriggered = true;
        };
    });
});

Given('data \\{ {word}: {string} }', async function(key, value) {
    await setAllData(this, { [key]: value === '""' ? '' : value });
});

// Unquoted values only; quoted values go to 'data { {word}: {string} }'.
Given(/^data \{ (\w+): ([^"'\s]+) \}$/, async function(key, value) {
    const parsed = value === 'true' ? true : value === 'false' ? false : value;
    await setAllData(this, { [key]: parsed });
});

Given('data \\{ }', async function() {
    await setAllData(this, {});
});

// ============================================================================
// ACTION STEPS
// ============================================================================

// 'I set data.{word} = {float}' (bindx-computed-properties.steps.js) covers integers too.

When('I change data.{word} to {int}', async function(key, value) {
    await render(this);
    await setData(this, key, value);
});

When('I destroy the binding', async function() {
    await render(this);
    this.destroyedCount = await this.page.evaluate(() => {
        const element = document.getElementById('test-span');
        const mine = window.__bindings.filter(b => b.element === element);
        mine.forEach(b => b.destroy());
        return mine.length;
    });
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('the span should display {string}', async function(expected) {
    assert.strictEqual(await text(this, '#test-span'), expected);
});

Then('the span should update to {string}', async function(expected) {
    assert.strictEqual(await text(this, '#test-span'), expected);
});

Then('the div should display the nested value', async function() {
    assert.strictEqual(await text(this, '#test-div'), 'San Francisco', 'Div should display nested value');
});

// 'the input value should be {string}' lives in bindx-two-way-binding.steps.js.

Then('user typing should not update data', async function() {
    await render(this);
    await this.page.evaluate(() => {
        const input = document.getElementById('test-input');
        input.removeAttribute('readonly');
    });
    await this.page.locator('#test-input').fill('changed');
    await nextFrames(this);
    const dataValue = await this.page.evaluate(() => window._testData.username);
    assert.strictEqual(dataValue, 'admin');
});

Then('all {int} spans should update to {string}', async function(count, expected) {
    await render(this);
    await nextFrames(this);
    const texts = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('.test-span')).map(s => s.textContent));
    assert.deepStrictEqual(texts, Array(count).fill(expected));
});

Then('the script should be displayed as text', async function() {
    const shown = await text(this, '#test-span');
    assert.strictEqual(shown, "<script>alert('xss')</script>");
});

Then('not executed as HTML', async function() {
    const result = await this.page.evaluate(() => ({
        alert: window._alertTriggered,
        children: document.getElementById('test-span').children.length
    }));
    assert.deepStrictEqual(result, { alert: false, children: 0 });
});

Then('the binding should be removed from registry', async function() {
    assert.strictEqual(this.destroyedCount, 1, 'the span should have had one binding');
    const left = await this.page.evaluate(() =>
        window.__bxi.getBindingRegistry().getByElement(document.getElementById('test-span')).length);
    assert.strictEqual(left, 0);
});

Then('no one-way binding memory leaks should occur', async function() {
    await this.checkReleased();
});

Then('the span should display empty string', async function() {
    assert.strictEqual(await text(this, '#test-span'), '');
});

Then('not show {string} or {string}', async function(val1, val2) {
    const shown = await text(this, '#test-span');
    assert.ok(shown !== val1 && shown !== val2, `Should not show ${val1} or ${val2}`);
});

Then('not throw an error', async function() {
    assert.deepStrictEqual(this.pageErrors, []);
});
