Feature: navX - Declarative Navigation
  As a web developer
  I want declarative navigation through HTML attributes
  So that I can create intuitive navigation without complex JavaScript

  Background:
    Given the navX module is loaded
    And the DOM is ready

  # Basic Navigation
  Scenario: Basic navigation menu
    Given a nav element with nx-nav="main"
    And links for "Home", "About", "Contact"
    When the page is rendered
    Then the navigation should be enhanced
    And all links should be keyboard accessible

  Scenario: Active link highlighting
    Given a nav with nx-nav="main" nx-active-class="active"
    And the current URL is "/about"
    When the page is rendered
    Then the "About" link should have class "active"
    And other links should not have the active class

  Scenario: Active link with exact match
    Given a nav with nx-exact="true"
    And a link to "/products"
    And the current URL is "/products/shoes"
    Then the link should not be active
    When the URL is exactly "/products"
    Then the link should be active

  # Breadcrumbs
  Scenario: Generate breadcrumbs from path
    Given an element with nx-breadcrumb="auto"
    And the current URL is "/products/electronics/phones"
    When the page is rendered
    Then breadcrumbs should display: "Home > Products > Electronics > Phones"

  Scenario: Custom breadcrumb labels
    Given an element with nx-breadcrumb="auto"
    And custom labels defined: {"products": "Shop", "electronics": "Tech"}
    When the page is rendered
    Then breadcrumbs should display: "Home > Shop > Tech > Phones"

  Scenario: Breadcrumb navigation
    Given rendered breadcrumbs
    When the user clicks "Products"
    Then navigation should occur to "/products"

  # Scroll Spy
  Scenario: Highlight section in navigation
    Given a nav with nx-scroll-spy="true"
    And sections with ids: "intro", "features", "pricing"
    When "features" section scrolls into view
    Then the "Features" nav link should be highlighted

  Scenario: Update navigation on scroll
    Given scroll spy enabled
    When the user scrolls down the page
    Then the active nav item should update
    And transitions should be smooth

  Scenario: Scroll spy with offset
    Given a nav with nx-scroll-spy="true" nx-offset="100"
    Then sections should activate 100px before reaching top

  # Smooth Scrolling
  Scenario: Smooth scroll to anchor
    Given a link with href="#section1" and nx-scroll="smooth"
    When the link is clicked
    Then the page should smoothly scroll to #section1
    And the animation should take ~500ms

  Scenario: Instant scroll
    Given a link with nx-scroll="instant"
    When the link is clicked
    Then the page should jump immediately to the target

  Scenario: Scroll with custom duration
    Given a link with nx-scroll="smooth" nx-duration="1000"
    When the link is clicked
    Then the scroll animation should take 1000ms

  # Mobile Navigation
  Scenario: Hamburger menu
    Given a nav with nx-mobile="hamburger"
    When viewed on mobile
    Then a hamburger icon should display
    And the menu should be hidden

  Scenario: Toggle mobile menu
    Given a mobile hamburger menu
    When the hamburger icon is clicked
    Then the menu should slide in
    When clicked again
    Then the menu should slide out

  Scenario: Close menu on link click
    Given an open mobile menu
    When a navigation link is clicked
    Then the menu should close automatically

  Scenario: Close menu on overlay click
    Given an open mobile menu with overlay
    When the overlay is clicked
    Then the menu should close

  # Dropdown Menus
  Scenario: Hover dropdown
    Given a nav item with nx-dropdown="hover"
    And submenu items defined
    When the user hovers over the item
    Then the dropdown should appear
    When the user moves away
    Then the dropdown should disappear after 300ms

  Scenario: Click dropdown
    Given a nav item with nx-dropdown="click"
    When the item is clicked
    Then the dropdown should toggle open/closed

  Scenario: Keyboard dropdown navigation
    Given a nav with dropdown
    When the user tabs to the dropdown trigger
    And presses Enter or Space
    Then the dropdown should open
    When the user presses Arrow Down
    Then focus should move to first dropdown item

  Scenario: Nested dropdowns
    Given a dropdown with sub-dropdowns
    When hovering a submenu item
    Then its dropdown should appear
    And parent dropdown should remain open

  # Mega Menus
  Scenario: Full-width mega menu
    Given a nav item with nx-mega="true"
    When the item is activated
    Then a full-width mega menu should display
    And it should contain multiple columns

  Scenario: Mega menu with grid layout
    Given a mega menu with nx-cols="3"
    Then the content should be in 3 columns

  # Tab Navigation
  Scenario: Tab panel navigation
    Given tabs with nx-tabs="true"
    And tab panels defined
    When the "Features" tab is clicked
    Then the features panel should display
    And other panels should be hidden

  Scenario: Keyboard tab navigation
    Given focused tab navigation
    When the user presses Arrow Right
    Then focus should move to next tab
    When the user presses Home
    Then focus should move to first tab

  Scenario: Vertical tabs
    Given tabs with nx-orientation="vertical"
    Then tabs should be displayed vertically
    And Arrow Up/Down should navigate

  # History API Integration
  Scenario: Update URL on tab change
    Given tabs with nx-update-url="true"
    When the "pricing" tab is clicked
    Then the URL should update to "#pricing"
    And history should be updated

  Scenario: Deep link to tab
    Given tabs with deep linking enabled
    And the URL is "page.html#features"
    When the page loads
    Then the "features" tab should be active

  # Navigation Guards
  Scenario: Confirm navigation
    Given a link with nx-confirm="Leave page?"
    When the link is clicked
    Then a confirmation dialog should appear
    When the user confirms
    Then navigation should proceed

  Scenario: Cancel navigation
    Given a link with confirmation
    When the user cancels the dialog
    Then navigation should not occur

  Scenario: Prevent navigation with function
    Given a link with nx-before-navigate="checkForm"
    And checkForm returns false
    When the link is clicked
    Then navigation should be prevented

  # Loading States
  Scenario: Show loading during navigation
    Given a link with nx-loading="true"
    When the link is clicked
    Then a loading indicator should appear
    And the link should be disabled

  # Accessibility
  Scenario: ARIA navigation roles
    Given a nav element with nx-nav="main"
    Then it should have role="navigation"
    And aria-label should be "Main navigation"

  Scenario: ARIA current attribute
    Given an active navigation link
    Then it should have aria-current="page"

  Scenario: Accessible dropdowns
    Given a dropdown menu
    Then the trigger should have aria-haspopup="true"
    And aria-expanded should reflect state
    When dropdown opens
    Then aria-expanded should be "true"

  Scenario: Skip navigation link
    Given a page with nx-skip-nav="true"
    Then a skip link should be added
    And it should be visually hidden by default
    When focused
    Then it should become visible

  Scenario: Keyboard trap in mega menu
    Given an open mega menu
    When the user tabs through items
    Then focus should stay within the menu
    When pressing Escape
    Then the menu should close and focus should return to trigger

  # Navigation Animations
  Scenario: Slide-in animation
    Given a mobile menu with nx-animation="slide"
    When the menu opens
    Then it should slide in from the left
    And the animation should be smooth

  Scenario: Fade animation
    Given a dropdown with nx-animation="fade"
    When the dropdown opens
    Then it should fade in
    And opacity should transition

  Scenario: Scale animation
    Given a mega menu with nx-animation="scale"
    When opening
    Then it should scale from 0.95 to 1.0

  # Sticky Navigation
  Scenario: Sticky header
    Given a nav with nx-sticky="true"
    When the user scrolls down
    Then the nav should stick to the top
    And it should have class "nx-sticky"

  Scenario: Sticky with offset
    Given a nav with nx-sticky="true" nx-sticky-offset="50"
    Then the nav should stick after scrolling 50px

  Scenario: Hide on scroll down
    Given a nav with nx-hide-on-scroll="true"
    When the user scrolls down
    Then the nav should slide up and hide
    When the user scrolls up
    Then the nav should slide down and show

  # Navigation Progress
  Scenario: Show page load progress
    Given a nav with nx-progress="true"
    When navigation starts
    Then a progress bar should appear at top
    And it should animate across
    When navigation completes
    Then the progress bar should disappear

  # Multi-level Navigation
  Scenario: Three-level navigation
    Given a nav with three levels
    When hovering level 1 item
    Then level 2 should appear
    When hovering level 2 item
    Then level 3 should appear

  Scenario: Collapse inactive branches
    Given a multi-level nav with nx-collapse="true"
    When a new branch is opened
    Then the previous branch should collapse

  # Navigation Search
  Scenario: Search navigation items
    Given a nav with nx-search="true"
    And a search input
    When the user types "pricing"
    Then only matching nav items should display
    And others should be hidden

  Scenario: Highlight search matches
    Given a nav search
    When the user types "pro"
    Then "pro" should be highlighted in "Products"

  # Pagination
  Scenario: Pagination controls
    Given an element with nx-pagination="true"
    And 100 total items with 10 per page
    Then 10 page buttons should display
    And "Next" and "Previous" buttons should display

  Scenario: Navigate to page
    Given pagination controls
    When the user clicks page "3"
    Then an "nx:page-change" event should be emitted
    And event.detail.page should be 3

  Scenario: Disabled pagination buttons
    Given pagination on page 1
    Then "Previous" button should be disabled
    When on last page
    Then "Next" button should be disabled

  Scenario: Ellipsis for many pages
    Given 50 pages
    Then ellipsis should show: "1 2 3 ... 48 49 50"

  # Events
  Scenario: Emit navigation event
    Given a nav link
    And an event listener for "nx:navigate"
    When the link is clicked
    Then an "nx:navigate" event should be emitted
    And event.detail should contain href

  Scenario: Emit dropdown event
    Given a dropdown
    And an event listener for "nx:dropdown-open"
    When the dropdown opens
    Then the event should be emitted

  Scenario: Emit tab change event
    Given tabs
    And an event listener for "nx:tab-change"
    When a tab is clicked
    Then the event should be emitted
    And event.detail should contain tab index

  # Performance
  Scenario: Efficient scroll spy
    Given 50 sections with scroll spy
    When scrolling
    Then active section detection should use IntersectionObserver
    And updates should be throttled to 60 FPS

  Scenario: Lazy load mega menu content
    Given a mega menu with nx-lazy="true"
    Then content should not load initially
    When the menu is first opened
    Then content should load

  # MutationObserver
  Scenario: Detect dynamically added nav items
    Given the navX module is initialized with observe=true
    When a new link is added to the nav
    Then the link should be automatically enhanced

  # Integration with bindX
  Scenario: Bind active state to data
    Given a nav with bx-model="navigation.activeTab"
    When a tab is clicked
    Then navigation.activeTab should update
    And the UI should reflect the change

  # URL Patterns
  Scenario: Match URL patterns
    Given a link with nx-pattern="/products/*"
    And the current URL is "/products/shoes"
    Then the link should be active

  Scenario: Exclude URL patterns
    Given a link with nx-exclude="/products/archive"
    And the current URL is "/products/archive"
    Then the link should not be active

  # Navigation Shortcuts
  Scenario: Keyboard shortcuts for navigation
    Given a link with nx-shortcut="ctrl+h"
    When the user presses Ctrl+H
    Then navigation to that link should occur

  # Navigation Analytics
  Scenario: Track navigation clicks
    Given a nav with nx-analytics="true"
    When a link is clicked
    Then an "nx:analytics" event should be emitted
    And event.detail should contain link data
