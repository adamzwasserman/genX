Feature: loadX - Declarative Loading States
  As a web developer
  I want declarative loading states through HTML attributes
  So that I can provide great UX during async operations

  # Attribute names follow docs/modules/loadx/api.md: lx-strategy picks the
  # strategy, lx-loading="true" forces the loading state, lx-variant, lx-size
  # and lx-color style the spinner, lx-value/lx-max/lx-show-percentage drive
  # the progress bar and lx-animate toggles the skeleton shimmer.
  # Scenarios tagged @wip describe attributes loadX does not implement yet.

  Background:
    Given the loadX module is loaded
    And the DOM is ready

  # Basic Loading States
  Scenario: Show spinner during load
    Given a loadX element with lx-strategy="spinner" lx-loading="true"
    When the page is rendered
    Then a spinner should be visible

  Scenario: Hide spinner when loaded
    Given a loadX element with lx-strategy="spinner" lx-loading="false"
    When the page is rendered
    Then no spinner should be visible

  Scenario: Toggle loading state
    Given a loadX element with lx-strategy="spinner" lx-loading="false"
    When lx-loading changes to "true"
    Then the spinner should appear
    When lx-loading changes to "false"
    Then the spinner should disappear

  # Spinner Types
  Scenario: Circular spinner
    Given a loadX element with lx-strategy="spinner" lx-variant="circle" lx-loading="true"
    Then a circular animated spinner should display

  Scenario: Dots spinner
    Given a loadX element with lx-strategy="spinner" lx-variant="dots" lx-loading="true"
    Then three animated dots should display

  Scenario: Bars spinner
    Given a loadX element with lx-strategy="spinner" lx-variant="bars" lx-loading="true"
    Then animated bars should display

  # wip: loadX has no pulse spinner variant (dots, circle, bars only)
  @wip
  Scenario: Pulse spinner
    Given an element with lx-type="pulse"
    Then a pulsing circle should display

  # Skeleton Screens
  Scenario: Text skeleton
    Given a loadX element with lx-strategy="skeleton" lx-loading="true"
    Then a text skeleton placeholder should display
    And it should have shimmer animation

  # wip: image skeletons use a fixed height; no aspect-ratio matching yet
  @wip
  Scenario: Image skeleton
    Given an element with lx-skeleton="image"
    Then an image skeleton placeholder should display
    And it should match the image aspect ratio

  # wip: no card skeleton with header, body and footer parts
  @wip
  Scenario: Card skeleton
    Given an element with lx-skeleton="card"
    Then a complete card skeleton should display
    And it should include header, body, and footer

  # wip: no custom skeleton templates (lx-template)
  @wip
  Scenario: Custom skeleton
    Given an element with lx-skeleton="custom" and lx-template="#my-skeleton"
    Then the custom skeleton template should be used

  # Progress Indicators
  Scenario: Determinate progress bar
    Given a loadX element with lx-strategy="progress" lx-value="50" lx-max="100" lx-loading="true"
    Then a progress bar at 50% should display

  Scenario: Update progress dynamically
    Given a loadX element with lx-strategy="progress" lx-value="25" lx-max="100" lx-loading="true"
    When loadX updates the progress to 75
    Then the progress bar should animate to 75%

  Scenario: Indeterminate progress bar
    Given a loadX element with lx-strategy="progress" lx-loading="true"
    Then an indeterminate progress bar should display
    And it should have continuous animation

  Scenario: Progress with label
    Given a loadX element with lx-strategy="progress" lx-value="60" lx-show-percentage="true" lx-loading="true"
    Then the progress bar should show "60%"

  # Loading Messages
  Scenario: Show loading message
    Given a loadX element with lx-strategy="fade" lx-loading="true" lx-message="Loading data..."
    Then the message "Loading data..." should display

  # wip: lx-message is read once when loading starts; no live message updates
  @wip
  Scenario: Dynamic loading message
    Given an element with lx-message bound to statusMessage
    When statusMessage changes to "Processing..."
    Then the message should update to "Processing..."

  # Button Loading States
  # wip: the spinner replaces button content and does not disable the button
  @wip
  Scenario: Loading button
    Given a button with lx-loading="true"
    Then the button should be disabled
    And a spinner should appear inside the button
    And the button text should still be visible

  # wip: no lx-loading-text support
  @wip
  Scenario: Button with loading text
    Given a button with lx-loading="true" lx-loading-text="Saving..."
    Then the button text should change to "Saving..."
    And a spinner should display

  # Overlay Loading
  # wip: no overlay strategy (lx-overlay)
  @wip
  Scenario: Full-screen overlay
    Given an element with lx-overlay="true" lx-loading="true"
    Then a semi-transparent overlay should cover the screen
    And a centered spinner should display
    And page interaction should be blocked

  # wip: no overlay strategy (lx-overlay)
  @wip
  Scenario: Container overlay
    Given an element with lx-overlay="container" lx-loading="true"
    Then an overlay should cover only the container
    And the spinner should be centered in the container

  # Loading Delays
  # wip: no per-element show delay (lx-delay)
  @wip
  Scenario: Delay showing spinner
    Given an element with lx-loading="true" lx-delay="300"
    When loading starts
    Then the spinner should not appear immediately
    When 300ms passes
    Then the spinner should appear

  # wip: minimum display time is the global minDisplayMs config; no per-element lx-min-duration
  @wip
  Scenario: Minimum display time
    Given an element with lx-loading="true" lx-min-duration="1000"
    When loading completes after 200ms
    Then the spinner should stay visible for 1000ms total

  # Lazy Loading Images
  # wip: loadX has no image lazy loading (lx-lazy)
  @wip
  Scenario: Lazy load image
    Given an img with lx-lazy src="/image.jpg"
    When the image is in viewport
    Then the image should start loading
    And a skeleton should show while loading

  # wip: loadX has no image lazy loading (lx-lazy, lx-placeholder)
  @wip
  Scenario: Lazy load with placeholder
    Given an img with lx-lazy lx-placeholder="/thumb.jpg"
    When the page loads
    Then the placeholder should display
    When the image enters viewport
    Then the full image should load

  # wip: loadX has no image lazy loading (lx-lazy)
  @wip
  Scenario: Intersection Observer lazy loading
    Given 20 images with lx-lazy
    When the page loads
    Then only visible images should load
    When the user scrolls down
    Then images should load as they enter viewport

  # Content Placeholders
  Scenario: Hide content while loading
    Given a loadX element with lx-strategy="skeleton" lx-loading="true"
    Then the element's content should be hidden
    And a placeholder should display

  Scenario: Show content when loaded
    Given a loadX element with lx-strategy="skeleton" lx-loading="false"
    Then the element's content should be visible
    And no placeholder should display

  # Loading Stages
  # wip: no multi-stage loading (lx-stage)
  @wip
  Scenario: Multi-stage loading
    Given an element with lx-stage="fetching"
    And stage templates for "fetching", "processing", "complete"
    When lx-stage changes to "processing"
    Then the processing template should display
    When lx-stage changes to "complete"
    Then the complete template should display

  # Error States
  # wip: no error state (lx-error)
  @wip
  Scenario: Show error state
    Given an element with lx-error="true" lx-error-message="Failed to load"
    Then an error indicator should display
    And the message "Failed to load" should show

  # wip: no error state or retry (lx-error, lx-retry)
  @wip
  Scenario: Retry button on error
    Given an element with lx-error="true" lx-retry="true"
    Then a retry button should display
    When the retry button is clicked
    Then an "lx:retry" event should be emitted

  # Accessibility
  # loadX announces through one global polite live region (docs/modules/loadx/usage.md)
  Scenario: ARIA live region for loading
    Given a loadX element with lx-strategy="spinner" lx-loading="true"
    Then the loadX live region should have aria-live="polite"
    And screen readers should announce loading state

  Scenario: ARIA busy attribute
    Given a loadX element with lx-strategy="spinner" lx-loading="true"
    Then the loadX element should have aria-busy="true"
    When lx-loading changes to "false"
    Then the loadX element should no longer be busy

  Scenario: Accessible progress bar
    Given a loadX element with lx-strategy="progress" lx-value="60" lx-loading="true"
    Then the progress bar should have role="progressbar"
    And aria-valuenow should be "60"
    And aria-valuemin should be "0"
    And aria-valuemax should be "100"

  # Performance
  @perf
  Scenario: Efficient skeleton rendering
    Given 100 elements with lx-skeleton="text"
    When the page renders
    Then all skeletons should render in less than 50ms

  @perf
  Scenario: Smooth animations at 60 FPS
    Given a spinner animation
    Then it should maintain 60 FPS
    And use CSS animations for efficiency

  # Integration with bindX
  # wip: bindX has no binding that drives lx-loading
  @wip
  Scenario: Bind loading state to data
    Given an element with lx-loading bound to isLoading
    And a button that toggles isLoading
    When the button is clicked
    Then isLoading should become true
    And the loading indicator should appear

  # Custom Spinners
  # wip: no custom spinner icons (lx-icon)
  @wip
  Scenario: Custom spinner icon
    Given an element with lx-loading="true" lx-icon="custom"
    And a custom SVG icon defined
    Then the custom icon should be used as the spinner

  Scenario: Custom spinner color
    Given a loadX element with lx-strategy="spinner" lx-loading="true" lx-color="#ff0000"
    Then the spinner should be red

  Scenario: Custom spinner size
    Given a loadX element with lx-strategy="spinner" lx-loading="true" lx-size="large"
    Then the spinner should be large size

  # Shimmer Effects
  Scenario: Shimmer animation
    Given a loadX element with lx-strategy="skeleton" lx-animate="true" lx-loading="true"
    Then the skeleton should have shimmer animation
    And the shimmer should move from left to right

  Scenario: Disable shimmer
    Given a loadX element with lx-strategy="skeleton" lx-animate="false" lx-loading="true"
    Then the skeleton should be static
    And no animation should occur

  # Loading Context
  # wip: no loading contexts (lx-loading-context)
  @wip
  Scenario: Loading context for nested elements
    Given a container with lx-loading-context="form"
    And multiple inputs inside the container
    When the context loading state becomes true
    Then all inputs should show loading state
    And all should be disabled

  # Events
  # wip: loadX dispatches no lx:loadstart event
  @wip
  Scenario: Emit loading start event
    Given an element with lx-loading
    And an event listener for "lx:loadstart"
    When loading becomes true
    Then an "lx:loadstart" event should be emitted

  # wip: loadX dispatches no lx:loadend event
  @wip
  Scenario: Emit loading complete event
    Given an element with lx-loading
    And an event listener for "lx:loadend"
    When loading becomes false
    Then an "lx:loadend" event should be emitted

  # MutationObserver
  Scenario: Detect dynamically added loading elements
    Given loadX is initialized on an empty page
    When a new element with lx-strategy="spinner" lx-loading="true" is added
    Then the loading indicator should appear automatically

  # Responsive Loading
  # wip: no responsive spinner variants (lx-mobile-type)
  @wip
  Scenario: Different spinners for mobile/desktop
    Given an element with lx-type="spinner" lx-mobile-type="dots"
    When in loadX, viewed on mobile
    Then dots spinner should display
    When viewed on desktop
    Then circular spinner should display

  # Loading Priorities
  # wip: no loading priorities (lx-priority)
  @wip
  Scenario: Critical content loads first
    Given elements with lx-priority="high", "medium", "low"
    When the page loads
    Then high priority content should load first
    And low priority should defer

  # Timeout Handling
  # wip: no loading timeout (lx-timeout, lx:timeout)
  @wip
  Scenario: Loading timeout
    Given an element with lx-loading="true" lx-timeout="5000"
    When 5 seconds pass without completion
    Then a timeout error should be shown
    And an "lx:timeout" event should be emitted
