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
    const modules = {
        'fx': '/modules/fmtx.js',
        'ax': '/modules/accx.js',
        'bx': '/modules/bindx.js',
        'dx': '/modules/dragx.js',
        'lx': '/modules/loadx.js',
        'tx': '/modules/tablex.js',
        'nx': '/modules/navx.js'
    };

    // CDN base URL (can be configured)
    const CDN_BASE = window.genxConfig?.cdn || 'https://cdn.genx.software/v1';

    // Loaded and pending module tracking
    const loaded = new Set();
    const pending = new Set();
    const factories = {};

    /**
     * Scan DOM for genx attributes
     * Returns Set of required module prefixes
     */
    const scan = (root = document) => {
        const needed = new Set();

        // Optimized attribute detection using querySelectorAll
        for (let prefix of Object.keys(modules)) {
            // Check for any attribute starting with prefix
            const selector = `[${prefix}-]`;
            if (root.querySelector(selector)) {
                needed.add(prefix);
            }
        }

        return needed;
    };

    /**
     * Load module dynamically
     * Returns Promise that resolves when module is loaded
     */
    const load = async (prefix) => {
        if (loaded.has(prefix)) return factories[prefix];
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
            const url = modules[prefix].startsWith('http')
                ? modules[prefix]
                : CDN_BASE + modules[prefix];

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
        const needed = scan();
        const results = {};

        for (let prefix of needed) {
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
     */
    const bootstrap = () => {
        // Use requestAnimationFrame to ensure this runs after first paint
        requestAnimationFrame(async () => {
            try {
                // Scan and load modules
                await initAll();

                // Setup MutationObserver for dynamic content
                if (window.genxConfig?.observe !== false) {
                    const observer = new MutationObserver((mutations) => {
                        let needsRescan = false;

                        mutations.forEach(mutation => {
                            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                                needsRescan = true;
                            }
                        });

                        if (needsRescan) {
                            // Debounce rescan
                            clearTimeout(observer._timeout);
                            observer._timeout = setTimeout(() => {
                                const newModules = scan();
                                for (let prefix of newModules) {
                                    if (!loaded.has(prefix)) {
                                        init(prefix);
                                    }
                                }
                            }, 100);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }

                // Emit ready event
                window.dispatchEvent(new CustomEvent('genx:ready', {
                    detail: { loaded: Array.from(loaded) }
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
    const fetchEdgeBundle = async () => {
        if (!window.genxConfig?.edge?.enabled) return false;

        try {
            const patterns = Array.from(scan()).join(',');
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
        getFactory: (prefix) => factories[prefix]
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
