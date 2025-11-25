Feature: JSON Parser
  As a genX parser module
  I want to parse JSON-encoded configuration from -opts attributes
  So that developers can use complex configurations in a single attribute

  Background:
    Given the JSON parser module is loaded
    And the test environment is clean

  Scenario: Parse basic JSON configuration
    Given an element with fx-opts='{"format":"currency","currency":"USD"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should use JSON.parse internally

  Scenario: Parse JSON with all fmtX attributes
    Given an element with fx-opts='{"format":"currency","currency":"USD","decimals":2,"pattern":"#,###.##","locale":"en-US"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: 2, pattern: "#,###.##", locale: "en-US"}
    And all attributes should be preserved with correct types

  Scenario: Parse JSON for bindX module
    Given an element with bx-opts='{"bind":"username","debounce":300,"validate":"required"}'
    When the JSON parser parses the element with prefix "bx"
    Then it should return config {bind: "username", debounce: 300, validate: "required"}
    And numeric values should be preserved as numbers

  Scenario: Parse JSON for accX module
    Given an element with ax-opts='{"label":"Save","icon":"disk","shortcut":"Ctrl+S"}'
    When the JSON parser parses the element with prefix "ax"
    Then it should return config {label: "Save", icon: "disk", shortcut: "Ctrl+S"}
    And string values should be preserved

  Scenario: Parse JSON for dragX module
    Given an element with dx-opts='{"draggable":true,"zone":"dropzone-1","handle":".handle"}'
    When the JSON parser parses the element with prefix "dx"
    Then it should return config {draggable: true, zone: "dropzone-1", handle: ".handle"}
    And boolean values should be preserved

  Scenario: Parse JSON for loadX module
    Given an element with lx-opts='{"src":"/data/users.json","debounce":500,"cache":true}'
    When the JSON parser parses the element with prefix "lx"
    Then it should return config {src: "/data/users.json", debounce: 500, cache: true}
    And mixed types should be handled correctly

  Scenario: Parse JSON for navX module
    Given an element with nx-opts='{"route":"/dashboard","pushState":true,"title":"Dashboard"}'
    When the JSON parser parses the element with prefix "nx"
    Then it should return config {route: "/dashboard", pushState: true, title: "Dashboard"}

  Scenario: Parse JSON for tableX module
    Given an element with tx-opts='{"sortable":true,"paginate":10,"filter":true}'
    When the JSON parser parses the element with prefix "tx"
    Then it should return config {sortable: true, paginate: 10, filter: true}

  Scenario: Handle malformed JSON gracefully
    Given an element with fx-opts='{invalid json}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should log a warning about malformed JSON
    And the warning should include the element and error details

  Scenario: Handle JSON with trailing comma
    Given an element with fx-opts='{"format":"currency","currency":"USD",}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should log a warning about malformed JSON

  Scenario: Handle JSON with unquoted keys
    Given an element with fx-opts='{format:"currency"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should log a warning about malformed JSON

  Scenario: Handle JSON with single quotes instead of double quotes
    Given an element with fx-opts="{'format':'currency'}"
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should log a warning about malformed JSON

  Scenario: Handle empty JSON object
    Given an element with fx-opts='{}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no warnings should be logged

  Scenario: Handle whitespace in JSON
    Given an element with fx-opts='  {  "format"  :  "currency"  }  '
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}
    And whitespace should be handled correctly

  Scenario: Handle JSON with nested objects
    Given an element with fx-opts='{"format":"currency","options":{"decimals":2,"symbol":"$"}}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", options: {decimals: 2, symbol: "$"}}
    And nested objects should be preserved

  Scenario: Handle JSON with arrays
    Given an element with fx-opts='{"format":"number","validValues":[1,2,3,4,5]}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "number", validValues: [1,2,3,4,5]}
    And arrays should be preserved

  Scenario: Handle element with no -opts attribute
    Given an element with no -opts attribute
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur

  Scenario: Handle element with attributes from different prefix
    Given an element with bx-opts='{"bind":"username"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And wrong prefix attributes should be ignored

  Scenario: Parse multiple elements with JSON opts
    Given 10 elements with varying JSON opts attributes
    When the JSON parser parses all elements
    Then all elements should be parsed correctly
    And each element should have its own config object
    And no config objects should interfere with each other

  Scenario: JSON parser performance target
    Given 100 elements with JSON opts attributes
    When the JSON parser parses all elements with timing
    Then the average parse time should be less than 0.5ms per element
    And the total parse time should be less than 50ms

  Scenario: JSON parser exports parse function
    When the JSON parser module is imported
    Then it should export a parse function
    And the parse function should accept an element parameter
    And the parse function should accept a prefix parameter

  Scenario: Merge JSON opts with baseConfig
    Given an element with fx-format="number" and fx-opts='{"currency":"USD","decimals":2}'
    When the verbose parser first parses to get baseConfig
    And the JSON parser parses with the baseConfig
    Then the final config should be {format: "number", currency: "USD", decimals: 2}
    And JSON values should merge with baseConfig

  Scenario: JSON opts override baseConfig values
    Given an element with fx-format="number" and fx-opts='{"format":"currency","currency":"USD"}'
    When the verbose parser first parses to get baseConfig
    And the JSON parser parses with the baseConfig
    Then the final config should be {format: "currency", currency: "USD"}
    And JSON notation should take precedence

  Scenario: Handle JSON with null values
    Given an element with fx-opts='{"format":"currency","currency":null}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: null}
    And null values should be preserved

  Scenario: Handle JSON with undefined values (not valid JSON)
    Given an element with fx-opts='{"format":"currency","currency":undefined}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return an empty config object
    And it should log a warning about malformed JSON

  Scenario: Handle JSON with special characters in strings
    Given an element with fx-opts='{"format":"currency","pattern":"#,###.## \"USD\""}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", pattern: "#,###.## \"USD\""}
    And escaped characters should be preserved

  Scenario: Handle very large JSON objects
    Given an element with fx-opts containing 100 key-value pairs
    When the JSON parser parses the element with prefix "fx"
    Then it should return a config object with 100 attributes
    And parsing should complete within performance targets

  Scenario: Log warning includes element selector
    Given an element with id="test-element" and malformed fx-opts
    When the JSON parser parses the element with prefix "fx"
    Then the warning should include "#test-element" in the message
    And developers can identify the problematic element

  Scenario: Log warning includes actual JSON string
    Given an element with fx-opts='{invalid}'
    When the JSON parser parses the element with prefix "fx"
    Then the warning should include the malformed JSON string
    And developers can see what went wrong

  Scenario: Parse JSON with numeric keys (edge case)
    Given an element with fx-opts='{"0":"first","1":"second"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {0: "first", 1: "second"}
    And numeric keys should be handled

  Scenario: Handle JSON with unicode characters
    Given an element with fx-opts='{"format":"currency","symbol":"€"}'
    When the JSON parser parses the element with prefix "fx"
    Then it should return config {format: "currency", symbol: "€"}
    And unicode characters should be preserved
