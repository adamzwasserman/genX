/**
 * FormatX (fmtX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical output:
 * 1. Verbose: fx-format="currency" fx-currency="USD" fx-decimals="2"
 * 2. Colon: fx-format="currency:USD:2"
 * 3. JSON: fx-opts='{"format":"currency","currency":"USD","decimals":2}'
 * 4. CSS Class: class="fmt-currency-USD-2"
 */

export const fmtxCurrencyFixtures = {
    name: 'Currency formatting (USD)',
    input: 1234.567,
    verbose: '<span fx-format="currency" fx-currency="USD" fx-decimals="2">1234.567</span>',
    colon: '<span fx-format="currency:USD:2">1234.567</span>',
    json: '<span fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\'>1234.567</span>',
    cssClass: '<span class="fmt-currency-USD-2">1234.567</span>',
    expectedOutput: '$1,234.57',
    description: 'All notation styles should format 1234.567 as $1,234.57'
};

export const fmtxCurrencyComplexFixture = {
    name: 'Currency formatting (EUR with thousand separator)',
    input: 9876543.89,
    verbose: '<span fx-format="currency" fx-currency="EUR" fx-decimals="2" fx-symbol="prefix">9876543.89</span>',
    colon: '<span fx-format="currency:EUR:2:prefix">9876543.89</span>',
    json: '<span fx-opts=\'{"format":"currency","currency":"EUR","decimals":2,"symbol":"prefix"}\'>9876543.89</span>',
    cssClass: '<span class="fmt-currency-EUR-2-prefix">9876543.89</span>',
    expectedOutput: '€9,876,543.89',
    description: 'Complex currency with EUR, 2 decimals, prefix symbol'
};

export const fmtxCurrencyEdgeCaseFixture = {
    name: 'Currency with null/empty value',
    input: null,
    verbose: '<span fx-format="currency" fx-currency="USD" fx-decimals="2"></span>',
    colon: '<span fx-format="currency:USD:2"></span>',
    json: '<span fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\'></span>',
    cssClass: '<span class="fmt-currency-USD-2"></span>',
    expectedOutput: '$0.00',
    description: 'Null/empty values should format as $0.00'
};

export const fmtxNumberFixtures = {
    name: 'Number formatting with decimals',
    input: 5000.123456,
    verbose: '<span fx-format="number" fx-decimals="2" fx-thousands="1000">5000.123456</span>',
    colon: '<span fx-format="number:2:1000">5000.123456</span>',
    json: '<span fx-opts=\'{"format":"number","decimals":2,"thousands":"1000"}\'>5000.123456</span>',
    cssClass: '<span class="fmt-number-2-1000">5000.123456</span>',
    expectedOutput: '5,000.12',
    description: 'Number formatting with thousand separator and 2 decimals'
};

export const fmtxNumberComplexFixture = {
    name: 'Number with custom thousand separator',
    input: 1234567890.12,
    verbose: '<span fx-format="number" fx-decimals="3" fx-thousands="1000" fx-sep="." fx-dec=",">1234567890.12</span>',
    colon: '<span fx-format="number:3:1000:.:">1234567890.12</span>',
    json: '<span fx-opts=\'{"format":"number","decimals":3,"thousands":"1000","sep":".","dec":","}\'>1234567890.12</span>',
    cssClass: '<span class="fmt-number-3-1000-.-">1234567890.12</span>',
    expectedOutput: '1.234.567.890,120',
    description: 'Number with custom thousand (.) and decimal (,) separators'
};

export const fmtxNumberEdgeCaseFixture = {
    name: 'Number with zero decimals',
    input: 42.9,
    verbose: '<span fx-format="number" fx-decimals="0">42.9</span>',
    colon: '<span fx-format="number:0">42.9</span>',
    json: '<span fx-opts=\'{"format":"number","decimals":0}\'>42.9</span>',
    cssClass: '<span class="fmt-number-0">42.9</span>',
    expectedOutput: '43',
    description: 'Zero decimals should round number'
};

export const fmtxPercentageFixtures = {
    name: 'Percentage formatting',
    input: 0.85,
    verbose: '<span fx-format="percentage" fx-decimals="1">0.85</span>',
    colon: '<span fx-format="percentage:1">0.85</span>',
    json: '<span fx-opts=\'{"format":"percentage","decimals":1}\'>0.85</span>',
    cssClass: '<span class="fmt-percentage-1">0.85</span>',
    expectedOutput: '85.0%',
    description: 'Decimal 0.85 formatted as percentage = 85.0%'
};

export const fmtxPercentageComplexFixture = {
    name: 'Percentage with context (input as 0-100 scale)',
    input: 85,
    verbose: '<span fx-type="percentage" fx-format="percentage" fx-decimals="0">85</span>',
    colon: '<span fx-type="percentage" fx-format="percentage:0">85</span>',
    json: '<span fx-opts=\'{"type":"percentage","format":"percentage","decimals":0}\'>85</span>',
    cssClass: '<span class="fmt-type-percentage-percentage-0">85</span>',
    expectedOutput: '85%',
    description: 'Input already in 0-100 range should format as 85%'
};

export const fmtxPercentageEdgeCaseFixture = {
    name: 'Percentage with zero value',
    input: 0,
    verbose: '<span fx-format="percentage" fx-decimals="2">0</span>',
    colon: '<span fx-format="percentage:2">0</span>',
    json: '<span fx-opts=\'{"format":"percentage","decimals":2}\'>0</span>',
    cssClass: '<span class="fmt-percentage-2">0</span>',
    expectedOutput: '0.00%',
    description: 'Zero should format as 0.00%'
};

export const fmtxDateFixtures = {
    name: 'Date formatting (ISO format)',
    input: '2024-11-25T14:30:00Z',
    verbose: '<span fx-format="date" fx-template="YYYY-MM-DD">2024-11-25T14:30:00Z</span>',
    colon: '<span fx-format="date:YYYY-MM-DD">2024-11-25T14:30:00Z</span>',
    json: '<span fx-opts=\'{"format":"date","template":"YYYY-MM-DD"}\'>2024-11-25T14:30:00Z</span>',
    cssClass: '<span class="fmt-date-YYYY-MM-DD">2024-11-25T14:30:00Z</span>',
    expectedOutput: '2024-11-25',
    description: 'Date formatted as YYYY-MM-DD'
};

export const fmtxDateComplexFixture = {
    name: 'Date formatting (locale-specific long format)',
    input: '2024-11-25',
    verbose: '<span fx-format="date" fx-template="dddd, MMMM D, YYYY" fx-locale="en-US">2024-11-25</span>',
    colon: '<span fx-format="date:dddd, MMMM D, YYYY:en-US">2024-11-25</span>',
    json: '<span fx-opts=\'{"format":"date","template":"dddd, MMMM D, YYYY","locale":"en-US"}\'>2024-11-25</span>',
    cssClass: '<span class="fmt-date-dddd, MMMM D, YYYY-en-US">2024-11-25</span>',
    expectedOutput: 'Monday, November 25, 2024',
    description: 'Long format date with weekday and full month name'
};

export const fmtxDateEdgeCaseFixture = {
    name: 'Date with invalid value',
    input: 'not-a-date',
    verbose: '<span fx-format="date" fx-template="YYYY-MM-DD">not-a-date</span>',
    colon: '<span fx-format="date:YYYY-MM-DD">not-a-date</span>',
    json: '<span fx-opts=\'{"format":"date","template":"YYYY-MM-DD"}\'>not-a-date</span>',
    cssClass: '<span class="fmt-date-YYYY-MM-DD">not-a-date</span>',
    expectedOutput: 'Invalid Date',
    description: 'Invalid date should display as Invalid Date'
};

export const fmtxPhoneFixtures = {
    name: 'Phone number formatting (US)',
    input: '5551234567',
    verbose: '<span fx-format="phone" fx-country="US">5551234567</span>',
    colon: '<span fx-format="phone:US">5551234567</span>',
    json: '<span fx-opts=\'{"format":"phone","country":"US"}\'>5551234567</span>',
    cssClass: '<span class="fmt-phone-US">5551234567</span>',
    expectedOutput: '(555) 123-4567',
    description: 'US phone number formatted with parentheses and dash'
};

export const fmtxPhoneComplexFixture = {
    name: 'Phone number with international format',
    input: '33123456789',
    verbose: '<span fx-format="phone" fx-country="FR" fx-format-type="international">33123456789</span>',
    colon: '<span fx-format="phone:FR:international">33123456789</span>',
    json: '<span fx-opts=\'{"format":"phone","country":"FR","format_type":"international"}\'>33123456789</span>',
    cssClass: '<span class="fmt-phone-FR-international">33123456789</span>',
    expectedOutput: '+33 1 23 45 67 89',
    description: 'International phone format for France'
};

export const fmtxPhoneEdgeCaseFixture = {
    name: 'Phone with non-numeric characters',
    input: '+1-555-123-4567',
    verbose: '<span fx-format="phone" fx-country="US">+1-555-123-4567</span>',
    colon: '<span fx-format="phone:US">+1-555-123-4567</span>',
    json: '<span fx-opts=\'{"format":"phone","country":"US"}\'>+1-555-123-4567</span>',
    cssClass: '<span class="fmt-phone-US">+1-555-123-4567</span>',
    expectedOutput: '(555) 123-4567',
    description: 'Phone with existing formatting should be cleaned and reformatted'
};

export const fmtxDurationFixtures = {
    name: 'Duration formatting (seconds to time)',
    input: 3661,
    verbose: '<span fx-type="seconds" fx-format="duration">3661</span>',
    colon: '<span fx-type="seconds" fx-format="duration">3661</span>',
    json: '<span fx-opts=\'{"type":"seconds","format":"duration"}\'>3661</span>',
    cssClass: '<span class="fmt-type-seconds-duration">3661</span>',
    expectedOutput: '1h 1m 1s',
    description: '3661 seconds formatted as 1h 1m 1s'
};

export const fmtxDurationComplexFixture = {
    name: 'Duration with complex time span',
    input: 86461,
    verbose: '<span fx-type="seconds" fx-format="duration" fx-template="hh:mm:ss">86461</span>',
    colon: '<span fx-type="seconds" fx-format="duration:hh:mm:ss">86461</span>',
    json: '<span fx-opts=\'{"type":"seconds","format":"duration","template":"hh:mm:ss"}\'>86461</span>',
    cssClass: '<span class="fmt-type-seconds-duration-hh:mm:ss">86461</span>',
    expectedOutput: '24:01:01',
    description: 'Duration as 24:01:01 (more than 24 hours)'
};

export const fmtxDurationEdgeCaseFixture = {
    name: 'Duration with zero seconds',
    input: 0,
    verbose: '<span fx-type="seconds" fx-format="duration">0</span>',
    colon: '<span fx-type="seconds" fx-format="duration">0</span>',
    json: '<span fx-opts=\'{"type":"seconds","format":"duration"}\'>0</span>',
    cssClass: '<span class="fmt-type-seconds-duration">0</span>',
    expectedOutput: '0s',
    description: 'Zero duration should display as 0s'
};

export const fmtxFilesizeFixtures = {
    name: 'Filesize formatting (bytes to MB)',
    input: 1048576,
    verbose: '<span fx-type="bytes" fx-format="filesize">1048576</span>',
    colon: '<span fx-type="bytes" fx-format="filesize">1048576</span>',
    json: '<span fx-opts=\'{"type":"bytes","format":"filesize"}\'>1048576</span>',
    cssClass: '<span class="fmt-type-bytes-filesize">1048576</span>',
    expectedOutput: '1 MB',
    description: '1048576 bytes formatted as 1 MB'
};

export const fmtxFilesizeComplexFixture = {
    name: 'Filesize with decimal precision',
    input: 1536000,
    verbose: '<span fx-type="bytes" fx-format="filesize" fx-decimals="2">1536000</span>',
    colon: '<span fx-type="bytes" fx-format="filesize:2">1536000</span>',
    json: '<span fx-opts=\'{"type":"bytes","format":"filesize","decimals":2}\'>1536000</span>',
    cssClass: '<span class="fmt-type-bytes-filesize-2">1536000</span>',
    expectedOutput: '1.46 MB',
    description: 'Filesize with 2 decimal places'
};

export const fmtxFilesizeEdgeCaseFixture = {
    name: 'Filesize with very small value',
    input: 512,
    verbose: '<span fx-type="bytes" fx-format="filesize">512</span>',
    colon: '<span fx-type="bytes" fx-format="filesize">512</span>',
    json: '<span fx-opts=\'{"type":"bytes","format":"filesize"}\'>512</span>',
    cssClass: '<span class="fmt-type-bytes-filesize">512</span>',
    expectedOutput: '512 B',
    description: 'Bytes less than KB should display in B'
};

/**
 * Test page with all fmtX notation styles
 * Returns HTML demonstrating all 4 notation styles
 */
export function createFmtXTestPage(formatType = 'currency') {
    const fixtures = {
        currency: fmtxCurrencyFixtures,
        number: fmtxNumberFixtures,
        percentage: fmtxPercentageFixtures,
        date: fmtxDateFixtures,
        phone: fmtxPhoneFixtures,
        duration: fmtxDurationFixtures,
        filesize: fmtxFilesizeFixtures
    };

    const fixture = fixtures[formatType] || fixtures.currency;

    return `
        <div data-test="fmtx-polymorphic-notation">
            <section data-notation="verbose">
                <h3>Verbose Notation</h3>
                ${fixture.verbose}
            </section>
            <section data-notation="colon">
                <h3>Colon Notation</h3>
                ${fixture.colon}
            </section>
            <section data-notation="json">
                <h3>JSON Notation</h3>
                ${fixture.json}
            </section>
            <section data-notation="class">
                <h3>CSS Class Notation</h3>
                ${fixture.cssClass}
            </section>
        </div>
    `;
}

/**
 * Performance test: All notation styles with 1000 elements
 */
export function createFmtXPerformanceTest(count = 1000) {
    const templates = [
        '<span fx-format="currency" fx-currency="USD" fx-decimals="2">{{value}}</span>',
        '<span fx-format="currency:USD:2">{{value}}</span>',
        '<span fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\'>{{value}}</span>',
        '<span class="fmt-currency-USD-2">{{value}}</span>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const value = (Math.random() * 10000).toFixed(2);
        elements.push(template.replace('{{value}}', value));
    }

    return `
        <div data-test="fmtx-performance" data-count="${count}">
            ${elements.join('\n')}
        </div>
    `;
}

/**
 * Edge case test: Priority resolution (JSON > Colon > Verbose > Class)
 */
export const fmtxPriorityTestFixture = {
    name: 'Priority resolution - multiple notations on same element',
    description: 'JSON should take priority over other notations',
    element: '<span fx-format="number:2" fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\' class="fmt-percentage-1">1234.56</span>',
    expectedFormat: 'currency',
    expectedOutput: '$1,234.56',
    reason: 'fx-opts (JSON) takes priority'
};

export default {
    fmtxCurrencyFixtures,
    fmtxCurrencyComplexFixture,
    fmtxCurrencyEdgeCaseFixture,
    fmtxNumberFixtures,
    fmtxNumberComplexFixture,
    fmtxNumberEdgeCaseFixture,
    fmtxPercentageFixtures,
    fmtxPercentageComplexFixture,
    fmtxPercentageEdgeCaseFixture,
    fmtxDateFixtures,
    fmtxDateComplexFixture,
    fmtxDateEdgeCaseFixture,
    fmtxPhoneFixtures,
    fmtxPhoneComplexFixture,
    fmtxPhoneEdgeCaseFixture,
    fmtxDurationFixtures,
    fmtxDurationComplexFixture,
    fmtxDurationEdgeCaseFixture,
    fmtxFilesizeFixtures,
    fmtxFilesizeComplexFixture,
    fmtxFilesizeEdgeCaseFixture,
    createFmtXTestPage,
    createFmtXPerformanceTest,
    fmtxPriorityTestFixture
};
