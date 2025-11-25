/**
 * Notation Style Detection Test Fixtures
 *
 * Provides HTML samples for testing notation style detection
 * in the genX bootloader.
 */

export const notationStyleFixtures = {
    // Verbose-only notation samples
    verboseOnly: {
        single: '<span fx-format="currency">1234.56</span>',
        multiple: `
            <div>
                <span fx-format="currency">100</span>
                <input bx-bind="username" />
                <button ax-label="Save"></button>
            </div>
        `,
        expected: ['verbose']
    },

    // Colon notation samples
    colonNotation: {
        single: '<span fx-format="currency:USD:2">1234.56</span>',
        multiple: `
            <div>
                <span fx-format="currency:USD:2">100</span>
                <span fx-format="date:YYYY-MM-DD">2024-01-01</span>
                <span fx-format="number:2:1000">5000</span>
            </div>
        `,
        mixed: '<span fx-format="currency:USD:2" fx-currency="EUR">100</span>',
        expected: ['verbose', 'colon']
    },

    // JSON notation samples
    jsonNotation: {
        single: '<span fx-opts=\'{"currency":"USD","decimals":2}\'>1234.56</span>',
        multiple: `
            <div>
                <span fx-opts='{"currency":"USD"}'>100</span>
                <input bx-opts='{"debounce":300}' />
                <button ax-opts='{"label":"Save"}'>Click</button>
            </div>
        `,
        expected: ['verbose', 'json']
    },

    // CSS class notation samples
    classNotation: {
        single: '<span class="fmt-currency-USD-2">1234.56</span>',
        multiple: `
            <div>
                <span class="fmt-currency-USD-2">100</span>
                <input class="bind-username-300" />
                <button class="acc-label-icon-Home">Save</button>
            </div>
        `,
        withNonGenX: `
            <div>
                <span class="btn btn-primary fmt-currency-USD">100</span>
                <input class="form-control bind-value-300" />
                <button class="btn-lg acc-label-Save">Click</button>
            </div>
        `,
        expected: ['class']
    },

    // Mixed notation samples
    allFourStyles: {
        sample: `
            <div>
                <span fx-format="currency">100</span>
                <span fx-format="date:YYYY-MM-DD">2024-01-01</span>
                <input bx-opts='{"debounce":300}' />
                <button class="acc-label-icon-Home">Save</button>
            </div>
        `,
        expected: ['verbose', 'colon', 'json', 'class']
    },

    verboseAndClass: {
        sample: `
            <div>
                <span fx-format="currency">100</span>
                <input bx-bind="username" />
                <span class="fmt-date-YYYY-MM-DD">2024-01-01</span>
            </div>
        `,
        expected: ['verbose', 'class']
    },

    // Edge cases
    emptyPage: {
        sample: '<div><p>Regular content</p></div>',
        expected: []
    },

    duplicateStyles: {
        sample: `
            <div>
                <span fx-format="currency:USD:2">100</span>
                <span fx-format="date:MM-DD-YYYY">2024-01-01</span>
                <span class="fmt-number-2-1000">5000</span>
                <span class="fmt-currency-EUR">200</span>
            </div>
        `,
        expected: ['verbose', 'colon', 'class']
    },

    // Performance testing
    largeDocument: {
        generate: (count = 1000) => {
            const templates = [
                '<span fx-format="currency">{{value}}</span>',
                '<span fx-format="date:YYYY-MM-DD">{{value}}</span>',
                '<input bx-opts=\'{"debounce":{{value}}}\' />',
                '<span class="fmt-number-2-1000">{{value}}</span>'
            ];

            const elements = [];
            for (let i = 0; i < count; i++) {
                const template = templates[i % templates.length];
                const element = template.replace(/\{\{value\}\}/g, i);
                elements.push(element);
            }

            return `<div class="test-container">${elements.join('\n')}</div>`;
        },
        expected: ['verbose', 'colon', 'json', 'class']
    }
};

/**
 * Module-specific notation samples
 */
export const moduleNotationSamples = {
    fmtX: {
        verbose: '<span fx-format="currency" fx-currency="USD" fx-decimals="2">100</span>',
        colon: '<span fx-format="currency:USD:2">100</span>',
        json: '<span fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\'>100</span>',
        class: '<span class="fmt-currency-USD-2">100</span>'
    },

    bindX: {
        verbose: '<input bx-bind="username" bx-debounce="300" />',
        colon: '<input bx-bind="username:300" />',
        json: '<input bx-opts=\'{"bind":"username","debounce":300}\' />',
        class: '<input class="bind-username-300" />'
    },

    accX: {
        verbose: '<button ax-label="Save" ax-icon="disk"></button>',
        colon: '<button ax-label="Save:disk"></button>',
        json: '<button ax-opts=\'{"label":"Save","icon":"disk"}\'></button>',
        class: '<button class="acc-label-icon-disk"></button>'
    }
};

/**
 * Detection pattern tests
 */
export const detectionPatterns = {
    colonPatterns: {
        single: 'currency:USD',
        double: 'date:YYYY:MM',
        triple: 'number:2:1000:true',
        none: 'currency'
    },

    jsonPatterns: {
        valid: [
            '{"currency":"USD"}',
            '{"debounce":300}',
            '{"label":"Save","icon":"home"}'
        ],
        invalid: [
            'not-json',
            '{broken',
            'currency:USD'
        ]
    },

    classPatterns: {
        genXClasses: [
            'fmt-currency-USD-2',
            'bind-username-300',
            'acc-label-icon-Home'
        ],
        nonGenXClasses: [
            'btn',
            'btn-primary',
            'form-control',
            'mx-auto'
        ],
        mixed: [
            'btn btn-primary fmt-currency-USD',
            'form-control bind-value-300',
            'container mx-auto acc-label-Save'
        ]
    }
};

/**
 * Expected results for different page configurations
 */
export const expectedDetectionResults = {
    verboseOnly: ['verbose'],
    verboseAndColon: ['verbose', 'colon'],
    verboseAndJSON: ['verbose', 'json'],
    verboseAndClass: ['verbose', 'class'],
    colonAndJSON: ['verbose', 'colon', 'json'],
    colonAndClass: ['verbose', 'colon', 'class'],
    jsonAndClass: ['verbose', 'json', 'class'],
    allFour: ['verbose', 'colon', 'json', 'class'],
    empty: []
};

/**
 * Performance benchmarks
 */
export const performanceBenchmarks = {
    maxDetectionTime: {
        small: 1,      // <1ms for pages with <100 elements
        medium: 1,     // <1ms for pages with 100-1000 elements
        large: 1       // <1ms for pages with 1000+ elements
    },

    samples: {
        small: 50,
        medium: 500,
        large: 1000
    }
};

/**
 * Helper function to create test pages
 */
export function createTestPage(config) {
    const elements = [];

    if (config.verbose) {
        elements.push('<span fx-format="currency">100</span>');
    }

    if (config.colon) {
        elements.push('<span fx-format="date:YYYY-MM-DD">2024-01-01</span>');
    }

    if (config.json) {
        elements.push('<input bx-opts=\'{"debounce":300}\' />');
    }

    if (config.class) {
        elements.push('<span class="fmt-number-2-1000">5000</span>');
    }

    return `<div class="test-container">${elements.join('\n')}</div>`;
}

/**
 * Timer utility for performance testing
 */
export class DetectionTimer {
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
        const duration = performance.now() - startTime;
        this.marks.delete(label);
        return duration;
    }

    measure(fn, label = 'detection') {
        this.start(label);
        const result = fn();
        const duration = this.end(label);
        return { result, duration };
    }
}

export default notationStyleFixtures;
