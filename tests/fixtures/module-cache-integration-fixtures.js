/**
 * Module Cache Integration Test Fixtures
 *
 * Provides utilities, mocks, and helpers for testing module
 * integration with the WeakMap parse cache via window.genx.getConfig()
 */

/**
 * Create a mock getConfig function for module testing
 * @returns {Object} Mock getConfig instance
 */
export const createMockGetConfig = () => {
    const cache = new Map(); // Use Map for testing (WeakMap not inspectable)
    const calls = [];

    return {
        /**
         * Mock implementation of window.genx.getConfig
         */
        getConfig: (element) => {
            calls.push({ element, timestamp: Date.now() });

            if (!element || !element.attributes) {
                return null;
            }

            // Return cached config or null
            return cache.get(element) || null;
        },

        /**
         * Add mock config for testing
         */
        setConfig: (element, config) => {
            cache.set(element, config);
        },

        /**
         * Verify getConfig was called
         */
        wasCalledWith: (element) => {
            return calls.some(call => call.element === element);
        },

        /**
         * Get call count
         */
        getCallCount: () => calls.length,

        /**
         * Reset mock
         */
        reset: () => {
            cache.clear();
            calls.length = 0;
        },

        /**
         * Get all calls
         */
        getCalls: () => calls
    };
};

/**
 * Create a performance comparison utility
 * @returns {Object} Performance comparison instance
 */
export const createCachePerformanceComparison = () => {
    const results = {
        getConfig: { duration: 0, calls: 0 },
        getAttribute: { duration: 0, calls: 0 }
    };

    const getSpeedup = () => {
        if (results.getConfig.duration === 0) return 0;
        return results.getAttribute.duration / results.getConfig.duration;
    };

    const getSummary = () => ({
        getConfig: {
            duration: results.getConfig.duration,
            calls: results.getConfig.calls,
            avgPerCall: results.getConfig.duration / results.getConfig.calls
        },
        getAttribute: {
            duration: results.getAttribute.duration,
            calls: results.getAttribute.calls,
            avgPerCall: results.getAttribute.duration / results.getAttribute.calls
        },
        speedup: getSpeedup(),
        meetsTarget: getSpeedup() >= 50
    });

    return {
        /**
         * Measure getConfig performance
         */
        measureGetConfig: (getConfigFn, elements) => {
            const start = performance.now();

            for (const el of elements) {
                getConfigFn(el);
                results.getConfig.calls++;
            }

            results.getConfig.duration = performance.now() - start;
            return results.getConfig.duration;
        },

        /**
         * Measure getAttribute + parse performance
         */
        measureGetAttribute: (parseAttributesFn, elements) => {
            const start = performance.now();

            for (const el of elements) {
                parseAttributesFn(el);
                results.getAttribute.calls++;
            }

            results.getAttribute.duration = performance.now() - start;
            return results.getAttribute.duration;
        },

        getSpeedup,
        getSummary,

        /**
         * Get formatted report
         */
        getReport: () => {
            const summary = getSummary();
            return `
Cache Performance Comparison
============================
getConfig():
  Total: ${summary.getConfig.duration.toFixed(2)}ms
  Calls: ${summary.getConfig.calls}
  Avg:   ${summary.getConfig.avgPerCall.toFixed(4)}ms/call

getAttribute():
  Total: ${summary.getAttribute.duration.toFixed(2)}ms
  Calls: ${summary.getAttribute.calls}
  Avg:   ${summary.getAttribute.avgPerCall.toFixed(4)}ms/call

Speedup: ${summary.speedup.toFixed(2)}x
Target:  50x minimum
Status:  ${summary.meetsTarget ? '✓ PASS' : '✗ FAIL'}
`;
        }
    };
};

/**
 * Module cache integration patterns
 */
export const moduleIntegrationPatterns = {
    /**
     * Correct pattern: Use getConfig
     */
    correctPattern: (element, getConfigFn) => {
        const config = getConfigFn(element);
        if (!config) return null;
        return config;
    },

    /**
     * Incorrect pattern: Use getAttribute (anti-pattern)
     */
    incorrectPattern: (element, prefix) => {
        const config = {};
        const attrs = element.attributes;

        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (attr.name.startsWith(prefix + '-')) {
                const key = attr.name.slice(prefix.length + 1);
                config[key] = attr.value;
            }
        }

        return config;
    }
};

/**
 * Test element generators for cache integration
 */
export const cacheIntegrationElements = {
    /**
     * Generate elements for fmtX testing
     */
    fmtX: (count = 100) => {
        const elements = [];
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.innerHTML = `<span fx-format="currency" fx-currency="USD" fx-decimals="2">$${i}</span>`;
            elements.push(div.firstChild);
        }
        return elements;
    },

    /**
     * Generate elements for bindX testing
     */
    bindX: (count = 100) => {
        const elements = [];
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.setAttribute('bx-bind', `field${i}`);
            input.setAttribute('bx-debounce', '300');
            elements.push(input);
        }
        return elements;
    },

    /**
     * Generate elements for accX testing
     */
    accX: (count = 50) => {
        const elements = [];
        for (let i = 0; i < count; i++) {
            const button = document.createElement('button');
            button.setAttribute('ax-label', `Button ${i}`);
            button.setAttribute('ax-icon', 'disk');
            elements.push(button);
        }
        return elements;
    },

    /**
     * Generate elements for all modules
     */
    mixed: (count = 100) => {
        const generators = [
            cacheIntegrationElements.fmtX,
            cacheIntegrationElements.bindX,
            cacheIntegrationElements.accX
        ];

        const elements = [];
        for (let i = 0; i < count; i++) {
            const generator = generators[i % generators.length];
            elements.push(...generator(1));
        }
        return elements;
    }
};

/**
 * Expected configurations for cache integration tests
 */
export const expectedCacheConfigs = {
    fmtX: {
        verbose: { format: 'currency', currency: 'USD', decimals: '2' },
        colon: { format: 'currency', currency: 'USD', decimals: '2' },
        json: { format: 'currency', currency: 'USD', decimals: 2 },
        class: { format: 'currency', currency: 'USD', decimals: '2' }
    },

    bindX: {
        verbose: { bind: 'username', debounce: '300' },
        class: { bind: 'username', debounce: '300' }
    },

    accX: {
        verbose: { label: 'Save', icon: 'disk', shortcut: 'CtrlS' },
        class: { label: 'Save', icon: 'disk', shortcut: 'CtrlS' }
    },

    dragX: {
        verbose: { draggable: 'true', zone: 'dropzone1', handle: '.handle' },
        class: { draggable: 'true', zone: 'dropzone1', handle: '.handle' }
    },

    loadX: {
        verbose: { src: '/data/users.json', debounce: '500', cache: 'true' },
        class: { src: '/data/users.json', debounce: '500', cache: 'true' }
    },

    navX: {
        verbose: { route: '/dashboard', pushState: 'true', title: 'Dashboard' },
        class: { route: '/dashboard', pushState: 'true', title: 'Dashboard' }
    },

    tableX: {
        verbose: { sortable: 'true', paginate: '10', filter: 'true' },
        class: { sortable: 'true', paginate: '10', filter: 'true' }
    }
};

/**
 * Create a module test helper
 * @param {string} moduleName - Name of the module being tested
 * @returns {Object} Module test helper instance
 */
export const createModuleCacheTestHelper = (moduleName) => {
    let mockGetConfig = createMockGetConfig();
    let performanceComparison = createCachePerformanceComparison();

    return {
        moduleName,

        /**
         * Setup module with cache
         */
        setup: (elements, configs) => {
            // Populate mock cache
            elements.forEach((el, i) => {
                const config = configs[i] || configs[0];
                mockGetConfig.setConfig(el, config);
            });

            return mockGetConfig.getConfig;
        },

        /**
         * Verify module uses getConfig
         */
        verifyGetConfigUsage: (moduleFn, elements) => {
            const initialCalls = mockGetConfig.getCallCount();

            // Run module function
            elements.forEach(el => moduleFn(el));

            const finalCalls = mockGetConfig.getCallCount();
            const callsMade = finalCalls - initialCalls;

            return {
                usedGetConfig: callsMade === elements.length,
                expectedCalls: elements.length,
                actualCalls: callsMade
            };
        },

        /**
         * Measure performance improvement
         */
        measureImprovement: (getConfigFn, attributeParseFn, elements) => {
            performanceComparison.measureGetConfig(getConfigFn, elements);
            performanceComparison.measureGetAttribute(attributeParseFn, elements);

            return performanceComparison.getSummary();
        },

        /**
         * Get test report
         */
        getReport: () => `
Module Cache Integration Test: ${moduleName}
=============================================
Mock getConfig calls: ${mockGetConfig.getCallCount()}

${performanceComparison.getReport()}
`,

        /**
         * Reset helper
         */
        reset: () => {
            mockGetConfig.reset();
            performanceComparison = createCachePerformanceComparison();
        },

        /**
         * Get mock getConfig instance
         */
        getMockGetConfig: () => mockGetConfig,

        /**
         * Get performance comparison instance
         */
        getPerformanceComparison: () => performanceComparison
    };
};

/**
 * Module integration rollout checklist
 */
export const integrationChecklist = {
    steps: [
        'Update module to call window.genx.getConfig(element)',
        'Remove all getAttribute() calls for configuration',
        'Add null check for getConfig return value',
        'Update tests to mock getConfig',
        'Verify performance improvement (50x+ target)',
        'Update module documentation',
        'Run full regression test suite',
        'Verify all 4 notation styles work',
        'Check backward compatibility',
        'Measure and document performance gains'
    ],

    verify(module, results) {
        const checks = {
            usesGetConfig: results.usedGetConfig || false,
            noGetAttribute: results.noGetAttribute || false,
            hasNullCheck: results.hasNullCheck || false,
            testsMocked: results.testsMocked || false,
            performanceImproved: results.speedup >= 50,
            documented: results.documented || false,
            testsPass: results.testsPass || false,
            allNotationsWork: results.allNotationsWork || false,
            backwardCompatible: results.backwardCompatible || false,
            performanceMeasured: results.performanceMeasured || false
        };

        const completed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            checks,
            completed,
            total,
            percentage: (completed / total) * 100,
            ready: completed === total
        };
    }
};

/**
 * Performance targets for cache integration
 */
export const cacheIntegrationTargets = {
    lookupTime: 0.001,          // <0.001ms per getConfig call
    thousandLookups: 1,          // <1ms for 1000 getConfig calls
    speedupFactor: 50,           // 50x+ faster than getAttribute + parse
    avgSpeedup: 50,              // Average speedup across all modules
    regressionTolerance: 0.05    // Max 5% regression in other areas
};

/**
 * Test scenarios for each module
 */
export const moduleTestScenarios = {
    fmtX: [
        { notation: 'verbose', element: '<span fx-format="currency" fx-currency="USD">100</span>' },
        { notation: 'colon', element: '<span fx-format="currency:USD:2">100</span>' },
        { notation: 'json', element: '<span fx-opts=\'{"format":"currency"}\'>100</span>' },
        { notation: 'class', element: '<span class="fmt-currency-USD">100</span>' }
    ],

    bindX: [
        { notation: 'verbose', element: '<input bx-bind="username" bx-debounce="300" />' },
        { notation: 'class', element: '<input class="bind-username-300" />' }
    ],

    accX: [
        { notation: 'verbose', element: '<button ax-label="Save" ax-icon="disk">Save</button>' },
        { notation: 'class', element: '<button class="acc-Save-disk">Save</button>' }
    ]
};

export default {
    createMockGetConfig,
    createCachePerformanceComparison,
    moduleIntegrationPatterns,
    cacheIntegrationElements,
    expectedCacheConfigs,
    createModuleCacheTestHelper,
    integrationChecklist,
    cacheIntegrationTargets,
    moduleTestScenarios
};
