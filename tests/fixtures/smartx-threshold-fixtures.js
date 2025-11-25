/**
 * SmartX Threshold Configuration Test Fixtures
 *
 * Provides utilities, mocks, and helpers for testing SmartX confidence
 * threshold configuration and enforcement.
 */

/**
 * Mock SmartX configuration object
 */
export class MockSmartXConfig {
    constructor() {
        this.config = {
            threshold: 75, // Default threshold
            enabled: true,
            types: ['currency', 'date', 'phone', 'email', 'url', 'time'],
            persistConfig: false
        };
        this.configHistory = [];
    }

    /**
     * Set configuration
     */
    configure(options) {
        this.configHistory.push({ ...this.config });
        Object.assign(this.config, options);

        // Validate threshold
        if (this.config.threshold < 0) {
            console.warn('SmartX: Threshold cannot be negative, clamping to 0');
            this.config.threshold = 0;
        }
        if (this.config.threshold > 100) {
            console.warn('SmartX: Threshold cannot exceed 100, clamping to 100');
            this.config.threshold = 100;
        }

        return this.config;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.config = {
            threshold: 75,
            enabled: true,
            types: ['currency', 'date', 'phone', 'email', 'url', 'time'],
            persistConfig: false
        };
        this.configHistory = [];
    }

    /**
     * Get configuration history
     */
    getHistory() {
        return this.configHistory;
    }
}

/**
 * Threshold enforcement helper
 */
export class ThresholdEnforcer {
    constructor(threshold = 75) {
        this.threshold = threshold;
        this.decisions = [];
    }

    /**
     * Check if confidence passes threshold
     */
    passes(confidence) {
        const result = confidence >= this.threshold;
        this.decisions.push({ confidence, threshold: this.threshold, passed: result });
        return result;
    }

    /**
     * Set threshold
     */
    setThreshold(threshold) {
        this.threshold = Math.max(0, Math.min(100, threshold));
    }

    /**
     * Get decision history
     */
    getDecisions() {
        return this.decisions;
    }

    /**
     * Get pass rate
     */
    getPassRate() {
        const passed = this.decisions.filter(d => d.passed).length;
        return passed / this.decisions.length;
    }
}

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
 * Mock detection result with confidence score
 */
export class MockDetectionResult {
    constructor(format, value, confidence) {
        this.format = format;
        this.value = value;
        this.confidence = confidence;
        this.formatted = null;
    }

    /**
     * Apply format if confidence passes threshold
     */
    applyFormat(threshold) {
        if (this.confidence >= threshold) {
            this.formatted = this.formatValue();
            return { applied: true, value: this.formatted };
        }
        return { applied: false, value: this.value };
    }

    /**
     * Format the value based on type
     */
    formatValue() {
        switch (this.format) {
        case 'currency':
            return `$${parseFloat(this.value).toFixed(2)}`;
        case 'date':
            return new Date(this.value).toLocaleDateString();
        case 'phone':
            return this.value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        case 'email':
            return this.value.toLowerCase();
        case 'time':
            return new Date(this.value).toLocaleTimeString();
        default:
            return this.value;
        }
    }
}

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
 * Performance tracker for threshold processing
 */
export class ThresholdPerformanceTracker {
    constructor() {
        this.stats = {
            totalElements: 0,
            formatted: 0,
            fallback: 0,
            totalDuration: 0,
            threshold: null
        };
    }

    /**
     * Record processing result
     */
    record(confidence, threshold, formatted, duration) {
        this.stats.totalElements++;
        this.stats.totalDuration += duration;
        this.stats.threshold = threshold;

        if (formatted) {
            this.stats.formatted++;
        } else {
            this.stats.fallback++;
        }
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        return {
            totalElements: this.stats.totalElements,
            formatted: this.stats.formatted,
            fallback: this.stats.fallback,
            formattedPercentage: (this.stats.formatted / this.stats.totalElements) * 100,
            avgDuration: this.stats.totalDuration / this.stats.totalElements,
            threshold: this.stats.threshold
        };
    }

    /**
     * Get formatted report
     */
    getReport() {
        const summary = this.getSummary();
        return `
Threshold Performance Report
===========================
Threshold: ${summary.threshold}%
Total Elements: ${summary.totalElements}
Formatted: ${summary.formatted} (${summary.formattedPercentage.toFixed(1)}%)
Fallback: ${summary.fallback} (${(100 - summary.formattedPercentage).toFixed(1)}%)
Avg Duration: ${summary.avgDuration.toFixed(4)}ms per element
`;
    }

    /**
     * Reset tracker
     */
    reset() {
        this.stats = {
            totalElements: 0,
            formatted: 0,
            fallback: 0,
            totalDuration: 0,
            threshold: null
        };
    }
}

/**
 * Element attribute helper
 */
export class SmartXElementHelper {
    /**
     * Create element with smart attributes
     */
    static createElement(options = {}) {
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
    }

    /**
     * Check if element has fallback marker
     */
    static hasFallback(element) {
        return element.getAttribute('data-smart-fallback') === 'true';
    }

    /**
     * Check if element has applied marker
     */
    static hasApplied(element) {
        return element.getAttribute('data-smart-applied') === 'true';
    }

    /**
     * Get confidence from element
     */
    static getConfidence(element) {
        const conf = element.getAttribute('data-smart-confidence');
        return conf ? parseFloat(conf) : null;
    }
}

/**
 * Console warning tracker
 */
export class ConsoleWarningTracker {
    constructor() {
        this.warnings = [];
        this.originalWarn = console.warn;
    }

    /**
     * Start tracking warnings
     */
    start() {
        console.warn = (...args) => {
            this.warnings.push({ message: args.join(' '), timestamp: Date.now() });
            this.originalWarn.apply(console, args);
        };
    }

    /**
     * Stop tracking warnings
     */
    stop() {
        console.warn = this.originalWarn;
    }

    /**
     * Get warnings
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Check if warning was logged
     */
    hasWarning(pattern) {
        return this.warnings.some(w => w.message.includes(pattern));
    }

    /**
     * Reset tracker
     */
    reset() {
        this.warnings = [];
    }
}

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
    MockSmartXConfig,
    ThresholdEnforcer,
    generateConfidenceElements,
    MockDetectionResult,
    confidenceScenarios,
    thresholdConfigs,
    ThresholdPerformanceTracker,
    SmartXElementHelper,
    ConsoleWarningTracker,
    validateThreshold,
    expectedResults
};
