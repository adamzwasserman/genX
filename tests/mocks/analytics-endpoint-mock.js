/**
 * Mock Analytics Endpoint for SmartX HTTP Logging Tests
 *
 * Simulates an analytics endpoint that receives SmartX log batches.
 * Supports success responses, error responses, timeouts, and rate limiting validation.
 */

/**
 * Create a mock analytics endpoint
 * @param {Object} options - Configuration options
 * @returns {Object} Mock endpoint instance
 */
export const createMockAnalyticsEndpoint = (options = {}) => {
    const config = {
        baseURL: options.baseURL || 'https://analytics.example.com',
        logPath: options.logPath || '/log',
        requireAuth: options.requireAuth || false,
        authToken: options.authToken || 'test-token',
        ...options
    };

    let requests = [];
    let responseMode = 'success'; // 'success', 'error', 'timeout', 'custom'
    let customResponse = null;
    let responseDelay = 0;
    let requestCount = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Validate request structure
     */
    const validateRequest = (request) => {
        const errors = [];

        // Check method
        if (request.method !== 'POST') {
            errors.push('Method must be POST');
        }

        // Check Content-Type
        if (!request.headers['Content-Type']?.includes('application/json')) {
            errors.push('Content-Type must be application/json');
        }

        // Check auth if required
        if (config.requireAuth) {
            const auth = request.headers['Authorization'];
            if (!auth || !auth.includes(config.authToken)) {
                errors.push('Invalid or missing authorization');
            }
        }

        // Check body structure
        if (!request.body) {
            errors.push('Request body is required');
        } else {
            let parsedBody;
            try {
                parsedBody = typeof request.body === 'string'
                    ? JSON.parse(request.body)
                    : request.body;
            } catch (e) {
                errors.push('Body must be valid JSON');
                return { valid: false, errors };
            }

            if (!Array.isArray(parsedBody)) {
                errors.push('Body must be an array of logs');
            } else {
                // Validate each log entry
                parsedBody.forEach((log, index) => {
                    const requiredFields = ['timestamp', 'value', 'confidence', 'threshold', 'detected', 'applied', 'element'];
                    for (const field of requiredFields) {
                        if (!(field in log)) {
                            errors.push(`Log ${index} missing field: ${field}`);
                        }
                    }
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    };

    /**
     * Success response (200)
     */
    const successResponse = (logEntry) => ({
        status: 200,
        ok: true,
        body: {
            success: true,
            requestId: logEntry.requestId,
            received: Array.isArray(logEntry.body) ? logEntry.body.length : 0,
            timestamp: new Date().toISOString()
        }
    });

    /**
     * Error response (400/500)
     */
    const errorResponse = (logEntry) => {
        const errors = logEntry.validated?.errors || ['Unknown error'];
        const status = errors.length > 0 ? 400 : 500;

        return {
            status,
            ok: false,
            body: {
                success: false,
                errors,
                requestId: logEntry.requestId
            }
        };
    };

    /**
     * Timeout simulation
     */
    const timeoutResponse = async () => {
        // Simulate long delay that causes timeout
        await sleep(10000);
        throw new Error('Request timeout');
    };

    /**
     * Get batch sizes from requests
     */
    const getBatchSizes = () => {
        return requests.map(r => {
            try {
                const body = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
                return Array.isArray(body) ? body.length : 0;
            } catch {
                return 0;
            }
        });
    };

    /**
     * Validate rate limiting
     */
    const validateRateLimit = (maxPerSecond) => {
        const requestsBySecond = {};

        for (const request of requests) {
            const second = Math.floor(request.timestamp / 1000);
            if (!requestsBySecond[second]) {
                requestsBySecond[second] = 0;
            }
            requestsBySecond[second]++;
        }

        const violations = Object.entries(requestsBySecond)
            .filter(([_, count]) => count > maxPerSecond);

        return {
            passed: violations.length === 0,
            violations,
            maxPerSecond,
            requestsBySecond
        };
    };

    /**
     * Check sequential batch ordering
     */
    const validateBatchSequence = () => {
        const batches = [];

        for (const request of requests) {
            try {
                const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
                if (Array.isArray(body)) {
                    batches.push({
                        timestamp: request.timestamp,
                        size: body.length,
                        logs: body
                    });
                }
            } catch {
                // Skip invalid requests
            }
        }

        const intervals = [];
        for (let i = 1; i < batches.length; i++) {
            intervals.push(batches[i].timestamp - batches[i - 1].timestamp);
        }

        return {
            batches: batches.length,
            intervals,
            minInterval: intervals.length > 0 ? Math.min(...intervals) : 0,
            maxInterval: intervals.length > 0 ? Math.max(...intervals) : 0
        };
    };

    /**
     * Extract all log values
     */
    const extractLogValues = () => {
        const values = [];

        for (const request of requests) {
            try {
                const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
                if (Array.isArray(body)) {
                    for (const log of body) {
                        if (log.value) {
                            values.push(log.value);
                        }
                    }
                }
            } catch {
                // Skip invalid requests
            }
        }

        return values;
    };

    /**
     * Check for PII in logs
     */
    const detectPII = () => {
        const values = extractLogValues();
        const piiDetected = {
            emails: [],
            phones: [],
            creditCards: [],
            ssn: []
        };

        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
            creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/
        };

        for (const value of values) {
            if (patterns.email.test(value)) piiDetected.emails.push(value);
            if (patterns.phone.test(value)) piiDetected.phones.push(value);
            if (patterns.creditCard.test(value)) piiDetected.creditCards.push(value);
            if (patterns.ssn.test(value)) piiDetected.ssn.push(value);
        }

        return {
            detected: Object.values(piiDetected).some(arr => arr.length > 0),
            details: piiDetected
        };
    };

    return {
        /**
         * Get full endpoint URL
         */
        getURL: () => `${config.baseURL}${config.logPath}`,

        /**
         * Handle incoming request
         */
        handleRequest: async (request) => {
            requestCount++;

            const logEntry = {
                requestId: requestCount,
                timestamp: Date.now(),
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body,
                validated: validateRequest(request)
            };

            requests.push(logEntry);

            // Simulate delay if configured
            if (responseDelay > 0) {
                await sleep(responseDelay);
            }

            // Return response based on mode
            switch (responseMode) {
                case 'success':
                    return successResponse(logEntry);
                case 'error':
                    return errorResponse(logEntry);
                case 'timeout':
                    return timeoutResponse();
                case 'custom':
                    return customResponse || successResponse(logEntry);
                default:
                    return successResponse(logEntry);
            }
        },

        /**
         * Set response mode
         */
        setResponseMode: (mode) => {
            responseMode = mode;
        },

        /**
         * Set custom response
         */
        setCustomResponse: (response) => {
            responseMode = 'custom';
            customResponse = response;
        },

        /**
         * Set response delay
         */
        setResponseDelay: (ms) => {
            responseDelay = ms;
        },

        /**
         * Get all requests
         */
        getRequests: () => requests,

        /**
         * Get request count
         */
        getRequestCount: () => requestCount,

        /**
         * Get last request
         */
        getLastRequest: () => requests[requests.length - 1],

        /**
         * Get requests by time window
         */
        getRequestsByTimeWindow: (startTime, endTime) => {
            return requests.filter(r =>
                r.timestamp >= startTime && r.timestamp <= endTime
            );
        },

        validateRateLimit,
        getBatchSizes,
        validateBatchSequence,
        extractLogValues,
        detectPII,

        /**
         * Reset endpoint
         */
        reset: () => {
            requests = [];
            requestCount = 0;
            responseMode = 'success';
            customResponse = null;
            responseDelay = 0;
        },

        /**
         * Get statistics
         */
        getStatistics: () => {
            const batchSizes = getBatchSizes();
            const totalLogs = batchSizes.reduce((sum, size) => sum + size, 0);
            const rateLimit = validateRateLimit(10);
            const sequence = validateBatchSequence();
            const pii = detectPII();

            return {
                requestCount,
                totalLogs,
                averageBatchSize: totalLogs / requestCount || 0,
                batchSizes,
                rateLimitPassed: rateLimit.passed,
                averageInterval: sequence.intervals.length > 0
                    ? sequence.intervals.reduce((s, v) => s + v, 0) / sequence.intervals.length
                    : 0,
                piiDetected: pii.detected
            };
        }
    };
};

/**
 * CORS handling utilities
 */
export const corsHandler = {
    /**
     * Handle OPTIONS preflight request
     */
    handlePreflight: (origin) => ({
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    }),

    /**
     * Check if CORS is allowed
     */
    isAllowed: (origin, allowedOrigins = ['*']) => {
        return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    }
};

// Backward compatibility aliases
export const createMockEndpoint = createMockAnalyticsEndpoint;

export default {
    createMockAnalyticsEndpoint,
    createMockEndpoint,
    corsHandler
};
