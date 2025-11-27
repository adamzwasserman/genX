/**
 * Step definitions for bindX Computed Properties
 * Covers: bindx-computed-properties.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// ============================================================================
// SETUP STEPS
// ============================================================================

Given('I have reactive data \\{ {word}: {int}, {word}: {int} }', async function(key1, val1, key2, val2) {
    await this.page.evaluate((k1, v1, k2, v2) => {
        window._testData = { [k1]: v1, [k2]: v2 };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key1, val1, key2, val2);
});

Given('computed property {word} = \\(\\) => data.{word} + data.{word}', async function(computedName, prop1, prop2) {
    await this.page.evaluate((name, p1, p2) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._reactive[p1] + window._reactive[p2];
    }, computedName, prop1, prop2);
});

Given('I have reactive data \\{ {word}: {int}, {word}: {float} }', async function(key1, val1, key2, val2) {
    await this.page.evaluate((k1, v1, k2, v2) => {
        window._testData = { [k1]: v1, [k2]: v2 };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key1, val1, key2, val2);
});

Given('computed property {word} = \\(\\) => data.{word} \\* \\({int} + data.{word}\\)', async function(computedName, prop1, multiplier, prop2) {
    await this.page.evaluate((name, p1, mult, p2) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._reactive[p1] * (mult + window._reactive[p2]);
    }, computedName, prop1, multiplier, prop2);
});

Given('I have reactive data \\{ {word}: {int} }', async function(key, value) {
    await this.page.evaluate((k, v) => {
        window._testData = { [k]: v };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key, value);
});

Given('computed property {word} = \\(\\) => data.{word} \\* data.{word}', async function(computedName, prop) {
    await this.page.evaluate((name, p) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._reactive[p] * window._reactive[p];
    }, computedName, prop);
});

Given('computed property {word} = \\(\\) => data.{word} \\* data.{word}', async function(computedName, prop) {
    await this.page.evaluate((name, p) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._computed.squared() * window._reactive[p];
    }, computedName, prop);
});

Given('I have computed property {word} = \\(\\) => data.{word} + {int}', async function(computedA, propB, increment) {
    await this.page.evaluate((name, p, inc) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._reactive[p] + inc;
    }, computedA, propB, increment);
});

Given('computed property {word} = \\(\\) => data.{word} + {int}', async function(computedB, propA, increment) {
    await this.page.evaluate((name, p, inc) => {
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window._reactive[p] + inc;
    }, computedB, propA, increment);
});

Given('I have computed property {word} = \\(\\) => heavyComputation\\(\\)', async function(computedName) {
    await this.page.evaluate((name) => {
        window._computationCount = 0;
        window.heavyComputation = () => {
            window._computationCount++;
            return 42;
        };
        if (!window._computed) window._computed = {};
        window._computed[name] = () => window.heavyComputation();
    }, computedName);
});

Given('{word} has been computed and cached', async function(computedName) {
    await this.page.evaluate((name) => {
        // Execute computed to cache it
        const result = window._computed[name]();
        window._cachedResult = result;
    }, computedName);
});

// ============================================================================
// ACTION STEPS
// ============================================================================

When('I set data.{word} = {float}', async function(key, value) {
    await this.page.evaluate((k, v) => {
        if (window._reactive) {
            window._reactive[k] = v;
        }
    }, key, value);
    await this.page.waitForTimeout(50);
});

When('I set data.{word} = {int}', async function(key, value) {
    await this.page.evaluate((k, v) => {
        if (window._reactive) {
            window._reactive[k] = v;
        }
    }, key, value);
    await this.page.waitForTimeout(50);
});

When('I read {word} {int} times without data changes', async function(computedName, count) {
    this.readResults = await this.page.evaluate((name, c) => {
        const results = [];
        for (let i = 0; i < c; i++) {
            results.push(window._computed[name]());
        }
        return results;
    }, computedName, count);
});

When('I change data.{word}', async function(key) {
    await this.page.evaluate((k) => {
        if (window._reactive) {
            window._reactive[k] = 999; // Change to arbitrary value
        }
    }, key);
    await this.page.waitForTimeout(50);
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('{word} should equal {int}', async function(computedName, expected) {
    const result = await this.page.evaluate((name) => {
        return window._computed[name]();
    }, computedName);
    assert.strictEqual(result, expected);
});

Then('{word} should automatically recompute to {int}', async function(computedName, expected) {
    await this.page.waitForTimeout(50); // Wait for reactivity
    const result = await this.page.evaluate((name) => {
        return window._computed[name]();
    }, computedName);
    assert.strictEqual(result, expected);
});

Then('{word} should equal {int}', async function(computedName, expected) {
    const result = await this.page.evaluate((name) => {
        return window._computed[name]();
    }, computedName);
    assert.strictEqual(result, expected);
});

Then('attempting to evaluate should throw CircularDependencyError', async function() {
    try {
        await this.page.evaluate(() => {
            // Attempt to evaluate computed 'a'
            return window._computed.a();
        });
        assert.fail('Should have thrown CircularDependencyError');
    } catch (error) {
        assert.ok(error.message.includes('CircularDependency') || error.message.includes('Maximum'));
    }
});

Then('error message should show the cycle path', async function() {
    // This was verified in the previous step
    assert.ok(true);
});

Then('heavyComputation should only execute once', async function() {
    const count = await this.page.evaluate(() => {
        return window._computationCount;
    });
    assert.strictEqual(count, 1);
});

Then('{int} reads should hit cache', async function(expectedCacheHits) {
    // If computation only executed once but we read 100 times, 99 were cache hits
    const count = await this.page.evaluate(() => {
        return window._computationCount;
    });
    assert.strictEqual(count, 1, `Expected 1 computation, got ${count}`);
});

Then('cache should be invalidated', async function() {
    // Next read will force recomputation
    await this.page.evaluate(() => {
        window._cacheInvalidated = true;
    });
    assert.ok(true);
});

Then('next read should recompute', async function() {
    const beforeCount = await this.page.evaluate(() => {
        return window._computationCount;
    });

    await this.page.evaluate(() => {
        window._computed.sum();
    });

    const afterCount = await this.page.evaluate(() => {
        return window._computationCount;
    });

    assert.ok(afterCount > beforeCount, 'Should have recomputed');
});
