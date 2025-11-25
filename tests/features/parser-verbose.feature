Feature: Verbose Attribute Parser
  As a genX parser module
  I want to parse verbose attribute notation into configuration objects
  So that developers can use clear, explicit attribute names

  Background:
    Given the verbose parser module is loaded
    And the test environment is clean

  Scenario: Parse basic verbose attributes
    Given an element with fx-format="currency" and fx-currency="USD"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should extract exactly 2 attributes

  Scenario: Parse multiple verbose attributes
    Given an element with fx-format="currency", fx-currency="USD", and fx-decimals="2"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2"}
    And it should extract exactly 3 attributes

  Scenario: Skip -opts attributes during verbose parsing
    Given an element with fx-format="currency" and fx-opts='{"currency":"USD"}'
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should not include opts in the config
    And it should extract exactly 1 attribute

  Scenario: Skip -raw attributes during verbose parsing
    Given an element with fx-format="currency" and fx-raw="1234.56"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should not include raw in the config
    And it should extract exactly 1 attribute

  Scenario: Parse fmtX verbose attributes
    Given an element with fx-format="number" and fx-decimals="2"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "number", decimals: "2"}

  Scenario: Parse bindX verbose attributes
    Given an element with bx-bind="username" and bx-debounce="300"
    When the verbose parser parses the element with prefix "bx"
    Then it should return config {bind: "username", debounce: "300"}

  Scenario: Parse accX verbose attributes
    Given an element with ax-label="Save" and ax-icon="disk"
    When the verbose parser parses the element with prefix "ax"
    Then it should return config {label: "Save", icon: "disk"}

  Scenario: Parse dragX verbose attributes
    Given an element with dx-draggable="true" and dx-zone="dropzone-1"
    When the verbose parser parses the element with prefix "dx"
    Then it should return config {draggable: "true", zone: "dropzone-1"}

  Scenario: Parse loadX verbose attributes
    Given an element with lx-src="/data/users.json" and lx-debounce="500"
    When the verbose parser parses the element with prefix "lx"
    Then it should return config {src: "/data/users.json", debounce: "500"}

  Scenario: Parse navX verbose attributes
    Given an element with nx-route="/dashboard" and nx-pushState="true"
    When the verbose parser parses the element with prefix "nx"
    Then it should return config {route: "/dashboard", pushState: "true"}

  Scenario: Parse tableX verbose attributes
    Given an element with tx-sortable="true" and tx-paginate="10"
    When the verbose parser parses the element with prefix "tx"
    Then it should return config {sortable: "true", paginate: "10"}

  Scenario: Handle element with no matching attributes
    Given an element with no genX attributes
    When the verbose parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should extract exactly 0 attributes

  Scenario: Handle element with attributes from different prefix
    Given an element with bx-bind="username"
    When the verbose parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should extract exactly 0 attributes

  Scenario: Ignore non-genX attributes
    Given an element with fx-format="currency", class="btn", and data-id="123"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should extract exactly 1 attribute

  Scenario: Parse attributes with special characters
    Given an element with fx-format="custom" and fx-pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "custom", pattern: "[0-9]{3}-[0-9]{2}-[0-9]{4}"}

  Scenario: Parse attributes with empty values
    Given an element with fx-format="" and fx-currency="USD"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "", currency: "USD"}

  Scenario: Parse complex attribute values
    Given an element with fx-format="date" and fx-pattern="YYYY-MM-DD HH:mm:ss"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "date", pattern: "YYYY-MM-DD HH:mm:ss"}

  Scenario: Verbose parser performance target
    Given 100 elements with verbose attributes
    When the verbose parser parses all elements with timing
    Then the average parse time should be less than 0.5ms per element
    And the total parse time should be less than 50ms

  Scenario: Verbose parser exports parse function
    When the verbose parser module is imported
    Then it should export a parse function
    And the parse function should accept an element parameter
    And the parse function should accept a prefix parameter

  Scenario: Verbose parser exports CARDINALITY_ORDERS
    When the verbose parser module is imported
    Then it should export CARDINALITY_ORDERS
    And CARDINALITY_ORDERS should be an object
    And CARDINALITY_ORDERS should define attribute ordering rules

  Scenario: CARDINALITY_ORDERS defines fx module order
    When the verbose parser module is imported
    Then CARDINALITY_ORDERS.fx should exist
    And CARDINALITY_ORDERS.fx should be an array
    And CARDINALITY_ORDERS.fx should define format attribute priority

  Scenario: Parse with CARDINALITY_ORDERS for attribute ordering
    Given an element with fx-currency="USD", fx-format="currency", and fx-decimals="2"
    When the verbose parser parses with cardinality ordering
    Then the config should respect CARDINALITY_ORDERS.fx
    And format should be prioritized first

  Scenario: Skip attributes ending with -opts regardless of prefix
    Given an element with fx-format="currency" and bx-opts='{"bind":"value"}'
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should not include opts in the config

  Scenario: Skip attributes ending with -raw regardless of prefix
    Given an element with fx-format="currency" and tx-raw="data"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should not include raw in the config

  Scenario: Parse attributes with colon values (verbose parser extracts as-is)
    Given an element with fx-format="currency:USD:2"
    When the verbose parser parses the element with prefix "fx"
    Then it should return config {format: "currency:USD:2"}
    And the colon-separated value should not be parsed by verbose parser

  Scenario: Parse 10 elements in parallel
    Given 10 elements with varying verbose attributes
    When the verbose parser parses all elements
    Then all elements should be parsed correctly
    And each element should have its own config object
    And no config objects should interfere with each other

  Scenario: Parser handles attribute name extraction
    Given an element with fx-format="currency" and fx-currency="USD"
    When the verbose parser extracts attribute names
    Then it should identify "format" from "fx-format"
    And it should identify "currency" from "fx-currency"
    And it should strip the prefix and hyphen correctly

  Scenario: Parser preserves attribute value types
    Given an element with fx-format="number" and fx-decimals="2"
    When the verbose parser parses the element with prefix "fx"
    Then the config values should be strings
    And config.format should equal "number"
    And config.decimals should equal "2"

  Scenario: Empty element returns empty config
    Given an empty div element
    When the verbose parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur
