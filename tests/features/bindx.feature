Feature: bindX - Declarative Reactive Data Binding
  As a web developer
  I want declarative reactive data binding through HTML attributes
  So that I can create reactive UIs without frameworks

  Background:
    Given the bindX module is loaded
    And the DOM is ready

  # Two-Way Binding (bx-model)
  Scenario: Basic two-way binding with input
    Given an input with bx-model="user.name"
    And the reactive data object has user.name="John"
    When the page is rendered
    Then the input should display "John"
    When the user types "Jane" into the input
    Then the data object user.name should be "Jane"

  Scenario: Two-way binding with checkbox
    Given a checkbox with bx-model="user.subscribe"
    And the reactive data object has user.subscribe=false
    When the page is rendered
    Then the checkbox should be unchecked
    When the user checks the checkbox
    Then the data object user.subscribe should be true

  Scenario: Two-way binding with radio buttons
    Given radio buttons with bx-model="user.plan" and values "free", "pro", "enterprise"
    And the reactive data object has user.plan="pro"
    When the page is rendered
    Then the "pro" radio button should be selected
    When the user selects the "enterprise" radio button
    Then the data object user.plan should be "enterprise"

  Scenario: Two-way binding with select dropdown
    Given a select element with bx-model="user.country"
    And options for "US", "UK", "CA"
    And the reactive data object has user.country="UK"
    When the page is rendered
    Then the dropdown should display "UK"
    When the user selects "CA"
    Then the data object user.country should be "CA"

  Scenario: Two-way binding with textarea
    Given a textarea with bx-model="user.bio"
    And the reactive data object has user.bio="Hello World"
    When the page is rendered
    Then the textarea should display "Hello World"
    When the user types "New bio text" into the textarea
    Then the data object user.bio should be "New bio text"

  # One-Way Binding (bx-bind)
  Scenario: One-way binding to text content
    Given an element with bx-bind:text="user.name"
    And the reactive data object has user.name="John"
    When the page is rendered
    Then the element should display "John"
    When the data object user.name changes to "Jane"
    Then the element should automatically update to "Jane"

  Scenario: One-way binding to HTML attribute
    Given an img with bx-bind:src="image.url"
    And the reactive data object has image.url="/photo.jpg"
    When the page is rendered
    Then the img src should be "/photo.jpg"
    When the data object image.url changes to "/new-photo.jpg"
    Then the img src should automatically update to "/new-photo.jpg"

  Scenario: One-way binding to CSS class
    Given an element with bx-bind:class="status.active"
    And the reactive data object has status.active=true
    When the page is rendered
    Then the element should have class "active"
    When the data object status.active changes to false
    Then the element should not have class "active"

  Scenario: One-way binding to style attribute
    Given an element with bx-bind:style.color="theme.color"
    And the reactive data object has theme.color="red"
    When the page is rendered
    Then the element style color should be "red"
    When the data object theme.color changes to "blue"
    Then the element style color should automatically update to "blue"

  # Computed Properties (bx-compute)
  Scenario: Basic computed property
    Given an element with bx-compute="fullName"
    And the computed function returns user.firstName + ' ' + user.lastName
    And the reactive data has firstName="John" and lastName="Doe"
    When the page is rendered
    Then the element should display "John Doe"
    When the data object firstName changes to "Jane"
    Then the element should automatically update to "Jane Doe"

  Scenario: Computed property with multiple dependencies
    Given an element with bx-compute="total"
    And the computed function returns price * quantity
    And the reactive data has price=10 and quantity=5
    When the page is rendered
    Then the element should display "50"
    When the data object quantity changes to 3
    Then the element should automatically update to "30"

  Scenario: Computed property with conditional logic
    Given an element with bx-compute="status"
    And the computed function returns isActive ? 'Active' : 'Inactive'
    And the reactive data has isActive=true
    When the page is rendered
    Then the element should display "Active"
    When the data object isActive changes to false
    Then the element should automatically update to "Inactive"

  # Collection Binding (bx-each)
  Scenario: Render list of items
    Given an element with bx-each="item in items"
    And the template is "<li>{{ item.name }}</li>"
    And the reactive data has items=[{name:"Apple"}, {name:"Banana"}]
    When the page is rendered
    Then there should be 2 li elements
    And the first li should contain "Apple"
    And the second li should contain "Banana"

  Scenario: Add item to reactive list
    Given an element with bx-each="item in items"
    And the template is "<li>{{ item.name }}</li>"
    And the reactive data has items=[{name:"Apple"}]
    When the page is rendered
    Then there should be 1 li element
    When a new item {name:"Banana"} is added to items
    Then there should be 2 li elements
    And the second li should contain "Banana"

  Scenario: Remove item from reactive list
    Given an element with bx-each="item in items"
    And the template is "<li>{{ item.name }}</li>"
    And the reactive data has items=[{name:"Apple"}, {name:"Banana"}]
    When the page is rendered
    Then there should be 2 li elements
    When the first item is removed from items
    Then there should be 1 li element
    And the first li should contain "Banana"

  Scenario: Update item in reactive list
    Given an element with bx-each="item in items"
    And the template is "<li>{{ item.name }}</li>"
    And the reactive data has items=[{name:"Apple"}]
    When the page is rendered
    And the first li should contain "Apple"
    When the first item name changes to "Orange"
    Then the first li should contain "Orange"

  # Custom Formatters
  Scenario: Apply formatter to bound value
    Given an element with bx-bind:text="price" and bx-format="currency"
    And the reactive data has price=25.00
    When the page is rendered
    Then the element should display "$25.00"

  Scenario: Apply custom formatter function
    Given an element with bx-bind:text="user.email" and bx-format="lowercase"
    And the reactive data has user.email="JOHN@EXAMPLE.COM"
    When the page is rendered
    Then the element should display "john@example.com"

  # Deep Reactivity
  Scenario: Deep nested object reactivity
    Given an element with bx-bind:text="user.address.city"
    And the reactive data has user.address.city="New York"
    When the page is rendered
    Then the element should display "New York"
    When the data object user.address.city changes to "Los Angeles"
    Then the element should automatically update to "Los Angeles"

  Scenario: Deep array reactivity
    Given an element with bx-each="tag in post.tags"
    And the template is "<span>{{ tag }}</span>"
    And the reactive data has post.tags=["javascript", "web"]
    When the page is rendered
    Then there should be 2 span elements
    When a new tag "react" is pushed to post.tags
    Then there should be 3 span elements

  # Debouncing
  Scenario: Debounced input binding
    Given an input with bx-model="search.query" and bx-debounce="300"
    And the reactive data has search.query=""
    When the user types "hello" quickly
    Then the data should not update immediately
    When 300ms passes
    Then the data object search.query should be "hello"

  # Validation
  Scenario: Validate binding configuration
    Given an element with invalid bx-model=""
    When the page is rendered
    Then a validation error should be logged
    And the binding should not be created

  Scenario: Detect circular dependencies
    Given an element with bx-compute="a"
    And computed 'a' depends on computed 'b'
    And computed 'b' depends on computed 'a'
    When the page is rendered
    Then a circular dependency error should be thrown

  # Performance
  Scenario: Batch multiple updates in single RAF
    Given 10 elements bound to different properties
    When 10 properties change simultaneously
    Then only one DOM update should occur
    And the operation should complete in less than 16ms

  Scenario: Handle 1000 list items efficiently
    Given an element with bx-each="item in items"
    And the reactive data has 1000 items
    When the page is rendered
    Then all 1000 items should render
    And the operation should complete in less than 100ms

  # MutationObserver
  Scenario: Detect dynamically added elements
    Given the bindX module is initialized with observe=true
    When a new element with bx-model="dynamic.value" is added
    Then the binding should be automatically created
    And the element should be reactive

  # Event Handling
  Scenario: Emit change events
    Given an element with bx-model="user.name"
    And an event listener for "bx:change"
    When the user types "John" into the input
    Then a "bx:change" event should be emitted
    And the event detail should contain the new value

  # Error Handling
  Scenario: Handle invalid property path
    Given an element with bx-bind:text="nonexistent.path"
    And the reactive data does not have this path
    When the page is rendered
    Then an error should be logged
    And the element should display empty string

  Scenario: Handle non-object data
    Given bindx() is called with a non-object
    Then a TypeError should be thrown
    And the error message should be actionable

  # Cleanup
  Scenario: Unbind and cleanup
    Given an element with bx-model="user.name"
    And the binding is active
    When the unbind function is called
    Then the binding should be removed
    And memory should be released

  Scenario: Cleanup on element removal
    Given an element with bx-model="user.name"
    When the element is removed from the DOM
    Then the binding should be automatically cleaned up
    And no memory leaks should occur

  # Integration with fmtX
  Scenario: Combine bindX with fmtX
    Given an element with bx-bind:text="price" and fx-format="currency"
    And the reactive data has price=25.00
    When the page is rendered
    Then the element should display "$25.00"
    When the data object price changes to 30.00
    Then the element should display "$30.00"
