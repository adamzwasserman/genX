const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// loadX processes added elements from its MutationObserver; strict-mode
// throws surface there as page errors, so capture them per scenario.
function hookPageErrors(world) {
    if (world._lxErrorsHooked) return;
    world._lxErrorsHooked = true;
    world.lxPageErrors = [];
    world.page.on('pageerror', err => world.lxPageErrors.push(err.message));
}

let elementCounter = 0;

// Wait until loadX has processed the element (or failed to), then show its
// loading state with the parsed config. Returns the error message or null.
async function enhance(world, elementId) {
    await world.page.waitForFunction(
        id => { const el = document.getElementById(id); return !el || el.hasAttribute('data-lx-tracked'); },
        elementId, { timeout: 1000 }
    ).catch(() => {});
    const err = await world.page.evaluate((id) => {
        const el = document.getElementById(id);
        if (!el || !el._lxConfig) return '__unprocessed';
        try {
            window.loadX.apply(el, el._lxConfig);
            return null;
        } catch (e) {
            return e.message;
        }
    }, elementId);
    if (err === '__unprocessed') {
        const pageError = world.lxPageErrors.find(m => m.includes('[loadX'));
        return pageError || `loadX did not process #${elementId}`;
    }
    return err;
}

// Monitor console.warn
Given('console.warn is being monitored', async function() {
    this.consoleWarnings = [];

    await this.page.exposeFunction('captureWarning', (message) => {
        this.consoleWarnings.push(message);
    });

    await this.page.evaluate(() => {
        const originalWarn = console.warn;
        window.__originalWarn = originalWarn;
        window.__warnings = [];

        console.warn = (...args) => {
            const message = args.join(' ');
            window.__warnings.push(message);
            window.captureWarning(message);
            // Still call original for debugging
            originalWarn.apply(console, args);
        };
    });
});

// Add element with specific class
When('an element with class {string} is added to the DOM', async function(className) {
    hookPageErrors(this);
    this.lxElementIds = this.lxElementIds || [];
    this.lastElementId = await this.page.evaluate(([cls, n]) => {
        const el = document.createElement('button');
        const id = `test-element-${n}`;
        el.id = id;
        el.className = cls;
        el.textContent = 'Test Button';
        document.body.appendChild(el);
        return id;
    }, [className, ++elementCounter]);
    this.lxElementIds.push(this.lastElementId);
});

// Add element with data attribute
When('an element with attribute {string} is added to the DOM', async function(attribute) {
    hookPageErrors(this);
    this.lxElementIds = this.lxElementIds || [];
    this.lastElementId = await this.page.evaluate(([attr, n]) => {
        const el = document.createElement('button');
        const id = `test-element-${n}`;
        el.id = id;

        // Parse attribute string like "data-lx-strategy=spinner"
        const [attrName, attrValue] = attr.split('=');
        el.setAttribute(attrName, attrValue);
        el.textContent = 'Test Button';
        document.body.appendChild(el);
        return id;
    }, [attribute, ++elementCounter]);
    this.lxElementIds.push(this.lastElementId);
    this.lxModernIds = [...(this.lxModernIds || []), this.lastElementId];
});

// Enhance the element
When('the element is enhanced', async function() {
    this.enhanceError = await enhance(this, this.lastElementId);
});

// Enhance all elements
When('all elements are enhanced', async function() {
    this.enhanceError = null;
    for (const id of this.lxElementIds || []) {
        const err = await enhance(this, id);
        if (err && !this.enhanceError) this.enhanceError = err;
    }
});

// Error expectations
Then('enhancing the element should throw an error', async function() {
    this.enhanceError = await enhance(this, this.lastElementId);
    assert.ok(this.enhanceError, 'Expected an error to be thrown');
});

Then('the error should contain {string}', async function(expectedText) {
    assert.ok(
        this.enhanceError && this.enhanceError.includes(expectedText),
        `Expected error to contain "${expectedText}", but got: ${this.enhanceError}`
    );
});

Then('the error should mention {string}', async function(expectedText) {
    assert.ok(
        this.enhanceError && this.enhanceError.includes(expectedText),
        `Expected error to mention "${expectedText}", but got: ${this.enhanceError}`
    );
});

Then('in loadx-deprecation-warnings, no errors should occur', async function() {
    assert.strictEqual(
        this.enhanceError,
        null,
        `Expected no errors, but got: ${this.enhanceError}`
    );
});

// Warning expectations
Then('a console warning should be logged containing {string}', async function(expectedText) {
    const hasWarning = this.consoleWarnings.some(w => w.includes(expectedText));
    assert.ok(
        hasWarning,
        `Expected a warning containing "${expectedText}", but got warnings: ${JSON.stringify(this.consoleWarnings)}`
    );
});

Then('the warning should mention {string}', async function(expectedText) {
    const hasWarning = this.consoleWarnings.some(w => w.includes(expectedText));
    assert.ok(
        hasWarning,
        `Expected warning to mention "${expectedText}", but got: ${JSON.stringify(this.consoleWarnings)}`
    );
});

Then('no console warnings should be logged', async function() {
    assert.strictEqual(
        this.consoleWarnings.length,
        0,
        `Expected no warnings, but got: ${JSON.stringify(this.consoleWarnings)}`
    );
});

Then('{int} console warnings should be logged', async function(expectedCount) {
    assert.strictEqual(
        this.consoleWarnings.length,
        expectedCount,
        `Expected ${expectedCount} warnings, but got ${this.consoleWarnings.length}: ${JSON.stringify(this.consoleWarnings)}`
    );
});

Then('only {int} console warning should be logged', async function(expectedCount) {
    assert.strictEqual(
        this.consoleWarnings.length,
        expectedCount,
        `Expected ${expectedCount} warning(s), but got ${this.consoleWarnings.length}: ${JSON.stringify(this.consoleWarnings)}`
    );
});

// Element enhancement verification
Then('the element should still be enhanced with spinner strategy', async function() {
    const isEnhanced = await this.page.evaluate((elementId) => {
        const el = document.getElementById(elementId);
        return el && el.getAttribute('aria-busy') === 'true';
    }, this.lastElementId);

    assert.ok(isEnhanced, 'Element should be enhanced with loading state');
});

Then('the element should be enhanced with spinner strategy', async function() {
    const isEnhanced = await this.page.evaluate((elementId) => {
        const el = document.getElementById(elementId);
        return el && el.getAttribute('aria-busy') === 'true';
    }, this.lastElementId);

    assert.ok(isEnhanced, 'Element should be enhanced with spinner strategy');
});

Then('the duration should be {int}', async function(expectedDuration) {
    const duration = await this.page.evaluate(
        id => document.getElementById(id)?._lxConfig?.duration, this.lastElementId);
    assert.strictEqual(duration, expectedDuration);
});

Then('both elements should be enhanced correctly', async function() {
    const enhanced = await this.page.evaluate((ids) => {
        return ids.every(id => document.getElementById(id)?.getAttribute('aria-busy') === 'true');
    }, this.lxElementIds);

    assert.ok(enhanced, 'All elements should be enhanced');
});

Then('all elements should be enhanced correctly', async function() {
    const enhanced = await this.page.evaluate((ids) => {
        return ids.every(id => document.getElementById(id)?.getAttribute('aria-busy') === 'true');
    }, this.lxElementIds);

    assert.ok(enhanced, 'All elements should be enhanced');
});

Then('the modern syntax element should not trigger warnings', async function() {
    const ids = this.lxModernIds || [];
    const tracked = ids.length > 0 && await this.page.evaluate(
        list => list.every(id => document.getElementById(id)?.hasAttribute('data-lx-tracked')), ids);
    assert.ok(tracked, 'Modern syntax elements should exist and be processed');
    for (const w of this.consoleWarnings) {
        assert.ok(w.includes('(lx-') || w.includes('(lx:'), `Warning not about legacy class syntax: ${w}`);
    }
});

// Config verification
Then('modernSyntax should be {word}', async function(expectedValue) {
    const actualValue = this.loadxResult?.config?.modernSyntax;

    const expected = expectedValue === 'true';
    assert.strictEqual(actualValue, expected, `Expected modernSyntax to be ${expected}, got ${actualValue}`);
});

Then('silenceDeprecations should be {word}', async function(expectedValue) {
    const actualValue = this.loadxResult?.config?.silenceDeprecations;

    const expected = expectedValue === 'true';
    assert.strictEqual(actualValue, expected, `Expected silenceDeprecations to be ${expected}, got ${actualValue}`);
});
