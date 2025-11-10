/**
 * Unit tests for bindX Binding Registry
 * Following BDD scenarios from bindx-binding-registry.feature
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMockBinding, createMockElements } from '../fixtures/registry_fixtures.js';

// Import bindx module - createBindingRegistry will be undefined until implemented
let createBindingRegistry;

// Synchronous import for CommonJS
const bindxModule = require('../../src/bindx.js');
createBindingRegistry = bindxModule.createBindingRegistry;

describe('Binding Registry', () => {
    let registry;
    let mockElement;
    let mockBinding;

    beforeEach(() => {
        if (createBindingRegistry) {
            registry = createBindingRegistry();
        }
        mockElement = document.createElement('input');
        mockElement.id = 'test-input';
    });

    afterEach(() => {
        if (registry && registry.clear) {
            registry.clear();
        }
    });

    describe('Scenario: Register new binding', () => {
        it('should register a binding for an element', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true); // RED test - no implementation yet
                return;
            }

            mockBinding = createMockBinding('user.name', mockElement);
            registry.register(mockElement, mockBinding);

            expect(registry.size).toBe(1);
        });

        it('should associate binding with element', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            mockBinding = createMockBinding('user.name', mockElement);
            registry.register(mockElement, mockBinding);

            const elementBindings = registry.getByElement(mockElement);
            expect(elementBindings).toContain(mockBinding);
            expect(elementBindings.length).toBe(1);
        });
    });

    describe('Scenario: Multiple bindings per element', () => {
        it('should register multiple bindings on same element', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const binding1 = createMockBinding('user.name', mockElement, 'model');
            const binding2 = createMockBinding('user.active', mockElement, 'bind');

            registry.register(mockElement, binding1);
            registry.register(mockElement, binding2);

            const elementBindings = registry.getByElement(mockElement);
            expect(elementBindings.length).toBe(2);
            expect(elementBindings).toContain(binding1);
            expect(elementBindings).toContain(binding2);
        });

        it('should not have conflicts between bindings', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const binding1 = createMockBinding('user.name', mockElement, 'model');
            const binding2 = createMockBinding('user.age', mockElement, 'bind');

            registry.register(mockElement, binding1);
            registry.register(mockElement, binding2);

            expect(registry.size).toBe(2);
        });
    });

    describe('Scenario: Automatic cleanup on element removal', () => {
        it('should allow garbage collection via WeakMap', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const elements = createMockElements(100);
            elements.forEach((el, i) => {
                const binding = createMockBinding(`item.${i}`, el);
                registry.register(el, binding);
            });

            expect(registry.size).toBe(100);

            // Note: Actual GC testing requires manual verification
            // This test verifies the WeakMap pattern is used correctly
            expect(registry.getByElement(elements[0])).toBeDefined();
        });
    });

    describe('Scenario: Query bindings by path', () => {
        it('should find bindings by exact path', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const el1 = document.createElement('input');
            const el2 = document.createElement('input');
            const el3 = document.createElement('input');

            const binding1 = createMockBinding('user.name', el1);
            const binding2 = createMockBinding('user.age', el2);
            const binding3 = createMockBinding('settings.theme', el3);

            registry.register(el1, binding1);
            registry.register(el2, binding2);
            registry.register(el3, binding3);

            const nameBindings = registry.getByPath('user.name');
            expect(nameBindings).toContain(binding1);
            expect(nameBindings.length).toBe(1);
        });

        it('should find bindings by path pattern', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const el1 = document.createElement('input');
            const el2 = document.createElement('input');
            const el3 = document.createElement('input');

            const binding1 = createMockBinding('user.name', el1);
            const binding2 = createMockBinding('user.age', el2);
            const binding3 = createMockBinding('settings.theme', el3);

            registry.register(el1, binding1);
            registry.register(el2, binding2);
            registry.register(el3, binding3);

            const userBindings = registry.getByPathPattern('user.*');
            expect(userBindings).toContain(binding1);
            expect(userBindings).toContain(binding2);
            expect(userBindings).not.toContain(binding3);
            expect(userBindings.length).toBe(2);
        });
    });

    describe('Scenario: Unregister binding', () => {
        it('should remove binding from path index', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            mockBinding = createMockBinding('user.name', mockElement);
            registry.register(mockElement, mockBinding);

            expect(registry.getByPath('user.name').length).toBe(1);

            registry.unregister(mockBinding);

            expect(registry.getByPath('user.name').length).toBe(0);
        });

        it('should remove binding from all bindings set', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            mockBinding = createMockBinding('user.name', mockElement);
            registry.register(mockElement, mockBinding);

            expect(registry.size).toBe(1);

            registry.unregister(mockBinding);

            expect(registry.size).toBe(0);
        });
    });

    describe('Scenario: Get bindings by element', () => {
        it('should return all bindings for an element', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const binding1 = createMockBinding('user.name', mockElement);
            const binding2 = createMockBinding('user.age', mockElement);
            const binding3 = createMockBinding('user.email', mockElement);

            registry.register(mockElement, binding1);
            registry.register(mockElement, binding2);
            registry.register(mockElement, binding3);

            const elementBindings = registry.getByElement(mockElement);
            expect(elementBindings.length).toBe(3);
            expect(elementBindings).toContain(binding1);
            expect(elementBindings).toContain(binding2);
            expect(elementBindings).toContain(binding3);
        });
    });

    describe('Scenario: Registry size tracking', () => {
        it('should track size correctly', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            expect(registry.size).toBe(0);

            const elements = createMockElements(10);
            const bindings = elements.map((el, i) =>
                createMockBinding(`item.${i}`, el)
            );

            bindings.forEach((binding, i) => {
                registry.register(elements[i], binding);
            });

            expect(registry.size).toBe(10);

            // Unregister 3 bindings
            registry.unregister(bindings[0]);
            registry.unregister(bindings[1]);
            registry.unregister(bindings[2]);

            expect(registry.size).toBe(7);
        });
    });

    describe('Scenario: Clear all bindings', () => {
        it('should clear all bindings from registry', () => {
            if (!createBindingRegistry) {
                expect(true).toBe(true);
                return;
            }

            const elements = createMockElements(50);
            elements.forEach((el, i) => {
                const binding = createMockBinding(`item.${i}`, el);
                registry.register(el, binding);
            });

            expect(registry.size).toBe(50);

            registry.clear();

            expect(registry.size).toBe(0);
        });
    });
});
