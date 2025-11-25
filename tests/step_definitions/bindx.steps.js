/**
 * Step definitions for bindX module and all bindX features
 * Covers: bindx.feature, bindx-two-way-binding.feature, bindx-one-way-binding.feature,
 *         bindx-computed-properties.feature, bindx-reactive-proxy.feature,
 *         bindx-dependency-tracking.feature, bindx-binding-registry.feature, bindx-batched-updates.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the bindX module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/bindx.js' });

    // Wait for bindX to be available
    await this.page.waitForFunction(() => typeof window.bindx === 'function');
});

// ============================================================================
// REACTIVE DATA SETUP
// ============================================================================

Given('the reactive data object has {word}.{word}={string}', async function(obj, prop, value) {
    await this.page.evaluate(({o, p, v}) => {
        if (!window._testData) window._testData = {};
        if (!window._testData[o]) window._testData[o] = {};
        window._testData[o][p] = v;
        window._reactive = window.bindx(window._testData);
    }, {o: obj, p: prop, v: value});
});

Given('the reactive data object has {word}.{word}=value {word}', async function(obj, prop, value) {
    const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
    await this.page.evaluate(({o, p, v}) => {
        if (!window._testData) window._testData = {};
        if (!window._testData[o]) window._testData[o] = {};
        window._testData[o][p] = v;
        window._reactive = window.bindx(window._testData);
    }, {o: obj, p: prop, v: parsedValue});
});

Given('the reactive data has {word}={string} and {word}={string}', async function(key1, val1, key2, val2) {
    await this.page.evaluate(({k1, v1, k2, v2}) => {
        window._testData = { [k1]: v1, [k2]: v2 };
        window._reactive = window.bindx(window._testData);
    }, {k1: key1, v1: val1, k2: key2, v2: val2});
});

Given('the reactive data has {word}={int} and {word}={int}', async function(key1, val1, key2, val2) {
    await this.page.evaluate(({k1, v1, k2, v2}) => {
        window._testData = { [k1]: v1, [k2]: v2 };
        window._reactive = window.bindx(window._testData);
    }, {k1: key1, v1: val1, k2: key2, v2: val2});
});

Given('the reactive data has {word}={word}', async function(key, value) {
    const parsedValue = value === 'true' ? true : value === 'false' ? false : parseInt(value) || value;
    await this.page.evaluate(({k, v}) => {
        window._testData = { [k]: v };
        window._reactive = window.bindx(window._testData);
    }, {k: key, v: parsedValue});
});

Given('the reactive data has {word}.{word}={string}', async function(obj, prop, value) {
    await this.page.evaluate(({o, p, v}) => {
        window._testData = { [o]: { [p]: v } };
        window._reactive = window.bindx(window._testData);
    }, {o: obj, p: prop, v: value});
});

Given('the reactive data does not have this path', async function() {
    await this.page.evaluate(() => {
        window._testData = {};
        window._reactive = window.bindx(window._testData);
    });
});

// ============================================================================
// TWO-WAY BINDING (bx-model)
// ============================================================================

Given('an input with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <html><body>
            <input id="test-input" bx-model="${model}" />
        </body></html>
    `);
    this.element = await this.page.$('#test-input');
});

Given('a checkbox with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <html><body>
            <input id="test-checkbox" type="checkbox" bx-model="${model}" />
        </body></html>
    `);
    this.element = await this.page.$('#test-checkbox');
});

Given('a textarea with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <html><body>
            <textarea id="test-textarea" bx-model="${model}"></textarea>
        </body></html>
    `);
    this.element = await this.page.$('#test-textarea');
});

Given('a select element with bx-model={string}', async function(model) {
    this.selectModel = model;
});

Given('options for {string}, {string}, {string}', async function(opt1, opt2, opt3) {
    await this.page.setContent(`
        <html><body>
            <select id="test-select" bx-model="${this.selectModel}">
                <option value="${opt1}">${opt1}</option>
                <option value="${opt2}">${opt2}</option>
                <option value="${opt3}">${opt3}</option>
            </select>
        </body></html>
    `);
    this.element = await this.page.$('#test-select');
});

Given('radio buttons with bx-model={string} and values {string}, {string}, {string}', async function(model, val1, val2, val3) {
    await this.page.setContent(`
        <html><body>
            <input type="radio" name="plan" bx-model="${model}" value="${val1}" id="radio1" />
            <input type="radio" name="plan" bx-model="${model}" value="${val2}" id="radio2" />
            <input type="radio" name="plan" bx-model="${model}" value="${val3}" id="radio3" />
        </body></html>
    `);
});

When('the user types {string} into the input', async function(text) {
    await this.element.fill(text);
});

When('the user types {string} into the textarea', async function(text) {
    await this.element.fill(text);
});

When('the user checks the checkbox', async function() {
    await this.element.check();
});

When('the user selects {string}', async function(value) {
    await this.element.selectOption(value);
});

When('the user selects the {string} radio button', async function(value) {
    await this.page.click(`input[value="${value}"]`);
});

Then('the input should display {string}', async function(expected) {
    const value = await this.element.inputValue();
    expect(value).toBe(expected);
});

Then('the textarea should display {string}', async function(expected) {
    const value = await this.element.inputValue();
    expect(value).toBe(expected);
});

Then('the dropdown should display {string}', async function(expected) {
    const value = await this.element.inputValue();
    expect(value).toBe(expected);
});

Then('the checkbox should be unchecked', async function() {
    const checked = await this.element.isChecked();
    expect(checked).toBe(false);
});

Then('the {string} radio button should be selected', async function(value) {
    const checked = await this.page.isChecked(`input[value="${value}"]`);
    expect(checked).toBe(true);
});

Then('the data object {word}.{word} should be {string}', async function(obj, prop, expected) {
    const actual = await this.page.evaluate(({o, p}) => {
        return window._testData[o][p];
    }, {o: obj, p: prop});
    expect(actual).toBe(expected);
});

Then('the data object {word}.{word} should be value {word}', async function(obj, prop, expected) {
    const expectedValue = expected === 'true' ? true : expected === 'false' ? false : expected;
    const actual = await this.page.evaluate(({o, p}) => {
        return window._testData[o][p];
    }, {o: obj, p: prop});
    expect(actual).toBe(expectedValue);
});

// ============================================================================
// ONE-WAY BINDING (bx-bind)
// ============================================================================

Given('an element with bx-bind:text={string}', async function(binding) {
    await this.page.setContent(`
        <html><body>
            <span id="test-element" bx-bind:text="${binding}"></span>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('an img with bx-bind:src={string}', async function(binding) {
    await this.page.setContent(`
        <html><body>
            <img id="test-img" bx-bind:src="${binding}" />
        </body></html>
    `);
    this.element = await this.page.$('#test-img');
});

Given('an element with bx-bind:class={string}', async function(binding) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" bx-bind:class="${binding}"></div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('an element with bx-bind:style.color={string}', async function(binding) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" bx-bind:style.color="${binding}"></div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

When('the data object {word}.{word} changes to {string}', async function(obj, prop, newValue) {
    await this.page.evaluate(({o, p, v}) => {
        window._testData[o][p] = v;
    }, {o: obj, p: prop, v: newValue});
});

When('the data object {word}.{word} changes to value {word}', async function(obj, prop, newValue) {
    const parsedValue = newValue === 'true' ? true : newValue === 'false' ? false : newValue;
    await this.page.evaluate(({o, p, v}) => {
        window._testData[o][p] = v;
    }, {o: obj, p: prop, v: parsedValue});
});

When('the data object {word} changes to {string}', async function(key, newValue) {
    await this.page.evaluate(({k, v}) => {
        window._testData[k] = v;
    }, {k: key, v: newValue});
});

When('the data object {word} changes to number {int}', async function(key, newValue) {
    await this.page.evaluate(({k, v}) => {
        window._testData[k] = v;
    }, {k: key, v: newValue});
});

Then('the element should automatically update to {string}', async function(expected) {
    await this.page.waitForTimeout(100); // Wait for binding to update
    const content = await this.element.textContent();
    expect(content).toBe(expected);
});

Then('the img src should be {string}', async function(expected) {
    const src = await this.element.getAttribute('src');
    expect(src).toBe(expected);
});

Then('the img src should automatically update to {string}', async function(expected) {
    await this.page.waitForTimeout(100);
    const src = await this.element.getAttribute('src');
    expect(src).toBe(expected);
});

Then('the element style color should be {string}', async function(expected) {
    const color = await this.element.evaluate(el => el.style.color);
    expect(color).toBe(expected);
});

Then('the element style color should automatically update to {string}', async function(expected) {
    await this.page.waitForTimeout(100);
    const color = await this.element.evaluate(el => el.style.color);
    expect(color).toBe(expected);
});

// ============================================================================
// COMPUTED PROPERTIES (bx-compute)
// ============================================================================

Given('an element with bx-compute={string}', async function(computedName) {
    this.computedName = computedName;
});

Given('the computed function returns {word}.{word} + \' \' + {word}.{word}', async function(obj1, prop1, obj2, prop2) {
    await this.page.evaluate(({name, o1, p1, o2, p2}) => {
        window._computed = window._computed || {};
        window._computed[name] = () => {
            return window._testData[o1][p1] + ' ' + window._testData[o2][p2];
        };
    }, {name: this.computedName, o1: obj1, p1: prop1, o2: obj2, p2: prop2});

    await this.page.setContent(`
        <html><body>
            <span id="test-element" bx-compute="${this.computedName}"></span>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('the computed function returns {word} * {word}', async function(var1, var2) {
    await this.page.evaluate(({name, v1, v2}) => {
        window._computed = window._computed || {};
        window._computed[name] = () => {
            return window._testData[v1] * window._testData[v2];
        };
    }, {name: this.computedName, v1: var1, v2: var2});

    await this.page.setContent(`
        <html><body>
            <span id="test-element" bx-compute="${this.computedName}"></span>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('the computed function returns {word} ? {string} : {string}', async function(condition, trueVal, falseVal) {
    await this.page.evaluate(({name, cond, tv, fv}) => {
        window._computed = window._computed || {};
        window._computed[name] = () => {
            return window._testData[cond] ? tv : fv;
        };
    }, {name: this.computedName, cond: condition, tv: trueVal, fv: falseVal});

    await this.page.setContent(`
        <html><body>
            <span id="test-element" bx-compute="${this.computedName}"></span>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

// ============================================================================
// COLLECTION BINDING (bx-each)
// ============================================================================

Given('an element with bx-each={string}', async function(eachExpression) {
    this.eachExpression = eachExpression;
});

Given('the template is {string}', async function(template) {
    this.template = template;
});

Given('the reactive data has items=[{word}:{string}, {word}:{string}]', async function(key1, val1, key2, val2) {
    await this.page.evaluate(({t, expr, k1, v1, k2, v2}) => {
        window._testData = {
            items: [{[k1]: v1}, {[k2]: v2}]
        };
        window._reactive = window.bindx(window._testData);
    }, {t: this.template, expr: this.eachExpression, k1: key1, v1: val1, k2: key2, v2: val2});

    await this.page.setContent(`
        <html><body>
            <ul id="list" bx-each="${this.eachExpression}">
                ${this.template}
            </ul>
        </body></html>
    `);
});

Given('the reactive data has items=[{word}:{string}]', async function(key, val) {
    await this.page.evaluate(({k, v}) => {
        window._testData = {
            items: [{[k]: v}]
        };
        window._reactive = window.bindx(window._testData);
    }, {k: key, v: val});

    await this.page.setContent(`
        <html><body>
            <ul id="list" bx-each="${this.eachExpression}">
                ${this.template}
            </ul>
        </body></html>
    `);
});

Then('there should be {int} li element(s)', async function(count) {
    const elements = await this.page.$$('li');
    expect(elements.length).toBe(count);
});

Then('the first li should contain {string}', async function(text) {
    const content = await this.page.$eval('li:first-child', el => el.textContent);
    expect(content).toContain(text);
});

Then('the second li should contain {string}', async function(text) {
    const content = await this.page.$eval('li:nth-child(2)', el => el.textContent);
    expect(content).toContain(text);
});

// ============================================================================
// VALIDATION & ERROR HANDLING
// ============================================================================

Given('an element with invalid bx-model={string}', async function(model) {
    await this.page.setContent(`
        <html><body>
            <input id="test-input" bx-model="${model}" />
        </body></html>
    `);
});

Given('bindx\\(\\) is called with a non-object', async function() {
    this.error = await this.page.evaluate(() => {
        try {
            window.bindx("not an object");
        } catch (e) {
            return {name: e.constructor.name, message: e.message};
        }
    });
});

Then('the binding should not be created', async function() {
    // Check that binding was not created
    return 'pending';
});

// ============================================================================
// CLEANUP & MEMORY
// ============================================================================

Given('the binding is active', function() {
    this.bindingActive = true;
});

When('the unbind function is called', async function() {
    await this.page.evaluate(() => {
        if (window._unbind) window._unbind();
    });
});

Then('the binding should be removed', async function() {
    return 'pending';
});

When('the element is removed from the DOM', async function() {
    await this.element.evaluate(el => el.remove());
});

Then('the binding should be automatically cleaned up', async function() {
    return 'pending';
});

// ============================================================================
// PLACEHOLDERS FOR COMPLEX FEATURES
// ============================================================================

Given('an input with bx-model={string} and bx-debounce={string}', async function(model, debounce) {
    return 'pending';
});

Given('{int} elements bound to different properties', async function(count) {
    return 'pending';
});

When('{int} properties change simultaneously', async function(count) {
    return 'pending';
});

Given('the reactive data has {int} items', async function(count) {
    return 'pending';
});

When('a new item {word}:{string} is added to items', async function(key, value) {
    return 'pending';
});

When('the first item is removed from items', async function() {
    return 'pending';
});

When('the first item {word} changes to {string}', async function(prop, value) {
    return 'pending';
});

Given('an element with bx-bind:text={string} and bx-format={string}', async function(binding, format) {
    return 'pending';
});

Given('an element with bx-bind:text={string} and fx-format={string}', async function(binding, format) {
    return 'pending';
});

When('the user types {string} quickly', async function(text) {
    return 'pending';
});

Given('computed {string} depends on computed {string}', async function(comp1, comp2) {
    return 'pending';
});

Then('a circular dependency error should be thrown', async function() {
    return 'pending';
});

Given('the bindX module is initialized with observe=true', async function() {
    return 'pending';
});

When('a new element with bx-model={string} is added', async function(model) {
    return 'pending';
});

Then('the element should be reactive', async function() {
    return 'pending';
});

When('an item is added to {word}', async function(arrayName) {
    return 'pending';
});

Given('the reactive data has post.tags=[{string}, {string}]', async function(tag1, tag2) {
    return 'pending';
});

When('a new tag {string} is pushed to post.tags', async function(tag) {
    return 'pending';
});

Then('there should be {int} span elements', async function(count) {
    return 'pending';
});

Then('all {int} items should render', async function(count) {
    return 'pending';
});

module.exports = {};
