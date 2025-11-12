#!/usr/bin/env node

/**
 * Verification script to ensure all phone format test cases are covered
 * Compares test matrix requirements against feature file scenarios
 */

const fs = require('fs');
const path = require('path');
const phoneFixtures = require('./fixtures/phone-fixtures');

// Read feature files
const fmtxFeature = fs.readFileSync(path.join(__dirname, 'features/fmtx.feature'), 'utf8');
const phoneFeature = fs.readFileSync(path.join(__dirname, 'features/fmtx-phone.feature'), 'utf8');

// All test matrix scenarios that must be covered
const requiredScenarios = [
    // Raw 10 digits
    { input: '5551234567', format: 'us', expected: '(555) 123-4567' },
    { input: '5551234567', format: 'us-dash', expected: '555-123-4567' },
    { input: '5551234567', format: 'us-dot', expected: '555.123.4567' },
    { input: '5551234567', format: 'intl', expected: '+1 555 123 4567' },

    // Pre-formatted with dashes
    { input: '555-123-4567', format: 'us', expected: '(555) 123-4567' },
    { input: '555-123-4567', format: 'us-dash', expected: '555-123-4567' },
    { input: '555-123-4567', format: 'us-dot', expected: '555.123.4567' },
    { input: '555-123-4567', format: 'intl', expected: '+1 555 123 4567' },

    // Pre-formatted with parens
    { input: '(555) 123-4567', format: 'us', expected: '(555) 123-4567' },
    { input: '(555) 123-4567', format: 'us-dash', expected: '555-123-4567' },
    { input: '(555) 123-4567', format: 'us-dot', expected: '555.123.4567' },
    { input: '(555) 123-4567', format: 'intl', expected: '+1 555 123 4567' },

    // Dot separated
    { input: '555.123.4567', format: 'us', expected: '(555) 123-4567' },
    { input: '555.123.4567', format: 'us-dash', expected: '555-123-4567' },
    { input: '555.123.4567', format: 'us-dot', expected: '555.123.4567' },
    { input: '555.123.4567', format: 'intl', expected: '+1 555 123 4567' },

    // 11 digits with country code
    { input: '14155551234', format: 'us', expected: '(415) 555-1234' },
    { input: '14155551234', format: 'us-dash', expected: '415-555-1234' },
    { input: '14155551234', format: 'us-dot', expected: '415.555.1234' },
    { input: '14155551234', format: 'intl', expected: '+1 415 555 1234' },

    // Extra spaces
    { input: '  555 123 4567  ', format: 'us', expected: '(555) 123-4567' },
    { input: '  555 123 4567  ', format: 'us-dash', expected: '555-123-4567' },
    { input: '  555 123 4567  ', format: 'us-dot', expected: '555.123.4567' },
    { input: '  555 123 4567  ', format: 'intl', expected: '+1 555 123 4567' },

    // UK number (EU format)
    { input: '+44 20 7946 0958', format: 'us', expected: '+44 20 7946 0958' },
    { input: '+44 20 7946 0958', format: 'us-dash', expected: '+44 20 7946 0958' },
    { input: '+44 20 7946 0958', format: 'us-dot', expected: '+44 20 7946 0958' },
    { input: '+44 20 7946 0958', format: 'intl', expected: '+44 20 7946 0958' },

    // France number
    { input: '+33 1 42 86 82 00', format: 'us', expected: '+33 1 42 86 82 00' },
    { input: '+33 1 42 86 82 00', format: 'us-dash', expected: '+33 1 42 86 82 00' },
    { input: '+33 1 42 86 82 00', format: 'us-dot', expected: '+33 1 42 86 82 00' },
    { input: '+33 1 42 86 82 00', format: 'intl', expected: '+33 1 42 86 82 00' },

    // UK with extra spaces
    { input: '  +44  20  7946  0958  ', format: 'us', expected: '+44 20 7946 0958' },
    { input: '  +44  20  7946  0958  ', format: 'us-dash', expected: '+44 20 7946 0958' },
    { input: '  +44  20  7946  0958  ', format: 'us-dot', expected: '+44 20 7946 0958' },
    { input: '  +44  20  7946  0958  ', format: 'intl', expected: '+44 20 7946 0958' },

    // UK with 00 prefix
    { input: '004420794609 58', format: 'us', expected: '+44 20 7946 0958' },
    { input: '004420794609 58', format: 'us-dash', expected: '+44 20 7946 0958' },
    { input: '004420794609 58', format: 'us-dot', expected: '+44 20 7946 0958' },
    { input: '004420794609 58', format: 'intl', expected: '+44 20 7946 0958' },
];

// Check coverage
function checkCoverage() {
    const combinedFeatures = fmtxFeature + '\n' + phoneFeature;
    const covered = [];
    const missing = [];

    for (const scenario of requiredScenarios) {
        // Look for the scenario in feature files
        const inputEscaped = scenario.input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const expectedEscaped = scenario.expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if scenario appears in feature files
        const hasInput = combinedFeatures.includes(scenario.input);
        const hasExpected = combinedFeatures.includes(scenario.expected);
        const hasFormat = combinedFeatures.includes(scenario.format);

        if (hasInput && hasExpected && hasFormat) {
            covered.push(scenario);
        } else {
            missing.push(scenario);
        }
    }

    // Summary report
    console.log('Phone Format Test Coverage Report');
    console.log('==================================\n');

    console.log(`Total scenarios required: ${requiredScenarios.length}`);
    console.log(`Scenarios covered: ${covered.length}`);
    console.log(`Scenarios missing: ${missing.length}\n`);

    if (missing.length > 0) {
        console.log('Missing Test Scenarios:');
        console.log('-----------------------');
        missing.forEach(s => {
            console.log(`  Input: "${s.input}" | Format: ${s.format} | Expected: "${s.expected}"`);
        });
        console.log('');
    }

    // Check for new formats
    console.log('Format Types Coverage:');
    console.log('----------------------');
    const formats = ['us', 'us-dash', 'us-dot', 'intl'];
    formats.forEach(format => {
        const count = combinedFeatures.split(`fx-phone-format="${format}"`).length - 1;
        console.log(`  ${format}: ${count} occurrences`);
    });
    console.log('');

    // Check fixture usage
    console.log('Fixture Data Coverage:');
    console.log('---------------------');
    const fixtureCategories = Object.keys(phoneFixtures);
    console.log(`  Total fixture categories: ${fixtureCategories.length}`);
    console.log(`  Categories: ${fixtureCategories.join(', ')}`);
    console.log('');

    // Feature file statistics
    console.log('Feature File Statistics:');
    console.log('------------------------');
    const fmtxPhoneScenarios = (fmtxFeature.match(/Scenario:/g) || []).filter(() =>
        fmtxFeature.includes('phone')).length;
    const phoneFeatureScenarios = (phoneFeature.match(/Scenario:/g) || []).length;
    const phoneFeatureOutlines = (phoneFeature.match(/Scenario Outline:/g) || []).length;

    console.log(`  fmtx.feature phone scenarios: ~${fmtxPhoneScenarios}`);
    console.log(`  fmtx-phone.feature scenarios: ${phoneFeatureScenarios}`);
    console.log(`  fmtx-phone.feature scenario outlines: ${phoneFeatureOutlines}`);
    console.log('');

    // Success message
    if (missing.length === 0) {
        console.log('✅ All required phone format test scenarios are covered!');
    } else {
        console.log('⚠️  Some test scenarios are missing coverage.');
        console.log('    Please review the missing scenarios above.');
    }
}

// Run verification
checkCoverage();