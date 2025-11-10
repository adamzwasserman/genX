Feature: Computed Properties
  As a developer
  I want derived values to automatically update
  So that I don't manually manage calculations

  Scenario: Simple computed property
    Given I have reactive data { a: 2, b: 3 }
    And computed property sum = () => data.a + data.b
    Then sum should equal 5

  Scenario: Automatic recomputation on dependency change
    Given I have reactive data { price: 100, tax: 0.1 }
    And computed property total = () => data.price * (1 + data.tax)
    When I set data.tax = 0.2
    Then total should automatically recompute to 120

  Scenario: Nested computed properties
    Given I have reactive data { x: 2 }
    And computed property squared = () => data.x * data.x
    And computed property cubed = () => data.squared * data.x
    Then squared should equal 4
    And cubed should equal 8

  Scenario: Circular dependency detection
    Given I have computed property a = () => data.b + 1
    And computed property b = () => data.a + 1
    Then attempting to evaluate should throw CircularDependencyError
    And error message should show the cycle path

  Scenario: Memoization (cache)
    Given I have computed property expensive = () => heavyComputation()
    When I read expensive 100 times without data changes
    Then heavyComputation should only execute once
    And 99 reads should hit cache

  Scenario: Cache invalidation
    Given I have computed property sum = () => data.a + data.b
    And sum has been computed and cached
    When I change data.a
    Then cache should be invalidated
    And next read should recompute
