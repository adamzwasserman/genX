Feature: One-Way Data Binding
  As a developer
  I want elements to display data values
  So that my UI stays in sync with data changes

  Scenario: Display text content
    Given I have a span element with bx-bind="user.name"
    And reactive data { user: { name: "Alice" } }
    Then the span should display "Alice"

  Scenario: Update on data change
    Given I have a span with bx-bind="count"
    And reactive data { count: 0 }
    When I set data.count = 42
    Then the span should update to "42"

  Scenario: Display nested property
    Given I have a div with bx-bind="user.profile.city"
    And reactive data with nested properties
    Then the div should display the nested value

  Scenario: Input value binding (read-only)
    Given I have an input with bx-bind="username" readonly
    And reactive data { username: "admin" }
    Then the input value should be "admin"
    But user typing should not update data

  Scenario: Multiple elements bound to same path
    Given I have 3 spans with bx-bind="count"
    And reactive data { count: 5 }
    When I change data.count to 10
    Then all 3 spans should update to "10"

  Scenario: XSS prevention
    Given I have a span with bx-bind="malicious"
    And data containing "<script>alert('xss')</script>"
    Then the script should be displayed as text
    And not executed as HTML

  Scenario: Binding cleanup
    Given I have a span with bx-bind="temp"
    When I destroy the binding
    Then the binding should be removed from registry
    And no memory leaks should occur

  Scenario: Empty value handling
    Given I have a span with bx-bind="value"
    And data { value: "" }
    Then the span should display empty string
    And not show "undefined" or "null"

  Scenario: Boolean value display
    Given I have a span with bx-bind="active"
    And data { active: true }
    Then the span should display "true"

  Scenario: Null and undefined handling
    Given I have a span with bx-bind="missing"
    And data { }
    Then the span should display empty string
    And not throw an error
