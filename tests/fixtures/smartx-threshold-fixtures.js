/**
 * SmartX Threshold Configuration Test Fixtures
 *
 * Provides utilities, mocks, and helpers for testing SmartX confidence
 * threshold configuration and enforcement.
 */

/**
 * Create a mock SmartX configuration
 * @returns {Object} Mock SmartX config instance
 */
export const createMockSmartXConfig = () => {
    let config = {
        threshold: 75, // Default threshold
        enabled: true,
        types: ['currency', 'date', 'phone', 'email', 'url', 'time'],
        persistConfig: false
    };
    const configHistory = [];

    return {
        /**
         * Set configuration
         */
        configure: (options) => {
            configHistory.push({ ...config });
            Object.assign(config, options);

            // Validate threshold
            if (config.threshold < 0) {
                console.warn('SmartX: Threshold cannot be negative, clamping to 0');
                config.threshold = 0;
            }
            if (config.threshold > 100) {
                console.warn('SmartX: Threshold cannot exceed 100, clamping to 100');
                config.threshold = 100;
            }

            return config;
        },

        /**
         * Get current configuration
         */
        getConfig: () => ({ ...config }),

        /**
         * Reset to defaults
         */
        reset: () => {
            config = {
                threshold: 75,
                enabled: true,
                types: ['currency', 'date', 'phone', 'email', 'url', 'time'],
                persistConfig: false
            };
            configHistory.length = 0;
        },

        /**
         * Get configuration history
         */
        getHistory: () => configHistory
    };
};

/**
 * Create a threshold enforcer
 * @param {number} threshold - Initial threshold
 * @returns {Object} Threshold enforcer instance
 */
export const createThresholdEnforcer = (threshold = 75) => {
    let currentThreshold = threshold;
    const decisions = [];

    return {
        /**
         * Check if confidence passes threshold
         */
        passes: (confidence) => {
            const result = confidence >= currentThreshold;
            decisions.push({ confidence, threshold: currentThreshold, passed: result });
            return result;
        },

        /**
         * Set threshold
         */
        setThreshold: (newThreshold) => {
            currentThreshold = Math.max(0, Math.min(100, newThreshold));
        },

        /**
         * Get decision history
         */
        getDecisions: () => decisions,

        /**
         * Get pass rate
         */
        getPassRate: () => {
            const passed = decisions.filter(d => d.passed).length;
            return passed / decisions.length;
        },

        /**
         * Get current threshold
         */
        getThreshold: () => currentThreshold
    };
};

/**
 * Generate test elements with varying confidence scores
 */
export const generateConfidenceElements = (count = 10, minConfidence = 0, maxConfidence = 100) => {
    const elements = [];
    const step = (maxConfidence - minConfidence) / (count - 1);

    for (let i = 0; i < count; i++) {
        const confidence = minConfidence + (step * i);
        const div = document.createElement('div');
        div.setAttribute('fx-smart', 'true');
        div.setAttribute('data-test-confidence', confidence.toString());
        div.textContent = `Test ${i}: ${confidence.toFixed(1)}% confidence`;
        elements.push({ element: div, confidence });
    }

    return elements;
};

/**
 * Create a mock detection result
 * @param {string} format - Format type
 * @param {*} value - Value to format
 * @param {number} confidence - Confidence score
 * @returns {Object} Mock detection result instance
 */
export const createMockDetectionResult = (format, value, confidence) => {
    let formatted = null;

    const formatValue = () => {
        switch (format) {
        case 'currency':
            return `$${parseFloat(value).toFixed(2)}`;
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'phone':
            return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        case 'email':
            return value.toLowerCase();
        case 'time':
            return new Date(value).toLocaleTimeString();
        default:
            return value;
        }
    };

    return {
        format,
        value,
        confidence,
        getFormatted: () => formatted,

        /**
         * Apply format if confidence passes threshold
         */
        applyFormat: (threshold) => {
            if (confidence >= threshold) {
                formatted = formatValue();
                return { applied: true, value: formatted };
            }
            return { applied: false, value };
        }
    };
};

/**
 * Test scenarios with varying confidence
 */
export const confidenceScenarios = {
    highConfidence: [
        { text: '$123.45', format: 'currency', confidence: 95 },
        { text: '2024-01-15', format: 'date', confidence: 90 },
        { text: '(555) 123-4567', format: 'phone', confidence: 92 },
        { text: 'user@example.com', format: 'email', confidence: 98 }
    ],

    mediumConfidence: [
        { text: '123.45', format: 'currency', confidence: 75 },
        { text: '01/15/2024', format: 'date', confidence: 70 },
        { text: '555-1234', format: 'phone', confidence: 68 },
        { text: 'user@domain', format: 'email', confidence: 72 }
    ],

    lowConfidence: [
        { text: '123', format: 'currency', confidence: 45 },
        { text: 'January 15', format: 'date', confidence: 50 },
        { text: '5551234', format: 'phone', confidence: 40 },
        { text: 'email', format: 'email', confidence: 30 }
    ],

    boundaryConfidence: [
        { text: '100.00', format: 'currency', confidence: 75 },  // At default threshold
        { text: '99.99', format: 'currency', confidence: 74 },   // Just below
        { text: '100.01', format: 'currency', confidence: 76 }   // Just above
    ]
};

/**
 * Threshold configuration samples
 */
export const thresholdConfigs = {
    veryStrict: { threshold: 90, description: '90% confidence required' },
    strict: { threshold: 80, description: '80% confidence required' },
    default: { threshold: 75, description: 'Default 75% threshold' },
    lenient: { threshold: 60, description: '60% confidence required' },
    veryLenient: { threshold: 40, description: '40% confidence required' },
    permissive: { threshold: 0, description: 'Accept all detections' }
};

/**
 * Create a performance tracker for threshold processing
 * @returns {Object} Threshold performance tracker instance
 */
export const createThresholdPerformanceTracker = () => {
    const stats = {
        totalElements: 0,
        formatted: 0,
        fallback: 0,
        totalDuration: 0,
        threshold: null
    };

    return {
        /**
         * Record processing result
         */
        record: (confidence, threshold, formatted, duration) => {
            stats.totalElements++;
            stats.totalDuration += duration;
            stats.threshold = threshold;

            if (formatted) {
                stats.formatted++;
            } else {
                stats.fallback++;
            }
        },

        /**
         * Get summary statistics
         */
        getSummary: () => ({
            totalElements: stats.totalElements,
            formatted: stats.formatted,
            fallback: stats.fallback,
            formattedPercentage: (stats.formatted / stats.totalElements) * 100,
            avgDuration: stats.totalDuration / stats.totalElements,
            threshold: stats.threshold
        }),

        /**
         * Get formatted report
         */
        getReport: () => {
            const summary = {
                totalElements: stats.totalElements,
                formatted: stats.formatted,
                fallback: stats.fallback,
                formattedPercentage: (stats.formatted / stats.totalElements) * 100,
                avgDuration: stats.totalDuration / stats.totalElements,
                threshold: stats.threshold
            };
            return `
Threshold Performance Report
===========================
Threshold: ${summary.threshold}%
Total Elements: ${summary.totalElements}
Formatted: ${summary.formatted} (${summary.formattedPercentage.toFixed(1)}%)
Fallback: ${summary.fallback} (${(100 - summary.formattedPercentage).toFixed(1)}%)
Avg Duration: ${summary.avgDuration.toFixed(4)}ms per element
`;
        },

        /**
         * Reset tracker
         */
        reset: () => {
            stats.totalElements = 0;
            stats.formatted = 0;
            stats.fallback = 0;
            stats.totalDuration = 0;
            stats.threshold = null;
        }
    };
};

/**
 * Element attribute helpers
 */
export const smartXElementHelper = {
    /**
     * Create element with smart attributes
     */
    createElement: (options = {}) => {
        const {
            text = '123.45',
            smart = true,
            threshold = null,
            types = null,
            confidence = 80
        } = options;

        const el = document.createElement('span');
        if (smart) {
            el.setAttribute('fx-smart', smart.toString());
        }
        if (threshold !== null) {
            el.setAttribute('fx-smart-threshold', threshold.toString());
        }
        if (types !== null) {
            el.setAttribute('fx-smart-types', types);
        }
        el.textContent = text;
        el.setAttribute('data-test-confidence', confidence.toString());

        return el;
    },

    /**
     * Check if element has fallback marker
     */
    hasFallback: (element) => {
        return element.getAttribute('data-smart-fallback') === 'true';
    },

    /**
     * Check if element has applied marker
     */
    hasApplied: (element) => {
        return element.getAttribute('data-smart-applied') === 'true';
    },

    /**
     * Get confidence from element
     */
    getConfidence: (element) => {
        const conf = element.getAttribute('data-smart-confidence');
        return conf ? parseFloat(conf) : null;
    }
};

/**
 * Create a console warning tracker
 * @returns {Object} Console warning tracker instance
 */
export const createConsoleWarningTracker = () => {
    const warnings = [];
    let originalWarn = null;

    return {
        /**
         * Start tracking warnings
         */
        start: () => {
            originalWarn = console.warn;
            console.warn = (...args) => {
                warnings.push({ message: args.join(' '), timestamp: Date.now() });
                originalWarn.apply(console, args);
            };
        },

        /**
         * Stop tracking warnings
         */
        stop: () => {
            if (originalWarn) {
                console.warn = originalWarn;
            }
        },

        /**
         * Get warnings
         */
        getWarnings: () => warnings,

        /**
         * Check if warning was logged
         */
        hasWarning: (pattern) => {
            return warnings.some(w => w.message.includes(pattern));
        },

        /**
         * Reset tracker
         */
        reset: () => {
            warnings.length = 0;
        }
    };
};

/**
 * Threshold validation helper
 */
export const validateThreshold = (threshold) => {
    if (typeof threshold !== 'number') {
        return { valid: false, clamped: 75, reason: 'Not a number' };
    }
    if (threshold < 0) {
        return { valid: false, clamped: 0, reason: 'Below minimum (0)' };
    }
    if (threshold > 100) {
        return { valid: false, clamped: 100, reason: 'Above maximum (100)' };
    }
    return { valid: true, clamped: threshold, reason: 'Valid' };
};

/**
 * Expected results for threshold scenarios
 */
export const expectedResults = {
    threshold75: {
        confidence85: { formatted: true, fallback: false },
        confidence75: { formatted: true, fallback: false },
        confidence70: { formatted: false, fallback: true },
        confidence60: { formatted: false, fallback: true }
    },

    threshold80: {
        confidence90: { formatted: true, fallback: false },
        confidence80: { formatted: true, fallback: false },
        confidence75: { formatted: false, fallback: true },
        confidence70: { formatted: false, fallback: true }
    },

    threshold90: {
        confidence95: { formatted: true, fallback: false },
        confidence90: { formatted: true, fallback: false },
        confidence85: { formatted: false, fallback: true },
        confidence80: { formatted: false, fallback: true }
    }
};

export default {
    createMockSmartXConfig,
    createThresholdEnforcer,
    generateConfidenceElements,
    createMockDetectionResult,
    confidenceScenarios,
    thresholdConfigs,
    createThresholdPerformanceTracker,
    smartXElementHelper,
    createConsoleWarningTracker,
    validateThreshold,
    expectedResults
};
