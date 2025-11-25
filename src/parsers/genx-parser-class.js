/**
 * genX CSS Class Parser
 * @module genx-parser-class
 * @version 1.0.0
 * @size ~1.5KB minified
 *
 * Parses CSS class notation (e.g., fmt-currency-USD-2) into configuration objects
 * using cardinality-based mapping.
 *
 * Features:
 * - Maps class prefixes to module prefixes (fmt→fx, bind→bx, etc.)
 * - Splits class by hyphens and maps to CARDINALITY_ORDERS
 * - Preserves non-genX utility classes
 * - Merges with baseConfig from verbose parsing
 * - Performance target: <0.5ms per element
 */

// Import CARDINALITY_ORDERS from verbose parser
import { CARDINALITY_ORDERS } from './genx-parser-verbose.js';

/**
 * Class prefix mapping - maps module prefixes to class prefixes
 */
export const CLASS_PREFIX_MAP = {
    fx: 'fmt',      // fmtX
    bx: 'bind',     // bindX
    ax: 'acc',      // accX
    dx: 'drag',     // dragX
    lx: 'load',     // loadX
    nx: 'nav',      // navX
    tx: 'table'     // tableX
};

/**
 * Parse CSS class notation into configuration
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @param {Object} baseConfig - Base configuration from verbose/colon/JSON parser (optional)
 * @returns {Object} Configuration object with class values mapped to attributes
 */
export function parse(element, prefix, baseConfig = {}) {
    // Start with baseConfig (from verbose/colon/JSON parsing)
    const config = { ...baseConfig };

    // Guard clause: return early if no element
    if (!element || !element.attributes) {
        return config;
    }

    // Get the class prefix for this module prefix
    const classPrefix = CLASS_PREFIX_MAP[prefix];
    if (!classPrefix) {
        return config;
    }

    // Get cardinality order for this prefix
    const order = CARDINALITY_ORDERS[prefix];
    if (!order) {
        return config;
    }

    // Get the class attribute value
    const classList = element.getAttribute('class');
    if (!classList) {
        return config;
    }

    // Split class list into individual classes
    const classes = classList.split(/\s+/);

    // Find the genX class for this module
    const genXClass = classes.find(cls => cls.startsWith(classPrefix + '-'));
    if (!genXClass) {
        return config;
    }

    // Split the genX class by hyphen
    const segments = genXClass.split('-');

    // Remove the first segment (the class prefix itself)
    segments.shift();

    // Map segments to attributes using cardinality order
    for (let i = 0; i < segments.length && i < order.length; i++) {
        config[order[i]] = segments[i];
    }

    return config;
}

// Export for ES modules
export default {
    parse,
    CLASS_PREFIX_MAP,
    CARDINALITY_ORDERS
};
