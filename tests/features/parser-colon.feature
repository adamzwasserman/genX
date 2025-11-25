Feature: Colon Syntax Parser
  As a genX parser module
  I want to parse colon-separated attribute values into configuration objects
  So that developers can use compact shorthand notation

  Background:
    Given the colon parser module is loaded
    And the verbose parser module is loaded for CARDINALITY_ORDERS
    And the test environment is clean

  Scenario: Parse basic colon syntax
    Given an element with fx-format="currency:USD:2"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2"}
    And it should use CARDINALITY_ORDERS.fx for attribute mapping

  Scenario: Parse two-value colon syntax
    Given an element with fx-format="currency:USD"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should map values according to cardinality order

  Scenario: Parse single-value colon syntax (no colons)
    Given an element with fx-format="currency"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And it should handle values without colons

  Scenario: Handle trailing colon
    Given an element with fx-format="currency:USD:"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: ""}
    And empty values should be preserved

  Scenario: Handle multiple trailing colons
    Given an element with fx-format="currency::"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "", decimals: ""}
    And all positions should be mapped even if empty

  Scenario: Handle leading colon
    Given an element with fx-format=":USD:2"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "", currency: "USD", decimals: "2"}
    And empty first value should be preserved

  Scenario: Parse fmtX colon syntax
    Given an element with fx-format="number:2:1000"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "number", decimals: "2", pattern: "1000"}
    And it should use fx cardinality order

  Scenario: Parse bindX colon syntax
    Given an element with bx-bind="username:300"
    When the colon parser parses the element with prefix "bx"
    Then it should return config {bind: "username", debounce: "300"}
    And it should use bx cardinality order

  Scenario: Parse accX colon syntax
    Given an element with ax-label="Save:disk:Ctrl+S"
    When the colon parser parses the element with prefix "ax"
    Then it should return config {label: "Save", icon: "disk", shortcut: "Ctrl+S"}
    And it should use ax cardinality order

  Scenario: Parse dragX colon syntax
    Given an element with dx-draggable="true:dropzone-1"
    When the colon parser parses the element with prefix "dx"
    Then it should return config {draggable: "true", zone: "dropzone-1"}
    And it should use dx cardinality order

  Scenario: Parse loadX colon syntax
    Given an element with lx-src="/data/users.json:500"
    When the colon parser parses the element with prefix "lx"
    Then it should return config {src: "/data/users.json", debounce: "500"}
    And it should use lx cardinality order

  Scenario: Parse navX colon syntax
    Given an element with nx-route="/dashboard:true"
    When the colon parser parses the element with prefix "nx"
    Then it should return config {route: "/dashboard", pushState: "true"}
    And it should use nx cardinality order

  Scenario: Parse tableX colon syntax
    Given an element with tx-sortable="true:10:true"
    When the colon parser parses the element with prefix "tx"
    Then it should return config {sortable: "true", paginate: "10", filter: "true"}
    And it should use tx cardinality order

  Scenario: Parse multiple attributes with mixed notation
    Given an element with fx-format="currency:USD" and fx-decimals="2"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2"}
    And colon and verbose notation should merge correctly

  Scenario: Colon values override verbose values
    Given an element with fx-format="currency:EUR" and fx-currency="USD"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "EUR"}
    And colon notation should take precedence

  Scenario: Handle values with special characters
    Given an element with fx-pattern="[0-9]{3}:[A-Z]{2}"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {pattern: "[0-9]{3}", currency: "[A-Z]{2}"}
    And special characters in values should be preserved

  Scenario: Handle empty string values
    Given an element with fx-format="::2"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "", currency: "", decimals: "2"}
    And empty strings should be distinct from missing values

  Scenario: Parse attribute with more values than cardinality order
    Given an element with fx-format="currency:USD:2:extra:values"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2", pattern: "extra", locale: "values"}
    And all values should be mapped up to cardinality order length

  Scenario: Parse attribute with exactly cardinality order length
    Given an element with fx-format="date:USD:2:YYYY-MM-DD:en-US"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "date", currency: "USD", decimals: "2", pattern: "YYYY-MM-DD", locale: "en-US"}
    And all cardinality positions should be filled

  Scenario: Skip -opts attributes during colon parsing
    Given an element with fx-format="currency:USD" and fx-opts='{"decimals":2}'
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should not parse opts attributes

  Scenario: Skip -raw attributes during colon parsing
    Given an element with fx-format="currency:USD" and fx-raw="100"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should not parse raw attributes

  Scenario: Handle element with no matching attributes
    Given an element with no genX attributes
    When the colon parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur

  Scenario: Handle element with attributes from different prefix
    Given an element with bx-bind="username:300"
    When the colon parser parses the element with prefix "fx"
    Then it should return an empty config object
    And wrong prefix attributes should be ignored

  Scenario: Colon parser performance target
    Given 100 elements with colon syntax attributes
    When the colon parser parses all elements with timing
    Then the average parse time should be less than 0.5ms per element
    And the total parse time should be less than 50ms

  Scenario: Colon parser exports parse function
    When the colon parser module is imported
    Then it should export a parse function
    And the parse function should accept an element parameter
    And the parse function should accept a prefix parameter
    And the parse function should accept a baseConfig parameter

  Scenario: Colon parser uses CARDINALITY_ORDERS from verbose parser
    When the colon parser module is imported
    Then it should import CARDINALITY_ORDERS from verbose parser
    And CARDINALITY_ORDERS should define attribute ordering for all prefixes

  Scenario: Parse with baseConfig from verbose parser
    Given an element with fx-currency="EUR" and fx-format="currency:USD:2"
    When the verbose parser first parses to get baseConfig
    And the colon parser parses with the baseConfig
    Then the final config should be {format: "currency", currency: "USD", decimals: "2"}
    And colon values should override baseConfig values

  Scenario: Preserve non-colon verbose attributes
    Given an element with fx-format="currency:USD" and fx-locale="en-US"
    When the colon parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", locale: "en-US"}
    And non-colon attributes should be included

  Scenario: Handle URL values with colons
    Given an element with lx-src="https://api.example.com/data:500"
    When the colon parser parses the element with prefix "lx"
    Then it should return config {src: "https://api.example.com/data", debounce: "500"}
    And colons in URLs should be preserved in first value

  Scenario: Parse 10 elements in parallel
    Given 10 elements with varying colon syntax attributes
    When the colon parser parses all elements
    Then all elements should be parsed correctly
    And each element should have its own config object
    And no config objects should interfere with each other
