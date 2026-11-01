Feature: tableX - Declarative Table Enhancements
  As a web developer
  I want declarative table enhancements through HTML attributes
  So that I can create powerful tables without complex JavaScript

  Background:
    Given the tableX module is loaded
    And the DOM is ready

  # Basic Table Enhancement
  # wip: tableX has no tx-table attribute or enhanced marker, and tx-responsive is not built
  @wip
  Scenario: Basic enhanced table
    Given a table with tx-table="true"
    When the page is rendered
    Then the table should be enhanced
    And responsive features should be activated

  # Sorting
  Scenario: Sort by column ascending
    Given a table with tx-sort="true"
    And columns: "Name", "Age", "City"
    And data rows
    When the user clicks the "Age" header
    Then rows should be sorted by age ascending
    And a sort indicator should appear

  Scenario: Sort by column descending
    Given a sorted column (ascending)
    When the header is clicked again
    Then rows should be sorted descending
    And the sort indicator should flip

  Scenario: Sort by text column
    Given a table with text data
    When sorting by "Name"
    Then rows should be alphabetically sorted
    And sorting should be case-insensitive

  Scenario: Sort by number column
    Given a table with numeric data
    When sorting by "Price"
    Then rows should be numerically sorted
    And "10" should come after "2" (not alphabetical)

  Scenario: Sort by date column
    Given a table with date columns
    When sorting by "Created"
    Then rows should be chronologically sorted
    And date parsing should handle multiple formats

  # wip: tableX has no tx-sort-fn custom comparator hook
  @wip
  Scenario: Sort with custom comparator
    Given a column with tx-sort-fn="customSort"
    When sorting that column
    Then the custom sort function should be used

  Scenario: Disable sorting on column
    Given a column with tx-sortable="false"
    Then the header should not be clickable
    And no sort indicator should appear

  # Filtering
  Scenario: Filter table rows
    Given a table with tx-filter="true"
    And a filter input
    When in tableX, the user types "John"
    Then only rows containing "John" should display
    And other rows should be hidden

  Scenario: Filter by specific column
    Given a table with tx-filter-columns="name"
    When filtering
    Then only the "name" column should be searched

  Scenario: Case-insensitive filtering
    Given a table with case-insensitive filter
    When in tableX, the user types "JOHN"
    Then rows with "john" or "John" should match

  Scenario: Clear filter
    Given a filtered table
    When the filter input is cleared
    Then all rows should reappear

  # wip: tableX has no tx-filter-mode; the query matches as one substring
  @wip
  Scenario: Filter with multiple terms
    Given a table with tx-filter-mode="all"
    When the user types "john smith"
    Then only rows containing both "john" AND "smith" should display

  # wip: tableX has no advanced per-column filter inputs
  @wip
  Scenario: Advanced filter with column selectors
    Given a table with tx-filter="advanced"
    And column-specific filter inputs
    When filtering "Age > 25" and "City = NYC"
    Then only matching rows should display

  # Pagination
  Scenario: Basic pagination
    Given a table with tx-paginate="true" tx-per-page="10"
    And 50 total rows
    When the page renders
    Then only the first 10 rows should display
    And pagination controls should show 5 pages

  Scenario: Navigate to next page
    Given a paginated table on page 1
    When in tableX, the user clicks "Next"
    Then page 2 should display
    And rows 11-20 should be visible

  # wip: tableX pagination renders Previous/Next and page info only, no page number buttons
  @wip
  Scenario: Navigate to specific page
    Given a paginated table
    When the user clicks page "3"
    Then page 3 should display
    And rows 21-30 should be visible

  # wip: tableX has no tx-per-page-options selector
  @wip
  Scenario: Change rows per page
    Given a table with tx-per-page-options="10,25,50"
    When the user selects "25"
    Then 25 rows should display per page
    And pagination should recalculate

  Scenario: Disable pagination controls
    Given a paginated table on page 1
    Then the "Previous" pagination button should be disabled
    When the table is on its last page
    Then the "Next" pagination button should be disabled

  # Selection
  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Select single row
    Given a table with tx-select="single"
    When the user clicks a row
    Then the row should be selected
    And it should have class "tx-selected"

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Deselect row
    Given a selected row
    When the row is clicked again
    Then it should be deselected

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Select multiple rows
    Given a table with tx-select="multiple"
    When the user clicks multiple rows
    Then all clicked rows should be selected

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Select all checkbox
    Given a table with tx-select="multiple" tx-select-all="true"
    And a checkbox in the header
    When the header checkbox is checked
    Then all rows should be selected

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Shift-click range selection
    Given a table with multiple selection
    When the user clicks row 2
    And shift-clicks row 5
    Then rows 2, 3, 4, 5 should all be selected

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Get selected rows
    Given a table with selected rows
    When calling getSelected()
    Then an array of selected row data should be returned

  # Inline Editing
  # wip: tableX has no inline editing (tx-editable)
  @wip
  Scenario: Edit cell value
    Given a table with tx-editable="true"
    When the user double-clicks a cell
    Then the cell should become editable
    And an input should appear

  # wip: tableX has no inline editing (tx-editable)
  @wip
  Scenario: Save edited value
    Given an editing cell
    When the user types "New Value" and presses Enter
    Then the cell should update with "New Value"
    And an "tx:cell-edit" event should be emitted

  # wip: tableX has no inline editing (tx-editable)
  @wip
  Scenario: Cancel edit
    Given an editing cell
    When the user presses Escape
    Then the edit should be cancelled
    And the original value should be restored

  # wip: tableX has no inline editing (tx-editable)
  @wip
  Scenario: Validate cell input
    Given a cell with tx-validate="number"
    When the user enters "abc"
    Then validation should fail
    And an error should be shown

  # Row Actions
  # wip: tableX has no row actions (tx-actions)
  @wip
  Scenario: Add action buttons to rows
    Given a table with tx-actions="true"
    And actions defined: "edit", "delete"
    When the page renders
    Then each row should have action buttons

  # wip: tableX has no row actions (tx-actions)
  @wip
  Scenario: Click row action
    Given a table with action buttons
    And an event listener for "tx:action"
    When the user clicks "delete" on row 3
    Then an "tx:action" event should be emitted
    And event.detail should contain action="delete" and rowIndex=3

  # Column Visibility
  # wip: tableX has no column visibility toggles
  @wip
  Scenario: Toggle column visibility
    Given a table with tx-toggle-columns="true"
    And a column visibility menu
    When the user unchecks "Age"
    Then the Age column should be hidden

  # wip: tableX has no column visibility toggles
  @wip
  Scenario: Show/hide columns
    Given hidden columns
    When the user checks "Age"
    Then the Age column should reappear

  # wip: tableX has no column visibility toggles
  @wip
  Scenario: Remember column visibility
    Given a table with tx-remember="true"
    When columns are toggled
    Then preferences should be saved to localStorage

  # Column Resizing
  # wip: tableX has no column resizing
  @wip
  Scenario: Resize column width
    Given a table with tx-resize="true"
    When the user drags a column border
    Then the column width should change
    And the cursor should indicate resizing

  # wip: tableX has no column resizing
  @wip
  Scenario: Auto-fit column to content
    Given a resizable column
    When the user double-clicks the resize handle
    Then the column should auto-fit to content width

  # wip: tableX has no column resizing
  @wip
  Scenario: Minimum column width
    Given a column with tx-min-width="100"
    When resizing
    Then the width should not go below 100px

  # Column Reordering
  # wip: tableX has no column reordering
  @wip
  Scenario: Reorder columns via drag-and-drop
    Given a table with tx-reorder="true"
    When the user drags "Age" column before "Name"
    Then column order should update
    And data should remain correctly aligned

  # Responsive Tables
  # wip: tx-responsive and tx-priority are documented but not built in src/tablex.js
  @wip
  Scenario: Stack on mobile
    Given a table with tx-responsive="stack"
    When viewed on mobile
    Then each row should stack into a card layout
    And headers should appear as labels for each value

  # wip: tx-responsive and tx-priority are documented but not built in src/tablex.js
  @wip
  Scenario: Horizontal scroll on mobile
    Given a table with tx-responsive="scroll"
    When viewed on mobile
    Then the table should scroll horizontally
    And a scroll indicator should appear

  # wip: tx-responsive and tx-priority are documented but not built in src/tablex.js
  @wip
  Scenario: Hide columns on mobile
    Given columns with tx-priority="1", "2", "3"
    When viewed on mobile
    Then only priority 1 columns should display
    And a "+" button should reveal hidden columns

  # Fixed Headers
  # wip: tableX has no fixed header or fixed column support
  @wip
  Scenario: Fixed header on scroll
    Given a table with tx-fixed-header="true"
    When the user scrolls down
    Then the header should remain visible at top
    And it should stay aligned with columns

  # wip: tableX has no fixed header or fixed column support
  @wip
  Scenario: Fixed first column
    Given a table with tx-fixed-column="1"
    When scrolling horizontally
    Then the first column should remain fixed
    And other columns should scroll

  # Row Grouping
  # wip: tableX has no row grouping
  @wip
  Scenario: Group rows by column value
    Given a table with tx-group-by="category"
    When the table renders
    Then rows should be grouped by category
    And group headers should display

  # wip: tableX has no row grouping
  @wip
  Scenario: Collapse/expand groups
    Given grouped rows
    When the user clicks a group header
    Then the group should collapse
    When clicked again
    Then the group should expand

  # wip: tableX has no row grouping
  @wip
  Scenario: Aggregate group data
    Given grouped rows with tx-aggregate="sum"
    Then group headers should show sum of values

  # Expandable Rows
  # wip: tableX has no expandable rows
  @wip
  Scenario: Expand row details
    Given a table with tx-expandable="true"
    And detail templates defined
    When the user clicks the expand icon
    Then a detail row should appear below
    And it should contain additional information

  # wip: tableX has no expandable rows
  @wip
  Scenario: Collapse expanded row
    Given an expanded row
    When the expand icon is clicked
    Then the detail row should collapse

  # Row Highlighting
  # wip: tableX has no tx-highlight
  @wip
  Scenario: Highlight row on hover
    Given a table with tx-highlight="hover"
    When the user hovers a row
    Then the row should be highlighted

  # wip: tableX has no tx-stripe
  @wip
  Scenario: Stripe rows
    Given a table with tx-stripe="true"
    Then alternating rows should have different backgrounds

  # Export Data
  # wip: tableX has no data export
  @wip
  Scenario: Export to CSV
    Given a table with tx-export="true"
    When the user clicks "Export CSV"
    Then a CSV file should download
    And it should contain all table data

  # wip: tableX has no data export
  @wip
  Scenario: Export visible rows only
    Given a filtered and paginated table
    When exporting with tx-export-visible="true"
    Then only visible rows should be exported

  # wip: tableX has no data export
  @wip
  Scenario: Export to JSON
    Given a table with tx-export="json"
    When exporting
    Then a JSON file should download

  # Search Highlighting
  # wip: tableX has no search term highlighting
  @wip
  Scenario: Highlight search terms
    Given a table with tx-highlight-search="true"
    When filtering for "John"
    Then "John" should be highlighted in matching cells

  # Column Summaries
  # wip: tableX has no column summaries
  @wip
  Scenario: Show column totals
    Given a table with tx-summary="true"
    And numeric columns
    When the table renders
    Then a summary row should display at bottom
    And it should show column totals

  # wip: tableX has no column summaries
  @wip
  Scenario: Calculate averages
    Given a column with tx-summary-type="average"
    Then the summary should show the average value

  # wip: tableX has no column summaries
  @wip
  Scenario: Count non-empty cells
    Given a column with tx-summary-type="count"
    Then the summary should show the count

  # Keyboard Navigation
  # wip: tableX has no cell keyboard navigation (tx-keyboard-nav)
  @wip
  Scenario: Navigate cells with arrow keys
    Given a table with tx-keyboard-nav="true"
    When a cell is focused
    And the user presses Arrow Right
    Then focus should move to the next cell

  # wip: tableX has no cell keyboard navigation (tx-keyboard-nav)
  @wip
  Scenario: Jump to first/last cell
    Given a focused cell
    When the user presses Home
    Then focus should move to first cell in row
    When the user presses End
    Then focus should move to last cell in row

  # wip: tableX has no cell keyboard navigation (tx-keyboard-nav)
  @wip
  Scenario: Navigate rows with Up/Down
    Given a focused cell
    When the user presses Arrow Down
    Then focus should move to the cell below

  # Loading State
  # wip: tableX has no loading state; use loadX
  @wip
  Scenario: Show loading skeleton
    Given a table with tx-loading="true"
    When the table is loading data
    Then skeleton rows should display
    When data loads
    Then skeleton should be replaced with data

  # Empty State
  # wip: tableX has no tx-empty-message
  @wip
  Scenario: Show empty message
    Given a table with no data
    And tx-empty-message="No records found"
    When the table renders
    Then "No records found" should display

  # Accessibility
  Scenario: ARIA attributes for tables
    Given a table with tx-sort="true"
    Then the table should expose role "table"
    And headers should have role "columnheader"
    And cells should have role "cell"

  Scenario: Sort button accessibility
    Given a sortable column
    Then the header should have aria-sort="none"
    When sorted ascending
    Then aria-sort should be "ascending"

  Scenario: Announce sort changes
    Given a sortable column
    When a column is sorted
    Then an aria-live region should announce the change

  Scenario: Keyboard accessible pagination
    Given a paginated table
    Then all controls should be keyboard accessible
    And Tab should navigate between controls

  # Performance
  Scenario: Virtual scrolling for large tables
    Given a table with tx-virtual="true"
    And 10,000 rows
    When the table renders
    Then only visible rows should be in DOM
    When in tableX, scrolling
    Then rows should be dynamically added/removed

  # perf: timing threshold
  @perf
  Scenario: Efficient sorting
    Given a table with 1,000 rows
    When sorting
    Then the operation should complete in less than 50ms

  Scenario: Debounced filtering
    Given a filter input with tx-filter-debounce="300"
    When the user types quickly
    Then filtering should be debounced
    And only execute after typing stops

  # Events
  Scenario: Emit sort event
    Given a table
    And an event listener for "tx:sort"
    When a column is sorted
    Then a "tx:sort" event should be emitted
    And event.detail should contain column and direction

  Scenario: Emit filter event
    Given a table
    And an event listener for "tx:filter"
    When filtering occurs
    Then a "tx:filter" event should be emitted
    And event.detail should contain filter term

  Scenario: Emit page change event
    Given a paginated table
    And an event listener for "tx:page"
    When the page changes
    Then the event should be emitted

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Emit selection event
    Given a table with selection
    And an event listener for "tx:select"
    When a row is selected
    Then the event should be emitted
    And event.detail should contain selected rows

  # Integration with bindX
  # wip: tableX has no bindX data binding
  @wip
  Scenario: Bind table data
    Given a table with bx-model="tableData"
    And reactive tableData array
    When an item is added to tableData
    Then a new row should appear in the table

  # wip: tableX has no row selection (tx-select)
  @wip
  Scenario: Bind selected rows
    Given a table with bx-model="selectedRows"
    When rows are selected
    Then selectedRows should update automatically

  # MutationObserver
  # wip: tableX has no observe mode (docs point to tableX.refresh, also not built)
  @wip
  Scenario: Detect dynamically added rows
    Given the tableX module is initialized with observe=true
    When a new <tr> is added
    Then the row should be automatically enhanced

  # Custom Formatters
  # wip: tableX has no tx-format; use fmtX on cells
  @wip
  Scenario: Format cell values
    Given a column with tx-format="currency"
    And cell value is 25.00
    When the table renders
    Then the cell should display "$25.00"

  # Column Templates
  # wip: tableX has no tx-template
  @wip
  Scenario: Custom cell renderer
    Given a column with tx-template="#cell-template"
    And a custom template defined
    When the table renders
    Then the template should be used for cells

  # Footer Row
  # wip: tableX has no tx-footer
  @wip
  Scenario: Table footer
    Given a table with <tfoot>
    And tx-footer="true"
    When the table renders
    Then the footer should remain visible
    And it should stick to bottom when scrolling
