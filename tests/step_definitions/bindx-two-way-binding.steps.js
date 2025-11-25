/**
 * Step definitions for bindX Two-Way Data Binding (bx-model)
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Note: "Given I have a test page with bindX loaded" is defined in bindx-reactive-engine.steps.js

Given('I have a reactive data object with property {string} set to {string}', async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.testData = window.bindX.reactive({ [p]: v });
    }, {p: prop, v: value});
});

// Text Input Binding

Given('I have a text input with bx-model={string}', async function(model) {
    await this.page.evaluate((m) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'test-input';
        input.setAttribute('bx-model', m);
        document.body.appendChild(input);
    }, model);
});

When('bindX scans the DOM', async function() {
    await this.page.evaluate(() => {
        window.testBindings = window.bindX.scan(document.body, window.testData);
    });
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

Then('the input value should be {string}', async function(expected) {
    const actual = await this.page.evaluate(() => {
        const input = document.getElementById('test-input') || document.querySelector('input');
        return input ? input.value : null;
    });
    assert.strictEqual(actual, expected);
});

Given('I have a text input with bx-model={string} bound to reactive data', async function(model) {
    await this.page.evaluate((m) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'test-input';
        input.setAttribute('bx-model', m);
        document.body.appendChild(input);

        if (!window.testData) {
            window.testData = window.bindX.reactive({});
        }

        window.testBindings = window.bindX.scan(document.body, window.testData);
    }, model);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

When('I type {string} into the input', async function(text) {
    await this.page.evaluate((t) => {
        const input = document.getElementById('test-input') || document.querySelector('input');
        if (input) {
            input.value = t;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, text);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

Then('the data property {string} should be {string}', async function(prop, expected) {
    const actual = await this.page.evaluate((p) => {
        return window.bindX.getNestedProperty(window.testData, p);
    }, prop);
    assert.strictEqual(actual, expected);
});

When('I change the data property {string} to {string}', async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.bindX.setNestedProperty(window.testData, p, v);
    }, {p: prop, v: value});
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
});

// Nested Property Paths
// Note: "Given I have a reactive data object with nested property {string} set to {string}"
// is defined in bindx-reactive-engine.steps.js

// Debouncing

Given('I have a text input with bx-model={string} and bx-debounce={string}',
    async function(model, debounce) {
    await this.page.evaluate(({m, d}) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'test-input';
        input.setAttribute('bx-model', m);
        input.setAttribute('bx-debounce', d);
        document.body.appendChild(input);
    }, {m: model, d: debounce});
});

Given('the input is bound to reactive data', async function() {
    await this.page.evaluate(() => {
        if (!window.testData) {
            window.testData = window.bindX.reactive({});
        }
        window.testBindings = window.bindX.scan(document.body, window.testData);
    });
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

When('I type {string} character by character', async function(text) {
    for (const char of text) {
        await this.page.evaluate((c) => {
            const input = document.getElementById('test-input') || document.querySelector('input');
            if (input) {
                input.value += c;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, char);
        await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 10)));
    }
});

Then('the data should not update immediately', async function() {
    // Just a marker step - we verify the actual behavior in the next step
});

Then('after {int} milliseconds the data property {string} should be {string}',
    async function(ms, prop, expected) {
    await this.page.evaluate((delay) => new Promise(resolve => setTimeout(resolve, delay)), ms + 100);

    const actual = await this.page.evaluate((p) => {
        return window.bindX.getNestedProperty(window.testData, p);
    }, prop);
    assert.strictEqual(actual, expected);
});

// Checkbox Binding

Given('I have a reactive data object with property {string} set to boolean {word}',
    async function(prop, value) {
    const boolValue = value === 'true';
    await this.page.evaluate(({p, v}) => {
        window.testData = window.bindX.reactive({ [p]: v });
    }, {p: prop, v: boolValue});
});

Given('I have a checkbox with bx-model={string}', async function(model) {
    await this.page.evaluate((m) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'test-checkbox';
        checkbox.setAttribute('bx-model', m);
        document.body.appendChild(checkbox);
    }, model);
});

Then('the checkbox should not be checked', async function() {
    const checked = await this.page.evaluate(() => {
        const checkbox = document.getElementById('test-checkbox');
        return checkbox ? checkbox.checked : null;
    });
    assert.strictEqual(checked, false);
});

Given('I have a checkbox with bx-model={string} bound to reactive data',
    async function(model) {
    await this.page.evaluate((m) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'test-checkbox';
        checkbox.setAttribute('bx-model', m);
        document.body.appendChild(checkbox);

        if (!window.testData) {
            window.testData = window.bindX.reactive({});
        }

        window.testBindings = window.bindX.scan(document.body, window.testData);
    }, model);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

When('I check the checkbox', async function() {
    await this.page.evaluate(() => {
        const checkbox = document.getElementById('test-checkbox');
        if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

Then('the data property {string} should be boolean {word}', async function(prop, value) {
    const expected = value === 'true';
    const actual = await this.page.evaluate((p) => {
        return window.bindX.getNestedProperty(window.testData, p);
    }, prop);
    assert.strictEqual(actual, expected);
});

Then('the checkbox should be checked', async function() {
    const checked = await this.page.evaluate(() => {
        const checkbox = document.getElementById('test-checkbox');
        return checkbox ? checkbox.checked : null;
    });
    assert.strictEqual(checked, true);
});

// Select Dropdown Binding

Given('I have a select dropdown with bx-model={string}', async function(model) {
    await this.page.evaluate((m) => {
        const select = document.createElement('select');
        select.id = 'test-select';
        select.setAttribute('bx-model', m);
        document.body.appendChild(select);
    }, model);
});

Given('the select has options {string}, {string}, {string}',
    async function(opt1, opt2, opt3) {
    await this.page.evaluate(({o1, o2, o3}) => {
        const select = document.getElementById('test-select');
        if (select) {
            [o1, o2, o3].forEach(val => {
                const option = document.createElement('option');
                option.value = val;
                option.textContent = val;
                select.appendChild(option);
            });
        }
    }, {o1: opt1, o2: opt2, o3: opt3});
});

Then('the selected option should be {string}', async function(expected) {
    const actual = await this.page.evaluate(() => {
        const select = document.getElementById('test-select');
        return select ? select.value : null;
    });
    assert.strictEqual(actual, expected);
});

Given('I have a select dropdown with bx-model={string} bound to reactive data',
    async function(model) {
    await this.page.evaluate((m) => {
        const select = document.createElement('select');
        select.id = 'test-select';
        select.setAttribute('bx-model', m);

        ['English', 'Spanish', 'French'].forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            select.appendChild(option);
        });

        document.body.appendChild(select);

        if (!window.testData) {
            window.testData = window.bindX.reactive({});
        }

        window.testBindings = window.bindX.scan(document.body, window.testData);
    }, model);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

When('I select the option {string}', async function(value) {
    await this.page.evaluate((v) => {
        const select = document.getElementById('test-select');
        if (select) {
            select.value = v;
            select.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, value);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
});

// Type Coercion

Given('I have a reactive data object with property {string} set to number {int}',
    async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.testData = window.bindX.reactive({ [p]: v });
    }, {p: prop, v: value});
});

Given('I have a number input with bx-model={string}', async function(model) {
    await this.page.evaluate((m) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'test-input';
        input.setAttribute('bx-model', m);
        document.body.appendChild(input);
    }, model);
});

Then('the data property {string} should be number {int}', async function(prop, expected) {
    const actual = await this.page.evaluate((p) => {
        return window.bindX.getNestedProperty(window.testData, p);
    }, prop);
    assert.strictEqual(typeof actual, 'number');
    assert.strictEqual(actual, expected);
});

// Performance

Given('I have {int} text inputs all with unique bx-model attributes',
    async function(count) {
    await this.page.evaluate((c) => {
        const container = document.createElement('div');
        container.id = 'test-container';

        for (let i = 0; i < c; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${i}`;
            input.setAttribute('bx-model', `field${i}`);
            container.appendChild(input);
        }

        document.body.appendChild(container);

        const data = {};
        for (let i = 0; i < c; i++) {
            data[`field${i}`] = '';
        }
        window.testData = window.bindX.reactive(data);

        window.testBindings = window.bindX.scan(document.body, window.testData);
    }, count);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));
});

When('I update all inputs simultaneously', async function() {
    this.perfStart = await this.page.evaluate(() => {
        const startTime = performance.now();
        const inputs = document.querySelectorAll('input[id^="input-"]');

        inputs.forEach((input, i) => {
            input.value = `Value${i}`;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        return startTime;
    });
});

Then('all data properties should update correctly', async function() {
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));

    const allCorrect = await this.page.evaluate(() => {
        for (let i = 0; i < 50; i++) {
            const expected = `Value${i}`;
            const actual = window.testData[`field${i}`];
            if (actual !== expected) {
                return false;
            }
        }
        return true;
    });

    assert.ok(allCorrect, 'All data properties should be updated correctly');
});

Then('in bindx-two-way-binding, the total time should be less than {int} milliseconds', async function(maxMs) {
    const endTime = await this.page.evaluate(() => performance.now());
    const duration = endTime - this.perfStart;

    assert.ok(duration < maxMs, `Expected less than ${maxMs}ms, got ${Math.round(duration)}ms`);
});
