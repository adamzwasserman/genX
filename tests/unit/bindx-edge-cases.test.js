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
        it('should handle errors in batch update handlers', (done) => {
            const data = bindX.reactive({ value: 'initial' });

            // Create a binding that will throw an error
            const errorElement = document.createElement('div');
            errorElement.id = 'error-element';
            errorElement.setAttribute('bx-bind', 'value');
            container.appendChild(errorElement);

            // Override the update handler to throw an error
            const originalTextContent = Object.getOwnPropertyDescriptor(
                HTMLElement.prototype,
                'textContent'
            );

            Object.defineProperty(errorElement, 'textContent', {
                set: function() {
                    throw new Error('Update failed');
                },
                configurable: true
            });

            // Initialize binding
            bindX.scan(container, data);

            // Trigger batch update that will fail
            data.value = 'new value';

            setTimeout(() => {
                // Error should be logged
                expect(console.error).toHaveBeenCalledWith(
                    expect.stringContaining('Batch update failed'),
                    expect.any(Error)
                );

                // Restore original property
                if (originalTextContent) {
                    Object.defineProperty(
                        errorElement,
                        'textContent',
                        originalTextContent
                    );
                }

                done();
            }, 100);
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

    describe('Mutation Observer - Auto Watch', () => {
        it('should detect and bind dynamically added elements', (done) => {
            const data = bindX.reactive({ message: 'dynamic' });

            // Start auto-watching
            const watcher = bindX.autoWatch(data);

            // Add element after initialization
            const newElement = document.createElement('div');
            newElement.setAttribute('bx-bind', 'message');
            container.appendChild(newElement);

            // Wait for mutation observer and throttle
            setTimeout(() => {
                expect(newElement.textContent).toBe('dynamic');
                watcher.stop();
                done();
            }, 150);
        });

        it('should detect attribute changes on existing elements', (done) => {
            const data = bindX.reactive({ value: 'test' });

            const element = document.createElement('div');
            container.appendChild(element);

            const watcher = bindX.autoWatch(data);

            // Add bx-bind attribute dynamically
            element.setAttribute('bx-bind', 'value');

            setTimeout(() => {
                expect(element.textContent).toBe('test');
                watcher.stop();
                done();
            }, 150);
        });

        it('should throttle multiple rapid changes', (done) => {
            const data = bindX.reactive({ count: 0 });
            let scanCount = 0;

            // Spy on scan function
            const originalScan = bindX.scan;
            bindX.scan = jest.fn((...args) => {
                scanCount++;
                return originalScan(...args);
            });

            const watcher = bindX.autoWatch(data, { throttle: 100 });

            // Add multiple elements rapidly
            for (let i = 0; i < 5; i++) {
                const el = document.createElement('div');
                el.setAttribute('bx-bind', 'count');
                container.appendChild(el);
            }

            // Should only scan once due to throttling
            setTimeout(() => {
                // Should have scanned at most 2 times (initial + one throttled batch)
                expect(scanCount).toBeLessThanOrEqual(2);

                bindX.scan = originalScan;
                watcher.stop();
                done();
            }, 200);
        });

        it('should clear timeout on stop', (done) => {
            const data = bindX.reactive({ value: 'test' });
            const watcher = bindX.autoWatch(data, { throttle: 200 });

            // Add element
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'value');
            container.appendChild(el);

            // Stop immediately before throttle completes
            setTimeout(() => {
                watcher.stop();

                // Element should not be bound since we stopped before throttle
                expect(el.textContent).toBe('');
                done();
            }, 50);
        });

        it('should only watch elements with bx- prefix attributes', (done) => {
            const data = bindX.reactive({ value: 'test' });
            const watcher = bindX.autoWatch(data);

            let scanned = false;
            const originalScan = bindX.scan;
            bindX.scan = jest.fn((...args) => {
                scanned = true;
                return originalScan(...args);
            });

            // Add element without bx- attributes
            const el = document.createElement('div');
            el.setAttribute('data-test', 'value');
            container.appendChild(el);

            setTimeout(() => {
                // Should not have triggered rescan
                expect(scanned).toBe(false);

                bindX.scan = originalScan;
                watcher.stop();
                done();
            }, 150);
        });

        it('should support custom prefix option', (done) => {
            const data = bindX.reactive({ message: 'custom' });
            const watcher = bindX.autoWatch(data, { prefix: 'data-bind-' });

            const el = document.createElement('div');
            el.setAttribute('data-bind-bind', 'message');
            container.appendChild(el);

            setTimeout(() => {
                expect(el.textContent).toBe('custom');
                watcher.stop();
                done();
            }, 150);
        });
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
            expect(el.textContent).toBe('');
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
        it('should cleanup bindings when element is removed', () => {
            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('input');
            el.setAttribute('bx-model', 'value');
            container.appendChild(el);

            bindX.scan(container, data);

            // Verify binding works
            el.value = 'changed';
            el.dispatchEvent(new Event('input'));
            expect(data.value).toBe('changed');

            // Remove element
            container.removeChild(el);

            // Try to update - should not affect removed element
            data.value = 'new value';

            // Element should not update since it's removed
            expect(el.value).toBe('changed');
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

        it('should not batch if RAF is not available', () => {
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = undefined;

            const data = bindX.reactive({ value: 'test' });
            const el = document.createElement('div');
            el.setAttribute('bx-bind', 'value');
            container.appendChild(el);

            // Should still work without RAF
            expect(() => {
                bindX.scan(container, data);
                data.value = 'updated';
            }).not.toThrow();

            window.requestAnimationFrame = originalRAF;
        });
    });

    describe('Special Input Types', () => {
        it('should handle radio button groups correctly', (done) => {
            const data = bindX.reactive({ choice: 'b' });

            const radio1 = document.createElement('input');
            radio1.type = 'radio';
            radio1.name = 'choice';
            radio1.value = 'a';
            radio1.setAttribute('bx-model', 'choice');

            const radio2 = document.createElement('input');
            radio2.type = 'radio';
            radio2.name = 'choice';
            radio2.value = 'b';
            radio2.setAttribute('bx-model', 'choice');

            container.appendChild(radio1);
            container.appendChild(radio2);

            bindX.scan(container, data);

            // Wait for RAF to complete DOM updates
            setTimeout(() => {
                expect(radio1.checked).toBe(false);
                expect(radio2.checked).toBe(true);

                // Change selection
                radio1.checked = true;
                radio1.dispatchEvent(new Event('change'));

                expect(data.choice).toBe('a');
                done();
            }, 50);
        });

        it('should handle number input type coercion', (done) => {
            const data = bindX.reactive({ age: 25 });
            const input = document.createElement('input');
            input.type = 'number';
            input.setAttribute('bx-model', 'age');
            container.appendChild(input);

            bindX.scan(container, data);

            setTimeout(() => {
                expect(input.value).toBe('25');

                // Enter string that should be coerced to number
                input.value = '30';
                input.dispatchEvent(new Event('input'));

                expect(data.age).toBe(30);
                expect(typeof data.age).toBe('number');
                done();
            }, 50);
        });

        it('should handle checkbox boolean binding', (done) => {
            const data = bindX.reactive({ agree: false });

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.setAttribute('bx-model', 'agree');
            container.appendChild(checkbox);

            bindX.scan(container, data);

            setTimeout(() => {
                expect(checkbox.checked).toBe(false);

                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));

                expect(data.agree).toBe(true);
                done();
            }, 50);
        });
    });
});
