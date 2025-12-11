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

        // Validate autoDetect (boolean or object)
        if ('autoDetect' in config) {
            const value = config.autoDetect;
            const type = typeof value;

            if (type !== 'boolean' && type !== 'object') {
                throw new Error(`loadX config error: autoDetect must be a boolean or object, got ${type}`);
            }

            // If object, validate properties
            if (type === 'object' && value !== null) {
                const validKeys = ['fetch', 'xhr', 'htmx', 'forms'];
                const invalidKeys = Object.keys(value).filter(k => !validKeys.includes(k));

                if (invalidKeys.length > 0) {
                    throw new Error(
                        `loadX config error: autoDetect object has invalid keys: ${invalidKeys.join(', ')}. ` +
                        `Valid keys are: ${validKeys.join(', ')}`
                    );
                }

                // Validate values are booleans
                Object.entries(value).forEach(([key, val]) => {
                    if (typeof val !== 'boolean') {
                        throw new Error(
                            `loadX config error: autoDetect.${key} must be boolean, got ${typeof val}`
                        );
                    }
                });
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
     * Check if element has loadX attributes
     * @param {HTMLElement} el - Element to check
     * @returns {Boolean}
     */
    const hasLoadXAttributes = (el) => {
        if (!el || !el.getAttribute) {
            return false;
        }

        return el.hasAttribute('lx-strategy') ||
               el.hasAttribute('lx-loading') ||
               el.hasAttribute('data-lx-strategy') ||
               (el.className && el.className.includes('lx-'));
    };

    /**
     * Scan mutations for new loadX elements
     * @param {Array} mutations - MutationRecord array
     * @param {Object} config - Configuration object
     */
    const scanForNewElements = (mutations, config) => {
        const elementsToProcess = new Set();

        mutations.forEach(mutation => {
            // Check added nodes
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if node itself has lx attributes
                        if (hasLoadXAttributes(node)) {
                            elementsToProcess.add(node);
                        }

                        // Check descendants
                        const descendants = node.querySelectorAll('[class*="lx-"], [lx-strategy], [lx-loading], [data-lx-strategy]');
                        descendants.forEach(el => elementsToProcess.add(el));
                    }
                });
            }

            // Check attribute changes
            if (mutation.type === 'attributes') {
                const target = mutation.target;
                if (hasLoadXAttributes(target)) {
                    elementsToProcess.add(target);
                }
            }
        });

        // Process all collected elements
        elementsToProcess.forEach(el => {
            // Skip if already tracked
            if (!el.hasAttribute('data-lx-tracked')) {
                processElement(el, config);
            }
        });
    };

    /**
     * Setup MutationObserver for dynamic content - uses domx-bridge if available
     * @param {Object} config - Configuration object
     */
    const setupMutationObserver = (config) => {
        // Disconnect existing observer if any
        if (mutationObserver) {
            if (typeof mutationObserver === 'function') {
                mutationObserver(); // domx-bridge unsubscribe
            } else {
                mutationObserver.disconnect();
            }
        }

        const callback = (mutations) => {
            // Debounce scanning for performance
            clearTimeout(scanDebounceTimer);

            scanDebounceTimer = setTimeout(() => {
                scanForNewElements(mutations, config);
            }, SCAN_DEBOUNCE_MS);
        };

        // Use domx-bridge if available, fallback to native MutationObserver
        if (window.domxBridge) {
            mutationObserver = window.domxBridge.subscribe('loadx', callback, { attributeFilter: ['lx-'] });
        } else {
            const observer = new MutationObserver(callback);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['lx-strategy', 'lx-loading', 'data-lx-strategy', 'class']
            });
            mutationObserver = observer;
        }

        // Store observer reference for cleanup
        if (typeof window !== 'undefined') {
            window.loadX = window.loadX || {};
            window.loadX._mutationObserver = mutationObserver;
        }
    };

    /**
     * Cleanup mutation observer and all ResizeObservers
     */
    const disconnectMutationObserver = () => {
        if (mutationObserver) {
            if (typeof mutationObserver === 'function') {
                mutationObserver(); // domx-bridge unsubscribe
            } else {
                mutationObserver.disconnect();
            }
            mutationObserver = null;
        }

        if (scanDebounceTimer) {
            clearTimeout(scanDebounceTimer);
            scanDebounceTimer = null;
        }

        // v2.0: Disconnect all ResizeObservers for memory cleanup
        activeObservers.forEach(observer => {
            observer.disconnect();
        });
        activeObservers.clear();
    };

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
            telemetry: false,       // Telemetry disabled by default (privacy)
            modernSyntax: false,    // v2.0: Disable legacy CSS class and colon syntax
            silenceDeprecations: false,  // v2.0: Silence deprecation warnings
            preventCLS: true        // v2.0: Use ResizeObserver to prevent Cumulative Layout Shift
        });

        // Merge configuration (only known properties)
        const mergedConfig = {
            minDisplayMs: normalizedConfig.minDisplayMs !== undefined ? normalizedConfig.minDisplayMs : defaultConfig.minDisplayMs,
            autoDetect: normalizedConfig.autoDetect !== undefined ? normalizedConfig.autoDetect : defaultConfig.autoDetect,
            strategies: normalizedConfig.strategies !== undefined ? normalizedConfig.strategies : defaultConfig.strategies,
            telemetry: normalizedConfig.telemetry !== undefined ? normalizedConfig.telemetry : defaultConfig.telemetry,
            modernSyntax: normalizedConfig.modernSyntax !== undefined ? normalizedConfig.modernSyntax : defaultConfig.modernSyntax,
            silenceDeprecations: normalizedConfig.silenceDeprecations !== undefined ? normalizedConfig.silenceDeprecations : defaultConfig.silenceDeprecations,
            preventCLS: normalizedConfig.preventCLS !== undefined ? normalizedConfig.preventCLS : defaultConfig.preventCLS
        };

        // Freeze strategies array if present
        if (Array.isArray(mergedConfig.strategies)) {
            mergedConfig.strategies = Object.freeze([...mergedConfig.strategies]);
        }

        // Normalize autoDetect to object form
        if (typeof mergedConfig.autoDetect === 'boolean') {
            // Convert boolean to object (backward compatibility)
            const enableAll = mergedConfig.autoDetect;
            mergedConfig.autoDetect = {
                fetch: enableAll,
                xhr: enableAll,
                htmx: enableAll,
                forms: enableAll
            };
        } else if (typeof mergedConfig.autoDetect === 'object' && mergedConfig.autoDetect !== null) {
            // Fill in defaults for partial config
            mergedConfig.autoDetect = {
                fetch: mergedConfig.autoDetect.fetch !== undefined ? mergedConfig.autoDetect.fetch : true,
                xhr: mergedConfig.autoDetect.xhr !== undefined ? mergedConfig.autoDetect.xhr : true,
                htmx: mergedConfig.autoDetect.htmx !== undefined ? mergedConfig.autoDetect.htmx : true,
                forms: mergedConfig.autoDetect.forms !== undefined ? mergedConfig.autoDetect.forms : true
            };
        }

        // Freeze autoDetect object
        if (mergedConfig.autoDetect && typeof mergedConfig.autoDetect === 'object') {
            Object.freeze(mergedConfig.autoDetect);
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

        // Setup async detection if any detector is enabled
        const anyDetectorEnabled = mergedConfig.autoDetect &&
            (mergedConfig.autoDetect.fetch ||
             mergedConfig.autoDetect.xhr ||
             mergedConfig.autoDetect.htmx ||
             mergedConfig.autoDetect.forms);

        if (anyDetectorEnabled) {
            setupAsyncDetection(mergedConfig);
        }

        // Mark async detection as enabled for testing
        if (anyDetectorEnabled && typeof window !== 'undefined') {
            window.loadX = window.loadX || {};
            window.loadX.asyncDetectionEnabled = true;
        }

        // Setup MutationObserver for dynamic content
        if (document.body) {
            setupMutationObserver(mergedConfig);
        } else {
            // Defer until DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setupMutationObserver(mergedConfig);
                });
            }
        }

        // Return frozen API
        return Object.freeze({
            config: mergedConfig,
            registry: strategyRegistry,
            applyLoading: (el, opts) => applyLoadingState(el, opts, mergedConfig),
            removeLoading: (el) => removeLoadingState(el),
            disconnect: disconnectMutationObserver
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
        const parsed = parseElementAttributes(el, config);

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
     * - Bootloader cache: window.genx.getConfig() (O(1) lookup)
     * - HTML attributes: lx-strategy="spinner"
     * - CSS classes: class="lx-spinner"
     * - JSON config: lx-config='{"strategy":"spinner","duration":500}'
     * - Colon syntax: class="lx:spinner:500"
     * - Data attributes: data-lx-strategy="spinner"
     *
     * @param {HTMLElement} el - Element to parse
     * @param {Object} config - Configuration object
     * @returns {Object} - Parsed configuration object
     */
    const parseElementAttributes = (el, config = {}) => {
        if (!el) {
            return { strategy: 'spinner' };
        } // Default

        // Priority 0: Bootloader cache (highest priority, O(1) lookup)
        if (window.genx && window.genx.getConfig) {
            const cachedConfig = window.genx.getConfig(el);
            if (cachedConfig && cachedConfig.strategy) {
                // Got cached config - normalize and return
                const result = {...cachedConfig};
                result.strategy = normalizeStrategyName(result.strategy);
                return result;
            }
        }

        // Fallback to polymorphic notation parsing (legacy standalone mode)
        // Use polymorphic parser from genx-common (supports Verbose, Colon, JSON, CSS Class)
        const result = window.genxCommon
            ? window.genxCommon.notation.parseNotation(el, 'lx')
            : {};  // Fallback if genx-common not loaded

        // Normalize strategy name
        if (result.strategy) {
            result.strategy = normalizeStrategyName(result.strategy);
        }

        // Apply defaults if no strategy found
        if (!result.strategy) {
            result.strategy = 'spinner'; // Default strategy
        }

        return result;
    };

    /**
     * Parse CSS class syntax (supports both lx-strategy and lx:strategy:params)
     * @deprecated v2.0 - Use data-lx-strategy attribute instead
     * @param {String} className - Element className string
     * @param {Object} config - Configuration object
     * @returns {Object} - Parsed configuration
     */
    const parseClassSyntax = (className, config = {}) => {
        if (!className) {
            return {};
        }

        const classes = className.split(' ').filter(c => c.trim());
        const result = {};

        for (const cls of classes) {
            // Colon syntax: lx:spinner:500 or lx:progress:determinate:500
            if (cls.startsWith('lx:')) {
                // v2.0: Deprecation handling
                if (config.modernSyntax) {
                    throw new Error(
                        '[loadX v2.0] Colon syntax (' + cls + ') is not supported in strict mode. ' +
                        'Use data-lx-strategy attribute or lx-config JSON instead. ' +
                        'See migration guide: https://genx.software/docs/loadx/migration-v2'
                    );
                }

                if (!config.silenceDeprecations) {
                    console.warn(
                        '[loadX v2.0] Colon syntax (' + cls + ') is deprecated and will be removed in v3.0. ' +
                        'Use data-lx-strategy attribute or lx-config JSON instead. ' +
                        'See migration guide: https://genx.software/docs/loadx/migration-v2'
                    );
                }

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
                // v2.0: Deprecation handling
                if (config.modernSyntax) {
                    throw new Error(
                        '[loadX v2.0] CSS class syntax (' + cls + ') is not supported in strict mode. ' +
                        'Use data-lx-strategy="' + cls.substring(3) + '" instead. ' +
                        'See migration guide: https://genx.software/docs/loadx/migration-v2'
                    );
                }

                if (!config.silenceDeprecations) {
                    console.warn(
                        '[loadX v2.0] CSS class syntax (' + cls + ') is deprecated and will be removed in v3.0. ' +
                        'Use data-lx-strategy="' + cls.substring(3) + '" instead. ' +
                        'See migration guide: https://genx.software/docs/loadx/migration-v2'
                    );
                }

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
        if (!name || typeof name !== 'string') {
            return 'spinner';
        }
        return name.toLowerCase().trim() || 'spinner';
    };

    // ============================================================================
    // ASYNC DETECTION ENGINE
    // ============================================================================

    /**
     * Setup automatic async operation detection
     * @param {Object} config - Configuration object
     */
    const setupAsyncDetection = (config) => {
        const autoDetect = config.autoDetect;

        // Monitor fetch API (if enabled)
        if (autoDetect.fetch && typeof window.fetch !== 'undefined') {
            monitorFetch(config);
        }

        // Monitor XMLHttpRequest (if enabled)
        if (autoDetect.xhr && typeof window.XMLHttpRequest !== 'undefined') {
            monitorXHR(config);
        }

        // Monitor HTMX if available (if enabled)
        if (autoDetect.htmx && (typeof window.htmx !== 'undefined' || typeof htmx !== 'undefined')) {
            monitorHTMX(config);
        }

        // Monitor form submissions (if enabled)
        if (autoDetect.forms) {
            monitorFormSubmissions(config);
        }
    };

    /**
     * Find loading element from event target or active element
     * @param {HTMLElement} target - Event target element
     * @returns {HTMLElement|null} - Element with lx-loading configuration
     */
    const findLoadingElement = (target) => {
        if (!target) {
            return null;
        }

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

                // Cleanup on completion using enhanced cleanup
                promise.finally(() => {
                    if (element) {
                        cleanupLoadingState(element, config);
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

                // Cleanup on completion using enhanced cleanup
                const cleanup = () => {
                    if (element) {
                        cleanupLoadingState(element, config);
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
                const lxConfig = element._lxConfig || parseElementAttributes(element, config);
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
     * Enhanced cleanup for loading state with minimum display time
     * @param {HTMLElement} element - Element to cleanup
     * @param {Object} config - Configuration object
     */
    const cleanupLoadingState = (element, config) => {
        if (!element) {
            return;
        }

        const startTime = activeLoadingStates.get(element) || Date.now();
        const elapsed = Date.now() - startTime;
        const minDisplay = config.minDisplayMs || 300;

        // Clear any fallback timeout
        if (element._lxFallbackTimeout) {
            clearTimeout(element._lxFallbackTimeout);
            delete element._lxFallbackTimeout;
        }

        // Respect minimum display time
        const delay = Math.max(0, minDisplay - elapsed);
        setTimeout(() => {
            removeLoadingState(element);
            activeLoadingStates.delete(element);
        }, delay);
    };

    /**
     * Monitor form submissions with accurate completion detection
     * @param {Object} config - Configuration object
     */
    const monitorFormSubmissions = (config) => {
        document.addEventListener('submit', (event) => {
            const form = event.target;

            if (form && (form._lxConfig || form.hasAttribute('lx-loading'))) {
                // Find submit button
                const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                const element = submitButton || form;

                const lxConfig = element._lxConfig || parseElementAttributes(element, config);
                applyLoadingState(element, lxConfig, config);
                activeLoadingStates.set(element, Date.now());

                // Detect if form uses fetch/XHR or native submission
                const action = form.getAttribute('action');

                // If form has no action or action is '#', assume JavaScript handling
                if (!action || action === '#' || action === '') {
                    // Form is handled by JavaScript - loading state will be cleared by fetch/XHR monitors
                    // Set a safety timeout as fallback (longer timeout since this is edge case)
                    const fallbackTimeout = setTimeout(() => {
                        if (activeLoadingStates.has(element)) {
                            removeLoadingState(element);
                            activeLoadingStates.delete(element);
                            console.warn('loadX: Form loading state cleared by fallback timeout. Consider using explicit removeLoadingState() call or ensure fetch/XHR monitoring is enabled.');
                        }
                    }, 5000); // 5 second fallback

                    // Store timeout ID for cleanup
                    element._lxFallbackTimeout = fallbackTimeout;
                } else {
                    // Native form submission - use navigation/unload detection
                    const navigationHandler = () => {
                        // Form is navigating away - don't try to cleanup
                        window.removeEventListener('beforeunload', navigationHandler);
                    };

                    window.addEventListener('beforeunload', navigationHandler);

                    // Also set fallback timeout for AJAX-submitted forms
                    const fallbackTimeout = setTimeout(() => {
                        if (activeLoadingStates.has(element)) {
                            removeLoadingState(element);
                            activeLoadingStates.delete(element);
                        }
                        window.removeEventListener('beforeunload', navigationHandler);
                    }, 5000);

                    element._lxFallbackTimeout = fallbackTimeout;
                }
            }
        });
    };

    // ============================================================================
    // LOADING STATE MANAGEMENT
    // ============================================================================

    /**
     * Apply loading state to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Loading options
     * @param {Object} config - Configuration object
     */
    const applyLoadingState = (el, opts, config) => {
        if (!el) {
            return;
        }

        const strategy = opts.strategy || 'spinner';

        // v2.0: Prevent Cumulative Layout Shift with ResizeObserver
        if (config.preventCLS && typeof ResizeObserver !== 'undefined') {
            // Measure current dimensions
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);

            // Store original dimensions and styles
            originalDimensions.set(el, {
                width: rect.width,
                height: rect.height,
                minWidth: computedStyle.minWidth,
                minHeight: computedStyle.minHeight,
                boxSizing: computedStyle.boxSizing
            });

            // Reserve space to prevent layout shift
            if (rect.width > 0 && rect.height > 0) {
                el.style.minWidth = rect.width + 'px';
                el.style.minHeight = rect.height + 'px';
            }

            // Create ResizeObserver to monitor size changes
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    // Monitor but don't react during loading state
                    // This is primarily for cleanup and memory management
                    if (entry.target === el) {
                        // Store current size for potential restoration
                        const currentRect = entry.contentRect;
                        if (currentRect.width > 0 && currentRect.height > 0) {
                            const stored = originalDimensions.get(el) || {};
                            stored.observedWidth = currentRect.width;
                            stored.observedHeight = currentRect.height;
                            originalDimensions.set(el, stored);
                        }
                    }
                }
            });

            // Start observing
            observer.observe(el);
            resizeObservers.set(el, observer);
            activeObservers.add(observer); // Track for bulk cleanup
        }

        // Dispatch to appropriate strategy
        switch (strategy) {
        case 'spinner':
            applySpinnerStrategy(el, opts);
            break;
        case 'skeleton':
            applySkeletonStrategy(el, opts);
            break;
        case 'progress':
            applyProgressStrategy(el, opts);
            break;
        case 'fade':
            applyFadeStrategy(el, opts);
            break;
        default:
            applySpinnerStrategy(el, opts);
        }

        // Add ARIA attributes
        el.setAttribute('aria-busy', 'true');

        // Announce to screen readers (pass element for urgency detection)
        announceLoading('Loading', el);
    };

    /**
     * Remove loading state from element
     * @param {HTMLElement} el - Target element
     */
    const removeLoadingState = (el) => {
        if (!el) {
            return;
        }

        const strategy = el.getAttribute('data-lx-strategy') || 'spinner';

        // Dispatch to appropriate strategy removal
        switch (strategy) {
        case 'spinner':
            removeSpinnerStrategy(el);
            break;
        case 'skeleton':
            removeSkeletonStrategy(el);
            break;
        case 'progress':
            removeProgressStrategy(el);
            break;
        case 'fade':
            removeFadeStrategy(el);
            break;
        default:
            removeSpinnerStrategy(el);
        }

        // v2.0: Cleanup ResizeObserver and restore dimensions
        const observer = resizeObservers.get(el);
        if (observer) {
            observer.disconnect();
            resizeObservers.delete(el);
            activeObservers.delete(observer); // Remove from bulk cleanup tracking
        }

        // Restore original dimensions
        const original = originalDimensions.get(el);
        if (original) {
            // Restore original min-width and min-height
            el.style.minWidth = original.minWidth;
            el.style.minHeight = original.minHeight;
            originalDimensions.delete(el);
        }

        // Remove ARIA attributes
        el.removeAttribute('aria-busy');

        // Announce completion (pass element for urgency)
        announceLoading('Loading complete', el);
    };

    // ============================================================================
    // SPINNER STRATEGY
    // ============================================================================

    /**
     * Apply spinner loading strategy to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Spinner options
     */
    const applySpinnerStrategy = (el, opts = {}) => {
        if (!el) {
            return;
        }

        // Store original content
        const originalContent = el.innerHTML;
        el.setAttribute('data-lx-original-content', originalContent);
        el.setAttribute('data-lx-strategy', 'spinner');

        // Get spinner configuration
        const spinnerType = opts.spinnerType || el.getAttribute('lx-spinner-type') || 'circle';
        const spinnerSize = opts.spinnerSize || el.getAttribute('lx-spinner-size') || 'medium';
        const spinnerColor = opts.spinnerColor || el.getAttribute('lx-spinner-color') || '';

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Preserve original dimensions to prevent CLS
        const originalWidth = el.offsetWidth;
        const originalHeight = el.offsetHeight;

        if (originalWidth > 0) {
            el.style.width = originalWidth + 'px';
        }
        if (originalHeight > 0) {
            el.style.minHeight = originalHeight + 'px';
        }

        // Create spinner element
        let spinnerHTML;
        if (prefersReducedMotion) {
            // Static indicator for reduced motion
            spinnerHTML = createStaticLoadingIndicator(spinnerSize, spinnerColor);
        } else {
            // Animated spinner
            switch (spinnerType) {
            case 'dots':
                spinnerHTML = createDotsSpinner(spinnerSize, spinnerColor);
                break;
            case 'bars':
                spinnerHTML = createBarsSpinner(spinnerSize, spinnerColor);
                break;
            case 'circle':
            default:
                spinnerHTML = createCircleSpinner(spinnerSize, spinnerColor);
            }
        }

        // Create wrapper to center spinner
        const wrapper = document.createElement('div');
        wrapper.className = 'lx-spinner-wrapper';
        wrapper.innerHTML = spinnerHTML;

        // Hide original content and show spinner
        el.innerHTML = '';
        el.appendChild(wrapper);
        el.classList.add('lx-loading');
    };

    /**
     * Remove spinner loading strategy from element
     * @param {HTMLElement} el - Target element
     */
    const removeSpinnerStrategy = (el) => {
        if (!el) {
            return;
        }

        // Restore original content
        const originalContent = el.getAttribute('data-lx-original-content');
        if (originalContent) {
            el.innerHTML = originalContent;
        }

        // Remove data attributes
        el.removeAttribute('data-lx-original-content');
        el.removeAttribute('data-lx-strategy');

        // Remove loading class
        el.classList.remove('lx-loading');

        // Restore original dimensions
        el.style.width = '';
        el.style.minHeight = '';
    };

    /**
     * Create circle spinner HTML
     * @param {String} size - Spinner size (small, medium, large)
     * @param {String} color - Spinner color (CSS color value)
     * @returns {String} - Spinner HTML
     */
    const createCircleSpinner = (size, color) => {
        const sizeClass = `lx-spinner-${size}`;
        const colorStyle = color ? `style="border-top-color: ${color};"` : '';

        return `<div class="lx-spinner-circle ${sizeClass}" ${colorStyle}></div>`;
    };

    /**
     * Create dots spinner HTML
     * @param {String} size - Spinner size
     * @param {String} color - Spinner color
     * @returns {String} - Spinner HTML
     */
    const createDotsSpinner = (size, color) => {
        const sizeClass = `lx-spinner-${size}`;
        const colorStyle = color ? `style="background-color: ${color};"` : '';

        return `
            <div class="lx-spinner-dots ${sizeClass}">
                <div class="lx-spinner-dot" ${colorStyle}></div>
                <div class="lx-spinner-dot" ${colorStyle}></div>
                <div class="lx-spinner-dot" ${colorStyle}></div>
            </div>
        `;
    };

    /**
     * Create bars spinner HTML
     * @param {String} size - Spinner size
     * @param {String} color - Spinner color
     * @returns {String} - Spinner HTML
     */
    const createBarsSpinner = (size, color) => {
        const sizeClass = `lx-spinner-${size}`;
        const colorStyle = color ? `style="background-color: ${color};"` : '';

        return `
            <div class="lx-spinner-bars ${sizeClass}">
                <div class="lx-spinner-bar" ${colorStyle}></div>
                <div class="lx-spinner-bar" ${colorStyle}></div>
                <div class="lx-spinner-bar" ${colorStyle}></div>
            </div>
        `;
    };

    /**
     * Create static loading indicator for reduced motion
     * @param {String} size - Indicator size
     * @param {String} color - Indicator color
     * @returns {String} - Indicator HTML
     */
    const createStaticLoadingIndicator = (size, color) => {
        const sizeClass = `lx-spinner-${size}`;
        const colorStyle = color ? `style="color: ${color};"` : '';

        return `<div class="lx-loading-static ${sizeClass}" ${colorStyle}>Loading...</div>`;
    };

    /**
     * Announce loading state to screen readers
     * @param {String} message - Message to announce
     */
    // Track announcement timeout (single timeout per live region)
    let announcementTimeout = null;

    // Track mutation observer and debounce timer
    let mutationObserver = null;
    let scanDebounceTimer = null;
    const SCAN_DEBOUNCE_MS = 50; // 50ms debounce

    // v2.0: Track active loading states (WeakMap for automatic cleanup)
    const activeLoadingStates = new WeakMap();

    // v2.0: Track ResizeObservers for CLS prevention (WeakMap for automatic cleanup)
    const resizeObservers = new WeakMap();

    // v2.0: Track original dimensions for CLS restoration (WeakMap for automatic cleanup)
    const originalDimensions = new WeakMap();

    // v2.0: Track all active observers for bulk cleanup (Set for iteration)
    const activeObservers = new Set();

    /**
     * Announce loading state to screen readers with auto-clear
     * @param {String} message - Message to announce
     * @param {HTMLElement} element - Element being loaded (optional, for urgency detection)
     */
    const announceLoading = (message, element = null) => {
        const liveRegion = document.getElementById('lx-live-region');
        if (!liveRegion) {
            return;
        }

        // Clear any existing timeout
        if (announcementTimeout) {
            clearTimeout(announcementTimeout);
            announcementTimeout = null;
        }

        // Check for urgency flag
        const isUrgent = element?.getAttribute('lx-urgent') === 'true' ||
                        element?.hasAttribute('lx-urgent');

        // Update aria-live based on urgency
        if (isUrgent) {
            liveRegion.setAttribute('aria-live', 'assertive');
        } else {
            liveRegion.setAttribute('aria-live', 'polite');
        }

        // Set announcement
        liveRegion.textContent = message;

        // Auto-clear after 1 second
        announcementTimeout = setTimeout(() => {
            if (liveRegion.textContent === message) {
                liveRegion.textContent = '';
                // Reset to polite after urgent announcement
                if (isUrgent) {
                    liveRegion.setAttribute('aria-live', 'polite');
                }
            }
            announcementTimeout = null;
        }, 1000);
    };

    // ============================================================================
    // SKELETON STRATEGY
    // ============================================================================

    /**
     * Apply skeleton loading strategy to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Skeleton options
     */
    const applySkeletonStrategy = (el, opts = {}) => {
        if (!el) {
            return;
        }

        // Store original content
        const originalContent = el.innerHTML;
        el.setAttribute('data-lx-original-content', originalContent);
        el.setAttribute('data-lx-strategy', 'skeleton');

        // Get skeleton configuration
        const rows = opts.rows || parseInt(el.getAttribute('lx-rows'), 10) || 'auto';
        const animate = opts.animate !== false && el.getAttribute('lx-animate') !== 'false';

        // Preserve original dimensions to prevent CLS
        const originalWidth = el.offsetWidth;
        const originalHeight = el.offsetHeight;

        if (originalWidth > 0) {
            el.style.width = originalWidth + 'px';
        }
        if (originalHeight > 0) {
            el.style.minHeight = originalHeight + 'px';
        }

        // Analyze content structure and generate skeleton
        const skeletonHTML = generateSkeletonFromContent(el, rows, animate);

        // Apply skeleton
        el.innerHTML = skeletonHTML;
        el.classList.add('lx-loading', 'lx-loading-skeleton');
    };

    /**
     * Remove skeleton loading strategy from element
     * @param {HTMLElement} el - Target element
     */
    const removeSkeletonStrategy = (el) => {
        if (!el) {
            return;
        }

        // Restore original content
        const originalContent = el.getAttribute('data-lx-original-content');
        if (originalContent) {
            el.innerHTML = originalContent;
        }

        // Remove data attributes
        el.removeAttribute('data-lx-original-content');
        el.removeAttribute('data-lx-strategy');

        // Remove loading classes
        el.classList.remove('lx-loading', 'lx-loading-skeleton');

        // Restore original dimensions
        el.style.width = '';
        el.style.minHeight = '';
    };

    /**
     * Generate skeleton HTML from content structure
     * @param {HTMLElement} el - Element to analyze
     * @param {Number|String} rows - Number of skeleton rows or 'auto'
     * @param {Boolean} animate - Whether to animate shimmer
     * @returns {String} - Skeleton HTML
     */
    const generateSkeletonFromContent = (el, rows, animate) => {
        const animateClass = animate ? '' : ' lx-skeleton-no-animate';

        // Auto-detect content type
        if (rows === 'auto') {
            return autoGenerateSkeleton(el, animateClass);
        }

        // Generate fixed number of rows
        return generateFixedSkeleton(rows, animateClass);
    };

    /**
     * Auto-generate skeleton based on content analysis
     * @param {HTMLElement} el - Element to analyze
     * @param {String} animateClass - Animation class
     * @returns {String} - Skeleton HTML
     */
    const autoGenerateSkeleton = (el, animateClass) => {
        const tagName = el.tagName.toLowerCase();

        // Card-like structure
        if (el.querySelector('img, picture')) {
            return `
                <div class="lx-skeleton lx-skeleton-image${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-heading${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-text${animateClass}" style="width: 80%;"></div>
            `;
        }

        // List structure
        if (tagName === 'ul' || tagName === 'ol' || el.querySelector('li')) {
            const listItems = el.querySelectorAll('li').length || 3;
            let skeletonHTML = '<div class="lx-skeleton-list">';
            for (let i = 0; i < Math.min(listItems, 5); i++) {
                skeletonHTML += `
                    <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
                `;
            }
            skeletonHTML += '</div>';
            return skeletonHTML;
        }

        // Table structure
        if (tagName === 'table' || el.querySelector('table')) {
            const rows = el.querySelectorAll('tr').length || 3;
            const cols = el.querySelector('tr') ? el.querySelector('tr').querySelectorAll('td, th').length : 3;

            let tableHTML = '<table class="lx-skeleton-table"><tbody>';
            for (let i = 0; i < Math.min(rows, 5); i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < Math.min(cols, 6); j++) {
                    tableHTML += `<td><div class="lx-skeleton lx-skeleton-text${animateClass}"></div></td>`;
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table>';
            return tableHTML;
        }

        // Article/text content (default)
        if (tagName === 'article' || tagName === 'section' || el.querySelector('p')) {
            return `
                <div class="lx-skeleton lx-skeleton-heading${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
                <div class="lx-skeleton lx-skeleton-text${animateClass}" style="width: 60%;"></div>
            `;
        }

        // Fallback: generic text skeleton
        return `
            <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
            <div class="lx-skeleton lx-skeleton-text${animateClass}"></div>
        `;
    };

    /**
     * Generate fixed number of skeleton rows
     * @param {Number} count - Number of rows
     * @param {String} animateClass - Animation class
     * @returns {String} - Skeleton HTML
     */
    const generateFixedSkeleton = (count, animateClass) => {
        let skeletonHTML = '';
        for (let i = 0; i < count; i++) {
            const width = i === count - 1 ? '60%' : '100%';
            skeletonHTML += `<div class="lx-skeleton lx-skeleton-text${animateClass}" style="width: ${width};"></div>`;
        }
        return skeletonHTML;
    };

    // ============================================================================
    // PROGRESS STRATEGY
    // ============================================================================

    /**
     * Apply progress bar loading strategy to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Progress options
     */
    const applyProgressStrategy = (el, opts = {}) => {
        if (!el) {
            return;
        }

        // Store original content
        const originalContent = el.innerHTML;
        el.setAttribute('data-lx-original-content', originalContent);
        el.setAttribute('data-lx-strategy', 'progress');

        // Get progress configuration
        const value = opts.value !== undefined ? opts.value : parseInt(el.getAttribute('lx-value'), 10);
        const max = opts.max || parseInt(el.getAttribute('lx-max'), 10) || 100;
        // Auto-detect mode: if value is provided, use determinate mode
        const mode = opts.mode || el.getAttribute('lx-progress-mode') || (value !== undefined && !isNaN(value) ? 'determinate' : 'indeterminate');

        // Create progress bar HTML
        const progressHTML = createProgressBar(mode, value, max);

        // Preserve original dimensions
        const originalHeight = el.offsetHeight;
        if (originalHeight > 0) {
            el.style.minHeight = originalHeight + 'px';
        }

        // Apply progress bar
        el.innerHTML = progressHTML;
        el.classList.add('lx-loading', 'lx-loading-progress');

        // Store progress state for updates
        if (mode === 'determinate') {
            el._lxProgressValue = value || 0;
            el._lxProgressMax = max;
        }
    };

    /**
     * Remove progress loading strategy from element
     * @param {HTMLElement} el - Target element
     */
    const removeProgressStrategy = (el) => {
        if (!el) {
            return;
        }

        // Restore original content
        const originalContent = el.getAttribute('data-lx-original-content');
        if (originalContent) {
            el.innerHTML = originalContent;
        }

        // Remove data attributes
        el.removeAttribute('data-lx-original-content');
        el.removeAttribute('data-lx-strategy');

        // Remove loading classes
        el.classList.remove('lx-loading', 'lx-loading-progress');

        // Clean up progress state
        delete el._lxProgressValue;
        delete el._lxProgressMax;

        // Restore dimensions
        el.style.minHeight = '';
    };

    /**
     * Create progress bar HTML
     * @param {String} mode - 'determinate' or 'indeterminate'
     * @param {Number} value - Current value (for determinate)
     * @param {Number} max - Maximum value (for determinate)
     * @returns {String} - Progress bar HTML
     */
    const createProgressBar = (mode, value, max) => {
        const isIndeterminate = mode === 'indeterminate';
        const percentage = isIndeterminate ? 0 : Math.min(100, (value / max) * 100);

        const modeClass = isIndeterminate ? 'lx-progress-indeterminate' : 'lx-progress-determinate';
        const widthStyle = isIndeterminate ? '' : `style="width: ${percentage}%"`;

        // Add ARIA attributes for accessibility
        const ariaAttrs = isIndeterminate
            ? 'role="progressbar" aria-busy="true"'
            : `role="progressbar" aria-valuenow="${value || 0}" aria-valuemin="0" aria-valuemax="${max}"`;

        return `
            <div class="lx-progress-bar ${modeClass}" ${ariaAttrs}>
                <div class="lx-progress-fill" ${widthStyle}></div>
            </div>
            ${!isIndeterminate ? `<div class="lx-progress-label">${Math.round(percentage)}%</div>` : ''}
        `;
    };

    /**
     * Update progress bar value (for determinate mode)
     * @param {HTMLElement} el - Element with progress bar
     * @param {Number} value - New value
     */
    const updateProgressValue = (el, value) => {
        if (!el || !el._lxProgressMax) {
            return;
        }

        el._lxProgressValue = value;
        const percentage = Math.min(100, (value / el._lxProgressMax) * 100);

        const fill = el.querySelector('.lx-progress-fill');
        const label = el.querySelector('.lx-progress-label');

        if (fill) {
            fill.style.width = percentage + '%';
        }
        if (label) {
            label.textContent = Math.round(percentage) + '%';
        }
    };

    // ============================================================================
    // FADE STRATEGY
    // ============================================================================

    /**
     * Apply fade loading strategy to element
     * @param {HTMLElement} el - Target element
     * @param {Object} opts - Fade options
     */
    const applyFadeStrategy = (el, opts = {}) => {
        if (!el) {
            return;
        }

        // Store original content
        const originalContent = el.innerHTML;
        el.setAttribute('data-lx-original-content', originalContent);
        el.setAttribute('data-lx-strategy', 'fade');

        // Get fade configuration
        const duration = opts.duration || parseInt(el.getAttribute('lx-duration'), 10) || 300;
        const message = opts.message || el.getAttribute('lx-message') || 'Loading...';

        // Apply fade-out transition
        el.style.transition = `opacity ${duration}ms ease-out`;
        el.style.opacity = '0.3';

        // Add loading message if content is replaced
        if (opts.replaceContent !== false) {
            el.innerHTML = `<div class="lx-fade-message">${message}</div>`;
        }

        el.classList.add('lx-loading', 'lx-loading-fade');
    };

    /**
     * Remove fade loading strategy from element
     * @param {HTMLElement} el - Target element
     */
    const removeFadeStrategy = (el) => {
        if (!el) {
            return;
        }

        // Get fade duration for smooth transition
        const duration = parseInt(el.style.transition?.match(/(\d+)ms/)?.[1], 10) || 300;

        // Restore original content
        const originalContent = el.getAttribute('data-lx-original-content');
        if (originalContent) {
            el.innerHTML = originalContent;
        }

        // Fade back in
        el.style.opacity = '1';

        // Clean up after transition completes
        setTimeout(() => {
            el.style.transition = '';
            el.style.opacity = '';

            // Remove data attributes
            el.removeAttribute('data-lx-original-content');
            el.removeAttribute('data-lx-strategy');

            // Remove loading classes
            el.classList.remove('lx-loading', 'lx-loading-fade');
        }, duration);
    };

    // ============================================================================
    // MODULE EXPORT
    // ============================================================================

    /**
     * Create a deprecated method wrapper with warning
     * @param {Function} fn - Original function
     * @param {string} oldName - Deprecated method name
     * @param {string} newName - Replacement method name
     * @returns {Function} Wrapped function with deprecation warning
     */
    const deprecate = (fn, oldName, newName) => {
        let warned = false;
        return function(...args) {
            if (!warned) {
                warned = true;
                console.warn(
                    `[loadX] ${oldName} is deprecated and will be removed in v2.0. ` +
                    `Use ${newName} instead.`
                );
            }
            return fn.apply(this, args);
        };
    };

    // Export for bootloader integration
    if (typeof window !== 'undefined') {
        window.loadX = window.loadX || {};

        // ============================================================================
        // CORE PUBLIC API (4 methods)
        // ============================================================================

        /**
         * Initialize loadX with configuration
         * @param {Object} config - Configuration options
         * @returns {Object} Frozen API object
         */
        window.loadX.init = initLoadX;

        /**
         * Apply loading state to element
         * @param {HTMLElement} element - Target element
         * @param {Object} options - Loading options (strategy, color, etc.)
         * @returns {void}
         */
        window.loadX.apply = function(element, options = {}) {
            const config = (window.loadX.config && window.loadX.config.config) || {};
            applyLoadingState(element, options, config);
        };

        /**
         * Remove loading state from element
         * @param {HTMLElement} element - Target element
         * @returns {void}
         */
        window.loadX.remove = removeLoadingState;

        /**
         * Update loading state (e.g., progress value)
         * @param {HTMLElement} element - Target element
         * @param {number} value - New value (for progress strategy)
         * @returns {void}
         */
        window.loadX.update = function(element, value) {
            updateProgressValue(element, value);
        };

        // ============================================================================
        // DEPRECATED METHODS (backward compatibility)
        // ============================================================================

        // Deprecated: Use init() instead
        window.loadX.initLoadX = deprecate(initLoadX, 'initLoadX', 'init');

        // Deprecated: Use apply() instead
        window.loadX.applyLoadingState = deprecate(
            function(el, opts, config) {
                applyLoadingState(el, opts, config);
            },
            'applyLoadingState',
            'apply'
        );

        // Deprecated: Use remove() instead
        window.loadX.removeLoadingState = deprecate(
            removeLoadingState,
            'removeLoadingState',
            'remove'
        );

        // Deprecated: Use update() instead
        window.loadX.updateProgressValue = deprecate(
            updateProgressValue,
            'updateProgressValue',
            'update'
        );

        // Deprecated: Strategy methods are now internal
        window.loadX.applySpinnerStrategy = deprecate(
            applySpinnerStrategy,
            'applySpinnerStrategy',
            'apply({ strategy: "spinner" })'
        );

        window.loadX.removeSpinnerStrategy = deprecate(
            removeSpinnerStrategy,
            'removeSpinnerStrategy',
            'remove'
        );

        window.loadX.applySkeletonStrategy = deprecate(
            applySkeletonStrategy,
            'applySkeletonStrategy',
            'apply({ strategy: "skeleton" })'
        );

        window.loadX.removeSkeletonStrategy = deprecate(
            removeSkeletonStrategy,
            'removeSkeletonStrategy',
            'remove'
        );

        window.loadX.applyProgressStrategy = deprecate(
            applyProgressStrategy,
            'applyProgressStrategy',
            'apply({ strategy: "progress" })'
        );

        window.loadX.removeProgressStrategy = deprecate(
            removeProgressStrategy,
            'removeProgressStrategy',
            'remove'
        );

        window.loadX.applyFadeStrategy = deprecate(
            applyFadeStrategy,
            'applyFadeStrategy',
            'apply({ strategy: "fade" })'
        );

        window.loadX.removeFadeStrategy = deprecate(
            removeFadeStrategy,
            'removeFadeStrategy',
            'remove'
        );

        // Deprecated: Internal helper methods
        window.loadX.parseElementAttributes = deprecate(
            parseElementAttributes,
            'parseElementAttributes',
            'internal API'
        );

        window.loadX.validateConfig = deprecate(
            validateConfig,
            'validateConfig',
            'internal API'
        );
    }

    // Factory export for bootloader integration
    window.lxXFactory = {
        init: (config = {}) => initLoadX(config)
    };

    // Export for ES6 modules (if needed)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            init: initLoadX,
            initLoadX, // Keep for backward compat
            parseElementAttributes
        };
    }

})();
