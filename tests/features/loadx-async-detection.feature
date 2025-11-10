Feature: Async Operation Detection
  As loadX
  I want to detect async operations automatically
  So that loading states activate without manual triggers

  Scenario: Detect fetch API calls
    Given an element with lx-loading attribute
    When a fetch call is initiated from the element
    Then loading state should activate automatically

  Scenario: Detect XMLHttpRequest calls
    Given an element with lx-loading attribute
    When an XHR request starts
    Then loading state should activate

  Scenario: Detect HTMX events
    Given an element with hx-get attribute
    When htmx:beforeRequest fires
    Then loading state should activate

  Scenario: Detect form submissions
    Given a form with lx-loading attribute
    When the form is submitted
    Then loading state should activate on submit button

  Scenario: Cleanup after async completion
    Given an active loading state
    When the async operation completes
    Then loading state should be removed
    And cleanup should be called
