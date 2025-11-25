Feature: tableX Virtual Scrolling - High-Performance Large Dataset Handling
  As a web developer
  I want virtual scrolling for tables with 10,000+ rows
  So that I can display large datasets with smooth 60 FPS performance

  Background:
    Given the tableX module is loaded
    And the DOM is ready
    And performance monitoring is enabled

  # Basic Virtual Scrolling
  Scenario: Enable virtual scrolling with tx-virtual attribute
    Given a table with tx-virtual="true"
    And 10,000 data rows
    When the page renders
    Then only visible rows should be in the DOM
    And a virtual scroll container should wrap the tbody
    And scroll height should reflect total row count

  Scenario: Automatic virtual scrolling activation for large tables
    Given a table without tx-virtual attribute
    And 1,500 data rows
    When the tableX module initializes
    Then virtual scrolling should auto-activate
    And a console message should log "Auto-enabled virtual scrolling for 1,500 rows"

  Scenario: Disable auto-activation with explicit setting
    Given a table with tx-virtual="false"
    And 2,000 data rows
    When the tableX module initializes
    Then virtual scrolling should NOT be enabled
    And all 2,000 rows should remain in DOM

  # DOM Recycling
  Scenario: Recycle DOM nodes during scroll
    Given a table with tx-virtual="true"
    And 10,000 rows
    And viewport shows 20 visible rows
    When the page renders
    Then exactly 40 rows should be in DOM (20 visible + 10 buffer above + 10 buffer below)
    When the user scrolls down 100 rows
    Then exactly 40 rows should still be in DOM
    And rows should show data for positions 100-120 (visible)
    And buffer rows should be for positions 90-99 and 121-130

  Scenario: Maintain scroll position during row updates
    Given a virtual scrolled table at row 500
    When row data is updated
    Then scroll position should remain at row 500
    And no jarring scroll jumps should occur

  # Performance Metrics
  Scenario: Render 10,000 rows within performance target
    Given a table with tx-virtual="true"
    And 10,000 rows of data
    When the table initializes
    Then initial render should complete in less than 16ms
    And a performance marker "tablex:virtual:init" should be recorded

  Scenario: Scroll performance meets 60 FPS target
    Given a virtual scrolled table with 10,000 rows
    When the user scrolls rapidly
    Then each scroll frame should complete in less than 16ms
    And frame drops should be zero
    And smooth scrolling should be maintained

  Scenario: Measure row recycling performance
    Given a virtual scrolled table
    When scrolling occurs
    Then row recycling should complete in less than 5ms per batch
    And a performance entry "tablex:virtual:recycle" should be logged

  # Dynamic Row Heights
  Scenario: Handle uniform row heights
    Given a table with tx-virtual="true" tx-row-height="50"
    And 10,000 rows
    When calculating scroll dimensions
    Then total scroll height should be 500,000px (10,000 × 50)
    And position calculations should use fixed height

  Scenario: Handle dynamic row heights with estimator
    Given a table with tx-virtual="true" tx-row-height="auto"
    And rows with varying content heights
    When the table renders
    Then row heights should be measured dynamically
    And scroll position should adjust based on actual heights
    And an estimator function should predict unrendered row heights

  Scenario: Update scroll height when row heights change
    Given a virtual scrolled table with dynamic heights
    When a row's content changes and height increases
    Then the total scroll height should recalculate
    And scroll thumb position should remain proportional

  # Intersection Observer Integration
  Scenario: Use Intersection Observer for scroll detection
    Given a table with tx-virtual="true"
    When the table initializes
    Then an IntersectionObserver should be created
    And it should observe scroll boundary sentinel elements

  Scenario: Trigger row recycling on intersection changes
    Given a virtual scrolled table with sentinel elements at top and bottom
    When the top sentinel intersects the viewport
    Then rows should be recycled to load previous data
    When the bottom sentinel intersects the viewport
    Then rows should be recycled to load next data

  Scenario: Optimize Intersection Observer with rootMargin
    Given a virtual scroll table
    Then IntersectionObserver should use rootMargin="200px 0px"
    And rows should preload 200px before entering viewport
    And this should ensure smooth scrolling without flashing

  # Buffer Management
  Scenario: Configure buffer size
    Given a table with tx-virtual="true" tx-buffer="20"
    And 10,000 rows with 25 visible rows
    When the table renders
    Then 65 total rows should be in DOM (25 visible + 20 top buffer + 20 bottom buffer)

  Scenario: Default buffer size
    Given a table with tx-virtual="true" (no explicit buffer)
    When the table renders
    Then the default buffer should be 10 rows above and below
    And this should balance performance vs smooth scrolling

  Scenario: Larger buffer for fast scrolling
    Given a table with tx-virtual="true" tx-buffer="30"
    When the user scrolls quickly
    Then the 30-row buffer should prevent flickering
    And blank rows should not appear during rapid scroll

  # Scroll State Management
  Scenario: Track scroll position in state
    Given a virtual scrolled table
    When the user scrolls to row 742
    Then state.virtualScrollState.scrollTop should reflect position
    And state.virtualScrollState.firstVisibleRow should be ~742
    And state.virtualScrollState.lastVisibleRow should be ~762

  Scenario: Restore scroll position on refresh
    Given a virtual scrolled table at row 500
    When the table is refreshed (e.g., data updated)
    Then scroll position should restore to row 500
    And visible rows should show correct data

  Scenario: Emit scroll events with virtual row info
    Given a virtual scrolled table
    And an event listener for "tx:virtual-scroll"
    When the user scrolls
    Then a "tx:virtual-scroll" event should be emitted
    And event.detail should contain: { firstVisibleRow, lastVisibleRow, scrollTop, scrollPercentage }

  # Integration with Sorting
  Scenario: Sort virtual scrolled table
    Given a virtual scrolled table with 10,000 rows
    When the user sorts by "Age" column
    Then rows should be sorted
    And scroll should reset to top
    And virtual scrolling should remain active
    And only visible rows should re-render

  Scenario: Maintain virtual scrolling after sort
    Given a sorted virtual scrolled table
    When the user scrolls down after sorting
    Then virtual scrolling should function normally
    And correct sorted data should display

  # Integration with Filtering
  Scenario: Filter virtual scrolled table
    Given a virtual scrolled table with 10,000 rows
    When the user filters for "John"
    Then only matching rows should be virtualized
    And scroll height should reflect filtered row count
    And virtual scrolling should remain active

  Scenario: Virtual scroll with filtered subset
    Given a virtual scrolled table with 10,000 rows
    When filtering reduces visible set to 500 rows
    Then virtual scrolling should still apply
    And scroll dimensions should be for 500 rows
    And performance should remain optimal

  # Integration with Pagination
  Scenario: Disable pagination when virtual scrolling is active
    Given a table with tx-virtual="true" tx-paginate="true"
    When the table initializes
    Then virtual scrolling should be enabled
    And pagination should be disabled
    And a console warning should log "Pagination disabled: virtual scrolling active"

  # Edge Cases
  Scenario: Handle empty table with virtual scrolling
    Given a table with tx-virtual="true"
    And 0 rows
    When the table renders
    Then no scroll container should be created
    And no virtual scrolling overhead should apply

  Scenario: Handle single row with virtual scrolling
    Given a table with tx-virtual="true"
    And 1 row
    When the table renders
    Then virtual scrolling should not activate
    And the single row should display normally

  Scenario: Handle exactly 1000 rows (threshold boundary)
    Given a table with tx-virtual="auto"
    And exactly 1,000 rows
    When the table initializes
    Then virtual scrolling should NOT auto-activate
    And all 1,000 rows should be in DOM

  Scenario: Handle 1001 rows (just over threshold)
    Given a table with tx-virtual="auto"
    And 1,001 rows
    When the table initializes
    Then virtual scrolling SHOULD auto-activate
    And only visible + buffer rows should be in DOM

  # Scroll to Row
  Scenario: Programmatically scroll to specific row
    Given a virtual scrolled table with 10,000 rows
    When window.tableX.scrollToRow(table, 5000) is called
    Then the viewport should scroll to show row 5000
    And row 5000 should be in the visible area
    And a "tx:virtual-scroll" event should be emitted

  Scenario: Scroll to row with smooth animation
    Given a virtual scrolled table
    When window.tableX.scrollToRow(table, 3000, { smooth: true }) is called
    Then the scroll should animate smoothly to row 3000
    And the animation should take approximately 300ms

  # Keyboard Navigation
  Scenario: Arrow key navigation with virtual scrolling
    Given a virtual scrolled table
    And keyboard navigation is enabled
    When a cell at row 50 is focused
    And the user presses Arrow Down repeatedly
    Then focus should move through rows
    And virtual scrolling should keep focused row visible
    And rows should recycle as needed

  Scenario: Page Up/Page Down with virtual scrolling
    Given a virtual scrolled table at row 500
    When the user presses Page Down
    Then the viewport should scroll down by viewport height
    And visible rows should update accordingly
    When the user presses Page Up
    Then the viewport should scroll up by viewport height

  # Accessibility
  Scenario: Announce scroll position to screen readers
    Given a virtual scrolled table
    And an aria-live region for announcements
    When the user scrolls
    Then the aria-live region should announce "Showing rows 100-120 of 10,000"
    And announcements should be debounced (max 1 per second)

  Scenario: Maintain ARIA row indices with virtual scrolling
    Given a virtual scrolled table
    When rows are recycled
    Then each row should have correct aria-rowindex attribute
    And aria-rowcount on table should reflect total row count

  Scenario: Support aria-rowcount for screen readers
    Given a virtual scrolled table with 10,000 rows
    Then the table should have aria-rowcount="10000"
    And each visible row should have aria-rowindex matching its logical position

  # Performance Monitoring
  Scenario: Log performance metrics to console
    Given a table with tx-virtual="true" tx-log-performance="true"
    When the table initializes
    Then console should log "Virtual scroll init: Xms"
    When scrolling occurs
    Then console should log "Row recycle: Xms"

  Scenario: Emit performance event
    Given a virtual scrolled table
    And an event listener for "tx:performance"
    When a scroll operation completes
    Then a "tx:performance" event should be emitted
    And event.detail should contain: { operation: 'recycle', duration: X, timestamp: Y }

  # Memory Management
  Scenario: Clean up observers on destroy
    Given a virtual scrolled table
    When the table is removed from DOM
    Then the IntersectionObserver should disconnect
    And scroll event listeners should be removed
    And no memory leaks should occur

  Scenario: WeakMap for table state
    Given multiple virtual scrolled tables
    When tables are removed from DOM
    Then their state should be garbage collected automatically
    And WeakMap should handle cleanup

  # Row Height Caching
  Scenario: Cache measured row heights
    Given a table with tx-virtual="true" tx-row-height="auto"
    When rows are rendered and measured
    Then heights should be cached in state.virtualScrollState.rowHeights
    And subsequent renders should use cached values
    And measurement overhead should be minimized

  Scenario: Invalidate height cache on window resize
    Given a virtual scrolled table with cached row heights
    When the window is resized
    Then the height cache should be cleared
    And rows should be re-measured on next render

  # Data Loading Integration
  Scenario: Lazy load data as user scrolls
    Given a table with tx-virtual="true" tx-lazy-load="true"
    And a data source that supports pagination
    When the user scrolls near the bottom
    Then a "tx:load-more" event should be emitted
    And the app can load additional rows dynamically

  Scenario: Show loading indicator while fetching more data
    Given a virtual scrolled table with lazy loading
    When a "tx:load-more" event is emitted
    And data is being fetched
    Then a loading indicator should appear at the bottom
    When data arrives
    Then new rows should be appended to virtual scroll

  # Styling and CSS
  Scenario: Virtual scroll container should be transparent
    Given a table with tx-virtual="true"
    When the virtual scroll container is rendered
    Then it should not interfere with table styling
    And table rows should appear normally
    And zebra striping should work correctly

  Scenario: Maintain table layout during scroll
    Given a virtual scrolled table with column widths
    When rows are recycled during scroll
    Then column alignment should remain perfect
    And no horizontal shifting should occur

  # Error Handling
  Scenario: Handle invalid row height configuration
    Given a table with tx-virtual="true" tx-row-height="invalid"
    When the table initializes
    Then a console warning should log "Invalid row height: 'invalid', using default"
    And virtual scrolling should use default height

  Scenario: Handle Intersection Observer unavailability
    Given a browser without IntersectionObserver support
    When a table with tx-virtual="true" initializes
    Then a polyfill should be loaded
    And a fallback scroll listener should be used
    And virtual scrolling should still function

  # Multi-column Sorting
  Scenario: Multi-column sort with virtual scrolling
    Given a virtual scrolled table with 10,000 rows
    When the user sorts by "LastName" then "FirstName"
    Then rows should be sorted by both columns
    And virtual scrolling should remain active
    And performance should remain optimal
