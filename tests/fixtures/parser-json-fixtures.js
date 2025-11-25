/**
 * JSON Parser Test Fixtures
 *
 * Provides HTML samples, expected configurations, and utilities
 * for testing the JSON parser module.
 */

/**
 * Valid JSON configuration samples for each genX module
 */
export const jsonOptsSamples = {
    fmtX: {
        basic: '<span fx-opts=\'{"format":"currency","currency":"USD"}\'>100</span>',
        full: '<span fx-opts=\'{"format":"currency","currency":"USD","decimals":2,"pattern":"#,###.##","locale":"en-US"}\'>100</span>',
        withNumbers: '<span fx-opts=\'{"format":"number","decimals":2}\'>100</span>',
        withBooleans: '<span fx-opts=\'{"format":"currency","roundUp":true}\'>100</span>',
        withNull: '<span fx-opts=\'{"format":"currency","currency":null}\'>100</span>',
        withNested: '<span fx-opts=\'{"format":"currency","options":{"decimals":2,"symbol":"$"}}\'>100</span>',
        withArray: '<span fx-opts=\'{"format":"number","validValues":[1,2,3,4,5]}\'>100</span>',
        empty: '<span fx-opts=\'{}\'>100</span>',
        withWhitespace: '<span fx-opts=\'  {  "format"  :  "currency"  }  \'>100</span>'
    },

    bindX: {
        basic: '<input bx-opts=\'{"bind":"username","debounce":300}\' />',
        full: '<input bx-opts=\'{"bind":"username","debounce":300,"validate":"required","transform":"trim"}\' />',
        withBoolean: '<input bx-opts=\'{"bind":"email","required":true}\' />'
    },

    accX: {
        basic: '<button ax-opts=\'{"label":"Save","icon":"disk"}\'>Save</button>',
        full: '<button ax-opts=\'{"label":"Save","icon":"disk","shortcut":"Ctrl+S","role":"button"}\'>Save</button>'
    },

    dragX: {
        basic: '<div dx-opts=\'{"draggable":true,"zone":"dropzone-1"}\'></div>',
        full: '<div dx-opts=\'{"draggable":true,"zone":"dropzone-1","handle":".handle","data":{"id":123}}\'></div>'
    },

    loadX: {
        basic: '<div lx-opts=\'{"src":"/data/users.json","debounce":500}\'></div>',
        full: '<div lx-opts=\'{"src":"/data/users.json","debounce":500,"cache":true,"transform":"parseJSON"}\'></div>'
    },

    navX: {
        basic: '<a nx-opts=\'{"route":"/dashboard","pushState":true}\'></a>',
        full: '<a nx-opts=\'{"route":"/dashboard","pushState":true,"title":"Dashboard","params":{"view":"list"}}\'></a>'
    },

    tableX: {
        basic: '<table tx-opts=\'{"sortable":true,"paginate":10}\'></table>',
        full: '<table tx-opts=\'{"sortable":true,"paginate":10,"filter":true,"columns":["name","email","status"]}\'></table>'
    }
};

/**
 * Expected configuration objects for JSON parsing
 */
export const expectedJsonConfigs = {
    fmtX: {
        basic: { format: 'currency', currency: 'USD' },
        full: { format: 'currency', currency: 'USD', decimals: 2, pattern: '#,###.##', locale: 'en-US' },
        withNumbers: { format: 'number', decimals: 2 },
        withBooleans: { format: 'currency', roundUp: true },
        withNull: { format: 'currency', currency: null },
        withNested: { format: 'currency', options: { decimals: 2, symbol: '$' } },
        withArray: { format: 'number', validValues: [1, 2, 3, 4, 5] },
        empty: {},
        withWhitespace: { format: 'currency' }
    },

    bindX: {
        basic: { bind: 'username', debounce: 300 },
        full: { bind: 'username', debounce: 300, validate: 'required', transform: 'trim' },
        withBoolean: { bind: 'email', required: true }
    },

    accX: {
        basic: { label: 'Save', icon: 'disk' },
        full: { label: 'Save', icon: 'disk', shortcut: 'Ctrl+S', role: 'button' }
    },

    dragX: {
        basic: { draggable: true, zone: 'dropzone-1' },
        full: { draggable: true, zone: 'dropzone-1', handle: '.handle', data: { id: 123 } }
    },

    loadX: {
        basic: { src: '/data/users.json', debounce: 500 },
        full: { src: '/data/users.json', debounce: 500, cache: true, transform: 'parseJSON' }
    },

    navX: {
        basic: { route: '/dashboard', pushState: true },
        full: { route: '/dashboard', pushState: true, title: 'Dashboard', params: { view: 'list' } }
    },

    tableX: {
        basic: { sortable: true, paginate: 10 },
        full: { sortable: true, paginate: 10, filter: true, columns: ['name', 'email', 'status'] }
    }
};

/**
 * Malformed JSON test cases
 */
export const malformedJsonSamples = {
    noQuotes: {
        html: '<span fx-opts=\'{format:currency}\'>100</span>',
        expected: {}, // Empty config due to parse failure
        shouldWarn: true
    },

    trailingComma: {
        html: '<span fx-opts=\'{"format":"currency","currency":"USD",}\'>100</span>',
        expected: {},
        shouldWarn: true
    },

    singleQuotes: {
        html: '<span fx-opts="{ \'format\':\'currency\' }">100</span>',
        expected: {},
        shouldWarn: true
    },

    invalidSyntax: {
        html: '<span fx-opts=\'{invalid json}\'>100</span>',
        expected: {},
        shouldWarn: true
    },

    undefinedValue: {
        html: '<span fx-opts=\'{"format":"currency","currency":undefined}\'>100</span>',
        expected: {},
        shouldWarn: true
    },

    missingCloseBrace: {
        html: '<span fx-opts=\'{"format":"currency"\'>100</span>',
        expected: {},
        shouldWarn: true
    },

    missingOpenBrace: {
        html: '<span fx-opts=\'"format":"currency"}\'>100</span>',
        expected: {},
        shouldWarn: true
    },

    extraComma: {
        html: '<span fx-opts=\'{"format":"currency",,}\'>100</span>',
        expected: {},
        shouldWarn: true
    }
};

/**
 * Edge cases for JSON parsing
 */
export const jsonEdgeCases = {
    specialCharacters: {
        html: '<span fx-opts=\'{"format":"currency","pattern":"#,###.## \\"USD\\""}\'>100</span>',
        expected: { format: 'currency', pattern: '#,###.## "USD"' }
    },

    unicodeCharacters: {
        html: '<span fx-opts=\'{"format":"currency","symbol":"€"}\'>100</span>',
        expected: { format: 'currency', symbol: '€' }
    },

    numericKeys: {
        html: '<span fx-opts=\'{"0":"first","1":"second"}\'>100</span>',
        expected: { '0': 'first', '1': 'second' }
    },

    veryLargeObject: {
        // Generate object with 100 key-value pairs
        getHtml: () => {
            const obj = {};
            for (let i = 0; i < 100; i++) {
                obj[`key${i}`] = `value${i}`;
            }
            return `<span fx-opts='${JSON.stringify(obj)}'>100</span>`;
        },
        expectedKeyCount: 100
    },

    mergeWithBaseConfig: {
        html: '<span fx-format="number" fx-opts=\'{"currency":"USD","decimals":2}\'>100</span>',
        baseConfig: { format: 'number' },
        expected: { format: 'number', currency: 'USD', decimals: 2 }
    },

    jsonOverridesBaseConfig: {
        html: '<span fx-format="number" fx-opts=\'{"format":"currency","currency":"USD"}\'>100</span>',
        baseConfig: { format: 'number' },
        expected: { format: 'currency', currency: 'USD' }
    }
};

/**
 * JSON parsing utilities
 */
export class JsonParserTimer {
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
            hasOpts: this.hasOptsAttribute(element, prefix),
            configSize: Object.keys(result).length
        });

        return { result, duration };
    }

    hasOptsAttribute(element, prefix) {
        return element.hasAttribute(`${prefix}-opts`);
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
export function generateJsonElements(count = 100) {
    const prefixes = ['fx', 'bx', 'ax', 'dx', 'lx', 'nx', 'tx'];
    const templates = [
        (p) => `<span ${p}-opts='{"format":"currency","currency":"USD"}'>100</span>`,
        (p) => `<input ${p}-opts='{"bind":"username","debounce":300}' />`,
        (p) => `<button ${p}-opts='{"label":"Save","icon":"disk"}'>Save</button>`,
        (p) => `<div ${p}-opts='{"draggable":true,"zone":"dropzone-1"}'></div>`
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
 * Test helpers for verifying JSON parsing behavior
 */
export const jsonTestHelpers = {
    /**
     * Deep equality check for config objects
     */
    configEquals(actual, expected) {
        return JSON.stringify(actual) === JSON.stringify(expected);
    },

    /**
     * Check if config object is empty
     */
    isEmpty(config) {
        return Object.keys(config).length === 0;
    },

    /**
     * Check if a value is valid JSON
     */
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Get opts attribute value from element
     */
    getOptsValue(element, prefix) {
        return element.getAttribute(`${prefix}-opts`);
    },

    /**
     * Create element selector string for logging
     */
    getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        if (element.className) {
            return `.${element.className.split(' ')[0]}`;
        }
        return element.tagName.toLowerCase();
    }
};

/**
 * Warning logging utilities
 */
export class WarningLogger {
    constructor() {
        this.warnings = [];
    }

    log(message, element, jsonString, error) {
        this.warnings.push({
            message,
            element: jsonTestHelpers.getElementSelector(element),
            jsonString,
            error: error?.message,
            timestamp: Date.now()
        });
    }

    getWarnings() {
        return this.warnings;
    }

    hasWarning(partialMessage) {
        return this.warnings.some(w => w.message.includes(partialMessage));
    }

    hasWarningForElement(elementSelector) {
        return this.warnings.some(w => w.element === elementSelector);
    }

    clear() {
        this.warnings = [];
    }
}

/**
 * Complex test scenarios
 */
export const complexJsonScenarios = {
    multipleElements: {
        html: `
            <div class="container">
                <span fx-opts='{"format":"currency","currency":"USD"}'>100</span>
                <input bx-opts='{"bind":"username","debounce":300}' />
                <button ax-opts='{"label":"Save","icon":"disk"}'>Save</button>
                <div dx-opts='{"draggable":true,"zone":"dropzone-1"}'></div>
                <div lx-opts='{"src":"/data/users.json","cache":true}'></div>
                <a nx-opts='{"route":"/dashboard","pushState":true}'></a>
                <table tx-opts='{"sortable":true,"paginate":10}'></table>
            </div>
        `,
        elementCount: 7
    },

    mixedNotations: {
        html: `
            <div class="container">
                <span fx-format="currency" fx-opts='{"currency":"USD","decimals":2}'>100</span>
                <span fx-opts='{"format":"currency","currency":"EUR"}' fx-decimals="2">100</span>
            </div>
        `,
        elementCount: 2
    },

    malformedAndValid: {
        html: `
            <div class="container">
                <span fx-opts='{"format":"currency","currency":"USD"}'>100</span>
                <span fx-opts='{invalid json}'>200</span>
                <span fx-opts='{"format":"number","decimals":2}'>300</span>
            </div>
        `,
        validCount: 2,
        malformedCount: 1
    }
};

/**
 * Performance benchmarks
 */
export const jsonPerformanceBenchmarks = {
    maxSingleParse: 0.5,      // <0.5ms per element
    max100Parse: 50,          // <50ms for 100 elements
    maxAverageParse: 0.5      // <0.5ms average
};

/**
 * Expected warning message patterns
 */
export const warningPatterns = {
    malformedJSON: /malformed JSON|parse error|invalid JSON/i,
    elementIdentifier: /#\w+|\.[\w-]+|[a-z]+/i, // ID, class, or tag name
    jsonString: /\{.*\}/
};

export default {
    jsonOptsSamples,
    expectedJsonConfigs,
    malformedJsonSamples,
    jsonEdgeCases,
    JsonParserTimer,
    generateJsonElements,
    jsonTestHelpers,
    WarningLogger,
    complexJsonScenarios,
    jsonPerformanceBenchmarks,
    warningPatterns
};
