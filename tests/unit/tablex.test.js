/**
 * tableX Unit Tests
 * Tests for column sorting functionality
 */

const tableX = require('../../src/tablex.js');

describe('tableX - Column Sorting', () => {
    describe('Comparators', () => {
        const { comparators } = tableX._internals;

        describe('string comparator', () => {
            it('compares strings case-insensitively', () => {
                expect(comparators.string('apple', 'Banana')).toBeLessThan(0);
                expect(comparators.string('Banana', 'apple')).toBeGreaterThan(0);
                expect(comparators.string('apple', 'Apple')).toBe(0);
            });

            it('handles empty strings', () => {
                expect(comparators.string('', 'test')).toBeLessThan(0);
                expect(comparators.string('test', '')).toBeGreaterThan(0);
                expect(comparators.string('', '')).toBe(0);
            });

            it('handles null and undefined', () => {
                expect(comparators.string(null, 'test')).toBeLessThan(0);
                expect(comparators.string(undefined, 'test')).toBeLessThan(0);
                expect(comparators.string(null, null)).toBe(0);
            });

            it('uses locale-aware sorting', () => {
                expect(comparators.string('ä', 'z')).toBeLessThan(0);
            });
        });

        describe('number comparator', () => {
            it('compares numbers correctly', () => {
                expect(comparators.number(10, 2)).toBeGreaterThan(0);
                expect(comparators.number(2, 10)).toBeLessThan(0);
                expect(comparators.number(5, 5)).toBe(0);
            });

            it('handles string numbers', () => {
                expect(comparators.number('10', '2')).toBeGreaterThan(0);
                expect(comparators.number('2', '10')).toBeLessThan(0);
            });

            it('handles negative numbers', () => {
                expect(comparators.number(-5, 5)).toBeLessThan(0);
                expect(comparators.number(5, -5)).toBeGreaterThan(0);
            });

            it('handles decimals', () => {
                expect(comparators.number(1.5, 1.2)).toBeGreaterThan(0);
                expect(comparators.number(1.2, 1.5)).toBeLessThan(0);
            });

            it('places NaN values at end', () => {
                expect(comparators.number('abc', 5)).toBeGreaterThan(0);
                expect(comparators.number(5, 'abc')).toBeLessThan(0);
                expect(comparators.number('abc', 'def')).toBe(0);
            });
        });

        describe('date comparator', () => {
            it('compares dates chronologically', () => {
                expect(comparators.date('2024-01-01', '2024-12-31')).toBeLessThan(0);
                expect(comparators.date('2024-12-31', '2024-01-01')).toBeGreaterThan(0);
                expect(comparators.date('2024-01-01', '2024-01-01')).toBe(0);
            });

            it('handles different date formats', () => {
                expect(comparators.date('1/1/2024', '12/31/2024')).toBeLessThan(0);
                expect(comparators.date('Jan 1, 2024', 'Dec 31, 2024')).toBeLessThan(0);
            });

            it('places invalid dates at end', () => {
                expect(comparators.date('invalid', '2024-01-01')).toBeGreaterThan(0);
                expect(comparators.date('2024-01-01', 'invalid')).toBeLessThan(0);
                expect(comparators.date('invalid', 'also invalid')).toBe(0);
            });
        });
    });

    describe('Data Type Detection', () => {
        const { detectDataType } = tableX._internals;

        it('detects number columns', () => {
            expect(detectDataType(['1', '2', '10', '100'])).toBe('number');
            expect(detectDataType(['1.5', '2.3', '10.1'])).toBe('number');
        });

        it('detects date columns', () => {
            expect(detectDataType(['2024-01-01', '2024-12-31'])).toBe('date');
            expect(detectDataType(['1/1/2024', '12/31/2024'])).toBe('date');
            expect(detectDataType(['Jan 1, 2024', 'Dec 31, 2024'])).toBe('date');
        });

        it('defaults to string for mixed content', () => {
            expect(detectDataType(['abc', 'def', 'ghi'])).toBe('string');
            expect(detectDataType(['1', 'abc', '3'])).toBe('string');
        });

        it('handles empty arrays', () => {
            expect(detectDataType([])).toBe('string');
        });

        it('ignores empty values when detecting type', () => {
            expect(detectDataType(['', '1', '2', ''])).toBe('number');
            expect(detectDataType(['', '', ''])).toBe('string');
        });

        it('samples only first 10 values for performance', () => {
            const manyNumbers = Array.from({length: 20}, (_, i) => String(i));
            expect(detectDataType(manyNumbers)).toBe('number');
        });
    });

    describe('Cell Value Extraction', () => {
        const { getCellValue } = tableX._internals;

        let cell;

        beforeEach(() => {
            cell = document.createElement('td');
        });

        it('extracts text content', () => {
            cell.textContent = '  Test Value  ';
            expect(getCellValue(cell)).toBe('Test Value');
        });

        it('prefers data-value attribute', () => {
            cell.textContent = 'Display Text';
            cell.dataset.value = 'sort-value';
            expect(getCellValue(cell)).toBe('sort-value');
        });

        it('handles empty cells', () => {
            expect(getCellValue(cell)).toBe('');
        });
    });

    describe('Row Sorting', () => {
        const { sortRows } = tableX._internals;

        let rows;

        beforeEach(() => {
            // Create mock rows
            rows = [
                createRow(['Alice', '30', '2024-01-15']),
                createRow(['Bob', '25', '2024-02-20']),
                createRow(['Charlie', '35', '2024-01-10'])
            ];
        });

        it('sorts by string column ascending', () => {
            const sorted = sortRows(rows, 0, 'asc', 'string');
            expect(getCellText(sorted[0], 0)).toBe('Alice');
            expect(getCellText(sorted[1], 0)).toBe('Bob');
            expect(getCellText(sorted[2], 0)).toBe('Charlie');
        });

        it('sorts by string column descending', () => {
            const sorted = sortRows(rows, 0, 'desc', 'string');
            expect(getCellText(sorted[0], 0)).toBe('Charlie');
            expect(getCellText(sorted[1], 0)).toBe('Bob');
            expect(getCellText(sorted[2], 0)).toBe('Alice');
        });

        it('sorts by number column ascending', () => {
            const sorted = sortRows(rows, 1, 'asc', 'number');
            expect(getCellText(sorted[0], 1)).toBe('25');
            expect(getCellText(sorted[1], 1)).toBe('30');
            expect(getCellText(sorted[2], 1)).toBe('35');
        });

        it('sorts by number column descending', () => {
            const sorted = sortRows(rows, 1, 'desc', 'number');
            expect(getCellText(sorted[0], 1)).toBe('35');
            expect(getCellText(sorted[1], 1)).toBe('30');
            expect(getCellText(sorted[2], 1)).toBe('25');
        });

        it('sorts by date column ascending', () => {
            const sorted = sortRows(rows, 2, 'asc', 'date');
            expect(getCellText(sorted[0], 2)).toBe('2024-01-10');
            expect(getCellText(sorted[1], 2)).toBe('2024-01-15');
            expect(getCellText(sorted[2], 2)).toBe('2024-02-20');
        });

        it('does not mutate original array', () => {
            const original = rows.map(r => getCellText(r, 0));
            sortRows(rows, 0, 'asc', 'string');
            const afterSort = rows.map(r => getCellText(r, 0));
            expect(afterSort).toEqual(original);
        });

        it('handles empty rows', () => {
            const sorted = sortRows([], 0, 'asc', 'string');
            expect(sorted).toEqual([]);
        });
    });

    describe('Performance', () => {
        const { sortRows } = tableX._internals;

        it('sorts 100 rows in <5ms', () => {
            const rows = Array.from({length: 100}, (_, i) =>
                createRow([`Name${i}`, String(Math.random() * 100)])
            );

            const start = performance.now();
            sortRows(rows, 1, 'asc', 'number');
            const elapsed = performance.now() - start;

            expect(elapsed).toBeLessThan(5);
        });

        it('sorts 1000 rows in <32ms (architecture max)', () => {
            const rows = Array.from({length: 1000}, (_, i) =>
                createRow([`Name${i}`, String(Math.random() * 1000)])
            );

            const start = performance.now();
            sortRows(rows, 1, 'asc', 'number');
            const elapsed = performance.now() - start;

            // Architecture doc specifies <16ms target, 32ms maximum
            expect(elapsed).toBeLessThan(32);
        });
    });
});

// ====================
// TEST HELPERS
// ====================

/**
 * Create a mock table row
 * @param {Array<string>} cellValues - Cell values
 * @returns {HTMLTableRowElement} Mock row
 */
function createRow(cellValues) {
    const row = document.createElement('tr');

    cellValues.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
    });

    return row;
}

/**
 * Get cell text from row
 * @param {HTMLTableRowElement} row - Row element
 * @param {number} index - Cell index
 * @returns {string} Cell text
 */
function getCellText(row, index) {
    const cells = row.querySelectorAll('td, th');
    return cells[index] ? cells[index].textContent : '';
}
