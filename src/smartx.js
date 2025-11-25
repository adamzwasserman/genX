/**
 * SmartX - Auto-Detection Format Module
 * Automatically detects data types and delegates to appropriate formatters
 *
 * Usage: <span fx-format="smart" fx-raw="$1,234.56">$1,234.56</span>
 *
 * Detects: currency, date, phone, percentage, email, url, number, text
 * Performance: ~0.5-1ms per element, ~0.01ms with caching
 */

(function(window) {
    'use strict';

    const SmartX = {
        // Configuration
        config: {
            threshold: 75,       // Default confidence threshold (75%)
            enabled: true,
            persistConfig: false,
            logTarget: 'none'    // Logging target: 'none', 'console', or HTTPS URL
        },

        // Detection cache to avoid re-analyzing identical values
        cache: new Map(),

        // HTTP logging state
        httpQueue: [],
        httpQueueMaxSize: 100,
        httpBatchSize: 10,
        httpRateLimiter: {
            lastRequestTime: 0,
            minInterval: 100,  // 100ms = 10 requests/sec max
            requestsThisSecond: 0,
            currentSecond: 0
        },
        httpInFlight: false,
        httpRetryMax: 3,
        httpTimeout: 5000,

        // Detection patterns with confidence scoring
        patterns: {
            currency: {
                regex: /^[\$£€¥]?\s*\d{1,3}(,\d{3})*(\.\d{2,4})?$|^\d{1,3}(,\d{3})*(\.\d{2,4})?\s*[\$£€¥]$/,
                confidence: (val) => {
                    // Higher confidence if $ or common currency symbols
                    if (/[\$£€¥]/.test(val)) return 95;
                    // Numbers with exactly 2 decimals likely currency
                    if (/\.\d{2}$/.test(val) && /,/.test(val)) return 80;
                    return 60;
                }
            },

            percentage: {
                regex: /^\d+(\.\d+)?%$/,
                confidence: () => 100 // Very distinctive
            },

            phone: {
                regex: /^[\+]?[(]?\d{1,4}[)]?[-\s\.]?\(?\d{1,4}\)?[-\s\.]?\d{1,4}[-\s\.]?\d{1,9}$/,
                confidence: (val) => {
                    // International format very likely
                    if (/^\+/.test(val)) return 95;
                    // US format with parens
                    if (/^\(\d{3}\)/.test(val)) return 90;
                    // Just digits, could be number
                    if (/^\d+$/.test(val) && val.length < 10) return 40;
                    if (/^\d+$/.test(val) && val.length === 10) return 85;
                    return 70;
                }
            },

            date: {
                regex: /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}|^\d{2}-\d{2}-\d{4}|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
                confidence: (val) => {
                    // ISO format very distinctive
                    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return 98;
                    // Month names
                    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(val)) return 95;
                    // MM/DD/YYYY
                    if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) return 90;
                    return 75;
                }
            },

            email: {
                regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                confidence: () => 100 // Very distinctive
            },

            url: {
                regex: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/,
                confidence: () => 100 // Very distinctive
            },

            number: {
                regex: /^\d{1,3}(,\d{3})*(\.\d+)?$/,
                confidence: (val) => {
                    // With thousand separators, likely intentional formatting
                    if (/,/.test(val)) return 85;
                    // Just a number, could be anything
                    if (/^\d+$/.test(val)) return 50;
                    return 70;
                }
            }
        },

        /**
         * Configure SmartX settings
         * @param {Object} options - Configuration options
         * @returns {Object} Updated configuration
         */
        configure(options = {}) {
            // Validate and apply threshold
            if (options.threshold !== undefined) {
                let threshold = parseFloat(options.threshold);

                if (isNaN(threshold)) {
                    console.warn('SmartX: Invalid threshold type, keeping default');
                    threshold = this.config.threshold;
                } else if (threshold < 0) {
                    console.warn('SmartX: Threshold cannot be negative, clamping to 0');
                    threshold = 0;
                } else if (threshold > 100) {
                    console.warn('SmartX: Threshold cannot exceed 100, clamping to 100');
                    threshold = 100;
                }

                this.config.threshold = threshold;
            }

            // Validate and apply logTarget
            if (options.logTarget !== undefined) {
                const validTargets = ['none', 'console'];

                if (validTargets.includes(options.logTarget)) {
                    // Flush pending logs if switching away from HTTP
                    if (this.isHttpLoggingEnabled()) {
                        this.flushLogs();
                    }
                    this.config.logTarget = options.logTarget;
                } else if (typeof options.logTarget === 'string' && options.logTarget.startsWith('http')) {
                    // Validate URL
                    const urlValidation = this.validateLogURL(options.logTarget);
                    if (urlValidation.valid) {
                        // Flush pending logs if switching from previous HTTP URL
                        if (this.isHttpLoggingEnabled() && this.config.logTarget !== options.logTarget) {
                            this.flushLogs();
                        }
                        this.config.logTarget = options.logTarget;
                    } else {
                        console.warn(`SmartX: Invalid logTarget URL: ${urlValidation.reason}`);
                    }
                } else {
                    console.warn(`SmartX: Invalid logTarget '${options.logTarget}', keeping current value`);
                }
            }

            // Apply other options
            if (options.enabled !== undefined) {
                this.config.enabled = !!options.enabled;
            }
            if (options.persistConfig !== undefined) {
                this.config.persistConfig = !!options.persistConfig;
            }

            return { ...this.config };
        },

        /**
         * Get current configuration
         * @returns {Object} Current configuration
         */
        getConfig() {
            return { ...this.config };
        },

        /**
         * Parse threshold from element or use global
         * @param {HTMLElement} element - Element to check
         * @returns {number} Threshold to use
         */
        parseThreshold(element) {
            if (!element) return this.config.threshold;

            // Check for element-level override
            const elementThreshold = element.getAttribute('fx-smart-threshold');
            if (elementThreshold !== null) {
                const parsed = parseFloat(elementThreshold);

                if (isNaN(parsed)) {
                    console.warn(`SmartX: Invalid threshold '${elementThreshold}' on element, using global threshold`);
                    return this.config.threshold;
                }

                // Clamp to valid range
                if (parsed < 0) {
                    console.warn(`SmartX: Element threshold ${parsed} below 0, clamping to 0`);
                    return 0;
                }
                if (parsed > 100) {
                    console.warn(`SmartX: Element threshold ${parsed} above 100, clamping to 100`);
                    return 100;
                }

                return parsed;
            }

            return this.config.threshold;
        },

        /**
         * Detect the most likely data type for a value
         * @param {string} value - The value to analyze
         * @returns {{type: string, confidence: number}} Detection result
         */
        detect(value) {
            if (!value || typeof value !== 'string') {
                return { type: 'text', confidence: 100 };
            }

            // Check cache first
            const cached = this.cache.get(value);
            if (cached) return cached;

            // Normalize value for testing
            const normalized = value.trim();

            // Score each pattern
            const scores = [];

            for (const [type, pattern] of Object.entries(this.patterns)) {
                if (pattern.regex.test(normalized)) {
                    const confidence = pattern.confidence(normalized);
                    scores.push({ type, confidence });
                }
            }

            // Sort by confidence (highest first)
            scores.sort((a, b) => b.confidence - a.confidence);

            // Use highest confidence match, or default to text
            const result = scores.length > 0
                ? scores[0]
                : { type: 'text', confidence: 100 };

            // Cache result
            if (this.cache.size > 1000) {
                // Clear cache if it gets too large
                this.cache.clear();
            }
            this.cache.set(value, result);

            return result;
        },

        /**
         * Get CSS selector path for an element
         * @param {HTMLElement} el - Element to get path for
         * @returns {string} CSS selector path
         */
        getElementPath(el) {
            if (!el || !el.parentNode || el.tagName === 'HTML') {
                return el ? el.tagName?.toLowerCase() || '' : '';
            }

            // If has ID, use it
            if (el.id) {
                return `#${el.id}`;
            }

            // Build selector from tag and classes
            const classes = el.className ?
                `.${el.className.trim().split(/\s+/).join('.')}` : '';
            let selector = el.tagName.toLowerCase() + classes;

            // Get nth-child position if needed for uniqueness
            if (!el.id && !classes) {
                const parent = el.parentNode;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    const index = siblings.indexOf(el) + 1;
                    if (index > 0) {
                        selector += `:nth-child(${index})`;
                    }
                }
            }

            // Recursively build parent path
            const parentPath = this.getElementPath(el.parentNode);
            return parentPath ? `${parentPath} > ${selector}` : selector;
        },

        /**
         * Log low confidence detection
         * @param {HTMLElement} el - Element being processed
         * @param {string} value - Original value
         * @param {Object} detection - Detection result {type, confidence}
         * @param {number} threshold - Threshold used
         */
        logLowConfidence(el, value, detection, threshold) {
            // Truncate very long values
            const truncatedValue = value.length > 100 ?
                value.substring(0, 97) + '...' : value;

            // Sanitize PII
            const sanitizedValue = this.sanitizePII(truncatedValue);

            // Build structured log data
            const logData = {
                timestamp: new Date().toISOString(),
                value: sanitizedValue,
                confidence: Math.round(detection.confidence),
                threshold: Math.round(threshold),
                detected: detection.type,
                applied: false,
                element: this.getElementPath(el),
                cached: this.cache.has(value)
            };

            // Check for fx-smart-types restriction
            const smartTypes = el.getAttribute('fx-smart-types');
            if (smartTypes) {
                logData.allowedTypes = smartTypes.split(',').map(t => t.trim());
            }

            // Route based on logTarget
            if (this.config.logTarget === 'console') {
                // Console logging
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('⚠️ SmartX: Low confidence detection', logData);
                }
            } else if (this.isHttpLoggingEnabled()) {
                // HTTP logging - queue for transmission
                this.queueLogForHttp(logData);
            }
            // If logTarget is 'none', do nothing
        },

        /**
         * Format an element using auto-detected type
         * @param {HTMLElement} el - Element to format
         * @param {string} value - Value to format
         * @returns {string} Formatted value
         */
        format(el, value) {
            const detection = this.detect(value);
            const threshold = this.parseThreshold(el);

            // Add data attributes for detection metadata
            el.setAttribute('data-smart-detected', detection.type);
            el.setAttribute('data-smart-confidence', Math.round(detection.confidence));

            // Check if confidence passes threshold
            if (detection.confidence < threshold) {
                // Below threshold - log and fallback to original
                this.logLowConfidence(el, value, detection, threshold);
                el.setAttribute('data-smart-fallback', 'true');
                el.removeAttribute('data-smart-applied');
                return value;
            }

            // Above threshold - apply formatting
            el.setAttribute('data-smart-applied', 'true');
            el.removeAttribute('data-smart-fallback');

            // Delegate to appropriate formatter
            switch (detection.type) {
                case 'currency':
                    return this.formatCurrency(value);
                case 'percentage':
                    return value; // Already formatted
                case 'phone':
                    return this.formatPhone(value);
                case 'date':
                    return this.formatDate(value);
                case 'email':
                case 'url':
                    return value; // Keep as-is
                case 'number':
                    return this.formatNumber(value);
                case 'text':
                default:
                    return value;
            }
        },

        /**
         * Simple currency formatter (delegates to fmtX if available)
         */
        formatCurrency(value) {
            // If fmtX is available, use it
            if (window.FormatX && window.FormatX.formatCurrency) {
                // Extract currency symbol and amount
                const match = value.match(/[\$£€¥]/);
                const currency = match ? match[0] : '$';
                const amount = value.replace(/[^\d.,]/g, '');

                return window.FormatX.formatCurrency(amount, {
                    currency: currency === '$' ? 'USD' :
                             currency === '£' ? 'GBP' :
                             currency === '€' ? 'EUR' :
                             currency === '¥' ? 'JPY' : 'USD'
                });
            }
            return value;
        },

        /**
         * Simple phone formatter
         */
        formatPhone(value) {
            // Remove all non-digit/plus characters
            const cleaned = value.replace(/[^\d+]/g, '');

            // US format
            if (cleaned.length === 10) {
                return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
            }

            // US with country code
            if (cleaned.length === 11 && cleaned[0] === '1') {
                return `(${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
            }

            // International - keep as-is but clean up
            if (cleaned.startsWith('+')) {
                return value.replace(/\s+/g, ' ').trim();
            }

            return value;
        },

        /**
         * Simple date formatter
         */
        formatDate(value) {
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;

                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return value;
            }
        },

        /**
         * Simple number formatter
         */
        formatNumber(value) {
            const num = parseFloat(value.replace(/,/g, ''));
            if (isNaN(num)) return value;

            return num.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        },

        /**
         * Validate log URL for HTTP logging
         * @param {string} url - URL to validate
         * @returns {{valid: boolean, reason: string}} Validation result
         */
        validateLogURL(url) {
            try {
                const urlObj = new URL(url);

                // Check if localhost - allow HTTP for localhost
                const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';

                // Require HTTPS (except localhost)
                if (urlObj.protocol !== 'https:' && !isLocalhost) {
                    return { valid: false, reason: 'URL must use HTTPS (except localhost)' };
                }

                return { valid: true, reason: '' };
            } catch (e) {
                return { valid: false, reason: 'Invalid URL format' };
            }
        },

        /**
         * Check if HTTP logging is enabled
         * @returns {boolean} True if logTarget is a URL
         */
        isHttpLoggingEnabled() {
            return typeof this.config.logTarget === 'string' &&
                   this.config.logTarget.startsWith('http');
        },

        /**
         * Sanitize PII in value
         * @param {string} value - Value to sanitize
         * @returns {string} Sanitized value
         */
        sanitizePII(value) {
            if (!value || typeof value !== 'string') return value;

            let sanitized = value;

            // Email pattern: keep domain, hide local part
            const emailRegex = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g;
            sanitized = sanitized.replace(emailRegex, '***@$2');

            // Phone pattern: keep last 4 digits
            const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
            sanitized = sanitized.replace(phoneRegex, (match) => {
                const digits = match.replace(/\D/g, '');
                const last4 = digits.slice(-4);
                return match.replace(/\d/g, (d, idx) => {
                    const digitPos = match.slice(0, idx + 1).replace(/\D/g, '').length;
                    return digitPos > digits.length - 4 ? d : '*';
                });
            });

            // Credit card pattern: keep last 4 digits
            const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
            sanitized = sanitized.replace(ccRegex, (match) => {
                const digits = match.replace(/\D/g, '');
                const last4 = digits.slice(-4);
                return match.replace(/\d/g, (d, idx) => {
                    const digitPos = match.slice(0, idx + 1).replace(/\D/g, '').length;
                    return digitPos > digits.length - 4 ? d : '*';
                });
            });

            // SSN pattern: keep last 4 digits
            const ssnRegex = /\b\d{3}-\d{2}-(\d{4})\b/g;
            sanitized = sanitized.replace(ssnRegex, '***-**-$1');

            return sanitized;
        },

        /**
         * Queue log for HTTP transmission
         * @param {Object} logData - Log data to queue
         */
        queueLogForHttp(logData) {
            // Check if queue is full
            if (this.httpQueue.length >= this.httpQueueMaxSize) {
                // Drop oldest entry
                this.httpQueue.shift();
                if (console && console.warn) {
                    console.warn('⚠️ SmartX: HTTP log queue overflow, dropping oldest entry');
                }
            }

            // Add to queue
            this.httpQueue.push(logData);

            // Auto-flush if batch size reached
            if (this.httpQueue.length >= this.httpBatchSize) {
                // Use setTimeout to avoid blocking
                setTimeout(() => this.flushLogs(), 0);
            }
        },

        /**
         * Flush all queued logs to HTTP endpoint
         */
        async flushLogs() {
            if (!this.isHttpLoggingEnabled()) {
                return;
            }

            if (this.httpQueue.length === 0) {
                return;
            }

            if (this.httpInFlight) {
                // Already sending, will retry after completion
                return;
            }

            // Process queue in batches
            while (this.httpQueue.length > 0) {
                const batch = this.httpQueue.splice(0, this.httpBatchSize);
                await this.sendBatch(batch);
            }
        },

        /**
         * Send batch to HTTP endpoint with retry logic
         * @param {Array} batch - Batch of log entries
         */
        async sendBatch(batch) {
            if (batch.length === 0) return;

            this.httpInFlight = true;

            // Enforce rate limiting
            await this.enforceRateLimit();

            const url = this.config.logTarget;
            const metadata = {
                smartxVersion: '1.0.0',
                browser: {
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown'
                },
                batchTimestamp: new Date().toISOString()
            };

            const payload = {
                logs: batch,
                metadata
            };

            let lastError = null;

            // Retry logic: up to 3 attempts for 5xx errors
            for (let attempt = 1; attempt <= this.httpRetryMax; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.httpTimeout);

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'SmartX/1.0'
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        // Success - clear error and exit
                        this.httpInFlight = false;
                        return;
                    }

                    // 4xx errors - don't retry
                    if (response.status >= 400 && response.status < 500) {
                        if (console && console.error) {
                            console.error(`❌ SmartX: HTTP logging failed with ${response.status}, logs dropped`);
                        }
                        this.httpInFlight = false;
                        return;
                    }

                    // 5xx errors - retry
                    lastError = `HTTP ${response.status}`;

                } catch (error) {
                    lastError = error.message;

                    // Timeout or network error - log if last attempt
                    if (attempt === this.httpRetryMax) {
                        if (console && console.warn) {
                            console.warn(`⚠️ SmartX: HTTP logging failed after ${attempt} attempts: ${lastError}`);
                        }
                    }
                }

                // Wait before retry (exponential backoff)
                if (attempt < this.httpRetryMax) {
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                }
            }

            // All retries failed - put logs back in queue
            this.httpQueue.unshift(...batch);
            this.httpInFlight = false;
        },

        /**
         * Enforce rate limiting (max 10 requests/second)
         */
        async enforceRateLimit() {
            const now = Date.now();
            const currentSecond = Math.floor(now / 1000);

            // Reset counter if new second
            if (currentSecond !== this.httpRateLimiter.currentSecond) {
                this.httpRateLimiter.currentSecond = currentSecond;
                this.httpRateLimiter.requestsThisSecond = 0;
            }

            // Check if we've hit the limit
            if (this.httpRateLimiter.requestsThisSecond >= 10) {
                // Wait until next second
                const waitTime = 1000 - (now % 1000);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                // Reset counter for new second
                this.httpRateLimiter.currentSecond = Math.floor(Date.now() / 1000);
                this.httpRateLimiter.requestsThisSecond = 0;
            }

            // Also enforce minimum interval between requests
            const timeSinceLastRequest = now - this.httpRateLimiter.lastRequestTime;
            if (timeSinceLastRequest < this.httpRateLimiter.minInterval) {
                await new Promise(resolve =>
                    setTimeout(resolve, this.httpRateLimiter.minInterval - timeSinceLastRequest)
                );
            }

            // Update tracking
            this.httpRateLimiter.lastRequestTime = Date.now();
            this.httpRateLimiter.requestsThisSecond++;
        },

        /**
         * Clear detection cache
         */
        clearCache() {
            this.cache.clear();
        }
    };

    // Export to window
    window.SmartX = SmartX;

    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ SmartX initialized (auto-detection formatter)');
    }

})(window);
