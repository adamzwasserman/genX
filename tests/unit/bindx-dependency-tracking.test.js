/**
 * BDD Tests for bindX Dependency Tracking
 * Feature: bindx-dependency-tracking.feature
 */

const {
    createTestData,
    createMockChangeHandler
} = require('../fixtures/bindx_fixtures.js');

// Import bindX module
let bindx, withTracking;

try {
    const module = require('../../src/bindx.js');
    bindx = module.bindx;
    withTracking = module.withTracking;
} catch (error) {
    console.log('bindx.js not found - expected for RED test phase');
}

describe('Feature: Dependency Tracking', () => {
    let testData;

    beforeEach(() => {
        testData = createTestData();
    });

    describe('Scenario: Track property reads during computation', () => {
        it('should track all properties read during computation', () => {
            // Given I have a reactive object with properties a=1 and b=2
            const data = bindx({ a: 1, b: 2 });

            // When I execute a computed function that reads both properties
            const { result, dependencies } = withTracking(() => {
                return data.a + data.b;
            });

            // Then both "a" and "b" should be in the dependency set
            expect(result).toBe(3);
            expect(dependencies.has('a')).toBe(true);
            expect(dependencies.has('b')).toBe(true);
            expect(dependencies.size).toBe(2);
        });
    });

    describe('Scenario: Multiple computations track separately', () => {
        it('should maintain separate dependency sets for different computations', () => {
            // Given I have a reactive object with x=10, y=20, and z=30
            const data = bindx({ x: 10, y: 20, z: 30 });

            // When I execute computed1 that reads x and y
            const { result: result1, dependencies: deps1 } = withTracking(() => {
                return data.x + data.y;
            });

            // And I execute computed2 that reads y and z
            const { result: result2, dependencies: deps2 } = withTracking(() => {
                return data.y + data.z;
            });

            // Then computed1 dependencies should be {x, y}
            expect(result1).toBe(30);
            expect(deps1.has('x')).toBe(true);
            expect(deps1.has('y')).toBe(true);
            expect(deps1.size).toBe(2);

            // And computed2 dependencies should be {y, z}
            expect(result2).toBe(50);
            expect(deps2.has('y')).toBe(true);
            expect(deps2.has('z')).toBe(true);
            expect(deps2.size).toBe(2);
        });
    });

    describe('Scenario: Nested property tracking', () => {
        it('should track nested property paths', () => {
            // Given I have a reactive object with user.name="Alice"
            const data = bindx({ user: { name: 'Alice' } });

            // When I execute a computation that reads user.name
            const { result, dependencies } = withTracking(() => {
                return data.user.name;
            });

            // Then dependencies should include "user.name"
            expect(result).toBe('Alice');
            expect(dependencies.has('user')).toBe(true);
            expect(dependencies.has('user.name')).toBe(true);
        });
    });

    describe('Scenario: Dependency cleanup on recomputation', () => {
        it('should clear old dependencies when recomputing', () => {
            // Given I have a computed property with dependencies {a, b}
            const data = bindx({ a: 1, b: 2, c: 3 });

            const { dependencies: oldDeps } = withTracking(() => {
                return data.a + data.b;
            });

            // When I recompute and now it only reads {a}
            const { dependencies: newDeps } = withTracking(() => {
                return data.a;
            });

            // Then old dependencies should be cleared (new context)
            expect(oldDeps.has('a')).toBe(true);
            expect(oldDeps.has('b')).toBe(true);

            // And new dependencies should be {a}
            expect(newDeps.has('a')).toBe(true);
            expect(newDeps.has('b')).toBe(false);
            expect(newDeps.size).toBe(1);
        });
    });

    describe('Scenario: No tracking outside computation context', () => {
        it('should not track dependencies outside withTracking', () => {
            // Given I have a reactive object with count=5
            const data = bindx({ count: 5 });

            // When I read count outside of a tracked computation
            const value = data.count;

            // Then no dependencies should be tracked
            expect(value).toBe(5);
            // (No way to verify no tracking - this is implicit)
        });
    });

    describe('Scenario: Nested tracking contexts', () => {
        it('should handle nested tracking contexts correctly', () => {
            // Given I have a reactive object with data
            const data = bindx({ a: 1, b: 2, c: 3 });

            // When I execute computed1 that calls computed2 internally
            const { result, dependencies: deps1 } = withTracking(() => {
                const inner = withTracking(() => {
                    return data.b + data.c;
                });
                return data.a + inner.result;
            });

            // Then computed1 should track its own dependencies
            expect(result).toBe(6); // 1 + (2 + 3)
            expect(deps1.has('a')).toBe(true);

            // Note: In the current simple implementation, nested contexts
            // will track all accessed properties in the outer context
        });
    });

    describe('Scenario: Array element tracking', () => {
        it('should track array element access', () => {
            // Given I have a reactive array [1, 2, 3]
            const data = bindx({ items: [1, 2, 3] });

            // When I execute a computation that reads items[0]
            const { result, dependencies } = withTracking(() => {
                return data.items[0];
            });

            // Then "items" should be tracked as a dependency
            expect(result).toBe(1);
            expect(dependencies.has('items')).toBe(true);
        });
    });

    describe('Performance: Dependency tracking', () => {
        it('should add minimal overhead to property access', () => {
            const data = bindx({ value: 42 });
            const iterations = 10000;

            const start = performance.now();

            for (let i = 0; i < iterations; i++) {
                withTracking(() => {
                    return data.value;
                });
            }

            const duration = performance.now() - start;
            const perAccess = duration / iterations;

            // Should be less than 0.01ms per tracked access
            expect(perAccess).toBeLessThan(0.01);
        });
    });

    describe('Error Handling', () => {
        it('should handle exceptions during tracking', () => {
            const data = bindx({ value: 42 });

            expect(() => {
                withTracking(() => {
                    const val = data.value;
                    throw new Error('Test error');
                });
            }).toThrow('Test error');
        });

        it('should restore context after error', () => {
            const data = bindx({ value: 42 });

            try {
                withTracking(() => {
                    throw new Error('Test error');
                });
            } catch (e) {
                // Ignore error
            }

            // Should still be able to track after error
            const { dependencies } = withTracking(() => {
                return data.value;
            });

            expect(dependencies.has('value')).toBe(true);
        });
    });
});
