/**
 * Parse Cache Test Fixtures
 *
 * Provides test utilities, performance benchmarks, and mock data
 * for testing the WeakMap-based parse cache.
 */

/**
 * Generate large DOMs for performance testing
 */
export function generateLargeDOM(elementCount = 1000) {
    const notations = [
        'fx-format="currency" fx-currency="USD"',
        'class="fmt-currency-USD-2"',
        'fx-format="currency:USD:2"',
        'fx-opts=\'{"format":"currency","currency":"USD"}\'',
        'bx-bind="username" bx-debounce="300"',
        'ax-label="Save" ax-icon="disk"',
        'dx-draggable="true" dx-zone="dropzone-1"'
    ];

    const elements = [];
    for (let i = 0; i < elementCount; i++) {
        const notation = notations[i % notations.length];
        elements.push(`<div data-id="${i}" ${notation}>Element ${i}</div>`);
    }

    return elements.join('\n');
}

/**
 * Cache performance timer
 */
export class CachePerformanceTimer {
    constructor() {
        this.measurements = [];
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    startMeasurement(operationType) {
        return {
            type: operationType,
            startTime: performance.now()
        };
    }

    endMeasurement(measurement) {
        const duration = performance.now() - measurement.startTime;
        this.measurements.push({
            type: measurement.type,
            duration
        });
        return duration;
    }

    recordCacheHit() {
        this.cacheHits++;
    }

    recordCacheMiss() {
        this.cacheMisses++;
    }

    getCacheHitRatio() {
        const total = this.cacheHits + this.cacheMisses;
        return total > 0 ? (this.cacheHits / total) * 100 : 0;
    }

    getAverageDuration(operationType = null) {
        const filtered = operationType
            ? this.measurements.filter(m => m.type === operationType)
            : this.measurements;

        if (filtered.length === 0) return 0;
        const total = filtered.reduce((sum, m) => sum + m.duration, 0);
        return total / filtered.length;
    }

    getTotalDuration(operationType = null) {
        const filtered = operationType
            ? this.measurements.filter(m => m.type === operationType)
            : this.measurements;

        return filtered.reduce((sum, m) => sum + m.duration, 0);
    }

    getStats() {
        return {
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            hitRatio: this.getCacheHitRatio(),
            avgDuration: this.getAverageDuration(),
            totalDuration: this.getTotalDuration(),
            measurements: this.measurements.length
        };
    }

    reset() {
        this.measurements = [];
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
}

/**
 * Mock cache implementation for testing
 */
export class MockParseCache {
    constructor() {
        this.cache = new WeakMap();
        this.accessLog = [];
    }

    set(element, config) {
        this.cache.set(element, config);
        this.accessLog.push({ type: 'set', element, config, timestamp: Date.now() });
    }

    get(element) {
        const config = this.cache.get(element);
        this.accessLog.push({ type: 'get', element, config, timestamp: Date.now() });
        return config;
    }

    has(element) {
        return this.cache.has(element);
    }

    getAccessLog() {
        return this.accessLog;
    }

    clearLog() {
        this.accessLog = [];
    }

    getStats() {
        const gets = this.accessLog.filter(a => a.type === 'get').length;
        const sets = this.accessLog.filter(a => a.type === 'set').length;
        const hits = this.accessLog.filter(a => a.type === 'get' && a.config !== undefined).length;
        const misses = this.accessLog.filter(a => a.type === 'get' && a.config === undefined).length;

        return { gets, sets, hits, misses, hitRatio: gets > 0 ? (hits / gets) * 100 : 0 };
    }
}

/**
 * Sample elements for cache testing
 */
export const cacheTestElements = {
    singleAttribute: '<div fx-format="currency">100</div>',
    multipleAttributes: '<div fx-format="currency" fx-currency="USD" fx-decimals="2">100</div>',
    colonNotation: '<div fx-format="currency:USD:2">100</div>',
    jsonNotation: '<div fx-opts=\'{"format":"currency","currency":"USD"}\'>100</div>',
    classNotation: '<div class="fmt-currency-USD-2">100</div>',
    mixedNotation: '<div class="fmt-currency" fx-currency="USD">100</div>',
    noGenX: '<div class="normal-class">100</div>',
    emptyAttribute: '<div fx-format="">100</div>',
    multipleModules: '<div fx-format="currency" bx-bind="amount">100</div>'
};

/**
 * Expected cached configurations
 */
export const expectedCachedConfigs = {
    singleAttribute: { format: 'currency' },
    multipleAttributes: { format: 'currency', currency: 'USD', decimals: '2' },
    colonNotation: { format: 'currency', currency: 'USD', decimals: '2' },
    jsonNotation: { format: 'currency', currency: 'USD' },
    classNotation: { format: 'currency', currency: 'USD', decimals: '2' },
    mixedNotation: { format: 'currency', currency: 'USD' },
    noGenX: null,
    emptyAttribute: { format: '' }
};

/**
 * Performance benchmarks
 */
export const cacheBenchmarks = {
    singleParseTime: 0.5,           // <0.5ms per element
    thousandElementScan: 100,        // <100ms for 1000 elements
    lookupTime: 0.01,                // <0.01ms per lookup
    thousandLookups: 1,              // <1ms for 1000 lookups
    speedupFactor: 50                // 50x faster than re-parsing
};

/**
 * Test utilities
 */
export const cacheTestHelpers = {
    /**
     * Create element from HTML string
     */
    createElement(html) {
        const container = document.createElement('div');
        container.innerHTML = html.trim();
        return container.firstChild;
    },

    /**
     * Create multiple elements
     */
    createElements(count, template) {
        const elements = [];
        for (let i = 0; i < count; i++) {
            const html = typeof template === 'function' ? template(i) : template;
            elements.push(this.createElement(html));
        }
        return elements;
    },

    /**
     * Check if two configs are equal
     */
    configEquals(config1, config2) {
        if (config1 === null && config2 === null) return true;
        if (config1 === null || config2 === null) return false;
        return JSON.stringify(config1) === JSON.stringify(config2);
    },

    /**
     * Check if object reference is identical
     */
    isSameReference(obj1, obj2) {
        return obj1 === obj2;
    },

    /**
     * Measure function execution time
     */
    measureTime(fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        return { result, duration };
    },

    /**
     * Measure async function execution time
     */
    async measureTimeAsync(fn) {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        return { result, duration };
    },

    /**
     * Check cache statistics
     */
    verifyCacheStats(stats, expected) {
        return Object.keys(expected).every(key => {
            if (typeof expected[key] === 'number') {
                return Math.abs(stats[key] - expected[key]) < 0.01;
            }
            return stats[key] === expected[key];
        });
    }
};

/**
 * DOM templates for performance testing
 */
export const performanceTestTemplates = {
    uniformElements: (count) => {
        return Array.from({ length: count }, (_, i) =>
            `<div data-id="${i}" fx-format="currency" fx-currency="USD">$${i}</div>`
        ).join('\n');
    },

    variedElements: (count) => {
        const templates = [
            (i) => `<div fx-format="currency">$${i}</div>`,
            (i) => `<div class="fmt-currency-USD">${i}</div>`,
            (i) => `<div fx-format="currency:USD:2">$${i}</div>`,
            (i) => `<div fx-opts='{"format":"currency"}'>$${i}</div>`
        ];

        return Array.from({ length: count }, (_, i) =>
            templates[i % templates.length](i)
        ).join('\n');
    },

    multiModuleElements: (count) => {
        const templates = [
            (i) => `<div fx-format="currency">$${i}</div>`,
            (i) => `<input bx-bind="field${i}" />`,
            (i) => `<button ax-label="Button ${i}">Click</button>`,
            (i) => `<div dx-draggable="true">Drag ${i}</div>`
        ];

        return Array.from({ length: count }, (_, i) =>
            templates[i % templates.length](i)
        ).join('\n');
    }
};

/**
 * Cache stress test scenarios
 */
export const stressTestScenarios = {
    rapidLookups: {
        elementCount: 100,
        lookupsPerElement: 100,
        expectedHitRatio: 99.0,  // 99% hit ratio (1 miss + 99 hits per element)
        expectedTotalTime: 10     // <10ms total
    },

    largeDOMScan: {
        elementCount: 1000,
        expectedParseTime: 100,   // <100ms to parse all
        expectedLookupTime: 1     // <1ms for 1000 lookups
    },

    mixedOperations: {
        elementCount: 500,
        operations: 5000,         // Mix of scans and lookups
        expectedTime: 150         // <150ms total
    }
};

/**
 * WeakMap testing utilities
 */
export const weakMapTestHelpers = {
    /**
     * Simulate garbage collection scenario
     */
    async simulateGC() {
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    },

    /**
     * Check if WeakMap properly releases memory
     */
    async testWeakMapGC(cache) {
        let element = document.createElement('div');
        element.setAttribute('fx-format', 'currency');

        // Cache the element
        cache.set(element, { format: 'currency' });

        // Verify it's cached
        const hasBefore = cache.has(element);

        // Remove all references
        element = null;

        // Trigger GC
        await this.simulateGC();

        // WeakMap should allow GC
        return { hasBefore, expectedGC: true };
    }
};

/**
 * Comparison baseline for cache performance
 */
export const comparisonBaseline = {
    reParseTime: (count) => count * 0.05,        // 0.05ms per element re-parse
    cacheLoadTime: (count) => count * 0.001,    // 0.001ms per cache lookup
    speedupFactor: () => 50                      // Expected 50x speedup
};

export default {
    generateLargeDOM,
    CachePerformanceTimer,
    MockParseCache,
    cacheTestElements,
    expectedCachedConfigs,
    cacheBenchmarks,
    cacheTestHelpers,
    performanceTestTemplates,
    stressTestScenarios,
    weakMapTestHelpers,
    comparisonBaseline
};
