/**
 * Phone Number Formatting Test Fixtures
 * Comprehensive test data for all phone format scenarios
 */

const phoneFixtures = {
    // Raw 10-digit US numbers
    rawUS: {
        basic: '5551234567',
        withAreaCode415: '4155551234',
        withAreaCode212: '2125551234',
    },

    // Pre-formatted US numbers
    formattedUS: {
        withParens: '(555) 123-4567',
        withDashes: '555-123-4567',
        withDots: '555.123.4567',
        withSpaces: '555 123 4567',
    },

    // 11-digit US numbers (with country code)
    usWithCountryCode: {
        raw: '15551234567',
        raw415: '14155551234',
        formatted: '1-555-123-4567',
        withPlus: '+1 555 123 4567',
    },

    // Numbers with extra spaces
    withExtraSpaces: {
        leadingTrailing: '  555 123 4567  ',
        multipleSpaces: '555  123  4567',
        mixed: '  555-123-4567  ',
        international: '  +44  20  7946  0958  ',
    },

    // International/EU numbers
    international: {
        uk: {
            withPlus: '+44 20 7946 0958',
            with00: '00442079460958',
            with00Spaces: '004420794609 58',
            formatted: '+44 20 7946 0958',
        },
        france: {
            withPlus: '+33 1 42 86 82 00',
            with00: '0033142868200',
            formatted: '+33 1 42 86 82 00',
        },
        germany: {
            withPlus: '+49 30 12345678',
            with00: '00493012345678',
            formatted: '+49 30 12345678',
        },
        spain: {
            withPlus: '+34 91 123 4567',
            with00: '0034911234567',
            formatted: '+34 91 123 4567',
        },
    },

    // Edge cases
    edgeCases: {
        tooShort: '555123',
        tooLong: '555123456789',
        nonNumeric: 'abc-def-ghij',
        mixed: '555-ABC-1234',
        empty: '',
        spaces: '   ',
    },

    // Expected outputs for each format type
    expectedOutputs: {
        raw5551234567: {
            us: '(555) 123-4567',
            'us-dash': '555-123-4567',
            'us-dot': '555.123.4567',
            intl: '+1 555 123 4567',
        },
        raw14155551234: {
            us: '(415) 555-1234',
            'us-dash': '415-555-1234',
            'us-dot': '415.555.1234',
            intl: '+1 415 555 1234',
        },
        ukNumber: {
            us: '+44 20 7946 0958',  // Non-US, return normalized EU format
            'us-dash': '+44 20 7946 0958',
            'us-dot': '+44 20 7946 0958',
            intl: '+44 20 7946 0958',
        },
    },

    // Test scenarios from test matrix
    testMatrix: [
        // Raw 10 digits
        {
            input: '5551234567',
            formats: {
                us: '(555) 123-4567',
                'us-dash': '555-123-4567',
                'us-dot': '555.123.4567',
                intl: '+1 555 123 4567',
            },
        },
        // US formatted with dashes
        {
            input: '555-123-4567',
            formats: {
                us: '(555) 123-4567',
                'us-dash': '555-123-4567',
                'us-dot': '555.123.4567',
                intl: '+1 555 123 4567',
            },
        },
        // US formatted with parens
        {
            input: '(555) 123-4567',
            formats: {
                us: '(555) 123-4567',
                'us-dash': '555-123-4567',
                'us-dot': '555.123.4567',
                intl: '+1 555 123 4567',
            },
        },
        // Dot separated
        {
            input: '555.123.4567',
            formats: {
                us: '(555) 123-4567',
                'us-dash': '555-123-4567',
                'us-dot': '555.123.4567',
                intl: '+1 555 123 4567',
            },
        },
        // 11 digits with country code
        {
            input: '14155551234',
            formats: {
                us: '(415) 555-1234',
                'us-dash': '415-555-1234',
                'us-dot': '415.555.1234',
                intl: '+1 415 555 1234',
            },
        },
        // Extra spaces
        {
            input: '  555 123 4567  ',
            formats: {
                us: '(555) 123-4567',
                'us-dash': '555-123-4567',
                'us-dot': '555.123.4567',
                intl: '+1 555 123 4567',
            },
        },
        // UK number (EU format)
        {
            input: '+44 20 7946 0958',
            formats: {
                us: '+44 20 7946 0958',
                'us-dash': '+44 20 7946 0958',
                'us-dot': '+44 20 7946 0958',
                intl: '+44 20 7946 0958',
            },
        },
        // France number
        {
            input: '+33 1 42 86 82 00',
            formats: {
                us: '+33 1 42 86 82 00',
                'us-dash': '+33 1 42 86 82 00',
                'us-dot': '+33 1 42 86 82 00',
                intl: '+33 1 42 86 82 00',
            },
        },
        // UK with extra spaces
        {
            input: '  +44  20  7946  0958  ',
            formats: {
                us: '+44 20 7946 0958',
                'us-dash': '+44 20 7946 0958',
                'us-dot': '+44 20 7946 0958',
                intl: '+44 20 7946 0958',
            },
        },
        // UK with 00 prefix
        {
            input: '004420794609 58',
            formats: {
                us: '+44 20 7946 0958',
                'us-dash': '+44 20 7946 0958',
                'us-dot': '+44 20 7946 0958',
                intl: '+44 20 7946 0958',
            },
        },
    ],
};

module.exports = phoneFixtures;