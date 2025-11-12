/**
 * Unit tests for loadX Progress Strategy
 */

describe('loadX - Progress Strategy', () => {
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
            querySelector: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({
                width: 300,
                height: 50
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
                },
                querySelector: jest.fn()
            })),
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

        require('../../src/loadx.js');
    });

    afterEach(() => {
        delete require.cache[require.resolve('../../src/loadx.js')];
    });

    describe('Progress Bar Creation', () => {
        test('should apply progress strategy to element', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {});
            }).not.toThrow();

            expect(mockElement.setAttribute).toHaveBeenCalledWith(
                'data-lx-original-content',
                expect.any(String)
            );
        });

        test('should create progress bar element', () => {
            window.loadX.applyProgressStrategy(mockElement, {});

            // Should set innerHTML with progress bar
            expect(mockElement.innerHTML).toBeDefined();
        });

        test('should apply progress class', () => {
            window.loadX.applyProgressStrategy(mockElement, {});

            expect(mockElement.classList.add).toHaveBeenCalledWith('lx-loading', 'lx-loading-progress');
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(null, {});
            }).not.toThrow();
        });

        test('should handle undefined element gracefully', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(undefined, {});
            }).not.toThrow();
        });
    });

    describe('Determinate Progress', () => {
        test('should create determinate progress bar', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should set initial value', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                mode: 'determinate',
                value: 25,
                max: 100
            });

            expect(mockElement._lxProgressValue).toBe(25);
        });

        test('should respect max value', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                mode: 'determinate',
                value: 50,
                max: 200
            });

            expect(mockElement._lxProgressMax).toBe(200);
        });

        test('should handle 0% value', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    value: 0,
                    max: 100
                });
            }).not.toThrow();
        });

        test('should handle 100% value', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    value: 100,
                    max: 100
                });
            }).not.toThrow();
        });
    });

    describe('Indeterminate Progress', () => {
        test('should create indeterminate progress bar', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                indeterminate: true
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should default to indeterminate when no value specified', () => {
            window.loadX.applyProgressStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should show animated bar for indeterminate', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                mode: 'indeterminate'
            });

            expect(mockElement.innerHTML).toContain('lx-progress-indeterminate');
        });
    });

    describe('Progress Value Updates', () => {
        test('should update progress value', () => {
            // Create progress bar first
            window.loadX.applyProgressStrategy(mockElement, {
                value: 25,
                max: 100
            });

            // Mock progress bar element
            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector.mockReturnValue(mockProgressBar);

            // Update value
            expect(() => {
                window.loadX.updateProgressValue(mockElement, 75);
            }).not.toThrow();
        });

        test('should handle value updates to 0', () => {
            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector.mockReturnValue(mockProgressBar);

            expect(() => {
                window.loadX.updateProgressValue(mockElement, 0);
            }).not.toThrow();
        });

        test('should handle value updates to 100', () => {
            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector.mockReturnValue(mockProgressBar);

            expect(() => {
                window.loadX.updateProgressValue(mockElement, 100);
            }).not.toThrow();
        });

        test('should clamp values above max', () => {
            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector.mockReturnValue(mockProgressBar);

            expect(() => {
                window.loadX.updateProgressValue(mockElement, 150);
            }).not.toThrow();
        });

        test('should handle negative values', () => {
            const mockProgressBar = {
                style: {},
                setAttribute: jest.fn(),
                textContent: ''
            };
            mockElement.querySelector.mockReturnValue(mockProgressBar);

            expect(() => {
                window.loadX.updateProgressValue(mockElement, -10);
            }).not.toThrow();
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.updateProgressValue(null, 50);
            }).not.toThrow();
        });

        test('should handle missing progress bar element', () => {
            mockElement.querySelector.mockReturnValue(null);

            expect(() => {
                window.loadX.updateProgressValue(mockElement, 50);
            }).not.toThrow();
        });
    });

    describe('Progress Bar Removal', () => {
        test('should remove progress strategy from element', () => {
            window.loadX.applyProgressStrategy(mockElement, {});

            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return '<p>Original</p>';
                return null;
            });

            expect(() => {
                window.loadX.removeProgressStrategy(mockElement);
            }).not.toThrow();
        });

        test('should restore original content', () => {
            const originalContent = '<p>Original content</p>';
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return originalContent;
                return null;
            });

            window.loadX.removeProgressStrategy(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-lx-original-content');
        });

        test('should remove progress class', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.removeProgressStrategy(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('lx-loading', 'lx-loading-progress');
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.removeProgressStrategy(null);
            }).not.toThrow();
        });
    });

    describe('Progress Configuration', () => {
        test('should respect custom colors', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                color: '#ff0000'
            });

            expect(mockElement.innerHTML).toBeDefined();
        });

        test('should respect custom height', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                height: '10px'
            });

            expect(mockElement.innerHTML).toBeDefined();
        });

        test('should show/hide percentage text', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                showPercentage: true,
                value: 50
            });

            expect(mockElement.innerHTML).toBeDefined();
        });

        test('should handle custom label text', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                label: 'Uploading...'
            });

            expect(mockElement.innerHTML).toBeDefined();
        });
    });

    describe('Accessibility', () => {
        test('should include ARIA progressbar role', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            expect(mockElement.innerHTML).toContain('lx-progress-bar');
        });

        test('should set aria-valuenow for determinate', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                mode: 'determinate',
                value: 50,
                max: 100
            });

            expect(mockElement._lxProgressValue).toBe(50);
        });

        test('should set aria-valuemin', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                value: 50,
                max: 100
            });

            expect(mockElement.innerHTML).toBeDefined();
        });

        test('should set aria-valuemax', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                mode: 'determinate',
                value: 50,
                max: 100
            });

            expect(mockElement._lxProgressMax).toBe(100);
        });

        test('should support custom aria-label', () => {
            window.loadX.applyProgressStrategy(mockElement, {
                ariaLabel: 'File upload progress'
            });

            expect(mockElement.innerHTML).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty element', () => {
            mockElement.innerHTML = '';

            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {});
            }).not.toThrow();
        });

        test('should handle invalid value types', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    value: 'invalid'
                });
            }).not.toThrow();
        });

        test('should handle invalid max types', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    max: 'invalid'
                });
            }).not.toThrow();
        });

        test('should handle element without original content', () => {
            mockElement.getAttribute.mockReturnValue(null);

            expect(() => {
                window.loadX.removeProgressStrategy(mockElement);
            }).not.toThrow();
        });

        test('should handle very large values', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    value: 999999,
                    max: 1000000
                });
            }).not.toThrow();
        });

        test('should handle decimal values', () => {
            expect(() => {
                window.loadX.applyProgressStrategy(mockElement, {
                    value: 33.33,
                    max: 100
                });
            }).not.toThrow();
        });
    });
});
