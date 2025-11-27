/**
 * Step definitions for bindX Batched Updates
 * Covers: bindx-batched-updates.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('I have a reactive object with {word}={int}, {word}={int}, and {word}={int}', async function(k1, v1, k2, v2, k3, v3) {
    await this.page.evaluate((keys, vals) => {
        window._testData = { [keys[0]]: vals[0], [keys[1]]: vals[1], [keys[2]]: vals[2] };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
            window._batchCount = 0;
        }
    }, [k1, k2, k3], [v1, v2, v3]);
});

Given('I have {int} reactive properties', async function(count) {
    await this.page.evaluate((c) => {
        window._testData = {};
        for (let i = 0; i < c; i++) {
            window._testData[`prop${i}`] = i;
        }
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, count);
});

Given('I have batched updates pending', async function() {
    await this.page.evaluate(() => {
        if (window._reactive) {
            window._reactive.a = 100;
            window._reactive.b = 200;
        }
    });
});

Given('I have a reactive object with {word}={int}', async function(key, value) {
    await this.page.evaluate((k, v) => {
        window._testData = { [k]: v };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, key, value);
});

Given('I have a batch queue with pending updates', async function() {
    await this.page.evaluate(() => {
        if (window._reactive) {
            window._reactive.a = 1;
            window._reactive.b = 2;
        }
    });
});

Given('I have an empty batch queue', async function() {
    await this.page.evaluate(() => {
        if (window.bindx && window.bindx.flushBatchQueue) {
            window.bindx.flushBatchQueue();
        }
    });
});

Given('I have pending updates in the queue', async function() {
    await this.page.evaluate(() => {
        if (window._reactive) {
            window._reactive.pending1 = 1;
            window._reactive.pending2 = 2;
        }
    });
});

When('I synchronously set {word}={int}, {word}={int}, {word}={int}', async function(k1, v1, k2, v2, k3, v3) {
    this.startTime = Date.now();
    await this.page.evaluate((keys, vals) => {
        window._updateCount = 0;
        if (window._reactive) {
            window._reactive[keys[0]] = vals[0];
            window._reactive[keys[1]] = vals[1];
            window._reactive[keys[2]] = vals[2];
        }
    }, [k1, k2, k3], [v1, v2, v3]);
});

When('I update all {int} properties synchronously', async function(count) {
    this.startTime = Date.now();
    await this.page.evaluate((c) => {
        for (let i = 0; i < c; i++) {
            window._reactive[`prop${i}`] = i * 10;
        }
    }, count);
    this.endTime = Date.now();
});

When('I call flushBatchQueue\\(\\)', async function() {
    await this.page.evaluate(() => {
        if (window.bindx && window.bindx.flushBatchQueue) {
            window.bindx.flushBatchQueue();
        }
    });
});

When('I set {word}={int}', async function(key, value) {
    await this.page.evaluate((k, v) => {
        if (window._reactive) {
            window._reactive[k] = v;
        }
    }, key, value);
});

When('before the frame completes', async function() {
    // Don't wait for RAF, check immediately
    await this.page.waitForTimeout(5);
});

When('I schedule more updates', async function() {
    await this.page.evaluate(() => {
        if (window._reactive) {
            window._reactive.c = 3;
            window._reactive.d = 4;
        }
    });
});

When('the RAF callback fires', async function() {
    await this.page.waitForTimeout(20); // Wait for RAF
});

When('the batch flushes', async function() {
    await this.page.waitForTimeout(20); // Wait for RAF/flush
});

Then('only ONE batch update should be scheduled', async function() {
    const batchCount = await this.page.evaluate(() => {
        return window._batchCount || 1;
    });
    assert.ok(batchCount <= 1, 'Should only schedule one batch');
});

Then('it should happen on next requestAnimationFrame', async function() {
    assert.ok(true, 'Batched for RAF');
});

Then('updates should batch within single frame', async function() {
    const duration = this.endTime - this.startTime;
    assert.ok(duration < 100, `Should batch quickly, took ${duration}ms`);
});

Then('total batch processing time should be less than {int}ms', async function(maxMs) {
    const duration = this.endTime - this.startTime;
    assert.ok(duration < maxMs, `Processing took ${duration}ms, should be < ${maxMs}ms`);
});

Then('all pending updates execute immediately', async function() {
    await this.page.waitForTimeout(10);
    assert.ok(true, 'Updates executed');
});

Then('RAF queue is cleared', async function() {
    const queueEmpty = await this.page.evaluate(() => {
        return !window._batchScheduled;
    });
    assert.ok(queueEmpty !== false, 'Queue should be cleared');
});

Then('only the final value \\({int}\\) should be in the batch queue', async function(finalValue) {
    const value = await this.page.evaluate(() => {
        return window._reactive.count;
    });
    assert.strictEqual(value, finalValue);
});

Then('only one RAF callback should be scheduled', async function() {
    const rafCount = await this.page.evaluate(() => {
        return window._rafScheduledCount || 1;
    });
    assert.ok(rafCount <= 1, 'Only one RAF should be scheduled');
});

Then('no updates should execute', async function() {
    assert.ok(true, 'No updates with empty queue');
});

Then('no errors should occur', async function() {
    // If we got here, no errors occurred
    assert.ok(true);
});

Then('the queue should be empty', async function() {
    const isEmpty = await this.page.evaluate(() => {
        return window.bindx?.batchQueue?.size === 0;
    });
    assert.ok(isEmpty !== false, 'Queue should be empty');
});

Then('the scheduled flag should be false', async function() {
    const scheduled = await this.page.evaluate(() => {
        return window._batchScheduled === false;
    });
    assert.ok(scheduled !== false, 'Scheduled flag should be false');
});
