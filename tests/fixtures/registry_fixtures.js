/**
 * Test fixtures for bindX binding registry
 */

/**
 * Create a mock binding object
 * @param {string} path - Property path
 * @param {HTMLElement} element - DOM element
 * @param {string} type - Binding type ('model', 'bind', 'compute')
 * @returns {Object} Mock binding object
 */
export const createMockBinding = (path, element, type = 'model') => ({
    id: `binding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    path,
    element,
    type,
    created: Date.now(),
    updateDOM: () => {},
    destroy: () => {}
});

/**
 * Create multiple mock DOM elements
 * @param {number} count - Number of elements to create
 * @returns {Array<HTMLElement>} Array of elements
 */
export const createMockElements = (count) => {
    return Array.from({ length: count }, (_, i) => {
        const el = document.createElement('input');
        el.id = `test-${i}`;
        el.setAttribute('data-test-id', `element-${i}`);
        return el;
    });
};

/**
 * Create mock select element
 * @param {Array<string>} options - Option values
 * @returns {HTMLSelectElement} Select element
 */
export const createMockSelect = (options = ['red', 'blue', 'green']) => {
    const select = document.createElement('select');
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });
    return select;
};

/**
 * Create mock checkbox element
 * @returns {HTMLInputElement} Checkbox element
 */
export const createMockCheckbox = () => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    return input;
};

/**
 * Create mock textarea element
 * @returns {HTMLTextAreaElement} Textarea element
 */
export const createMockTextarea = () => {
    return document.createElement('textarea');
};
