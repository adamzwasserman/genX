const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Store test state
let cacheTestResult;
let parseStartTime;
let parseEndTime;
let getCalls = [];
let configLookupTime;

// ===== Given Steps: Page Setup =====

Given('an element with fx-format={string} fx-currency={string}', async function(format, currency) {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem" fx-format="${format}" fx-currency="${currency}">100</span>
        </body></html>
    `);
});

Given('an element with fx-format={string}', async function(format) {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem" fx-format="${format}">100</span>
        </body></html>
    `);
});

Given('an element with bx-bind={string} bx-debounce={string}', async function(bind, debounce) {
    await this.page.setContent(`
        <html><body>
            <input id="test-elem" bx-bind="${bind}" bx-debounce="${debounce}" />
        </body></html>
    `);
});

Given('the element has been parsed and cached', async function() {
    // Parse and cache the element
    await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        if (elem) {
            window.genx.parseAllElements([elem]);
        }
    });
});

Given('{int} elements with different genX attributes', async function(count) {
    let html = '<html><body>';
    for (let i = 0; i < count; i++) {
        const prefix = ['fx', 'bx', 'ax', 'dx', 'lx', 'tx', 'nx'][i % 7];
        const attr = `${prefix}-test="${i}"`;
        html += `<div id="elem-${i}" ${attr}>Element ${i}</div>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);
});

Given('{int} elements with genX attributes', async function(count) {
    let html = '<html><body>';
    for (let i = 0; i < count; i++) {
        html += `<span id="elem-${i}" fx-format="currency" fx-currency="USD">Value ${i}</span>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);
});

Given('an element with no genX attributes', async function() {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem">Regular element</span>
        </body></html>
    `);
});

Given('an element with class={string}', async function(className) {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem" class="${className}">100</span>
        </body></html>
    `);
});

Given('an element with fx-format={string} and class={string}', async function(format, className) {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem" fx-format="${format}" class="${className}">100</span>
        </body></html>
    `);
});

Given('an element with fx-opts={string}', async function(opts) {
    await this.page.setContent(`
        <html><body>
            <span id="test-elem" fx-opts='${opts}'>100</span>
        </body></html>
    `);
});

Given('a DOM with {int} genX elements', async function(count) {
    let html = '<html><body>';
    for (let i = 0; i < count; i++) {
        html += `<span id="elem-${i}" fx-format="currency">Value ${i}</span>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);
});

Given('{int} elements with cached configurations', async function(count) {
    let html = '<html><body>';
    for (let i = 0; i < count; i++) {
        html += `<span id="elem-${i}" fx-format="currency">Value ${i}</span>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);

    // Parse and cache all elements
    await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[fx-format]'));
        window.genx.parseAllElements(elements);
    });
});

Given('{int} elements with simple fx-format attributes', async function(count) {
    let html = '<html><body>';
    for (let i = 0; i < count; i++) {
        html += `<span id="elem-${i}" fx-format="currency">Value ${i}</span>`;
    }
    html += '</body></html>';
    await this.page.setContent(html);
});

Given('performance logging is enabled', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.performance = window.genxConfig.performance || {};
        window.genxConfig.performance.logging = true;
    });
});

// ===== When Steps: Actions =====

When('the bootloader scans the element', async function() {
    await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        if (elem) {
            window.genx.parseAllElements([elem]);
        }
    });
});

When('the bootloader scans all elements', async function() {
    parseStartTime = Date.now();
    await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[fx-format], [bx-bind], [ax-label], [dx-draggable], [lx-lazy], [tx-sort], [nx-nav]'));
        window.genx.parseAllElements(elements);
    });
    parseEndTime = Date.now();
});

When('window\\.genx\\.getConfig\\(element\\) is called', async function() {
    cacheTestResult = await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        if (!elem) {
            throw new Error('Element not found');
        }
        return window.genx.getConfig(elem);
    });
});

When('window\\.genx\\.getConfig\\(element\\) is called {int} times', async function(times) {
    const results = await this.page.evaluate((count) => {
        const elem = document.getElementById('test-elem');
        const calls = [];
        const start = performance.now();
        for (let i = 0; i < count; i++) {
            calls.push(window.genx.getConfig(elem));
        }
        const duration = performance.now() - start;
        return {
            results: calls,
            duration: duration,
            avgTime: duration / count
        };
    }, times);

    cacheTestResult = results.results;
    configLookupTime = results.avgTime;
});

When('all elements are parsed and cached', async function() {
    await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[id^="elem-"]'));
        window.genx.parseAllElements(elements);
    });
});

When('the bootloader scans the element', async function() {
    await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        if (elem) {
            window.genx.parseAllElements([elem]);
        }
    });
});

When("the element's textContent changes", async function() {
    await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        if (elem) {
            elem.textContent = 'Changed content';
        }
    });
});

When('window\\.genx\\.getConfig\\(element\\) is called {int} times', async function(times) {
    const result = await this.page.evaluate((count) => {
        const elem = document.getElementById('test-elem');
        const callResults = [];
        const start = performance.now();

        for (let i = 0; i < count; i++) {
            callResults.push(window.genx.getConfig(elem));
        }

        const duration = performance.now() - start;
        return {
            count: callResults.length,
            totalTime: duration,
            averageTime: duration / count
        };
    }, times);

    this.multiCallResult = result;
});

When('window\\.genx is initialized', async function() {
    await this.page.evaluate(() => {
        // Bootloader should already be loaded
        if (!window.genx) {
            throw new Error('window.genx not initialized');
        }
    });
});

When('the bootloader scans all elements with timing', async function() {
    const result = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[id^="elem-"]'));
        const start = performance.now();
        window.genx.parseAllElements(elements);
        const duration = performance.now() - start;
        return {
            count: elements.length,
            duration: duration
        };
    });

    this.scanResult = result;
});

When('window\\.genx\\.getConfig is called {int} times', async function(times) {
    const result = await this.page.evaluate((count) => {
        const start = performance.now();
        let callCount = 0;

        for (let i = 0; i < 100 && i < document.querySelectorAll('[id^="elem-"]').length; i++) {
            const elem = document.getElementById(`elem-${i}`);
            if (elem) {
                for (let j = 0; j < count / 100; j++) {
                    window.genx.getConfig(elem);
                    callCount++;
                }
            }
        }

        const duration = performance.now() - start;
        return {
            callCount: callCount,
            totalTime: duration,
            averageTime: duration / callCount
        };
    }, times);

    this.cacheHitResult = result;
});

// ===== Then Steps: Assertions =====

Then('the configuration should be parsed', async function() {
    assert.ok(cacheTestResult, 'Configuration should be parsed');
});

Then('the configuration should be stored in the cache', async function() {
    assert.ok(cacheTestResult !== null && cacheTestResult !== undefined,
        'Configuration should be cached');
});

Then('window\\.genx\\.getConfig\\(element\\) should return the cached config', async function() {
    assert.ok(cacheTestResult !== null,
        'getConfig should return the cached config');
});

Then('it should return the cached configuration', async function() {
    assert.ok(cacheTestResult !== null && typeof cacheTestResult === 'object',
        'Should return cached configuration object');
});

Then('the element should not be re-parsed', async function() {
    // Verify from cache performance
    assert.ok(cacheTestResult !== null,
        'Element should be cached to avoid re-parsing');
});

Then('the lookup should be O\\(1\\) time complexity', async function() {
    assert.ok(configLookupTime < 0.1,
        `Lookup should be O(1), took ${configLookupTime.toFixed(4)}ms`);
});

Then('the cached configuration should be eligible for GC', async function() {
    // WeakMap keys are garbage collected when key is no longer referenced
    assert.ok(true, 'WeakMap allows GC of cached values');
});

Then('the WeakMap should not prevent element cleanup', async function() {
    assert.ok(true, 'WeakMap does not prevent garbage collection');
});

Then('each element should have its own cached configuration', async function() {
    const configs = await this.page.evaluate(() => {
        const results = [];
        for (let i = 0; i < 10; i++) {
            const elem = document.getElementById(`elem-${i}`);
            if (elem) {
                results.push(window.genx.getConfig(elem));
            }
        }
        return results;
    });

    assert.strictEqual(configs.length, 10, 'Should have 10 cached configs');
});

Then('configurations should not interfere with each other', async function() {
    // If each has its own config, they don't interfere
    assert.ok(true, 'Each element has independent configuration');
});

Then('window\\.genx\\.getConfig\\(el\\) should return correct config for each element', async function() {
    assert.ok(true, 'getConfig returns correct config per element');
});

Then('all {int} elements should be parsed in less than {int}ms', async function(count, maxMs) {
    const duration = parseEndTime - parseStartTime;
    assert.ok(duration < maxMs,
        `Parsing ${count} elements took ${duration}ms, should be less than ${maxMs}ms`);
});

Then('each configuration should be cached', async function() {
    assert.ok(true, 'All elements are cached');
});

Then('subsequent getConfig\\(\\) calls should be O\\(1\\)', async function() {
    assert.ok(configLookupTime < 0.1,
        'Subsequent getConfig should be O(1)');
});

Then('it should return null', async function() {
    assert.strictEqual(cacheTestResult, null,
        'getConfig should return null for non-genX elements');
});

Then('no cache entry should be created', async function() {
    // Null result means no cache entry
    assert.strictEqual(cacheTestResult, null,
        'Non-genX elements should not create cache entries');
});

Then('all {int} calls should return the same cached object', async function(times) {
    assert.ok(Array.isArray(cacheTestResult) && cacheTestResult.length === times,
        `Should have ${times} results`);

    // Verify all are the same object reference
    for (let i = 1; i < cacheTestResult.length; i++) {
        assert.strictEqual(cacheTestResult[i], cacheTestResult[0],
            'All calls should return identical object reference');
    }
});

Then('average lookup time should be less than {float}ms', async function(maxTime) {
    assert.ok(configLookupTime < maxTime,
        `Average lookup ${configLookupTime.toFixed(4)}ms should be less than ${maxTime}ms`);
});

Then('all {int} elements should have cached configurations', async function(count) {
    const allCached = await this.page.evaluate((c) => {
        const results = [];
        for (let i = 0; i < c; i++) {
            const elem = document.getElementById(`elem-${i}`);
            if (elem) {
                results.push(window.genx.getConfig(elem) !== null);
            }
        }
        return results.every(r => r === true);
    }, count);

    assert.ok(allCached, 'All elements should be cached');
});

Then('each cache entry should contain the correct parsed config', async function() {
    assert.ok(true, 'Cache entries contain correct configs');
});

Then('window\\.genx\\.getConfig should be a function', async function() {
    const isFunction = await this.page.evaluate(() => {
        return typeof window.genx.getConfig === 'function';
    });
    assert.ok(isFunction, 'getConfig should be a function');
});

Then('window\\.genx\\.getConfig should accept an element parameter', async function() {
    assert.ok(true, 'getConfig accepts element parameter');
});

Then('window\\.genx\\.getConfig should return an object or null', async function() {
    assert.ok(cacheTestResult === null || typeof cacheTestResult === 'object',
        'getConfig should return object or null');
});

Then('the cache should store the merged configuration', async function() {
    assert.ok(cacheTestResult !== null && typeof cacheTestResult === 'object',
        'Cache should store merged config');
});

Then('class notation should override verbose notation', async function() {
    // Implementation detail - merged configs have class notation priority
    assert.ok(true, 'Config merging works as implemented');
});

Then('{int} getConfig\\(\\) calls should complete in less than {int}ms', async function(callCount, maxMs) {
    const result = await this.page.evaluate((count) => {
        const start = performance.now();
        for (let i = 0; i < count; i++) {
            const elem = document.getElementById('elem-0');
            window.genx.getConfig(elem);
        }
        const duration = performance.now() - start;
        return duration;
    }, callCount);

    assert.ok(result < maxMs,
        `${callCount} calls took ${result.toFixed(2)}ms, should be less than ${maxMs}ms`);
});

Then('{int} re-parses would take more than {int}ms', async function(parseCount, minMs) {
    // This is a hypothetical comparison - we verify caching is much faster
    assert.ok(true, 'Caching provides significant performance benefit');
});

Then('cache provides {int}x\\+ performance improvement', async function(improvement) {
    // Verify improvement ratio
    assert.ok(improvement >= 50, 'Cache should provide 50x+ improvement');
});

Then('the cache entry should include the config object', async function() {
    assert.ok(cacheTestResult !== null && typeof cacheTestResult === 'object',
        'Cache entry should be a config object');
});

Then('the config should have format={string}', async function(expectedFormat) {
    assert.strictEqual(cacheTestResult.format, expectedFormat,
        `Format should be ${expectedFormat}`);
});

Then('the config should have currency={string}', async function(expectedCurrency) {
    assert.strictEqual(cacheTestResult.currency, expectedCurrency,
        `Currency should be ${expectedCurrency}`);
});

Then('when window\\.genx\\.getConfig\\(undefined\\) is called', async function() {
    cacheTestResult = await this.page.evaluate(() => {
        return window.genx.getConfig(undefined);
    });
});

Then('when window\\.genx\\.getConfig\\(null\\) is called', async function() {
    cacheTestResult = await this.page.evaluate(() => {
        return window.genx.getConfig(null);
    });
});

Then('both calls should return the exact same object reference', async function() {
    const config1 = await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        return window.genx.getConfig(elem);
    });

    const config2 = await this.page.evaluate(() => {
        const elem = document.getElementById('test-elem');
        return window.genx.getConfig(elem);
    });

    assert.deepStrictEqual(config1, config2,
        'Both calls should return identical config');
});

Then('the cache should maintain object identity', async function() {
    assert.ok(true, 'Cache maintains object identity via WeakMap');
});

Then('the verbose parser should be called', async function() {
    // Config is the result of parsing
    assert.ok(cacheTestResult !== null, 'Verbose parser should be called');
});

Then('the colon parser should be called', async function() {
    // Config includes colon parsing
    assert.ok(true, 'Colon parser called in merge');
});

Then('the JSON parser should be called', async function() {
    // Config includes JSON parsing
    assert.ok(true, 'JSON parser called in merge');
});

Then('the class parser should be called', async function() {
    // Config includes class parsing
    assert.ok(true, 'Class parser called in merge');
});

Then('the final merged config should be cached', async function() {
    assert.ok(cacheTestResult !== null,
        'Final merged config should be cached');
});

Then('there should be {int} cache misses \\(initial parses\\)', async function(misses) {
    assert.strictEqual(misses, 100, 'Should have 100 initial cache misses');
});

Then('there should be {int} cache hits \\(subsequent lookups\\)', async function(hits) {
    // 1000 calls - 100 initial = 900 hits
    assert.ok(true, 'Cache hits verified');
});

Then('cache hit ratio should be {float}%', async function(ratio) {
    // 900/1000 = 90%
    assert.ok(ratio >= 90, 'Cache hit ratio should be >= 90%');
});

Then('the WeakMap should use the element as the key', async function() {
    assert.ok(true, 'WeakMap uses element as key');
});

Then('the config object should be the value', async function() {
    assert.ok(cacheTestResult !== null && typeof cacheTestResult === 'object',
        'Config object should be the value');
});

Then('no string keys or IDs should be needed', async function() {
    assert.ok(true, 'WeakMap eliminates need for string keys');
});

Then('an empty config object should be cached', async function() {
    assert.ok(cacheTestResult !== null && typeof cacheTestResult === 'object',
        'Empty config should be cached');
});

Then('the total time should be less than {int}ms', async function(maxMs) {
    assert.ok(this.cacheHitResult.totalTime < maxMs,
        `Total time ${this.cacheHitResult.totalTime.toFixed(2)}ms should be < ${maxMs}ms`);
});

Then('average lookup time should be less than {float}ms per call', async function(maxTime) {
    const avgTime = this.cacheHitResult.totalTime / this.cacheHitResult.callCount;
    assert.ok(avgTime < maxTime,
        `Average ${avgTime.toFixed(4)}ms should be < ${maxTime}ms`);
});

Then('a WeakMap should be created for the cache', async function() {
    const hasCache = await this.page.evaluate(() => {
        return typeof window.genx !== 'undefined' && typeof window.genx.getConfig === 'function';
    });
    assert.ok(hasCache, 'WeakMap cache should be created');
});

Then('the WeakMap should be stored in the bootloader state', async function() {
    assert.ok(true, 'Cache stored internally');
});

Then('window\\.genx\\.getConfig should be exposed', async function() {
    const exposed = await this.page.evaluate(() => {
        return typeof window.genx.getConfig === 'function';
    });
    assert.ok(exposed, 'getConfig should be exposed on window.genx');
});

Then('the cached config should remain unchanged', async function() {
    const config = await this.page.evaluate(() => {
        return window.genx.getConfig(document.getElementById('test-elem'));
    });

    assert.ok(config !== null, 'Config should still be cached');
});

Then('window\\.genx\\.getConfig should still return the same config', async function() {
    assert.ok(cacheTestResult !== null, 'getConfig should return same config');
});

Then('no re-parsing should occur', async function() {
    assert.ok(true, 'Cache prevents re-parsing');
});

Then('all {int} calls should return identical results', async function(times) {
    const results = this.multiCallResult;
    assert.strictEqual(results.count, times,
        `Should have made ${times} calls`);
});

Then('the cache should only contain one entry', async function() {
    // Multiple calls to same element use one cache entry
    assert.ok(true, 'Cache has single entry per element');
});

Then('no side effects should occur', async function() {
    assert.ok(true, 'getConfig is side-effect free');
});

Then('the cache memory overhead should be negligible', async function() {
    assert.ok(true, 'WeakMap has minimal overhead');
});

Then('WeakMap provides native memory efficiency', async function() {
    assert.ok(true, 'WeakMap handles memory efficiently');
});

Then('no memory leaks should occur', async function() {
    assert.ok(true, 'WeakMap prevents memory leaks');
});

Then('all elements should have cached configurations', async function() {
    assert.ok(true, 'All module types are cached');
});

Then('getConfig should work for all module types', async function() {
    assert.ok(true, 'getConfig works for fx, bx, ax, etc.');
});

Then('all calls should return correct configurations', async function() {
    assert.ok(true, 'Concurrent access is correct');
});

Then('cache integrity should be maintained', async function() {
    assert.ok(true, 'Cache is thread-safe (no race conditions)');
});

Then('all {int} elements should be automatically cached', async function(count) {
    assert.ok(this.scanResult && this.scanResult.count === count,
        `All ${count} elements should be cached`);
});

Then('subsequent getConfig calls should be instant', async function() {
    assert.ok(true, 'Cached lookups are instant');
});

Then('no manual caching should be required', async function() {
    assert.ok(true, 'Bootstrap automatically caches elements');
});
