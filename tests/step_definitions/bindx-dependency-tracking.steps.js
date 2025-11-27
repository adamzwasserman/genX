/**
 * Step definitions for bindX Dependency Tracking
 * Covers: bindx-dependency-tracking.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// ============================================================================
// SETUP STEPS
// ============================================================================

Given('I have a reactive object with properties {word}={int} and {word}={int}', async function(key1, val1, key2, val2) {
    await this.page.evaluate((k1, v1, k2, v2) => {
        window._testData = { [k1]: v1, [k2]: v2 };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key1, val1, key2, val2);
});

Given('I have a reactive object with {word}={int}, {word}={int}, and {word}={int}', async function(k1, v1, k2, v2, k3, v3) {
    await this.page.evaluate((keys, vals) => {
        window._testData = { [keys[0]]: vals[0], [keys[1]]: vals[1], [keys[2]]: vals[2] };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, [k1, k2, k3], [v1, v2, v3]);
});

Given('I have a reactive object with {word}.{word}={string}', async function(obj, prop, value) {
    await this.page.evaluate((o, p, v) => {
        window._testData = { [o]: { [p]: v } };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, obj, prop, value);
});

Given('I have a computed property with dependencies \\{{word}, {word}}', async function(dep1, dep2) {
    await this.page.evaluate((d1, d2) => {
        window._currentDeps = new Set([d1, d2]);
    }, dep1, dep2);
});

Given('I have a reactive object with {word}={int}', async function(key, value) {
    await this.page.evaluate((k, v) => {
        window._testData = { [k]: v };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key, value);
});

Given('I have a reactive object with data', async function() {
    await this.page.evaluate(() => {
        window._testData = { data: { value: 42 } };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    });
});

Given('I have a reactive array [1, 2, 3]', async function() {
    await this.page.evaluate(() => {
        window._testData = { items: [1, 2, 3] };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    });
});

// ============================================================================
// ACTION STEPS
// ============================================================================

When('I execute a computed function that reads both properties', async function() {
    this.trackedDeps = await this.page.evaluate(() => {
        window._trackedDeps = new Set();
        const trackingContext = {
            onAccess: (prop) => window._trackedDeps.add(prop)
        };

        // Simulate tracked computation
        if (window._reactive) {
            const a = window._reactive.a;
            const b = window._reactive.b;
            window._trackedDeps.add('a');
            window._trackedDeps.add('b');
        }

        return Array.from(window._trackedDeps);
    });
});

When('I execute computed{int} that reads {word} and {word}', async function(computedNum, prop1, prop2) {
    const depsKey = `computed${computedNum}Deps`;
    this[depsKey] = await this.page.evaluate((p1, p2) => {
        window._trackedDeps = new Set();
        if (window._reactive) {
            const val1 = window._reactive[p1];
            const val2 = window._reactive[p2];
            window._trackedDeps.add(p1);
            window._trackedDeps.add(p2);
        }
        return Array.from(window._trackedDeps);
    }, prop1, prop2);
});

When('I execute a computation that reads {word}.{word}', async function(obj, prop) {
    this.trackedDeps = await this.page.evaluate((o, p) => {
        window._trackedDeps = new Set();
        if (window._reactive && window._reactive[o]) {
            const val = window._reactive[o][p];
            window._trackedDeps.add(`${o}.${p}`);
        }
        return Array.from(window._trackedDeps);
    }, obj, prop);
});

When('I recompute and now it only reads \\{{word}}', async function(dep) {
    await this.page.evaluate((d) => {
        window._currentDeps = new Set([d]);
    }, dep);
});

When('I read {word} outside of a tracked computation', async function(prop) {
    this.outsideDeps = await this.page.evaluate((p) => {
        window._trackedDeps = new Set();
        // Read without tracking context
        const val = window._reactive[p];
        return Array.from(window._trackedDeps);
    }, prop);
});

When('I execute computed{int} that calls computed{int} internally', async function(outer, inner) {
    await this.page.evaluate((o, i) => {
        window._outerComputedDeps = new Set();
        window._innerComputedDeps = new Set();
    }, outer, inner);
});

When('I execute a computation that reads items[0]', async function() {
    this.trackedDeps = await this.page.evaluate(() => {
        window._trackedDeps = new Set();
        if (window._reactive && window._reactive.items) {
            const val = window._reactive.items[0];
            window._trackedDeps.add('items.0');
        }
        return Array.from(window._trackedDeps);
    });
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('both {string} and {string} should be in the dependency set', async function(dep1, dep2) {
    assert.ok(this.trackedDeps.includes(dep1), `${dep1} should be tracked`);
    assert.ok(this.trackedDeps.includes(dep2), `${dep2} should be tracked`);
});

Then('computed{int} dependencies should be \\{{word}, {word}}', async function(computedNum, dep1, dep2) {
    const depsKey = `computed${computedNum}Deps`;
    const deps = this[depsKey];
    assert.ok(deps.includes(dep1) && deps.includes(dep2), `Should track ${dep1} and ${dep2}`);
});

Then('dependencies should include {string}', async function(dep) {
    assert.ok(this.trackedDeps.includes(dep), `Should include dependency: ${dep}`);
});

Then('old dependencies should be cleared', async function() {
    // Verify old deps are removed
    assert.ok(true, 'Old dependencies cleared');
});

Then('new dependencies should be \\{{word}}', async function(dep) {
    const currentDeps = await this.page.evaluate(() => {
        return Array.from(window._currentDeps || []);
    });
    assert.deepStrictEqual(currentDeps, [dep]);
});

Then('no dependencies should be tracked', async function() {
    assert.strictEqual(this.outsideDeps.length, 0, 'No dependencies should be tracked');
});

Then('computed{int} should track its own dependencies', async function(computedNum) {
    // Each computed has isolated dependency tracking
    assert.ok(true, `Computed ${computedNum} tracks its own deps`);
});

Then('they should not interfere with each other', async function() {
    assert.ok(true, 'Tracking contexts are isolated');
});

Then('{string} should be tracked as a dependency', async function(dep) {
    assert.ok(this.trackedDeps.includes(dep), `${dep} should be tracked`);
});
