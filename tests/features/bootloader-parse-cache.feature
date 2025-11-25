Feature: Bootloader Parse Cache
  As a genX bootloader
  I want to cache parsed configurations in a WeakMap
  So that elements are parsed once and configs are reused for better performance

  Background:
    Given the bootloader module is loaded
    And the test environment is clean
    And the parse cache is empty

  Scenario: Parse element once and cache configuration
    Given an element with fx-format="currency" fx-currency="USD"
    When the bootloader scans the element
    Then the configuration should be parsed
    And the configuration should be stored in the cache
    And window.genx.getConfig(element) should return the cached config

  Scenario: Retrieve cached configuration without re-parsing
    Given an element with fx-format="currency" fx-currency="USD"
    And the element has been parsed and cached
    When window.genx.getConfig(element) is called
    Then it should return the cached configuration
    And the element should not be re-parsed
    And the lookup should be O(1) time complexity

  Scenario: Cache uses WeakMap for garbage collection
    Given an element with fx-format="currency"
    And the element is parsed and cached
    When the element is removed from the DOM
    And garbage collection occurs
    Then the cached configuration should be eligible for GC
    And the WeakMap should not prevent element cleanup

  Scenario: Multiple elements cached independently
    Given 10 elements with different genX attributes
    When the bootloader scans all elements
    Then each element should have its own cached configuration
    And configurations should not interfere with each other
    And window.genx.getConfig(el) should return correct config for each element

  Scenario: Cache performance with 1000 elements
    Given 1000 elements with genX attributes
    When the bootloader scans all elements with timing
    Then all 1000 elements should be parsed in less than 100ms
    And each configuration should be cached
    And subsequent getConfig() calls should be O(1)

  Scenario: getConfig returns null for non-genX elements
    Given an element with no genX attributes
    When window.genx.getConfig(element) is called
    Then it should return null
    And no cache entry should be created

  Scenario: getConfig returns cached config immediately
    Given an element with bx-bind="username" bx-debounce="300"
    And the element has been parsed and cached
    When window.genx.getConfig(element) is called 100 times
    Then all 100 calls should return the same cached object
    And average lookup time should be less than 0.01ms

  Scenario: Cache handles all 4 notation styles
    Given an element with class="fmt-currency-USD"
    And an element with fx-format="currency:USD:2"
    And an element with fx-opts='{"format":"currency"}'
    And an element with fx-format="number" fx-currency="USD"
    When the bootloader scans all elements
    Then all 4 elements should have cached configurations
    And each cache entry should contain the correct parsed config

  Scenario: getConfig API exposes cache functionality
    When window.genx is initialized
    Then window.genx.getConfig should be a function
    And window.genx.getConfig should accept an element parameter
    And window.genx.getConfig should return an object or null

  Scenario: Cache stores merged configuration from all parsers
    Given an element with fx-format="currency" and class="fmt-currency-USD"
    When the bootloader scans the element
    Then the cache should store the merged configuration
    And class notation should override verbose notation
    And window.genx.getConfig should return the merged config

  Scenario: Cache performance comparison with re-parsing
    Given 100 elements with genX attributes
    When the bootloader scans all elements
    And all configs are cached
    Then 1000 getConfig() calls should complete in less than 1ms
    And 1000 re-parses would take more than 50ms
    And cache provides 50x+ performance improvement

  Scenario: Cache entry structure includes all data
    Given an element with fx-format="currency" fx-currency="USD"
    When the element is parsed and cached
    Then the cache entry should include the config object
    And the config should have format="currency"
    And the config should have currency="USD"

  Scenario: getConfig handles undefined element
    When window.genx.getConfig(undefined) is called
    Then it should return null
    And no errors should occur

  Scenario: getConfig handles null element
    When window.genx.getConfig(null) is called
    Then it should return null
    And no errors should occur

  Scenario: Cache persists across multiple API calls
    Given an element with fx-format="currency"
    When the bootloader scans the element
    And window.genx.getConfig(element) is called
    And window.genx.getConfig(element) is called again
    Then both calls should return the exact same object reference
    And the cache should maintain object identity

  Scenario: Parse cache integration with parser modules
    Given an element with fx-format="currency:USD:2"
    When the bootloader scans the element
    Then the verbose parser should be called
    And the colon parser should be called
    And the JSON parser should be called
    And the class parser should be called
    And the final merged config should be cached

  Scenario: Cache hit tracking for performance analysis
    Given 100 elements with genX attributes
    When the bootloader scans all elements
    And window.genx.getConfig is called 1000 times
    Then there should be 100 cache misses (initial parses)
    And there should be 1000 cache hits (subsequent lookups)
    And cache hit ratio should be 90.9%

  Scenario: WeakMap allows direct element-to-config mapping
    Given an element with fx-format="currency"
    When the element is parsed and cached
    Then the WeakMap should use the element as the key
    And the config object should be the value
    And no string keys or IDs should be needed

  Scenario: Cache handles elements with no parseable notation
    Given an element with fx-format=""
    When the bootloader scans the element
    Then an empty config object should be cached
    And window.genx.getConfig should return the empty config

  Scenario: getConfig performance target
    Given 1000 elements with cached configurations
    When window.genx.getConfig is called 1000 times
    Then the total time should be less than 1ms
    And average lookup time should be less than 0.001ms per call

  Scenario: Cache initialization during bootstrap
    When the bootloader initializes
    Then a WeakMap should be created for the cache
    And the WeakMap should be stored in the bootloader state
    And window.genx.getConfig should be exposed

  Scenario: Cache survives dynamic content changes
    Given an element with fx-format="currency"
    And the element is parsed and cached
    When the element's textContent changes
    Then the cached config should remain unchanged
    And window.genx.getConfig should still return the same config
    And no re-parsing should occur

  Scenario: Multiple calls to getConfig are idempotent
    Given an element with fx-format="currency"
    When window.genx.getConfig(element) is called 5 times
    Then all 5 calls should return identical results
    And the cache should only contain one entry
    And no side effects should occur

  Scenario: Cache memory footprint is minimal
    Given 1000 elements with simple fx-format attributes
    When all elements are parsed and cached
    Then the cache memory overhead should be negligible
    And WeakMap provides native memory efficiency
    And no memory leaks should occur

  Scenario: getConfig works with elements from different modules
    Given an element with fx-format="currency"
    And an element with bx-bind="username"
    And an element with ax-label="Save"
    When the bootloader scans all elements
    Then all elements should have cached configurations
    And getConfig should work for all module types

  Scenario: Cache handles concurrent access safely
    Given 100 elements with genX attributes
    When multiple getConfig calls happen concurrently
    Then all calls should return correct configurations
    And no race conditions should occur
    And cache integrity should be maintained

  Scenario: Bootstrap scan populates cache automatically
    Given a DOM with 500 genX elements
    When window.genx.init() is called
    Then all 500 elements should be automatically cached
    And subsequent getConfig calls should be instant
    And no manual caching should be required
