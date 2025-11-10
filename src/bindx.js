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
     * Binding Registry (singleton)
     * Uses WeakMap for automatic garbage collection
     *
     * @returns {Object} Binding registry interface
     */
    const createBindingRegistry = () => {
        // WeakMap: element -> Array<BindingConfig>
        const elementBindings = new WeakMap();

        // Map: path -> Set<BindingConfig> (for efficient path lookups)
        const pathBindings = new Map();

        // All bindings (for iteration)
        const allBindings = new Set();

        /**
         * Register a binding
         * @param {HTMLElement} element - DOM element
         * @param {Object} binding - Binding configuration
         * @returns {Object} The registered binding
         */
        const register = (element, binding) => {
            // Store by element (WeakMap for auto GC)
            const bindings = elementBindings.get(element) || [];
            bindings.push(binding);
            elementBindings.set(element, bindings);

            // Store by path
            const pathSet = pathBindings.get(binding.path) || new Set();
            pathSet.add(binding);
            pathBindings.set(binding.path, pathSet);

            // Add to all bindings
            allBindings.add(binding);

            return binding;
        };

        /**
         * Unregister a binding
         * @param {Object} binding - Binding to remove
         */
        const unregister = (binding) => {
            // Remove from path index
            const pathSet = pathBindings.get(binding.path);
            if (pathSet) {
                pathSet.delete(binding);
                if (pathSet.size === 0) {
                    pathBindings.delete(binding.path);
                }
            }

            // Remove from all bindings
            allBindings.delete(binding);

            // Element bindings cleaned up automatically by WeakMap
        };

        /**
         * Get bindings for an element
         * @param {HTMLElement} element - DOM element
         * @returns {Array<Object>} Array of bindings
         */
        const getByElement = (element) => {
            return elementBindings.get(element) || [];
        };

        /**
         * Get bindings by exact path
         * @param {string} path - Property path
         * @returns {Array<Object>} Array of bindings
         */
        const getByPath = (path) => {
            return Array.from(pathBindings.get(path) || []);
        };

        /**
         * Get bindings by path pattern (supports wildcards)
         * @param {string} pattern - Path pattern (e.g., "user.*")
         * @returns {Array<Object>} Array of bindings
         */
        const getByPathPattern = (pattern) => {
            const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
            const matches = [];

            for (const [path, bindings] of pathBindings) {
                if (regex.test(path)) {
                    matches.push(...bindings);
                }
            }

            return matches;
        };

        /**
         * Clear all bindings
         */
        const clear = () => {
            pathBindings.clear();
            allBindings.clear();
            // elementBindings WeakMap clears automatically
        };

        return Object.freeze({
            register,
            unregister,
            getByElement,
            getByPath,
            getByPathPattern,
            clear,
            get size() { return allBindings.size; }
        });
    };

    /**
     * Global binding registry instance
     */
    let globalBindingRegistry = null;

    /**
     * Get or create global binding registry
     * @returns {Object} Binding registry instance
     */
    const getBindingRegistry = () => {
        if (!globalBindingRegistry) {
            globalBindingRegistry = createBindingRegistry();
        }
        return globalBindingRegistry;
    };

    /**
     * Execute DOM update (placeholder for Phase 4)
     * @param {string} path - Property path
     * @param {*} value - New value
     */
    const executeDOMUpdate = (path, value) => {
        // Will be implemented in Phase 4: DOM Integration
        // For now, update bindings registered for this path
        const registry = getBindingRegistry();
        const bindings = registry.getByPath(path);

        bindings.forEach(binding => {
            if (binding.updateDOM) {
                try {
                    binding.updateDOM();
                } catch (error) {
                    console.error(`bindX: Failed to update DOM for ${path}:`, error);
                }
            }
        });

        if (typeof console !== 'undefined' && console.debug) {
            console.debug(`bindX: Update ${path} = ${value}`);
        }
    };

    /**
     * Notify bindings of changes
     * @param {string} path - Path that changed
     * @param {*} value - New value
     */
    const notifyBindings = (path, value) => {
        // Schedule in batch queue for DOM updates
        const queue = getBatchQueue();
        queue.schedule(path, value);
    };

    /**
     * Helper: Get nested property value
     * @param {Object} obj - Object to read from
     * @param {string} path - Property path (e.g., "user.name")
     * @returns {*} Property value
     */
    const getNestedProperty = (obj, path) => {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    /**
     * Helper: Set nested property value
     * @param {Object} obj - Object to write to
     * @param {string} path - Property path (e.g., "user.name")
     * @param {*} value - Value to set
     */
    const setNestedProperty = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((acc, key) => acc[key], obj);
        target[lastKey] = value;
    };

    /**
     * Generate unique binding ID
     * @returns {string} Unique ID
     */
    const generateBindingId = () => {
        return `bx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    /**
     * Create two-way binding (bx-model)
     *
     * @param {HTMLElement} element - Form control element
     * @param {Object} data - Reactive data object
     * @param {string} path - Property path to bind
     * @param {Object} options - Binding options
     * @param {number} options.debounce - Debounce delay in ms (default: 0)
     * @returns {Object} Binding instance
     */
    const createModelBinding = (element, data, path, options = {}) => {
        const { debounce = 0 } = options;

        // Validation: bx-model only for form controls
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
            throw new Error(
                `bx-model requires form control element. Got ${element.tagName}. ` +
                `Use bx-bind for display-only elements.`
            );
        }

        // Get/set value helpers based on input type
        const getValue = (el) => {
            if (el.type === 'checkbox') return el.checked;
            if (el.type === 'number') return parseFloat(el.value) || 0;
            return el.value;
        };

        const setValue = (el, val) => {
            if (el.type === 'checkbox') {
                el.checked = Boolean(val);
            } else {
                el.value = String(val);
            }
        };

        // DOM -> Data (with debouncing)
        let timeoutId = null;
        const handleInput = (event) => {
            const newValue = getValue(element);

            if (debounce > 0) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setNestedProperty(data, path, newValue);
                }, debounce);
            } else {
                setNestedProperty(data, path, newValue);
            }
        };

        element.addEventListener('input', handleInput);

        // Data -> DOM (on changes)
        const updateDOM = () => {
            const currentValue = getNestedProperty(data, path);
            const elementValue = getValue(element);

            // Only update if values differ (prevent infinite loops)
            if (elementValue !== currentValue) {
                setValue(element, currentValue);
            }
        };

        // Initial sync
        updateDOM();

        // Register binding
        const binding = {
            id: generateBindingId(),
            element,
            path,
            type: 'model',
            options,
            updateDOM,
            destroy: () => {
                element.removeEventListener('input', handleInput);
                clearTimeout(timeoutId);
                const registry = getBindingRegistry();
                registry.unregister(binding);
            }
        };

        const registry = getBindingRegistry();
        registry.register(element, binding);

        return binding;
    };

    /**
     * Create one-way binding (bx-bind)
     *
     * @param {HTMLElement} element - Any DOM element
     * @param {Object} data - Reactive data object
     * @param {string} path - Property path to bind
     * @param {Object} options - Binding options
     * @param {string} options.formatter - Optional formatter name (fmtX integration)
     * @returns {Object} Binding instance
     */
    const createOneWayBinding = (element, data, path, options = {}) => {
        const { formatter = null } = options;

        // Data -> DOM only (no DOM -> Data)
        const updateDOM = () => {
            let value = getNestedProperty(data, path);

            // Handle undefined/null gracefully
            if (value === undefined) {
                value = '';
            }

            // Convert to string for display
            value = String(value);

            // Apply formatter if specified (fmtX integration)
            if (formatter && typeof window !== 'undefined' && window.fxXFactory) {
                try {
                    value = window.fxXFactory.format(formatter, value);
                } catch (error) {
                    console.warn(`bindX: Formatter ${formatter} failed:`, error);
                }
            }

            // XSS-safe: Use textContent for non-input elements, value for inputs
            if (['INPUT', 'TEXTAREA'].includes(element.tagName)) {
                if (element.value !== value) {
                    element.value = value;
                }
            } else {
                // textContent is XSS-safe (never executes scripts)
                if (element.textContent !== value) {
                    element.textContent = value;
                }
            }
        };

        // Initial sync
        updateDOM();

        // Register binding
        const binding = {
            id: generateBindingId(),
            element,
            path,
            type: 'bind',
            options,
            updateDOM,
            destroy: () => {
                const registry = getBindingRegistry();
                registry.unregister(binding);
            }
        };

        const registry = getBindingRegistry();
        registry.register(element, binding);

        return binding;
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
            getBatchQueue,
            createBindingRegistry,
            getBindingRegistry,
            createModelBinding,
            createOneWayBinding,
            getNestedProperty,
            setNestedProperty,
            generateBindingId
        };
    }
})();
