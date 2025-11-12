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

Given('the page is rendered', async function() {
    await this.page.waitForLoadState('load');
});

When('the page is rendered', async function() {
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

Then('an error should be logged', async function() {
    // Check console for errors
    const errors = await this.page.evaluate(() => window._testErrors || []);
    expect(errors.length).toBeGreaterThan(0);
});

Then('a validation error should be logged', async function() {
    const errors = await this.page.evaluate(() => window._testErrors || []);
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

Given('memory should be released', function() {
    // Memory checks would require proper instrumentation
    return 'pending';
});

Then('no memory leaks should occur', function() {
    // Memory leak detection would require proper tooling
    return 'pending';
});

module.exports = {
    // Export for potential reuse
};
