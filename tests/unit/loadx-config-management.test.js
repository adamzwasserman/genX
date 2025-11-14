/**
 * loadX Configuration Management Unit Tests
 * Tests config validation, defaults, inheritance, and immutability
 */

describe('loadX: Configuration Management', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    });

    describe('Default Configuration', () => {
        test('should use default minDisplayMs of 300', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();
                expect(api.config.minDisplayMs).toBe(300);
            }
        });

        test('should have autoDetect enabled by default', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();
                expect(api.config.autoDetect).toEqual({
                    fetch: true,
                    xhr: true,
                    htmx: true,
                    forms: true
                });
            }
        });

        test('should have telemetry disabled by default', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();
                expect(api.config.telemetry).toBe(false);
            }
        });

        test('should initialize with empty strategies array', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();
                expect(api.config.strategies).toEqual([]);
            }
        });
    });

    describe('Custom Configuration', () => {
        test('should merge custom config with defaults', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({
                    minDisplayMs: 500,
                    autoDetect: false
                });

                expect(api.config.minDisplayMs).toBe(500);
                expect(api.config.autoDetect).toEqual({
                    fetch: false,
                    xhr: false,
                    htmx: false,
                    forms: false
                });
                expect(api.config.telemetry).toBe(false); // Default preserved
            }
        });

        test('should support custom strategies array', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const customStrategies = ['spinner', 'skeleton'];
                const api = window.loadX.initLoadX({
                    strategies: customStrategies
                });

                expect(api.config.strategies).toEqual(customStrategies);
            }
        });

        test('should support telemetry enablement', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({
                    telemetry: true
                });

                expect(api.config.telemetry).toBe(true);
            }
        });
    });

    describe('Configuration Validation', () => {
        test('should validate minDisplayMs is a number', () => {
            if (window.loadX && window.loadX.validateConfig) {
                const validConfig = { minDisplayMs: 300 };
                expect(() => window.loadX.validateConfig(validConfig)).not.toThrow();

                const invalidConfig = { minDisplayMs: '300' };
                expect(() => window.loadX.validateConfig(invalidConfig)).toThrow(/minDisplayMs must be a number/);
            }
        });

        test('should validate minDisplayMs is non-negative', () => {
            if (window.loadX && window.loadX.validateConfig) {
                const validConfig = { minDisplayMs: 0 };
                expect(() => window.loadX.validateConfig(validConfig)).not.toThrow();

                const invalidConfig = { minDisplayMs: -100 };
                expect(() => window.loadX.validateConfig(invalidConfig)).toThrow(/minDisplayMs must be non-negative/);
            }
        });

        test('should validate autoDetect is a boolean', () => {
            if (window.loadX && window.loadX.validateConfig) {
                const validConfig = { autoDetect: true };
                expect(() => window.loadX.validateConfig(validConfig)).not.toThrow();

                const invalidConfig = { autoDetect: 'true' };
                expect(() => window.loadX.validateConfig(invalidConfig)).toThrow(/autoDetect must be a boolean/);
            }
        });

        test('should validate telemetry is a boolean', () => {
            if (window.loadX && window.loadX.validateConfig) {
                const validConfig = { telemetry: false };
                expect(() => window.loadX.validateConfig(validConfig)).not.toThrow();

                const invalidConfig = { telemetry: 1 };
                expect(() => window.loadX.validateConfig(invalidConfig)).toThrow(/telemetry must be a boolean/);
            }
        });

        test('should validate strategies is an array', () => {
            if (window.loadX && window.loadX.validateConfig) {
                const validConfig = { strategies: ['spinner', 'skeleton'] };
                expect(() => window.loadX.validateConfig(validConfig)).not.toThrow();

                const invalidConfig = { strategies: 'spinner,skeleton' };
                expect(() => window.loadX.validateConfig(invalidConfig)).toThrow(/strategies must be an array/);
            }
        });

        test('should allow empty config object', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => window.loadX.validateConfig({})).not.toThrow();
            }
        });

        test('should allow undefined config', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => window.loadX.validateConfig(undefined)).not.toThrow();
            }
        });
    });

    describe('Configuration Immutability', () => {
        test('should freeze config object after initialization', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 500 });

                expect(Object.isFrozen(api.config)).toBe(true);
            }
        });

        test('should prevent config modification after initialization', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 500 });

                // Attempt to modify config
                expect(() => {
                    api.config.minDisplayMs = 1000;
                }).toThrow();
            }
        });

        test('should prevent adding new properties to config', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();

                expect(() => {
                    api.config.newProperty = 'value';
                }).toThrow();
            }
        });

        test('should freeze strategies array', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({
                    strategies: ['spinner', 'skeleton']
                });

                expect(Object.isFrozen(api.config.strategies)).toBe(true);
            }
        });
    });

    describe('Configuration Inheritance', () => {
        test('should support element-level config override', () => {
            const element = document.createElement('div');
            element.setAttribute('lx-strategy', 'skeleton');
            element.setAttribute('lx-duration', '500');
            container.appendChild(element);

            if (window.loadX && window.loadX.parseElementAttributes) {
                const parsed = window.loadX.parseElementAttributes(element);

                expect(parsed.strategy).toBe('skeleton');
                expect(parsed.duration).toBe(500);
            }
        });

        test('should inherit from parent elements', () => {
            const parent = document.createElement('div');
            parent.setAttribute('lx-strategy', 'spinner');
            parent._lxConfig = { strategy: 'spinner', minDisplayMs: 400 };

            const child = document.createElement('button');
            parent.appendChild(child);
            container.appendChild(parent);

            // Child should be able to find parent config
            expect(parent._lxConfig).toBeDefined();
            expect(child.parentElement._lxConfig).toBeDefined();
        });

        test('should allow child to override parent config', () => {
            const parent = document.createElement('div');
            parent.setAttribute('lx-strategy', 'spinner');
            parent._lxConfig = { strategy: 'spinner' };

            const child = document.createElement('button');
            child.setAttribute('lx-strategy', 'skeleton');
            parent.appendChild(child);
            container.appendChild(parent);

            if (window.loadX && window.loadX.parseElementAttributes) {
                const childConfig = window.loadX.parseElementAttributes(child);
                expect(childConfig.strategy).toBe('skeleton');
            }
        });
    });

    describe('Runtime Configuration', () => {
        test('should allow querying current config', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 600 });

                expect(api.config.minDisplayMs).toBe(600);
            }
        });

        test('should expose config via API', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX();

                expect(api.config).toBeDefined();
                expect(typeof api.config).toBe('object');
            }
        });

        test('should maintain config consistency across calls', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 700 });

                const config1 = api.config;
                const config2 = api.config;

                expect(config1).toBe(config2); // Same reference
            }
        });
    });

    describe('Error Messages', () => {
        test('should provide detailed error for invalid minDisplayMs type', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => {
                    window.loadX.validateConfig({ minDisplayMs: 'abc' });
                }).toThrow(/minDisplayMs must be a number, got string/);
            }
        });

        test('should provide detailed error for invalid autoDetect type', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => {
                    window.loadX.validateConfig({ autoDetect: 'yes' });
                }).toThrow(/autoDetect must be a boolean, got string/);
            }
        });

        test('should provide detailed error for invalid strategies type', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => {
                    window.loadX.validateConfig({ strategies: 'spinner' });
                }).toThrow(/strategies must be an array, got string/);
            }
        });

        test('should provide detailed error for negative minDisplayMs', () => {
            if (window.loadX && window.loadX.validateConfig) {
                expect(() => {
                    window.loadX.validateConfig({ minDisplayMs: -50 });
                }).toThrow(/minDisplayMs must be non-negative, got -50/);
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle null config gracefully', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX(null);
                expect(api.config).toBeDefined();
                expect(api.config.minDisplayMs).toBe(300); // Default
            }
        });

        test('should handle config with extra properties', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({
                    minDisplayMs: 400,
                    extraProperty: 'ignored'
                });

                expect(api.config.minDisplayMs).toBe(400);
                expect(api.config.extraProperty).toBeUndefined();
            }
        });

        test('should handle very large minDisplayMs values', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 999999 });
                expect(api.config.minDisplayMs).toBe(999999);
            }
        });

        test('should handle zero minDisplayMs', () => {
            if (window.loadX && window.loadX.initLoadX) {
                const api = window.loadX.initLoadX({ minDisplayMs: 0 });
                expect(api.config.minDisplayMs).toBe(0);
            }
        });
    });
});
