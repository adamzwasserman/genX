/**
 * Unit tests for loadX attribute processing (Task 1.2)
 */

// Import the module directly for testing
const { parseElementAttributes } = require('../../src/loadx.js');

describe('loadX Attribute Processing', () => {
    // Create mock element helper
    const createMockElement = (attrs = {}, className = '') => {
        return {
            getAttribute: jest.fn((key) => attrs[key] || null),
            setAttribute: jest.fn(),
            hasAttribute: jest.fn((key) => key in attrs),
            className: className,
            _lxConfig: null
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseElementAttributes()', () => {
        describe('HTML attribute syntax', () => {
            test('should parse lx-strategy attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'spinner' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should normalize strategy name to lowercase', () => {
                const el = createMockElement({ 'lx-strategy': 'SPINNER' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should trim whitespace from strategy name', () => {
                const el = createMockElement({ 'lx-strategy': '  skeleton  ' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
            });

            test('should default to spinner for empty attribute', () => {
                const el = createMockElement({ 'lx-strategy': '' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });
        });

        describe('CSS class syntax', () => {
            test('should parse lx-spinner class', () => {
                const el = createMockElement({}, 'btn lx-spinner');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should parse lx-skeleton class', () => {
                const el = createMockElement({}, 'lx-skeleton card');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
            });

            test('should parse lx-progress class', () => {
                const el = createMockElement({}, 'lx-progress');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
            });

            test('should parse lx-fade class', () => {
                const el = createMockElement({}, 'lx-fade');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('fade');
            });
        });

        describe('Colon syntax', () => {
            test('should parse lx:spinner colon syntax', () => {
                const el = createMockElement({}, 'lx:spinner');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should parse lx:spinner:500 with duration', () => {
                const el = createMockElement({}, 'lx:spinner:500');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
                expect(result.duration).toBe(500);
            });

            test('should parse lx:progress:determinate:500 with mode and duration', () => {
                const el = createMockElement({}, 'lx:progress:determinate:500');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
                expect(result.mode).toBe('determinate');
                expect(result.duration).toBe(500);
            });

            test('should parse lx:skeleton:300 with duration', () => {
                const el = createMockElement({}, 'lx:skeleton:300');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
                expect(result.duration).toBe(300);
            });

            test('should parse lx:fade:200 with duration', () => {
                const el = createMockElement({}, 'lx:fade:200');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('fade');
                expect(result.duration).toBe(200);
            });
        });

        describe('JSON configuration syntax', () => {
            test('should parse valid JSON config', () => {
                const el = createMockElement({ 'lx-config': '{"strategy":"spinner","duration":500}' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
                expect(result.duration).toBe(500);
            });

            test('should parse complex JSON config', () => {
                const el = createMockElement({ 'lx-config': '{"strategy":"skeleton","minHeight":"200px","animate":true}' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
                expect(result.minHeight).toBe('200px');
                expect(result.animate).toBe(true);
            });

            test('should handle invalid JSON gracefully', () => {
                const el = createMockElement({ 'lx-config': 'invalid json', 'lx-strategy': 'progress' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
            });

            test('should normalize strategy name in JSON', () => {
                const el = createMockElement({ 'lx-config': '{"strategy":"SKELETON"}' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
            });
        });

        describe('Data attribute syntax', () => {
            test('should parse data-lx-strategy attribute', () => {
                const el = createMockElement({ 'data-lx-strategy': 'skeleton' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
            });

            test('should normalize data attribute strategy', () => {
                const el = createMockElement({ 'data-lx-strategy': 'PROGRESS' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
            });
        });

        describe('Additional attributes', () => {
            test('should parse lx-duration attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'spinner', 'lx-duration': '600' });
                const result = parseElementAttributes(el);
                expect(result.duration).toBe(600);
            });

            test('should parse lx-value attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'progress', 'lx-value': '75' });
                const result = parseElementAttributes(el);
                expect(result.value).toBe(75);
            });

            test('should parse lx-rows attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'skeleton', 'lx-rows': '5' });
                const result = parseElementAttributes(el);
                expect(result.rows).toBe(5);
            });

            test('should parse lx-min-height attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'skeleton', 'lx-min-height': '150px' });
                const result = parseElementAttributes(el);
                expect(result.minHeight).toBe('150px');
            });

            test('should parse lx-animate attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'skeleton', 'lx-animate': 'true' });
                const result = parseElementAttributes(el);
                expect(result.animate).toBe(true);
            });

            test('should parse lx-animate="false"', () => {
                const el = createMockElement({ 'lx-strategy': 'skeleton', 'lx-animate': 'false' });
                const result = parseElementAttributes(el);
                expect(result.animate).toBe(false);
            });

            test('should parse lx-loading attribute', () => {
                const el = createMockElement({ 'lx-loading': 'true' });
                const result = parseElementAttributes(el);
                expect(result.loading).toBe(true);
            });
        });

        describe('Priority and precedence', () => {
            test('should prioritize JSON config over HTML attribute', () => {
                const el = createMockElement({ 'lx-config': '{"strategy":"skeleton"}', 'lx-strategy': 'spinner' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('skeleton');
            });

            test('should prioritize HTML attribute over data attribute', () => {
                const el = createMockElement({ 'lx-strategy': 'spinner', 'data-lx-strategy': 'skeleton' });
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should prioritize data attribute over CSS class', () => {
                const el = createMockElement({ 'data-lx-strategy': 'progress' }, 'lx-skeleton');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
            });

            test('should use CSS class when no higher priority attribute exists', () => {
                const el = createMockElement({}, 'btn lx-fade');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('fade');
            });
        });

        describe('Edge cases', () => {
            test('should return default for null element', () => {
                const result = parseElementAttributes(null);
                expect(result.strategy).toBe('spinner');
            });

            test('should return default for undefined element', () => {
                const result = parseElementAttributes(undefined);
                expect(result.strategy).toBe('spinner');
            });

            test('should return default for element with no lx attributes', () => {
                const el = createMockElement({}, 'btn primary');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should handle element with empty className', () => {
                const el = createMockElement({ 'lx-strategy': 'progress' }, '');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('progress');
            });

            test('should ignore non-numeric duration values', () => {
                const el = createMockElement({ 'lx-strategy': 'spinner', 'lx-duration': 'fast' });
                const result = parseElementAttributes(el);
                expect(result.duration).toBeUndefined();
            });

            test('should ignore non-numeric value attributes', () => {
                const el = createMockElement({ 'lx-strategy': 'progress', 'lx-value': 'half' });
                const result = parseElementAttributes(el);
                expect(result.value).toBeUndefined();
            });
        });

        describe('Multiple strategies on same element', () => {
            test('should handle both lx-strategy and lx-* class', () => {
                const el = createMockElement({ 'lx-strategy': 'spinner' }, 'lx-skeleton');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('spinner');
            });

            test('should handle colon syntax with other classes', () => {
                const el = createMockElement({}, 'btn primary lx:fade:300');
                const result = parseElementAttributes(el);
                expect(result.strategy).toBe('fade');
                expect(result.duration).toBe(300);
            });
        });
    });
});
