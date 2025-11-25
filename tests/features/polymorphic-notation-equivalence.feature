Feature: Polymorphic Notation Equivalence Across genX Modules
  As a developer
  I want all 4 notation styles to produce identical output
  So that I can choose the syntax that works best for my codebase

  Background:
    Given a clean test environment
    And polymorphic notation parsers are loaded

  # ============================================================================
  # FMTX - FormatX Module Tests
  # ============================================================================

  Scenario Outline: FormatX notation equivalence for <format>
    Given I have a FormatX element with <format> formatting
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should produce identical output
    And output should be: <expected>
    And performance should be under 16ms

    Examples:
      | format     | input    | expected      |
      | currency   | 1234.567 | $1,234.57     |
      | number     | 5000.123 | 5,000.12      |
      | percentage | 0.85     | 85.0%         |
      | date       | 2024-11-25 | 2024-11-25  |
      | phone      | 5551234567 | (555) 123-4567 |

  Scenario: FormatX notation priority resolution
    Given I have an element with multiple notation styles
    When JSON notation is present with verbose and CSS class
    Then JSON should take priority
    And resulting format should be from JSON notation

  Scenario: FormatX complex configuration with colon notation
    Given a complex currency format with EUR, 2 decimals, prefix symbol
    When using colon notation: fx-format="currency:EUR:2:prefix"
    Then output should match verbose notation equivalent
    And output should be € 9,876,543.89

  Scenario: FormatX edge case with null values
    Given a FormatX element with null/empty input
    When all 4 notation styles process the value
    Then all should return default fallback value
    And should not throw errors

  # ============================================================================
  # ACCX - AccessX Module Tests
  # ============================================================================

  Scenario Outline: AccessX notation equivalence for <enhancement>
    Given I have an AccX element with <enhancement> enhancement
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should apply identical ARIA attributes
    And aria-label should be: <aria_label>

    Examples:
      | enhancement | aria_label                    |
      | label       | Save Document                 |
      | abbreviation | HyperText Markup Language     |
      | date        | Monday, November 25, 2024    |
      | time        | 2:30 PM EST                   |
      | percentage  | 85.5 percent                  |

  Scenario: AccessX live region equivalence
    Given I have a live region for dynamic content
    When I set all 4 notation styles for ax-live="polite"
    Then all should set aria-live="polite" attribute
    And all should set aria-atomic="true" if specified

  Scenario: AccessX priority resolution with JSON
    Given an element with verbose label and JSON opts
    When both contain label configurations
    Then JSON notation should take priority

  Scenario: AccessX semantic correctness
    Given an abbreviation with WCAG expanded text
    When using colon notation ax-abbreviation="WCAG:Web Content Accessibility Guidelines"
    Then title attribute should contain full expansion
    And aria-label should match verbose behavior

  # ============================================================================
  # BINDX - BindX Module Tests
  # ============================================================================

  Scenario Outline: BindX notation equivalence for <binding_type>
    Given I have a BindX element with <binding_type> binding
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should create identical bindings
    And property should be: <property>
    And debounce should be: <debounce>ms

    Examples:
      | binding_type | property | debounce |
      | simple       | username | 0        |
      | debounced    | email    | 500      |
      | complex      | searchQuery | 300    |

  Scenario: BindX nested property binding
    Given a nested property path user.profile.email
    When using all 4 notation styles
    Then all should correctly resolve nested path
    And all should propagate changes bidirectionally

  Scenario: BindX event binding equivalence
    Given click event handler "handleSave"
    When using colon notation bx-click="handleSave:500"
    Then should create debounced click handler
    And should match verbose and JSON equivalents

  Scenario: BindX validation with async
    Given async validation function "checkUsernameAvailable"
    When using JSON notation with error message
    Then validation should be applied to binding
    And error message should display on validation failure

  Scenario: BindX complex configuration
    Given complex binding with debounce, throttle, and conditional
    When using colon notation with all parameters
    Then should parse all parameters correctly
    And binding should respect condition changes

  # ============================================================================
  # LOADX - LoadX Module Tests
  # ============================================================================

  Scenario Outline: LoadX notation equivalence for <trigger_type>
    Given I have a LoadX element with <trigger_type> trigger
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should create identical loaders
    And src should be: <src>
    And trigger should be: <trigger>

    Examples:
      | trigger_type | src         | trigger |
      | load         | /api/posts  | load    |
      | click        | /api/data   | click   |
      | poll         | /api/status | poll    |

  Scenario: LoadX with cache configuration
    Given a LoadX element with cache enabled
    When using JSON notation with cache: true
    Then subsequent requests should use cached data
    And should match verbose behavior

  Scenario: LoadX error handling with retry
    Given a LoadX element configured for retry
    When JSON notation specifies retry: 3, retry_delay: 1000
    Then should retry failed requests up to 3 times
    And should wait 1000ms between retries

  Scenario: LoadX dependency-based loading
    Given a LoadX element that depends on itemId
    When itemId changes in the data model
    Then should trigger new load request
    And all notation styles should respond identically

  Scenario: LoadX swap modes equivalence
    Given LoadX with swap="beforebegin" and target="#modal"
    When using all 4 notation styles
    Then loaded content should insert before target
    And all styles should match verbose behavior

  # ============================================================================
  # NAVX - NavX Module Tests
  # ============================================================================

  Scenario Outline: NavX notation equivalence for <nav_type>
    Given I have a NavX element with <nav_type> navigation
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should create identical navigation
    And active class should be: <active_class>

    Examples:
      | nav_type     | active_class |
      | basic        | active       |
      | scroll-spy   | current      |
      | breadcrumb   | (auto)       |

  Scenario: NavX scroll-spy with offset
    Given scroll-spy navigation with offset: 100px
    When using JSON notation: scroll_offset: 100
    Then section becomes active when 100px from viewport top
    And should match verbose notation behavior

  Scenario: NavX dropdown menu with hover trigger
    Given dropdown menu with hover trigger
    When using colon notation nx-dropdown="true:hover:click-outside"
    Then menu opens on hover
    And closes when clicking outside
    And matches verbose behavior

  Scenario: NavX keyboard navigation with cycling
    Given keyboard navigation with arrow keys
    When using JSON notation with cycle: true
    Then arrow keys navigate between links
    And focus cycles at list ends
    And all styles behave identically

  Scenario: NavX mobile hamburger menu
    Given responsive hamburger menu
    When using CSS class notation
    Then toggle button shows/hides menu
    And matches verbose and JSON behavior

  # ============================================================================
  # DRAGX - DragX Module Tests
  # ============================================================================

  Scenario Outline: DragX notation equivalence for <drag_type>
    Given I have a DragX element with <drag_type> configuration
    When I render all 4 notation styles (verbose, colon, json, class)
    Then all styles should create identical drag behavior
    And draggable type should be: <type>

    Examples:
      | drag_type | type        |
      | basic     | card        |
      | handle    | panel       |
      | complex   | list-item   |

  Scenario: DragX with constrained axis
    Given draggable element with axis constraint
    When using colon notation dx-drag="slider::x"
    Then can only drag horizontally
    And matches verbose and JSON behavior

  Scenario: DragX with custom ghost image
    Given draggable with custom ghost image
    When using JSON notation with ghost_src and offset
    Then ghost shows custom image during drag
    And offset applied correctly
    And all styles match

  Scenario: DragX drop zone with type filtering
    Given drop zone accepting "card" and "task" types
    When using all 4 notation styles
    Then only matching types can be dropped
    And drop effect respected (move/copy)
    And all styles behave identically

  Scenario: DragX swap behavior in sortable list
    Given sortable list with swap behavior
    When using colon notation with behavior="swap"
    Then items swap positions when reordered
    And matches verbose and JSON behavior

  # ============================================================================
  # CROSS-MODULE INTEGRATION TESTS
  # ============================================================================

  Scenario: Mixed notation styles on same page
    Given a page with verbose, colon, JSON, and class notations mixed
    When all modules parse and initialize
    Then each notation style should work independently
    And no conflicts between different styles
    And performance under 100ms total

  Scenario: Notation priority resolution across modules
    Given elements with multiple notation styles (verbose + JSON + class)
    When modules process these elements
    Then priority order: JSON > Colon > Verbose > Class
    And higher priority always wins

  Scenario: Performance test with 1000 mixed elements
    Given 1000 elements using all 4 notation styles
    When all modules scan and parse the page
    Then total initialization under 200ms
    And per-element parsing under 0.2ms average
    And no memory leaks detected

  Scenario: Edge case - empty configurations
    Given elements with empty notation values
    When all modules attempt to process them
    Then should skip gracefully
    And should not apply enhancements
    And should not throw errors

  Scenario: Edge case - malformed JSON
    Given elements with invalid JSON in -opts attributes
    When modules parse configurations
    Then should skip JSON notation
    Then should fall back to verbose notation
    And should log warnings appropriately

  Scenario: Validation - all 4 styles produce identical behavior
    Given 20 common format configurations
    When rendered with all 4 notation styles
    Then visual output should be bit-identical
    And ARIA attributes should be identical
    And JavaScript behavior should be identical

  # ============================================================================
  # PERFORMANCE AND RELIABILITY
  # ============================================================================

  Scenario: Notation detection performance
    Given a page with mixed notation styles
    When bootloader detects which parsers to load
    Then detection should complete under 1ms
    And should load only needed parsers

  Scenario: Parser caching performance
    Given 1000 elements with same configuration
    When parsed and cached in WeakMap
    Then second access should be under 0.1ms
    And no re-parsing occurs

  Scenario: Memory efficiency
    Given 10000 elements with polymorphic notation
    When all are parsed and cached
    Then memory usage under 500MB
    And WeakMap doesn't prevent garbage collection

  # ============================================================================
  # DOCUMENTATION AND BACKWARDS COMPATIBILITY
  # ============================================================================

  Scenario: Verbose notation remains primary
    Given developer familiarity with verbose syntax
    When using verbose notation across project
    Then should work identically to other notations
    And should be first choice in documentation

  Scenario: Colon notation for conciseness
    Given need for compact configuration syntax
    When using colon notation
    Then should produce identical output to verbose
    And should be documented as shorthand

  Scenario: JSON notation for programmatic generation
    Given configuration generated from JavaScript
    When using JSON notation with dynamic values
    Then should support full flexibility
    And should be documented for generated configs

  Scenario: CSS class notation for static markup
    Given static HTML templates
    When using CSS class notation
    Then should work without JavaScript execution
    And should be documented as markup-only option
