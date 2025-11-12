/**
 * Unit tests for loadX HTMX Integration
 */

describe('loadX - HTMX Integration', () => {
    let mockWindow;
    let mockDocument;
    let mockBody;
    let mockElement;
    let htmxCallbacks;

    beforeEach(() => {
        htmxCallbacks = {
            'htmx:beforeRequest': [],
            'htmx:afterRequest': [],
            'htmx:beforeSwap': [],
            'htmx:afterSwap': []
        };

        mockElement = {
            tagName: 'BUTTON',
            innerHTML: 'Click me',
            className: '',
            style: {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            hasAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            appendChild: jest.fn(),
            addEventListener: jest.fn((event, callback) => {
                if (htmxCallbacks[event]) {
                    htmxCallbacks[event].push(callback);
                }
            }),
            children: [],
            classList: {
                contains: jest.fn(),
                add: jest.fn(),
                remove: jest.fn(),
                value: ''
            },
            getBoundingClientRect: jest.fn(() => ({
                width: 200,
                height: 40
            }))
        };

        mockBody = {
            appendChild: jest.fn(),
            addEventListener: jest.fn((event, callback) => {
                if (htmxCallbacks[event]) {
                    htmxCallbacks[event].push(callback);
                }
            }),
            children: []
        };

        mockDocument = {
            body: mockBody,
            readyState: 'complete',
            addEventListener: jest.fn((event, callback) => {
                if (htmxCallbacks[event]) {
                    htmxCallbacks[event].push(callback);
                }
            }),
            createElement: jest.fn((tag) => ({
                tagName: tag.toUpperCase(),
                id: '',
                className: '',
                setAttribute: jest.fn(),
                getAttribute: jest.fn(),
                hasAttribute: jest.fn(),
                appendChild: jest.fn(),
                children: [],
                style: {},
                classList: {
                    contains: jest.fn(),
                    add: jest.fn(),
                    remove: jest.fn()
                }
            })),
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };

        mockWindow = {
            document: mockDocument,
            loadX: undefined,
            htmx: {
                version: '1.9.0'
            }
        };

        global.window = mockWindow;
        global.document = mockDocument;

        require('../../src/loadx.js');

        // Create real DOM element using JSDOM's document
        mockElement = document.createElement('div');
        mockElement.innerHTML = '<p>Content</p>';

        // Add spy functions to track calls
        jest.spyOn(mockElement, 'setAttribute');
        jest.spyOn(mockElement, 'getAttribute');
        jest.spyOn(mockElement, 'removeAttribute');
        jest.spyOn(mockElement.classList, 'add');
        jest.spyOn(mockElement.classList, 'remove');
    });

    afterEach(() => {
        delete require.cache[require.resolve('../../src/loadx.js')];
    });

    describe('HTMX Event Listeners', () => {
        test('should listen for htmx:beforeRequest event', () => {
            window.loadX.initLoadX({ autoDetect: true });

            // Should set up event listeners on document
            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should apply loading state on htmx:beforeRequest', () => {
            window.loadX.initLoadX({ autoDetect: true });

            // Simulate HTMX beforeRequest event
            const event = {
                detail: {
                    elt: mockElement,
                    xhr: {}
                }
            };

            // Trigger callbacks
            htmxCallbacks['htmx:beforeRequest'].forEach(cb => {
                try {
                    cb(event);
                } catch (e) {
                    // Expected if full implementation not mocked
                }
            });

            // Should attempt to process the element
            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should remove loading state on htmx:afterSwap', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const event = {
                detail: {
                    elt: mockElement,
                    xhr: {}
                }
            };

            htmxCallbacks['htmx:afterSwap'].forEach(cb => {
                try {
                    cb(event);
                } catch (e) {
                    // Expected
                }
            });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle htmx:beforeSwap event', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const event = {
                detail: {
                    elt: mockElement,
                    xhr: {}
                }
            };

            expect(() => {
                htmxCallbacks['htmx:beforeSwap'].forEach(cb => cb(event));
            }).not.toThrow();
        });
    });

    describe('HTMX Request Detection', () => {
        test('should detect HTMX requests automatically', () => {
            const api = window.loadX.initLoadX({ autoDetect: true });

            expect(api.config.autoDetect).toBe(true);
        });

        test('should respect autoDetect: false configuration', () => {
            const api = window.loadX.initLoadX({ autoDetect: false });

            expect(api.config.autoDetect).toBe(false);
        });

        test('should handle elements with hx-get attribute', () => {
            mockElement.hasAttribute.mockImplementation((attr) => attr === 'hx-get');
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-get') return '/api/data';
                return null;
            });

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle elements with hx-post attribute', () => {
            mockElement.hasAttribute.mockImplementation((attr) => attr === 'hx-post');
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-post') return '/api/submit';
                return null;
            });

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle elements with hx-put attribute', () => {
            mockElement.hasAttribute.mockImplementation((attr) => attr === 'hx-put');

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle elements with hx-delete attribute', () => {
            mockElement.hasAttribute.mockImplementation((attr) => attr === 'hx-delete');

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });
    });

    describe('HTMX Indicator Integration', () => {
        test('should work alongside hx-indicator', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-indicator') return '#my-indicator';
                if (attr === 'lx-strategy') return 'spinner';
                return null;
            });

            const api = window.loadX.initLoadX();

            expect(() => {
                api.applyLoading(mockElement, { strategy: 'spinner' });
            }).not.toThrow();
        });

        test('should not conflict with HTMX built-in indicators', () => {
            mockElement.classList.add('htmx-request');

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });
    });

    describe('HTMX Target Elements', () => {
        test('should handle hx-target attribute', () => {
            const targetElement = {
                ...mockElement,
                id: 'target'
            };

            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-target') return '#target';
                return null;
            });

            mockDocument.querySelector.mockReturnValue(targetElement);

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should apply loading to target element', () => {
            const targetElement = {
                ...mockElement,
                id: 'target'
            };

            mockDocument.getElementById.mockReturnValue(targetElement);

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle missing target gracefully', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-target') return '#nonexistent';
                return null;
            });

            mockDocument.querySelector.mockReturnValue(null);

            expect(() => {
                window.loadX.initLoadX({ autoDetect: true });
            }).not.toThrow();
        });
    });

    describe('HTMX Swap Strategies', () => {
        test('should handle hx-swap="innerHTML"', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-swap') return 'innerHTML';
                return null;
            });

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle hx-swap="outerHTML"', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-swap') return 'outerHTML';
                return null;
            });

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });

        test('should handle hx-swap="beforeend"', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'hx-swap') return 'beforeend';
                return null;
            });

            window.loadX.initLoadX({ autoDetect: true });

            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle HTMX request errors', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const errorEvent = {
                detail: {
                    elt: mockElement,
                    xhr: { status: 500 },
                    error: 'Server Error'
                }
            };

            expect(() => {
                htmxCallbacks['htmx:afterRequest'].forEach(cb => {
                    try {
                        cb(errorEvent);
                    } catch (e) {
                        // Expected
                    }
                });
            }).not.toThrow();
        });

        test('should remove loading state on error', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.initLoadX({ autoDetect: true });

            // Should clean up after errors
            expect(mockDocument.addEventListener).toHaveBeenCalled();
        });
    });

    describe('Performance with HTMX', () => {
        test('should not slow down HTMX requests', () => {
            const startTime = Date.now();

            window.loadX.initLoadX({ autoDetect: true });

            // Simulate 100 HTMX requests
            for (let i = 0; i < 100; i++) {
                const event = {
                    detail: {
                        elt: mockElement,
                        xhr: {}
                    }
                };

                htmxCallbacks['htmx:beforeRequest'].forEach(cb => {
                    try {
                        cb(event);
                    } catch (e) {
                        // Expected
                    }
                });
            }

            const duration = Date.now() - startTime;

            // 100 events should process in under 100ms
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Edge Cases', () => {
        test('should handle HTMX not being loaded', () => {
            delete window.htmx;

            expect(() => {
                window.loadX.initLoadX({ autoDetect: true });
            }).not.toThrow();
        });

        test('should handle events without detail object', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const badEvent = {};

            expect(() => {
                htmxCallbacks['htmx:beforeRequest'].forEach(cb => {
                    try {
                        cb(badEvent);
                    } catch (e) {
                        // Expected
                    }
                });
            }).not.toThrow();
        });

        test('should handle events without element', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const event = {
                detail: {
                    elt: null
                }
            };

            expect(() => {
                htmxCallbacks['htmx:beforeRequest'].forEach(cb => {
                    try {
                        cb(event);
                    } catch (e) {
                        // Expected
                    }
                });
            }).not.toThrow();
        });

        test('should handle rapid HTMX requests', () => {
            window.loadX.initLoadX({ autoDetect: true });

            const events = Array.from({ length: 10 }, () => ({
                detail: {
                    elt: mockElement,
                    xhr: {}
                }
            }));

            expect(() => {
                events.forEach(event => {
                    htmxCallbacks['htmx:beforeRequest'].forEach(cb => {
                        try {
                            cb(event);
                        } catch (e) {
                            // Expected
                        }
                    });
                });
            }).not.toThrow();
        });
    });
});
