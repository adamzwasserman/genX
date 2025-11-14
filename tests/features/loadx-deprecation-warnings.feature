Feature: loadX v2.0 Deprecation Warnings
  As a developer
  I want to receive deprecation warnings for legacy syntax
  So that I can migrate to modern data attributes before v3.0

  Background:
    Given the page has loaded
    And the document body exists

  # Default behavior: warnings enabled
  Scenario: CSS class syntax shows deprecation warning
    Given console.warn is being monitored
    When loadX is initialized without configuration
    And an element with class "lx-spinner" is added to the DOM
    And the element is enhanced
    Then a console warning should be logged containing "CSS class syntax (lx-spinner) is deprecated"
    And the warning should mention "data-lx-strategy"
    And the warning should mention "v3.0"
    And the element should still be enhanced with spinner strategy

  Scenario: Colon syntax shows deprecation warning
    Given console.warn is being monitored
    When loadX is initialized without configuration
    And an element with class "lx:spinner:500" is added to the DOM
    And the element is enhanced
    Then a console warning should be logged containing "Colon syntax (lx:spinner:500) is deprecated"
    And the warning should mention "data-lx-strategy attribute or lx-config JSON"
    And the warning should mention "v3.0"
    And the element should be enhanced with spinner strategy
    And the duration should be 500

  Scenario: Modern syntax does not show deprecation warning
    Given console.warn is being monitored
    When loadX is initialized without configuration
    And an element with attribute "data-lx-strategy=spinner" is added to the DOM
    And the element is enhanced
    Then no console warnings should be logged
    And the element should be enhanced with spinner strategy

  # Strict mode: throw errors
  Scenario: CSS class syntax throws error in strict mode
    When loadX is initialized with:
      | property      | value |
      | modernSyntax  | true  |
    And an element with class "lx-spinner" is added to the DOM
    Then enhancing the element should throw an error
    And the error should contain "CSS class syntax (lx-spinner) is not supported in strict mode"
    And the error should mention "data-lx-strategy"

  Scenario: Colon syntax throws error in strict mode
    When loadX is initialized with:
      | property      | value |
      | modernSyntax  | true  |
    And an element with class "lx:fade:300" is added to the DOM
    Then enhancing the element should throw an error
    And the error should contain "Colon syntax (lx:fade:300) is not supported in strict mode"
    And the error should mention "data-lx-strategy attribute or lx-config JSON"

  Scenario: Modern syntax works in strict mode
    When loadX is initialized with:
      | property      | value |
      | modernSyntax  | true  |
    And an element with attribute "data-lx-strategy=spinner" is added to the DOM
    And the element is enhanced
    Then no errors should occur
    And the element should be enhanced with spinner strategy

  # Silence deprecations
  Scenario: Silence deprecation warnings
    Given console.warn is being monitored
    When loadX is initialized with:
      | property              | value |
      | silenceDeprecations   | true  |
    And an element with class "lx-spinner" is added to the DOM
    And the element is enhanced
    Then no console warnings should be logged
    And the element should still be enhanced with spinner strategy

  Scenario: Multiple legacy elements show multiple warnings
    Given console.warn is being monitored
    When loadX is initialized without configuration
    And an element with class "lx-spinner" is added to the DOM
    And an element with class "lx:progress:500" is added to the DOM
    And an element with class "lx-skeleton" is added to the DOM
    And all elements are enhanced
    Then 3 console warnings should be logged
    And all elements should be enhanced correctly

  # Configuration validation
  Scenario: Config options are properly merged
    When loadX is initialized with:
      | property              | value |
      | modernSyntax          | true  |
      | silenceDeprecations   | false |
      | minDisplayMs          | 500   |
    Then loadX should be initialized
    And modernSyntax should be true
    And silenceDeprecations should be false
    And minDisplayMs should be 500

  Scenario: Default config values for v2.0 options
    When loadX is initialized without configuration
    Then modernSyntax should be false
    And silenceDeprecations should be false

  # Migration scenarios
  Scenario: Gradual migration from CSS classes to data attributes
    Given console.warn is being monitored
    When loadX is initialized without configuration
    And an element with class "lx-spinner" is added to the DOM
    And an element with attribute "data-lx-strategy=progress" is added to the DOM
    And all elements are enhanced
    Then only 1 console warning should be logged
    And both elements should be enhanced correctly
    And the modern syntax element should not trigger warnings
