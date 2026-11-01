const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { sourceFor } = require('../fixtures/genx-sources');

/*
 * Module cache integration runs the shipped bootloader (bootloader.js on the CDN, which
 * bundles domx-bridge) on a real page. Each boot navigates to a fresh page on a test
 * origin, so every scenario gets its own parse cache. CDN requests are answered from
 * src/ through Playwright routing.
 *
 * An init script logs every window.genx.getConfig call, and every read of a genX
 * attribute on an element after the cache has served that element. That is how the
 * steps see whether modules use the cache or re-parse attributes.
 */
const CDN = 'https://cdn.genx.software/v1';
const ORIGIN = 'https://genx.test';
const ROOT = path.join(__dirname, '..', '..');
const GENX_ATTR = /^(fx|bx|ax|dx|lx|nx|tx)-/;

const SPY = () => {
    window.__mc = { calls: [], attrReads: [], served: new WeakSet() };
    const origGetAttribute = Element.prototype.getAttribute;
    Element.prototype.getAttribute = function (name) {
        if (window.__mc.served.has(this) && /^(fx|bx|ax|dx|lx|nx|tx)-/.test(String(name))) {
            window.__mc.attrReads.push({ id: this.id, name: String(name) });
        }
        return origGetAttribute.call(this, name);
    };
    window.__mcReady = new Promise(resolve =>
        window.addEventListener('genx:ready', e => resolve(e.detail), { once: true }));
    // Runs before the bootloader's own DOMContentLoaded bootstrap, after its script ran.
    document.addEventListener('DOMContentLoaded', () => {
        const api = window.genx;
        if (!api || api.__mcWrapped) {
            return;
        }
        const original = api.getConfig;
        api.getConfig = function (el) {
            const result = original.call(this, el);
            window.__mc.calls.push({ id: el && el.id, hit: result !== null });
            if (result && el) {
                window.__mc.served.add(el);
            }
            return result;
        };
        api.__mcWrapped = true;
    });
};

const setUp = async (world) => {
    if (world.mc) {
        return;
    }
    world.mc = { html: '', pages: 0, booted: false };
    await world.page.addInitScript(SPY);
    await world.page.route(url => url.href.startsWith(CDN + '/'), route => {
        const body = sourceFor(new URL(route.request().url()).pathname.slice('/v1'.length));
        if (body === null) {
            return route.fulfill({ status: 404, body: 'Not Found' });
        }
        return route.fulfill({ status: 200, contentType: 'application/javascript', body });
    });
    await world.page.route(url => url.href.startsWith(ORIGIN + '/'), route =>
        route.fulfill({ status: 200, contentType: 'text/html', body: world.mc.html }));
};

/** Boot the bootloader on a fresh page holding `body`; resolve when genx:ready fires. */
const boot = async (world, body) => {
    await setUp(world);
    world.mc.html = `<!DOCTYPE html><html><head></head><body>${body}` +
        `<script src="${CDN}/bootloader.js"></script></body></html>`;
    world.mc.pages += 1;
    await world.page.goto(`${ORIGIN}/page-${world.mc.pages}`);
    world.mc.ready = await world.page.evaluate(() => window.__mcReady);
    world.mc.booted = true;
};

/** Boot with whatever markup the element steps put on the current page. */
const bootCurrent = async (world) => {
    // Shared element steps name the element differently; the steps here use #test-element.
    const body = await world.page.evaluate(() => {
        if (!document.body) {
            return '';
        }
        const el = document.getElementById('test-element') || document.body.querySelector('*');
        if (el && el.tagName !== 'SCRIPT') {
            el.id = 'test-element';
        }
        return document.body.innerHTML;
    });
    await boot(world, body);
};

const configOf = (world, id = 'test-element') =>
    world.page.evaluate(i => window.genx.getConfig(document.getElementById(i)), id);

const spyLog = (world) => world.page.evaluate(() => ({
    calls: window.__mc.calls, attrReads: window.__mc.attrReads
}));

// "{format: "currency", currency: "USD", decimals: 2}" -> object
const parseLoose = (text) => JSON.parse(text.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":'));

const readSrc = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ---------------------------------------------------------------- Background

Given('the bootloader is loaded and initialized', async function () {
    await boot(this, '');
});

Given('the parse cache is populated with element configurations', async function () {
    // An empty page caches nothing; a page with one genX element caches it.
    assert.strictEqual(this.mc.ready.elements.parsed, 0);
    await boot(this, '<span id="probe" fx-format="currency">5</span>');
    assert.deepStrictEqual(await configOf(this, 'probe'), { format: 'currency' });
});

Given('window.genx.getConfig is available', async function () {
    const type = await this.page.evaluate(() => typeof window.genx.getConfig);
    assert.strictEqual(type, 'function');
});

// ---------------------------------------------------------------- Element setup

Given(/^the element has been (?:parsed and )?cached(?: during bootstrap)?$/, async function () {
    await bootCurrent(this);
    assert.ok(await configOf(this), 'The element should be in the parse cache');
});

Given('the element has been cached with config {}', async function (text) {
    await bootCurrent(this);
    assert.deepStrictEqual(await configOf(this), parseLoose(text));
});

Given('the element has been cached with merged config', async function () {
    await bootCurrent(this);
    this.mergedConfig = await configOf(this);
    assert.deepStrictEqual(this.mergedConfig, { format: 'currency', currency: 'USD' });
});

Given('an element with no genX attributes', async function () {
    await boot(this, '<div id="test-element">Plain</div>');
});

Given('an element that may or may not be cached', async function () {
    await boot(this, '<span id="test-element" fx-format="currency">25</span>');
});

Given('an element with fx-format={string} and class={string}', async function (format, cls) {
    await this.page.setContent(`<span id="test-element" fx-format="${format}" class="${cls}">25</span>`);
});

Given('an element with invalid configuration values', async function () {
    await this.page.setContent(
        '<span id="test-element" fx-format="invalid-format" fx-decimals="not-a-number">42</span>');
});

Given('the element has been cached with the invalid config', async function () {
    await bootCurrent(this);
    assert.deepStrictEqual(await configOf(this), { format: 'invalid-format', decimals: 'not-a-number' });
});

// N elements for one module, all on one page.
const MARKUP = {
    'cached configurations': i => `<span id="el-${i}" fx-format="currency">100</span>`,
    'genX attributes': i => `<span id="el-${i}" fx-format="currency">100</span>`,
    'fx-format attributes': i => `<span id="el-${i}" fx-format="currency">100</span>`,
    'bx-bind attributes': i => `<span id="el-${i}" bx-bind="field${i}"></span>`,
    'ax-label and ax-icon attributes':
        i => `<button id="el-${i}" ax-enhance="button" ax-label="Button ${i}" ax-icon="icon-${i}"></button>`,
    'dx-draggable attributes': i => `<div id="el-${i}" dx-draggable="card">Card ${i}</div>`,
    'lx-src attributes': i => `<div id="el-${i}" lx-strategy="spinner" lx-src="/content${i}.html"></div>`,
    'nx-route attributes': i => `<a id="el-${i}" nx-route="/page${i}" href="/page${i}">Link ${i}</a>`,
    // Sorting needs no settings; pagination and filtering read theirs through the cache.
    'tx-sortable attributes': i =>
        `<table id="el-${i}" tx-sortable="true" tx-paginate="true" tx-per-page="5" tx-filterable="true"><thead><tr><th>H</th></tr></thead>` +
        `<tbody><tr><td>${i}</td></tr></tbody></table>`
};

Given(/^(\d+) elements with (cached configurations|genX attributes|fx-format attributes|bx-bind attributes|ax-label and ax-icon attributes|dx-draggable attributes|lx-src attributes|nx-route attributes|tx-sortable attributes)$/,
    async function (count, kind) {
        const n = Number(count);
        const body = Array.from({ length: n }, (_, i) => MARKUP[kind](i)).join('');
        await boot(this, body);
        this.elementIds = Array.from({ length: n }, (_, i) => `el-${i}`);
    });

Given(/^all elements are cached(?: during bootstrap)?$/, async function () {
    // What the modules asked for during bootstrap, before this step adds its own lookups.
    this.bootSpy = await spyLog(this);
    const missing = await this.page.evaluate(ids =>
        ids.filter(id => window.genx.getConfig(document.getElementById(id)) === null), this.elementIds);
    assert.deepStrictEqual(missing, [], 'Every element should be in the parse cache');
});

// ---------------------------------------------------------------- Module processing

When('a genX module processes the element', async function () {
    // fmtX already processed the element during bootstrap; read what it did.
    this.spy = await spyLog(this);
});

When('fmtX module calls window.genx.getConfig\\(element)', async function () {
    this.moduleConfig = await configOf(this);
});

When('fmtX module calls getConfig\\(element)', async function () {
    this.moduleConfig = await configOf(this);
});

When('another module also calls getConfig\\(element)', async function () {
    this.anotherModuleConfig = await configOf(this);
    this.sameReference = await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        return window.genx.getConfig(el) === window.genx.getConfig(el);
    });
});

const PREFIX = { fmtX: 'fx', bindX: 'bx', accX: 'ax', dragX: 'dx', loadX: 'lx', navX: 'nx', tableX: 'tx' };

When(/^(fmtX|bindX|accX|dragX|loadX|navX|tableX) initializes and processes all elements$/, async function (name) {
    // The bootloader loaded and initialized the module during bootstrap, after the parse
    // cache was filled; the spy recorded what the module asked for then.
    this.moduleName = name;
    assert.ok(this.mc.ready.loaded.includes(PREFIX[name]),
        `${name} should have been loaded by the bootloader (loaded: ${this.mc.ready.loaded})`);
    this.spy = this.bootSpy;
    if (name === 'dragX') {
        // dragX reads an element's settings when a drag starts: start one on each element.
        await this.page.evaluate(async ids => {
            window.__mc.calls = [];
            for (const id of ids) {
                const el = document.getElementById(id);
                const r = el.getBoundingClientRect();
                const opts = { bubbles: true, clientX: r.left + 2, clientY: r.top + 2, pointerId: 1, isPrimary: true, button: 0 };
                el.dispatchEvent(new PointerEvent('pointerdown', opts));
                document.dispatchEvent(new PointerEvent('pointerup', opts));
                await new Promise(res => setTimeout(res, 0));
            }
        }, this.elementIds);
        this.spy = await spyLog(this);
    }
});

When('a module calls window.genx.getConfig\\(element)', async function () {
    if (!this.mc || !this.mc.booted) {
        await bootCurrent(this);
    }
    this.getConfigResult = await configOf(this);
});

When('a module calls window.genx.getConfig\\(undefined)', async function () {
    this.getConfigResult = await this.page.evaluate(() => window.genx.getConfig(undefined));
});

When('a module calls getConfig\\(element) twice', async function () {
    this.dualCall = await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        const a = window.genx.getConfig(el);
        const b = window.genx.getConfig(el);
        return { first: a, sameReference: a === b, frozen: Object.isFrozen(a) };
    });
});

When('the element\'s fx-currency attribute is changed to {string}', async function (value) {
    await this.page.evaluate(v => document.getElementById('test-element').setAttribute('fx-currency', v), value);
    this.changedCurrency = value;
});

When('the element\'s textContent changes', async function () {
    this.configBefore = await configOf(this);
    await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        window.__configBefore = window.genx.getConfig(el);
        el.textContent = '99';
    });
});

When('a module processes the element', async function () {
    this.spy = await spyLog(this);
    this.getConfigResult = await configOf(this);
});

When('a module calls getConfig\\(element)', async function () {
    this.getConfigResult = await this.page.evaluate(() =>
        window.genx.getConfig(document.getElementById('test-element')));
});

// ---------------------------------------------------------------- Results

Then('it should call window.genx.getConfig\\(element)', async function () {
    assert.ok(this.spy.calls.some(c => c.id === 'test-element'), 'fmtX should ask the cache for the element');
});

Then('it should receive the cached config object', async function () {
    assert.ok(this.spy.calls.some(c => c.id === 'test-element' && c.hit), 'The cache should answer');
});

Then('in cache integration, it should return {}', async function (text) {
    assert.deepStrictEqual(this.moduleConfig, parseLoose(text));
});

Then(/^it should return (\{.*\})$/, async function (text) {
    assert.deepStrictEqual(this.moduleConfig, parseLoose(text));
});

Then('the configuration should be identical to verbose notation', async function () {
    const verbose = await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.setAttribute('fx-currency', 'USD');
        el.setAttribute('fx-decimals', '2');
        document.body.appendChild(el);
        return window.genx.rescan([el]).then(() => window.genx.getConfig(el));
    });
    assert.deepStrictEqual(this.moduleConfig, verbose);
});

Then('numeric types should be preserved from JSON', async function () {
    assert.strictEqual(typeof this.moduleConfig.decimals, 'number');
});

Then('class notation should produce identical config', async function () {
    // The class parser coerces numeric segments (tests/unit/genx-parser-class.test.js), so
    // decimals is 2 where verbose gives "2". The docs promise the same transformation.
    const result = await this.page.evaluate(async () => {
        const make = (attrs) => {
            const el = document.createElement('span');
            Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
            el.textContent = '1234.567';
            document.body.appendChild(el);
            return el;
        };
        const verbose = make({ 'fx-format': 'currency', 'fx-currency': 'USD', 'fx-decimals': '2' });
        const cls = make({ class: 'fmt-currency-USD-2' });
        await window.genx.rescan([verbose, cls]);
        return { verbose: window.genx.getConfig(verbose), verboseText: verbose.textContent, clsText: cls.textContent };
    });
    assert.deepStrictEqual(this.moduleConfig, { ...result.verbose, decimals: Number(result.verbose.decimals) });
    assert.strictEqual(result.clsText, result.verboseText);
    assert.notStrictEqual(result.clsText, '1234.567', 'Both should be formatted');
});

Then('the lookup should be instant \\(O\\(1))', async function () {
    // The mechanism: getConfig is one WeakMap read, the same object on every call.
    // Timings live in the @perf scenarios.
    const src = readSrc('src/bootloader.js');
    assert.match(src, /const parseMap = new WeakMap\(\)/);
    assert.match(src, /getConfig: \(el\) => parseMap\.get\(el\) \|\| null/);
    const same = await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        return window.genx.getConfig(el) === window.genx.getConfig(el);
    });
    assert.strictEqual(same, true);
});

Then('it should call getConfig\\() for each element', async function () {
    const asked = new Set(this.spy.calls.map(c => c.id));
    const missed = this.elementIds.filter(id => !asked.has(id));
    assert.deepStrictEqual(missed, [], `${this.moduleName} should ask the cache for every element`);
});

Then(/^it should use cached (debounce and validation settings|label and icon configurations|zone and handle configurations|source and debounce settings|route and pushState settings|sortable, paginate, and filter settings)$/,
    async function (_settings) {
        const misses = this.spy.calls.filter(c => this.elementIds.includes(c.id) && !c.hit);
        assert.deepStrictEqual(misses, [], 'Every lookup should be answered from the cache');
    });

// The speed claims rest on one mechanism: the module reads its settings from the cache,
// so it never falls back to parsing the attributes itself. Timings live in @perf.
Then(/^(formatting should complete faster than before|binding should be faster than attribute parsing|accessibility setup should be instant|drag initialization should be faster|load setup should be instant|navigation setup should be faster|table initialization should be instant)$/,
    async function (_claim) {
        const hits = this.spy.calls.filter(c => this.elementIds.includes(c.id) && c.hit);
        assert.ok(hits.length >= this.elementIds.length, 'Every element should be served from the cache');
        assert.deepStrictEqual(this.pageErrors, []);
    });

Then('it should return null', async function () {
    assert.strictEqual(this.getConfigResult, null);
});

Then('the module should skip processing that element', async function () {
    const html = await this.page.evaluate(() => document.getElementById('test-element').outerHTML);
    assert.strictEqual(html, '<div id="test-element">Plain</div>');
    assert.deepStrictEqual(this.mc.ready.loaded, [], 'No module should load for plain markup');
});

Then('both calls should return the exact same object reference', async function () {
    assert.strictEqual(this.dualCall.sameReference, true);
});

Then('object identity should be maintained', async function () {
    assert.ok(this.dualCall.first, 'The element should be cached');
    assert.strictEqual(this.dualCall.sameReference, true);
});

Then('no cloning or copying should occur', async function () {
    const same = await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        window.genx.getConfig(el).__marker = 1;
        const seen = window.genx.getConfig(el).__marker === 1;
        delete window.genx.getConfig(el).__marker;
        return seen;
    });
    assert.strictEqual(same, true, 'A change to the returned object should be visible on the next call');
});

Then(/^getConfig\(element\) should still return (\{.*\})$/, async function (text) {
    assert.deepStrictEqual(await configOf(this), parseLoose(text));
});

Then('the cache should not automatically update', async function () {
    const attr = await this.page.evaluate(() => document.getElementById('test-element').getAttribute('fx-currency'));
    assert.strictEqual(attr, this.changedCurrency);
    assert.notStrictEqual((await configOf(this)).currency, this.changedCurrency);
});

Then('this is expected behavior \\(cache is set during bootstrap)', async function () {
    // The cache is filled once per element: a rescan skips elements already cached.
    const config = await this.page.evaluate(async () => {
        await window.genx.rescan(document);
        return window.genx.getConfig(document.getElementById('test-element'));
    });
    assert.strictEqual(config.currency, 'USD');
});

Then('both modules should receive the same config object', async function () {
    assert.deepStrictEqual(this.moduleConfig, this.anotherModuleConfig);
    assert.strictEqual(this.sameReference, true);
});

Then('the cache should serve both modules efficiently', async function () {
    // One entry serves every caller: no reparse between the calls.
    assert.deepStrictEqual(this.anotherModuleConfig, this.mergedConfig);
});

Then('getConfig\\(element) should still return the original config', async function () {
    const same = await this.page.evaluate(() =>
        window.genx.getConfig(document.getElementById('test-element')) === window.__configBefore);
    assert.strictEqual(same, true);
});

Then('the cache entry should remain valid', async function () {
    assert.deepStrictEqual(await configOf(this), this.configBefore);
});

Then('only attribute changes would invalidate \\(not implemented in V1)', async function () {
    await this.page.evaluate(() => document.getElementById('test-element').setAttribute('fx-format', 'number'));
    assert.deepStrictEqual(await configOf(this), this.configBefore, 'V1 does not invalidate on attribute change');
});

Then('it should receive the cached config \\(even if invalid)', async function () {
    assert.deepStrictEqual(this.getConfigResult, { format: 'invalid-format', decimals: 'not-a-number' });
});

Then('the module should validate the config values', async function () {
    // fmtX was loaded for the element and processed it without throwing.
    assert.ok(this.mc.ready.loaded.includes('fx'), 'fmtX should load for the element');
    assert.deepStrictEqual(this.mc.ready.failed, []);
});

Then('handle errors appropriately', async function () {
    const text = await this.page.evaluate(() => document.getElementById('test-element').textContent);
    assert.strictEqual(text, '42', 'An unknown format should leave the value as written');
    assert.deepStrictEqual(this.pageErrors, []);
});

// ---------------------------------------------------------------- Backward compatibility

Given('existing module code that uses getAttribute\\()', async function () {
    // fmtX on its own, without the bootloader: it parses attributes itself.
    // A fresh document: the Background left the bootloader (window.genx) on this one.
    await this.page.goto('about:blank');
    await this.page.setContent('<span id="price" fx-format="currency" fx-currency="EUR">1234.5</span>');
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // standalone fmtX parses through genxCommon
    await this.page.addScriptTag({ path: './src/fmtx.js' });
    await this.page.evaluate(() => window.FormatX.scan(document));
    this.standaloneText = await this.page.evaluate(() => document.getElementById('price').textContent);
    this.standaloneErrors = [...this.pageErrors];
});

When('modules are updated to use getConfig\\()', async function () {
    await boot(this, '<span id="price" fx-format="currency" fx-currency="EUR">1234.5</span>');
    this.cachedText = await this.page.evaluate(() => document.getElementById('price').textContent);
    this.cacheUsed = (await spyLog(this)).calls.some(c => c.id === 'price' && c.hit);
});

Then('all existing functionality should work identically', async function () {
    assert.notStrictEqual(this.standaloneText, '1234.5', 'Standalone fmtX should format');
    assert.strictEqual(this.cachedText, this.standaloneText);
});

Then('no regressions should occur', async function () {
    assert.deepStrictEqual(this.standaloneErrors, []);
    assert.deepStrictEqual(this.pageErrors, []);
});

Then('tests should remain green', async function () {
    assert.ok(this.cacheUsed, 'The bootloader path should format from the cache');
});

// ---------------------------------------------------------------- Documentation and tests

const DOC = 'docs/architecture/genx-common-infrastructure-architecture-v1.0.md';

Given('a genX module implementation', async function () {
    this.doc = readSrc(DOC);
    const section = this.doc.split(/^## /m).find(s => /^(\d+\.\s*)?Configuration Cache/.test(s));
    assert.ok(section, `${DOC} should have a "Configuration Cache" section`);
    this.cacheDoc = section;
});

Then('its documentation should specify to use window.genx.getConfig\\(element)', async function () {
    assert.ok(this.cacheDoc.includes('window.genx.getConfig(element)'));
});

Then('its documentation should specify to never use getAttribute\\() for genX attributes', async function () {
    assert.match(this.cacheDoc, /[Nn]ever (call|use) `?getAttribute\(\)`?/);
});

Then('its documentation should specify to handle null return value gracefully', async function () {
    assert.match(this.cacheDoc, /returns `null`/);
});

Then('its documentation should specify to expect O\\(1) lookup performance', async function () {
    assert.ok(this.cacheDoc.includes('O(1)'));
});

Given('a module test suite', async function () {
    const dir = path.join(ROOT, 'tests', 'unit');
    this.unitTests = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
        .map(f => ({ file: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }))
        .filter(t => t.text.includes('getConfig'));
    assert.ok(this.unitTests.length > 0, 'Some unit test should cover getConfig');
});

Then('tests should mock window.genx.getConfig\\()', async function () {
    assert.ok(this.unitTests.some(t => /window\.genx\s*=\s*\{[^}]*getConfig/.test(t.text) ||
        /genx\.getConfig\s*=\s*jest\.fn/.test(t.text) || /getConfig:\s*jest\.fn/.test(t.text)));
});

Then('tests should verify getConfig is called, not getAttribute', async function () {
    assert.ok(this.unitTests.some(t => /getConfig\)\.toHaveBeenCalled/.test(t.text)));
});

Then('tests should provide test config via mock getConfig', async function () {
    assert.ok(this.unitTests.some(t => /getConfig:\s*jest\.fn\([^)]*=>/.test(t.text) ||
        /mockReturnValue/.test(t.text)));
});

Then('tests should assert cache usage', async function () {
    assert.ok(this.unitTests.some(t => /getConfig\)\.toHaveBeenCalledWith/.test(t.text)));
});

// ---------------------------------------------------------------- Content added later

Given('a module is loaded after bootstrap', async function () {
    // Bootstrap with no genX markup: no module is loaded yet.
    await boot(this, '<div id="host"></div>');
    assert.deepStrictEqual(this.mc.ready.loaded, []);
});

Given('new elements have been added to the DOM', async function () {
    await this.page.evaluate(() => {
        document.getElementById('host').innerHTML = '<span id="new-element" fx-format="currency">12</span>';
    });
});

When('the MutationObserver detects new elements', async function () {
    await this.page.waitForFunction(() =>
        window.genx.isLoaded('fx') && window.genx.getConfig(document.getElementById('new-element')) !== null,
    null, { timeout: 5000 });
});

Then('new elements should be scanned and parsed', async function () {
    const config = await configOf(this, 'new-element');
    assert.deepStrictEqual(config, { format: 'currency' });
});

Then('new configs should be added to the cache', async function () {
    assert.ok(await configOf(this, 'new-element'));
});

Then('the module should use getConfig for new elements', async function () {
    await this.page.waitForFunction(() => document.getElementById('new-element').textContent !== '12',
        null, { timeout: 5000 });
    const { calls } = await spyLog(this);
    assert.ok(calls.some(c => c.id === 'new-element' && c.hit), 'fmtX should format from the cache');
});

Given('an element is added to the DOM after bootstrap', async function () {
    await boot(this, '<span id="first" fx-format="number">1</span>');
    await this.page.evaluate(() => {
        // Hold the observer so the element is seen before it is cached.
        window.__added = document.createElement('span');
        window.__added.id = 'test-element';
        window.__added.setAttribute('fx-format', 'currency');
        window.__added.textContent = '7';
        document.body.appendChild(window.__added);
        window.__beforeObserver = window.genx.getConfig(window.__added);
    });
});

Given('the element has not been cached yet', async function () {
    assert.strictEqual(await this.page.evaluate(() => window.__beforeObserver), null);
});

Then('it should return null \\(not cached)', async function () {
    assert.strictEqual(await this.page.evaluate(() => window.__beforeObserver), null);
});

Then('the module should trigger a rescan or wait for MutationObserver', async function () {
    await this.page.waitForFunction(() => window.genx.getConfig(window.__added) !== null, null, { timeout: 5000 });
});

Then('subsequent getConfig calls should return the config', async function () {
    assert.deepStrictEqual(await configOf(this), { format: 'currency' });
});

// ---------------------------------------------------------------- Module init pattern

Then('it should call getConfig\\(element) first', async function () {
    assert.ok(this.spy.calls.some(c => c.id === 'test-element'), 'fmtX should ask the cache');
});

Then('if getConfig returns null, skip the element', async function () {
    const plain = await this.page.evaluate(async () => {
        const el = document.createElement('span');
        el.id = 'uncached';
        el.textContent = '5';
        document.body.appendChild(el);
        await window.genx.rescan([el]);
        return { config: window.genx.getConfig(el), text: el.textContent };
    });
    assert.deepStrictEqual(plain, { config: null, text: '5' });
});

Then('if getConfig returns a config, use it', async function () {
    assert.ok(this.getConfigResult, 'The element should be cached');
    const text = await this.page.evaluate(() => document.getElementById('test-element').textContent);
    assert.notStrictEqual(text, '25', 'fmtX should format the cached element');
});

// ---------------------------------------------------------------- No attribute re-parsing

const attrReadsOn = (world, ids) => world.spy.attrReads.filter(r => ids.includes(r.id));

Then(/^(?:it should NOT call element\.getAttribute\(\) for configuration|never call getAttribute\(\) for configuration)$/, async function () {
    assert.deepStrictEqual(attrReadsOn(this, ['test-element']), [],
        'After the cache answers, the module should not re-read genX attributes');
});

Then('it should NOT parse attributes directly', async function () {
    assert.deepStrictEqual(attrReadsOn(this, this.elementIds), [],
        'After the cache answers, fmtX should not re-read genX attributes');
});
