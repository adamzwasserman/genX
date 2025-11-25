Feature: SmartX Console Logging for Low Confidence
  As a SmartX developer
  I want to log low-confidence detections to console
  So that I can debug auto-detection issues and tune thresholds

  Background:
    Given the SmartX module is loaded
    And the module is configured with default settings

  Scenario: logTarget='console' enables logging
    Given SmartX.configure({logTarget: 'console'}) is called
    When an element has confidence below threshold
    Then a console warning should be logged
    And the warning should include detection metadata

  Scenario: logTarget='none' disables logging
    Given SmartX.configure({logTarget: 'none'}) is called
    When an element has confidence below threshold
    Then no console warnings should be logged
    And the element should fallback silently

  Scenario: Default logTarget is 'none'
    Given no logTarget is configured
    When an element has confidence below threshold
    Then no console warnings should be logged
    And logging is disabled by default

  Scenario: Structured log data includes all metadata
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element has text "123.45"
    And detection confidence is 70%
    And detected type is "currency"
    When SmartX processes the element
    Then the console warning should include:
      | Field      | Value                           |
      | timestamp  | ISO 8601 format                 |
      | value      | "123.45"                        |
      | confidence | 70                              |
      | threshold  | 80                              |
      | detected   | "currency"                      |
      | applied    | false                           |
      | element    | CSS selector path               |

  Scenario: Element path in log as CSS selector
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element at "body > div.container > span#price"
    And the element has low confidence
    When SmartX processes the element
    Then the log should include element: "body > div.container > span#price"
    And the path should be a valid CSS selector

  Scenario: Warning emoji and formatting
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has low confidence
    When SmartX processes the element
    Then the console warning should start with "⚠️ SmartX:"
    And the message should be formatted for readability
    And the log object should be pretty-printed

  Scenario: Multiple low-confidence elements logged separately
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And three elements with confidence 70%, 65%, 75%
    When SmartX processes all elements
    Then exactly 3 console warnings should be logged
    And each warning should have unique element paths
    And each warning should have different confidence values

  Scenario: High confidence elements are not logged
    Given SmartX.configure({logTarget: 'console', threshold: 75}) is called
    And an element has confidence 85%
    When SmartX processes the element
    Then no console warnings should be logged
    And the element should be formatted silently

  Scenario: At-threshold elements are not logged
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element has confidence exactly 80%
    When SmartX processes the element
    Then no console warnings should be logged
    And the element should pass threshold

  Scenario: Element-level threshold affects logging
    Given SmartX.configure({logTarget: 'console', threshold: 75}) is called
    And an element has fx-smart-threshold="85"
    And the element has confidence 80%
    When SmartX processes the element
    Then a console warning should be logged
    And the log should show threshold: 85
    And the log should show confidence: 80

  Scenario: Log includes original value
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has text "ambiguous123"
    And detection confidence is 60%
    When SmartX processes the element
    Then the log should include value: "ambiguous123"
    And the original text should be preserved in log

  Scenario: Log includes detected type
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And elements with different low-confidence types:
      | Text           | Detected Type | Confidence |
      | 123.45         | currency      | 70         |
      | Jan 15         | date          | 65         |
      | 5551234        | phone         | 60         |
    When SmartX processes all elements
    Then 3 console warnings should be logged
    And each should show the correct detected type

  Scenario: Performance overhead less than 1ms
    Given SmartX.configure({logTarget: 'console'}) is called
    And 100 elements with low confidence
    When SmartX processes all elements with performance measurement
    Then the logging overhead should be less than 1ms total
    And average overhead per log should be less than 0.01ms

  Scenario: Console.warn is used, not console.log
    Given SmartX.configure({logTarget: 'console'}) is called
    And a mock console.warn is installed
    And an element has low confidence
    When SmartX processes the element
    Then console.warn should be called
    And console.log should NOT be called
    And the warning level is appropriate

  Scenario: Log includes data-smart-fallback marker
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element has confidence 70%
    When SmartX processes the element
    Then the element should have data-smart-fallback="true"
    And the log should indicate applied: false
    And the fallback state should be logged

  Scenario: Timestamp in ISO 8601 format
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has low confidence
    When SmartX processes the element
    Then the log timestamp should match ISO 8601 format
    And the timestamp should be recent (within 1 second)

  Scenario: getElementPath generates valid CSS selector
    Given SmartX.configure({logTarget: 'console'}) is called
    And elements at different paths:
      | Path                              |
      | body > div > span                 |
      | #main > .container > span.price   |
      | div:nth-child(3) > span:first-child |
    When SmartX processes all elements
    Then each log should include a valid CSS selector
    And document.querySelector(path) should find the element

  Scenario: Logging does not affect formatting behavior
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element has confidence 70%
    When SmartX processes the element
    Then the element should display original text
    And data-smart-fallback="true" should be set
    And logging should be side-effect only

  Scenario: Configure logTarget after initialization
    Given SmartX is initialized with logTarget: 'none'
    And elements are processed without logs
    When SmartX.configure({logTarget: 'console'}) is called
    And new elements are processed
    Then new low-confidence elements should be logged
    And the configuration should update successfully

  Scenario: Log data is structured for programmatic parsing
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has low confidence
    When SmartX processes the element
    Then the log object should be JSON-serializable
    And all fields should have consistent types
    And the structure should be documented

  Scenario: Element ID in path if available
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has id="product-price"
    And the element has low confidence
    When SmartX processes the element
    Then the element path should include "#product-price"
    And IDs should be preferred in selectors

  Scenario: Element classes in path if no ID
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has class="price currency-usd"
    And no ID is present
    And the element has low confidence
    When SmartX processes the element
    Then the element path should include ".price.currency-usd"
    And classes should be used as fallback

  Scenario: Nth-child for elements without ID or class
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has no id or class attributes
    And the element has low confidence
    When SmartX processes the element
    Then the element path should use :nth-child() selectors
    And the path should uniquely identify the element

  Scenario: Log includes fx-smart-types if specified
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has fx-smart-types="currency,date"
    And the element has low confidence
    When SmartX processes the element
    Then the log should include allowedTypes: ["currency", "date"]
    And the types restriction should be logged

  Scenario: Log shows why detection failed threshold
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element has confidence 70%
    When SmartX processes the element
    Then the log should clearly show threshold=80 > confidence=70
    And the failure reason should be obvious

  Scenario: Console logging persists across page lifecycle
    Given SmartX.configure({logTarget: 'console'}) is called
    When elements are added dynamically
    And they have low confidence
    Then each should be logged
    And logging should remain enabled

  Scenario: getConfig returns logTarget setting
    Given SmartX.configure({logTarget: 'console'}) was called
    When SmartX.getConfig() is called
    Then it should return { logTarget: 'console', ...other config }
    And the logTarget value should be accessible

  Scenario: logTarget validation
    When SmartX.configure({logTarget: 'invalid'}) is called
    Then a console warning should be logged about invalid value
    And logTarget should remain at current value
    And only 'console', 'none', 'http' should be valid

  Scenario: Zero confidence logged
    Given SmartX.configure({logTarget: 'console', threshold: 75}) is called
    And an element has detection confidence 0%
    When SmartX processes the element
    Then a console warning should be logged
    And confidence: 0 should be shown in log

  Scenario: Log format example
    Given SmartX.configure({logTarget: 'console', threshold: 80}) is called
    And an element with text "123.45" has confidence 70%
    When SmartX processes the element
    Then the console warning should look like:
      """
      ⚠️ SmartX: Low confidence detection
      {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "value": "123.45",
        "confidence": 70,
        "threshold": 80,
        "detected": "currency",
        "applied": false,
        "element": "body > div.container > span#price"
      }
      """

  Scenario: Logging does not throw errors
    Given SmartX.configure({logTarget: 'console'}) is called
    And console.warn is undefined (unusual environment)
    When an element has low confidence
    Then SmartX should not throw an error
    And the element should still be processed

  Scenario: Log truncates very long values
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element has text longer than 100 characters
    And the element has low confidence
    When SmartX processes the element
    Then the log value should be truncated
    And the log should indicate truncation with "..."
    And full value should not bloat logs

  Scenario: Multiple calls to configure update logTarget
    Given SmartX.configure({logTarget: 'console'}) was called
    When SmartX.configure({logTarget: 'none'}) is called
    Then subsequent low-confidence elements should not be logged
    And the configuration should update immediately

  Scenario: logTarget is independent of threshold
    Given SmartX.configure({logTarget: 'console', threshold: 90}) is called
    And an element has confidence 85%
    When SmartX processes the element
    Then a console warning should be logged
    And both settings should work together

  Scenario: Logging includes detection cache status
    Given SmartX.configure({logTarget: 'console'}) is called
    And an element value has been cached
    And the cached detection has low confidence
    When SmartX processes the element
    Then the log should indicate cached: true
    And cache hits should be logged
