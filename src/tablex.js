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
            columns: [], // Array of {column, direction, type} for multi-column sort
            column: null, // Primary sort column (for backwards compat)
            direction: null, // Primary sort direction (for backwards compat)
            type: null       // Primary sort type (for backwards compat)
        }),
        paginationState: Object.freeze({
            currentPage: 1,
            perPage: 10,
            totalRows: 0,
            totalPages: 0
        }),
        filterState: Object.freeze({
            query: '',
            filterColumns: [], // Array of column indices to filter
            visibleRows: null, // Array of visible row indices after filtering
            totalMatches: 0    // Number of rows matching filter
        }),
        originalRowOrder: null, // Will store original DOM order
        virtualScrollState: Object.freeze({
            enabled: false,
            scrollTop: 0,
            firstVisibleRow: 0,
            lastVisibleRow: 0,
            rowHeight: 50, // Default height in pixels
            buffer: 10, // Number of rows to render above/below viewport
            totalHeight: 0,
            visibleRowCount: 0,
            rowHeights: new Map(), // Cache for measured row heights (dynamic mode)
            observer: null, // IntersectionObserver instance
            scrollContainer: null // Virtual scroll container element
        })
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

        const newPaginationState = updates.paginationState
            ? Object.freeze({...state.paginationState, ...updates.paginationState})
            : state.paginationState;

        const newFilterState = updates.filterState
            ? Object.freeze({...state.filterState, ...updates.filterState})
            : state.filterState;

        const newVirtualScrollState = updates.virtualScrollState
            ? Object.freeze({...state.virtualScrollState, ...updates.virtualScrollState})
            : state.virtualScrollState;

        return Object.freeze({
            ...state,
            ...updates,
            sortState: newSortState,
            paginationState: newPaginationState,
            filterState: newFilterState,
            virtualScrollState: newVirtualScrollState
        });
    };

    // ====================
    // CONFIGURATION HELPER
    // ====================

    /**
     * Get table configuration value from cache or attribute
     * @param {HTMLElement} table - Table element
     * @param {string} attrName - Attribute name (e.g., 'tx-per-page')
     * @param {string} [defaultValue] - Default value if not found
     * @returns {string|null} Config value
     */
    const getTableConfig = (table, attrName, defaultValue) => {
        // Try to get config from bootloader cache first (if using genX bootloader)
        if (window.genx && window.genx.getConfig) {
            const cachedConfig = window.genx.getConfig(table);
            if (cachedConfig) {
                // Convert tx-per-page to perPage (camelCase)
                const key = attrName.replace('tx-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                if (cachedConfig[key] !== undefined) {
                    return String(cachedConfig[key]);
                }
            }
        }

        // Fallback to getAttribute (legacy standalone mode)
        const attrValue = table.getAttribute(attrName);
        return attrValue !== null ? attrValue : (defaultValue || null);
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
     * @param {number|Array} columnIndexOrColumns - Single column index OR array of {column, direction, type}
     * @param {string} direction - 'asc' or 'desc' (ignored if array provided)
     * @param {string} type - Data type: 'string', 'number', 'date' (ignored if array provided)
     * @returns {Array<HTMLTableRowElement>} Sorted array
     */
    const sortRows = (rows, columnIndexOrColumns, direction, type) => {
        // Support both single-column and multi-column sorting
        const columns = Array.isArray(columnIndexOrColumns)
            ? columnIndexOrColumns
            : [{ column: columnIndexOrColumns, direction, type }];

        if (columns.length === 0) {
            return Array.from(rows);
        }

        // Create array of [row, values[]] pairs
        const rowsWithValues = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td, th');
            const values = columns.map(col => {
                const cell = cells[col.column];
                return cell ? getCellValue(cell) : '';
            });
            return { row, values };
        });

        // Sort using multi-column comparison
        rowsWithValues.sort((a, b) => {
            // Compare each column in priority order
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const compareFn = comparators[col.type] || comparators.string;
                const result = compareFn(a.values[i], b.values[i]);

                if (result !== 0) {
                    return col.direction === 'desc' ? -result : result;
                }
                // If equal, continue to next column
            }
            return 0;
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
     * @param {number|Array} columnIndexOrColumns - Single column index OR array of {column, direction, type}
     * @param {string|null} direction - Sort direction or null (ignored if array provided)
     */
    const updateSortIndicators = (table, columnIndexOrColumns, direction) => {
        const thead = table.querySelector('thead');
        if (!thead) {
            return;
        }

        // Support both single-column and multi-column format
        const columns = Array.isArray(columnIndexOrColumns)
            ? columnIndexOrColumns
            : (direction ? [{ column: columnIndexOrColumns, direction }] : []);

        const headers = thead.querySelectorAll('th');

        headers.forEach((th, index) => {
            // Remove all sort classes and data attributes
            th.classList.remove('tx-sort-asc', 'tx-sort-desc', 'tx-sort-active');
            th.removeAttribute('data-sort-priority');

            // Check if this column is in the sort columns
            const sortIndex = columns.findIndex(col => col.column === index);

            if (sortIndex !== -1) {
                const col = columns[sortIndex];
                th.setAttribute('aria-sort', col.direction === 'asc' ? 'ascending' : 'descending');
                th.classList.add('tx-sort-active');
                th.classList.add(col.direction === 'asc' ? 'tx-sort-asc' : 'tx-sort-desc');

                // Add priority indicator for multi-column sort
                if (columns.length > 1) {
                    th.setAttribute('data-sort-priority', sortIndex + 1);
                }
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
     * @param {Event} event - Click event (optional, for shift detection)
     */
    const handleSort = (table, columnIndex, event) => {
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

        const shiftHeld = event && event.shiftKey;
        const currentColumns = [...(state.sortState.columns || [])];

        let newColumns;

        if (shiftHeld && currentColumns.length > 0) {
            // Multi-column sort: add/toggle column in array
            const existingIndex = currentColumns.findIndex(col => col.column === columnIndex);

            if (existingIndex !== -1) {
                // Column already in sort - toggle its direction
                const currentDir = currentColumns[existingIndex].direction;
                if (currentDir === 'asc') {
                    currentColumns[existingIndex] = {
                        ...currentColumns[existingIndex],
                        direction: 'desc'
                    };
                    newColumns = currentColumns;
                } else {
                    // Remove from sort
                    newColumns = currentColumns.filter((_, i) => i !== existingIndex);
                }
            } else {
                // Add new column to sort
                const values = getColumnValues(table, columnIndex);
                const type = detectDataType(values);
                newColumns = [...currentColumns, {
                    column: columnIndex,
                    direction: 'asc',
                    type
                }];
            }
        } else {
            // Single-column sort: replace columns array
            const existingIndex = currentColumns.findIndex(col => col.column === columnIndex);
            const currentDirection = existingIndex !== -1 ? currentColumns[existingIndex].direction : null;

            let newDirection;
            if (currentDirection === null || existingIndex === -1) {
                newDirection = 'asc';
            } else if (currentDirection === 'asc') {
                newDirection = 'desc';
            } else {
                newDirection = null; // Clear sort
            }

            if (newDirection === null) {
                newColumns = [];
            } else {
                const values = getColumnValues(table, columnIndex);
                const type = detectDataType(values);
                newColumns = [{ column: columnIndex, direction: newDirection, type }];
            }
        }

        // If no columns, restore original order
        if (newColumns.length === 0) {
            restoreOriginalOrder(table, state.originalRowOrder);
            clearSortIndicators(table);

            state = updateState(state, {
                sortState: {
                    columns: [],
                    column: null,
                    direction: null,
                    type: null
                }
            });
            tableStates.set(table, state);

            const th = table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')');
            const columnName = th ? th.textContent.trim() : 'column ' + (columnIndex + 1);
            announceSortChange(table, columnName, null);
            return;
        }

        // Sort rows using multi-column array
        const currentRows = Array.from(tbody.querySelectorAll('tr'));
        const sortedRows = sortRows(currentRows, newColumns);

        // Apply to DOM
        applySort(table, sortedRows);

        // Update visual indicators
        updateSortIndicators(table, newColumns);

        // Update state (maintain backwards compat with column/direction/type)
        const primaryColumn = newColumns[0];
        state = updateState(state, {
            sortState: {
                columns: newColumns,
                column: primaryColumn.column,
                direction: primaryColumn.direction,
                type: primaryColumn.type
            }
        });
        tableStates.set(table, state);

        // Announce change
        const th = table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')');
        const columnName = th ? th.textContent.trim() : 'column ' + (columnIndex + 1);
        const dir = newColumns.find(col => col.column === columnIndex)?.direction;
        announceSortChange(table, columnName, dir || null);
    };

    // ====================
    // PAGINATION
    // ====================

    /**
     * Calculate pagination metadata
     * @param {number} totalRows - Total number of rows
     * @param {number} perPage - Rows per page
     * @param {number} currentPage - Current page number
     * @returns {Object} Pagination metadata
     */
    const calculatePagination = (totalRows, perPage, currentPage) => {
        const totalPages = Math.ceil(totalRows / perPage) || 1;
        const safePage = Math.max(1, Math.min(currentPage, totalPages));
        const startRow = (safePage - 1) * perPage;
        const endRow = Math.min(startRow + perPage, totalRows);

        return {
            currentPage: safePage,
            totalPages,
            startRow,
            endRow,
            hasNext: safePage < totalPages,
            hasPrev: safePage > 1
        };
    };

    /**
     * Apply pagination to table rows
     * @param {HTMLTableElement} table - Table element
     * @param {number} startRow - Start row index (0-based)
     * @param {number} endRow - End row index (exclusive)
     */
    const applyPagination = (table, startRow, endRow) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index >= startRow && index < endRow) {
                row.style.display = '';
                row.removeAttribute('aria-hidden');
            } else {
                row.style.display = 'none';
                row.setAttribute('aria-hidden', 'true');
            }
        });
    };

    /**
     * Create pagination controls
     * @param {HTMLTableElement} table - Table element
     * @returns {HTMLElement} Pagination controls container
     */
    const createPaginationControls = (table) => {
        const container = document.createElement('div');
        container.className = 'tx-pagination';
        container.setAttribute('role', 'navigation');
        container.setAttribute('aria-label', 'Table pagination');

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'tx-pagination-prev';
        prevBtn.textContent = 'Previous';
        prevBtn.setAttribute('aria-label', 'Go to previous page');
        container.appendChild(prevBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'tx-pagination-info';
        pageInfo.setAttribute('aria-live', 'polite');
        pageInfo.setAttribute('aria-atomic', 'true');
        container.appendChild(pageInfo);

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'tx-pagination-next';
        nextBtn.textContent = 'Next';
        nextBtn.setAttribute('aria-label', 'Go to next page');
        container.appendChild(nextBtn);

        return container;
    };

    /**
     * Update pagination controls state
     * @param {HTMLElement} controls - Pagination controls container
     * @param {Object} pagination - Pagination metadata
     */
    const updatePaginationControls = (controls, pagination) => {
        const prevBtn = controls.querySelector('.tx-pagination-prev');
        const nextBtn = controls.querySelector('.tx-pagination-next');
        const pageInfo = controls.querySelector('.tx-pagination-info');

        // Update buttons
        if (prevBtn) {
            prevBtn.disabled = !pagination.hasPrev;
            if (!pagination.hasPrev) {
                prevBtn.setAttribute('aria-disabled', 'true');
            } else {
                prevBtn.removeAttribute('aria-disabled');
            }
        }

        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNext;
            if (!pagination.hasNext) {
                nextBtn.setAttribute('aria-disabled', 'true');
            } else {
                nextBtn.removeAttribute('aria-disabled');
            }
        }

        // Update page info
        if (pageInfo) {
            pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        }
    };

    /**
     * Navigate to a specific page
     * @param {HTMLTableElement} table - Table element
     * @param {number} page - Page number to navigate to
     */
    const navigateToPage = (table, page) => {
        let state = tableStates.get(table);
        if (!state) {
            return;
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        const totalRows = tbody.querySelectorAll('tr').length;
        const perPage = state.paginationState.perPage;

        // Calculate new pagination
        const pagination = calculatePagination(totalRows, perPage, page);

        // Apply pagination to rows
        applyPagination(table, pagination.startRow, pagination.endRow);

        // Update state
        state = updateState(state, {
            paginationState: {
                currentPage: pagination.currentPage,
                totalRows,
                totalPages: pagination.totalPages
            }
        });
        tableStates.set(table, state);

        // Update controls
        const controls = table.parentElement?.querySelector('.tx-pagination');
        if (controls) {
            updatePaginationControls(controls, pagination);
        }

        // Announce page change
        announcePaginationChange(table, pagination.currentPage, pagination.totalPages);
    };

    /**
     * Announce pagination change for screen readers
     * @param {HTMLTableElement} table - Table element
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     */
    const announcePaginationChange = (table, currentPage, totalPages) => {
        let liveRegion = table.parentElement?.querySelector('.tx-sr-only[role="status"]');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.className = 'tx-sr-only';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            table.parentElement?.appendChild(liveRegion);
        }

        liveRegion.textContent = `Page ${currentPage} of ${totalPages}`;
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
                th.setAttribute('tabindex', '0'); // Make focusable for keyboard navigation
                th.setAttribute('scope', 'col'); // WCAG: column scope

                // Add click handler with event for shift detection
                th.addEventListener('click', (event) => handleSort(table, index, event));

                // Add keyboard handler (Enter or Space to sort)
                th.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault(); // Prevent page scroll on Space
                        handleSort(table, index, event);
                    }
                });

                // Add visual hint class
                th.classList.add('tx-sortable');
            }
        });
    };

    /**
     * Initialize pagination on a table
     * @param {HTMLTableElement} table - Table element
     */
    const initTablePagination = (table) => {
        // Check if pagination is enabled
        const hasPagination = table.hasAttribute('tx-paginate');
        if (!hasPagination) {
            return;
        }

        // Get or create state
        let state = tableStates.get(table);
        if (!state) {
            state = createTableState(table, { paginated: true });
        }

        // Get pagination config
        const perPageAttr = getTableConfig(table, 'tx-per-page', '10');
        const perPage = parseInt(perPageAttr, 10);

        // Count total rows
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }
        const totalRows = tbody.querySelectorAll('tr').length;

        // Calculate initial pagination
        const pagination = calculatePagination(totalRows, perPage, 1);

        // Update state
        state = updateState(state, {
            paginationState: {
                currentPage: 1,
                perPage,
                totalRows,
                totalPages: pagination.totalPages
            }
        });
        tableStates.set(table, state);

        // Apply initial pagination
        applyPagination(table, pagination.startRow, pagination.endRow);

        // Create and insert pagination controls
        const controls = createPaginationControls(table);
        updatePaginationControls(controls, pagination);

        // Add event listeners to controls
        const prevBtn = controls.querySelector('.tx-pagination-prev');
        const nextBtn = controls.querySelector('.tx-pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentState = tableStates.get(table);
                if (currentState && currentState.paginationState.currentPage > 1) {
                    navigateToPage(table, currentState.paginationState.currentPage - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentState = tableStates.get(table);
                if (currentState &&
                    currentState.paginationState.currentPage < currentState.paginationState.totalPages) {
                    navigateToPage(table, currentState.paginationState.currentPage + 1);
                }
            });
        }

        // Insert controls after table
        table.parentElement?.insertBefore(controls, table.nextSibling);

        // Initial announcement
        announcePaginationChange(table, 1, pagination.totalPages);
    };

    // ====================
    // TABLE FILTERING
    // ====================

    /**
     * Debounce function for search input
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Filter table rows based on search query
     * @param {HTMLTableElement} table - Table element
     * @param {string} query - Search query
     * @param {Array<number>} filterColumns - Column indices to search (empty = all columns)
     * @returns {Object} Filter results {visibleRows: Array<number>, totalMatches: number}
     */
    const filterRows = (table, query, filterColumns = []) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return { visibleRows: [], totalMatches: 0 };
        }

        const rows = tbody.querySelectorAll('tr');
        const lowerQuery = query.toLowerCase().trim();

        // Empty query = show all rows
        if (!lowerQuery) {
            return {
                visibleRows: Array.from({length: rows.length}, (_, i) => i),
                totalMatches: rows.length
            };
        }

        const visibleRows = [];

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td, th');
            const columnsToSearch = filterColumns.length > 0
                ? filterColumns
                : Array.from({length: cells.length}, (_, i) => i);

            // Check if any cell in specified columns matches query
            const matches = columnsToSearch.some(colIndex => {
                const cell = cells[colIndex];
                if (!cell) return false;

                const cellText = getCellValue(cell).toLowerCase();
                return cellText.includes(lowerQuery);
            });

            if (matches) {
                visibleRows.push(index);
            }
        });

        return {
            visibleRows,
            totalMatches: visibleRows.length
        };
    };

    /**
     * Apply filter to table rows (show/hide based on filter results)
     * @param {HTMLTableElement} table - Table element
     * @param {Array<number>} visibleRows - Indices of rows to show
     */
    const applyFilter = (table, visibleRows) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const visibleSet = new Set(visibleRows);

        rows.forEach((row, index) => {
            if (visibleSet.has(index)) {
                row.style.display = '';
                row.removeAttribute('aria-hidden');
            } else {
                row.style.display = 'none';
                row.setAttribute('aria-hidden', 'true');
            }
        });

        // If pagination is enabled, reset to page 1 after filtering
        const state = tableStates.get(table);
        if (state && state.paginationState && state.paginationState.perPage > 0) {
            // Update pagination to reflect filtered results
            const perPage = state.paginationState.perPage;
            const pagination = calculatePagination(visibleRows.length, perPage, 1);

            // Update state
            const newState = updateState(state, {
                paginationState: {
                    ...state.paginationState,
                    currentPage: 1,
                    totalRows: visibleRows.length,
                    totalPages: pagination.totalPages
                }
            });
            tableStates.set(table, newState);

            // Apply pagination to visible rows only
            applyPagination(table, 0, Math.min(perPage, visibleRows.length));

            // Update pagination controls
            updatePaginationControls(table, 1, pagination.totalPages, pagination.hasNext, pagination.hasPrev);
            announcePaginationChange(table, 1, pagination.totalPages);
        }
    };

    /**
     * Announce filter results to screen readers
     * @param {HTMLTableElement} table - Table element
     * @param {number} totalMatches - Number of matching rows
     * @param {number} totalRows - Total number of rows
     */
    const announceFilterResults = (table, totalMatches, totalRows) => {
        // Find or create ARIA live region
        let liveRegion = table.closest('div')?.querySelector('.tx-filter-status');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.className = 'tx-filter-status tx-sr-only';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');

            table.parentElement?.insertBefore(liveRegion, table);
        }

        const message = totalMatches === totalRows
            ? `Showing all ${totalRows} rows`
            : `Showing ${totalMatches} of ${totalRows} rows`;

        liveRegion.textContent = message;
    };

    /**
     * Create filter input control
     * @param {HTMLTableElement} table - Table element
     * @param {number} debounceMs - Debounce delay in milliseconds
     * @returns {HTMLDivElement} Filter control container
     */
    const createFilterInput = (table, debounceMs = 300) => {
        const container = document.createElement('div');
        container.className = 'tx-filter-container';
        container.style.cssText = 'margin-bottom: 12px; display: flex; align-items: center; gap: 8px;';

        const label = document.createElement('label');
        label.textContent = 'Search: ';
        label.htmlFor = `tx-filter-${table.id || Math.random().toString(36).substr(2, 9)}`;
        label.style.cssText = 'font-weight: 500;';

        const input = document.createElement('input');
        input.type = 'search';
        input.id = label.htmlFor;
        input.className = 'tx-filter-input';
        input.placeholder = 'Search table...';
        input.setAttribute('aria-label', 'Filter table rows');
        input.style.cssText = 'padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; flex: 1; max-width: 300px;';

        const resultCount = document.createElement('span');
        resultCount.className = 'tx-filter-count';
        resultCount.setAttribute('aria-live', 'polite');
        resultCount.style.cssText = 'color: #666; font-size: 14px;';

        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(resultCount);

        return container;
    };

    /**
     * Initialize table filtering
     * @param {HTMLTableElement} table - Table element
     */
    const initTableFilter = (table) => {
        if (!table || table.tagName !== 'TABLE') {
            return;
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        // Get configuration
        const filterColumnsAttr = getTableConfig(table, 'tx-filter-columns');
        const filterColumns = filterColumnsAttr
            ? filterColumnsAttr.split(',').map((name, index) => {
                // Try to find column index by header text
                const headers = table.querySelectorAll('th');
                const headerIndex = Array.from(headers).findIndex(
                    th => th.textContent.trim().toLowerCase() === name.trim().toLowerCase()
                );
                return headerIndex !== -1 ? headerIndex : index;
            })
            : [];

        const debounceMs = parseInt(getTableConfig(table, 'tx-filter-debounce', '300'), 10);

        // Initialize or get state
        let state = tableStates.get(table);
        if (!state) {
            state = createTableState(table, { filterable: true, filterColumns });
            tableStates.set(table, state);
        }

        const totalRows = tbody.querySelectorAll('tr').length;

        // Update state with filter configuration
        state = updateState(state, {
            filterState: {
                query: '',
                filterColumns,
                visibleRows: Array.from({length: totalRows}, (_, i) => i),
                totalMatches: totalRows
            }
        });
        tableStates.set(table, state);

        // Create and insert filter input
        const filterControl = createFilterInput(table, debounceMs);
        table.parentElement?.insertBefore(filterControl, table);

        const input = filterControl.querySelector('input');
        const resultCount = filterControl.querySelector('.tx-filter-count');

        // Initial result count
        resultCount.textContent = `${totalRows} rows`;

        // Handle filter input with debouncing
        const handleFilter = debounce((query) => {
            const currentState = tableStates.get(table);
            if (!currentState) return;

            // Filter rows
            const filterResult = filterRows(table, query, currentState.filterState.filterColumns);

            // Update state
            const newState = updateState(currentState, {
                filterState: {
                    ...currentState.filterState,
                    query,
                    visibleRows: filterResult.visibleRows,
                    totalMatches: filterResult.totalMatches
                }
            });
            tableStates.set(table, newState);

            // Apply filter
            applyFilter(table, filterResult.visibleRows);

            // Update result count
            const matchText = filterResult.totalMatches === 1 ? 'row' : 'rows';
            resultCount.textContent = query.trim()
                ? `${filterResult.totalMatches} ${matchText} found`
                : `${totalRows} rows`;

            // Announce to screen readers
            announceFilterResults(table, filterResult.totalMatches, totalRows);
        }, debounceMs);

        input.addEventListener('input', (e) => {
            handleFilter(e.target.value);
        });

        // Clear button (appears when input has value)
        input.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.style.paddingRight = '30px';
            } else {
                e.target.style.paddingRight = '12px';
            }
        });
    };

    // ====================
    // VIRTUAL SCROLLING
    // ====================

    /**
     * Check if virtual scrolling should be enabled
     * @param {HTMLTableElement} table - Table element
     * @param {number} rowCount - Number of rows in table
     * @returns {boolean} True if virtual scrolling should be enabled
     */
    const shouldEnableVirtualScroll = (table, rowCount) => {
        const virtualAttr = getTableConfig(table, 'tx-virtual');

        // Explicit enable/disable
        if (virtualAttr === 'true') return true;
        if (virtualAttr === 'false') return false;

        // Auto-enable for >1000 rows
        if (virtualAttr === 'auto' || virtualAttr === null) {
            return rowCount > 1000;
        }

        return false;
    };

    /**
     * Calculate visible row range based on scroll position
     * @param {number} scrollTop - Scroll position in pixels
     * @param {number} rowHeight - Height of each row
     * @param {number} viewportHeight - Height of visible area
     * @param {number} totalRows - Total number of rows
     * @param {number} buffer - Number of buffer rows
     * @returns {Object} {firstVisibleRow, lastVisibleRow, visibleCount}
     */
    const calculateVisibleRange = (scrollTop, rowHeight, viewportHeight, totalRows, buffer) => {
        const firstVisibleRow = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
        const visibleCount = Math.ceil(viewportHeight / rowHeight);
        const lastVisibleRow = Math.min(totalRows - 1, firstVisibleRow + visibleCount + buffer * 2);

        return {
            firstVisibleRow,
            lastVisibleRow,
            visibleCount
        };
    };

    /**
     * Measure row height from actual rendered rows
     * @param {HTMLTableElement} table - Table element
     * @returns {number} Average row height in pixels
     */
    const measureRowHeight = (table) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) return 50;

        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) return 50;

        // Sample first 10 rows for average
        const sampleSize = Math.min(10, rows.length);
        let totalHeight = 0;

        for (let i = 0; i < sampleSize; i++) {
            totalHeight += rows[i].offsetHeight;
        }

        return Math.ceil(totalHeight / sampleSize);
    };

    /**
     * Create virtual scroll container
     * @param {HTMLTableElement} table - Table element
     * @param {number} totalHeight - Total height of all rows
     * @returns {HTMLElement} Scroll container element
     */
    const createVirtualScrollContainer = (table, totalHeight) => {
        const container = document.createElement('div');
        container.className = 'tx-virtual-scroll-container';
        container.style.cssText = `
            position: relative;
            overflow-y: auto;
            height: 500px;
            will-change: scroll-position;
        `;

        // Create spacer for total scroll height
        const spacer = document.createElement('div');
        spacer.className = 'tx-virtual-scroll-spacer';
        spacer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: ${totalHeight}px;
            pointer-events: none;
        `;

        container.appendChild(spacer);

        // Wrap table
        table.style.cssText = `
            position: relative;
            transform: translateY(0px);
            will-change: transform;
        `;

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'tx-virtual-table-wrapper';
        table.parentNode.insertBefore(tableWrapper, table);
        tableWrapper.appendChild(table);

        container.appendChild(tableWrapper);
        tableWrapper.parentNode.replaceChild(container, tableWrapper);
        container.appendChild(tableWrapper);

        return container;
    };

    /**
     * Recycle DOM rows for virtual scrolling
     * @param {HTMLTableElement} table - Table element
     * @param {Array<HTMLTableRowElement>} allRows - All table rows (detached)
     * @param {number} firstVisibleRow - First visible row index
     * @param {number} lastVisibleRow - Last visible row index
     * @param {number} rowHeight - Height of each row
     */
    const recycleRows = (table, allRows, firstVisibleRow, lastVisibleRow, rowHeight) => {
        const startTime = performance.now();

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Clear current rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        // Use DocumentFragment for batch DOM update
        const fragment = document.createDocumentFragment();

        // Add visible rows
        for (let i = firstVisibleRow; i <= lastVisibleRow; i++) {
            if (allRows[i]) {
                fragment.appendChild(allRows[i]);
            }
        }

        tbody.appendChild(fragment);

        // Update transform to position rows correctly
        const translateY = firstVisibleRow * rowHeight;
        table.style.transform = `translateY(${translateY}px)`;

        // Performance measurement
        const duration = performance.now() - startTime;
        if (typeof performance.mark === 'function') {
            performance.mark('tablex:virtual:recycle');
            performance.measure('tablex:virtual:recycle-duration', {
                start: performance.now() - duration,
                duration: duration
            });
        }

    };

    /**
     * Handle virtual scroll event
     * @param {HTMLTableElement} table - Table element
     * @param {HTMLElement} container - Scroll container
     * @param {Array<HTMLTableRowElement>} allRows - All table rows
     */
    const handleVirtualScroll = (table, container, allRows) => {
        let state = tableStates.get(table);
        if (!state || !state.virtualScrollState.enabled) return;

        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        const vsState = state.virtualScrollState;

        // Calculate visible range
        const range = calculateVisibleRange(
            scrollTop,
            vsState.rowHeight,
            viewportHeight,
            allRows.length,
            vsState.buffer
        );

        // Only update if range changed significantly
        if (range.firstVisibleRow !== vsState.firstVisibleRow ||
            range.lastVisibleRow !== vsState.lastVisibleRow) {

            // Recycle rows
            recycleRows(table, allRows, range.firstVisibleRow, range.lastVisibleRow, vsState.rowHeight);

            // Update state
            state = updateState(state, {
                virtualScrollState: {
                    ...vsState,
                    scrollTop,
                    firstVisibleRow: range.firstVisibleRow,
                    lastVisibleRow: range.lastVisibleRow,
                    visibleRowCount: range.visibleCount
                }
            });
            tableStates.set(table, state);

            // Emit scroll event
            const event = new CustomEvent('tx:virtual-scroll', {
                detail: {
                    firstVisibleRow: range.firstVisibleRow,
                    lastVisibleRow: range.lastVisibleRow,
                    scrollTop,
                    scrollPercentage: (scrollTop / (vsState.totalHeight - viewportHeight)) * 100
                }
            });
            table.dispatchEvent(event);

            // Announce to screen readers (debounced)
            announceVirtualScroll(table, range.firstVisibleRow, range.lastVisibleRow, allRows.length);
        }
    };

    /**
     * Debounced screen reader announcement for virtual scrolling
     * Uses closure to maintain timeout state
     */
    const announceVirtualScroll = (() => {
        let timeout;
        let lastAnnouncement = 0;

        return (table, firstRow, lastRow, totalRows) => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                const now = Date.now();
                // Max 1 announcement per second
                if (now - lastAnnouncement < 1000) return;

                lastAnnouncement = now;

                const liveRegion = getLiveRegion(table);
                liveRegion.textContent = `Showing rows ${firstRow + 1}-${lastRow + 1} of ${totalRows}`;
            }, 500); // 500ms debounce
        };
    })();

    /**
     * Programmatically scroll to a specific row
     * @param {HTMLTableElement} table - Table element
     * @param {number} rowIndex - Row index to scroll to
     * @param {Object} options - Scroll options {smooth: boolean}
     */
    const scrollToRow = (table, rowIndex, options = {}) => {
        const state = tableStates.get(table);
        if (!state || !state.virtualScrollState.enabled) return;

        const container = state.virtualScrollState.scrollContainer;
        if (!container) return;

        const scrollTop = rowIndex * state.virtualScrollState.rowHeight;

        if (options.smooth) {
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        } else {
            container.scrollTop = scrollTop;
        }
    };

    /**
     * Initialize virtual scrolling on a table
     * @param {HTMLTableElement} table - Table element
     */
    const initTableVirtualScroll = (table) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const rowCount = allRows.length;

        // Check if virtual scrolling should be enabled
        if (!shouldEnableVirtualScroll(table, rowCount)) {
            return;
        }

        // Disable pagination if enabled (conflict)
        if (table.hasAttribute('tx-paginate')) {
            table.removeAttribute('tx-paginate');
        }

        const startTime = performance.now();

        // Measure row height
        const rowHeight = measureRowHeight(table);
        const bufferAttr = getTableConfig(table, 'tx-buffer', '10');
        const buffer = parseInt(bufferAttr, 10);
        const totalHeight = rowCount * rowHeight;


        // Create virtual scroll container
        const container = createVirtualScrollContainer(table, totalHeight);

        // Get or create state
        let state = tableStates.get(table);
        if (!state) {
            state = createTableState(table, { virtualScroll: true });
        }

        // Detach all rows for recycling
        allRows.forEach(row => row.remove());

        // Initialize state
        const viewportHeight = container.clientHeight;
        const initialRange = calculateVisibleRange(0, rowHeight, viewportHeight, rowCount, buffer);

        state = updateState(state, {
            virtualScrollState: {
                enabled: true,
                scrollTop: 0,
                firstVisibleRow: initialRange.firstVisibleRow,
                lastVisibleRow: initialRange.lastVisibleRow,
                rowHeight,
                buffer,
                totalHeight,
                visibleRowCount: initialRange.visibleCount,
                rowHeights: new Map(),
                observer: null,
                scrollContainer: container
            }
        });
        tableStates.set(table, state);

        // Render initial visible rows
        recycleRows(table, allRows, initialRange.firstVisibleRow, initialRange.lastVisibleRow, rowHeight);

        // Add scroll event listener
        const scrollHandler = debounce(() => {
            handleVirtualScroll(table, container, allRows);
        }, 16); // ~60 FPS

        container.addEventListener('scroll', scrollHandler, { passive: true });

        // Set ARIA attributes
        table.setAttribute('aria-rowcount', rowCount);

        // Update aria-rowindex for visible rows
        const updateAriaIndices = () => {
            const visibleRows = tbody.querySelectorAll('tr');
            const vsState = tableStates.get(table)?.virtualScrollState;
            if (!vsState) return;

            visibleRows.forEach((row, index) => {
                row.setAttribute('aria-rowindex', vsState.firstVisibleRow + index + 1);
            });
        };
        updateAriaIndices();

        // Observe for row updates
        const observer = new MutationObserver(updateAriaIndices);
        observer.observe(tbody, { childList: true });

        // Store observer for cleanup
        state = updateState(state, {
            virtualScrollState: {
                ...state.virtualScrollState,
                observer
            }
        });
        tableStates.set(table, state);

        // Performance logging
        const initDuration = performance.now() - startTime;
        if (typeof performance.mark === 'function') {
            performance.mark('tablex:virtual:init');
            performance.measure('tablex:virtual:init-duration', {
                start: startTime,
                duration: initDuration
            });
        }

        // Emit performance event
        const perfEvent = new CustomEvent('tx:performance', {
            detail: {
                operation: 'virtual-init',
                duration: initDuration,
                timestamp: Date.now(),
                rowCount
            }
        });
        table.dispatchEvent(perfEvent);
    };

    /**
     * Cleanup virtual scrolling resources
     * @param {HTMLTableElement} table - Table element
     */
    const cleanupVirtualScroll = (table) => {
        const state = tableStates.get(table);
        if (!state || !state.virtualScrollState.enabled) return;

        // Disconnect observer
        if (state.virtualScrollState.observer) {
            state.virtualScrollState.observer.disconnect();
        }

        // Remove event listeners (handled by removing container)
        const container = state.virtualScrollState.scrollContainer;
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    };

    /**
     * Initialize all enhanced tables on the page
     */
    const initAll = () => {
        // Initialize virtual scrolling first (may affect other features)
        const virtualScrollTables = document.querySelectorAll('table[tx-virtual]');
        virtualScrollTables.forEach(initTableVirtualScroll);

        // Auto-enable virtual scroll for large tables (>1000 rows)
        const allTables = document.querySelectorAll('table:not([tx-virtual])');
        allTables.forEach(table => {
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.querySelectorAll('tr').length > 1000) {
                initTableVirtualScroll(table);
            }
        });

        // Initialize sortable tables
        const tables = document.querySelectorAll('table[tx-sortable]');
        tables.forEach(initTableSort);

        // Also find tables with individual sortable headers
        const tablesWithSortableHeaders = document.querySelectorAll('table:has(th[tx-sortable])');
        tablesWithSortableHeaders.forEach(initTableSort);

        // Initialize paginated tables
        const paginatedTables = document.querySelectorAll('table[tx-paginate]');
        paginatedTables.forEach(initTablePagination);

        // Initialize filterable tables
        const filterableTables = document.querySelectorAll('table[tx-filterable]');
        filterableTables.forEach(initTableFilter);
    };

    // ====================
    // PUBLIC API
    // ====================

    /**
     * Initialize all features on a specific table
     * @param {HTMLTableElement} table - Table element
     */
    const initTable = (table) => {
        if (!table) return;

        // Initialize virtual scrolling first (may affect other features)
        if (table.hasAttribute('tx-virtual')) {
            initTableVirtualScroll(table);
        } else {
            // Check for auto-enable (>1000 rows)
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.querySelectorAll('tr').length > 1000) {
                initTableVirtualScroll(table);
            }
        }

        // Initialize sorting if applicable
        if (table.hasAttribute('tx-sortable') || table.querySelector('th[tx-sortable]')) {
            initTableSort(table);
        }

        // Initialize pagination if applicable
        if (table.hasAttribute('tx-paginate')) {
            initTablePagination(table);
        }

        // Initialize filtering if applicable
        if (table.hasAttribute('tx-filterable')) {
            initTableFilter(table);
        }
    };

    const tableX = {
        /**
         * Initialize sorting on specific table
         * @param {HTMLTableElement} table - Table element
         */
        init: initTableSort,

        /**
         * Initialize all features on specific table
         * @param {HTMLTableElement} table - Table element
         */
        initTable,

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

        /**
         * Scroll to a specific row (virtual scrolling only)
         * @param {HTMLTableElement} table - Table element
         * @param {number} rowIndex - Row index to scroll to
         * @param {Object} [options] - Scroll options {smooth: boolean}
         */
        scrollToRow,

        /**
         * Cleanup table resources
         * @param {HTMLTableElement} table - Table element
         */
        cleanup: (table) => {
            cleanupVirtualScroll(table);
            tableStates.delete(table);
        },

        // Export internals for testing
        _internals: {
            comparators,
            detectDataType,
            sortRows,
            getCellValue,
            debounce,
            filterRows,
            shouldEnableVirtualScroll,
            calculateVisibleRange,
            measureRowHeight,
            recycleRows
        }
    };

    // ====================
    // AUTO-INITIALIZATION
    // ====================

    if (typeof window !== 'undefined') {
        // Export to window
        window.tableX = tableX;

        // Factory export for bootloader integration
        window.txXFactory = {
            init: (config = {}) => {
                initAll();
                return tableX;
            }
        };

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
