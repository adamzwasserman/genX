Feature: loadX Dynamic Content Detection
  As a developer building SPAs
  I want loadX to detect dynamically added elements
  So that loading states work with modern frameworks

  @critical @mutation
  Scenario: Element added after init
    Given loadX is initialized
    When I dynamically add an element with lx-strategy="spinner"
    Then the element should be tracked by loadX
    And loading state should work when triggered

  @mutation
  Scenario: Multiple rapid additions
    Given loadX is initialized with debouncing
    When I rapidly add 10 elements with lx-loading
    Then MutationObserver should debounce scanning
    And all 10 elements should be tracked
    And scan count should be less than 5

  @mutation
  Scenario: Element removed before processing
    Given loadX is initialized
    When I add an element with lx-loading
    And I remove it before scan completes
    Then no error should occur
    And memory should not leak

  @mutation @performance
  Scenario: Large DOM additions
    Given loadX is initialized
    When I add 100 elements at once
    Then processing should complete in <100ms
    And browser should remain responsive
