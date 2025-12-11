/**
 * genX Colon Syntax Parser
 * @module genx-parser-colon
 * @version 1.0.0
 * @size ~1.5KB minified
 *
 * Parses colon-separated attribute values (fx-format="currency:USD:2")
 * into configuration objects using cardinality-based mapping.
 *
 * Features:
 * - Splits colon-separated values into array
 * - Maps values to attribute names using CARDINALITY_ORDERS
 * - Merges with baseConfig from verbose parsing
 * - Handles edge cases (trailing/leading colons, empty values)
 * - Performance target: <0.5ms per element
 */

// Import CARDINALITY_ORDERS from verbose parser
import { CARDINALITY_ORDERS } from './genx-parser-verbose.js';

/**
 * Parse colon-separated attribute values
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @param {Object} baseConfig - Base configuration from verbose parser (optional)
 * @returns {Object} Configuration object with colon values mapped to attributes
 */
export function parse(element, prefix, baseConfig = {}) {
    // Start with baseConfig (from verbose parsing)
    const config = { ...baseConfig };

    // Guard clause: return early if no element
    if (!element || !element.attributes) {
        return config;
    }

    // Get cardinality order for this prefix
    const order = CARDINALITY_ORDERS[prefix];
    if (!order) {
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

            // Check if attribute value contains colons
            if (attrValue.includes(':')) {
                // Split by colon
                const values = attrValue.split(':');

                // Extract the attribute key
                const key = attrName.substring(prefix.length + 1);

                // Map the first value to the attribute key
                config[key] = values[0];

                // Map remaining values according to cardinality order
                // Start from index 1 in order (skip first which is the attribute key itself)
                const keyIndex = order.indexOf(key);
                if (keyIndex !== -1) {
                    // Map subsequent values starting from the position after key
                    for (let j = 1; j < values.length && (keyIndex + j) < order.length; j++) {
                        config[order[keyIndex + j]] = values[j];
                    }
                }
            }
        }
    }

    return config;
}

// Export for ES modules
export default {
    parse,
    CARDINALITY_ORDERS
};
