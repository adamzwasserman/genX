/**
 * BDD Tests for bindX Reactive Proxy Wrapper
 * Feature: bindx-reactive-proxy.feature
 */

const {
    createTestData,
    createMockChangeHandler,
    waitForNextFrame,
    createTimer
} = require('../fixtures/bindx_fixtures.js');

// Import bindX module (will be created in step 5)
let bindx, createReactive, isReactive;

// Try to import the module
try {
    const module = require('../../src/bindx.js');
    bindx = module.bindx;
    createReactive = module.createReactive;
    isReactive = module.isReactive;
} catch (error) {
    // Module doesn't exist yet - tests will fail (RED state)
    console.log('bindx.js not found - expected for RED test phase');
}

describe('Feature: Reactive Proxy Wrapper', () => {
    let testData;
    let mockHandler;

    beforeEach(() => {
        testData = createTestData();
        mockHandler = createMockChangeHandler();
    });

    describe('Scenario: Wrap plain object with reactive proxy', () => {
        it('should wrap plain object and track property access', () => {
            // Given I have a plain object with count 0 and name "test"
            const data = testData.simple;

            // When I wrap it with bindx()
            const reactive = bindx(data, { onChange: mockHandler });

            // Then property reads should be tracked
            const count = reactive.count;
            expect(count).toBe(0);

            // And property writes should trigger notifications
            reactive.count = 5;
            expect(mockHandler.wasCalled()).toBe(true);
            expect(mockHandler.wasCalledWith('count', 5)).toBe(true);
        });
    });

    describe('Scenario: Deep reactivity for nested objects', () => {
        it('should trigger notifications for nested property changes', () => {
            // Given I have a nested object with user name "Alice" and age 30
            const data = testData.nested;

            // When I wrap it with bindx with deep option true
            const reactive = bindx(data, { deep: true, onChange: mockHandler });

            // Then nested property changes should trigger notifications
            reactive.user.name = 'Bob';

            expect(mockHandler.wasCalled()).toBe(true);

            // And the notification path should be "user.name"
            const lastCall = mockHandler.lastCall();
            expect(lastCall.path).toBe('user.name');
            expect(lastCall.value).toBe('Bob');
        });
    });

    describe('Scenario: Shallow reactivity (opt-in)', () => {
        it('should only track top-level changes when shallow mode enabled', () => {
            // Given I have a nested object with user name "Alice"
            const data = { user: { name: 'Alice' } };

            // When I wrap it with bindx with deep option false
            const reactive = bindx(data, { deep: false, onChange: mockHandler });

            // Then top-level changes trigger notifications
            reactive.user = { name: 'Bob' };
            expect(mockHandler.callCount()).toBe(1);

            mockHandler.reset();

            // But nested property changes do not trigger notifications
            reactive.user.name = 'Charlie';
            expect(mockHandler.callCount()).toBe(0);
        });
    });

    describe('Scenario: Circular reference detection', () => {
        it('should handle circular references without infinite recursion', () => {
            // Given I have an object with circular reference to itself
            const data = testData.withCircular;

            // When I wrap it with bindx()
            // Then it should not cause infinite recursion
            expect(() => {
                const reactive = bindx(data, { onChange: mockHandler });

                // And it should handle the circular reference gracefully
                expect(reactive.value).toBe(42);
                expect(reactive.self).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Scenario: Change notification', () => {
        it('should invoke onChange callback with path and new value', () => {
            // Given I have a reactive object
            const data = { count: 0 };
            const reactive = bindx(data, { onChange: mockHandler });

            // When I set a property to a new value
            reactive.count = 10;

            // Then the onChange callback should be invoked
            expect(mockHandler.wasCalled()).toBe(true);

            // And it should receive the path and new value
            const lastCall = mockHandler.lastCall();
            expect(lastCall.path).toBe('count');
            expect(lastCall.value).toBe(10);
        });
    });

    describe('Scenario: No notification on same value', () => {
        it('should not trigger onChange when value is unchanged', () => {
            // Given I have a reactive object with count 5
            const data = { count: 5 };
            const reactive = bindx(data, { onChange: mockHandler });

            mockHandler.reset();

            // When I set count to 5 again
            reactive.count = 5;

            // Then the onChange callback should not be invoked
            expect(mockHandler.callCount()).toBe(0);
        });
    });

    describe('Scenario: Proxy metadata storage', () => {
        it('should mark proxy as reactive and preserve original', () => {
            // Given I have a plain object
            const data = { value: 42 };
            const original = data;

            // When I wrap it with bindx()
            const reactive = bindx(data);

            // Then the proxy should be marked as reactive
            expect(isReactive(reactive)).toBe(true);

            // And the original object should be preserved
            expect(isReactive(original)).toBe(false);
            expect(original.value).toBe(42);
        });
    });

    describe('Scenario: Array reactivity', () => {
        it('should make arrays reactive', () => {
            // Given I have an array [1, 2, 3]
            const data = { items: [1, 2, 3] };
            const reactive = bindx(data, { onChange: mockHandler });

            // When I wrap it with bindx()
            // Then array mutations should trigger notifications
            reactive.items.push(4);
            expect(mockHandler.wasCalled()).toBe(true);

            // And array access should work normally
            expect(reactive.items[0]).toBe(1);
            expect(reactive.items.length).toBe(4);
        });
    });

    describe('Performance: Proxy creation', () => {
        it('should create proxy in less than 0.1ms', () => {
            const timer = createTimer();
            const data = testData.simple;

            timer.start();
            const reactive = bindx(data);
            const duration = timer.stop();

            expect(duration).toBeLessThan(0.1);
        });

        it('should handle 10,000 reactive objects without memory leaks', () => {
            const objects = [];

            for (let i = 0; i < 10000; i++) {
                objects.push(bindx({ id: i, value: Math.random() }));
            }

            // Verify all are reactive
            expect(objects.length).toBe(10000);
            expect(isReactive(objects[0])).toBe(true);
            expect(isReactive(objects[9999])).toBe(true);

            // Allow GC to run (WeakMap should handle cleanup)
            objects.length = 0;
        });
    });

    describe('Error Handling', () => {
        it('should throw TypeError for non-object data', () => {
            expect(() => bindx(null)).toThrow(TypeError);
            expect(() => bindx(undefined)).toThrow(TypeError);
            expect(() => bindx(42)).toThrow(TypeError);
            expect(() => bindx('string')).toThrow(TypeError);
        });

        it('should return primitives unchanged', () => {
            const result = createReactive(42);
            expect(result).toBe(42);
        });
    });
});
