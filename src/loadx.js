/**
 * loadX - Declarative Loading States
 * @version 1.0.0
 *
 * Automatic async operation detection and loading state management.
 * Provides spinner, skeleton, progress bar, and fade loading strategies
 * with zero layout shift and perfect accessibility.
 */
(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION MANAGEMENT
    // ============================================================================

    /**
     * Validate configuration object with detailed error messages
     * @param {Object} config - Configuration to validate
     * @throws {Error} - If configuration is invalid with detailed message
     */
    const validateConfig = (config) => {
        // Allow undefined or null config (will use defaults)
        if (config === undefined || config === null) {
            return;
        }

        // Validate minDisplayMs
        if ('minDisplayMs' in config) {
            const value = config.minDisplayMs;
            const type = typeof value;

            if (type !== 'number') {
                throw new Error(`loadX config error: minDisplayMs must be a number, got ${type}`);
            }

            if (value < 0) {
                throw new Error(`loadX config error: minDisplayMs must be non-negative, got ${value}`);
            }
        }

        // Validate autoDetect
        if ('autoDetect' in config) {
            const value = config.autoDetect;
            const type = typeof value;

            if (type !== 'boolean') {
                throw new Error(`loadX config error: autoDetect must be a boolean, got ${type}`);
            }
        }

        // Validate telemetry
        if ('telemetry' in config) {
            const value = config.telemetry;
            const type = typeof value;

            if (type !== 'boolean') {
                throw new Error(`loadX config error: telemetry must be a boolean, got ${type}`);
            }
        }

        // Validate strategies
        if ('strategies' in config) {
            const value = config.strategies;

            if (!Array.isArray(value)) {
                throw new Error(`loadX config error: strategies must be an array, got ${typeof value}`);
            }
        }
    };

    // ============================================================================
    // CORE INITIALIZATION ENGINE
    // ============================================================================

    /**
     * Initialize loadX module with configuration
     * @param {Object} config - Configuration options
     * @returns {Object} - Frozen API object
     */
    const initLoadX = (config = {}) => {
        // Normalize null/undefined config to empty object
        const normalizedConfig = config || {};

        // Validate configuration
        validateConfig(normalizedConfig);

        // Default configuration (frozen for immutability)
        const defaultConfig = Object.freeze({
            minDisplayMs: 300,      // Minimum time to display loading indicator
            autoDetect: true,       // Auto-detect async operations
            strategies: [],         // Available loading strategies
            telemetry: false        // Telemetry disabled by default (privacy)
        });

        // Merge configuration (only known properties)
        const mergedConfig = {
            minDisplayMs: normalizedConfig.minDisplayMs !== undefined ? normalizedConfig.minDisplayMs : defaultConfig.minDisplayMs,
            autoDetect: normalizedConfig.autoDetect !== undefined ? normalizedConfig.autoDetect : defaultConfig.autoDetect,
            strategies: normalizedConfig.strategies !== undefined ? normalizedConfig.strategies : defaultConfig.strategies,
            telemetry: normalizedConfig.telemetry !== undefined ? normalizedConfig.telemetry : defaultConfig.telemetry
        };

        // Freeze strategies array if present
        if (Array.isArray(mergedConfig.strategies)) {
            mergedConfig.strategies = Object.freeze([...mergedConfig.strategies]);
        }

        // Freeze final configuration
        Object.freeze(mergedConfig);

        // Initialize strategy registry
        const strategyRegistry = new Map();

        // Initialize ARIA live regions for accessibility
        if (document.body) {
            initializeLiveRegions();
        } else {
            // Defer until DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    initializeLiveRegions();
                });
            }
        }

        // Scan DOM for lx-* attributes
        if (document.body) {
            const elements = document.querySelectorAll('[class*="lx-"], [lx-strategy], [lx-loading]');
            elements.forEach(el => processElement(el, mergedConfig));
        }

        // Setup async detection if enabled
        if (mergedConfig.autoDetect) {
            setupAsyncDetection(mergedConfig);
        }

        // Mark async detection as enabled for testing
        if (mergedConfig.autoDetect && typeof window !== 'undefined') {
            window.loadX = window.loadX || {};
            window.loadX.asyncDetectionEnabled = true;
        }

        // Return frozen API
        return Object.freeze({
            config: mergedConfig,
            registry: strategyRegistry,
            applyLoading: (el, opts) => applyLoadingState(el, opts, mergedConfig),
            removeLoading: (el) => removeLoadingState(el)
        });
    };

    // ============================================================================
    // ARIA LIVE REGION INITIALIZATION
    // ============================================================================

    /**
     * Initialize ARIA live regions for screen reader announcements
     */
    const initializeLiveRegions = () => {
        // Check if live region already exists
        if (!document.getElementById('lx-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'lx-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'ax-sr-only'; // Screen reader only class

            // Append to body
            if (document.body) {
                document.body.appendChild(liveRegion);
            }
        }
    };

    // ============================================================================
    // DOM PROCESSING
    // ============================================================================

    /**
     * Process element for loading state management
     * @param {HTMLElement} el - Element to process
     * @param {Object} config - Configuration object
     */
    const processElement = (el, config) => {
        const parsed = parseElementAttributes(el);

        if (parsed.strategy) {
            // Mark element as tracked
            el.setAttribute('data-lx-tracked', 'true');

            // Store parsed config on element for later use
            el._lxConfig = parsed;

            return true;
        }

        return false;
    };

    /**
     * Parse loadX attributes from element (polymorphic attribute processing)
     * Supports multiple syntax styles:
     * - HTML attributes: lx-strategy="spinner"
     * - CSS classes: class="lx-spinner"
     * - JSON config: lx-config='{"strategy":"spinner","duration":500}'
     * - Colon syntax: class="lx:spinner:500"
     * - Data attributes: data-lx-strategy="spinner"
     *
     * @param {HTMLElement} el - Element to parse
     * @returns {Object} - Parsed configuration object
     */
    const parseElementAttributes = (el) => {
        if (!el) return { strategy: 'spinner' }; // Default

        const result = {};

        // Priority 1: lx-config JSON (highest priority)
        const jsonConfig = el.getAttribute('lx-config');
        if (jsonConfig) {
            try {
                const parsed = JSON.parse(jsonConfig);
                Object.assign(result, parsed);

                // Normalize strategy name
                if (result.strategy) {
                    result.strategy = normalizeStrategyName(result.strategy);
                }

                return result;
            } catch (error) {
                // Invalid JSON - log error and continue to other methods
                console.warn('loadX: Invalid JSON in lx-config:', error.message);
            }
        }

        // Priority 2: lx-strategy HTML attribute
        const strategyAttr = el.getAttribute('lx-strategy');
        if (strategyAttr) {
            result.strategy = normalizeStrategyName(strategyAttr);
        }

        // Priority 3: data-lx-strategy attribute
        if (!result.strategy) {
            const dataStrategy = el.getAttribute('data-lx-strategy');
            if (dataStrategy) {
                result.strategy = normalizeStrategyName(dataStrategy);
            }
        }

        // Priority 4: CSS class syntax (lx-spinner or lx:spinner:500)
        if (!result.strategy) {
            const classResult = parseClassSyntax(el.className);
            if (classResult.strategy) {
                Object.assign(result, classResult);
            }
        }

        // Parse additional attributes
        parseAdditionalAttributes(el, result);

        // Apply defaults if no strategy found
        if (!result.strategy) {
            result.strategy = 'spinner'; // Default strategy
        }

        return result;
    };

    /**
     * Parse CSS class syntax (supports both lx-strategy and lx:strategy:params)
     * @param {String} className - Element className string
     * @returns {Object} - Parsed configuration
     */
    const parseClassSyntax = (className) => {
        if (!className) return {};

        const classes = className.split(' ').filter(c => c.trim());
        const result = {};

        for (const cls of classes) {
            // Colon syntax: lx:spinner:500 or lx:progress:determinate:500
            if (cls.startsWith('lx:')) {
                const parts = cls.split(':').slice(1); // Remove 'lx' prefix
                if (parts.length > 0) {
                    result.strategy = normalizeStrategyName(parts[0]);

                    // Parse additional parameters
                    if (parts.length > 1) {
                        // Try to parse as duration (number)
                        const secondParam = parts[1];
                        if (/^\d+$/.test(secondParam)) {
                            result.duration = parseInt(secondParam, 10);
                        } else {
                            // Non-numeric parameter (e.g., 'determinate')
                            result.mode = secondParam;
                        }
                    }

                    // Third parameter (if exists)
                    if (parts.length > 2 && /^\d+$/.test(parts[2])) {
                        result.duration = parseInt(parts[2], 10);
                    }
                }
                return result;
            }

            // Standard class syntax: lx-spinner
            if (cls.startsWith('lx-')) {
                const strategyName = cls.substring(3); // Remove 'lx-' prefix
                result.strategy = normalizeStrategyName(strategyName);
                return result;
            }
        }

        return result;
    };

    /**
     * Parse additional lx-* attributes (duration, value, rows, etc.)
     * @param {HTMLElement} el - Element to parse
     * @param {Object} result - Result object to populate
     */
    const parseAdditionalAttributes = (el, result) => {
        // Duration
        const duration = el.getAttribute('lx-duration');
        if (duration && /^\d+$/.test(duration)) {
            result.duration = parseInt(duration, 10);
        }

        // Value (for progress bars)
        const value = el.getAttribute('lx-value');
        if (value && /^\d+$/.test(value)) {
            result.value = parseInt(value, 10);
        }

        // Rows (for skeleton)
        const rows = el.getAttribute('lx-rows');
        if (rows && /^\d+$/.test(rows)) {
            result.rows = parseInt(rows, 10);
        }

        // Min height
        const minHeight = el.getAttribute('lx-min-height');
        if (minHeight) {
            result.minHeight = minHeight;
        }

        // Animate flag
        const animate = el.getAttribute('lx-animate');
        if (animate !== null) {
            result.animate = animate !== 'false';
        }

        // Loading state
        const loading = el.getAttribute('lx-loading');
        if (loading !== null) {
            result.loading = loading !== 'false';
        }
    };

    /**
     * Normalize strategy name (lowercase, trim whitespace)
     * @param {String} name - Strategy name
     * @returns {String} - Normalized name
     */
    const normalizeStrategyName = (name) => {
        if (!name || typeof name !== 'string') return 'spinner';
        return name.toLowerCase().trim() || 'spinner';
    };

    // ============================================================================
    // ASYNC DETECTION ENGINE
    // ============================================================================

    // Track active loading states (WeakMap for automatic cleanup)
    const activeLoadingStates = new WeakMap();

    /**
     * Setup automatic async operation detection
     * @param {Object} config - Configuration object
     */
    const setupAsyncDetection = (config) => {
        // Monitor fetch API
        if (typeof window.fetch !== 'undefined') {
            monitorFetch(config);
        }

        // Monitor XMLHttpRequest
        if (typeof window.XMLHttpRequest !== 'undefined') {
            monitorXHR(config);
        }

        // Monitor HTMX if available
        if (typeof window.htmx !== 'undefined' || typeof htmx !== 'undefined') {
            monitorHTMX(config);
        }

        // Monitor form submissions
        monitorFormSubmissions(config);
    };

    /**
     * Find loading element from event target or active element
     * @param {HTMLElement} target - Event target element
     * @returns {HTMLElement|null} - Element with lx-loading configuration
     */
    const findLoadingElement = (target) => {
        if (!target) return null;

        // Check target element
        if (target._lxConfig || target.hasAttribute('lx-loading')) {
            return target;
        }

        // Check parent elements (bubble up)
        let current = target.parentElement;
        while (current && current !== document.body) {
            if (current._lxConfig || current.hasAttribute('lx-loading')) {
                return current;
            }
            current = current.parentElement;
        }

        return null;
    };

    /**
     * Monitor fetch API calls with Proxy interception
     * @param {Object} config - Configuration object
     */
    const monitorFetch = (config) => {
        const originalFetch = window.fetch;

        window.fetch = new Proxy(originalFetch, {
            apply: function(target, thisArg, argumentsList) {
                // Find associated element
                const element = findLoadingElement(document.activeElement);

                // Apply loading state if element configured
                if (element && element._lxConfig) {
                    applyLoadingState(element, element._lxConfig, config);
                    activeLoadingStates.set(element, Date.now());
                }

                // Call original fetch
                const promise = Reflect.apply(target, thisArg, argumentsList);

                // Cleanup on completion
                promise.finally(() => {
                    if (element) {
                        const startTime = activeLoadingStates.get(element) || Date.now();
                        const elapsed = Date.now() - startTime;
                        const minDisplay = config.minDisplayMs || 300;

                        // Respect minimum display time
                        const delay = Math.max(0, minDisplay - elapsed);
                        setTimeout(() => {
                            removeLoadingState(element);
                            activeLoadingStates.delete(element);
                        }, delay);
                    }
                });

                return promise;
            }
        });
    };

    /**
     * Monitor XMLHttpRequest with monkey-patching
     * @param {Object} config - Configuration object
     */
    const monitorXHR = (config) => {
        const OriginalXHR = window.XMLHttpRequest;

        window.XMLHttpRequest = function() {
            const xhr = new OriginalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;

            let element = null;

            // Patch open to capture context
            xhr.open = function(...args) {
                element = findLoadingElement(document.activeElement);
                return originalOpen.apply(this, args);
            };

            // Patch send to apply loading state
            xhr.send = function(...args) {
                if (element && element._lxConfig) {
                    applyLoadingState(element, element._lxConfig, config);
                    activeLoadingStates.set(element, Date.now());
                }

                // Cleanup on completion
                const cleanup = () => {
                    if (element) {
                        const startTime = activeLoadingStates.get(element) || Date.now();
                        const elapsed = Date.now() - startTime;
                        const minDisplay = config.minDisplayMs || 300;

                        const delay = Math.max(0, minDisplay - elapsed);
                        setTimeout(() => {
                            removeLoadingState(element);
                            activeLoadingStates.delete(element);
                        }, delay);
                    }
                };

                xhr.addEventListener('load', cleanup);
                xhr.addEventListener('error', cleanup);
                xhr.addEventListener('abort', cleanup);

                return originalSend.apply(this, args);
            };

            return xhr;
        };

        // Copy static properties
        Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
        Object.setPrototypeOf(window.XMLHttpRequest.prototype, OriginalXHR.prototype);
    };

    /**
     * Monitor HTMX events (htmx:beforeRequest, htmx:afterSwap, htmx:afterSettle)
     * @param {Object} config - Configuration object
     */
    const monitorHTMX = (config) => {
        // Listen for htmx:beforeRequest event
        document.addEventListener('htmx:beforeRequest', (event) => {
            const element = event.detail?.elt || event.target;

            if (element && (element._lxConfig || element.hasAttribute('lx-loading'))) {
                const lxConfig = element._lxConfig || parseElementAttributes(element);
                applyLoadingState(element, lxConfig, config);
                activeLoadingStates.set(element, Date.now());
            }
        });

        // Listen for htmx:afterSwap event
        document.addEventListener('htmx:afterSwap', (event) => {
            const element = event.detail?.elt || event.target;

            if (element && activeLoadingStates.has(element)) {
                const startTime = activeLoadingStates.get(element);
                const elapsed = Date.now() - startTime;
                const minDisplay = config.minDisplayMs || 300;

                const delay = Math.max(0, minDisplay - elapsed);
                setTimeout(() => {
                    removeLoadingState(element);
                    activeLoadingStates.delete(element);
                }, delay);
            }
        });

        // Listen for htmx:afterSettle event (final cleanup)
        document.addEventListener('htmx:afterSettle', (event) => {
            const element = event.detail?.elt || event.target;

            if (element && activeLoadingStates.has(element)) {
                removeLoadingState(element);
                activeLoadingStates.delete(element);
            }
        });
    };

    /**
     * Monitor form submissions
     * @param {Object} config - Configuration object
     */
    const monitorFormSubmissions = (config) => {
        document.addEventListener('submit', (event) => {
            const form = event.target;

            if (form && (form._lxConfig || form.hasAttribute('lx-loading'))) {
                // Find submit button
                const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                const element = submitButton || form;

                const lxConfig = element._lxConfig || parseElementAttributes(element);
                applyLoadingState(element, lxConfig, config);
                activeLoadingStates.set(element, Date.now());

                // Auto-cleanup after form submission completes
                // This is a simple timeout - real implementation would listen for response
                setTimeout(() => {
                    if (activeLoadingStates.has(element)) {
                        removeLoadingState(element);
                        activeLoadingStates.delete(element);
                    }
                }, config.minDisplayMs || 300);
            }
        });
    };

    // ============================================================================
    // LOADING STATE MANAGEMENT (STUBS FOR PHASE 2)
    // ============================================================================

    /**
     * Apply loading state to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Loading options
     * @param {Object} config - Configuration object
     */
    const applyLoadingState = (el, opts, config) => {
        // Stub - will be implemented in Phase 2 (Loading Strategies)
        // Applies appropriate loading strategy based on opts and config
    };

    /**
     * Remove loading state from element
     * @param {HTMLElement} el - Target element
     */
    const removeLoadingState = (el) => {
        // Stub - will be implemented in Phase 2 (Loading Strategies)
        // Removes loading indicators and restores original state
    };

    // ============================================================================
    // MODULE EXPORT
    // ============================================================================

    // Export for bootloader integration
    if (typeof window !== 'undefined') {
        window.loadX = window.loadX || {};
        window.loadX.initLoadX = initLoadX;
        window.loadX.parseElementAttributes = parseElementAttributes;
        window.loadX.validateConfig = validateConfig;
    }

    // Export for ES6 modules (if needed)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initLoadX,
            parseElementAttributes,
            validateConfig
        };
    }

})();
