/**
 * AccessX (accX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical accessibility enhancements:
 * 1. Verbose: ax-label="Save" ax-icon="disk" ax-role="button"
 * 2. Colon: ax-label="Save:disk:button"
 * 3. JSON: ax-opts='{"label":"Save","icon":"disk","role":"button"}'
 * 4. CSS Class: class="acc-label-icon-button"
 */

export const accxLabelFixtures = {
    name: 'Accessibility label enhancement',
    verbose: '<button ax-label="Save Document">Save</button>',
    colon: '<button ax-label="Save Document">Save</button>',
    json: '<button ax-opts=\'{"label":"Save Document"}\'>Save</button>',
    cssClass: '<button class="acc-label-Save-Document">Save</button>',
    expectedAriaLabel: 'Save Document',
    expectedRole: 'button',
    description: 'All notation styles should set aria-label to "Save Document"'
};

export const accxLabelComplexFixture = {
    name: 'Icon label with context and tooltip',
    verbose: '<span ax-label="Menu" ax-icon="hamburger" ax-context="navigation" ax-tooltip="Toggle main menu">≡</span>',
    colon: '<span ax-label="Menu:hamburger:navigation:Toggle main menu">≡</span>',
    json: '<span ax-opts=\'{"label":"Menu","icon":"hamburger","context":"navigation","tooltip":"Toggle main menu"}\'>≡</span>',
    cssClass: '<span class="acc-label-icon-context-tooltip-Menu-hamburger-navigation-Toggle main menu">≡</span>',
    expectedAriaLabel: 'Menu, hamburger icon, Toggle main menu',
    expectedRole: 'img',
    expectedTitle: 'Toggle main menu',
    description: 'Complex label with icon context and tooltip'
};

export const accxLabelEdgeCaseFixture = {
    name: 'Label with empty/null value',
    verbose: '<button ax-label="">Button</button>',
    colon: '<button ax-label="">Button</button>',
    json: '<button ax-opts=\'{"label":""}\'>Button</button>',
    cssClass: '<button class="acc-label-">Button</button>',
    expectedAriaLabel: 'Button',
    expectedRole: 'button',
    description: 'Empty label should fall back to element text content'
};

export const accxAbbreviationFixtures = {
    name: 'Abbreviation expansion',
    verbose: '<span ax-abbreviation="HTML" ax-expanded="HyperText Markup Language">HTML</span>',
    colon: '<span ax-abbreviation="HTML:HyperText Markup Language">HTML</span>',
    json: '<span ax-opts=\'{"abbreviation":"HTML","expanded":"HyperText Markup Language"}\'>HTML</span>',
    cssClass: '<span class="acc-abbreviation-HTML-HyperText-Markup-Language">HTML</span>',
    expectedTitle: 'HyperText Markup Language',
    expectedAriaLabel: 'HyperText Markup Language',
    description: 'Abbreviation should have title and aria-label'
};

export const accxAbbreviationComplexFixture = {
    name: 'Nested abbreviations with pronunciation guide',
    verbose: '<span ax-abbreviation="WCAG" ax-expanded="Web Content Accessibility Guidelines" ax-pronunciation="W-C-A-G">WCAG</span>',
    colon: '<span ax-abbreviation="WCAG:Web Content Accessibility Guidelines:W-C-A-G">WCAG</span>',
    json: '<span ax-opts=\'{"abbreviation":"WCAG","expanded":"Web Content Accessibility Guidelines","pronunciation":"W-C-A-G"}\'>WCAG</span>',
    cssClass: '<span class="acc-abbreviation-WCAG-Web-Content-Accessibility-Guidelines-W-C-A-G">WCAG</span>',
    expectedTitle: 'Web Content Accessibility Guidelines',
    expectedAriaLabel: 'W-C-A-G Web Content Accessibility Guidelines',
    description: 'Abbreviation with pronunciation guide'
};

export const accxAbbreviationEdgeCaseFixture = {
    name: 'Abbreviation without expansion',
    verbose: '<span ax-abbreviation="CSS">CSS</span>',
    colon: '<span ax-abbreviation="CSS">CSS</span>',
    json: '<span ax-opts=\'{"abbreviation":"CSS"}\'>CSS</span>',
    cssClass: '<span class="acc-abbreviation-CSS">CSS</span>',
    expectedTitle: undefined,
    expectedAriaLabel: 'CSS',
    description: 'Abbreviation without expansion should just have aria-label'
};

export const accxDateFixtures = {
    name: 'Date semantic annotation',
    verbose: '<span ax-date="2024-11-25" ax-format="long">November 25, 2024</span>',
    colon: '<span ax-date="2024-11-25:long">November 25, 2024</span>',
    json: '<span ax-opts=\'{"date":"2024-11-25","format":"long"}\'>November 25, 2024</span>',
    cssClass: '<span class="acc-date-2024-11-25-long">November 25, 2024</span>',
    expectedAriaLabel: 'Monday, November 25, 2024',
    expectedAttributes: { 'aria-label': 'Monday, November 25, 2024' },
    description: 'Date should have semantic meaning in aria-label'
};

export const accxDateComplexFixture = {
    name: 'Date range annotation',
    verbose: '<span ax-date-start="2024-01-01" ax-date-end="2024-12-31" ax-context="fiscal year">Jan 1 - Dec 31, 2024</span>',
    colon: '<span ax-date-start="2024-01-01" ax-date-end="2024-12-31" ax-context="fiscal year">Jan 1 - Dec 31, 2024</span>',
    json: '<span ax-opts=\'{"date_start":"2024-01-01","date_end":"2024-12-31","context":"fiscal year"}\'>Jan 1 - Dec 31, 2024</span>',
    cssClass: '<span class="acc-date-start-date-end-context-2024-01-01-2024-12-31-fiscal-year">Jan 1 - Dec 31, 2024</span>',
    expectedAriaLabel: 'Monday, January 1, 2024 to Thursday, December 31, 2024 (fiscal year)',
    description: 'Date range should provide semantic context'
};

export const accxDateEdgeCaseFixture = {
    name: 'Invalid date value',
    verbose: '<span ax-date="invalid" ax-format="long">Bad Date</span>',
    colon: '<span ax-date="invalid:long">Bad Date</span>',
    json: '<span ax-opts=\'{"date":"invalid","format":"long"}\'>Bad Date</span>',
    cssClass: '<span class="acc-date-invalid-long">Bad Date</span>',
    expectedAriaLabel: 'Bad Date',
    description: 'Invalid date should fall back to text content'
};

export const accxTimeFixtures = {
    name: 'Time semantic annotation',
    verbose: '<span ax-time="14:30:00" ax-timezone="EST">2:30 PM</span>',
    colon: '<span ax-time="14:30:00:EST">2:30 PM</span>',
    json: '<span ax-opts=\'{"time":"14:30:00","timezone":"EST"}\'>2:30 PM</span>',
    cssClass: '<span class="acc-time-14:30:00-EST">2:30 PM</span>',
    expectedAriaLabel: '2:30 PM EST',
    description: 'Time should include timezone in aria-label'
};

export const accxTimeComplexFixture = {
    name: 'Time duration annotation',
    verbose: '<span ax-time-start="09:00:00" ax-time-end="17:00:00" ax-timezone="UTC">9 AM - 5 PM</span>',
    colon: '<span ax-time-start="09:00:00" ax-time-end="17:00:00" ax-timezone="UTC">9 AM - 5 PM</span>',
    json: '<span ax-opts=\'{"time_start":"09:00:00","time_end":"17:00:00","timezone":"UTC"}\'>9 AM - 5 PM</span>',
    cssClass: '<span class="acc-time-start-time-end-timezone-09:00:00-17:00:00-UTC">9 AM - 5 PM</span>',
    expectedAriaLabel: '9:00 AM to 5:00 PM UTC',
    description: 'Time range should be clear in aria-label'
};

export const accxTimeEdgeCaseFixture = {
    name: 'Time without timezone',
    verbose: '<span ax-time="23:59:59">11:59 PM</span>',
    colon: '<span ax-time="23:59:59">11:59 PM</span>',
    json: '<span ax-opts=\'{"time":"23:59:59"}\'>11:59 PM</span>',
    cssClass: '<span class="acc-time-23:59:59">11:59 PM</span>',
    expectedAriaLabel: '11:59 PM',
    description: 'Time without timezone should still work'
};

export const accxPercentageFixtures = {
    name: 'Percentage semantic annotation',
    verbose: '<span ax-percentage="85.5">85.5%</span>',
    colon: '<span ax-percentage="85.5">85.5%</span>',
    json: '<span ax-opts=\'{"percentage":"85.5"}\'>85.5%</span>',
    cssClass: '<span class="acc-percentage-85.5">85.5%</span>',
    expectedAriaLabel: '85.5 percent',
    expectedRole: 'progressbar',
    expectedAttributes: { 'aria-valuenow': '85.5', 'aria-valuemin': '0', 'aria-valuemax': '100' },
    description: 'Percentage should have ARIA progressbar attributes'
};

export const accxPercentageComplexFixture = {
    name: 'Progress bar with label',
    verbose: '<div ax-percentage="42.3" ax-label="Download Progress">42.3%</div>',
    colon: '<div ax-percentage="42.3:Download Progress">42.3%</div>',
    json: '<div ax-opts=\'{"percentage":"42.3","label":"Download Progress"}\'>42.3%</div>',
    cssClass: '<div class="acc-percentage-label-42.3-Download-Progress">42.3%</div>',
    expectedAriaLabel: 'Download Progress, 42.3 percent',
    expectedRole: 'progressbar',
    expectedAttributes: { 'aria-valuenow': '42.3', 'aria-valuemin': '0', 'aria-valuemax': '100' },
    description: 'Progress bar with custom label'
};

export const accxPercentageEdgeCaseFixture = {
    name: 'Percentage over 100',
    verbose: '<span ax-percentage="125">125%</span>',
    colon: '<span ax-percentage="125">125%</span>',
    json: '<span ax-opts=\'{"percentage":"125"}\'>125%</span>',
    cssClass: '<span class="acc-percentage-125">125%</span>',
    expectedAriaLabel: '125 percent',
    expectedAttributes: { 'aria-valuenow': '125', 'aria-valuemax': '100' },
    description: 'Percentage over 100 should still work'
};

export const accxCurrencyFixtures = {
    name: 'Currency semantic annotation',
    verbose: '<span ax-currency="USD" ax-amount="1234.56">$1,234.56</span>',
    colon: '<span ax-currency="USD:1234.56">$1,234.56</span>',
    json: '<span ax-opts=\'{"currency":"USD","amount":"1234.56"}\'>$1,234.56</span>',
    cssClass: '<span class="acc-currency-USD-1234.56">$1,234.56</span>',
    expectedAriaLabel: 'one thousand two hundred thirty-four dollars and fifty-six cents',
    description: 'Currency should be spelled out in aria-label'
};

export const accxCurrencyComplexFixture = {
    name: 'Currency with context and credit',
    verbose: '<span ax-currency="EUR" ax-amount="500.00" ax-context="balance" ax-credited-to="Savings Account">€500.00</span>',
    colon: '<span ax-currency="EUR:500.00:balance:Savings Account">€500.00</span>',
    json: '<span ax-opts=\'{"currency":"EUR","amount":"500.00","context":"balance","credited_to":"Savings Account"}\'>€500.00</span>',
    cssClass: '<span class="acc-currency-EUR-500.00-balance-Savings-Account">€500.00</span>',
    expectedAriaLabel: 'five hundred euros balance (Savings Account)',
    description: 'Currency with context and account information'
};

export const accxCurrencyEdgeCaseFixture = {
    name: 'Currency with zero amount',
    verbose: '<span ax-currency="USD" ax-amount="0">$0.00</span>',
    colon: '<span ax-currency="USD:0">$0.00</span>',
    json: '<span ax-opts=\'{"currency":"USD","amount":"0"}\'>$0.00</span>',
    cssClass: '<span class="acc-currency-USD-0">$0.00</span>',
    expectedAriaLabel: 'zero dollars',
    description: 'Zero currency should be clear in aria-label'
};

export const accxLiveRegionFixtures = {
    name: 'Live region for dynamic content',
    verbose: '<div ax-live="polite" ax-atomic="true">Item added to cart</div>',
    colon: '<div ax-live="polite:true">Item added to cart</div>',
    json: '<div ax-opts=\'{"live":"polite","atomic":true}\'>Item added to cart</div>',
    cssClass: '<div class="acc-live-polite-atomic-true">Item added to cart</div>',
    expectedAttributes: { 'aria-live': 'polite', 'aria-atomic': 'true' },
    description: 'Live region should have correct ARIA attributes'
};

export const accxLiveRegionComplexFixture = {
    name: 'Alert live region with status role',
    verbose: '<div ax-live="assertive" ax-role="alert" ax-atomic="true">Error: Invalid email format</div>',
    colon: '<div ax-live="assertive:alert:true">Error: Invalid email format</div>',
    json: '<div ax-opts=\'{"live":"assertive","role":"alert","atomic":true}\'>Error: Invalid email format</div>',
    cssClass: '<div class="acc-live-assertive-alert-true">Error: Invalid email format</div>',
    expectedAttributes: { 'aria-live': 'assertive', 'role': 'alert', 'aria-atomic': 'true' },
    description: 'Alert live region should interrupt screen readers'
};

export const accxLiveRegionEdgeCaseFixture = {
    name: 'Live region with empty content',
    verbose: '<div ax-live="polite" ax-atomic="true"></div>',
    colon: '<div ax-live="polite:true"></div>',
    json: '<div ax-opts=\'{"live":"polite","atomic":true}\'></div>',
    cssClass: '<div class="acc-live-polite-atomic-true"></div>',
    expectedAttributes: { 'aria-live': 'polite', 'aria-atomic': 'true' },
    description: 'Empty live region should still be marked'
};

/**
 * Test page with all accX notation styles
 */
export function createAccXTestPage(enhancementType = 'label') {
    const fixtures = {
        label: accxLabelFixtures,
        abbreviation: accxAbbreviationFixtures,
        date: accxDateFixtures,
        time: accxTimeFixtures,
        percentage: accxPercentageFixtures,
        currency: accxCurrencyFixtures,
        liveRegion: accxLiveRegionFixtures
    };

    const fixture = fixtures[enhancementType] || fixtures.label;

    return `
        <div data-test="accx-polymorphic-notation">
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
export function createAccXPerformanceTest(count = 1000) {
    const templates = [
        '<span ax-label="Save">Save</span>',
        '<span ax-label="Save">Save</span>',
        '<span ax-opts=\'{"label":"Save"}\'>Save</span>',
        '<span class="acc-label-Save">Save</span>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        elements.push(template);
    }

    return `
        <div data-test="accx-performance" data-count="${count}">
            ${elements.join('\n')}
        </div>
    `;
}

/**
 * Priority resolution test
 */
export const accxPriorityTestFixture = {
    name: 'Priority resolution - JSON > Colon > Verbose > Class',
    description: 'JSON should take priority over other notations',
    element: '<span ax-label="Verbose" ax-opts=\'{"label":"JSON"}\' class="acc-label-Class">Content</span>',
    expectedLabel: 'JSON',
    reason: 'ax-opts (JSON) takes priority'
};

export default {
    accxLabelFixtures,
    accxLabelComplexFixture,
    accxLabelEdgeCaseFixture,
    accxAbbreviationFixtures,
    accxAbbreviationComplexFixture,
    accxAbbreviationEdgeCaseFixture,
    accxDateFixtures,
    accxDateComplexFixture,
    accxDateEdgeCaseFixture,
    accxTimeFixtures,
    accxTimeComplexFixture,
    accxTimeEdgeCaseFixture,
    accxPercentageFixtures,
    accxPercentageComplexFixture,
    accxPercentageEdgeCaseFixture,
    accxCurrencyFixtures,
    accxCurrencyComplexFixture,
    accxCurrencyEdgeCaseFixture,
    accxLiveRegionFixtures,
    accxLiveRegionComplexFixture,
    accxLiveRegionEdgeCaseFixture,
    createAccXTestPage,
    createAccXPerformanceTest,
    accxPriorityTestFixture
};
