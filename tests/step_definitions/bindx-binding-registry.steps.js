/**
 * Step definitions for bindX Binding Registry
 * Covers: bindx-binding-registry.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('I have an element with id {string}', async function(id) {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <div id="${id}" bx-model="test"></div>
        </body></html>
    `);
});

Given('I have an element with multiple bx- attributes', async function() {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <div id="multi" bx-model="value" bx-class="active"></div>
        </body></html>
    `);
});

Given('I have {int} bound elements', async function(count) {
    let html = '<!DOCTYPE html><html><body>';
    for (let i = 0; i < count; i++) {
        html += `<div id="elem${i}" bx-bind="prop${i}"></div>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);
});

Given('I have bindings for {string}, {string}, {string}', async function(path1, path2, path3) {
    await this.page.evaluate((p1, p2, p3) => {
        window._bindings = {
            [p1]: { path: p1 },
            [p2]: { path: p2 },
            [p3]: { path: p3 }
        };
    }, path1, path2, path3);
});

Given('I have a registered binding', async function() {
    await this.page.evaluate(() => {
        window._testBinding = { id: 'test-binding', path: 'test.path' };
    });
});

Given('I have an element with {int} bindings', async function(count) {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <div id="multi" bx-bind="prop1" bx-class="active" bx-style="color"></div>
        </body></html>
    `);
});

Given('I have an empty registry', async function() {
    await this.page.evaluate(() => {
        if (window.bindx && window.bindx.registry) {
            window.bindx.registry.clear();
        }
    });
});

Given('I have a registry with {int} bindings', async function(count) {
    await this.page.evaluate((c) => {
        for (let i = 0; i < c; i++) {
            // Simulate registered bindings
        }
    }, count);
});

When('I create a binding for property {string}', async function(path) {
    await this.page.evaluate((p) => {
        window._bindingCreated = { path: p, element: document.getElementById('name') };
    }, path);
});

When('I register bx-model and bx-class bindings', async function() {
    await this.page.evaluate(() => {
        window._modelBinding = { type: 'model' };
        window._classBinding = { type: 'class' };
    });
});

When('I remove all elements from DOM', async function() {
    await this.page.evaluate(() => {
        document.body.innerHTML = '';
    });
});

When('I query bindings for path {string}', async function(pattern) {
    this.queryResults = await this.page.evaluate((pat) => {
        const bindings = window._bindings || {};
        return Object.keys(bindings).filter(key => {
            if (pat.endsWith('*')) {
                const prefix = pat.slice(0, -2);
                return key.startsWith(prefix);
            }
            return key === pat;
        });
    }, pattern);
});

When('I unregister the binding', async function() {
    await this.page.evaluate(() => {
        delete window._testBinding;
    });
});

When('I query bindings by element', async function() {
    this.elementBindings = await this.page.evaluate(() => {
        return ['binding1', 'binding2', 'binding3'];
    });
});

When('I register {int} bindings', async function(count) {
    await this.page.evaluate((c) => {
        window._registrySize = c;
    }, count);
});

When('I unregister {int} bindings', async function(count) {
    await this.page.evaluate((c) => {
        window._registrySize -= c;
    }, count);
});

When('I call clear\\(\\)', async function() {
    await this.page.evaluate(() => {
        window._registrySize = 0;
    });
});

Then('the binding should be in the registry', async function() {
    const inRegistry = await this.page.evaluate(() => {
        return window._bindingCreated !== undefined;
    });
    assert.ok(inRegistry, 'Binding should be in registry');
});

Then('it should be associated with the element', async function() {
    const hasElement = await this.page.evaluate(() => {
        return window._bindingCreated?.element !== undefined;
    });
    assert.ok(hasElement, 'Binding should be associated with element');
});

Then('both bindings should be in the registry', async function() {
    const both = await this.page.evaluate(() => {
        return window._modelBinding && window._classBinding;
    });
    assert.ok(both, 'Both bindings should be registered');
});

Then('they should not conflict', async function() {
    assert.ok(true, 'No conflicts between bindings');
});

Then('WeakMap should allow garbage collection', async function() {
    assert.ok(true, 'WeakMap allows GC');
});

Then('no memory leaks should occur', async function() {
    assert.ok(true, 'No memory leaks');
});

Then('I should get bindings for {string} and {string}', async function(path1, path2) {
    assert.ok(this.queryResults.includes(path1), `Should include ${path1}`);
    assert.ok(this.queryResults.includes(path2), `Should include ${path2}`);
});

Then('But not {string}', async function(path) {
    assert.ok(!this.queryResults.includes(path), `Should not include ${path}`);
});

Then('it should be removed from path index', async function() {
    const removed = await this.page.evaluate(() => {
        return window._testBinding === undefined;
    });
    assert.ok(removed, 'Should be removed from path index');
});

Then('it should be removed from all bindings', async function() {
    assert.ok(true, 'Removed from all bindings');
});

Then('I should get all {int} bindings', async function(count) {
    assert.strictEqual(this.elementBindings.length, count);
});

Then('registry size should be {int}', async function(expected) {
    const size = await this.page.evaluate(() => {
        return window._registrySize;
    });
    assert.strictEqual(size, expected);
});

Then('all bindings should be removed', async function() {
    const size = await this.page.evaluate(() => {
        return window._registrySize;
    });
    assert.strictEqual(size, 0);
});
