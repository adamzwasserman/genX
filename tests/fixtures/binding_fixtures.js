/**
 * Test fixtures for bindX two-way and one-way bindings
 */

/**
 * Create test input element
 * @param {string} type - Input type (text, number, checkbox, etc.)
 * @param {Object} attrs - Additional attributes
 * @returns {HTMLInputElement} Input element
 */
export const createTestInput = (type = 'text', attrs = {}) => {
    const input = document.createElement('input');
    input.type = type;

    Object.entries(attrs).forEach(([key, value]) => {
        input.setAttribute(key, value);
    });

    return input;
};

/**
 * Create test select element
 * @param {Array<string>} options - Option values
 * @param {Object} attrs - Additional attributes
 * @returns {HTMLSelectElement} Select element
 */
export const createTestSelect = (options = ['red', 'blue', 'green'], attrs = {}) => {
    const select = document.createElement('select');

    Object.entries(attrs).forEach(([key, value]) => {
        select.setAttribute(key, value);
    });

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });

    return select;
};

/**
 * Create test textarea element
 * @param {Object} attrs - Additional attributes
 * @returns {HTMLTextAreaElement} Textarea element
 */
export const createTestTextarea = (attrs = {}) => {
    const textarea = document.createElement('textarea');

    Object.entries(attrs).forEach(([key, value]) => {
        textarea.setAttribute(key, value);
    });

    return textarea;
};

/**
 * Simulate user input on an element
 * @param {HTMLElement} element - Element to simulate input on
 * @param {*} value - Value to set
 */
export const simulateInput = (element, value) => {
    if (element.type === 'checkbox') {
        element.checked = value;
    } else if (element.type === 'number') {
        element.value = String(value);
    } else {
        element.value = String(value);
    }

    // Trigger input event
    const event = new Event('input', {
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
};

/**
 * Simulate change event on an element
 * @param {HTMLElement} element - Element to simulate change on
 * @param {*} value - Value to set
 */
export const simulateChange = (element, value) => {
    if (element.tagName === 'SELECT') {
        element.value = value;
    } else if (element.type === 'checkbox') {
        element.checked = value;
    } else {
        element.value = String(value);
    }

    const event = new Event('change', {
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
};

/**
 * Wait for debounce delay
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const waitForDebounce = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Wait for next animation frame
 * @returns {Promise<void>}
 */
export const waitForNextFrame = () => {
    return new Promise(resolve => requestAnimationFrame(resolve));
};

/**
 * Simulate rapid typing (for debounce testing)
 * @param {HTMLElement} element - Input element
 * @param {string} text - Text to type
 * @param {number} delayMs - Delay between characters
 * @returns {Promise<void>}
 */
export const simulateRapidTyping = async (element, text, delayMs = 10) => {
    for (const char of text) {
        element.value = element.value + char;
        simulateInput(element, element.value);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
};
