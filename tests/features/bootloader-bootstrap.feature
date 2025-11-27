Feature: Bootloader Bootstrap Sequence
  As a genX bootloader
  I want to initialize in 6 optimized phases
  So that the entire bootstrap completes in less than 105ms for 1000 elements

  Background:
    Given the bootloader is loaded
    And the test environment is clean
    And DOMContentLoaded has fired

  Scenario: Phase 1 - Unified DOM scan
    Given a page with 1000 genX elements using mixed notations
    When the bootloader executes Phase 1 (unified scan)
    Then it should use a single querySelector for all notations
    And it should return a Set of needed module prefixes
    And it should return an Array of all genX elements
    And Phase 1 should complete in less than 5ms

  Scenario: Phase 2 - Detect notation styles
    Given a page with elements using verbose, colon, JSON, and class notations
    When the bootloader executes Phase 2 (detect notation styles)
    Then it should identify all 4 notation styles present
    And it should return ['class', 'colon', 'json', 'verbose'] (sorted)
    And Phase 2 should complete in less than 3ms
    And it should not load any parsers yet

  Scenario: Phase 2 - Detect only used styles
    Given a page with only verbose and class notation elements
    When the bootloader executes Phase 2
    Then it should identify only 2 notation styles
    And it should return ['class', 'verbose']
    And it should skip colon and JSON detection

  Scenario: Phase 3 - Load required parsers dynamically
    Given Phase 2 detected ['verbose', 'class'] styles
    When the bootloader executes Phase 3 (load parsers)
    Then it should load only verbose and class parser modules
    And it should use dynamic import() for tree-shaking
    And it should not load colon or JSON parsers
    And Phase 3 should complete in less than 15ms

  Scenario: Phase 3 - Deduplicate parser loads
    Given the verbose parser is already loaded
    And Phase 2 detected ['verbose', 'class'] styles
    When the bootloader executes Phase 3
    Then it should skip loading the verbose parser
    And it should only load the class parser
    And it should return both parsers in the result object

  Scenario: Phase 4 - Parse all elements once
    Given 1000 elements scanned in Phase 1
    And all required parsers loaded in Phase 3
    When the bootloader executes Phase 4 (parse all elements)
    Then each element should be parsed exactly once
    And configurations should be cached in parseMap WeakMap
    And Phase 4 should complete in less than 100ms for 1000 elements
    And the function should return the count of parsed elements

  Scenario: Phase 4 - Parser priority order
    Given an element with all 4 notation styles
    When the bootloader executes Phase 4
    Then parsers should be called in order: JSON, Colon, Verbose, Class
    And each parser should receive the merged config from previous parsers
    And the final cached config should reflect all notations merged

  Scenario: Phase 4 - Skip already cached elements
    Given 500 elements already cached in parseMap
    And 500 new uncached elements
    When the bootloader executes Phase 4 with 1000 elements
    Then it should skip the 500 cached elements
    And it should parse only the 500 uncached elements
    And the returned count should be 500

  Scenario: Phase 4 - Performance logging
    Given performance logging is enabled
    And 1000 elements to parse
    When the bootloader executes Phase 4
    Then it should log the parse count and duration
    And the log should match format "genX: Parsed {count} elements in {duration}ms"

  Scenario: Phase 5 - Initialize modules with cache access
    Given all elements are parsed and cached
    And modules fx, bx, ax are needed
    When the bootloader executes Phase 5 (init modules)
    Then each module should be loaded and initialized
    And modules should use genx getConfig API for element configs
    And Phase 5 should use cached configs (no re-parsing)

  Scenario: Phase 6 - Setup MutationObserver
    Given bootstrap phases 1-5 are complete
    When the bootloader executes Phase 6 (setup observer)
    Then a MutationObserver should be created
    And it should watch document.body for childList changes
    And it should watch subtree for nested changes
    And new elements should trigger scan and module init

  Scenario: Phase 6 - Observer debouncing
    Given the MutationObserver is active
    When 50 elements are added in rapid succession
    Then the observer should debounce rescans
    And it should wait 100ms after the last mutation
    And it should perform a single scan for all new elements

  Scenario: Phase 6 - Observer can be disabled
    Given mutation observation is disabled
    When the bootloader executes Phase 6
    Then no MutationObserver should be created
    And dynamic content will require manual init

  Scenario: Complete bootstrap sequence for 1000 elements
    Given a page with 1000 genX elements
    And mixed notation styles (all 4 types)
    And modules fx, bx, ax, dx are needed
    When the complete bootstrap sequence runs
    Then Phase 1 (scan) should complete in less than 5ms
    And Phase 2 (detect styles) should complete in less than 3ms
    And Phase 3 (load parsers) should complete in less than 15ms
    And Phase 4 (parse) should complete in less than 100ms
    And Phase 5 (init modules) should complete in less than 50ms
    And Phase 6 (observer) should complete in less than 5ms
    And total bootstrap time should be less than 105ms

  Scenario: Bootstrap emits genx:ready event
    Given the bootstrap sequence is starting
    When all 6 phases complete successfully
    Then window should fire a "genx:ready" custom event
    And event.detail.loaded should contain array of loaded module prefixes
    And the event should fire after requestAnimationFrame

  Scenario: Bootstrap handles empty page
    Given a page with no genX elements
    When the bootstrap sequence runs
    Then Phase 1 should return empty Set and Array
    And Phase 2 should return empty Array
    And Phase 3 should skip loading parsers
    And Phase 4 should skip parsing
    And Phase 5 should skip module init
    And Phase 6 should still setup observer (if enabled)

  Scenario: Bootstrap handles parser load failure
    Given Phase 2 detected ['verbose', 'badparser']
    When Phase 3 attempts to load parsers
    And the 'badparser' fails to load
    Then Phase 3 should log an error to console
    And it should continue with successfully loaded parsers
    And Phase 4 should use only the loaded parsers

  Scenario: Bootstrap handles module init failure
    Given module fx is needed
    When Phase 5 attempts to initialize fx
    And fx.init() throws an error
    Then the error should be caught and logged
    And other modules should continue initializing
    And the bootstrap should complete successfully

  Scenario: Bootstrap with verbose-only notation
    Given a page with 1000 elements using only verbose notation
    When the bootstrap sequence runs
    Then Phase 2 should detect only ['verbose']
    And Phase 3 should load only the verbose parser
    And the bundle size should be minimized (no unused parsers)

  Scenario: Bootstrap performance breakdown logging
    Given performance logging is enabled
    When the complete bootstrap sequence runs
    Then each phase duration should be logged
    And the total bootstrap duration should be logged
    And logs should use performance.now() for precision

  Scenario: requestAnimationFrame timing
    Given DOMContentLoaded has fired
    When bootstrap() is called
    Then it should wrap execution in requestAnimationFrame
    And Phase 1 should not block first paint
    And the entire sequence should run after first paint

  Scenario: Bootstrap state is idempotent
    Given the bootstrap sequence has completed
    When bootstrap() is called again
    Then already-loaded modules should be skipped
    And already-cached elements should not be re-parsed
    And only new elements/modules should be processed

  Scenario: genx global API availability
    When the bootloader loads
    Then genx API should be defined immediately
    And genx API version should be "1.0.0"
    And genx scan method should be available
    And genx getConfig method should be available
    And genx loadParsers method should be available
    And genx parseAllElements method should be available
    And bootstrap should run asynchronously

  Scenario: Bootstrap with CDN configuration
    Given CDN is configured to "https://cdn.genx.software/v1"
    When Phase 3 loads parsers
    Then parser URLs should use the CDN base
    And URLs should be like "https://cdn.genx.software/v1/parsers/genx-parser-verbose.js"

  Scenario: Bootstrap with local parser paths
    Given CDN is not configured
    When Phase 3 loads parsers
    Then parser URLs should use relative paths
    And URLs should be like "/parsers/genx-parser-verbose.js"

  Scenario: parseMap WeakMap allows garbage collection
    Given 1000 elements are parsed and cached
    When 500 elements are removed from the DOM
    And garbage collection occurs
    Then the 500 removed elements should be GC-eligible
    And the WeakMap should not prevent cleanup
    And the 500 remaining elements should still be cached

  Scenario: Bootstrap cache integration test
    Given a page with 100 elements
    And bootstrap completes all phases
    When genx getConfig is called with element
    Then it should return the cached config immediately
    And no re-parsing should occur
    And the lookup should be O(1) via WeakMap

  Scenario: Bootstrap handles SPA navigation
    Given the initial bootstrap is complete
    When new content is loaded via SPA navigation
    And the MutationObserver detects new elements
    Then new elements should trigger Phase 1 (scan)
    And new notation styles should trigger Phase 3 (load parsers)
    And new elements should trigger Phase 4 (parse)
    And new modules should trigger Phase 5 (init)
    And the process should be debounced (100ms)

  Scenario: Error recovery during bootstrap
    Given Phase 3 parser loading fails completely
    When the bootstrap sequence continues
    Then Phase 4 should skip parsing
    And Phase 5 should still attempt module init
    And bootstrap should complete with partial functionality
    And errors should be logged to console
