Feature: Dependency Tracking
  As a developer
  I want property accesses to be tracked
  So that computed properties know their dependencies

  Scenario: Track property reads during computation
    Given I have a reactive object with properties a=1 and b=2
    When I execute a computed function that reads both properties
    Then both "a" and "b" should be in the dependency set

  Scenario: Multiple computations track separately
    Given I have a reactive object with x=10, y=20, and z=30
    When I execute computed1 that reads x and y
    And I execute computed2 that reads y and z
    Then computed1 dependencies should be {x, y}
    And computed2 dependencies should be {y, z}

  Scenario: Nested property tracking
    Given I have a reactive object with user.name="Alice"
    When I execute a computation that reads user.name
    Then dependencies should include "user.name"

  Scenario: Dependency cleanup on recomputation
    Given I have a computed property with dependencies {a, b}
    When I recompute and now it only reads {a}
    Then old dependencies should be cleared
    And new dependencies should be {a}

  Scenario: No tracking outside computation context
    Given I have a reactive object with count=5
    When I read count outside of a tracked computation
    Then no dependencies should be tracked

  Scenario: Nested tracking contexts
    Given I have a reactive object with data
    When I execute computed1 that calls computed2 internally
    Then computed1 should track its own dependencies
    And computed2 should track its own dependencies
    And they should not interfere with each other

  Scenario: Array element tracking
    Given I have a reactive array [1, 2, 3]
    When I execute a computation that reads items[0]
    Then "items.0" should be tracked as a dependency
