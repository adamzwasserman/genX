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
        if (!el) {
            return { strategy: 'spinner' };
        } // Default

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
        if (!className) {
            return {};
        }

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
        if (!name || typeof name !== 'string') {
            return 'spinner';
        }
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
     * Enhanced cleanup for loading state with minimum display time
     * @param {HTMLElement} element - Element to cleanup
     * @param {Object} config - Configuration object
     */
    const cleanupLoadingState = (element, config) => {
        if (!element) return;

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

                const lxConfig = element._lxConfig || parseElementAttributes(element);
                applyLoadingState(element, lxConfig, config);
                activeLoadingStates.set(element, Date.now());

                // Detect if form uses fetch/XHR or native submission
                const action = form.getAttribute('action');
                const method = (form.getAttribute('method') || 'GET').toUpperCase();

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

        // Announce to screen readers
        announceLoading('Loading');
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

        // Remove ARIA attributes
        el.removeAttribute('aria-busy');

        // Announce completion
        announceLoading('Loading complete');
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
        const computedStyle = window.getComputedStyle(el);
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
    const announceLoading = (message) => {
        const liveRegion = document.getElementById('lx-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
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
        const mode = opts.mode || el.getAttribute('lx-progress-mode') || 'indeterminate';
        const value = opts.value !== undefined ? opts.value : parseInt(el.getAttribute('lx-value'), 10);
        const max = opts.max || parseInt(el.getAttribute('lx-max'), 10) || 100;

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

        return `
            <div class="lx-progress-bar ${modeClass}">
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

    // Export for bootloader integration
    if (typeof window !== 'undefined') {
        window.loadX = window.loadX || {};
        window.loadX.initLoadX = initLoadX;
        window.loadX.parseElementAttributes = parseElementAttributes;
        window.loadX.validateConfig = validateConfig;
        window.loadX.applyLoadingState = applyLoadingState;
        window.loadX.removeLoadingState = removeLoadingState;
        window.loadX.applySpinnerStrategy = applySpinnerStrategy;
        window.loadX.removeSpinnerStrategy = removeSpinnerStrategy;
        window.loadX.applySkeletonStrategy = applySkeletonStrategy;
        window.loadX.removeSkeletonStrategy = removeSkeletonStrategy;
        window.loadX.applyProgressStrategy = applyProgressStrategy;
        window.loadX.removeProgressStrategy = removeProgressStrategy;
        window.loadX.updateProgressValue = updateProgressValue;
        window.loadX.applyFadeStrategy = applyFadeStrategy;
        window.loadX.removeFadeStrategy = removeFadeStrategy;
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
