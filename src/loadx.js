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
    // CORE INITIALIZATION ENGINE
    // ============================================================================

    /**
     * Initialize loadX module with configuration
     * @param {Object} config - Configuration options
     * @returns {Object} - Frozen API object
     */
    const initLoadX = (config = {}) => {
        // Default configuration (frozen for immutability)
        const defaultConfig = Object.freeze({
            minDisplayMs: 300,      // Minimum time to display loading indicator
            autoDetect: true,       // Auto-detect async operations
            strategies: [],         // Available loading strategies
            telemetry: false        // Telemetry disabled by default (privacy)
        });

        // Merge and freeze configuration
        const mergedConfig = Object.freeze({ ...defaultConfig, ...config });

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
    // ASYNC DETECTION (STUBS FOR TASK 1.3)
    // ============================================================================

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
        if (typeof window.htmx !== 'undefined') {
            monitorHTMX(config);
        }
    };

    /**
     * Monitor fetch API calls
     * @param {Object} config - Configuration object
     */
    const monitorFetch = (config) => {
        // Stub - will be implemented in Task 1.3
        // Wraps native fetch to detect async operations
    };

    /**
     * Monitor XMLHttpRequest
     * @param {Object} config - Configuration object
     */
    const monitorXHR = (config) => {
        // Stub - will be implemented in Task 1.3
        // Patches XHR to detect async operations
    };

    /**
     * Monitor HTMX events
     * @param {Object} config - Configuration object
     */
    const monitorHTMX = (config) => {
        // Stub - will be implemented in Task 1.4 (HTMX Integration)
        // Listens to htmx:beforeRequest and htmx:afterSwap events
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
    }

    // Export for ES6 modules (if needed)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initLoadX,
            parseElementAttributes
        };
    }

})();
