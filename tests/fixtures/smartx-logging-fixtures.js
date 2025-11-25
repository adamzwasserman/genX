/**
 * SmartX Console Logging Test Fixtures
 *
 * Provides utilities, mocks, and helpers for testing SmartX console logging
 * for low-confidence detections.
 */

/**
 * Mock console for tracking warnings
 */
export class MockConsole {
    constructor() {
        this.warnings = [];
        this.logs = [];
        this.errors = [];
        this.originalConsole = {
            warn: console.warn,
            log: console.log,
            error: console.error
        };
    }

    /**
     * Start intercepting console calls
     */
    start() {
        console.warn = (...args) => {
            this.warnings.push({ message: args, timestamp: Date.now() });
            // Still call original for debugging
            this.originalConsole.warn.apply(console, args);
        };

        console.log = (...args) => {
            this.logs.push({ message: args, timestamp: Date.now() });
            this.originalConsole.log.apply(console, args);
        };

        console.error = (...args) => {
            this.errors.push({ message: args, timestamp: Date.now() });
            this.originalConsole.error.apply(console, args);
        };
    }

    /**
     * Stop intercepting console calls
     */
    stop() {
        console.warn = this.originalConsole.warn;
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
    }

    /**
     * Get all warnings
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Get warning count
     */
    getWarningCount() {
        return this.warnings.length;
    }

    /**
     * Check if warning contains text
     */
    hasWarning(text) {
        return this.warnings.some(w =>
            w.message.some(m =>
                typeof m === 'string' && m.includes(text) ||
                typeof m === 'object' && JSON.stringify(m).includes(text)
            )
        );
    }

    /**
     * Get last warning
     */
    getLastWarning() {
        return this.warnings[this.warnings.length - 1];
    }

    /**
     * Check if console.log was called (should not be)
     */
    wasLogCalled() {
        return this.logs.length > 0;
    }

    /**
     * Reset all captured calls
     */
    reset() {
        this.warnings = [];
        this.logs = [];
        this.errors = [];
    }
}

/**
 * Element path generator for testing CSS selector generation
 */
export class ElementPathGenerator {
    /**
     * Generate CSS selector path for element
     */
    static getPath(element) {
        if (!element || !element.parentNode) {
            return '';
        }

        // If has ID, use it
        if (element.id) {
            return `#${element.id}`;
        }

        // Build path from classes
        const classes = Array.from(element.classList).join('.');
        const tagName = element.tagName.toLowerCase();
        let selector = classes ? `${tagName}.${classes}` : tagName;

        // Get nth-child position if needed
        if (!element.id && !classes) {
            const parent = element.parentNode;
            const siblings = Array.from(parent.children);
            const index = siblings.indexOf(element) + 1;
            selector += `:nth-child(${index})`;
        }

        // Recursively build parent path
        const parentPath = this.getPath(element.parentNode);
        return parentPath ? `${parentPath} > ${selector}` : selector;
    }

    /**
     * Verify selector can find element
     */
    static verifySelectorWorks(element, selector) {
        try {
            const found = document.querySelector(selector);
            return found === element;
        } catch (e) {
            return false;
        }
    }
}

/**
 * Structured log validator
 */
export class LogStructureValidator {
    /**
     * Validate log has all required fields
     */
    static validate(logData) {
        const requiredFields = [
            'timestamp',
            'value',
            'confidence',
            'threshold',
            'detected',
            'applied',
            'element'
        ];

        const errors = [];

        for (const field of requiredFields) {
            if (!(field in logData)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate field types
        if (logData.timestamp && !this.isISO8601(logData.timestamp)) {
            errors.push('timestamp is not ISO 8601 format');
        }

        if (logData.confidence !== undefined && typeof logData.confidence !== 'number') {
            errors.push('confidence must be a number');
        }

        if (logData.threshold !== undefined && typeof logData.threshold !== 'number') {
            errors.push('threshold must be a number');
        }

        if (logData.applied !== undefined && typeof logData.applied !== 'boolean') {
            errors.push('applied must be a boolean');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if string is ISO 8601 timestamp
     */
    static isISO8601(str) {
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        return iso8601Regex.test(str);
    }

    /**
     * Check if timestamp is recent (within 1 second)
     */
    static isRecent(timestamp, maxAge = 1000) {
        const logTime = new Date(timestamp).getTime();
        const now = Date.now();
        return (now - logTime) <= maxAge;
    }
}

/**
 * Low confidence element generator
 */
export const generateLowConfidenceElements = (count = 10) => {
    const elements = [];
    const scenarios = [
        { text: '123.45', confidence: 70, detected: 'currency' },
        { text: '123', confidence: 60, detected: 'currency' },
        { text: 'Jan 15', confidence: 65, detected: 'date' },
        { text: '5551234', confidence: 60, detected: 'phone' },
        { text: 'user@domain', confidence: 72, detected: 'email' },
        { text: 'maybe?', confidence: 40, detected: 'text' },
        { text: '12:30', confidence: 55, detected: 'time' },
        { text: '50', confidence: 50, detected: 'number' }
    ];

    for (let i = 0; i < count; i++) {
        const scenario = scenarios[i % scenarios.length];
        const div = document.createElement('div');
        const span = document.createElement('span');

        span.setAttribute('fx-smart', 'true');
        span.textContent = scenario.text;
        span.setAttribute('data-test-confidence', scenario.confidence.toString());
        span.setAttribute('data-test-detected', scenario.detected);

        // Add unique identifiers
        if (i % 3 === 0) {
            span.id = `test-el-${i}`;
        } else if (i % 3 === 1) {
            span.className = `test-class-${i}`;
        }

        div.appendChild(span);
        elements.push({
            element: span,
            parent: div,
            confidence: scenario.confidence,
            detected: scenario.detected,
            text: scenario.text
        });
    }

    return elements;
};

/**
 * Performance measurement for logging
 */
export class LoggingPerformanceTracker {
    constructor() {
        this.measurements = [];
    }

    /**
     * Measure logging performance
     */
    measure(fn, iterations = 100) {
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            fn();
        }

        const duration = performance.now() - start;

        this.measurements.push({
            iterations,
            duration,
            avgPerIteration: duration / iterations
        });

        return {
            total: duration,
            average: duration / iterations
        };
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        if (this.measurements.length === 0) return null;

        const totalIterations = this.measurements.reduce((sum, m) => sum + m.iterations, 0);
        const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0);

        return {
            totalIterations,
            totalDuration,
            avgPerIteration: totalDuration / totalIterations,
            measurements: this.measurements.length
        };
    }

    /**
     * Check if performance meets target
     */
    meetsTarget(targetMs = 0.01) {
        const summary = this.getSummary();
        return summary && summary.avgPerIteration < targetMs;
    }

    /**
     * Reset tracker
     */
    reset() {
        this.measurements = [];
    }
}

/**
 * Log format checker
 */
export class LogFormatChecker {
    /**
     * Check if log starts with warning emoji
     */
    static hasWarningEmoji(message) {
        return typeof message === 'string' && message.startsWith('⚠️');
    }

    /**
     * Check if log has SmartX prefix
     */
    static hasSmartXPrefix(message) {
        return typeof message === 'string' && message.includes('SmartX');
    }

    /**
     * Extract log object from warning
     */
    static extractLogObject(warning) {
        // Warning is typically [message, logObject]
        if (Array.isArray(warning.message) && warning.message.length >= 2) {
            const logObj = warning.message.find(m => typeof m === 'object');
            return logObj;
        }
        return null;
    }

    /**
     * Verify log format matches expected structure
     */
    static verifyFormat(warning) {
        const errors = [];

        if (!Array.isArray(warning.message)) {
            errors.push('Warning message is not an array');
            return { valid: false, errors };
        }

        const [message, logObj] = warning.message;

        if (!this.hasWarningEmoji(message)) {
            errors.push('Missing warning emoji ⚠️');
        }

        if (!this.hasSmartXPrefix(message)) {
            errors.push('Missing SmartX prefix');
        }

        if (!logObj || typeof logObj !== 'object') {
            errors.push('Missing structured log object');
        } else {
            const validation = LogStructureValidator.validate(logObj);
            if (!validation.valid) {
                errors.push(...validation.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * SmartX logging configuration helper
 */
export class LoggingConfigHelper {
    /**
     * Configure SmartX for console logging
     */
    static enableConsoleLogging(threshold = 75) {
        return {
            logTarget: 'console',
            threshold,
            enabled: true
        };
    }

    /**
     * Configure SmartX to disable logging
     */
    static disableLogging() {
        return {
            logTarget: 'none'
        };
    }

    /**
     * Configure with custom log target
     */
    static configureLogTarget(target) {
        return {
            logTarget: target
        };
    }

    /**
     * Validate log target value
     */
    static isValidLogTarget(target) {
        const validTargets = ['console', 'none', 'http'];
        return validTargets.includes(target);
    }
}

/**
 * Expected log samples for testing
 */
export const expectedLogSamples = {
    lowConfidenceCurrency: {
        value: '123.45',
        confidence: 70,
        threshold: 80,
        detected: 'currency',
        applied: false
    },

    lowConfidenceDate: {
        value: 'Jan 15',
        confidence: 65,
        threshold: 75,
        detected: 'date',
        applied: false
    },

    lowConfidencePhone: {
        value: '5551234',
        confidence: 60,
        threshold: 75,
        detected: 'phone',
        applied: false
    },

    zeroConfidence: {
        value: 'random text',
        confidence: 0,
        threshold: 75,
        detected: 'text',
        applied: false
    }
};

/**
 * Mock SmartX with logging
 */
export class MockSmartXWithLogging {
    constructor() {
        this.config = {
            threshold: 75,
            logTarget: 'none',
            enabled: true
        };
        this.loggedItems = [];
    }

    /**
     * Configure mock SmartX
     */
    configure(options) {
        Object.assign(this.config, options);
        return this.config;
    }

    /**
     * Mock format method with logging
     */
    format(element, value) {
        const detection = this.mockDetect(value);
        const threshold = this.config.threshold;

        if (detection.confidence < threshold) {
            if (this.config.logTarget === 'console') {
                this.logLowConfidence(element, value, detection, threshold);
            }
            return value; // Fallback
        }

        return this.mockFormatValue(value, detection.type);
    }

    /**
     * Mock detection
     */
    mockDetect(value) {
        // Simplified mock detection
        if (value.includes('$')) return { type: 'currency', confidence: 95 };
        if (/^\d+\.\d{2}$/.test(value)) return { type: 'currency', confidence: 70 };
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { type: 'date', confidence: 90 };
        return { type: 'text', confidence: 50 };
    }

    /**
     * Mock format value
     */
    mockFormatValue(value, type) {
        if (type === 'currency') return `$${value}`;
        return value;
    }

    /**
     * Log low confidence detection
     */
    logLowConfidence(element, value, detection, threshold) {
        const logData = {
            timestamp: new Date().toISOString(),
            value: value,
            confidence: detection.confidence,
            threshold: threshold,
            detected: detection.type,
            applied: false,
            element: this.getElementPath(element)
        };

        this.loggedItems.push(logData);
        console.warn('⚠️ SmartX: Low confidence detection', logData);
    }

    /**
     * Get element path
     */
    getElementPath(element) {
        return ElementPathGenerator.getPath(element);
    }

    /**
     * Get logged items
     */
    getLoggedItems() {
        return this.loggedItems;
    }

    /**
     * Reset logs
     */
    reset() {
        this.loggedItems = [];
    }
}

/**
 * Test scenarios for console logging
 */
export const loggingScenarios = {
    enabled: {
        config: { logTarget: 'console', threshold: 75 },
        elements: [
            { text: '123.45', confidence: 70, shouldLog: true },
            { text: '999.99', confidence: 85, shouldLog: false }
        ]
    },

    disabled: {
        config: { logTarget: 'none', threshold: 75 },
        elements: [
            { text: '123.45', confidence: 70, shouldLog: false },
            { text: '999.99', confidence: 60, shouldLog: false }
        ]
    },

    highThreshold: {
        config: { logTarget: 'console', threshold: 90 },
        elements: [
            { text: '123.45', confidence: 85, shouldLog: true },
            { text: '999.99', confidence: 95, shouldLog: false }
        ]
    },

    elementOverride: {
        config: { logTarget: 'console', threshold: 75 },
        elementConfig: { threshold: 85 },
        elements: [
            { text: '123.45', confidence: 80, shouldLog: true },
            { text: '999.99', confidence: 90, shouldLog: false }
        ]
    }
};

/**
 * Value truncation helper
 */
export class ValueTruncator {
    /**
     * Truncate long values for logging
     */
    static truncate(value, maxLength = 100) {
        if (typeof value !== 'string') return value;

        if (value.length <= maxLength) return value;

        return value.substring(0, maxLength - 3) + '...';
    }

    /**
     * Check if value was truncated
     */
    static isTruncated(value) {
        return typeof value === 'string' && value.endsWith('...');
    }
}

/**
 * Logging test assertions
 */
export class LoggingAssertions {
    /**
     * Assert warning was logged
     */
    static assertWarningLogged(mockConsole, expectedCount = 1) {
        const actual = mockConsole.getWarningCount();
        if (actual !== expectedCount) {
            throw new Error(`Expected ${expectedCount} warnings, got ${actual}`);
        }
    }

    /**
     * Assert no warnings logged
     */
    static assertNoWarnings(mockConsole) {
        const count = mockConsole.getWarningCount();
        if (count > 0) {
            throw new Error(`Expected no warnings, got ${count}`);
        }
    }

    /**
     * Assert log contains field
     */
    static assertLogContainsField(logData, field) {
        if (!(field in logData)) {
            throw new Error(`Log missing field: ${field}`);
        }
    }

    /**
     * Assert log field equals value
     */
    static assertLogFieldEquals(logData, field, expected) {
        if (logData[field] !== expected) {
            throw new Error(`Expected ${field}=${expected}, got ${logData[field]}`);
        }
    }

    /**
     * Assert performance meets target
     */
    static assertPerformanceTarget(duration, target = 1) {
        if (duration > target) {
            throw new Error(`Performance ${duration}ms exceeds target ${target}ms`);
        }
    }
}

export default {
    MockConsole,
    ElementPathGenerator,
    LogStructureValidator,
    generateLowConfidenceElements,
    LoggingPerformanceTracker,
    LogFormatChecker,
    LoggingConfigHelper,
    expectedLogSamples,
    MockSmartXWithLogging,
    loggingScenarios,
    ValueTruncator,
    LoggingAssertions
};
