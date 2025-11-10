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
        // Parse loading attributes
        const strategy = el.getAttribute('lx-strategy');
        const loading = el.getAttribute('lx-loading');

        // Check for class-based syntax
        const classes = el.className.split(' ');
        const lxClass = classes.find(c => c.startsWith('lx-'));

        if (strategy || loading || lxClass) {
            // Element detected and registered
            // Actual processing will be implemented in Task 1.2 (Attribute Processing)
            return true;
        }

        return false;
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
    }

    // Export for ES6 modules (if needed)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initLoadX };
    }

})();
