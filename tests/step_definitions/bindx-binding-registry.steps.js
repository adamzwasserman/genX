/**
 * Step definitions for bindX Binding Registry
 * Covers: bindx-binding-registry.feature
 *
 * Bindings come from bindX.scan on the fixture page; the registry is the
 * real one (window.__bxi.getBindingRegistry()). Steps that register bindings
 * directly use the registry's own register/unregister.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { setMarkup, render, nextFrames } = require('../support/bindx-fixture');

const registry = 'window.__bxi.getBindingRegistry()';

// Markup plus data, then scan
const bindMarkup = async (world, html, data) => {
    await setMarkup(world, html);
    await world.page.evaluate(d => {
        window._testData = d; 
    }, data);
    await render(world);
};

const registrySize = page => page.evaluate(`${registry}.size`);

// Bindings in the registry for one element, as {type, path, attribute}
const bindingsOf = (page, selector) => page.evaluate(([reg, sel]) => {
    const r = eval(reg);
    return r.getByElement(document.querySelector(sel))
        .map(b => ({ type: b.type, path: b.path, attribute: b.attribute || null }));
}, [registry, selector]);

// Registers plain bindings on fresh elements; returns nothing, keeps them on window._registered
const registerBindings = (page, count) => page.evaluate(([reg, c]) => {
    const r = eval(reg);
    window._registered = window._registered || [];
    for (let i = 0; i < c; i++) {
        const element = document.createElement('span');
        window.__app().appendChild(element);
        const binding = { id: `manual-${window._registered.length}`, element, path: `manual.p${window._registered.length}`, type: 'bind' };
        window._registered.push(r.register(element, binding));
    }
}, [registry, count]);

// ============================================================================
// SETUP STEPS
// ============================================================================

Given('I have an element with id {string}', async function(id) {
    this.registryId = id;
    await setMarkup(this, `<span id="${id}"></span>`);
});

Given('I have an element with multiple bx- attributes', async function() {
    await bindMarkup(this,
        '<input id="multi" bx-model="form.value" bx-bind:class="form.active">',
        { form: { value: 'x', active: true } });
});

Given('I have {int} bound elements', async function(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="bound" bx-bind="items.p${i}"></div>`;
    }
    const items = {};
    for (let i = 0; i < count; i++) {
        items[`p${i}`] = i;
    }
    await bindMarkup(this, html, { items });
    const bound = await this.page.evaluate(([reg]) => {
        const r = eval(reg);
        // Hold the elements only weakly from here on
        window.__elementRefs = [...document.querySelectorAll('.bound')].map(el => new WeakRef(el));
        return [...document.querySelectorAll('.bound')].filter(el => r.getByElement(el).length > 0).length;
    }, [registry]);
    assert.strictEqual(bound, count, 'Every element should be registered');
});

Given('I have bindings for {string}, {string}, {string}', async function(path1, path2, path3) {
    const data = {};
    [path1, path2, path3].forEach(p => {
        const [head, tail] = p.split('.');
        data[head] = data[head] || {};
        data[head][tail] = `v-${tail}`;
    });
    await bindMarkup(this, [path1, path2, path3].map(p => `<span bx-bind="${p}"></span>`).join(''), data);
});

Given('I have a registered binding', async function() {
    await bindMarkup(this, '<span id="one" bx-bind="test.path"></span>', { test: { path: 'v' } });
    this.testBinding = await this.page.evaluate(([reg]) => {
        const r = eval(reg);
        window._testBinding = r.getByPath('test.path')[0];
        return window._testBinding ? window._testBinding.id : null;
    }, [registry]);
    assert.ok(this.testBinding, 'The binding should be registered');
});

Given('I have an element with {int} bindings', async function(count) {
    const targets = ['', ':class', ':title', ':style.color'].slice(0, count);
    const attrs = targets.map((t, i) => `bx-bind${t}="e.p${i}"`).join(' ');
    const data = { e: {} };
    targets.forEach((_, i) => {
        data.e[`p${i}`] = `v${i}`; 
    });
    await bindMarkup(this, `<span id="multi" ${attrs}></span>`, data);
});

Given('I have an empty registry', async function() {
    await bindMarkup(this, '', {});
    await this.page.evaluate(`${registry}.clear()`);
    assert.strictEqual(await registrySize(this.page), 0);
});

Given('I have a registry with {int} bindings', async function(count) {
    await bindMarkup(this, '', {});
    await this.page.evaluate(`${registry}.clear()`);
    await registerBindings(this.page, count);
    assert.strictEqual(await registrySize(this.page), count);
});

// ============================================================================
// ACTION STEPS
// ============================================================================

When('I create a binding for property {string}', async function(path) {
    await this.page.evaluate(([id, p]) => {
        const r = window.bindX.reactive({});
        window.bindX.setNestedProperty(r, p, 'value');
        window._bindingCreated = window.__bxi.createOneWayBinding(document.getElementById(id), r, p);
    }, [this.registryId, path]);
    this.createdPath = path;
});

When('I register bx-model and bx-bind:class bindings', async function() {
    this.multiBindings = await bindingsOf(this.page, '#multi');
});

When('I remove all elements from DOM', async function() {
    await this.page.evaluate(() => {
        document.querySelectorAll('.bound').forEach(el => el.remove());
        // The fixture keeps the scan result for its release checks; drop it
        window.__bindings = null;
    });
    await nextFrames(this);
});

When('I unregister the binding', async function() {
    await this.page.evaluate(([reg]) => {
        eval(reg).unregister(window._testBinding);
    }, [registry]);
});

When('I query bindings by element', async function() {
    this.elementBindings = await bindingsOf(this.page, '#multi');
});

When('I query bindings for path {string}', async function(pattern) {
    this.queryResults = await this.page.evaluate(([reg, pat]) => {
        return eval(reg).getByPathPattern(pat).map(b => b.path);
    }, [registry, pattern]);
});

When('I register {int} bindings', async function(count) {
    await registerBindings(this.page, count);
});

When('I unregister {int} bindings', async function(count) {
    await this.page.evaluate(([reg, c]) => {
        const r = eval(reg);
        window._registered.splice(0, c).forEach(b => r.unregister(b));
    }, [registry, count]);
});

When('I call clear\\(\\)', async function() {
    await this.page.evaluate(`${registry}.clear()`);
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('the binding should be in the registry', async function() {
    const paths = await this.page.evaluate(([reg, p]) => {
        const r = eval(reg);
        return { byPath: r.getByPath(p).includes(window._bindingCreated), inAll: r.getAll().includes(window._bindingCreated) };
    }, [registry, this.createdPath]);
    assert.deepStrictEqual(paths, { byPath: true, inAll: true });
});

Then('it should be associated with the element', async function() {
    const associated = await this.page.evaluate(([reg, id]) => {
        const el = document.getElementById(id);
        return window._bindingCreated.element === el && eval(reg).getByElement(el).includes(window._bindingCreated);
    }, [registry, this.registryId]);
    assert.ok(associated, 'Binding should be associated with element');
});

Then('both bindings should be in the registry', function() {
    const kinds = this.multiBindings.map(b => `${b.type}:${b.path}`).sort();
    assert.ok(kinds.includes('model:form.value'), `bx-model binding missing (${kinds})`);
    assert.ok(this.multiBindings.some(b => b.path === 'form.active' && b.attribute === 'class'), `bx-bind:class binding missing (${kinds})`);
});

Then('they should not conflict', async function() {
    const state = await this.page.evaluate(async () => {
        const el = document.getElementById('multi');
        window._reactive.form.value = 'typed';
        window._reactive.form.active = false;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const afterOff = { value: el.value, active: el.classList.contains('active') };
        window._reactive.form.active = true;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { afterOff, activeOn: el.classList.contains('active'), value: el.value };
    });
    assert.deepStrictEqual(state, { afterOff: { value: 'typed', active: false }, activeOn: true, value: 'typed' });
});

Then('WeakMap should allow garbage collection', async function() {
    const cdp = await this.context.newCDPSession(this.page);
    for (let i = 0; i < 2; i++) {
        await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
        await cdp.send('HeapProfiler.collectGarbage');
    }
    await cdp.detach();
    const alive = await this.page.evaluate(() => window.__elementRefs.filter(r => r.deref()).length);
    assert.strictEqual(alive, 0, `${alive} removed elements survived garbage collection`);
});

Then('no binding registry memory leaks should occur', async function() {
    const left = await this.page.evaluate(([reg]) => eval(reg).getAll().filter(b => b.path.startsWith('items.')).length, [registry]);
    assert.strictEqual(left, 0, `${left} bindings for removed elements are still registered`);
});

Then('I should get bindings for {string} and {string}', function(path1, path2) {
    assert.ok(this.queryResults.includes(path1), `Should include ${path1} (${this.queryResults})`);
    assert.ok(this.queryResults.includes(path2), `Should include ${path2} (${this.queryResults})`);
});

Then('not {string}', function(path) {
    assert.ok(!this.queryResults.includes(path), `Should not include ${path} (${this.queryResults})`);
});

Then('it should be removed from path index', async function() {
    const inIndex = await this.page.evaluate(([reg]) => eval(reg).getByPath('test.path').includes(window._testBinding), [registry]);
    assert.strictEqual(inIndex, false, 'Should be removed from path index');
});

Then('it should be removed from all bindings', async function() {
    const state = await this.page.evaluate(([reg]) => {
        const r = eval(reg);
        return {
            inAll: r.getAll().includes(window._testBinding),
            onElement: r.getByElement(document.getElementById('one')).includes(window._testBinding)
        };
    }, [registry]);
    assert.deepStrictEqual(state, { inAll: false, onElement: false });
});

Then('I should get all {int} bindings', function(count) {
    assert.strictEqual(this.elementBindings.length, count, JSON.stringify(this.elementBindings));
    const paths = new Set(this.elementBindings.map(b => b.path));
    assert.strictEqual(paths.size, count, 'Each binding should be distinct');
});

Then('registry size should be {int}', async function(expected) {
    assert.strictEqual(await registrySize(this.page), expected);
});

Then('all bindings should be removed', async function() {
    const state = await this.page.evaluate(([reg]) => {
        const r = eval(reg);
        return { all: r.getAll().length, byPath: r.getByPathPattern('*').length };
    }, [registry]);
    assert.deepStrictEqual(state, { all: 0, byPath: 0 });
});
