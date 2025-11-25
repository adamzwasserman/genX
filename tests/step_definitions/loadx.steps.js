/**
 * Step definitions for loadX module (main feature)
 * Also covers loadx-async-detection.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the loadX module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/loadx.js' });

    // Wait for loadX to be available
    await this.page.waitForFunction(() => window.loadX !== undefined);
});

// ============================================================================
// BASIC LOADING STATE
// ============================================================================

Given('in loadx, an element with lx-loading={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="${enabled}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('an async operation is in progress', async function() {
    await this.page.evaluate(() => {
        window._asyncOp = new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    });
});

Then('loading state should be applied', async function() {
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading') ||
        el.getAttribute('aria-busy') === 'true'
    );
    expect(hasLoading).toBe(true);
});

When('the operation completes', async function() {
    await this.page.evaluate(() => {
        return window._asyncOp;
    });
});

Then('loading state should be removed', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading') ||
        el.getAttribute('aria-busy') === 'true'
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// LOADING STRATEGIES
// ============================================================================

Given('an element with lx-strategy={string}', async function(strategy) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-strategy="${strategy}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Then('a {word} loading indicator should appear', async function(strategyType) {
    // Check for strategy-specific elements or classes
    const hasStrategy = await this.page.evaluate((type) => {
        const el = document.getElementById('test-element');
        return el.classList.contains(`lx-${type}`) ||
               el.querySelector(`.lx-${type}`) !== null;
    }, strategyType);
    expect(hasStrategy).toBe(true);
});

// ============================================================================
// ASYNC DETECTION - FETCH
// ============================================================================

Given('an element with lx-detect={string}', async function(detectMode) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-detect="${detectMode}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('a fetch request is made', async function() {
    await this.page.evaluate(() => {
        window._fetchRequest = fetch('https://api.example.com/data')
            .then(r => r.json());
    });
});

Then('loading state should activate automatically', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(true);
});

When('the fetch completes', async function() {
    await this.page.evaluate(() => {
        return window._fetchRequest;
    });
});

Then('loading state should deactivate automatically', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// ASYNC DETECTION - XHR
// ============================================================================

Given('an XHR request is made', async function() {
    await this.page.evaluate(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.example.com/data');
        window._xhrRequest = new Promise(resolve => {
            xhr.onload = resolve;
        });
        xhr.send();
    });
});

When('the XHR completes', async function() {
    await this.page.evaluate(() => {
        return window._xhrRequest;
    });
});

// ============================================================================
// ASYNC DETECTION - PROMISES
// ============================================================================

Given('a Promise is created', async function() {
    await this.page.evaluate(() => {
        window._promise = new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    });
});

When('the Promise resolves', async function() {
    await this.page.evaluate(() => {
        return window._promise;
    });
});

// ============================================================================
// ASYNC DETECTION - ASYNC/AWAIT
// ============================================================================

Given('an async function is called', async function() {
    await this.page.evaluate(() => {
        window._asyncFunc = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'done';
        };
        window._asyncCall = window._asyncFunc();
    });
});

When('the async function completes', async function() {
    await this.page.evaluate(() => {
        return window._asyncCall;
    });
});

// ============================================================================
// MANUAL CONTROL
// ============================================================================

Given('an element with loadX configured', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="manual">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

When('I call loadX.start\\()', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        if (window.loadX && window.loadX.start) {
            window.loadX.start(el);
        }
    });
});

Then('loading should start', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(true);
});

When('I call loadX.stop\\()', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        if (window.loadX && window.loadX.stop) {
            window.loadX.stop(el);
        }
    });
});

Then('loading should stop', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// MINIMUM DURATION
// ============================================================================

Given('an element with lx-min-duration={string}', async function(duration) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-min-duration="${duration}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('operation completes in {int}ms', async function(duration) {
    this.operationDuration = duration;
    await this.page.evaluate((dur) => {
        window._quickOp = new Promise(resolve => {
            setTimeout(resolve, dur);
        });
    }, duration);
});

Then('loading should display for at least {int}ms', async function(minDuration) {
    const start = Date.now();
    await this.page.evaluate(() => window._quickOp);
    await this.page.waitForFunction(() => {
        const el = document.getElementById('test-element');
        return !el.classList.contains('lx-loading');
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(minDuration);
});

// ============================================================================
// DELAY THRESHOLD
// ============================================================================

Given('an element with lx-delay={string}', async function(delay) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-delay="${delay}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('operation completes quickly \\(< delay)', async function() {
    await this.page.evaluate(() => {
        window._quickOp = new Promise(resolve => {
            setTimeout(resolve, 50);
        });
    });
});

Then('loading should never appear', async function() {
    await this.page.evaluate(() => window._quickOp);
    await this.page.waitForTimeout(100);
    const everShown = await this.page.evaluate(() => {
        return window._loadingWasShown || false;
    });
    expect(everShown).toBe(false);
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

Then('aria-busy should be set to {string}', async function(value) {
    const ariaBusy = await this.element.getAttribute('aria-busy');
    expect(ariaBusy).toBe(value);
});

Then('aria-live region should announce state', async function() {
    const hasLiveRegion = await this.page.evaluate(() => {
        return document.querySelector('[aria-live]') !== null;
    });
    expect(hasLiveRegion).toBe(true);
});

// ============================================================================
// PLACEHOLDERS FOR REMAINING SCENARIOS
// ============================================================================

Given('multiple elements with lx-loading', async function() { return 'pending'; });
Then('each should have independent loading state', function() { return 'pending'; });
Given('nested elements with lx-loading', async function() { return 'pending'; });
Then('loading states should not interfere', function() { return 'pending'; });
Given('an element with lx-scope={string}', async function(scope) { return 'pending'; });
Given('multiple async operations in scope', async function() { return 'pending'; });
Then('loading should wait for all to complete', function() { return 'pending'; });
Given('an element with custom loading content', async function() { return 'pending'; });
Then('custom content should be shown', function() { return 'pending'; });
Given('in loadx, an event listener for {string}', async function(event) { return 'pending'; });
Then('loading animation should respect prefers-reduced-motion', function() { return 'pending'; });
Given('loading state is applied', async function() { return 'pending'; });
When('the element is removed', async function() { return 'pending'; });
Then('loading should cleanup properly', function() { return 'pending'; });

module.exports = {};
