Feature: loadX Granular autoDetect Configuration
  As a developer
  I want fine-grained control over async operation detection
  So that I can enable only the detectors I need

  @config @critical
  Scenario: Boolean autoDetect true enables all detectors
    Given loadX is initialized with autoDetect: true
    Then fetch detector should be enabled
    And xhr detector should be enabled
    And htmx detector should be enabled
    And forms detector should be enabled

  @config
  Scenario: Boolean autoDetect false disables all detectors
    Given loadX is initialized with autoDetect: false
    Then fetch detector should be disabled
    And xhr detector should be disabled
    And htmx detector should be disabled
    And forms detector should be disabled

  @config
  Scenario: Object autoDetect allows per-detector control
    Given loadX is initialized with autoDetect: {fetch: true, xhr: false, htmx: true, forms: false}
    Then fetch detector should be enabled
    And xhr detector should be disabled
    And htmx detector should be enabled
    And forms detector should be disabled

  @config
  Scenario: Object autoDetect with partial config
    Given loadX is initialized with autoDetect: {fetch: true}
    Then fetch detector should be enabled
    And xhr detector should be enabled by default
    And htmx detector should be enabled by default
    And forms detector should be enabled by default

  @config @backward-compat
  Scenario: Undefined autoDetect defaults to true
    Given loadX is initialized without autoDetect config
    Then fetch detector should be enabled
    And xhr detector should be enabled
    And htmx detector should be enabled
    And forms detector should be enabled

  @config
  Scenario: Disable specific detector
    Given loadX is initialized with autoDetect: {forms: false}
    When a form is submitted
    Then forms detector should not trigger loading state
    But manual loading state application should still work
