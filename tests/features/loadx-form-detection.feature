Feature: loadX Form Submission Detection
  As a developer using loadX
  I want accurate loading state detection for form submissions
  So that loading indicators reflect actual request state

  @critical
  Scenario: Form submission with fast response
    Given a form with lx-loading attribute
    And a mock fetch that resolves in 50ms
    When I submit the form
    Then loading state should appear immediately
    And loading state should disappear after 50ms (not 300ms)

  @critical
  Scenario: Form submission with slow response
    Given a form with lx-loading attribute
    And a mock fetch that resolves in 2000ms
    When I submit the form
    Then loading state should appear immediately
    And loading state should disappear after 2000ms

  Scenario: Form submission error
    Given a form with lx-loading attribute
    And a mock fetch that rejects
    When I submit the form
    Then loading state should appear immediately
    And loading state should disappear when error occurs

  Scenario: Form submission abort
    Given a form with lx-loading attribute
    And a mock fetch that can be aborted
    When I submit the form
    And I abort the request
    Then loading state should disappear immediately
