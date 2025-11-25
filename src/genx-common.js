/**
 * genx-common.js - Shared Utilities for genX Platform
 *
 * Provides foundational utilities for all genX modules:
 * - Error handling (GenXError hierarchy)
 * - Result monad for functional error handling
 * - Circuit breaker for fault tolerance
 * - Three-level cache (WeakMap/Map/Map)
 * - Common utility functions
 *
 * Architecture: Pure functional design (no classes except approved)
 * Performance: <0.5ms per operation, ≤2KB gzipped
 * Security: No eval, no innerHTML, XSS-safe
 *
 * @module genx-common
 * @version 1.0.0
 */

/* ============================================================================
 * ERROR HANDLING
 * Architecture reference: accx-architecture-v1_0.md section 6.1
 * ============================================================================ */

/**
 * Base error class for all genX errors
 * Provides structured error reporting with code, context, and timestamp
 */
class GenXError extends Error {
    constructor(code, message, context = {}) {
        super(message);
        this.name = 'GenXError';
        this.code = code;
        this.context = Object.freeze({ ...context });
        this.timestamp = Date.now();

        // Maintain proper stack trace for debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GenXError);
        }
    }
}

/**
 * ParseError - thrown when parsing attribute values fails
 */
class ParseError extends GenXError {
    constructor(code, message, context = {}) {
        super(code, message, context);
        this.name = 'ParseError';
    }
}

/**
 * EnhancementError - thrown when element enhancement fails
 */
class EnhancementError extends GenXError {
    constructor(code, message, context = {}) {
        super(code, message, context);
        this.name = 'EnhancementError';
    }
}

/**
 * ValidationError - thrown when configuration validation fails
 */
class ValidationError extends GenXError {
    constructor(code, message, context = {}) {
        super(code, message, context);
        this.name = 'ValidationError';
    }
}

/* ============================================================================
 * RESULT MONAD
 * Architecture reference: accx-architecture-v1_0.md section 3.3
 * Enables functional error handling with composable operations
 * ============================================================================ */

/**
 * Result.Ok - represents successful computation
 */
const Ok = (value) => ({
    isOk: () => true,
    isErr: () => false,
    unwrap: () => value,
    unwrapOr: (_fallback) => value,
    map: (fn) => Ok(fn(value)),
    flatMap: (fn) => fn(value)
});

/**
 * Result.Err - represents failed computation
 */
const Err = (error) => ({
    isOk: () => false,
    isErr: () => true,
    unwrap: () => {
        throw new Error(error); 
    },
    unwrapOr: (fallback) => fallback,
    map: (_fn) => Err(error),
    flatMap: (_fn) => Err(error)
});

const Result = { Ok, Err };

/* ============================================================================
 * CIRCUIT BREAKER
 * Architecture reference: accx-architecture-v1_0.md section 6.4
 * Provides fault tolerance through threshold-based failure tracking
 * ============================================================================ */

class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    /**
   * Get current circuit breaker state
   * Handles OPEN -> HALF_OPEN transition based on timeout
   */
    getState() {
        if (this.state === 'OPEN') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure >= this.timeout) {
                this.state = 'HALF_OPEN';
            }
        }
        return this.state;
    }

    /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @returns {*} Result of function execution
   * @throws {Error} If circuit is OPEN or function fails
   */
    execute(fn) {
        const currentState = this.getState();

        if (currentState === 'OPEN') {
            throw new Error('Circuit breaker is OPEN - rejecting request');
        }

        try {
            const result = fn();

            // Success handling
            if (currentState === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failureCount = 0;
            }

            this.successCount++;
            this.failureCount = 0; // Reset failure count on success

            return result;
        } catch (error) {
            // Failure handling
            this.failureCount++;
            this.lastFailureTime = Date.now();

            if (this.failureCount >= this.threshold) {
                this.state = 'OPEN';
            }

            throw error;
        }
    }
}

/* ============================================================================
 * CACHE UTILITIES
 * Architecture reference: accx-architecture-v1_0.md section 4.4
 * Three-level cache: L1 (WeakMap), L2 (Map), L3 (Map with hashed keys)
 * ============================================================================ */

/**
 * Create deterministic hash from object for cache keys
 * Order-independent: {a:1, b:2} === {b:2, a:1}
 *
 * @param {Object} obj - Object to hash
 * @returns {string} Hash string
 */
const hashOptions = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return String(obj);
    }

    // Sort keys for deterministic hashing
    const keys = Object.keys(obj).sort();
    const parts = keys.map(key => `${key}:${hashOptions(obj[key])}`);
    return parts.join('|');
};

/**
 * Generate signature for element + options combination
 * Used for cache key generation
 *
 * @param {Element} element - DOM element
 * @param {Object} options - Configuration options
 * @returns {string} Signature string
 */
const getSignature = (element, options) => {
    const elementSig = element?.id || element?.tagName || 'unknown';
    const optionsSig = hashOptions(options);
    return `${elementSig}__${optionsSig}`;
};

/**
 * Create three-level cache with LRU eviction
 * L1: WeakMap for object keys (GC-friendly)
 * L2: Map for primitive keys
 * L3: Map for hashed option objects
 *
 * @param {Object} config - Cache configuration
 * @param {number} config.maxSize - Maximum cache size (default: 1000)
 * @returns {Object} Cache API
 */
const createCache = ({ maxSize = 1000 } = {}) => {
    const l1 = new WeakMap(); // Object keys
    const l2 = new Map();     // Primitive keys
    const l3 = new Map();     // Hashed option objects

    return {
        l1,
        l2,
        l3,

        /**
     * Determine if object is a plain object (for value-based caching in L3)
     * DOM elements and class instances use L1 (reference-based)
     * Plain objects use L3 (value-based hashing)
     */
        isPlainObject(obj) {
            if (obj === null || typeof obj !== 'object') {
                return false;
            }
            // DOM elements and class instances -> L1
            if (obj instanceof Element || obj.constructor !== Object) {
                return false;
            }
            // Plain objects -> L3
            return true;
        },

        /**
     * Set value in appropriate cache level
     */
        set(key, value) {
            if (typeof key === 'object' && key !== null) {
                // Check if it's a plain object (configuration) or complex object (DOM element)
                if (this.isPlainObject(key)) {
                    // L3: Hash plain objects for value-based caching
                    const hash = hashOptions(key);
                    l3.set(hash, value);

                    // LRU eviction for L3
                    if (l3.size > maxSize) {
                        const firstKey = l3.keys().next().value;
                        l3.delete(firstKey);
                    }
                } else {
                    // L1: Use WeakMap for DOM elements and class instances
                    l1.set(key, value);
                }
            } else if (typeof key === 'string' || typeof key === 'number') {
                // L2: Use Map for primitives
                l2.set(key, value);

                // LRU eviction for L2
                if (l2.size > maxSize) {
                    const firstKey = l2.keys().next().value;
                    l2.delete(firstKey);
                }
            }
        },

        /**
     * Get value from appropriate cache level
     */
        get(key) {
            if (typeof key === 'object' && key !== null) {
                // Check if it's a plain object or complex object
                if (this.isPlainObject(key)) {
                    // L3: Get by hash for plain objects
                    const hash = hashOptions(key);
                    return l3.get(hash);
                } else {
                    // L1: Get by reference for DOM elements
                    return l1.get(key);
                }
            } else if (typeof key === 'string' || typeof key === 'number') {
                return l2.get(key);
            }
            return undefined;
        },

        /**
     * Get total cache size (L2 + L3 only, WeakMap size unknown)
     */
        size() {
            return l2.size + l3.size;
        },

        /**
     * Clear all cache levels
     */
        clear() {
            l2.clear();
            l3.clear();
            // L1 (WeakMap) will be GC'd naturally
        }
    };
};

/* ============================================================================
 * UTILITY FUNCTIONS
 * Common helpers used across genX modules
 * ============================================================================ */

/**
 * Convert kebab-case to camelCase
 * Used for attribute name transformations
 *
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 *
 * @example
 * kebabToCamel('data-format-currency') // 'dataFormatCurrency'
 */
const kebabToCamel = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Module-specific cardinality orders for colon syntax
 * Defines parameter order by importance for each module
 */
const CARDINALITY_ORDERS = {
    fx: ['format', 'currency', 'decimals', 'symbol'],
    bx: ['bind', 'debounce', 'throttle'],
    ax: ['label', 'icon', 'value', 'role'],
    dx: ['type', 'id', 'style', 'group'],
    lx: ['type', 'color', 'size'],
    nx: ['type', 'label', 'href', 'target']
};

/**
 * Map CSS class prefixes to attribute prefixes
 * Using full module names to avoid conflicts
 */
const CLASS_PREFIX_MAP = {
    'fmtx': 'fx',
    'bindx': 'bx',
    'accx': 'ax',
    'dragx': 'dx',
    'loadx': 'lx',
    'navx': 'nx',
    'tablex': 'tx'
};

/**
 * Parse polymorphic notation from element
 * Supports 4 notation styles with priority: JSON > Colon > Verbose > CSS Classes
 *
 * @param {HTMLElement} element - DOM element to parse
 * @param {string} prefix - Module prefix (fx, bx, ax, dx, lx, nx)
 * @returns {Object} Parsed configuration object
 *
 * @example
 * // Verbose: <span fx-format="currency" fx-currency="USD">
 * parseNotation(el, 'fx') // {format: 'currency', currency: 'USD'}
 *
 * // Colon: <span fx-format="currency:USD:2">
 * parseNotation(el, 'fx') // {format: 'currency', currency: 'USD', decimals: '2'}
 *
 * // JSON: <span fx-opts='{"format":"currency","currency":"USD"}'>
 * parseNotation(el, 'fx') // {format: 'currency', currency: 'USD'}
 *
 * // CSS: <span class="fmt-currency-USD-2">
 * parseNotation(el, 'fx') // {format: 'currency', currency: 'USD', decimals: '2'}
 */
const parseNotation = (element, prefix) => {
    if (!element || !prefix) {
        return {};
    }

    const config = {};

    // 1. Parse CSS Classes (lowest priority)
    const cssConfig = parseClassNotation(element, prefix);
    Object.assign(config, cssConfig);

    // 2. Parse Verbose Attributes
    const verboseConfig = parseVerboseAttributes(element, prefix);
    Object.assign(config, verboseConfig);

    // 3. Parse Colon Syntax (overrides verbose)
    const colonConfig = parseColonSyntax(element, prefix);
    Object.assign(config, colonConfig);

    // 4. Parse JSON Config (highest priority, overrides all)
    const jsonConfig = parseJsonConfig(element, prefix);
    Object.assign(config, jsonConfig);

    return config;
};

/**
 * Parse CSS class notation
 * Format: class="prefix-param1-param2-param3"
 *
 * @param {HTMLElement} element - DOM element
 * @param {string} prefix - Module prefix (fx, bx, ax, etc.)
 * @returns {Object} Parsed config
 */
const parseClassNotation = (element, prefix) => {
    const config = {};
    const classList = element.className;

    if (!classList || typeof classList !== 'string') {
        return config;
    }

    // Find the CSS class prefix that maps to this module prefix
    let classPrefix = null;
    for (const [cssPrefix, attrPrefix] of Object.entries(CLASS_PREFIX_MAP)) {
        if (attrPrefix === prefix) {
            classPrefix = cssPrefix;
            break;
        }
    }

    if (!classPrefix) {
        return config;
    }

    // Find class matching pattern: prefix-param1-param2-param3
    const classes = classList.split(/\s+/);
    const regex = new RegExp(`^${classPrefix}-(.+)$`);

    for (const cls of classes) {
        const match = cls.match(regex);
        if (match) {
            const parts = match[1].split('-');
            const cardinalityOrder = CARDINALITY_ORDERS[prefix] || [];

            // Map parts to config keys using cardinality order
            parts.forEach((part, index) => {
                if (cardinalityOrder[index]) {
                    config[cardinalityOrder[index]] = part;
                }
            });
            break; // Only parse first matching class
        }
    }

    return config;
};

/**
 * Parse verbose attribute notation
 * Format: fx-format="currency" fx-currency="USD"
 *
 * @param {HTMLElement} element - DOM element
 * @param {string} prefix - Module prefix
 * @returns {Object} Parsed config
 */
const parseVerboseAttributes = (element, prefix) => {
    const config = {};
    const attributes = element.attributes;

    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        const attrName = attr.name;

        // Check if attribute starts with prefix-
        if (attrName.startsWith(`${prefix}-`)) {
            // Skip -opts and -raw attributes (handled separately)
            if (attrName === `${prefix}-opts` || attrName === `${prefix}-raw`) {
                continue;
            }

            // Extract key: fx-currency -> currency
            const key = attrName.substring(prefix.length + 1);
            config[key] = attr.value;
        }
    }

    return config;
};

/**
 * Parse colon syntax notation
 * Format: fx-format="currency:USD:2"
 *
 * @param {HTMLElement} element - DOM element
 * @param {string} prefix - Module prefix
 * @returns {Object} Parsed config
 */
const parseColonSyntax = (element, prefix) => {
    const config = {};
    const cardinalityOrder = CARDINALITY_ORDERS[prefix] || [];

    if (cardinalityOrder.length === 0) {
        return config;
    }

    // Look for the primary attribute (first in cardinality order)
    const primaryKey = cardinalityOrder[0];
    const attrName = `${prefix}-${primaryKey}`;
    const attrValue = element.getAttribute(attrName);

    if (!attrValue || !attrValue.includes(':')) {
        return config;
    }

    // Split by colon and map to cardinality order
    const parts = attrValue.split(':');
    parts.forEach((part, index) => {
        if (part && cardinalityOrder[index]) {
            config[cardinalityOrder[index]] = part;
        }
    });

    return config;
};

/**
 * Parse JSON configuration notation
 * Format: fx-opts='{"format":"currency","currency":"USD"}'
 *
 * @param {HTMLElement} element - DOM element
 * @param {string} prefix - Module prefix
 * @returns {Object} Parsed config
 */
const parseJsonConfig = (element, prefix) => {
    const optsAttr = element.getAttribute(`${prefix}-opts`);

    if (!optsAttr) {
        return {};
    }

    const result = safeJsonParse(optsAttr);

    if (result.isErr()) {
        // Log warning for malformed JSON
        if (typeof console !== 'undefined') {
            console.warn(`genX: Failed to parse ${prefix}-opts JSON:`, result.unwrapOr(''));
        }
        return {};
    }

    return result.unwrap();
};

/**
 * Safe JSON parsing that returns Result monad
 * Never throws - returns Err on parse failure
 *
 * @param {string} jsonStr - JSON string to parse
 * @returns {Result} Ok(parsed) or Err(error)
 *
 * @example
 * safeJsonParse('{"a":1}').unwrap() // {a: 1}
 * safeJsonParse('{bad}').isErr() // true
 */
const safeJsonParse = (jsonStr) => {
    try {
        if (!jsonStr || typeof jsonStr !== 'string') {
            return Err('Invalid input: expected non-empty string');
        }
        const parsed = JSON.parse(jsonStr);
        return Ok(parsed);
    } catch (error) {
        return Err(`JSON parse error: ${error.message}`);
    }
};

/**
 * Generate unique ID with prefix
 * Uses timestamp + random for uniqueness
 *
 * @param {string} prefix - ID prefix (default: 'genx')
 * @returns {string} Unique ID
 *
 * @example
 * generateId('genx') // 'genx-1699564800123-a3f9c2'
 */
let idCounter = 0;
const generateId = (prefix = 'genx') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const counter = idCounter++;
    return `${prefix ? prefix + '-' : ''}${timestamp}-${random}-${counter}`;
};

/**
 * Debounce function execution
 * Delays execution until after wait ms have passed since last call
 *
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @param {boolean} immediate - Execute on leading edge if true
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
const debounce = (fn, wait, immediate = false) => {
    let timeout = null;
    let _lastCallTime = null;

    return function debounced(...args) {
        const context = this;
        const callTime = Date.now();

        const later = () => {
            timeout = null;
            if (!immediate) {
                fn.apply(context, args);
            }
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        _lastCallTime = callTime;

        if (callNow) {
            fn.apply(context, args);
        }
    };
};

/* ============================================================================
 * MODULE EXPORTS
 * ============================================================================ */

const genxCommon = {
    errors: {
        GenXError,
        ParseError,
        EnhancementError,
        ValidationError
    },
    Result: {
        Ok,
        Err
    },
    CircuitBreaker,
    cache: {
        createCache,
        hashOptions,
        getSignature
    },
    utils: {
        kebabToCamel,
        safeJsonParse,
        generateId,
        debounce
    },
    notation: {
        parseNotation,
        parseClassNotation,
        parseVerboseAttributes,
        parseColonSyntax,
        parseJsonConfig,
        CARDINALITY_ORDERS,
        CLASS_PREFIX_MAP
    }
};

// Browser global export
if (typeof window !== 'undefined') {
    window.genxCommon = genxCommon;
}

// ES Module export
export {
    GenXError,
    ParseError,
    EnhancementError,
    ValidationError,
    Result,
    Ok,
    Err,
    CircuitBreaker,
    createCache,
    hashOptions,
    getSignature,
    kebabToCamel,
    safeJsonParse,
    generateId,
    debounce,
    parseNotation,
    parseClassNotation,
    parseVerboseAttributes,
    parseColonSyntax,
    parseJsonConfig,
    CARDINALITY_ORDERS,
    CLASS_PREFIX_MAP
};

export default genxCommon;
