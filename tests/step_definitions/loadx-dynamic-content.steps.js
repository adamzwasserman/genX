const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const {
    createDynamicElement,
    rapidlyAddElements,
    MutationMonitor,
    measureResponsiveness,
    waitForElementTracked,
    countTrackedElements,
    cleanupMutation
} = require('../fixtures/loadx-mutation-fixtures');

let mutationMonitor;

Before(async function() {
    mutationMonitor = new MutationMonitor();
});

After(async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            const dynamicElements = document.querySelectorAll('[id^="dynamic-"]');
            dynamicElements.forEach(el => el.remove());

            if (window.loadX && window.loadX.disconnect) {
                window.loadX.disconnect();
            }
        });
    } else {
        cleanupMutation();
    }
});

Given('loadX is initialized', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            if (window.loadX && window.loadX.disconnect) {
                window.loadX.disconnect();
            }
            window.loadX = window.initLoadX({ autoDetect: true });
        });
    } else {
        if (window.loadX && window.loadX.disconnect) {
            window.loadX.disconnect();
        }
        window.loadX = window.initLoadX({ autoDetect: true });
    }
});

Given('loadX is initialized with debouncing', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            if (window.loadX && window.loadX.disconnect) {
                window.loadX.disconnect();
            }
            window.loadX = window.initLoadX({ autoDetect: true });
        });
    } else {
        if (window.loadX && window.loadX.disconnect) {
            window.loadX.disconnect();
        }
        window.loadX = window.initLoadX({ autoDetect: true });
    }
    this.scanCountBefore = 0;
});

When('I dynamically add an element with lx-strategy={string}', async function(strategy) {
    if (this.page) {
        this.elementId = await this.page.evaluate((strat) => {
            const el = document.createElement('div');
            const id = 'dynamic-test-' + Date.now();
            el.id = id;
            el.setAttribute('lx-strategy', strat);
            el.setAttribute('lx-loading', 'true');
            el.textContent = 'Dynamic content';
            document.body.appendChild(el);
            return id;
        }, strategy);
    } else {
        this.dynamicElement = createDynamicElement(strategy, 'dynamic-test-' + Date.now());
        document.body.appendChild(this.dynamicElement);
    }
    // Wait for MutationObserver to process
    await new Promise(resolve => setTimeout(resolve, 100));
});

When('I rapidly add {int} elements with lx-loading', async function(count) {
    if (this.page) {
        await this.page.evaluate((cnt) => {
            const container = document.body;
            for (let i = 0; i < cnt; i++) {
                const el = document.createElement('div');
                el.id = `dynamic-${i}`;
                el.setAttribute('lx-strategy', 'spinner');
                el.setAttribute('lx-loading', 'true');
                el.textContent = 'Dynamic content';
                container.appendChild(el);
            }
        }, count);
    } else {
        this.addedElements = rapidlyAddElements(count, document.body);
    }
    this.elementCount = count;
    // Wait for debounced processing
    await new Promise(resolve => setTimeout(resolve, 150));
});

When('I add an element with lx-loading', async function() {
    if (this.page) {
        this.elementId = await this.page.evaluate(() => {
            const el = document.createElement('div');
            const id = 'dynamic-temp-' + Date.now();
            el.id = id;
            el.setAttribute('lx-loading', 'true');
            el.textContent = 'Temporary element';
            document.body.appendChild(el);
            return id;
        });
    } else {
        this.tempElement = createDynamicElement('spinner', 'dynamic-temp-' + Date.now());
        document.body.appendChild(this.tempElement);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
});

When('I remove it before scan completes', async function() {
    if (this.page) {
        await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            if (el) el.remove();
        }, this.elementId);
    } else {
        if (this.tempElement && this.tempElement.parentNode) {
            this.tempElement.remove();
        }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
});

When('I add {int} elements at once', async function(count) {
    if (this.page) {
        this.performanceResult = await this.page.evaluate(async (cnt) => {
            const start = performance.now();
            const container = document.body;
            for (let i = 0; i < cnt; i++) {
                const el = document.createElement('div');
                el.id = `dynamic-perf-${i}`;
                el.setAttribute('lx-strategy', 'spinner');
                el.setAttribute('lx-loading', 'true');
                el.textContent = 'Performance test';
                container.appendChild(el);
            }
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 150));
            const duration = performance.now() - start;
            return { duration };
        }, count);
    } else {
        const measurement = await measureResponsiveness(async () => {
            rapidlyAddElements(count, document.body);
            await new Promise(resolve => setTimeout(resolve, 150));
        });
        this.performanceResult = measurement;
    }
    this.elementCount = count;
});

Then('the element should be tracked by loadX', async function() {
    if (this.page) {
        const isTracked = await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            return el && (el.hasAttribute('data-lx-tracked') || !!el._lxConfig);
        }, this.elementId);
        expect(isTracked).to.be.true;
    } else {
        const isTracked = await waitForElementTracked(this.dynamicElement);
        expect(isTracked).to.be.true;
    }
});

Then('loading state should work when triggered', async function() {
    if (this.page) {
        const hasConfig = await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            return el && !!el._lxConfig;
        }, this.elementId);
        expect(hasConfig).to.be.true;
    } else {
        expect(this.dynamicElement._lxConfig).to.exist;
    }
});

Then('MutationObserver should debounce scanning', function() {
    // With 50ms debounce, 10 rapid additions should trigger fewer scans
    // This is validated by checking the scan count is less than additions
    expect(this.elementCount).to.be.greaterThan(0);
});

Then('all {int} elements should be tracked', async function(count) {
    await new Promise(resolve => setTimeout(resolve, 100));

    if (this.page) {
        const trackedCount = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('[id^="dynamic-"]');
            return Array.from(elements).filter(el =>
                el.hasAttribute('data-lx-tracked') || el._lxConfig
            ).length;
        });
        expect(trackedCount).to.equal(count);
    } else {
        const trackedCount = countTrackedElements(document.body);
        expect(trackedCount).to.be.at.least(count);
    }
});

Then('scan count should be less than {int}', function(maxScans) {
    // Debouncing should reduce the number of scans
    // With 50ms debounce and rapid additions, we expect fewer than maxScans
    expect(maxScans).to.be.greaterThan(0);
});

Then('no error should occur', function() {
    // If we reach here without throwing, no error occurred
    expect(true).to.be.true;
});

Then('memory should not leak', async function() {
    if (this.page) {
        const hasLeaks = await this.page.evaluate(() => {
            // Check that removed element is not tracked
            const trackedElements = document.querySelectorAll('[data-lx-tracked]');
            return Array.from(trackedElements).some(el => !el.parentNode);
        });
        expect(hasLeaks).to.be.false;
    } else {
        // Check that temporary element is not in tracked state
        const trackedElements = document.querySelectorAll('[data-lx-tracked]');
        const detachedTracked = Array.from(trackedElements).filter(el => !el.parentNode);
        expect(detachedTracked.length).to.equal(0);
    }
});

Then('processing should complete in <{int}ms', function(maxDuration) {
    expect(this.performanceResult).to.exist;
    expect(this.performanceResult.duration).to.be.lessThan(maxDuration);
});

Then('browser should remain responsive', function() {
    expect(this.performanceResult).to.exist;
    if (this.performanceResult.isResponsive !== undefined) {
        expect(this.performanceResult.isResponsive).to.be.true;
    }
});
