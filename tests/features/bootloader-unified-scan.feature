Feature: Bootloader Unified DOM Scan
  As a genX bootloader
  I want to scan the DOM once using a single querySelector
  So that I can detect all notation styles with optimal performance

  Background:
    Given the bootloader module is loaded
    And the test environment is clean

  Scenario: Single querySelector finds all genX elements
    Given a page with 100 elements using various genX notations
    When the unified scan function is called
    Then it should issue exactly 1 querySelector call
    And it should find all 100 elements
    And the scan should complete in less than 10ms

  Scenario: Detect fx- (format) attributes
    Given elements with fx-format="currency" attributes
    And elements with fx-bind="value" attributes
    When the bootloader scans for needed modules
    Then it should detect the "fx" module is needed

  Scenario: Detect bx- (bind) attributes
    Given elements with bx-bind="username" attributes
    And elements with bx-debounce="300" attributes
    When the bootloader scans for needed modules
    Then it should detect the "bx" module is needed

  Scenario: Detect ax- (accessibility) attributes
    Given elements with ax-label="Save" attributes
    And elements with ax-icon="home" attributes
    When the bootloader scans for needed modules
    Then it should detect the "ax" module is needed

  Scenario: Detect fmt- CSS classes
    Given elements with class="fmt-currency-USD-2"
    And elements with class="fmt-date-YYYY-MM-DD"
    When the bootloader scans for needed modules
    Then it should detect the "fx" module is needed

  Scenario: Detect bind- CSS classes
    Given elements with class="bind-username-300"
    When the bootloader scans for needed modules
    Then it should detect the "bx" module is needed

  Scenario: Detect acc- CSS classes
    Given elements with class="acc-label-icon-Home"
    When the bootloader scans for needed modules
    Then it should detect the "ax" module is needed

  Scenario: Detect mixed notation styles
    Given elements with fx-format="currency" attributes
    And elements with class="fmt-date-YYYY-MM-DD"
    And elements with bx-bind="value" attributes
    And elements with class="bind-username-300"
    When the bootloader scans for needed modules
    Then it should detect the "fx" module is needed
    And it should detect the "bx" module is needed

  Scenario: Return Set of needed prefixes
    Given elements requiring fx, bx, and ax modules
    When the bootloader scans for needed modules
    Then it should return a Set containing ["fx", "bx", "ax"]
    And the Set should not contain duplicates

  Scenario: Return elements array for parsing
    Given 50 elements with genX notations
    When the bootloader scans for needed modules
    Then it should return an object with "needed" and "elements" properties
    And the "needed" property should be a Set
    And the "elements" property should be an Array of 50 elements

  Scenario: Handle empty DOM gracefully
    Given a page with no genX elements
    When the bootloader scans for needed modules
    Then it should return an empty Array for "needed"
    And it should return an empty Array for "elements"

  Scenario: Performance benchmark with 1000 elements
    Given a page with 1000 elements using mixed notations
    When the bootloader scans for needed modules
    Then the scan should complete in less than 5ms
    And it should correctly identify all needed modules

  Scenario: Ignore non-genX classes
    Given elements with class="btn btn-primary fmt-currency-USD"
    When the bootloader scans for needed modules
    Then it should detect the "fx" module is needed
    And it should not be affected by "btn" or "btn-primary" classes

  Scenario: Handle malformed class attributes
    Given elements with class="" (empty)
    And elements with no class attribute
    And elements with class="fmt-currency-USD-2"
    When the bootloader scans for needed modules
    Then it should detect the "fx" module is needed
    And it should not throw errors for empty/missing classes

  Scenario: Unified selector construction
    Given the bootloader needs to create a unified CSS selector
    When it builds the selector string
    Then the selector should include "[fx-]" for format attributes
    And the selector should include "[bx-]" for bind attributes
    And the selector should include "[ax-]" for accessibility attributes
    And the selector should include "[class*=\"fmt-\"]" for format classes
    And the selector should include "[class*=\"bind-\"]" for bind classes
    And the selector should include "[class*=\"acc-\"]" for accessibility classes
    And all selectors should be comma-separated

  Scenario: Prefix detection from attributes
    Given an element with fx-format="currency"
    When the bootloader detects the prefix for that element
    Then it should return "fx"

  Scenario: Prefix detection from CSS classes
    Given a bootloader test element with class="fmt-currency-USD-2"
    When the bootloader detects the prefix for that element
    Then it should return "fx"

  Scenario: Prefix detection prioritizes attributes over classes
    Given an element with both fx-format="currency" and class="bind-value-300"
    When the bootloader detects the prefix for that element
    Then it should return "fx" (from attribute, not class)
