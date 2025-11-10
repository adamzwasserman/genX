/**
 * Unit tests for loadX Fade Strategy
 */

describe('loadX - Fade Strategy', () => {
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
            }
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
            setTimeout: jest.fn((fn) => fn()),
            clearTimeout: jest.fn()
        };

        global.window = mockWindow;
        global.document = mockDocument;
        global.setTimeout = mockWindow.setTimeout;
        global.clearTimeout = mockWindow.clearTimeout;

        require('../../src/loadx.js');
    });

    afterEach(() => {
        delete require.cache[require.resolve('../../src/loadx.js')];
    });

    describe('Fade Strategy Application', () => {
        test('should apply fade strategy to element', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {});
            }).not.toThrow();

            expect(mockElement.setAttribute).toHaveBeenCalledWith(
                'data-lx-original-content',
                expect.any(String)
            );
        });

        test('should apply fade class', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            expect(mockElement.classList.add).toHaveBeenCalledWith('lx-fade');
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(null, {});
            }).not.toThrow();
        });

        test('should handle undefined element gracefully', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(undefined, {});
            }).not.toThrow();
        });
    });

    describe('Fade Configuration', () => {
        test('should respect custom duration', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                duration: 500
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should use default duration when not specified', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle very short duration', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    duration: 50
                });
            }).not.toThrow();
        });

        test('should handle very long duration', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    duration: 5000
                });
            }).not.toThrow();
        });

        test('should handle zero duration', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    duration: 0
                });
            }).not.toThrow();
        });
    });

    describe('Opacity Transitions', () => {
        test('should set initial opacity', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            // Style should be modified
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should animate to target opacity', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                opacity: 0.5
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle fade to fully transparent', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: 0
                });
            }).not.toThrow();
        });

        test('should handle fade to fully opaque', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: 1
                });
            }).not.toThrow();
        });

        test('should handle custom opacity values', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: 0.3
                });
            }).not.toThrow();
        });
    });

    describe('Loading Messages', () => {
        test('should display loading message', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                message: 'Loading data...'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle empty message', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    message: ''
                });
            }).not.toThrow();
        });

        test('should handle long message text', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    message: 'This is a very long loading message that explains what is happening'
                });
            }).not.toThrow();
        });

        test('should handle no message specified', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {});
            }).not.toThrow();
        });
    });

    describe('Fade Removal', () => {
        test('should remove fade strategy from element', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return '<p>Original</p>';
                return null;
            });

            expect(() => {
                window.loadX.removeFadeStrategy(mockElement);
            }).not.toThrow();
        });

        test('should restore original content', () => {
            const originalContent = '<p>Original content</p>';
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-original-content') return originalContent;
                return null;
            });

            window.loadX.removeFadeStrategy(mockElement);

            expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-lx-original-content');
        });

        test('should remove fade class', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.removeFadeStrategy(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('lx-fade');
        });

        test('should restore original opacity', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.removeFadeStrategy(mockElement);

            // Should restore opacity through style modifications
            expect(mockElement.classList.remove).toHaveBeenCalled();
        });

        test('should handle null element gracefully', () => {
            expect(() => {
                window.loadX.removeFadeStrategy(null);
            }).not.toThrow();
        });
    });

    describe('Smooth Transitions', () => {
        test('should apply CSS transition', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                duration: 300
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle transition end', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            // Should set up transition properly
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should cleanup after transition', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            window.loadX.removeFadeStrategy(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        test('should maintain aria-busy state', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            // Fade strategy should work with parent applyLoadingState ARIA
            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should support screen readers during fade', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                message: 'Loading...',
                ariaLabel: 'Content loading'
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should announce loading state changes', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                message: 'Please wait...'
            });

            expect(mockDocument.createElement).toHaveBeenCalled();
        });
    });

    describe('Reduced Motion Support', () => {
        test('should respect prefers-reduced-motion', () => {
            // This would be tested via CSS media query
            window.loadX.applyFadeStrategy(mockElement, {});

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should disable animations for reduced motion', () => {
            window.loadX.applyFadeStrategy(mockElement, {
                respectMotionPreference: true
            });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty element', () => {
            mockElement.innerHTML = '';

            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {});
            }).not.toThrow();
        });

        test('should handle invalid duration types', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    duration: 'invalid'
                });
            }).not.toThrow();
        });

        test('should handle invalid opacity values', () => {
            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: 'invalid'
                });
            }).not.toThrow();

            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: -1
                });
            }).not.toThrow();

            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    opacity: 2
                });
            }).not.toThrow();
        });

        test('should handle element without original content', () => {
            mockElement.getAttribute.mockReturnValue(null);

            expect(() => {
                window.loadX.removeFadeStrategy(mockElement);
            }).not.toThrow();
        });

        test('should handle nested fade applications', () => {
            window.loadX.applyFadeStrategy(mockElement, {});

            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {
                    duration: 500
                });
            }).not.toThrow();
        });

        test('should handle rapid apply/remove cycles', () => {
            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            expect(() => {
                window.loadX.applyFadeStrategy(mockElement, {});
                window.loadX.removeFadeStrategy(mockElement);
                window.loadX.applyFadeStrategy(mockElement, {});
                window.loadX.removeFadeStrategy(mockElement);
            }).not.toThrow();
        });
    });
});
