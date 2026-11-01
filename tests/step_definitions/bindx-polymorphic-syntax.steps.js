/**
 * Step definitions for bindX Polymorphic Syntax
 * Covers: bindx-polymorphic-syntax.feature
 *
 * Elements go into the bindX fixture page (tests/support/bindx-fixture.js).
 * "the container is scanned" runs bindX.scan(), and the checks read the
 * binding objects scan() returned: their type, path and parsed options.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { addMarkup, render, setData, parseValue, consoleOf } = require('../support/bindx-fixture');

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Rows of | attribute | value | as an attribute string. */
function attributesFromTable(dataTable) {
    return dataTable.hashes()
        .map(row => `${row.attribute}="${escapeAttr(row.value)}"`)
        .join(' ');
}

Given('an input with attributes:', async function(dataTable) {
    await addMarkup(this, `<input id="test-input" ${attributesFromTable(dataTable)}>`, '#test-input');
});

Given('a div with attributes:', async function(dataTable) {
    await addMarkup(this, `<div id="test-div" ${attributesFromTable(dataTable)}></div>`, '#test-div');
});

Given('a textarea with attributes:', async function(dataTable) {
    await addMarkup(this, `<textarea id="test-textarea" ${attributesFromTable(dataTable)}></textarea>`, '#test-textarea');
});

// 'an input with bx-model' and 'a textarea with bx-model' live in bindx.steps.js.

Given('a span with bx-bind={string}', async function(binding) {
    await addMarkup(this, `<span id="test-span" bx-bind="${escapeAttr(binding)}"></span>`, '#test-span');
});

Given('a reactive data object with {word}.{word}.{word}={string}', async function(obj1, obj2, prop, value) {
    await setData(this, `${obj1}.${obj2}.${prop}`, value);
});

Given(/^a reactive data object with ([\w$.]+)=(-?\d+\.\d+)$/, async function(key, value) {
    await setData(this, key, parseValue(value));
});

Given('an input {string} with bx-model={string} bx-debounce={string}', async function(id, model, debounce) {
    await addMarkup(this, `<input id="${id}" bx-model="${escapeAttr(model)}" bx-debounce="${escapeAttr(debounce)}">`);
});

Given('an input {string} with bx-model={string}', async function(id, model) {
    await addMarkup(this, `<input id="${id}" bx-model="${escapeAttr(model)}">`);
});

Given('an input {string} with bx-model={string} bx-opts={string}', async function(id, model, opts) {
    await addMarkup(this, `<input id="${id}" bx-model="${escapeAttr(model)}" bx-opts="${escapeAttr(opts)}">`);
});

Given('a reactive data object with {word}={string}, {word}={string}, {word}={string}', async function(k1, v1, k2, v2, k3, v3) {
    await setData(this, k1, v1);
    await setData(this, k2, v2);
    await setData(this, k3, v3);
});

When('the container is scanned', async function() {
    await render(this);
});

/** The bindings scan() created, as plain data. */
function bindingsSummary(world) {
    return world.page.evaluate(() => (window.__bindings || []).map(b => ({
        id: b.element.id,
        tag: b.element.tagName.toLowerCase(),
        type: b.type,
        path: b.path,
        debounce: b.options ? b.options.debounce : undefined,
        formatter: b.options ? b.options.formatter : undefined
    })));
}

async function onlyBinding(world) {
    const bindings = await bindingsSummary(world);
    assert.strictEqual(bindings.length, 1, `expected one binding, got ${JSON.stringify(bindings)}`);
    return bindings[0];
}

async function expectBinding(world, tag, type, path) {
    const bindings = await bindingsSummary(world);
    const hit = bindings.find(b => b.tag === tag && b.type === type && b.path === path);
    assert.ok(hit, `expected a ${type} binding on <${tag}> to "${path}", got ${JSON.stringify(bindings)}`);
}

// The mixed-syntax scenario binds a textarea and calls it "the input".
Then('the input should have a two-way binding to {string}', async function(path) {
    const bindings = await bindingsSummary(this);
    const hit = bindings.find(b => (b.tag === 'input' || b.tag === 'textarea') &&
        b.type === 'model' && b.path === path);
    assert.ok(hit, `expected a two-way binding to "${path}", got ${JSON.stringify(bindings)}`);
});

Then('the textarea should have a two-way binding to {string}', async function(path) {
    await expectBinding(this, 'textarea', 'model', path);
});

Then('the div should have a one-way binding to {string}', async function(path) {
    await expectBinding(this, 'div', 'bind', path);
});

Then('the span should have a one-way binding to {string}', async function(path) {
    await expectBinding(this, 'span', 'bind', path);
});

Then('the binding should have debounce={int}', async function(debounce) {
    const binding = await onlyBinding(this);
    assert.strictEqual(binding.debounce, debounce);
});

Then('the binding should not have debounce', async function() {
    const binding = await onlyBinding(this);
    assert.ok(!binding.debounce, `expected no debounce, got ${binding.debounce}`);
});

Then('the binding should have formatter={string}', async function(formatter) {
    const binding = await onlyBinding(this);
    assert.strictEqual(binding.formatter, formatter);
});

Then('a warning should be logged about invalid JSON', async function() {
    const warnings = consoleOf(this, 'warning').filter(m => /JSON/i.test(m.text));
    assert.ok(warnings.length > 0,
        `expected a JSON warning, console had ${JSON.stringify(this.consoleMessages)}`);
});

Then('all inputs should have identical binding configurations', async function() {
    const bindings = await bindingsSummary(this);
    const ids = ['input1', 'input2', 'input3'];
    const configs = ids.map(id => bindings.find(b => b.id === id));
    assert.ok(configs.every(Boolean), `expected bindings for ${ids.join(', ')}, got ${JSON.stringify(bindings)}`);
    configs.forEach((c, i) => {
        assert.strictEqual(c.type, 'model', `${ids[i]} type`);
        assert.strictEqual(c.debounce, 500, `${ids[i]} debounce`);
        assert.strictEqual(c.formatter, configs[0].formatter, `${ids[i]} formatter`);
    });
});
