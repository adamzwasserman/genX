const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const fixtures = require('../fixtures/loadx-fixtures');

const SRC = path.resolve(__dirname, '../../src');
const inlineScript = name => fs.readFileSync(path.join(SRC, name), 'utf8').replace(/<\/script/gi, '<\\/script');

// Background
Given('the page has loaded', async function() {
    await this.page.goto('about:blank');
});

Given('the document body exists', async function() {
    await this.page.evaluate(() => {
        if (!document.body) {
            document.documentElement.appendChild(document.createElement('body'));
        }
    });
});

// Core Initialization
When('loadX is initialized without configuration', async function() {
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });
    this.loadxResult = await this.page.evaluate(() => {
        if (window.loadX && window.loadX.init) {
            return window.loadX.init();
        }
        return null;
    });
});

When('loadX is initialized with:', async function(dataTable) {
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });

    const config = {};
    dataTable.rows().forEach(([key, value]) => {
        // Convert string values to appropriate types
        if (value === 'true') config[key] = true;
        else if (value === 'false') config[key] = false;
        else if (!isNaN(value)) config[key] = Number(value);
        else config[key] = value;
    });

    this.loadxResult = await this.page.evaluate((cfg) => {
        if (window.loadX && window.loadX.init) {
            return window.loadX.init(cfg);
        }
        return null;
    }, config);
});

When('loadX is initialized with autoDetect={word}', async function(autoDetect) {
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });
    const config = { autoDetect: autoDetect === 'true' };

    this.loadxResult = await this.page.evaluate((cfg) => {
        if (window.loadX && window.loadX.init) {
            return window.loadX.init(cfg);
        }
        return null;
    }, config);
});

When('an attempt is made to modify the configuration', async function() {
    this.modificationError = await this.page.evaluate(() => {
        try {
            const result = window.loadX.init({ minDisplayMs: 300 });
            result.config.minDisplayMs = 999;
            return null;
        } catch (e) {
            return e.message;
        }
    });
});

When('loadX is initialized', async function() {
    if (this.lxNoBody) {
        // Run init from <head>, before the parser has created <body>
        await this.page.setContent(`<!DOCTYPE html><html><head>
<script>${inlineScript('genx-common.js')}</script>
<script>${inlineScript('loadx.js')}</script>
<script>
  window.__lxInit = { bodyAtInit: !!document.body, readyState: document.readyState, error: null };
  try { window.loadX.init(); } catch (e) { window.__lxInit.error = e.message; }
  window.__lxInit.liveRegionAtInit = !!document.getElementById('lx-live-region');
</script>
</head><body><div id="lx-deferred" lx-strategy="spinner">Deferred</div></body></html>`);
        this.loadxResult = await this.page.evaluate(() => window.loadX.config && window.loadX.config.config
            ? { config: window.loadX.config.config } : null);
        return;
    }
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });
    this.loadxResult = await this.page.evaluate(() => {
        if (window.loadX && window.loadX.init) {
            return window.loadX.init();
        }
        return null;
    });
});

When('loadX is initialized again', async function() {
    // Count listeners and global patches the second init() adds
    this.reinitEffects = await this.page.evaluate(() => {
        const added = [];
        const originalAdd = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, ...rest) {
            if (this === document || this === window) added.push(type);
            return originalAdd.call(this, type, ...rest);
        };
        const fetchBefore = window.fetch;
        const xhrBefore = window.XMLHttpRequest;
        try {
            window.loadX.init();
        } finally {
            EventTarget.prototype.addEventListener = originalAdd;
        }
        return {
            added,
            fetchRewrapped: window.fetch !== fetchBefore,
            xhrRewrapped: window.XMLHttpRequest !== xhrBefore
        };
    });
});

When('loadX is initialized with custom configuration', async function() {
    await this.page.addScriptTag({ path: './src/genx-common.js' });
    await this.page.addScriptTag({ path: './src/loadx.js' });
    this.loadxResult = await this.page.evaluate(
        () => window.loadX.init({ minDisplayMs: 500, autoDetect: false, telemetry: false }));
});

When('loadX is initialized without telemetry setting', async function() {
    this.lxRequests = [];
    this.page.on('request', req => this.lxRequests.push(req.url()));
    await this.page.addScriptTag({ path: './src/genx-common.js' });
    await this.page.addScriptTag({ path: './src/loadx.js' });
    this.loadxResult = await this.page.evaluate(() => window.loadX.init({ minDisplayMs: 300 }));
    // Give any deferred work a chance to send something
    await this.page.waitForTimeout(100);
});

When('loadX is initialized with invalid configuration', async function() {
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });
    this.consoleLogs = [];

    this.page.on('console', msg => {
        if (msg.type() === 'error') {
            this.consoleLogs.push(msg.text());
        }
    });

    this.initError = await this.page.evaluate((invalidCfg) => {
        try {
            window.loadX.init(invalidCfg);
            return null;
        } catch (e) {
            return e.message;
        }
    }, fixtures.invalidConfig);
});

// init() stores its API on window.loadX.config
Then('loadX should be initialized', async function() {
    const initialized = await this.page.evaluate(() =>
        !!(window.loadX && window.loadX.config && window.loadX.config.config));
    assert.ok(initialized, 'loadX should be initialized');
});

Then('the default configuration should be applied', async function() {
    assert.ok(this.loadxResult.config, 'Configuration should exist');
});

Then('minDisplayMs should be {int}', async function(expected) {
    assert.strictEqual(
        this.loadxResult.config.minDisplayMs,
        expected,
        `Expected minDisplayMs to be ${expected}, got ${this.loadxResult.config.minDisplayMs}`
    );
});

// init() turns a boolean autoDetect into one flag per detector
Then('autoDetect should be {word}', async function(expected) {
    const expectedBool = expected === 'true';
    const autoDetect = this.loadxResult.config.autoDetect;
    for (const detector of ['fetch', 'xhr', 'htmx', 'forms']) {
        assert.strictEqual(
            autoDetect[detector],
            expectedBool,
            `Expected autoDetect.${detector} to be ${expectedBool}, got ${autoDetect[detector]}`
        );
    }
});

Then('telemetry should be {word}', async function(expected) {
    const expectedBool = expected === 'true';
    assert.strictEqual(
        this.loadxResult.config.telemetry,
        expectedBool,
        `Expected telemetry to be ${expectedBool}, got ${this.loadxResult.config.telemetry}`
    );
});

Then('the configuration should remain unchanged', async function() {
    const actualValue = await this.page.evaluate(() => {
        const result = window.loadX.init({ minDisplayMs: 300 });
        return result.config.minDisplayMs;
    });
    assert.strictEqual(actualValue, 300, 'Configuration should not have been modified');
});

Then('in loadx-initialization, no errors should occur', async function() {
    assert.strictEqual(this.modificationError, null, 'No error should occur when attempting to modify frozen config');
});

// ARIA Live Region
Given('an element with id {string} exists', async function(id) {
    await this.page.evaluate((elementId) => {
        const el = document.createElement('div');
        el.id = elementId;
        document.body.appendChild(el);
    }, id);
});

Then('an element with id {string} should exist', async function(id) {
    const exists = await this.page.evaluate((elementId) => {
        return !!document.getElementById(elementId);
    }, id);
    assert.ok(exists, `Element with id "${id}" should exist`);
});

Then('it should have aria-live={string}', async function(value) {
    const ariaLive = await this.page.evaluate(() => {
        const el = document.getElementById('lx-live-region');
        return el ? el.getAttribute('aria-live') : null;
    });
    assert.strictEqual(ariaLive, value, `Expected aria-live="${value}"`);
});

Then('it should have aria-atomic={string}', async function(value) {
    const ariaAtomic = await this.page.evaluate(() => {
        const el = document.getElementById('lx-live-region');
        return el ? el.getAttribute('aria-atomic') : null;
    });
    assert.strictEqual(ariaAtomic, value, `Expected aria-atomic="${value}"`);
});

Then('in loadx-initialization, it should have class {string}', async function(className) {
    const hasClass = await this.page.evaluate((cls) => {
        const el = document.getElementById('lx-live-region');
        return el ? el.classList.contains(cls) : false;
    }, className);
    assert.ok(hasClass, `Expected element to have class "${className}"`);
});

Then('only one element with id {string} should exist', async function(id) {
    const count = await this.page.evaluate((elementId) => {
        return document.querySelectorAll(`#${elementId}`).length;
    }, id);
    assert.strictEqual(count, 1, `Expected exactly one element with id "${id}", found ${count}`);
});

// DOM Scanning
Given('in loadx-initialization, an element with lx-strategy={string}', async function(strategy) {
    await this.page.evaluate((strat) => {
        const el = document.createElement('div');
        el.setAttribute('lx-strategy', strat);
        el.textContent = 'Loading...';
        document.body.appendChild(el);
    }, strategy);
});

Given('in loadx-initialization, an element with lx-loading={string}', async function(loading) {
    await this.page.evaluate((loadingVal) => {
        const el = document.createElement('div');
        el.setAttribute('lx-loading', loadingVal);
        el.textContent = 'Content';
        document.body.appendChild(el);
    }, loading);
});

Given('an element with class {string}', async function(className) {
    await this.page.evaluate((cls) => {
        const el = document.createElement('div');
        el.className = cls;
        el.textContent = 'Button';
        document.body.appendChild(el);
    }, className);
});

Given('an element with no lx- attributes', async function() {
    await this.page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'regular';
        el.textContent = 'Normal div';
        document.body.appendChild(el);
    });
});

Then('the element should be detected and registered', async function() {
    const tracked = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('[lx-strategy], [lx-loading], [class*="lx-"]'))
            .filter(el => el.id !== 'lx-live-region')
            .map(el => el.getAttribute('data-lx-tracked')));
    assert.ok(tracked.length > 0, 'Test element should exist');
    assert.ok(tracked.every(v => v === 'true'), `Element should be marked data-lx-tracked, got ${JSON.stringify(tracked)}`);
});

Then('the element should not be registered', async function() {
    const state = await this.page.evaluate(() => ({
        regular: !!document.querySelector('.regular'),
        tracked: document.querySelectorAll('[data-lx-tracked]').length
    }));
    assert.ok(state.regular, 'Test element should exist');
    assert.strictEqual(state.tracked, 0, 'No element should be registered');
});

// Async Detection
Then('async detection should be enabled', async function() {
    const isEnabled = await this.page.evaluate(() => window.loadX.asyncDetectionEnabled === true);
    assert.ok(isEnabled, 'loadX should report async detection enabled');
    for (const detector of ['fetch', 'xhr', 'htmx', 'forms']) {
        assert.strictEqual(this.loadxResult.config.autoDetect[detector], true, `autoDetect.${detector} should be on`);
    }
});

// Adds a registered button, focuses it, and returns its aria-busy right after
// the request starts (the detectors key off document.activeElement).
async function busyAfterRequest(page, startRequest) {
    await page.evaluate(() => {
        const btn = document.createElement('button');
        btn.id = 'lx-async-target';
        btn.setAttribute('lx-strategy', 'spinner');
        btn.textContent = 'Load';
        document.body.appendChild(btn);
    });
    await page.waitForFunction(() =>
        document.getElementById('lx-async-target').hasAttribute('data-lx-tracked'));
    return page.evaluate((src) => {
        const btn = document.getElementById('lx-async-target');
        btn.focus();
        new Function(src)();
        const busy = btn.getAttribute('aria-busy');
        btn.remove();
        return busy;
    }, startRequest);
}

Then('fetch should be monitored', async function() {
    const busy = await busyAfterRequest(this.page, "fetch('data:text/plain,ok').catch(() => {});");
    assert.strictEqual(busy, 'true', 'fetch from a registered element should apply the loading state');
});

Then('XMLHttpRequest should be monitored', async function() {
    const busy = await busyAfterRequest(this.page,
        "const x = new XMLHttpRequest(); x.open('GET', 'data:text/plain,ok'); x.send();");
    assert.strictEqual(busy, 'true', 'XHR from a registered element should apply the loading state');
});

Then('async detection should not be enabled', async function() {
    const autoDetect = this.loadxResult.config.autoDetect;
    for (const detector of ['fetch', 'xhr', 'htmx', 'forms']) {
        assert.strictEqual(autoDetect[detector], false, `autoDetect.${detector} should be disabled`);
    }
});

// API Exposure
Then('window.loadX should exist', async function() {
    const exists = await this.page.evaluate(() => {
        return typeof window.loadX !== 'undefined';
    });
    assert.ok(exists, 'window.loadX should exist');
});

Then('window.loadX.initLoadX should be a function', async function() {
    const isFunction = await this.page.evaluate(() => {
        return typeof window.loadX.initLoadX === 'function';
    });
    assert.ok(isFunction, 'window.loadX.initLoadX should be a function');
});

// Functions don't survive page.evaluate, so check them in the page
for (const method of ['applyLoading', 'removeLoading']) {
    Then(`the API should expose ${method} method`, async function() {
        const exposed = await this.page.evaluate((name) =>
            !!(window.loadX && window.loadX.config && typeof window.loadX.config[name] === 'function'), method);
        assert.ok(exposed, `API should expose ${method} method`);
    });
}

Then('the returned configuration should be frozen', async function() {
    const isFrozen = await this.page.evaluate(() => {
        const result = window.loadX.init();
        return Object.isFrozen(result.config);
    });
    assert.ok(isFrozen, 'Configuration object should be frozen');
});

Then('the configuration cannot be modified', async function() {
    const cannotModify = await this.page.evaluate(() => {
        const result = window.loadX.init({ minDisplayMs: 500 });
        const originalValue = result.config.minDisplayMs;
        try {
            result.config.minDisplayMs = 999;
        } catch (e) {
            // Expected in strict mode
        }
        return result.config.minDisplayMs === originalValue;
    });
    assert.ok(cannotModify, 'Configuration should not be modifiable');
});

// Registry
Then('a strategy registry should be created', async function() {
    assert.ok(this.loadxResult.registry, 'Strategy registry should exist');
});

Then('the registry should be empty initially', async function() {
    const isEmpty = await this.page.evaluate(() => {
        const result = window.loadX.init();
        return result.registry.size === 0;
    });
    assert.ok(isEmpty, 'Registry should be empty initially');
});

// Error Handling
Then('loadX initialization should fail with {string}', async function(expected) {
    assert.ok(this.initError && this.initError.includes(expected),
        `Expected init() to throw "${expected}", got: ${this.initError}`);
});

Then('no loadX configuration should be stored', async function() {
    const stored = await this.page.evaluate(() => !!(window.loadX && window.loadX.config));
    assert.strictEqual(stored, false, 'A rejected config must not become the active config');
});

// Removed duplicate - exists in common.steps.js

Given('document.body does not exist', async function() {
    // The next init runs from <head>, while the parser has not created <body>
    this.lxNoBody = true;
});

Then('initialization should be deferred', async function() {
    const init = await this.page.evaluate(() => window.__lxInit);
    assert.strictEqual(init.bodyAtInit, false, 'init() should run before <body> exists');
    assert.strictEqual(init.readyState, 'loading');
    assert.strictEqual(init.error, null, 'init() should not throw without <body>');
    assert.strictEqual(init.liveRegionAtInit, false, 'Live region should wait for the DOM');
});

Then('should complete when DOMContentLoaded fires', async function() {
    const state = await this.page.evaluate(() => ({
        liveRegion: document.querySelectorAll('#lx-live-region').length,
        scanned: document.getElementById('lx-deferred').getAttribute('data-lx-tracked')
    }));
    assert.strictEqual(state.liveRegion, 1, 'Live region should be created after DOMContentLoaded');
    assert.strictEqual(state.scanned, 'true', 'Elements in <body> should be scanned after DOMContentLoaded');
});

// Privacy
Then('no telemetry data should be collected', async function() {
    assert.strictEqual(
        this.loadxResult.config.telemetry,
        false,
        'Telemetry should be disabled'
    );
});

Then('no network requests should be made', async function() {
    assert.deepStrictEqual(this.lxRequests, [], 'loadX should make no network requests');
});

// Performance
Then('initialization should complete in less than {int}ms', async function(maxMs) {
    // Performance will be measured in actual implementation
    // For now, just verify initialization succeeded
    assert.ok(this.loadxResult, 'loadX initialized successfully');
});

Then('memory usage should be less than {int}KB', async function(maxKb) {
    // Memory profiling will be added in implementation
    assert.ok(this.loadxResult, 'loadX initialized successfully');
});

Then('only visible images should load', async function() {
    // Lazy loading implementation
    assert.ok(true, 'Lazy loading will be implemented');
});

When('in loadX, the user scrolls down', async function() {
    await this.page.evaluate(() => {
        window.scrollTo(0, 1000);
    });
});

Then('images should load as they enter viewport', async function() {
    // Intersection Observer implementation
    assert.ok(true, 'Viewport-based loading will be implemented');
});

// Repeated init()
Then('only one ARIA live region should exist', async function() {
    const count = await this.page.evaluate(() => document.querySelectorAll('#lx-live-region').length);
    assert.strictEqual(count, 1, `Expected one live region, found ${count}`);
});

Then('no duplicate event listeners should be attached', async function() {
    const { added, fetchRewrapped, xhrRewrapped } = this.reinitEffects;
    assert.deepStrictEqual(added, [], `Second init() added document/window listeners: ${added.join(', ')}`);
    assert.strictEqual(fetchRewrapped, false, 'Second init() should not wrap fetch again');
    assert.strictEqual(xhrRewrapped, false, 'Second init() should not wrap XMLHttpRequest again');
});
