/**
 * Unit tests for bindX computed properties integration with bindings
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { bindx, computed, createOneWayBinding } from '../../src/bindx.js';

describe('Computed Properties with Bindings', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('One-Way Binding with Computed', () => {
        it('should bind computed property to DOM element', () => {
            const data = bindx({ firstName: 'John', lastName: 'Doe' });

            // Add computed property to data
            data.fullName = computed(() => `${data.firstName} ${data.lastName}`);

            const span = document.createElement('span');
            container.appendChild(span);

            // Bind the computed property
            createOneWayBinding(span, data, 'fullName');

            expect(span.textContent).toBe('John Doe');
        });

        it('should update DOM when computed dependencies change', (done) => {
            const data = bindx({ price: 100, tax: 0.1 });
            data.total = computed(() => (data.price * (1 + data.tax)).toFixed(2));

            const span = document.createElement('span');
            container.appendChild(span);

            createOneWayBinding(span, data, 'total');

            expect(span.textContent).toBe('110.00');

            // Change dependency
            data.tax = 0.2;

            // Wait for batched update
            requestAnimationFrame(() => {
                expect(span.textContent).toBe('120.00');
                done();
            });
        });

        it('should handle nested computed properties', (done) => {
            const data = bindx({ x: 2 });
            data.squared = computed(() => data.x * data.x);
            data.cubed = computed(() => data.squared() * data.x);

            const span = document.createElement('span');
            container.appendChild(span);

            createOneWayBinding(span, data, 'cubed');

            expect(span.textContent).toBe('8');

            data.x = 3;

            requestAnimationFrame(() => {
                expect(span.textContent).toBe('27');
                done();
            });
        });
    });

    describe('Multiple Bindings with Computed', () => {
        it('should support multiple elements bound to same computed', (done) => {
            const data = bindx({ count: 5 });
            data.doubled = computed(() => data.count * 2);

            const span1 = document.createElement('span');
            const span2 = document.createElement('span');
            container.appendChild(span1);
            container.appendChild(span2);

            createOneWayBinding(span1, data, 'doubled');
            createOneWayBinding(span2, data, 'doubled');

            expect(span1.textContent).toBe('10');
            expect(span2.textContent).toBe('10');

            data.count = 7;

            requestAnimationFrame(() => {
                expect(span1.textContent).toBe('14');
                expect(span2.textContent).toBe('14');
                done();
            });
        });

        it('should support mixing regular and computed bindings', (done) => {
            const data = bindx({ base: 10 });
            data.derived = computed(() => data.base * 3);

            const spanBase = document.createElement('span');
            const spanDerived = document.createElement('span');
            container.appendChild(spanBase);
            container.appendChild(spanDerived);

            createOneWayBinding(spanBase, data, 'base');
            createOneWayBinding(spanDerived, data, 'derived');

            expect(spanBase.textContent).toBe('10');
            expect(spanDerived.textContent).toBe('30');

            data.base = 20;

            requestAnimationFrame(() => {
                expect(spanBase.textContent).toBe('20');
                expect(spanDerived.textContent).toBe('60');
                done();
            });
        });
    });

    describe('Computed with Complex Data Structures', () => {
        it('should handle computed over nested object properties', (done) => {
            const data = bindx({
                user: { firstName: 'Alice', lastName: 'Smith' },
                settings: { titlePrefix: 'Dr.' }
            });

            data.displayName = computed(() => {
                return `${data.settings.titlePrefix} ${data.user.firstName} ${data.user.lastName}`;
            });

            const span = document.createElement('span');
            container.appendChild(span);

            createOneWayBinding(span, data, 'displayName');

            expect(span.textContent).toBe('Dr. Alice Smith');

            data.user.firstName = 'Bob';

            requestAnimationFrame(() => {
                expect(span.textContent).toBe('Dr. Bob Smith');
                done();
            });
        });

        it.skip('should handle computed over array properties (Phase 5 feature)', (done) => {
            const data = bindx({ items: [1, 2, 3, 4, 5] });
            data.sum = computed(() => {
                return data.items.reduce((acc, val) => acc + val, 0);
            });

            const span = document.createElement('span');
            container.appendChild(span);

            createOneWayBinding(span, data, 'sum');

            expect(span.textContent).toBe('15');

            data.items.push(6);

            requestAnimationFrame(() => {
                expect(span.textContent).toBe('21');
                done();
            });
        });
    });

    describe('Performance with Computed Bindings', () => {
        it('should efficiently update only affected bindings', (done) => {
            const data = bindx({ a: 1, b: 2, c: 3 });
            data.sumAB = computed(() => data.a + data.b);
            data.sumBC = computed(() => data.b + data.c);

            const spanAB = document.createElement('span');
            const spanBC = document.createElement('span');
            container.appendChild(spanAB);
            container.appendChild(spanBC);

            createOneWayBinding(spanAB, data, 'sumAB');
            createOneWayBinding(spanBC, data, 'sumBC');

            expect(spanAB.textContent).toBe('3');
            expect(spanBC.textContent).toBe('5');

            // Change only 'a' - should only affect sumAB
            data.a = 10;

            requestAnimationFrame(() => {
                expect(spanAB.textContent).toBe('12'); // Updated
                expect(spanBC.textContent).toBe('5');  // Not updated (cache hit)
                done();
            });
        });
    });
});
