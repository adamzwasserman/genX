Feature: domx Integration
  As a genX developer
  I want genX to use domx for DOM observation
  So that we have a single, efficient MutationObserver

  Background:
    Given domx library is loaded
    And domx-bridge is available

  # ============================================================================
  # CORE BRIDGE FUNCTIONALITY
  # ============================================================================

  Scenario: domx-bridge provides subscribe function
    When I access window.domxBridge
    Then subscribe function should be available
    And unsubscribe function should be available

  Scenario: Module subscribes via domx-bridge
    Given fmtx needs mutation observation
    When fmtx subscribes with attributeFilter "fx-"
    Then fmtx should be registered as a subscriber
    And the subscription should return an unsubscribe function

  Scenario: Module receives relevant mutations
    Given fmtx is subscribed with attributeFilter "fx-"
    When an element with fx-format attribute is added to DOM
    Then fmtx callback should be invoked
    And the mutation should contain the added element

  Scenario: Module unsubscribes cleanly
    Given fmtx is subscribed with attributeFilter "fx-"
    When fmtx calls unsubscribe
    Then fmtx should no longer receive mutations
    And adding fx-format elements should not trigger fmtx callback

  # ============================================================================
  # ATTRIBUTE FILTERING
  # ============================================================================

  Scenario: Attribute filtering isolates module callbacks
    Given accx is subscribed with attributeFilter "ax-"
    And fmtx is subscribed with attributeFilter "fx-"
    When an element with fx-format attribute is added
    Then fmtx callback should be invoked
    And accx callback should NOT be invoked

  Scenario: Multiple attribute prefixes work correctly
    Given bindx is subscribed with attributeFilter "bx-"
    When an element with bx-model attribute is added
    Then bindx callback should be invoked
    When an element with bx-bind attribute is added
    Then bindx callback should be invoked again

  Scenario: childList mutations are forwarded
    Given fmtx is subscribed with childList enabled
    When a new element is appended to the DOM
    Then fmtx should receive the childList mutation

  # ============================================================================
  # SHARED OBSERVER VERIFICATION
  # ============================================================================

  Scenario: Single shared MutationObserver
    Given multiple modules are subscribed via domx-bridge
    When I count active MutationObservers on document.body
    Then there should be exactly one MutationObserver
    And all subscribed modules should receive their relevant mutations

  Scenario: Observer is lazily initialized
    Given domx-bridge is loaded but no subscriptions exist
    When I check if the observer is active
    Then no MutationObserver should exist yet
    When a module subscribes
    Then the MutationObserver should be created

  # ============================================================================
  # PERFORMANCE
  # ============================================================================

  Scenario: Callback batching via requestAnimationFrame
    Given fmtx is subscribed via domx-bridge
    When 10 mutations occur rapidly
    Then callbacks should be batched for performance
    And the callback should receive all mutations in batch

  Scenario: Unsubscribe removes callback reference
    Given fmtx is subscribed via domx-bridge
    When fmtx unsubscribes
    Then fmtx callback should be removed from internal registry
    And no memory leak should occur
