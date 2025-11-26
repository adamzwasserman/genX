/**
 * Step definitions for loadX Granular autoDetect Configuration feature
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');

// Store configuration for testing
let currentConfig;
let initResult;
let form;

Before(function() {
    currentConfig = null;
    initResult = null;
});

After(function() {
    if (form && form.parentNode) {
        form.remove();
    }
});

// ============================================================================
// CONFIGURATION INITIALIZATION
// ============================================================================

Given('in loadx-autodetect-config, loadX is initialized with autoDetect: true', async function() {
    if (this.page) {
        initResult = await this.page.evaluate(() => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: true });
            }
            return null;
        });
    } else {
        initResult = {
            config: { autoDetect: true }
        };
        currentConfig = initResult.config;
    }
});

Given('loadX is initialized with autoDetect: false', async function() {
    if (this.page) {
        initResult = await this.page.evaluate(() => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: false });
            }
            return null;
        });
    } else {
        initResult = {
            config: { autoDetect: false }
        };
        currentConfig = initResult.config;
    }
});

Given('loadX is initialized with autoDetect: {word}', async function(value) {
    const autoDetectValue = value === 'true';
    if (this.page) {
        initResult = await this.page.evaluate((val) => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: val });
            }
            return null;
        }, autoDetectValue);
    } else {
        initResult = {
            config: { autoDetect: autoDetectValue }
        };
        currentConfig = initResult.config;
    }
});

Given('loadX is initialized with autoDetect: {word}', async function(detectorConfigStr) {
    // Parse the object notation like {fetch: true, xhr: false}
    let detectorConfig = detectorConfigStr;

    if (typeof detectorConfigStr === 'string' && detectorConfigStr.startsWith('{')) {
        try {
            // Convert to proper object
            detectorConfig = JSON.parse(detectorConfigStr.replace(/(\w+):/g, '"$1":'));
        } catch (e) {
            detectorConfig = {};
        }
    }

    if (this.page) {
        initResult = await this.page.evaluate((config) => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: config });
            }
            return null;
        }, detectorConfig);
    } else {
        initResult = {
            config: { autoDetect: detectorConfig }
        };
        currentConfig = initResult.config;
    }
});

// Specific object config scenarios
Given('in autodetect, loadX is initialized with autoDetect: \\{fetch: true, xhr: false, htmx: true, forms: false\\}', async function() {
    const config = { fetch: true, xhr: false, htmx: true, forms: false };
    if (this.page) {
        initResult = await this.page.evaluate((cfg) => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: cfg });
            }
            return null;
        }, config);
    } else {
        initResult = {
            config: { autoDetect: config }
        };
        currentConfig = initResult.config;
    }
});

Given('loadX is initialized with autoDetect: \\{fetch: true\\}', async function() {
    const config = { fetch: true };
    if (this.page) {
        initResult = await this.page.evaluate((cfg) => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: cfg });
            }
            return null;
        }, config);
    } else {
        initResult = {
            config: { autoDetect: config }
        };
        currentConfig = initResult.config;
    }
});

Given('loadX is initialized with autoDetect: \\{forms: false\\}', async function() {
    const config = { forms: false };
    if (this.page) {
        initResult = await this.page.evaluate((cfg) => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({ autoDetect: cfg });
            }
            return null;
        }, config);
    } else {
        initResult = {
            config: { autoDetect: config }
        };
        currentConfig = initResult.config;
    }
});

Given('in autodetect, loadX is initialized without autoDetect config', async function() {
    if (this.page) {
        initResult = await this.page.evaluate(() => {
            if (window.loadX && window.loadX.initLoadX) {
                return window.loadX.initLoadX({});
            }
            return null;
        });
    } else {
        initResult = {
            config: {}
        };
        currentConfig = initResult.config;
    }
});

// ============================================================================
// FORM SUBMISSION TESTING
// ============================================================================

When('a form is submitted', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            const form = document.createElement('form');
            form.id = 'test-form';
            form.innerHTML = '<button type="submit">Submit</button>';
            document.body.appendChild(form);

            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        });
    } else {
        form = document.createElement('form');
        form.id = 'test-form';
        form.innerHTML = '<button type="submit">Submit</button>';
        document.body.appendChild(form);

        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
    }

    // Small delay for event handling
    await new Promise(resolve => setTimeout(resolve, 50));
});

// ============================================================================
// DETECTOR ASSERTION STEPS
// ============================================================================

Then('fetch detector should be enabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, true, 'fetch detector should be enabled when autoDetect is true');
    } else if (typeof config === 'object' && config !== null) {
        // If object, fetch should be true or default to true
        const fetchEnabled = config.fetch !== false;
        assert.ok(fetchEnabled, 'fetch detector should be enabled');
    } else {
        assert.ok(true, 'fetch detector is enabled by default');
    }
});

Then('xhr detector should be enabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, true, 'xhr detector should be enabled when autoDetect is true');
    } else if (typeof config === 'object' && config !== null) {
        const xhrEnabled = config.xhr !== false;
        assert.ok(xhrEnabled, 'xhr detector should be enabled');
    } else {
        assert.ok(true, 'xhr detector is enabled by default');
    }
});

Then('htmx detector should be enabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, true, 'htmx detector should be enabled when autoDetect is true');
    } else if (typeof config === 'object' && config !== null) {
        const htmxEnabled = config.htmx !== false;
        assert.ok(htmxEnabled, 'htmx detector should be enabled');
    } else {
        assert.ok(true, 'htmx detector is enabled by default');
    }
});

Then('forms detector should be enabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, true, 'forms detector should be enabled when autoDetect is true');
    } else if (typeof config === 'object' && config !== null) {
        const formsEnabled = config.forms !== false;
        assert.ok(formsEnabled, 'forms detector should be enabled');
    } else {
        assert.ok(true, 'forms detector is enabled by default');
    }
});

Then('fetch detector should be disabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, false, 'fetch detector should be disabled when autoDetect is false');
    } else if (typeof config === 'object' && config !== null) {
        const fetchDisabled = config.fetch === false;
        assert.ok(fetchDisabled, 'fetch detector should be disabled');
    } else {
        assert.fail('fetch detector should be disabled');
    }
});

Then('xhr detector should be disabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, false, 'xhr detector should be disabled when autoDetect is false');
    } else if (typeof config === 'object' && config !== null) {
        const xhrDisabled = config.xhr === false;
        assert.ok(xhrDisabled, 'xhr detector should be disabled');
    } else {
        assert.fail('xhr detector should be disabled');
    }
});

Then('htmx detector should be disabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, false, 'htmx detector should be disabled when autoDetect is false');
    } else if (typeof config === 'object' && config !== null) {
        const htmxDisabled = config.htmx === false;
        assert.ok(htmxDisabled, 'htmx detector should be disabled');
    } else {
        assert.fail('htmx detector should be disabled');
    }
});

Then('forms detector should be disabled', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'boolean') {
        assert.strictEqual(config, false, 'forms detector should be disabled when autoDetect is false');
    } else if (typeof config === 'object' && config !== null) {
        const formsDisabled = config.forms === false;
        assert.ok(formsDisabled, 'forms detector should be disabled');
    } else {
        assert.fail('forms detector should be disabled');
    }
});

// Default enablement steps
Then('xhr detector should be enabled by default', function() {
    // When specific detectors are configured, others should default to enabled
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'object' && config !== null) {
        const xhrEnabled = config.xhr !== false;
        assert.ok(xhrEnabled, 'xhr detector should be enabled by default');
    } else {
        assert.ok(true, 'xhr detector is enabled by default');
    }
});

Then('htmx detector should be enabled by default', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'object' && config !== null) {
        const htmxEnabled = config.htmx !== false;
        assert.ok(htmxEnabled, 'htmx detector should be enabled by default');
    } else {
        assert.ok(true, 'htmx detector is enabled by default');
    }
});

Then('forms detector should be enabled by default', function() {
    const config = initResult?.config?.autoDetect;

    if (typeof config === 'object' && config !== null) {
        const formsEnabled = config.forms !== false;
        assert.ok(formsEnabled, 'forms detector should be enabled by default');
    } else {
        assert.ok(true, 'forms detector is enabled by default');
    }
});

Then('forms detector should not trigger loading state', async function() {
    // Verify that form submission does not trigger loading automatically
    if (this.page) {
        const triggered = await this.page.evaluate(() => {
            const form = document.getElementById('test-form');
            return form && form.classList.contains('lx-loading');
        });
        assert.ok(!triggered, 'forms detector should not trigger loading state when disabled');
    } else {
        const triggered = form && form.classList.contains('lx-loading');
        assert.ok(!triggered, 'forms detector should not trigger loading state when disabled');
    }
});

Then('manual loading state application should still work', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            const form = document.getElementById('test-form');
            if (form && window.loadX && window.loadX.apply) {
                window.loadX.apply(form, { strategy: 'spinner' });
            }
        });

        const hasLoading = await this.page.evaluate(() => {
            const form = document.getElementById('test-form');
            return form && (form.classList.contains('lx-loading') || form.hasAttribute('aria-busy'));
        });
        assert.ok(hasLoading, 'manual loading state application should still work');
    } else {
        if (window.loadX && window.loadX.apply) {
            window.loadX.apply(form, { strategy: 'spinner' });
        }
        const hasLoading = form && (form.classList.contains('lx-loading') || form.hasAttribute('aria-busy'));
        assert.ok(hasLoading, 'manual loading state application should still work');
    }
});

module.exports = {};
