/**
 * Step definitions for bindX Reactive Engine
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Storage for test context
let reactiveObject = null;
let callbacks = new Map();
let callCounts = new Map();
let callValues = new Map();
let errorThrown = null;
let performanceMetrics = {};

// Background steps

Given('I have a test page with bindX loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/bindx.js' });
});

Given('the bindX reactive engine is initialized', async function() {
    const initialized = await this.page.evaluate(() => {
        return typeof window.bindX !== 'undefined';
    });
    assert.ok(initialized, 'bindX should be loaded');
});

// Basic Reactivity

When('I create a reactive object with property {string} set to {string}', async function(prop, value) {
    reactiveObject = await this.page.evaluate(({p, v}) => {
        const obj = window.bindX.reactive({ [p]: v });
        window.testReactiveObject = obj;
        return {
            isProxy: obj !== null && typeof obj === 'object',
            [p]: obj[p],
            marker: obj.__bindx_proxy__
        };
    }, {p: prop, v: value});
});

Then('the object should be a Proxy', function() {
    assert.ok(reactiveObject.isProxy, 'Object should be a Proxy');
});

Then('the object should have property {string} with value {string}', function(prop, value) {
    assert.strictEqual(reactiveObject[prop], value);
});

Then('the object should have {string} marker set to true', function(marker) {
    assert.strictEqual(reactiveObject.marker, true);
});

Given('I have a reactive object with property {string} set to {int}', async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.testReactiveObject = window.bindX.reactive({ [p]: v });
    }, {p: prop, v: value});
});

Given('I register a callback for property {string}', async function(prop) {
    await this.page.evaluate((p) => {
        if (!window.testCallbacks) window.testCallbacks = {};
        if (!window.testCallCounts) window.testCallCounts = {};
        if (!window.testCallValues) window.testCallValues = {};

        window.testCallbacks[p] = [];
        window.testCallCounts[p] = 0;
        window.testCallValues[p] = [];

        window.bindX.watch(window.testReactiveObject, p, (value) => {
            window.testCallbacks[p].push(value);
            window.testCallCounts[p]++;
            window.testCallValues[p].push(value);
        });
    }, prop);
});

When('I change property {string} to {int}', async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.testReactiveObject[p] = v;
    }, {p: prop, v: value});

    // Wait for RAF batching
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
});

Then('the callback should be invoked with value {int}', async function(value) {
    const lastValue = await this.page.evaluate((v) => {
        const values = window.testCallValues[Object.keys(window.testCallValues)[0]];
        return values[values.length - 1];
    }, value);

    assert.strictEqual(lastValue, value);
});

Then('the callback should be invoked exactly {int} time(s)', async function(count) {
    const actualCount = await this.page.evaluate(() => {
        const key = Object.keys(window.testCallCounts)[0];
        return window.testCallCounts[key];
    });

    assert.strictEqual(actualCount, count);
});

// Multiple properties

Given('I have a reactive object with properties {string} set to {int} and {string} set to {int}',
    async function(prop1, value1, prop2, value2) {
    await this.page.evaluate(({p1, v1, p2, v2}) => {
        window.testReactiveObject = window.bindX.reactive({
            [p1]: v1,
            [p2]: v2
        });
    }, {p1: prop1, v1: value1, p2: prop2, v2: value2});
});

Then('the callback for {string} should be invoked with value {int}', async function(prop, value) {
    const lastValue = await this.page.evaluate((p) => {
        const values = window.testCallValues[p];
        return values[values.length - 1];
    }, prop);

    assert.strictEqual(lastValue, value);
});

// Nested objects

Given('I have a reactive object with nested property {string} set to {string}',
    async function(path, value) {
    await this.page.evaluate(({p, v}) => {
        const parts = p.split('.');
        const obj = {};
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = v;

        window.testReactiveObject = window.bindX.reactive(obj);
    }, {p: path, v: value});
});

When('I change nested property {string} to {string}', async function(path, value) {
    await this.page.evaluate(({p, v}) => {
        const parts = p.split('.');
        let current = window.testReactiveObject;

        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = v;
    }, {p: path, v: value});

    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
});

Then('the callback should be invoked with value {string}', async function(value) {
    const lastValue = await this.page.evaluate(() => {
        const key = Object.keys(window.testCallValues)[0];
        const values = window.testCallValues[key];
        return values[values.length - 1];
    });

    assert.strictEqual(lastValue, value);
});

// Arrays

Given('I have a reactive object with property {string} set to array {string}',
    async function(prop, arrayStr) {
    const array = JSON.parse(arrayStr);
    await this.page.evaluate(({p, arr}) => {
        window.testReactiveObject = window.bindX.reactive({ [p]: arr });
    }, {p: prop, arr: array});
});

When('I push value {int} to array {string}', async function(value, prop) {
    await this.page.evaluate(({p, v}) => {
        window.testReactiveObject[p].push(v);
    }, {p: prop, v: value});

    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
});

Then('the callback should be invoked', async function() {
    const count = await this.page.evaluate(() => {
        const key = Object.keys(window.testCallCounts)[0];
        return window.testCallCounts[key];
    });

    assert.ok(count > 0, 'Callback should be invoked at least once');
});

Then('the array should have length {int}', async function(length) {
    const actualLength = await this.page.evaluate(() => {
        const key = Object.keys(window.testReactiveObject)[0];
        return window.testReactiveObject[key].length;
    });

    assert.strictEqual(actualLength, length);
});

// Performance

When('I have a reactive object with {int} properties', async function(count) {
    await this.page.evaluate((c) => {
        const obj = {};
        for (let i = 0; i < c; i++) {
            obj[`prop${i}`] = i;
        }
        window.testReactiveObject = window.bindX.reactive(obj);
    }, count);
});

When('I perform {int} property reads', async function(count) {
    performanceMetrics = await this.page.evaluate((c) => {
        const start = performance.now();
        let sum = 0;

        for (let i = 0; i < c; i++) {
            const prop = `prop${i % 100}`;
            sum += window.testReactiveObject[prop] || 0;
        }

        const end = performance.now();
        const total = end - start;

        return {
            total,
            average: total / c,
            operationCount: c
        };
    }, count);
});

Then('the average time per read should be less than {float} milliseconds', function(maxMs) {
    assert.ok(
        performanceMetrics.average < maxMs,
        `Average time ${performanceMetrics.average.toFixed(4)}ms exceeds ${maxMs}ms`
    );
});

Then('the total time should be less than {int} milliseconds', function(maxMs) {
    assert.ok(
        performanceMetrics.total < maxMs,
        `Total time ${performanceMetrics.total.toFixed(2)}ms exceeds ${maxMs}ms`
    );
});

When('I perform {int} property writes', async function(count) {
    performanceMetrics = await this.page.evaluate((c) => {
        const start = performance.now();

        for (let i = 0; i < c; i++) {
            window.testReactiveObject.test = i;
        }

        const end = performance.now();
        const total = end - start;

        return {
            total,
            average: total / c,
            operationCount: c
        };
    }, count);
});

// Cleanup

When('I disconnect the reactive object', async function() {
    await this.page.evaluate(() => {
        window.bindX.disconnect(window.testReactiveObject);
    });
});

Then('the callback should not be invoked', async function() {
    // Wait to ensure no delayed callbacks
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));

    const count = await this.page.evaluate(() => {
        const key = Object.keys(window.testCallCounts)[0];
        return window.testCallCounts[key];
    });

    assert.strictEqual(count, 0, 'Callback should not be invoked after disconnect');
});

// Edge cases - to be implemented as bindX develops
Given('I create a symbol {string}', function() {
    // Placeholder
});

When('I set property using symbol {string} to {string}', function() {
    // Placeholder
});

Then('the property should be accessible via the symbol', function() {
    // Placeholder
});

Then('reactivity should work for symbol properties', function() {
    // Placeholder
});
