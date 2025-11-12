const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const {
    getLiveRegion,
    createUrgentElement,
    createLoadingElement,
    createMultipleElements,
    waitForAnnouncement,
    waitForClear,
    getAriaLiveMode,
    cleanupARIA
} = require('../fixtures/loadx-aria-fixtures');

After(async function() {
    // Cleanup after each scenario
    if (this.page) {
        await this.page.evaluate(() => {
            const elements = document.querySelectorAll('[lx-strategy]');
            elements.forEach(el => el.remove());

            const liveRegion = document.getElementById('lx-live-region');
            if (liveRegion) {
                liveRegion.textContent = '';
            }
        });
    } else {
        cleanupARIA();
    }
});

Given('an element with lx-strategy={string}', function(strategy) {
    this.element = createLoadingElement(strategy);
});

Given('an element with lx-strategy={string} and lx-urgent={string}', function(strategy, urgent) {
    this.element = createUrgentElement();
});

Given('multiple elements with loading states', function() {
    this.elements = createMultipleElements(3);
});

Given('an element in loading state', async function() {
    this.element = createLoadingElement('spinner');

    // Apply loading state
    if (window.loadX && window.loadX.applyLoading) {
        window.loadX.applyLoading(this.element, { strategy: 'spinner' });
    }

    // Wait a bit for loading state to apply
    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I apply loading state', async function() {
    if (window.loadX && window.loadX.applyLoading) {
        window.loadX.applyLoading(this.element, { strategy: 'spinner' });
    }

    // Store the time of announcement
    this.announcementTime = Date.now();

    // Wait a bit for announcement to happen
    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I apply loading to element {int}', async function(index) {
    const element = this.elements[index - 1];
    if (window.loadX && window.loadX.applyLoading) {
        window.loadX.applyLoading(element, { strategy: 'spinner' });
    }

    // Store last announcement time
    this.lastAnnouncementTime = Date.now();

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I remove loading state', async function() {
    if (window.loadX && window.loadX.removeLoading) {
        window.loadX.removeLoading(this.element);
    }

    // Store completion announcement time
    this.completionTime = Date.now();

    await new Promise(resolve => setTimeout(resolve, 50));
});

When('I wait {int} second', async function(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

When('I wait {int} second after last announcement', async function(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

Then('ARIA live region should announce {string}', async function(expectedText) {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const announced = await waitForAnnouncement(expectedText, 200);
    expect(announced).to.be.true;
});

Then('ARIA live region should be empty', async function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const cleared = await waitForClear(1500);
    expect(cleared).to.be.true;
    expect(liveRegion.textContent).to.equal('');
});

Then('ARIA live region should contain latest message', async function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;
    expect(liveRegion.textContent).to.not.be.empty;
});

Then('ARIA live region should use aria-live={string}', function(mode) {
    const ariaLiveMode = getAriaLiveMode();
    expect(ariaLiveMode).to.equal(mode);
});

Then('should announce urgently', async function() {
    const liveRegion = getLiveRegion();
    expect(liveRegion).to.exist;

    const mode = liveRegion.getAttribute('aria-live');
    expect(mode).to.equal('assertive');
});
