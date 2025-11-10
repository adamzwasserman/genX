/**
 * Test fixtures for bindX computed properties
 */

/**
 * Create mock expensive computation for testing memoization
 * @returns {Object} Mock computation with call tracking
 */
export const createMockComputation = () => {
    let callCount = 0;

    const expensive = () => {
        callCount++;
        // Simulate expensive operation
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
    };

    return {
        expensive,
        getCallCount: () => callCount,
        reset: () => { callCount = 0; }
    };
};

/**
 * Create test data for circular dependency testing
 * @param {Function} computed - Computed property factory
 * @returns {Object} Data structure with circular computed dependencies
 */
export const createCircularData = (computed) => {
    const data = {};

    // This creates a circular dependency: a depends on b, b depends on a
    data.a = computed(() => data.b() + 1);
    data.b = computed(() => data.a() + 1);

    return data;
};

/**
 * Create nested computed test data
 * @param {Object} reactiveData - Reactive data object
 * @param {Function} computed - Computed property factory
 * @returns {Object} Computed properties
 */
export const createNestedComputed = (reactiveData, computed) => {
    const squared = computed(() => reactiveData.x * reactiveData.x);
    const cubed = computed(() => squared() * reactiveData.x);

    return { squared, cubed };
};

/**
 * Wait for next frame (for async testing)
 * @returns {Promise<void>}
 */
export const waitForNextFrame = () =>
    new Promise(resolve => requestAnimationFrame(resolve));
