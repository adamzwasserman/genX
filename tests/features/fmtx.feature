Feature: FormatX (fmtX) - Text Formatting Module
  As a web developer
  I want declarative text formatting via HTML attributes
  So that I can format currency, dates, numbers without writing JavaScript

  Background:
    Given the fmtX module is loaded
    And the DOM is ready

  # Currency Formatting
  Scenario: Basic currency formatting
    Given an element with attributes:
      | attribute    | value    |
      | fx-format    | currency |
      | fx-raw       | 25.00    |
      | fx-currency  | USD      |
    When the element is processed
    Then the element should display "$25.00"

  Scenario: Currency formatting with different locales
    Given an element with fx-format="currency" fx-currency="EUR" fx-locale="de-DE"
    And the fx-raw value is "1234.56"
    When the element is processed
    Then the element should display "1.234,56 €"

  Scenario Outline: Multiple currency types
    Given an element with fx-format="currency" fx-currency="<currency>"
    And the fx-raw value is "99.99"
    When the element is processed
    Then the element should display "<formatted>"

    Examples:
      | currency | formatted |
      | USD      | $99.99    |
      | EUR      | €99.99    |
      | GBP      | £99.99    |
      | JPY      | ¥100      |

  # Date Formatting
  Scenario: Date formatting with different styles
    Given an element with fx-format="date" fx-date-format="long"
    And the fx-raw value is "2024-03-15"
    When the element is processed
    Then the element should display "March 15, 2024"

  Scenario Outline: Date format styles
    Given an element with fx-format="date" fx-date-format="<style>"
    And the fx-raw value is "2024-03-15"
    When the element is processed
    Then the element should display "<formatted>"

    Examples:
      | style  | formatted      |
      | short  | 3/15/2024      |
      | medium | Mar 15, 2024   |
      | long   | March 15, 2024 |
      | full   | Friday, March 15, 2024 |

  Scenario: ISO date format
    Given an element with fx-format="date" fx-date-format="iso"
    And the fx-raw value is "2024-03-15T10:30:00"
    When the element is processed
    Then the element should display "2024-03-15"

  # Number Formatting
  Scenario: Number formatting with thousands separator
    Given an element with fx-format="number"
    And the fx-raw value is "1234567.89"
    When the element is processed
    Then the element should display "1,234,567.89"

  Scenario: Percentage formatting
    Given an element with fx-format="percent"
    And the fx-raw value is "0.856"
    When the element is processed
    Then the element should display "86%"

  Scenario: Abbreviated numbers
    Given an element with fx-format="abbreviated"
    And the fx-raw value is "1500000"
    When the element is processed
    Then the element should display "1.5M"

  Scenario Outline: Abbreviated number formats
    Given an element with fx-format="abbreviated"
    And the fx-raw value is "<value>"
    When the element is processed
    Then the element should display "<formatted>"

    Examples:
      | value      | formatted |
      | 999        | 999.0     |
      | 1500       | 1.5K      |
      | 1500000    | 1.5M      |
      | 1500000000 | 1.5B      |
      | 1.5e12     | 1.5T      |

  # Phone Number Formatting - Basic US formats
  Scenario: US phone number formatting with parentheses
    Given an element with fx-format="phone" fx-phone-format="us"
    And the fx-raw value is "5551234567"
    When the element is processed
    Then the element should display "(555) 123-4567"

  Scenario: US phone number formatting with dashes
    Given an element with fx-format="phone" fx-phone-format="us-dash"
    And the fx-raw value is "5551234567"
    When the element is processed
    Then the element should display "555-123-4567"

  Scenario: US phone number formatting with dots
    Given an element with fx-format="phone" fx-phone-format="us-dot"
    And the fx-raw value is "5551234567"
    When the element is processed
    Then the element should display "555.123.4567"

  Scenario: International formatting of US number
    Given an element with fx-format="phone" fx-phone-format="intl"
    And the fx-raw value is "5551234567"
    When the element is processed
    Then the element should display "+1 555 123 4567"

  # Phone Number Formatting - Handle pre-formatted inputs
  Scenario Outline: Reformat pre-formatted US numbers
    Given an element with fx-format="phone" fx-phone-format="<output_format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input           | output_format | expected        |
      | 555-123-4567    | us           | (555) 123-4567  |
      | 555-123-4567    | us-dash      | 555-123-4567    |
      | 555-123-4567    | us-dot       | 555.123.4567    |
      | (555) 123-4567  | us-dash      | 555-123-4567    |
      | (555) 123-4567  | us-dot       | 555.123.4567    |
      | 555.123.4567    | us           | (555) 123-4567  |
      | 555.123.4567    | us-dash      | 555-123-4567    |

  # Phone Number Formatting - 11-digit US numbers
  Scenario: Strip country code from 11-digit US number
    Given an element with fx-format="phone" fx-phone-format="us"
    And the fx-raw value is "14155551234"
    When the element is processed
    Then the element should display "(415) 555-1234"

  Scenario: Format 11-digit US number with dashes
    Given an element with fx-format="phone" fx-phone-format="us-dash"
    And the fx-raw value is "14155551234"
    When the element is processed
    Then the element should display "415-555-1234"

  Scenario: Format 11-digit US number internationally
    Given an element with fx-format="phone" fx-phone-format="intl"
    And the fx-raw value is "14155551234"
    When the element is processed
    Then the element should display "+1 415 555 1234"

  # Phone Number Formatting - Extra spaces handling
  Scenario: Handle extra spaces in phone number
    Given an element with fx-format="phone" fx-phone-format="us"
    And the fx-raw value is "  555 123 4567  "
    When the element is processed
    Then the element should display "(555) 123-4567"

  # Phone Number Formatting - International/EU numbers
  Scenario: Keep UK number in EU format when US format requested
    Given an element with fx-format="phone" fx-phone-format="us"
    And the fx-raw value is "+44 20 7946 0958"
    When the element is processed
    Then the element should display "+44 20 7946 0958"

  Scenario: Clean up extra spaces in EU number
    Given an element with fx-format="phone" fx-phone-format="intl"
    And the fx-raw value is "  +44  20  7946  0958  "
    When the element is processed
    Then the element should display "+44 20 7946 0958"

  Scenario: Convert 00 prefix to + for EU numbers
    Given an element with fx-format="phone" fx-phone-format="intl"
    And the fx-raw value is "004420794609 58"
    When the element is processed
    Then the element should display "+44 20 7946 0958"

  Scenario Outline: Handle international numbers correctly
    Given an element with fx-format="phone" fx-phone-format="<format>"
    And the fx-raw value is "<input>"
    When the element is processed
    Then the element should display "<expected>"

    Examples:
      | input              | format   | expected           |
      | +33 1 42 86 82 00  | us       | +33 1 42 86 82 00  |
      | +33 1 42 86 82 00  | us-dash  | +33 1 42 86 82 00  |
      | +33 1 42 86 82 00  | us-dot   | +33 1 42 86 82 00  |
      | +33 1 42 86 82 00  | intl     | +33 1 42 86 82 00  |
      | 0033142868200      | intl     | +33 1 42 86 82 00  |

  # Text Formatting
  Scenario: Uppercase transformation
    Given an element with fx-format="uppercase"
    And the fx-raw value is "hello world"
    When the element is processed
    Then the element should display "HELLO WORLD"

  Scenario: Capitalize transformation
    Given an element with fx-format="capitalize"
    And the fx-raw value is "hello world from genx"
    When the element is processed
    Then the element should display "Hello World From Genx"

  Scenario: Text truncation
    Given an element with fx-format="truncate" fx-length="10"
    And the fx-raw value is "This is a very long text"
    When the element is processed
    Then the element should display "This is..."

  # Duration Formatting
  Scenario: Duration in seconds to HH:MM:SS
    Given an element with fx-format="duration"
    And the fx-raw value is "3665"
    When the element is processed
    Then the element should display "01:01:05"

  Scenario: Duration in human-readable format
    Given an element with fx-format="duration" fx-duration-format="human"
    And the fx-raw value is "93784"
    When the element is processed
    Then the element should display "1d 2h 3m 4s"

  # File Size Formatting
  Scenario: File size formatting
    Given an element with fx-format="filesize"
    And the fx-raw value is "1536000"
    When the element is processed
    Then the element should display "1.54 MB"

  # Dynamic Content
  Scenario: MutationObserver detects new formatted elements
    Given the fmtX module is initialized
    When a new element is added to the DOM:
      """
      <span fx-format="currency" fx-raw="99.99">99.99</span>
      """
    Then the element should automatically be formatted
    And it should display "$99.99"

  # Error Handling
  Scenario: Invalid number format
    Given an element with fx-format="currency"
    And the fx-raw value is "not-a-number"
    When the element is processed
    Then the element should display the original value "not-a-number"
    And no error should be thrown

  Scenario: Missing fx-raw attribute
    Given an element with fx-format="currency"
    And the element content is "25.00"
    When the element is processed
    Then it should use the text content as the raw value
    And the element should display "$25.00"

  # Performance
  Scenario: Format 1000 elements under 10ms
    Given 1000 elements with fx-format="currency"
    When all fmtX elements are processed
    Then the operation should complete in less than 10ms

  # Unformat functionality
  Scenario: Restore original value
    Given an element with fx-format="currency" fx-raw="25.00"
    And the element has been formatted to "$25.00"
    When FormatX.unformatElement() is called
    Then the element should display "25.00"
    And the fx-raw attribute should be preserved
