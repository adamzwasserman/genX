/**
 * bindX Edge Cases and Error Handling Tests
 * Focuses on uncovered error paths, edge cases, and MutationObserver
 */

describe('bindX Edge Cases and Error Handling', () => {
    let bindX;
    let container;

    beforeEach(() => {
        // Setup requestAnimationFrame polyfill for JSDOM
        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        global.cancelAnimationFrame = clearTimeout;

        // Clear DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // Clear module cache and reload
        jest.resetModules();
        delete require.cache[require.resolve('../../src/bindx.js')];
        bindX = require('../../src/bindx.js');

        // Spy on console methods
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Batch Update Error Handling', () => {
        it('should handle errors during binding creation', () => {
            const data = bindX.reactive({ value: 'initial' });

            // Create a binding that will throw an error during scan
            const errorElement = document.createElement('div');
            errorElement.id = 'error-element';
            errorElement.setAttribute('bx-bind', 'value');
            container.appendChild(errorElement);

            // Override the textContent to throw during scan
            Object.defineProperty(errorElement, 'textContent', {
                set: function() {
                    throw new Error('Update failed');
                },
                configurable: true
            });

            // scan() should handle the error gracefully
            expect(() => {
                bindX.scan(container, data);
            }).not.toThrow();

            // Error should be logged
            expect(console.error).toHaveBeenCalled();
        });

        it('should continue processing other updates after one fails', (done) => {
            const data = bindX.reactive({ value1: 'a', value2: 'b' });

            // Element that will fail
            const errorElement = document.createElement('div');
            errorElement.setAttribute('bx-bind', 'value1');
            container.appendChild(errorElement);

            // Element that should succeed
            const successElement = document.createElement('div');
            successElement.setAttribute('bx-bind', 'value2');
            container.appendChild(successElement);

            // Make errorElement throw
            Object.defineProperty(errorElement, 'textContent', {
                set: function() {
                    throw new Error('Update failed');
                },
                configurable: true
            });

            bindX.scan(container, data);

            data.value1 = 'fail';
            data.value2 = 'success';

            setTimeout(() => {
                // Second element should still update
                expect(successElement.textContent).toBe('success');
                expect(console.error).toHaveBeenCalled();
                done();
            }, 100);
        });
    });

    describe.skip('Mutation Observer - Auto Watch (Not Implemented)', () => {
        // These tests are for future autoWatch() feature
        // Skipped until feature is implemented
    });

    describe('Null and Undefined Handling', () => {
        it('should handle null data gracefully', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'value');
            container.appendChild(input);

            expect(() => {
                bindX.scan(container, null);
            }).not.toThrow();
        });

        it('should handle undefined data gracefully', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'value');
            container.appendChild(input);

            expect(() => {
                bindX.scan(container, undefined);
            }).not.toThrow();
        });

        it('should handle null element in scan', () => {
            const data = bindX.reactive({ value: 'test' });

            expect(() => {
                bindX.scan(null, data);
            }).not.toThrow();
        });

        it('should handle undefined element in scan', () => {
            const data = bindX.reactive({ value: 'test' });

            expect(() => {
                bindX.scan(undefined, data);
            }).not.toThrow();
        });

        it('should handle null values in reactive data', () => {
            const data = bindX.reactive({ value: null });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'value');
            container.appendChild(el);

            bindX.scan(container, data);
            // bindX converts null to string "null" via String(null)
            expect(el.textContent).toBe('null');
        });

        it('should handle undefined values in reactive data', () => {
            const data = bindX.reactive({ value: undefined });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'value');
            container.appendChild(el);

            bindX.scan(container, data);
            expect(el.textContent).toBe('');
        });
    });

    describe('Invalid Expressions', () => {
        it('should handle empty binding expression', () => {
            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', '');
            container.appendChild(el);

            expect(() => {
                bindX.scan(container, data);
            }).not.toThrow();
        });

        it('should handle whitespace-only binding expression', () => {
            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', '   ');
            container.appendChild(el);

            expect(() => {
                bindX.scan(container, data);
            }).not.toThrow();
        });

        it('should handle invalid property path', () => {
            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'nonexistent.deeply.nested.path');
            container.appendChild(el);

            expect(() => {
                bindX.scan(container, data);
            }).not.toThrow();

            // Should set empty text for nonexistent path
            expect(el.textContent).toBe('');
        });

        it('should handle special characters in binding expression', () => {
            const data = bindX.reactive({ 'value!@#': 'test' });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'value!@#');
            container.appendChild(el);

            expect(() => {
                bindX.scan(container, data);
            }).not.toThrow();
        });
    });

    describe('Circular References', () => {
        it('should handle circular object references', () => {
            const obj = { value: 'test' };
            obj.self = obj;

            expect(() => {
                const data = bindX.reactive(obj);
                const el = document.createElement('div');
                el.setAttribute('bx-bind', 'value');
                container.appendChild(el);
                bindX.scan(container, data);
            }).not.toThrow();
        });

        it('should handle deeply nested circular references', () => {
            const obj = {
                level1: {
                    level2: {
                        value: 'deep'
                    }
                }
            };
            obj.level1.level2.circular = obj;

            expect(() => {
                const data = bindX.reactive(obj);
                const el = document.createElement('div');
                el.setAttribute('bx-bind', 'level1.level2.value');
                container.appendChild(el);
                bindX.scan(container, data);
                expect(el.textContent).toBe('deep');
            }).not.toThrow();
        });
    });

    describe('WeakMap Cleanup', () => {
        it('should maintain bindings after element removal from DOM', () => {
            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('input');
            el.setAttribute('bx-model', 'value');
            container.appendChild(el);

            bindX.scan(container, data);

            // Verify binding works
            el.value = 'changed';
            el.dispatchEvent(new Event('input'));
            expect(data.value).toBe('changed');

            // Remove element from DOM
            container.removeChild(el);

            // WeakMap cleanup happens during GC, not immediately
            // Bindings remain active even after DOM removal
            data.value = 'new value';

            // Element still updates because binding is in memory
            expect(el.value).toBe('new value');
        });

        it('should not leak memory on repeated scan', () => {
            const data = bindX.reactive({ value: 'test' });

            // Create and scan many elements
            for (let i = 0; i < 100; i++) {
                const el = document.createElement('div');
                el.setAttribute('bx-bind', 'value');
                container.appendChild(el);
                bindX.scan(container, data);
                container.removeChild(el);
            }

            // If WeakMap cleanup works, this should not cause issues
            expect(() => {
                data.value = 'updated';
            }).not.toThrow();
        });
    });

    describe('RAF Batching Edge Cases', () => {
        it('should batch multiple synchronous updates', (done) => {
            const data = bindX.reactive({ count: 0 });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'count');
            container.appendChild(el);

            bindX.scan(container, data);

            let updateCount = 0;
            const observer = new MutationObserver(() => {
                updateCount++;
            });
            observer.observe(el, { characterData: true, childList: true, subtree: true });

            // Multiple synchronous updates
            data.count = 1;
            data.count = 2;
            data.count = 3;

            setTimeout(() => {
                // Should only trigger one DOM update due to batching
                expect(updateCount).toBeLessThanOrEqual(1);
                expect(el.textContent).toBe('3');
                observer.disconnect();
                done();
            }, 100);
        });

        it('should handle rapid updates via batching', (done) => {
            const data = bindX.reactive({ count: 0 });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'count');
            container.appendChild(el);

            bindX.scan(container, data);

            // Rapid updates
            for (let i = 1; i <= 10; i++) {
                data.count = i;
            }

            // Final value should be 10 after batching
            setTimeout(() => {
                expect(el.textContent).toBe('10');
                done();
            }, 100);
        });
    });

    describe('Special Input Types', () => {
        it('should handle text input bindings', (done) => {
            const data = bindX.reactive({ name: 'John' });
            const input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('bx-model', 'name');
            container.appendChild(input);

            bindX.scan(container, data);

            setTimeout(() => {
                expect(input.value).toBe('John');

                // Change value
                input.value = 'Jane';
                input.dispatchEvent(new Event('input'));

                expect(data.name).toBe('Jane');
                done();
            }, 50);
        });

        it('should handle empty input values', (done) => {
            const data = bindX.reactive({ value: '' });
            const input = document.createElement('input');
            input.setAttribute('bx-model', 'value');
            container.appendChild(input);

            bindX.scan(container, data);

            setTimeout(() => {
                expect(input.value).toBe('');

                input.value = 'test';
                input.dispatchEvent(new Event('input'));

                expect(data.value).toBe('test');
                done();
            }, 50);
        });
    });
});
