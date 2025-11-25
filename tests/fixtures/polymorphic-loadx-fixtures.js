/**
 * LoadX (loadX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical content loading:
 * 1. Verbose: lx-src="/api/data" lx-trigger="click" lx-cache="true"
 * 2. Colon: lx-src="/api/data:click:true"
 * 3. JSON: lx-opts='{"src":"/api/data","trigger":"click","cache":true}'
 * 4. CSS Class: class="loadx-/api/data-click-true"
 */

export const loadxBasicLoadFixtures = {
    name: 'Basic dynamic content loading',
    verbose: '<div lx-src="/api/posts">Loading...</div>',
    colon: '<div lx-src="/api/posts">Loading...</div>',
    json: '<div lx-opts=\'{"src":"/api/posts"}\'>Loading...</div>',
    cssClass: '<div class="loadx-/api/posts">Loading...</div>',
    expectedSrc: '/api/posts',
    expectedTrigger: 'load',
    expectedBehavior: 'Content should load from /api/posts on page load',
    description: 'Basic AJAX loading should work with all notations'
};

export const loadxClickTriggerFixture = {
    name: 'Loading triggered by click',
    verbose: '<button lx-src="/api/data" lx-trigger="click">Load Data</button>',
    colon: '<button lx-src="/api/data:click">Load Data</button>',
    json: '<button lx-opts=\'{"src":"/api/data","trigger":"click"}\'>Load Data</button>',
    cssClass: '<button class="loadx-/api/data-click">Load Data</button>',
    expectedSrc: '/api/data',
    expectedTrigger: 'click',
    expectedBehavior: 'Content should only load when button is clicked',
    description: 'Click trigger should delay loading until user interaction'
};

export const loadxComplexTriggerFixture = {
    name: 'Loading with multiple triggers',
    verbose: '<div lx-src="/api/feed" lx-trigger="click,scroll" lx-swap="innerHTML">Feed</div>',
    colon: '<div lx-src="/api/feed:click,scroll:innerHTML">Feed</div>',
    json: '<div lx-opts=\'{"src":"/api/feed","trigger":"click,scroll","swap":"innerHTML"}\'>Feed</div>',
    cssClass: '<div class="loadx-/api/feed-click,scroll-innerHTML">Feed</div>',
    expectedSrc: '/api/feed',
    expectedTriggers: ['click', 'scroll'],
    expectedSwap: 'innerHTML',
    expectedBehavior: 'Should load on click OR scroll events',
    description: 'Multiple triggers separated by comma'
};

export const loadxPollingFixture = {
    name: 'Polling with interval',
    verbose: '<div lx-src="/api/status" lx-trigger="poll" lx-interval="5000">Status: Unknown</div>',
    colon: '<div lx-src="/api/status:poll:5000">Status: Unknown</div>',
    json: '<div lx-opts=\'{"src":"/api/status","trigger":"poll","interval":5000}\'>Status: Unknown</div>',
    cssClass: '<div class="loadx-/api/status-poll-5000">Status: Unknown</div>',
    expectedSrc: '/api/status',
    expectedTrigger: 'poll',
    expectedInterval: 5000,
    expectedBehavior: 'Should reload every 5 seconds',
    description: 'Polling should refresh content at regular intervals'
};

export const loadxCacheFixture = {
    name: 'Caching loaded content',
    verbose: '<div lx-src="/api/user-profile" lx-cache="true">Profile</div>',
    colon: '<div lx-src="/api/user-profile::true">Profile</div>',
    json: '<div lx-opts=\'{"src":"/api/user-profile","cache":true}\'>Profile</div>',
    cssClass: '<div class="loadx-/api/user-profile--true">Profile</div>',
    expectedSrc: '/api/user-profile',
    expectedCache: true,
    expectedBehavior: 'Content should be cached after first load',
    description: 'Cached content should not refetch'
};

export const loadxCacheWithTTLFixture = {
    name: 'Cache with time-to-live',
    verbose: '<div lx-src="/api/weather" lx-cache="true" lx-cache-ttl="600000">Weather</div>',
    colon: '<div lx-src="/api/weather::true:600000">Weather</div>',
    json: '<div lx-opts=\'{"src":"/api/weather","cache":true,"cache_ttl":600000}\'>Weather</div>',
    cssClass: '<div class="loadx-/api/weather--true-600000">Weather</div>',
    expectedSrc: '/api/weather',
    expectedCache: true,
    expectedCacheTTL: 600000,
    expectedBehavior: 'Cache expires after 10 minutes',
    description: 'Cache TTL in milliseconds'
};

export const loadxRequestMethodFixture = {
    name: 'Custom HTTP method',
    verbose: '<form lx-src="/api/submit" lx-method="POST" lx-swap="outerHTML">Submit</form>',
    colon: '<form lx-src="/api/submit:POST:outerHTML">Submit</form>',
    json: '<form lx-opts=\'{"src":"/api/submit","method":"POST","swap":"outerHTML"}\'>Submit</form>',
    cssClass: '<form class="loadx-/api/submit-POST-outerHTML">Submit</form>',
    expectedSrc: '/api/submit',
    expectedMethod: 'POST',
    expectedSwap: 'outerHTML',
    expectedBehavior: 'Should use POST instead of GET',
    description: 'POST requests with form data'
};

export const loadxSwapModesFixture = {
    name: 'Different swap modes',
    verbose: '<div lx-src="/api/modal" lx-swap="beforebegin" lx-target="#modal-container">Modal</div>',
    colon: '<div lx-src="/api/modal:beforebegin:#modal-container">Modal</div>',
    json: '<div lx-opts=\'{"src":"/api/modal","swap":"beforebegin","target":"#modal-container"}\'>Modal</div>',
    cssClass: '<div class="loadx-/api/modal-beforebegin-#modal-container">Modal</div>',
    expectedSrc: '/api/modal',
    expectedSwap: 'beforebegin',
    expectedTarget: '#modal-container',
    expectedBehavior: 'Content should be inserted before target element',
    description: 'beforebegin swap mode inserts before target'
};

export const loadxIndicatorFixture = {
    name: 'Loading indicator',
    verbose: '<div lx-src="/api/data" lx-indicator="#spinner">Content</div>',
    colon: '<div lx-src="/api/data:#spinner">Content</div>',
    json: '<div lx-opts=\'{"src":"/api/data","indicator":"#spinner"}\'>Content</div>',
    cssClass: '<div class="loadx-/api/data-#spinner">Content</div>',
    expectedSrc: '/api/data',
    expectedIndicator: '#spinner',
    expectedBehavior: 'Spinner should show during loading',
    description: 'Indicator element shows loading state'
};

export const loadxErrorHandlingFixture = {
    name: 'Error handling',
    verbose: '<div lx-src="/api/data" lx-error="onLoadError">Content</div>',
    colon: '<div lx-src="/api/data:onLoadError">Content</div>',
    json: '<div lx-opts=\'{"src":"/api/data","error":"onLoadError"}\'>Content</div>',
    cssClass: '<div class="loadx-/api/data-onLoadError">Content</div>',
    expectedSrc: '/api/data',
    expectedErrorHandler: 'onLoadError',
    expectedBehavior: 'onLoadError callback should be invoked on failure',
    description: 'Error callbacks for failed requests'
};

export const loadxRetryFixture = {
    name: 'Automatic retry on failure',
    verbose: '<div lx-src="/api/data" lx-retry="3" lx-retry-delay="1000">Content</div>',
    colon: '<div lx-src="/api/data:3:1000">Content</div>',
    json: '<div lx-opts=\'{"src":"/api/data","retry":3,"retry_delay":1000}\'>Content</div>',
    cssClass: '<div class="loadx-/api/data-3-1000">Content</div>',
    expectedSrc: '/api/data',
    expectedRetries: 3,
    expectedRetryDelay: 1000,
    expectedBehavior: 'Should retry up to 3 times with 1 second delay between retries',
    description: 'Automatic retry with exponential backoff'
};

export const loadxParamsFixture = {
    name: 'Query parameters in request',
    verbose: '<div lx-src="/api/search" lx-params=\'{"q":"test","page":"1"}\'>Results</div>',
    colon: '<div lx-src="/api/search?q=test&page=1">Results</div>',
    json: '<div lx-opts=\'{"src":"/api/search","params":{"q":"test","page":"1"}}\'>Results</div>',
    cssClass: '<div class="loadx-/api/search-q-test-page-1">Results</div>',
    expectedSrc: '/api/search',
    expectedParams: { q: 'test', page: '1' },
    expectedBehavior: 'Params should be appended as query string',
    description: 'Dynamic query parameters'
};

export const loadxHeadersFixture = {
    name: 'Custom request headers',
    verbose: '<div lx-src="/api/data" lx-headers=\'{"X-Custom":"value","Authorization":"Bearer token"}\'>Data</div>',
    colon: '<div lx-src="/api/data">Data</div>',
    json: '<div lx-opts=\'{"src":"/api/data","headers":{"X-Custom":"value","Authorization":"Bearer token"}}\'>Data</div>',
    cssClass: '<div class="loadx-/api/data">Data</div>',
    expectedSrc: '/api/data',
    expectedHeaders: { 'X-Custom': 'value', 'Authorization': 'Bearer token' },
    expectedBehavior: 'Custom headers should be sent with request',
    description: 'Custom HTTP headers for authentication'
};

export const loadxHistoryFixture = {
    name: 'Push browser history',
    verbose: '<div lx-src="/api/page" lx-history="push" lx-history-url="/page-1">Page 1</div>',
    colon: '<div lx-src="/api/page::/page-1">Page 1</div>',
    json: '<div lx-opts=\'{"src":"/api/page","history":"push","history_url":"/page-1"}\'>Page 1</div>',
    cssClass: '<div class="loadx-/api/page--/page-1">Page 1</div>',
    expectedSrc: '/api/page',
    expectedHistory: 'push',
    expectedHistoryUrl: '/page-1',
    expectedBehavior: 'Browser history should be updated with /page-1',
    description: 'Push state for browser history'
};

export const loadxDependencyFixture = {
    name: 'Load with dependencies',
    verbose: '<div lx-src="/api/details" lx-depends-on="itemId" lx-indicator=".spinner">Details</div>',
    colon: '<div lx-src="/api/details:itemId:.spinner">Details</div>',
    json: '<div lx-opts=\'{"src":"/api/details","depends_on":"itemId","indicator":".spinner"}\'>Details</div>',
    cssClass: '<div class="loadx-/api/details-itemId-.spinner">Details</div>',
    expectedSrc: '/api/details',
    expectedDependency: 'itemId',
    expectedBehavior: 'Should only load when itemId changes',
    description: 'Load content when dependency changes'
};

export const loadxInvalidSrcFixture = {
    name: 'Invalid src URL',
    verbose: '<div lx-src="">Content</div>',
    colon: '<div lx-src="">Content</div>',
    json: '<div lx-opts=\'{"src":""}\'>Content</div>',
    cssClass: '<div class="loadx-">Content</div>',
    expectedSrc: '',
    expectedBehavior: 'No loading should occur',
    expectedError: true,
    description: 'Empty src should not attempt loading'
};

export const loadxRelativePathFixture = {
    name: 'Relative path resolution',
    verbose: '<div lx-src="./components/header.html">Header</div>',
    colon: '<div lx-src="./components/header.html">Header</div>',
    json: '<div lx-opts=\'{"src":"./components/header.html"}\'>Header</div>',
    cssClass: '<div class="loadx-./components/header.html">Header</div>',
    expectedSrc: './components/header.html',
    expectedResolution: 'should be resolved relative to current page',
    description: 'Relative paths should resolve correctly'
};

/**
 * Test page with all loadX notation styles
 */
export function createLoadXTestPage(loadType = 'basic') {
    const fixtures = {
        basic: loadxBasicLoadFixtures,
        click: loadxClickTriggerFixture,
        complex: loadxComplexTriggerFixture,
        polling: loadxPollingFixture,
        cache: loadxCacheFixture,
        method: loadxRequestMethodFixture,
        swap: loadxSwapModesFixture,
        indicator: loadxIndicatorFixture,
        error: loadxErrorHandlingFixture,
        retry: loadxRetryFixture,
        params: loadxParamsFixture,
        dependency: loadxDependencyFixture
    };

    const fixture = fixtures[loadType] || fixtures.basic;

    return `
        <div data-test="loadx-polymorphic-notation">
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
export function createLoadXPerformanceTest(count = 1000) {
    const templates = [
        '<div lx-src="/api/item" lx-trigger="click">Load</div>',
        '<div lx-src="/api/item:click">Load</div>',
        '<div lx-opts=\'{"src":"/api/item","trigger":"click"}\'>Load</div>',
        '<div class="loadx-/api/item-click">Load</div>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const src = `/api/item/${i}`;
        elements.push(template.replace('/api/item', src));
    }

    return `
        <div data-test="loadx-performance" data-count="${count}">
            ${elements.join('\n')}
        </div>
    `;
}

/**
 * Priority resolution test
 */
export const loadxPriorityTestFixture = {
    name: 'Priority resolution - JSON > Colon > Verbose > Class',
    description: 'JSON should take priority over other notations',
    element: '<div lx-src="/api/verbose" lx-opts=\'{"src":"/api/json"}\' class="loadx-/api/class">Content</div>',
    expectedSrc: '/api/json',
    reason: 'lx-opts (JSON) takes priority'
};

export default {
    loadxBasicLoadFixtures,
    loadxClickTriggerFixture,
    loadxComplexTriggerFixture,
    loadxPollingFixture,
    loadxCacheFixture,
    loadxCacheWithTTLFixture,
    loadxRequestMethodFixture,
    loadxSwapModesFixture,
    loadxIndicatorFixture,
    loadxErrorHandlingFixture,
    loadxRetryFixture,
    loadxParamsFixture,
    loadxHeadersFixture,
    loadxHistoryFixture,
    loadxDependencyFixture,
    loadxInvalidSrcFixture,
    loadxRelativePathFixture,
    createLoadXTestPage,
    createLoadXPerformanceTest,
    loadxPriorityTestFixture
};
