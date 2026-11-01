/**
 * Step definitions for genx-common module
 * Shared utilities for error handling, caching, and common operations.
 *
 * Browser API (src/genx-common.js): window.genxCommon.{errors, Result,
 * CircuitBreaker, createCircuitBreaker, cache, utils, notation}.
 * Error constructors take (code, message, context).
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const COMMON_SRC = path.resolve(__dirname, '../../src/genx-common.js');

const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');

async function loadCommon(page) {
    await page.goto('about:blank');
    await page.addScriptTag({ path: './src/genx-common.js' });
    await page.waitForFunction(() => window.genxCommon !== undefined);
}

// Wrap shared utilities and the notation parser with call recorders so the
// integration scenarios can prove a module really calls into genx-common.
async function installSpies(page) {
    await page.evaluate(() => {
        const gc = window.genxCommon;
        window.__utilCalls = { kebabToCamel: [], safeJsonParse: [], generateId: [] };
        for (const name of Object.keys(window.__utilCalls)) {
            const orig = gc.utils[name];
            gc.utils[name] = function(...args) {
                window.__utilCalls[name].push(args);
                return orig.apply(this, args);
            };
        }
        window.__notationCalls = [];
        const parse = gc.notation.parseNotation;
        gc.notation.parseNotation = (el, prefix) => {
            window.__notationCalls.push(prefix);
            return parse(el, prefix);
        };
    });
}

// Serialize an error created in the page
const describeError = (error) => {
    const gc = window.genxCommon.errors;
    return {
        name: error.name,
        message: error.message,
        code: error.code,
        context: error.context,
        hasElement: error.context?.element instanceof Element,
        timestamp: error.timestamp,
        instanceOf: Object.keys(gc).filter(k => error instanceof gc[k])
    };
};

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the genx-common module is loaded', async function() {
    await loadCommon(this.page);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

Given('I need to report a transformation error', async function() {
    const ok = await this.page.evaluate(() => typeof window.genxCommon.errors.GenXError === 'function');
    expect(ok).toBe(true);
});

When('I create a GenXError with code {string} and message {string}', async function(code, message) {
    this.errorArgs = { code, message };
    this.error = await this.page.evaluate(({ c, m, describe }) => {
        const fn = new Function('return ' + describe)();
        return fn(new window.genxCommon.errors.GenXError(c, m));
    }, { c: code, m: message, describe: describeError.toString() });
});

When('I include context with element id and attempted value', async function() {
    const { code, message } = this.errorArgs;
    this.error = await this.page.evaluate(({ c, m, describe }) => {
        const fn = new Function('return ' + describe)();
        return fn(new window.genxCommon.errors.GenXError(c, m,
            { elementId: 'price-1', attemptedValue: 'abc' }));
    }, { c: code, m: message, describe: describeError.toString() });
    expect(this.error.message).toBe(message);
});

Then('the error should have name {string}', function(expectedName) {
    expect(this.error.name).toBe(expectedName);
});

Then('the error should have code {string}', function(expectedCode) {
    expect(this.error.code).toBe(expectedCode);
});

Then('the error should include the context object', function() {
    expect(this.error.context).toEqual({ elementId: 'price-1', attemptedValue: 'abc' });
});

Then('the error should have a timestamp', function() {
    expect(typeof this.error.timestamp).toBe('number');
    expect(Math.abs(Date.now() - this.error.timestamp)).toBeLessThan(60000);
});

// "type" is the error family: every genX error is an instance of that class
Then('the error should have type {string}', function(type) {
    expect(this.error.instanceOf).toContain(type);
});

Given('I need to parse an invalid attribute value', async function() {
    const ok = await this.page.evaluate(() => typeof window.genxCommon.errors.ParseError === 'function');
    expect(ok).toBe(true);
});

When('I create a ParseError with the invalid value {string}', async function(invalidValue) {
    this.error = await this.page.evaluate(({ val, describe }) => {
        const fn = new Function('return ' + describe)();
        return fn(new window.genxCommon.errors.ParseError('PARSE_001',
            `Invalid attribute value: ${val}`, { value: val }));
    }, { val: invalidValue, describe: describeError.toString() });
    expect(this.error.name).toBe('ParseError');
});

Then('the error message should include {string}', function(text) {
    expect(this.error.message).toContain(text);
});

Then('the error code should start with {string}', function(prefix) {
    expect(String(this.error.code).startsWith(prefix)).toBe(true);
});

Given('I encounter a transformation failure', async function() {
    const ok = await this.page.evaluate(() => typeof window.genxCommon.errors.EnhancementError === 'function');
    expect(ok).toBe(true);
});

When('I create an EnhancementError with element reference', async function() {
    this.error = await this.page.evaluate(({ describe }) => {
        const fn = new Function('return ' + describe)();
        const el = document.createElement('div');
        el.id = 'test-element';
        return fn(new window.genxCommon.errors.EnhancementError('ENHANCE_001',
            'Transform failed', { element: el }));
    }, { describe: describeError.toString() });
    expect(this.error.name).toBe('EnhancementError');
});

Then('the error should include the element in context', function() {
    expect(this.error.hasElement).toBe(true);
});

Given('I receive invalid configuration options', function() {
    this.invalidOptions = { strategy: 'unknown', timeout: -1 };
});

When('I create a ValidationError with the invalid options', async function() {
    this.error = await this.page.evaluate(({ opts, describe }) => {
        const fn = new Function('return ' + describe)();
        return fn(new window.genxCommon.errors.ValidationError('VALIDATE_001',
            'Invalid options', { options: opts }));
    }, { opts: this.invalidOptions, describe: describeError.toString() });
    expect(this.error.name).toBe('ValidationError');
});

Then('the error should include the options in context', function() {
    expect(this.error.context.options).toEqual(this.invalidOptions);
});

// ============================================================================
// RESULT MONAD
// ============================================================================

Given('I have a successful operation result', async function() {
    expect(await this.page.evaluate(() => typeof window.genxCommon.Result.Ok)).toBe('function');
});

When('I create Result.Ok with value {int}', async function(value) {
    this.result = await this.page.evaluate((val) => {
        const { Ok } = window.genxCommon.Result;
        const result = Ok(val);
        const chained = result.flatMap(x => Ok(x + 1));
        return {
            isOk: result.isOk(),
            isErr: result.isErr(),
            unwrapped: result.unwrap(),
            unwrappedOr: result.unwrapOr(999),
            mapped: result.map(x => x * 2).unwrap(),
            flatMappedOk: chained.isOk(),
            flatMapped: chained.unwrap()
        };
    }, value);
    this.okValue = value;
});

Then('isOk should return true', function() {
    expect(this.result.isOk).toBe(true);
});

Then('isOk should return false', function() {
    expect(this.result.isOk).toBe(false);
});

Then('isErr should return false', function() {
    expect(this.result.isErr).toBe(false);
});

Then('isErr should return true', function() {
    expect(this.result.isErr).toBe(true);
});

Then('unwrap should return {int}', function(expected) {
    expect(this.result.unwrapped).toBe(expected);
});

Then('unwrapOr with fallback should return {int}', function(expected) {
    expect(this.result.unwrappedOr).toBe(expected);
});

Then('map with function should transform the value', function() {
    expect(this.result.mapped).toBe(this.okValue * 2);
});

Then('flatMap with function should chain computations', function() {
    expect(this.result.flatMappedOk).toBe(true);
    expect(this.result.flatMapped).toBe(this.okValue + 1);
});

Given('I have a failed operation result', async function() {
    expect(await this.page.evaluate(() => typeof window.genxCommon.Result.Err)).toBe('function');
});

When('I create Result.Err with error {string}', async function(errorMsg) {
    this.errMsg = errorMsg;
    this.result = await this.page.evaluate((msg) => {
        const { Ok, Err } = window.genxCommon.Result;
        const result = Err(msg);
        let thrown = null;
        try {
            result.unwrap();
        } catch (e) {
            thrown = e.message;
        }
        let mapCalls = 0;
        let flatMapCalls = 0;
        const mapped = result.map(x => { mapCalls++; return x; });
        const chained = result.flatMap(x => { flatMapCalls++; return Ok(x); });
        return {
            isOk: result.isOk(),
            isErr: result.isErr(),
            thrown,
            unwrappedOr: result.unwrapOr('fallback'),
            mapCalls,
            mappedIsErr: mapped.isErr(),
            flatMapCalls,
            chainedIsErr: chained.isErr()
        };
    }, errorMsg);
});

Then('unwrap should throw the error', function() {
    expect(this.result.thrown).toBe(this.errMsg);
});

Then('unwrapOr with fallback should return the fallback', function() {
    expect(this.result.unwrappedOr).toBe('fallback');
});

Then('map with function should not transform', function() {
    expect(this.result.mapCalls).toBe(0);
    expect(this.result.mappedIsErr).toBe(true);
});

Then('flatMap with function should not chain', function() {
    expect(this.result.flatMapCalls).toBe(0);
    expect(this.result.chainedIsErr).toBe(true);
});

Given('I have a chain of operations', function() {
    this.chainSteps = ['ok', 'err:first failure', 'spy', 'err:second failure', 'spy'];
});

When('one operation returns Result.Err', async function() {
    this.chain = await this.page.evaluate((steps) => {
        const { Ok, Err } = window.genxCommon.Result;
        let skipped = 0;
        let r = Ok(1);
        for (const s of steps) {
            r = r.flatMap(x => {
                if (s === 'ok') {
                    return Ok(x + 1);
                }
                if (s.startsWith('err:')) {
                    return Err(s.slice(4));
                }
                return Ok(x);
            });
        }
        // Count how many functions after the first Err actually ran
        let ran = 0;
        r = Ok(1).flatMap(() => Err('first failure'));
        for (let i = 0; i < 3; i++) {
            r = r.flatMap(() => { ran++; return Err('later failure'); });
        }
        skipped = 3 - ran;
        let message = null;
        try {
            r.unwrap();
        } catch (e) {
            message = e.message;
        }
        return { ran, skipped, isErr: r.isErr(), message };
    }, this.chainSteps);
});

Then('all subsequent flatMap operations should be skipped', function() {
    expect(this.chain.ran).toBe(0);
    expect(this.chain.skipped).toBe(3);
});

Then('the final result should be the first error', function() {
    expect(this.chain.isErr).toBe(true);
    expect(this.chain.message).toBe('first failure');
});

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

const cbState = (page) => page.evaluate(() => {
    const cb = window.__cb;
    return {
        state: cb.getState(),
        failureCount: cb.failureCount,
        successCount: cb.successCount,
        lastFailureTime: cb.lastFailureTime,
        timeout: cb.timeout
    };
});

Given('I create a circuit breaker with threshold {int}', async function(threshold) {
    await this.page.evaluate((t) => {
        window.__cb = new window.genxCommon.CircuitBreaker(t);
    }, threshold);
});

Given('I create a circuit breaker with threshold {int} and timeout {int}ms', async function(threshold, timeout) {
    await this.page.evaluate(({ t, ms }) => {
        window.__cb = new window.genxCommon.CircuitBreaker(t, ms);
    }, { t: threshold, ms: timeout });
});

Given('the circuit breaker is in CLOSED state', async function() {
    expect((await cbState(this.page)).state).toBe('CLOSED');
});

Given('the circuit breaker is in OPEN state', async function() {
    await this.page.evaluate(() => {
        const cb = window.__cb;
        for (let i = 0; i < cb.threshold; i++) {
            try {
                cb.execute(() => { throw new Error('boom'); });
            } catch { /* expected */ }
        }
    });
    expect((await cbState(this.page)).state).toBe('OPEN');
});

Given('a circuit breaker in HALF_OPEN state', async function() {
    await this.page.evaluate(() => {
        const cb = new window.genxCommon.CircuitBreaker(1, 50);
        try {
            cb.execute(() => { throw new Error('boom'); });
        } catch { /* expected */ }
        window.__cb = cb;
    });
    expect((await cbState(this.page)).state).toBe('OPEN');
    await this.page.waitForTimeout(120);
    expect((await cbState(this.page)).state).toBe('HALF_OPEN');
});

When('I execute a successful operation', async function() {
    this.cbBefore = await cbState(this.page);
    this.cbReturn = await this.page.evaluate(() => window.__cb.execute(() => 'ok'));
    expect(this.cbReturn).toBe('ok');
});

When('I execute a failed operation', async function() {
    this.cbBefore = await cbState(this.page);
    this.cbFailStart = await this.page.evaluate(() => Date.now());
    this.cbThrown = await this.page.evaluate(() => {
        try {
            window.__cb.execute(() => { throw new Error('operation failed'); });
            return null;
        } catch (e) {
            return e.message;
        }
    });
    expect(this.cbThrown).toBe('operation failed');
});

When('I execute {int} failed operations', async function(count) {
    this.cbThrownAll = await this.page.evaluate((n) => {
        const msgs = [];
        for (let i = 0; i < n; i++) {
            try {
                window.__cb.execute(() => { throw new Error('operation failed'); });
            } catch (e) {
                msgs.push(e.message);
            }
        }
        return msgs;
    }, count);
    expect(this.cbThrownAll).toEqual(Array(count).fill('operation failed'));
});

When('I wait for the timeout period', async function() {
    const { timeout } = await cbState(this.page);
    await this.page.waitForTimeout(timeout + 100);
});

Then('the circuit breaker should remain {word}', async function(state) {
    expect((await cbState(this.page)).state).toBe(state);
});

Then('the circuit breaker should transition to {word}', async function(state) {
    expect((await cbState(this.page)).state).toBe(state);
});

Then('the circuit breaker should transition back to {word}', async function(state) {
    expect(this.cbBefore.state).toBe('HALF_OPEN');
    expect((await cbState(this.page)).state).toBe(state);
});

Then('the success count should increment', async function() {
    expect((await cbState(this.page)).successCount).toBe(this.cbBefore.successCount + 1);
});

Then('subsequent operations should fail immediately', async function() {
    this.cbOpenResult = await this.page.evaluate(() => {
        let called = false;
        try {
            window.__cb.execute(() => { called = true; return 'ran'; });
            return { called, message: null };
        } catch (e) {
            return { called, message: e.message };
        }
    });
    expect(this.cbOpenResult.called).toBe(false);
    expect(this.cbOpenResult.message).not.toBeNull();
});

Then('the failure message should indicate circuit is open', function() {
    expect(this.cbOpenResult.message).toMatch(/circuit.*open/i);
});

Then('the next operation should be attempted', async function() {
    const called = await this.page.evaluate(() => {
        let ran = false;
        window.__cb.execute(() => { ran = true; });
        return ran;
    });
    expect(called).toBe(true);
});

Then('the failure count should reset to {int}', async function(n) {
    expect((await cbState(this.page)).failureCount).toBe(n);
});

Then('the timeout period should restart', async function() {
    const s = await cbState(this.page);
    expect(s.lastFailureTime).toBeGreaterThanOrEqual(this.cbFailStart);
    // Still OPEN right after the failure: the HALF_OPEN window starts over
    expect(s.state).toBe('OPEN');
});

// ============================================================================
// CACHE
// ============================================================================

Given('I create a three-level cache', async function() {
    await this.page.evaluate(() => {
        window.__cache = window.genxCommon.cache.createCache();
    });
});

Given('I create a three-level cache with max size {int}', async function(maxSize) {
    this.cacheMax = maxSize;
    await this.page.evaluate((n) => {
        window.__cache = window.genxCommon.cache.createCache({ maxSize: n });
    }, maxSize);
});

When('I cache a value with an object key', async function() {
    await this.page.evaluate(() => {
        window.__cacheKey = document.createElement('div');
        window.__cache.set(window.__cacheKey, 'element-value');
    });
});

Then('the value should be stored in L1 WeakMap cache', async function() {
    const r = await this.page.evaluate(() => {
        const c = window.__cache;
        return {
            isWeakMap: c.l1 instanceof WeakMap,
            inL1: c.l1.has(window.__cacheKey),
            l2: c.l2.size,
            l3: c.l3.size,
            value: c.get(window.__cacheKey)
        };
    });
    expect(r).toEqual({ isWeakMap: true, inL1: true, l2: 0, l3: 0, value: 'element-value' });
});

Then('garbage collection should not be prevented', async function() {
    // Object keys live only in the WeakMap, which holds them weakly; no strong
    // reference is kept in the Map-based levels.
    const r = await this.page.evaluate(() => {
        const c = window.__cache;
        const strongRefs = [...c.l2.keys(), ...c.l3.keys()].filter(k => typeof k === 'object');
        return { isWeakMap: c.l1 instanceof WeakMap, strongRefs: strongRefs.length, size: c.size() };
    });
    expect(r).toEqual({ isWeakMap: true, strongRefs: 0, size: 0 });
});

When('I cache a value with a string key', async function() {
    await this.page.evaluate(() => window.__cache.set('currency-usd', 'string-value'));
});

Then('the value should be stored in L2 Map cache', async function() {
    const r = await this.page.evaluate(() => {
        const c = window.__cache;
        return {
            isMap: c.l2 instanceof Map,
            stored: c.l2.get('currency-usd'),
            l3: c.l3.size,
            value: c.get('currency-usd')
        };
    });
    expect(r).toEqual({ isMap: true, stored: 'string-value', l3: 0, value: 'string-value' });
});

When('I cache a value with complex options object', async function() {
    this.cacheOpts = { format: 'currency', currency: 'USD', decimals: 2, locale: { lang: 'en', region: 'US' } };
    await this.page.evaluate((opts) => window.__cache.set(opts, 'options-value'), this.cacheOpts);
});

Then('the options should be hashed for L3 cache key', async function() {
    const r = await this.page.evaluate((opts) => {
        const c = window.__cache;
        const hash = window.genxCommon.cache.hashOptions(opts);
        return { hashType: typeof hash, inL3: c.l3.has(hash), l2: c.l2.size };
    }, this.cacheOpts);
    expect(r).toEqual({ hashType: 'string', inL3: true, l2: 0 });
});

Then('the value should be retrievable by options object', async function() {
    const v = await this.page.evaluate((opts) => window.__cache.get(opts), this.cacheOpts);
    expect(v).toBe('options-value');
});

Then('different options objects with same values should share cache', async function() {
    const r = await this.page.evaluate(() => {
        const c = window.__cache;
        const reordered = { locale: { region: 'US', lang: 'en' }, decimals: 2, currency: 'USD', format: 'currency' };
        const different = { format: 'currency', currency: 'EUR', decimals: 2, locale: { lang: 'en', region: 'US' } };
        return { same: c.get(reordered), different: c.get(different) ?? null, l3: c.l3.size };
    });
    expect(r).toEqual({ same: 'options-value', different: null, l3: 1 });
});

When('I retrieve a key that doesn\'t exist', async function() {
    this.cacheMiss = await this.page.evaluate(() => {
        window.__errors = window.__errors || [];
        const out = {};
        try {
            out.string = window.__cache.get('missing-key');
            out.object = window.__cache.get(document.createElement('span'));
            out.options = window.__cache.get({ nope: true });
        } catch (e) {
            window.__errors.push(e.message);
        }
        out.allUndefined = out.string === undefined && out.object === undefined && out.options === undefined;
        return out;
    });
});

Then('the result should be undefined', function() {
    expect(this.cacheMiss.allUndefined).toBe(true);
});

When('I cache more than {int} items', async function(n) {
    this.cacheInserted = n + 10;
    await this.page.evaluate((count) => {
        for (let i = 0; i < count; i++) {
            window.__cache.set(`k${i}`, i);
            window.__cache.set({ idx: i }, i);
        }
    }, this.cacheInserted);
});

Then('the oldest items should be evicted \\(LRU)', async function() {
    const r = await this.page.evaluate((count) => {
        const c = window.__cache;
        return {
            oldestL2: c.get('k0') ?? null,
            oldestL3: c.get({ idx: 0 }) ?? null,
            newestL2: c.get(`k${count - 1}`),
            newestL3: c.get({ idx: count - 1 })
        };
    }, this.cacheInserted);
    expect(r).toEqual({ oldestL2: null, oldestL3: null, newestL2: this.cacheInserted - 1, newestL3: this.cacheInserted - 1 });
});

Then('the cache size should not exceed {int}', async function(n) {
    const r = await this.page.evaluate(() => ({ l2: window.__cache.l2.size, l3: window.__cache.l3.size }));
    expect(r.l2).toBeLessThanOrEqual(n);
    expect(r.l3).toBeLessThanOrEqual(n);
    expect(r.l2).toBe(n);
});

// ============================================================================
// UTILITIES
// ============================================================================

Given('I have kebab-case strings', async function() {
    expect(await this.page.evaluate(() => typeof window.genxCommon.utils.kebabToCamel)).toBe('function');
});

When('I convert {string} to camelCase', async function(input) {
    this.result = await this.page.evaluate((s) => window.genxCommon.utils.kebabToCamel(s), input);
});

Then('{string} should become {string}', async function(input, expected) {
    const out = await this.page.evaluate((s) => window.genxCommon.utils.kebabToCamel(s), input);
    expect(out).toBe(expected);
});

Then('single words should remain unchanged', async function() {
    const out = await this.page.evaluate(() => ['format', 'currency', 'x'].map(window.genxCommon.utils.kebabToCamel));
    expect(out).toEqual(['format', 'currency', 'x']);
});

Given('I have a valid JSON string {string}', function(json) {
    this.jsonInput = json;
});

Given('I have an invalid JSON string {string}', function(json) {
    this.jsonInput = json;
});

When('I parse it with safeJsonParse', async function() {
    this.parsed = await this.page.evaluate((s) => {
        const r = window.genxCommon.utils.safeJsonParse(s);
        let value = null;
        let errorMessage = null;
        try {
            value = r.unwrap();
        } catch (e) {
            errorMessage = e.message;
        }
        return { isOk: r.isOk(), isErr: r.isErr(), value, errorMessage };
    }, this.jsonInput);
});

Then('the result should be a Result.Ok', function() {
    expect(this.parsed.isOk).toBe(true);
    expect(this.parsed.isErr).toBe(false);
});

Then('the result should be a Result.Err', function() {
    expect(this.parsed.isErr).toBe(true);
    expect(this.parsed.isOk).toBe(false);
});

Then('unwrapping should give the parsed object', function() {
    expect(this.parsed.value).toEqual(JSON.parse(this.jsonInput));
});

Then('the error message should describe the parsing failure', function() {
    expect(this.parsed.errorMessage).toMatch(/JSON parse error/i);
});

Given('I need to generate unique element IDs', async function() {
    expect(await this.page.evaluate(() => typeof window.genxCommon.utils.generateId)).toBe('function');
});

Then('subsequent calls should generate different IDs', async function() {
    const ids = await this.page.evaluate(() => [1, 2, 3].map(() => window.genxCommon.utils.generateId('genx')));
    expect(new Set([this.result, ...ids]).size).toBe(4);
});

Then('{int} calls should produce {int} unique IDs', async function(calls, unique) {
    const size = await this.page.evaluate((n) => {
        const set = new Set();
        for (let i = 0; i < n; i++) {
            set.add(window.genxCommon.utils.generateId('genx'));
        }
        return set.size;
    }, calls);
    expect(size).toBe(unique);
});

Given('I have a function that should be debounced', async function() {
    await this.page.evaluate(() => {
        window.__debCalls = [];
        window.__deb = window.genxCommon.utils.debounce((...args) => {
            window.__debCalls.push({ args, t: performance.now() });
        }, 100);
    });
    this.debounceDelay = 100;
});

When('I call the debounced function {int} times within {int}ms', async function(times, windowMs) {
    this.debounceTimes = times;
    this.debounceLastCall = await this.page.evaluate(async ({ n, ms }) => {
        const gap = Math.floor(ms / (n + 1));
        let last = 0;
        for (let i = 0; i < n; i++) {
            if (i > 0) {
                await new Promise(r => setTimeout(r, gap));
            }
            last = performance.now();
            window.__deb(i);
        }
        return { last, callsDuringBurst: window.__debCalls.length };
    }, { n: times, ms: windowMs });
    expect(this.debounceLastCall.callsDuringBurst).toBe(0);
    await this.page.waitForFunction(() => window.__debCalls.length > 0, null, { timeout: 2000 });
    await this.page.waitForTimeout(this.debounceDelay * 2);
    this.debCalls = await this.page.evaluate(() => window.__debCalls);
});

Then('the function should only execute once', function() {
    expect(this.debCalls.length).toBe(1);
});

Then('it should execute with the last call\'s arguments', function() {
    expect(this.debCalls[0].args).toEqual([this.debounceTimes - 1]);
});

Then('it should execute after the {int}ms delay', function(delay) {
    // Timers never fire early; allow 1ms for clock rounding
    expect(this.debCalls[0].t - this.debounceLastCall.last).toBeGreaterThanOrEqual(delay - 1);
});

Given('I have a debounced function with immediate=true', async function() {
    await this.page.evaluate(() => {
        window.__debCalls = [];
        window.__deb = window.genxCommon.utils.debounce((...args) => {
            window.__debCalls.push({ args });
        }, 100, true);
    });
    this.debounceDelay = 100;
});

When('I call it for the first time', async function() {
    this.immediateCount = await this.page.evaluate(() => {
        window.__deb('first');
        return window.__debCalls.length;
    });
});

Then('it should execute immediately', async function() {
    expect(this.immediateCount).toBe(1);
    const args = await this.page.evaluate(() => window.__debCalls[0].args);
    expect(args).toEqual(['first']);
});

Then('subsequent calls within delay should be ignored', async function() {
    const count = await this.page.evaluate(() => {
        window.__deb('second');
        window.__deb('third');
        return window.__debCalls.length;
    });
    expect(count).toBe(1);
});

Then('after delay, the next call should execute immediately again', async function() {
    await this.page.waitForTimeout(this.debounceDelay * 3);
    const r = await this.page.evaluate(() => {
        const before = window.__debCalls.length;
        window.__deb('later');
        return { before, after: window.__debCalls.length, last: window.__debCalls.at(-1).args };
    });
    expect(r).toEqual({ before: 1, after: 2, last: ['later'] });
});

// ============================================================================
// SIZE (@wip until the module fits its budget) AND LOAD TIME (@perf)
// ============================================================================

Given('the genx-common module is built', function() {
    const esbuild = require('esbuild');
    const out = esbuild.buildSync({ entryPoints: [COMMON_SRC], minify: true, write: false, logLevel: 'silent' });
    this.commonBuilt = out.outputFiles[0].contents;
});

When('I measure the gzipped size', function() {
    this.commonGzipBytes = zlib.gzipSync(Buffer.from(this.commonBuilt), { level: 9 }).length;
});

Then('it should be less than or equal to {int}KB', function(kb) {
    expect(this.commonGzipBytes).toBeLessThanOrEqual(kb * 1024);
});

Then('it should not increase module load time by more than {int}ms', async function(ms) {
    await this.page.goto('about:blank');
    const elapsed = await this.page.evaluate(async (code) => {
        const start = performance.now();
        const s = document.createElement('script');
        s.textContent = code;
        document.head.appendChild(s);
        return performance.now() - start;
    }, Buffer.from(this.commonBuilt).toString('utf8'));
    expect(elapsed).toBeLessThanOrEqual(ms);
});

// ============================================================================
// SECURITY
// ============================================================================

Given('I pass user input to utility functions', async function() {
    this.xssInputs = [
        '<script>window.__xss++</script>',
        '<img src=x onerror="window.__xss++">',
        'javascript:window.__xss++',
        'window.__xss++',
        '");window.__xss++;("',
        '{"__proto__":{"polluted":true},"a":"<script>window.__xss++</script>"}',
        '{"constructor":{"prototype":{"polluted":true}}}'
    ];
});

When('the input contains script tags or eval attempts', async function() {
    this.xssResult = await this.page.evaluate(async (inputs) => {
        window.__xss = 0;
        const gc = window.genxCommon;
        const errors = [];
        const outputs = [];
        for (const input of inputs) {
            try {
                outputs.push(typeof gc.utils.kebabToCamel(input));
                const parsed = gc.utils.safeJsonParse(input);
                outputs.push(parsed.isOk() || parsed.isErr() ? 'result' : 'bad');
                outputs.push(typeof gc.utils.generateId(input));
                outputs.push(typeof gc.cache.hashOptions({ v: input }));
                const el = document.createElement('span');
                el.setAttribute('fx-format', input);
                el.setAttribute('fx-opts', input);
                el.className = `fmt-${input}`;
                outputs.push(typeof gc.notation.parseNotation(el, 'fx'));
                document.body.appendChild(el);
                el.remove();
            } catch (e) {
                errors.push(e.message);
            }
        }
        await new Promise(r => setTimeout(r, 100));
        return {
            executed: window.__xss,
            polluted: ({}).polluted === true || Object.prototype.polluted === true,
            errors,
            outputs,
            injectedNodes: [...document.querySelectorAll('script, img')]
                .filter(n => n.tagName === 'IMG' || n.textContent.includes('__xss')).length
        };
    }, this.xssInputs);
});

Then('no code should be executed', function() {
    expect(this.xssResult.executed).toBe(0);
    expect(this.xssResult.polluted).toBe(false);
});

Then('the utilities should safely handle the input', function() {
    expect(this.xssResult.errors).toEqual([]);
    expect(this.xssResult.outputs.every(o => o === 'string' || o === 'result' || o === 'object')).toBe(true);
    expect(this.xssResult.injectedNodes).toBe(0);
});

Then('no innerHTML or eval should be used internally', function() {
    const code = stripComments(fs.readFileSync(COMMON_SRC, 'utf8'));
    const banned = /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write|\beval\s*\(|new\s+Function\s*\(/;
    expect(code.match(banned)).toBeNull();
});

// ============================================================================
// EXPORT STRUCTURE
// ============================================================================

Then('window.genxCommon should be defined', async function() {
    expect(await this.page.evaluate(() => typeof window.genxCommon)).toBe('object');
});

Then('window.genxCommon.errors should contain all error creators', async function() {
    const r = await this.page.evaluate(() => {
        const e = window.genxCommon.errors;
        return ['GenXError', 'ParseError', 'EnhancementError', 'ValidationError'].map(name => {
            const err = typeof e[name] === 'function' ? new e[name]('X_001', 'm') : null;
            return { name, ok: !!err && err instanceof e.GenXError && err instanceof Error && err.name === name };
        });
    });
    expect(r.filter(x => !x.ok)).toEqual([]);
});

Then('window.genxCommon.Result should contain Ok and Err', async function() {
    const r = await this.page.evaluate(() => {
        const R = window.genxCommon.Result;
        return { ok: R.Ok(1).isOk(), err: R.Err('e').isErr() };
    });
    expect(r).toEqual({ ok: true, err: true });
});

Then('window.genxCommon.createCircuitBreaker should be a factory function', async function() {
    const r = await this.page.evaluate(() => {
        const f = window.genxCommon.createCircuitBreaker;
        if (typeof f !== 'function') {
            return { type: typeof f };
        }
        const a = f(2, 500);
        const b = f();
        return {
            type: 'function',
            distinct: a !== b,
            state: a.getState(),
            threshold: a.threshold,
            timeout: a.timeout,
            hasExecute: typeof a.execute === 'function',
            isBreaker: a instanceof window.genxCommon.CircuitBreaker
        };
    });
    expect(r).toEqual({ type: 'function', distinct: true, state: 'CLOSED', threshold: 2, timeout: 500, hasExecute: true, isBreaker: true });
});

Then(/^window\.genxCommon\.cache should contain (.+)$/, async function(list) {
    const names = list.split(',').map(s => s.trim());
    const types = await this.page.evaluate((ns) => ns.map(n => typeof window.genxCommon.cache[n]), names);
    expect(types).toEqual(names.map(() => 'function'));
});

Then('window.genxCommon.utils should contain all utility functions', async function() {
    const names = ['kebabToCamel', 'safeJsonParse', 'generateId', 'debounce'];
    const types = await this.page.evaluate((ns) => ns.map(n => typeof window.genxCommon.utils[n]), names);
    expect(types).toEqual(names.map(() => 'function'));
});

// ============================================================================
// SHARED UTILITY INTEGRATION - No code duplication
// ============================================================================

async function loadCommonThen(page, moduleFile) {
    await loadCommon(page);
    await installSpies(page);
    await page.addScriptTag({ path: `./src/${moduleFile}` });
}

Given('genx-common is loaded before accX', async function() {
    await loadCommonThen(this.page, 'accx.js');
});

Given('genx-common is loaded before fmtX', async function() {
    await loadCommonThen(this.page, 'fmtx.js');
});

Given('genx-common is loaded before dragX', async function() {
    await loadCommonThen(this.page, 'dragx.js');
});

Given('genx-common is loaded', async function() {
    await loadCommon(this.page);
});

When('accX module initializes', async function() {
    await this.page.waitForFunction(() => typeof window.AccessX?.process === 'function');
    this.moduleRun = await this.page.evaluate(() => {
        const input = document.createElement('input');
        input.setAttribute('ax-enhance', 'field');
        document.body.appendChild(input);
        window.AccessX.process(input);
        return { id: input.id };
    });
});

When('fmtX module initializes', async function() {
    await this.page.waitForFunction(() => typeof window.FormatX?.formatElement === 'function');
    this.moduleRun = await this.page.evaluate(() => {
        const span = document.createElement('span');
        span.setAttribute('fx-format', 'currency');
        span.setAttribute('fx-currency', 'USD');
        span.textContent = '1234.5';
        document.body.appendChild(span);
        window.FormatX.formatElement(span);
        return { text: span.textContent };
    });
});

When('dragX module initializes', async function() {
    await this.page.waitForFunction(() => typeof window.DragX?.parseDraggable === 'function');
    this.moduleRun = await this.page.evaluate(() => {
        const card = document.createElement('div');
        card.setAttribute('dx-draggable', 'card');
        card.setAttribute('dx-data', '{"id":42}');
        document.body.appendChild(card);
        const cfg = window.DragX.parseDraggable(card);
        return { data: cfg && cfg.data };
    });
});

const utilCalls = (page) => page.evaluate(() => ({ utils: window.__utilCalls, notation: window.__notationCalls }));

Then('accX should use window.genxCommon.utils.generateId', async function() {
    const calls = await utilCalls(this.page);
    expect(calls.utils.generateId).toContainEqual(['ax']);
    expect(this.moduleRun.id.startsWith('ax-')).toBe(true);
});

// accX has no direct kebab or JSON parsing of its own: it hands attribute
// parsing to genx-common's notation parser, which uses these utilities.
Then('accX should use window.genxCommon.utils.kebabToCamel', async function() {
    expect((await utilCalls(this.page)).notation).toContain('ax');
});

Then('accX should use window.genxCommon.utils.safeJsonParse', async function() {
    expect((await utilCalls(this.page)).notation).toContain('ax');
});

Then('fmtX should use window.genxCommon.utils.kebabToCamel', async function() {
    const calls = await utilCalls(this.page);
    expect(calls.utils.kebabToCamel.length).toBeGreaterThan(0);
    expect(calls.utils.kebabToCamel).toContainEqual(['currency']);
});

// fmtX reads JSON config (fx-opts) through genx-common's notation parser
Then('fmtX should use window.genxCommon.utils.safeJsonParse', async function() {
    expect((await utilCalls(this.page)).notation).toContain('fx');
});

Then('dragX should use window.genxCommon.utils.safeJsonParse', async function() {
    const calls = await utilCalls(this.page);
    expect(calls.utils.safeJsonParse).toContainEqual(['{"id":42}']);
    expect(this.moduleRun.data).toEqual({ id: 42 });
});

// A module may keep a minimal fallback for standalone use (genx-common is not
// a separate dist file), but every helper must delegate to genx-common first.
function assertDelegates(file, helpers) {
    const code = stripComments(fs.readFileSync(path.resolve(__dirname, `../../src/${file}`), 'utf8'));
    for (const name of helpers) {
        expect(code).toContain(`window.genxCommon?.utils?.${name}`);
        const decl = new RegExp(`(?:function\\s+${name}\\s*\\(|(?:const|let|var)\\s+${name}\\s*=)`, 'i');
        const m = code.match(decl);
        if (m) {
            const body = code.slice(m.index, m.index + 600);
            const delegate = body.search(/genx[A-Z]\w*|genxCommon/);
            const own = body.search(/JSON\.parse|\.replace\(|Math\.random/);
            expect(delegate).toBeGreaterThan(-1);
            if (own > -1) {
                expect(delegate).toBeLessThan(own);
            }
        }
    }
}

Then('accX source should not contain duplicate implementations', function() {
    assertDelegates('accx.js', ['generateId']);
    const code = stripComments(fs.readFileSync(path.resolve(__dirname, '../../src/accx.js'), 'utf8'));
    expect(code).not.toMatch(/function\s+(kebabToCamel|safeJsonParse)\b|(const|let)\s+(kebabToCamel|safeJsonParse)\s*=/i);
});

Then('fmtX source should not contain duplicate implementations', function() {
    assertDelegates('fmtx.js', ['kebabToCamel']);
    const code = stripComments(fs.readFileSync(path.resolve(__dirname, '../../src/fmtx.js'), 'utf8'));
    expect(code).not.toMatch(/function\s+safeJsonParse\b|(const|let)\s+safeJsonParse\s*=/i);
});

Then('dragX source should not contain duplicate implementations', function() {
    assertDelegates('dragx.js', ['safeJsonParse']);
});

When('I call kebabToCamel with {string}', async function(input) {
    this.result = await this.page.evaluate((str) => window.genxCommon.utils.kebabToCamel(str), input);
});

Then('the result should be {string}', function(expected) {
    expect(this.result).toBe(expected);
});

When('I call safeJsonParse with {string}', async function(jsonStr) {
    this.result = await this.page.evaluate((str) => {
        const result = window.genxCommon.utils.safeJsonParse(str);
        return result.isOk() ? result.unwrap() : null;
    }, jsonStr);
});

Then('the result should be an object with key {string}', function(key) {
    expect(this.result).not.toBeNull();
    expect(typeof this.result).toBe('object');
    expect(Object.prototype.hasOwnProperty.call(this.result, key)).toBe(true);
});

When('I call generateId with prefix {string}', async function(prefix) {
    this.result = await this.page.evaluate((p) => window.genxCommon.utils.generateId(p), prefix);
});

Then('the result should start with {string}', function(prefix) {
    expect(this.result.startsWith(prefix)).toBe(true);
});

module.exports = {};
