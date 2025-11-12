Feature: FormatX Phone Number Formatting
  As a web developer
  I want comprehensive phone number formatting
  So that I can display phone numbers in various formats for different regions

  Background:
    Given the fmtX module is loaded
    And the DOM is ready

  # Core US Formats
  Scenario Outline: Format raw US numbers with all format types
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input      | format   | expected         | description              |
      | 5551234567 | us       | (555) 123-4567   | Standard US with parens  |
      | 5551234567 | us-dash  | 555-123-4567     | US with dashes only      |
      | 5551234567 | us-dot   | 555.123.4567     | US with dots             |
      | 5551234567 | intl     | +1 555 123 4567  | International format     |

  # Handle pre-formatted inputs
  Scenario Outline: Reformat various US input formats
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input           | format   | expected         | description                     |
      | 555-123-4567    | us       | (555) 123-4567   | Dashes to parens               |
      | 555-123-4567    | us-dash  | 555-123-4567     | Already correct                |
      | 555-123-4567    | us-dot   | 555.123.4567     | Dashes to dots                 |
      | 555-123-4567    | intl     | +1 555 123 4567  | Dashes to intl                 |
      | (555) 123-4567  | us       | (555) 123-4567   | Already correct                |
      | (555) 123-4567  | us-dash  | 555-123-4567     | Parens to dashes               |
      | (555) 123-4567  | us-dot   | 555.123.4567     | Parens to dots                 |
      | (555) 123-4567  | intl     | +1 555 123 4567  | Parens to intl                 |
      | 555.123.4567    | us       | (555) 123-4567   | Dots to parens                 |
      | 555.123.4567    | us-dash  | 555-123-4567     | Dots to dashes                 |
      | 555.123.4567    | us-dot   | 555.123.4567     | Already correct                |
      | 555.123.4567    | intl     | +1 555 123 4567  | Dots to intl                   |

  # 11-digit US numbers (with country code)
  Scenario Outline: Handle 11-digit US numbers with country code
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input        | format   | expected         | description                        |
      | 14155551234  | us       | (415) 555-1234   | Strip 1, format with parens       |
      | 14155551234  | us-dash  | 415-555-1234     | Strip 1, format with dashes       |
      | 14155551234  | us-dot   | 415.555.1234     | Strip 1, format with dots         |
      | 14155551234  | intl     | +1 415 555 1234  | Keep 1, format international      |
      | 12125551234  | us       | (212) 555-1234   | NYC area code                     |
      | 13105551234  | us-dash  | 310-555-1234     | LA area code                      |

  # Handle extra spaces
  Scenario Outline: Clean up extra spaces in phone numbers
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input                | format   | expected         | description                    |
      |   555 123 4567       | us       | (555) 123-4567   | Leading/trailing spaces        |
      | 555  123  4567       | us-dash  | 555-123-4567     | Multiple spaces between        |
      |   555-123-4567       | us-dot   | 555.123.4567     | Spaces with dashes            |
      | 1 415 555 1234       | intl     | +1 415 555 1234  | Spaces in 11-digit            |

  # International/EU number handling
  Scenario Outline: Handle EU/international numbers correctly
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input                   | format   | expected            | description                   |
      | +44 20 7946 0958        | us       | +44 20 7946 0958    | UK - keep EU format          |
      | +44 20 7946 0958        | us-dash  | +44 20 7946 0958    | UK - keep EU format          |
      | +44 20 7946 0958        | us-dot   | +44 20 7946 0958    | UK - keep EU format          |
      | +44 20 7946 0958        | intl     | +44 20 7946 0958    | UK - already correct         |
      | +33 1 42 86 82 00       | us       | +33 1 42 86 82 00   | France - keep EU format      |
      | +33 1 42 86 82 00       | intl     | +33 1 42 86 82 00   | France - already correct     |
      | +49 30 12345678         | us-dash  | +49 30 12345678     | Germany - keep EU format     |
      | +34 91 123 4567         | us-dot   | +34 91 123 4567     | Spain - keep EU format       |

  # Clean up messy EU numbers
  Scenario Outline: Normalize messy EU/international numbers
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input                      | format   | expected            | description                        |
      |   +44  20  7946  0958      | us       | +44 20 7946 0958    | UK with extra spaces              |
      |   +44  20  7946  0958      | intl     | +44 20 7946 0958    | Clean up spaces                   |
      | 00442079460958             | intl     | +44 20 7946 0958    | Convert 00 to +, format           |
      | 004420794609 58            | intl     | +44 20 7946 0958    | 00 prefix with spaces             |
      | 0033142868200              | intl     | +33 1 42 86 82 00   | France with 00                    |
      |   0049  30  12345678       | us       | +49 30 12345678     | Germany 00 with spaces            |

  # US numbers with + prefix
  Scenario: US number with international prefix in US format
    Given an element with fx-format="phone" fx-phone-format="us"
    And the fx-raw value is "+1 555 123 4567"
    When the element is processed
    Then the element should display "(555) 123-4567"

  Scenario: US number with international prefix in dash format
    Given an element with fx-format="phone" fx-phone-format="us-dash"
    And the fx-raw value is "+1 415 555 1234"
    When the element is processed
    Then the element should display "415-555-1234"

  # Edge cases
  Scenario Outline: Handle invalid phone numbers
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input         | format   | expected      | description           |
      | 555123        | us       | 555123        | Too short             |
      | 555123456789  | us       | 555123456789  | Too long              |
      | abc-def-ghij  | us       | abc-def-ghij  | Non-numeric           |
      | 555-ABC-1234  | us-dash  | 555-ABC-1234  | Mixed alphanumeric    |
      |               | us       |               | Empty string          |
      |    spaces     | us       |    spaces     | Only spaces           |

  # Default format (when fx-phone-format is not specified)
  Scenario: Default to US format when no phone format specified
    Given an element with fx-format="phone"
    And the fx-raw value is "5551234567"
    When the element is processed
    Then the element should display "(555) 123-4567"

  # Performance test with multiple phone numbers
  Scenario: Format 100 phone numbers efficiently
    Given 100 elements with fx-format="phone" fx-phone-format="us"
    When all elements are processed
    Then the operation should complete in less than 50ms

  # MutationObserver support
  Scenario: Automatically format dynamically added phone numbers
    Given the fmtX module is initialized
    When a new element is added to the DOM:
      """
      <span fx-format="phone" fx-phone-format="us-dash" fx-raw="5551234567">5551234567</span>
      """
    Then the element should automatically be formatted
    And it should display "555-123-4567"

  # Multiple phone formats on same page
  Scenario: Support multiple phone formats simultaneously
    Given elements with different phone formats:
      """
      <div>
        <span id="phone1" fx-format="phone" fx-phone-format="us" fx-raw="5551234567"></span>
        <span id="phone2" fx-format="phone" fx-phone-format="us-dash" fx-raw="5551234567"></span>
        <span id="phone3" fx-format="phone" fx-phone-format="us-dot" fx-raw="5551234567"></span>
        <span id="phone4" fx-format="phone" fx-phone-format="intl" fx-raw="5551234567"></span>
      </div>
      """
    When all elements are processed
    Then element "#phone1" should display "(555) 123-4567"
    And element "#phone2" should display "555-123-4567"
    And element "#phone3" should display "555.123.4567"
    And element "#phone4" should display "+1 555 123 4567"