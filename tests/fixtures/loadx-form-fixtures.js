/**
 * Test fixtures for loadX form submission detection
 */

/**
 * Create test form with loadX configuration
 * @param {string} strategy - Loading strategy (default: 'spinner')
 * @returns {HTMLFormElement}
 */
function createTestForm(strategy = 'spinner') {
    const form = document.createElement('form');
    form.setAttribute('lx-strategy', strategy);
    form.setAttribute('lx-loading', 'true');
    form.innerHTML = `
        <input type="text" name="username" value="test" />
        <button type="submit">Submit</button>
    `;
    document.body.appendChild(form);
    return form;
}

/**
 * Create mock fetch with controlled timing
 * @param {number} delayMs - Delay in milliseconds
 * @param {boolean} shouldReject - Whether to reject the promise
 * @returns {Function} Mock fetch function
 */
function createMockFetch(delayMs, shouldReject = false) {
    return () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (shouldReject) {
                    reject(new Error('Network error'));
                } else {
                    resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true })
                    });
                }
            }, delayMs);
        });
    };
}

/**
 * Create abortable fetch mock
 * @returns {Object} Object with fetch function and abort method
 */
function createAbortableFetch() {
    let abortController = null;

    const mockFetch = (url, options) => {
        if (options && options.signal) {
            abortController = options.signal;
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                resolve({ ok: true, json: () => Promise.resolve({}) });
            }, 1000);

            if (abortController) {
                abortController.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Aborted'));
                });
            }
        });
    };

    const abort = () => {
        if (abortController) {
            const event = new Event('abort');
            abortController.dispatchEvent(event);
        }
    };

    return { fetch: mockFetch, abort };
}

/**
 * Check if element has loading state
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function hasLoadingState(element) {
    return element.classList.contains('lx-loading') ||
           element.getAttribute('aria-busy') === 'true';
}

/**
 * Wait for loading state to appear
 * @param {HTMLElement} element
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForLoadingState(element, timeout = 100) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (hasLoadingState(element)) {
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
 * Wait for loading state to disappear
 * @param {HTMLElement} element
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function waitForLoadingComplete(element, timeout = 3000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (!hasLoadingState(element)) {
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
 * Cleanup DOM after test
 */
function cleanup() {
    const forms = document.querySelectorAll('form[lx-loading]');
    forms.forEach(form => form.remove());

    // Reset fetch
    if (window._originalFetch) {
        window.fetch = window._originalFetch;
    }
}

module.exports = {
    createTestForm,
    createMockFetch,
    createAbortableFetch,
    hasLoadingState,
    waitForLoadingState,
    waitForLoadingComplete,
    cleanup
};
