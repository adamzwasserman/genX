/**
 * Verbose Parser Test Fixtures
 *
 * Provides HTML samples, expected configurations, and utilities
 * for testing the verbose attribute parser module.
 */

/**
 * Verbose attribute HTML samples for each genX module
 */
export const verboseAttributeSamples = {
    fmtX: {
        single: '<span fx-format="currency">1234.56</span>',
        multiple: '<span fx-format="currency" fx-currency="USD" fx-decimals="2">1234.56</span>',
        withOpts: '<span fx-format="currency" fx-opts=\'{"currency":"USD"}\'>1234.56</span>',
        withRaw: '<span fx-format="currency" fx-raw="1234.56">$1,234.56</span>',
        withColon: '<span fx-format="currency:USD:2">1234.56</span>',
        empty: '<span fx-format="">1234.56</span>',
        complex: '<span fx-format="date" fx-pattern="YYYY-MM-DD HH:mm:ss">2024-01-01 12:00:00</span>'
    },

    bindX: {
        single: '<input bx-bind="username" />',
        multiple: '<input bx-bind="username" bx-debounce="300" bx-validate="required" />',
        withOpts: '<input bx-bind="username" bx-opts=\'{"debounce":300}\' />',
        withRaw: '<input bx-bind="username" bx-raw="john_doe" />'
    },

    accX: {
        single: '<button ax-label="Save"></button>',
        multiple: '<button ax-label="Save" ax-icon="disk" ax-shortcut="Ctrl+S"></button>',
        withOpts: '<button ax-label="Save" ax-opts=\'{"icon":"disk"}\'></button>',
        withRaw: '<button ax-label="Save" ax-raw="Save Document"></button>'
    },

    dragX: {
        single: '<div dx-draggable="true"></div>',
        multiple: '<div dx-draggable="true" dx-zone="dropzone-1" dx-handle=".handle"></div>',
        withOpts: '<div dx-draggable="true" dx-opts=\'{"zone":"dropzone-1"}\'></div>'
    },

    loadX: {
        single: '<div lx-src="/data/users.json"></div>',
        multiple: '<div lx-src="/data/users.json" lx-debounce="500" lx-cache="true"></div>',
        withOpts: '<div lx-src="/data/users.json" lx-opts=\'{"cache":true}\'></div>'
    },

    navX: {
        single: '<a nx-route="/dashboard"></a>',
        multiple: '<a nx-route="/dashboard" nx-pushState="true" nx-title="Dashboard"></a>',
        withOpts: '<a nx-route="/dashboard" nx-opts=\'{"pushState":true}\'></a>'
    },

    tableX: {
        single: '<table tx-sortable="true"></table>',
        multiple: '<table tx-sortable="true" tx-paginate="10" tx-filter="true"></table>',
        withOpts: '<table tx-sortable="true" tx-opts=\'{"paginate":10}\'></table>'
    }
};

/**
 * Expected configuration objects for verbose parsing
 */
export const expectedConfigs = {
    fmtX: {
        single: { format: 'currency' },
        multiple: { format: 'currency', currency: 'USD', decimals: '2' },
        withOpts: { format: 'currency' }, // opts should be skipped
        withRaw: { format: 'currency' },   // raw should be skipped
        withColon: { format: 'currency:USD:2' }, // colon values extracted as-is
        empty: { format: '' },
        complex: { format: 'date', pattern: 'YYYY-MM-DD HH:mm:ss' }
    },

    bindX: {
        single: { bind: 'username' },
        multiple: { bind: 'username', debounce: '300', validate: 'required' },
        withOpts: { bind: 'username' }, // opts should be skipped
        withRaw: { bind: 'username' }   // raw should be skipped
    },

    accX: {
        single: { label: 'Save' },
        multiple: { label: 'Save', icon: 'disk', shortcut: 'Ctrl+S' },
        withOpts: { label: 'Save' }, // opts should be skipped
        withRaw: { label: 'Save' }   // raw should be skipped
    },

    dragX: {
        single: { draggable: 'true' },
        multiple: { draggable: 'true', zone: 'dropzone-1', handle: '.handle' },
        withOpts: { draggable: 'true' } // opts should be skipped
    },

    loadX: {
        single: { src: '/data/users.json' },
        multiple: { src: '/data/users.json', debounce: '500', cache: 'true' },
        withOpts: { src: '/data/users.json' } // opts should be skipped
    },

    navX: {
        single: { route: '/dashboard' },
        multiple: { route: '/dashboard', pushState: 'true', title: 'Dashboard' },
        withOpts: { route: '/dashboard' } // opts should be skipped
    },

    tableX: {
        single: { sortable: 'true' },
        multiple: { sortable: 'true', paginate: '10', filter: 'true' },
        withOpts: { sortable: 'true' } // opts should be skipped
    }
};

/**
 * CARDINALITY_ORDERS definition for attribute priority
 * Defines the order in which attributes should be processed/prioritized
 */
export const CARDINALITY_ORDERS = {
    fx: ['format', 'currency', 'decimals', 'pattern', 'locale'],
    bx: ['bind', 'debounce', 'validate', 'transform'],
    ax: ['label', 'icon', 'shortcut', 'role'],
    dx: ['draggable', 'zone', 'handle', 'data'],
    lx: ['src', 'debounce', 'cache', 'transform'],
    nx: ['route', 'pushState', 'title', 'params'],
    tx: ['sortable', 'paginate', 'filter', 'columns']
};

/**
 * Edge cases and special scenarios
 */
export const edgeCases = {
    noAttributes: '<div></div>',
    wrongPrefix: {
        element: '<span bx-bind="username">Test</span>',
        parsePrefix: 'fx',
        expected: {}
    },
    mixedPrefixes: '<span fx-format="currency" bx-bind="amount">100</span>',
    nonGenXAttributes: '<span fx-format="currency" class="btn" data-id="123">100</span>',
    specialCharacters: '<span fx-pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}">123-45-6789</span>',
    emptyValue: '<span fx-format="">Test</span>',
    multipleOpts: '<span fx-format="currency" fx-opts=\'{}\' bx-opts=\'{}\'>100</span>',
    multipleRaw: '<span fx-format="currency" fx-raw="100" tx-raw="data">100</span>'
};

/**
 * Create a verbose parser timer
 * @returns {Object} Verbose parser timer instance
 */
export const createVerboseParserTimer = () => {
    const measurements = [];

    return {
        measure: (parser, element, prefix) => {
            const start = performance.now();
            const result = parser.parse(element, prefix);
            const duration = performance.now() - start;

            measurements.push({
                duration,
                prefix,
                attributeCount: Object.keys(result).length
            });

            return { result, duration };
        },

        getAverageDuration: () => {
            if (measurements.length === 0) return 0;
            const total = measurements.reduce((sum, m) => sum + m.duration, 0);
            return total / measurements.length;
        },

        getTotalDuration: () => {
            return measurements.reduce((sum, m) => sum + m.duration, 0);
        },

        getMaxDuration: () => {
            if (measurements.length === 0) return 0;
            return Math.max(...measurements.map(m => m.duration));
        },

        getMinDuration: () => {
            if (measurements.length === 0) return 0;
            return Math.min(...measurements.map(m => m.duration));
        },

        reset: () => {
            measurements.length = 0;
        },

        getMeasurements: () => measurements
    };
};

/**
 * Generate test elements for performance testing
 */
export function generateVerboseElements(count = 100) {
    const prefixes = ['fx', 'bx', 'ax', 'dx', 'lx', 'nx', 'tx'];
    const templates = [
        (p) => `<span ${p}-format="currency" ${p}-currency="USD">100</span>`,
        (p) => `<input ${p}-bind="username" ${p}-debounce="300" />`,
        (p) => `<button ${p}-label="Save" ${p}-icon="disk"></button>`,
        (p) => `<div ${p}-draggable="true" ${p}-zone="drop-1"></div>`
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[i % prefixes.length];
        const template = templates[i % templates.length];
        const html = template(prefix);
        elements.push({ html, prefix });
    }

    return elements;
}

/**
 * Element creation utility for Playwright tests
 */
export function createElementFromHTML(page, html) {
    return page.evaluate((htmlString) => {
        const container = document.createElement('div');
        container.innerHTML = htmlString.trim();
        return container.firstChild;
    }, html);
}

/**
 * Assertion helpers
 */
export const assertionHelpers = {
    /**
     * Deep equality check for config objects
     */
    configEquals(actual, expected) {
        const actualKeys = Object.keys(actual).sort();
        const expectedKeys = Object.keys(expected).sort();

        if (actualKeys.length !== expectedKeys.length) {
            return false;
        }

        for (let i = 0; i < actualKeys.length; i++) {
            if (actualKeys[i] !== expectedKeys[i]) {
                return false;
            }
            if (actual[actualKeys[i]] !== expected[expectedKeys[i]]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Check if config object is empty
     */
    isEmpty(config) {
        return Object.keys(config).length === 0;
    },

    /**
     * Check if config has specific key
     */
    hasKey(config, key) {
        return Object.prototype.hasOwnProperty.call(config, key);
    },

    /**
     * Count attributes in config
     */
    countAttributes(config) {
        return Object.keys(config).length;
    }
};

/**
 * Module prefix mapping for lookups
 */
export const MODULE_PREFIXES = ['fx', 'bx', 'ax', 'dx', 'lx', 'nx', 'tx'];

/**
 * Attributes that should be skipped during parsing
 */
export const SKIP_SUFFIXES = ['-opts', '-raw'];

/**
 * Test page templates for complex scenarios
 */
export const complexTestPages = {
    allModules: `
        <div class="test-container">
            <span fx-format="currency" fx-currency="USD">100</span>
            <input bx-bind="username" bx-debounce="300" />
            <button ax-label="Save" ax-icon="disk"></button>
            <div dx-draggable="true" dx-zone="drop-1"></div>
            <div lx-src="/data/users.json" lx-cache="true"></div>
            <a nx-route="/dashboard" nx-pushState="true"></a>
            <table tx-sortable="true" tx-paginate="10"></table>
        </div>
    `,

    withSkippedAttributes: `
        <div class="test-container">
            <span fx-format="currency" fx-opts='{"currency":"USD"}' fx-raw="100">$100.00</span>
            <input bx-bind="username" bx-opts='{"debounce":300}' bx-raw="john" />
        </div>
    `,

    mixedNotations: `
        <div class="test-container">
            <span fx-format="currency:USD:2">100</span>
            <input bx-bind="username" class="bind-username-300" />
            <button ax-opts='{"label":"Save","icon":"disk"}'>Save</button>
        </div>
    `
};

/**
 * Performance benchmarks
 */
export const performanceBenchmarks = {
    maxSingleParse: 0.5,      // <0.5ms per element
    max100Parse: 50,           // <50ms for 100 elements
    maxAverageParse: 0.5       // <0.5ms average
};

export default {
    verboseAttributeSamples,
    expectedConfigs,
    CARDINALITY_ORDERS,
    edgeCases,
    createVerboseParserTimer,
    generateVerboseElements,
    createElementFromHTML,
    assertionHelpers,
    MODULE_PREFIXES,
    SKIP_SUFFIXES,
    complexTestPages,
    performanceBenchmarks
};
