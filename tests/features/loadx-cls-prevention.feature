Feature: loadX v2.0 CLS Prevention with ResizeObserver

  Background:
    Given I open a test page
    And the page has the loadX script loaded

  Scenario: ResizeObserver reserves space when loading state applied
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "test-btn" is added to the DOM
    And the element has width "200px" and height "40px"
    And I apply loading state to the element with strategy "spinner"
    Then the element should have min-width set to "200px"
    And the element should have min-height set to "40px"
    And a ResizeObserver should be attached to the element

  Scenario: Original dimensions restored after loading state removed
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "test-btn" is added to the DOM
    And the element has width "200px" and height "40px"
    And the element has original min-width "auto"
    And I apply loading state to the element with strategy "spinner"
    And I wait for 100 milliseconds
    And I remove loading state from the element
    Then the element should have min-width set to "auto"
    And the ResizeObserver should be disconnected

  Scenario: preventCLS disabled does not create ResizeObserver
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | false |
    And an element with id "test-btn" is added to the DOM
    And I apply loading state to the element with strategy "spinner"
    Then no ResizeObserver should be attached to the element
    And the element should not have min-width modified
    And the element should not have min-height modified

  Scenario: Multiple elements each get their own ResizeObserver
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "btn1" is added to the DOM with dimensions "200px" x "40px"
    And an element with id "btn2" is added to the DOM with dimensions "150px" x "35px"
    And I apply loading state to "btn1" with strategy "spinner"
    And I apply loading state to "btn2" with strategy "skeleton"
    Then element "btn1" should have min-width "200px" and min-height "40px"
    And element "btn2" should have min-width "150px" and min-height "35px"
    And 2 ResizeObservers should be active

  Scenario: Disconnect API cleans up all ResizeObservers
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "btn1" is added to the DOM
    And an element with id "btn2" is added to the DOM
    And I apply loading state to "btn1" with strategy "spinner"
    And I apply loading state to "btn2" with strategy "skeleton"
    And 2 ResizeObservers should be active
    And I call the disconnect API
    Then all ResizeObservers should be disconnected
    And 0 ResizeObservers should be active

  Scenario: ResizeObserver handles zero dimensions gracefully
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "hidden-btn" is added to the DOM
    And the element has width "0px" and height "0px"
    And I apply loading state to the element with strategy "spinner"
    Then the element should not have min-width set
    And the element should not have min-height set
    But a ResizeObserver should still be attached for future measurements

  Scenario: CLS prevention works with all loading strategies
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "spinner-btn" is added with dimensions "200px" x "40px"
    And an element with id "skeleton-btn" is added with dimensions "300px" x "50px"
    And an element with id "progress-btn" is added with dimensions "250px" x "45px"
    And an element with id "fade-btn" is added with dimensions "180px" x "38px"
    And I apply "spinner" strategy to "spinner-btn"
    And I apply "skeleton" strategy to "skeleton-btn"
    And I apply "progress" strategy to "progress-btn"
    And I apply "fade" strategy to "fade-btn"
    Then all elements should have their dimensions preserved
    And 4 ResizeObservers should be active

  Scenario: ResizeObserver memory cleanup in long-running SPA
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And I simulate a long-running SPA scenario:
      """
      1. Add 10 elements
      2. Apply loading to all
      3. Remove loading from all
      4. Remove 5 elements from DOM
      5. Garbage collection eligible
      """
    Then WeakMaps should automatically clean up references
    And activeObservers Set should be empty
    And no memory leaks should be detected

  Scenario: Performance impact of ResizeObserver is minimal
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And I add 100 elements to the DOM
    And I measure performance while applying loading to all elements
    Then the total operation should complete in under 100ms
    And each ResizeObserver creation should take less than 1ms on average

  Scenario: ResizeObserver tracks size changes during loading
    When loadX is initialized with:
      | property      | value |
      | preventCLS    | true  |
    And an element with id "dynamic-btn" is added with dimensions "200px" x "40px"
    And I apply loading state to the element
    And the element content changes causing it to expand to "250px" x "45px"
    Then the ResizeObserver should detect the size change
    And the new dimensions should be stored in originalDimensions
    And removing loading should restore to the updated dimensions
