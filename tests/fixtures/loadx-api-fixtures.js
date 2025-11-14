/**
 * Test fixtures for loadX API cleanup testing
 */

/**
 * Check if a method exists on window.loadX
 * @param {string} methodName - Name of the method to check
 * @returns {boolean}
 */
function hasMethod(methodName) {
    return typeof window.loadX !== 'undefined' &&
           typeof window.loadX[methodName] === 'function';
}

/**
 * Create a test element for API testing
 * @param {string} id - Element ID
 * @returns {HTMLElement}
 */
function createApiTestElement(id = 'api-test-element') {
    const el = document.createElement('div');
    el.id = id;
    el.textContent = 'Test element';
    document.body.appendChild(el);
    return el;
}

/**
 * Capture console warnings
 * @returns {Object} - Warning capture object with start/stop methods
 */
function captureWarnings() {
    const warnings = [];
    const originalWarn = console.warn;

    return {
        start: () => {
            console.warn = (...args) => {
                warnings.push(args.join(' '));
                originalWarn.apply(console, args);
            };
        },
        stop: () => {
            console.warn = originalWarn;
        },
        getWarnings: () => warnings,
        hasWarning: (text) => warnings.some(w => w.includes(text))
    };
}

/**
 * Check if element has loading state
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function hasLoadingState(element) {
    return element.classList.contains('lx-loading') ||
           element.getAttribute('aria-busy') === 'true' ||
           !!element.querySelector('.lx-loading');
}

/**
 * Get progress value from element
 * @param {HTMLElement} element - Element with progress strategy
 * @returns {number|null}
 */
function getProgressValue(element) {
    const progressBar = element.querySelector('[role="progressbar"]');
    if (!progressBar) return null;

    const ariaValue = progressBar.getAttribute('aria-valuenow');
    return ariaValue ? parseInt(ariaValue, 10) : null;
}

/**
 * Cleanup API test artifacts
 */
function cleanupApi() {
    // Remove test elements
    const testElements = document.querySelectorAll('[id^="api-test-"]');
    testElements.forEach(el => el.remove());

    // Clear loading states
    const loadingElements = document.querySelectorAll('.lx-loading, [aria-busy="true"]');
    loadingElements.forEach(el => {
        el.classList.remove('lx-loading');
        el.removeAttribute('aria-busy');
    });

    // Disconnect loadX if exists
    if (window.loadX && window.loadX.disconnect) {
        window.loadX.disconnect();
    }
}

/**
 * Initialize loadX with default test config
 * @param {Object} config - Optional config override
 * @returns {Object}
 */
function initializeLoadX(config = {}) {
    const defaultConfig = {
        autoDetect: false,
        minDisplayMs: 100
    };

    const mergedConfig = { ...defaultConfig, ...config };

    if (window.loadX && window.loadX.init) {
        return window.loadX.init(mergedConfig);
    } else if (window.initLoadX) {
        return window.initLoadX(mergedConfig);
    }

    throw new Error('loadX initialization method not found');
}

/**
 * Check if loadX is initialized
 * @returns {boolean}
 */
function isLoadXInitialized() {
    return typeof window.loadX !== 'undefined' &&
           (window.loadX.config || window.loadX._initialized);
}

module.exports = {
    hasMethod,
    createApiTestElement,
    captureWarnings,
    hasLoadingState,
    getProgressValue,
    cleanupApi,
    initializeLoadX,
    isLoadXInitialized
};
