Feature: CSS Class Parser
  As a genX parser module
  I want to parse CSS class notation into configuration objects
  So that developers can use concise class-based syntax

  Background:
    Given the CSS class parser module is loaded
    And the verbose parser module is loaded for CARDINALITY_ORDERS
    And the test environment is clean

  Scenario: Parse basic CSS class notation for fmtX
    Given an element with class="fmt-currency-USD-2"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2"}
    And it should use CARDINALITY_ORDERS.fx for attribute mapping

  Scenario: Parse CSS class notation for bindX
    Given an element with class="bind-username-300"
    When the class parser parses the element with prefix "bx"
    Then it should return config {bind: "username", debounce: "300"}
    And it should use CARDINALITY_ORDERS.bx for attribute mapping

  Scenario: Parse CSS class notation for accX
    Given an element with class="acc-Save-disk-CtrlS"
    When the class parser parses the element with prefix "ax"
    Then it should return config {label: "Save", icon: "disk", shortcut: "CtrlS"}
    And it should use CARDINALITY_ORDERS.ax for attribute mapping

  Scenario: Parse CSS class notation for dragX
    Given an element with class="drag-true-dropzone1"
    When the class parser parses the element with prefix "dx"
    Then it should return config {draggable: "true", zone: "dropzone1"}
    And it should use CARDINALITY_ORDERS.dx for attribute mapping

  Scenario: Parse CSS class notation for loadX
    Given an element with class="load-/data/users.json-500"
    When the class parser parses the element with prefix "lx"
    Then it should return config {src: "/data/users.json", debounce: "500"}
    And it should use CARDINALITY_ORDERS.lx for attribute mapping

  Scenario: Parse CSS class notation for navX
    Given an element with class="nav-/dashboard-true"
    When the class parser parses the element with prefix "nx"
    Then it should return config {route: "/dashboard", pushState: "true"}
    And it should use CARDINALITY_ORDERS.nx for attribute mapping

  Scenario: Parse CSS class notation for tableX
    Given an element with class="table-true-10-true"
    When the class parser parses the element with prefix "tx"
    Then it should return config {sortable: "true", paginate: "10", filter: "true"}
    And it should use CARDINALITY_ORDERS.tx for attribute mapping

  Scenario: Parse CSS class with two values
    Given an element with class="fmt-currency-USD"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should map values according to cardinality order

  Scenario: Parse CSS class with single value
    Given an element with class="fmt-currency"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency"}

  Scenario: Handle multiple classes preserving non-genX classes
    Given an element with class="btn btn-primary fmt-currency-USD mt-4"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And non-genX classes should remain unchanged in the element

  Scenario: Handle element with only utility classes
    Given an element with class="btn btn-primary mt-4"
    When the class parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur

  Scenario: Map class prefix to module prefix for fmtX
    Given an element with class="fmt-currency-USD"
    When the class parser parses the element with prefix "fx"
    Then it should recognize "fmt" as the class prefix for "fx"
    And it should parse the class correctly

  Scenario: Map class prefix to module prefix for bindX
    Given an element with class="bind-username-300"
    When the class parser parses the element with prefix "bx"
    Then it should recognize "bind" as the class prefix for "bx"

  Scenario: Map class prefix to module prefix for accX
    Given an element with class="acc-Save-disk"
    When the class parser parses the element with prefix "ax"
    Then it should recognize "acc" as the class prefix for "ax"

  Scenario: Map class prefix to module prefix for dragX
    Given an element with class="drag-true-dropzone1"
    When the class parser parses the element with prefix "dx"
    Then it should recognize "drag" as the class prefix for "dx"

  Scenario: Map class prefix to module prefix for loadX
    Given an element with class="load-/data/users.json"
    When the class parser parses the element with prefix "lx"
    Then it should recognize "load" as the class prefix for "lx"

  Scenario: Map class prefix to module prefix for navX
    Given an element with class="nav-/dashboard"
    When the class parser parses the element with prefix "nx"
    Then it should recognize "nav" as the class prefix for "nx"

  Scenario: Map class prefix to module prefix for tableX
    Given an element with class="table-true-10"
    When the class parser parses the element with prefix "tx"
    Then it should recognize "table" as the class prefix for "tx"

  Scenario: Handle class with empty segments
    Given an element with class="fmt-currency--2"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "", decimals: "2"}
    And empty segments should be preserved

  Scenario: Handle class with trailing hyphen
    Given an element with class="fmt-currency-USD-"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: ""}
    And trailing empty values should be preserved

  Scenario: Handle class with leading hyphen
    Given an element with class="fmt--USD-2"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "", currency: "USD", decimals: "2"}
    And leading empty values should be preserved

  Scenario: Parse class exceeding cardinality order
    Given an element with class="fmt-currency-USD-2-YYYY-MM-DD-en-US-extra"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2", pattern: "YYYY-MM-DD", locale: "en-US"}
    And extra values beyond cardinality should be ignored

  Scenario: Parse class with exactly cardinality order length
    Given an element with class="fmt-currency-USD-2-YYYY-MM-DD-en-US"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD", decimals: "2", pattern: "YYYY-MM-DD", locale: "en-US"}
    And all cardinality positions should be filled

  Scenario: Parse multiple elements with class notation
    Given 10 elements with varying CSS class notation
    When the class parser parses all elements
    Then all elements should be parsed correctly
    And each element should have its own config object
    And no config objects should interfere with each other

  Scenario: Class parser performance target
    Given 100 elements with CSS class notation
    When the class parser parses all elements with timing
    Then the average parse time should be less than 0.5ms per element
    And the total parse time should be less than 50ms

  Scenario: Class parser exports parse function
    When the class parser module is imported
    Then it should export a parse function
    And the parse function should accept an element parameter
    And the parse function should accept a prefix parameter
    And the parse function should accept a baseConfig parameter

  Scenario: Class parser exports CLASS_PREFIX_MAP
    When the class parser module is imported
    Then it should export a CLASS_PREFIX_MAP constant
    And CLASS_PREFIX_MAP should map fx to fmt
    And CLASS_PREFIX_MAP should map bx to bind
    And CLASS_PREFIX_MAP should map ax to acc
    And CLASS_PREFIX_MAP should map dx to drag
    And CLASS_PREFIX_MAP should map lx to load
    And CLASS_PREFIX_MAP should map nx to nav
    And CLASS_PREFIX_MAP should map tx to table

  Scenario: Merge class notation with baseConfig
    Given an element with class="fmt-currency-USD" and fx-locale="en-US"
    When the verbose parser first parses to get baseConfig
    And the class parser parses with the baseConfig
    Then the final config should be {format: "currency", currency: "USD", locale: "en-US"}
    And class values should merge with baseConfig

  Scenario: Class notation overrides baseConfig values
    Given an element with class="fmt-currency-USD" and fx-format="number"
    When the verbose parser first parses to get baseConfig
    And the class parser parses with the baseConfig
    Then the final config should be {format: "currency", currency: "USD"}
    And class notation should take precedence

  Scenario: Handle class with special characters in values
    Given an element with class="fmt-date-YYYY/MM/DD"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "date", currency: "YYYY/MM/DD"}
    And special characters should be preserved

  Scenario: Handle class with numeric values
    Given an element with class="bind-amount-500-true"
    When the class parser parses the element with prefix "bx"
    Then it should return config {bind: "amount", debounce: "500", validate: "true"}
    And numeric strings should be preserved as strings

  Scenario: Handle element with no class attribute
    Given an element with no class attribute
    When the class parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur

  Scenario: Handle element with empty class attribute
    Given an element with class=""
    When the class parser parses the element with prefix "fx"
    Then it should return an empty config object
    And no errors should occur

  Scenario: Handle class starting with wrong prefix
    Given an element with class="bind-username-300"
    When the class parser parses the element with prefix "fx"
    Then it should return an empty config object
    And wrong prefix classes should be ignored

  Scenario: Use CARDINALITY_ORDERS from verbose parser
    When the class parser module is imported
    Then it should import CARDINALITY_ORDERS from verbose parser
    And CARDINALITY_ORDERS should define attribute ordering for all prefixes

  Scenario: Parse class with URL values
    Given an element with class="load-https://api.example.com/data-500"
    When the class parser parses the element with prefix "lx"
    Then it should return config {src: "https://api.example.com/data", debounce: "500"}
    And URL values should be parsed correctly

  Scenario: Parse class with file path values
    Given an element with class="load-/data/users.json-500-true"
    When the class parser parses the element with prefix "lx"
    Then it should return config {src: "/data/users.json", debounce: "500", cache: "true"}
    And file paths should be parsed correctly

  Scenario: Handle multiple genX classes for different modules
    Given an element with class="fmt-currency-USD bind-amount-300"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "currency", currency: "USD"}
    And it should only parse classes for the requested prefix

  Scenario: Handle camelCase in class values
    Given an element with class="bind-firstName-300"
    When the class parser parses the element with prefix "bx"
    Then it should return config {bind: "firstName", debounce: "300"}
    And camelCase should be preserved

  Scenario: Handle kebab-case preservation
    Given an element with class="fmt-date-YYYY-MM-DD"
    When the class parser parses the element with prefix "fx"
    Then it should return config {format: "date", currency: "YYYY-MM-DD"}
    And hyphens in pattern values should be handled

  Scenario: Handle mixed notation - class with verbose attributes
    Given an element with class="fmt-currency" and fx-currency="USD" and fx-decimals="2"
    When the verbose parser first parses to get baseConfig
    And the class parser parses with the baseConfig
    Then the final config should be {format: "currency", currency: "USD", decimals: "2"}
    And all notation styles should merge correctly

  Scenario: Class parser uses cardinality order for positional mapping
    Given an element with class="fmt-currency-USD-2"
    When the class parser parses the element with prefix "fx"
    Then the first segment "currency" should map to position 0 (format)
    And the second segment "USD" should map to position 1 (currency)
    And the third segment "2" should map to position 2 (decimals)
    And the mapping should follow CARDINALITY_ORDERS.fx array
