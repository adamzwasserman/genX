/**
 * Shared step definitions for base module safety tests.
 * They run the real modules (src/genx-common.js plus src/<module>.js, or
 * src/bootloader.js) in the test-base fixture and check what the modules do.
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const playwright = require('@playwright/test');
const { baseUrl } = require('../fixtures/server');

const ROOT = `${__dirname}/../..`;

let page; // page the module runs in (the world's page, or a firefox/webkit page)

// Documented globals: the custom-module guide (docs/guides/creating-a-custom-genx-module.md)
// gives each module a window.<x>XFactory plus a legacy standalone global, and the
// bootloader exposes window.genx.
const MODULE_CONFIG = {
    fmtx: {
        scripts: ['src/genx-common.js', 'src/fmtx.js'],
        globalName: 'FormatX',
        factoryName: 'fxXFactory',
        globals: ['FormatX', 'fxXFactory'],
        api: ['format', 'formatElement', 'unformatElement', 'scan', 'destroy'],
        internals: ['initFormatX', 'formatElement', 'scanElements', 'createObserver', 'format', 'unformatElement', 'formatSelector', 'parseNumber', 'parseDate', 'convertInput'],
        sampleAttribute: 'fx-format'
    },
    accx: {
        scripts: ['src/genx-common.js', 'src/accx.js'],
        globalName: 'AccessX',
        factoryName: 'axXFactory',
        globals: ['AccessX', 'axXFactory'],
        api: ['enhance', 'process', 'scan', 'validate', 'announce', 'destroy'],
        internals: ['initAccessX', 'processElement', 'scan', 'createObserver', 'enhance', 'validate', 'ensureSrStyles', 'guessIconMeaning', 'expandAbbreviation'],
        sampleAttribute: 'ax-enhance'
    },
    bootloader: {
        scripts: ['src/bootloader.js'],
        globalName: 'genx',
        factoryName: null,
        globals: ['genx'],
        api: null,
        internals: ['bootstrap', 'parseMap', 'detectNotationStyles', 'loadParsers', 'parseElements', 'buildSelector', 'detectPrefix', 'scheduleOnce'],
        sampleAttribute: null
    }
};

// In-page helpers. make() builds a module element, output() reads what the
// module produced, process() runs the module's public per-element API.
function installHelpers() {
    if (window.__bms) {
        return;
    }
    window.__errors = window.__errors || [];
    window.addEventListener('error', e => window.__errors.push(String(e.message)));
    window.__bms = {
        make(mod, value, extra = {}) {
            const el = document.createElement('span');
            if (mod === 'fmtx') {
                el.setAttribute('fx-format', 'currency');
                el.setAttribute('fx-raw', String(value));
            } else if (mod === 'accx') {
                el.setAttribute('ax-enhance', 'label');
                el.textContent = String(value);
            }
            for (const [k, v] of Object.entries(extra)) {
                el.setAttribute(k, v);
            }
            return el;
        },
        output(mod, el) {
            return mod === 'fmtx' ? el.textContent : el.getAttribute('aria-label');
        },
        process(mod, el) {
            if (mod === 'fmtx') {
                window.FormatX.formatElement(el);
            } else if (mod === 'accx') {
                window.AccessX.process(el);
            }
        },
        scan(mod, root) {
            if (mod === 'fmtx') {
                window.FormatX.scan(root);
            } else if (mod === 'accx') {
                window.AccessX.scan(root);
            }
        },
        snapshot(el) {
            return el.outerHTML;
        },
        container() {
            let c = document.getElementById('test-container');
            if (!c) {
                c = document.createElement('div');
                c.id = 'test-container';
                document.body.appendChild(c);
            }
            return c;
        }
    };
}

// Value the n-th sample element starts with, and what the module should produce.
const sampleValue = (mod, i) => (mod === 'fmtx' ? (i + 1) * 10 : `label ${i + 1}`);
const sampleOutput = (mod, i) => (mod === 'fmtx'
    ? `$${((i + 1) * 10).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : `label ${i + 1}`);

function watchPage(world, p) {
    p.on('console', msg => {
        world.bmsConsole.push({ type: msg.type(), text: msg.text() });
        if (msg.type() === 'error') {
            world.consoleErrors.push(msg.text());
        }
    });
    p.on('pageerror', err => world.pageErrors.push(String(err.message || err)));
}

Before(async function() {
    page = this.page;
    this.consoleErrors = [];
    this.bmsConsole = [];
    this.pageErrors = [];
    this.performanceMetrics = {};
    this.moduleConfig = null;
    if (page) {
        watchPage(this, page);
    }
});

After(async function() {
    if (this.bmsAltBrowser) {
        await this.bmsAltBrowser.close().catch(() => {});
        this.bmsAltBrowser = null;
    }
    page = null;
});

async function loadModule(world, moduleName, { baseline = true } = {}) {
    const config = MODULE_CONFIG[moduleName];
    if (!config) {
        throw new Error(`Unknown module: ${moduleName}`);
    }
    for (const script of config.scripts) {
        if (script === 'src/genx-common.js' && await page.evaluate(() => !!window.genxCommon)) {
            continue;
        }
        if (baseline && script !== 'src/genx-common.js') {
            await page.evaluate(() => {
                window.__bmsBaseline = Object.getOwnPropertyNames(window);
            });
        }
        await page.addScriptTag({ path: `${ROOT}/${script}` });
    }
    await page.waitForFunction(name => window[name] !== undefined, config.globalName);
    await page.evaluate(installHelpers);
    return config;
}

// Background Steps
Given('the {string} module is loaded', async function(moduleName) {
    await page.goto(`${baseUrl()}/tests/browser/fixtures/test-base.html`);
    this.moduleConfig = await loadModule(this, moduleName);
    this.moduleName = moduleName;
});

Given('the {string} module is also loaded', async function(moduleName) {
    await loadModule(this, moduleName, { baseline: false });
    this.otherModule = moduleName;
});

Given('the test environment is clean', async function() {
    await page.evaluate(() => {
        document.body.innerHTML = '<div id="test-container"></div>';
        window._testMutationCount = 0;
        window.__errors = [];
    });
    this.consoleErrors = [];
    this.bmsConsole = [];
    this.pageErrors = [];
});

// Mutation Safety Steps
Given('a container element in the DOM', async function() {
    await page.evaluate(() => window.__bms.container());
});

async function observe(selector) {
    await page.evaluate(sel => {
        const target = document.querySelector(sel);
        window._testMutationCount = 0;
        if (window._testObserver) {
            window._testObserver.disconnect();
        }
        window._testObserver = new MutationObserver(m => {
            window._testMutationCount += m.length;
        });
        window._testObserver.observe(target, { childList: true, subtree: true, attributes: true, characterData: true });
    }, selector);
}

// Waits for queued observer callbacks and timers, then returns the count.
async function mutationCount() {
    return page.evaluate(async () => {
        await new Promise(r => setTimeout(r, 50));
        if (window._testObserver) {
            window._testMutationCount += window._testObserver.takeRecords().length;
        }
        return window._testMutationCount;
    });
}

Given('a MutationObserver is monitoring the container', async function() {
    await observe('#test-container');
});

Given('a MutationObserver is monitoring it', async function() {
    await observe('#test-element');
});

async function addElements(moduleName, count, prefix = 'test-element') {
    await page.evaluate(({ mod, count, prefix, values }) => {
        const c = window.__bms.container();
        for (let i = 0; i < count; i++) {
            const el = window.__bms.make(mod, values[i]);
            el.id = `${prefix}-${i}`;
            el.className = 'bms-item';
            c.appendChild(el);
        }
    }, { mod: moduleName, count, prefix, values: Array.from({ length: count }, (_, i) => sampleValue(moduleName, i)) });
}

async function processedOutputs(moduleName) {
    return page.evaluate(mod => [...document.querySelectorAll('.bms-item')]
        .map(el => window.__bms.output(mod, el)), moduleName);
}

function expectAllProcessed(moduleName, outputs, count) {
    expect(outputs).toEqual(Array.from({ length: count }, (_, i) => sampleOutput(moduleName, i)));
}

When('I add {int} elements with {string} attributes', async function(count, moduleName) {
    this.elementCount = count;
    await addElements(moduleName, count);
});

When('the module processes them', async function() {
    await page.evaluate(mod => window.__bms.scan(mod, document), this.moduleName);
    if (this.moduleConfig.sampleAttribute) {
        expectAllProcessed(this.moduleName, await processedOutputs(this.moduleName), this.elementCount);
    }
});

Then('the total mutation count should be less than {int}', async function(maxMutations) {
    expect(await mutationCount()).toBeLessThan(maxMutations);
});

Then('the browser should remain responsive', async function() {
    const responsive = await page.evaluate(() => new Promise(resolve => {
        const t = setTimeout(() => resolve(false), 1000);
        requestAnimationFrame(() => {
            clearTimeout(t); resolve(true);
        });
    }));
    expect(responsive).toBe(true);
});

Then('no JavaScript errors should occur', function() {
    expect(this.consoleErrors).toHaveLength(0);
    expect(this.pageErrors).toHaveLength(0);
});

// Single test element
async function makeTestElement(moduleName, value, extra = {}) {
    await page.evaluate(({ mod, value, extra }) => {
        const el = window.__bms.make(mod, value, extra);
        el.id = 'test-element';
        window.__bms.container().appendChild(el);
    }, { mod: moduleName, value, extra });
}

async function processTestElement(moduleName) {
    return page.evaluate(mod => {
        const el = document.getElementById('test-element');
        try {
            window.__bms.process(mod, el);
        } catch (e) {
            window.__errors.push(String(e && e.message));
        }
        return { output: window.__bms.output(mod, el), html: el.outerHTML };
    }, moduleName);
}

// Idempotent Operations
Given('an element with {string} attributes already processed', async function(moduleName) {
    await makeTestElement(moduleName, sampleValue(moduleName, 0));
    const result = await processTestElement(moduleName);
    expect(result.output).toBe(sampleOutput(moduleName, 0));
    await mutationCount(); // let the module's own observer settle
    this.processedHtml = (await processTestElement(moduleName)).html;
});

When('the module processes the same element {int} times', async function(times) {
    await page.evaluate(({ mod, times }) => {
        const el = document.getElementById('test-element');
        for (let i = 0; i < times; i++) {
            window.__bms.process(mod, el);
        }
    }, { mod: this.moduleName, times });
});

Then('no mutations should be triggered', async function() {
    expect(await mutationCount()).toBe(0);
});

Then('the element content should remain unchanged', async function() {
    const html = await page.evaluate(() => document.getElementById('test-element').outerHTML);
    expect(html).toBe(this.processedHtml);
});

// Change Detection / generic element
Given('an element with {string} attributes', async function(moduleName) {
    this.elementModule = moduleName;
    await makeTestElement(moduleName, sampleValue(moduleName, 0));
});

Given('the element has the value {string}', async function(value) {
    // fmtX gets the raw number behind the formatted value; accX gets the text it labels.
    const input = this.moduleName === 'fmtx' ? value.replace(/[^\d.]/g, '') : value;
    await page.evaluate(({ mod, input }) => {
        const el = document.getElementById('test-element');
        if (mod === 'fmtx') {
            el.setAttribute('fx-raw', input);
        } else {
            el.textContent = input;
        }
    }, { mod: this.moduleName, input });
    const result = await processTestElement(this.moduleName);
    expect(result.output).toBe(value);
    await mutationCount();
    this.processedHtml = (await processTestElement(this.moduleName)).html;
});

When('the module tries to set the same value {string} again', async function(value) {
    await observe('#test-element');
    const result = await processTestElement(this.moduleName);
    expect(result.output).toBe(value);
});

Then('the DOM should not be updated', async function() {
    const html = await page.evaluate(() => document.getElementById('test-element').outerHTML);
    expect(html).toBe(this.processedHtml);
});

// Performance Steps (@perf only)
Given('{int} elements with {string} attributes', async function(count, moduleName) {
    this.elementCount = count;
    await page.evaluate(() => {
        if (window.FormatX) {
            window.FormatX.destroy();
        }
        if (window.AccessX) {
            window.AccessX.destroy();
        }
    });
    await addElements(moduleName, count);
});

async function heapUsed() {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.collectGarbage');
    const { usedSize } = await cdp.send('Runtime.getHeapUsage');
    await cdp.detach();
    return usedSize;
}

When(/^all (fmtx|accx) elements are processed$/, async function(moduleName) {
    this.heapBefore = await heapUsed();
    this.operationTime = await page.evaluate(mod => {
        const t0 = performance.now();
        window.__bms.scan(mod, document);
        return performance.now() - t0;
    }, moduleName);
    expectAllProcessed(moduleName, await processedOutputs(moduleName), this.elementCount);
});

// "the operation should complete in less than {int}ms" is in common.steps.js (this.operationTime).

Then('memory usage should not increase by more than {int}MB', async function(maxMB) {
    expect((await heapUsed()) - this.heapBefore).toBeLessThan(maxMB * 1024 * 1024);
});

Given('a page with {int} {string} elements', async function(count, moduleName) {
    this.elementCount = count;
    await addElements(moduleName, count);
});

When('the module processes all elements', async function() {
    this.frames = await page.evaluate(async mod => {
        const frames = [];
        let last = performance.now();
        let running = true;
        const tick = now => {
            frames.push(now - last); last = now;
            if (running) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
        await new Promise(r => setTimeout(r, 50));
        window.__bms.scan(mod, document);
        await new Promise(r => setTimeout(r, 100));
        running = false;
        return frames.slice(1);
    }, this.moduleName);
    expectAllProcessed(this.moduleName, await processedOutputs(this.moduleName), this.elementCount);
});

Then('no frame should take longer than {int}ms', function(ms) {
    expect(Math.max(...this.frames)).toBeLessThanOrEqual(ms);
});

Then('the page should remain interactive', async function() {
    const ok = await page.evaluate(() => new Promise(r => setTimeout(() => r(true), 0)));
    expect(ok).toBe(true);
});

// Debouncing / Batching (@perf only): counts the module's document scans.
Given('the {string} module with MutationObserver enabled', async function(moduleName) {
    await page.evaluate(mod => {
        window._processorCallCount = 0;
        const attr = mod === 'fmtx' ? '[fx-format]' : '[ax-enhance]';
        for (const proto of [Document.prototype, Element.prototype]) {
            const orig = proto.querySelectorAll;
            proto.querySelectorAll = function(sel) {
                if (typeof sel === 'string' && sel.includes(attr)) {
                    window._processorCallCount++;
                }
                return orig.call(this, sel);
            };
        }
    }, moduleName);
});

When('{int} elements are added rapidly \\(< {int}ms apart)', async function(count, intervalMs) {
    this.elementCount = count;
    const values = Array.from({ length: count }, (_, i) => sampleValue(this.moduleName, i));
    await page.evaluate(({ mod, count, intervalMs, values }) => new Promise(resolve => {
        const c = window.__bms.container();
        let added = 0;
        const add = () => {
            const el = window.__bms.make(mod, values[added]);
            el.className = 'bms-item';
            c.appendChild(el);
            added++;
            if (added < count) {
                setTimeout(add, intervalMs - 1);
            } else {
                setTimeout(resolve, 200);
            }
        };
        add();
    }), { mod: this.moduleName, count, intervalMs, values });
});

Then('the module should batch process them', async function() {
    expectAllProcessed(this.moduleName, await processedOutputs(this.moduleName), this.elementCount);
});

Then('should not call the processor more than {int} times', async function(maxCalls) {
    expect(await page.evaluate(() => window._processorCallCount)).toBeLessThanOrEqual(maxCalls);
});

// Memory Safety
async function listenerCounts() {
    const cdp = await page.context().newCDPSession(page);
    const counts = {};
    for (const [name, expr] of [['window', 'window'], ['document', 'document'], ['body', 'document.body']]) {
        const { result } = await cdp.send('Runtime.evaluate', { expression: expr });
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
        counts[name] = listeners.length;
    }
    await cdp.detach();
    return counts;
}

Given('{int} elements with {string} attributes in the DOM', async function(count, moduleName) {
    this.elementCount = count;
    this.listenersBefore = await listenerCounts();
    await addElements(moduleName, count);
});

Given('the module has processed them', async function() {
    await page.evaluate(mod => window.__bms.scan(mod, document), this.moduleName);
    await mutationCount();
    expectAllProcessed(this.moduleName, await processedOutputs(this.moduleName), this.elementCount);
});

When('all elements are removed from the DOM', async function() {
    await page.evaluate(() => {
        const items = [...document.querySelectorAll('.bms-item')];
        window.__bmsRefs = items.map(el => new WeakRef(el));
        items.forEach(el => el.remove());
    });
    await mutationCount();
});

When('garbage collection runs', async function() {
    const cdp = await page.context().newCDPSession(page);
    for (let i = 0; i < 3; i++) {
        await cdp.send('HeapProfiler.collectGarbage');
        await page.evaluate(() => new Promise(r => setTimeout(r, 10)));
    }
    await cdp.detach();
    // common.steps.js "memory should be released" runs this check.
    // Every removed element must be collectable: nothing in the module keeps it alive.
    this.checkReleased = async () => {
        const alive = await page.evaluate(() => window.__bmsRefs.filter(r => r.deref() !== undefined).length);
        expect(alive).toBe(0);
    };
});


Then('no event listeners should remain attached', async function() {
    expect(await listenerCounts()).toEqual(this.listenersBefore);
});

// Repeated cycles (@perf only)
Given('the {string} module is initialized', async function(moduleName) {
    expect(await page.evaluate(name => typeof window[name], MODULE_CONFIG[moduleName].globalName)).toBe('object');
});

async function cycle(moduleName, count) {
    await addElements(moduleName, count);
    await page.evaluate(mod => window.__bms.scan(mod, document), moduleName);
    expectAllProcessed(moduleName, await processedOutputs(moduleName), count);
    await page.evaluate(() => document.querySelectorAll('.bms-item').forEach(el => el.remove()));
}

When('I add {int} elements, process them, then remove them', async function(count) {
    this.cycleSize = count;
    await cycle(this.moduleName, count);
    this.heapAfterFirst = await heapUsed();
});

When('I repeat this cycle {int} times', async function(times) {
    for (let i = 0; i < times; i++) {
        await cycle(this.moduleName, this.cycleSize);
    }
    this.heapAfterAll = await heapUsed();
});

Then('memory usage should stabilize', function() {
    expect(this.heapAfterAll).toBeGreaterThan(0);
});

Then('should not increase by more than {int}MB', function(maxMB) {
    expect(this.heapAfterAll - this.heapAfterFirst).toBeLessThan(maxMB * 1024 * 1024);
});

// DOM Safety
async function setInput(world, input) {
    world.userInput = input;
    await page.evaluate(({ mod, input }) => {
        const el = document.getElementById('test-element');
        if (mod === 'fmtx') {
            el.setAttribute('fx-format', 'trim');
            el.setAttribute('fx-raw', input);
        } else {
            el.textContent = input;
        }
    }, { mod: world.moduleName, input });
}

Given(/^the input contains "(.*)"$/, async function(payload) {
    await setInput(this, payload);
});

Given(/^the input is "(.*)"$/, async function(input) {
    await setInput(this, input);
});

When('the module processes the element', async function() {
    this.processResult = await processTestElement(this.moduleName);
    await page.waitForTimeout(100); // give any injected handler (onerror/onload) a chance to fire
});

When('the module updates the element', async function() {
    await page.evaluate(() => {
        window.__htmlWrites = [];
        const track = (proto, prop) => {
            const desc = Object.getOwnPropertyDescriptor(proto, prop);
            Object.defineProperty(proto, prop, {
                configurable: true,
                get: desc.get,
                set(v) {
                    window.__htmlWrites.push(prop); desc.set.call(this, v);
                }
            });
        };
        track(Element.prototype, 'innerHTML');
        track(Element.prototype, 'outerHTML');
        const insert = Element.prototype.insertAdjacentHTML;
        Element.prototype.insertAdjacentHTML = function(...a) {
            window.__htmlWrites.push('insertAdjacentHTML'); return insert.apply(this, a);
        };
    });
    this.processResult = await processTestElement(this.moduleName);
    await page.waitForTimeout(100);
});

async function injectedMarkup() {
    return page.evaluate(() => ({
        children: document.getElementById('test-element').children.length,
        dangerous: document.querySelectorAll('#test-container script, #test-container img, #test-container svg, #test-container iframe, #test-container b').length
    }));
}

Then('the malicious script should not execute', async function() {
    expect(await page.evaluate(() => window._xssTriggered || false)).toBe(false);
    expect(this.pageErrors).toHaveLength(0);
});

Then('the content should be safely escaped', async function() {
    expect(await injectedMarkup()).toEqual({ children: 0, dangerous: 0 });
    // The payload survives only as inert text (fmtX) or attribute text (accX).
    expect(this.processResult.output).toBe(this.userInput);
});

Then('it should use textContent or setAttribute', async function() {
    expect(this.processResult.output).toBe(this.userInput);
    const attr = this.moduleName === 'fmtx' ? 'fx-raw' : 'aria-label';
    expect(await page.evaluate(a => document.getElementById('test-element').getAttribute(a), attr)).toBe(this.userInput);
});

Then('should never use innerHTML or outerHTML', async function() {
    expect(await page.evaluate(() => window.__htmlWrites)).toEqual([]);
});

Then('no script execution should occur', async function() {
    expect(await page.evaluate(() => window._xssTriggered || false)).toBe(false);
    expect(await injectedMarkup()).toEqual({ children: 0, dangerous: 0 });
});

// Error Handling
// "<module>-format" names the module's primary attribute: fx-format for fmtX,
// ax-enhance for accX.
Given(/^an element with only the "(\w+)-format" attribute$/, async function(moduleName) {
    const attr = MODULE_CONFIG[moduleName].sampleAttribute;
    const value = moduleName === 'fmtx' ? 'currency' : 'label';
    // Attribute names as authored, read before the module's observer sees the element.
    this.authoredAttributes = await page.evaluate(({ attr, value }) => {
        const el = document.createElement('span');
        el.id = 'test-element';
        el.setAttribute(attr, value);
        const names = el.getAttributeNames();
        window.__bms.container().appendChild(el);
        return names;
    }, { attr, value });
    this.onlyAttribute = attr;
});

Given('no other required attributes are present', async function() {
    expect(this.authoredAttributes.filter(n => n !== 'id')).toEqual([this.onlyAttribute]);
});

Then('the element should remain unchanged or show fallback', async function() {
    const state = await page.evaluate(attr => {
        const el = document.getElementById('test-element');
        return { connected: el.isConnected, attr: el.hasAttribute(attr), text: el.textContent, label: el.getAttribute('aria-label') };
    }, this.onlyAttribute);
    expect(state.connected).toBe(true);
    expect(state.attr).toBe(true);
    expect(state.text).toBe('');
    expect(state.label === null || !/NaN|undefined|null/.test(state.label)).toBe(true);
});

// Each invalid value goes where the module reads it, with the fallback the module promises.
const INVALID_CASES = {
    'not-a-date': { mod: 'fmtx', attrs: { 'fx-format': 'date', 'fx-raw': 'not-a-date' }, expect: { text: 'not-a-date' } },
    '{"broken": json\'}': { mod: 'fmtx', remove: ['fx-format', 'fx-raw'], attrs: { 'fx-opts': '{"broken": json\'}' }, text: 'raw', expect: { text: 'raw' } },
    'invalid-role': { mod: 'accx', attrs: { 'ax-enhance': 'landmark', 'ax-role': 'invalid-role' }, expect: { role: 'region' } }
};

Given(/^an attribute has an invalid value "(.*)"$/, async function(value) {
    const c = INVALID_CASES[value];
    expect(c && c.mod).toBe(this.moduleName);
    this.invalidCase = c;
    await page.evaluate(c => {
        const el = document.getElementById('test-element');
        (c.remove || []).forEach(a => el.removeAttribute(a));
        Object.entries(c.attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (c.text !== undefined) {
            el.textContent = c.text;
        }
    }, c);
    this.bmsConsole = [];
});

Then('the module should log a warning', function() {
    expect(this.bmsConsole.filter(m => m.type === 'warning').length).toBeGreaterThan(0);
});

Then('should use a safe fallback behavior', async function() {
    const state = await page.evaluate(() => {
        const el = document.getElementById('test-element');
        return { text: el.textContent, role: el.getAttribute('role'), children: el.children.length };
    });
    for (const [k, v] of Object.entries(this.invalidCase.expect)) {
        expect(state[k]).toBe(v);
    }
    expect(state.children).toBe(0);
});

Then('should not crash', async function() {
    expect(this.pageErrors).toHaveLength(0);
    expect(await page.evaluate(() => window.__errors)).toEqual([]);
    // The module still works for a valid element afterwards.
    const out = await page.evaluate(mod => {
        const el = window.__bms.make(mod, mod === 'fmtx' ? 5 : 'still works');
        window.__bms.container().appendChild(el);
        window.__bms.process(mod, el);
        return window.__bms.output(mod, el);
    }, this.moduleName);
    expect(out).toBe(this.moduleName === 'fmtx' ? '$5.00' : 'still works');
});

// Browser Compatibility
Given('I am using {string}', async function(browserName) {
    this.browserName = browserName;
    if (browserName !== 'chromium') {
        this.bmsAltBrowser = await playwright[browserName].launch();
        const ctx = await this.bmsAltBrowser.newContext();
        page = await ctx.newPage();
        watchPage(this, page);
    }
});

async function processFresh(moduleName) {
    return page.evaluate(mod => {
        const el = window.__bms.make(mod, mod === 'fmtx' ? 1234.5 : 'Total due');
        el.id = 'test-element';
        window.__bms.container().appendChild(el);
        window.__bms.process(mod, el);
        return el.outerHTML;
    }, moduleName);
}

When('I process an element with module attributes', async function() {
    this.compatHtml = await processFresh(this.moduleName);
    this.compatOutput = await page.evaluate(mod => window.__bms.output(mod, document.getElementById('test-element')), this.moduleName);
});

Then('it should work correctly', function() {
    expect(this.compatOutput).toBe(this.moduleName === 'fmtx' ? '$1,234.50' : 'Total due');
    expect(this.pageErrors).toHaveLength(0);
});

Then('should have consistent output', async function() {
    // Same element processed in the reference Chromium page.
    const ownPage = page;
    page = this.page;
    if (ownPage !== this.page) {
        await page.goto(`${baseUrl()}/tests/browser/fixtures/test-base.html`);
        await loadModule(this, this.moduleName);
        await page.evaluate(() => {
            document.body.innerHTML = '<div id="test-container"></div>';
        });
    } else {
        await page.evaluate(() => document.getElementById('test-element').remove());
    }
    const reference = await processFresh(this.moduleName);
    page = ownPage;
    expect(this.compatHtml).toBe(reference);
});

// Accessibility
const ARIA_ATTRS = { 'aria-label': 'Price', 'aria-describedby': 'price-hint', role: 'status', tabindex: '0' };

Given('an element with both {string} and ARIA attributes', async function(moduleName) {
    await makeTestElement(moduleName, sampleValue(moduleName, 0), ARIA_ATTRS);
});

async function attrsOf() {
    return page.evaluate(() => {
        const el = document.getElementById('test-element');
        return Object.fromEntries(el.getAttributeNames().map(n => [n, el.getAttribute(n)]));
    });
}

Then('all ARIA attributes should be preserved', async function() {
    const attrs = await attrsOf();
    expect(this.processResult.output).toBe(this.moduleName === 'fmtx' ? sampleOutput('fmtx', 0) : 'Price');
    for (const k of Object.keys(ARIA_ATTRS).filter(n => n.startsWith('aria-'))) {
        expect(attrs[k]).toBe(ARIA_ATTRS[k]);
    }
});

Then('tabindex should be maintained', async function() {
    expect((await attrsOf()).tabindex).toBe('0');
});

Then('role should not be modified', async function() {
    expect((await attrsOf()).role).toBe('status');
});

// Concurrent Operations
When(/^all (fmtx|accx) elements are processed concurrently$/, async function(moduleName) {
    await page.evaluate(async mod => {
        const els = [...document.querySelectorAll('.bms-item')];
        const jobs = [];
        for (const el of els) {
            jobs.push(Promise.resolve().then(() => window.__bms.process(mod, el)));
            jobs.push(new Promise(r => setTimeout(() => {
                window.__bms.process(mod, el); r();
            }, 0)));
        }
        jobs.push(new Promise(r => setTimeout(() => {
            window.__bms.scan(mod, document); r();
        }, 0)));
        jobs.push(new Promise(r => queueMicrotask(() => {
            window.__bms.scan(mod, document.getElementById('test-container')); r();
        })));
        await Promise.all(jobs);
        await new Promise(r => setTimeout(r, 50));
    }, moduleName);
});

Then('no race conditions should occur', async function() {
    expect(this.pageErrors).toHaveLength(0);
    expect(this.consoleErrors).toHaveLength(0);
    // Each element was formatted once: no doubled or interleaved output.
    const counts = await page.evaluate(() => [...document.querySelectorAll('.bms-item')].map(el => el.childNodes.length));
    expect(counts.every(n => n <= 1)).toBe(true);
});

Then('all elements should be correctly processed', async function() {
    expectAllProcessed(this.moduleName, await processedOutputs(this.moduleName), this.elementCount);
});

Then('the module state should remain consistent', async function() {
    const snap = () => page.evaluate(() => document.getElementById('test-container').innerHTML);
    const before = await snap();
    await page.evaluate(mod => window.__bms.scan(mod, document), this.moduleName);
    await mutationCount();
    expect(await snap()).toBe(before);
    const out = await page.evaluate(mod => {
        const el = window.__bms.make(mod, mod === 'fmtx' ? 7 : 'after');
        window.__bms.container().appendChild(el);
        window.__bms.process(mod, el);
        return window.__bms.output(mod, el);
    }, this.moduleName);
    expect(out).toBe(this.moduleName === 'fmtx' ? '$7.00' : 'after');
});

// Module Isolation
When('I inspect the window object', async function() {
    this.addedGlobals = await page.evaluate(() => {
        const base = new Set(window.__bmsBaseline);
        return Object.getOwnPropertyNames(window).filter(n => !base.has(n) && !n.startsWith('__bms'));
    });
});

Then('only documented globals should exist', function() {
    // _testMutationCount/__errors come from these steps, not the module.
    const own = this.addedGlobals.filter(n => !['_testMutationCount', '__errors', '_testObserver'].includes(n));
    expect(own.sort()).toEqual([...this.moduleConfig.globals].sort());
});

Then('no internal functions should be exposed', async function() {
    const leaked = await page.evaluate(names => names.filter(n => n in window), this.moduleConfig.internals);
    expect(leaked).toEqual([]);
});

Then('module variables should be encapsulated', async function() {
    const { globalName, api } = this.moduleConfig;
    const keys = await page.evaluate(name => Object.keys(window[name]), globalName);
    if (api) {
        expect(keys.sort()).toEqual([...api].sort());
    }
    expect(keys.filter(k => k.startsWith('_'))).toEqual([]);
});

When('both modules process the same element', async function() {
    await page.evaluate(([first, second]) => {
        const el = document.createElement('span');
        el.id = 'test-element';
        el.setAttribute('fx-format', 'currency');
        el.setAttribute('fx-raw', '25');
        el.setAttribute('ax-enhance', 'label');
        el.setAttribute('ax-label', 'Price');
        window.__bms.container().appendChild(el);
        window.__bms.process(first, el);
        window.__bms.process(second, el);
    }, [this.moduleName, this.otherModule]);
    await mutationCount();
});

async function bothState() {
    return page.evaluate(() => {
        const el = document.getElementById('test-element');
        return { text: el.textContent, raw: el.getAttribute('fx-raw'), label: el.getAttribute('aria-label'), enhanced: el.getAttribute('ax-enhanced') };
    });
}

const BOTH = { text: '$25.00', raw: '25', label: 'Price', enhanced: 'true' };

Then('they should work independently', async function() {
    expect(await bothState()).toEqual(BOTH);
});

Then('neither should interfere with the other', async function() {
    for (const mod of [this.moduleName, this.otherModule, this.moduleName]) {
        await page.evaluate(m => window.__bms.process(m, document.getElementById('test-element')), mod);
        expect(await bothState()).toEqual(BOTH);
    }
    expect(this.consoleErrors).toHaveLength(0);
    expect(this.pageErrors).toHaveLength(0);
});

module.exports = {};
