Feature: Bootloader Dynamic Parser Loading
  As a genX bootloader
  I want to load only the parsers needed for detected notation styles
  So that I minimize bundle size and optimize performance

  Background:
    Given the bootloader module is loaded
    And the test environment is clean

  Scenario: Load only verbose parser when detected
    Given a page with only verbose attribute notation
    When the bootloader scans for needed modules
    And the bootloader detects notation styles
    And the bootloader loads parsers for detected styles
    Then it should load the verbose parser
    And it should not load the colon parser
    And it should not load the JSON parser
    And it should not load the class parser

  Scenario: Load verbose and colon parsers when both detected
    Given a page with verbose attributes
    And a page with colon-separated attribute values
    When the bootloader scans for needed modules
    And the bootloader detects notation styles
    And the bootloader loads parsers for detected styles
    Then it should load the verbose parser
    And it should load the colon parser
    And it should not load the JSON parser
    And it should not load the class parser

  Scenario: Load all four parsers when all styles detected
    Given a page with verbose attributes
    And a page with colon-separated attribute values
    And a page with fx-opts JSON attributes
    And a page with CSS class notation
    When the bootloader scans for needed modules
    And the bootloader detects notation styles
    And the bootloader loads parsers for detected styles
    Then it should load the verbose parser
    And it should load the colon parser
    And it should load the JSON parser
    And it should load the class parser

  Scenario: Load parsers in parallel
    Given a page with all four notation styles
    When the bootloader loads parsers for detected styles with timing
    Then all parsers should load in parallel
    And the total load time should be less than the sum of individual times
    And the load time should be less than 50ms

  Scenario: Skip unused parsers for bundle savings
    Given a page with only verbose attribute notation
    When the bootloader loads parsers for detected styles
    Then the bundle should not include colon parser
    And the bundle should not include JSON parser
    And the bundle should not include class parser
    And the bundle size should be approximately 2KB (verbose only)

  Scenario: Handle parser load failures gracefully
    Given a page with verbose attributes
    And the verbose parser fails to load
    When the bootloader attempts to load parsers
    Then it should catch the load error
    And it should log an error message
    And it should not crash the bootloader
    And it should continue with available parsers

  Scenario: Handle network delays during parser loading
    Given a page with verbose and colon notation
    And parser loading is delayed by 30ms
    When the bootloader loads parsers for detected styles with timing
    Then it should complete within 50ms
    And both parsers should load successfully

  Scenario: Parser URLs are configurable via CDN
    Given a page with verbose attributes
    And the CDN base URL is set to "https://cdn.genx.software/v1"
    When the bootloader constructs parser URLs
    Then the verbose parser URL should be "https://cdn.genx.software/v1/parsers/genx-parser-verbose.js"
    And the colon parser URL should be "https://cdn.genx.software/v1/parsers/genx-parser-colon.js"
    And the JSON parser URL should be "https://cdn.genx.software/v1/parsers/genx-parser-json.js"
    And the class parser URL should be "https://cdn.genx.software/v1/parsers/genx-parser-class.js"

  Scenario: Use relative URLs when CDN not configured
    Given a page with verbose attributes
    And no CDN base URL is configured
    When the bootloader constructs parser URLs
    Then the verbose parser URL should be "/parsers/genx-parser-verbose.js"
    And the colon parser URL should be "/parsers/genx-parser-colon.js"

  Scenario: Parser modules export expected interface
    Given a page with verbose attributes
    When the verbose parser is loaded
    Then it should export a parse function
    And the parse function should accept an element parameter
    And the parse function should accept a prefix parameter
    And the parse function should return a configuration object

  Scenario: Parsers are cached after initial load
    Given a page with verbose attributes
    When the bootloader loads parsers for detected styles
    And the bootloader loads parsers again
    Then it should use the cached verbose parser
    And it should not make a second network request
    And the second load should be instantaneous

  Scenario: Empty page loads no parsers
    Given a page with no genX elements
    When the bootloader detects notation styles
    And the bootloader loads parsers for detected styles
    Then it should load zero parsers
    And the bundle should be minimal (bootloader only)

  Scenario: Parser loading performance target
    Given a page with all four notation styles
    When the bootloader loads parsers for detected styles with timing
    Then the total parser load time should be less than 50ms
    And all parsers should be available for use
    And no parsers should have load errors

  Scenario: Dynamic import() is used for parser loading
    Given a page with verbose attributes
    When the bootloader loads parsers
    Then it should use dynamic import() for the verbose parser
    And the import should be asynchronous
    And the import should support tree-shaking

  Scenario: Failed parser loads don't block other parsers
    Given a page with verbose, colon, and JSON notation
    And the colon parser fails to load
    When the bootloader loads parsers for detected styles
    Then the verbose parser should load successfully
    And the JSON parser should load successfully
    And the colon parser should report an error
    And the bootloader should mark colon parser as unavailable
