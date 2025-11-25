Feature: bindX Svelte Framework Adapter
  As a Svelte developer
  I want to use bindX reactive state management in Svelte applications
  So that I can have lightweight reactivity that integrates with Svelte's reactive system

  Background:
    Given Svelte 3+ is installed
    And @genx/bindx-svelte package is installed
    And the bindX core library is loaded

  # Store Compatibility
  Scenario: Create bindX store compatible with Svelte stores
    Given a bindX reactive state
    When I convert it to a Svelte-compatible store
    Then the store should have subscribe() method
    And the store should have set() method
    And the store should have update() method
    And Svelte components can subscribe to it

  Scenario: Subscribe to bindX store in Svelte component
    Given a bindX store with value { count: 0 }
    When a Svelte component subscribes to the store
    Then the component should receive the initial value
    When the store value changes
    Then the subscriber should be notified
    And the component should re-render

  Scenario: Auto-unsubscribe on component destroy
    Given a Svelte component subscribed to bindX store
    When the component is destroyed
    Then the subscription should automatically unsubscribe
    And no memory leaks should occur

  # Reactive Statement Integration
  Scenario: Use bindX state with $ reactive statements
    Given a bindX reactive state { count: 0 }
    When I use it in a $: reactive statement
    Then the statement should execute when count changes
    And Svelte's reactive system should track the dependency

  Scenario: Combine bindX computed with Svelte $ statements
    Given bindX computed property derived from reactive state
    When used in $: statement in Svelte component
    Then the $ statement should reactively update
    And updates should only trigger when dependencies change

  Scenario: Use $ auto-subscribe syntax with bindX stores
    Given a bindX store
    When I use $storeName syntax in Svelte template
    Then Svelte should automatically subscribe
    And automatically unsubscribe on destroy
    And the template should display current value

  # Lifecycle Integration
  Scenario: Initialize bindX state in onMount
    Given a Svelte component with onMount lifecycle
    When onMount executes
    And I initialize bindX reactive state
    Then the state should be properly initialized
    And subscriptions should be active

  Scenario: Cleanup bindX resources in onDestroy
    Given a Svelte component with bindX state
    When onDestroy lifecycle executes
    Then all bindX watchers should disconnect
    And all store subscriptions should unsubscribe
    And no memory leaks should remain

  Scenario: Update bindX state during component lifecycle
    Given a Svelte component with bindX state
    When the component mounts
    And state is initialized in onMount
    Then the template should display the initial state
    When state changes during component lifetime
    Then the template should reactively update

  # Two-Way Binding
  Scenario: Use bind:value with bindX reactive state
    Given bindX reactive state { inputValue: 'test' }
    When I use bind:value={state.inputValue} on input
    Then input changes should update state.inputValue
    And state.inputValue changes should update input
    And Svelte's two-way binding should work

  Scenario: Bind checkbox to bindX boolean property
    Given bindX state { agreed: false }
    When I use bind:checked={state.agreed}
    Then checkbox changes should update state.agreed
    And state.agreed changes should update checkbox

  Scenario: Bind select to bindX property
    Given bindX state { selected: 'a' }
    When I use bind:value={state.selected} on select
    Then select changes should update state
    And state changes should update select

  # Computed Properties
  Scenario: Use bindX computed in Svelte template
    Given bindX state { firstName: 'John', lastName: 'Doe' }
    And bindX computed fullName combining both names
    When the template displays {fullName()}
    Then it should show 'John Doe'
    When firstName changes to 'Jane'
    Then fullName() should update to 'Jane Doe'
    And template should re-render

  Scenario: Chain bindX computed properties
    Given multiple bindX computed properties depending on each other
    When used in Svelte template
    Then all computed should update correctly
    And only necessary recomputations should occur

  Scenario: Use computed in $ reactive statements
    Given bindX computed property
    When used in $: statement
    Then the statement should react to computed changes
    And dependency tracking should work correctly

  # Watchers
  Scenario: Watch bindX state in Svelte component
    Given bindX state { userId: 1 }
    When I create bindX watcher in onMount
    Then watcher should execute on state changes
    And callback should receive new and old values
    And watcher should auto-cleanup on destroy

  Scenario: Immediate watcher execution
    Given bindX state with initial value
    When I create watcher with { immediate: true }
    Then watcher should execute immediately
    And should receive initial value

  Scenario: Deep watcher for nested objects
    Given bindX state with nested objects
    When I create watcher with { deep: true }
    Then watcher should react to nested property changes
    And all levels should be tracked

  # Store Methods
  Scenario: Use store.set() to update value
    Given a bindX store with value { count: 0 }
    When I call store.set({ count: 5 })
    Then the store value should be 5
    And subscribers should be notified
    And Svelte components should re-render

  Scenario: Use store.update() with updater function
    Given a bindX store with value { count: 0 }
    When I call store.update(val => ({ count: val.count + 1 }))
    Then the count should be 1
    And subscribers should be notified

  Scenario: Read current store value
    Given a bindX store
    When I subscribe and get current value
    And use get(store) from svelte/store
    Then I should receive the current value

  # TypeScript Support
  Scenario: Strongly-typed bindX stores
    Given TypeScript interface for state
    When I create bindX store with type: createStore<State>(...)
    Then TypeScript should enforce type safety
    And IDE autocomplete should work
    And type errors should be caught at compile time

  Scenario: Typed computed properties in Svelte
    Given typed bindX state
    When I create computed properties
    Then return types should be inferred
    And TypeScript should validate usage

  Scenario: Typed store subscriptions
    Given typed bindX store
    When I subscribe to the store
    Then subscription callback should have correct types
    And TypeScript should validate the callback

  # Reactive Statements ($:)
  Scenario: Update derived value with $ statement
    Given bindX state { count: 0 }
    When I write $: doubled = state.count * 2
    Then doubled should update when count changes
    And Svelte should track the dependency

  Scenario: Side effect with $ statement
    Given bindX state { userId: 1 }
    When I write $: fetchUser(state.userId)
    Then fetchUser should execute when userId changes
    And side effect should run reactively

  Scenario: Multiple dependencies in $ statement
    Given bindX state { a: 1, b: 2 }
    When I write $: sum = state.a + state.b
    Then sum should update when either a or b changes
    And Svelte should track both dependencies

  # Component Props
  Scenario: Pass bindX state as component props
    Given parent component with bindX state
    When I pass state to child component as prop
    Then child should receive the state
    And changes in child should reflect in parent
    And reactivity should flow both ways

  Scenario: Export bindX state as component prop
    Given child component that exports bindX state
    When parent binds to the exported prop
    Then parent should receive updates from child
    And two-way binding should work

  # Each Blocks
  Scenario: Use bindX array in #each block
    Given bindX state { items: [1, 2, 3] }
    When I use {#each state.items as item}
    Then each should iterate over items
    When items array changes
    Then each block should re-render
    And keyed updates should work correctly

  Scenario: Reactively add items to array
    Given bindX state { todos: [] }
    When I push new todo to state.todos
    Then #each block should update
    And new item should appear in list
    And Svelte should efficiently update DOM

  Scenario: Remove items from bindX array
    Given bindX array with items
    When I remove item using splice()
    Then #each block should update
    And removed item should disappear
    And remaining items should remain stable

  # Conditional Rendering
  Scenario: Use bindX state in #if blocks
    Given bindX state { isVisible: true }
    When I use {#if state.isVisible}
    Then content should be visible
    When state.isVisible changes to false
    Then content should be hidden
    And DOM should update reactively

  Scenario: Use bindX computed in #if
    Given bindX computed property
    When used in {#if computed()}
    Then condition should evaluate correctly
    And block should show/hide reactively

  # Await Blocks
  Scenario: Use bindX reactive promises with #await
    Given bindX state { promise: fetchData() }
    When I use {#await state.promise}
    Then Svelte should handle loading state
    And handle resolved value
    And handle error state
    And updates should work reactively

  # Context API
  Scenario: Share bindX state via Svelte context
    Given parent component with bindX state
    When I setContext('store', bindXStore)
    And child component uses getContext('store')
    Then child should access the store
    And updates should propagate to all consumers

  Scenario: Multiple components sharing context store
    Given bindX store in context
    When multiple components getContext
    Then all components should share same state
    And updates should sync across components

  # Performance
  Scenario: Efficient updates with bindX stores
    Given component with 1000 bindX reactive properties
    When properties update frequently
    Then updates should be efficient
    And UI should remain responsive (60 FPS)

  Scenario: Batched updates in Svelte
    Given multiple bindX property changes
    When changes occur in same tick
    Then only one Svelte update should occur
    And DOM should update once

  Scenario: Lazy evaluation of computed properties
    Given bindX computed properties
    When reactive state changes
    Then only accessed computed should recalculate
    And unused computed should not execute

  # Error Handling
  Scenario: Handle errors in computed properties
    Given computed property that throws error
    When computed is accessed
    Then error should be caught
    And component should not crash
    And error should be logged

  Scenario: Handle errors in watchers
    Given watcher callback that throws error
    When watcher executes
    Then error should be caught
    And other watchers should continue
    And component should remain stable

  # Testing
  Scenario: Test Svelte components with bindX
    Given test suite for component using bindX
    When I create component in test
    And initialize bindX state
    Then component should render
    And state updates should work in tests

  Scenario: Mock bindX stores in tests
    Given component that depends on bindX store
    When I provide mock store in test
    Then component should work with mock
    And I can control state for testing

  Scenario: Test reactive statements
    Given component with bindX and $ statements
    When I update state in test
    Then $ statements should execute
    And I can assert on derived values

  # SvelteKit Integration
  Scenario: Use bindX stores in SvelteKit pages
    Given SvelteKit page component
    When I use bindX stores
    Then stores should work in pages
    And SSR should not break
    And hydration should work correctly

  Scenario: Share bindX state across SvelteKit routes
    Given bindX store in root layout
    When navigating between routes
    Then state should persist across navigation
    And all routes should access same store

  Scenario: Load data into bindX state in load function
    Given SvelteKit page with load function
    When load function returns data
    And data is set in bindX store
    Then page should display the data
    And reactivity should work after load

  # SSR (Server-Side Rendering)
  Scenario: Render with bindX state on server
    Given SvelteKit with SSR enabled
    When component with bindX state renders on server
    Then state should initialize on server
    And HTML should include initial state
    And hydration should restore state on client

  Scenario: Avoid memory leaks in SSR
    Given SSR environment
    When components with bindX render
    Then watchers should clean up after render
    And no memory should leak between requests

  # Store Derivations
  Scenario: Derive Svelte store from bindX store
    Given bindX store
    When I create derived store using Svelte's derived()
    Then derived store should update when source changes
    And derivation should work correctly

  Scenario: Combine multiple bindX stores with derived
    Given multiple bindX stores
    When I use derived([store1, store2], ...)
    Then derived should combine values
    And update when any source changes

  # Animations and Transitions
  Scenario: Use bindX state with Svelte transitions
    Given component with Svelte transitions
    When bindX state controls visibility
    Then transitions should play correctly
    And state changes should trigger transitions

  Scenario: Animate based on bindX computed
    Given bindX computed property
    When computed value changes
    And triggers Svelte animation
    Then animation should play smoothly
    And reactivity should work with animations

  # Actions
  Scenario: Use bindX state in Svelte actions
    Given Svelte action that uses bindX state
    When action is applied to element
    Then action should access state
    And react to state changes
    And cleanup should work on destroy

  # Slots
  Scenario: Pass bindX state through slots
    Given parent with bindX state
    When passed to child via slot props
    Then slot content should access state
    And reactivity should work through slots

  # Examples in Documentation
  Scenario: Counter example with Svelte
    Given the bindX-svelte package README
    When I follow the counter example
    Then I should have working counter component
    And increment/decrement should work
    And Svelte reactivity should work

  Scenario: Todo list example
    Given bindX-svelte todo example
    When I implement the example
    Then I should have full CRUD functionality
    And filtering should work reactively
    And completed count should update automatically

  Scenario: Form validation example
    Given bindX-svelte form example
    When I implement the example
    Then form validation should work
    And error messages should be reactive
    And submit should be disabled when invalid
