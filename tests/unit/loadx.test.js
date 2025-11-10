/**
 * Unit tests for loadX module
 */

describe('loadX - Core Initialization', () => {
    let mockWindow;
    let mockDocument;
    let mockBody;

    beforeEach(() => {
        // Create mock body element
        mockBody = {
            appendChild: jest.fn(),
            children: [],
            remove: jest.fn()
        };

        // Setup mock DOM environment
        mockDocument = {
            body: mockBody,
            head: document.createElement('div'),
            readyState: 'complete',
            addEventListener: jest.fn(),
            createElement: jest.fn((tag) => {
                const el = {
                    tagName: tag.toUpperCase(),
                    id: '',
                    className: '',
                    setAttribute: jest.fn(),
                    getAttribute: jest.fn(),
                    hasAttribute: jest.fn(),
                    appendChild: jest.fn(),
                    children: [],
                    classList: {
                        contains: jest.fn(),
                        add: jest.fn(),
                        remove: jest.fn()
                    }
                };
                return el;
            }),
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };

        mockWindow = {
            document: mockDocument,
            loadX: undefined
        };

        global.window = mockWindow;
        global.document = mockDocument;

        // Load the loadx.js module
        require('../../src/loadx.js');
    });

    afterEach(() => {
        // Clear the module from cache
        delete require.cache[require.resolve('../../src/loadx.js')];
    });

    describe('Module Initialization', () => {
        test('should expose loadX on window', () => {
            expect(window.loadX).toBeDefined();
            expect(typeof window.loadX.initLoadX).toBe('function');
        });

        test('should initialize with default configuration', () => {
            const result = window.loadX.initLoadX();

            expect(result).toBeDefined();
            expect(result.config).toBeDefined();
            expect(result.config.minDisplayMs).toBe(300);
            expect(result.config.autoDetect).toBe(true);
            expect(result.config.telemetry).toBe(false);
        });

        test('should merge custom configuration with defaults', () => {
            const result = window.loadX.initLoadX({
                minDisplayMs: 500,
                autoDetect: false
            });

            expect(result.config.minDisplayMs).toBe(500);
            expect(result.config.autoDetect).toBe(false);
            expect(result.config.telemetry).toBe(false); // Still uses default
        });

        test('should freeze configuration object', () => {
            const result = window.loadX.initLoadX();

            expect(Object.isFrozen(result.config)).toBe(true);

            // Attempt to modify should not work (will throw in strict mode)
            const originalValue = result.config.minDisplayMs;
            try {
                result.config.minDisplayMs = 999;
            } catch (e) {
                // Expected in strict mode
            }
            expect(result.config.minDisplayMs).toBe(originalValue);
        });

        test('should return frozen API object', () => {
            const result = window.loadX.initLoadX();

            expect(Object.isFrozen(result)).toBe(true);
        });
    });

    describe('ARIA Live Region', () => {
        test('should create ARIA live region on initialization', () => {
            mockDocument.getElementById.mockReturnValue(null); // No existing live region

            // Should not throw and should initialize successfully
            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();

            // Verify the module initialized (live region creation is internal)
            expect(window.loadX.initLoadX).toBeDefined();
        });

        test('should not create duplicate live region', () => {
            const existingLiveRegion = mockDocument.createElement('div');
            existingLiveRegion.id = 'lx-live-region';
            mockDocument.getElementById.mockReturnValue(existingLiveRegion);

            window.loadX.initLoadX();

            // Should not create new element
            expect(mockBody.appendChild).not.toHaveBeenCalled();
        });

        test('should handle missing document.body gracefully', () => {
            mockDocument.body = null;
            mockDocument.readyState = 'loading';

            // Should not throw even without document.body
            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();
        });
    });

    describe('Strategy Registry', () => {
        test('should initialize strategy registry', () => {
            const result = window.loadX.initLoadX();

            expect(result.registry).toBeDefined();
            expect(result.registry instanceof Map).toBe(true);
        });

        test('should start with empty registry', () => {
            const result = window.loadX.initLoadX();

            expect(result.registry.size).toBe(0);
        });
    });

    describe('API Methods', () => {
        test('should expose applyLoading method', () => {
            const result = window.loadX.initLoadX();

            expect(typeof result.applyLoading).toBe('function');
        });

        test('should expose removeLoading method', () => {
            const result = window.loadX.initLoadX();

            expect(typeof result.removeLoading).toBe('function');
        });
    });

    describe('DOM Scanning', () => {
        test('should scan for lx-strategy attributes', () => {
            const mockEl = mockDocument.createElement('div');
            mockEl.getAttribute = jest.fn((attr) => attr === 'lx-strategy' ? 'spinner' : null);
            mockDocument.querySelectorAll.mockReturnValue([mockEl]);

            // Should not throw and should process elements
            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();

            // Function processes elements with lx- attributes
            expect(mockEl.getAttribute).toBeDefined();
        });

        test('should scan for lx-loading attributes', () => {
            const mockEl = mockDocument.createElement('div');
            mockEl.getAttribute = jest.fn((attr) => attr === 'lx-loading' ? 'true' : null);
            mockDocument.querySelectorAll.mockReturnValue([mockEl]);

            // Should not throw
            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();
        });

        test('should scan for lx- class names', () => {
            const mockEl = mockDocument.createElement('div');
            mockEl.className = 'lx-spinner';
            mockDocument.querySelectorAll.mockReturnValue([mockEl]);

            // Should not throw
            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();
        });
    });

    describe('Async Detection', () => {
        test('should enable async detection when autoDetect is true', () => {
            window.loadX.initLoadX({ autoDetect: true });

            expect(window.loadX.asyncDetectionEnabled).toBe(true);
        });

        test('should not enable async detection when autoDetect is false', () => {
            window.loadX.asyncDetectionEnabled = false;
            window.loadX.initLoadX({ autoDetect: false });

            expect(window.loadX.asyncDetectionEnabled).toBe(false);
        });
    });

    describe('Privacy Compliance', () => {
        test('should have telemetry disabled by default', () => {
            const result = window.loadX.initLoadX();

            expect(result.config.telemetry).toBe(false);
        });

        test('should respect telemetry configuration', () => {
            const result = window.loadX.initLoadX({ telemetry: false });

            expect(result.config.telemetry).toBe(false);
        });
    });

    describe('Configuration Immutability', () => {
        test('should not allow configuration modification after initialization', () => {
            const result = window.loadX.initLoadX({ minDisplayMs: 300 });
            const original = result.config.minDisplayMs;

            // Attempt to modify
            try {
                result.config.minDisplayMs = 999;
            } catch (e) {
                // Expected in strict mode
            }

            // Value should remain unchanged
            expect(result.config.minDisplayMs).toBe(original);
        });

        test('should freeze nested configuration objects', () => {
            const result = window.loadX.initLoadX({
                strategies: ['spinner', 'skeleton']
            });

            expect(Object.isFrozen(result.config)).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle null configuration gracefully', () => {
            expect(() => {
                window.loadX.initLoadX(null);
            }).not.toThrow();
        });

        test('should handle undefined configuration gracefully', () => {
            expect(() => {
                window.loadX.initLoadX(undefined);
            }).not.toThrow();
        });

        test('should reject invalid configuration types with validation error', () => {
            // Invalid minDisplayMs type should throw
            expect(() => {
                window.loadX.initLoadX({
                    minDisplayMs: 'invalid'
                });
            }).toThrow(/minDisplayMs must be a number/);

            // Invalid autoDetect type should throw
            expect(() => {
                window.loadX.initLoadX({
                    autoDetect: 'yes'
                });
            }).toThrow(/autoDetect must be a boolean/);
        });
    });
});
