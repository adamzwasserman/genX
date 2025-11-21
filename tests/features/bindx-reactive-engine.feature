Feature: bindX Reactive Engine
  As a developer using bindX
  I want automatic change detection using JavaScript Proxy
  So that UI updates happen automatically when data changes

  Background:
    Given I have a test page with bindX loaded
    And the bindX reactive engine is initialized

  # Basic Reactivity

  Scenario: Create a reactive object
    When I create a reactive object with property "name" set to "Alice"
    Then the object should be a Proxy
    And the object should have property "name" with value "Alice"
    And the object should have "__bindx_proxy__" marker set to true

  Scenario: Detect property changes
    Given I have a reactive object with property "count" set to 0
    And I register a callback for property "count"
    When I change property "count" to 5
    Then the callback should be invoked with value 5
    And the callback should be invoked exactly 1 time

  Scenario: Multiple property changes trigger separate notifications
    Given I have a reactive object with properties "x" set to 1 and "y" set to 2
    And I register a callback for property "x"
    And I register a callback for property "y"
    When I change property "x" to 10
    And I change property "y" to 20
    Then the callback for "x" should be invoked with value 10
    And the callback for "y" should be invoked with value 20

  # Nested Object Reactivity

  Scenario: Nested object properties are reactive
    Given I have a reactive object with nested property "user.profile.name" set to "Bob"
    And I register a callback for property "user.profile.name"
    When I change nested property "user.profile.name" to "Charlie"
    Then the callback should be invoked with value "Charlie"

  Scenario: Adding new nested objects makes them reactive
    Given I have a reactive object with property "data" set to empty object
    When I set property "data.item" to a new object
    And I register a callback for property "data.item.value"
    And I change nested property "data.item.value" to "test"
    Then the callback should be invoked with value "test"

  # Array Reactivity

  Scenario: Array mutations are detected
    Given I have a reactive object with property "items" set to array [1, 2, 3]
    And I register a callback for property "items"
    When I push value 4 to array "items"
    Then the callback should be invoked
    And the array should have length 4

  Scenario: Array element changes are detected
    Given I have a reactive object with property "list" set to array ["a", "b", "c"]
    And I register a callback for property "list"
    When I change array element 1 to "modified"
    Then the callback should be invoked
    And the array element 1 should be "modified"

  # Dependency Tracking

  Scenario: Track property access during computation
    Given I have a reactive object with properties "firstName" set to "John" and "lastName" set to "Doe"
    When I compute a value using properties "firstName" and "lastName"
    Then the dependency tracker should record "firstName" and "lastName" as dependencies

  Scenario: Notify all dependents when property changes
    Given I have a reactive object with property "price" set to 100
    And I have 3 computed values depending on "price"
    When I change property "price" to 150
    Then all 3 computed values should be notified

  # Change Notification System

  Scenario: Batch multiple property changes in single frame
    Given I have a reactive object with properties "a", "b", "c" set to 0
    And I register callbacks for properties "a", "b", "c"
    When I change properties "a", "b", "c" in rapid succession
    Then callbacks should be batched within a single requestAnimationFrame
    And each callback should be invoked exactly once

  Scenario: Prevent duplicate notifications for same property
    Given I have a reactive object with property "status" set to "pending"
    And I register a callback for property "status"
    When I change property "status" to "active"
    And I change property "status" to "active" again
    Then the callback should be invoked exactly 1 time

  # Cycle Detection

  Scenario: Detect infinite update cycles
    Given I have a reactive object with property "x" set to 1
    And I register a callback for property "x" that increments "x"
    When I change property "x" to 2
    Then a cycle detection error should be thrown
    And the error message should contain "Maximum update depth exceeded"

  Scenario: Allow legitimate multiple updates within threshold
    Given I have a reactive object with properties "counter" set to 0 and "target" set to 5
    And I register a callback that increments "counter" until it reaches "target"
    When I change property "counter" to 1
    Then property "counter" should reach 5 without errors

  # WeakMap-based Cleanup

  Scenario: Reactive wrappers use WeakMap for automatic cleanup
    When I create 100 reactive objects
    And I let them go out of scope
    And garbage collection occurs
    Then the WeakMap should not prevent garbage collection
    And no memory leaks should be detected

  Scenario: Disconnecting reactive object stops notifications
    Given I have a reactive object with property "value" set to 10
    And I register a callback for property "value"
    When I disconnect the reactive object
    And I change property "value" to 20
    Then the callback should not be invoked

  # Performance

  Scenario: Property access performance is within target
    Given I have a reactive object with 100 properties
    When I perform 1000 property reads
    Then the average time per read should be less than 0.5 milliseconds
    And the total time should be less than 500 milliseconds

  Scenario: Property mutation performance is within target
    Given I have a reactive object with property "test" set to 0
    When I perform 1000 property writes
    Then the average time per write should be less than 0.5 milliseconds
    And the total time should be less than 500 milliseconds

  # Edge Cases

  Scenario: Handle null and undefined values
    Given I have a reactive object
    When I set property "nullable" to null
    And I set property "undefinable" to undefined
    Then no errors should occur
    And property "nullable" should be null
    And property "undefinable" should be undefined

  Scenario: Handle circular object references
    Given I have a reactive object "parent"
    And I create a reactive object "child"
    When I set "parent.child" to "child"
    And I set "child.parent" to "parent"
    Then no errors should occur
    And both objects should remain reactive

  Scenario: Non-reactive objects are not proxied
    When I create a reactive wrapper for a primitive value 42
    Then the value should remain 42
    And it should not be wrapped in a Proxy

  Scenario: Symbols as property keys are supported
    Given I have a reactive object
    And I create a symbol "testSymbol"
    When I set property using symbol "testSymbol" to "symbol value"
    Then the property should be accessible via the symbol
    And reactivity should work for symbol properties
