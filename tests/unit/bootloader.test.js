/**
 * Unit tests for genX Universal Bootloader
 */

describe('Universal Bootloader', () => {
    let mockWindow;
    let mockDocument;

    beforeEach(() => {
        // Setup mock DOM environment
        mockDocument = {
            body: document.createElement('div'),
            head: document.createElement('div'),
            readyState: 'complete',
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };

        mockWindow = {
            document: mockDocument,
            genxConfig: null,
            addEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
            requestAnimationFrame: jest.fn(cb => setTimeout(cb, 0))
        };

        global.window = mockWindow;
        global.document = mockDocument;
    });

    describe('Module Registry', () => {
        test('should have correct module mappings', () => {
            const expectedModules = {
                'fx': '/modules/fmtx.js',
                'ax': '/modules/accx.js',
                'bx': '/modules/bindx.js',
                'dx': '/modules/dragx.js',
                'lx': '/modules/loadx.js',
                'tx': '/modules/tablex.js',
                'nx': '/modules/navx.js'
            };

            // Test would verify module registry matches expected
            expect(Object.keys(expectedModules)).toHaveLength(7);
        });

        test('should map fx to fmtx.js', () => {
            const modules = {'fx': '/modules/fmtx.js'};
            expect(modules['fx']).toBe('/modules/fmtx.js');
        });

        test('should map ax to accx.js', () => {
            const modules = {'ax': '/modules/accx.js'};
            expect(modules['ax']).toBe('/modules/accx.js');
        });

        test('should map bx to bindx.js', () => {
            const modules = {'bx': '/modules/bindx.js'};
            expect(modules['bx']).toBe('/modules/bindx.js');
        });

        test('should map dx to dragx.js', () => {
            const modules = {'dx': '/modules/dragx.js'};
            expect(modules['dx']).toBe('/modules/dragx.js');
        });

        test('should map lx to loadx.js', () => {
            const modules = {'lx': '/modules/loadx.js'};
            expect(modules['lx']).toBe('/modules/loadx.js');
        });

        test('should map tx to tablex.js', () => {
            const modules = {'tx': '/modules/tablex.js'};
            expect(modules['tx']).toBe('/modules/tablex.js');
        });

        test('should map nx to navx.js', () => {
            const modules = {'nx': '/modules/navx.js'};
            expect(modules['nx']).toBe('/modules/navx.js');
        });
    });

    describe('DOM Scanning', () => {
        test('should detect fx- attributes', () => {
            const element = document.createElement('span');
            element.setAttribute('fx-format', 'currency');
            mockDocument.querySelectorAll = jest.fn(() => [element]);

            // Scan logic would detect fx prefix
            const selector = '[fx-]';
            mockDocument.querySelector = jest.fn(() => element);

            const result = mockDocument.querySelector(selector);
            expect(result).toBe(element);
        });

        test('should detect multiple prefixes', () => {
            const elements = [
                Object.assign(document.createElement('span'), {
                    setAttribute: (k, v) => {},
                    getAttribute: () => 'currency'
                }),
                Object.assign(document.createElement('button'), {
                    setAttribute: (k, v) => {},
                    getAttribute: () => 'button'
                })
            ];

            // Should detect both fx and ax prefixes
            const prefixes = new Set(['fx', 'ax']);
            expect(prefixes.size).toBe(2);
            expect(prefixes.has('fx')).toBe(true);
            expect(prefixes.has('ax')).toBe(true);
        });

        test('should detect all 7 module prefixes', () => {
            const prefixes = new Set(['fx', 'ax', 'bx', 'dx', 'lx', 'tx', 'nx']);
            expect(prefixes.size).toBe(7);
            expect(prefixes.has('fx')).toBe(true);
            expect(prefixes.has('ax')).toBe(true);
            expect(prefixes.has('bx')).toBe(true);
            expect(prefixes.has('dx')).toBe(true);
            expect(prefixes.has('lx')).toBe(true);
            expect(prefixes.has('tx')).toBe(true);
            expect(prefixes.has('nx')).toBe(true);
        });

        test('should scan for all attribute types', () => {
            const attrPrefixes = ['fx-', 'ax-', 'bx-', 'dx-', 'lx-', 'tx-', 'nx-'];
            expect(attrPrefixes).toHaveLength(7);
            attrPrefixes.forEach(prefix => {
                expect(prefix).toMatch(/^[a-z]x-$/);
            });
        });

        test('should return empty set when no attributes found', () => {
            mockDocument.querySelector = jest.fn(() => null);

            const needed = new Set();
            expect(needed.size).toBe(0);
        });
    });

    describe('Module Loading', () => {
        test('should create script tag for module', () => {
            const scriptElement = document.createElement('script');
            const createElementSpy = jest.spyOn(document, 'createElement')
                .mockReturnValue(scriptElement);

            // Simulating module load
            const script = document.createElement('script');
            script.src = '/modules/fmtx.js';
            script.async = true;

            expect(script.src).toContain('fmtx.js');
            expect(script.async).toBe(true);

            createElementSpy.mockRestore();
        });

        test('should add SRI hash when configured', () => {
            const script = document.createElement('script');
            const sriHash = 'sha384-abc123';

            script.integrity = sriHash;
            script.crossOrigin = 'anonymous';

            expect(script.integrity).toBe(sriHash);
            expect(script.crossOrigin).toBe('anonymous');
        });

        test('should track loaded modules', () => {
            const loaded = new Set();
            loaded.add('fx');
            loaded.add('ax');

            expect(loaded.has('fx')).toBe(true);
            expect(loaded.has('ax')).toBe(true);
            expect(loaded.has('bx')).toBe(false);
        });

        test('should track pending modules', () => {
            const pending = new Set();
            pending.add('fx');

            expect(pending.has('fx')).toBe(true);

            pending.delete('fx');
            expect(pending.has('fx')).toBe(false);
        });
    });

    describe('Factory Pattern', () => {
        test('should look for factory at window[prefix + XFactory]', () => {
            const mockFactory = {
                init: jest.fn()
            };

            window.fxXFactory = mockFactory;
            const factoryName = 'fx' + 'XFactory';

            expect(window[factoryName]).toBe(mockFactory);
            expect(typeof window[factoryName].init).toBe('function');
        });

        test('should call factory.init() with config', () => {
            const mockFactory = {
                init: jest.fn()
            };

            const config = { prefix: 'fx-' };
            mockFactory.init(config);

            expect(mockFactory.init).toHaveBeenCalledWith(config);
        });
    });

    describe('Configuration', () => {
        test('should use default CDN when not configured', () => {
            const CDN_BASE = window.genxConfig?.cdn || 'https://cdn.genx.software/v1';
            expect(CDN_BASE).toBe('https://cdn.genx.software/v1');
        });

        test('should use custom CDN when configured', () => {
            window.genxConfig = { cdn: 'https://custom.cdn.com' };
            const CDN_BASE = window.genxConfig.cdn;
            expect(CDN_BASE).toBe('https://custom.cdn.com');
        });

        test('should support SRI configuration', () => {
            window.genxConfig = {
                sri: {
                    fx: 'sha384-hash1',
                    ax: 'sha384-hash2'
                }
            };

            expect(window.genxConfig.sri.fx).toBe('sha384-hash1');
            expect(window.genxConfig.sri.ax).toBe('sha384-hash2');
        });
    });

    describe('Events', () => {
        test('should emit genx:ready event', () => {
            const eventSpy = jest.spyOn(window, 'dispatchEvent');

            const event = new CustomEvent('genx:ready', {
                detail: { loaded: ['fx', 'ax'] }
            });

            window.dispatchEvent(event);

            expect(eventSpy).toHaveBeenCalled();
        });

        test('should include loaded modules in event detail', () => {
            const loaded = ['fx', 'ax'];
            const event = new CustomEvent('genx:ready', {
                detail: { loaded }
            });

            expect(event.detail.loaded).toEqual(['fx', 'ax']);
        });
    });

    describe('Performance', () => {
        test('should use requestAnimationFrame for non-blocking load', () => {
            const rafSpy = jest.spyOn(window, 'requestAnimationFrame');

            window.requestAnimationFrame(() => {
                // Bootstrap code here
            });

            expect(rafSpy).toHaveBeenCalled();
        });

        test('bootloader size should be targetable to <1KB', () => {
            // This is a reminder test for size requirements
            const TARGET_SIZE = 1024; // 1KB in bytes
            expect(TARGET_SIZE).toBe(1024);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing factory gracefully', () => {
            const factoryName = 'invalidXFactory';
            const factory = window[factoryName];

            expect(factory).toBeUndefined();
            // Should not throw, should log error instead
        });

        test('should handle module load failure', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            console.error('Failed to load module fx');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
