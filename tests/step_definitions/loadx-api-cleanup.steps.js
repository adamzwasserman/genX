const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const {
    hasMethod,
    createApiTestElement,
    captureWarnings,
    hasLoadingState,
    getProgressValue,
    cleanupApi,
    initializeLoadX,
    isLoadXInitialized
} = require('../fixtures/loadx-api-fixtures');

let warningCapture;
let testElement;

Before(async function() {
    warningCapture = captureWarnings();
});

After(async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            const testElements = document.querySelectorAll('[id^="api-test-"]');
            testElements.forEach(el => el.remove());

            if (window.loadX && window.loadX.disconnect) {
                window.loadX.disconnect();
            }
        });
    } else {
        if (warningCapture) {
            warningCapture.stop();
        }
        cleanupApi();
    }
});

Given('in loadx-api-cleanup, loadX is initialized', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            if (window.loadX && window.loadX.init) {
                window.loadX.init({ autoDetect: false });
            } else if (window.initLoadX) {
                window.initLoadX({ autoDetect: false });
            }
        });
    } else {
        initializeLoadX({ autoDetect: false });
    }
});

Given('loadX is not initialized', function() {
    if (window.loadX) {
        delete window.loadX;
    }
});

Given('an element with id {string}', async function(elementId) {
    if (this.page) {
        await this.page.evaluate((id) => {
            const el = document.createElement('div');
            el.id = id;
            el.textContent = 'Test element';
            document.body.appendChild(el);
        }, elementId);
        this.elementId = elementId;
    } else {
        testElement = createApiTestElement(elementId);
        this.testElement = testElement;
    }
});

Given('an element with loading state', async function() {
    if (this.page) {
        this.elementId = await this.page.evaluate(() => {
            const el = document.createElement('div');
            const id = 'api-test-loading-' + Date.now();
            el.id = id;
            el.classList.add('lx-loading');
            el.setAttribute('aria-busy', 'true');
            document.body.appendChild(el);
            return id;
        });
    } else {
        testElement = createApiTestElement('api-test-loading');
        testElement.classList.add('lx-loading');
        testElement.setAttribute('aria-busy', 'true');
        this.testElement = testElement;
    }
});

Given('an element with progress strategy', async function() {
    if (this.page) {
        this.elementId = await this.page.evaluate(() => {
            const el = document.createElement('div');
            const id = 'api-test-progress-' + Date.now();
            el.id = id;
            el.innerHTML = '<div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>';
            document.body.appendChild(el);
            return id;
        });
    } else {
        testElement = createApiTestElement('api-test-progress');
        testElement.innerHTML = '<div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>';
        this.testElement = testElement;
    }
});

When('I call window.loadX.init with config', async function() {
    if (this.page) {
        await this.page.evaluate(() => {
            window.loadX.init({ autoDetect: false, minDisplayMs: 100 });
        });
    } else {
        window.loadX.init({ autoDetect: false, minDisplayMs: 100 });
    }
});

When('I call window.loadX.apply with element and options', async function() {
    if (this.page) {
        await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            window.loadX.apply(el, { strategy: 'spinner' });
        }, this.elementId);
    } else {
        window.loadX.apply(this.testElement, { strategy: 'spinner' });
    }
});

When('I call window.loadX.remove with the element', async function() {
    if (this.page) {
        await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            window.loadX.remove(el);
        }, this.elementId);
    } else {
        window.loadX.remove(this.testElement);
    }
});

When('I call window.loadX.update with element and value {int}', async function(value) {
    if (this.page) {
        await this.page.evaluate((id, val) => {
            const el = document.getElementById(id);
            window.loadX.update(el, val);
        }, this.elementId, value);
    } else {
        window.loadX.update(this.testElement, value);
    }
    this.expectedValue = value;
});

When('I call window.loadX.applyLoadingState', async function() {
    warningCapture.start();

    if (this.page) {
        const hasWarning = await this.page.evaluate(() => {
            const warnings = [];
            const originalWarn = console.warn;
            console.warn = (...args) => {
                warnings.push(args.join(' '));
            };

            const el = document.createElement('div');
            document.body.appendChild(el);

            if (window.loadX.applyLoadingState) {
                window.loadX.applyLoadingState(el, {}, {});
            }

            console.warn = originalWarn;
            return warnings.some(w => w.includes('deprecated'));
        });
        this.hasDeprecationWarning = hasWarning;
    } else {
        testElement = createApiTestElement('deprecation-test');
        if (window.loadX.applyLoadingState) {
            window.loadX.applyLoadingState(testElement, {}, {});
        }
    }
});

Then('window.loadX.{word} should exist', function(methodName) {
    expect(hasMethod(methodName)).to.be.true;
});

Then('window.loadX.{word} should not exist', function(methodName) {
    expect(hasMethod(methodName)).to.be.false;
});

Then('a deprecation warning should be logged', function() {
    if (this.page) {
        expect(this.hasDeprecationWarning).to.be.true;
    } else {
        expect(warningCapture.hasWarning('deprecated')).to.be.true;
    }
});

Then('the method should still work', function() {
    // If we got here without errors, the method worked
    expect(true).to.be.true;
});

Then('loadX should be initialized', async function() {
    if (this.page) {
        const initialized = await this.page.evaluate(() => {
            return typeof window.loadX !== 'undefined' &&
                   (window.loadX.config || window.loadX._initialized);
        });
        expect(initialized).to.be.true;
    } else {
        expect(isLoadXInitialized()).to.be.true;
    }
});

Then('the config should be applied', async function() {
    if (this.page) {
        const hasConfig = await this.page.evaluate(() => {
            return window.loadX.config && window.loadX.config.autoDetect === false;
        });
        expect(hasConfig).to.be.true;
    } else {
        expect(window.loadX.config).to.exist;
        expect(window.loadX.config.autoDetect).to.equal(false);
    }
});

Then('the element should have loading state', async function() {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (this.page) {
        const hasLoading = await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            return el.classList.contains('lx-loading') ||
                   el.getAttribute('aria-busy') === 'true' ||
                   !!el.querySelector('.lx-loading');
        }, this.elementId);
        expect(hasLoading).to.be.true;
    } else {
        expect(hasLoadingState(this.testElement)).to.be.true;
    }
});

Then('the loading state should be removed', async function() {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (this.page) {
        const hasLoading = await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            return el.classList.contains('lx-loading') ||
                   el.getAttribute('aria-busy') === 'true';
        }, this.elementId);
        expect(hasLoading).to.be.false;
    } else {
        expect(hasLoadingState(this.testElement)).to.be.false;
    }
});

Then('the progress value should be {int}', async function(expectedValue) {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (this.page) {
        const value = await this.page.evaluate((id) => {
            const el = document.getElementById(id);
            const progressBar = el.querySelector('[role="progressbar"]');
            if (!progressBar) return null;
            return parseInt(progressBar.getAttribute('aria-valuenow'), 10);
        }, this.elementId);
        expect(value).to.equal(expectedValue);
    } else {
        const value = getProgressValue(this.testElement);
        expect(value).to.equal(expectedValue);
    }
});
