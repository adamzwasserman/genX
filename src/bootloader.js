/**
 * genx.software Universal Bootloader
 * @version 2.0.0
 *
 * Loads genx modules on-demand after first paint, maintaining 0ms TBT.
 * Scans DOM for declarative attributes and dynamically loads only required modules.
 *
 * Principles applied:
 * - Dict-Lookup Polymorphism: dispatch tables, no if/else chains
 * - Pure Functions: scan, detect, parse are input-in/output-out
 * - I/O at the Boundary: perf logging only in bootstrap, not in core functions
 * - Configuration as Parameters: config passed explicitly, not read from globals mid-function
 * - Flat Composition: bootstrap is a pipeline of pure steps
 */
(function() {
    'use strict';

    // --- Dispatch Tables (Dict-Lookup Polymorphism) ---

    const defaultModules = {
        'fx': '/fmtx.min.js',  'ax': '/accx.min.js',  'bx': '/bindx.min.js',
        'dx': '/dragx.min.js', 'lx': '/loadx.min.js',  'tx': '/tablex.min.js',
        'nx': '/navx.min.js',  'sx': '/smartx.min.js',  'ux': '/uix.min.js'
    };

    const CLASS_PREFIX_MAP = (window.genxCommon?.notation?.CLASS_PREFIX_MAP) || {
        'fmt': 'fx', 'acc': 'ax', 'bind': 'bx', 'drag': 'dx',
        'load': 'lx', 'table': 'tx', 'nav': 'nx', 'ui': 'ux'
    };

    const MODULE_ENTRY_ATTRS = {
        'fx': ['fx-format'],
        'ax': ['ax-enhance'],
        'bx': ['bx-model', 'bx-bind', 'bx-if', 'bx-show', 'bx-for', 'bx-form'],
        'dx': ['dx-draggable', 'dx-drop-zone'],
        'lx': ['lx-strategy', 'lx-loading'],
        'tx': ['tx-sortable'],
        'nx': ['nx-tabs', 'nx-dropdown', 'nx-breadcrumb', 'nx-mobile', 'nx-scroll-spy', 'nx-sticky', 'nx-nav'],
        'ux': ['ux-enhance']
    };

    // Parser priority order — dict-lookup replaces 4 if-blocks
    const PARSER_PRIORITY = ['json', 'colon', 'verbose', 'class'];

    const defaultParserUrls = {
        verbose: '/parsers/genx-parser-verbose.js',
        colon: '/parsers/genx-parser-colon.js',
        json: '/parsers/genx-parser-json.js',
        class: '/parsers/genx-parser-class.js'
    };

    // --- Configuration as Parameters (read once at boundary) ---

    const config = window.genxConfig || {};
    const modules = { ...defaultModules, ...config.modulePaths };
    const CDN_BASE = config.cdn || 'https://cdn.genx.software/v1';
    const PARSER_URLS = { ...defaultParserUrls, ...config.parserPaths };

    // --- Minimal State ---

    const loaded = new Set();
    const pending = new Set();
    const factories = {};
    const moduleApis = {};           // prefix → api returned by factory.init/autoInit (exposes scan/destroy/etc)
    const parserCache = {};          // loaded parser modules
    const parserPromises = {};       // dedup in-flight parser loads (replaces setInterval polling)
    const parseMap = new WeakMap();   // element → parsed config

    // --- Pure Functions (no I/O, no logging, no side effects) ---

    /** Build unified CSS selector for all genX notations */
    const buildSelector = () => {
        const attrs = Object.values(MODULE_ENTRY_ATTRS).flat().map(a => `[${a}]`);
        const classes = Object.keys(CLASS_PREFIX_MAP).map(p => `[class*="${p}-"]`);
        return [...attrs, ...classes].join(',');
    };

    /** Detect which module prefix an element uses. Pure: element in, string|null out. */
    const detectPrefix = (element) => {
        const attrs = element.attributes;
        for (let i = 0; i < attrs.length; i++) {
            for (const prefix of Object.keys(modules)) {
                if (attrs[i].name.startsWith(prefix + '-')) return prefix;
            }
        }
        for (let i = 0; i < element.classList.length; i++) {
            for (const [cp, mp] of Object.entries(CLASS_PREFIX_MAP)) {
                if (element.classList[i].startsWith(cp + '-')) return mp;
            }
        }
        return null;
    };

    /** Scan DOM, return { needed: Set<string>, elements: Element[] }. Pure over its root. */
    const scan = (root = document) => {
        const elements = Array.from(root.querySelectorAll(buildSelector()));
        const needed = new Set();
        for (const el of elements) {
            const prefix = detectPrefix(el);
            if (prefix) needed.add(prefix);
            if (el.getAttribute('fx-format') === 'smart') needed.add('sx');
        }
        return { needed, elements };
    };

    /** Detect notation styles in elements. Pure: elements in, string[] out. */
    const detectNotationStyles = (elements) => {
        const styles = new Set();
        for (const el of elements) {
            for (const prefix of Object.keys(modules)) {
                for (let i = 0; i < el.attributes.length; i++) {
                    const name = el.attributes[i].name;
                    const value = el.attributes[i].value;
                    if (name.startsWith(prefix + '-')) {
                        styles.add('verbose');
                        if (value && value.includes(':')) styles.add('colon');
                        if (name.endsWith('-opts')) styles.add('json');
                    }
                }
            }
            for (let i = 0; i < el.classList.length; i++) {
                for (const cp of Object.keys(CLASS_PREFIX_MAP)) {
                    if (el.classList[i].startsWith(cp + '-')) { styles.add('class'); break; }
                }
            }
            if (styles.size === 4) break;
        }
        return Array.from(styles).sort();
    };

    /**
     * Parse elements using loaded parsers. Pure over inputs.
     * Dict-lookup: iterates PARSER_PRIORITY array instead of 4 if-blocks.
     */
    const parseElements = (elements, loadedParsers) => {
        let parsed = 0;
        for (const el of elements) {
            if (parseMap.has(el)) continue;
            const prefix = detectPrefix(el);
            if (!prefix) continue;

            let cfg = {};
            for (const style of PARSER_PRIORITY) {
                if (loadedParsers[style]?.parse) {
                    cfg = loadedParsers[style].parse(el, prefix, cfg);
                }
            }

            if (cfg && Object.keys(cfg).length > 0) {
                parseMap.set(el, cfg);
                parsed++;
            }
        }
        return parsed;
    };

    // --- I/O at the Boundary (load, init — the only functions that touch network/DOM) ---

    /** Load a parser module. Promise-cache replaces setInterval polling. */
    const loadParser = (style) => {
        if (parserCache[style]) return Promise.resolve(parserCache[style]);
        if (parserPromises[style]) return parserPromises[style];

        const path = PARSER_URLS[style];
        const url = path.startsWith('http') ? path : CDN_BASE + path;

        parserPromises[style] = import(url)
            .then(mod => { parserCache[style] = mod; return mod; })
            .catch(err => { console.error(`genX: Failed to load ${style} parser from ${url}:`, err); return null; })
            .finally(() => { delete parserPromises[style]; });

        return parserPromises[style];
    };

    /** Load all needed parsers in parallel */
    const loadParsers = async (styles) => {
        const entries = await Promise.all(
            styles.map(async s => [s, await loadParser(s)])
        );
        return Object.fromEntries(entries);
    };

    /** Load a module script. Promise-cache replaces setInterval polling. */
    const load = async (prefix) => {
        if (loaded.has(prefix)) return factories[prefix];
        if (pending.has(prefix)) {
            return new Promise(resolve => {
                const check = () => loaded.has(prefix) ? resolve(factories[prefix]) : setTimeout(check, 10);
                check();
            });
        }

        pending.add(prefix);
        const path = modules[prefix];
        const url = path.startsWith('http') ? path : CDN_BASE + path;

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        if (config.sri?.[prefix]) {
            script.integrity = config.sri[prefix];
            script.crossOrigin = 'anonymous';
        }

        await new Promise((resolve, reject) => {
            script.onload = () => {
                const factoryName = prefix + 'XFactory';
                if (window[factoryName]) {
                    factories[prefix] = window[factoryName];
                    loaded.add(prefix);
                    pending.delete(prefix);
                    resolve();
                } else {
                    reject(new Error(`Module ${prefix} did not expose factory ${factoryName}`));
                }
            };
            script.onerror = () => {
                pending.delete(prefix);
                reject(new Error(`Failed to load module ${prefix} from ${url}`));
            };
            document.head.appendChild(script);
        });

        return factories[prefix];
    };

    const init = async (prefix) => {
        const factory = await load(prefix);
        if (!factory) return null;
        // DATAOS: prefer autoInit (extracts state from DOM) over init (requires pre-built data)
        const moduleConfig = config.modules?.[prefix] || {};
        const api = factory.autoInit
            ? factory.autoInit(document.body, moduleConfig)
            : factory.init
                ? factory.init(moduleConfig)
                : null;
        if (api) moduleApis[prefix] = api;   // Captured so rescan() can drive per-module scanning
        return api;
    };

    // --- Rescan: I/O wrapper around pure functions ---

    const rescan = async (rootOrElements = document) => {
        let elements;
        let root;
        if (Array.isArray(rootOrElements)) {
            elements = rootOrElements.filter(el => el?.nodeType === Node.ELEMENT_NODE);
            root = document;
        } else if (rootOrElements?.nodeType === Node.ELEMENT_NODE || rootOrElements === document) {
            const selector = buildSelector();
            elements = rootOrElements === document
                ? Array.from(document.querySelectorAll(selector))
                : [
                    ...(rootOrElements.matches?.(selector) ? [rootOrElements] : []),
                    ...Array.from(rootOrElements.querySelectorAll(selector))
                  ];
            root = rootOrElements === document ? document : rootOrElements;
        } else {
            return 0;
        }
        if (elements.length === 0) return 0;

        const styles = detectNotationStyles(elements);
        const parsers = await loadParsers(styles);
        const parsed = parseElements(elements, parsers);

        // Drive each loaded module's own scan() so dynamically-injected content
        // is actually formatted/enhanced (not just parsed into parseMap).
        // Without this, `rescan()` was a silent no-op for HTMX/insertAdjacentHTML
        // content — the user-visible bug reported as "fx-format spans inserted
        // after initial load never get formatted".
        for (const prefix of Object.keys(moduleApis)) {
            const api = moduleApis[prefix];
            if (api && typeof api.scan === 'function') {
                try { api.scan(root); } catch (err) {
                    console.error(`genX: ${prefix} scan failed during rescan`, err);
                }
            }
        }

        return parsed;
    };

    // --- Bootstrap: the single boundary where I/O + timing live ---

    const bootstrap = () => {
        requestAnimationFrame(async () => {
            const t0 = performance.now();
            const time = (label, fn) => { const s = performance.now(); const r = fn(); return [r, { [label]: performance.now() - s }]; };

            try {
                // Pipeline: scan → detect → load parsers → parse → init modules → observe
                const [{ needed, elements }, t1] = time('scan', () => scan());
                const [styles, t2] = time('detectStyles', () => detectNotationStyles(elements));

                const parseStart = performance.now();
                const parsers = await loadParsers(styles);
                const t3 = { loadParsers: performance.now() - parseStart };

                const [parsedCount, t4] = time('parseElements', () => parseElements(elements, parsers));

                const initStart = performance.now();
                await Promise.all(
                    Array.from(needed).map(prefix =>
                        init(prefix).catch(err => console.error(`genX: Failed to init ${prefix}`, err))
                    )
                );
                const t5 = { initModules: performance.now() - initStart };

                // Phase 6: domx-bridge delegation
                if (config.observe !== false && window.domxBridge) {
                    window.domxBridge.subscribe('bootloader', () => {
                        rescan(document).then(() => {
                            const { needed: newMods } = scan();
                            for (const p of newMods) { if (!loaded.has(p)) init(p); }
                        });
                    }, { childList: true });
                }

                const phases = { ...t1, ...t2, ...t3, ...t4, ...t5 };
                const total = performance.now() - t0;

                // I/O at the boundary: all logging happens here, nowhere else
                if (config.performance?.logging) {
                    console.log('genX Bootstrap:', {
                        total: `${total.toFixed(2)}ms`,
                        phases: Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, `${v.toFixed(2)}ms`])),
                        elements: elements.length,
                        parsed: parsedCount,
                        modules: Array.from(loaded)
                    });
                }

                // Single event emission with timing data
                window.dispatchEvent(new CustomEvent('genx:ready', {
                    detail: {
                        loaded: Array.from(loaded),
                        elements: { total: elements.length, parsed: parsedCount },
                        styles, timing: { total, phases }
                    }
                }));

            } catch (err) {
                console.error('genX Bootloader: Initialization failed', err);
                // Signal the cloak (and any other listener) that the format pass failed,
                // so cloaked elements reveal their raw value instead of staying hidden.
                window.dispatchEvent(new CustomEvent('genx:error', { detail: { error: String(err) } }));
            }
        });
    };

    // --- Public API ---

    const api = {
        version: '2.0.0',
        scan, load, init, rescan,
        loaded: () => Array.from(loaded),
        isLoaded: (prefix) => loaded.has(prefix),
        getFactory: (prefix) => factories[prefix],
        getConfig: (el) => parseMap.get(el) || null,
        detectNotationStyles, loadParsers, parseElements,
        buildSelector, detectPrefix
    };

    window.genx = api;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})();
