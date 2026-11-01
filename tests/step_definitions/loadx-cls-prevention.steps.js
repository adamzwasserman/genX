/**
 * Step definitions for loadX CLS Prevention with ResizeObserver
 *
 * ResizeObserver is wrapped before loadX loads, so the steps can see which
 * observers loadX creates, what they observe and when they are disconnected,
 * without reaching into module internals.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Installs the ResizeObserver tracker (window.__ro) in the page
function installResizeObserverTracker() {
    const Native = window.ResizeObserver;
    const track = { all: [] };
    window.__ro = track;
    window.ResizeObserver = class extends Native {
        constructor(cb) {
            const rec = { targets: [], disconnected: false, entries: [] };
            super((entries, obs) => {
                entries.forEach(e => rec.entries.push({
                    id: e.target.id,
                    width: Math.round(e.contentRect.width),
                    height: Math.round(e.contentRect.height)
                }));
                return cb(entries, obs);
            });
            this.__rec = rec;
            track.all.push(rec);
        }
        observe(el, opts) { this.__rec.targets.push(el); return super.observe(el, opts); }
        disconnect() { this.__rec.disconnected = true; return super.disconnect(); }
    };
    // Live observers, optionally only those watching the element with this id
    track.live = id => track.all.filter(r => !r.disconnected &&
        (id === undefined || r.targets.some(t => t.id === id)));
}

const api = page => page.evaluateHandle(() => window.__lxApi || window.loadX.init());

async function addElement(world, id, width, height) {
    world.lxLastId = id;
    world.lxDims = world.lxDims || {};
    if (width) world.lxDims[id] = { width, height };
    await world.page.evaluate(({ id, w, h }) => {
        const el = document.createElement('div');
        el.id = id;
        el.textContent = 'Test Button';
        el.style.display = 'inline-block';
        el.style.padding = '0';
        el.style.border = '0';
        if (w) { el.style.width = w; el.style.height = h; }
        document.body.appendChild(el);
    }, { id, w: width, h: height });
}

async function applyTo(page, id, strategy) {
    const handle = await api(page);
    await page.evaluate(([a, id, strategy]) => {
        a.applyLoading(document.getElementById(id), strategy ? { strategy } : {});
    }, [handle, id, strategy]);
}

async function removeFrom(page, id) {
    const handle = await api(page);
    await page.evaluate(([a, id]) => a.removeLoading(document.getElementById(id)), [handle, id]);
}

const inlineMin = (page, id) => page.evaluate(id => {
    const el = document.getElementById(id);
    return { minWidth: el.style.minWidth, minHeight: el.style.minHeight };
}, id);

const computedMin = (page, id) => page.evaluate(id => {
    const s = getComputedStyle(document.getElementById(id));
    return { minWidth: s.minWidth, minHeight: s.minHeight };
}, id);

const liveCount = (page, id) => page.evaluate(id => window.__ro.live(id || undefined).length, id || null);

// Background
Given('I open a test page', async function() {
    await this.page.goto('about:blank');
    await this.page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
});

Given('the page has the loadX script loaded', async function() {
    await this.page.evaluate(installResizeObserverTracker);
    await this.page.addScriptTag({ path: './src/genx-common.js' });
    await this.page.addScriptTag({ path: './src/loadx.js' });
});

// Elements
When('an element with id {string} is added to the DOM', async function(id) {
    await addElement(this, id);
});

When('an element with id {string} is added to the DOM with dimensions {string} x {string}', async function(id, width, height) {
    await addElement(this, id, width, height);
});

When('an element with id {string} is added with dimensions {string} x {string}', async function(id, width, height) {
    await addElement(this, id, width, height);
});

When('the element has width {string} and height {string}', async function(width, height) {
    await this.page.evaluate(({ id, w, h }) => {
        const el = document.getElementById(id);
        el.style.width = w;
        el.style.height = h;
    }, { id: this.lxLastId, w: width, h: height });
});

When('the element has original min-width {string}', async function(minWidth) {
    await this.page.evaluate(({ id, value }) => {
        document.getElementById(id).style.minWidth = value;
    }, { id: this.lxLastId, value: minWidth });
});

// Loading state
When('I apply loading state to the element with strategy {string}', async function(strategy) {
    await applyTo(this.page, this.lxLastId, strategy);
});

When('I remove loading state from the element', async function() {
    await removeFrom(this.page, this.lxLastId);
});

When('I apply loading state to {string} with strategy {string}', async function(id, strategy) {
    await applyTo(this.page, id, strategy);
});

When('I apply {string} strategy to {string}', async function(strategy, id) {
    await applyTo(this.page, id, strategy);
});

When('I call the disconnect API', async function() {
    const handle = await api(this.page);
    await this.page.evaluate(a => a.disconnect(), handle);
});

When('I wait for {int} milliseconds', async function(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
});

When('I simulate a long-running SPA scenario:', async function(docString) {
    const handle = await api(this.page);
    await this.page.evaluate(a => {
        const elements = [];
        for (let i = 0; i < 10; i++) {
            const el = document.createElement('div');
            el.id = `spa-btn-${i}`;
            el.style.cssText = 'display:inline-block;width:200px;height:40px';
            document.body.appendChild(el);
            elements.push(el);
        }
        elements.forEach(el => a.applyLoading(el, { strategy: 'spinner' }));
        window.__spaApplied = window.__ro.live().length;
        elements.forEach(el => a.removeLoading(el));
        for (let i = 0; i < 5; i++) elements[i].remove();
    }, handle);
});

When('I add {int} elements to the DOM', async function(count) {
    await this.page.evaluate(num => {
        for (let i = 0; i < num; i++) {
            const el = document.createElement('div');
            el.id = `perf-btn-${i}`;
            el.style.cssText = 'display:inline-block;width:200px;height:40px';
            document.body.appendChild(el);
        }
    }, count);
});

When('I measure performance while applying loading to all elements', async function() {
    const handle = await api(this.page);
    this.performanceMetrics = await this.page.evaluate(a => {
        const timings = [];
        const start = performance.now();
        document.querySelectorAll('[id^="perf-btn-"]').forEach(el => {
            const t = performance.now();
            a.applyLoading(el, { strategy: 'spinner' });
            timings.push(performance.now() - t);
        });
        return {
            totalTime: performance.now() - start,
            avgTime: timings.reduce((x, y) => x + y, 0) / timings.length
        };
    }, handle);
});

When('the element content changes causing it to expand to {string} x {string}', async function(width, height) {
    this.lxExpanded = { width: parseInt(width, 10), height: parseInt(height, 10) };
    await this.page.evaluate(({ id, w, h }) => {
        const el = document.getElementById(id);
        el.style.width = w;
        el.style.height = h;
    }, { id: this.lxLastId, w: width, h: height });
    // ResizeObserver callbacks run after layout; wait for the entry
    await this.page.waitForFunction(({ id, w }) =>
        window.__ro.all.some(r => r.entries.some(e => e.id === id && e.width === w)),
    { id: this.lxLastId, w: this.lxExpanded.width }, { timeout: 2000 }).catch(() => {});
});

// Assertions
Then('the element should have min-width set to {string}', async function(expected) {
    // inline value: Chrome computes min-width:auto as 0px on block boxes
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minWidth, expected);
});

Then('the element should have min-height set to {string}', async function(expected) {
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minHeight, expected);
});

Then('a ResizeObserver should be attached to the element', async function() {
    assert.strictEqual(await liveCount(this.page, this.lxLastId), 1, 'Expected one live ResizeObserver on the element');
});

Then('the ResizeObserver should be disconnected', async function() {
    const state = await this.page.evaluate(id => ({
        created: window.__ro.all.filter(r => r.targets.some(t => t.id === id)).length,
        live: window.__ro.live(id).length
    }), this.lxLastId);
    assert.ok(state.created > 0, 'A ResizeObserver should have been created for the element');
    assert.strictEqual(state.live, 0, 'The element\'s ResizeObserver should be disconnected');
});

Then('no ResizeObserver should be attached to the element', async function() {
    const created = await this.page.evaluate(id =>
        window.__ro.all.filter(r => r.targets.some(t => t.id === id)).length, this.lxLastId);
    assert.strictEqual(created, 0, 'Expected no ResizeObserver for the element');
});

Then('the element should not have min-width modified', async function() {
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minWidth, '');
});

Then('the element should not have min-height modified', async function() {
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minHeight, '');
});

Then('the element should only have the spinner\'s own height lock', async function() {
    const state = await this.page.evaluate(id => {
        const el = document.getElementById(id);
        return { minHeight: el.style.minHeight, spinner: !!el.querySelector('[class*="lx-spinner"]'), busy: el.getAttribute('aria-busy') };
    }, this.lxLastId);
    assert.ok(state.spinner && state.busy === 'true', 'The spinner should be showing');
    assert.match(state.minHeight, /^\d+(\.\d+)?px$/, 'The spinner locks the height it measured');
});

Then('element {string} should have min-width {string} and min-height {string}', async function(id, width, height) {
    const actual = await computedMin(this.page, id);
    assert.strictEqual(actual.minWidth, width, `${id} min-width`);
    assert.strictEqual(actual.minHeight, height, `${id} min-height`);
});

Then('{int} ResizeObservers should be active', async function(expected) {
    assert.strictEqual(await liveCount(this.page), expected);
});

Then('all ResizeObservers should be disconnected', async function() {
    const state = await this.page.evaluate(() => ({ created: window.__ro.all.length, live: window.__ro.live().length }));
    assert.ok(state.created > 0, 'ResizeObservers should have been created');
    assert.strictEqual(state.live, 0, 'Every ResizeObserver should be disconnected');
});

Then('the element should not have min-width set', async function() {
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minWidth, '');
});

Then('the element should not have min-height set', async function() {
    assert.strictEqual((await inlineMin(this.page, this.lxLastId)).minHeight, '');
});

Then('a ResizeObserver should still be attached for future measurements', async function() {
    assert.strictEqual(await liveCount(this.page, this.lxLastId), 1, 'Expected a live ResizeObserver on the zero-size element');
});

Then('all elements should have their dimensions preserved', async function() {
    for (const [id, dims] of Object.entries(this.lxDims)) {
        const actual = await computedMin(this.page, id);
        assert.deepStrictEqual(actual, { minWidth: dims.width, minHeight: dims.height }, `${id} reserved size`);
    }
});

Then('WeakMaps should automatically clean up references', async function() {
    // Garbage collection can't be forced here; what it needs is that loadX
    // holds no strong reference: every observer is disconnected, so none of
    // them keeps a removed element alive
    const state = await this.page.evaluate(() => ({
        applied: window.__spaApplied,
        retaining: window.__ro.live().filter(r => r.targets.some(t => !t.isConnected)).length
    }));
    assert.strictEqual(state.applied, 10, 'Each element should get its own observer while loading');
    assert.strictEqual(state.retaining, 0, 'No live observer should reference a removed element');
});

Then('activeObservers Set should be empty', async function() {
    assert.strictEqual(await liveCount(this.page), 0);
});

Then('no memory leaks should be detected', async function() {
    // Scenarios that measured collection themselves (bindX reactive engine) check it here
    if (typeof this.checkLeaks === 'function') return this.checkLeaks();
    // loadX: the remaining elements carry no loading leftovers
    const leftovers = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('[id^="spa-btn-"]')).filter(el =>
            el.getAttribute('aria-busy') === 'true' || el.querySelector('[class*="lx-spinner"]')).length);
    assert.strictEqual(leftovers, 0, 'Removed loading states should leave nothing behind');
});

Then('the total operation should complete in under {int}ms', async function(maxMs) {
    assert.ok(this.performanceMetrics.totalTime < maxMs, `total under ${maxMs}ms`);
});

Then('each ResizeObserver creation should take less than {int}ms on average', async function(maxMs) {
    assert.ok(this.performanceMetrics.avgTime < maxMs, `average under ${maxMs}ms`);
});

Then('the ResizeObserver should detect the size change', async function() {
    const seen = await this.page.evaluate(id =>
        window.__ro.all.flatMap(r => r.entries).filter(e => e.id === id), this.lxLastId);
    assert.ok(seen.length > 0, 'The observer callback should run for the element');
});

Then('the new dimensions should be stored in originalDimensions', async function() {
    const seen = await this.page.evaluate(id =>
        window.__ro.all.flatMap(r => r.entries).filter(e => e.id === id), this.lxLastId);
    assert.ok(seen.some(e => e.width === this.lxExpanded.width && e.height === this.lxExpanded.height),
        `The observer should report ${this.lxExpanded.width}x${this.lxExpanded.height}, saw ${JSON.stringify(seen)}`);
});

Then('removing loading should restore to the updated dimensions', async function() {
    await removeFrom(this.page, this.lxLastId);
    const state = await this.page.evaluate(id => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height), minWidth: el.style.minWidth, busy: el.getAttribute('aria-busy') };
    }, this.lxLastId);
    assert.strictEqual(state.width, this.lxExpanded.width);
    assert.strictEqual(state.height, this.lxExpanded.height);
    assert.notStrictEqual(state.minWidth, '200px', 'The reserved loading width should be released');
    assert.strictEqual(state.busy, null);
});
