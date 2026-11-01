/**
 * Step definitions for bindX Batched Updates
 * Covers: bindx-batched-updates.feature
 *
 * Runs on the bindX fixture page. Writes go through the reactive proxy, which
 * schedules each path on bindX's batch queue (bindX.getBatchQueue(), the
 * documented API). Some scenarios hold animation frames: requestAnimationFrame
 * callbacks are kept in window.__heldFrames until released, so "before the
 * frame completes" is deterministic. A flush logs "bindX: Update <path>" with
 * console.debug for every path it runs.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { mountBindx, render, nextFrames } = require('../support/bindx-fixture');

const useData = async (world, data) => {
    await mountBindx(world);
    await world.page.evaluate(d => {
        window._testData = d; 
    }, data);
    await render(world);
    await nextFrames(world);
    world.updateMark = world.consoleMessages.length;
};

const holdFrames = page => page.evaluate(() => {
    window.__heldFrames = [];
    window.__realRaf = window.requestAnimationFrame;
    window.__realCaf = window.cancelAnimationFrame;
    window.requestAnimationFrame = cb => window.__heldFrames.push(cb);
    window.cancelAnimationFrame = id => {
        window.__heldFrames[id - 1] = null; 
    };
});

const releaseFrames = page => page.evaluate(() => {
    window.requestAnimationFrame = window.__realRaf;
    window.cancelAnimationFrame = window.__realCaf;
    const held = window.__heldFrames.filter(Boolean);
    window.__heldFrames = [];
    held.forEach(cb => cb(performance.now()));
    return held.length;
});

const queueState = page => page.evaluate(() => {
    const queue = window.bindX.getBatchQueue();
    return { pending: Object.fromEntries(queue.getPending()), scheduled: queue.isScheduled() };
});

const flushedPaths = world => world.consoleMessages.slice(world.updateMark)
    .filter(m => m.text.startsWith('bindX: Update '))
    .map(m => m.text.slice('bindX: Update '.length).split(' = ')[0]);

const write = (page, values) => page.evaluate(v => {
    Object.entries(v).forEach(([k, val]) => {
        window._reactive[k] = val; 
    });
}, values);

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

Given('I have a reactive object with {word}={int}, {word}={int}, and {word}={int}', async function(k1, v1, k2, v2, k3, v3) {
    await useData(this, { [k1]: v1, [k2]: v2, [k3]: v3 });
});

Given('I have {int} reactive properties', async function(count) {
    const data = {};
    for (let i = 0; i < count; i++) {
        data[`prop${i}`] = i;
    }
    await useData(this, data);
    this.propCount = count;
});

Given('I have batched updates pending', async function() {
    await useData(this, { a: 1, b: 2 });
    await holdFrames(this.page);
    await write(this.page, { a: 100, b: 200 });
    const state = await queueState(this.page);
    assert.deepStrictEqual(state.pending, { a: 100, b: 200 });
});

Given('I have a reactive object with {word}={int}', async function(key, value) {
    await useData(this, { [key]: value });
    await holdFrames(this.page);
});

Given('I have a batch queue with pending updates', async function() {
    await useData(this, { a: 0, b: 0, c: 0, d: 0 });
    await holdFrames(this.page);
    await write(this.page, { a: 1, b: 2 });
});

Given('I have an empty batch queue', async function() {
    await useData(this, { a: 0 });
    await this.page.evaluate(() => window.bindX.getBatchQueue().flush());
    const state = await queueState(this.page);
    assert.deepStrictEqual(state, { pending: {}, scheduled: false });
});

Given('I have pending updates in the queue', async function() {
    await useData(this, { pending1: 0, pending2: 0 });
    await write(this.page, { pending1: 1, pending2: 2 });
    const state = await queueState(this.page);
    assert.strictEqual(state.scheduled, true);
});

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

When('I synchronously set {word}={int}, {word}={int}, {word}={int}', async function(k1, v1, k2, v2, k3, v3) {
    await holdFrames(this.page);
    await write(this.page, { [k1]: v1, [k2]: v2, [k3]: v3 });
    this.expected = { [k1]: v1, [k2]: v2, [k3]: v3 };
});

When('I update all {int} properties synchronously', async function(count) {
    await holdFrames(this.page);
    await this.page.evaluate((c) => {
        for (let i = 0; i < c; i++) {
            window._reactive[`prop${i}`] = i * 10;
        }
    }, count);
});

When('I call flushBatchQueue\\(\\)', async function() {
    await this.page.evaluate(() => window.bindX.getBatchQueue().flush());
});

When('I set {word}={int}', async function(key, value) {
    await write(this.page, { [key]: value });
});

When('before the frame completes', async function() {
    const held = await this.page.evaluate(() => window.__heldFrames.filter(Boolean).length);
    assert.strictEqual(held, 1, 'The frame should still be pending');
});

When('I schedule more updates', async function() {
    await write(this.page, { c: 3, d: 4 });
});

When('the RAF callback fires', async function() {
    await nextFrames(this);
});

When('the batch flushes', async function() {
    await nextFrames(this);
});

// ----------------------------------------------------------------------------
// Assertions
// ----------------------------------------------------------------------------

Then('only ONE batch update should be scheduled', async function() {
    const state = await queueState(this.page);
    const held = await this.page.evaluate(() => window.__heldFrames.filter(Boolean).length);
    assert.strictEqual(held, 1, `Expected one animation frame request, got ${held}`);
    assert.deepStrictEqual(state.pending, this.expected);
    assert.strictEqual(state.scheduled, true);
    assert.deepStrictEqual(flushedPaths(this), [], 'Nothing should flush before the frame');
});

Then('it should happen on next requestAnimationFrame', async function() {
    await releaseFrames(this.page);
    const state = await queueState(this.page);
    assert.deepStrictEqual(state, { pending: {}, scheduled: false });
    assert.deepStrictEqual(flushedPaths(this).sort(), Object.keys(this.expected).sort());
});

Then('updates should batch within single frame', async function() {
    const held = await this.page.evaluate(() => window.__heldFrames.filter(Boolean).length);
    assert.strictEqual(held, 1);
    await releaseFrames(this.page);
    assert.strictEqual(flushedPaths(this).length, this.propCount);
});

Then('total batch processing time should be less than {int}ms', async function(maxMs) {
    // @perf only: times one flush of the batch
    const ms = await this.page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
            window._reactive[`prop${i}`] = -i;
        }
        const start = performance.now();
        window.bindX.getBatchQueue().flush();
        return performance.now() - start;
    });
    assert.ok(ms < maxMs, `Batch processing took ${ms}ms`);
});

Then('all pending updates execute immediately', async function() {
    assert.deepStrictEqual(flushedPaths(this).sort(), ['a', 'b']);
});

Then('RAF queue is cleared', async function() {
    const state = await queueState(this.page);
    assert.deepStrictEqual(state, { pending: {}, scheduled: false });
    const held = await this.page.evaluate(() => window.__heldFrames.filter(Boolean).length);
    assert.strictEqual(held, 0, 'The scheduled frame should be cancelled');
    await releaseFrames(this.page);
});

Then('only the final value \\({int}\\) should be in the batch queue', async function(finalValue) {
    const state = await queueState(this.page);
    assert.deepStrictEqual(state.pending, { count: finalValue });
    await releaseFrames(this.page);
    const flushed = this.consoleMessages.slice(this.updateMark)
        .filter(m => m.text.startsWith('bindX: Update count'));
    assert.strictEqual(flushed.length, 1);
    assert.ok(flushed[0].text.endsWith(`= ${finalValue}`), flushed[0].text);
});

Then('only one RAF callback should be scheduled', async function() {
    const held = await this.page.evaluate(() => window.__heldFrames.filter(Boolean).length);
    assert.strictEqual(held, 1);
    const state = await queueState(this.page);
    assert.deepStrictEqual(state.pending, { a: 1, b: 2, c: 3, d: 4 });
    await releaseFrames(this.page);
});

Then('no updates should execute', async function() {
    assert.deepStrictEqual(flushedPaths(this), []);
});

Then('the queue should be empty', async function() {
    const state = await queueState(this.page);
    assert.deepStrictEqual(state.pending, {});
    assert.deepStrictEqual(flushedPaths(this).sort(), ['pending1', 'pending2']);
});

Then('the scheduled flag should be false', async function() {
    const state = await queueState(this.page);
    assert.strictEqual(state.scheduled, false);
});
