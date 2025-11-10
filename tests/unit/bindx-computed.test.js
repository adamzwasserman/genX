/**
 * Unit tests for bindX computed properties
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { bindx, computed, subscribeToPath, withTracking } from '../../src/bindx.js';
import {
    createMockComputation,
    createCircularData,
    createNestedComputed
} from '../fixtures/computed_fixtures.js';

describe('Computed Properties', () => {
    describe('Basic Computed Property', () => {
        it('should compute simple derived value', () => {
            const data = bindx({ a: 2, b: 3 });
            const sum = computed(() => data.a + data.b);

            expect(sum()).toBe(5);
        });

        it('should automatically recompute on dependency change', () => {
            const data = bindx({ price: 100, tax: 0.1 });
            const total = computed(() => data.price * (1 + data.tax));

            expect(total()).toBeCloseTo(110, 5);

            data.tax = 0.2;
            expect(total()).toBeCloseTo(120, 5);
        });

        it('should track nested property access', () => {
            const data = bindx({ user: { name: 'Alice', age: 30 } });
            const greeting = computed(() => `Hello, ${data.user.name}`);

            expect(greeting()).toBe('Hello, Alice');

            data.user.name = 'Bob';
            expect(greeting()).toBe('Hello, Bob');
        });
    });

    describe('Nested Computed Properties', () => {
        it('should support computed properties depending on other computed', () => {
            const data = bindx({ x: 2 });
            const { squared, cubed } = createNestedComputed(data, computed);

            expect(squared()).toBe(4);
            expect(cubed()).toBe(8);
        });

        it('should recompute nested chain on base value change', () => {
            const data = bindx({ x: 2 });
            const { squared, cubed } = createNestedComputed(data, computed);

            data.x = 3;
            expect(squared()).toBe(9);
            expect(cubed()).toBe(27);
        });
    });

    describe('Circular Dependency Detection', () => {
        it('should detect direct circular dependencies', () => {
            const circularData = createCircularData(computed);

            expect(() => {
                circularData.a();
            }).toThrow(/circular/i);
        });

        it('should provide meaningful error message', () => {
            const circularData = createCircularData(computed);

            try {
                circularData.a();
                fail('Should have thrown CircularDependencyError');
            } catch (error) {
                expect(error.message).toMatch(/circular/i);
                expect(error.name).toBe('CircularDependencyError');
            }
        });
    });

    describe('Memoization (Cache)', () => {
        it('should cache computed values', () => {
            const mock = createMockComputation();
            const data = bindx({ trigger: 0 });
            const cached = computed(() => {
                data.trigger; // Track dependency
                return mock.expensive();
            });

            // First call computes
            const result1 = cached();
            expect(mock.getCallCount()).toBe(1);

            // Subsequent calls hit cache
            for (let i = 0; i < 99; i++) {
                cached();
            }
            expect(mock.getCallCount()).toBe(1);
        });

        it('should invalidate cache on dependency change', () => {
            const mock = createMockComputation();
            const data = bindx({ value: 1 });
            const cached = computed(() => {
                const val = data.value;
                return mock.expensive() + val;
            });

            // First call
            const result1 = cached();
            expect(mock.getCallCount()).toBe(1);

            // Cache hit
            cached();
            expect(mock.getCallCount()).toBe(1);

            // Change dependency - invalidates cache
            data.value = 2;

            // Next call recomputes
            const result2 = cached();
            expect(mock.getCallCount()).toBe(2);
        });

        it('should only recompute affected computed properties', () => {
            const mock1 = createMockComputation();
            const mock2 = createMockComputation();
            const data = bindx({ a: 1, b: 2 });

            const comp1 = computed(() => {
                const val = data.a;
                return mock1.expensive() + val;
            });

            const comp2 = computed(() => {
                const val = data.b;
                return mock2.expensive() + val;
            });

            // Initial computation
            comp1();
            comp2();
            expect(mock1.getCallCount()).toBe(1);
            expect(mock2.getCallCount()).toBe(1);

            // Change only data.a - should only invalidate comp1
            data.a = 10;

            comp1(); // Recomputes
            comp2(); // Uses cache

            expect(mock1.getCallCount()).toBe(2);
            expect(mock2.getCallCount()).toBe(1); // Still cached
        });
    });

    describe('Dependency Tracking', () => {
        it('should track all accessed properties', () => {
            const data = bindx({ a: 1, b: 2, c: 3 });
            const { result, dependencies } = withTracking(() => {
                return data.a + data.b;
            });

            expect(result).toBe(3);
            expect(dependencies.has('a')).toBe(true);
            expect(dependencies.has('b')).toBe(true);
            expect(dependencies.has('c')).toBe(false);
        });

        it('should handle conditional dependencies', () => {
            const data = bindx({ flag: true, a: 10, b: 20 });
            const conditional = computed(() => {
                return data.flag ? data.a : data.b;
            });

            expect(conditional()).toBe(10);

            // Only 'a' was accessed, so changing 'b' shouldn't trigger
            data.b = 30;
            expect(conditional()).toBe(10); // Still cached

            // Changing flag invalidates and accesses different property
            data.flag = false;
            expect(conditional()).toBe(30);
        });
    });

    describe('Performance', () => {
        it('should compute in less than 1ms for simple operations', () => {
            const data = bindx({ a: 1, b: 2, c: 3 });
            const sum = computed(() => data.a + data.b + data.c);

            const start = performance.now();
            sum();
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(1);
        });

        it('should handle 100 computed properties efficiently', () => {
            const data = bindx({ values: Array(100).fill(0).map((_, i) => i) });
            const computeds = Array(100).fill(0).map((_, i) =>
                computed(() => data.values[i] * 2)
            );

            const start = performance.now();
            computeds.forEach(c => c());
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('Edge Cases', () => {
        it('should handle computed returning undefined', () => {
            const data = bindx({ value: null });
            const comp = computed(() => data.value?.nested?.prop);

            expect(comp()).toBeUndefined();
        });

        it('should handle computed with no dependencies', () => {
            const comp = computed(() => 42);

            expect(comp()).toBe(42);
            expect(comp()).toBe(42); // Should still cache
        });

        it('should handle changing computed function dependencies', () => {
            const data = bindx({ flag: true, a: 1, b: 2 });
            const dynamic = computed(() => {
                if (data.flag) {
                    return data.a * 2;
                } else {
                    return data.b * 3;
                }
            });

            expect(dynamic()).toBe(2); // Uses data.a

            data.flag = false;
            expect(dynamic()).toBe(6); // Now uses data.b

            // Changing a shouldn't affect anymore
            data.a = 100;
            expect(dynamic()).toBe(6); // Still cached, only depends on b now
        });
    });
});

describe('Subscription System', () => {
    it('should allow subscribing to path changes', () => {
        const data = bindx({ user: { name: 'Alice' } });
        const changes = [];

        const unsubscribe = subscribeToPath('user.name', (path) => {
            changes.push(path);
        });

        data.user.name = 'Bob';
        data.user.name = 'Charlie';

        expect(changes.length).toBeGreaterThan(0);

        unsubscribe();
    });

    it('should cleanup subscriptions on unsubscribe', () => {
        const data = bindx({ value: 1 });
        let callCount = 0;

        const unsubscribe = subscribeToPath('value', () => {
            callCount++;
        });

        data.value = 2;
        expect(callCount).toBeGreaterThan(0);

        const beforeUnsubscribe = callCount;
        unsubscribe();

        data.value = 3;
        expect(callCount).toBe(beforeUnsubscribe); // No new calls
    });
});
