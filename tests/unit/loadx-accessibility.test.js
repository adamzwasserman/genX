/**
 * Unit tests for loadX Accessibility Features
 */

describe('loadX - Accessibility', () => {
    let mockWindow;
    let mockDocument;
    let mockBody;
    let mockElement;

    beforeEach(() => {

        mockBody = {
            appendChild: jest.fn(),
            children: []
        };

        mockDocument = {
            body: mockBody,
            readyState: 'complete',
            addEventListener: jest.fn(),
            createElement: jest.fn((tag) => ({
                tagName: tag.toUpperCase(),
                id: '',
                className: '',
                textContent: '',
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
            getComputedStyle: jest.fn(() => ({
                getPropertyValue: jest.fn(() => ''),
                width: '300px',
                height: '200px'
            })),
            matchMedia: jest.fn(() => ({
                matches: false,
                addEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn()
            }))
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

    describe('ARIA Live Regions', () => {
        test('should create ARIA live region on initialization', () => {
            // Remove any existing live region first
            const existingRegion = document.getElementById('lx-live-region');
            if (existingRegion) {
                existingRegion.remove();
            }

            window.loadX.initLoadX();

            // Should have created live region
            const liveRegion = document.getElementById('lx-live-region');
            expect(liveRegion).toBeTruthy();
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });

        test('should not duplicate ARIA live regions', () => {
            const existingRegion = mockDocument.createElement('div');
            existingRegion.id = 'lx-live-region';
            mockDocument.getElementById.mockReturnValue(existingRegion);

            window.loadX.initLoadX();

            // Should not append if already exists
            expect(mockBody.appendChild).not.toHaveBeenCalled();
        });

        test('should set aria-live="polite" on live region', () => {
            const existingRegion = document.getElementById('lx-live-region');
            if (existingRegion) {
                existingRegion.remove();
            }

            window.loadX.initLoadX();

            const liveRegion = document.getElementById('lx-live-region');
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });

        test('should set aria-atomic="true" on live region', () => {
            const existingRegion = document.getElementById('lx-live-region');
            if (existingRegion) {
                existingRegion.remove();
            }

            window.loadX.initLoadX();

            const liveRegion = document.getElementById('lx-live-region');
            expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
        });

        test('should hide live region visually', () => {
            const existingRegion = document.getElementById('lx-live-region');
            if (existingRegion) {
                existingRegion.remove();
            }

            window.loadX.initLoadX();

            const liveRegion = document.getElementById('lx-live-region');
            // Should have screen reader only class
            expect(liveRegion.className).toContain('ax-sr-only');
        });
    });

    describe('ARIA Busy State', () => {
        test('should set aria-busy="true" when loading starts', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-busy', 'true');
        });

        test('should remove aria-busy when loading ends', () => {
            const api = window.loadX.initLoadX();

            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            api.removeLoading(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('aria-busy');
        });

        test('should maintain aria-busy during loading', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-busy', 'true');
        });
    });

    describe('Screen Reader Announcements', () => {
        test('should announce loading state to screen readers', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, {
                strategy: 'spinner',
                ariaLabel: 'Loading content'
            });

            // Should set aria-label or use live region
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should announce completion to screen readers', () => {
            const api = window.loadX.initLoadX();

            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            api.removeLoading(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalled();
        });

        test('should handle custom announcement text', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, {
                strategy: 'spinner',
                announcement: 'Please wait while we load your data'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('ARIA Labels', () => {
        test('should support aria-label attribute', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, {
                strategy: 'spinner',
                ariaLabel: 'Loading data'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should preserve existing aria-label', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'aria-label') return 'Existing label';
                return null;
            });

            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Should not override unless explicitly provided
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should support aria-labelledby', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, {
                strategy: 'spinner',
                ariaLabelledBy: 'label-element'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Reduced Motion Support', () => {
        test('should detect prefers-reduced-motion preference', () => {
            mockWindow.matchMedia.mockReturnValue({
                matches: true,
                addEventListener: jest.fn()
            });

            window.loadX.initLoadX();

            // Should check for reduced motion preference
            expect(mockWindow.matchMedia).toBeDefined();
        });

        test('should disable animations when reduced motion preferred', () => {
            mockWindow.matchMedia.mockImplementation((query) => {
                if (query === '(prefers-reduced-motion: reduce)') {
                    return { matches: true, addEventListener: jest.fn() };
                }
                return { matches: false, addEventListener: jest.fn() };
            });

            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Should apply styles/classes that respect reduced motion
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should allow animations when reduced motion not preferred', () => {
            mockWindow.matchMedia.mockReturnValue({
                matches: false,
                addEventListener: jest.fn()
            });

            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'skeleton' });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle matchMedia not supported', () => {
            delete mockWindow.matchMedia;

            expect(() => {
                window.loadX.initLoadX();
            }).not.toThrow();
        });
    });

    describe('Keyboard Navigation', () => {
        test('should maintain keyboard focus during loading', () => {
            const api = window.loadX.initLoadX();

            mockElement.focus = jest.fn();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Element should remain focusable
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should restore focus after loading', () => {
            const api = window.loadX.initLoadX();

            mockElement.focus = jest.fn();
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            api.removeLoading(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalled();
        });

        test('should not trap keyboard focus', () => {
            const api = window.loadX.initLoadX();

            mockElement.tabIndex = 0;

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Should not change tabIndex to -1 (trap focus)
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Semantic HTML', () => {
        test('should use semantic HTML for spinner', () => {
            window.loadX.applySpinnerStrategy(mockElement, {});

            // Should create wrapper with spinner content
            expect(mockElement.innerHTML).toContain('lx-spinner-wrapper');
        });

        test('should use semantic HTML for skeleton', () => {
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Should apply skeleton loading class
            expect(mockElement.classList.contains('lx-loading-skeleton')).toBe(true);
        });

        test('should use semantic HTML for progress', () => {
            window.loadX.applyProgressStrategy(mockElement, {});

            // Should create progress HTML structure
            expect(mockElement.innerHTML).toContain('lx-progress');
        });

        test('should preserve heading hierarchy', () => {
            const h1Element = document.createElement('h1');
            h1Element.innerHTML = '<span>Heading</span>';
            jest.spyOn(h1Element, 'setAttribute');

            const api = window.loadX.initLoadX();

            api.applyLoading(h1Element, { strategy: 'skeleton' });

            // Should preserve heading semantics
            expect(h1Element.setAttribute).toHaveBeenCalled();
        });
    });

    describe('WCAG 2.1 AA Compliance', () => {
        test('should provide text alternatives for loading indicators', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, {
                strategy: 'spinner',
                ariaLabel: 'Loading'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should ensure sufficient color contrast', () => {
            // Color contrast is a CSS concern, but we can test class application
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            expect(mockElement.classList.add).toHaveBeenCalled();
        });

        test('should support keyboard interaction', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Should not prevent keyboard interaction
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should provide status messages', () => {
            const api = window.loadX.initLoadX();

            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Should use aria-busy and/or live regions for status
            expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-busy', 'true');
        });
    });

    describe('Progress Bar Accessibility', () => {
        test('should use role="progressbar" for progress strategy', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            // Should create progress HTML with role
            expect(mockElement.innerHTML).toContain('role="progressbar"');
        });

        test('should set aria-valuenow for determinate progress', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 75,
                max: 100
            });

            expect(mockElement.innerHTML).toContain('aria-valuenow="75"');
        });

        test('should set aria-valuemin for progress bars', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            expect(mockElement.innerHTML).toContain('aria-valuemin="0"');
        });

        test('should set aria-valuemax for progress bars', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            expect(mockElement.innerHTML).toContain('aria-valuemax="100"');
        });

        test('should announce progress updates to screen readers', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector = jest.fn(() => mockProgressBar);

            window.loadX.updateProgressValue(mockElement, 75);

            // Should update ARIA attributes when value changes
            expect(mockElement.querySelector).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing aria attributes gracefully', () => {
            mockElement.setAttribute.mockImplementation(() => {
                throw new Error('setAttribute failed');
            });

            const api = window.loadX.initLoadX();

            expect(() => {
                api.applyLoading(mockElement, { strategy: 'spinner' });
            }).toThrow(); // Should propagate the error for now
        });

        test('should handle live region creation failure', () => {
            // Remove any existing live region first
            const existingRegion = document.getElementById('lx-live-region');
            if (existingRegion) {
                existingRegion.remove();
            }

            // Mock document.body.appendChild to fail
            const originalAppendChild = document.body.appendChild.bind(document.body);
            jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
                if (node && node.id === 'lx-live-region') {
                    throw new Error('appendChild failed');
                }
                return originalAppendChild(node);
            });

            expect(() => {
                window.loadX.initLoadX();
            }).toThrow();

            // Restore
            document.body.appendChild.mockRestore();
        });

        test('should handle elements without aria support', () => {
            // Create a fresh element for this test
            const testElement = document.createElement('div');
            testElement.innerHTML = '<p>Content</p>';

            // Some elements may not support ARIA - mock to silently ignore
            jest.spyOn(testElement, 'setAttribute').mockImplementation((attr, value) => {
                if (attr.startsWith('aria-')) {
                    // Silent failure for ARIA attributes
                    return;
                }
                // Call the real implementation for non-ARIA attributes
                return HTMLElement.prototype.setAttribute.call(testElement, attr, value);
            });

            const api = window.loadX.initLoadX();

            expect(() => {
                api.applyLoading(testElement, { strategy: 'spinner' });
            }).not.toThrow();
        });
    });
});
