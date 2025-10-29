Feature: dragX - Declarative Drag-and-Drop
  As a web developer
  I want declarative drag-and-drop through HTML attributes
  So that I can create intuitive UIs without complex JavaScript

  Background:
    Given the dragX module is loaded
    And the DOM is ready

  # Basic Drag-and-Drop
  Scenario: Basic draggable element
    Given an element with dx-draggable="card"
    When the user starts dragging the element
    Then the element should have visual drag feedback
    And the cursor should change to indicate dragging

  Scenario: Basic drop zone
    Given a div with dx-drop-zone="board"
    And an element with dx-draggable="card"
    When the user drags the card over the board
    Then the drop zone should highlight
    And a drop indicator should be visible

  Scenario: Complete drag-and-drop operation
    Given an element with dx-draggable="card"
    And a div with dx-drop-zone="board" dx-accepts="card"
    When the user drags the card to the board
    And the user releases the card
    Then a "dx:drop" event should be emitted
    And the card should be moved to the board

  # Drop Zone Acceptance Rules
  Scenario: Drop zone accepts specific type
    Given an element with dx-draggable="card"
    And a div with dx-drop-zone="board" dx-accepts="card"
    When the user drags the card to the board
    Then the drop should be allowed

  Scenario: Drop zone rejects wrong type
    Given an element with dx-draggable="image"
    And a div with dx-drop-zone="board" dx-accepts="card"
    When the user drags the image to the board
    Then the drop should be rejected
    And the drop zone should not highlight

  Scenario: Drop zone accepts multiple types
    Given an element with dx-draggable="card"
    And a div with dx-drop-zone="board" dx-accepts="card,image,file"
    When the user drags the card to the board
    Then the drop should be allowed

  # Multi-Selection
  Scenario: Select multiple items with Ctrl+Click
    Given 3 elements with dx-draggable="card" and dx-multi-select="true"
    When the user Ctrl+clicks the first card
    And the user Ctrl+clicks the second card
    Then both cards should be selected
    And both should have selected visual state

  Scenario: Drag multiple selected items
    Given 3 cards with 2 currently selected
    When the user drags one of the selected cards
    Then all selected cards should move together
    And a composite ghost image should be shown

  Scenario: Deselect with Ctrl+Click
    Given a card that is currently selected
    When the user Ctrl+clicks the card again
    Then the card should be deselected

  # Touch Support
  Scenario: Touch drag on mobile
    Given an element with dx-draggable="card"
    When the user touches and holds the element
    Then haptic feedback should trigger
    And the drag should start after 300ms
    When the user moves their finger
    Then the element should follow the touch

  Scenario: Touch drop on mobile
    Given a draggable card being dragged via touch
    And a drop zone that accepts cards
    When the user releases their finger over the drop zone
    Then the drop should complete successfully

  # Keyboard Navigation
  Scenario: Keyboard focus on draggable
    Given an element with dx-draggable="card"
    When the user tabs to the element
    Then the element should receive keyboard focus
    And a focus indicator should be visible

  Scenario: Keyboard drag with Space
    Given a focused draggable element
    When the user presses Space
    Then drag mode should activate
    And available drop zones should highlight

  Scenario: Keyboard navigation during drag
    Given an element in keyboard drag mode
    When the user presses Arrow Down
    Then focus should move to the next drop zone
    When the user presses Enter
    Then the drop should complete

  Scenario: Keyboard cancel drag with Escape
    Given an element in keyboard drag mode
    When the user presses Escape
    Then drag mode should cancel
    And the element should return to original position

  # Visual Feedback
  Scenario: Drag ghost image
    Given an element with dx-draggable="card"
    When the user starts dragging
    Then a ghost image should appear
    And it should follow the cursor
    And it should have reduced opacity

  Scenario: Custom drag ghost
    Given an element with dx-draggable="card" dx-ghost="custom"
    And a custom ghost template
    When the user starts dragging
    Then the custom ghost should be used

  Scenario: Drop zone hover state
    Given a drop zone that accepts cards
    When a card is dragged over it
    Then the drop zone should have class "dx-drag-over"
    When the card leaves the drop zone
    Then the class should be removed

  Scenario: Invalid drop indicator
    Given a drop zone that does not accept the dragged type
    When the dragged element hovers over it
    Then a "not allowed" cursor should display
    And the drop zone should not highlight

  # Drag States
  Scenario: Element drag states
    Given a draggable element
    When drag starts
    Then the element should have class "dx-dragging"
    When drag ends
    Then the class should be removed

  Scenario: Clone drag behavior
    Given an element with dx-draggable="card" dx-mode="clone"
    When the user drags the element
    Then the original should remain in place
    And a copy should be dragged

  Scenario: Move drag behavior
    Given an element with dx-draggable="card" dx-mode="move"
    When the user drags the element
    Then the original should be hidden
    When dropped
    Then the original should be moved to new location

  # Drop Effects
  Scenario: Drop effect copy
    Given a draggable with dx-effect="copy"
    When dropped on a zone
    Then the element should be copied
    And both original and copy should exist

  Scenario: Drop effect move
    Given a draggable with dx-effect="move"
    When dropped on a zone
    Then the element should be moved
    And only one instance should exist

  Scenario: Drop effect link
    Given a draggable with dx-effect="link"
    When dropped on a zone
    Then a reference should be created
    And original should remain unchanged

  # Spatial Indexing Performance
  Scenario: Fast drop zone detection with many zones
    Given 100 drop zones on the page
    When the user drags an element
    Then drop zone detection should use spatial indexing
    And hover detection should complete in less than 1ms

  Scenario: Quad-tree spatial partitioning
    Given drop zones scattered across the page
    When the dragX module initializes
    Then a quad-tree index should be built
    And zones should be partitioned by location

  # Drag Handles
  Scenario: Drag only by handle
    Given a card with dx-draggable="card" dx-handle=".drag-handle"
    And a .drag-handle element inside the card
    When the user drags the handle
    Then the entire card should drag
    When the user clicks other areas of the card
    Then no drag should occur

  Scenario: Multiple handles
    Given a card with dx-draggable="card" dx-handle=".handle1,.handle2"
    When the user drags either handle
    Then the card should drag

  # Drag Constraints
  Scenario: Constrain drag to axis
    Given an element with dx-draggable="item" dx-axis="horizontal"
    When the user drags the element
    Then it should only move horizontally
    And vertical movement should be ignored

  Scenario: Constrain drag to container
    Given an element with dx-draggable="item" dx-contain="parent"
    When the user drags the element
    Then it should not leave the parent boundaries

  Scenario: Constrain drag to grid
    Given an element with dx-draggable="item" dx-grid="20"
    When the user drags the element
    Then it should snap to 20px grid increments

  # Drop Zone Sorting
  Scenario: Auto-sort items in drop zone
    Given a drop zone with dx-drop-zone="list" dx-sort="true"
    And 3 items already in the zone
    When a new item is dropped
    Then items should automatically reorder
    And positions should be calculated based on drop coordinates

  Scenario: Sort with placeholder
    Given a sortable drop zone
    When an item is being dragged over it
    Then a placeholder should show the drop position
    And other items should shift to make space

  # Drag Data
  Scenario: Transfer data with drag
    Given an element with dx-draggable="card" dx-data='{"id":123}'
    When the element is dropped
    Then the drop event should contain the data
    And the data should be accessible as event.detail.data

  Scenario: Transfer multiple data formats
    Given an element with multiple data attributes
    When dropped
    Then all data formats should be available
    And consumers can choose appropriate format

  # Revert on Invalid Drop
  Scenario: Animate back on invalid drop
    Given a draggable element
    When dragged outside any drop zone
    And released
    Then the element should animate back to origin
    And the animation should take 300ms

  Scenario: Snap back on rejected drop
    Given a draggable element
    When dropped on a zone that rejects it
    Then the element should snap back to origin

  # Events
  Scenario: Emit drag start event
    Given a draggable element
    And an event listener for "dx:dragstart"
    When drag begins
    Then a "dx:dragstart" event should be emitted
    And event.detail should contain element info

  Scenario: Emit drag end event
    Given a draggable element
    And an event listener for "dx:dragend"
    When drag completes
    Then a "dx:dragend" event should be emitted

  Scenario: Emit drop event with data
    Given a drop zone
    And an event listener for "dx:drop"
    When an element is dropped
    Then a "dx:drop" event should be emitted
    And event.detail should contain dragged element
    And event.detail should contain drop zone
    And event.detail should contain coordinates

  Scenario: Cancellable drag start
    Given a draggable element
    And an event listener that calls preventDefault()
    When drag starts
    Then the drag should be cancelled

  # Accessibility
  Scenario: ARIA attributes for draggable
    Given an element with dx-draggable="card"
    When the module initializes
    Then the element should have aria-grabbed="false"
    When drag starts
    Then aria-grabbed should change to "true"

  Scenario: ARIA live region announcements
    Given a screen reader user
    When drag starts
    Then an announcement should be made: "Grabbed card"
    When dropped successfully
    Then an announcement should be made: "Dropped card on board"

  Scenario: Keyboard instructions
    Given a focused draggable element
    Then aria-describedby should reference instructions
    And instructions should explain keyboard controls

  # Performance
  Scenario: Maintain 60 FPS during drag
    Given a draggable element
    When the user drags continuously
    Then frame rate should stay above 60 FPS
    And drag updates should complete in less than 16ms

  Scenario: Handle 1000 draggable items
    Given 1000 draggable elements
    When the page loads
    Then initialization should complete in less than 500ms
    And memory usage should be reasonable

  Scenario: Efficient drop zone queries
    Given 500 drop zones
    When checking drop validity during drag
    Then spatial index should be used
    And query should complete in less than 1ms

  # MutationObserver
  Scenario: Detect dynamically added draggables
    Given the dragX module is initialized with observe=true
    When a new element with dx-draggable="card" is added
    Then the element should become draggable automatically

  Scenario: Cleanup removed draggables
    Given a draggable element
    When the element is removed from DOM
    Then event listeners should be cleaned up
    And memory should be released

  # Error Handling
  Scenario: Invalid draggable type
    Given an element with dx-draggable=""
    When the module initializes
    Then a validation error should be logged
    And the element should not become draggable

  Scenario: Missing drop zone acceptance
    Given a drop zone without dx-accepts
    When the module initializes
    Then it should accept all types by default

  # Integration with bindX
  Scenario: Update reactive data on drop
    Given a draggable with bx-model="item.position"
    When the item is dropped at coordinates (100, 200)
    Then the reactive data should update
    And item.position should be {x:100, y:200}

  # Nested Drop Zones
  Scenario: Handle nested drop zones
    Given a drop zone "outer"
    And a nested drop zone "inner" inside outer
    When an item is dragged over inner
    Then only inner should highlight
    And outer should not respond

  Scenario: Bubble drop to parent zone
    Given nested drop zones
    And inner zone rejects the dragged type
    When dropped on inner
    Then the drop should bubble to outer zone
    And outer should handle the drop

  # Touch Scrolling
  Scenario: Distinguish drag from scroll
    Given a draggable in a scrollable container
    When the user touches and moves slowly
    Then the container should scroll
    And no drag should start

  Scenario: Auto-scroll during drag
    Given a long scrollable page
    When dragging near the edge
    Then the page should auto-scroll
    And scroll speed should increase near edges

  # Visual Polish
  Scenario: Smooth drag animation
    Given a draggable element
    When dragged
    Then movement should be smooth
    And no jank should occur

  Scenario: Drop animation
    Given a draggable element
    When dropped successfully
    Then it should animate to final position
    And use easing function

  Scenario: Failed drop animation
    Given a draggable element
    When dropped on invalid target
    Then it should animate back to origin
    And use bounce easing
