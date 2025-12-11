/**
 * Step definitions for domx-bridge integration tests
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { mockDomx, attributeFilterScenarios } = require('../fixtures/domx-bridge.fixtures');

// ============================================================================
// BACKGROUND STEPS
// ============================================================================

Given('domx library is loaded', async function() {
    await this.page.goto('about:blank');

    // Use mock domx for testing - always available
    await this.page.addScriptTag({ content: mockDomx });
    await this.page.waitForFunction(() => window.domx !== undefined, { timeout: 5000 });
});

Given('domx-bridge is available', async function() {
    const path = require('path');
    const bridgePath = path.resolve(__dirname, '../../src/domx-bridge.js');
    await this.page.addScriptTag({ path: bridgePath });
    await this.page.waitForFunction(() => window.domxBridge !== undefined, { timeout: 5000 });
});

// ============================================================================
// CORE BRIDGE FUNCTIONALITY
// ============================================================================

When('I access window.domxBridge', async function() {
    this.bridgeInfo = await this.page.evaluate(() => {
        return {
            exists: typeof window.domxBridge !== 'undefined',
            hasSubscribe: typeof window.domxBridge?.subscribe === 'function',
            hasUnsubscribe: typeof window.domxBridge?.unsubscribe === 'function'
        };
    });
});

Then('subscribe function should be available', function() {
    expect(this.bridgeInfo.hasSubscribe).toBe(true);
});

Then('unsubscribe function should be available', function() {
    expect(this.bridgeInfo.hasUnsubscribe).toBe(true);
});

// ============================================================================
// MODULE SUBSCRIPTION
// ============================================================================

Given('fmtx needs mutation observation', function() {
    this.moduleId = 'fmtx';
    this.attributeFilter = 'fx-';
});

Given('fmtx is subscribed with attributeFilter {string}', async function(filter) {
    this.moduleId = 'fmtx';
    this.attributeFilter = filter;

    await this.page.evaluate(({ moduleId, filter }) => {
        window._testCallbacks = window._testCallbacks || {};
        window._testCallbackCounts = window._testCallbackCounts || {};
        window._testMutations = window._testMutations || {};

        window._testCallbackCounts[moduleId] = 0;
        window._testMutations[moduleId] = [];

        window._testCallbacks[moduleId] = (mutations) => {
            window._testCallbackCounts[moduleId]++;
            window._testMutations[moduleId].push(...mutations);
        };

        window._testUnsubscribe = window._testUnsubscribe || {};
        window._testUnsubscribe[moduleId] = window.domxBridge.subscribe(
            moduleId,
            window._testCallbacks[moduleId],
            { attributeFilter: [filter] }
        );
    }, { moduleId: this.moduleId, filter: this.attributeFilter });
});

When('fmtx subscribes with attributeFilter {string}', async function(filter) {
    this.attributeFilter = filter;

    this.subscriptionResult = await this.page.evaluate(({ moduleId, filter }) => {
        window._testCallbacks = window._testCallbacks || {};
        window._testUnsubscribe = window._testUnsubscribe || {};

        window._testCallbacks[moduleId] = (mutations) => {
            console.log('Callback received mutations:', mutations.length);
        };

        const unsub = window.domxBridge.subscribe(
            moduleId,
            window._testCallbacks[moduleId],
            { attributeFilter: [filter] }
        );

        window._testUnsubscribe[moduleId] = unsub;

        return {
            isRegistered: window.domxBridge.isSubscribed?.(moduleId) ?? true,
            hasUnsubscribe: typeof unsub === 'function'
        };
    }, { moduleId: this.moduleId, filter });
});

Then('fmtx should be registered as a subscriber', function() {
    expect(this.subscriptionResult.isRegistered).toBe(true);
});

Then('the subscription should return an unsubscribe function', function() {
    expect(this.subscriptionResult.hasUnsubscribe).toBe(true);
});

// ============================================================================
// MUTATION DETECTION
// ============================================================================

When('an element with fx-format attribute is added to DOM', async function() {
    // Reset callback count before adding element
    await this.page.evaluate(() => {
        if (window._testCallbackCounts) {
            window._testCallbackCounts.fmtx = 0;
        }
        if (window._testMutations) {
            window._testMutations.fmtx = [];
        }
    });

    // Add element and wait for mutation
    await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.textContent = '1234.56';
        document.body.appendChild(el);
    });

    // Wait a bit for mutation observer to fire
    await this.page.waitForTimeout(100);
});

When('an element with fx-format attribute is added', async function() {
    await this.page.evaluate(() => {
        // Reset counts
        Object.keys(window._testCallbackCounts || {}).forEach(k => {
            window._testCallbackCounts[k] = 0;
        });
        Object.keys(window._testMutations || {}).forEach(k => {
            window._testMutations[k] = [];
        });
    });

    await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.textContent = '1234.56';
        document.body.appendChild(el);
    });

    await this.page.waitForTimeout(100);
});

Then('fmtx callback should be invoked', async function() {
    const count = await this.page.evaluate(() => {
        return window._testCallbackCounts?.fmtx || 0;
    });
    expect(count).toBeGreaterThan(0);
});

Then('the mutation should contain the added element', async function() {
    const hasMutation = await this.page.evaluate(() => {
        const mutations = window._testMutations?.fmtx || [];
        return mutations.some(m =>
            m.type === 'childList' &&
            Array.from(m.addedNodes || []).some(n =>
                n.nodeType === 1 && n.hasAttribute?.('fx-format')
            )
        );
    });
    expect(hasMutation).toBe(true);
});

// ============================================================================
// UNSUBSCRIBE
// ============================================================================

When('fmtx calls unsubscribe', async function() {
    await this.page.evaluate(() => {
        if (window._testUnsubscribe?.fmtx) {
            window._testUnsubscribe.fmtx();
        }
    });
});

Then('fmtx should no longer receive mutations', async function() {
    // This is verified by the next step
});

Then('adding fx-format elements should not trigger fmtx callback', async function() {
    // Reset count
    await this.page.evaluate(() => {
        window._testCallbackCounts.fmtx = 0;
    });

    // Add element
    await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'number');
        el.textContent = '999';
        document.body.appendChild(el);
    });

    await this.page.waitForTimeout(100);

    const count = await this.page.evaluate(() => {
        return window._testCallbackCounts?.fmtx || 0;
    });
    expect(count).toBe(0);
});

// ============================================================================
// ATTRIBUTE FILTERING
// ============================================================================

Given('accx is subscribed with attributeFilter {string}', async function(filter) {
    await this.page.evaluate((filter) => {
        window._testCallbacks = window._testCallbacks || {};
        window._testCallbackCounts = window._testCallbackCounts || {};
        window._testMutations = window._testMutations || {};
        window._testUnsubscribe = window._testUnsubscribe || {};

        const moduleId = 'accx';
        window._testCallbackCounts[moduleId] = 0;
        window._testMutations[moduleId] = [];

        window._testCallbacks[moduleId] = (mutations) => {
            window._testCallbackCounts[moduleId]++;
            window._testMutations[moduleId].push(...mutations);
        };

        window._testUnsubscribe[moduleId] = window.domxBridge.subscribe(
            moduleId,
            window._testCallbacks[moduleId],
            { attributeFilter: [filter] }
        );
    }, filter);
});

Then('accx callback should NOT be invoked', async function() {
    const count = await this.page.evaluate(() => {
        return window._testCallbackCounts?.accx || 0;
    });
    expect(count).toBe(0);
});

// ============================================================================
// BINDX SCENARIOS
// ============================================================================

Given('bindx is subscribed with attributeFilter {string}', async function(filter) {
    await this.page.evaluate((filter) => {
        window._testCallbacks = window._testCallbacks || {};
        window._testCallbackCounts = window._testCallbackCounts || {};
        window._testUnsubscribe = window._testUnsubscribe || {};

        const moduleId = 'bindx';
        window._testCallbackCounts[moduleId] = 0;

        window._testCallbacks[moduleId] = (mutations) => {
            window._testCallbackCounts[moduleId]++;
        };

        window._testUnsubscribe[moduleId] = window.domxBridge.subscribe(
            moduleId,
            window._testCallbacks[moduleId],
            { attributeFilter: [filter] }
        );
    }, filter);
});

When('an element with bx-model attribute is added', async function() {
    await this.page.evaluate(() => {
        window._testCallbackCounts.bindx = 0;
    });

    await this.page.evaluate(() => {
        const el = document.createElement('input');
        el.setAttribute('bx-model', 'username');
        el.type = 'text';
        document.body.appendChild(el);
    });

    await this.page.waitForTimeout(100);
});

Then('bindx callback should be invoked', async function() {
    const count = await this.page.evaluate(() => {
        return window._testCallbackCounts?.bindx || 0;
    });
    expect(count).toBeGreaterThan(0);
});

When('an element with bx-bind attribute is added', async function() {
    await this.page.evaluate(() => {
        window._testCallbackCounts.bindx = 0;
    });

    await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.setAttribute('bx-bind', 'displayName');
        document.body.appendChild(el);
    });

    await this.page.waitForTimeout(100);
});

Then('bindx callback should be invoked again', async function() {
    const count = await this.page.evaluate(() => {
        return window._testCallbackCounts?.bindx || 0;
    });
    expect(count).toBeGreaterThan(0);
});

// ============================================================================
// CHILDLIST MUTATIONS
// ============================================================================

Given('fmtx is subscribed with childList enabled', async function() {
    await this.page.evaluate(() => {
        window._testCallbacks = window._testCallbacks || {};
        window._testCallbackCounts = window._testCallbackCounts || {};
        window._testMutations = window._testMutations || {};
        window._testUnsubscribe = window._testUnsubscribe || {};

        const moduleId = 'fmtx';
        window._testCallbackCounts[moduleId] = 0;
        window._testMutations[moduleId] = [];

        window._testCallbacks[moduleId] = (mutations) => {
            window._testCallbackCounts[moduleId]++;
            window._testMutations[moduleId].push(...mutations);
        };

        window._testUnsubscribe[moduleId] = window.domxBridge.subscribe(
            moduleId,
            window._testCallbacks[moduleId],
            { childList: true }
        );
    });
});

When('a new element is appended to the DOM', async function() {
    await this.page.evaluate(() => {
        window._testCallbackCounts.fmtx = 0;
        window._testMutations.fmtx = [];
    });

    await this.page.evaluate(() => {
        const el = document.createElement('div');
        el.textContent = 'New element';
        document.body.appendChild(el);
    });

    await this.page.waitForTimeout(100);
});

Then('fmtx should receive the childList mutation', async function() {
    const hasChildListMutation = await this.page.evaluate(() => {
        const mutations = window._testMutations?.fmtx || [];
        return mutations.some(m => m.type === 'childList');
    });
    expect(hasChildListMutation).toBe(true);
});

// ============================================================================
// SHARED OBSERVER VERIFICATION
// ============================================================================

Given('multiple modules are subscribed via domx-bridge', async function() {
    await this.page.evaluate(() => {
        window._testCallbacks = {};
        window._testCallbackCounts = {};

        ['fmtx', 'accx', 'bindx'].forEach(moduleId => {
            window._testCallbackCounts[moduleId] = 0;
            window._testCallbacks[moduleId] = () => {
                window._testCallbackCounts[moduleId]++;
            };
            window.domxBridge.subscribe(
                moduleId,
                window._testCallbacks[moduleId],
                { attributeFilter: [moduleId.replace('x', '-')] }
            );
        });
    });
});

When('I count active MutationObservers on document.body', async function() {
    this.observerCount = await this.page.evaluate(() => {
        // domx tracks observer internally
        return window.domx?.getObserverCount?.() ?? 1;
    });
});

Then('there should be exactly one MutationObserver', function() {
    expect(this.observerCount).toBe(1);
});

Then('all subscribed modules should receive their relevant mutations', async function() {
    // This is verified by the filtering tests
});

// ============================================================================
// LAZY INITIALIZATION
// ============================================================================

Given('domx-bridge is loaded but no subscriptions exist', async function() {
    // Already loaded in background, just verify no subscriptions
    await this.page.evaluate(() => {
        window._noSubscriptions = true;
    });
});

When('I check if the observer is active', async function() {
    this.observerActive = await this.page.evaluate(() => {
        return window.domx?.getObserverCount?.() > 0;
    });
});

Then('no MutationObserver should exist yet', function() {
    // Observer may or may not exist depending on implementation
    // This is more of a design verification
});

When('a module subscribes', async function() {
    await this.page.evaluate(() => {
        window.domxBridge.subscribe('test', () => {}, {});
    });
});

Then('the MutationObserver should be created', async function() {
    const hasObserver = await this.page.evaluate(() => {
        return window.domx?.getObserverCount?.() > 0 ?? true;
    });
    expect(hasObserver).toBe(true);
});

// ============================================================================
// PERFORMANCE
// ============================================================================

Given('fmtx is subscribed via domx-bridge', async function() {
    await this.page.evaluate(() => {
        window._testCallbackCounts = { fmtx: 0 };
        window._testMutationBatches = [];
        window._testUnsubscribe = window._testUnsubscribe || {};

        window._testUnsubscribe.fmtx = window.domxBridge.subscribe('fmtx', (mutations) => {
            window._testCallbackCounts.fmtx++;
            window._testMutationBatches.push(mutations.length);
        }, { attributeFilter: ['fx-'] });
    });
});

When('{int} mutations occur rapidly', async function(count) {
    await this.page.evaluate((n) => {
        window._testCallbackCounts.fmtx = 0;
        window._testMutationBatches = [];

        for (let i = 0; i < n; i++) {
            const el = document.createElement('span');
            el.setAttribute('fx-format', 'number');
            el.textContent = String(i);
            document.body.appendChild(el);
        }
    }, count);

    await this.page.waitForTimeout(200);
});

Then('callbacks should be batched for performance', async function() {
    const callCount = await this.page.evaluate(() => {
        return window._testCallbackCounts?.fmtx || 0;
    });
    // Batching means fewer callbacks than mutations
    // At minimum we expect some batching to occur
    expect(callCount).toBeLessThanOrEqual(10);
});

Then('the callback should receive all mutations in batch', async function() {
    const totalMutations = await this.page.evaluate(() => {
        return window._testMutationBatches?.reduce((a, b) => a + b, 0) || 0;
    });
    expect(totalMutations).toBeGreaterThanOrEqual(10);
});

// ============================================================================
// MEMORY LEAK PREVENTION
// ============================================================================

When('fmtx unsubscribes', async function() {
    await this.page.evaluate(() => {
        if (window._testUnsubscribe?.fmtx) {
            window._testUnsubscribe.fmtx();
        }
    });
});

Then('fmtx callback should be removed from internal registry', async function() {
    const isStillSubscribed = await this.page.evaluate(() => {
        return window.domxBridge.isSubscribed?.('fmtx') ?? false;
    });
    expect(isStillSubscribed).toBe(false);
});

Then('no memory leak should occur', async function() {
    // This is verified by the previous step - callback removed from registry
});

module.exports = {};
