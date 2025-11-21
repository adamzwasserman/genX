Feature: bindX Polymorphic Syntax
  bindX supports multiple notation styles that compile to identical transformations,
  providing flexibility while maintaining consistent behavior.

  Background:
    Given the bindX module is loaded
    And the test environment is clean

  # ========================================
  # VERBOSE ATTRIBUTE STYLE
  # ========================================

  Scenario: Verbose bx-model with separate debounce attribute
    Given a reactive data object with name=""
    And an input with attributes:
      | attribute     | value     |
      | bx-model      | name      |
      | bx-debounce   | 300       |
    When the container is scanned
    Then the input should have a two-way binding to "name"
    And the binding should have debounce=300

  Scenario: Verbose bx-bind with formatter attribute
    Given a reactive data object with price=1234.56
    And a div with attributes:
      | attribute   | value     |
      | bx-bind     | price     |
      | bx-format   | currency  |
    When the container is scanned
    Then the div should have a one-way binding to "price"
    And the binding should have formatter="currency"

  # ========================================
  # COMPACT COLON STYLE
  # ========================================

  Scenario: Colon style bx-model with debounce
    Given a reactive data object with email=""
    And an input with bx-model="email:500"
    When the container is scanned
    Then the input should have a two-way binding to "email"
    And the binding should have debounce=500

  Scenario: Colon style bx-bind with formatter
    Given a reactive data object with amount=42.99
    And a span with bx-bind="amount:currency"
    When the container is scanned
    Then the span should have a one-way binding to "amount"

  Scenario: Nested path with colon style debounce
    Given a reactive data object with user.profile.bio=""
    And a textarea with bx-model="user.profile.bio:1000"
    When the container is scanned
    Then the textarea should have a two-way binding to "user.profile.bio"
    And the binding should have debounce=1000

  # ========================================
  # JSON CONFIGURATION STYLE
  # ========================================

  Scenario: JSON bx-opts with debounce
    Given a reactive data object with search=""
    And an input with attributes:
      | attribute   | value                    |
      | bx-model    | search                   |
      | bx-opts     | {"debounce":200}         |
    When the container is scanned
    Then the input should have a two-way binding to "search"
    And the binding should have debounce=200

  Scenario: JSON bx-opts with multiple options
    Given a reactive data object with query=""
    And an input with attributes:
      | attribute   | value                                  |
      | bx-model    | query                                  |
      | bx-opts     | {"debounce":300,"formatter":"trim"}   |
    When the container is scanned
    Then the input should have a two-way binding to "query"
    And the binding should have debounce=300
    And the binding should have formatter="trim"

  Scenario: JSON bx-opts overrides attribute values
    Given a reactive data object with text=""
    And an input with attributes:
      | attribute     | value              |
      | bx-model      | text               |
      | bx-debounce   | 100                |
      | bx-opts       | {"debounce":500}   |
    When the container is scanned
    Then the binding should have debounce=500

  # ========================================
  # CSS CLASS STYLE (NOT YET IMPLEMENTED)
  # ========================================

  @skip
  Scenario: CSS class style bx-model with debounce
    Given a reactive data object with username=""
    And an input with class="bx-model-username bx-debounce-400"
    When the container is scanned
    Then the input should have a two-way binding to "username"
    And the binding should have debounce=400

  @skip
  Scenario: CSS class style bx-bind
    Given a reactive data object with count=5
    And a div with class="bx-bind-count"
    When the container is scanned
    Then the div should have a one-way binding to "count"

  @skip
  Scenario: CSS class style with nested path
    Given a reactive data object with user.age=0
    And an input with class="bx-model-user.age bx-debounce-250"
    When the container is scanned
    Then the input should have a two-way binding to "user.age"
    And the binding should have debounce=250

  # ========================================
  # MIXED SYNTAX STYLES
  # ========================================

  Scenario: Verbose + JSON combination
    Given a reactive data object with description=""
    And a textarea with attributes:
      | attribute     | value                      |
      | bx-model      | description                |
      | bx-debounce   | 200                        |
      | bx-opts       | {"formatter":"sanitize"}   |
    When the container is scanned
    Then the input should have a two-way binding to "description"
    And the binding should have debounce=200
    And the binding should have formatter="sanitize"

  Scenario: Colon + verbose combination
    Given a reactive data object with value=""
    And an input with attributes:
      | attribute   | value     |
      | bx-model    | value:300 |
      | bx-format   | uppercase |
    When the container is scanned
    Then the input should have a two-way binding to "value"
    And the binding should have debounce=300
    And the binding should have formatter="uppercase"

  # ========================================
  # SYNTAX EQUIVALENCE
  # ========================================

  Scenario: All syntax styles produce identical configuration
    Given a reactive data object with field1="", field2="", field3=""
    And an input "input1" with bx-model="field1" bx-debounce="500"
    And an input "input2" with bx-model="field2:500"
    And an input "input3" with bx-model="field3" bx-opts='{"debounce":500}'
    When the container is scanned
    Then all inputs should have identical binding configurations

  # ========================================
  # EDGE CASES
  # ========================================

  Scenario: Empty colon value is ignored
    Given a reactive data object with test=""
    And an input with bx-model="test:"
    When the container is scanned
    Then the input should have a two-way binding to "test"
    And the binding should not have debounce

  Scenario: Invalid JSON in bx-opts is logged and ignored
    Given a reactive data object with data=""
    And an input with attributes:
      | attribute   | value           |
      | bx-model    | data            |
      | bx-opts     | {invalid json}  |
      | bx-debounce | 100             |
    When the container is scanned
    Then a warning should be logged about invalid JSON
    And the binding should have debounce=100

  Scenario: Non-numeric colon value is ignored for debounce
    Given a reactive data object with item=""
    And an input with bx-model="item:abc"
    When the container is scanned
    Then the input should have a two-way binding to "item"
    And the binding should not have debounce

  # ========================================
  # PRECEDENCE ORDER
  # Precedence: individual attributes > bx-opts > colon > default
  # ========================================

  Scenario: Option precedence - verbose wins over bx-opts
    Given a reactive data object with priority=""
    And an input with attributes:
      | attribute     | value              |
      | bx-model      | priority           |
      | bx-debounce   | 100                |
      | bx-opts       | {"debounce":300}   |
    When the container is scanned
    Then the binding should have debounce=100

  Scenario: Option precedence - verbose wins over colon
    Given a reactive data object with override=""
    And an input with attributes:
      | attribute     | value     |
      | bx-model      | override:100 |
      | bx-debounce   | 500       |
    When the container is scanned
    Then the binding should have debounce=500

  Scenario: Option precedence - bx-opts wins over colon
    Given a reactive data object with middle=""
    And an input with attributes:
      | attribute     | value              |
      | bx-model      | middle:100         |
      | bx-opts       | {"debounce":300}   |
    When the container is scanned
    Then the binding should have debounce=300

  Scenario: Option precedence order - verbose > bx-opts > colon
    Given a reactive data object with multi=""
    And an input with attributes:
      | attribute     | value              |
      | bx-model      | multi:100          |
      | bx-debounce   | 200                |
      | bx-opts       | {"debounce":300}   |
    When the container is scanned
    Then the binding should have debounce=200
