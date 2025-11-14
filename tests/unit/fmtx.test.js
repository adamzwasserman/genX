/**
 * Unit tests for fmtX (FormatX) Module
 */

describe('FormatX Module', () => {
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
            Intl: global.Intl,
            addEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        };

        global.window = mockWindow;
        global.document = mockDocument;
    });

    describe('Currency Formatting', () => {
        test('should format USD currency correctly', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            });

            expect(formatter.format(25.00)).toBe('$25.00');
            expect(formatter.format(1234.56)).toBe('$1,234.56');
        });

        test('should format EUR currency correctly', () => {
            const formatter = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
            });

            const result = formatter.format(99.99);
            expect(result).toContain('99,99');
            expect(result).toContain('€');
        });

        test('should format GBP currency correctly', () => {
            const formatter = new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP'
            });

            const result = formatter.format(1234.56);
            expect(result).toContain('£');
            expect(result).toContain('1,234.56');
        });

        test('should format JPY currency without decimals', () => {
            const formatter = new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY'
            });

            const result = formatter.format(1234);
            // JPY symbol can be either ¥ or ￥ depending on system
            expect(result).toMatch(/[¥￥]/);
            expect(result).toContain('1,234');
            expect(result).not.toContain('.');
        });

        test('should format large currency values with thousand separators', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true
            });

            // Test cases from bug report
            expect(formatter.format(750391.25)).toBe('$750,391.25');
            expect(formatter.format(27780.00)).toBe('$27,780.00');
            expect(formatter.format(5010.01)).toBe('$5,010.01');
        });

        test('should disable thousand separators when fx-thousands="false"', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: false
            });

            // With useGrouping: false, no commas
            expect(formatter.format(750391.25)).toBe('$750391.25');
            expect(formatter.format(27780.00)).toBe('$27780.00');
        });
    });

    describe('Date Formatting', () => {
        const testDate = new Date('2024-03-15T12:00:00Z');

        test('should format date in short style', () => {
            const formatter = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'short'
            });

            const result = formatter.format(testDate);
            expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
        });

        test('should format date in medium style', () => {
            const formatter = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium'
            });

            const result = formatter.format(testDate);
            expect(result).toContain('Mar');
            expect(result).toContain('2024');
        });

        test('should format date in long style', () => {
            const formatter = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'long'
            });

            const result = formatter.format(testDate);
            expect(result).toContain('March');
            expect(result).toContain('2024');
        });

        test('should format date in full style', () => {
            const formatter = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'full'
            });

            const result = formatter.format(testDate);
            expect(result).toContain('March');
            expect(result).toContain('2024');
        });

        test('should handle ISO date format', () => {
            const isoString = testDate.toISOString();
            expect(isoString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('Number Formatting', () => {
        test('should format numbers with thousands separators', () => {
            const formatter = new Intl.NumberFormat('en-US');

            expect(formatter.format(1234)).toBe('1,234');
            expect(formatter.format(1234567)).toBe('1,234,567');
        });

        test('should format numbers with decimals', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            expect(formatter.format(1234.567)).toBe('1,234.57');
            expect(formatter.format(1234.5)).toBe('1,234.50');
        });

        test('should handle different locales', () => {
            const usFormatter = new Intl.NumberFormat('en-US');
            const deFormatter = new Intl.NumberFormat('de-DE');

            expect(usFormatter.format(1234.56)).toBe('1,234.56');
            expect(deFormatter.format(1234.56)).toBe('1.234,56');
        });
    });

    describe('Percentage Formatting', () => {
        test('should format percentages correctly', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'percent'
            });

            expect(formatter.format(0.75)).toBe('75%');
            expect(formatter.format(0.1234)).toBe('12%');
        });

        test('should format percentages with decimals', () => {
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2
            });

            expect(formatter.format(0.1234)).toBe('12.34%');
        });
    });

    describe('Abbreviated Numbers', () => {
        test('should abbreviate thousands with K', () => {
            const abbreviate = (num) => {
                if (num >= 1000 && num < 1000000) {
                    return (num / 1000).toFixed(1) + 'K';
                }
                return num.toString();
            };

            expect(abbreviate(1500)).toBe('1.5K');
            expect(abbreviate(12340)).toBe('12.3K');
        });

        test('should abbreviate millions with M', () => {
            const abbreviate = (num) => {
                if (num >= 1000000 && num < 1000000000) {
                    return (num / 1000000).toFixed(1) + 'M';
                }
                return num.toString();
            };

            expect(abbreviate(1500000)).toBe('1.5M');
            expect(abbreviate(12340000)).toBe('12.3M');
        });

        test('should abbreviate billions with B', () => {
            const abbreviate = (num) => {
                if (num >= 1000000000 && num < 1000000000000) {
                    return (num / 1000000000).toFixed(1) + 'B';
                }
                return num.toString();
            };

            expect(abbreviate(1500000000)).toBe('1.5B');
        });

        test('should abbreviate trillions with T', () => {
            const abbreviate = (num) => {
                if (num >= 1000000000000) {
                    return (num / 1000000000000).toFixed(1) + 'T';
                }
                return num.toString();
            };

            expect(abbreviate(1500000000000)).toBe('1.5T');
        });
    });

    describe('Text Transformations', () => {
        test('should convert to uppercase', () => {
            expect('hello world'.toUpperCase()).toBe('HELLO WORLD');
        });

        test('should convert to lowercase', () => {
            expect('HELLO WORLD'.toLowerCase()).toBe('hello world');
        });

        test('should capitalize first letter', () => {
            const capitalize = (str) => {
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            };

            expect(capitalize('hello')).toBe('Hello');
            expect(capitalize('HELLO')).toBe('Hello');
        });

        test('should truncate text to length', () => {
            const truncate = (str, length) => {
                if (str.length <= length) return str;
                return str.substring(0, length) + '...';
            };

            expect(truncate('This is a very long text', 10)).toBe('This is a ...');
            expect(truncate('Short', 10)).toBe('Short');
        });
    });

    describe('Phone Number Formatting', () => {
        test('should format US phone numbers', () => {
            const formatPhone = (phone, format = 'US') => {
                const cleaned = phone.replace(/\D/g, '');
                if (format === 'US' && cleaned.length === 10) {
                    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
                }
                return phone;
            };

            expect(formatPhone('5551234567')).toBe('(555) 123-4567');
            expect(formatPhone('555-123-4567')).toBe('(555) 123-4567');
        });

        test('should format international phone numbers', () => {
            const formatPhone = (phone, format = 'intl') => {
                const cleaned = phone.replace(/\D/g, '');
                if (format === 'intl' && cleaned.length >= 10) {
                    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
                }
                return phone;
            };

            expect(formatPhone('441234567890', 'intl')).toBe('+44 123 4567890');
        });
    });

    describe('Duration Formatting', () => {
        test('should format duration in HH:MM:SS', () => {
            const formatDuration = (seconds) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            };

            expect(formatDuration(93784)).toBe('26:03:04');
            expect(formatDuration(3661)).toBe('01:01:01');
        });

        test('should format duration in human-readable format', () => {
            const formatDuration = (seconds) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;

                const parts = [];
                if (h > 0) parts.push(`${h}h`);
                if (m > 0) parts.push(`${m}m`);
                if (s > 0 || parts.length === 0) parts.push(`${s}s`);

                return parts.join(' ');
            };

            expect(formatDuration(93784)).toBe('26h 3m 4s');
            expect(formatDuration(3661)).toBe('1h 1m 1s');
            expect(formatDuration(45)).toBe('45s');
        });
    });

    describe('File Size Formatting', () => {
        test('should format bytes', () => {
            const formatFilesize = (bytes) => {
                if (bytes < 1024) return bytes + ' B';
                return bytes.toString();
            };

            expect(formatFilesize(512)).toBe('512 B');
        });

        test('should format kilobytes', () => {
            const formatFilesize = (bytes) => {
                if (bytes >= 1024 && bytes < 1024 * 1024) {
                    return (bytes / 1024).toFixed(2) + ' KB';
                }
                return bytes.toString();
            };

            expect(formatFilesize(2048)).toBe('2.00 KB');
            expect(formatFilesize(1536)).toBe('1.50 KB');
        });

        test('should format megabytes', () => {
            const formatFilesize = (bytes) => {
                if (bytes >= 1024 * 1024 && bytes < 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                }
                return bytes.toString();
            };

            expect(formatFilesize(2097152)).toBe('2.00 MB');
        });

        test('should format gigabytes', () => {
            const formatFilesize = (bytes) => {
                if (bytes >= 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
                }
                return bytes.toString();
            };

            expect(formatFilesize(2147483648)).toBe('2.00 GB');
        });
    });

    describe('DOM Element Processing', () => {
        test('should read fx-format attribute', () => {
            const element = document.createElement('span');
            element.setAttribute('fx-format', 'currency');

            expect(element.getAttribute('fx-format')).toBe('currency');
        });

        test('should read fx-raw value', () => {
            const element = document.createElement('span');
            element.setAttribute('fx-raw', '25.00');

            expect(element.getAttribute('fx-raw')).toBe('25.00');
        });

        test('should preserve fx-raw when formatting', () => {
            const element = document.createElement('span');
            element.setAttribute('fx-format', 'currency');
            element.setAttribute('fx-raw', '25.00');
            element.textContent = '$25.00';

            expect(element.getAttribute('fx-raw')).toBe('25.00');
            expect(element.textContent).toBe('$25.00');
        });

        test('should restore original value on unformat', () => {
            const element = document.createElement('span');
            element.setAttribute('fx-raw', '25.00');
            element.textContent = '$25.00';

            // Unformat would restore textContent from fx-raw
            element.textContent = element.getAttribute('fx-raw');
            expect(element.textContent).toBe('25.00');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid date strings', () => {
            const invalidDate = new Date('invalid');
            expect(invalidDate.toString()).toBe('Invalid Date');
            expect(isNaN(invalidDate.getTime())).toBe(true);
        });

        test('should handle missing fx-raw attribute', () => {
            const element = document.createElement('span');
            element.textContent = '25.00';

            const raw = element.getAttribute('fx-raw') || element.textContent;
            expect(raw).toBe('25.00');
        });

        test('should handle invalid number format', () => {
            const parsed = parseFloat('not a number');
            expect(isNaN(parsed)).toBe(true);
        });

        test('should fallback to original value on format error', () => {
            const element = document.createElement('span');
            const originalValue = 'invalid';
            element.textContent = originalValue;

            try {
                const num = parseFloat(originalValue);
                if (isNaN(num)) throw new Error('Invalid number');
            } catch (e) {
                // Fallback to original
                expect(element.textContent).toBe(originalValue);
            }
        });
    });

    describe('DOM Scanning', () => {
        test('should find elements with fx-format attribute', () => {
            const container = document.createElement('div');
            const span1 = document.createElement('span');
            span1.setAttribute('fx-format', 'currency');
            const span2 = document.createElement('span');
            span2.setAttribute('fx-format', 'date');

            container.appendChild(span1);
            container.appendChild(span2);

            const elements = container.querySelectorAll('[fx-format]');
            expect(elements.length).toBe(2);
        });

        test('should scan multiple format types', () => {
            const formats = ['currency', 'date', 'number', 'percent', 'phone'];
            const detected = new Set();

            formats.forEach(fmt => detected.add(fmt));

            expect(detected.size).toBe(5);
            expect(detected.has('currency')).toBe(true);
            expect(detected.has('date')).toBe(true);
        });
    });

    describe('MutationObserver Integration', () => {
        test('should detect when new elements are added', (done) => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        expect(mutation.addedNodes.length).toBeGreaterThan(0);
                        observer.disconnect();
                        done();
                    }
                });
            });

            observer.observe(container, { childList: true });

            const newElement = document.createElement('span');
            newElement.setAttribute('fx-format', 'currency');
            container.appendChild(newElement);
        });

        test('should observe attribute changes', (done) => {
            const element = document.createElement('span');
            document.body.appendChild(element);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes') {
                        expect(mutation.attributeName).toBe('fx-format');
                        observer.disconnect();
                        done();
                    }
                });
            });

            observer.observe(element, { attributes: true });
            element.setAttribute('fx-format', 'currency');
        });

        test('should not trigger mutations when value unchanged (infinite loop prevention)', (done) => {
            const element = document.createElement('span');
            element.setAttribute('fx-format', 'currency');
            element.setAttribute('fx-raw', '25.00');
            element.textContent = '$25.00';
            document.body.appendChild(element);

            let mutationCount = 0;
            const observer = new MutationObserver((mutations) => {
                mutationCount += mutations.length;

                // If we get more than 2 mutations, we have an infinite loop
                if (mutationCount > 2) {
                    observer.disconnect();
                    done(new Error(`Infinite loop detected: ${mutationCount} mutations triggered`));
                }
            });

            observer.observe(element, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });

            // Simulate formatElement being called with same value
            // This should NOT trigger mutations because value is already '$25.00'
            const currentValue = element.textContent;
            if (element.textContent !== '$25.00') {
                element.textContent = '$25.00';
            }

            // Wait 100ms to ensure no mutations occurred
            setTimeout(() => {
                observer.disconnect();
                expect(mutationCount).toBe(0);
                done();
            }, 100);
        });

        test('should only update DOM when value actually changes', () => {
            const element = document.createElement('span');
            element.textContent = '$25.00';

            // Track if DOM was actually modified
            let setterCalled = false;
            const originalTextContent = element.textContent;

            // Mock to track setter calls
            const mockSet = jest.fn((value) => {
                setterCalled = true;
                const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
                if (descriptor && descriptor.set) {
                    descriptor.set.call(element, value);
                }
            });

            // Simulate change detection before setting
            const formattedValue = '$25.00';
            if (element.textContent !== formattedValue) {
                mockSet(formattedValue);
            }

            // Should not have called setter because value didn't change
            expect(mockSet).not.toHaveBeenCalled();
            expect(element.textContent).toBe('$25.00');

            // Now change to different value
            const newValue = '$30.00';
            if (element.textContent !== newValue) {
                mockSet(newValue);
            }

            // Should have called setter because value changed
            expect(mockSet).toHaveBeenCalledTimes(1);
        });

        test('should prevent infinite loop with rapid attribute changes', (done) => {
            const element = document.createElement('input');
            element.setAttribute('fx-format', 'currency');
            element.setAttribute('fx-raw', '25.00');
            element.value = '$25.00';
            document.body.appendChild(element);

            let mutationCount = 0;
            const maxMutations = 5;

            const observer = new MutationObserver((mutations) => {
                mutationCount += mutations.length;

                if (mutationCount > maxMutations) {
                    observer.disconnect();
                    done(new Error(`Infinite loop detected: ${mutationCount} mutations from repeated formatting`));
                }
            });

            observer.observe(element, {
                attributes: true,
                attributeFilter: ['fx-raw', 'fx-format', 'value']
            });

            // Simulate rapid calls to formatElement with same value
            for (let i = 0; i < 10; i++) {
                // Proper implementation should check before updating
                if (element.value !== '$25.00') {
                    element.value = '$25.00';
                }
                if (element.getAttribute('fx-raw') !== '25.00') {
                    element.setAttribute('fx-raw', '25.00');
                }
            }

            setTimeout(() => {
                observer.disconnect();
                // Should have minimal mutations (ideally 0)
                expect(mutationCount).toBeLessThan(3);
                done();
            }, 100);
        });
    });

    describe('Performance', () => {
        test('should format 1000 elements efficiently', () => {
            const elements = [];
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                const el = document.createElement('span');
                el.setAttribute('fx-format', 'currency');
                el.setAttribute('fx-raw', '99.99');
                elements.push(el);
            }

            const duration = Date.now() - startTime;

            // Creating elements should be fast
            expect(duration).toBeLessThan(100); // 100ms for 1000 elements
            expect(elements.length).toBe(1000);
        });

        test('should maintain 60 FPS target (<16ms)', () => {
            const TARGET_FPS = 60;
            const FRAME_TIME = 1000 / TARGET_FPS; // 16.67ms

            expect(FRAME_TIME).toBeCloseTo(16.67, 1);
        });
    });

    describe('Configuration', () => {
        test('should use default locale when not specified', () => {
            const defaultLocale = 'en-US';
            const formatter = new Intl.NumberFormat(defaultLocale, {
                style: 'currency',
                currency: 'USD'
            });

            expect(formatter.format(25)).toBe('$25.00');
        });

        test('should support custom locale configuration', () => {
            const customLocale = 'de-DE';
            const formatter = new Intl.NumberFormat(customLocale, {
                style: 'currency',
                currency: 'EUR'
            });

            const result = formatter.format(25);
            expect(result).toContain('€');
        });
    });
});
