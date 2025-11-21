Feature: bindX Two-Way Data Binding (bx-model)
  As a developer using bindX
  I want two-way data binding for form inputs
  So that form values automatically sync with JavaScript objects

  Background:
    Given I have a test page with bindX loaded
    And I have a reactive data object with property "name" set to "Alice"

  # Text Input Binding

  Scenario: Bind text input to data property
    Given I have a text input with bx-model="name"
    When bindX scans the DOM
    Then the input value should be "Alice"

  Scenario: Update data from text input
    Given I have a text input with bx-model="name" bound to reactive data
    When I type "Bob" into the input
    Then the data property "name" should be "Bob"

  Scenario: Update input from data change
    Given I have a text input with bx-model="name" bound to reactive data
    When I change the data property "name" to "Charlie"
    Then the input value should be "Charlie"

  # Nested Property Paths

  Scenario: Bind to nested property path
    Given I have a reactive data object with nested property "user.profile.name" set to "David"
    And I have a text input with bx-model="user.profile.name"
    When bindX scans the DOM
    Then the input value should be "David"

  Scenario: Update nested property from input
    Given I have a text input with bx-model="user.address.city" bound to reactive data
    When I type "New York" into the input
    Then the data property "user.address.city" should be "New York"

  # Debouncing

  Scenario: Debounce input updates
    Given I have a text input with bx-model="query" and bx-debounce="300"
    And the input is bound to reactive data
    When I type "test" character by character
    Then the data should not update immediately
    And after 300 milliseconds the data property "query" should be "test"

  # Checkbox Binding

  Scenario: Bind checkbox to boolean property
    Given I have a reactive data object with property "agreed" set to false
    And I have a checkbox with bx-model="agreed"
    When bindX scans the DOM
    Then the checkbox should not be checked

  Scenario: Update boolean from checkbox
    Given I have a checkbox with bx-model="terms" bound to reactive data
    When I check the checkbox
    Then the data property "terms" should be true

  # Select Dropdown Binding

  Scenario: Bind select dropdown to data property
    Given I have a reactive data object with property "country" set to "US"
    And I have a select dropdown with bx-model="country"
    And the select has options "US", "UK", "CA"
    When bindX scans the DOM
    Then the selected option should be "US"

  Scenario: Update data from select change
    Given I have a select dropdown with bx-model="language" bound to reactive data
    When I select the option "Spanish"
    Then the data property "language" should be "Spanish"

  # Type Coercion

  Scenario: Coerce number input to number type
    Given I have a reactive data object with property "age" set to 25
    And I have a number input with bx-model="age"
    When I type "30" into the input
    Then the data property "age" should be number 30

  # Performance

  Scenario: Handle many bound inputs efficiently
    Given I have 50 text inputs all with unique bx-model attributes
    When I update all inputs simultaneously
    Then all data properties should update correctly
    And the total time should be less than 500 milliseconds
