/**
 * CSS Class Parser Test Fixtures
 *
 * Provides HTML samples, expected configurations, and utilities
 * for testing the CSS class parser module.
 */

// Import CARDINALITY_ORDERS from verbose parser for reference
import { CARDINALITY_ORDERS } from './parser-verbose-fixtures.js';

/**
 * Class prefix mapping - maps module prefixes to class prefixes
 */
export const CLASS_PREFIX_MAP = {
    fx: 'fmt',      // fmtX
    bx: 'bind',     // bindX
    ax: 'acc',      // accX
    dx: 'drag',     // dragX
    lx: 'load',     // loadX
    nx: 'nav',      // navX
    tx: 'table'     // tableX
};

/**
 * CSS class notation samples for each genX module
 */
export const classNotationSamples = {
    fmtX: {
        basic: '<span class="fmt-currency-USD-2">100</span>',
        twoValues: '<span class="fmt-currency-USD">100</span>',
        single: '<span class="fmt-currency">100</span>',
        withUtilityClasses: '<span class="btn btn-primary fmt-currency-USD mt-4">100</span>',
        datePattern: '<span class="fmt-date-YYYY-MM-DD">2024-01-01</span>',
        fullCardinality: '<span class="fmt-currency-USD-2-#,###.##-en-US">100</span>'
    },

    bindX: {
        basic: '<input class="bind-username-300" />',
        single: '<input class="bind-username" />',
        withUtilityClasses: '<input class="form-control bind-email-500 required" />',
        fullCardinality: '<input class="bind-username-300-required-trim" />'
    },

    accX: {
        basic: '<button class="acc-Save-disk-CtrlS">Save</button>',
        twoValues: '<button class="acc-Save-disk">Save</button>',
        single: '<button class="acc-Save">Save</button>',
        withUtilityClasses: '<button class="btn btn-primary acc-Save-disk">Save</button>'
    },

    dragX: {
        basic: '<div class="drag-true-dropzone1"></div>',
        single: '<div class="drag-true"></div>',
        withHandle: '<div class="drag-true-dropzone1-.handle"></div>',
        withUtilityClasses: '<div class="card drag-true-dropzone1 p-4"></div>'
    },

    loadX: {
        basic: '<div class="load-/data/users.json-500"></div>',
        single: '<div class="load-/data/users.json"></div>',
        withCache: '<div class="load-/data/users.json-500-true"></div>',
        urlSource: '<div class="load-https://api.example.com/data-500"></div>'
    },

    navX: {
        basic: '<a class="nav-/dashboard-true"></a>',
        single: '<a class="nav-/dashboard"></a>',
        withTitle: '<a class="nav-/dashboard-true-Dashboard"></a>',
        withUtilityClasses: '<a class="link nav-/dashboard-true">Dashboard</a>'
    },

    tableX: {
        basic: '<table class="table-true-10-true"></table>',
        twoValues: '<table class="table-true-10"></table>',
        single: '<table class="table-true"></table>',
        withUtilityClasses: '<table class="table table-striped table-true-10"></table>'
    }
};

/**
 * Expected configuration objects for class parsing
 */
export const expectedClassConfigs = {
    fmtX: {
        basic: { format: 'currency', currency: 'USD', decimals: '2' },
        twoValues: { format: 'currency', currency: 'USD' },
        single: { format: 'currency' },
        withUtilityClasses: { format: 'currency', currency: 'USD' },
        datePattern: { format: 'date', currency: 'YYYY-MM-DD' },
        fullCardinality: { format: 'currency', currency: 'USD', decimals: '2', pattern: '#,###.##', locale: 'en-US' }
    },

    bindX: {
        basic: { bind: 'username', debounce: '300' },
        single: { bind: 'username' },
        withUtilityClasses: { bind: 'email', debounce: '500' },
        fullCardinality: { bind: 'username', debounce: '300', validate: 'required', transform: 'trim' }
    },

    accX: {
        basic: { label: 'Save', icon: 'disk', shortcut: 'CtrlS' },
        twoValues: { label: 'Save', icon: 'disk' },
        single: { label: 'Save' },
        withUtilityClasses: { label: 'Save', icon: 'disk' }
    },

    dragX: {
        basic: { draggable: 'true', zone: 'dropzone1' },
        single: { draggable: 'true' },
        withHandle: { draggable: 'true', zone: 'dropzone1', handle: '.handle' },
        withUtilityClasses: { draggable: 'true', zone: 'dropzone1' }
    },

    loadX: {
        basic: { src: '/data/users.json', debounce: '500' },
        single: { src: '/data/users.json' },
        withCache: { src: '/data/users.json', debounce: '500', cache: 'true' },
        urlSource: { src: 'https://api.example.com/data', debounce: '500' }
    },

    navX: {
        basic: { route: '/dashboard', pushState: 'true' },
        single: { route: '/dashboard' },
        withTitle: { route: '/dashboard', pushState: 'true', title: 'Dashboard' },
        withUtilityClasses: { route: '/dashboard', pushState: 'true' }
    },

    tableX: {
        basic: { sortable: 'true', paginate: '10', filter: 'true' },
        twoValues: { sortable: 'true', paginate: '10' },
        single: { sortable: 'true' },
        withUtilityClasses: { sortable: 'true', paginate: '10' }
    }
};

/**
 * Edge cases for class parsing
 */
export const classEdgeCases = {
    emptySegments: {
        html: '<span class="fmt-currency--2">100</span>',
        expected: { format: 'currency', currency: '', decimals: '2' }
    },

    trailingHyphen: {
        html: '<span class="fmt-currency-USD-">100</span>',
        expected: { format: 'currency', currency: 'USD', decimals: '' }
    },

    leadingHyphen: {
        html: '<span class="fmt--USD-2">100</span>',
        expected: { format: '', currency: 'USD', decimals: '2' }
    },

    exceedsCardinality: {
        html: '<span class="fmt-currency-USD-2-YYYY-MM-DD-en-US-extra-values">100</span>',
        expected: { format: 'currency', currency: 'USD', decimals: '2', pattern: 'YYYY-MM-DD', locale: 'en-US' }
    },

    noClassAttribute: {
        html: '<span>100</span>',
        expected: {}
    },

    emptyClassAttribute: {
        html: '<span class="">100</span>',
        expected: {}
    },

    onlyUtilityClasses: {
        html: '<span class="btn btn-primary mt-4">100</span>',
        expected: {}
    },

    wrongPrefix: {
        html: '<span class="bind-username-300">100</span>',
        parsePrefix: 'fx',
        expected: {}
    },

    multipleGenXClasses: {
        html: '<span class="fmt-currency-USD bind-amount-300">100</span>',
        parsePrefix: 'fx',
        expected: { format: 'currency', currency: 'USD' }
    },

    specialCharactersInValues: {
        html: '<span class="fmt-date-YYYY/MM/DD">2024-01-01</span>',
        expected: { format: 'date', currency: 'YYYY/MM/DD' }
    },

    camelCaseInValues: {
        html: '<input class="bind-firstName-300" />',
        expected: { bind: 'firstName', debounce: '300' }
    },

    urlInValues: {
        html: '<div class="load-https://api.example.com/data-500"></div>',
        expected: { src: 'https://api.example.com/data', debounce: '500' }
    },

    filePathInValues: {
        html: '<div class="load-/data/users.json-500-true"></div>',
        expected: { src: '/data/users.json', debounce: '500', cache: 'true' }
    }
};

/**
 * Class value mapper utility
 */
export class ClassValueMapper {
    constructor(cardinalityOrders, classPrefixMap) {
        this.orders = cardinalityOrders || CARDINALITY_ORDERS;
        this.prefixMap = classPrefixMap || CLASS_PREFIX_MAP;
    }

    /**
     * Map class values to attribute names
     * @param {string} prefix - Module prefix (fx, bx, etc.)
     * @param {Array<string>} values - Array of values from split class
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
     * Get class prefix for module prefix
     */
    getClassPrefix(prefix) {
        return this.prefixMap[prefix] || null;
    }

    /**
     * Get cardinality order for prefix
     */
    getOrder(prefix) {
        return this.orders[prefix] || [];
    }
}

/**
 * Class parser performance utilities
 */
export class ClassParserTimer {
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
            hasClass: element.hasAttribute('class'),
            configSize: Object.keys(result).length
        });

        return { result, duration };
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
export function generateClassElements(count = 100) {
    const prefixes = ['fx', 'bx', 'ax', 'dx', 'lx', 'nx', 'tx'];
    const templates = [
        (classPrefix) => `<span class="${classPrefix}-currency-USD-2">100</span>`,
        (classPrefix) => `<input class="${classPrefix}-username-300" />`,
        (classPrefix) => `<button class="${classPrefix}-Save-disk-CtrlS">Save</button>`,
        (classPrefix) => `<div class="${classPrefix}-true-dropzone1"></div>`
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[i % prefixes.length];
        const classPrefix = CLASS_PREFIX_MAP[prefix];
        const template = templates[i % templates.length];
        const html = template(classPrefix);
        elements.push({ html, prefix, classPrefix });
    }

    return elements;
}

/**
 * Test helpers for verifying class parsing behavior
 */
export const classTestHelpers = {
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
     * Extract genX class from class list
     */
    extractGenXClass(classList, classPrefix) {
        const classes = classList.split(/\s+/);
        return classes.find(cls => cls.startsWith(classPrefix + '-')) || null;
    },

    /**
     * Split class by hyphen
     */
    splitByHyphen(classValue) {
        return classValue.split('-');
    },

    /**
     * Check if class contains a specific prefix
     */
    hasClassPrefix(classList, classPrefix) {
        return classList.includes(classPrefix + '-');
    },

    /**
     * Get non-genX classes from class list
     */
    getNonGenXClasses(classList, classPrefixMap) {
        const classes = classList.split(/\s+/);
        const genXPrefixes = Object.values(classPrefixMap);
        return classes.filter(cls => !genXPrefixes.some(prefix => cls.startsWith(prefix + '-')));
    }
};

/**
 * Complex test scenarios
 */
export const complexClassScenarios = {
    mergeWithVerbose: {
        html: '<span class="fmt-currency-USD" fx-locale="en-US">100</span>',
        baseConfig: { locale: 'en-US' },
        expected: { format: 'currency', currency: 'USD', locale: 'en-US' }
    },

    classOverridesVerbose: {
        html: '<span class="fmt-currency-USD" fx-format="number" fx-decimals="2">100</span>',
        baseConfig: { format: 'number', decimals: '2' },
        expected: { format: 'currency', currency: 'USD' }
    },

    multipleNotations: {
        html: '<span class="fmt-currency" fx-currency="USD" fx-opts=\'{"decimals":2}\'>100</span>',
        expected: { format: 'currency', currency: 'USD', decimals: 2 }
    },

    preserveUtilityClasses: {
        html: '<button class="btn btn-primary acc-Save-disk mt-4 px-3">Save</button>',
        expected: { label: 'Save', icon: 'disk' },
        preservedClasses: ['btn', 'btn-primary', 'mt-4', 'px-3']
    }
};

/**
 * Performance benchmarks
 */
export const classPerformanceBenchmarks = {
    maxSingleParse: 0.5,      // <0.5ms per element
    max100Parse: 50,          // <50ms for 100 elements
    maxAverageParse: 0.5      // <0.5ms average
};

/**
 * Re-export CARDINALITY_ORDERS for convenience
 */
export { CARDINALITY_ORDERS };

export default {
    CLASS_PREFIX_MAP,
    classNotationSamples,
    expectedClassConfigs,
    classEdgeCases,
    ClassValueMapper,
    ClassParserTimer,
    generateClassElements,
    classTestHelpers,
    complexClassScenarios,
    classPerformanceBenchmarks,
    CARDINALITY_ORDERS
};
