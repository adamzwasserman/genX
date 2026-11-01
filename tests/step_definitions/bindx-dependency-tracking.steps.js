/**
 * Step definitions for bindX Dependency Tracking
 * Covers: bindx-dependency-tracking.feature
 *
 * Uses bindX's tracker on the fixture page: window.__bxi.withTracking (the
 * function computed() runs its getter in) and the computed state kept in
 * window.__bxi.computedCache. Dependencies are reported as paths; a computed
 * read inside another shows as "<computed:NAME>".
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { mountBindx, render } = require('../support/bindx-fixture');

const useData = async (world, data) => {
    await mountBindx(world);
    await world.page.evaluate(d => {
        window._testData = d; 
    }, data);
    await render(world);
};

// Runs fn (a function body over `r`, the reactive data) under withTracking
const track = (page, body) => page.evaluate((b) => {
    const fn = new Function('r', b);
    const { dependencies } = window.__bxi.withTracking(() => fn(window._reactive));
    return [...dependencies].map(String);
}, body);

// Dependencies recorded in a computed's state, with computeds named
const computedDeps = (page, name) => page.evaluate((n) => {
    const names = new Map(Object.entries(window._computed).map(([k, v]) => [v, k]));
    const state = window.__bxi.computedCache.get(window._computed[n]);
    return [...state.dependencies].map(d => (typeof d === 'function' ? `<computed:${names.get(d)}>` : d)).sort();
}, name);

// ============================================================================
// SETUP STEPS
// ============================================================================

Given('I have a reactive object with properties {word}={int} and {word}={int}', async function(key1, val1, key2, val2) {
    await useData(this, { [key1]: val1, [key2]: val2 });
});

// 'I have a reactive object with ...=...' lives in bindx-batched-updates.steps.js.

Given('I have a reactive object with {word}.{word}={string}', async function(obj, prop, value) {
    await useData(this, { [obj]: { [prop]: value } });
});

Given('I have a computed property with dependencies \\{{word}, {word}}', async function(dep1, dep2) {
    await useData(this, { [dep1]: 1, [dep2]: 2 });
    await this.page.evaluate(([d1, d2]) => {
        const r = window._reactive;
        window.__readSecond = true;
        window._computed = { c: window.bindX.computed(() => (window.__readSecond ? r[d1] + r[d2] : r[d1])) };
        window._computed.c();
    }, [dep1, dep2]);
    assert.deepStrictEqual(await computedDeps(this.page, 'c'), [dep1, dep2].sort());
    this.oldDeps = [dep1, dep2];
});

Given('I have a reactive object with data', async function() {
    await useData(this, { data: { value: 42, factor: 2 } });
});

Given('I have a reactive array [1, 2, 3]', async function() {
    await useData(this, { items: [1, 2, 3] });
});

// ============================================================================
// ACTION STEPS
// ============================================================================

When('I execute a computed function that reads both properties', async function() {
    this.trackedDeps = await track(this.page, 'return r.a + r.b;');
});

When('I execute computed{int} that reads {word} and {word}', async function(computedNum, prop1, prop2) {
    this[`computed${computedNum}Deps`] = await track(this.page, `return r.${prop1} + r.${prop2};`);
});

When('I execute a computation that reads {word}.{word}', async function(obj, prop) {
    this.trackedDeps = await track(this.page, `return r.${obj}.${prop};`);
});

When('I recompute and now it only reads \\{{word}}', async function(dep) {
    await this.page.evaluate((d) => {
        window.__readSecond = false;
        window._reactive[d] = window._reactive[d] + 1; // invalidates
        window._computed.c();
    }, dep);
});

When('I read {word} outside of a tracked computation', async function(prop) {
    this.outsideDeps = await this.page.evaluate((p) => {
        // Read with no context, then open one: nothing may leak into it
        const value = window._reactive[p];
        const { dependencies } = window.__bxi.withTracking(() => null);
        return { value, deps: [...dependencies] };
    }, prop);
});

When('I execute computed{int} that calls computed{int} internally', async function(outer, inner) {
    await this.page.evaluate(([o, i]) => {
        const r = window._reactive;
        const innerFn = window.bindX.computed(() => r.data.value);
        const outerFn = window.bindX.computed(() => innerFn() * r.data.factor);
        window._computed = { [`computed${i}`]: innerFn, [`computed${o}`]: outerFn };
        window.__outerFirst = outerFn();
    }, [outer, inner]);
    this.outerName = `computed${outer}`;
    this.innerName = `computed${inner}`;
});

When('I execute a computation that reads items[0]', async function() {
    this.trackedDeps = await track(this.page, 'return r.items[0];');
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('both {string} and {string} should be in the dependency set', function(dep1, dep2) {
    assert.ok(this.trackedDeps.includes(dep1), `${dep1} should be tracked (${this.trackedDeps})`);
    assert.ok(this.trackedDeps.includes(dep2), `${dep2} should be tracked (${this.trackedDeps})`);
});

Then('computed{int} dependencies should be \\{{word}, {word}}', function(computedNum, dep1, dep2) {
    assert.deepStrictEqual([...this[`computed${computedNum}Deps`]].sort(), [dep1, dep2].sort());
});

Then('dependencies should include {string}', function(dep) {
    assert.ok(this.trackedDeps.includes(dep), `Should include dependency: ${dep} (${this.trackedDeps})`);
});

Then('old dependencies should be cleared', async function() {
    const deps = await computedDeps(this.page, 'c');
    const dropped = this.oldDeps.filter(d => !deps.includes(d));
    assert.strictEqual(dropped.length, 1, `One old dependency should be dropped, deps now ${deps}`);
    // A write to the dropped dependency no longer invalidates the cache
    const cached = await this.page.evaluate((d) => {
        window._reactive[d] = 100;
        return window.__bxi.computedCache.get(window._computed.c).cached;
    }, dropped[0]);
    assert.strictEqual(cached, true);
});

Then('new dependencies should be \\{{word}}', async function(dep) {
    assert.deepStrictEqual(await computedDeps(this.page, 'c'), [dep]);
});

Then('no dependencies should be tracked', function() {
    assert.deepStrictEqual(this.outsideDeps.deps, []);
    assert.strictEqual(typeof this.outsideDeps.value, 'number');
});

Then('computed{int} should track its own dependencies', async function(computedNum) {
    const name = `computed${computedNum}`;
    const deps = await computedDeps(this.page, name);
    const expected = name === this.outerName
        ? ['data', 'data.factor', `<computed:${this.innerName}>`].sort()
        : ['data', 'data.value'];
    assert.deepStrictEqual(deps, expected);
});

Then('they should not interfere with each other', async function() {
    const state = await this.page.evaluate(([o, i]) => {
        const cache = window.__bxi.computedCache;
        const outer = window._computed[o];
        const inner = window._computed[i];
        window._reactive.data.factor = 3; // outer only
        const innerCachedAfterFactor = cache.get(inner).cached;
        const outerAfterFactor = outer();
        window._reactive.data.value = 10; // inner, and outer through it
        return {
            first: window.__outerFirst,
            innerCachedAfterFactor,
            outerAfterFactor,
            outerCachedAfterValue: cache.get(outer).cached,
            outerAfterValue: outer(),
            innerAfterValue: inner()
        };
    }, [this.outerName, this.innerName]);
    assert.strictEqual(state.first, 84);
    assert.strictEqual(state.innerCachedAfterFactor, true, 'factor is not a dependency of the inner computed');
    assert.strictEqual(state.outerAfterFactor, 126);
    assert.strictEqual(state.outerCachedAfterValue, false, 'Changing the inner computed should invalidate the outer');
    assert.strictEqual(state.outerAfterValue, 30);
    assert.strictEqual(state.innerAfterValue, 10);
});

Then('{string} should be tracked as a dependency', function(dep) {
    assert.ok(this.trackedDeps.includes(dep), `${dep} should be tracked (${this.trackedDeps})`);
});
