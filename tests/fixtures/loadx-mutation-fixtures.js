/**
 * Test fixtures for loadX dynamic content detection
 */

/**
 * Create element for dynamic insertion
 * @param {string} strategy - Strategy name (spinner, fade, etc.)
 * @param {string|null} id - Optional element ID
 * @returns {HTMLElement}
 */
function createDynamicElement(strategy = 'spinner', id = null) {
    const el = document.createElement('div');
    if (id) el.id = id;
    el.setAttribute('lx-strategy', strategy);
    el.setAttribute('lx-loading', 'true');
    el.textContent = 'Dynamic content';
    return el;
}

/**
 * Rapidly add multiple elements
 * @param {number} count - Number of elements to add
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]}
 */
function rapidlyAddElements(count, container) {
    const elements = [];
    for (let i = 0; i < count; i++) {
        const el = createDynamicElement('spinner', `dynamic-${i}`);
        container.appendChild(el);
        elements.push(el);
    }
    return elements;
}

/**
 * Monitor mutation observer activity
 */
class MutationMonitor {
    constructor() {
        this.scanCount = 0;
        this.elementsProcessed = [];
    }

    track(callback) {
        const originalCallback = callback;
        return (...args) => {
            this.scanCount++;
            const result = originalCallback(...args);
            if (result) {
                this.elementsProcessed.push(result);
            }
            return result;
        };
    }

    reset() {
        this.scanCount = 0;
        this.elementsProcessed = [];
    }
}

/**
 * Measure browser responsiveness
 * @param {Function} operation - Async operation to measure
 * @returns {Promise<{duration: number, isResponsive: boolean}>}
 */
async function measureResponsiveness(operation) {
    const start = performance.now();
    await operation();
    const duration = performance.now() - start;

    // Check if browser is responsive (can execute microtask)
    const isResponsive = await new Promise(resolve => {
        setTimeout(() => resolve(true), 0);
    });

    return { duration, isResponsive };
}

/**
 * Wait for element to be tracked by loadX
 * @param {HTMLElement} element - Element to check
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForElementTracked(element, timeout = 1000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (element.hasAttribute('data-lx-tracked') || element._lxConfig) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 10);
    });
}

/**
 * Count tracked elements
 * @param {HTMLElement} container - Container to search
 * @returns {number}
 */
function countTrackedElements(container) {
    const elements = container.querySelectorAll('[data-lx-tracked], [lx-loading]');
    return Array.from(elements).filter(el =>
        el.hasAttribute('data-lx-tracked') || el._lxConfig
    ).length;
}

/**
 * Cleanup mutation test artifacts
 */
function cleanupMutation() {
    // Remove dynamic elements
    const dynamicElements = document.querySelectorAll('[id^="dynamic-"]');
    dynamicElements.forEach(el => el.remove());

    // Clear any tracked state
    const trackedElements = document.querySelectorAll('[data-lx-tracked]');
    trackedElements.forEach(el => {
        el.removeAttribute('data-lx-tracked');
        delete el._lxConfig;
    });

    // Disconnect mutation observer if exists
    if (window.loadX && window.loadX._mutationObserver) {
        window.loadX._mutationObserver.disconnect();
    }
}

module.exports = {
    createDynamicElement,
    rapidlyAddElements,
    MutationMonitor,
    measureResponsiveness,
    waitForElementTracked,
    countTrackedElements,
    cleanupMutation
};
