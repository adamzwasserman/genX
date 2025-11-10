Feature: Polymorphic Attribute Processing
  As a developer
  I want to use multiple syntax styles for loadX
  So that I can choose the most convenient notation

  Background:
    Given loadX is initialized with default configuration

  Scenario: HTML attribute syntax with lx-strategy
    Given an element with lx-strategy="spinner"
    When loadX processes the element
    Then spinner strategy should be selected
    And the element should be registered for loading management

  Scenario: CSS class syntax
    Given an element with class="lx-spinner"
    When loadX processes the element
    Then spinner strategy should be selected
    And the element should be registered for loading management

  Scenario: JSON configuration syntax
    Given an element with lx-config='{"strategy":"spinner","duration":500}'
    When loadX processes the element
    Then configuration should be parsed correctly
    And spinner strategy should be selected
    And duration should be set to 500ms

  Scenario: Colon syntax shorthand for strategy
    Given an element with class="lx:spinner"
    When loadX processes the element
    Then spinner strategy should be selected

  Scenario: Colon syntax with duration parameter
    Given an element with class="lx:spinner:500"
    When loadX processes the element
    Then spinner strategy should be selected
    And duration should be set to 500ms

  Scenario: Multiple syntax styles on same element
    Given an element with lx-strategy="spinner" and class="lx-skeleton"
    When loadX processes the element
    Then attribute syntax should take precedence over class syntax
    And spinner strategy should be selected

  Scenario: Invalid JSON configuration
    Given an element with lx-config='invalid json'
    When loadX processes the element
    Then a parsing error should be logged
    And the element should fall back to default strategy

  Scenario: Missing strategy specification
    Given an element with lx-loading="true" but no strategy
    When loadX processes the element
    Then the default strategy should be selected

  Scenario: Custom strategy via data attribute
    Given an element with data-lx-strategy="skeleton"
    When loadX processes the element
    Then skeleton strategy should be selected

  Scenario: Parsing multiple parameters from colon syntax
    Given an element with class="lx:progress:determinate:500"
    When loadX processes the element
    Then progress strategy should be selected
    And mode should be set to "determinate"
    And duration should be set to 500ms

  Scenario: Empty attribute handling
    Given an element with lx-strategy=""
    When loadX processes the element
    Then the default strategy should be selected

  Scenario: Case insensitive strategy names
    Given an element with lx-strategy="SPINNER"
    When loadX processes the element
    Then spinner strategy should be selected

  Scenario: Whitespace trimming in attributes
    Given an element with lx-strategy="  spinner  "
    When loadX processes the element
    Then spinner strategy should be selected

  Scenario: Complex JSON configuration with multiple options
    Given an element with lx-config='{"strategy":"skeleton","minHeight":"200px","animate":true}'
    When loadX processes the element
    Then skeleton strategy should be selected
    And minHeight should be set to "200px"
    And animate should be true

  Scenario: Processing array of elements with different syntaxes
    Given multiple elements with different lx- syntax styles
    When loadX scans the DOM
    Then all elements should be processed correctly
    And each should have the correct strategy assigned
