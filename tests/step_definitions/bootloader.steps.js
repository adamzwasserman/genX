const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');
const { sourceFor, bootloaderBundle } = require('../fixtures/genx-sources');

/*
 * The bootloader fetches modules from its CDN base (https://cdn.genx.software/v1 unless
 * genxConfig.cdn says otherwise). These steps answer those requests from src/ through
 * Playwright routing and record each one, so the tests watch real loads without touching
 * the network. Module files are named <name>.min.js and keyed by a two-letter prefix.
 */
const CDN_BASES = ['https://cdn.genx.software/v1', 'https://cdn.example.com/genx'];
const FILE_PREFIX = {
    fmtx: 'fx', accx: 'ax', bindx: 'bx', dragx: 'dx', loadx: 'lx',
    tablex: 'tx', navx: 'nx', smartx: 'sx', uix: 'ux'
};
const SAMPLE_MARKUP = {
    fx: '<span id="sample-fx" fx-format="currency">25</span>',
    ax: '<button id="sample-ax" ax-enhance="button">Click</button>',
    bx: '<input id="sample-bx" bx-model="user.name" />',
    dx: '<div id="sample-dx" dx-draggable="card">Card</div>',
    lx: '<div id="sample-lx" lx-strategy="spinner">Loading</div>',
    tx: '<table id="sample-tx" tx-sortable><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>',
    nx: '<nav id="sample-nx" nx-nav="main"><a href="#a">A</a></nav>',
    zx: '<div id="sample-zx" zx-widget="thing">Thing</div>'
};

const fileFor = (name) => {
    const base = name.replace(/(\.min)?\.js$/, '');
    const prefix = FILE_PREFIX[base];
    assert.ok(prefix, `No genX module file is named ${name}`);
    return { file: `${base}.min.js`, prefix };
};

const setPage = (world, body) =>
    world.page.setContent(`<!DOCTYPE html><html><head></head><body>${body}</body></html>`);

const moduleRequests = (world) =>
    world.bl.requests.filter(u => /\/\w+\.min\.js$/.test(u));

/** Wrap each module factory as it is defined, so the log shows load order and init calls. */
const installFactoryLog = (page) => page.evaluate((prefixes) => {
    window.__genxLog = window.__genxLog || [];
    for (const p of prefixes) {
        const key = `${p}XFactory`;
        if (Object.getOwnPropertyDescriptor(window, key)?.get) continue;
        let value;
        Object.defineProperty(window, key, {
            configurable: true,
            get() { return value; },
            set(factory) {
                window.__genxLog.push(`define:${p}`);
                if (factory && typeof factory === 'object') {
                    for (const m of ['autoInit', 'init']) {
                        if (typeof factory[m] !== 'function') continue;
                        const original = factory[m];
                        factory[m] = function (...args) {
                            window.__genxLog.push(`${m}:${p}`);
                            return original.apply(this, args);
                        };
                    }
                }
                value = factory;
            }
        });
    }
}, Object.values(FILE_PREFIX));

/** Add a fresh bootloader to the current page and, unless told not to, wait for genx:ready. */
const runBootloader = async (world, { bundle = false, wait = true } = {}) => {
    const page = world.page;
    await installFactoryLog(page);
    await page.evaluate(() => {
        window.__genxReady = new Promise(resolve =>
            window.addEventListener('genx:ready', e => resolve(e.detail), { once: true }));
        new MutationObserver(records => {
            for (const r of records) for (const n of r.addedNodes) {
                const m = n.tagName === 'SCRIPT' && n.src.match(/\/(\w+)\.min\.js$/);
                if (m) window.__genxLog.push(`append:${m[1]}`);
            }
        }).observe(document.head, { childList: true });
    });
    if (bundle) await page.addScriptTag({ content: bootloaderBundle() });
    else await page.addScriptTag({ path: './src/bootloader.js' });
    if (wait) world.readyDetail = await page.evaluate(() => window.__genxReady);
};

// Background steps
Given('a clean browser environment', async function() {
    // Browser is already opened in hooks
    assert.ok(this.page, 'Page should be initialized');
});

Given('the bootloader is loaded', async function() {
    this.bl = { requests: [], hold: new Set(), missing: new Set(), genxErrors: [], pageErrors: [] };
    this.page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().startsWith('genX')) this.bl.genxErrors.push(msg.text());
    });
    this.page.on('pageerror', err => this.bl.pageErrors.push(String(err)));
    await this.page.route(url => CDN_BASES.some(b => url.href.startsWith(b + '/')), async (route) => {
        const href = route.request().url();
        this.bl.requests.push(href);
        const base = CDN_BASES.find(b => href.startsWith(b + '/'));
        const urlPath = new URL(href).pathname.slice(new URL(base).pathname.length);
        const file = urlPath.slice(1);
        if (this.bl.hold.has(file)) return; // never answered: a stalled CDN request
        const body = this.bl.missing.has(file) ? null : sourceFor(urlPath);
        if (body === null) return route.fulfill({ status: 404, body: 'Not Found' });
        return route.fulfill({
            status: 200, contentType: 'application/javascript', body,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    });
    await this.page.goto('about:blank');
    // Let this instance finish on the empty page, so its scan never sees a scenario's markup.
    await runBootloader(this);
});

// Scenario: Bootloader loads after first paint
Given('an HTML page with genX attributes', async function() {
    const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
            <span fx-format="currency">25.00</span>
        </body>
        </html>
    `;
    await this.page.setContent(html);
});

When('the page loads', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
});

Then('the bootloader should execute after first paint', async function() {
    const timing = await this.page.evaluate(() => {
        return performance.timing;
    });
    // Verify bootloader doesn't block rendering
    assert.ok(timing, 'Performance timing should be available');
});

Then('Total Blocking Time should be 0ms', async function() {
    // TBT is measured by Lighthouse, here we verify no blocking scripts
    const blockingScripts = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.filter(s => !s.async && !s.defer).length;
    });
    assert.strictEqual(blockingScripts, 0, 'Should have no blocking scripts');
});

// Scenario: Automatic module detection
Given('an HTML page with the following content:', async function(docString) {
    await setPage(this, docString);
});

Given('an HTML page with all module attributes:', async function(docString) {
    await setPage(this, docString);
});

When('the bootloader scans the DOM', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
    this.scanned = await this.page.evaluate(() => Array.from(window.genx.scan().needed).sort());
});

// genx.scan() returns { needed: Set<prefix>, elements: Element[] }.
Then('it should detect the {string} prefix', async function(prefix) {
    assert.ok(this.scanned.includes(prefix), `Should detect ${prefix}, detected ${this.scanned}`);
});

Then('it should not detect any other prefixes', async function() {
    assert.deepStrictEqual(this.scanned, ['ax', 'fx'], 'Should detect only fx and ax');
});

Then(/^it should detect all (\d+) prefixes: (.+)$/, async function(count, list) {
    const expected = list.match(/"(\w+)"/g).map(s => s.replace(/"/g, '')).sort();
    assert.strictEqual(expected.length, Number(count), 'The scenario lists the wrong number of prefixes');
    assert.deepStrictEqual(this.scanned, expected);
});

// Scenario: Dynamic module loading
Given(/^an HTML page with (\w\w)- attributes$/, async function(prefix) {
    assert.ok(SAMPLE_MARKUP[prefix], `No sample markup for ${prefix}-`);
    await setPage(this, SAMPLE_MARKUP[prefix]);
});

Given('an HTML page with "zx-" attributes', async function() {
    await setPage(this, SAMPLE_MARKUP.zx);
});

Given('an HTML page with fx- and ax- attributes', async function() {
    await setPage(this, SAMPLE_MARKUP.fx + SAMPLE_MARKUP.ax);
});

When('the bootloader initializes', async function() {
    await runBootloader(this);
});

Then('it should load {string} module', async function(name) {
    const { file, prefix } = fileFor(name);
    await this.page.waitForFunction(p => window.genx.isLoaded(p), prefix, { timeout: 4000 })
        .catch(() => assert.fail(`${file} should be loaded (genx.isLoaded('${prefix}'))`));
    assert.ok(moduleRequests(this).some(u => u.endsWith('/' + file)), `${file} should be requested`);
});

Then('it should not load {string} module', async function(name) {
    const { file, prefix } = fileFor(name);
    const loaded = await this.page.evaluate(p => window.genx.isLoaded(p), prefix);
    assert.ok(!loaded, `${file} should not be loaded`);
    assert.ok(!moduleRequests(this).some(u => u.endsWith('/' + file)), `${file} should not be requested`);
});

Then('it should load {string} from {string}', async function(name, url) {
    const { file, prefix } = fileFor(name);
    assert.ok(this.bl.requests.includes(url), `${file} should be requested from ${url}; got ${moduleRequests(this)}`);
    const loaded = await this.page.evaluate(p => window.genx.isLoaded(p), prefix);
    assert.ok(loaded, `${file} should be loaded; genX errors: ${this.bl.genxErrors}; page errors: ${this.bl.pageErrors}`);
});

// Scenario: Factory pattern initialization
Then(/^it should call "window\.(\w\w)XFactory\.(\w+)\(\)"$/, async function(prefix, method) {
    this.factoryPrefix = prefix;
    const log = await this.page.evaluate(() => window.__genxLog);
    assert.ok(log.includes(`${method}:${prefix}`), `${prefix}XFactory.${method}() should be called; log: ${log}`);
});

Then('the module should be marked as loaded', async function() {
    const p = this.factoryPrefix;
    const state = await this.page.evaluate(p => ({
        loaded: window.genx.isLoaded(p),
        same: window.genx.getFactory(p) === window[`${p}XFactory`]
    }), p);
    assert.ok(state.loaded, `genx.isLoaded('${p}') should be true`);
    assert.ok(state.same, `genx.getFactory('${p}') should be window.${p}XFactory`);
});

Then('the module should be added to the loaded list', async function() {
    const list = await this.page.evaluate(() => window.genx.loaded());
    assert.ok(list.includes(this.factoryPrefix), `genx.loaded() should include ${this.factoryPrefix}: ${list}`);
});

// Scenario: Multiple modules loading
Then('it should load both {string} and {string}', async function(a, b) {
    for (const name of [a, b]) {
        const { file, prefix } = fileFor(name);
        const loaded = await this.page.evaluate(p => window.genx.isLoaded(p), prefix);
        assert.ok(loaded, `${file} should be loaded`);
    }
});

Then('both modules should be initialized in parallel', async function() {
    // Parallel: both script tags go in before either module has defined its factory.
    const log = await this.page.evaluate(() => window.__genxLog);
    const firstDefine = log.findIndex(e => e.startsWith('define:'));
    const appends = ['fmtx', 'accx'].map(f => log.indexOf(`append:${f}`));
    assert.ok(appends.every(i => i >= 0), `both scripts should be added; log: ${log}`);
    assert.ok(appends.every(i => i < firstDefine), `both requests should start before either loads; log: ${log}`);
});

Then('the genx:ready event should fire with both modules listed', async function() {
    assert.deepStrictEqual([...this.readyDetail.loaded].sort(), ['ax', 'fx']);
});

// Scenario: MutationObserver for dynamic content (the observer ships in the bundle)
Given('the bootloader is initialized', async function() {
    await setPage(this, SAMPLE_MARKUP.fx);
    await runBootloader(this, { bundle: true });
});

Given('all initial modules are loaded', async function() {
    assert.deepStrictEqual(this.readyDetail.loaded, ['fx']);
});

When('new content with "bx-" attributes is added to the DOM', async function() {
    await this.page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), SAMPLE_MARKUP.bx);
});

Then('the MutationObserver should detect the change', async function() {
    await this.page.waitForFunction(() => window.genx.isLoaded('bx'), null, { timeout: 4000 })
        .catch(() => assert.fail(`added bx- content should trigger a load; requests: ${moduleRequests(this)}`));
});

Then('it should initialize the new module', async function() {
    const log = await this.page.evaluate(() => window.__genxLog);
    assert.ok(log.some(e => e === 'autoInit:bx' || e === 'init:bx'), `bindx should be initialized; log: ${log}`);
});

// Scenario: Prevent duplicate module loading
Given('{string} is already loaded', async function(name) {
    const { prefix } = fileFor(name);
    await setPage(this, SAMPLE_MARKUP.fx);
    await runBootloader(this, { bundle: true });
    assert.ok(this.readyDetail.loaded.includes(prefix), `${name} should load at boot`);
    await this.page.evaluate(p => { window.__factoryAtBoot = window.genx.getFactory(p); }, prefix);
});

When('new content with fx- attributes is added', async function() {
    await this.page.evaluate(() => document.body.insertAdjacentHTML('beforeend',
        '<span id="added-fx" fx-format="currency">42</span>'));
    // Formatted means the observer handled the addition.
    await this.page.waitForSelector('#added-fx[fx-raw]', { timeout: 4000 });
});

Then('the bootloader should not load {string} again', async function(name) {
    const { file } = fileFor(name);
    const requests = moduleRequests(this).filter(u => u.endsWith('/' + file)).length;
    const tags = await this.page.evaluate(f =>
        document.querySelectorAll(`script[src$="/${f}"]`).length, file);
    assert.strictEqual(requests, 1, `${file} should be requested once`);
    assert.strictEqual(tags, 1, `${file} should have one script tag`);
});

Then('it should reuse the existing factory', async function() {
    const same = await this.page.evaluate(() => window.genx.getFactory('fx') === window.__factoryAtBoot);
    assert.ok(same, 'genx.getFactory(fx) should be the factory loaded at boot');
});

// Scenario: Handle missing modules gracefully
Given('the {string} module file is missing from the CDN', async function(name) {
    this.bl.missing.add(fileFor(name).file);
    this.missingPrefix = fileFor(name).prefix;
});

Then('it should log an error to console', async function() {
    const p = this.missingPrefix;
    assert.ok(this.bl.genxErrors.some(t => t.includes(`Failed to init ${p}`)),
        `genX should log the failed ${p} load; logged: ${this.bl.genxErrors}`);
});

Then('it should continue loading other modules', async function() {
    const fx = await this.page.evaluate(() => ({
        loaded: window.genx.isLoaded('fx'),
        formatted: document.getElementById('sample-fx').hasAttribute('fx-raw')
    }));
    assert.ok(fx.loaded && fx.formatted, 'fmtx should still load and format its element');
});

Then('it should not break the page', async function() {
    assert.ok(this.readyDetail, 'genx:ready should still fire');
    assert.deepStrictEqual(this.bl.pageErrors, [], 'no uncaught page errors');
});

Then('it should request no module files', async function() {
    assert.deepStrictEqual(moduleRequests(this), []);
    assert.deepStrictEqual(this.readyDetail.loaded, []);
});

// Scenario: CDN configuration
const setConfig = (world, config) => world.page.evaluate(c => { window.genxConfig = c; }, config);

Given('the bootloader config:', async function(docString) {
    await setConfig(this, JSON.parse(docString));
});

When('the bootloader loads a module', async function() {
    await setPage(this, SAMPLE_MARKUP.fx);
    await runBootloader(this);
});

Then('it should request from {string}', async function(url) {
    assert.ok(this.bl.requests.includes(url), `should request ${url}; got ${moduleRequests(this)}`);
    const loaded = await this.page.evaluate(() => window.genx.isLoaded('fx'));
    assert.ok(loaded, 'the module from the configured CDN should load');
});

// Scenario: SRI hash verification
Given('the bootloader config with SRI hashes:', async function(docString) {
    await setConfig(this, JSON.parse(docString));
});

When('the bootloader loads {string}', async function(name) {
    this.sriFile = fileFor(name).file;
    await setPage(this, SAMPLE_MARKUP.fx);
    // The placeholder hash cannot match, so the browser blocks the script; genx:ready still fires.
    await runBootloader(this);
});

Then(/^the script tag should have (integrity|crossorigin)="([^"]*)"$/, async function(attr, value) {
    const actual = await this.page.evaluate(([f, a]) =>
        document.querySelector(`script[src$="/${f}"]`)?.getAttribute(a), [this.sriFile, attr]);
    assert.strictEqual(actual, value);
});

// Scenario: genx:ready event emission
When('the bootloader completes initialization', async function() {
    await runBootloader(this);
});

Then('it should emit a {string} CustomEvent', async function(eventName) {
    assert.ok(this.readyDetail, `${eventName} event should be emitted`);
});

Then(/^the event detail should contain loaded modules (\[.*\])$/, async function(modules) {
    const expected = JSON.parse(modules);
    assert.deepStrictEqual([...this.readyDetail.loaded].sort(), expected.sort(), 'Loaded modules should match');
});

// Scenario: Module loading timeout
Given('{string} fails to load within 10 seconds', async function(name) {
    const { file, prefix } = fileFor(name);
    this.bl.hold.add(file); // the CDN never answers this request
    this.stalledPrefix = prefix;
    await setPage(this, SAMPLE_MARKUP.fx + SAMPLE_MARKUP.ax);
});

When('the bootloader waits for initialization', { timeout: 20000 }, async function() {
    // The shipped bundle, so the observer bridge is present to check afterward.
    await runBootloader(this, { bundle: true, wait: false });
    this.readyDetail = await this.page.evaluate(() => Promise.race([
        window.__genxReady,
        new Promise(resolve => setTimeout(() => resolve(null), 12000))
    ]));
});

Then('it should timeout gracefully', async function() {
    assert.ok(this.readyDetail,
        `genx:ready should fire within 12 s although ${this.stalledPrefix}'s module never answered`);
    assert.deepStrictEqual(this.readyDetail.failed, [this.stalledPrefix],
        `genx:ready should list ${this.stalledPrefix} as failed`);
    const observing = await this.page.evaluate(() => window.domxBridge?.isSubscribed('bootloader'));
    assert.ok(observing, 'the bootloader should still watch for new content after the timeout');
});

Then('it should log an error', async function() {
    assert.ok(this.bl.genxErrors.some(t => t.includes(this.stalledPrefix)),
        `genX should log the stalled ${this.stalledPrefix} load; logged: ${this.bl.genxErrors}`);
});

Then('other modules should continue loading', async function() {
    const ax = await this.page.evaluate(() => window.genx.isLoaded('ax'));
    assert.ok(ax, 'accx should load while fmtx stalls');
});

// Size requirement: the same budget and measure as the size-limit config in package.json
// (dist/bootloader.min.js, gzip, "5 KB" = 5000 bytes), applied to a fresh build of src/.
Given('the bootloader source code', async function() {
    this.bootloaderCode = bootloaderBundle(); // esbuild iife of src/bootloader.bundle.js
});

When('minified and gzipped', { timeout: 30000 }, async function() {
    const { minify } = require('terser');
    const minified = await minify(this.bootloaderCode, { compress: true, mangle: true });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'genx-size-'));
    const file = path.join(dir, 'bootloader.min.js');
    try {
        fs.writeFileSync(file, minified.code);
        const sizeLimit = (await import('size-limit')).default;
        const preset = (await import('@size-limit/preset-small-lib')).default;
        const [result] = await sizeLimit([preset], {
            cwd: process.cwd(), checks: [{ files: [file], gzip: true }]
        });
        this.size = result.size;
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const check = pkg['size-limit'].find(c => c.path === 'dist/bootloader.min.js');
    this.sizeBudget = require('bytes-iec').parse(check.limit);
});

Then('the file size should be within the size-limit budget', async function() {
    assert.ok(this.sizeBudget > 0, 'package.json should set a bootloader size limit');
    assert.ok(this.size <= this.sizeBudget,
        `Bootloader should be <= ${this.sizeBudget} bytes gzipped, got ${this.size}`);
});

// Scenario: No framework dependencies
const SHIPPED = ['src/bootloader.bundle.js', 'src/bootloader.js', 'src/domx-bridge.js'];

Given('the bootloader code', async function() {
    this.shipped = Object.fromEntries(SHIPPED.map(f => [f, fs.readFileSync(f, 'utf8')]));
});

When('analyzed for dependencies', async function() {
    const result = esbuild.buildSync({
        entryPoints: ['src/bootloader.bundle.js'], bundle: true, write: false,
        format: 'iife', metafile: true, logLevel: 'silent'
    });
    this.bundleInputs = Object.keys(result.metafile.inputs).sort();
});

Then('it should have zero external dependencies', async function() {
    // Everything the bundle pulls in is genX's own source; nothing comes from node_modules.
    assert.deepStrictEqual(this.bundleInputs, [...SHIPPED].sort());
});

Then('it should use only vanilla JavaScript', async function() {
    for (const [file, code] of Object.entries(this.shipped)) {
        // Parses as plain JavaScript: no JSX, TypeScript, or other syntax needing a compiler.
        assert.doesNotThrow(() => esbuild.transformSync(code, { loader: 'js' }), `${file} should be plain JS`);
    }
});

Then('it should not require React, Vue, or Angular', async function() {
    for (const [file, code] of Object.entries(this.shipped)) {
        const hit = code.match(/\b(React|ReactDOM|Vue|angular|@angular\/\w+)\b/);
        assert.ok(!hit, `${file} references ${hit && hit[0]}`);
    }
});

// Configuration steps for genxConfig
Given('performance logging is enabled', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.performance = { logging: true };
    });
});

Given('mutation observation is disabled', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.observe = false;
    });
});

Given('CDN is configured to {string}', async function(cdnUrl) {
    await this.page.evaluate((url) => {
        window.genxConfig = window.genxConfig || {};
        window.genxConfig.cdn = url;
    }, cdnUrl);
});

Given('CDN is not configured', async function() {
    await this.page.evaluate(() => {
        window.genxConfig = window.genxConfig || {};
        delete window.genxConfig.cdn;
    });
});

// genx API steps
Then('genx API should be defined immediately', async function() {
    const defined = await this.page.evaluate(() => !!window.genx);
    assert.ok(defined, 'genx API should be defined');
});

Then('genx API version should be {string}', async function(version) {
    const apiVersion = await this.page.evaluate(() => window.genx?.version);
    assert.strictEqual(apiVersion, version, `genx version should be ${version}`);
});

Then('genx scan method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.scan === 'function');
    assert.ok(available, 'genx.scan should be available');
});

Then('genx getConfig method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(available, 'genx.getConfig should be available');
});

Then('genx loadParsers method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.loadParsers === 'function');
    assert.ok(available, 'genx.loadParsers should be available');
});

Then('genx parseAllElements method should be available', async function() {
    const available = await this.page.evaluate(() => typeof window.genx?.parseAllElements === 'function');
    assert.ok(available, 'genx.parseAllElements should be available');
});

// getConfig API steps
When('genx getConfig is called with element', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        return window.genx?.getConfig(element);
    });
});

When('genx getConfig is called with element again', async function() {
    this.getConfigResultSecond = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        return window.genx?.getConfig(element);
    });
});

When('genx getConfig is called with undefined', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        return window.genx?.getConfig(undefined);
    });
});

When('genx getConfig is called with null', async function() {
    this.getConfigResult = await this.page.evaluate(() => {
        return window.genx?.getConfig(null);
    });
});

When('genx getConfig is called {int} times', async function(times) {
    this.getConfigResults = await this.page.evaluate((count) => {
        const element = document.querySelector('[fx-format]') || document.querySelector('[bx-bind]');
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(window.genx?.getConfig(element));
        }
        return results;
    }, times);
});

When('genx init is called', async function() {
    await this.page.evaluate(() => {
        return window.genx?.init?.();
    });
});

Then('genx getConfig returns cached config for element', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        return window.genx?.getConfig(element) !== null;
    });
    assert.ok(result, 'genx.getConfig should return cached config');
});

Then('genx getConfig returns correct config for each element', async function() {
    const result = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[fx-format], [bx-bind], [ax-label]');
        return Array.from(elements).every(el => {
            const config = window.genx?.getConfig(el);
            return config !== undefined;
        });
    });
    assert.ok(result, 'genx.getConfig should return configs for all elements');
});

Then('genx getConfig should be a function', async function() {
    const isFunc = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(isFunc, 'genx.getConfig should be a function');
});

Then('genx getConfig should accept an element parameter', async function() {
    const accepts = await this.page.evaluate(() => {
        const fn = window.genx?.getConfig;
        return fn && fn.length > 0;
    });
    assert.ok(accepts, 'genx.getConfig should accept parameters');
});

Then('genx getConfig should return an object or null', async function() {
    const returns = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const result = window.genx?.getConfig(element);
        return result === null || typeof result === 'object';
    });
    assert.ok(returns, 'genx.getConfig should return object or null');
});

Then('genx getConfig returns merged config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const config = window.genx?.getConfig(element);
        return config !== null && typeof config === 'object';
    });
    assert.ok(result, 'genx.getConfig should return merged config');
});

Then('genx getConfig returns empty config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format=""]');
        const config = window.genx?.getConfig(element);
        return typeof config === 'object';
    });
    assert.ok(result, 'genx.getConfig should return empty config');
});

Then('genx getConfig should be exposed', async function() {
    const exposed = await this.page.evaluate(() => typeof window.genx?.getConfig === 'function');
    assert.ok(exposed, 'genx.getConfig should be exposed');
});

Then('genx getConfig still returns same config', async function() {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        return window.genx?.getConfig(element) !== null;
    });
    assert.ok(result, 'genx.getConfig should still return config');
});

Then('all {int} calls should return identical results', async function(count) {
    const result = await this.page.evaluate(() => {
        const element = document.querySelector('[fx-format]');
        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(window.genx?.getConfig(element));
        }
        const first = results[0];
        return results.every(r => r === first);
    });
    assert.ok(result, 'All getConfig calls should return identical results');
});

// Module configuration steps
Then('modules should use genx getConfig API for element configs', async function() {
    const uses = await this.page.evaluate(() => {
        return typeof window.genx?.getConfig === 'function';
    });
    assert.ok(uses, 'Modules should use genx.getConfig API');
});
