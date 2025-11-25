Feature: SmartX Confidence Threshold Configuration
  As a SmartX user
  I want to configure confidence thresholds for smart formatting
  So that only high-confidence formatting is applied automatically

  Background:
    Given the SmartX module is loaded
    And the module is configured with default settings

  Scenario: Default threshold is 75%
    Given no custom threshold is configured
    When an element has fx-smart="true"
    Then the default confidence threshold should be 75
    And format is applied only if confidence >= 75%

  Scenario: Global threshold configuration
    Given I configure SmartX with threshold 80
    When SmartX.configure({threshold: 80}) is called
    Then the global threshold should be 80
    And format is applied only if confidence >= 80%
    And the configuration should be persisted

  Scenario: Element-level threshold override
    Given the global threshold is 75
    And an element has fx-smart="true" fx-smart-threshold="90"
    When SmartX processes the element
    Then it should use threshold 90 for that element
    And the global threshold should remain 75

  Scenario: Above threshold - format applied
    Given the threshold is 80
    And an element has text "123.45"
    And detection confidence is 85%
    And format is "currency"
    When SmartX formats the element
    Then the format should be applied
    And the element should display "$123.45"
    And data-smart-applied="true" should be set

  Scenario: Below threshold - fallback to original
    Given the threshold is 80
    And an element has text "123.45"
    And detection confidence is 70%
    And format is "currency"
    When SmartX formats the element
    Then the format should NOT be applied
    And the element should display "123.45"
    And data-smart-fallback="true" should be set

  Scenario: At threshold boundary - format applied
    Given the threshold is 80
    And an element has text "123.45"
    And detection confidence is exactly 80%
    And format is "currency"
    When SmartX formats the element
    Then the format should be applied
    And the element should display "$123.45"

  Scenario: data-smart-fallback attribute set on low confidence
    Given the threshold is 75
    And an element has text "maybe a date?"
    And detection confidence is 60%
    When SmartX processes the element
    Then data-smart-fallback="true" should be set
    And data-smart-confidence="60" should be set
    And the original text should be preserved

  Scenario: data-smart-applied attribute set on high confidence
    Given the threshold is 75
    And an element has text "2024-01-15"
    And detection confidence is 90%
    And format is "date"
    When SmartX processes the element
    Then data-smart-applied="true" should be set
    And data-smart-confidence="90" should be set
    And the formatted date should be displayed

  Scenario: Threshold validation - minimum 0
    When SmartX.configure({threshold: -10}) is called
    Then the threshold should be set to 0
    And a console warning should be logged

  Scenario: Threshold validation - maximum 100
    When SmartX.configure({threshold: 150}) is called
    Then the threshold should be set to 100
    And a console warning should be logged

  Scenario: Threshold validation - valid range
    When SmartX.configure({threshold: 85}) is called
    Then the threshold should be set to 85
    And no warnings should be logged

  Scenario: Per-element threshold validation
    Given an element has fx-smart-threshold="invalid"
    When SmartX processes the element
    Then the global threshold should be used
    And a console warning should be logged

  Scenario: Per-element threshold validation - out of range
    Given an element has fx-smart-threshold="150"
    When SmartX processes the element
    Then the threshold should be clamped to 100
    And a console warning should be logged

  Scenario: Multiple elements with different thresholds
    Given three elements:
      | Element | Threshold | Confidence | Format   |
      | elem1   | 70        | 75         | currency |
      | elem2   | 80        | 75         | currency |
      | elem3   | 90        | 75         | currency |
    When SmartX processes all elements
    Then elem1 should be formatted
    And elem2 should NOT be formatted
    And elem3 should NOT be formatted

  Scenario: Threshold applies to all smart format types
    Given the threshold is 80
    And elements with different formats:
      | Text         | Format     | Confidence |
      | $123.45      | currency   | 85         |
      | 2024-01-15   | date       | 85         |
      | 1234567890   | phone      | 85         |
      | 12:30 PM     | time       | 85         |
    When SmartX processes all elements
    Then all elements should be formatted
    And all should have data-smart-applied="true"

  Scenario: Threshold does not affect explicit fx-format
    Given an element has fx-format="currency"
    And the threshold is 80
    When the element is processed
    Then the format should be applied regardless of confidence
    And the threshold should be ignored for explicit formats

  Scenario: Configure threshold before SmartX init
    Given SmartX is not yet initialized
    When SmartX.configure({threshold: 85}) is called
    And SmartX.init() is called
    Then the threshold should be 85
    And all subsequent processing should use threshold 85

  Scenario: Configure threshold after SmartX init
    Given SmartX is initialized with default threshold 75
    When SmartX.configure({threshold: 85}) is called
    And new elements are processed
    Then the threshold should be updated to 85
    And all subsequent processing should use threshold 85

  Scenario: Threshold configuration is persistent
    Given SmartX.configure({threshold: 85}) was called
    When the page is refreshed
    And SmartX re-initializes
    Then the threshold should still be 85
    And configuration should be loaded from storage

  Scenario: Threshold affects performance logging
    Given the threshold is 80
    And performance logging is enabled
    And 100 elements are processed
    And 60 elements have confidence >= 80
    And 40 elements have confidence < 80
    When SmartX finishes processing
    Then the performance log should show 60 elements formatted
    And the performance log should show 40 elements fallback
    And the performance log should show threshold 80

  Scenario: Threshold in SmartX.getConfig()
    Given SmartX.configure({threshold: 85}) was called
    When SmartX.getConfig() is called
    Then it should return { threshold: 85, ...other config }
    And the threshold value should be accessible

  Scenario: Reset threshold to default
    Given SmartX.configure({threshold: 90}) was called
    When SmartX.configure({threshold: null}) is called
    Then the threshold should reset to 75
    And subsequent processing should use threshold 75

  Scenario: Threshold affects fx-smart="auto" behavior
    Given an element has fx-smart="auto"
    And the threshold is 80
    And detection confidence is 75%
    When SmartX processes the element
    Then detection should run
    But format should NOT be applied
    And data-smart-fallback="true" should be set

  Scenario: Combining threshold with fx-smart-types
    Given the threshold is 80
    And an element has fx-smart="true" fx-smart-types="currency,date"
    And text "123.45" matches currency with 85% confidence
    And text "123.45" matches date with 70% confidence
    When SmartX processes the element
    Then currency format should be applied
    And date format should NOT be considered
    And the highest-confidence match above threshold wins

  Scenario: Threshold configuration with invalid type
    When SmartX.configure({threshold: "high"}) is called
    Then the threshold should remain at default 75
    And a console warning should be logged

  Scenario: Threshold boundary at 0%
    Given the threshold is 0
    And an element has detection confidence 0%
    When SmartX processes the element
    Then the format should be applied
    And even 0% confidence should pass threshold 0

  Scenario: Threshold boundary at 100%
    Given the threshold is 100
    And an element has detection confidence 99%
    When SmartX processes the element
    Then the format should NOT be applied
    And data-smart-fallback="true" should be set
