Feature: Bootloader Notation Style Detection
  As a genX bootloader
  I want to detect which notation styles are used in the DOM
  So that I can load only the parsers needed for those styles

  Background:
    Given the bootloader module is loaded
    And the test environment is clean

  Scenario: Detect verbose-only page
    Given a page with only verbose attribute notation
    When the bootloader detects notation styles
    Then it should return ["verbose"]
    And it should not detect colon notation
    And it should not detect JSON notation
    And it should not detect class notation

  Scenario: Detect verbose and class notation
    Given a page with verbose attributes
    And a page with CSS class notation
    When the bootloader detects notation styles
    Then it should return ["verbose", "class"]
    And it should not detect colon notation
    And it should not detect JSON notation

  Scenario: Detect colon syntax in attributes
    Given a page with colon-separated attribute values
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon"]
    And the colon style should be detected from attribute values

  Scenario: Detect JSON opts attributes
    Given a page with fx-opts JSON attributes
    And a page with bx-opts JSON attributes
    And a page with ax-opts JSON attributes
    When the bootloader detects notation styles
    Then it should return ["verbose", "json"]
    And the JSON style should be detected from -opts attributes

  Scenario: Detect all four notation styles
    Given a page with verbose attributes
    And a page with colon-separated attribute values
    And a page with fx-opts JSON attributes
    And a page with CSS class notation
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon", "json", "class"]
    And all four styles should be correctly identified

  Scenario: Detect mixed module notation styles
    Given elements with fx-format="currency:USD:2"
    And elements with bx-bind="username"
    And elements with class="fmt-date-YYYY-MM-DD"
    And elements with ax-opts='{"label":"Save"}'
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon", "json", "class"]

  Scenario: Empty page returns empty set
    Given a page with no genX elements
    When the bootloader detects notation styles
    Then it should return []
    And no notation styles should be detected

  Scenario: Class notation detection handles prefixes correctly
    Given elements with class="fmt-currency-USD-2"
    And elements with class="bind-username-300"
    And elements with class="acc-label-icon-Home"
    When the bootloader detects notation styles
    Then it should return ["class"]
    And it should detect all three class prefixes

  Scenario: Colon detection handles edge cases
    Given an element with fx-format="currency"
    And an element with fx-format="date:YYYY-MM-DD"
    And an element with fx-format="number:2:1000"
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon"]
    And colon detection should handle single and multiple colons

  Scenario: JSON detection validates -opts suffix
    Given an element with fx-opts='{"currency":"USD"}'
    And an element with bx-opts='{"debounce":300}'
    And an element with ax-opts='{"label":"Click me"}'
    When the bootloader detects notation styles
    Then it should return ["verbose", "json"]
    And JSON should be detected from all -opts attributes

  Scenario: Priority detection - verbose always present with others
    Given a page with fx-format="currency:USD"
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon"]
    And verbose should always be included with other styles

  Scenario: Class notation ignores non-genX classes
    Given elements with class="btn btn-primary fmt-currency-USD"
    And elements with class="container mx-auto bind-value-300"
    When the bootloader detects notation styles
    Then it should return ["class"]
    And it should ignore non-genX classes like "btn" and "container"

  Scenario: Performance - detect styles in under 1ms
    Given 1000 elements with mixed notations
    When the bootloader detects notation styles with timing
    Then detection should complete in less than 1ms
    And all styles should be detected correctly

  Scenario: Notation style set is deduplicated
    Given multiple elements with fx-format="currency:USD:2"
    And multiple elements with class="fmt-date-YYYY-MM-DD"
    When the bootloader detects notation styles
    Then it should return ["verbose", "colon", "class"]
    And each style should appear only once in the result
