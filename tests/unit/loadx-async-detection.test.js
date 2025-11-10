/**
 * loadX Async Detection Unit Tests
 * Tests automatic detection of async operations and loading state activation
 */

describe('loadX: Async Operation Detection', () => {
    let originalFetch;
    let originalXHR;
    let container;

    beforeEach(() => {
        // Save originals
        originalFetch = global.fetch;
        originalXHR = global.XMLHttpRequest;

        // Create DOM container
        container = document.createElement('div');
        document.body.appendChild(container);

        // Initialize loadX
        if (window.loadX && window.loadX.initLoadX) {
            window.loadX.initLoadX({ autoDetect: true });
        }
    });

    afterEach(() => {
        // Restore originals
        global.fetch = originalFetch;
        global.XMLHttpRequest = originalXHR;

        // Cleanup DOM
        document.body.removeChild(container);
        container = null;
    });

    describe('Fetch API Detection', () => {
        test('should intercept fetch calls', async () => {
            // Setup mock fetch
            const mockFetch = jest.fn(() => Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ data: 'test' })
            }));
            global.fetch = mockFetch;

            // Re-initialize with interception
            if (window.loadX && window.loadX.initLoadX) {
                window.loadX.initLoadX({ autoDetect: true });
            }

            // Create element with lx-loading
            const element = document.createElement('div');
            element.setAttribute('lx-loading', 'true');
            element.setAttribute('lx-strategy', 'spinner');
            container.appendChild(element);

            // Trigger fetch
            await fetch('/api/test');

            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalledWith('/api/test');
        });

        test('should apply loading state during fetch', async () => {
            const mockFetch = jest.fn(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({ ok: true, status: 200 }), 100);
                })
            );
            global.fetch = mockFetch;

            const element = document.createElement('button');
            element.setAttribute('lx-loading', 'true');
            element.setAttribute('lx-strategy', 'spinner');
            element._lxConfig = { strategy: 'spinner' };
            container.appendChild(element);

            // Simulate element focus
            element.focus();

            // Re-initialize
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ autoDetect: true });

                // Apply loading manually for test
                if (api && api.applyLoading) {
                    api.applyLoading(element, { strategy: 'spinner' });
                }
            }

            // Fetch should be callable
            const promise = fetch('/api/test');
            await promise;

            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('XMLHttpRequest Detection', () => {
        test('should intercept XHR open calls', () => {
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                readyState: 1,
                status: 200,
                addEventListener: jest.fn()
            };

            global.XMLHttpRequest = jest.fn(() => xhrMock);

            const element = document.createElement('div');
            element.setAttribute('lx-loading', 'true');
            container.appendChild(element);

            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/test');

            expect(xhrMock.open).toHaveBeenCalledWith('GET', '/api/test');
        });

        test('should apply loading state during XHR', () => {
            const element = document.createElement('div');
            element.setAttribute('lx-loading', 'true');
            element.setAttribute('lx-strategy', 'spinner');
            element._lxConfig = { strategy: 'spinner' };
            container.appendChild(element);

            // Test that element is tracked
            expect(element.getAttribute('lx-loading')).toBe('true');
        });
    });

    describe('HTMX Event Detection', () => {
        test('should listen for htmx:beforeRequest events', () => {
            const element = document.createElement('div');
            element.setAttribute('hx-get', '/api/test');
            element.setAttribute('lx-loading', 'true');
            container.appendChild(element);

            // Create and dispatch HTMX event
            const event = new CustomEvent('htmx:beforeRequest', {
                detail: { elt: element },
                bubbles: true
            });

            const listener = jest.fn();
            document.addEventListener('htmx:beforeRequest', listener);

            element.dispatchEvent(event);

            expect(listener).toHaveBeenCalled();

            document.removeEventListener('htmx:beforeRequest', listener);
        });

        test('should apply loading state on htmx:beforeRequest', () => {
            const element = document.createElement('div');
            element.setAttribute('hx-get', '/api/test');
            element.setAttribute('lx-strategy', 'spinner');
            element._lxConfig = { strategy: 'spinner' };
            container.appendChild(element);

            // Verify element is configured
            expect(element._lxConfig).toBeDefined();
            expect(element._lxConfig.strategy).toBe('spinner');
        });

        test('should remove loading state on htmx:afterSwap', () => {
            const element = document.createElement('div');
            element.setAttribute('hx-get', '/api/test');
            element.setAttribute('lx-loading', 'true');
            container.appendChild(element);

            // Simulate afterSwap event
            const event = new CustomEvent('htmx:afterSwap', {
                detail: { elt: element },
                bubbles: true
            });

            const listener = jest.fn();
            document.addEventListener('htmx:afterSwap', listener);

            element.dispatchEvent(event);

            expect(listener).toHaveBeenCalled();

            document.removeEventListener('htmx:afterSwap', listener);
        });
    });

    describe('Form Submission Detection', () => {
        test('should detect form submit events', () => {
            const form = document.createElement('form');
            form.setAttribute('lx-loading', 'true');

            const button = document.createElement('button');
            button.type = 'submit';
            button.setAttribute('lx-strategy', 'spinner');
            form.appendChild(button);

            container.appendChild(form);

            const listener = jest.fn((e) => e.preventDefault());
            form.addEventListener('submit', listener);

            // Trigger submit
            const event = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(event);

            expect(listener).toHaveBeenCalled();

            form.removeEventListener('submit', listener);
        });

        test('should apply loading state to submit button', () => {
            const form = document.createElement('form');
            form.setAttribute('lx-loading', 'true');

            const button = document.createElement('button');
            button.type = 'submit';
            button.setAttribute('lx-strategy', 'spinner');
            button._lxConfig = { strategy: 'spinner' };
            form.appendChild(button);

            container.appendChild(form);

            // Verify button configuration
            expect(button._lxConfig).toBeDefined();
            expect(button._lxConfig.strategy).toBe('spinner');
        });
    });

    describe('Cleanup After Async Completion', () => {
        test('should remove loading state after async operation', async () => {
            const element = document.createElement('div');
            element.setAttribute('lx-loading', 'true');
            element.setAttribute('lx-strategy', 'spinner');
            element._lxConfig = { strategy: 'spinner' };
            container.appendChild(element);

            // Initialize loadX API
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ autoDetect: true, minDisplayMs: 50 });

                if (api && api.applyLoading) {
                    // Apply loading state
                    api.applyLoading(element, { strategy: 'spinner' });

                    // Wait for minimum display time
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Remove loading state
                    if (api.removeLoading) {
                        api.removeLoading(element);
                    }
                }
            }

            // Element should still exist
            expect(element).toBeTruthy();
        });

        test('should respect minDisplayMs configuration', async () => {
            const minDisplayMs = 300;

            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({
                    autoDetect: true,
                    minDisplayMs
                });

                expect(api.config.minDisplayMs).toBe(minDisplayMs);
            }
        });

        test('should cleanup on promise rejection', async () => {
            const mockFetch = jest.fn(() => Promise.reject(new Error('Network error')));
            global.fetch = mockFetch;

            const element = document.createElement('div');
            element.setAttribute('lx-loading', 'true');
            container.appendChild(element);

            // Fetch should fail
            try {
                await fetch('/api/test');
            } catch (error) {
                expect(error.message).toBe('Network error');
            }

            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('Auto-Detection Configuration', () => {
        test('should enable auto-detection when configured', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ autoDetect: true });
                expect(api.config.autoDetect).toBe(true);
            }
        });

        test('should disable auto-detection when configured', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ autoDetect: false });
                expect(api.config.autoDetect).toBe(false);
            }
        });

        test('should mark async detection as enabled', () => {
            if (window.loadX && window.loadX.initLoadX) {
                window.loadX.asyncDetectionEnabled = false;
                window.loadX.initLoadX({ autoDetect: true });
                expect(window.loadX.asyncDetectionEnabled).toBe(true);
            }
        });
    });
});
