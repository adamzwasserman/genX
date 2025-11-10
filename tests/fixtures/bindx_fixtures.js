/**
 * Test fixtures for bindX reactive proxy
 */

/**
 * Create test data objects
 * @returns {Object} Test data fixtures
 */
const createTestData = () => ({
    simple: {
        count: 0,
        name: 'test',
        active: true
    },

    nested: {
        user: {
            name: 'Alice',
            age: 30
        },
        settings: {
            theme: 'dark',
            notifications: true
        }
    },

    array: [1, 2, 3, 4, 5],

    withCircular: (() => {
        const obj = { value: 42 };
        obj.self = obj; // Circular reference
        return obj;
    })(),

    deepNested: {
        level1: {
            level2: {
                level3: {
                    value: 'deep'
                }
            }
        }
    }
});

/**
 * Create mock change handler with call tracking
 * @returns {Function} Mock handler function with tracking methods
 */
const createMockChangeHandler = () => {
    const calls = [];

    const handler = (path, value) => {
        calls.push({
            path,
            value,
            timestamp: Date.now()
        });
    };

    handler.getCalls = () => calls;
    handler.reset = () => calls.length = 0;
    handler.lastCall = () => calls[calls.length - 1];
    handler.callCount = () => calls.length;
    handler.wasCalled = () => calls.length > 0;
    handler.wasCalledWith = (path, value) => {
        return calls.some(call =>
            call.path === path && call.value === value
        );
    };

    return handler;
};

/**
 * Wait for next animation frame
 * @returns {Promise<void>}
 */
const waitForNextFrame = () =>
    new Promise(resolve => requestAnimationFrame(resolve));

/**
 * Wait for multiple frames
 * @param {number} count - Number of frames to wait
 * @returns {Promise<void>}
 */
const waitForFrames = async (count = 1) => {
    for (let i = 0; i < count; i++) {
        await waitForNextFrame();
    }
};

/**
 * Create spy function for tracking calls
 * @param {Function} fn - Original function to spy on
 * @returns {Function} Spy function with tracking
 */
const createSpy = (fn = () => {}) => {
    const calls = [];

    const spy = (...args) => {
        calls.push({ args, timestamp: Date.now() });
        return fn(...args);
    };

    spy.getCalls = () => calls;
    spy.reset = () => calls.length = 0;
    spy.callCount = () => calls.length;
    spy.wasCalled = () => calls.length > 0;

    return spy;
};

/**
 * Assert deep equality
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} message - Error message
 */
const assertDeepEqual = (actual, expected, message = '') => {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);

    if (actualStr !== expectedStr) {
        throw new Error(
            `${message}\nExpected:\n${expectedStr}\nActual:\n${actualStr}`
        );
    }
};

/**
 * Create performance timer
 * @returns {Object} Timer with start/stop methods
 */
const createTimer = () => {
    let startTime = 0;
    let endTime = 0;

    return {
        start() {
            startTime = performance.now();
        },

        stop() {
            endTime = performance.now();
            return endTime - startTime;
        },

        duration() {
            return endTime - startTime;
        },

        reset() {
            startTime = 0;
            endTime = 0;
        }
    };
};

// CommonJS exports
module.exports = {
    createTestData,
    createMockChangeHandler,
    waitForNextFrame,
    waitForFrames,
    createSpy,
    assertDeepEqual,
    createTimer
};
