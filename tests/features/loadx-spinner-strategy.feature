Feature: loadX Spinner Loading Strategy
  As a web developer
  I want to display spinner loading indicators
  So that users know when async operations are in progress

  Background:
    Given loadX is initialized with default configuration
    And the spinner strategy is registered

  Scenario: Display circle spinner
    Given an element with lx-strategy="spinner" and lx-spinner-type="circle"
    When I apply loading state to the element
    Then a circle spinner should be displayed
    And the spinner should have rotating animation
    And the original content should be hidden

  Scenario: Display dots spinner
    Given an element with lx-strategy="spinner" and lx-spinner-type="dots"
    When I apply loading state to the element
    Then a dots spinner should be displayed
    And the dots should have bounce animation
    And the original content should be hidden

  Scenario: Display bars spinner
    Given an element with lx-strategy="spinner" and lx-spinner-type="bars"
    When I apply loading state to the element
    Then a bars spinner should be displayed
    And the bars should have scale animation
    And the original content should be hidden

  Scenario: Custom spinner size
    Given an element with lx-strategy="spinner" and lx-spinner-size="large"
    When I apply loading state to the element
    Then the spinner should have large size class
    And the spinner dimensions should be 48px

  Scenario: Custom spinner color
    Given an element with lx-strategy="spinner" and lx-spinner-color="#FF6B6B"
    When I apply loading state to the element
    Then the spinner color should be "#FF6B6B"

  Scenario: Reduced motion support
    Given the user prefers reduced motion
    And an element with lx-strategy="spinner"
    When I apply loading state to the element
    Then the spinner animation should be disabled
    And a static loading indicator should be shown

  Scenario: Remove spinner loading state
    Given an element with active spinner loading state
    When I remove the loading state
    Then the spinner should be removed
    And the original content should be restored
    And no loading-related classes should remain

  Scenario: Spinner with ARIA announcement
    Given an element with lx-strategy="spinner"
    When I apply loading state to the element
    Then the aria-live region should announce "Loading"
    And the element should have aria-busy="true"

  Scenario: Spinner positioning in button
    Given a button element with lx-strategy="spinner"
    When I apply loading state to the button
    Then the spinner should be centered in the button
    And the button dimensions should be preserved
    And cumulative layout shift should be 0

  Scenario: Default spinner type fallback
    Given an element with lx-strategy="spinner" but no spinner type specified
    When I apply loading state to the element
    Then a circle spinner should be displayed by default
