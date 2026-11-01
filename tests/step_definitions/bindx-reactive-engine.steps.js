/**
 * Step definitions for bindX Reactive Engine
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Storage for test context
let reactiveObject = null;
let performanceMetrics = {};

const nextFrame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

// Writes through the reactive object. A throw (for example the cycle guard)
// is kept in window.__lastError for the steps that assert on it.
const write = (page, fn, arg) => page.evaluate(([body, a]) => {
    window.__lastError = null;
    try {
        new Function('obj', 'a', body)(window.testReactiveObject, a);
    } catch (e) {
        window.__lastError = e.message;
    }
}, [fn, arg]);

// Background steps

Given('I have a test page with bindX loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    // bindX puts its internals (withTracking, computedCache, ...) on
    // module.exports only. A temporary module object exposes them as window.__bxi.
    await this.page.addScriptTag({ content: 'window.module = { exports: {} };' });
    await this.page.addScriptTag({ path: './src/bindx.js' });
    await this.page.evaluate(() => {
        window.__bxi = window.module.exports;
        delete window.module;
        // Frame counter for the batching checks
        window.__frame = 0;
        const tick = () => { window.__frame++; requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    });
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
            isProxy: window.bindX.isReactive(obj) && obj !== window.bindX.reactive,
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
    await write(this.page, 'obj[a[0]] = a[1];', [prop, value]);
    await nextFrame(this.page);
});

When(/^I change property "([^"]+)" to "([^"]*)"(?: again)?$/, async function(prop, value) {
    await write(this.page, 'obj[a[0]] = a[1];', [prop, value]);
    await nextFrame(this.page);
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

Given(/^I have a reactive object with property "([^"]+)" set to array (\[.*\])$/,
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

Then('the average time per write should be less than {float} milliseconds', function(maxMs) {
    assert.ok(
        performanceMetrics.average < maxMs,
        `Average time ${performanceMetrics.average.toFixed(4)}ms exceeds ${maxMs}ms`
    );
});

Then('in bindx-reactive-engine, the total time should be less than {int} milliseconds', function(maxMs) {
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

// Further property setups

Given('I have a reactive object with property {string} set to {string}', async function(prop, value) {
    await this.page.evaluate(({p, v}) => {
        window.testReactiveObject = window.bindX.reactive({ [p]: v });
    }, {p: prop, v: value});
});

Given('I have a reactive object with property {string} set to empty object', async function(prop) {
    await this.page.evaluate((p) => {
        window.testReactiveObject = window.bindX.reactive({ [p]: {} });
    }, prop);
});

Given('I have a reactive object with properties {string} set to {string} and {string} set to {string}',
    async function(prop1, value1, prop2, value2) {
    await this.page.evaluate(({p1, v1, p2, v2}) => {
        window.testReactiveObject = window.bindX.reactive({ [p1]: v1, [p2]: v2 });
    }, {p1: prop1, v1: value1, p2: prop2, v2: value2});
});

Given('I have a reactive object with properties {string}, {string}, {string} set to {int}',
    async function(a, b, c, value) {
    await this.page.evaluate(({keys, v}) => {
        const obj = {};
        keys.forEach(k => { obj[k] = v; });
        window.testReactiveObject = window.bindX.reactive(obj);
    }, {keys: [a, b, c], v: value});
});

When('I set property {string} to a new object', async function(path) {
    await write(this.page, `
        const parts = a.split('.');
        let target = obj;
        parts.slice(0, -1).forEach(p => { target = target[p]; });
        target[parts[parts.length - 1]] = {};
    `, path);
    const reactive = await this.page.evaluate((p) => {
        const parts = p.split('.');
        let target = window.testReactiveObject;
        parts.forEach(k => { target = target[k]; });
        return window.bindX.isReactive(target);
    }, path);
    assert.strictEqual(reactive, true, `New object at ${path} should be reactive`);
});

// Arrays

When('I change array element {int} to {string}', async function(index, value) {
    await write(this.page, 'const key = Object.keys(obj)[0]; obj[key][a[0]] = a[1];', [index, value]);
    await nextFrame(this.page);
});

Then('the array element {int} should be {string}', async function(index, value) {
    const actual = await this.page.evaluate((i) => {
        const key = Object.keys(window.testReactiveObject)[0];
        return window.testReactiveObject[key][i];
    }, index);
    assert.strictEqual(actual, value);
});

// Dependency tracking

When('I compute a value using properties {string} and {string}', async function(a, b) {
    this.tracked = await this.page.evaluate(([p1, p2]) => {
        const obj = window.testReactiveObject;
        const { result, dependencies } = window.__bxi.withTracking(() => `${obj[p1]} ${obj[p2]}`);
        return { result, dependencies: [...dependencies] };
    }, [a, b]);
});

Then('the dependency tracker should record {string} and {string} as dependencies', function(a, b) {
    assert.ok(this.tracked.dependencies.includes(a), `Dependencies ${this.tracked.dependencies} should include ${a}`);
    assert.ok(this.tracked.dependencies.includes(b), `Dependencies ${this.tracked.dependencies} should include ${b}`);
    assert.ok(this.tracked.result.length > 1, 'Computation should return a value');
});

Given('I have {int} computed values depending on {string}', async function(count, prop) {
    await this.page.evaluate(({n, p}) => {
        const obj = window.testReactiveObject;
        window.__computeds = [];
        for (let i = 1; i <= n; i++) {
            const value = window.bindX.computed(() => obj[p] * i);
            value(); // first read records the dependency
            window.__computeds.push({ value, factor: i });
        }
    }, {n: count, p: prop});
});

Then('all {int} computed values should be notified', async function(count) {
    const state = await this.page.evaluate(() => window.__computeds.map(c => ({
        invalidated: window.__bxi.computedCache.get(c.value).cached === false,
        value: c.value(),
        expected: window.testReactiveObject.price * c.factor
    })));
    assert.strictEqual(state.length, count);
    state.forEach((c, i) => {
        assert.strictEqual(c.invalidated, true, `Computed ${i + 1} should be invalidated by the change`);
        assert.strictEqual(c.value, c.expected, `Computed ${i + 1} should recompute`);
    });
});

// Change notification

Given('I register callbacks for properties {string}, {string}, {string}', async function(a, b, c) {
    await this.page.evaluate((keys) => {
        window.testCallCounts = {};
        window.testCallFrames = {};
        keys.forEach(k => {
            window.testCallCounts[k] = 0;
            window.testCallFrames[k] = [];
            window.bindX.watch(window.testReactiveObject, k, () => {
                window.testCallCounts[k]++;
                window.testCallFrames[k].push(window.__frame);
            });
        });
    }, [a, b, c]);
});

When('I change properties {string}, {string}, {string} in rapid succession', async function(a, b, c) {
    await this.page.evaluate((keys) => {
        window.__changeFrame = window.__frame;
        keys.forEach((k, i) => { window.testReactiveObject[k] = i + 1; });
    }, [a, b, c]);
    await nextFrame(this.page);
});

Then('callbacks should be batched within a single requestAnimationFrame', async function() {
    const { frames, changeFrame } = await this.page.evaluate(() => ({
        frames: Object.values(window.testCallFrames).flat(),
        changeFrame: window.__changeFrame
    }));
    assert.strictEqual(frames.length, 3, 'All three callbacks should run');
    assert.ok(frames.every(f => f === changeFrame), `Callbacks ran in frames ${frames}, changes in frame ${changeFrame}`);
});

Then('each callback should be invoked exactly once', async function() {
    const counts = await this.page.evaluate(() => window.testCallCounts);
    Object.entries(counts).forEach(([k, n]) => assert.strictEqual(n, 1, `Callback for ${k} ran ${n} times`));
});

// Cycle detection

Given('I register a callback for property {string} that increments {string}', async function(prop, target) {
    await this.page.evaluate(([p, t]) => {
        const obj = window.testReactiveObject;
        window.bindX.watch(obj, p, () => { obj[t] = obj[t] + 1; });
    }, [prop, target]);
});

Given('I register a callback that increments {string} until it reaches {string}', async function(prop, limit) {
    await this.page.evaluate(([p, l]) => {
        const obj = window.testReactiveObject;
        window.bindX.watch(obj, p, (value) => {
            if (value < obj[l]) obj[p] = value + 1;
        });
    }, [prop, limit]);
});

Then('a cycle detection error should be thrown', async function() {
    this.lastBindxError = await this.page.evaluate(() => window.__lastError);
    assert.ok(this.lastBindxError, 'Expected the write to throw a cycle detection error');
});

Then('property {string} should reach {int} without errors', async function(prop, value) {
    const { actual, error } = await this.page.evaluate((p) => ({
        actual: window.testReactiveObject[p],
        error: window.__lastError
    }), prop);
    assert.strictEqual(error, null, `Unexpected error: ${error}`);
    assert.strictEqual(actual, value);
});

// WeakMap-based cleanup

When('I create {int} reactive objects', async function(count) {
    await this.page.evaluate((n) => {
        window.__held = [];
        window.__proxyRefs = [];
        window.__sourceRefs = [];
        for (let i = 0; i < n; i++) {
            const source = { index: i, nested: { value: i } };
            const proxy = window.bindX.reactive(source);
            proxy.nested.value; // creates the cached nested proxy as well
            window.__held.push(proxy);
            window.__proxyRefs.push(new WeakRef(proxy));
            window.__sourceRefs.push(new WeakRef(source));
        }
    }, count);
});

When('I let them go out of scope', async function() {
    await this.page.evaluate(() => { window.__held = null; });
});

When('garbage collection occurs', async function() {
    // WeakRef targets survive until the current task ends, so collect after
    // a task boundary, twice to clear anything freed by the first pass.
    const cdp = await this.context.newCDPSession(this.page);
    for (let i = 0; i < 2; i++) {
        await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
        await cdp.send('HeapProfiler.collectGarbage');
    }
    await cdp.detach();
});

Then('the WeakMap should not prevent garbage collection', async function() {
    const alive = await this.page.evaluate(() => window.__proxyRefs.filter(r => r.deref()).length);
    assert.strictEqual(alive, 0, `${alive} reactive proxies survived garbage collection`);
    // The shared "no memory leaks" step checks the source objects too
    this.checkLeaks = async () => {
        const sources = await this.page.evaluate(() => window.__sourceRefs.filter(r => r.deref()).length);
        assert.strictEqual(sources, 0, `${sources} source objects are still held by bindX`);
    };
});

// Edge cases

When(/^I set property "([^"]+)" to (null|undefined)$/, async function(prop, which) {
    await write(this.page, 'obj[a[0]] = a[1] === "null" ? null : undefined;', [prop, which]);
    const error = await this.page.evaluate(() => window.__lastError);
    if (error) this.pageErrors.push(error);
});

Then(/^property "([^"]+)" should be (null|undefined)$/, async function(prop, which) {
    const isExpected = await this.page.evaluate(([p, w]) => {
        const v = window.testReactiveObject[p];
        return w === 'null' ? v === null : v === undefined;
    }, [prop, which]);
    assert.ok(isExpected, `Property ${prop} should be ${which}`);
});

Given(/^I (?:have|create) a reactive object "([^"]+)"$/, async function(name) {
    await this.page.evaluate((n) => {
        window.__named = window.__named || {};
        window.__named[n] = window.bindX.reactive({ name: n });
    }, name);
});

When(/^I set "([^".]+)\.([^"]+)" to "([^"]+)"$/, async function(owner, prop, value) {
    const error = await this.page.evaluate(([o, p, v]) => {
        try {
            window.__named[o][p] = window.__named[v];
            return null;
        } catch (e) {
            return e.message;
        }
    }, [owner, prop, value]);
    if (error) this.pageErrors.push(error);
});

Then('both objects should remain reactive', async function() {
    const state = await this.page.evaluate(() => {
        const { parent, child } = window.__named;
        const seen = [];
        window.bindX.watch(parent, 'child.name', v => seen.push(v));
        parent.child.parent.child.name = 'renamed';
        return {
            parentReactive: window.bindX.isReactive(parent),
            childReactive: window.bindX.isReactive(child),
            loop: parent.child.parent === parent && child.parent.child === child,
            childName: child.name,
            seen
        };
    });
    assert.strictEqual(state.parentReactive, true);
    assert.strictEqual(state.childReactive, true);
    assert.strictEqual(state.loop, true, 'parent.child.parent should be parent');
    assert.strictEqual(state.childName, 'renamed', 'Writes through the cycle should reach the child');
});

When('I create a reactive wrapper for a primitive value {int}', async function(value) {
    this.primitive = await this.page.evaluate((v) => {
        const wrapped = window.bindX.reactive(v);
        return { value: wrapped, type: typeof wrapped, reactive: window.bindX.isReactive(wrapped) };
    }, value);
});

Then('the value should remain {int}', function(value) {
    assert.strictEqual(this.primitive.value, value);
});

Then('it should not be wrapped in a Proxy', function() {
    assert.strictEqual(this.primitive.type, 'number');
    assert.strictEqual(this.primitive.reactive, false);
});

Given('I create a symbol {string}', async function(name) {
    await this.page.evaluate((n) => { window.__symbol = Symbol(n); }, name);
});

When('I set property using symbol {string} to {string}', async function(name, value) {
    await write(this.page, 'obj[window.__symbol] = a;', value);
    this.symbolValue = value;
});

Then('the property should be accessible via the symbol', async function() {
    const actual = await this.page.evaluate(() => window.testReactiveObject[window.__symbol]);
    assert.strictEqual(actual, this.symbolValue);
});

Then('reactivity should work for symbol properties', async function() {
    const values = await this.page.evaluate(() => {
        const obj = window.testReactiveObject;
        const value = window.bindX.computed(() => obj[window.__symbol]);
        const before = value();
        obj[window.__symbol] = 'changed';
        return [before, value()];
    });
    assert.deepStrictEqual(values, [this.symbolValue, 'changed']);
});
