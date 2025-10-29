Feature: loadX - Declarative Loading States
  As a web developer
  I want declarative loading states through HTML attributes
  So that I can provide great UX during async operations

  Background:
    Given the loadX module is loaded
    And the DOM is ready

  # Basic Loading States
  Scenario: Show spinner during load
    Given an element with lx-loading="true" lx-type="spinner"
    When the page is rendered
    Then a spinner should be visible

  Scenario: Hide spinner when loaded
    Given an element with lx-loading="false"
    When the page is rendered
    Then no spinner should be visible

  Scenario: Toggle loading state
    Given an element with lx-loading bound to isLoading
    When isLoading changes from false to true
    Then the spinner should appear
    When isLoading changes back to false
    Then the spinner should disappear

  # Spinner Types
  Scenario: Circular spinner
    Given an element with lx-type="spinner"
    Then a circular animated spinner should display

  Scenario: Dots spinner
    Given an element with lx-type="dots"
    Then three animated dots should display

  Scenario: Bars spinner
    Given an element with lx-type="bars"
    Then animated bars should display

  Scenario: Pulse spinner
    Given an element with lx-type="pulse"
    Then a pulsing circle should display

  # Skeleton Screens
  Scenario: Text skeleton
    Given an element with lx-skeleton="text"
    Then a text skeleton placeholder should display
    And it should have shimmer animation

  Scenario: Image skeleton
    Given an element with lx-skeleton="image"
    Then an image skeleton placeholder should display
    And it should match the image aspect ratio

  Scenario: Card skeleton
    Given an element with lx-skeleton="card"
    Then a complete card skeleton should display
    And it should include header, body, and footer

  Scenario: Custom skeleton
    Given an element with lx-skeleton="custom" and lx-template="#my-skeleton"
    Then the custom skeleton template should be used

  # Progress Indicators
  Scenario: Determinate progress bar
    Given an element with lx-progress="50" lx-max="100"
    Then a progress bar at 50% should display

  Scenario: Update progress dynamically
    Given an element with lx-progress bound to uploadProgress
    When uploadProgress changes from 25 to 75
    Then the progress bar should animate to 75%

  Scenario: Indeterminate progress bar
    Given an element with lx-progress="indeterminate"
    Then an indeterminate progress bar should display
    And it should have continuous animation

  Scenario: Progress with label
    Given an element with lx-progress="60" lx-show-label="true"
    Then the progress bar should show "60%"

  # Loading Messages
  Scenario: Show loading message
    Given an element with lx-loading="true" lx-message="Loading data..."
    Then the message "Loading data..." should display

  Scenario: Dynamic loading message
    Given an element with lx-message bound to statusMessage
    When statusMessage changes to "Processing..."
    Then the message should update to "Processing..."

  # Button Loading States
  Scenario: Loading button
    Given a button with lx-loading="true"
    Then the button should be disabled
    And a spinner should appear inside the button
    And the button text should still be visible

  Scenario: Button with loading text
    Given a button with lx-loading="true" lx-loading-text="Saving..."
    Then the button text should change to "Saving..."
    And a spinner should display

  # Overlay Loading
  Scenario: Full-screen overlay
    Given an element with lx-overlay="true" lx-loading="true"
    Then a semi-transparent overlay should cover the screen
    And a centered spinner should display
    And page interaction should be blocked

  Scenario: Container overlay
    Given an element with lx-overlay="container" lx-loading="true"
    Then an overlay should cover only the container
    And the spinner should be centered in the container

  # Loading Delays
  Scenario: Delay showing spinner
    Given an element with lx-loading="true" lx-delay="300"
    When loading starts
    Then the spinner should not appear immediately
    When 300ms passes
    Then the spinner should appear

  Scenario: Minimum display time
    Given an element with lx-loading="true" lx-min-duration="1000"
    When loading completes after 200ms
    Then the spinner should stay visible for 1000ms total

  # Lazy Loading Images
  Scenario: Lazy load image
    Given an img with lx-lazy src="/image.jpg"
    When the image is in viewport
    Then the image should start loading
    And a skeleton should show while loading

  Scenario: Lazy load with placeholder
    Given an img with lx-lazy lx-placeholder="/thumb.jpg"
    When the page loads
    Then the placeholder should display
    When the image enters viewport
    Then the full image should load

  Scenario: Intersection Observer lazy loading
    Given 20 images with lx-lazy
    When the page loads
    Then only visible images should load
    When the user scrolls down
    Then images should load as they enter viewport

  # Content Placeholders
  Scenario: Hide content while loading
    Given an element with lx-loading="true" lx-hide-content="true"
    Then the element's content should be hidden
    And a placeholder should display

  Scenario: Show content when loaded
    Given an element with lx-loading="false"
    Then the element's content should be visible
    And no placeholder should display

  # Loading Stages
  Scenario: Multi-stage loading
    Given an element with lx-stage="fetching"
    And stage templates for "fetching", "processing", "complete"
    When lx-stage changes to "processing"
    Then the processing template should display
    When lx-stage changes to "complete"
    Then the complete template should display

  # Error States
  Scenario: Show error state
    Given an element with lx-error="true" lx-error-message="Failed to load"
    Then an error indicator should display
    And the message "Failed to load" should show

  Scenario: Retry button on error
    Given an element with lx-error="true" lx-retry="true"
    Then a retry button should display
    When the retry button is clicked
    Then an "lx:retry" event should be emitted

  # Accessibility
  Scenario: ARIA live region for loading
    Given an element with lx-loading="true"
    Then the element should have aria-live="polite"
    And screen readers should announce loading state

  Scenario: ARIA busy attribute
    Given an element with lx-loading="true"
    Then the element should have aria-busy="true"
    When loading completes
    Then aria-busy should be "false"

  Scenario: Accessible progress bar
    Given a progress bar with lx-progress="60"
    Then it should have role="progressbar"
    And aria-valuenow should be "60"
    And aria-valuemin should be "0"
    And aria-valuemax should be "100"

  # Performance
  Scenario: Efficient skeleton rendering
    Given 100 elements with lx-skeleton="text"
    When the page renders
    Then all skeletons should render in less than 50ms

  Scenario: Smooth animations at 60 FPS
    Given a spinner animation
    Then it should maintain 60 FPS
    And use CSS animations for efficiency

  # Integration with bindX
  Scenario: Bind loading state to data
    Given an element with lx-loading bound to isLoading
    And a button that toggles isLoading
    When the button is clicked
    Then isLoading should become true
    And the loading indicator should appear

  # Custom Spinners
  Scenario: Custom spinner icon
    Given an element with lx-loading="true" lx-icon="custom"
    And a custom SVG icon defined
    Then the custom icon should be used as the spinner

  Scenario: Custom spinner color
    Given an element with lx-loading="true" lx-color="#ff0000"
    Then the spinner should be red

  Scenario: Custom spinner size
    Given an element with lx-loading="true" lx-size="large"
    Then the spinner should be large size

  # Shimmer Effects
  Scenario: Shimmer animation
    Given an element with lx-skeleton="card" lx-shimmer="true"
    Then the skeleton should have shimmer animation
    And the shimmer should move from left to right

  Scenario: Disable shimmer
    Given an element with lx-skeleton="card" lx-shimmer="false"
    Then the skeleton should be static
    And no animation should occur

  # Loading Context
  Scenario: Loading context for nested elements
    Given a container with lx-loading-context="form"
    And multiple inputs inside the container
    When the context loading state becomes true
    Then all inputs should show loading state
    And all should be disabled

  # Events
  Scenario: Emit loading start event
    Given an element with lx-loading
    And an event listener for "lx:loadstart"
    When loading becomes true
    Then an "lx:loadstart" event should be emitted

  Scenario: Emit loading complete event
    Given an element with lx-loading
    And an event listener for "lx:loadend"
    When loading becomes false
    Then an "lx:loadend" event should be emitted

  # MutationObserver
  Scenario: Detect dynamically added loading elements
    Given the loadX module is initialized with observe=true
    When a new element with lx-loading="true" is added
    Then the loading indicator should appear automatically

  # Responsive Loading
  Scenario: Different spinners for mobile/desktop
    Given an element with lx-type="spinner" lx-mobile-type="dots"
    When viewed on mobile
    Then dots spinner should display
    When viewed on desktop
    Then circular spinner should display

  # Loading Priorities
  Scenario: Critical content loads first
    Given elements with lx-priority="high", "medium", "low"
    When the page loads
    Then high priority content should load first
    And low priority should defer

  # Timeout Handling
  Scenario: Loading timeout
    Given an element with lx-loading="true" lx-timeout="5000"
    When 5 seconds pass without completion
    Then a timeout error should be shown
    And an "lx:timeout" event should be emitted
