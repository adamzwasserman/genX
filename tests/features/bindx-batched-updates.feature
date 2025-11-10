Feature: Batched Updates
  As a system
  I want multiple property changes to batch within one frame
  So that DOM updates happen only once per frame (60 FPS)

  Scenario: Multiple synchronous changes batch together
    Given I have a reactive object with a=1, b=2, and c=3
    When I synchronously set a=10, b=20, c=30
    Then only ONE batch update should be scheduled
    And it should happen on next requestAnimationFrame

  Scenario: Batch size limited to 16ms window
    Given I have 100 reactive properties
    When I update all 100 properties synchronously
    Then updates should batch within single frame
    And total batch processing time should be less than 16ms

  Scenario: Manual flush for testing
    Given I have batched updates pending
    When I call flushBatchQueue()
    Then all pending updates execute immediately
    And RAF queue is cleared

  Scenario: Batch queue prevents duplicates
    Given I have a reactive object with count=0
    When I set count=5
    And I set count=10
    And I set count=15
    And before the frame completes
    Then only the final value (15) should be in the batch queue

  Scenario: Batch scheduling is idempotent
    Given I have a batch queue with pending updates
    When I schedule more updates
    Then only one RAF callback should be scheduled

  Scenario: Empty batch queue
    Given I have an empty batch queue
    When the RAF callback fires
    Then no updates should execute
    And no errors should occur

  Scenario: Batch queue clears after flush
    Given I have pending updates in the queue
    When the batch flushes
    Then the queue should be empty
    And the scheduled flag should be false
