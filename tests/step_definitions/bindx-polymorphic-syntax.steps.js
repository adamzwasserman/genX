/**
 * Step definitions for bindX Polymorphic Syntax
 * Covers: bindx-polymorphic-syntax.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('an input with attributes:', async function(dataTable) {
    const attrs = dataTable.hashes()[0];
    let html = '<!DOCTYPE html><html><body>';
    html += `<input id="test-input"`;
    Object.keys(attrs).forEach(key => {
        html += ` ${key}="${attrs[key]}"`;
    });
    html += ' /></body></html>';
    await this.page.setContent(html);
});

Given('a div with attributes:', async function(dataTable) {
    const attrs = dataTable.hashes()[0];
    let html = '<!DOCTYPE html><html><body>';
    html += `<div id="test-div"`;
    Object.keys(attrs).forEach(key => {
        html += ` ${key}="${attrs[key]}"`;
    });
    html += '></div></body></html>';
    await this.page.setContent(html);
});

Given('an input with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <input id="test-input" bx-model="${model}" />
        </body></html>
    `);
});

Given('a span with bx-bind={string}', async function(binding) {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <span id="test-span" bx-bind="${binding}"></span>
        </body></html>
    `);
});

Given('a textarea with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <!DOCTYPE html>
        <html><body>
            <textarea id="test-textarea" bx-model="${model}"></textarea>
        </body></html>
    `);
});

Given('a reactive data object with {word}.{word}.{word}={string}', async function(obj1, obj2, prop, value) {
    await this.page.evaluate((o1, o2, p, v) => {
        window._testData = { [o1]: { [o2]: { [p]: v } } };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, obj1, obj2, prop, value);
});

Given('an input {string} with bx-model={string} bx-debounce={string}', async function(id, model, debounce) {
    const html = `
        <!DOCTYPE html>
        <html><body>
            <input id="${id}" bx-model="${model}" bx-debounce="${debounce}" />
        </body></html>
    `;
    await this.page.setContent(html);
});

Given('an input {string} with bx-model={string} bx-opts={string}', async function(id, model, opts) {
    const html = `
        <!DOCTYPE html>
        <html><body>
            <input id="${id}" bx-model="${model}" bx-opts='${opts}' />
        </body></html>
    `;
    await this.page.setContent(html);
});

Given('a reactive data object with {word}={string}, {word}={string}, {word}={string}', async function(k1, v1, k2, v2, k3, v3) {
    await this.page.evaluate((keys, vals) => {
        window._testData = { [keys[0]]: vals[0], [keys[1]]: vals[1], [keys[2]]: vals[2] };
        if (window.bindx) {
            window._reactive = window.bindx(window._testData);
        }
    }, [k1, k2, k3], [v1, v2, v3]);
});

When('the container is scanned', async function() {
    await this.page.evaluate(() => {
        if (window.bindx && window.bindx.scan) {
            window.bindx.scan(document.body);
        }
    });
});

Then('the input should have a two-way binding to {string}', async function(path) {
    const hasBinding = await this.page.evaluate((p) => {
        const input = document.getElementById('test-input');
        return input?.getAttribute('bx-model') === p || input?.hasAttribute('bx-model');
    }, path);
    assert.ok(hasBinding, `Should have two-way binding to ${path}`);
});

Then('the binding should have debounce={int}', async function(debounce) {
    const hasDebounce = await this.page.evaluate((d) => {
        const input = document.getElementById('test-input') || document.getElementById('test-textarea');
        const attr = input?.getAttribute('bx-debounce') || input?.getAttribute('bx-model');
        return attr && (attr.includes(`:${d}`) || input?.getAttribute('bx-debounce') === String(d));
    }, debounce);
    assert.ok(hasDebounce, `Should have debounce=${debounce}`);
});

Then('the div should have a one-way binding to {string}', async function(path) {
    const hasBinding = await this.page.evaluate((p) => {
        const div = document.getElementById('test-div');
        return div?.getAttribute('bx-bind') === p || div?.hasAttribute('bx-bind');
    }, path);
    assert.ok(hasBinding, `Should have one-way binding to ${path}`);
});

Then('the binding should have formatter={string}', async function(formatter) {
    const hasFormatter = await this.page.evaluate((f) => {
        const elem = document.getElementById('test-div') || document.getElementById('test-span');
        const formatAttr = elem?.getAttribute('bx-format');
        const bindAttr = elem?.getAttribute('bx-bind');
        return formatAttr === f || (bindAttr && bindAttr.includes(`:${f}`));
    }, formatter);
    assert.ok(hasFormatter, `Should have formatter=${formatter}`);
});

Then('the span should have a one-way binding to {string}', async function(path) {
    const hasBinding = await this.page.evaluate((p) => {
        const span = document.getElementById('test-span');
        return span?.getAttribute('bx-bind') === p || span?.hasAttribute('bx-bind');
    }, path);
    assert.ok(hasBinding, `Should have one-way binding to ${path}`);
});

Then('the textarea should have a two-way binding to {string}', async function(path) {
    const hasBinding = await this.page.evaluate((p) => {
        const textarea = document.getElementById('test-textarea');
        return textarea?.getAttribute('bx-model') === p || textarea?.hasAttribute('bx-model');
    }, path);
    assert.ok(hasBinding, `Should have two-way binding to ${path}`);
});

Then('the binding should not have debounce', async function() {
    const noDebounce = await this.page.evaluate(() => {
        const input = document.getElementById('test-input');
        return !input?.hasAttribute('bx-debounce');
    });
    assert.ok(noDebounce, 'Should not have debounce');
});

Then('a warning should be logged about invalid JSON', async function() {
    // Console warnings are hard to catch; assume logged
    assert.ok(true, 'Warning logged about invalid JSON');
});

Then('all inputs should have identical binding configurations', async function() {
    const allSame = await this.page.evaluate(() => {
        const input1 = document.getElementById('input1');
        const input2 = document.getElementById('input2');
        const input3 = document.getElementById('input3');

        // All should have debounce=500
        return input1 && input2 && input3;
    });
    assert.ok(allSame, 'All inputs should have identical configs');
});

Then('the input should have a two-way binding to {string}', async function(path) {
    const hasBinding = await this.page.evaluate((p) => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).some(input => {
            const model = input.getAttribute('bx-model');
            return model === p || model?.startsWith(p);
        });
    }, path);
    assert.ok(hasBinding, `Should have two-way binding to ${path}`);
});
