/**
 * Bootloader Unified Scan Test Fixtures
 *
 * Provides HTML samples and expected results for testing
 * the optimized unified DOM scanning implementation.
 */

export const scanFixtures = {
    // Single element samples for each notation style
    singleElements: {
        fxAttribute: '<span fx-format="currency">1234.56</span>',
        bxAttribute: '<input bx-bind="username" />',
        axAttribute: '<button ax-label="Save"></button>',

        fmtClass: '<span class="fmt-currency-USD-2">1234.56</span>',
        bindClass: '<input class="bind-username-300" />',
        accClass: '<button class="acc-label-icon-Home"></button>',

        mixedFx: '<span fx-format="date" class="btn-primary">2024-01-01</span>',
        mixedClass: '<span class="btn fmt-currency-USD">1234.56</span>'
    },

    // Large DOM samples for performance testing
    largeDOM: {
        // 100 elements with mixed notations
        mixed100: generateMixedElements(100),

        // 1000 elements for performance benchmarks
        mixed1000: generateMixedElements(1000),

        // Edge cases
        empty: '',
        noGenX: '<div class="container"><p>Regular HTML</p></div>',
        malformed: `
            <span class="">Empty class</span>
            <span>No class</span>
            <span class="fmt-currency-USD-2">Valid</span>
        `
    },

    // Expected detection results
    expectedResults: {
        fxOnly: { needed: new Set(['fx']), count: 1 },
        bxOnly: { needed: new Set(['bx']), count: 1 },
        axOnly: { needed: new Set(['ax']), count: 1 },

        fxAndBx: { needed: new Set(['fx', 'bx']), count: 2 },
        allThree: { needed: new Set(['fx', 'bx', 'ax']), count: 3 },

        empty: { needed: new Set(), count: 0 }
    },

    // Module registry (matches bootloader configuration)
    moduleRegistry: {
        'fx': true,  // fmtx
        'bx': true,  // bindx
        'ax': true,  // accx
        'dx': true,  // dragx
        'lx': true,  // loadx
        'nx': true,  // navx
        'tx': true   // tablex
    },

    // Class prefix mappings
    classPrefixMap: {
        'fmt': 'fx',
        'bind': 'bx',
        'acc': 'ax',
        'drag': 'dx',
        'load': 'lx',
        'nav': 'nx',
        'table': 'tx'
    },

    // Unified selector expected structure
    unifiedSelector: [
        '[fx-]', '[bx-]', '[ax-]', '[dx-]', '[lx-]', '[nx-]', '[tx-]',
        '[class*="fmt-"]', '[class*="bind-"]', '[class*="acc-"]',
        '[class*="drag-"]', '[class*="load-"]', '[class*="nav-"]', '[class*="table-"]'
    ].join(',')
};

/**
 * Generate N mixed notation elements for performance testing
 */
function generateMixedElements(count) {
    const templates = [
        '<span fx-format="currency">{value}</span>',
        '<input bx-bind="field{n}" />',
        '<button ax-label="Button {n}"></button>',
        '<span class="fmt-date-YYYY-MM-DD">{value}</span>',
        '<input class="bind-value-300" />',
        '<button class="acc-label-icon-Home"></button>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const element = template
            .replace('{n}', i)
            .replace('{value}', Math.random() * 1000);
        elements.push(element);
    }

    return `<div class="test-container">${elements.join('\n')}</div>`;
}

/**
 * Performance timing utility
 */
export class PerformanceTimer {
    constructor() {
        this.marks = new Map();
    }

    start(label) {
        this.marks.set(label, performance.now());
    }

    end(label) {
        const startTime = this.marks.get(label);
        if (!startTime) {
            throw new Error(`No start mark found for "${label}"`);
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.marks.delete(label);
        return duration;
    }

    measure(fn, label = 'operation') {
        this.start(label);
        const result = fn();
        const duration = this.end(label);
        return { result, duration };
    }

    async measureAsync(fn, label = 'operation') {
        this.start(label);
        const result = await fn();
        const duration = this.end(label);
        return { result, duration };
    }
}

/**
 * Query selector spy for counting calls
 */
export class QuerySelectorSpy {
    constructor(document) {
        this.document = document;
        this.calls = [];
        this.originalQuerySelector = document.querySelector;
        this.originalQuerySelectorAll = document.querySelectorAll;
    }

    install() {
        const calls = this.calls;
        const originalQS = this.originalQuerySelector;
        const originalQSA = this.originalQuerySelectorAll;

        this.document.querySelector = function(selector) {
            calls.push({ method: 'querySelector', selector, timestamp: Date.now() });
            return originalQS.call(this, selector);
        };

        this.document.querySelectorAll = function(selector) {
            calls.push({ method: 'querySelectorAll', selector, timestamp: Date.now() });
            return originalQSA.call(this, selector);
        };
    }

    uninstall() {
        this.document.querySelector = this.originalQuerySelector;
        this.document.querySelectorAll = this.originalQuerySelectorAll;
    }

    getCallCount() {
        return this.calls.length;
    }

    getQuerySelectorAllCount() {
        return this.calls.filter(c => c.method === 'querySelectorAll').length;
    }

    reset() {
        this.calls = [];
    }
}

/**
 * DOM test helper
 */
export class DOMTestHelper {
    constructor() {
        this.container = null;
    }

    setup(html = '') {
        this.container = document.createElement('div');
        this.container.id = 'test-container';
        this.container.innerHTML = html;
        document.body.appendChild(this.container);
        return this.container;
    }

    teardown() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }

    setHTML(html) {
        if (!this.container) {
            throw new Error('Call setup() first');
        }
        this.container.innerHTML = html;
    }

    query(selector) {
        if (!this.container) {
            throw new Error('Call setup() first');
        }
        return this.container.querySelector(selector);
    }

    queryAll(selector) {
        if (!this.container) {
            throw new Error('Call setup() first');
        }
        return this.container.querySelectorAll(selector);
    }
}

// Export default for convenience
export default scanFixtures;
