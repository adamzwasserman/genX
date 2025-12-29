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

// Safety / performance constants
export const DEFAULT_OPTIONS = {
    coerceNumbers: true,
    maxSegmentLength: 64,
    maxSegments: 10
};

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
// conservative allowed chars in segment values: alnum, _, :, -, @, .
function isSafeToken(str) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        // 0-9
        if (c >= 48 && c <= 57) {
            continue;
        }
        // A-Z
        if (c >= 65 && c <= 90) {
            continue;
        }
        // a-z
        if (c >= 97 && c <= 122) {
            continue;
        }
        // underscore, colon, dash, at, dot
        if (c === 95 || c === 58 || c === 45 || c === 64 || c === 46) {
            continue;
        }
        return false;
    }
    return true;
}

// Simple in-memory cache for parsed class strings to avoid repeated work
const CLASS_PARSE_CACHE = new Map();
const CACHE_MAX = 2000;

/**
 * Parse CSS class notation into configuration
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @param {Object} baseConfig - Base configuration from verbose/colon/JSON parser (optional)
 * @returns {Object} Configuration object with class values mapped to attributes
 */
/**
 * Return the first class on `element` that begins with `classPrefix-`, or null.
 */
export function getGenXClassForPrefix(element, classPrefix) {
    if (!element || !element.classList) {
        return null;
    }
    const search = classPrefix + '-';
    for (const cls of element.classList) {
        if (typeof cls === 'string' && cls.startsWith(search)) {
            return cls;
        }
    }
    return null;
}

/**
 * Safely map segments into config according to order. Skips dangerous keys and
 * enforces limits in `options`.
 */
export function mapSegmentsToConfig(targetConfig, order, segments, options = {}) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    if (!Array.isArray(order) || !order.length) {
        return targetConfig;
    }

    const maxSeg = Math.max(0, Number(opts.maxSegments) || DEFAULT_OPTIONS.maxSegments);
    const maxLen = Math.max(1, Number(opts.maxSegmentLength) || DEFAULT_OPTIONS.maxSegmentLength);

    for (let i = 0; i < segments.length && i < order.length && i < maxSeg; i++) {
        const key = order[i];
        const raw = segments[i];

        if (!key || typeof key !== 'string') {
            continue;
        }
        if (DANGEROUS_KEYS.has(key)) {
            continue;
        }
        if (typeof raw !== 'string') {
            continue;
        }
        if (raw.length === 0 || raw.length > maxLen) {
            continue;
        }
        if (!isSafeToken(raw)) {
            continue;
        }

        let val = raw;
        if (opts.coerceNumbers) {
            const num = Number(raw);
            if (String(num) === raw && Number.isFinite(num)) {
                val = num;
            }
        }

        // Direct assignment is fast; we've already filtered dangerous keys.
        targetConfig[key] = val;
    }

    return targetConfig;
}

/**
 * Faster mapping that scans a class string like "fmt-currency-USD-2" without
 * allocating an intermediate segments array. This is optimized for hot paths.
 */
export function mapClassStringToConfig(targetConfig, order, classString, options = {}, mappedKeys) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    if (!Array.isArray(order) || order.length === 0) {
        return targetConfig;
    }

    const maxSeg = Math.max(0, Number(opts.maxSegments) || DEFAULT_OPTIONS.maxSegments);
    const maxLen = Math.max(1, Number(opts.maxSegmentLength) || DEFAULT_OPTIONS.maxSegmentLength);

    // Skip the initial prefix and hyphen (e.g., "fmt-")
    let idx = classString.indexOf('-');
    if (idx === -1) {
        return targetConfig;
    }
    idx += 1; // move to start of first segment

    let segPos = 0;
    let start = idx;
    for (let i = idx; i <= classString.length; i++) {
        const ch = classString.charAt(i);
        const isEnd = i === classString.length || ch === '-';
        if (!isEnd) {
            continue;
        }

        if (segPos >= maxSeg || segPos >= order.length) {
            break;
        }

        const raw = classString.substring(start, i);
        start = i + 1;

        const key = order[segPos];
        segPos += 1;

        if (!raw || raw.length === 0 || raw.length > maxLen) {
            continue;
        }
        if (!isSafeToken(raw)) {
            continue;
        }
        if (!key || DANGEROUS_KEYS.has(key)) {
            continue;
        }

        let val = raw;
        if (opts.coerceNumbers) {
            const num = Number(raw);
            if (String(num) === raw && Number.isFinite(num)) {
                val = num;
            }
        }

        targetConfig[key] = val;
        if (Array.isArray(mappedKeys)) {
            mappedKeys.push(key);
        }
    }

    return targetConfig;
}

/**
 * Parse CSS class notation into configuration
 * @param {HTMLElement} element - The element to parse
 * @param {string} prefix - The module prefix (fx, bx, ax, etc.)
 * @param {Object} baseConfig - Base configuration from verbose/colon/JSON parser (optional)
 * @param {Object} options - Parse options (coerceNumbers, maxSegmentLength, maxSegments)
 */
export function parse(element, prefix, baseConfig = {}, options = {}) {
    // Avoid copying baseConfig until we know we have mapping work to do.
    if (!element || !element.classList) {
        return Object.assign({}, baseConfig);
    }

    const classPrefix = CLASS_PREFIX_MAP[prefix];
    if (!classPrefix) {
        return Object.assign({}, baseConfig);
    }

    const order = CARDINALITY_ORDERS[prefix];
    if (!Array.isArray(order)) {
        return Object.assign({}, baseConfig);
    }

    const genXClass = getGenXClassForPrefix(element, classPrefix);
    if (!genXClass) {
        return Object.assign({}, baseConfig);
    }

    // Check cache first (cache key includes prefix to avoid collisions)
    // include relevant options in cache key (coercion affects typed values)
    const optKey = (options && typeof options.coerceNumbers !== 'undefined') ? String(options.coerceNumbers) : String(DEFAULT_OPTIONS.coerceNumbers);
    const optMaxSeg = (options && typeof options.maxSegments !== 'undefined') ? String(options.maxSegments) : String(DEFAULT_OPTIONS.maxSegments);
    const optMaxLen = (options && typeof options.maxSegmentLength !== 'undefined') ? String(options.maxSegmentLength) : String(DEFAULT_OPTIONS.maxSegmentLength);
    const cacheKey = prefix + ':' + genXClass + ':c=' + optKey + ':ms=' + optMaxSeg + ':ml=' + optMaxLen;
    const cached = CLASS_PARSE_CACHE.get(cacheKey);
    if (cached) {
        // merge with baseConfig copy
        return Object.assign({}, baseConfig, cached);
    }

    // Only now copy baseConfig because we're about to mutate it
    const config = Object.assign({}, baseConfig);

    // Use the faster scanner-based mapper to avoid allocations
    const mapped = [];
    mapClassStringToConfig(config, order, genXClass, options, mapped);

    // Store a shallow clone of added keys in cache to reuse later
    if (mapped.length > 0) {
        const cachedEntry = {};
        for (const k of mapped) {
            cachedEntry[k] = config[k];
        }
        CLASS_PARSE_CACHE.set(cacheKey, cachedEntry);
        if (CLASS_PARSE_CACHE.size > CACHE_MAX) {
            // delete oldest entry
            const firstKey = CLASS_PARSE_CACHE.keys().next().value;
            CLASS_PARSE_CACHE.delete(firstKey);
        }
    }

    return config;
}

// Export for ES modules
export default {
    parse,
    CLASS_PREFIX_MAP,
    CARDINALITY_ORDERS
};
