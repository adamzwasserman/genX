Feature: genX Common Utilities Module
  As a genX module developer
  I want shared utilities for error handling, caching, and common operations
  So that all genX modules have consistent, performant infrastructure

  Background:
    Given the genx-common module is loaded
    And the module is under 2KB gzipped

  Scenario: GenXError class with proper context
    Given I need to report a transformation error
    When I create a GenXError with code "TRANSFORM_001" and message "Invalid format"
    And I include context with element id and attempted value
    Then the error should have name "GenXError"
    And the error should have code "TRANSFORM_001"
    And the error should include the context object
    And the error should have a timestamp
    And the error should be instanceof Error

  Scenario: ParseError for invalid input
    Given I need to parse an invalid attribute value
    When I create a ParseError with the invalid value "bad:syntax:here"
    Then the error should be instanceof GenXError
    And the error message should include "bad:syntax:here"
    And the error code should start with "PARSE_"

  Scenario: EnhancementError for transformation failures
    Given I encounter a transformation failure
    When I create an EnhancementError with element reference
    Then the error should be instanceof GenXError
    And the error should include the element in context
    And the error code should start with "ENHANCE_"

  Scenario: ValidationError for invalid configurations
    Given I receive invalid configuration options
    When I create a ValidationError with the invalid options
    Then the error should be instanceof GenXError
    And the error should include the options in context
    And the error code should start with "VALIDATE_"

  Scenario: Result monad Ok variant
    Given I have a successful operation result
    When I create Result.Ok with value 42
    Then isOk should return true
    And isErr should return false
    And unwrap should return 42
    And unwrapOr with fallback should return 42
    And map with function should transform the value
    And flatMap with function should chain computations

  Scenario: Result monad Err variant
    Given I have a failed operation result
    When I create Result.Err with error "Something failed"
    Then isOk should return false
    And isErr should return true
    And unwrap should throw the error
    And unwrapOr with fallback should return the fallback
    And map with function should not transform
    And flatMap with function should not chain

  Scenario: Result monad error propagation
    Given I have a chain of operations
    When one operation returns Result.Err
    Then all subsequent flatMap operations should be skipped
    And the final result should be the first error

  Scenario: Circuit breaker in CLOSED state
    Given I create a circuit breaker with threshold 3
    And the circuit breaker is in CLOSED state
    When I execute a successful operation
    Then the circuit breaker should remain CLOSED
    And the success count should increment

  Scenario: Circuit breaker transitions to OPEN after threshold
    Given I create a circuit breaker with threshold 3
    And the circuit breaker is in CLOSED state
    When I execute 3 failed operations
    Then the circuit breaker should transition to OPEN
    And subsequent operations should fail immediately
    And the failure message should indicate circuit is open

  Scenario: Circuit breaker OPEN to HALF_OPEN transition
    Given I create a circuit breaker with threshold 3 and timeout 1000ms
    And the circuit breaker is in OPEN state
    When I wait for the timeout period
    Then the circuit breaker should transition to HALF_OPEN
    And the next operation should be attempted

  Scenario: Circuit breaker HALF_OPEN to CLOSED on success
    Given a circuit breaker in HALF_OPEN state
    When I execute a successful operation
    Then the circuit breaker should transition to CLOSED
    And the failure count should reset to 0

  Scenario: Circuit breaker HALF_OPEN to OPEN on failure
    Given a circuit breaker in HALF_OPEN state
    When I execute a failed operation
    Then the circuit breaker should transition back to OPEN
    And the timeout period should restart

  Scenario: Three-level cache with WeakMap L1
    Given I create a three-level cache
    When I cache a value with an object key
    Then the value should be stored in L1 WeakMap cache
    And subsequent retrievals should be instant (<0.01ms)
    And garbage collection should not be prevented

  Scenario: Cache L2 for primitive keys
    Given I create a three-level cache
    When I cache a value with a string key
    Then the value should be stored in L2 Map cache
    And retrieval should be fast (<0.1ms)

  Scenario: Cache L3 for option-based keys
    Given I create a three-level cache
    When I cache a value with complex options object
    Then the options should be hashed for L3 cache key
    And the value should be retrievable by options object
    And different options objects with same values should share cache

  Scenario: Cache miss returns undefined
    Given I create a three-level cache
    When I retrieve a key that doesn't exist
    Then the result should be undefined
    And no error should be thrown

  Scenario: Cache eviction for L2 and L3
    Given I create a three-level cache with max size 1000
    When I cache more than 1000 items
    Then the oldest items should be evicted (LRU)
    And the cache size should not exceed 1000

  Scenario: kebabToCamel conversion
    Given I have kebab-case strings
    When I convert "data-format-currency" to camelCase
    Then the result should be "dataFormatCurrency"
    And "ax-enhance-button" should become "axEnhanceButton"
    And single words should remain unchanged

  Scenario: safeJsonParse with valid JSON
    Given I have a valid JSON string '{"format":"currency","decimals":2}'
    When I parse it with safeJsonParse
    Then the result should be a Result.Ok
    And unwrapping should give the parsed object

  Scenario: safeJsonParse with invalid JSON
    Given I have an invalid JSON string '{bad json}'
    When I parse it with safeJsonParse
    Then the result should be a Result.Err
    And the error message should describe the parsing failure

  Scenario: generateId creates unique IDs
    Given I need to generate unique element IDs
    When I call generateId with prefix "genx"
    Then the result should start with "genx-"
    And subsequent calls should generate different IDs
    And 1000 calls should produce 1000 unique IDs

  Scenario: debounce function execution
    Given I have a function that should be debounced
    When I call the debounced function 5 times within 100ms
    Then the function should only execute once
    And it should execute with the last call's arguments
    And it should execute after the 100ms delay

  Scenario: debounce immediate execution
    Given I have a debounced function with immediate=true
    When I call it for the first time
    Then it should execute immediately
    And subsequent calls within delay should be ignored
    And after delay, the next call should execute immediately again

  Scenario: Module size constraint
    Given the genx-common module is built
    When I measure the gzipped size
    Then it should be less than or equal to 2KB
    And it should not increase module load time by more than 50ms

  Scenario: No XSS vulnerabilities
    Given I pass user input to utility functions
    When the input contains script tags or eval attempts
    Then no code should be executed
    And the utilities should safely handle the input
    And no innerHTML or eval should be used internally

  Scenario: Module export structure
    Given the genx-common module is loaded
    Then window.genxCommon should be defined
    And window.genxCommon.errors should contain all error classes
    And window.genxCommon.Result should contain Ok and Err
    And window.genxCommon.CircuitBreaker should be a class
    And window.genxCommon.cache should contain createCache, hashOptions, getSignature
    And window.genxCommon.utils should contain all utility functions

  Scenario: Integration with fmtX
    Given fmtX module is loaded
    When fmtX uses genx-common error handling
    Then fmtX errors should be instances of GenXError
    And fmtX should use the shared cache utilities
    And there should be no code duplication

  Scenario: Integration with accX
    Given accX module is loaded
    When accX uses genx-common circuit breaker
    Then accX should handle failures gracefully
    And circuit breaker should prevent cascading failures
    And accX should use shared Result monad

  Scenario: Performance - Error creation overhead
    Given I need to create 1000 errors
    When I benchmark error creation
    Then creation time should be under 10ms total
    And memory overhead should be minimal

  Scenario: Performance - Cache operations
    Given I have a cache with 1000 entries
    When I perform 10000 cache lookups
    Then L1 hits should average <0.01ms
    And L2 hits should average <0.1ms
    And L3 hits should average <0.5ms

  Scenario: Performance - Utility functions
    Given I need to process 1000 elements
    When I use utility functions (kebabToCamel, generateId)
    Then total processing time should be under 50ms
    And there should be no memory leaks
