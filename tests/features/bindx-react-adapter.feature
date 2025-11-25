Feature: bindX React Framework Adapter
  As a React developer
  I want to use bindX reactive state management in React applications
  So that I can have lightweight reactivity that integrates with React hooks

  Background:
    Given React 17+ is installed
    And @genx/bindx-react package is installed
    And the bindX core library is loaded

  # Core Hook (useBindX)
  Scenario: Use useBindX hook for reactive state
    Given a React function component
    When I call useBindX({ count: 0 })
    Then the state should be reactive
    And component should re-render on state changes
    And TypeScript types should be correct

  Scenario: Multiple state updates in single render
    Given component with useBindX state
    When multiple properties change in same function
    Then only one re-render should occur
    And all changes should be batched

  Scenario: State persists across re-renders
    Given component with useBindX state
    When component re-renders for other reasons
    Then state should maintain identity
    And state should not reinitialize

  # Computed Properties
  Scenario: Use computed properties in React
    Given useBindX state { count: 0 }
    And computed doubleCount
    When rendering {{ doubleCount() }}
    Then it should show correct value
    When count changes
    Then doubleCount should update
    And component should re-render

  Scenario: Compute from multiple state properties
    Given useBindX state { firstName: 'John', lastName: 'Doe' }
    And computed fullName
    When either name changes
    Then fullName should update
    And component should re-render once

  Scenario: Chain computed properties
    Given multiple computed depending on each other
    When source state changes
    Then all computed should update correctly
    And only necessary recomputations occur

  # Watchers
  Scenario: Use watchers in React components
    Given useBindX state { userId: 1 }
    When I create watcher in useEffect
    Then watcher should execute on changes
    And cleanup should happen on unmount

  Scenario: Immediate watcher execution
    Given useBindX state with initial value
    When I create watcher with { immediate: true }
    Then watcher executes immediately
    And receives initial value

  Scenario: Deep watcher for nested objects
    Given useBindX state with nested objects
    When I create watcher with { deep: true }
    Then watcher reacts to nested changes
    And all levels tracked correctly

  # Lifecycle Integration
  Scenario: Initialize state in component mount
    Given React component with useBindX
    When component mounts
    Then state should be initialized
    And watchers should be active

  Scenario: Cleanup watchers on unmount
    Given component with useBindX watchers
    When component unmounts
    Then all watchers should disconnect
    And no memory leaks should occur

  Scenario: Update state during component lifecycle
    Given component with useBindX state
    When state changes during lifetime
    Then component should re-render
    And UI should update correctly

  # React.StrictMode Compatibility
  Scenario: Work correctly in StrictMode
    Given app wrapped in React.StrictMode
    When component uses useBindX
    Then effects should handle double-invocation
    And cleanup should work correctly
    And no memory leaks should occur

  Scenario: State initialization in StrictMode
    Given StrictMode enabled
    When useBindX initializes state
    Then state should not duplicate
    And only one instance should exist

  # Hooks Integration
  Scenario: Use useBindX with useState
    Given component with both hooks
    When either state changes
    Then both should work independently
    And re-renders should be correct

  Scenario: Use useBindX with useEffect
    Given useBindX state
    When used in useEffect dependency array
    Then effect should run on state changes
    And dependencies should be tracked correctly

  Scenario: Use useBindX with useMemo
    Given expensive computation using bindX state
    When wrapped in useMemo
    Then computation should memoize correctly
    And only recompute when state changes

  Scenario: Use useBindX with useCallback
    Given function using bindX state
    When wrapped in useCallback
    Then function should memoize correctly
    And only recreate when state changes

  Scenario: Use useBindX with useRef
    Given component with both useBindX and useRef
    When either changes
    Then both should work correctly
    And no conflicts should occur

  Scenario: Use useBindX with useContext
    Given context providing bindX state
    When components consume context
    Then state should be shared
    And updates should propagate

  # Custom Hooks
  Scenario: Create custom hook with useBindX
    Given custom hook using useBindX
    When multiple components use the hook
    Then each should have independent state
    And can share state if designed that way

  Scenario: Compose multiple custom hooks
    Given multiple custom hooks with useBindX
    When used together in component
    Then all should work correctly
    And no conflicts should occur

  Scenario: Reusable counter hook
    Given useCounter custom hook
    When component uses useCounter()
    Then counter functionality should work
    And can be reused across components

  # JSX Integration
  Scenario: Render bindX state in JSX
    Given useBindX state { message: 'Hello' }
    When JSX renders {state.message}
    Then it should display 'Hello'
    When state.message changes
    Then JSX should update

  Scenario: Use bindX state in conditional rendering
    Given useBindX state { isVisible: true }
    When JSX uses {state.isVisible && <div>...</div>}
    Then content should show/hide correctly

  Scenario: Use bindX state in list rendering
    Given useBindX state { items: [1, 2, 3] }
    When JSX uses {state.items.map(...)}
    Then list should render correctly
    When items change
    Then list should update

  Scenario: Use computed in JSX
    Given bindX computed property
    When JSX renders {computed()}
    Then value should display correctly
    And update when dependencies change

  # Event Handlers
  Scenario: Update bindX state in event handlers
    Given useBindX state { count: 0 }
    When button onClick increments count
    Then state should update
    And component should re-render

  Scenario: Use arrow functions in event handlers
    Given event handler modifying bindX state
    When event fires
    Then state should update correctly
    And no stale closure issues

  Scenario: Pass state to child components
    Given parent with useBindX state
    When passed as props to child
    Then child should receive state
    And changes should propagate

  # Props and Components
  Scenario: Pass bindX state as props
    Given parent with useBindX state
    When passed to child component
    Then child should receive the state
    And changes in child reflect in parent

  Scenario: Destructure bindX state in props
    Given component receiving bindX state as prop
    When destructuring in function signature
    Then reactivity should work
    And updates should propagate

  Scenario: Clone bindX state for isolation
    Given bindX state in parent
    When child needs isolated copy
    Then can clone state
    And changes don't affect original

  # Context API
  Scenario: Provide bindX state via Context
    Given bindX state in context provider
    When components use useContext
    Then components should access state
    And updates should sync across consumers

  Scenario: Multiple contexts with bindX
    Given multiple context providers
    When components consume different contexts
    Then each context should work independently
    And no conflicts should occur

  Scenario: Update context bindX state
    Given bindX state in context
    When any consumer updates state
    Then all consumers should see update
    And re-render appropriately

  # TypeScript Support
  Scenario: Strongly-typed bindX state in React
    Given TypeScript interface for state
    When using useBindX<State>(...)
    Then TypeScript should enforce types
    And IDE autocomplete should work

  Scenario: Typed computed properties in React
    Given typed bindX state
    When creating computed properties
    Then return types should be inferred
    And TypeScript should validate

  Scenario: Typed watchers in React
    Given typed bindX state
    When creating watchers
    Then callback types should be correct
    And TypeScript should validate

  Scenario: Generic React component with bindX
    Given generic component<T>
    When using useBindX
    Then types should be inferred
    And type safety maintained

  # Performance
  Scenario: Efficient re-renders with useBindX
    Given component with many reactive properties
    When properties update frequently
    Then re-renders should be efficient
    And UI should stay responsive

  Scenario: Avoid unnecessary re-renders
    Given parent and child components
    When parent state changes
    Then only affected components re-render
    And memoization works correctly

  Scenario: Batch multiple state updates
    Given multiple useBindX property changes
    When changes occur in same tick
    Then only one re-render occurs
    And React batching works

  Scenario: Lazy initialization of state
    Given expensive initial state computation
    When using useBindX(() => expensiveInit())
    Then computation should only run once
    And not on every render

  # React 18 Features
  Scenario: Use useBindX with Suspense
    Given component wrapped in Suspense
    When component uses useBindX
    Then should work correctly
    And async rendering works

  Scenario: Use useBindX with startTransition
    Given state update wrapped in startTransition
    When non-urgent update occurs
    Then update should be deferred
    And UI should remain responsive

  Scenario: Use useBindX with useDeferredValue
    Given bindX state used with useDeferredValue
    When state updates rapidly
    Then deferred value should lag appropriately
    And performance should improve

  Scenario: Concurrent rendering compatibility
    Given React 18 concurrent features
    When component uses useBindX
    Then should work correctly
    And no tearing should occur

  # Server-Side Rendering (SSR)
  Scenario: Render with useBindX on server (Next.js)
    Given Next.js with SSR
    When component with useBindX renders on server
    Then state should initialize on server
    And HTML should include initial state

  Scenario: Hydrate useBindX state on client
    Given SSR-rendered component
    When hydration occurs on client
    Then state should restore correctly
    And no hydration errors

  Scenario: Avoid memory leaks in SSR
    Given SSR environment
    When components with useBindX render
    Then watchers should cleanup
    And no memory leaks between requests

  Scenario: Use useBindX in getServerSideProps
    Given Next.js page with getServerSideProps
    When fetching data on server
    And initializing useBindX state
    Then page should render with data
    And client should hydrate correctly

  # Class Components (Legacy Support)
  Scenario: Use bindX in class components
    Given class component
    When using bindX in componentDidMount
    Then state should work
    And cleanup in componentWillUnmount

  Scenario: Convert class component to function component
    Given class component using bindX
    When converting to function component
    Then useBindX should be equivalent
    And migration should be straightforward

  # Error Handling
  Scenario: Handle errors in computed properties
    Given computed that throws error
    When accessed in render
    Then error boundary should catch
    And component should not crash

  Scenario: Handle errors in watchers
    Given watcher callback that throws
    When watcher executes
    Then error should be caught
    And component should remain stable

  Scenario: Handle errors in state updates
    Given state update that throws
    When update attempted
    Then error should be caught
    And state should remain consistent

  # Testing
  Scenario: Test React components with useBindX
    Given test suite using React Testing Library
    When testing component with useBindX
    Then component should render
    And state updates should work in tests

  Scenario: Mock bindX state in tests
    Given component depending on useBindX
    When providing mock state
    Then component should work with mock
    And can control state for testing

  Scenario: Test computed properties
    Given component with bindX computed
    When updating state in test
    Then computed should update
    And can assert on computed values

  Scenario: Test watchers
    Given component with bindX watchers
    When triggering state changes in test
    Then watchers should execute
    And can assert on side effects

  Scenario: Test async operations
    Given component with async useBindX state
    When testing async updates
    Then can use waitFor
    And assertions should work

  # React DevTools
  Scenario: Inspect bindX state in React DevTools
    Given component using useBindX
    When opened in React DevTools
    Then state should be visible
    And can be inspected and modified

  Scenario: Display custom hook name in DevTools
    Given custom hook with useBindX
    When viewing in DevTools
    Then hook name should be visible
    And state should be inspectable

  # Next.js Integration
  Scenario: Use useBindX in Next.js pages
    Given Next.js application
    When using useBindX in pages
    Then should work in pages router
    And should work in app router

  Scenario: Use useBindX with Next.js App Router
    Given Next.js 13+ with App Router
    When using useBindX in client components
    Then should work correctly
    And server components should not use it

  Scenario: Share bindX state across Next.js routes
    Given bindX state in layout
    When navigating between routes
    Then state should persist
    And can be accessed by all routes

  Scenario: Use useBindX with Next.js API routes
    Given API route fetching data
    When initializing useBindX state with fetched data
    Then should work correctly
    And data should be available

  # React Native Compatibility
  Scenario: Use useBindX in React Native
    Given React Native application
    When using useBindX
    Then should work identically
    And no web-specific dependencies

  Scenario: Use useBindX with React Native navigation
    Given React Navigation installed
    When using useBindX across screens
    Then state should work correctly
    And navigation should not break state

  # Advanced Patterns
  Scenario: Create global store with useBindX
    Given bindX state in module scope
    When multiple components import
    Then all share same state
    And updates sync across app

  Scenario: Implement undo/redo with bindX
    Given history tracking for bindX state
    When user performs actions
    Then can undo/redo
    And state restores correctly

  Scenario: Implement time-travel debugging
    Given bindX state with history
    When debugging
    Then can inspect past states
    And replay actions

  Scenario: Implement optimistic updates
    Given async operation with bindX state
    When updating optimistically
    Then UI updates immediately
    And rolls back on error

  # Comparison Scenarios
  Scenario: Compare useBindX vs useState
    Given same functionality implemented both ways
    When measuring performance
    Then should be comparable
    And useBindX should meet <0.5ms target

  Scenario: Migrate from useState to useBindX
    Given component using useState
    When replacing with useBindX
    Then functionality should be equivalent
    And migration should be straightforward

  Scenario: Migrate from Redux to useBindX
    Given component connected to Redux
    When replacing with useBindX
    Then should be simpler
    And less boilerplate required

  Scenario: Compare useBindX vs MobX
    Given same functionality in both
    When comparing API and performance
    Then useBindX should be lighter
    And API should be simpler

  # Edge Cases
  Scenario: Use useBindX with multiple React roots
    Given multiple React roots on page
    When each uses useBindX
    Then should work independently
    And no conflicts

  Scenario: Use useBindX with React portals
    Given component using portals
    When bindX state controls portal content
    Then should work correctly
    And reactivity maintained

  Scenario: Use useBindX with error boundaries
    Given component wrapped in error boundary
    When bindX state update causes error
    Then error boundary should catch
    And app should remain stable

  Scenario: Use useBindX with lazy loading
    Given lazy-loaded component with useBindX
    When component loads
    Then useBindX should work
    And state should initialize correctly

  # Bundle Size and Tree Shaking
  Scenario: Tree-shake unused bindX features
    Given production build
    When only using useBindX
    Then unused features should be removed
    And bundle should be minimal

  Scenario: Verify minimal bundle size
    Given @genx/bindx-react in bundle
    When analyzing bundle size
    Then should be <5KB gzipped
    And no duplicate dependencies
