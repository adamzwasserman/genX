Feature: bindX Angular Framework Adapter
  As an Angular developer
  I want to use bindX reactive state management in Angular applications
  So that I can have lightweight reactivity without complex state management libraries

  Background:
    Given Angular 12+ is installed
    And @genx/bindx-angular package is installed
    And the bindX core library is loaded

  # Service Integration
  Scenario: Import BindXService in Angular module
    Given an Angular module
    When I import BindXService from '@genx/bindx-angular'
    And I provide BindXService in the module
    Then the service should be available for dependency injection

  Scenario: Inject BindXService in component
    Given a component with BindXService injected
    When the component initializes
    Then the service should be available
    And the service should have reactive() method
    And the service should have computed() method
    And the service should have watch() method

  # Reactive State Management
  Scenario: Create reactive state in Angular component
    Given a component with BindXService
    When I create reactive state with bindXService.reactive({ count: 0 })
    Then the state should be reactive
    And changes should trigger Angular change detection
    And the component view should update

  Scenario: Use reactive state in template
    Given a component with reactive state { message: 'Hello' }
    When the template binds to state.message
    Then the template should display 'Hello'
    When state.message changes to 'World'
    Then the template should update to 'World'
    And Angular change detection should run

  # Zone.js Compatibility
  Scenario: Reactive updates trigger Zone.js change detection
    Given a component with reactive state
    When a reactive property changes outside NgZone
    Then Zone.js should detect the change
    And Angular change detection should run automatically
    And the view should update

  Scenario: Manual change detection triggering
    Given a component running outside NgZone
    When reactive state changes
    Then the adapter should run change detection manually
    And the view should update correctly

  Scenario: OnPush change detection strategy
    Given a component with OnPush change detection
    And reactive state managed by BindXService
    When reactive properties change
    Then change detection should trigger
    And the view should update

  # Computed Properties
  Scenario: Create computed properties with BindXService
    Given a component with reactive state { firstName: 'John', lastName: 'Doe' }
    When I create computed fullName = computed(() => `${state.firstName} ${state.lastName}`)
    Then fullName() should return 'John Doe'
    When state.firstName changes to 'Jane'
    Then fullName() should return 'Jane Doe'
    And the template should update

  Scenario: Use computed properties in templates
    Given a component with computed property
    When the template binds to the computed value
    Then the template should display the computed result
    And updates should trigger change detection

  # Watchers
  Scenario: Watch reactive properties in Angular
    Given a component with reactive state { count: 0 }
    When I create a watcher: watch(() => state.count, (val) => console.log(val))
    Then the watcher should execute on state.count changes
    And the callback should receive new and old values
    And the watcher should respect Angular zones

  Scenario: Cleanup watchers on component destroy
    Given a component with active watchers
    When the component is destroyed (ngOnDestroy)
    Then all watchers should be disconnected
    And no memory leaks should occur

  Scenario: Immediate watcher execution
    Given a component with reactive state { value: 10 }
    When I create watcher with { immediate: true }
    Then the watcher callback should execute immediately
    And it should receive the current value

  # RxJS Interoperability
  Scenario: Convert reactive state to RxJS Observable
    Given reactive state { count: 0 }
    When I convert it to Observable using bindXService.toObservable(state.count)
    Then it should return an RxJS Observable
    And the Observable should emit when state changes
    And I can use RxJS operators (map, filter, debounce)

  Scenario: Subscribe to reactive changes with RxJS
    Given reactive state { message: 'Hello' }
    When I subscribe to toObservable(state.message)
    Then the subscription should receive 'Hello'
    When state.message changes to 'World'
    Then the subscription should receive 'World'

  Scenario: Unsubscribe from Observable on destroy
    Given a component with Observable subscriptions
    When the component is destroyed
    Then all subscriptions should be unsubscribed automatically
    And no memory leaks should occur

  Scenario: Use async pipe with bindX Observables
    Given reactive state as Observable
    When I use the async pipe in template: {{ observable$ | async }}
    Then Angular should handle subscription/unsubscription
    And the template should display reactive values

  # Lifecycle Integration
  Scenario: Initialize reactive state in ngOnInit
    Given a component with ngOnInit lifecycle hook
    When ngOnInit executes
    And I initialize reactive state
    Then the state should be properly initialized
    And watchers should be active

  Scenario: Cleanup in ngOnDestroy
    Given a component with reactive state and watchers
    When ngOnDestroy executes
    Then all watchers should disconnect
    And all subscriptions should unsubscribe
    And reactive state should be cleaned up
    And no memory leaks should remain

  Scenario: Handle state changes during ngOnChanges
    Given a component with @Input properties
    When ngOnChanges receives new input values
    And I update reactive state based on inputs
    Then the reactive state should update
    And computed properties should recalculate

  # Form Integration
  Scenario: Bind reactive state to Angular reactive forms
    Given a component with FormGroup
    And reactive state { username: '', email: '' }
    When I sync FormGroup values with reactive state
    Then form value changes should update reactive state
    And reactive state changes should update form

  Scenario: Validate forms with reactive state
    Given a reactive form with validators
    And reactive state tracking form data
    When form validation state changes
    Then reactive state should reflect validation status
    And computed properties can derive error messages

  # Two-Way Binding
  Scenario: Two-way binding with [(ngModel)]
    Given reactive state { value: 'test' }
    When I use [(ngModel)] with reactive property
    Then input changes should update reactive state
    And reactive state changes should update input
    And Angular change detection should work correctly

  Scenario: Two-way binding with reactive forms
    Given FormControl bound to reactive state
    When FormControl value changes
    Then reactive state should update
    When reactive state changes programmatically
    Then FormControl should update

  # TypeScript Support
  Scenario: Strongly-typed reactive state
    Given TypeScript interfaces for state
    When I create reactive state with type: reactive<UserState>({ ... })
    Then TypeScript should enforce type safety
    And IDE autocomplete should work
    And type errors should be caught at compile time

  Scenario: Typed computed properties
    Given typed reactive state
    When I create computed properties
    Then computed return types should be inferred
    And type checking should work correctly

  Scenario: Typed watchers
    Given typed reactive state
    When I create watchers
    Then callback parameter types should be inferred
    And TypeScript should validate the callback

  # Dependency Injection
  Scenario: Provide BindXService at root level
    Given Angular application root module
    When I provide BindXService at root
    Then a single instance should be shared across app
    And all components should access the same instance

  Scenario: Provide BindXService at component level
    Given a component with local BindXService provider
    When the component uses BindXService
    Then the component should have its own instance
    And state should be isolated from other components

  Scenario: Inject BindXService in Angular service
    Given a custom Angular service
    When I inject BindXService into the custom service
    Then the service should access bindX functionality
    And reactive state can be managed in services

  # Performance
  Scenario: Efficient change detection with reactive state
    Given a component with 1000 reactive properties
    When properties update frequently
    Then change detection should remain efficient
    And UI should stay responsive (60 FPS)

  Scenario: Batch updates within NgZone
    Given multiple reactive property changes
    When changes occur in the same tick
    Then only one change detection cycle should run
    And performance should be optimized

  Scenario: Lazy computed property evaluation
    Given computed properties depending on reactive state
    When reactive state changes
    Then computed properties should only recalculate when accessed
    And unused computed properties should not execute

  # Error Handling
  Scenario: Handle errors in computed properties
    Given a computed property that throws an error
    When the computed property is accessed
    Then the error should be caught
    And Angular should not crash
    And error should be logged

  Scenario: Handle errors in watchers
    Given a watcher callback that throws an error
    When the watcher executes
    Then the error should be caught
    And other watchers should continue working
    And Angular change detection should continue

  # Testing Support
  Scenario: Test components with BindXService
    Given a test suite for a component using BindXService
    When I create component in TestBed
    And I provide BindXService
    Then the component should initialize
    And reactive state should work in tests

  Scenario: Mock BindXService in tests
    Given a component that depends on BindXService
    When I provide a mock BindXService
    Then tests should run without real BindXService
    And I can control reactive behavior for testing

  Scenario: Test reactive state changes
    Given a component with reactive state
    When I change reactive state in tests
    Then change detection should run
    And I can assert on template updates
    And fixture.detectChanges() should work correctly

  # Standalone Components (Angular 14+)
  Scenario: Use BindXService with standalone components
    Given a standalone component (Angular 14+)
    When I import BindXService in component imports
    Then the service should be available
    And reactive state should work without module

  Scenario: Provide BindXService in standalone component
    Given a standalone component
    When I provide BindXService in component providers
    Then the component should have isolated instance
    And nested components can inject it

  # SSR (Server-Side Rendering)
  Scenario: Reactive state in Angular Universal (SSR)
    Given an Angular Universal application
    When components use BindXService during SSR
    Then reactive state should initialize on server
    And state should serialize to client
    And hydration should work correctly

  Scenario: Avoid memory leaks in SSR
    Given SSR environment
    When components are rendered on server
    Then watchers should be cleaned up after render
    And no memory should leak between requests

  # Advanced Integration
  Scenario: Integrate with NgRx store
    Given an app using NgRx
    When I sync bindX reactive state with NgRx store
    Then bindX state can derive from store selectors
    And bindX can dispatch actions on changes

  Scenario: Integrate with Angular Router
    Given reactive state in routed components
    When navigating between routes
    Then state should persist if needed
    And state should reset on navigation if configured
    And memory should be cleaned up properly

  Scenario: Share reactive state across components
    Given multiple components needing shared state
    When I create reactive state in a service
    And inject the service in multiple components
    Then all components should access the same state
    And updates should propagate to all components

  # Migration from Angular Services
  Scenario: Migrate from BehaviorSubject to reactive state
    Given a service using BehaviorSubject
    When I replace BehaviorSubject with reactive state
    Then the API should be simpler
    And less boilerplate code should be needed
    And performance should be better

  Scenario: Use reactive state instead of ComponentStore
    Given a component using NgRx ComponentStore
    When I replace ComponentStore with BindXService
    Then state management should be simpler
    And reactivity should work the same
    And bundle size should be smaller

  # Examples in Documentation
  Scenario: Counter example with Angular
    Given the bindX-angular package README
    When I follow the counter example
    Then I should have a working counter component
    And increment/decrement should work
    And change detection should work properly

  Scenario: Todo list example
    Given the bindX-angular examples
    When I implement the todo list example
    Then I should have full CRUD functionality
    And reactive filtering should work
    And completed count should update automatically

  Scenario: Form validation example
    Given the bindX-angular form example
    When I implement the example
    Then form validation should work
    And error messages should be reactive
    And submit should be disabled when invalid
