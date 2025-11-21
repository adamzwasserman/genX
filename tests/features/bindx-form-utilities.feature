Feature: bindX Form Utilities
  bindX provides comprehensive form validation, serialization, and state management
  integrating seamlessly with the reactive data binding system.

  Background:
    Given the bindX module is loaded
    And the test environment is clean

  # ========================================
  # VALIDATION RULES
  # ========================================

  Scenario: Required field validation
    Given a reactive data object with email=""
    And a form with required email field
    When the form is validated
    Then the form should be invalid
    And the email field should have error class

  Scenario: Email validation with valid email
    Given a reactive data object with email="test@example.com"
    And a form with email validation
    When the form is validated
    Then the form should be valid

  Scenario: Email validation with invalid email
    Given a reactive data object with email="invalid-email"
    And a form with email validation
    When the form is validated
    Then the form should be invalid
    And the email field should have error "email"

  Scenario: Min/Max value validation
    Given a reactive data object with age=25
    And a form with age field validated min=18 max=65
    When the form is validated
    Then the form should be valid

  Scenario: Min value validation failure
    Given a reactive data object with age=15
    And a form with age field validated min=18
    When the form is validated
    Then the form should be invalid
    And the age field should have error "min"

  Scenario: MinLength/MaxLength validation
    Given a reactive data object with username="john"
    And a form with username field validated minLength=3 maxLength=20
    When the form is validated
    Then the form should be valid

  Scenario: MinLength validation failure
    Given a reactive data object with username="ab"
    And a form with username field validated minLength=3
    When the form is validated
    Then the form should be invalid

  Scenario: Pattern validation with regex
    Given a reactive data object with code="ABC123"
    And a form with code field validated pattern="^[A-Z0-9]+$"
    When the form is validated
    Then the form should be valid

  Scenario: URL validation
    Given a reactive data object with website="https://example.com"
    And a form with URL validation
    When the form is validated
    Then the form should be valid

  Scenario: Phone number validation
    Given a reactive data object with phone="(555) 123-4567"
    And a form with phone validation
    When the form is validated
    Then the form should be valid

  Scenario: Multiple validation rules
    Given a reactive data object with email="test@example.com"
    And a form with email field validated "required email minLength:5"
    When the form is validated
    Then the form should be valid

  Scenario: Multiple rules with one failing
    Given a reactive data object with email="ab"
    And a form with email field validated "required email minLength:5"
    When the form is validated
    Then the form should be invalid
    And there should be 2 errors for email field

  # ========================================
  # FORM SERIALIZATION
  # ========================================

  Scenario: Serialize simple form
    Given a form with fields:
      | name     | value           |
      | username | john            |
      | email    | john@email.com  |
    When the form is serialized
    Then the result should contain username="john"
    And the result should contain email="john@email.com"

  Scenario: Serialize form with nested paths
    Given a form with fields:
      | name          | value           |
      | user.name     | John Doe        |
      | user.email    | john@email.com  |
    When the form is serialized
    Then the result should have user.name="John Doe"
    And the result should have user.email="john@email.com"

  Scenario: Serialize form with select element
    Given a form with select field "country" value "us"
    When the form is serialized
    Then the result should contain country="us"

  Scenario: Serialize form with textarea
    Given a form with textarea field "message" value "Hello World"
    When the form is serialized
    Then the result should contain message="Hello World"

  Scenario: Serialize form with checkbox
    Given a form with checkbox field "agree" checked
    When the form is serialized
    Then the result should contain agree="on"

  # ========================================
  # FORM DESERIALIZATION
  # ========================================

  Scenario: Deserialize simple data to form
    Given a form with empty fields:
      | name     |
      | username |
      | email    |
    And reactive data with username="john" email="john@email.com"
    When the data is deserialized to the form
    Then the username field should have value "john"
    And the email field should have value "john@email.com"

  Scenario: Deserialize nested data to form
    Given a form with empty fields:
      | name       |
      | user.name  |
      | user.email |
    And reactive data with user.name="John" user.email="john@email.com"
    When the data is deserialized to the form
    Then the "user.name" field should have value "John"
    And the "user.email" field should have value "john@email.com"

  Scenario: Deserialize to checkbox
    Given a form with unchecked checkbox "agree"
    And reactive data with agree=true
    When the data is deserialized to the form
    Then the checkbox "agree" should be checked

  Scenario: Deserialize to radio buttons
    Given a form with radio buttons "gender" options "male,female"
    And reactive data with gender="female"
    When the data is deserialized to the form
    Then the radio button "gender" value "female" should be selected

  # ========================================
  # FORM STATE MANAGEMENT
  # ========================================

  Scenario: Form starts in pristine state
    Given a form with bx-form attribute
    And reactive data object
    When the form is scanned
    Then the form should have class "bx-pristine"
    And the form should not have class "bx-dirty"
    And the form state pristine should be true

  Scenario: Form becomes dirty on input
    Given a form with bx-form attribute and text input
    And reactive data object
    And the form is scanned
    When the user types in the input
    Then the form should have class "bx-dirty"
    And the form should not have class "bx-pristine"
    And the form state dirty should be true

  Scenario: Form tracks valid state
    Given a form with validated fields
    And reactive data with valid values
    When the form is validated
    Then the form should have class "bx-valid"
    And the form state valid should be true

  Scenario: Form tracks invalid state
    Given a form with validated fields
    And reactive data with invalid values
    When the form is validated
    Then the form should have class "bx-invalid"
    And the form state invalid should be true

  # ========================================
  # FORM SUBMISSION
  # ========================================

  Scenario: Valid form submission
    Given a form with bx-form attribute
    And fields with validation rules
    And reactive data with valid values
    And the form is scanned
    When the form is submitted
    Then the form should validate successfully
    And a "bx-form-valid" event should be dispatched
    And the reactive data should be updated with form values

  Scenario: Invalid form submission
    Given a form with bx-form attribute
    And fields with validation rules
    And reactive data with invalid values
    And the form is scanned
    When the form is submitted
    Then the form should not validate
    And a "bx-form-invalid" event should be dispatched
    And the reactive data should not be updated

  Scenario: Form submission with custom handler
    Given a form with bx-form attribute
    And a custom submit handler "handleFormSubmit"
    And reactive data with valid values
    And the form is scanned
    When the form is submitted
    Then the custom handler should be called with form data

  Scenario: Form prevents default submission
    Given a form with bx-form attribute
    And reactive data object
    And the form is scanned
    When the form is submitted
    Then the default form submission should be prevented

  # ========================================
  # FORM RESET
  # ========================================

  Scenario: Form reset clears values
    Given a form with input fields
    And the fields have values
    When the form is reset
    Then all fields should be empty

  Scenario: Form reset returns to pristine state
    Given a form with bx-form attribute
    And the form is in dirty state
    When the form is reset
    Then the form should have class "bx-pristine"
    And the form state pristine should be true

  Scenario: Form reset clears errors
    Given a form with validation errors
    And fields have error classes
    When the form is reset
    Then all error classes should be removed
    And all error messages should be cleared

  # ========================================
  # REAL-TIME VALIDATION
  # ========================================

  Scenario: Field validates on input
    Given a form with bx-form attribute
    And a field with bx-validate="required email"
    And reactive data with email=""
    And the form is scanned
    When the user types "test@example.com" in the email field
    Then the field should have class "bx-valid"
    And the field should not have error class

  Scenario: Field shows error on invalid input
    Given a form with bx-form attribute
    And a field with bx-validate="email"
    And reactive data with email=""
    And the form is scanned
    When the user types "invalid-email" in the email field
    Then the field should have class "bx-error"
    And an error message should be displayed

  Scenario: Error message updates on correction
    Given a form with bx-form attribute
    And a field with validation error
    And an error message is displayed
    When the user corrects the value
    Then the error message should be cleared
    And the field should have class "bx-valid"

  # ========================================
  # CUSTOM ERROR MESSAGES
  # ========================================

  Scenario: Display custom error message
    Given a form with field having bx-error-required="This is mandatory"
    And the field has bx-validate="required"
    And reactive data with empty value
    When the form is validated
    Then the error message should be "This is mandatory"

  Scenario: Display default error message
    Given a form with field having bx-validate="required"
    And no custom error message
    And reactive data with empty value
    When the form is validated
    Then the error message should contain "required"

  # ========================================
  # INTEGRATION WITH BX-MODEL
  # ========================================

  Scenario: Form validation integrates with bx-model
    Given a form with bx-form attribute
    And fields using bx-model for binding
    And reactive data object
    And the form is scanned
    When the user changes a field value
    Then the reactive data should update immediately
    And validation should run on the new value

  Scenario: Two-way binding maintains sync during validation
    Given a form with bx-model on all fields
    And bx-validate on fields
    And reactive data object
    And the form is scanned
    When the data is updated programmatically
    Then the form fields should update
    And validation should reflect the new values

  # ========================================
  # EDGE CASES
  # ========================================

  Scenario: Empty validation attribute
    Given a form with field having bx-validate=""
    And reactive data object
    When the form is validated
    Then no validation should occur
    And the form should be valid

  Scenario: Unknown validation rule
    Given a form with field having bx-validate="unknownRule"
    And reactive data object
    When the form is validated
    Then a warning should be logged
    And the form should be valid

  Scenario: Field without bx-model or name
    Given a form with field having bx-validate="required"
    And the field has no bx-model or name attribute
    And reactive data object
    When the form is validated
    Then a warning should be logged
    And the field should be skipped

  Scenario: Null reactive data
    Given a form with bx-form attribute
    And null reactive data
    When the form is scanned
    Then no error should occur

  Scenario: Form without bx-form attribute
    Given a regular form without bx-form
    And reactive data object
    When the container is scanned
    Then no form handlers should be set up
