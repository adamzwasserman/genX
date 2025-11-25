/**
 * genX JSON Parser
 * @module genx-parser-json
 * @version 1.0.0
 * @size ~0.5KB minified
 *
 * Parses JSON-encoded configuration from -opts attributes.
 *
 * Features:
 * - Safe JSON.parse() with try/catch error handling
 * - Console warnings for malformed JSON with element details
 * - Merges with baseConfig from verbose/colon parsing
 * - Preserves JavaScript types (strings, numbers, booleans, null, objects, arrays)
 * - Performance target: <0.5ms per element
 */

/**
 * Get element selector string for logging
 * @param {HTMLElement} element - The element to identify
 * @returns {string} Element selector (ID, class, or tag name)
 */
function getElementSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    if (element.className) {
        const firstClass = element.className.split(' ')[0];
        return `.${firstClass}`;
    }
    return element.tagName.toLowerCase();
}

/**
 * Parse JSON configuration from -opts attribute
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @param {Object} baseConfig - Base configuration from verbose/colon parser (optional)
 * @returns {Object} Configuration object with JSON-parsed values merged with baseConfig
 */
export function parse(element, prefix, baseConfig = {}) {
    // Start with baseConfig (from verbose/colon parsing)
    const config = { ...baseConfig };

    // Guard clause: return early if no element
    if (!element || !element.attributes) {
        return config;
    }

    // Get the -opts attribute for this prefix
    const optsAttrName = `${prefix}-opts`;
    const optsValue = element.getAttribute(optsAttrName);

    // If no -opts attribute, return baseConfig as-is
    if (!optsValue) {
        return config;
    }

    // Try to parse the JSON value
    try {
        const parsed = JSON.parse(optsValue);

        // Merge parsed config with baseConfig
        // JSON values override baseConfig values
        Object.assign(config, parsed);
    } catch (error) {
        // Log warning for malformed JSON
        const elementSelector = getElementSelector(element);
        console.warn(
            `⚠️  genX: Malformed JSON in ${optsAttrName} attribute on ${elementSelector}`,
            `\n    JSON: ${optsValue}`,
            `\n    Error: ${error.message}`
        );
    }

    return config;
}

// Export for ES modules
export default {
    parse
};
