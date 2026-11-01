/**
 * Step definitions for bindX Computed Properties
 * Covers: bindx-computed-properties.feature
 *
 * Each "computed property NAME = () => EXPR" line becomes a real
 * bindX.computed() on the fixture page. EXPR reads `data`, a view of the
 * reactive data in which computed names resolve to their computed values, so
 * "data.squared" reads the squared computed. window._evals counts how often
 * each computed function actually runs.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { mountBindx, render, setData } = require('../support/bindx-fixture');

const useData = async (world, data) => {
    await mountBindx(world);
    await world.page.evaluate(d => { window._testData = d; }, data);
    await render(world);
};

// ============================================================================
// SETUP STEPS
// ============================================================================

// {float} also matches integers, so one step covers 'I have reactive data { a: 2, b: 3 }'.
Given('I have reactive data \\{ {word}: {int}, {word}: {float} }', async function(key1, val1, key2, val2) {
    await useData(this, { [key1]: val1, [key2]: val2 });
});

Given('I have reactive data \\{ {word}: {int} }', async function(key, value) {
    await useData(this, { [key]: value });
});

Given(/^(?:I have )?computed property (\w+) = \(\) => (.+)$/, async function(name, expr) {
    if (!this.bx || !this.bx.rendered) {
        // Scenarios without a data line compute over a = 1, b = 2
        await useData(this, { a: 1, b: 2 });
    }
    await this.page.evaluate(([n, e]) => {
        window._computed = window._computed || {};
        window._evals = window._evals || {};
        window._evals[n] = 0;
        if (!window._dataView) {
            window._dataView = new Proxy({}, {
                get: (_, key) => (key in window._computed ? window._computed[key]() : window._reactive[key])
            });
        }
        if (!window.heavyComputation) {
            window._heavyCount = 0;
            window.heavyComputation = () => { window._heavyCount++; return 42; };
        }
        const body = new Function('data', 'heavyComputation', `return (${e});`);
        // A named function, so cycle errors name the computed
        const fn = { [n]: function() {
            window._evals[n]++;
            return body(window._dataView, window.heavyComputation);
        } }[n];
        window._computed[n] = window.bindX.computed(fn);
    }, [name, expr]);
});

Given('{word} has been computed and cached', async function(name) {
    const state = await this.page.evaluate((n) => {
        const value = window._computed[n]();
        return { value, cached: window.__bxi.computedCache.get(window._computed[n]).cached, evals: window._evals[n] };
    }, name);
    assert.strictEqual(state.cached, true);
    this.cachedValue = state.value;
    this.evalsBefore = state.evals;
});

// ============================================================================
// ACTION STEPS
// ============================================================================

When('I set data.{word} = {float}', async function(key, value) {
    await render(this);
    await setData(this, key, value);
});

When('I read {word} {int} times without data changes', async function(name, count) {
    this.readResults = await this.page.evaluate(([n, c]) => {
        const results = [];
        for (let i = 0; i < c; i++) {
            results.push(window._computed[n]());
        }
        return results;
    }, [name, count]);
});

When('I change data.{word}', async function(key) {
    await this.page.evaluate((k) => { window._reactive[k] = 999; }, key);
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('{word} should equal {int}', async function(name, expected) {
    const result = await this.page.evaluate((n) => window._computed[n](), name);
    assert.strictEqual(result, expected);
});

Then('{word} should automatically recompute to {int}', async function(name, expected) {
    const state = await this.page.evaluate((n) => {
        const before = window._evals[n];
        const value = window._computed[n]();
        return { value, ran: window._evals[n] - before };
    }, name);
    assert.strictEqual(state.value, expected);
    assert.strictEqual(state.ran, 1, 'The change should invalidate the cache so the read recomputes');
});

Then('attempting to evaluate should throw CircularDependencyError', async function() {
    this.cycleError = await this.page.evaluate(() => {
        try {
            window._computed.a();
            return null;
        } catch (e) {
            return { name: e.name, message: e.message, cycle: e.cycle };
        }
    });
    assert.ok(this.cycleError, 'Should have thrown CircularDependencyError');
    assert.strictEqual(this.cycleError.name, 'CircularDependencyError');
});

Then('error message should show the cycle path', function() {
    const { message, cycle } = this.cycleError;
    assert.ok(cycle.length > 0, 'Error should carry the cycle');
    assert.ok(cycle.every(n => n === 'a' || n === 'b'), `Cycle ${cycle} should name the computeds`);
    assert.ok(message.includes(cycle.join(' → ')), `Message "${message}" should show the cycle`);
});

Then('heavyComputation should only execute once', async function() {
    const count = await this.page.evaluate(() => window._heavyCount);
    assert.strictEqual(count, 1);
});

Then('{int} reads should hit cache', async function(hits) {
    const evals = await this.page.evaluate(() => window._evals.expensive);
    assert.strictEqual(this.readResults.length - evals, hits);
    assert.ok(this.readResults.every(v => v === this.readResults[0]), 'Cached reads should return the same value');
});

Then('cache should be invalidated', async function() {
    const cached = await this.page.evaluate(() => window.__bxi.computedCache.get(window._computed.sum).cached);
    assert.strictEqual(cached, false);
});

Then('next read should recompute', async function() {
    const state = await this.page.evaluate(() => ({ value: window._computed.sum(), evals: window._evals.sum }));
    assert.strictEqual(state.evals, this.evalsBefore + 1);
    assert.notStrictEqual(state.value, this.cachedValue);
});
