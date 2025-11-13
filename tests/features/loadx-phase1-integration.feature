Feature: loadX Phase 1 Integration
  As a developer
  I want form detection and ARIA cleanup to work together
  So that accessible loading states work correctly

  @integration @critical
  Scenario: Form submission with accessible announcements
    Given a form with lx-loading and lx-urgent="true"
    When I submit the form with a 500ms response
    Then loading state should appear immediately
    And ARIA should announce "Loading" assertively
    And loading state should disappear after 500ms
    And ARIA should announce "Loading complete"
    And ARIA region should clear after 1 second

  @integration
  Scenario: Multiple form submissions
    Given two forms with lx-loading
    When I submit form 1
    And I submit form 2 before form 1 completes
    Then both forms should show loading states
    And ARIA should announce latest status
    And each form should clear independently
    And ARIA region should clear after last completion

  @integration
  Scenario: Form with non-urgent loading
    Given a form with lx-loading (no urgent flag)
    When I submit the form
    Then ARIA should announce "Loading" politely
    And ARIA live region should use aria-live="polite"
    When form completes
    Then ARIA should announce "Loading complete"
    And ARIA region should clear after 1 second

  @integration
  Scenario: Rapid form submissions with ARIA updates
    Given a form with lx-loading
    When I submit the form multiple times rapidly
    Then each submission should trigger loading state
    And ARIA announcements should not accumulate
    And only the latest announcement should be visible
    And all loading states should clear properly
