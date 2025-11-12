/**
 * Test fixtures for loadX ARIA live region management
 */

/**
 * Get ARIA live region
 * @returns {HTMLElement|null}
 */
function getLiveRegion() {
    return document.getElementById('lx-live-region');
}

/**
 * Create element with urgency flag
 * @returns {HTMLElement}
 */
function createUrgentElement() {
    const el = document.createElement('div');
    el.setAttribute('lx-strategy', 'spinner');
    el.setAttribute('lx-urgent', 'true');
    el.textContent = 'Loading content...';
    document.body.appendChild(el);
    return el;
}

/**
 * Create element with loading state
 * @param {string} strategy - Loading strategy
 * @returns {HTMLElement}
 */
function createLoadingElement(strategy = 'spinner') {
    const el = document.createElement('div');
    el.setAttribute('lx-strategy', strategy);
    el.textContent = 'Content to load...';
    document.body.appendChild(el);
    return el;
}

/**
 * Create multiple elements for testing
 * @param {number} count - Number of elements to create
 * @returns {HTMLElement[]}
 */
function createMultipleElements(count = 3) {
    const elements = [];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.id = `loading-element-${i}`;
        el.setAttribute('lx-strategy', 'spinner');
        el.textContent = `Content ${i}`;
        document.body.appendChild(el);
        elements.push(el);
    }
    return elements;
}

/**
 * Wait for ARIA announcement
 * @param {string} expectedText - Expected announcement text
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForAnnouncement(expectedText, timeout = 100) {
    return new Promise((resolve) => {
        const liveRegion = getLiveRegion();
        if (!liveRegion) {
            resolve(false);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (liveRegion.textContent === expectedText) {
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
 * Wait for live region to clear
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForClear(timeout = 1500) {
    return new Promise((resolve) => {
        const liveRegion = getLiveRegion();
        if (!liveRegion) {
            resolve(false);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (liveRegion.textContent === '') {
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
 * Get current aria-live attribute value
 * @returns {string|null}
 */
function getAriaLiveMode() {
    const liveRegion = getLiveRegion();
    return liveRegion ? liveRegion.getAttribute('aria-live') : null;
}

/**
 * Cleanup DOM after test
 */
function cleanupARIA() {
    // Remove test elements
    const elements = document.querySelectorAll('[lx-strategy]');
    elements.forEach(el => el.remove());

    // Clear live region
    const liveRegion = getLiveRegion();
    if (liveRegion) {
        liveRegion.textContent = '';
    }
}

module.exports = {
    getLiveRegion,
    createUrgentElement,
    createLoadingElement,
    createMultipleElements,
    waitForAnnouncement,
    waitForClear,
    getAriaLiveMode,
    cleanupARIA
};
