Feature: AccessX (accX) - Accessibility Enhancement Module
  As a web developer
  I want automatic WCAG 2.1 AA compliance via HTML attributes
  So that my site is accessible without manual ARIA implementation

  Background:
    Given the accX module is loaded
    And the DOM is ready

  # Screen Reader Support
  Scenario: Screen reader only text
    Given an element with ax-enhance="srOnly" ax-sr-text="Twenty-five dollars"
    And the element contains "$25.00"
    When the element is processed
    Then a screen reader only span should be added
    And the span should contain "Twenty-five dollars"
    And the span should have class "ax-sr-only"
    And the span should be visually hidden but screen reader accessible

  # ARIA Labels
  Scenario: Abbreviation with aria-label
    Given an element with ax-enhance="label" ax-type="abbreviation" ax-full="Application Programming Interface"
    And the element contains "API"
    When the element is processed
    Then the element should have aria-label="Application Programming Interface"
    And the element should have title="Application Programming Interface"

  Scenario: Icon with meaning
    Given an element with ax-enhance="label" ax-type="icon" ax-meaning="Home"
    When the element is processed
    Then the element should have aria-label="Home"
    And the element should have role="img"

  Scenario: Currency label
    Given an element with ax-enhance="label" ax-type="currency"
    And the element contains "$25.00"
    When the element is processed
    Then the element should have aria-label="$25.00 dollars"

  Scenario: Date label
    Given an element with ax-enhance="label" ax-type="date"
    And the element contains "2024-03-15"
    When the element is processed
    Then the element should have aria-label matching "Friday, March 15, 2024"

  Scenario: Percentage label
    Given an element with ax-enhance="label" ax-type="percentage"
    And the element contains "99.9%"
    When the element is processed
    Then the element should have aria-label="99.9% percent"

  # Live Regions
  Scenario: Polite live region
    Given an element with ax-enhance="live" ax-priority="polite" ax-status="true"
    When the element is processed
    Then the element should have aria-live="polite"
    And the element should have aria-atomic="true"
    And the element should have role="status"

  Scenario: Assertive live region for alerts
    Given an element with ax-enhance="live" ax-priority="assertive" ax-alert="true"
    When the element is processed
    Then the element should have aria-live="assertive"
    And the element should have role="alert"

  # Form Field Enhancement
  Scenario: Required form field with help text
    Given an input with ax-enhance="field" ax-required="true" ax-help="Enter your email"
    And the input has id="email"
    When the element is processed
    Then the input should have aria-required="true"
    And a help text element should be created
    And the help text should contain "Enter your email"
    And the input should have aria-describedby pointing to help text

  Scenario: Invalid form field with error message
    Given an input with ax-enhance="field" ax-invalid="true" ax-error="Invalid email format"
    When the element is processed
    Then the input should have aria-invalid="true"
    And an error message element should be created
    And the error message should contain "Invalid email format"
    And the input should have aria-errormessage pointing to error element

  Scenario: Character counter for textarea
    Given a textarea with ax-enhance="field" ax-show-count="true" maxlength="200"
    When the element is processed
    Then a character counter should be added
    And it should display "0/200 characters"
    When the user types "Hello"
    Then it should display "5/200 characters"

  # Navigation Enhancement
  Scenario: Navigation with aria-label
    Given a nav element with ax-enhance="nav" ax-label="Main Navigation"
    When the element is processed
    Then the nav should have role="navigation"
    And the nav should have aria-label="Main Navigation"

  Scenario: Current page link
    Given a nav with ax-enhance="nav" ax-current="true"
    And a link href="/about"
    And the current URL is "/about"
    When the element is processed
    Then the link should have aria-current="page"

  # Button Enhancement
  Scenario: Toggle button state
    Given a button with ax-enhance="button" ax-pressed="false"
    When the element is processed
    Then the button should have role="button"
    And the button should have aria-pressed="false"

  Scenario: Loading button state
    Given a button with ax-enhance="button" ax-loading="true"
    When the element is processed
    Then the button should have aria-busy="true"
    And the button should have aria-disabled="true"

  Scenario: Non-button element as button
    Given a div with ax-enhance="button" onclick="handleClick()"
    When the element is processed
    Then the div should have role="button"
    And the div should have tabindex="0"
    And the div should be keyboard accessible

  # Table Accessibility (XSS-Safe)
  Scenario: Table with auto-headers (safe DOM manipulation)
    Given a table with ax-enhance="table" ax-auto-headers="true"
    And the first row contains:
      | Product | Price |
    When the element is processed
    Then the first row cells should be converted to <th> elements
    And each th should have scope="col"
    And no innerHTML should be used (XSS-safe)

  Scenario: Table with row headers
    Given a table with ax-enhance="table" ax-row-headers="true"
    When the element is processed
    Then the first cell of each row should be <th>
    And each th should have scope="row"
    And DOM nodes should be moved safely without innerHTML

  Scenario: Table with caption
    Given a table with ax-enhance="table" ax-caption="Sales Report"
    When the element is processed
    Then a caption element should be added
    And the caption should contain "Sales Report"

  Scenario: Sortable table column
    Given a table with ax-enhance="table"
    And a th element with ax-sortable="true"
    When the element is processed
    Then the th should have aria-sort="none"
    And the th should have role="columnheader"
    When the th is clicked
    Then aria-sort should change to "ascending"

  # Image Accessibility
  Scenario: Decorative image
    Given an img with ax-enhance="image" ax-decorative="true"
    When the element is processed
    Then the img should have alt=""
    And the img should have aria-hidden="true"
    And the img should have role="presentation"

  Scenario: Image with long description
    Given an img with ax-enhance="image" ax-description="Chart showing 40% sales increase"
    And the img has alt="Sales chart"
    When the element is processed
    Then a description element should be created
    And the img should have aria-describedby pointing to description

  # Modal Dialog
  Scenario: Modal with focus trap
    Given a div with ax-enhance="modal" ax-trap-focus="true" ax-close-on-escape="true"
    And the div has id="modal"
    When the element is processed
    Then the div should have role="dialog"
    And the div should have aria-modal="true"
    And focus should be trapped within the modal
    And pressing Escape should close the modal

  # Skip Link
  Scenario: Auto-generated skip link
    Given a div with ax-enhance="skipLink" ax-target="#main"
    When the element is processed
    Then a skip link should be created
    And the link text should be "Skip to main content"
    And the link href should be "#main"
    And the link should be hidden until focused

  # Landmark Regions
  Scenario: Main landmark
    Given a div with ax-enhance="landmark" ax-role="main"
    When the element is processed
    Then the div should have role="main"

  Scenario: Complementary landmark with label
    Given a div with ax-enhance="landmark" ax-role="complementary" ax-label="Sidebar"
    When the element is processed
    Then the div should have role="complementary"
    And the div should have aria-label="Sidebar"

  # Focus Management
  Scenario: Enhanced focus indicator
    Given a button with ax-enhance="focus" ax-enhance="true"
    When the element is processed
    Then focus styles should be enhanced
    And keyboard navigation should work

  # Dynamic Announcements
  Scenario: Polite announcement
    Given the accX module is initialized
    When AccessX.announce("Changes saved", "polite") is called
    Then a temporary live region should be created
    And it should have aria-live="polite"
    And it should contain "Changes saved"
    And it should be removed after announcement

  Scenario: Assertive announcement
    Given the accX module is initialized
    When AccessX.announce("Error occurred", "assertive") is called
    Then a temporary live region should be created
    And it should have aria-live="assertive"
    And it should contain "Error occurred"

  # Validation
  Scenario: Validate image missing alt text
    Given an img element without alt attribute
    When AccessX.validate() is called on the image
    Then it should return an error
    And the error should indicate "Missing alt text"
    And the severity should be "error"

  Scenario: Validate form field without label
    Given an input without an associated label
    And the input has no aria-label or aria-labelledby
    When AccessX.validate() is called
    Then it should return an error
    And the error should indicate "Form field without label"

  # Dynamic Content
  Scenario: MutationObserver enhances new accessible elements
    Given the accX module is initialized with observe=true
    When a new element is added:
      """
      <button ax-enhance="button" ax-pressed="false">Toggle</button>
      """
    Then the MutationObserver should detect it
    And the button should be automatically enhanced
    And it should have aria-pressed="false"

  # Performance
  Scenario: Process 1000 accessible elements under 16ms
    Given 1000 elements with various ax- attributes
    When all accX elements are processed
    Then the operation should complete in less than 16ms
    And it should maintain 60 FPS

  # Security - XSS Protection
  Scenario: Table enhancement never uses innerHTML
    Given a table with malicious content in cells:
      """
      <td><script>alert('xss')</script>Product</td>
      """
    And the table has ax-enhance="table" ax-auto-headers="true"
    When the element is processed
    Then the script should not execute
    And DOM manipulation should be safe
    And child nodes should be moved via appendChild

  # Error Handling
  Scenario: Invalid enhancement type
    Given an element with ax-enhance="invalid-type"
    When the element is processed
    Then it should log a warning
    And it should not throw an error
    And other enhancements should continue working
