Feature: loadX ARIA Live Region Management
  As a screen reader user
  I want loading announcements to be cleared after completion
  So that I don't hear outdated loading messages

  @critical @accessibility
  Scenario: Single loading announcement clears
    Given an element with lx-strategy="spinner"
    When I apply loading state
    Then ARIA live region should announce "Loading"
    When I wait 1 second
    Then ARIA live region should be empty

  @accessibility
  Scenario: Multiple rapid announcements
    Given multiple elements with loading states
    When I apply loading to element 1
    And I apply loading to element 2
    And I apply loading to element 3
    Then ARIA live region should contain latest message
    When I wait 1 second after last announcement
    Then ARIA live region should be empty

  @accessibility
  Scenario: Urgent loading uses assertive
    Given an element with lx-strategy="spinner" and lx-urgent="true"
    When I apply loading state
    Then ARIA live region should use aria-live="assertive"
    And should announce urgently

  @accessibility
  Scenario: Completion announcement
    Given an element in loading state
    When I remove loading state
    Then ARIA live region should announce "Loading complete"
    When I wait 1 second
    Then ARIA live region should be empty
