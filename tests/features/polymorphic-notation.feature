Feature: Polymorphic Notation Parsing
  genX supports 4 notation styles that all compile to identical configurations.
  The parseNotation() function detects and parses any notation style into a unified config object.

  Background:
    Given the genX common module is loaded
    And the test environment is clean

  # Notation 1: Verbose Attributes (Beginner-Friendly)
  Scenario: Parse verbose attribute notation for fmtX
    Given an element with fx-format="currency" fx-currency="USD" fx-decimals="2"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": "2"
      }
      """

  Scenario: Parse verbose attribute notation for bindX
    Given an element with bx-bind="username" bx-debounce="300"
    When the notation parser processes the element with prefix "bx"
    Then the config should be:
      """
      {
        "bind": "username",
        "debounce": "300"
      }
      """

  Scenario: Parse verbose attribute notation for accX
    Given an element with ax-label="Home" ax-icon="home" ax-role="button"
    When the notation parser processes the element with prefix "ax"
    Then the config should be:
      """
      {
        "label": "Home",
        "icon": "home",
        "role": "button"
      }
      """

  # Notation 2: Compact/Colon Syntax (Expert)
  Scenario: Parse compact colon notation for fmtX
    Given an element with fx-format="currency:USD:2"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": "2"
      }
      """

  Scenario: Parse compact colon notation for bindX
    Given an element with bx-bind="username:300"
    When the notation parser processes the element with prefix "bx"
    Then the config should be:
      """
      {
        "bind": "username",
        "debounce": "300"
      }
      """

  Scenario: Parse compact colon notation for accX
    Given an element with ax-label="icon:Home"
    When the notation parser processes the element with prefix "ax"
    Then the config should be:
      """
      {
        "label": "icon",
        "icon": "Home"
      }
      """

  # Notation 3: JSON Config (Power User)
  Scenario: Parse JSON notation for fmtX
    Given an element with fx-opts='{"format":"currency","currency":"USD","decimals":2}'
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": 2
      }
      """

  Scenario: Parse JSON notation for bindX
    Given an element with bx-opts='{"bind":"username","debounce":300}'
    When the notation parser processes the element with prefix "bx"
    Then the config should be:
      """
      {
        "bind": "username",
        "debounce": 300
      }
      """

  Scenario: Parse JSON notation for accX
    Given an element with ax-opts='{"label":"Home","icon":"home","role":"button"}'
    When the notation parser processes the element with prefix "ax"
    Then the config should be:
      """
      {
        "label": "Home",
        "icon": "home",
        "role": "button"
      }
      """

  # Notation 4: CSS Classes (Designer-Friendly)
  Scenario: Parse CSS class notation for fmtX
    Given an element with class="fmt-currency-USD-2"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": "2"
      }
      """

  Scenario: Parse CSS class notation for bindX
    Given an element with class="bind-username-300"
    When the notation parser processes the element with prefix "bx"
    Then the config should be:
      """
      {
        "bind": "username",
        "debounce": "300"
      }
      """

  Scenario: Parse CSS class notation for accX
    Given an element with class="acc-label-icon-Home"
    When the notation parser processes the element with prefix "ax"
    Then the config should be:
      """
      {
        "label": "icon",
        "icon": "Home"
      }
      """

  # Priority Order: JSON > Colon > Verbose
  Scenario: JSON notation overrides colon notation
    Given an element with fx-format="date:YYYY" fx-opts='{"format":"currency","currency":"USD"}'
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD"
      }
      """

  Scenario: Colon notation overrides verbose notation
    Given an element with fx-format="currency:EUR:4" fx-currency="USD"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "EUR",
        "decimals": "4"
      }
      """

  Scenario: CSS classes combine with other notations
    Given an element with class="fmt-currency-USD-2" fx-symbol="€"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": "2",
        "symbol": "€"
      }
      """

  # Edge Cases
  Scenario: Handle missing primary attribute gracefully
    Given an element with fx-currency="USD"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "currency": "USD"
      }
      """

  Scenario: Handle empty colon syntax
    Given an element with fx-format="currency::"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency"
      }
      """

  Scenario: Handle malformed JSON gracefully
    Given an element with fx-opts='{broken json}'
    When the notation parser processes the element with prefix "fx"
    Then the parser should log a warning
    And the config should be empty

  Scenario: Handle multiple CSS classes
    Given an element with class="fmt-currency-USD-2 btn-primary"
    When the notation parser processes the element with prefix "fx"
    Then the config should be:
      """
      {
        "format": "currency",
        "currency": "USD",
        "decimals": "2"
      }
      """
    And the class "btn-primary" should be preserved

  # Performance
  Scenario: Parse notation in under 1ms
    Given an element with fx-format="currency" fx-currency="USD" fx-decimals="2"
    When the notation parser processes the element 100 times
    Then each parse should take less than 1ms
    And the average parse time should be less than 0.5ms

  # Module-Specific Cardinality Orders
  Scenario Outline: Parse colon notation with module-specific cardinality
    Given an element with <prefix>-format="<notation>"
    When the notation parser processes the element with prefix "<prefix>"
    Then the config should match the cardinality order for "<module>"

    Examples:
      | module | prefix | notation              | expected_config                                  |
      | fmtX   | fx     | currency:USD:2        | {"format":"currency","currency":"USD","decimals":"2"} |
      | bindX  | bx     | username:300          | {"bind":"username","debounce":"300"}            |
      | accX   | ax     | label:icon:Home       | {"label":"label","icon":"icon","value":"Home"}  |
      | dragX  | dx     | card:123:ghost        | {"type":"card","id":"123","style":"ghost"}      |
      | loadX  | lx     | spinner:blue          | {"type":"spinner","color":"blue"}               |
      | navX   | nx     | breadcrumb:home:/ | {"type":"breadcrumb","label":"home","href":"/"} |
