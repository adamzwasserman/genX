/**
 * Step definitions for genx-common module
 * Shared utilities for error handling, caching, and common operations
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the genx-common module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/genx-common.js' });

    // Wait for genx-common to be available
    await this.page.waitForFunction(() => window.genxCommon !== undefined);
});

Given('the module is under {int}KB gzipped', function(sizeKB) {
    // This would require build-time checking
    return 'pending';
});

// ============================================================================
// ERROR HANDLING - GenXError
// ============================================================================

Given('I need to report a transformation error', function() {
    this.errorContext = { type: 'transformation' };
});

When('I create a GenXError with code {string} and message {string}', async function(code, message) {
    this.error = await this.page.evaluate(({c, m}) => {
        const error = new window.genxCommon.GenXError(m, c);
        return {
            name: error.name,
            message: error.message,
            code: error.code,
            timestamp: error.timestamp,
            isInstanceOfError: error instanceof Error
        };
    }, {c: code, m: message});
});

When('I include context with element id and attempted value', async function() {
    this.error = await this.page.evaluate(() => {
        const error = new window.genxCommon.GenXError(
            'Invalid format',
            'TRANSFORM_001',
            { elementId: 'test-el', attemptedValue: 'bad-value' }
        );
        return {
            name: error.name,
            code: error.code,
            context: error.context,
            timestamp: error.timestamp,
            isInstanceOfError: error instanceof Error
        };
    });
});

Then('the error should have name {string}', function(expectedName) {
    expect(this.error.name).toBe(expectedName);
});

Then('the error should have code {string}', function(expectedCode) {
    expect(this.error.code).toBe(expectedCode);
});

Then('the error should include the context object', function() {
    expect(this.error.context).toBeDefined();
    expect(typeof this.error.context).toBe('object');
});

Then('the error should have a timestamp', function() {
    expect(this.error.timestamp).toBeDefined();
});

Then('the error should be instanceof Error', function() {
    expect(this.error.isInstanceOfError).toBe(true);
});

// ============================================================================
// ERROR HANDLING - ParseError
// ============================================================================

Given('I need to parse an invalid attribute value', function() {
    this.parseContext = {};
});

When('I create a ParseError with the invalid value {string}', async function(invalidValue) {
    this.error = await this.page.evaluate((val) => {
        const error = new window.genxCommon.ParseError(`Failed to parse: ${val}`, val);
        return {
            name: error.name,
            message: error.message,
            code: error.code,
            isGenXError: error instanceof window.genxCommon.GenXError
        };
    }, invalidValue);
});

Then('the error should be instanceof GenXError', function() {
    expect(this.error.isGenXError).toBe(true);
});

Then('the error message should include {string}', function(text) {
    expect(this.error.message).toContain(text);
});

Then('the error code should start with {string}', function(prefix) {
    expect(this.error.code).toMatch(new RegExp(`^${prefix}`));
});

// ============================================================================
// ERROR HANDLING - EnhancementError
// ============================================================================

Given('I encounter a transformation failure', function() {
    this.transformContext = {};
});

When('I create an EnhancementError with element reference', async function() {
    this.error = await this.page.evaluate(() => {
        const el = document.createElement('div');
        el.id = 'test-element';
        const error = new window.genxCommon.EnhancementError('Transform failed', el);
        return {
            name: error.name,
            code: error.code,
            hasContext: !!error.context,
            hasElement: !!error.context?.element,
            isGenXError: error instanceof window.genxCommon.GenXError
        };
    });
});

Then('the error should include the element in context', function() {
    expect(this.error.hasElement).toBe(true);
});

// ============================================================================
// ERROR HANDLING - ValidationError
// ============================================================================

Given('I receive invalid configuration options', function() {
    this.invalidOptions = { invalid: true };
});

When('I create a ValidationError with the invalid options', async function() {
    this.error = await this.page.evaluate(() => {
        const opts = { strategy: 'unknown', timeout: -1 };
        const error = new window.genxCommon.ValidationError('Invalid options', opts);
        return {
            name: error.name,
            code: error.code,
            hasContext: !!error.context,
            hasOptions: !!error.context?.options,
            isGenXError: error instanceof window.genxCommon.GenXError
        };
    });
});

Then('the error should include the options in context', function() {
    expect(this.error.hasOptions).toBe(true);
});

// ============================================================================
// RESULT MONAD - Ok
// ============================================================================

Given('I have a successful operation result', function() {
    this.operationSucceeded = true;
});

When('I create Result.Ok with value {int}', async function(value) {
    this.result = await this.page.evaluate((val) => {
        const result = window.genxCommon.Result.Ok(val);
        return {
            isOk: result.isOk(),
            isErr: result.isErr(),
            unwrapped: result.unwrap(),
            unwrappedOr: result.unwrapOr(999),
            mapped: result.map(x => x * 2).unwrap(),
            // flatMapped: result.flatMap(x => window.genxCommon.Result.Ok(x + 1)).unwrap()
        };
    }, value);
});

Then('isOk should return true', function() {
    expect(this.result.isOk).toBe(true);
});

Then('isErr should return false', function() {
    expect(this.result.isErr).toBe(false);
});

Then('unwrap should return {int}', function(expected) {
    expect(this.result.unwrapped).toBe(expected);
});

Then('unwrapOr with fallback should return {int}', function(expected) {
    expect(this.result.unwrappedOr).toBe(expected);
});

Then('map with function should transform the value', function() {
    expect(this.result.mapped).toBe(84); // 42 * 2
});

Then('flatMap with function should chain computations', function() {
    // expect(this.result.flatMapped).toBe(43); // 42 + 1
    return 'pending';
});

// ============================================================================
// RESULT MONAD - Err
// ============================================================================

Given('I have a failed operation', function() {
    this.operationFailed = true;
});

When('I create Result.Err with error {string}', async function(errorMsg) {
    this.result = await this.page.evaluate((msg) => {
        const result = window.genxCommon.Result.Err(new Error(msg));
        return {
            isOk: result.isOk(),
            isErr: result.isErr(),
            unwrappedOr: result.unwrapOr(999)
        };
    }, errorMsg);
});

Then('unwrapOr should return the fallback {int}', function(fallback) {
    expect(this.result.unwrappedOr).toBe(fallback);
});

Then('map should not execute', function() {
    return 'pending';
});

Then('mapErr should transform the error', function() {
    return 'pending';
});

// ============================================================================
// CACHING
// ============================================================================

Given('the cache is empty', async function() {
    await this.page.evaluate(() => {
        if (window.genxCommon && window.genxCommon.cache) {
            window.genxCommon.cache.clear();
        }
    });
});

When('I cache value {int} with key {string}', async function(value, key) {
    await this.page.evaluate(({k, v}) => {
        window.genxCommon.cache.set(k, v);
    }, {k: key, v: value});
});

Then('cache.has\\({string}) should return true', async function(key) {
    const has = await this.page.evaluate((k) => {
        return window.genxCommon.cache.has(k);
    }, key);
    expect(has).toBe(true);
});

Then('cache.get\\({string}) should return {int}', async function(key, expected) {
    const value = await this.page.evaluate((k) => {
        return window.genxCommon.cache.get(k);
    }, key);
    expect(value).toBe(expected);
});

When('I call cache.clear\\()', async function() {
    await this.page.evaluate(() => {
        window.genxCommon.cache.clear();
    });
});

Then('cache.has\\({string}) should return false', async function(key) {
    const has = await this.page.evaluate((k) => {
        return window.genxCommon.cache.has(k);
    }, key);
    expect(has).toBe(false);
});

// ============================================================================
// LRU CACHE
// ============================================================================

Given('an LRU cache with max size {int}', async function(maxSize) {
    await this.page.evaluate((size) => {
        window._testCache = new window.genxCommon.LRUCache(size);
    }, maxSize);
});

When('I add items {int}, {int}, {int}', async function(item1, item2, item3) {
    await this.page.evaluate(({i1, i2, i3}) => {
        window._testCache.set(`key${i1}`, i1);
        window._testCache.set(`key${i2}`, i2);
        window._testCache.set(`key${i3}`, i3);
    }, {i1: item1, i2: item2, i3: item3});
});

When('I add item {int}', async function(item) {
    await this.page.evaluate((i) => {
        window._testCache.set(`key${i}`, i);
    }, item);
});

Then('item {int} should be evicted', async function(item) {
    const hasItem = await this.page.evaluate((i) => {
        return window._testCache.has(`key${i}`);
    }, item);
    expect(hasItem).toBe(false);
});

Then('items {int}, {int}, {int} should remain', async function(i1, i2, i3) {
    const results = await this.page.evaluate(({a, b, c}) => {
        return [
            window._testCache.has(`key${a}`),
            window._testCache.has(`key${b}`),
            window._testCache.has(`key${c}`)
        ];
    }, {a: i1, b: i2, c: i3});
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(true);
    expect(results[2]).toBe(true);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

When('I call debounce with function and {int}ms delay', async function(delay) {
    this.debounceDelay = delay;
    return 'pending';
});

Then('the function should not execute immediately', function() {
    return 'pending';
});

Then('the function should execute after {int}ms', async function(delay) {
    return 'pending';
});

When('I call throttle with function and {int}ms limit', async function(limit) {
    return 'pending';
});

Then('the function should execute at most once per {int}ms', async function(interval) {
    return 'pending';
});

Given('I have an object with nested properties', function() {
    return 'pending';
});

When('I call deepClone on the object', async function() {
    return 'pending';
});

Then('I should get a deep copy', function() {
    return 'pending';
});

Then('modifications should not affect the original', function() {
    return 'pending';
});

// ============================================================================
// DOM UTILITIES
// ============================================================================

Given('an element with multiple attributes', async function() {
    return 'pending';
});

When('I call parseAttributes on the element', async function() {
    return 'pending';
});

Then('I should get an object with all attribute values', function() {
    return 'pending';
});

Given('nested elements with data attributes', async function() {
    return 'pending';
});

When('I call getClosestDataAttr with {string}', async function(attrName) {
    return 'pending';
});

Then('I should get the closest parent\'s attribute value', function() {
    return 'pending';
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

When('I validate a positive number {int}', async function(num) {
    return 'pending';
});

Then('validation should pass', function() {
    return 'pending';
});

When('I validate a negative number {int}', async function(num) {
    return 'pending';
});

Then('validation should fail', function() {
    return 'pending';
});

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

When('I start a performance mark {string}', async function(markName) {
    return 'pending';
});

When('I end the performance mark', async function() {
    return 'pending';
});

Then('I should get timing data', function() {
    return 'pending';
});

Then('the duration should be recorded', function() {
    return 'pending';
});

module.exports = {};
