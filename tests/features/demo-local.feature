Feature: Local Demo Page Verification
  As a developer
  I want to verify the local demo page works
  So I can test genX changes locally

  @demo @local
  Scenario: Local demo page loads and fmtX formats currency
    Given I navigate to the local demo page
    Then the page should load without JavaScript errors
    And the fmtX module should format currency values

  @demo @local
  Scenario: fmtX formats percentages correctly
    Given I navigate to the local demo page
    Then the page should load without JavaScript errors
    And the fmtX module should format percentage values

  @demo @local
  Scenario: fmtX formats dates correctly
    Given I navigate to the local demo page
    Then the page should load without JavaScript errors
    And the fmtX module should format date values
