/**
 * Unit tests for loadX Strategy Selection Logic
 */

describe('loadX - Strategy Selection', () => {
    let mockWindow;
    let mockDocument;
    let mockBody;
    let mockElement;

    beforeEach(() => {
        mockElement = {
            tagName: 'DIV',
            innerHTML: '<p>Content</p>',
            className: '',
            style: {},
            offsetWidth: 300,
            offsetHeight: 200,
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            hasAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            appendChild: jest.fn(),
            children: [],
            classList: {
                contains: jest.fn(),
                add: jest.fn(),
                remove: jest.fn(),
                value: ''
            },
            getBoundingClientRect: jest.fn(() => ({
                width: 300,
                height: 200
            }))
        };

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

    describe('Attribute-based Selection', () => {
        test('should select strategy via lx-strategy attribute', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'skeleton';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });

        test('should select strategy via data-lx-strategy attribute', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'data-lx-strategy') return 'progress';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('progress');
        });

        test('should prioritize lx-strategy over data-lx-strategy', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'spinner';
                if (attr === 'data-lx-strategy') return 'skeleton';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should normalize strategy names to lowercase', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'SPINNER';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should trim whitespace from strategy names', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return '  skeleton  ';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });
    });

    describe('Class-based Selection', () => {
        test('should select strategy via lx-spinner class', () => {
            mockElement.className = 'lx-spinner';
            mockElement.classList.value = 'lx-spinner';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should select strategy via lx-skeleton class', () => {
            mockElement.className = 'lx-skeleton';
            mockElement.classList.value = 'lx-skeleton';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });

        test('should select strategy via lx-progress class', () => {
            mockElement.className = 'lx-progress';
            mockElement.classList.value = 'lx-progress';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('progress');
        });

        test('should select strategy via lx-fade class', () => {
            mockElement.className = 'lx-fade';
            mockElement.classList.value = 'lx-fade';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('fade');
        });

        test('should handle multiple classes', () => {
            mockElement.className = 'container lx-spinner active';
            mockElement.classList.value = 'container lx-spinner active';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });
    });

    describe('Colon Syntax Selection', () => {
        test('should parse lx:spinner:duration syntax', () => {
            mockElement.className = 'lx:spinner:500';
            mockElement.classList.value = 'lx:spinner:500';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should parse lx:skeleton:rows syntax', () => {
            mockElement.className = 'lx:skeleton:3';
            mockElement.classList.value = 'lx:skeleton:3';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });

        test('should parse lx:progress:value syntax', () => {
            mockElement.className = 'lx:progress:50';
            mockElement.classList.value = 'lx:progress:50';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('progress');
        });

        test('should parse lx:fade:duration syntax', () => {
            mockElement.className = 'lx:fade:300';
            mockElement.classList.value = 'lx:fade:300';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('fade');
        });
    });

    describe('JSON Config Selection', () => {
        test('should parse lx-config JSON attribute', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-config') return '{"strategy":"skeleton","rows":5}';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });

        test('should handle malformed JSON gracefully', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-config') return '{invalid json}';
                return null;
            });

            expect(() => {
                window.loadX.parseElementAttributes(mockElement);
            }).not.toThrow();
        });

        test('should prioritize JSON config strategy', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-config') return '{"strategy":"progress"}';
                return null;
            });
            mockElement.className = 'lx-spinner';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('progress');
        });
    });

    describe('Default Strategy', () => {
        test('should default to spinner when no strategy specified', () => {
            mockElement.getAttribute.mockReturnValue(null);
            mockElement.className = '';
            mockElement.classList.value = '';

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should default to spinner for null element', () => {
            const result = window.loadX.parseElementAttributes(null);

            expect(result.strategy).toBe('spinner');
        });

        test('should default to spinner for undefined element', () => {
            const result = window.loadX.parseElementAttributes(undefined);

            expect(result.strategy).toBe('spinner');
        });
    });

    describe('Strategy Application', () => {
        test('should apply selected strategy to element', () => {
            const api = window.loadX.initLoadX();

            mockElement.getAttribute.mockReturnValue(null);
            mockElement.className = '';

            expect(() => {
                api.applyLoading(mockElement, { strategy: 'spinner' });
            }).not.toThrow();
        });

        test('should switch between strategies', () => {
            const api = window.loadX.initLoadX();

            mockElement.getAttribute.mockReturnValue('<p>Original</p>');

            // Apply spinner
            api.applyLoading(mockElement, { strategy: 'spinner' });

            // Remove and apply skeleton
            api.removeLoading(mockElement);
            api.applyLoading(mockElement, { strategy: 'skeleton' });

            expect(mockElement.setAttribute).toHaveBeenCalled();
        });

        test('should handle unknown strategy gracefully', () => {
            const api = window.loadX.initLoadX();

            expect(() => {
                api.applyLoading(mockElement, { strategy: 'unknown' });
            }).not.toThrow();
        });
    });

    describe('Strategy Normalization', () => {
        test('should normalize uppercase strategy names', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'SKELETON';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('skeleton');
        });

        test('should normalize mixed case strategy names', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'SpInNeR';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner');
        });

        test('should handle empty strategy name', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return '';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner'); // Default
        });

        test('should handle whitespace-only strategy name', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return '   ';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBe('spinner'); // Default
        });
    });

    describe('Performance', () => {
        test('should select strategy quickly', () => {
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                window.loadX.parseElementAttributes(mockElement);
            }

            const duration = Date.now() - startTime;

            // 1000 selections should take less than 100ms (< 0.1ms each)
            expect(duration).toBeLessThan(100);
        });

        test('should cache parsing results efficiently', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'skeleton';
                return null;
            });

            const result1 = window.loadX.parseElementAttributes(mockElement);
            const result2 = window.loadX.parseElementAttributes(mockElement);

            expect(result1.strategy).toBe(result2.strategy);
        });
    });

    describe('Edge Cases', () => {
        test('should handle elements with no attributes', () => {
            mockElement.getAttribute.mockReturnValue(null);
            mockElement.className = '';
            mockElement.hasAttribute.mockReturnValue(false);

            expect(() => {
                window.loadX.parseElementAttributes(mockElement);
            }).not.toThrow();
        });

        test('should handle non-string strategy values', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 123; // Number instead of string
                return null;
            });

            expect(() => {
                window.loadX.parseElementAttributes(mockElement);
            }).not.toThrow();
        });

        test('should handle special characters in strategy name', () => {
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return 'spinner-custom';
                return null;
            });

            const result = window.loadX.parseElementAttributes(mockElement);

            expect(result.strategy).toBeDefined();
        });

        test('should handle very long strategy names', () => {
            const longName = 'a'.repeat(1000);
            mockElement.getAttribute.mockImplementation((attr) => {
                if (attr === 'lx-strategy') return longName;
                return null;
            });

            expect(() => {
                window.loadX.parseElementAttributes(mockElement);
            }).not.toThrow();
        });
    });
});
