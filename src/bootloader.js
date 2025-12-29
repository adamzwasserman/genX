/**
 * genx.software Universal Bootloader
 * @version 1.0.0
 * @size ~1KB minified (target)
 *
 * Loads genx modules on-demand after first paint, maintaining 0ms TBT.
 * Scans DOM for declarative attributes and dynamically loads only required modules.
 */
(function() {
    'use strict';

    // Module registry - maps prefixes to module URLs
    // Can be overridden via window.genxConfig.modulePaths
    const defaultModules = {
        'fx': '/fmtx.min.js',
        'ax': '/accx.min.js',
        'bx': '/bindx.min.js',
        'dx': '/dragx.min.js',
        'lx': '/loadx.min.js',
        'tx': '/tablex.min.js',
        'nx': '/navx.min.js'
    };
    const modules = (typeof window !== 'undefined' && window.genxConfig?.modulePaths)
        ? { ...defaultModules, ...window.genxConfig.modulePaths }
        : defaultModules;

    // Class prefix to module prefix mapping (for CSS class notation)
    // Prefer the canonical map from genxCommon if available to avoid duplication.
    const CLASS_PREFIX_MAP = (typeof window !== 'undefined' && window.genxCommon && window.genxCommon.notation && window.genxCommon.notation.CLASS_PREFIX_MAP)
        ? window.genxCommon.notation.CLASS_PREFIX_MAP
        : {
            'fmt': 'fx',
            'acc': 'ax',
            'bind': 'bx',
            'drag': 'dx',
            'load': 'lx',
            'table': 'tx',
            'nav': 'nx'
        };

    // Module prefix map (inverse of CLASS_PREFIX_MAP for lookups)
    const MODULE_PREFIX_MAP = Object.fromEntries(
        Object.entries(CLASS_PREFIX_MAP).map(([k, v]) => [v, k])
    );

    // Primary entry-point attributes for each module
    // CSS cannot match "attribute name starts with", so we list known entry points
    const MODULE_ENTRY_ATTRS = {
        'fx': ['fx-format'],
        'ax': ['ax-enhance'],
        'bx': ['bx-model', 'bx-bind', 'bx-if', 'bx-show', 'bx-for', 'bx-form'],
        'dx': ['dx-draggable', 'dx-drop-zone'],
        'lx': ['lx-strategy', 'lx-loading'],
        'tx': ['tx-sortable'],
        'nx': ['nx-tabs', 'nx-dropdown', 'nx-breadcrumb', 'nx-mobile', 'nx-scroll-spy', 'nx-sticky', 'nx-nav']
    };

    // CDN base URL (can be configured)
    const CDN_BASE = window.genxConfig?.cdn || 'https://cdn.genx.software/v1';

    // Loaded and pending module tracking
    const loaded = new Set();
    const pending = new Set();
    const factories = {};

    // Parser URLs mapping - can be overridden via window.genxConfig.parserPaths
    const defaultParserUrls = {
        verbose: '/parsers/genx-parser-verbose.js',
        colon: '/parsers/genx-parser-colon.js',
        json: '/parsers/genx-parser-json.js',
        class: '/parsers/genx-parser-class.js'
    };
    const PARSER_URLS = (typeof window !== 'undefined' && window.genxConfig?.parserPaths)
        ? { ...defaultParserUrls, ...window.genxConfig.parserPaths }
        : defaultParserUrls;

    // Parser cache
    const parsers = {};
    const loadingParsers = new Set();

    // Parse cache - WeakMap for garbage collection
    const parseMap = new WeakMap();

    // Performance metrics collection
    const performanceMetrics = {
        bootstrap: {
            total: 0,
            phases: {
                scan: 0,
                detectStyles: 0,
                loadParsers: 0,
                parseElements: 0,
                initModules: 0,
                setupObserver: 0
            }
        },
        scans: [],
        parses: [],
        cacheHits: 0,
        cacheMisses: 0,
        elementCount: 0,
        parsedCount: 0
    };

    // Performance targets (for validation and warnings)
    const performanceTargets = {
        scan1000: 5,        // <5ms for 1000 elements
        parse1000: 100,     // <100ms for 1000 elements
        moduleInit: 105,    // <105ms total bootstrap
        cacheLookup: 0.001  // <0.001ms per cache lookup
    };

    /**
     * Load parsers dynamically based on detected notation styles
     * Uses dynamic import() for tree-shaking and on-demand loading
     * @param {Array<string>} styles - Array of style names: ['verbose', 'colon', 'json', 'class']
     * @returns {Promise<Object>} - Object mapping style names to parser modules
     */
    const loadParsers = async (styles) => {
        if (!styles || styles.length === 0) {
            return {};
        }

        const loadPromises = [];
        const results = {};

        for (const style of styles) {
            // Skip if already loaded
            if (parsers[style]) {
                results[style] = parsers[style];
                continue;
            }

            // Skip if currently loading (avoid duplicate requests)
            if (loadingParsers.has(style)) {
                // Wait for it to load
                loadPromises.push(
                    new Promise((resolve) => {
                        const checkInterval = setInterval(() => {
                            if (parsers[style]) {
                                clearInterval(checkInterval);
                                results[style] = parsers[style];
                                resolve();
                            }
                        }, 10);
                    })
                );
                continue;
            }

            // Mark as loading
            loadingParsers.add(style);

            // Construct parser URL - use CDN_BASE which has correct default
            const parserPath = PARSER_URLS[style];
            const parserUrl = parserPath.startsWith('http')
                ? parserPath
                : CDN_BASE + parserPath;

            // Load parser with dynamic import()
            const loadPromise = import(parserUrl)
                .then((module) => {
                    parsers[style] = module;
                    loadingParsers.delete(style);
                    results[style] = module;
                })
                .catch((error) => {
                    loadingParsers.delete(style);
                    console.error(`Failed to load ${style} parser from ${parserUrl}:`, error);
                    results[style] = null;
                });

            loadPromises.push(loadPromise);
        }

        // Wait for all parsers to load
        await Promise.all(loadPromises);

        return results;
    };

    /**
     * Build unified CSS selector for all genX notations
     * Single query covers attributes + CSS classes
     */
    const _buildUnifiedSelector = () => {
        // Build attribute selectors from known entry-point attributes
        const attrSelectors = Object.values(MODULE_ENTRY_ATTRS)
            .flat()
            .map(attr => `[${attr}]`);
        const classSelectors = Object.keys(CLASS_PREFIX_MAP).map(p => `[class*="${p}-"]`);
        return [...attrSelectors, ...classSelectors].join(',');
    };

    /**
     * Detect which module prefix an element uses
     * Priority: attributes > CSS classes
     */
    const _detectPrefix = (element) => {
        // Check attributes first (higher priority)
        for (const prefix of Object.keys(modules)) {
            const attrs = element.attributes;
            for (let i = 0; i < attrs.length; i++) {
                if (attrs[i].name.startsWith(prefix + '-')) {
                    return prefix;
                }
            }
        }

        // Check CSS classes
        const classList = element.classList;
        if (classList && classList.length > 0) {
            for (let i = 0; i < classList.length; i++) {
                const className = classList[i];
                // Check if class starts with any known prefix
                for (const [classPrefix, modulePrefix] of Object.entries(CLASS_PREFIX_MAP)) {
                    if (className.startsWith(classPrefix + '-')) {
                        return modulePrefix;
                    }
                }
            }
        }

        return null;
    };

    /**
     * Scan DOM for genX elements (attributes + CSS classes)
     * Returns object with needed Set and elements Array
     * OPTIMIZED: Single querySelector for all notations
     */
    const scan = (root = document) => {
        const scanStart = performance.now();
        const selector = _buildUnifiedSelector();
        const elements = Array.from(root.querySelectorAll(selector));
        const needed = new Set();

        // Detect which prefix each element needs
        for (const el of elements) {
            const prefix = _detectPrefix(el);
            if (prefix) {
                needed.add(prefix);
            }
        }

        const scanDuration = performance.now() - scanStart;

        // Record scan metrics
        performanceMetrics.scans.push({
            elementCount: elements.length,
            duration: scanDuration,
            timestamp: Date.now()
        });

        // Performance warning if scan exceeds target (scaled to 1000 elements)
        const normalizedTime = (scanDuration / elements.length) * 1000;
        if (normalizedTime > performanceTargets.scan1000 && elements.length > 100) {
            if (window.genxConfig?.performance?.warnings) {
                console.warn(
                    `⚠️ genX Performance: Scan time ${scanDuration.toFixed(2)}ms for ${elements.length} elements ` +
                    `(normalized: ${normalizedTime.toFixed(2)}ms/1000 elements, target: <${performanceTargets.scan1000}ms/1000)`
                );
            }
        }

        return { needed, elements };
    };

    /**
     * Detect which notation styles are used in the given elements
     * Returns array of style names: ['verbose', 'colon', 'json', 'class']
     */
    const detectNotationStyles = (elements) => {
        const styles = new Set();

        // If no elements, return empty array
        if (!elements || elements.length === 0) {
            return [];
        }

        for (const el of elements) {
            // Check for verbose attributes (fx-, bx-, ax-, etc.)
            for (const prefix of Object.keys(modules)) {
                const attrs = el.attributes;
                for (let i = 0; i < attrs.length; i++) {
                    const attrName = attrs[i].name;
                    const attrValue = attrs[i].value;

                    // Verbose: attribute name starts with prefix-
                    if (attrName.startsWith(prefix + '-')) {
                        styles.add('verbose');

                        // Colon: attribute value contains ':'
                        if (attrValue && attrValue.includes(':')) {
                            styles.add('colon');
                        }

                        // JSON: attribute name ends with -opts
                        if (attrName.endsWith('-opts')) {
                            styles.add('json');
                        }
                    }
                }
            }

            // Check for CSS class notation
            const classList = el.classList;
            if (classList && classList.length > 0) {
                for (let i = 0; i < classList.length; i++) {
                    const className = classList[i];
                    // Check if class starts with any known class prefix
                    for (const classPrefix of Object.keys(CLASS_PREFIX_MAP)) {
                        if (className.startsWith(classPrefix + '-')) {
                            styles.add('class');
                            break;
                        }
                    }
                    if (styles.has('class')) break;
                }
            }

            // Early exit if all styles detected
            if (styles.size === 4) break;
        }

        // Convert Set to sorted array for consistent output
        return Array.from(styles).sort();
    };

    /**
     * Parse all elements and cache configurations
     * Priority order: JSON > Colon > Verbose > Class
     * @param {Array<Element>} elements - Elements to parse
     * @param {Object} loadedParsers - Object with loaded parser modules
     * @returns {number} - Number of elements parsed
     */
    const parseAllElements = (elements, loadedParsers) => {
        const parseStart = performance.now();
        let parsedCount = 0;
        let cacheHits = 0;

        for (const el of elements) {
            // Skip if already cached
            if (parseMap.has(el)) {
                cacheHits++;
                performanceMetrics.cacheHits++;
                continue;
            }

            // Cache miss
            performanceMetrics.cacheMisses++;

            // Detect which prefix this element uses
            const prefix = _detectPrefix(el);
            if (!prefix) {
                continue;
            }

            // Start with empty config
            let config = {};

            // Apply parsers in priority order: JSON > Colon > Verbose > Class
            // Each parser merges with previous results via baseConfig parameter

            // 1. JSON parser (highest priority overrides)
            if (loadedParsers.json && loadedParsers.json.parse) {
                config = loadedParsers.json.parse(el, prefix, config);
            }

            // 2. Colon parser
            if (loadedParsers.colon && loadedParsers.colon.parse) {
                config = loadedParsers.colon.parse(el, prefix, config);
            }

            // 3. Verbose parser
            if (loadedParsers.verbose && loadedParsers.verbose.parse) {
                config = loadedParsers.verbose.parse(el, prefix, config);
            }

            // 4. Class parser (lowest priority, most concise)
            if (loadedParsers.class && loadedParsers.class.parse) {
                config = loadedParsers.class.parse(el, prefix, config);
            }

            // Only cache if we got a non-empty config
            if (config && Object.keys(config).length > 0) {
                parseMap.set(el, config);
                parsedCount++;
            }
        }

        const parseDuration = performance.now() - parseStart;

        // Record parse metrics
        performanceMetrics.parses.push({
            elementCount: elements.length,
            parsedCount,
            cacheHits,
            duration: parseDuration,
            timestamp: Date.now()
        });
        performanceMetrics.elementCount += elements.length;
        performanceMetrics.parsedCount += parsedCount;

        // Performance warning if parse exceeds target (scaled to 1000 elements)
        const normalizedTime = (parseDuration / elements.length) * 1000;
        if (normalizedTime > performanceTargets.parse1000 && elements.length > 100) {
            if (window.genxConfig?.performance?.warnings) {
                console.warn(
                    `⚠️ genX Performance: Parse time ${parseDuration.toFixed(2)}ms for ${elements.length} elements ` +
                    `(normalized: ${normalizedTime.toFixed(2)}ms/1000 elements, target: <${performanceTargets.parse1000}ms/1000)`
                );
            }
        }

        // Performance logging (if enabled)
        if (window.genxConfig?.performance?.logging) {
            console.log(
                `genX: Parsed ${parsedCount} elements (${cacheHits} cache hits) in ${parseDuration.toFixed(2)}ms`
            );
        }

        return parsedCount;
    };

    /**
     * Rescan a root node or a list of elements and (re)parse only affected elements.
     * Accepts either a Document/Element root or an Array of Elements.
     * Returns number of parsed elements.
     */
    const rescan = async (rootOrElements = document) => {
        let elements = [];

        // If caller provided an explicit array of elements
        if (Array.isArray(rootOrElements)) {
            elements = rootOrElements.filter(el => el && el.nodeType === Node.ELEMENT_NODE);
        } else if (rootOrElements && (rootOrElements.nodeType === Node.ELEMENT_NODE || rootOrElements === document)) {
            // Query limited subtree using unified selector
            const selector = _buildUnifiedSelector();
            if (!selector) return 0;
            if (rootOrElements === document) {
                elements = Array.from(document.querySelectorAll(selector));
            } else {
                const root = rootOrElements;
                // Include the root itself if it matches
                try {
                    if (root.matches && root.matches(selector)) elements.push(root);
                } catch (e) {
                    // ignore invalid selector errors
                }
                elements = elements.concat(Array.from(root.querySelectorAll(selector)));
            }
        } else {
            return 0;
        }

        if (elements.length === 0) return 0;

        // Detect notation styles used within this subset and load necessary parsers
        const styles = detectNotationStyles(elements);
        const loadedParsers = await loadParsers(styles);

        // Parse and cache configurations for these elements
        return parseAllElements(elements, loadedParsers);
    };

    /**
     * Get cached configuration for an element
     * Public API for accessing parse cache
     * @param {Element} element - Element to get config for
     * @returns {Object|null} - Cached config or null
     */
    const getConfig = (element) => {
        // Guard clauses for null/undefined
        if (!element || !element.attributes) {
            return null;
        }

        // Check cache first (O(1) lookup)
        if (parseMap.has(element)) {
            return parseMap.get(element);
        }

        // Element not in cache - return null
        // (Note: elements should be parsed during bootstrap or scan)
        return null;
    };

    /**
     * Load module dynamically
     * Returns Promise that resolves when module is loaded
     */
    const load = async (prefix) => {
        if (loaded.has(prefix)) {
            return factories[prefix];
        }
        if (pending.has(prefix)) {
            // Wait for pending load to complete
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (loaded.has(prefix)) {
                        clearInterval(check);
                        resolve(factories[prefix]);
                    }
                }, 10);
            });
        }

        pending.add(prefix);

        try {
            const modulePath = modules[prefix];
            // Only skip CDN prefix if path is a full URL (http/https)
            // Relative paths (including those starting with /) get CDN prepended
            const url = modulePath.startsWith('http')
                ? modulePath
                : CDN_BASE + modulePath;

            const script = document.createElement('script');
            script.src = url;
            script.async = true;

            // Add SRI hash if available (security)
            if (window.genxConfig?.sri?.[prefix]) {
                script.integrity = window.genxConfig.sri[prefix];
                script.crossOrigin = 'anonymous';
            }

            await new Promise((resolve, reject) => {
                script.onload = () => {
                    // Module should expose factory at window[prefix + 'XFactory']
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

        } catch (err) {
            pending.delete(prefix);
            console.error(`genX Bootloader: Failed to load ${prefix}`, err);
            throw err;
        }
    };

    /**
     * Initialize module with factory
     */
    const init = async (prefix, config = {}) => {
        const factory = await load(prefix);
        if (factory && factory.init) {
            return factory.init(config);
        }
        return null;
    };

    /**
     * Initialize all detected modules
     */
    const initAll = async () => {
        const { needed } = scan();
        const results = {};

        for (const prefix of needed) {
            try {
                const config = window.genxConfig?.modules?.[prefix] || {};
                results[prefix] = await init(prefix, config);
            } catch (err) {
                console.error(`genX: Failed to initialize ${prefix}`, err);
                results[prefix] = null;
            }
        }

        return results;
    };

    /**
     * Main initialization - runs after first paint
     * 6-phase optimized bootstrap sequence:
     * 1. Scan DOM (unified scan for all notations)
     * 2. Detect notation styles
     * 3. Load required parsers (tree-shaking)
     * 4. Parse all elements once (WeakMap cache)
     * 5. Initialize needed modules
     * 6. Setup MutationObserver for dynamic content
     */
    const bootstrap = () => {
        // Use requestAnimationFrame to ensure this runs after first paint
        requestAnimationFrame(async () => {
            const bootstrapStart = performance.now();
            const stats = {
                phases: {},
                elements: { total: 0, parsed: 0 },
                styles: [],
                parsers: [],
                modules: []
            };

            try {
                // Phase 1: Unified DOM scan
                const phase1Start = performance.now();
                const { needed, elements } = scan();
                stats.phases.scan = performance.now() - phase1Start;
                stats.elements.total = elements.length;

                // Phase 2: Detect notation styles used
                const phase2Start = performance.now();
                const styles = detectNotationStyles(elements);
                stats.phases.detectStyles = performance.now() - phase2Start;
                stats.styles = styles;

                // Phase 3: Load required parsers dynamically
                const phase3Start = performance.now();
                const loadedParsers = await loadParsers(styles);
                stats.phases.loadParsers = performance.now() - phase3Start;
                stats.parsers = Object.keys(loadedParsers);

                // Phase 4: Parse all elements and cache configurations
                const phase4Start = performance.now();
                const parsedCount = parseAllElements(elements, loadedParsers);
                stats.phases.parseElements = performance.now() - phase4Start;
                stats.elements.parsed = parsedCount;

                // Phase 5: Initialize needed modules
                const phase5Start = performance.now();
                await initAll();
                stats.phases.initModules = performance.now() - phase5Start;
                stats.modules = Array.from(loaded);

                // Phase 6: Setup MutationObserver for dynamic content - uses domx-bridge if available
                const phase6Start = performance.now();
                if (window.genxConfig?.observe !== false) {
                    // State for debouncing
                    let _nodes = new Set();
                    let _timeout = null;

                    const callback = (mutations) => {
                        // Collect affected roots to process after debounce
                        for (const mutation of mutations) {
                            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                                mutation.addedNodes.forEach(node => {
                                    if (node && node.nodeType === Node.ELEMENT_NODE) _nodes.add(node);
                                });
                            }

                            if (mutation.type === 'attributes' && mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
                                _nodes.add(mutation.target);
                            }
                        }

                        // Debounce rescan for aggregated nodes
                        clearTimeout(_timeout);
                        _timeout = setTimeout(async () => {
                            try {
                                const nodes = Array.from(_nodes || []);
                                _nodes = new Set();

                                // Build element list scoped to changed subtrees
                                const selector = _buildUnifiedSelector();
                                const elements = new Set();

                                for (const node of nodes) {
                                    try {
                                        if (selector && node.matches && node.matches(selector)) elements.add(node);
                                    } catch (e) {
                                        // ignore invalid selector errors
                                    }
                                    if (selector) {
                                        const found = Array.from(node.querySelectorAll(selector));
                                        for (const f of found) elements.add(f);
                                    }
                                }

                                // If nothing specific found, fall back to a full rescan
                                const parsed = await rescan(elements.size ? Array.from(elements) : document);

                                // Ensure any newly-needed modules are initialized
                                const { needed: newModules } = scan();
                                for (const prefix of newModules) {
                                    if (!loaded.has(prefix)) {
                                        init(prefix);
                                    }
                                }
                            } catch (err) {
                                console.error('genX: incremental rescan failed', err);
                            }
                        }, 100);
                    };

                    // Use domx-bridge if available, fallback to native MutationObserver
                    if (window.domxBridge) {
                        window.domxBridge.subscribe('bootloader', callback, { childList: true });
                    } else {
                        const observer = new MutationObserver(callback);
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                }
                stats.phases.setupObserver = performance.now() - phase6Start;

                // Calculate total bootstrap time
                const bootstrapDuration = performance.now() - bootstrapStart;
                stats.total = bootstrapDuration;

                // Store bootstrap metrics
                performanceMetrics.bootstrap.total = bootstrapDuration;
                performanceMetrics.bootstrap.phases = stats.phases;

                // Calculate cache hit rate
                const totalCacheLookups = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
                const cacheHitRate = totalCacheLookups > 0
                    ? (performanceMetrics.cacheHits / totalCacheLookups) * 100
                    : 0;

                // Performance validation against targets
                if (bootstrapDuration > performanceTargets.moduleInit) {
                    if (window.genxConfig?.performance?.warnings) {
                        console.warn(
                            `⚠️ genX Performance: Bootstrap time ${bootstrapDuration.toFixed(2)}ms ` +
                            `exceeds target of ${performanceTargets.moduleInit}ms`
                        );
                    }
                }

                // Performance logging (if enabled)
                if (window.genxConfig?.performance?.logging) {
                    console.log('genX Bootstrap Complete:', {
                        total: `${bootstrapDuration.toFixed(2)}ms`,
                        phases: {
                            scan: `${stats.phases.scan.toFixed(2)}ms`,
                            detectStyles: `${stats.phases.detectStyles.toFixed(2)}ms`,
                            loadParsers: `${stats.phases.loadParsers.toFixed(2)}ms`,
                            parseElements: `${stats.phases.parseElements.toFixed(2)}ms`,
                            initModules: `${stats.phases.initModules.toFixed(2)}ms`,
                            setupObserver: `${stats.phases.setupObserver.toFixed(2)}ms`
                        },
                        elements: stats.elements,
                        styles: stats.styles,
                        modules: stats.modules,
                        cache: {
                            hits: performanceMetrics.cacheHits,
                            misses: performanceMetrics.cacheMisses,
                            hitRate: `${cacheHitRate.toFixed(1)}%`
                        }
                    });
                }

                // Emit ready event with detailed stats including performance metrics
                window.dispatchEvent(new CustomEvent('genx:ready', {
                    detail: {
                        loaded: stats.modules,
                        elements: stats.elements,
                        styles: stats.styles,
                        parsers: stats.parsers,
                        timing: {
                            total: bootstrapDuration,
                            phases: stats.phases
                        },
                        performance: {
                            bootstrap: performanceMetrics.bootstrap,
                            scans: performanceMetrics.scans,
                            parses: performanceMetrics.parses,
                            cache: {
                                hits: performanceMetrics.cacheHits,
                                misses: performanceMetrics.cacheMisses,
                                hitRate: cacheHitRate
                            },
                            targets: performanceTargets,
                            meetsTargets: {
                                bootstrap: bootstrapDuration <= performanceTargets.moduleInit,
                                scan: stats.phases.scan <= performanceTargets.scan1000,
                                parse: stats.phases.parseElements <= performanceTargets.parse1000
                            }
                        }
                    }
                }));

            } catch (err) {
                console.error('genX Bootloader: Initialization failed', err);
            }
        });
    };

    /**
     * Edge compilation integration (optional)
     * Fetches optimized bundle from edge service
     */
    const _fetchEdgeBundle = async () => {
        if (!window.genxConfig?.edge?.enabled) {
            return false;
        }

        try {
            const { needed } = scan();
            const patterns = Array.from(needed).join(',');
            const response = await fetch(window.genxConfig.edge.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patterns })
            });

            if (response.ok) {
                const { bundle } = await response.json();
                // Load optimized bundle
                const script = document.createElement('script');
                script.textContent = bundle;
                document.head.appendChild(script);
                return true;
            }
        } catch (err) {
            console.warn('genX: Edge compilation unavailable, using standard modules', err);
        }

        return false;
    };

    /**
     * Get performance metrics
     */
    const getPerformanceMetrics = () => {
        const totalCacheLookups = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
        const cacheHitRate = totalCacheLookups > 0
            ? (performanceMetrics.cacheHits / totalCacheLookups) * 100
            : 0;

        return {
            bootstrap: performanceMetrics.bootstrap,
            scans: performanceMetrics.scans,
            parses: performanceMetrics.parses,
            cache: {
                hits: performanceMetrics.cacheHits,
                misses: performanceMetrics.cacheMisses,
                total: totalCacheLookups,
                hitRate: cacheHitRate
            },
            elements: {
                total: performanceMetrics.elementCount,
                parsed: performanceMetrics.parsedCount
            },
            targets: performanceTargets
        };
    };

    /**
     * Validate performance against targets
     */
    const validatePerformance = () => {
        const metrics = getPerformanceMetrics();
        const validation = {
            passed: true,
            failures: []
        };

        // Check bootstrap time
        if (metrics.bootstrap.total > performanceTargets.moduleInit) {
            validation.passed = false;
            validation.failures.push({
                metric: 'bootstrap.total',
                actual: metrics.bootstrap.total,
                target: performanceTargets.moduleInit,
                message: `Bootstrap time ${metrics.bootstrap.total.toFixed(2)}ms exceeds target ${performanceTargets.moduleInit}ms`
            });
        }

        // Check scan times (normalized to 1000 elements)
        for (const scan of metrics.scans) {
            const normalizedTime = (scan.duration / scan.elementCount) * 1000;
            if (normalizedTime > performanceTargets.scan1000 && scan.elementCount > 100) {
                validation.passed = false;
                validation.failures.push({
                    metric: 'scan.normalized',
                    actual: normalizedTime,
                    target: performanceTargets.scan1000,
                    message: `Scan time ${normalizedTime.toFixed(2)}ms/1000 exceeds target ${performanceTargets.scan1000}ms/1000`
                });
            }
        }

        // Check parse times (normalized to 1000 elements)
        for (const parse of metrics.parses) {
            const normalizedTime = (parse.duration / parse.elementCount) * 1000;
            if (normalizedTime > performanceTargets.parse1000 && parse.elementCount > 100) {
                validation.passed = false;
                validation.failures.push({
                    metric: 'parse.normalized',
                    actual: normalizedTime,
                    target: performanceTargets.parse1000,
                    message: `Parse time ${normalizedTime.toFixed(2)}ms/1000 exceeds target ${performanceTargets.parse1000}ms/1000`
                });
            }
        }

        // Check cache hit rate (should be >95% on second pass)
        if (metrics.cache.total > 0 && metrics.cache.hitRate < 95) {
            validation.passed = false;
            validation.failures.push({
                metric: 'cache.hitRate',
                actual: metrics.cache.hitRate,
                target: 95,
                message: `Cache hit rate ${metrics.cache.hitRate.toFixed(1)}% below target 95%`
            });
        }

        return validation;
    };

    /**
     * Reset performance metrics (for testing)
     */
    const resetPerformanceMetrics = () => {
        performanceMetrics.bootstrap = {
            total: 0,
            phases: {
                scan: 0,
                detectStyles: 0,
                loadParsers: 0,
                parseElements: 0,
                initModules: 0,
                setupObserver: 0
            }
        };
        performanceMetrics.scans = [];
        performanceMetrics.parses = [];
        performanceMetrics.cacheHits = 0;
        performanceMetrics.cacheMisses = 0;
        performanceMetrics.elementCount = 0;
        performanceMetrics.parsedCount = 0;
    };

    /**
     * Public API
     */
    const api = {
        version: '1.0.0',
        scan,
        load,
        init,
        initAll,
        loaded: () => Array.from(loaded),
        isLoaded: (prefix) => loaded.has(prefix),
        getFactory: (prefix) => factories[prefix],
        detectNotationStyles,
        loadParsers,
        getConfig,
        parseAllElements,
        rescan,
        // Performance monitoring
        getPerformanceMetrics,
        validatePerformance,
        resetPerformanceMetrics,
        // Helper functions for testing
        _buildUnifiedSelector,
        _detectPrefix
    };

    // Expose API
    window.genx = api;

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})();
