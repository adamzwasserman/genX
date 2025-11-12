/**
 * Test data fixtures
 */

module.exports = {
    // Currency test data
    currencies: {
        usd: { value: 25.00, formatted: '$25.00', locale: 'en-US', currency: 'USD' },
        eur: { value: 99.99, formatted: '99,99 €', locale: 'de-DE', currency: 'EUR' },
        gbp: { value: 1234.56, formatted: '£1,234.56', locale: 'en-GB', currency: 'GBP' },
        jpy: { value: 1234, formatted: '¥1,234', locale: 'ja-JP', currency: 'JPY' }
    },

    // Date test data
    dates: {
        testDate: '2024-03-15',
        shortFormat: { style: 'short', expected: /\d{1,2}\/\d{1,2}\/\d{2,4}/ },
        mediumFormat: { style: 'medium', expected: 'Mar 15, 2024' },
        longFormat: { style: 'long', expected: 'March 15, 2024' },
        fullFormat: { style: 'full', expected: /March 15, 2024/ }
    },

    // Number test data
    numbers: {
        simple: { value: 1234, formatted: '1,234' },
        decimal: { value: 1234.56, formatted: '1,234.56' },
        large: { value: 1234567890, formatted: '1,234,567,890' }
    },

    // Percentage test data
    percentages: {
        simple: { value: 0.75, formatted: '75%' },
        decimal: { value: 0.1234, formatted: '12.34%' },
        whole: { value: 1.0, formatted: '100%' }
    },

    // Abbreviated numbers
    abbreviated: {
        thousand: { value: 1500, formatted: '1.5K' },
        tenThousand: { value: 12340, formatted: '12.3K' },
        million: { value: 1500000, formatted: '1.5M' },
        billion: { value: 1500000000, formatted: '1.5B' },
        trillion: { value: 1500000000000, formatted: '1.5T' }
    },

    // Phone numbers (comprehensive formats)
    phoneNumbers: {
        us: {
            value: '5551234567',
            formatted: '(555) 123-4567',
            format: 'us'
        },
        usDash: {
            value: '5551234567',
            formatted: '555-123-4567',
            format: 'us-dash'
        },
        usDot: {
            value: '5551234567',
            formatted: '555.123.4567',
            format: 'us-dot'
        },
        international: {
            value: '5551234567',
            formatted: '+1 555 123 4567',
            format: 'intl'
        },
        uk: {
            value: '+44 20 7946 0958',
            formatted: '+44 20 7946 0958',
            format: 'intl'
        },
        france: {
            value: '+33 1 42 86 82 00',
            formatted: '+33 1 42 86 82 00',
            format: 'intl'
        },
        usWithCountryCode: {
            value: '14155551234',
            formatted: '(415) 555-1234',
            format: 'us'
        },
        usWithSpaces: {
            value: '  555 123 4567  ',
            formatted: '(555) 123-4567',
            format: 'us'
        }
    },

    // Text transformations
    textTransforms: {
        uppercase: { input: 'hello world', output: 'HELLO WORLD' },
        lowercase: { input: 'HELLO WORLD', output: 'hello world' },
        capitalize: { input: 'hello', output: 'Hello' },
        truncate: { input: 'This is a very long text', length: 10, output: 'This is a ...' }
    },

    // Duration data
    durations: {
        short: { seconds: 45, hhmmss: '00:00:45', human: '45s' },
        medium: { seconds: 3661, hhmmss: '01:01:01', human: '1h 1m 1s' },
        long: { seconds: 93784, hhmmss: '26:03:04', human: '26h 3m 4s' }
    },

    // File size data
    filesizes: {
        bytes: { value: 512, formatted: '512 B' },
        kilobytes: { value: 2048, formatted: '2.00 KB' },
        megabytes: { value: 2097152, formatted: '2.00 MB' },
        gigabytes: { value: 2147483648, formatted: '2.00 GB' }
    },

    // ARIA labels
    ariaLabels: {
        abbreviation: { short: 'API', full: 'Application Programming Interface' },
        currency: { raw: '25.00', label: '25 dollars' },
        date: { raw: '2024-03-15', label: 'March 15, 2024' },
        percentage: { raw: '0.75', label: '75 percent' }
    },

    // Form validation
    formValidation: {
        validEmail: 'user@example.com',
        invalidEmail: 'not-an-email',
        helpText: 'Please enter a valid email address',
        errorText: 'Invalid email format'
    },

    // Live region priorities
    liveRegions: {
        polite: { priority: 'polite', ariaLive: 'polite', ariaAtomic: 'true' },
        assertive: { priority: 'assertive', ariaLive: 'assertive', ariaAtomic: 'true' }
    },

    // Button states
    buttonStates: {
        unpressed: { pressed: 'false', ariaPressed: 'false' },
        pressed: { pressed: 'true', ariaPressed: 'true' },
        loading: { loading: 'true', ariaBusy: 'true', ariaDisabled: 'true' }
    },

    // Table data
    tableData: {
        headers: ['Product', 'Price', 'Quantity'],
        rows: [
            ['Widget', '$10.00', '5'],
            ['Gadget', '$20.00', '3'],
            ['Doohickey', '$15.00', '7']
        ]
    },

    // Navigation data
    navItems: [
        { text: 'Home', href: '/home', current: true },
        { text: 'About', href: '/about', current: false },
        { text: 'Contact', href: '/contact', current: false }
    ],

    // Module configurations
    moduleConfig: {
        bootloader: {
            cdn: 'https://cdn.genx.software/v1',
            modules: {
                'fx': '/modules/fmtx.js',
                'ax': '/modules/accx.js',
                'bx': '/modules/bindx.js',
                'dx': '/modules/dragx.js',
                'lx': '/modules/loadx.js',
                'tx': '/modules/tablex.js',
                'nx': '/modules/navx.js'
            }
        },
        fmtx: {
            defaultLocale: 'en-US',
            defaultCurrency: 'USD',
            observe: true
        },
        accx: {
            prefix: 'ax-',
            observe: true,
            wcagLevel: 'AA'
        }
    },

    // Performance benchmarks
    performanceBenchmarks: {
        bootloader: {
            maxSize: 1024, // 1KB
            maxLoadTime: 100 // 100ms
        },
        fmtx: {
            maxFormatTime: 10, // 10ms for 1000 elements
            targetFps: 60,
            maxFrameTime: 16.67 // 60 FPS = 16.67ms per frame
        },
        accx: {
            maxEnhanceTime: 16, // 16ms for 1000 elements
            targetFps: 60,
            maxFrameTime: 16.67
        }
    }
};
