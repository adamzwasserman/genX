/**
 * Colon Syntax Parser Test Fixtures
 *
 * Provides HTML samples, expected configurations, and utilities
 * for testing the colon syntax parser module.
 */

// Import CARDINALITY_ORDERS from verbose parser for reference
import { CARDINALITY_ORDERS } from './parser-verbose-fixtures.js';

/**
 * Colon syntax HTML samples for each genX module
 */
export const colonSyntaxSamples = {
    fmtX: {
        basic: '<span fx-format="currency:USD:2">1234.56</span>',
        twoValues: '<span fx-format="currency:USD">1234.56</span>',
        single: '<span fx-format="currency">1234.56</span>',
        trailingColon: '<span fx-format="currency:USD:">1234.56</span>',
        multipleTrailing: '<span fx-format="currency::">1234.56</span>',
        leadingColon: '<span fx-format=":USD:2">1234.56</span>',
        allEmpty: '<span fx-format="::">1234.56</span>',
        withPattern: '<span fx-format="number:2:1000">5000</span>',
        fullCardinality: '<span fx-format="date:USD:2:YYYY-MM-DD:en-US">2024-01-01</span>'
    },

    bindX: {
        basic: '<input bx-bind="username:300" />',
        single: '<input bx-bind="username" />',
        withValidate: '<input bx-bind="email:500:required" />',
        trailingColon: '<input bx-bind="username:" />'
    },

    accX: {
        basic: '<button ax-label="Save:disk:Ctrl+S"></button>',
        twoValues: '<button ax-label="Save:disk"></button>',
        single: '<button ax-label="Save"></button>',
        trailingColon: '<button ax-label="Save:"></button>'
    },

    dragX: {
        basic: '<div dx-draggable="true:dropzone-1"></div>',
        single: '<div dx-draggable="true"></div>',
        withHandle: '<div dx-draggable="true:dropzone-1:.handle"></div>'
    },

    loadX: {
        basic: '<div lx-src="/data/users.json:500"></div>',
        single: '<div lx-src="/data/users.json"></div>',
        withCache: '<div lx-src="/data/users.json:500:true"></div>',
        urlWithColon: '<div lx-src="https://api.example.com/data:500"></div>'
    },

    navX: {
        basic: '<a nx-route="/dashboard:true"></a>',
        single: '<a nx-route="/dashboard"></a>',
        withTitle: '<a nx-route="/dashboard:true:Dashboard"></a>'
    },

    tableX: {
        basic: '<table tx-sortable="true:10:true"></table>',
        twoValues: '<table tx-sortable="true:10"></table>',
        single: '<table tx-sortable="true"></table>'
    }
};

/**
 * Expected configuration objects for colon parsing
 */
export const expectedColonConfigs = {
    fmtX: {
        basic: { format: 'currency', currency: 'USD', decimals: '2' },
        twoValues: { format: 'currency', currency: 'USD' },
        single: { format: 'currency' },
        trailingColon: { format: 'currency', currency: 'USD', decimals: '' },
        multipleTrailing: { format: 'currency', currency: '', decimals: '' },
        leadingColon: { format: '', currency: 'USD', decimals: '2' },
        allEmpty: { format: '', currency: '', decimals: '' },
        withPattern: { format: 'number', decimals: '2', pattern: '1000' },
        fullCardinality: { format: 'date', currency: 'USD', decimals: '2', pattern: 'YYYY-MM-DD', locale: 'en-US' }
    },

    bindX: {
        basic: { bind: 'username', debounce: '300' },
        single: { bind: 'username' },
        withValidate: { bind: 'email', debounce: '500', validate: 'required' },
        trailingColon: { bind: 'username', debounce: '' }
    },

    accX: {
        basic: { label: 'Save', icon: 'disk', shortcut: 'Ctrl+S' },
        twoValues: { label: 'Save', icon: 'disk' },
        single: { label: 'Save' },
        trailingColon: { label: 'Save', icon: '' }
    },

    dragX: {
        basic: { draggable: 'true', zone: 'dropzone-1' },
        single: { draggable: 'true' },
        withHandle: { draggable: 'true', zone: 'dropzone-1', handle: '.handle' }
    },

    loadX: {
        basic: { src: '/data/users.json', debounce: '500' },
        single: { src: '/data/users.json' },
        withCache: { src: '/data/users.json', debounce: '500', cache: 'true' },
        urlWithColon: { src: 'https://api.example.com/data', debounce: '500' }
    },

    navX: {
        basic: { route: '/dashboard', pushState: 'true' },
        single: { route: '/dashboard' },
        withTitle: { route: '/dashboard', pushState: 'true', title: 'Dashboard' }
    },

    tableX: {
        basic: { sortable: 'true', paginate: '10', filter: 'true' },
        twoValues: { sortable: 'true', paginate: '10' },
        single: { sortable: 'true' }
    }
};

/**
 * Edge cases for colon parsing
 */
export const colonEdgeCases = {
    emptyString: {
        html: '<span fx-format="">Test</span>',
        expected: { format: '' }
    },
    onlyColons: {
        html: '<span fx-format=":::">Test</span>',
        expected: { format: '', currency: '', decimals: '', pattern: '' }
    },
    specialCharacters: {
        html: '<span fx-pattern="[0-9]{3}:[A-Z]{2}">Test</span>',
        expected: { pattern: '[0-9]{3}', currency: '[A-Z]{2}' }
    },
    mixedNotation: {
        html: '<span fx-format="currency:USD" fx-decimals="2">100</span>',
        expected: { format: 'currency', currency: 'USD', decimals: '2' }
    },
    colonOverridesVerbose: {
        html: '<span fx-format="currency:EUR" fx-currency="USD">100</span>',
        expected: { format: 'currency', currency: 'EUR' }
    },
    withOpts: {
        html: '<span fx-format="currency:USD" fx-opts=\'{"decimals":2}\'>100</span>',
        expected: { format: 'currency', currency: 'USD' } // opts should be skipped
    },
    withRaw: {
        html: '<span fx-format="currency:USD" fx-raw="100">$100</span>',
        expected: { format: 'currency', currency: 'USD' } // raw should be skipped
    }
};

/**
 * Mapping utilities
 */
export class ColonValueMapper {
    constructor(cardinalityOrders) {
        this.orders = cardinalityOrders || CARDINALITY_ORDERS;
    }

    /**
     * Map colon-separated values to attribute names
     * @param {string} prefix - Module prefix (fx, bx, etc.)
     * @param {Array<string>} values - Array of values from split
     * @returns {Object} - Config object with mapped values
     */
    mapValues(prefix, values) {
        const config = {};
        const order = this.orders[prefix];

        if (!order) {
            return config;
        }

        for (let i = 0; i < values.length && i < order.length; i++) {
            config[order[i]] = values[i];
        }

        return config;
    }

    /**
     * Get cardinality order for a prefix
     */
    getOrder(prefix) {
        return this.orders[prefix] || [];
    }
}

/**
 * Colon parsing performance utilities
 */
export class ColonParserTimer {
    constructor() {
        this.measurements = [];
    }

    measure(parser, element, prefix, baseConfig = {}) {
        const start = performance.now();
        const result = parser.parse(element, prefix, baseConfig);
        const duration = performance.now() - start;

        this.measurements.push({
            duration,
            prefix,
            colonCount: this.countColons(element, prefix),
            attributeCount: Object.keys(result).length
        });

        return { result, duration };
    }

    countColons(element, prefix) {
        let count = 0;
        const attrs = element.attributes;
        for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith(prefix + '-')) {
                count += (attrs[i].value.match(/:/g) || []).length;
            }
        }
        return count;
    }

    getAverageDuration() {
        if (this.measurements.length === 0) return 0;
        const total = this.measurements.reduce((sum, m) => sum + m.duration, 0);
        return total / this.measurements.length;
    }

    getTotalDuration() {
        return this.measurements.reduce((sum, m) => sum + m.duration, 0);
    }

    reset() {
        this.measurements = [];
    }
}

/**
 * Generate test elements for performance testing
 */
export function generateColonElements(count = 100) {
    const prefixes = ['fx', 'bx', 'ax', 'dx', 'lx', 'nx', 'tx'];
    const templates = [
        (p) => `<span ${p}-format="currency:USD:2">100</span>`,
        (p) => `<input ${p}-bind="username:300" />`,
        (p) => `<button ${p}-label="Save:disk:Ctrl+S"></button>`,
        (p) => `<div ${p}-draggable="true:dropzone-1"></div>`
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
 * Test helpers for verifying colon parsing behavior
 */
export const colonTestHelpers = {
    /**
     * Check if config matches expected, ignoring order
     */
    configMatches(actual, expected) {
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
     * Split value by colon
     */
    splitByColon(value) {
        return value.split(':');
    },

    /**
     * Count colons in a value
     */
    countColons(value) {
        return (value.match(/:/g) || []).length;
    },

    /**
     * Check if value contains colons
     */
    hasColons(value) {
        return value.includes(':');
    }
};

/**
 * Complex test scenarios
 */
export const complexColonScenarios = {
    mergeWithVerbose: {
        html: '<span fx-format="currency:USD" fx-locale="en-US">100</span>',
        expected: { format: 'currency', currency: 'USD', locale: 'en-US' }
    },

    colonOverride: {
        html: '<span fx-format="currency:EUR" fx-currency="USD" fx-decimals="2">100</span>',
        expected: { format: 'currency', currency: 'EUR', decimals: '2' }
    },

    partialCardinality: {
        html: '<span fx-format="currency:::en-US">100</span>',
        expected: { format: 'currency', currency: '', decimals: '', pattern: '', locale: 'en-US' }
    },

    exceedsCardinality: {
        html: '<span fx-format="a:b:c:d:e:f:g">Test</span>',
        expected: { format: 'a', currency: 'b', decimals: 'c', pattern: 'd', locale: 'e' }
    }
};

/**
 * Performance benchmarks
 */
export const colonPerformanceBenchmarks = {
    maxSingleParse: 0.5,      // <0.5ms per element
    max100Parse: 50,          // <50ms for 100 elements
    maxAverageParse: 0.5      // <0.5ms average
};

/**
 * Re-export CARDINALITY_ORDERS for convenience
 */
export { CARDINALITY_ORDERS };

export default {
    colonSyntaxSamples,
    expectedColonConfigs,
    colonEdgeCases,
    ColonValueMapper,
    ColonParserTimer,
    generateColonElements,
    colonTestHelpers,
    complexColonScenarios,
    colonPerformanceBenchmarks,
    CARDINALITY_ORDERS
};
