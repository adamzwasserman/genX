Feature: Module Cache Integration
  As a genX module (fmtX, bindX, accX, dragX, loadX, navX, tableX)
  I want to use window.genx.getConfig(element) for configuration
  So that I benefit from O(1) cached lookups instead of re-parsing attributes

  Background:
    Given the bootloader is loaded and initialized
    And the parse cache is populated with element configurations
    And window.genx.getConfig is available

  Scenario: Module uses getConfig instead of getAttribute
    Given an element with fx-format="currency" fx-currency="USD"
    And the element has been parsed and cached during bootstrap
    When a genX module processes the element
    Then it should call window.genx.getConfig(element)
    And it should NOT call element.getAttribute() for configuration
    And it should receive the cached config object

  Scenario: getConfig returns O(1) lookup performance
    Given 1000 elements with cached configurations
    When a module calls getConfig() for each element
    Then the average lookup time should be less than 0.001ms per call
    And the total time for 1000 lookups should be less than 1ms
    And performance should be 50x+ faster than attribute parsing

  Scenario: getConfig works with verbose notation
    Given an element with fx-format="currency" fx-currency="USD" fx-decimals="2"
    And the element has been cached during bootstrap
    When fmtX module calls window.genx.getConfig(element)
    Then it should return {format: "currency", currency: "USD", decimals: "2"}
    And the lookup should be instant (O(1))

  Scenario: getConfig works with colon notation
    Given an element with fx-format="currency:USD:2"
    And the element has been cached during bootstrap
    When fmtX module calls window.genx.getConfig(element)
    Then it should return {format: "currency", currency: "USD", decimals: "2"}
    And the configuration should be identical to verbose notation

  Scenario: getConfig works with JSON notation
    Given an element with fx-opts='{"format":"currency","currency":"USD","decimals":2}'
    And the element has been cached during bootstrap
    When fmtX module calls window.genx.getConfig(element)
    Then it should return {format: "currency", currency: "USD", decimals: 2}
    And numeric types should be preserved from JSON

  Scenario: getConfig works with class notation
    Given an element with class="fmt-currency-USD-2"
    And the element has been cached during bootstrap
    When fmtX module calls window.genx.getConfig(element)
    Then it should return {format: "currency", currency: "USD", decimals: "2"}
    And class notation should produce identical config

  Scenario: fmtX module uses cache for formatting
    Given 100 elements with fx-format attributes
    And all elements are cached during bootstrap
    When fmtX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should NOT parse attributes directly
    And formatting should complete faster than before

  Scenario: bindX module uses cache for binding
    Given 100 elements with bx-bind attributes
    And all elements are cached during bootstrap
    When bindX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached debounce and validation settings
    And binding should be faster than attribute parsing

  Scenario: accX module uses cache for accessibility
    Given 50 elements with ax-label and ax-icon attributes
    And all elements are cached during bootstrap
    When accX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached label and icon configurations
    And accessibility setup should be instant

  Scenario: dragX module uses cache for drag-drop
    Given 50 elements with dx-draggable attributes
    And all elements are cached during bootstrap
    When dragX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached zone and handle configurations
    And drag initialization should be faster

  Scenario: loadX module uses cache for dynamic loading
    Given 20 elements with lx-src attributes
    And all elements are cached during bootstrap
    When loadX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached source and debounce settings
    And load setup should be instant

  Scenario: navX module uses cache for navigation
    Given 30 elements with nx-route attributes
    And all elements are cached during bootstrap
    When navX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached route and pushState settings
    And navigation setup should be faster

  Scenario: tableX module uses cache for table features
    Given 10 elements with tx-sortable attributes
    And all elements are cached during bootstrap
    When tableX initializes and processes all elements
    Then it should call getConfig() for each element
    And it should use cached sortable, paginate, and filter settings
    And table initialization should be instant

  Scenario: Module handles null config gracefully
    Given an element with no genX attributes
    When a module calls window.genx.getConfig(element)
    Then it should return null
    And the module should skip processing that element
    And no errors should occur

  Scenario: Module handles undefined element gracefully
    When a module calls window.genx.getConfig(undefined)
    Then it should return null
    And no errors should occur

  Scenario: Cache integration maintains backward compatibility
    Given existing module code that uses getAttribute()
    When modules are updated to use getConfig()
    Then all existing functionality should work identically
    And no regressions should occur
    And tests should remain green

  Scenario: getConfig returns same object reference on multiple calls
    Given an element with fx-format="currency"
    And the element has been cached
    When a module calls getConfig(element) twice
    Then both calls should return the exact same object reference
    And object identity should be maintained
    And no cloning or copying should occur

  Scenario: Module updates do not affect cached config
    Given an element with fx-format="currency" fx-currency="USD"
    And the element has been cached with config {format: "currency", currency: "USD"}
    When the element's fx-currency attribute is changed to "EUR"
    Then getConfig(element) should still return {format: "currency", currency: "USD"}
    And the cache should not automatically update
    And this is expected behavior (cache is set during bootstrap)

  Scenario: Performance comparison - getConfig vs getAttribute
    Given 1000 elements with genX attributes
    And all elements are cached
    When measuring getConfig() performance
    And comparing to getAttribute() + parsing performance
    Then getConfig should be 50x+ faster
    And 1000 getConfig calls should complete in <1ms
    And 1000 getAttribute + parse calls would take >50ms

  Scenario: Module init pattern - check cache first
    Given an element that may or may not be cached
    When a module processes the element
    Then it should call getConfig(element) first
    And if getConfig returns null, skip the element
    And if getConfig returns a config, use it
    And never call getAttribute() for configuration

  Scenario: Multiple modules access same cached config
    Given an element with fx-format="currency" and class="fmt-currency-USD"
    And the element has been cached with merged config
    When fmtX module calls getConfig(element)
    And another module also calls getConfig(element)
    Then both modules should receive the same config object
    And the cache should serve both modules efficiently

  Scenario: Cache survives DOM mutations
    Given an element with fx-format="currency"
    And the element has been cached
    When the element's textContent changes
    Then getConfig(element) should still return the original config
    And the cache entry should remain valid
    And only attribute changes would invalidate (not implemented in V1)

  Scenario: Module error handling with cache
    Given an element with invalid configuration values
    And the element has been cached with the invalid config
    When a module calls getConfig(element)
    Then it should receive the cached config (even if invalid)
    And the module should validate the config values
    And handle errors appropriately

  Scenario: Cache integration documentation requirement
    Given a genX module implementation
    Then its documentation should specify to use window.genx.getConfig(element)
    And its documentation should specify to never use getAttribute() for genX attributes
    And its documentation should specify to handle null return value gracefully
    And its documentation should specify to expect O(1) lookup performance

  Scenario: Module test patterns with cache
    Given a module test suite
    Then tests should mock window.genx.getConfig()
    And tests should verify getConfig is called, not getAttribute
    And tests should provide test config via mock getConfig
    And tests should assert cache usage

  Scenario: Cache warmup on module lazy load
    Given a module is loaded after bootstrap
    And new elements have been added to the DOM
    When the MutationObserver detects new elements
    Then new elements should be scanned and parsed
    And new configs should be added to the cache
    And the module should use getConfig for new elements

  Scenario: getConfig for dynamically added elements
    Given an element is added to the DOM after bootstrap
    And the element has not been cached yet
    When a module calls getConfig(element)
    Then it should return null (not cached)
    And the module should trigger a rescan or wait for MutationObserver
    And subsequent getConfig calls should return the config

  Scenario: Module performance gains are measurable
    Given performance benchmarks before cache integration
    And performance benchmarks after cache integration
    When comparing init times for 1000 elements
    Then modules should show measurable improvement
    And the improvement should be documented
    And performance regression tests should exist

  Scenario: Cache integration rollout checklist
    Given a module needs cache integration
    Then step 1 should update module to call window.genx.getConfig(element)
    And step 2 should remove all getAttribute() calls for configuration
    And step 3 should add null check for getConfig return value
    And step 4 should update tests to mock getConfig
    And step 5 should verify performance improvement
    And step 6 should update module documentation
    And step 7 should run full regression test suite
