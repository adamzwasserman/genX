/**
 * genX Verbose Attribute Parser
 * @module genx-parser-verbose
 * @version 1.0.0
 * @size ~2KB minified
 *
 * Parses verbose attribute notation (fx-format="currency" fx-currency="USD")
 * into configuration objects for genX modules.
 *
 * Features:
 * - Extracts attributes matching prefix pattern (e.g., fx-*)
 * - Skips -opts and -raw attributes automatically
 * - Supports all module prefixes (fx, bx, ax, dx, lx, nx, tx)
 * - Performance target: <0.5ms per element
 */

/**
 * Convert kebab-case to camelCase
 * @param {string} str - The kebab-case string
 * @returns {string} - The camelCase string
 */
function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Parse verbose attributes from an element
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @returns {Object} Configuration object extracted from attributes
 */
export function parse(element, prefix) {
    const config = {};

    // Guard clause: return early if no element
    if (!element || !element.attributes) {
        return config;
    }

    // Iterate through all attributes on the element
    const attrs = element.attributes;
    for (let i = 0; i < attrs.length; i++) {
        const attrName = attrs[i].name;
        const attrValue = attrs[i].value;

        // Check if attribute starts with the target prefix
        if (attrName.startsWith(prefix + '-')) {
            // Skip -opts and -raw attributes
            if (attrName.endsWith('-opts') || attrName.endsWith('-raw')) {
                continue;
            }

            // Extract the attribute key by removing prefix and hyphen
            const key = attrName.substring(prefix.length + 1);

            // Convert kebab-case to camelCase (e.g., phone-format → phoneFormat)
            const camelKey = kebabToCamel(key);

            // Add to config object with camelCase key
            config[camelKey] = attrValue;
        }
    }

    return config;
}

/**
 * CARDINALITY_ORDERS defines attribute priority for each module
 * Used to determine which attributes should be processed first
 */
export const CARDINALITY_ORDERS = {
    fx: ['format', 'currency', 'decimals', 'pattern', 'locale'],
    bx: ['bind', 'debounce', 'validate', 'transform'],
    ax: ['label', 'icon', 'shortcut', 'role'],
    dx: ['draggable', 'zone', 'handle', 'data'],
    lx: ['src', 'debounce', 'cache', 'transform'],
    nx: ['route', 'pushState', 'title', 'params'],
    tx: ['sortable', 'paginate', 'filter', 'columns']
};

// Export for ES modules
export default {
    parse,
    CARDINALITY_ORDERS
};
