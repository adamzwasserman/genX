Feature: Polymorphic Notation Performance Validation
  As a GenX performance engineer
  I want to ensure the bootloader meets all performance targets
  So that the system is 6× faster than V1 with smaller bundles

  Background:
    Given the polymorphic bootloader is loaded
    And performance measurement tools are initialized

  # Core Performance Targets

  Scenario: Single scan completes in under 5ms for 1000 elements
    Given a DOM with 1000 elements with various notations
    When the bootloader performs a single unified scan
    Then the scan should complete in less than 5 milliseconds
    And all 1000 elements should be discovered
    And the scan should identify all 4 notation styles

  Scenario: Parse operations complete once per element (no re-parsing)
    Given a DOM with 1000 elements with notation styles
    When the bootloader scans and caches all elements
    And performance metrics are collected
    Then each element should be parsed exactly once
    And subsequent lookups should use cached results
    And parse time should be under 100 milliseconds total

  Scenario: Module initialization completes in under 105ms
    Given all genX modules are ready to initialize
    When the bootloader initializes all modules
    Then initialization should complete in less than 105 milliseconds
    And all modules should be loaded
    And the cache should be populated

  Scenario: Cache lookups are O(1) constant time
    Given a WeakMap cache with 1000 parsed elements
    When 10000 cache lookups are performed
    Then average lookup time should be under 0.001ms per lookup
    And lookup time should not increase with cache size
    And all lookups should be successful

  # Bundle Size Targets

  Scenario: Verbose-only bundle is under 8KB
    Given only the verbose notation parser is included
    When the bundle is measured
    Then the bundle size should be less than 8 kilobytes
    And the bundle should include only verbose parser
    And no other notation parsers should be present

  Scenario: Full polymorphic bundle shows 33% reduction per notation
    Given all 4 notation parsers are included
    When compared to 4 separate bootloader instances
    Then the polymorphic bundle should be 33% smaller
    And shared code should not be duplicated
    And each parser should be independently functional

  # V1 Baseline Comparison

  Scenario: 6× faster than V1 baseline (single scan)
    Given V1 baseline scan time for 1000 elements is measured
    And V2 polymorphic scan time for 1000 elements is measured
    When the performance ratio is calculated
    Then V2 should be at least 6× faster than V1
    And the improvement should be consistent across runs

  Scenario: 6× faster than V1 baseline (full initialization)
    Given V1 baseline initialization time is measured
    And V2 polymorphic initialization time is measured
    When the performance ratio is calculated
    Then V2 should be at least 6× faster than V1
    And memory usage should not increase significantly

  # Notation Style Performance

  Scenario: Verbose notation parsing performance
    Given 250 elements with verbose notation (fx-format="...")
    When verbose notation is parsed
    Then parsing should complete in under 25 milliseconds
    And cache hit rate should be above 95% on second pass

  Scenario: JSON notation parsing performance
    Given 250 elements with JSON notation {fmt:"..."}
    When JSON notation is parsed
    Then parsing should complete in under 25 milliseconds
    And cache hit rate should be above 95% on second pass

  Scenario: Colon notation parsing performance
    Given 250 elements with colon notation (format:type)
    When colon notation is parsed
    Then parsing should complete in under 25 milliseconds
    And cache hit rate should be above 95% on second pass

  Scenario: CSS class notation parsing performance
    Given 250 elements with CSS class notation (.fx-currency)
    When CSS class notation is parsed
    Then parsing should complete in under 25 milliseconds
    And cache hit rate should be above 95% on second pass

  # Cache Performance

  Scenario: Cache efficiency with 10,000 elements
    Given a DOM with 10000 elements with mixed notations
    When the bootloader scans and caches all elements
    Then scan should complete in under 50 milliseconds
    And cache should contain 10000 entries
    And memory usage should be under 2MB

  Scenario: Cache invalidation does not slow down system
    Given a cached DOM with 1000 elements
    When 100 elements are dynamically removed
    And cache entries are garbage collected
    Then cache cleanup should not block the main thread
    And remaining cached elements should still be accessible
    And performance should not degrade

  # Real-World Performance

  Scenario: Page load with 5000 formatted elements
    Given a realistic page with 5000 formatted elements
    And mixed notation styles across the page
    When the page loads and bootloader initializes
    Then DOMContentLoaded should not be delayed
    And formatting should complete within 100ms of load
    And user should not perceive any delay

  Scenario: Dynamic content injection performance
    Given a page with existing formatted elements
    When 100 new formatted elements are injected
    Then new elements should be formatted within 5ms
    And existing elements should not be re-processed
    And no layout thrashing should occur

  # Memory Performance

  Scenario: Memory usage scales linearly with element count
    Given DOMs with 100, 1000, and 10000 elements
    When memory usage is measured for each
    Then memory should scale linearly with element count
    And there should be no memory leaks
    And WeakMap should allow garbage collection

  Scenario: No memory leaks over extended usage
    Given a page with formatted elements
    When 1000 DOM mutations occur (add/remove)
    And memory snapshots are taken before and after
    Then memory usage should not grow unbounded
    And garbage collection should reclaim unused memory

  # Edge Case Performance

  Scenario: Performance with deeply nested elements
    Given a DOM tree with 100 levels of nesting
    And formatted elements at various depths
    When the bootloader scans the tree
    Then scan should complete in under 10 milliseconds
    And all nested elements should be found
    And recursion should not cause stack overflow

  Scenario: Performance with many modules initialized
    Given 20 genX modules are registered
    When the bootloader initializes all modules
    Then initialization should complete in under 200ms
    And modules should load in parallel where possible
    And dependencies should be resolved correctly

  # Regression Tests

  Scenario: Performance does not regress with cache size
    Given a cache with 1000 entries
    When 10000 additional elements are scanned
    Then scan time should remain under 5ms per 1000 elements
    And cache lookup time should remain constant
    And no performance degradation should occur

  Scenario: Performance with mixed fast and slow formatters
    Given elements using both fast (currency) and slow (date) formatters
    When formatting is applied
    Then slow formatters should not block fast formatters
    And total time should be dominated by slowest formatter
    And parallelization should be used where possible

  # Production Monitoring

  Scenario: Performance metrics are logged in production
    Given performance monitoring is enabled
    When the bootloader completes initialization
    Then scan time should be logged
    And parse time should be logged
    And cache efficiency should be logged
    And metrics should be available for analysis

  Scenario: Performance degradation triggers warnings
    Given performance thresholds are configured
    When scan time exceeds 10ms threshold
    Then a performance warning should be logged
    And metrics should be captured for debugging
    And the warning should include timing breakdown
