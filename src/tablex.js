/**
 * tableX - Declarative Table Enhancements
 * Part of genx.software declarative web platform
 *
 * Provides declarative table enhancements through `tx-*` attributes:
 * - Column sorting with tx-sortable
 * - Client-side pagination with tx-paginate
 * - Responsive layouts with tx-responsive
 * - Virtual scrolling with tx-virtual
 *
 * @module tableX
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ====================
    // STATE MANAGEMENT
    // ====================

    // WeakMap for table states (automatic GC when table removed)
    const tableStates = new WeakMap();

    /**
     * Create immutable table state
     * @param {HTMLTableElement} table - Table element
     * @param {Object} config - Table configuration
     * @returns {Object} Frozen state object
     */
    const createTableState = (table, config) => Object.freeze({
        table,
        config: Object.freeze(config),
        sortState: Object.freeze({
            column: null,
            direction: null, // 'asc', 'desc', or null
            type: null       // 'string', 'number', 'date'
        }),
        originalRowOrder: null // Will store original DOM order
    });

    /**
     * Update table state (returns new frozen state)
     * @param {Object} state - Current state
     * @param {Object} updates - Updates to apply
     * @returns {Object} New frozen state
     */
    const updateState = (state, updates) => {
        const newSortState = updates.sortState
            ? Object.freeze({...state.sortState, ...updates.sortState})
            : state.sortState;

        return Object.freeze({
            ...state,
            ...updates,
            sortState: newSortState
        });
    };

    // ====================
    // DATA TYPE DETECTION
    // ====================

    /**
     * Detect data type from sample values
     * @param {Array<string>} values - Sample values to analyze
     * @returns {string} Detected type: 'number', 'date', or 'string'
     */
    const detectDataType = (values) => {
        // Filter out empty values
        const nonEmpty = values.filter(v => v && String(v).trim() !== '');
        if (nonEmpty.length === 0) {
            return 'string';
        }

        // Sample first 10 values for performance
        const samples = nonEmpty.slice(0, Math.min(10, nonEmpty.length));

        // Check if all samples are valid numbers
        const allNumbers = samples.every(v => {
            const num = Number(v);
            return !isNaN(num) && isFinite(num);
        });
        if (allNumbers) {
            return 'number';
        }

        // Check if all samples are valid dates
        const allDates = samples.every(v => {
            const date = new Date(v);
            return !isNaN(date.getTime());
        });
        if (allDates) {
            return 'date';
        }

        // Default to string
        return 'string';
    };

    // ====================
    // COMPARATOR FUNCTIONS
    // ====================

    /**
     * Comparator functions for different data types
     * All comparators are pure functions: no side effects, stable results
     */
    const comparators = {
        /**
         * String comparator (case-insensitive)
         * @param {*} a - First value
         * @param {*} b - Second value
         * @returns {number} Comparison result (-1, 0, 1)
         */
        string: (a, b) => {
            const aStr = String(a || '').toLowerCase();
            const bStr = String(b || '').toLowerCase();
            return aStr.localeCompare(bStr);
        },

        /**
         * Number comparator
         * @param {*} a - First value
         * @param {*} b - Second value
         * @returns {number} Comparison result
         */
        number: (a, b) => {
            const aNum = Number(a);
            const bNum = Number(b);

            // Handle NaN values (put them at the end)
            if (isNaN(aNum) && isNaN(bNum)) {
                return 0;
            }
            if (isNaN(aNum)) {
                return 1;
            }
            if (isNaN(bNum)) {
                return -1;
            }

            return aNum - bNum;
        },

        /**
         * Date comparator
         * @param {*} a - First value
         * @param {*} b - Second value
         * @returns {number} Comparison result
         */
        date: (a, b) => {
            const aDate = new Date(a);
            const bDate = new Date(b);

            // Handle invalid dates (put them at the end)
            const aValid = !isNaN(aDate.getTime());
            const bValid = !isNaN(bDate.getTime());

            if (!aValid && !bValid) {
                return 0;
            }
            if (!aValid) {
                return 1;
            }
            if (!bValid) {
                return -1;
            }

            return aDate - bDate;
        }
    };

    // ====================
    // ROW EXTRACTION & SORTING
    // ====================

    /**
     * Extract cell value (supports data-value attribute)
     * @param {HTMLTableCellElement} cell - Table cell
     * @returns {string} Cell value
     */
    const getCellValue = (cell) => {
        // Prefer data-value attribute for sortable values
        if (cell.dataset.value !== undefined) {
            return cell.dataset.value;
        }
        return cell.textContent.trim();
    };

    /**
     * Extract column values for type detection
     * @param {HTMLTableElement} table - Table element
     * @param {number} columnIndex - Column index
     * @returns {Array<string>} Array of column values
     */
    const getColumnValues = (table, columnIndex) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return [];
        }

        const rows = tbody.querySelectorAll('tr');
        return Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td, th');
            return cells[columnIndex] ? getCellValue(cells[columnIndex]) : '';
        });
    };

    /**
     * Sort table rows (pure function - returns new array)
     * @param {Array<HTMLTableRowElement>} rows - Rows to sort
     * @param {number} columnIndex - Column to sort by
     * @param {string} direction - 'asc' or 'desc'
     * @param {string} type - Data type: 'string', 'number', 'date'
     * @returns {Array<HTMLTableRowElement>} Sorted array
     */
    const sortRows = (rows, columnIndex, direction, type) => {
        const compareFn = comparators[type] || comparators.string;

        // Create array of [row, value] pairs
        const rowsWithValues = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td, th');
            const cell = cells[columnIndex];
            const value = cell ? getCellValue(cell) : '';
            return { row, value };
        });

        // Sort the pairs
        rowsWithValues.sort((a, b) => {
            const result = compareFn(a.value, b.value);
            return direction === 'desc' ? -result : result;
        });

        // Return sorted rows
        return rowsWithValues.map(item => item.row);
    };

    // ====================
    // DOM MANIPULATION
    // ====================

    /**
     * Apply sorted rows to table (batch DOM update)
     * @param {HTMLTableElement} table - Table element
     * @param {Array<HTMLTableRowElement>} sortedRows - Sorted rows
     */
    const applySort = (table, sortedRows) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        // Use DocumentFragment for efficient batch update
        const fragment = document.createDocumentFragment();
        sortedRows.forEach(row => fragment.appendChild(row));

        // Single DOM update
        tbody.appendChild(fragment);
    };

    /**
     * Restore original row order
     * @param {HTMLTableElement} table - Table element
     * @param {Array<HTMLTableRowElement>} originalRows - Original row order
     */
    const restoreOriginalOrder = (table, originalRows) => {
        if (!originalRows || originalRows.length === 0) {
            return;
        }
        applySort(table, originalRows);
    };

    // ====================
    // VISUAL INDICATORS
    // ====================

    /**
     * Update sort indicators on table headers
     * @param {HTMLTableElement} table - Table element
     * @param {number} columnIndex - Active column index
     * @param {string|null} direction - Sort direction or null
     */
    const updateSortIndicators = (table, columnIndex, direction) => {
        const thead = table.querySelector('thead');
        if (!thead) {
            return;
        }

        const headers = thead.querySelectorAll('th');

        headers.forEach((th, index) => {
            // Remove all sort classes
            th.classList.remove('tx-sort-asc', 'tx-sort-desc', 'tx-sort-active');

            // Update ARIA attribute
            if (index === columnIndex && direction) {
                th.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
                th.classList.add('tx-sort-active');
                th.classList.add(direction === 'asc' ? 'tx-sort-asc' : 'tx-sort-desc');
            } else {
                th.setAttribute('aria-sort', 'none');
            }
        });
    };

    /**
     * Clear all sort indicators
     * @param {HTMLTableElement} table - Table element
     */
    const clearSortIndicators = (table) => {
        const thead = table.querySelector('thead');
        if (!thead) {
            return;
        }

        thead.querySelectorAll('th').forEach(th => {
            th.classList.remove('tx-sort-asc', 'tx-sort-desc', 'tx-sort-active');
            th.setAttribute('aria-sort', 'none');
        });
    };

    // ====================
    // ARIA LIVE REGIONS
    // ====================

    /**
     * Get or create ARIA live region for announcements
     * @param {HTMLTableElement} table - Table element
     * @returns {HTMLElement} Live region element
     */
    const getLiveRegion = (table) => {
        let liveRegion = table.querySelector('.tx-sr-only');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.className = 'tx-sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
            table.parentNode.insertBefore(liveRegion, table);
        }

        return liveRegion;
    };

    /**
     * Announce sort change to screen readers
     * @param {HTMLTableElement} table - Table element
     * @param {string} columnName - Column name
     * @param {string} direction - Sort direction
     */
    const announceSortChange = (table, columnName, direction) => {
        const liveRegion = getLiveRegion(table);
        const message = direction
            ? `Sorted by ${columnName} in ${direction === 'asc' ? 'ascending' : 'descending'} order`
            : 'Sort cleared';

        liveRegion.textContent = message;
    };

    // ====================
    // SORT HANDLER
    // ====================

    /**
     * Handle sort click on table header
     * @param {HTMLTableElement} table - Table element
     * @param {number} columnIndex - Column index
     */
    const handleSort = (table, columnIndex) => {
        let state = tableStates.get(table);
        if (!state) {
            return;
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        // Store original order on first sort
        if (!state.originalRowOrder) {
            state = updateState(state, {
                originalRowOrder: Array.from(tbody.querySelectorAll('tr'))
            });
            tableStates.set(table, state);
        }

        const currentColumn = state.sortState.column;
        const currentDirection = state.sortState.direction;

        let newDirection;

        if (currentColumn === columnIndex) {
            // Toggle through states: null -> asc -> desc -> null
            if (currentDirection === null) {
                newDirection = 'asc';
            } else if (currentDirection === 'asc') {
                newDirection = 'desc';
            } else {
                newDirection = null;
            }
        } else {
            // New column, start with ascending
            newDirection = 'asc';
        }

        // If direction is null, restore original order
        if (newDirection === null) {
            restoreOriginalOrder(table, state.originalRowOrder);
            clearSortIndicators(table);

            // Update state
            state = updateState(state, {
                sortState: {
                    column: null,
                    direction: null,
                    type: null
                }
            });
            tableStates.set(table, state);

            // Announce change
            const th = table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')');
            const columnName = th ? th.textContent.trim() : 'column ' + (columnIndex + 1);
            announceSortChange(table, columnName, null);

            return;
        }

        // Detect data type
        const values = getColumnValues(table, columnIndex);
        const type = detectDataType(values);

        // Get current rows
        const currentRows = Array.from(tbody.querySelectorAll('tr'));

        // Sort rows
        const sortedRows = sortRows(currentRows, columnIndex, newDirection, type);

        // Apply to DOM
        applySort(table, sortedRows);

        // Update visual indicators
        updateSortIndicators(table, columnIndex, newDirection);

        // Update state
        state = updateState(state, {
            sortState: {
                column: columnIndex,
                direction: newDirection,
                type
            }
        });
        tableStates.set(table, state);

        // Announce change
        const th = table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')');
        const columnName = th ? th.textContent.trim() : 'column ' + (columnIndex + 1);
        announceSortChange(table, columnName, newDirection);
    };

    // ====================
    // INITIALIZATION
    // ====================

    /**
     * Initialize sorting on a table
     * @param {HTMLTableElement} table - Table element
     */
    const initTableSort = (table) => {
        if (tableStates.has(table)) {
            return; // Already initialized
        }

        // Create initial state
        const state = createTableState(table, { sortable: true });
        tableStates.set(table, state);

        // Find sortable headers
        const thead = table.querySelector('thead');
        if (!thead) {
            return;
        }

        const headers = thead.querySelectorAll('th');

        headers.forEach((th, index) => {
            // Check if this header is sortable
            const isSortable = th.hasAttribute('tx-sortable') ||
                             table.hasAttribute('tx-sortable');

            if (isSortable) {
                // Make header clickable
                th.style.cursor = 'pointer';
                th.setAttribute('aria-sort', 'none');
                th.setAttribute('role', 'columnheader');

                // Add click handler
                th.addEventListener('click', () => handleSort(table, index));

                // Add visual hint class
                th.classList.add('tx-sortable');
            }
        });
    };

    /**
     * Initialize all sortable tables on the page
     */
    const initAll = () => {
        // Find tables with tx-sortable attribute
        const tables = document.querySelectorAll('table[tx-sortable]');
        tables.forEach(initTableSort);

        // Also find tables with individual sortable headers
        const tablesWithSortableHeaders = document.querySelectorAll('table:has(th[tx-sortable])');
        tablesWithSortableHeaders.forEach(initTableSort);
    };

    // ====================
    // PUBLIC API
    // ====================

    const tableX = {
        /**
         * Initialize sorting on specific table
         * @param {HTMLTableElement} table - Table element
         */
        init: initTableSort,

        /**
         * Initialize all sortable tables
         */
        initAll,

        /**
         * Get table state (for debugging)
         * @param {HTMLTableElement} table - Table element
         * @returns {Object} Table state
         */
        getState: (table) => tableStates.get(table),

        // Export internals for testing
        _internals: {
            comparators,
            detectDataType,
            sortRows,
            getCellValue
        }
    };

    // ====================
    // AUTO-INITIALIZATION
    // ====================

    if (typeof window !== 'undefined') {
        // Export to window
        window.tableX = tableX;

        // Auto-initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            // DOM already loaded
            initAll();
        }
    }

    // ====================
    // MODULE EXPORTS
    // ====================

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = tableX;
    }

})();
