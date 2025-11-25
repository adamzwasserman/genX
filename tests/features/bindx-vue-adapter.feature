Feature: bindX Vue Framework Adapter
  As a Vue developer
  I want to use bindX reactive state management in Vue 3 applications
  So that I can have lightweight reactivity that integrates with Vue's Composition API

  Background:
    Given Vue 3+ is installed
    And @genx/bindx-vue package is installed
    And the bindX core library is loaded

  # Composition API Integration
  Scenario: Use bindX reactive with Composition API
    Given a Vue 3 component using setup()
    When I create bindX reactive state
    Then the state should be reactive
    And Vue's template should display the state
    And changes should trigger re-renders

  Scenario: Import bindX functions in setup()
    Given a Vue component with setup()
    When I import { reactive, computed, watch } from '@genx/bindx-vue'
    Then all functions should be available
    And should work in Vue 3 context
    And TypeScript types should be correct

  Scenario: Use script setup syntax
    Given a Vue component with <script setup>
    When I use bindX reactive state
    Then state should be directly available in template
    And no explicit return needed
    And auto-imports should work

  # Reactivity Interop
  Scenario: Convert bindX state to Vue ref
    Given bindX reactive state
    When I convert it to Vue ref
    Then Vue should track the ref
    And changes should trigger Vue updates
    And template should reactively update

  Scenario: Convert Vue ref to bindX reactive
    Given Vue ref
    When I convert it to bindX reactive state
    Then bindX should track changes
    And watchers should work
    And computed properties should work

  Scenario: Use bindX alongside Vue reactivity
    Given component with both Vue refs and bindX state
    When either changes
    Then both should update correctly
    And no conflicts should occur
    And reactivity should work independently

  # Computed Properties
  Scenario: Use bindX computed with Vue template
    Given bindX state { count: 0 }
    And bindX computed doubleCount
    When template displays {{ doubleCount() }}
    Then it should show correct value
    When count changes
    Then doubleCount should update
    And template should re-render

  Scenario: Chain bindX computed properties in Vue
    Given multiple bindX computed depending on each other
    When used in Vue template
    Then all computed should update correctly
    And only necessary recomputations occur
    And Vue should track dependencies

  Scenario: Compare bindX computed vs Vue computed
    Given bindX computed and Vue computed
    When both derive from same state
    Then both should produce same results
    And both should be reactive
    And can be used interchangeably

  Scenario: Use bindX computed in Vue computed
    Given bindX reactive state
    When Vue computed references bindX computed
    Then Vue should track bindX dependencies
    And updates should propagate correctly

  # Watchers
  Scenario: Use bindX watch in Vue component
    Given Vue component with bindX state
    When I create bindX watcher in setup()
    Then watcher should execute on changes
    And receive new and old values
    And auto-cleanup on unmount

  Scenario: Compare bindX watch vs Vue watch
    Given same state watched by both
    When state changes
    Then both watchers should execute
    And both should receive correct values
    And both should cleanup properly

  Scenario: Immediate watcher in Vue component
    Given bindX state with initial value
    When I create watcher with { immediate: true }
    Then watcher executes immediately
    And receives initial value
    And continues watching changes

  Scenario: Deep watcher for nested objects
    Given bindX state with nested objects
    When I create watcher with { deep: true }
    Then watcher reacts to nested changes
    And all levels tracked correctly

  # Lifecycle Integration
  Scenario: Initialize bindX state in onMounted
    Given Vue component with onMounted lifecycle
    When onMounted executes
    And I initialize bindX state
    Then state should be properly initialized
    And watchers should be active

  Scenario: Cleanup bindX resources in onUnmounted
    Given Vue component with bindX state
    When onUnmounted lifecycle executes
    Then all bindX watchers should disconnect
    And no memory leaks should occur

  Scenario: Use bindX state during component lifecycle
    Given Vue component with bindX state
    When component mounts
    And state is initialized
    Then template should display initial state
    When state changes during lifetime
    Then template should reactively update

  # Template Integration
  Scenario: Use bindX state in template expressions
    Given bindX state { message: 'Hello' }
    When template uses {{ state.message }}
    Then it should display 'Hello'
    When state.message changes
    Then template should update

  Scenario: Use bindX state with v-model
    Given bindX state { inputValue: 'test' }
    When I use v-model="state.inputValue"
    Then input changes should update state
    And state changes should update input
    And two-way binding should work

  Scenario: Use bindX state with v-if
    Given bindX state { isVisible: true }
    When I use v-if="state.isVisible"
    Then content should be visible
    When state.isVisible changes to false
    Then content should be hidden

  Scenario: Use bindX state with v-for
    Given bindX state { items: [1, 2, 3] }
    When I use v-for="item in state.items"
    Then loop should iterate over items
    When items array changes
    Then loop should re-render

  Scenario: Use bindX computed in template directives
    Given bindX computed property
    When used in v-if, v-show, v-for
    Then directives should evaluate correctly
    And update reactively

  # Event Handlers
  Scenario: Modify bindX state in event handlers
    Given bindX state { count: 0 }
    When I use @click="state.count++"
    Then click should increment count
    And template should update
    And reactivity should work

  Scenario: Use bindX state in methods
    Given component with methods
    When methods modify bindX state
    Then state should update
    And template should react
    And watchers should trigger

  # Component Props
  Scenario: Pass bindX state as props
    Given parent with bindX state
    When passed to child component as prop
    Then child should receive the state
    And changes in child reflect in parent
    And reactivity flows both ways

  Scenario: Define props with bindX types
    Given child component with typed props
    When parent passes bindX state
    Then TypeScript should validate types
    And runtime validation should work

  Scenario: Emit events to update bindX state
    Given child component
    When child emits event
    And parent updates bindX state
    Then state should update
    And child should receive new prop

  # Provide/Inject
  Scenario: Provide bindX state to descendants
    Given parent with bindX state
    When I provide('store', bindXState)
    And descendant injects store
    Then descendant should access state
    And updates should propagate

  Scenario: Multiple components sharing injected state
    Given bindX state provided at root
    When multiple descendants inject
    Then all share same state
    And updates sync across components

  # Composables
  Scenario: Create reusable composable with bindX
    Given composable function using bindX
    When multiple components use the composable
    Then each should have independent state
    And can share state if designed that way
    And lifecycle should be managed correctly

  Scenario: Combine bindX with Vue composables
    Given component using both
    When used together in setup()
    Then both should work correctly
    And no conflicts should occur

  Scenario: Export bindX utilities as composables
    Given composable: useCounter(), useTodos()
    When components use these composables
    Then bindX features should work
    And Vue reactivity should integrate
    And TypeScript should infer types

  # TypeScript Support
  Scenario: Strongly-typed bindX state in Vue
    Given TypeScript interface for state
    When I create bindX state with type
    Then TypeScript should enforce safety
    And IDE autocomplete should work
    And type errors caught at compile time

  Scenario: Typed computed properties
    Given typed bindX state
    When I create computed properties
    Then return types should be inferred
    And TypeScript should validate usage

  Scenario: Typed watchers
    Given typed bindX state
    When I create watchers
    Then callback types should be correct
    And TypeScript should validate

  Scenario: Generic component with bindX
    Given generic component using bindX
    When component receives typed props
    Then TypeScript should infer all types
    And type safety should be maintained

  # Options API Compatibility
  Scenario: Use bindX in Options API component
    Given component using Options API
    When I use bindX in data()
    Then state should be reactive
    And this.state should work
    And template should update

  Scenario: Use bindX computed in Options API
    Given Options API component
    When bindX computed in computed: {}
    Then computed should work
    And integrate with Vue computed

  Scenario: Use bindX watch in Options API
    Given Options API component
    When bindX watcher in watch: {}
    Then watcher should execute
    And lifecycle should be managed

  # Single File Components (SFC)
  Scenario: Use bindX in SFC <script setup>
    Given .vue file with <script setup>
    When using bindX reactive state
    Then state should auto-expose to template
    And no explicit return needed
    And hot module reload should work

  Scenario: Use bindX in SFC with TypeScript
    Given .vue file with <script setup lang="ts">
    When using bindX with TypeScript
    Then all types should work
    And IDE support should be full

  Scenario: Use bindX in SFC <style scoped>
    Given component with scoped styles
    When bindX state controls classes
    Then styles should apply correctly
    And scoping should work

  # Refs and Reactive
  Scenario: Mix bindX reactive with Vue ref
    Given component with both
    When either changes
    Then both should update independently
    And can reference each other
    And no reactivity conflicts

  Scenario: Mix bindX reactive with Vue reactive
    Given component using both systems
    When state changes in either
    Then both should work correctly
    And can be used together safely

  Scenario: Convert between bindX and Vue reactivity
    Given utilities: toVueRef(), toVueReactive()
    When converting bindX to Vue
    Then conversion should maintain reactivity
    And changes should sync
    And both systems track correctly

  # Performance
  Scenario: Efficient updates with bindX in Vue
    Given component with 1000 reactive properties
    When properties update frequently
    Then updates should be efficient
    And UI should remain responsive

  Scenario: Compare bindX vs Vue reactivity performance
    Given same component implemented both ways
    When performing identical operations
    Then performance should be comparable
    And bindX should meet <0.5ms target

  Scenario: Lazy evaluation in Vue components
    Given bindX computed properties
    When not accessed in template
    Then should not execute
    And only accessed computed recalculate

  # Router Integration
  Scenario: Use bindX state with Vue Router
    Given Vue Router installed
    When using bindX across routes
    Then state should persist during navigation
    And can be reset on route change if desired

  Scenario: Store route-specific state in bindX
    Given route component with bindX state
    When navigating away and back
    Then state should handle correctly
    And cleanup should work

  Scenario: Watch route changes with bindX
    Given bindX watcher on route
    When route changes
    Then watcher should execute
    And can update bindX state

  # Teleport Integration
  Scenario: Use bindX state with Teleport
    Given component using <Teleport>
    When bindX state controls teleported content
    Then reactivity should work correctly
    And state should update teleported content

  # Suspense Integration
  Scenario: Use bindX with async components
    Given async component using bindX
    When wrapped in <Suspense>
    Then bindX should work after loading
    And state should initialize correctly

  Scenario: Load data into bindX state asynchronously
    Given component with async setup()
    When await fetchData()
    And set bindX state
    Then component should display data
    And reactivity should work after load

  # Transition Integration
  Scenario: Use bindX state with transitions
    Given component with <Transition>
    When bindX state controls visibility
    Then transitions should play correctly
    And state changes should trigger transitions

  Scenario: Animate based on bindX computed
    Given bindX computed controlling animation
    When computed value changes
    Then animation should trigger
    And reactivity should work smoothly

  # Directives
  Scenario: Use bindX state in custom directives
    Given custom directive using bindX
    When directive accesses bindX state
    Then directive should react to changes
    And can modify bindX state

  # Error Handling
  Scenario: Handle errors in bindX computed
    Given computed property that throws
    When accessed in template
    Then error should be caught
    And component should not crash
    And error should be logged

  Scenario: Handle errors in bindX watchers
    Given watcher callback that throws
    When watcher executes
    Then error should be caught
    And other watchers continue
    And component remains stable

  # DevTools Integration
  Scenario: Inspect bindX state in Vue DevTools
    Given component using bindX
    When opened in Vue DevTools
    Then bindX state should be visible
    And can be inspected
    And changes should reflect in DevTools

  # Testing
  Scenario: Test Vue components with bindX
    Given test suite using @vue/test-utils
    When testing component with bindX
    Then component should render
    And state updates should work in tests

  Scenario: Mock bindX state in tests
    Given component depending on bindX
    When providing mock state
    Then component should work with mock
    And can control state for testing

  Scenario: Test computed properties
    Given component with bindX computed
    When updating dependencies in test
    Then computed should update
    And can assert on computed values

  Scenario: Test watchers
    Given component with bindX watchers
    When triggering state changes in test
    Then watchers should execute
    And can assert on side effects

  # Vite Integration
  Scenario: Use bindX with Vite dev server
    Given Vite project with Vue 3
    When using bindX
    Then hot module reload should work
    And state should persist during HMR
    And imports should resolve correctly

  Scenario: Build bindX with Vite
    Given production build with Vite
    When building application
    Then bindX should be bundled correctly
    And tree-shaking should work
    And bundle size should be minimal

  # SSR with Nuxt 3
  Scenario: Use bindX in Nuxt 3 pages
    Given Nuxt 3 application
    When using bindX in pages/components
    Then server-side rendering should work
    And hydration should work correctly

  Scenario: Initialize bindX state in Nuxt
    Given Nuxt component with asyncData
    When fetching data
    And initializing bindX state
    Then SSR should render with data
    And client should hydrate correctly

  Scenario: Avoid memory leaks in SSR
    Given SSR environment
    When rendering components with bindX
    Then watchers should cleanup after render
    And no memory leaks between requests

  # Plugin System
  Scenario: Use bindX as Vue plugin
    Given app.use(bindXPlugin)
    When components access bindX
    Then bindX should be available globally
    And can be injected via provide/inject

  Scenario: Configure bindX plugin options
    Given app.use(bindXPlugin, { options })
    When components use bindX
    Then options should be applied
    And configuration should work correctly

  # Examples in Documentation
  Scenario: Counter example with Vue
    Given bindX-vue package README
    When following counter example
    Then should have working counter
    And increment/decrement should work

  Scenario: Todo list example with Composition API
    Given bindX-vue todo example
    When implementing the example
    Then should have full CRUD functionality
    And filtering should work reactively

  Scenario: Form validation example
    Given bindX-vue form example
    When implementing the example
    Then form validation should work
    And error messages should be reactive

  # Advanced Patterns
  Scenario: Create global store with bindX
    Given bindX state exported from module
    When multiple components import
    Then all share same state
    And updates sync across app

  Scenario: Module pattern with bindX
    Given bindX state in separate modules
    When importing and using modules
    Then state should be encapsulated
    And modules should be reusable

  Scenario: Factory pattern for bindX state
    Given factory function creating bindX state
    When called multiple times
    Then each call creates independent state
    And can be used for component instances

  # Comparison Scenarios
  Scenario: Migrate from Vue reactive to bindX
    Given component using Vue reactive
    When replacing with bindX reactive
    Then functionality should be equivalent
    And migration should be straightforward

  Scenario: Migrate from Vue computed to bindX computed
    Given component using Vue computed
    When replacing with bindX computed
    Then behavior should be same
    And can use () syntax or property access

  Scenario: Migrate from Vue watch to bindX watch
    Given component using Vue watch
    When replacing with bindX watch
    Then watching should work identically
    And options should map correctly

  # Edge Cases
  Scenario: Use bindX with multiple Vue instances
    Given multiple Vue apps on same page
    When each uses bindX
    Then bindX should work independently
    And no conflicts should occur

  Scenario: Use bindX in recursive components
    Given recursive component using bindX
    When rendering nested structure
    Then each instance should have correct state
    And reactivity should work at all levels

  Scenario: Use bindX with KeepAlive
    Given component wrapped in <KeepAlive>
    When component is cached/restored
    Then bindX state should persist correctly
    And watchers should pause/resume appropriately
