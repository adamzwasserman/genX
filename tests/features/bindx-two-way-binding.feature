Feature: Two-Way Data Binding
  As a developer
  I want form inputs to sync with data objects
  So that user input automatically updates my data model

  Scenario: Text input two-way binding
    Given I have an input element with bx-model="user.name"
    And reactive data { user: { name: "Alice" } }
    When I type "Bob" into the input
    Then data.user.name should equal "Bob"
    And the input value should display "Bob"

  Scenario: Data-to-DOM synchronization
    Given I have an input element with bx-model="count"
    And reactive data { count: 0 }
    When I programmatically set data.count = 42
    Then the input value should update to "42"

  Scenario: Checkbox binding
    Given I have a checkbox input with bx-model="agreed"
    And reactive data { agreed: false }
    When I check the checkbox
    Then data.agreed should be true

  Scenario: Select dropdown binding
    Given I have a select element with bx-model="color"
    And reactive data { color: "red" }
    When I select "blue" from the dropdown
    Then data.color should equal "blue"

  Scenario: Number input binding
    Given I have a number input with bx-model="age"
    And reactive data { age: 25 }
    When I type "30" into the input
    Then data.age should equal 30 as a number

  Scenario: Debounced text input
    Given I have an input with bx-model="search" and debounce 300ms
    When I rapidly type "h", "e", "l", "l", "o"
    Then data updates should be debounced
    And only final value "hello" should be set after 300ms

  Scenario: Initial value sync
    Given I have an input with bx-model="username"
    And reactive data { username: "admin" }
    When the binding is created
    Then the input value should immediately show "admin"

  Scenario: Prevent infinite loops
    Given I have an input with bx-model="value"
    And reactive data { value: "test" }
    When data changes from external source
    Then input should update once
    And no infinite loop should occur

  Scenario: Textarea binding
    Given I have a textarea with bx-model="description"
    And reactive data { description: "Hello World" }
    When I type "New text" into the textarea
    Then data.description should equal "New text"

  Scenario: Binding cleanup
    Given I have an input with bx-model="temp"
    When I destroy the binding
    Then event listeners should be removed
    And no memory leaks should occur
