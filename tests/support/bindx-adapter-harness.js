/**
 * Harness for the bindX framework adapter features (React, Vue, Svelte, Angular).
 *
 * The adapters are TypeScript sources (src/bindx-*.ts) that read bindX core from a
 * global. This harness compiles one with esbuild into node_modules/.cache, gives it
 * a fresh bindX core from src/bindx.js, and runs it in Node against a jsdom
 * document, so the scenarios exercise the real adapter and the real framework.
 */
const path = require('path');
const fs = require('fs');
const { After } = require('@cucumber/cucumber');

const ROOT = path.resolve(__dirname, '../..');
// Inside node_modules so the bundle resolves react, vue, svelte, rxjs from the repo
const OUT_DIR = path.join(ROOT, 'node_modules', '.cache', 'genx-bindx-adapters');
const CORE = path.join(ROOT, 'src', 'bindx.js');
const built = {};

const DOM_GLOBALS = [
    'window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement',
    'HTMLSelectElement', 'HTMLTextAreaElement', 'SVGElement', 'Text', 'Comment',
    'DocumentFragment', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'InputEvent',
    'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
    'Document', 'HTMLTemplateElement', 'HTMLButtonElement', 'HTMLFormElement', 'ShadowRoot', 'Range',
    'FocusEvent', 'TransitionEvent', 'AnimationEvent', 'NodeList', 'HTMLCollection'
];

// Frameworks that capture `document` when first required; reloaded per scenario
const DOM_BOUND_PACKAGES = {
    vue: /[\\/]node_modules[\\/](vue|@vue)[\\/]/,
    svelte: /[\\/]node_modules[\\/]svelte[\\/]/
};

function buildAdapter(name) {
    if (built[name]) return built[name];
    const esbuild = require('esbuild');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outfile = path.join(OUT_DIR, `bindx-${name}.cjs`);
    esbuild.buildSync({
        entryPoints: [path.join(ROOT, 'src', `bindx-${name}.ts`)],
        outfile,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        target: 'node18',
        // Frameworks load from node_modules so tests and adapter share one copy
        packages: 'external',
        logLevel: 'silent',
        tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } }
    });
    built[name] = outfile;
    return outfile;
}

function installDom(world) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
        pretendToBeVisual: true,
        url: 'http://localhost/'
    });
    const saved = {};
    for (const key of DOM_GLOBALS) {
        saved[key] = Object.getOwnPropertyDescriptor(globalThis, key);
        const value = key === 'window' ? dom.window : dom.window[key];
        Object.defineProperty(globalThis, key, {
            value: typeof value === 'function' && /^[a-z]/.test(key) ? value.bind(dom.window) : value,
            configurable: true,
            writable: true
        });
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    world._adapterTeardown.push(() => {
        for (const key of DOM_GLOBALS) {
            if (saved[key]) Object.defineProperty(globalThis, key, saved[key]);
            else delete globalThis[key];
        }
        delete globalThis.IS_REACT_ACT_ENVIRONMENT;
        dom.window.close();
    });
    return dom;
}

/** Fresh bindX core per scenario: its path subscribers are module-level state. */
function loadCore() {
    delete require.cache[require.resolve(CORE)];
    const core = require(CORE);
    globalThis.bindX = core;
    return core;
}

function loadAdapter(name) {
    const file = buildAdapter(name);
    delete require.cache[file];
    return require(file);
}

/**
 * Set up an adapter scenario on the cucumber world. Returns world.ad with
 * { core, adapter, dom, errors, logs } and framework helpers added by the steps.
 */
function setupAdapter(world, name) {
    if (world.ad && world.ad.name === name) return world.ad;
    world._adapterTeardown = world._adapterTeardown || [];
    const dom = installDom(world);
    const core = loadCore();
    // Core logs each update in development; keep it out of the test output
    const { log: consoleLog, debug: consoleDebug } = console;
    const quiet = (original) => (...args) => {
        if (typeof args[0] === 'string' && args[0].startsWith('bindX:')) return;
        original(...args);
    };
    console.log = quiet(consoleLog);
    console.debug = quiet(consoleDebug);
    world._adapterTeardown.push(() => {
        console.log = consoleLog;
        console.debug = consoleDebug;
        delete globalThis.bindX;
    });
    const domBound = DOM_BOUND_PACKAGES[name];
    if (domBound) {
        for (const key of Object.keys(require.cache)) {
            if (domBound.test(key)) delete require.cache[key];
        }
    }
    const adapter = loadAdapter(name);
    world.ad = { name, core, adapter, dom, errors: [], cleanups: [] };
    return world.ad;
}

/** Wait for queued microtasks and timers (Vue's scheduler, Svelte stores, promises). */
function flush(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

After(async function() {
    if (this.ad) {
        for (const cleanup of this.ad.cleanups.reverse()) {
            try { await cleanup(); } catch (e) { /* already torn down */ }
        }
    }
    for (const teardown of (this._adapterTeardown || []).reverse()) {
        try { teardown(); } catch (e) { /* ignore */ }
    }
    this._adapterTeardown = [];
    this.ad = null;
});

// Anchored regex for a literal step text (texts contain { } ( ) and /)
const re = (text) => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '$');

/*
 * The four adapter features share many step texts ("the state should be reactive")
 * that mean different code per framework. Cucumber step definitions are global,
 * so each adapter's steps file registers through adapterSteps(framework): the
 * first file to use a pattern defines one Cucumber step that dispatches on the
 * scenario's adapter (world.ad.name). A pattern with a single implementation
 * runs it directly only before world.ad is set (the package steps).
 */
const sharedSteps = new Map();

function adapterSteps(framework) {
    const cucumber = require('@cucumber/cucumber');
    const define = (keyword) => (pattern, ...rest) => {
        const fn = rest.pop();
        const key = pattern instanceof RegExp ? `re:${pattern.source}` : `ce:${pattern}`;
        let entry = sharedSteps.get(key);
        if (!entry) {
            entry = { impls: {} };
            sharedSteps.set(key, entry);
            const dispatch = function(...args) {
                const names = Object.keys(entry.impls);
                const name = this.ad ? this.ad.name : names.length === 1 ? names[0] : undefined;
                // Once a scenario has an adapter, never fall back to another framework's code
                const impl = this.ad ? entry.impls[name] : entry.impls[name] || (names.length === 1 ? entry.impls[names[0]] : undefined);
                if (!impl) {
                    throw new Error(`step ${pattern} has no ${name || 'adapter'} implementation (has: ${names.join(', ')})`);
                }
                return impl.apply(this, args);
            };
            // Cucumber checks the arity against the pattern's parameters
            Object.defineProperty(dispatch, 'length', { value: fn.length });
            cucumber[keyword](pattern, ...rest, dispatch);
        }
        if (entry.impls[framework]) throw new Error(`duplicate ${framework} step ${pattern}`);
        entry.impls[framework] = fn;
    };
    return { Given: define('Given'), When: define('When'), Then: define('Then') };
}

module.exports = { setupAdapter, flush, buildAdapter, adapterSteps, re };
