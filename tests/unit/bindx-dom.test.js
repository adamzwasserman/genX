/**
 * Unit tests for bindX DOM integration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { bindx, scan, parseBindingAttribute, init } from '../../src/bindx.js';

describe('DOM Integration', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('Attribute Parser', () => {
        it('should parse simple bx-model attribute', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'user.name');

            const config = parseBindingAttribute(input, 'bx-model');

            expect(config).toEqual({ path: 'user.name' });
        });

        it('should parse inline debounce option', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'search:300');

            const config = parseBindingAttribute(input, 'bx-model');

            expect(config).toEqual({ path: 'search', debounce: 300 });
        });

        it('should parse bx-opts JSON', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'value');
            input.setAttribute('bx-opts', '{"debounce":500,"formatter":"currency"}');

            const config = parseBindingAttribute(input, 'bx-model');

            expect(config.path).toBe('value');
            expect(config.debounce).toBe(500);
            expect(config.formatter).toBe('currency');
        });

        it('should parse individual bx-debounce attribute', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'text');
            input.setAttribute('bx-debounce', '250');

            const config = parseBindingAttribute(input, 'bx-model');

            expect(config.path).toBe('text');
            expect(config.debounce).toBe(250);
        });

        it('should parse bx-format attribute', () => {
            const span = document.createElement('span');
            span.setAttribute('bx-bind', 'price');
            span.setAttribute('bx-format', 'currency');

            const config = parseBindingAttribute(span, 'bx-bind');

            expect(config.path).toBe('price');
            expect(config.formatter).toBe('currency');
        });

        it('should return null for missing attribute', () => {
            const div = document.createElement('div');

            const config = parseBindingAttribute(div, 'bx-model');

            expect(config).toBeNull();
        });
    });

    describe('DOM Scanner', () => {
        it('should scan and bind bx-model elements', (done) => {
            const data = bindx({ username: 'Alice' });

            container.innerHTML = '<input bx-model="username" type="text">';
            const bindings = scan(container, data);

            expect(bindings.length).toBe(1);
            expect(bindings[0].type).toBe('model');
            expect(bindings[0].path).toBe('username');

            const input = container.querySelector('input');
            expect(input.value).toBe('Alice');

            done();
        });

        it('should scan and bind bx-bind elements', () => {
            const data = bindx({ message: 'Hello World' });

            container.innerHTML = '<span bx-bind="message"></span>';
            const bindings = scan(container, data);

            expect(bindings.length).toBe(1);
            expect(bindings[0].type).toBe('bind');
            expect(bindings[0].path).toBe('message');

            const span = container.querySelector('span');
            expect(span.textContent).toBe('Hello World');
        });

        it('should scan multiple elements', () => {
            const data = bindx({
                name: 'Bob',
                age: 30,
                email: 'bob@example.com'
            });

            container.innerHTML = `
                <input bx-model="name" type="text">
                <span bx-bind="age"></span>
                <input bx-model="email" type="email">
            `;

            const bindings = scan(container, data);

            expect(bindings.length).toBe(3);
            expect(bindings.filter(b => b.type === 'model').length).toBe(2);
            expect(bindings.filter(b => b.type === 'bind').length).toBe(1);
        });

        it('should handle nested elements', () => {
            const data = bindx({
                user: { firstName: 'John', lastName: 'Doe' },
                title: 'Welcome'
            });

            container.innerHTML = `
                <div>
                    <h1 bx-bind="title"></h1>
                    <div>
                        <input bx-model="user.firstName">
                        <input bx-model="user.lastName">
                    </div>
                </div>
            `;

            const bindings = scan(container, data);

            expect(bindings.length).toBe(3);
        });

        it('should respect custom prefix', () => {
            const data = bindx({ value: 'test' });

            container.innerHTML = '<input data-model="value">';
            const bindings = scan(container, data, { prefix: 'data-' });

            expect(bindings.length).toBe(1);
        });

        it('should handle scanning empty container', () => {
            const data = bindx({ value: 1 });

            const bindings = scan(container, data);

            expect(bindings.length).toBe(0);
        });

        it('should warn when data is not provided', () => {
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

            container.innerHTML = '<input bx-model="test">';
            const bindings = scan(container, null);

            expect(bindings.length).toBe(0);
            expect(consoleWarn).toHaveBeenCalled();

            consoleWarn.mockRestore();
        });
    });

    describe('Init Function', () => {
        it('should return API object with scan and stop methods', () => {
            const data = bindx({ value: 1 });
            const api = init(data, { auto: false, observe: false });

            expect(api).toHaveProperty('scan');
            expect(api).toHaveProperty('stop');
            expect(api).toHaveProperty('data');
            expect(api.data).toBe(data);
        });

        it('should not auto-scan when auto:false', () => {
            const data = bindx({ value: 'test' });
            container.innerHTML = '<span bx-bind="value"></span>';

            const api = init(data, { auto: false, observe: false });
            const span = container.querySelector('span');

            // Should be empty since no auto-scan happened
            expect(span.textContent).toBe('');
        });

        it('should support manual scan via API', () => {
            const data = bindx({ value: 'manual' });
            container.innerHTML = '<span bx-bind="value"></span>';

            const api = init(data, { auto: false, observe: false });
            api.scan(container);

            const span = container.querySelector('span');
            expect(span.textContent).toBe('manual');
        });
    });

    describe('Integration Tests', () => {
        it('should bind and update multiple elements with same path', (done) => {
            const data = bindx({ counter: 1 });

            container.innerHTML = `
                <span bx-bind="counter"></span>
                <span bx-bind="counter"></span>
                <input bx-model="counter" type="number">
            `;

            scan(container, data);

            const spans = container.querySelectorAll('span');
            const input = container.querySelector('input');

            // Bindings set initial values synchronously
            expect(spans[0].textContent).toBe('1');
            expect(spans[1].textContent).toBe('1');
            expect(input.value).toBe('1');

            data.counter = 5;

            // Updates are batched in RAF
            requestAnimationFrame(() => {
                expect(spans[0].textContent).toBe('5');
                expect(spans[1].textContent).toBe('5');
                expect(input.value).toBe('5');
                done();
            });
        });

        it('should handle debounced inputs from attribute', (done) => {
            const data = bindx({ search: '' });

            container.innerHTML = '<input bx-model="search:300" type="text">';
            scan(container, data);

            const input = container.querySelector('input');

            // Simulate rapid typing
            input.value = 'a';
            input.dispatchEvent(new Event('input'));

            input.value = 'ab';
            input.dispatchEvent(new Event('input'));

            input.value = 'abc';
            input.dispatchEvent(new Event('input'));

            // Data should not update immediately
            expect(data.search).toBe('');

            // After debounce delay
            setTimeout(() => {
                expect(data.search).toBe('abc');
                done();
            }, 350);
        });
    });
});
