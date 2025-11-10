Feature: Binding Registry
  As the system
  I want to track all active bindings
  So that updates can be efficiently propagated

  Scenario: Register new binding
    Given I have an element with id "name"
    When I create a binding for property "user.name"
    Then the binding should be in the registry
    And it should be associated with the element

  Scenario: Multiple bindings per element
    Given I have an element with multiple bx- attributes
    When I register bx-model and bx-class bindings
    Then both bindings should be in the registry
    And they should not conflict

  Scenario: Automatic cleanup on element removal
    Given I have 100 bound elements
    When I remove all elements from DOM
    Then WeakMap should allow garbage collection
    And no memory leaks should occur

  Scenario: Query bindings by path
    Given I have bindings for "user.name", "user.age", "settings.theme"
    When I query bindings for path "user.*"
    Then I should get bindings for "user.name" and "user.age"
    But not "settings.theme"

  Scenario: Unregister binding
    Given I have a registered binding
    When I unregister the binding
    Then it should be removed from path index
    And it should be removed from all bindings

  Scenario: Get bindings by element
    Given I have an element with 3 bindings
    When I query bindings by element
    Then I should get all 3 bindings

  Scenario: Registry size tracking
    Given I have an empty registry
    When I register 10 bindings
    Then registry size should be 10
    When I unregister 3 bindings
    Then registry size should be 7

  Scenario: Clear all bindings
    Given I have a registry with 50 bindings
    When I call clear()
    Then all bindings should be removed
    And registry size should be 0
