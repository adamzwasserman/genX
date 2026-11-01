/**
 * Step definitions for bindx.feature (and steps other bindX features share).
 *
 * Every scenario runs on the bindX fixture page (tests/support/bindx-fixture.js):
 * markup goes into #app, data into window._testData, and the first step that
 * needs live bindings renders the page with bindX.reactive(), bindX.scan() and
 * bindX.init({observe: true}). Changes after render go through the reactive
 * proxy, the way an application changes its data.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { defineElement } = require('../support/element-fixtures');
const { expect } = require('@playwright/test');
const {
    mountBindx, loadFmtx, addMarkup, render, parseValue, setData, getData, nextFrames
} = require('../support/bindx-fixture');

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Retry an assertion until it passes or the timeout ends. */
async function eventually(check, timeout = 1000) {
    const end = Date.now() + timeout;
    for (;;) {
        try {
            return await check();
        } catch (error) {
            if (Date.now() > end) throw error;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    }
}

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the bindX module is loaded', async function() {
    await mountBindx(this);
});

// ============================================================================
// REACTIVE DATA SETUP
// ============================================================================

// the reactive data object has user.name="John" / the reactive data has price=25.00
Given(/^the reactive data (?:object )?has ([\w$.]+)=("[^"]*"|true|false|null|-?\d+(?:\.\d+)?)$/,
    async function(path, raw) {
        await setData(this, path, parseValue(raw));
    });

Given('the reactive data has {word}={string} and {word}={string}', async function(key1, val1, key2, val2) {
    await setData(this, key1, val1);
    await setData(this, key2, val2);
});

Given('the reactive data has {word}={int} and {word}={int}', async function(key1, val1, key2, val2) {
    await setData(this, key1, val1);
    await setData(this, key2, val2);
});

Given('the reactive data does not have this path', async function() {
    await mountBindx(this);
    await this.page.evaluate(() => {
        window._testData = {};
    });
});

// the data object user.name changes to "Jane" / ... changes to false / ... to 30.00
When(/^the data object ([\w$.]+) changes to (.+)$/, async function(path, raw) {
    await render(this);
    await setData(this, path, parseValue(raw));
});

// the data object user.name should be "Jane" / the data object user.subscribe should be true
Then(/^the data object ([\w$.]+) should be (.+)$/, async function(path, raw) {
    const expected = parseValue(raw);
    await eventually(async () => expect(await getData(this, path)).toBe(expected));
});

// ============================================================================
// TWO-WAY BINDING (bx-model)
// ============================================================================

Given('an input with bx-model={string}', async function(model) {
    await addMarkup(this, `<input id="test-input" bx-model="${escapeAttr(model)}">`, '#test-input');
});

defineElement('an element with bx-model={string}', async function(model) {
    await addMarkup(this, `<input id="test-input" bx-model="${escapeAttr(model)}">`, '#test-input');
});

Given('a checkbox with bx-model={string}', async function(model) {
    await addMarkup(this, `<input id="test-checkbox" type="checkbox" bx-model="${escapeAttr(model)}">`,
        '#test-checkbox');
});

Given('a textarea with bx-model={string}', async function(model) {
    await addMarkup(this, `<textarea id="test-textarea" bx-model="${escapeAttr(model)}"></textarea>`,
        '#test-textarea');
});

// The options arrive in the next step, so hold the select until then.
Given('a select element with bx-model={string}', async function(model) {
    await mountBindx(this);
    this.bx.selectModel = model;
});

Given('options for {string}, {string}, {string}', async function(a, b, c) {
    const options = [a, b, c].map(v => `<option value="${escapeAttr(v)}">${v}</option>`).join('');
    await addMarkup(this,
        `<select id="test-select" bx-model="${escapeAttr(this.bx.selectModel)}">${options}</select>`,
        '#test-select');
});

Given('radio buttons with bx-model={string} and values {string}, {string}, {string}',
    async function(model, a, b, c) {
        const radios = [a, b, c].map(v =>
            `<label><input type="radio" name="radio-group" value="${escapeAttr(v)}" bx-model="${escapeAttr(model)}">${v}</label>`
        ).join('');
        await addMarkup(this, `<div id="test-radios">${radios}</div>`);
    });

When('the user types {string} into the input', async function(text) {
    await render(this);
    this.bx.typed = text;
    await this.element.fill(text);
});

When('the user types {string} into the textarea', async function(text) {
    await render(this);
    this.bx.typed = text;
    await this.element.fill(text);
});

When('the user checks the checkbox', async function() {
    await render(this);
    await this.element.check();
});

// Shared with tablex.feature, which picks a page size from its own select.
When('the user selects {string}', async function(value) {
    if (this.bx && this.bx.mounted) {
        await render(this);
    }
    await this.element.selectOption(value);
});

When('the user selects the {string} radio button', async function(value) {
    await render(this);
    await this.page.check(`#test-radios input[value="${value}"]`);
});

Then('the input should display {string}', async function(expected) {
    expect(await this.element.inputValue()).toBe(expected);
});

Then('the textarea should display {string}', async function(expected) {
    expect(await this.element.inputValue()).toBe(expected);
});

Then('the dropdown should display {string}', async function(expected) {
    expect(await this.element.inputValue()).toBe(expected);
});

Then('the checkbox should be unchecked', async function() {
    expect(await this.element.isChecked()).toBe(false);
});

Then('the {string} radio button should be selected', async function(value) {
    expect(await this.page.isChecked(`#test-radios input[value="${value}"]`)).toBe(true);
});

// ============================================================================
// ONE-WAY BINDING (bx-bind)
// ============================================================================

defineElement('an element with bx-bind:text={string}', async function(binding) {
    await addMarkup(this, `<span id="test-element" bx-bind:text="${escapeAttr(binding)}"></span>`, '#test-element');
});

Given('an img with bx-bind:src={string}', async function(binding) {
    await addMarkup(this, `<img id="test-img" alt="" bx-bind:src="${escapeAttr(binding)}">`, '#test-img');
});

defineElement('an element with bx-bind:class={string}', async function(binding) {
    await addMarkup(this, `<div id="test-element" bx-bind:class="${escapeAttr(binding)}"></div>`, '#test-element');
});

defineElement('an element with bx-bind:style.color={string}', async function(binding) {
    await addMarkup(this, `<div id="test-element" bx-bind:style.color="${escapeAttr(binding)}"></div>`,
        '#test-element');
});

Then('the element should automatically update to {string}', async function(expected) {
    await eventually(async () => expect(await this.element.textContent()).toBe(expected));
});

Then('the element should display empty string', async function() {
    expect(await this.element.textContent()).toBe('');
});

Then('the img src should be {string}', async function(expected) {
    expect(await this.element.getAttribute('src')).toBe(expected);
});

Then('the img src should automatically update to {string}', async function(expected) {
    await eventually(async () => expect(await this.element.getAttribute('src')).toBe(expected));
});

Then('the element style color should be {string}', async function(expected) {
    expect(await this.element.evaluate(el => el.style.color)).toBe(expected);
});

Then('the element style color should automatically update to {string}', async function(expected) {
    await eventually(async () => expect(await this.element.evaluate(el => el.style.color)).toBe(expected));
});

// ============================================================================
// FORMATTERS AND fmtX
// ============================================================================

Given('an element with bx-bind:text={string} and bx-format={string}', async function(binding, format) {
    await loadFmtx(this);
    await addMarkup(this,
        `<span id="test-element" bx-bind:text="${escapeAttr(binding)}" bx-format="${escapeAttr(format)}"></span>`,
        '#test-element');
});

Given('an element with bx-bind:text={string} and fx-format={string}', async function(binding, format) {
    await loadFmtx(this);
    await addMarkup(this,
        `<span id="test-element" bx-bind:text="${escapeAttr(binding)}" fx-format="${escapeAttr(format)}"></span>`,
        '#test-element');
});

// ============================================================================
// DEBOUNCE
// ============================================================================

Given('an input with bx-model={string} and bx-debounce={string}', async function(model, debounce) {
    await addMarkup(this,
        `<input id="test-input" bx-model="${escapeAttr(model)}" bx-debounce="${escapeAttr(debounce)}">`,
        '#test-input');
});

When('the user types {string} quickly', async function(text) {
    await render(this);
    this.bx.typed = text;
    this.bx.typedPath = await this.element.getAttribute('bx-model');
    await this.element.pressSequentially(text);
});

// ============================================================================
// VALIDATION & ERROR HANDLING
// ============================================================================

Given('an element with invalid bx-model={string}', async function(model) {
    await addMarkup(this, `<input id="test-input" bx-model="${escapeAttr(model)}">`, '#test-input');
});

Then('the binding should not be created', async function() {
    const count = await this.page.evaluate(() => window.__bindings.length);
    expect(count).toBe(0);
    // Typing into the element must not create data anywhere.
    await this.element.fill('typed');
    await nextFrames(this);
    expect(await this.page.evaluate(() => JSON.stringify(window._testData))).toBe('{}');
});

Given('bindx\\(\\) is called with a non-object', async function() {
    const thrown = await this.page.evaluate(() => {
        try {
            window.bindX.bindx('not an object');
            return null;
        } catch (e) {
            return { name: e.constructor.name, message: e.message };
        }
    });
    expect(thrown).not.toBeNull();
    // Rebuild the page's error in Node so the shared "a TypeError should be thrown" step can check its class.
    const ErrorClass = typeof globalThis[thrown.name] === 'function' ? globalThis[thrown.name] : Error;
    this.error = new ErrorClass(thrown.message);
});

// ============================================================================
// EVENTS
// ============================================================================

Then('the event detail should contain the new value', async function() {
    const detail = await this.page.evaluate(() => window._testEventDetail);
    expect(detail).toBeTruthy();
    expect(detail.value).toBe(this.bx.typed);
    expect(detail.field).toBe(await this.element.getAttribute('bx-model'));
});

// ============================================================================
// MUTATION OBSERVER
// ============================================================================

Given('the bindX module is initialized with observe=true', async function() {
    await render(this);
});

When('a new element with bx-model={string} is added', async function(model) {
    await addMarkup(this, `<input id="dynamic-input" bx-model="${escapeAttr(model)}">`, '#dynamic-input');
    this.bx.dynamicPath = model;
    await nextFrames(this);
});

Then('the binding should be automatically created', async function() {
    // The observer binds new elements after a short throttle; once it has,
    // typing reaches the data.
    await eventually(async () => {
        await this.element.fill(`typed ${Date.now()}`);
        const typed = await this.element.inputValue();
        expect(await getData(this, this.bx.dynamicPath)).toBe(typed);
    });
});

Then('the element should be reactive', async function() {
    await setData(this, this.bx.dynamicPath, 'from data');
    await eventually(async () => expect(await this.element.inputValue()).toBe('from data'));
});

// ============================================================================
// CLEANUP & MEMORY
// ============================================================================

Given('the binding is active', async function() {
    await render(this);
    const path = await this.element.getAttribute('bx-model');
    await this.element.fill('active');
    await eventually(async () => expect(await getData(this, path)).toBe('active'));
});

When('the unbind function is called', async function() {
    await this.page.evaluate(() => window.__bindings.forEach(binding => binding.destroy()));
});

Then('the binding should be removed', async function() {
    const path = await this.element.getAttribute('bx-model');
    await this.element.fill('after unbind');
    await nextFrames(this);
    expect(await getData(this, path)).toBe('active');
    await setData(this, path, 'changed in data');
    expect(await this.element.inputValue()).toBe('after unbind');
});

When('the element is removed from the DOM', async function() {
    await render(this);
    await this.element.evaluate(el => el.remove());
    await nextFrames(this);
});

Then('the binding should be automatically cleaned up', async function() {
    await eventually(async () => {
        const left = await this.page.evaluate(() => window.__bindings.filter(b => !b.__destroyed).length);
        expect(left).toBe(0);
    });
});

// ============================================================================
// NOT BUILT: bx-compute, bx-each, batching metrics
// These scenarios are tagged @wip (bx-compute and bx-each are not implemented)
// or @perf (timing), so the steps below never run in the default suite.
// ============================================================================

defineElement('an element with bx-compute={string}', async function(computedName) {
    await addMarkup(this, `<span id="test-element" bx-compute="${escapeAttr(computedName)}"></span>`, '#test-element');
});

defineElement('an element with bx-each={string}', async function(expression) {
    await addMarkup(this, `<ul id="test-list" bx-each="${escapeAttr(expression)}"></ul>`, '#test-list');
});

const notBuilt = () => 'pending';

Given('the computed function returns {word}.{word} + \' \' + {word}.{word}', notBuilt);
Given('the computed function returns {word} * {word}', notBuilt);
Given('the computed function returns {word} ? {string} : {string}', notBuilt);
Given('computed {string} depends on computed {string}', notBuilt);
Then('a circular dependency error should be thrown', notBuilt);
Given('the template is {string}', notBuilt);
Given(/^the reactive data has ([\w$.]+)=(\[.*\])$/, notBuilt);
Given('the reactive data has {int} items', notBuilt);
When(/^a new item (\{.*\}) is added to items$/, notBuilt);
When('the first item is removed from items', notBuilt);
When('the first item {word} changes to {string}', notBuilt);
When('a new tag {string} is pushed to post.tags', notBuilt);
Then('there should be {int} li element(s)', notBuilt);
Then('the first li should contain {string}', notBuilt);
Then('the second li should contain {string}', notBuilt);
Then('there should be {int} span elements', notBuilt);
Then('all {int} items should render', notBuilt);
Given('{int} elements bound to different properties', notBuilt);
When('{int} properties change simultaneously', notBuilt);

// tablex.feature: adding a row to a bound array needs bx-each.
When('an item is added to {word}', notBuilt);

module.exports = {};
