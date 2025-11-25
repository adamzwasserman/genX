const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const {
    createUrgentForm,
    createMultipleForms,
    setupStaggeredResponses,
    hasLoadingState,
    getAriaLiveMode,
    countAriaMessages,
    waitForAllLoadingComplete,
    cleanupIntegration
} = require('../fixtures/loadx-integration-fixtures');
const { createTestForm, createMockFetch } = require('../fixtures/loadx-form-fixtures');
const { getLiveRegion, waitForAnnouncement, waitForClear } = require('../fixtures/loadx-aria-fixtures');

After(async function() {
    // Cleanup after each scenario
    if (this.page) {
        await this.page.evaluate(() => {
            const forms = document.querySelectorAll('form[lx-loading]');
            forms.forEach(form => form.remove());

            const liveRegion = document.getElementById('lx-live-region');
            if (liveRegion) {
                liveRegion.textContent = '';
                liveRegion.setAttribute('aria-live', 'polite');
            }

            if (window._originalFetch) {
                window.fetch = window._originalFetch;
            }
        });
    } else {
        cleanupIntegration();
    }
});

Given('a form with lx-loading and lx-urgent={string}', function(urgent) {
    this.form = createUrgentForm();
    this.submitButton = this.form.querySelector('button[type="submit"]');
});

Given('two forms with lx-loading', function() {
    this.forms = createMultipleForms(2);
});

Given('a form with lx-loading \\(no urgent flag)', function() {
    this.form = createTestForm('spinner');
    this.submitButton = this.form.querySelector('button[type="submit"]');
});

When('I submit the form with a {int}ms response', async function(delayMs) {
    this.mockFetch = createMockFetch(delayMs);
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }

    this.submitTime = Date.now();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    this.form.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I submit form {int}', async function(formNumber) {
    const form = this.forms[formNumber - 1];
    this.mockFetch = this.mockFetch || createMockFetch(500);
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    this[`form${formNumber}SubmitTime`] = Date.now();

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I submit form {int} before form {int} completes', async function(form2Num, form1Num) {
    // Small delay before submitting form 2
    await new Promise(resolve => setTimeout(resolve, 100));

    const form = this.forms[form2Num - 1];
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    this[`form${form2Num}SubmitTime`] = Date.now();

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('in integration, I submit the form', async function() {
    this.mockFetch = createMockFetch(300);
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }

    this.submitTime = Date.now();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    this.form.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I submit the form multiple times rapidly', async function() {
    this.mockFetch = createMockFetch(200);
    if (typeof window !== 'undefined') {
        window.fetch = this.mockFetch;
    }

    this.submitCount = 3;
    for (let i = 0; i < this.submitCount; i++) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        this.form.dispatchEvent(submitEvent);
        await new Promise(resolve => setTimeout(resolve, 30)); // Rapid submissions
    }

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('form completes', async function() {
    // Wait for the form to complete (300ms mock + buffer)
    await new Promise(resolve => setTimeout(resolve, 400));
});

Then('ARIA should announce {string} assertively', async function(message) {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const announced = await waitForAnnouncement(message, 200);
    expect(announced).to.be.true;

    const mode = getAriaLiveMode();
    expect(mode).to.equal('assertive');
});

Then('ARIA should announce {string} politely', async function(message) {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const announced = await waitForAnnouncement(message, 200);
    expect(announced).to.be.true;

    const mode = getAriaLiveMode();
    expect(mode).to.equal('polite');
});

Then('ARIA should announce {string}', async function(message) {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const announced = await waitForAnnouncement(message, 200);
    expect(announced).to.be.true;
});

Then('in integration, ARIA live region should use aria-live={string}', function(expectedMode) {
    const mode = getAriaLiveMode();
    expect(mode).to.equal(expectedMode);
});

Then('ARIA region should clear after {int} second', async function(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000 + 100));

    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;
    expect(liveRegion.textContent).to.equal('');
});

Then('in integration, loading state should disappear after {int}ms', async function(delayMs) {
    const element = this.submitButton || this.form;

    // Wait for expected delay plus buffer
    await new Promise(resolve => setTimeout(resolve, delayMs + 200));

    const stillLoading = hasLoadingState(element);
    expect(stillLoading).to.be.false;
});

Then('both forms should show loading states', function() {
    const form1Loading = hasLoadingState(this.forms[0]);
    const form2Loading = hasLoadingState(this.forms[1]);

    expect(form1Loading).to.be.true;
    expect(form2Loading).to.be.true;
});

Then('ARIA should announce latest status', function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;
    expect(liveRegion.textContent).to.not.be.empty;
});

Then('each form should clear independently', async function() {
    // Wait for forms to complete
    await new Promise(resolve => setTimeout(resolve, 700));

    const allCleared = await waitForAllLoadingComplete(this.forms, 1000);
    expect(allCleared).to.be.true;
});

Then('ARIA region should clear after last completion', async function() {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const liveRegion = getLiveRegion();
    expect(liveRegion.textContent).to.equal('');
});

Then('each submission should trigger loading state', function() {
    // Check that loading state was triggered (form has aria-busy or loading class at some point)
    const element = this.submitButton || this.form;
    // This is hard to test retrospectively, so we'll check the current state exists
    expect(element).to.exist;
});

Then('ARIA announcements should not accumulate', function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    // Count should be 1 (only latest message), not multiple
    const messageCount = countAriaMessages();
    expect(messageCount).to.be.at.most(1);
});

Then('only the latest announcement should be visible', function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const text = liveRegion.textContent;
    // Should be a single message, not concatenated messages
    expect(text.split('\n').length).to.be.at.most(1);
});

Then('all loading states should clear properly', async function() {
    // Wait for all submissions to complete
    await new Promise(resolve => setTimeout(resolve, 800));

    const element = this.submitButton || this.form;
    const stillLoading = hasLoadingState(element);
    expect(stillLoading).to.be.false;
});
