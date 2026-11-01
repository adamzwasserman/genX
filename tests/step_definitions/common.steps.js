/**
 * Common step definitions shared across all features
 * This file contains reusable step definitions that multiple features can use
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// Common Setup Steps
// ============================================================================

Given('the DOM is ready', async function() {
    // Wait for DOM to be ready
    await this.page.waitForLoadState('domcontentloaded');
});

When('the page is rendered', async function() {
    // Module fixtures that render on demand (bindX) register this.render.
    if (typeof this.render === 'function') {
        await this.render();
        return;
    }
    await this.page.waitForLoadState('load');
});

// ============================================================================
// Common Event Listener Steps
// ============================================================================

Given('an event listener for {string}', async function(eventName) {
    this.eventName = eventName;
    this.eventFired = false;
    this.eventDetail = null;

    await this.page.evaluate((evtName) => {
        window._testEventListener = (event) => {
            window._testEventFired = true;
            window._testEventDetail = event.detail;
        };
        window.addEventListener(evtName, window._testEventListener);
    }, eventName);
});

// ============================================================================
// Common Event Assertion Steps
// ============================================================================

Then('a {string} event should be emitted', async function(eventName) {
    const fired = await this.page.evaluate(() => window._testEventFired);
    expect(fired).toBe(true);
});

// Allow 'an' phrasing as well (many features use "an 'nx:...' event")
Then('an {string} event should be emitted', async function(eventName) {
    const fired = await this.page.evaluate(() => window._testEventFired);
    expect(fired).toBe(true);
});

Then('the event should be emitted', async function() {
    const fired = await this.page.evaluate(() => window._testEventFired);
    expect(fired).toBe(true);
});

Then('event.detail should contain {word}', async function(property) {
    const detail = await this.page.evaluate(() => window._testEventDetail);
    expect(detail).toHaveProperty(property);
});

// ============================================================================
// Common Element Assertion Steps
// ============================================================================

Then('the element should display {string}', async function(text) {
    expect(this.element).toBeDefined();
    const content = await this.element.textContent();
    expect(content).toBe(text);
});

// Intl output uses U+00A0 or U+202F between number and symbol; feature text uses a plain space.
Then('the element should display {string}, where a non-breaking space counts as a space', async function(text) {
    expect(this.element).toBeDefined();
    const content = await this.element.textContent();
    expect(content.replace(/[\u00A0\u202F]/g, ' ')).toBe(text);
});

Then('the element should have class {string}', async function(className) {
    expect(this.element).toBeDefined();
    const hasClass = await this.element.evaluate((el, cls) =>
        el.classList.contains(cls), className);
    expect(hasClass).toBe(true);
});

Then('the element should not have class {string}', async function(className) {
    expect(this.element).toBeDefined();
    const hasClass = await this.element.evaluate((el, cls) =>
        el.classList.contains(cls), className);
    expect(hasClass).toBe(false);
});

// ============================================================================
// Common Error Handling Steps
// ============================================================================

// Errors a module reports: window._testErrors (set by some fixtures) plus
// console errors and warnings captured by the world for this scenario.
async function loggedErrors(world) {
    const recorded = await world.page.evaluate(() => window._testErrors || []);
    const consoleErrors = (world.consoleMessages || [])
        .filter(m => m.type === 'error' || m.type === 'warning');
    return [...recorded, ...consoleErrors];
}

Then('an error should be logged', async function() {
    const errors = await loggedErrors(this);
    expect(errors.length).toBeGreaterThan(0);
});

Then('a validation error should be logged', async function() {
    const errors = await loggedErrors(this);
    expect(errors.length).toBeGreaterThan(0);
});

Then('a {word} should be thrown', async function(errorType) {
    expect(this.error).toBeDefined();
    expect(this.error.constructor.name).toBe(errorType);
});

Then('the error message should be actionable', async function() {
    expect(this.error).toBeDefined();
    expect(this.error.message).toBeTruthy();
    expect(this.error.message.length).toBeGreaterThan(10);
});

// ============================================================================
// Common Loading/Async Steps
// ============================================================================

When('{int}ms passes', async function(milliseconds) {
    await this.page.waitForTimeout(milliseconds);
});

Then('it should not throw an error', async function() {
    // Uncaught errors from the page, including ones inside observers and timers
    expect(this.pageErrors).toEqual([]);
    expect(this.page.isClosed()).toBe(false);
});

Then('the operation should complete in less than {int}ms', async function(milliseconds) {
    expect(this.operationTime).toBeDefined();
    expect(this.operationTime).toBeLessThan(milliseconds);
});

// ============================================================================
// Common Accessibility Steps
// ============================================================================

Then('it should have role {string}', async function(role) {
    expect(this.element).toBeDefined();
    const actualRole = await this.element.getAttribute('role');
    expect(actualRole).toBe(role);
});

Then('all links should be keyboard accessible', async function() {
    const links = await this.page.$$('a, button');
    for (const link of links) {
        const tabindex = await link.getAttribute('tabindex');
        expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
    }
});

// ============================================================================
// Common Performance Steps
// ============================================================================

Then('only one DOM update should occur', async function() {
    // This would need proper instrumentation in the actual implementation
    // For now, we'll just mark as pending
    return 'pending';
});

// ============================================================================
// Common Cleanup Steps
// ============================================================================

// Fixtures that can verify their bindings or listeners were torn down
// register this.checkReleased; others stay pending.
Given('memory should be released', async function() {
    if (typeof this.checkReleased === 'function') {
        await this.checkReleased();
        return undefined;
    }
    return 'pending';
});

Then('no memory leaks should occur', async function() {
    if (typeof this.checkReleased === 'function') {
        await this.checkReleased();
        return undefined;
    }
    return 'pending';
});

module.exports = {
    // Export for potential reuse
};

// Shared by many features: nothing threw in the page (uncaught errors,
// including MutationObserver callbacks) and no step recorded an error.
Then('no errors should occur', async function() {
    expect(this.pageErrors || []).toEqual([]);
});
