Feature: loadX API Cleanup
  As a library maintainer
  I want to reduce global namespace pollution
  So that the public API is clean and maintainable

  @api @critical
  Scenario: Core API methods are available
    Given loadX is initialized
    Then window.loadX.init should exist
    And window.loadX.apply should exist
    And window.loadX.remove should exist
    And window.loadX.update should exist

  @api
  Scenario: Strategy methods are internal
    Given loadX is initialized
    Then window.loadX.applySpinnerStrategy should not exist
    And window.loadX.removeSpinnerStrategy should not exist
    And window.loadX.applySkeletonStrategy should not exist
    And window.loadX.applyProgressStrategy should not exist
    And window.loadX.applyFadeStrategy should not exist

  @api @backward-compat
  Scenario: Deprecated methods show warnings
    Given loadX is initialized
    When I call window.loadX.applyLoadingState
    Then a deprecation warning should be logged
    And the method should still work

  @api
  Scenario: Init method initializes loadX
    Given loadX is not initialized
    When I call window.loadX.init with config
    Then loadX should be initialized
    And the config should be applied

  @api
  Scenario: Apply method applies loading state
    Given loadX is initialized
    And an element with id "test-element"
    When I call window.loadX.apply with element and options
    Then the element should have loading state

  @api
  Scenario: Remove method removes loading state
    Given loadX is initialized
    And an element with loading state
    When I call window.loadX.remove with the element
    Then the loading state should be removed

  @api
  Scenario: Update method updates loading state
    Given loadX is initialized
    And an element with progress strategy
    When I call window.loadX.update with element and value 50
    Then the progress value should be 50
