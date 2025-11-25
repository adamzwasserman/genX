Feature: SmartX - Auto-Detection Formatting
  As a web developer
  I want automatic data type detection and formatting
  So that I don't have to manually specify format types for common data patterns

  Background:
    Given the SmartX module is loaded
    And the fmtX module is loaded
    And the DOM is ready

  # Currency Detection
  Scenario Outline: Detect and format currency values
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then the element should have data-smart-detected="currency"
    And the element should have data-smart-confidence="<confidence>"
    And the element should display "<expected>"

    Examples:
      | input      | confidence | expected   | description                     |
      | $1,234.56  | 95         | $1,234.56  | Dollar sign prefix high confidence |
      | 1,234.56   | 80         | 1,234.56   | Decimal with comma separator    |
      | £50.00     | 95         | £50.00     | Pound sterling symbol           |
      | €100.50    | 95         | €100.50    | Euro symbol                     |

  # Phone Number Detection
  Scenario Outline: Detect and format phone numbers
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then the element should have data-smart-detected="phone"
    And the element should have data-smart-confidence="<confidence>"
    And the element should display "<expected>"

    Examples:
      | input            | confidence | expected         | description                  |
      | 5551234567       | 85         | (555) 123-4567   | 10-digit US number           |
      | 555-123-4567     | 70         | (555) 123-4567   | Dashed format                |
      | (555) 123-4567   | 90         | (555) 123-4567   | Already formatted with parens |
      | +1 555 123 4567  | 95         | (555) 123-4567   | International US format      |
      | +44 20 7946 0958 | 95         | +44 20 7946 0958 | UK international format      |

  # Date Detection
  Scenario Outline: Detect and format dates
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then the element should have data-smart-detected="date"
    And the element should have data-smart-confidence="<confidence>"
    And the element should display a formatted date

    Examples:
      | input       | confidence | description              |
      | 2024-03-15  | 98         | ISO format (YYYY-MM-DD)  |
      | 03/15/2024  | 90         | US format (MM/DD/YYYY)   |
      | Mar 15 2024 | 95         | Month name format        |

  # Percentage Detection
  Scenario Outline: Detect and format percentages
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then the element should have data-smart-detected="percentage"
    And the element should have data-smart-confidence="100"
    And the element should display "<input>"

    Examples:
      | input  | description           |
      | 99.5%  | Percentage with decimal |
      | 50%    | Whole percentage      |
      | 0.1%   | Small percentage      |

  # Email Detection
  Scenario: Detect email addresses
    Given an element with fx-format="smart" fx-raw="user@example.com"
    When the element is processed
    Then the element should have data-smart-detected="email"
    And the element should have data-smart-confidence="100"
    And the element should display "user@example.com"

  # URL Detection
  Scenario: Detect URLs
    Given an element with fx-format="smart" fx-raw="https://example.com"
    When the element is processed
    Then the element should have data-smart-detected="url"
    And the element should have data-smart-confidence="100"
    And the element should display "https://example.com"

  # Number Detection
  Scenario Outline: Detect and format numbers
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then the element should have data-smart-detected="number"
    And the element should have data-smart-confidence="<confidence>"

    Examples:
      | input     | confidence | description                    |
      | 1,234     | 85         | Number with thousand separator |
      | 1234      | 50         | Plain number (ambiguous)       |
      | 1,234.56  | 70         | Number with decimals           |

  # Text Fallback
  Scenario: Fall back to text for unrecognized patterns
    Given an element with fx-format="smart" fx-raw="Hello World"
    When the element is processed
    Then the element should have data-smart-detected="text"
    And the element should have data-smart-confidence="100"
    And the element should display "Hello World"

  # Detection Cache
  Scenario: Cache detection results for identical values
    Given the SmartX module is initialized
    And the cache is empty
    When I process an element with fx-format="smart" fx-raw="$1,234.56"
    Then the detection should be cached
    When I process another element with fx-format="smart" fx-raw="$1,234.56"
    Then it should use the cached detection
    And the operation should complete in less than 0.1ms

  # Cache Management
  Scenario: Clear cache when it exceeds 1000 entries
    Given the SmartX cache has 1000 entries
    When I process a new unique value
    Then the cache should be cleared
    And the new value should be cached

  # Integration with fmtX
  Scenario: SmartX integrates with fmtX module
    Given an element with fx-format="smart"
    When fmtX processes the element
    Then fmtX should call SmartX.format()
    And SmartX should detect the data type
    And SmartX should delegate to the appropriate formatter

  # Delegation to Formatters
  Scenario Outline: SmartX delegates to appropriate formatters
    Given an element with fx-format="smart" fx-raw="<input>"
    When SmartX detects "<type>"
    Then it should call the "<formatter>" formatter

    Examples:
      | input           | type       | formatter        |
      | $1,234.56       | currency   | formatCurrency   |
      | 555-123-4567    | phone      | formatPhone      |
      | 2024-03-15      | date       | formatDate       |
      | 1,234           | number     | formatNumber     |

  # Performance
  Scenario: SmartX detects and formats within performance threshold
    Given 100 elements with fx-format="smart"
    When all SmartX elements are processed
    Then the operation should complete in less than 100ms
    And each detection should take less than 1ms

  # Edge Cases
  Scenario Outline: Handle edge cases gracefully
    Given an element with fx-format="smart" fx-raw="<input>"
    When the element is processed
    Then it should not throw an error
    And the element should display "<expected>"

    Examples:
      | input    | expected | description        |
      |          |          | Empty string       |
      | null     | null     | Null value         |
      | 123abc   | 123abc   | Mixed alphanumeric |

  # Confidence Scoring
  Scenario: Confidence scores guide ambiguous detection
    Given multiple patterns match the input
    When SmartX scores each pattern
    Then it should use the pattern with highest confidence
    And it should set data-smart-confidence to the winning score

  # MutationObserver Support
  Scenario: Automatically detect dynamically added smart elements
    Given the SmartX and fmtX modules are initialized
    When a new element is added to the DOM:
      """
      <span fx-format="smart" fx-raw="$1,234.56">$1,234.56</span>
      """
    Then the element should automatically be detected and formatted
    And it should have data-smart-detected="currency"
