Feature: Base Module Safety Requirements
  All modules must pass these generic safety and performance tests
  to prevent critical bugs like infinite loops, memory leaks, and browser freezes

  # This feature is parameterized and runs against every module
  # Modules: fmtx, accx, bootloader (bindx, dragx, loadx, navx, tablex coming soon)

  # CRITICAL: Infinite Loop Prevention
  @critical @mutation-safety
  Scenario Outline: Module does not create infinite MutationObserver loops
    Given the "<module>" module is loaded
    And the test environment is clean
    And a container element in the DOM
    And a MutationObserver is monitoring the container
    When I add 10 elements with "<module>" attributes
    And the module processes them
    Then the total mutation count should be less than 50
    And the browser should remain responsive
    And no JavaScript errors should occur

    Examples:
      | module      |
      | fmtx        |
      | accx        |
      | bootloader  |

  @critical @mutation-safety
  Scenario Outline: Idempotent operations do not trigger mutations
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with "<module>" attributes already processed
    And a MutationObserver is monitoring it
    When the module processes the same element 5 times
    Then no mutations should be triggered
    And the element content should remain unchanged

    Examples:
      | module |
      | fmtx   |
      | accx   |

  @critical @mutation-safety
  Scenario Outline: Change detection prevents unnecessary DOM updates
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with "<module>" attributes
    And the element has the value "<value>"
    When the module tries to set the same value "<value>" again
    Then the DOM should not be updated
    And no mutations should be triggered

    Examples:
      | module | value    |
      | fmtx   | $25.00   |
      | accx   | label text |

  # Performance Requirements
  @performance
  Scenario Outline: Module processes 1000 elements under 100ms
    Given the "<module>" module is loaded
    And the test environment is clean
    And 1000 elements with "<module>" attributes
    When all elements are processed
    Then the operation should complete in less than 100ms
    And memory usage should not increase by more than 5MB

    Examples:
      | module |
      | fmtx   |
      | accx   |

  @performance
  Scenario Outline: Module maintains 60 FPS during processing
    Given the "<module>" module is loaded
    And the test environment is clean
    And a page with 100 "<module>" elements
    When the module processes all elements
    Then no frame should take longer than 16ms
    And the page should remain interactive

    Examples:
      | module |
      | fmtx   |
      | accx   |

  @performance
  Scenario Outline: Rapid DOM mutations are debounced
    Given the "<module>" module is loaded
    And the test environment is clean
    And the "<module>" module with MutationObserver enabled
    When 100 elements are added rapidly (< 10ms apart)
    Then the module should batch process them
    And should not call the processor more than 10 times

    Examples:
      | module |
      | fmtx   |
      | accx   |

  # Memory Safety
  @memory-safety
  Scenario Outline: Module cleans up when elements are removed
    Given the "<module>" module is loaded
    And the test environment is clean
    And 100 elements with "<module>" attributes in the DOM
    And the module has processed them
    When all elements are removed from the DOM
    And garbage collection runs
    Then memory should be released
    And no event listeners should remain attached

    Examples:
      | module |
      | fmtx   |
      | accx   |

  @memory-safety
  Scenario Outline: No memory leaks with repeated add/remove cycles
    Given the "<module>" module is loaded
    And the test environment is clean
    And the "<module>" module is initialized
    When I add 100 elements, process them, then remove them
    And I repeat this cycle 10 times
    Then memory usage should stabilize
    And should not increase by more than 2MB

    Examples:
      | module |
      | fmtx   |
      | accx   |

  # DOM Safety
  @xss-prevention
  Scenario Outline: Module sanitizes user input to prevent XSS
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with "<module>" attributes
    And the input contains "<malicious_payload>"
    When the module processes the element
    Then the malicious script should not execute
    And the content should be safely escaped

    Examples:
      | module | malicious_payload                          |
      | fmtx   | <script>alert('XSS')</script>             |
      | fmtx   | <img src=x onerror=alert('XSS')>          |
      | accx   | javascript:alert('XSS')                   |
      | accx   | <svg onload=alert('XSS')>                 |

  @xss-prevention
  Scenario Outline: Module uses safe DOM methods (not innerHTML)
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with "<module>" attributes
    And the input is "<user_input>"
    When the module updates the element
    Then it should use textContent or setAttribute
    And should never use innerHTML or outerHTML
    And no script execution should occur

    Examples:
      | module | user_input                    |
      | fmtx   | <b>bold</b><script>alert(1)</script> |
      | accx   | <iframe src="evil.com">       |

  # Error Handling
  @error-handling
  Scenario Outline: Module handles missing attributes gracefully
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with only the "<module>-format" attribute
    And no other required attributes are present
    When the module processes the element
    Then no error should be thrown
    And the element should remain unchanged or show fallback

    Examples:
      | module |
      | fmtx   |
      | accx   |

  @error-handling
  Scenario Outline: Module handles invalid attribute values
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with "<module>" attributes
    And an attribute has an invalid value "<invalid_value>"
    When the module processes the element
    Then the module should log a warning
    And should use a safe fallback behavior
    And should not crash

    Examples:
      | module | invalid_value        |
      | fmtx   | not-a-date          |
      | fmtx   | {"broken": json'}   |
      | accx   | invalid-role        |

  @error-handling
  Scenario Outline: Module handles circular references safely
    Given the "<module>" module is loaded
    And the test environment is clean
    And nested elements with "<module>" attributes
    And element A references element B
    And element B references element A
    When the module processes both elements
    Then it should detect the circular reference
    And should not enter infinite recursion
    And should process elements independently

    Examples:
      | module |
      | accx   |

  # Browser Compatibility
  @browser-compat
  Scenario Outline: Module works across all major browsers
    Given I am using "<browser>"
    And the test environment is clean
    And the "<module>" module is loaded
    When I process an element with module attributes
    Then it should work correctly
    And should have consistent output

    Examples:
      | module | browser  |
      | fmtx   | chromium |
      | fmtx   | firefox  |
      | fmtx   | webkit   |
      | accx   | chromium |
      | accx   | firefox  |
      | accx   | webkit   |

  # Accessibility
  @a11y
  Scenario Outline: Module preserves accessibility attributes
    Given the "<module>" module is loaded
    And the test environment is clean
    And an element with both "<module>" and ARIA attributes
    When the module processes the element
    Then all ARIA attributes should be preserved
    And tabindex should be maintained
    And role should not be modified

    Examples:
      | module |
      | fmtx   |
      | accx   |

  # Concurrent Operations
  @concurrency
  Scenario Outline: Module handles concurrent processing safely
    Given the "<module>" module is loaded
    And the test environment is clean
    And 5 elements with "<module>" attributes
    When all elements are processed concurrently
    Then no race conditions should occur
    And all elements should be correctly processed
    And the module state should remain consistent

    Examples:
      | module |
      | fmtx   |
      | accx   |

  # Module Isolation
  @isolation
  Scenario Outline: Module does not pollute global scope
    Given the "<module>" module is loaded
    And the test environment is clean
    When I inspect the window object
    Then only documented globals should exist
    And no internal functions should be exposed
    And module variables should be encapsulated

    Examples:
      | module     |
      | fmtx       |
      | accx       |
      | bootloader |

  @isolation
  Scenario Outline: Module does not conflict with other modules
    Given the "<module1>" module is loaded
    And the test environment is clean
    And the "<module2>" module is also loaded
    When both modules process the same element
    Then they should work independently
    And neither should interfere with the other

    Examples:
      | module1 | module2 |
      | fmtx    | accx    |
      | accx    | fmtx    |
