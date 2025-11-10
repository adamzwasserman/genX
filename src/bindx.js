/**
 * bindX - Reactive Data Binding
 * Pure functional reactive system using Proxy API
 *
 * @module bindx
 * @version 1.0.0
 */
(function() {
    'use strict';

    // WeakMap registry for reactive metadata (memory-safe)
    const reactiveMetadata = new WeakMap();

    // Current dependency tracking context
    let currentTrackingContext = null;

    // Path subscribers for computed property invalidation
    const pathSubscribers = new Map();

    /**
     * Check if object is already reactive
     * @param {*} obj - Object to check
     * @returns {boolean} True if object is reactive
     */
    const isReactive = (obj) => {
        return obj && typeof obj === 'object' && reactiveMetadata.has(obj);
    };

    /**
     * Track property dependency during access
     * @param {string} path - Property path being accessed
     */
    const trackDependency = (path) => {
        if (currentTrackingContext && currentTrackingContext.isTracking) {
            currentTrackingContext.dependencies.add(path);
        }
    };

    /**
     * Notify path subscribers (for computed invalidation)
     * @param {string} path - Path that changed
     * @param {*} value - New value
     */
    const notifyPathSubscribers = (path) => {
        const subscribers = pathSubscribers.get(path);
        if (subscribers) {
            for (const callback of subscribers) {
                callback(path);
            }
        }
    };

    /**
     * Create batched update queue using requestAnimationFrame
     *
     * @param {Function} updateHandler - Function to execute for each update
     * @returns {Object} Batch queue interface
     */
    const createBatchQueue = (updateHandler) => {
        let pending = new Map(); // path -> value
        let scheduled = false;
        let rafId = null;

        const flush = () => {
            const updates = new Map(pending);
            pending.clear();
            scheduled = false;
            rafId = null;

            // Execute all batched updates
            for (const [path, value] of updates) {
                try {
                    updateHandler(path, value);
                } catch (error) {
                    console.error(`bindX: Batch update failed for ${path}:`, error);
                }
            }
        };

        const schedule = (path, value) => {
            // Store latest value for this path (deduplication)
            pending.set(path, value);

            if (!scheduled) {
                scheduled = true;
                rafId = requestAnimationFrame(flush);
            }
        };

        const flushSync = () => {
            if (scheduled && rafId !== null) {
                cancelAnimationFrame(rafId);
                flush();
            }
        };

        return Object.freeze({
            schedule,
            flush: flushSync,
            getPending: () => new Map(pending),
            isScheduled: () => scheduled
        });
    };

    /**
     * Global batch queue instance (created lazily)
     */
    let globalBatchQueue = null;

    /**
     * Get or create global batch queue
     * @returns {Object} Batch queue instance
     */
    const getBatchQueue = () => {
        if (!globalBatchQueue) {
            globalBatchQueue = createBatchQueue(executeDOMUpdate);
        }
        return globalBatchQueue;
    };

    /**
     * Execute DOM update (placeholder for Phase 4)
     * @param {string} path - Property path
     * @param {*} value - New value
     */
    const executeDOMUpdate = (path, value) => {
        // Will be implemented in Phase 4: DOM Integration
        if (typeof console !== 'undefined' && console.debug) {
            console.debug(`bindX: Update ${path} = ${value}`);
        }
    };

    /**
     * Notify bindings of changes (placeholder for Phase 2)
     * @param {string} path - Path that changed
     * @param {*} value - New value
     */
    const notifyBindings = (path, value) => {
        // Will be implemented in Phase 2: Binding Management
        // For now, schedule in batch queue for future DOM updates
        const queue = getBatchQueue();
        queue.schedule(path, value);
    };

    /**
     * Create reactive proxy wrapper
     *
     * @param {Object} data - Plain object to make reactive
     * @param {Object} options - Configuration options
     * @param {boolean} options.deep - Deep reactivity (default: true)
     * @param {Function} options.onChange - Change notification callback
     * @param {string} options.path - Internal: current property path
     * @returns {Proxy} Reactive proxy wrapper
     */
    const createReactive = (data, options = {}) => {
        // Primitives pass through unchanged
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        // Return existing proxy if already reactive
        if (isReactive(data)) {
            return data;
        }

        const { deep = true, onChange = null, path = '', _seen = new WeakSet() } = options;

        // Circular reference detection
        if (_seen.has(data)) {
            console.warn('bindX: Circular reference detected, skipping reactive wrap');
            return data;
        }
        _seen.add(data);

        const metadata = {
            original: data,
            subscribers: new Set(),
            deep,
            path
        };

        const handler = {
            get(target, property, receiver) {
                // Skip internal properties
                if (property === '__bindx_proxy__' || property === '__bindx_metadata__') {
                    return true;
                }

                const value = Reflect.get(target, property, receiver);

                // Track property access for dependency tracking
                const accessPath = path ? `${path}.${String(property)}` : String(property);
                trackDependency(accessPath);

                // Deep reactivity: wrap nested objects
                if (deep && value && typeof value === 'object' && !isReactive(value)) {
                    return createReactive(value, {
                        deep,
                        onChange,
                        path: accessPath,
                        _seen
                    });
                }

                return value;
            },

            set(target, property, value, receiver) {
                const oldValue = target[property];

                // Only trigger if value actually changed
                if (oldValue === value) {
                    return true;
                }

                const result = Reflect.set(target, property, value, receiver);

                if (result) {
                    const changePath = path ? `${path}.${String(property)}` : String(property);

                    // Notify onChange callback
                    if (onChange) {
                        onChange(changePath, value);
                    }

                    // Notify path subscribers (for computed invalidation)
                    notifyPathSubscribers(changePath);

                    // Notify bindings (Phase 2)
                    notifyBindings(changePath, value);
                }

                return result;
            },

            has(target, property) {
                return Reflect.has(target, property);
            },

            ownKeys(target) {
                return Reflect.ownKeys(target);
            },

            getOwnPropertyDescriptor(target, property) {
                return Reflect.getOwnPropertyDescriptor(target, property);
            },

            // Handle array methods
            deleteProperty(target, property) {
                const hadProperty = property in target;
                const result = Reflect.deleteProperty(target, property);

                if (result && hadProperty) {
                    const changePath = path ? `${path}.${String(property)}` : String(property);
                    if (onChange) {
                        onChange(changePath, undefined);
                    }
                    notifyPathSubscribers(changePath);
                    notifyBindings(changePath, undefined);
                }

                return result;
            }
        };

        const proxy = new Proxy(data, handler);
        reactiveMetadata.set(proxy, metadata);

        return proxy;
    };

    /**
     * Execute function with dependency tracking
     * @param {Function} fn - Function to execute
     * @returns {Object} Result and dependencies
     */
    const withTracking = (fn) => {
        const context = {
            dependencies: new Set(),
            isTracking: true
        };

        const previousContext = currentTrackingContext;
        currentTrackingContext = context;

        try {
            const result = fn();
            return {
                result,
                dependencies: new Set(context.dependencies)
            };
        } finally {
            currentTrackingContext = previousContext;
        }
    };

    /**
     * Subscribe to path changes
     * @param {string} path - Property path to watch
     * @param {Function} callback - Callback to invoke on change
     * @returns {Function} Unsubscribe function
     */
    const subscribeToPath = (path, callback) => {
        const subscribers = pathSubscribers.get(path) || new Set();
        subscribers.add(callback);
        pathSubscribers.set(path, subscribers);

        return () => {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                pathSubscribers.delete(path);
            }
        };
    };

    /**
     * Main bindx factory function
     *
     * @param {Object} data - Plain object to make reactive
     * @param {Object} options - Configuration options
     * @param {boolean} options.deep - Deep reactivity (default: true)
     * @param {Function} options.onChange - Change notification callback
     * @returns {Proxy} Reactive proxy wrapper
     * @throws {TypeError} If data is not an object
     */
    const bindx = (data, options = {}) => {
        if (typeof data !== 'object' || data === null) {
            throw new TypeError('bindx requires an object');
        }

        return createReactive(data, {
            deep: options.deep !== false,
            onChange: options.onChange || null
        });
    };

    // Export factory for bootloader integration
    if (typeof window !== 'undefined') {
        window.bxXFactory = {
            init: (config = {}) => ({ bindx }),
            bindx
        };

        // Legacy global for standalone use
        if (!window.genx) {
            window.bindX = { bindx, createReactive, isReactive };
        }
    }

    // CommonJS export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            bindx,
            createReactive,
            isReactive,
            withTracking,
            subscribeToPath,
            createBatchQueue,
            getBatchQueue
        };
    }
})();
