/**
 * Step definitions for bindX Form Utilities
 * Covers: bindx-form-utilities.feature
 *
 * Forms are built in the fixture page as <form id="test-form">. Each
 * validated field sits in its own <div> with a .bx-error-message container,
 * where bindX writes the first error. Validation, serialization, reset and
 * form state go through bindX's own functions (validateForm, serializeForm,
 * deserializeForm, resetForm, getFormState); bx-form forms get their
 * handlers from bindX.scan.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { mountBindx, setMarkup, render, setData, parseValue, nextFrames, consoleOf } = require('../support/bindx-fixture');

// ============================================================================
// HELPERS
// ============================================================================

const escapeAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** One field in its own wrapper, with an error message container. */
const fieldHtml = (name, { validate, type, extra = '', model = true } = {}) => {
    const attrs = [
        `id="${name}"`,
        `name="${name}"`,
        model ? `bx-model="${name}"` : '',
        validate !== undefined ? `bx-validate="${escapeAttr(validate)}"` : '',
        type ? `type="${type}"` : '',
        extra
    ].filter(Boolean).join(' ');
    return `<div class="field"><input ${attrs}><div class="bx-error-message"></div></div>`;
};

/** Replace #app with a form holding the given fields. */
const buildForm = async (world, inner = '', formAttrs = 'bx-form') => {
    await setMarkup(world, `<form id="test-form" ${formAttrs}>${inner}</form>`);
};

/** Add fields to the form already on the page. */
const addFields = async (world, html) => {
    await world.page.evaluate(markup => {
        document.getElementById('test-form').insertAdjacentHTML('beforeend', markup);
    }, html);
};

/** Form state as bindX keeps it, plus the form's classes. */
const formState = page => page.evaluate(() => {
    const form = document.getElementById('test-form');
    const state = window.bindX.getFormState(form);
    return {
        pristine: state.pristine,
        dirty: state.dirty,
        valid: state.valid,
        invalid: state.invalid,
        classes: [...form.classList]
    };
});

const fieldInfo = (page, selector) => page.evaluate(sel => {
    const field = document.querySelector(sel);
    const message = field.parentElement.querySelector('.bx-error-message');
    return { classes: [...field.classList], message: message ? message.textContent : null, value: field.value };
}, selector);

const VALID_VALUES = { email: 'test@example.com', age: 30 };
const INVALID_VALUES = { email: 'invalid-email', age: 10 };
const validatedFields = () =>
    fieldHtml('email', { validate: 'required email' }) +
    fieldHtml('age', { validate: 'min:18', type: 'number' }) +
    // Not bound: only a valid submit copies it into the data
    '<input id="note" name="note" value="from the form">';

const useValues = async (world, values) => {
    for (const [key, value] of Object.entries(values)) {
        await setData(world, key, value);
    }
    world.expectedValues = values;
};

// ============================================================================
// DATA SETUP
// ============================================================================

// Flat keys only; dotted paths go to the nested step in bindx-polymorphic-syntax.steps.js.
Given(/^a reactive data object with ([A-Za-z_$][\w$]*)="([^"]*)"$/, async function(key, value) {
    await setData(this, key, value);
});

Given('a reactive data object with {word}={int}', async function(key, value) {
    await setData(this, key, value);
});

Given('reactive data object', async function() {
    await mountBindx(this);
});

// reactive data with username="john" email="john@email.com" / agree=true / gender="female"
Given(/^reactive data with ((?:[\w.]+=(?:"[^"]*"|\S+)\s*)+)$/, async function(pairs) {
    const re = /([\w.]+)=("[^"]*"|\S+)/g;
    let match;
    while ((match = re.exec(pairs)) !== null) {
        await setData(this, match[1], parseValue(match[2]));
    }
});

Given('reactive data with valid values', async function() {
    await useValues(this, VALID_VALUES);
});

Given('reactive data with invalid values', async function() {
    await useValues(this, INVALID_VALUES);
});

Given('reactive data with empty value', async function() {
    await setData(this, 'value', '');
});

Given('null reactive data', async function() {
    this.nullData = true;
});

// ============================================================================
// FORM SETUP - VALIDATION
// ============================================================================

Given('a form with required {word} field', async function(fieldName) {
    await buildForm(this, fieldHtml(fieldName, { validate: 'required' }));
});

Given('a form with email validation', async function() {
    await buildForm(this, fieldHtml('email', { validate: 'email' }));
});

Given('a form with {word} field validated min={int} max={int}', async function(fieldName, min, max) {
    await buildForm(this, fieldHtml(fieldName, { validate: `min:${min} max:${max}`, type: 'number' }));
});

Given('a form with {word} field validated min={int}', async function(fieldName, min) {
    await buildForm(this, fieldHtml(fieldName, { validate: `min:${min}`, type: 'number' }));
});

Given('a form with {word} field validated minLength={int} maxLength={int}', async function(fieldName, min, max) {
    await buildForm(this, fieldHtml(fieldName, { validate: `minLength:${min} maxLength:${max}` }));
});

Given('a form with {word} field validated minLength={int}', async function(fieldName, min) {
    await buildForm(this, fieldHtml(fieldName, { validate: `minLength:${min}` }));
});

Given('a form with {word} field validated pattern={string}', async function(fieldName, pattern) {
    await buildForm(this, fieldHtml(fieldName, { validate: `pattern:${pattern}` }));
});

Given('a form with URL validation', async function() {
    await buildForm(this, fieldHtml('website', { validate: 'url' }));
});

Given('a form with phone validation', async function() {
    await buildForm(this, fieldHtml('phone', { validate: 'phone' }));
});

Given('a form with {word} field validated {string}', async function(fieldName, rules) {
    await buildForm(this, fieldHtml(fieldName, { validate: rules }));
});

Given('a form with validated fields', async function() {
    await buildForm(this, validatedFields());
});

Given('a form with field having bx-error-required={string}', async function(message) {
    await buildForm(this, fieldHtml('value', { extra: `bx-error-required="${escapeAttr(message)}"` }));
});

Given('the field has bx-validate={string}', async function(rules) {
    await this.page.evaluate(r => document.getElementById('value').setAttribute('bx-validate', r), rules);
});

Given('a form with field having bx-validate={string}', async function(rules) {
    await buildForm(this, fieldHtml('value', { validate: rules }));
});

Given('no custom error message', async function() {
    const custom = await this.page.evaluate(() =>
        [...document.getElementById('value').attributes].filter(a => a.name.startsWith('bx-error-')).length);
    assert.strictEqual(custom, 0);
});

Given('the field has no bx-model or name attribute', async function() {
    await this.page.evaluate(() => {
        const field = document.getElementById('value');
        field.removeAttribute('bx-model');
        field.removeAttribute('name');
    });
});

// ============================================================================
// FORM SETUP - SERIALIZATION
// ============================================================================

Given('a form with fields:', async function(dataTable) {
    const inner = dataTable.hashes()
        .map(row => `<input name="${row.name}" bx-model="${row.name}" value="${escapeAttr(row.value)}">`).join('');
    await buildForm(this, inner);
});

Given('a form with select field {string} value {string}', async function(name, value) {
    const options = ['us', 'uk', 'ca']
        .map(v => `<option value="${v}"${v === value ? ' selected' : ''}>${v.toUpperCase()}</option>`).join('');
    await buildForm(this, `<select name="${name}" bx-model="${name}">${options}</select>`);
});

Given('a form with textarea field {string} value {string}', async function(name, value) {
    await buildForm(this, `<textarea name="${name}" bx-model="${name}">${value}</textarea>`);
});

Given('a form with checkbox field {string} checked', async function(name) {
    await buildForm(this, `<input type="checkbox" name="${name}" bx-model="${name}" checked>`);
});

Given('a form with empty fields:', async function(dataTable) {
    await buildForm(this, dataTable.hashes().map(row => `<input name="${row.name}">`).join(''), '');
});

Given('a form with unchecked checkbox {string}', async function(name) {
    await buildForm(this, `<input type="checkbox" name="${name}">`, '');
});

Given('a form with radio buttons {string} options {string}', async function(name, options) {
    await buildForm(this, options.split(',')
        .map(v => `<input type="radio" name="${name}" value="${v.trim()}">`).join(''), '');
});

// ============================================================================
// FORM SETUP - STATE, SUBMISSION, RESET
// ============================================================================

Given('a form with bx-form attribute', async function() {
    await buildForm(this);
});

Given('a form with bx-form attribute and text input', async function() {
    await buildForm(this, '<input type="text" name="title" bx-model="title">');
});

Given('fields with validation rules', async function() {
    await addFields(this, validatedFields());
});

Given('a custom submit handler {string}', async function(name) {
    await this.page.evaluate(fn => {
        document.getElementById('test-form').setAttribute('bx-form-submit', fn);
        window.__submitCalls = [];
        window[fn] = (formData, data) => window.__submitCalls.push({ formData, hasData: data === window._reactive });
    }, name);
    this.submitHandler = name;
});

Given('a form with input fields', async function() {
    await buildForm(this, '<input type="text" name="first"><input type="text" name="last">', '');
});

Given('the fields have values', async function() {
    await this.page.locator('#test-form input[name="first"]').fill('Ada');
    await this.page.locator('#test-form input[name="last"]').fill('Lovelace');
});

Given('the form is in dirty state', async function() {
    await addFields(this, '<input type="text" name="title" bx-model="title">');
    await render(this);
    await this.page.locator('#test-form input[name="title"]').fill('changed');
    assert.strictEqual((await formState(this.page)).dirty, true);
});

Given('a form with validation errors', async function() {
    await buildForm(this, fieldHtml('email', { validate: 'required email' }));
    await setData(this, 'email', 'invalid-email');
    await render(this);
    await this.page.evaluate(() => window.bindX.validateForm(document.getElementById('test-form'), window._reactive));
});

Given('fields have error classes', async function() {
    const info = await fieldInfo(this.page, '#email');
    assert.ok(info.classes.includes('bx-error'), 'The field should start with bx-error');
    assert.ok(info.message, 'The error message should start filled');
});

Given('a field with bx-validate={string}', async function(rules) {
    await addFields(this, fieldHtml('email', { validate: rules }));
});

Given('a field with validation error', async function() {
    await addFields(this, fieldHtml('email', { validate: 'required email' }));
    await setData(this, 'email', '');
});

Given('an error message is displayed', async function() {
    await render(this);
    await this.page.locator('#email').fill('invalid-email');
    const info = await fieldInfo(this.page, '#email');
    assert.ok(info.message, 'An error message should be displayed');
});

Given('fields using bx-model for binding', async function() {
    await addFields(this, fieldHtml('email', { validate: 'required email' }) + fieldHtml('name'));
});

Given('a form with bx-model on all fields', async function() {
    await buildForm(this, fieldHtml('email') + fieldHtml('name'));
    await setData(this, 'email', 'test@example.com');
    await setData(this, 'name', 'Ada');
});

Given('bx-validate on fields', async function() {
    await this.page.evaluate(() => {
        document.getElementById('email').setAttribute('bx-validate', 'required email');
        document.getElementById('name').setAttribute('bx-validate', 'required');
    });
});

Given('a regular form without bx-form', async function() {
    await buildForm(this, '<input type="text" name="title" bx-model="title">', '');
});

// ============================================================================
// ACTIONS
// ============================================================================

When('the form is validated', async function() {
    await render(this);
    this.validationResult = await this.page.evaluate(() =>
        window.bindX.validateForm(document.getElementById('test-form'), window._reactive));
    const first = Object.values(this.validationResult.errors || {})[0];
    if (first && first.length) {
        this.lastBindxError = first[0];
    }
});

When('the form is serialized', async function() {
    this.serializedData = await this.page.evaluate(() =>
        window.bindX.serializeForm(document.getElementById('test-form')));
});

When('the data is deserialized to the form', async function() {
    await this.page.evaluate(() =>
        window.bindX.deserializeForm(document.getElementById('test-form'), window._testData));
});

When('the form is scanned', async function() {
    if (this.nullData) {
        this.lastError = await this.page.evaluate(() => {
            try {
                window.__nullScan = window.bindX.scan(window.__app(), null);
                return null;
            } catch (error) {
                return error.message;
            }
        });
        return;
    }
    await render(this);
});

When('the user types in the input', async function() {
    await this.page.locator('#test-form input[type="text"]').first().fill('modified');
});

When('the form is submitted', async function() {
    this.submitEvent = await this.page.evaluate(() => {
        const form = document.getElementById('test-form');
        window.__formEvents = [];
        ['bx-form-valid', 'bx-form-invalid'].forEach(name =>
            form.addEventListener(name, e => window.__formEvents.push({ name, detail: JSON.parse(JSON.stringify(e.detail)) })));
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
        return { defaultPrevented: event.defaultPrevented };
    });
});

When('the form is reset', async function() {
    await this.page.evaluate(() =>
        window.bindX.resetForm(document.getElementById('test-form'), window._reactive || null));
});

When('the user types {string} in the email field', async function(text) {
    await this.page.locator('#email').fill(text);
});

When('the user corrects the value', async function() {
    await this.page.locator('#email').fill('test@example.com');
});

When('the user changes a field value', async function() {
    await this.page.locator('#email').fill('new@example.com');
});

When('the data is updated programmatically', async function() {
    await setData(this, 'email', 'not-an-email');
    await setData(this, 'name', '');
});

// ============================================================================
// ASSERTIONS - VALIDATION
// ============================================================================

Then('the form should be invalid', function() {
    assert.strictEqual(this.validationResult.valid, false);
});

Then('the form should be valid', function() {
    assert.strictEqual(this.validationResult.valid, true, JSON.stringify(this.validationResult.errors));
});

Then('the {word} field should have error class', async function(fieldName) {
    const info = await fieldInfo(this.page, `#${fieldName}`);
    assert.ok(info.classes.includes('bx-error'), `Field ${fieldName} classes: ${info.classes}`);
});

Then('the {word} field should have error {string}', function(fieldName, rule) {
    const errors = this.validationResult.errors[fieldName] || [];
    assert.ok(errors.some(e => e.includes(`(${rule})`)), `${fieldName} errors ${JSON.stringify(errors)} should name ${rule}`);
});

Then('there should be {int} errors for {word} field', function(count, fieldName) {
    assert.strictEqual((this.validationResult.errors[fieldName] || []).length, count,
        JSON.stringify(this.validationResult.errors));
});

// ============================================================================
// ASSERTIONS - SERIALIZATION
// ============================================================================

Then('the result should contain {word}={string}', function(key, value) {
    assert.strictEqual(this.serializedData[key], value);
});

Then('the result should have {word}.{word}={string}', function(obj, prop, value) {
    assert.strictEqual(this.serializedData[obj]?.[prop], value, JSON.stringify(this.serializedData));
});

Then(/^the "?([\w.]+)"? field should have value "([^"]*)"$/, async function(name, value) {
    const actual = await this.page.evaluate(n => document.querySelector(`[name="${n}"]`).value, name);
    assert.strictEqual(actual, value);
});

Then('the checkbox {string} should be checked', async function(name) {
    assert.strictEqual(await this.page.evaluate(n => document.querySelector(`[name="${n}"]`).checked, name), true);
});

Then('the radio button {string} value {string} should be selected', async function(name, value) {
    const checked = await this.page.evaluate(n =>
        [...document.querySelectorAll(`[name="${n}"]`)].filter(r => r.checked).map(r => r.value), name);
    assert.deepStrictEqual(checked, [value]);
});

// ============================================================================
// ASSERTIONS - STATE
// ============================================================================

Then('the form should have class {string}', async function(className) {
    const { classes } = await formState(this.page);
    assert.ok(classes.includes(className), `Form classes: ${classes}`);
});

Then('the form should not have class {string}', async function(className) {
    const { classes } = await formState(this.page);
    assert.ok(!classes.includes(className), `Form classes: ${classes}`);
});

Then('the form state {word} should be {word}', async function(stateName, value) {
    const state = await formState(this.page);
    assert.strictEqual(state[stateName], value === 'true', JSON.stringify(state));
    // bindX mirrors the state into the data for bx-bind="formState.*"
    const mirrored = await this.page.evaluate(n => window._reactive?.formState?.[n], stateName);
    assert.strictEqual(mirrored, value === 'true');
});

// ============================================================================
// ASSERTIONS - SUBMISSION
// ============================================================================

const formEvents = page => page.evaluate(() => window.__formEvents.map(e => e.name));

Then('the form should validate successfully', async function() {
    assert.strictEqual((await formState(this.page)).valid, true);
    assert.deepStrictEqual(await formEvents(this.page), ['bx-form-valid']);
});

Then('the form should not validate', async function() {
    assert.strictEqual((await formState(this.page)).valid, false);
    const errors = await this.page.evaluate(() => document.querySelectorAll('#test-form .bx-error').length);
    assert.ok(errors > 0, 'Invalid fields should be marked');
});

Then('a {string} event should be dispatched', async function(eventName) {
    assert.ok((await formEvents(this.page)).includes(eventName), `Events: ${await formEvents(this.page)}`);
});

Then('the reactive data should be updated with form values', async function() {
    const data = await this.page.evaluate(() => ({ note: window._reactive.note, email: window._reactive.email }));
    assert.deepStrictEqual(data, { note: 'from the form', email: this.expectedValues.email });
});

Then('the reactive data should not be updated', async function() {
    const note = await this.page.evaluate(() => window._reactive.note);
    assert.strictEqual(note, undefined, 'An invalid submit must not copy form values into the data');
});

Then('the custom handler should be called with form data', async function() {
    const { calls, serialized } = await this.page.evaluate(() => ({
        calls: window.__submitCalls,
        serialized: window.bindX.serializeForm(document.getElementById('test-form'))
    }));
    assert.strictEqual(calls.length, 1, 'The handler should run once per submit');
    assert.deepStrictEqual(calls[0].formData, serialized);
    assert.strictEqual(calls[0].hasData, true, 'The handler also gets the reactive data');
});

Then('the default form submission should be prevented', function() {
    assert.ok(this.submitEvent.defaultPrevented, 'Default should be prevented');
});

// ============================================================================
// ASSERTIONS - RESET AND FEEDBACK
// ============================================================================

Then('all fields should be empty', async function() {
    const values = await this.page.evaluate(() =>
        [...document.querySelectorAll('#test-form input[type="text"]')].map(i => i.value));
    assert.ok(values.length > 0);
    assert.deepStrictEqual(values, values.map(() => ''));
});

Then('all error classes should be removed', async function() {
    const marked = await this.page.evaluate(() => document.querySelectorAll('#test-form .bx-error, #test-form .bx-valid').length);
    assert.strictEqual(marked, 0);
});

Then('all error messages should be cleared', async function() {
    const messages = await this.page.evaluate(() =>
        [...document.querySelectorAll('#test-form .bx-error-message')].map(m => m.textContent));
    assert.ok(messages.length > 0);
    assert.deepStrictEqual(messages, messages.map(() => ''));
});

Then('the field should have class {string}', async function(className) {
    const info = await fieldInfo(this.page, '[bx-validate]');
    assert.ok(info.classes.includes(className), `Field classes: ${info.classes}`);
});

Then('the field should not have error class', async function() {
    const info = await fieldInfo(this.page, '[bx-validate]');
    assert.ok(!info.classes.includes('bx-error'), `Field classes: ${info.classes}`);
});

Then('an error message should be displayed', async function() {
    const info = await fieldInfo(this.page, '[bx-validate]');
    assert.ok(info.message, 'The error message container should have text');
});

Then('the error message should be cleared', async function() {
    assert.strictEqual((await fieldInfo(this.page, '#email')).message, '');
});

Then('the error message should be {string}', async function(message) {
    assert.deepStrictEqual(this.validationResult.errors.value, [message]);
    assert.strictEqual((await fieldInfo(this.page, '#value')).message, message);
});

Then('the bindX error message should contain {string}', async function(text) {
    const message = this.lastBindxError ||
        await this.page.evaluate(() => window.__lastError || null) ||
        (this.pageErrors || []).slice(-1)[0];
    assert.ok(message, 'Expected a bindX error');
    assert.ok(message.includes(text), `Error "${message}" should contain "${text}"`);
});

// ============================================================================
// ASSERTIONS - BX-MODEL INTEGRATION
// ============================================================================

Then('the reactive data should update immediately', async function() {
    assert.strictEqual(await this.page.evaluate(() => window._reactive.email), 'new@example.com');
});

Then('validation should run on the new value', async function() {
    assert.ok((await fieldInfo(this.page, '#email')).classes.includes('bx-valid'));
    await this.page.locator('#email').fill('broken');
    assert.ok((await fieldInfo(this.page, '#email')).classes.includes('bx-error'));
    assert.strictEqual((await formState(this.page)).valid, false);
});

Then('the form fields should update', async function() {
    await nextFrames(this);
    const values = await this.page.evaluate(() => ({
        email: document.getElementById('email').value,
        name: document.getElementById('name').value
    }));
    assert.deepStrictEqual(values, { email: 'not-an-email', name: '' });
});

Then('validation should reflect the new values', async function() {
    const result = await this.page.evaluate(() =>
        window.bindX.validateForm(document.getElementById('test-form'), window._reactive));
    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual(Object.keys(result.errors).sort(), ['email', 'name']);
});

// ============================================================================
// ASSERTIONS - EDGE CASES
// ============================================================================

Then('a warning should be logged', function() {
    const warnings = consoleOf(this, 'warning').filter(m => m.text.startsWith('bindX:'));
    assert.ok(warnings.length > 0, 'Expected a bindX warning');
});

Then('the field should be skipped', async function() {
    assert.deepStrictEqual(this.validationResult.errors, {});
    const info = await fieldInfo(this.page, '#value');
    assert.deepStrictEqual(info.classes, []);
});

Then('no validation should occur', async function() {
    assert.deepStrictEqual(this.validationResult.errors, {});
    const info = await fieldInfo(this.page, '#value');
    assert.deepStrictEqual(info.classes, [], 'An empty bx-validate should not mark the field');
});

// 'no error should occur' lives in loadx-dynamic-content.steps.js.

Then('no form handlers should be set up', async function() {
    const state = await this.page.evaluate(() => {
        const form = document.getElementById('test-form');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
        return { classes: [...form.classList], prevented: event.defaultPrevented };
    });
    assert.deepStrictEqual(state, { classes: [], prevented: false });
});
