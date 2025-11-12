/**
 * Unit tests for loadX Spinner Strategy
 */

const assert = require('assert');

describe('loadX Spinner Strategy', () => {
    let mockWindow, mockDocument, mockElement, loadX;

    beforeEach(() => {
        // Setup mock DOM first
        mockDocument = {
            body: { appendChild: jest.fn() },
            createElement: jest.fn((tag) => ({
                tagName: tag.toUpperCase(),
                className: '',
                innerHTML: '',
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                getAttribute: jest.fn()
            })),
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };

        mockWindow = {
            document: mockDocument,
            matchMedia: jest.fn((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            })),
            getComputedStyle: jest.fn(() => ({
                width: '0px',
                height: '0px',
                animation: 'lx-spin 0.8s linear infinite'
            }))
        };

        // Set global BEFORE requiring module
        global.window = mockWindow;
        global.document = mockDocument;

        // Load loadX module (module will set window.loadX)
        const loadXPath = require('path').resolve(__dirname, '../../src/loadx.js');
        delete require.cache[loadXPath];
        require(loadXPath);

        // Get loadX from window (set by module)
        loadX = global.window.loadX;

        // Create mock element using JSDOM's document
        mockElement = document.createElement('div');
        mockElement.innerHTML = '';

        // Add spy functions to track calls
        jest.spyOn(mockElement, 'setAttribute');
        jest.spyOn(mockElement, 'getAttribute');
        jest.spyOn(mockElement, 'removeAttribute');
        jest.spyOn(mockElement.classList, 'add');
        jest.spyOn(mockElement.classList, 'remove');

        // Create a real live region in JSDOM for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'lx-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    describe('applySpinnerStrategy', () => {
        it('should create circle spinner by default', () => {
            jest.spyOn(mockElement, 'querySelector').mockImplementation((selector) => {
                if (selector === '.lx-spinner-circle') {
                    return { classList: { contains: jest.fn(() => false) } };
                }
                return null;
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-lx-strategy', 'spinner');
            expect(mockElement.classList.add).toHaveBeenCalledWith('lx-loading');
        });

        it('should store original content', () => {
            mockElement.innerHTML = '<span>Original Content</span>';

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalledWith(
                'data-lx-original-content',
                '<span>Original Content</span>'
            );
        });

        it('should apply dots spinner type', () => {
            mockElement.setAttribute('lx-spinner-type', 'dots');
            mockElement.getAttribute.mockImplementation((key) => {
                if (key === 'lx-spinner-type') return 'dots';
                return null;
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.innerHTML).toContain('lx-spinner-dots');
        });

        it('should apply bars spinner type', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerType: 'bars' });

            expect(mockElement.innerHTML).toContain('lx-spinner-bars');
        });

        it('should apply small size class', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerSize: 'small' });

            expect(mockElement.innerHTML).toContain('lx-spinner-small');
        });

        it('should apply large size class', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerSize: 'large' });

            expect(mockElement.innerHTML).toContain('lx-spinner-large');
        });

        it('should apply custom color', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerColor: '#FF6B6B' });

            expect(mockElement.innerHTML).toContain('#FF6B6B');
        });

        it('should preserve element width', () => {
            Object.defineProperty(mockElement, 'offsetWidth', {
                value: 120,
                writable: true,
                configurable: true
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.style.width).toBe('120px');
        });

        it('should preserve element height', () => {
            Object.defineProperty(mockElement, 'offsetHeight', {
                value: 40,
                writable: true,
                configurable: true
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.style.minHeight).toBe('40px');
        });

        it('should show static indicator for reduced motion', () => {
            // Override the global window.matchMedia
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = jest.fn((query) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }));

            loadX.applySpinnerStrategy(mockElement, {});

            // The spinner wrapper contains the static indicator
            const wrapper = mockElement.querySelector('.lx-spinner-wrapper');
            expect(wrapper.innerHTML).toContain('lx-loading-static');

            // Restore
            window.matchMedia = originalMatchMedia;
        });

        it('should handle null element gracefully', () => {
            expect(() => {
                loadX.applySpinnerStrategy(null, {});
            }).not.toThrow();
        });

        it('should read spinner type from attribute', () => {
            mockElement.setAttribute('lx-spinner-type', 'dots');
            mockElement.getAttribute.mockImplementation((key) => {
                if (key === 'lx-spinner-type') return 'dots';
                return null;
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.innerHTML).toContain('lx-spinner-dots');
        });

        it('should read spinner size from attribute', () => {
            mockElement.setAttribute('lx-spinner-size', 'large');
            mockElement.getAttribute.mockImplementation((key) => {
                if (key === 'lx-spinner-size') return 'large';
                return null;
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.innerHTML).toContain('lx-spinner-large');
        });

        it('should read spinner color from attribute', () => {
            mockElement.setAttribute('lx-spinner-color', '#00FF00');
            mockElement.getAttribute.mockImplementation((key) => {
                if (key === 'lx-spinner-color') return '#00FF00';
                return null;
            });

            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.innerHTML).toContain('#00FF00');
        });
    });

    describe('removeSpinnerStrategy', () => {
        beforeEach(() => {
            mockElement.innerHTML = '<span>Original Content</span>';
            loadX.applySpinnerStrategy(mockElement, {});
        });

        it('should restore original content', () => {
            const originalContent = mockElement.getAttribute('data-lx-original-content');

            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.innerHTML).toBe(originalContent);
        });

        it('should remove data-lx-original-content attribute', () => {
            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-lx-original-content');
        });

        it('should remove data-lx-strategy attribute', () => {
            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-lx-strategy');
        });

        it('should remove lx-loading class', () => {
            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('lx-loading');
        });

        it('should reset width style', () => {
            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.style.width).toBe('');
        });

        it('should reset minHeight style', () => {
            loadX.removeSpinnerStrategy(mockElement);

            expect(mockElement.style.minHeight).toBe('');
        });

        it('should handle null element gracefully', () => {
            expect(() => {
                loadX.removeSpinnerStrategy(null);
            }).not.toThrow();
        });
    });

    describe('applyLoadingState integration', () => {
        it('should apply spinner strategy', () => {
            loadX.applyLoadingState(mockElement, { strategy: 'spinner' }, {});

            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-lx-strategy', 'spinner');
        });

        it('should set aria-busy attribute', () => {
            loadX.applyLoadingState(mockElement, { strategy: 'spinner' }, {});

            expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-busy', 'true');
        });

        it('should announce loading to ARIA live region', () => {
            loadX.applyLoadingState(mockElement, { strategy: 'spinner' }, {});

            const liveRegion = document.getElementById('lx-live-region');
            expect(liveRegion.textContent).toBe('Loading');
        });

        it('should default to spinner strategy when not specified', () => {
            loadX.applyLoadingState(mockElement, {}, {});

            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-lx-strategy', 'spinner');
        });
    });

    describe('removeLoadingState integration', () => {
        beforeEach(() => {
            mockElement.innerHTML = '<span>Content</span>';
            loadX.applyLoadingState(mockElement, { strategy: 'spinner' }, {});
        });

        it('should remove spinner strategy', () => {
            loadX.removeLoadingState(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('lx-loading');
        });

        it('should remove aria-busy attribute', () => {
            loadX.removeLoadingState(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('aria-busy');
        });

        it('should announce completion to ARIA live region', () => {
            loadX.removeLoadingState(mockElement);

            const liveRegion = document.getElementById('lx-live-region');
            expect(liveRegion.textContent).toBe('Loading complete');
        });
    });

    describe('spinner HTML generation', () => {
        it('should generate circle spinner HTML', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerType: 'circle' });

            expect(mockElement.innerHTML).toContain('lx-spinner-circle');
        });

        it('should generate dots spinner with 3 dots', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerType: 'dots' });

            expect(mockElement.innerHTML).toContain('lx-spinner-dots');
            // Match only the individual dot divs, not the container
            expect((mockElement.innerHTML.match(/lx-spinner-dot"/g) || []).length).toBe(3);
        });

        it('should generate bars spinner with 3 bars', () => {
            loadX.applySpinnerStrategy(mockElement, { spinnerType: 'bars' });

            expect(mockElement.innerHTML).toContain('lx-spinner-bars');
            // Match only the individual bar divs, not the container
            expect((mockElement.innerHTML.match(/lx-spinner-bar"/g) || []).length).toBe(3);
        });

        it('should wrap spinner in container', () => {
            loadX.applySpinnerStrategy(mockElement, {});

            expect(mockElement.innerHTML).toContain('lx-spinner-wrapper');
        });
    });
});
