Feature: Reactive Proxy Wrapper
  As a developer
  I want objects to become reactive when wrapped
  So that property changes automatically notify subscribers

  Scenario: Wrap plain object with reactive proxy
    Given I have a plain object with count 0 and name "test"
    When I wrap it with bindx()
    Then property reads should be tracked
    And property writes should trigger notifications

  Scenario: Deep reactivity for nested objects
    Given I have a nested object with user name "Alice" and age 30
    When I wrap it with bindx with deep option true
    Then nested property changes should trigger notifications
    And the notification path should be "user.name"

  Scenario: Shallow reactivity (opt-in)
    Given I have a nested object with user name "Alice"
    When I wrap it with bindx with deep option false
    Then top-level changes trigger notifications
    But nested property changes do not trigger notifications

  Scenario: Circular reference detection
    Given I have an object with circular reference to itself
    When I wrap it with bindx()
    Then it should not cause infinite recursion
    And it should handle the circular reference gracefully

  Scenario: Change notification
    Given I have a reactive object
    When I set a property to a new value
    Then the onChange callback should be invoked
    And it should receive the path and new value

  Scenario: No notification on same value
    Given I have a reactive object with count 5
    When I set count to 5 again
    Then the onChange callback should not be invoked

  Scenario: Proxy metadata storage
    Given I have a plain object
    When I wrap it with bindx()
    Then the proxy should be marked as reactive
    And the original object should be preserved

  Scenario: Array reactivity
    Given I have an array [1, 2, 3]
    When I wrap it with bindx()
    Then array mutations should trigger notifications
    And array access should work normally
