const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const {
    createTestForm,
    createMockFetch,
    createAbortableFetch,
    hasLoadingState,
    waitForLoadingState,
    waitForLoadingComplete,
    cleanup
} = require('../fixtures/loadx-form-fixtures');

Before(function() {
    // Save original fetch
    if (typeof window !== 'undefined' && window.fetch) {
        window._originalFetch = window.fetch;
    }
});

After(function() {
    cleanup();
});

Given('a form with lx-loading attribute', function() {
    this.form = createTestForm('spinner');
    this.submitButton = this.form.querySelector('button[type="submit"]');
});

Given('a mock fetch that resolves in {int}ms', function(delayMs) {
    this.mockFetch = createMockFetch(delayMs);
    this.expectedDelay = delayMs;
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }
});

Given('a mock fetch that rejects', function() {
    this.mockFetch = createMockFetch(100, true);
    this.shouldReject = true;
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }
});

Given('a mock fetch that can be aborted', function() {
    const abortableFetch = createAbortableFetch();
    this.mockFetch = abortableFetch.fetch;
    this.abortFetch = abortableFetch.abort;
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }
});

When('I submit the form', async function() {
    this.submitTime = Date.now();

    // Trigger submit event
    const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true
    });

    this.form.dispatchEvent(submitEvent);

    // Wait a bit for loading state to apply
    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I abort the request', async function() {
    if (this.abortFetch) {
        this.abortFetch();
    }
    await new Promise(resolve => setTimeout(resolve, 50));
});

Then('loading state should appear immediately', async function() {
    const element = this.submitButton || this.form;
    const hasLoading = await waitForLoadingState(element, 200);
    expect(hasLoading).toBe(true);
});

Then('loading state should disappear after {int}ms \\(not {int}ms)', async function(expectedDelay, notExpectedDelay) {
    const element = this.submitButton || this.form;

    // Wait for the expected delay plus a small buffer
    await new Promise(resolve => setTimeout(resolve, expectedDelay + 100));

    // Check that loading state is gone
    const completed = await waitForLoadingComplete(element, 200);
    expect(completed).toBe(true);

    // Verify it didn't wait for the longer delay
    const elapsed = Date.now() - this.submitTime;
    expect(elapsed).toBeLessThan(notExpectedDelay);
});

Then('loading state should disappear after {int}ms', async function(expectedDelay) {
    const element = this.submitButton || this.form;

    // Wait for the expected delay plus a buffer
    await new Promise(resolve => setTimeout(resolve, expectedDelay + 200));

    // Check that loading state is gone
    const completed = await waitForLoadingComplete(element, 200);
    expect(completed).toBe(true);
});

Then('loading state should disappear when error occurs', async function() {
    const element = this.submitButton || this.form;

    // Wait a bit for the error to be handled
    await new Promise(resolve => setTimeout(resolve, 300));

    const completed = await waitForLoadingComplete(element, 200);
    expect(completed).toBe(true);
});

Then('loading state should disappear immediately', async function() {
    const element = this.submitButton || this.form;

    // After abort, loading should clear quickly
    const completed = await waitForLoadingComplete(element, 500);
    expect(completed).toBe(true);

    // Verify it was quick (not the full timeout)
    const elapsed = Date.now() - this.submitTime;
    expect(elapsed).toBeLessThan(1000);
});
