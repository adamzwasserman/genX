/**
 * Step definitions for loadX Granular autoDetect Configuration feature.
 * Loads the real module in the page and reads the normalized config that
 * init() returns, then checks detector behavior where it is observable.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

const DETECTORS = ['fetch', 'xhr', 'htmx', 'forms'];

async function initLoadX(world, config) {
    await world.page.addScriptTag({ path: './src/genx-common.js' });
    await world.page.addScriptTag({ path: './src/loadx.js' });
    world.autoDetectResult = await world.page.evaluate(
        cfg => window.loadX.init(cfg), config);
}

function detector(world, name) {
    const autoDetect = world.autoDetectResult?.config?.autoDetect;
    assert.ok(autoDetect && typeof autoDetect === 'object',
        `init() should normalize autoDetect to an object, got ${JSON.stringify(autoDetect)}`);
    assert.deepStrictEqual(Object.keys(autoDetect).sort(), [...DETECTORS].sort());
    return autoDetect[name];
}

// ============================================================================
// CONFIGURATION INITIALIZATION
// ============================================================================

Given(/^loadX is initialized with autoDetect: (true|false)$/, async function(value) {
    await initLoadX(this, { autoDetect: value === 'true' });
});

// Object form, e.g. autoDetect: {fetch: true, xhr: false}
Given(/^loadX is initialized with autoDetect: (\{.*\})$/, async function(objectText) {
    const detectorConfig = JSON.parse(objectText.replace(/(\w+):/g, '"$1":'));
    await initLoadX(this, { autoDetect: detectorConfig });
});

Given('loadX is initialized without autoDetect config', async function() {
    await initLoadX(this, {});
});

// ============================================================================
// DETECTOR ASSERTIONS
// ============================================================================

for (const name of DETECTORS) {
    Then(`${name} detector should be enabled`, function() {
        assert.strictEqual(detector(this, name), true, `${name} detector should be enabled`);
    });
    Then(`${name} detector should be disabled`, function() {
        assert.strictEqual(detector(this, name), false, `${name} detector should be disabled`);
    });
    Then(`${name} detector should be enabled by default`, function() {
        assert.strictEqual(detector(this, name), true, `${name} detector should default to enabled`);
    });
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

When('a form is submitted', async function() {
    await this.page.evaluate(() => {
        const form = document.createElement('form');
        form.id = 'test-form';
        form.setAttribute('lx-loading', '');
        form.innerHTML = '<button type="submit">Submit</button>';
        form.addEventListener('submit', e => e.preventDefault());
        document.body.appendChild(form);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
});

Then('forms detector should not trigger loading state', async function() {
    const busy = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('#test-form, #test-form button'))
            .some(el => el.getAttribute('aria-busy') === 'true' || el.classList.contains('lx-loading')));
    assert.strictEqual(busy, false, 'forms detector should not apply loading state when disabled');
});

Then('manual loading state application should still work', async function() {
    const busy = await this.page.evaluate(() => {
        const form = document.getElementById('test-form');
        window.loadX.apply(form, { strategy: 'spinner' });
        return form.getAttribute('aria-busy');
    });
    assert.strictEqual(busy, 'true', 'loadX.apply should still set the loading state');
});
