/**
 * SmartX HTTP Logging Test Fixtures
 *
 * Provides utilities, mocks, and helpers for testing SmartX HTTP logging
 * with rate limiting, batching, retry logic, and PII sanitization.
 */

/**
 * Mock HTTP client for testing
 */
export class MockHTTPClient {
    constructor() {
        this.requests = [];
        this.responseQueue = [];
        this.defaultResponse = { status: 200, body: { success: true } };
        this.delay = 0;
        this.shouldTimeout = false;
    }

    /**
     * Queue a response for next request
     */
    queueResponse(status, body = {}, delay = 0) {
        this.responseQueue.push({ status, body, delay });
    }

    /**
     * Mock fetch implementation
     */
    async fetch(url, options = {}) {
        const request = {
            url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body ? JSON.parse(options.body) : null,
            timestamp: Date.now()
        };

        this.requests.push(request);

        if (this.shouldTimeout) {
            await this.sleep(6000); // Longer than timeout
            throw new Error('Network timeout');
        }

        const response = this.responseQueue.length > 0
            ? this.responseQueue.shift()
            : this.defaultResponse;

        if (response.delay > 0) {
            await this.sleep(response.delay);
        }

        if (response.status >= 400) {
            return {
                ok: false,
                status: response.status,
                json: async () => response.body
            };
        }

        return {
            ok: true,
            status: response.status,
            json: async () => response.body
        };
    }

    /**
     * Get all requests
     */
    getRequests() {
        return this.requests;
    }

    /**
     * Get request count
     */
    getRequestCount() {
        return this.requests.length;
    }

    /**
     * Get last request
     */
    getLastRequest() {
        return this.requests[this.requests.length - 1];
    }

    /**
     * Check if URL was requested
     */
    wasRequested(url) {
        return this.requests.some(r => r.url === url);
    }

    /**
     * Enable timeout simulation
     */
    simulateTimeout() {
        this.shouldTimeout = true;
    }

    /**
     * Reset mock
     */
    reset() {
        this.requests = [];
        this.responseQueue = [];
        this.shouldTimeout = false;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Rate limiter tester
 */
export class RateLimiterTester {
    constructor(maxPerSecond = 10) {
        this.maxPerSecond = maxPerSecond;
        this.requests = [];
    }

    /**
     * Record a request
     */
    recordRequest(timestamp = Date.now()) {
        this.requests.push(timestamp);
    }

    /**
     * Check if rate limit was respected
     */
    wasRateLimitRespected() {
        if (this.requests.length === 0) return true;

        // Group requests by second
        const requestsBySecond = {};
        for (const timestamp of this.requests) {
            const second = Math.floor(timestamp / 1000);
            if (!requestsBySecond[second]) {
                requestsBySecond[second] = 0;
            }
            requestsBySecond[second]++;
        }

        // Check no second exceeded limit
        for (const count of Object.values(requestsBySecond)) {
            if (count > this.maxPerSecond) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get requests per second
     */
    getRequestsPerSecond() {
        const requestsBySecond = {};
        for (const timestamp of this.requests) {
            const second = Math.floor(timestamp / 1000);
            if (!requestsBySecond[second]) {
                requestsBySecond[second] = 0;
            }
            requestsBySecond[second]++;
        }
        return requestsBySecond;
    }

    /**
     * Calculate average interval between requests
     */
    getAverageInterval() {
        if (this.requests.length < 2) return 0;

        const intervals = [];
        for (let i = 1; i < this.requests.length; i++) {
            intervals.push(this.requests[i] - this.requests[i - 1]);
        }

        return intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    }

    /**
     * Check minimum interval between requests
     */
    hasMinimumInterval(minMs) {
        if (this.requests.length < 2) return true;

        for (let i = 1; i < this.requests.length; i++) {
            const interval = this.requests[i] - this.requests[i - 1];
            if (interval < minMs) {
                return false;
            }
        }

        return true;
    }
}

/**
 * PII sanitizer tester
 */
export class PIISanitizerTester {
    /**
     * Test email sanitization
     */
    static testEmail(value) {
        const sanitized = this.sanitizeEmail(value);
        return {
            original: value,
            sanitized,
            wasSanitized: sanitized !== value
        };
    }

    /**
     * Test phone sanitization
     */
    static testPhone(value) {
        const sanitized = this.sanitizePhone(value);
        return {
            original: value,
            sanitized,
            wasSanitized: sanitized !== value
        };
    }

    /**
     * Test credit card sanitization
     */
    static testCreditCard(value) {
        const sanitized = this.sanitizeCreditCard(value);
        return {
            original: value,
            sanitized,
            wasSanitized: sanitized !== value
        };
    }

    /**
     * Test SSN sanitization
     */
    static testSSN(value) {
        const sanitized = this.sanitizeSSN(value);
        return {
            original: value,
            sanitized,
            wasSanitized: sanitized !== value
        };
    }

    /**
     * Email sanitization implementation
     */
    static sanitizeEmail(value) {
        const emailRegex = /^([^@]+)@(.+)$/;
        const match = value.match(emailRegex);
        if (match) {
            return `***@${match[2]}`;
        }
        return value;
    }

    /**
     * Phone sanitization implementation
     */
    static sanitizePhone(value) {
        // Extract last 4 digits
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 4) {
            const last4 = digits.slice(-4);
            return value.replace(/\d/g, (match, offset) => {
                const digitIndex = value.slice(0, offset + 1).replace(/\D/g, '').length - 1;
                return digitIndex >= digits.length - 4 ? match : '*';
            });
        }
        return value;
    }

    /**
     * Credit card sanitization implementation
     */
    static sanitizeCreditCard(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 13) {
            const last4 = digits.slice(-4);
            return value.replace(/\d/g, (match, offset) => {
                const digitIndex = value.slice(0, offset + 1).replace(/\D/g, '').length - 1;
                return digitIndex >= digits.length - 4 ? match : '*';
            });
        }
        return value;
    }

    /**
     * SSN sanitization implementation
     */
    static sanitizeSSN(value) {
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        if (ssnRegex.test(value)) {
            const parts = value.split('-');
            return `***-**-${parts[2]}`;
        }
        return value;
    }
}

/**
 * HTTP queue manager for testing
 */
export class HTTPQueueManager {
    constructor(maxSize = 100) {
        this.queue = [];
        this.maxSize = maxSize;
        this.droppedCount = 0;
    }

    /**
     * Add log to queue
     */
    enqueue(logData) {
        if (this.queue.length >= this.maxSize) {
            this.queue.shift(); // Remove oldest
            this.droppedCount++;
        }
        this.queue.push(logData);
    }

    /**
     * Get batch of logs
     */
    dequeue(batchSize = 10) {
        return this.queue.splice(0, batchSize);
    }

    /**
     * Get queue size
     */
    size() {
        return this.queue.length;
    }

    /**
     * Check if queue is full
     */
    isFull() {
        return this.queue.length >= this.maxSize;
    }

    /**
     * Get dropped count
     */
    getDroppedCount() {
        return this.droppedCount;
    }

    /**
     * Clear queue
     */
    clear() {
        this.queue = [];
    }

    /**
     * Get all logs
     */
    getAll() {
        return [...this.queue];
    }
}

/**
 * Batch validator
 */
export class BatchValidator {
    /**
     * Validate batch structure
     */
    static validate(batch) {
        const errors = [];

        if (!Array.isArray(batch)) {
            errors.push('Batch must be an array');
            return { valid: false, errors };
        }

        if (batch.length === 0) {
            errors.push('Batch cannot be empty');
        }

        if (batch.length > 10) {
            errors.push('Batch size exceeds maximum of 10');
        }

        for (let i = 0; i < batch.length; i++) {
            const log = batch[i];
            const requiredFields = ['timestamp', 'value', 'confidence', 'threshold', 'detected', 'applied', 'element'];

            for (const field of requiredFields) {
                if (!(field in log)) {
                    errors.push(`Log ${i} missing required field: ${field}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            batchSize: batch.length
        };
    }

    /**
     * Validate batch sequence
     */
    static validateSequence(batches) {
        const errors = [];

        for (let i = 0; i < batches.length; i++) {
            const validation = this.validate(batches[i]);
            if (!validation.valid) {
                errors.push(`Batch ${i}: ${validation.errors.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            totalBatches: batches.length,
            totalLogs: batches.reduce((sum, b) => sum + b.length, 0)
        };
    }
}

/**
 * Retry logic tester
 */
export class RetryLogicTester {
    constructor() {
        this.attempts = [];
    }

    /**
     * Record an attempt
     */
    recordAttempt(success, error = null) {
        this.attempts.push({
            success,
            error,
            timestamp: Date.now()
        });
    }

    /**
     * Get attempt count
     */
    getAttemptCount() {
        return this.attempts.length;
    }

    /**
     * Check if retries stopped after success
     */
    stoppedAfterSuccess() {
        const successIndex = this.attempts.findIndex(a => a.success);
        if (successIndex === -1) return false;
        return successIndex === this.attempts.length - 1;
    }

    /**
     * Check if max retries respected
     */
    respectsMaxRetries(max) {
        return this.attempts.length <= max;
    }

    /**
     * Get intervals between attempts
     */
    getRetryIntervals() {
        const intervals = [];
        for (let i = 1; i < this.attempts.length; i++) {
            intervals.push(this.attempts[i].timestamp - this.attempts[i - 1].timestamp);
        }
        return intervals;
    }
}

/**
 * URL validator
 */
export class URLValidator {
    /**
     * Validate URL for HTTP logging
     */
    static validate(url) {
        const errors = [];

        // Check if URL
        try {
            new URL(url);
        } catch (e) {
            errors.push('Invalid URL format');
            return { valid: false, errors };
        }

        const urlObj = new URL(url);

        // Check HTTPS (except localhost)
        if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost') {
            errors.push('URL must use HTTPS (except localhost)');
        }

        // Check not relative
        if (!urlObj.protocol) {
            errors.push('Relative URLs not allowed');
        }

        return {
            valid: errors.length === 0,
            errors,
            protocol: urlObj.protocol,
            hostname: urlObj.hostname
        };
    }

    /**
     * Check if URL is localhost
     */
    static isLocalhost(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
        } catch {
            return false;
        }
    }
}

/**
 * PII test data
 */
export const piiTestData = {
    emails: [
        { value: 'user@example.com', expected: '***@example.com' },
        { value: 'test.user@domain.co.uk', expected: '***@domain.co.uk' }
    ],

    phones: [
        { value: '(555) 123-4567', expected: '(***) ***-4567' },
        { value: '555-123-4567', expected: '***-***-4567' },
        { value: '5551234567', expected: '******4567' }
    ],

    creditCards: [
        { value: '4111-1111-1111-1111', expected: '****-****-****-1111' },
        { value: '4111111111111111', expected: '************1111' }
    ],

    ssn: [
        { value: '123-45-6789', expected: '***-**-6789' }
    ],

    nonPII: [
        { value: 'test', expected: 'test' },
        { value: '12345', expected: '12345' }
    ]
};

/**
 * Batch test scenarios
 */
export const batchTestScenarios = {
    exact10: {
        logCount: 10,
        expectedBatches: 1,
        expectedSizes: [10]
    },

    under10: {
        logCount: 5,
        expectedBatches: 1,
        expectedSizes: [5]
    },

    over10: {
        logCount: 15,
        expectedBatches: 2,
        expectedSizes: [10, 5]
    },

    multiple: {
        logCount: 25,
        expectedBatches: 3,
        expectedSizes: [10, 10, 5]
    },

    exact30: {
        logCount: 30,
        expectedBatches: 3,
        expectedSizes: [10, 10, 10]
    }
};

/**
 * Performance measurement helper
 */
export class HTTPPerformanceMeasurer {
    constructor() {
        this.measurements = [];
    }

    /**
     * Measure operation
     */
    measure(operation, ...args) {
        const start = performance.now();
        const result = operation(...args);
        const duration = performance.now() - start;

        this.measurements.push({ duration, timestamp: Date.now() });
        return { result, duration };
    }

    /**
     * Measure async operation
     */
    async measureAsync(operation, ...args) {
        const start = performance.now();
        const result = await operation(...args);
        const duration = performance.now() - start;

        this.measurements.push({ duration, timestamp: Date.now() });
        return { result, duration };
    }

    /**
     * Get average duration
     */
    getAverageDuration() {
        if (this.measurements.length === 0) return 0;
        const sum = this.measurements.reduce((s, m) => s + m.duration, 0);
        return sum / this.measurements.length;
    }

    /**
     * Check performance target
     */
    meetsTarget(targetMs) {
        return this.getAverageDuration() < targetMs;
    }

    /**
     * Reset measurements
     */
    reset() {
        this.measurements = [];
    }
}

/**
 * Mock metadata generator
 */
export const generateMetadata = () => ({
    smartxVersion: '1.0.0',
    browser: {
        userAgent: navigator.userAgent || 'Test/1.0',
        platform: navigator.platform || 'test'
    },
    timestamp: new Date().toISOString()
});

export default {
    MockHTTPClient,
    RateLimiterTester,
    PIISanitizerTester,
    HTTPQueueManager,
    BatchValidator,
    RetryLogicTester,
    URLValidator,
    piiTestData,
    batchTestScenarios,
    HTTPPerformanceMeasurer,
    generateMetadata
};
