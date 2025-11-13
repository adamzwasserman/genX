/**
 * Test fixtures for loadX Phase 1 integration testing
 */

const { createTestForm, createMockFetch } = require('./loadx-form-fixtures');
const { getLiveRegion, waitForAnnouncement, waitForClear } = require('./loadx-aria-fixtures');

/**
 * Create urgent form
 * @returns {HTMLFormElement}
 */
function createUrgentForm() {
    const form = createTestForm('spinner');
    form.setAttribute('lx-urgent', 'true');
    return form;
}

/**
 * Create multiple test forms
 * @param {number} count - Number of forms to create
 * @returns {HTMLFormElement[]}
 */
function createMultipleForms(count = 2) {
    const forms = [];
    for (let i = 0; i < count; i++) {
        const form = document.createElement('form');
        form.id = `test-form-${i}`;
        form.setAttribute('lx-strategy', 'spinner');
        form.setAttribute('lx-loading', 'true');
        form.innerHTML = `
            <input type="text" name="field${i}" value="test${i}" />
            <button type="submit">Submit ${i}</button>
        `;
        document.body.appendChild(form);
        forms.push(form);
    }
    return forms;
}

/**
 * Setup staggered mock responses for multiple forms
 * @param {number[]} delays - Array of delays in ms
 * @returns {Function} Mock fetch function
 */
function setupStaggeredResponses(delays) {
    let callCount = 0;
    return () => {
        const delay = delays[callCount % delays.length];
        callCount++;
        return new Promise(resolve => {
            setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), delay);
        });
    };
}

/**
 * Check if element has loading state
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function hasLoadingState(element) {
    return element.classList.contains('lx-loading') ||
           element.getAttribute('aria-busy') === 'true' ||
           !!element.querySelector('.lx-loading');
}

/**
 * Get ARIA live mode
 * @returns {string|null}
 */
function getAriaLiveMode() {
    const liveRegion = getLiveRegion();
    return liveRegion ? liveRegion.getAttribute('aria-live') : null;
}

/**
 * Count ARIA announcement messages
 * @returns {number}
 */
function countAriaMessages() {
    const liveRegion = getLiveRegion();
    if (!liveRegion) return 0;
    const text = liveRegion.textContent.trim();
    return text ? text.split('\n').filter(line => line.trim()).length : 0;
}

/**
 * Wait for all loading states to clear
 * @param {HTMLElement[]} elements
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForAllLoadingComplete(elements, timeout = 3000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            const allClear = elements.every(el => !hasLoadingState(el));
            if (allClear) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 50);
    });
}

/**
 * Cleanup integration tests
 */
function cleanupIntegration() {
    // Remove all forms
    const forms = document.querySelectorAll('form[lx-loading]');
    forms.forEach(form => form.remove());

    // Clear live region
    const liveRegion = getLiveRegion();
    if (liveRegion) {
        liveRegion.textContent = '';
        liveRegion.setAttribute('aria-live', 'polite');
    }

    // Reset fetch
    if (window._originalFetch) {
        window.fetch = window._originalFetch;
    }
}

module.exports = {
    createUrgentForm,
    createMultipleForms,
    setupStaggeredResponses,
    hasLoadingState,
    getAriaLiveMode,
    countAriaMessages,
    waitForAllLoadingComplete,
    cleanupIntegration
};
