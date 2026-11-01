/**
 * Step definitions for bindX Reactive Proxy Wrapper
 * Covers: bindx-reactive-proxy.feature
 *
 * Runs bindX.bindx() on the fixture page. Every wrap records onChange calls
 * in window._changes as [path, value] pairs.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { mountBindx } = require('../support/bindx-fixture');

const setPlain = async (world, fn, arg) => {
    await mountBindx(world);
    await world.page.evaluate(fn, arg);
};

const wrap = (world, options) => world.page.evaluate(opts => {
    window._changes = [];
    const source = window._plainObject || window._plainArray;
    window._reactive = window.bindX.bindx(source, {
        ...opts,
        onChange: (path, value) => window._changes.push([path, value])
    });
    window.testReactiveObject = window._reactive; // shared with the reactive-engine steps
}, options || {});

const changes = world => world.page.evaluate(() => window._changes);

Given('I have a plain object with {word} {int} and {word} {string}', async function(key1, val1, key2, val2) {
    await setPlain(this, ([k1, v1, k2, v2]) => {
        window._plainObject = { [k1]: v1, [k2]: v2 };
    }, [key1, val1, key2, val2]);
});

Given('I have a nested object with user {word} {string} and {word} {int}', async function(prop1, val1, prop2, val2) {
    await setPlain(this, ([p1, v1, p2, v2]) => {
        window._plainObject = { user: { [p1]: v1, [p2]: v2 } };
    }, [prop1, val1, prop2, val2]);
});

Given('I have a nested object with user {word} {string}', async function(prop, value) {
    await setPlain(this, ([p, v]) => {
        window._plainObject = { user: { [p]: v } };
    }, [prop, value]);
});

Given('I have an object with circular reference to itself', async function() {
    await setPlain(this, () => {
        window._plainObject = { name: 'circular' };
        window._plainObject.self = window._plainObject;
    });
});

Given('I have a reactive object', async function() {
    await setPlain(this, () => {
        window._plainObject = { value: 42 };
    });
    await wrap(this);
});

Given('I have a reactive object with {word} {int}', async function(key, value) {
    await setPlain(this, ([k, v]) => {
        window._plainObject = { [k]: v };
    }, [key, value]);
    await wrap(this);
});

Given('I have a plain object', async function() {
    await setPlain(this, () => {
        window._plainObject = { test: 'value' };
    });
});

Given('I have an array [1, 2, 3]', async function() {
    await setPlain(this, () => {
        window._plainArray = [1, 2, 3];
    });
});

When('I wrap it with bindx\\(\\)', async function() {
    this.wrapError = null;
    try {
        await wrap(this);
    } catch (e) {
        this.wrapError = e;
    }
});

When('I wrap it with bindx with deep option true', async function() {
    await wrap(this, { deep: true });
});

When('I wrap it with bindx with deep option false', async function() {
    await wrap(this, { deep: false });
});

When('I set a property to a new value', async function() {
    await this.page.evaluate(() => {
        window._reactive.value = 999;
    });
});

When('I set {word} to {int} again', async function(key, value) {
    await this.page.evaluate(([k, v]) => {
        window._changes = [];
        window._reactive[k] = v;
    }, [key, value]);
});

Then('property reads should be tracked', async function() {
    // A computed that reads count must recompute when count changes, which
    // only happens if the read was tracked as a dependency.
    const values = await this.page.evaluate(() => {
        const r = window._reactive;
        const total = window.bindX.computed(() => r.count + 1);
        const before = total();
        r.count = 10;
        const after = total();
        r.count = 0;
        window._changes = [];
        return [before, after];
    });
    assert.deepStrictEqual(values, [1, 11], 'Property reads should be tracked');
});

Then('property writes should trigger notifications', async function() {
    await this.page.evaluate(() => {
        window._reactive.count = 1;
    });
    assert.deepStrictEqual(await changes(this), [['count', 1]]);
});

Then('nested property changes should trigger notifications', async function() {
    await this.page.evaluate(() => {
        window._changes = [];
        window._reactive.user.name = 'Bob';
    });
    const list = await changes(this);
    assert.strictEqual(list.length, 1, 'Nested changes should trigger notifications');
    assert.strictEqual(list[0][1], 'Bob');
});

Then('the notification path should be {string}', async function(path) {
    const list = await changes(this);
    assert.strictEqual(list[list.length - 1][0], path);
});

Then('top-level changes trigger notifications', async function() {
    await this.page.evaluate(() => {
        window._changes = [];
        window._reactive.topLevel = 'changed';
    });
    assert.deepStrictEqual(await changes(this), [['topLevel', 'changed']],
        'Top-level changes trigger notifications');
});

Then('nested property changes do not trigger notifications', async function() {
    const result = await this.page.evaluate(() => {
        window._changes = [];
        window._reactive.user.name = 'NotNotified';
        return { changes: window._changes, stored: window._plainObject.user.name };
    });
    assert.strictEqual(result.stored, 'NotNotified', 'the nested write should still be stored');
    assert.deepStrictEqual(result.changes, [], 'Nested changes should not notify in shallow mode');
});

Then('it should not cause infinite recursion', async function() {
    assert.ifError(this.wrapError);
    const name = await this.page.evaluate(() => window._reactive.self.self.self.name);
    assert.strictEqual(name, 'circular');
});

Then('it should handle the circular reference gracefully', async function() {
    const result = await this.page.evaluate(() => {
        window._changes = [];
        window._reactive.name = 'renamed';
        return {
            changes: window._changes,
            selfName: window._reactive.self.name,
            keys: Object.keys(window._reactive)
        };
    });
    assert.deepStrictEqual(result.changes, [['name', 'renamed']]);
    assert.strictEqual(result.selfName, 'renamed', 'self should point back at the same object');
    assert.deepStrictEqual(result.keys, ['name', 'self']);
});

Then('the onChange callback should be invoked', async function() {
    const list = await changes(this);
    assert.strictEqual(list.length, 1, 'onChange callback should be invoked');
});

Then('it should receive the path and new value', async function() {
    assert.deepStrictEqual(await changes(this), [['value', 999]]);
});

Then('the onChange callback should not be invoked', async function() {
    assert.deepStrictEqual(await changes(this), [], 'onChange should not be invoked for same value');
});

Then('the proxy should be marked as reactive', async function() {
    const marked = await this.page.evaluate(() => ({
        flag: window._reactive.__bindx_proxy__,
        isReactive: window.bindX.isReactive(window._reactive),
        plainIsReactive: window.bindX.isReactive(window._plainObject)
    }));
    assert.deepStrictEqual(marked, { flag: true, isReactive: true, plainIsReactive: false },
        'Proxy should be marked as reactive');
});

Then('the original object should be preserved', async function() {
    const result = await this.page.evaluate(() => {
        const plain = window._plainObject;
        const before = JSON.stringify(plain);
        window._reactive.test = 'changed';
        return { before, after: plain.test, notSame: plain !== window._reactive };
    });
    assert.strictEqual(result.before, '{"test":"value"}');
    assert.strictEqual(result.after, 'changed', 'writes should reach the original object');
    assert.ok(result.notSame, 'the proxy should wrap the original, not replace it');
});

Then('array mutations should trigger notifications', async function() {
    const result = await this.page.evaluate(() => {
        window._changes = [];
        window._reactive.push(4);
        return { changes: window._changes, plain: window._plainArray.slice() };
    });
    assert.deepStrictEqual(result.plain, [1, 2, 3, 4]);
    assert.ok(result.changes.some(([path, value]) => path === '3' && value === 4),
        `Array mutations should trigger notifications, got ${JSON.stringify(result.changes)}`);
});

Then('array access should work normally', async function() {
    const result = await this.page.evaluate(() => ({
        first: window._reactive[0],
        length: window._reactive.length,
        isArray: Array.isArray(window._reactive),
        mapped: window._reactive.map(n => n * 2)
    }));
    assert.deepStrictEqual(result, { first: 1, length: 4, isArray: true, mapped: [2, 4, 6, 8] });
});
