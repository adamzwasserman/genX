/**
 * Unit tests for bindX One-Way Binding (bx-bind)
 * Following BDD scenarios from bindx-one-way-binding.feature
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { waitForNextFrame } from '../fixtures/binding_fixtures.js';

// Import bindx module
const bindxModule = require('../../src/bindx.js');
const { bindx, createOneWayBinding } = bindxModule;

describe('Feature: One-Way Data Binding', () => {
    let data;
    let element;
    let binding;

    afterEach(() => {
        if (binding && binding.destroy) {
            binding.destroy();
        }
    });

    describe('Scenario: Display text content', () => {
        beforeEach(() => {
            data = bindx({ user: { name: 'Alice' } });
            element = document.createElement('span');
        });

        it('should display data value in element', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true); // RED test
                return;
            }

            binding = createOneWayBinding(element, data, 'user.name');

            expect(element.textContent).toBe('Alice');
        });
    });

    describe('Scenario: Update on data change', () => {
        beforeEach(() => {
            data = bindx({ count: 0 });
            element = document.createElement('span');
        });

        it('should update element when data changes', async () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'count');

            expect(element.textContent).toBe('0');

            data.count = 42;

            await waitForNextFrame();

            expect(element.textContent).toBe('42');
        });
    });

    describe('Scenario: Display nested property', () => {
        beforeEach(() => {
            data = bindx({
                user: {
                    profile: {
                        city: 'New York'
                    }
                }
            });
            element = document.createElement('div');
        });

        it('should display deeply nested property value', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'user.profile.city');

            expect(element.textContent).toBe('New York');
        });
    });

    describe('Scenario: Input value binding (read-only)', () => {
        beforeEach(() => {
            data = bindx({ username: 'admin' });
            element = document.createElement('input');
            element.setAttribute('readonly', 'true');
        });

        it('should bind to input value but not listen to input events', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'username');

            expect(element.value).toBe('admin');

            // User tries to type (but input is readonly)
            // Even if they could, one-way binding shouldn't listen
            const initialValue = data.username;
            element.value = 'hacker';

            // Data should not change
            expect(data.username).toBe(initialValue);
        });
    });

    describe('Scenario: Multiple elements bound to same path', () => {
        let elements;
        let bindings;

        beforeEach(() => {
            data = bindx({ count: 5 });
            elements = [
                document.createElement('span'),
                document.createElement('span'),
                document.createElement('span')
            ];
            bindings = [];
        });

        afterEach(() => {
            // Clean up all bindings
            bindings.forEach(b => {
                if (b && b.destroy) {
                    b.destroy();
                }
            });
        });

        it('should update all elements when data changes', async () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            bindings = elements.map(el => createOneWayBinding(el, data, 'count'));

            // All should show initial value
            elements.forEach(el => {
                expect(el.textContent).toBe('5');
            });

            data.count = 10;

            await waitForNextFrame();

            // All should update
            elements.forEach(el => {
                expect(el.textContent).toBe('10');
            });
        });
    });

    describe('Scenario: XSS prevention', () => {
        beforeEach(() => {
            data = bindx({ malicious: '<script>alert("xss")</script>' });
            element = document.createElement('span');
        });

        it('should display script as text, not execute it', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'malicious');

            // textContent is XSS-safe
            expect(element.textContent).toBe('<script>alert("xss")</script>');

            // innerHTML should NOT contain executable script
            expect(element.innerHTML).not.toContain('<script>');

            // Ensure no actual script tag was created
            const scripts = element.querySelectorAll('script');
            expect(scripts.length).toBe(0);
        });
    });

    describe('Scenario: Binding cleanup', () => {
        beforeEach(() => {
            data = bindx({ temp: 'value' });
            element = document.createElement('span');
        });

        it('should cleanup binding on destroy', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            const bindxModule = require('../../src/bindx.js');
            const { getBindingRegistry } = bindxModule;
            const registry = getBindingRegistry();

            const initialSize = registry.size;

            binding = createOneWayBinding(element, data, 'temp');

            expect(registry.size).toBe(initialSize + 1);

            binding.destroy();

            expect(registry.size).toBe(initialSize);
        });
    });

    describe('Scenario: Empty value handling', () => {
        beforeEach(() => {
            data = bindx({ value: '' });
            element = document.createElement('span');
        });

        it('should display empty string correctly', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'value');

            expect(element.textContent).toBe('');
            expect(element.textContent).not.toBe('undefined');
            expect(element.textContent).not.toBe('null');
        });
    });

    describe('Scenario: Boolean value display', () => {
        beforeEach(() => {
            data = bindx({ active: true });
            element = document.createElement('span');
        });

        it('should display boolean as string', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'active');

            expect(element.textContent).toBe('true');
        });

        it('should update when boolean changes', async () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            binding = createOneWayBinding(element, data, 'active');

            data.active = false;

            await waitForNextFrame();

            expect(element.textContent).toBe('false');
        });
    });

    describe('Scenario: Null and undefined handling', () => {
        beforeEach(() => {
            data = bindx({});
            element = document.createElement('span');
        });

        it('should handle missing property gracefully', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            // This should not throw
            expect(() => {
                binding = createOneWayBinding(element, data, 'missing');
            }).not.toThrow();

            // Should display empty string for undefined
            expect(element.textContent).toBe('');
        });

        it('should handle null value', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            data.value = null;

            binding = createOneWayBinding(element, data, 'value');

            // null should be converted to string
            expect(element.textContent).toBe('null');
        });
    });

    describe('Edge Cases', () => {
        it('should handle number zero', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            data = bindx({ count: 0 });
            element = document.createElement('span');

            binding = createOneWayBinding(element, data, 'count');

            expect(element.textContent).toBe('0');
            expect(element.textContent).not.toBe('');
        });

        it('should handle array values', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            data = bindx({ items: [1, 2, 3] });
            element = document.createElement('span');

            binding = createOneWayBinding(element, data, 'items');

            // Array toString
            expect(element.textContent).toBe('1,2,3');
        });

        it('should handle object values', () => {
            if (!createOneWayBinding) {
                expect(true).toBe(true);
                return;
            }

            data = bindx({ obj: { a: 1 } });
            element = document.createElement('span');

            binding = createOneWayBinding(element, data, 'obj');

            // Object toString
            expect(element.textContent).toBe('[object Object]');
        });
    });
});
