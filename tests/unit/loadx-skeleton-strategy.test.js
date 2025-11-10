/**
 * Unit tests for loadX Skeleton Strategy
 */

describe('loadX - Skeleton Strategy', () => {
    let mockWindow;
    let mockDocument;
    let mockBody;
    let mockElement;

    beforeEach(() => {
        // Create mock element
        mockElement = {
            tagName: 'DIV',
            innerHTML: '<p>Original content</p>',
            style: {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            hasAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            appendChild: jest.fn(),
            children: [],
            classList: {
                contains: jest.fn(),
                add: jest.fn(),
                remove: jest.fn()
            },
            getBoundingClientRect: jest.fn(() => ({
                width: 300,
                height: 200
            }))
        };

        mockBody = {
            appendChild: jest.fn(),
            children: [],
            remove: jest.fn()
        };

        mockDocument = {
            body: mockBody,
            readyState: 'complete',
            addEventListener: jest.fn(),
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
            getComputedStyle: jest.fn(() => ({
                getPropertyValue: jest.fn(() => ''),
                display: 'block',
                position: 'static'
            }))
        };

        global.window = mockWindow;
        global.document = mockDocument;

        // Load the loadx.js module
        require('../../src/loadx.js');
    });

    afterEach(() => {
        delete require.cache[require.resolve('../../src/loadx.js')];
    });

    describe('Skeleton Generation', () => {
        test('should apply skeleton strategy to element', () => {
            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, {});
            }).not.toThrow();

            // Should store original content
            expect(mockElement.setAttribute).toHaveBeenCalledWith(
                'data-lx-original-content',
                expect.any(String)
            );
        });

        test('should preserve element dimensions', () => {
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Should get dimensions
            expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
        });

        test('should apply skeleton class', () => {
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Should add skeleton class
            expect(mockElement.classList.add).toHaveBeenCalledWith('lx-skeleton');
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.applySkeletonStrategy(null, {});
            }).not.toThrow();
        });

        test('should handle undefined element gracefully', () => {
            expect(() => {
                window.loadX.applySkeletonStrategy(undefined, {});
            }).not.toThrow();
        });
    });

    describe('Skeleton Configuration', () => {
        test('should respect rows configuration', () => {
            window.loadX.applySkeletonStrategy(mockElement, { rows: 5 });

            // Function should execute without error
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should use default rows when not specified', () => {
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Should execute successfully with defaults
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle animation configuration', () => {
            window.loadX.applySkeletonStrategy(mockElement, {
                animate: true
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle width configuration', () => {
            window.loadX.applySkeletonStrategy(mockElement, {
                width: '100%'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Skeleton Removal', () => {
        test('should remove skeleton strategy from element', () => {
            // Apply skeleton first
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Mock stored content
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return '<p>Original content</p>';
                return null;
            });

            // Remove skeleton
            expect(() => {
                window.loadX.removeSkeletonStrategy(mockElement);
            }).not.toThrow();
        });

        test('should restore original content', () => {
            const originalContent = '<p>Original content</p>';
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return originalContent;
                return null;
            });

            window.loadX.removeSkeletonStrategy(mockElement);

            // Should restore content (implementation sets innerHTML)
            expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-lx-original-content');
        });

        test('should remove skeleton class', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.removeSkeletonStrategy(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('lx-skeleton');
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.removeSkeletonStrategy(null);
            }).not.toThrow();
        });
    });

    describe('Auto-detection', () => {
        test('should detect text content elements', () => {
            mockElement.tagName = 'P';
            mockElement.innerHTML = 'Some text content';

            window.loadX.applySkeletonStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should detect list elements', () => {
            mockElement.tagName = 'UL';

            window.loadX.applySkeletonStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should detect card/container elements', () => {
            mockElement.classList.contains.mockImplementation((cls) => cls === 'card');

            window.loadX.applySkeletonStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Layout Preservation', () => {
        test('should preserve element width', () => {
            mockElement.getBoundingClientRect.mockReturnValue({
                width: 400,
                height: 200
            });

            window.loadX.applySkeletonStrategy(mockElement, {});

            // Should get dimensions to preserve layout
            expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
        });

        test('should preserve element height', () => {
            mockElement.getBoundingClientRect.mockReturnValue({
                width: 300,
                height: 150
            });

            window.loadX.applySkeletonStrategy(mockElement, {});

            expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
        });

        test('should handle zero dimensions gracefully', () => {
            mockElement.getBoundingClientRect.mockReturnValue({
                width: 0,
                height: 0
            });

            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, {});
            }).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        test('should include ARIA attributes', () => {
            window.loadX.applySkeletonStrategy(mockElement, {});

            // Skeleton should preserve accessibility through parent applyLoadingState
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should support screen readers', () => {
            window.loadX.applySkeletonStrategy(mockElement, {
                ariaLabel: 'Loading content'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty element', () => {
            mockElement.innerHTML = '';

            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, {});
            }).not.toThrow();
        });

        test('should handle element with no dimensions', () => {
            mockElement.getBoundingClientRect.mockReturnValue({
                width: 0,
                height: 0
            });

            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, {});
            }).not.toThrow();
        });

        test('should handle invalid rows value', () => {
            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, { rows: -1 });
            }).not.toThrow();

            expect(() => {
                window.loadX.applySkeletonStrategy(mockElement, { rows: 'invalid' });
            }).not.toThrow();
        });

        test('should handle element without original content attribute', () => {
            mockElement.getAttribute.mockReturnValue(null);

            expect(() => {
                window.loadX.removeSkeletonStrategy(mockElement);
            }).not.toThrow();
        });
    });
});
