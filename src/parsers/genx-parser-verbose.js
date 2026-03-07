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
 * @param {Object} baseConfig - Base configuration from prior parsers in the pipeline
 * @returns {Object} Configuration object merged with baseConfig
 */
export function parse(element, prefix, baseConfig = {}) {
    if (!element?.attributes) return baseConfig;

    return {
        ...baseConfig,
        ...Object.fromEntries(
            Array.from(element.attributes)
                .filter(a => a.name.startsWith(prefix + '-') && !a.name.endsWith('-opts') && !a.name.endsWith('-raw'))
                .map(a => [kebabToCamel(a.name.substring(prefix.length + 1)), a.value])
        )
    };
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
