Feature: loadX Initialization Engine
  As a developer
  I want loadX to initialize properly with configuration
  So that I can reliably use loading states across my application

  Background:
    Given the page has loaded
    And the document body exists

  # Core Initialization
  Scenario: Initialize with default configuration
    When loadX is initialized without configuration
    Then loadX should be initialized
    And the default configuration should be applied
    And minDisplayMs should be 300
    And autoDetect should be true
    And telemetry should be false

  Scenario: Initialize with custom configuration
    When loadX is initialized with:
      | property      | value |
      | minDisplayMs  | 500   |
      | autoDetect    | false |
      | telemetry     | false |
    Then loadX should be initialized
    And minDisplayMs should be 500
    And autoDetect should be false

  Scenario: Configuration immutability
    When loadX is initialized with custom configuration
    And an attempt is made to modify the configuration
    Then the configuration should remain unchanged
    And no errors should occur

  # ARIA Live Region Initialization
  Scenario: Create ARIA live region on initialization
    When loadX is initialized
    Then an element with id "lx-live-region" should exist
    And it should have aria-live="polite"
    And it should have aria-atomic="true"
    And it should have class "ax-sr-only"

  Scenario: Skip ARIA live region if already exists
    Given an element with id "lx-live-region" exists
    When loadX is initialized
    Then only one element with id "lx-live-region" should exist

  # DOM Scanning
  Scenario: Scan for lx-strategy attributes
    Given an element with lx-strategy="spinner"
    When loadX is initialized
    Then the element should be detected and registered

  Scenario: Scan for lx-loading attributes
    Given an element with lx-loading="true"
    When loadX is initialized
    Then the element should be detected and registered

  Scenario: Scan for lx- class names
    Given an element with class "lx-spinner"
    When loadX is initialized
    Then the element should be detected and registered

  Scenario: Ignore elements without lx- attributes
    Given an element with no lx- attributes
    When loadX is initialized
    Then the element should not be registered

  # Async Detection Setup
  Scenario: Enable async detection when autoDetect is true
    When loadX is initialized with autoDetect=true
    Then async detection should be enabled
    And fetch should be monitored
    And XMLHttpRequest should be monitored

  Scenario: Disable async detection when autoDetect is false
    When loadX is initialized with autoDetect=false
    Then async detection should not be enabled

  # API Exposure
  Scenario: Expose public API methods
    When loadX is initialized
    Then window.loadX should exist
    And window.loadX.initLoadX should be a function
    And the API should expose applyLoading method
    And the API should expose removeLoading method

  Scenario: Return frozen configuration object
    When loadX is initialized
    Then the returned configuration should be frozen
    And the configuration cannot be modified

  # Registry Initialization
  Scenario: Initialize strategy registry
    When loadX is initialized
    Then a strategy registry should be created
    And the registry should be empty initially

  # Multiple Initialization Prevention
  Scenario: Handle multiple initialization calls
    When loadX is initialized
    And loadX is initialized again
    Then only one ARIA live region should exist
    And no duplicate event listeners should be attached

  # Error Handling
  Scenario: Handle invalid configuration gracefully
    When loadX is initialized with invalid configuration
    Then loadX should use default configuration
    And an error should be logged

  Scenario: Handle missing document.body gracefully
    Given document.body does not exist
    When loadX is initialized
    Then initialization should be deferred
    And should complete when DOMContentLoaded fires

  # Privacy Compliance
  Scenario: Telemetry disabled by default
    When loadX is initialized without telemetry setting
    Then no telemetry data should be collected
    And no network requests should be made

  # Performance
  Scenario: Fast initialization time
    When loadX is initialized
    Then initialization should complete in less than 50ms

  Scenario: Minimal memory footprint
    When loadX is initialized
    Then memory usage should be less than 100KB
