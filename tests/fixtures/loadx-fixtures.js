/**
 * Test fixtures for loadX module
 */

module.exports = {
    // Configuration fixtures
    defaultConfig: {
        minDisplayMs: 300,
        autoDetect: true,
        strategies: [],
        telemetry: false
    },

    customConfig: {
        minDisplayMs: 500,
        autoDetect: false,
        strategies: ['spinner', 'skeleton'],
        telemetry: false
    },

    invalidConfig: {
        minDisplayMs: 'not-a-number',
        autoDetect: 'yes',
        telemetry: true
    },

    // Element fixtures with lx- attributes
    elements: {
        spinnerStrategy: {
            html: '<div lx-strategy="spinner">Loading...</div>',
            attributes: { 'lx-strategy': 'spinner' }
        },
        loadingTrue: {
            html: '<div lx-loading="true">Content</div>',
            attributes: { 'lx-loading': 'true' }
        },
        loadingFalse: {
            html: '<div lx-loading="false">Content</div>',
            attributes: { 'lx-loading': 'false' }
        },
        classSpinner: {
            html: '<div class="lx-spinner btn">Button</div>',
            className: 'lx-spinner btn',
            classes: ['lx-spinner', 'btn']
        },
        noLxAttributes: {
            html: '<div class="regular">Normal div</div>',
            attributes: {}
        },
        skeletonType: {
            html: '<div lx-strategy="skeleton" lx-rows="3">Content</div>',
            attributes: { 'lx-strategy': 'skeleton', 'lx-rows': '3' }
        },
        progressBar: {
            html: '<div lx-strategy="progress" lx-value="50">Progress</div>',
            attributes: { 'lx-strategy': 'progress', 'lx-value': '50' }
        },
        fadeTransition: {
            html: '<div lx-strategy="fade" lx-duration="300">Fading</div>',
            attributes: { 'lx-strategy': 'fade', 'lx-duration': '300' }
        }
    },

    // ARIA live region fixtures
    ariaLiveRegion: {
        id: 'lx-live-region',
        attributes: {
            'aria-live': 'polite',
            'aria-atomic': 'true'
        },
        className: 'ax-sr-only',
        html: '<div id="lx-live-region" aria-live="polite" aria-atomic="true" class="ax-sr-only"></div>'
    },

    // Loading strategies
    strategies: {
        spinner: {
            name: 'spinner',
            displayName: 'Spinner',
            minDuration: 300,
            classNames: ['lx-spinner', 'lx-spinner-active']
        },
        skeleton: {
            name: 'skeleton',
            displayName: 'Skeleton Screen',
            minDuration: 0,
            classNames: ['lx-skeleton', 'lx-skeleton-shimmer']
        },
        progress: {
            name: 'progress',
            displayName: 'Progress Bar',
            minDuration: 0,
            classNames: ['lx-progress', 'lx-progress-bar']
        },
        fade: {
            name: 'fade',
            displayName: 'Fade Transition',
            minDuration: 200,
            classNames: ['lx-fade', 'lx-fade-out']
        }
    },

    // Async operation fixtures
    asyncOperations: {
        fetch: {
            url: 'https://api.example.com/data',
            method: 'GET',
            duration: 500
        },
        xhr: {
            url: 'https://api.example.com/data',
            method: 'POST',
            duration: 800
        },
        htmx: {
            trigger: 'click',
            target: '#content',
            swap: 'innerHTML',
            url: '/partial'
        }
    },

    // Performance benchmarks
    performanceBenchmarks: {
        initialization: {
            maxTime: 50, // 50ms
            maxMemory: 102400 // 100KB
        },
        strategySelection: {
            maxTime: 0.1 // 0.1ms
        },
        skeletonGeneration: {
            maxTime: 5 // 5ms
        },
        domScanning: {
            maxTime: 10, // 10ms for 100 elements
            elementCount: 100
        }
    },

    // Registry fixtures
    registry: {
        empty: new Map(),
        withStrategies: new Map([
            ['spinner', { name: 'spinner', apply: () => {}, remove: () => {} }],
            ['skeleton', { name: 'skeleton', apply: () => {}, remove: () => {} }]
        ])
    },

    // API method signatures
    apiMethods: {
        initLoadX: {
            name: 'initLoadX',
            params: ['config'],
            returns: 'Object'
        },
        applyLoading: {
            name: 'applyLoading',
            params: ['element', 'options'],
            returns: 'void'
        },
        removeLoading: {
            name: 'removeLoading',
            params: ['element'],
            returns: 'void'
        }
    },

    // Error messages
    errors: {
        invalidConfig: 'Invalid configuration provided, using defaults',
        missingElement: 'Element not found',
        strategyNotFound: 'Loading strategy not found',
        initializationFailed: 'loadX initialization failed'
    },

    // Test DOM structures
    domStructures: {
        simple: `
            <div id="app">
                <button lx-strategy="spinner">Click me</button>
            </div>
        `,
        complex: `
            <div id="app">
                <div lx-strategy="spinner" lx-loading="true">
                    <p>Loading...</p>
                </div>
                <div class="lx-skeleton">
                    <div class="lx-skeleton-line"></div>
                    <div class="lx-skeleton-line"></div>
                </div>
                <div lx-strategy="progress" lx-value="50">
                    Progress: 50%
                </div>
            </div>
        `,
        nested: `
            <div lx-loading-context="form">
                <input lx-loading="true" />
                <textarea lx-loading="true"></textarea>
                <button lx-loading="true">Submit</button>
            </div>
        `,
        noLoadx: `
            <div id="app">
                <p>Regular content</p>
                <button>Normal button</button>
            </div>
        `
    },

    // Timing fixtures
    timing: {
        minDisplay: 300, // 300ms minimum display
        debounce: 100, // 100ms debounce
        animationDuration: 200, // 200ms animation
        timeout: 5000 // 5s timeout
    },

    // Event fixtures
    events: {
        loadStart: {
            type: 'lx:loadstart',
            bubbles: true,
            cancelable: false
        },
        loadEnd: {
            type: 'lx:loadend',
            bubbles: true,
            cancelable: false
        },
        timeout: {
            type: 'lx:timeout',
            bubbles: true,
            cancelable: false
        },
        error: {
            type: 'lx:error',
            bubbles: true,
            cancelable: false
        }
    },

    // HTMX integration fixtures
    htmxEvents: {
        beforeRequest: {
            type: 'htmx:beforeRequest',
            target: null
        },
        afterSwap: {
            type: 'htmx:afterSwap',
            target: null
        },
        configRequest: {
            type: 'htmx:configRequest',
            target: null
        }
    },

    // CSS class fixtures
    cssClasses: {
        loading: 'lx-loading',
        spinner: 'lx-spinner',
        skeleton: 'lx-skeleton',
        progress: 'lx-progress',
        fade: 'lx-fade',
        hidden: 'lx-hidden',
        visible: 'lx-visible',
        active: 'lx-active'
    },

    // Attribute processing fixtures (Task 1.2)
    attributeProcessing: {
        htmlAttribute: {
            html: '<div lx-strategy="spinner">Loading...</div>',
            expected: { strategy: 'spinner' }
        },
        cssClass: {
            html: '<div class="btn lx-spinner">Click</div>',
            expected: { strategy: 'spinner' }
        },
        jsonConfig: {
            html: '<div lx-config=\'{"strategy":"spinner","duration":500}\'>Loading</div>',
            expected: { strategy: 'spinner', duration: 500 }
        },
        colonSyntax: {
            html: '<div class="lx:spinner">Loading</div>',
            expected: { strategy: 'spinner' }
        },
        colonWithDuration: {
            html: '<div class="lx:spinner:500">Loading</div>',
            expected: { strategy: 'spinner', duration: 500 }
        },
        colonMultipleParams: {
            html: '<div class="lx:progress:determinate:500">Progress</div>',
            expected: { strategy: 'progress', mode: 'determinate', duration: 500 }
        },
        dataAttribute: {
            html: '<div data-lx-strategy="skeleton">Content</div>',
            expected: { strategy: 'skeleton' }
        },
        multipleStrategies: {
            html: '<div lx-strategy="spinner" class="lx-skeleton">Content</div>',
            expected: { strategy: 'spinner' } // Attribute takes precedence
        },
        invalidJson: {
            html: '<div lx-config="invalid json">Content</div>',
            expected: { strategy: 'default', error: 'JSON parse error' }
        },
        emptyAttribute: {
            html: '<div lx-strategy="">Content</div>',
            expected: { strategy: 'default' }
        },
        caseInsensitive: {
            html: '<div lx-strategy="SPINNER">Content</div>',
            expected: { strategy: 'spinner' }
        },
        whitespace: {
            html: '<div lx-strategy="  spinner  ">Content</div>',
            expected: { strategy: 'spinner' }
        },
        complexJson: {
            html: '<div lx-config=\'{"strategy":"skeleton","minHeight":"200px","animate":true}\'>Content</div>',
            expected: { strategy: 'skeleton', minHeight: '200px', animate: true }
        }
    }
};
