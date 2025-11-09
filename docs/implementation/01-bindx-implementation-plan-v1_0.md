# bindX Implementation Plan
**Version**: 1.0
**Date**: 2025-11-09
**Status**: Ready for Execution
**Module**: bindX (Reactive Data Binding)

---

## Overview

### Goals and Scope
Implement bindX, a lightweight (<3KB) framework-agnostic reactive data binding library for the genx.software platform. bindX provides Vue/React-like reactivity through simple HTML attributes without frameworks, build tools, or vendor lock-in.

**Core Capabilities**:
- Two-way data binding via `bx-model` attribute
- One-way display binding via `bx-bind` attribute
- Computed properties with automatic dependency tracking
- Collection binding for reactive arrays/lists
- Custom formatters for value transformation
- Framework adapters for React, Vue, Svelte, Angular, Solid

**Business Value**:
- 90% reduction in data binding boilerplate
- Zero framework dependencies
- <3KB bundle size vs 50KB+ frameworks
- <0.5ms per binding update (matches Vue 3 performance)
- Privacy-compliant by design (no data transmission)

### Success Metrics
- **Bundle Size**: ≤3KB minified + gzipped
- **Performance**: <0.5ms per binding update, 60 FPS maintained
- **Coverage**: >90% test coverage across all modules
- **Lighthouse Score**: Perfect 100 maintained (0ms TBT, <0.2s LCP)
- **Browser Support**: ES6+ with Proxy polyfill for legacy
- **Memory Safety**: No leaks in 24-hour continuous operation test

---

## Current State Analysis

### Existing Implementation
**Status**: No existing bindX code - greenfield implementation

**Reference Implementations Available**:
- `/Users/adam/dev/genX/src/fmtx.js` (2.2KB) - Polymorphic formatting engine
- `/Users/adam/dev/genX/src/accx.js` (11KB) - Accessibility enhancement engine
- Pattern established: Factory-based initialization, MutationObserver integration, attribute-driven configuration

**Established Patterns to Follow**:
```javascript
// Factory export for bootloader integration
window.bxXFactory = {
    init: (config = {}) => initBindX({prefix:'bx-', auto:true, observe:true, ...config}),
    bindx,
    bind
};

// Polymorphic attribute processing
const processBinding = (element, data) => {
    const config = parseBindingConfig(element);
    return applyBinding(element, data, config);
};
```

### Identified Issues and Constraints
1. **No Classes Allowed**: Must use pure functions except for Proxy wrappers and singleton registries
2. **Set Theory Compliance**: Filtering operations must use frozenset equivalents (JavaScript Set with immutable patterns)
3. **XSS Prevention**: No `eval()`, `Function()`, or `innerHTML` usage
4. **Memory Management**: WeakMap required for automatic cleanup
5. **Framework Agnostic**: Zero dependencies on React, Vue, Angular, or any framework

---

## Prerequisites

### Dependencies
- **Browser APIs**:
  - Proxy API (ES6+) - Required for reactivity
  - MutationObserver - Required for dynamic content detection
  - requestAnimationFrame - Required for batched updates
  - WeakMap - Required for memory-safe binding registry

### Environment Setup
```bash
# Project structure
/Users/adam/dev/genX/
├── src/
│   └── bindx.js (to be created)
├── tests/
│   ├── unit/
│   │   └── bindx.test.js (to be created)
│   └── features/
│       ├── bindx-two-way-binding.feature
│       ├── bindx-one-way-binding.feature
│       ├── bindx-computed-properties.feature
│       └── bindx-collection-binding.feature
└── docs/
    ├── architecture/
    │   └── bindx-technical-architecture-v1_0.md (exists)
    └── implementation/
        └── 01-bindx-implementation-plan-v1_0.md (this file)
```

### Knowledge Prerequisites
- Proxy API and trap handlers
- MutationObserver for DOM monitoring
- requestAnimationFrame batching for 60 FPS
- Dependency graph algorithms for computed properties
- Cycle detection for circular dependencies

---

## Implementation Timeline Overview

### Total Estimated Duration: 18 hours 45 minutes

**Phase Breakdown**:
1. **Phase 1: Core Reactive Engine** (4h 30m) - Proxy-based reactivity foundation
2. **Phase 2: Binding Management** (3h 45m) - Two-way and one-way bindings
3. **Phase 3: Computed Properties** (3h 15m) - Dependency tracking and evaluation
4. **Phase 4: DOM Integration** (2h 45m) - Scanner, observer, and updater
5. **Phase 5: Collection Binding** (2h 30m) - Array/Set reactive iteration
6. **Phase 6: Framework Adapters** (2h 0m) - React, Vue, Svelte hooks (Phase 1)

**Critical Path**:
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

**Parallel Opportunities**:
- Phase 3 can start after Phase 1 completes (independent of Phase 2)
- Framework adapters (Phase 6) can be implemented in parallel for different frameworks

---

## Phase 1: Core Reactive Engine
**Duration**: 4 hours 30 minutes
**Dependencies**: None
**Risk Level**: Medium (Proxy API complexity)

### Objectives
- [x] Implement Proxy-based reactive wrapper
- [x] Create notification system for property changes
- [x] Handle nested object reactivity (deep mode)
- [x] Implement circular reference detection
- [x] Create reactive data factory function

### Task 1.1: Implement Reactive Proxy Wrapper
**Duration**: 2 hours
**Dependencies**: None

**Implementation Process** (MANDATORY 8-step process):

1. **Capture Start Time**
   ```bash
   echo "Task 1.1 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-reactive-proxy.feature
   Feature: Reactive Proxy Wrapper
     As a developer
     I want objects to become reactive when wrapped
     So that property changes automatically notify subscribers

     Scenario: Wrap plain object with reactive proxy
       Given I have a plain object { count: 0, name: "test" }
       When I wrap it with bindx()
       Then property reads should be tracked
       And property writes should trigger notifications

     Scenario: Deep reactivity for nested objects
       Given I have a nested object { user: { name: "Alice", age: 30 } }
       When I wrap it with bindx({ deep: true })
       Then nested property changes should trigger notifications
       And the notification path should be "user.name"

     Scenario: Shallow reactivity (opt-in)
       Given I have a nested object { user: { name: "Alice" } }
       When I wrap it with bindx({ deep: false })
       Then top-level changes trigger notifications
       But nested property changes do not trigger notifications

     Scenario: Circular reference detection
       Given I have an object with circular reference
       When I wrap it with bindx()
       Then it should not cause infinite recursion
       And it should handle the circular reference gracefully

     Scenario: Change notification
       Given I have a reactive object
       When I set a property to a new value
       Then the onChange callback should be invoked
       And it should receive the path and new value
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/bindx_fixtures.js
   import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

   /**
    * Test fixtures for bindX reactive proxy
    */
   export const createTestData = () => ({
       simple: { count: 0, name: 'test', active: true },
       nested: {
           user: { name: 'Alice', age: 30 },
           settings: { theme: 'dark', notifications: true }
       },
       array: [1, 2, 3, 4, 5],
       withCircular: (() => {
           const obj = { value: 42 };
           obj.self = obj; // Circular reference
           return obj;
       })()
   });

   export const createMockChangeHandler = () => {
       const calls = [];
       const handler = (path, value) => {
           calls.push({ path, value, timestamp: Date.now() });
       };
       handler.getCalls = () => calls;
       handler.reset = () => calls.length = 0;
       handler.lastCall = () => calls[calls.length - 1];
       return handler;
   };

   export const waitForNextFrame = () =>
       new Promise(resolve => requestAnimationFrame(resolve));
   ```

4. **Run Red Test**
   ```bash
   cd /Users/adam/dev/genX
   uv run npm test -- tests/features/bindx-reactive-proxy.feature --verbose
   # EXPECTED: Tests fail (red state) - no implementation exists yet
   # This validates test correctness
   ```

5. **Write Implementation**
   ```javascript
   // /Users/adam/dev/genX/src/bindx.js (core reactive engine)

   /**
    * bindX - Reactive Data Binding
    * Pure functional reactive system using Proxy API
    */
   (function() {
       'use strict';

       // WeakMap registry for reactive metadata (memory-safe)
       const reactiveMetadata = new WeakMap();

       /**
        * Check if object is already reactive
        */
       const isReactive = (obj) => {
           return obj && typeof obj === 'object' && reactiveMetadata.has(obj);
       };

       /**
        * Create reactive proxy wrapper
        *
        * @param {Object} data - Plain object to make reactive
        * @param {Object} options - Configuration
        * @param {boolean} options.deep - Deep reactivity (default: true)
        * @param {Function} options.onChange - Change notification callback
        * @returns {Proxy} Reactive proxy wrapper
        */
       const createReactive = (data, options = {}) => {
           if (typeof data !== 'object' || data === null) {
               return data; // Primitives pass through
           }

           // Return existing proxy if already reactive
           if (isReactive(data)) {
               return data;
           }

           const { deep = true, onChange = null, path = '' } = options;

           // Circular reference detection
           const seen = new WeakSet();
           const checkCircular = (obj) => {
               if (seen.has(obj)) return true;
               seen.add(obj);
               return false;
           };

           if (checkCircular(data)) {
               console.warn('bindX: Circular reference detected, skipping reactive wrap');
               return data;
           }

           const metadata = {
               original: data,
               subscribers: new Set(),
               deep,
               path
           };

           const handler = {
               get(target, property, receiver) {
                   // Track property access
                   trackAccess(target, property, path);

                   const value = Reflect.get(target, property, receiver);

                   // Deep reactivity: wrap nested objects
                   if (deep && value && typeof value === 'object' && !isReactive(value)) {
                       const nestedPath = path ? `${path}.${String(property)}` : String(property);
                       return createReactive(value, { deep, onChange, path: nestedPath });
                   }

                   return value;
               },

               set(target, property, value, receiver) {
                   const oldValue = target[property];

                   // Only trigger if value actually changed
                   if (oldValue === value) {
                       return true;
                   }

                   const result = Reflect.set(target, property, value, receiver);

                   if (result) {
                       const changePath = path ? `${path}.${String(property)}` : String(property);

                       // Notify change
                       if (onChange) {
                           onChange(changePath, value);
                       }

                       notifyBindings(changePath, value);
                   }

                   return result;
               },

               has(target, property) {
                   return Reflect.has(target, property);
               },

               ownKeys(target) {
                   return Reflect.ownKeys(target);
               },

               getOwnPropertyDescriptor(target, property) {
                   return Reflect.getOwnPropertyDescriptor(target, property);
               }
           };

           const proxy = new Proxy(data, handler);
           reactiveMetadata.set(proxy, metadata);

           return proxy;
       };

       /**
        * Track property access for dependency tracking
        */
       const trackAccess = (target, property, path) => {
           if (currentComputedContext) {
               const accessPath = path ? `${path}.${String(property)}` : String(property);
               currentComputedContext.dependencies.add(accessPath);
           }
       };

       /**
        * Notify bindings of changes (implemented in Phase 2)
        */
       let notifyBindings = (path, value) => {
           // Placeholder - will be implemented in binding manager
       };

       /**
        * Current computed property context (for dependency tracking)
        */
       let currentComputedContext = null;

       /**
        * Main bindx factory function
        */
       const bindx = (data, options = {}) => {
           if (typeof data !== 'object' || data === null) {
               throw new TypeError('bindx requires an object');
           }

           return createReactive(data, {
               deep: options.deep !== false,
               onChange: options.onChange || null
           });
       };

       // Export factory for bootloader integration
       window.bxXFactory = {
           init: (config = {}) => ({ bindx }),
           bindx
       };

       // Legacy global for standalone use
       if (!window.genx) {
           window.bindX = { bindx };
       }

       // CommonJS export
       if (typeof module !== 'undefined' && module.exports) {
           module.exports = { bindx, createReactive };
       }
   })();
   ```

6. **Run Green Test**
   ```bash
   cd /Users/adam/dev/genX
   uv run npm test -- tests/features/bindx-reactive-proxy.feature --verbose --coverage
   # MUST achieve 100% pass rate before proceeding
   # Target: >90% coverage for reactive engine
   ```

7. **Commit and Push**
   ```bash
   cd /Users/adam/dev/genX
   git add -A
   git commit -m "feat(bindx): Implement reactive proxy wrapper

   - Added Proxy-based change detection
   - Implemented deep reactivity with circular reference protection
   - Created onChange notification system
   - WeakMap-based metadata for memory safety
   - BDD tests with 100% pass rate

   Architecture compliance:
   - Pure function design (no classes except Proxy)
   - Memory-safe with WeakMap registry
   - XSS-safe (no eval or Function constructor)

   Test coverage: >90%"

   git push origin feature/bindx-reactive-engine
   ```

8. **Capture End Time**
   ```bash
   echo "Task 1.1 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   # Duration will be calculated: ~2 hours
   ```

**Validation Criteria**:
- All BDD scenarios pass with 100% success rate
- Test coverage >90% for reactive.js module
- No memory leaks in stress test (10,000 reactive objects)
- Performance: Proxy creation <0.1ms per object
- Circular references handled without stack overflow

**Rollback Procedure**:
1. `git revert` commit for reactive engine
2. Remove `/Users/adam/dev/genX/src/bindx.js`
3. Verify existing fmtx/accx modules unaffected

---

### Task 1.2: Implement Dependency Tracking System
**Duration**: 1 hour 30 minutes
**Dependencies**: Task 1.1 completion

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 1.2 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-dependency-tracking.feature
   Feature: Dependency Tracking
     As a developer
     I want property accesses to be tracked
     So that computed properties know their dependencies

     Scenario: Track property reads during computation
       Given I have a reactive object { a: 1, b: 2 }
       When I execute a computed function that reads both properties
       Then both "a" and "b" should be in the dependency set

     Scenario: Multiple computations track separately
       Given I have a reactive object { x: 10, y: 20, z: 30 }
       When I execute computed1 that reads x and y
       And I execute computed2 that reads y and z
       Then computed1 dependencies = {x, y}
       And computed2 dependencies = {y, z}

     Scenario: Nested property tracking
       Given I have a reactive object { user: { name: "Alice" } }
       When I execute a computation that reads user.name
       Then dependencies should include "user.name"

     Scenario: Dependency cleanup on recomputation
       Given I have a computed property with dependencies {a, b}
       When I recompute and now it only reads {a}
       Then old dependencies should be cleared
       And new dependencies = {a}
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/dependency_fixtures.js

   export const createDependencyTracker = () => {
       const tracker = {
           dependencies: new Set(),
           isTracking: false,
           start() {
               this.dependencies.clear();
               this.isTracking = true;
           },
           stop() {
               this.isTracking = false;
               return new Set(this.dependencies);
           },
           add(path) {
               if (this.isTracking) {
                   this.dependencies.add(path);
               }
           }
       };
       return tracker;
   };
   ```

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-dependency-tracking.feature -v
   # Expected: FAIL (no dependency tracking yet)
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Dependency tracking context stack
    */
   const dependencyContextStack = [];

   /**
    * Get current tracking context
    */
   const getCurrentContext = () => {
       return dependencyContextStack[dependencyContextStack.length - 1] || null;
   };

   /**
    * Track dependency during property access
    */
   const trackDependency = (path) => {
       const context = getCurrentContext();
       if (context && context.isTracking) {
           context.dependencies.add(path);
       }
   };

   /**
    * Execute function with dependency tracking
    */
   const withTracking = (fn) => {
       const context = {
           dependencies: new Set(),
           isTracking: true
       };

       dependencyContextStack.push(context);

       try {
           const result = fn();
           return {
               result,
               dependencies: new Set(context.dependencies)
           };
       } finally {
           dependencyContextStack.pop();
       }
   };

   // Update trackAccess function in Proxy handler
   const trackAccess = (target, property, path) => {
       const accessPath = path ? `${path}.${String(property)}` : String(property);
       trackDependency(accessPath);
   };
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-dependency-tracking.feature -v --coverage
   # Must achieve 100% pass
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Add dependency tracking system

   - Implemented context stack for nested tracking
   - Added withTracking helper for computations
   - Updated Proxy get trap to track accesses
   - All BDD tests passing

   Test coverage: >90%"

   git push origin feature/bindx-reactive-engine
   ```

8. **Capture End Time**
   ```bash
   echo "Task 1.2 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- Dependency tracking works for nested properties
- Multiple tracking contexts isolated correctly
- No memory leaks in context stack
- Performance: <0.01ms overhead per property access

---

### Task 1.3: Implement Batched Update System
**Duration**: 1 hour
**Dependencies**: Task 1.1 completion

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 1.3 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-batched-updates.feature
   Feature: Batched Updates
     As a system
     I want multiple property changes to batch within one frame
     So that DOM updates happen only once per frame (60 FPS)

     Scenario: Multiple synchronous changes batch together
       Given I have a reactive object { a: 1, b: 2, c: 3 }
       When I synchronously set a=10, b=20, c=30
       Then only ONE DOM update should occur
       And it should happen on next requestAnimationFrame

     Scenario: Batch size limited to 16ms window
       Given I have 100 reactive properties
       When I update all 100 properties
       Then updates should batch within single frame
       And total time should be <16ms

     Scenario: Manual flush for testing
       Given I have batched updates pending
       When I call flushUpdates()
       Then all pending updates execute immediately
       And RAF queue is cleared
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/batch_fixtures.js

   export const createBatchTester = () => {
       let updateCount = 0;
       const updates = [];

       const mockUpdate = (path, value) => {
           updateCount++;
           updates.push({ path, value, frame: performance.now() });
       };

       return {
           mockUpdate,
           getUpdateCount: () => updateCount,
           getUpdates: () => [...updates],
           reset: () => {
               updateCount = 0;
               updates.length = 0;
           }
       };
   };
   ```

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-batched-updates.feature -v
   # Expected: FAIL
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Batched update queue using requestAnimationFrame
    */
   const createBatchQueue = () => {
       let pending = new Map(); // path -> value
       let scheduled = false;
       let rafId = null;

       const flush = () => {
           const updates = new Map(pending);
           pending.clear();
           scheduled = false;
           rafId = null;

           // Execute all batched updates
           for (const [path, value] of updates) {
               executeDOMUpdate(path, value);
           }
       };

       const schedule = (path, value) => {
           pending.set(path, value);

           if (!scheduled) {
               scheduled = true;
               rafId = requestAnimationFrame(flush);
           }
       };

       const flushSync = () => {
           if (scheduled && rafId !== null) {
               cancelAnimationFrame(rafId);
               flush();
           }
       };

       return Object.freeze({
           schedule,
           flush: flushSync,
           getPending: () => new Map(pending),
           isScheduled: () => scheduled
       });
   };

   const batchQueue = createBatchQueue();

   /**
    * Execute DOM update (placeholder for Phase 4)
    */
   const executeDOMUpdate = (path, value) => {
       // Will be implemented in DOM integration phase
       console.debug(`bindX: Update ${path} = ${value}`);
   };
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-batched-updates.feature -v --coverage
   # Must pass 100%
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Add RAF-based batched updates

   - Implemented requestAnimationFrame batching
   - Multiple updates consolidate to single frame
   - Manual flush for testing scenarios
   - Maintains 60 FPS performance guarantee

   Test coverage: >90%"

   git push origin feature/bindx-reactive-engine
   ```

8. **Capture End Time**
   ```bash
   echo "Task 1.3 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- 100 updates batch within single 16ms frame
- Performance benchmark: <0.5ms overhead per batch
- No dropped frames in 60 FPS stress test

---

## Phase 2: Binding Management
**Duration**: 3 hours 45 minutes
**Dependencies**: Phase 1 completion
**Risk Level**: Medium

### Objectives
- [x] Implement two-way binding (bx-model)
- [x] Implement one-way binding (bx-bind)
- [x] Create binding registry with WeakMap
- [x] Handle form input types (text, number, checkbox, select)
- [x] Implement debouncing for text inputs

### Task 2.1: Implement Binding Registry
**Duration**: 1 hour 15 minutes
**Dependencies**: Phase 1 complete

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 2.1 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-binding-registry.feature
   Feature: Binding Registry
     As the system
     I want to track all active bindings
     So that updates can be efficiently propagated

     Scenario: Register new binding
       Given I have an element <input id="name">
       When I create a binding for property "user.name"
       Then the binding should be in the registry
       And it should be associated with the element

     Scenario: Multiple bindings per element
       Given I have an element with multiple bx- attributes
       When I register bx-model and bx-class bindings
       Then both bindings should be in the registry
       And they should not conflict

     Scenario: Automatic cleanup on element removal
       Given I have 100 bound elements
       When I remove all elements from DOM
       Then WeakMap should allow garbage collection
       And no memory leaks should occur

     Scenario: Query bindings by path
       Given I have bindings for "user.name", "user.age", "settings.theme"
       When I query bindings for path "user.*"
       Then I should get bindings for "user.name" and "user.age"
       But not "settings.theme"
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/registry_fixtures.js

   export const createMockBinding = (path, element) => ({
       id: `binding-${Date.now()}-${Math.random()}`,
       path,
       element,
       type: 'model',
       created: Date.now()
   });

   export const createMockElements = (count) => {
       return Array.from({ length: count }, (_, i) => {
           const el = document.createElement('input');
           el.id = `test-${i}`;
           return el;
       });
   };
   ```

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-binding-registry.feature -v
   # Expected: FAIL
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Binding Registry (singleton)
    * Uses WeakMap for automatic garbage collection
    */
   const createBindingRegistry = () => {
       // WeakMap: element -> Array<BindingConfig>
       const elementBindings = new WeakMap();

       // Map: path -> Set<BindingConfig> (for efficient path lookups)
       const pathBindings = new Map();

       // All bindings (for iteration)
       const allBindings = new Set();

       const register = (element, binding) => {
           // Store by element
           const bindings = elementBindings.get(element) || [];
           bindings.push(binding);
           elementBindings.set(element, bindings);

           // Store by path
           const pathSet = pathBindings.get(binding.path) || new Set();
           pathSet.add(binding);
           pathBindings.set(binding.path, pathSet);

           // Add to all bindings
           allBindings.add(binding);

           return binding;
       };

       const unregister = (binding) => {
           // Remove from path index
           const pathSet = pathBindings.get(binding.path);
           if (pathSet) {
               pathSet.delete(binding);
               if (pathSet.size === 0) {
                   pathBindings.delete(binding.path);
               }
           }

           // Remove from all bindings
           allBindings.delete(binding);

           // Element bindings cleaned up automatically by WeakMap
       };

       const getByElement = (element) => {
           return elementBindings.get(element) || [];
       };

       const getByPath = (path) => {
           return Array.from(pathBindings.get(path) || []);
       };

       const getByPathPattern = (pattern) => {
           const regex = new RegExp(pattern.replace('*', '.*'));
           const matches = [];

           for (const [path, bindings] of pathBindings) {
               if (regex.test(path)) {
                   matches.push(...bindings);
               }
           }

           return matches;
       };

       const clear = () => {
           pathBindings.clear();
           allBindings.clear();
           // elementBindings WeakMap clears automatically
       };

       return Object.freeze({
           register,
           unregister,
           getByElement,
           getByPath,
           getByPathPattern,
           clear,
           get size() { return allBindings.size; }
       });
   };

   const bindingRegistry = createBindingRegistry();
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-binding-registry.feature -v --coverage
   # Must pass 100%
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Implement binding registry with WeakMap

   - Created dual-index registry (element + path)
   - WeakMap ensures automatic GC when elements removed
   - Path pattern matching for batch updates
   - All BDD scenarios passing

   Test coverage: >90%"

   git push origin feature/bindx-bindings
   ```

8. **Capture End Time**
   ```bash
   echo "Task 2.1 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- WeakMap allows GC of removed elements
- Path pattern matching works correctly
- No memory leaks in 1000-element stress test
- Registry lookup: O(1) by element, O(n) by path

---

### Task 2.2: Implement Two-Way Binding (bx-model)
**Duration**: 1 hour 30 minutes
**Dependencies**: Task 2.1 completion

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 2.2 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-two-way-binding.feature
   Feature: Two-Way Data Binding
     As a developer
     I want form inputs to sync with data objects
     So that user input automatically updates my data model

     Scenario: Text input two-way binding
       Given I have <input bx-model="user.name">
       And reactive data { user: { name: "Alice" } }
       When I type "Bob" into the input
       Then data.user.name should equal "Bob"
       And the input value should display "Bob"

     Scenario: Data-to-DOM synchronization
       Given I have <input bx-model="count">
       And reactive data { count: 0 }
       When I programmatically set data.count = 42
       Then the input value should update to "42"

     Scenario: Checkbox binding
       Given I have <input type="checkbox" bx-model="agreed">
       And reactive data { agreed: false }
       When I check the checkbox
       Then data.agreed should be true

     Scenario: Select dropdown binding
       Given I have <select bx-model="color">
       And reactive data { color: "red" }
       When I select "blue" from the dropdown
       Then data.color should equal "blue"

     Scenario: Debounced text input
       Given I have <input bx-model="search" bx-debounce="300">
       When I rapidly type "h", "e", "l", "l", "o"
       Then data updates should be debounced
       And only final value "hello" should be set after 300ms
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/binding_fixtures.js

   export const createTestInput = (type = 'text') => {
       const input = document.createElement('input');
       input.type = type;
       return input;
   };

   export const createTestSelect = (options) => {
       const select = document.createElement('select');
       options.forEach(opt => {
           const option = document.createElement('option');
           option.value = opt;
           option.textContent = opt;
           select.appendChild(option);
       });
       return select;
   };

   export const simulateInput = (element, value) => {
       if (element.type === 'checkbox') {
           element.checked = value;
       } else {
           element.value = value;
       }
       element.dispatchEvent(new Event('input', { bubbles: true }));
   };
   ```

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-two-way-binding.feature -v
   # Expected: FAIL
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Create two-way binding (bx-model)
    */
   const createModelBinding = (element, data, path, options = {}) => {
       const { debounce = 0 } = options;

       // Validation: bx-model only for form controls
       if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
           throw new Error(
               `bx-model requires form control element. Got ${element.tagName}. ` +
               `Use bx-bind for display-only elements.`
           );
       }

       // Get/set value helpers based on input type
       const getValue = (el) => {
           if (el.type === 'checkbox') return el.checked;
           if (el.type === 'number') return parseFloat(el.value) || 0;
           return el.value;
       };

       const setValue = (el, val) => {
           if (el.type === 'checkbox') {
               el.checked = Boolean(val);
           } else {
               el.value = String(val);
           }
       };

       // DOM -> Data (with debouncing)
       let timeoutId = null;
       const handleInput = (event) => {
           const newValue = getValue(element);

           if (debounce > 0) {
               clearTimeout(timeoutId);
               timeoutId = setTimeout(() => {
                   setNestedProperty(data, path, newValue);
               }, debounce);
           } else {
               setNestedProperty(data, path, newValue);
           }
       };

       element.addEventListener('input', handleInput);

       // Data -> DOM (initial + on changes)
       const updateDOM = () => {
           const currentValue = getNestedProperty(data, path);
           if (getValue(element) !== currentValue) {
               setValue(element, currentValue);
           }
       };

       // Initial sync
       updateDOM();

       // Register binding
       const binding = {
           id: generateBindingId(),
           element,
           path,
           type: 'model',
           options,
           updateDOM,
           destroy: () => {
               element.removeEventListener('input', handleInput);
               clearTimeout(timeoutId);
               bindingRegistry.unregister(binding);
           }
       };

       bindingRegistry.register(element, binding);

       return binding;
   };

   /**
    * Helper: Get nested property value
    */
   const getNestedProperty = (obj, path) => {
       return path.split('.').reduce((acc, key) => acc?.[key], obj);
   };

   /**
    * Helper: Set nested property value
    */
   const setNestedProperty = (obj, path, value) => {
       const keys = path.split('.');
       const lastKey = keys.pop();
       const target = keys.reduce((acc, key) => acc[key], obj);
       target[lastKey] = value;
   };

   /**
    * Generate unique binding ID
    */
   const generateBindingId = () => {
       return `bx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   };
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-two-way-binding.feature -v --coverage
   # Must pass 100%
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Implement two-way binding (bx-model)

   - Added support for text, checkbox, number, select inputs
   - Implemented debouncing for text inputs
   - DOM-to-data and data-to-DOM synchronization
   - Proper cleanup on binding destruction
   - All BDD scenarios passing

   Test coverage: >90%"

   git push origin feature/bindx-bindings
   ```

8. **Capture End Time**
   ```bash
   echo "Task 2.2 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- All input types work correctly
- Debouncing prevents rapid updates
- No infinite loops between DOM and data
- Memory cleanup on element removal

---

### Task 2.3: Implement One-Way Binding (bx-bind)
**Duration**: 1 hour
**Dependencies**: Task 2.1 completion

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 2.3 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-one-way-binding.feature
   Feature: One-Way Data Binding
     As a developer
     I want elements to display data values
     So that my UI stays in sync with data changes

     Scenario: Display text content
       Given I have <span bx-bind="user.name"></span>
       And reactive data { user: { name: "Alice" } }
       Then the span should display "Alice"

     Scenario: Update on data change
       Given I have <span bx-bind="count"></span>
       And reactive data { count: 0 }
       When I set data.count = 42
       Then the span should update to "42"

     Scenario: Formatted display
       Given I have <span bx-bind="price" bx-format="currency"></span>
       And reactive data { price: 25.00 }
       Then the span should display "$25.00"

     Scenario: Input value binding (read-only)
       Given I have <input bx-bind="username" readonly>
       And reactive data { username: "admin" }
       Then the input value should be "admin"
       But user typing should not update data
   ```

3. **Create Test Fixtures** (reuse from Task 2.2)

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-one-way-binding.feature -v
   # Expected: FAIL
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Create one-way binding (bx-bind)
    */
   const createOneWayBinding = (element, data, path, options = {}) => {
       const { formatter = null } = options;

       // Data -> DOM only
       const updateDOM = () => {
           let value = getNestedProperty(data, path);

           // Apply formatter if specified
           if (formatter && window.fxXFactory) {
               value = window.fxXFactory.format(formatter, value);
           }

           // XSS-safe: Use textContent, never innerHTML
           if (['INPUT', 'TEXTAREA'].includes(element.tagName)) {
               if (element.value !== String(value)) {
                   element.value = String(value);
               }
           } else {
               if (element.textContent !== String(value)) {
                   element.textContent = String(value);
               }
           }
       };

       // Initial sync
       updateDOM();

       // Register binding
       const binding = {
           id: generateBindingId(),
           element,
           path,
           type: 'bind',
           options,
           updateDOM,
           destroy: () => {
               bindingRegistry.unregister(binding);
           }
       };

       bindingRegistry.register(element, binding);

       return binding;
   };
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-one-way-binding.feature -v --coverage
   # Must pass 100%
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Implement one-way binding (bx-bind)

   - Data-to-DOM synchronization only
   - XSS-safe using textContent
   - Optional formatter integration with fmtX
   - Works on any element type
   - All BDD scenarios passing

   Test coverage: >90%"

   git push origin feature/bindx-bindings
   ```

8. **Capture End Time**
   ```bash
   echo "Task 2.3 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- One-way binding doesn't listen to user input
- Formatter integration works with fmtX
- XSS prevention verified (no HTML injection)

---

## Phase 3: Computed Properties
**Duration**: 3 hours 15 minutes
**Dependencies**: Phase 1, Phase 2 completion
**Risk Level**: High (circular dependency detection)

### Objectives
- [x] Implement computed property factory
- [x] Automatic dependency tracking
- [x] Circular dependency detection
- [x] Memoization and cache invalidation
- [x] Lazy evaluation

### Task 3.1: Implement Computed Property Engine
**Duration**: 2 hours
**Dependencies**: Phase 1, Phase 2

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 3.1 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # /Users/adam/dev/genX/tests/features/bindx-computed-properties.feature
   Feature: Computed Properties
     As a developer
     I want derived values to automatically update
     So that I don't manually manage calculations

     Scenario: Simple computed property
       Given I have reactive data { a: 2, b: 3 }
       And computed property sum = () => data.a + data.b
       Then sum should equal 5

     Scenario: Automatic recomputation on dependency change
       Given I have reactive data { price: 100, tax: 0.1 }
       And computed property total = () => data.price * (1 + data.tax)
       When I set data.tax = 0.2
       Then total should automatically recompute to 120

     Scenario: Nested computed properties
       Given I have reactive data { x: 2 }
       And computed property squared = () => data.x * data.x
       And computed property cubed = () => data.squared * data.x
       Then squared should equal 4
       And cubed should equal 8

     Scenario: Circular dependency detection
       Given I have computed property a = () => data.b + 1
       And computed property b = () => data.a + 1
       Then attempting to evaluate should throw CircularDependencyError
       And error message should show the cycle path

     Scenario: Memoization (cache)
       Given I have computed property expensive = () => heavyComputation()
       When I read expensive 100 times without data changes
       Then heavyComputation should only execute once
       And 99 reads should hit cache

     Scenario: Cache invalidation
       Given I have computed property sum = () => data.a + data.b
       And sum has been computed and cached
       When I change data.a
       Then cache should be invalidated
       And next read should recompute
   ```

3. **Create Test Fixtures**
   ```javascript
   // /Users/adam/dev/genX/tests/fixtures/computed_fixtures.js

   export const createMockComputation = () => {
       let callCount = 0;
       const expensive = () => {
           callCount++;
           // Simulate expensive operation
           let sum = 0;
           for (let i = 0; i < 1000; i++) sum += i;
           return sum;
       };

       return {
           expensive,
           getCallCount: () => callCount,
           reset: () => callCount = 0
       };
   };

   export const createCircularData = () => ({
       a: computed(() => data.b + 1),
       b: computed(() => data.a + 1)
   });
   ```

4. **Run Red Test**
   ```bash
   uv run npm test -- tests/features/bindx-computed-properties.feature -v
   # Expected: FAIL
   ```

5. **Write Implementation**
   ```javascript
   // Add to /Users/adam/dev/genX/src/bindx.js

   /**
    * Computed property cache
    */
   const computedCache = new WeakMap();

   /**
    * Circular dependency error
    */
   class CircularDependencyError extends Error {
       constructor(cycle) {
           super(`Circular dependency detected: ${cycle.join(' → ')}`);
           this.name = 'CircularDependencyError';
           this.cycle = cycle;
       }
   }

   /**
    * Create computed property
    */
   const computed = (computeFn) => {
       if (typeof computeFn !== 'function') {
           throw new TypeError('Computed requires a function');
       }

       const state = {
           value: undefined,
           cached: false,
           dependencies: new Set(),
           dependents: new Set(),
           evaluating: false
       };

       const getter = () => {
           // Detect circular dependencies
           if (state.evaluating) {
               throw new CircularDependencyError([computeFn.name || 'anonymous']);
           }

           // Return cached value if valid
           if (state.cached) {
               // Track this computed as dependency of outer computed
               trackDependency(getter);
               return state.value;
           }

           // Evaluate with dependency tracking
           state.evaluating = true;
           state.dependencies.clear();

           const { result, dependencies } = withTracking(() => {
               return computeFn();
           });

           state.value = result;
           state.dependencies = dependencies;
           state.cached = true;
           state.evaluating = false;

           // Subscribe to dependencies for cache invalidation
           for (const dep of dependencies) {
               subscribeToPath(dep, () => {
                   invalidateComputed(state);
               });
           }

           // Track this computed as dependency of outer computed
           trackDependency(getter);

           return state.value;
       };

       computedCache.set(getter, state);

       return getter;
   };

   /**
    * Invalidate computed property cache
    */
   const invalidateComputed = (state) => {
       if (!state.cached) return;

       state.cached = false;
       state.value = undefined;

       // Invalidate dependent computeds
       for (const dependent of state.dependents) {
           invalidateComputed(computedCache.get(dependent));
       }
   };

   /**
    * Subscribe to path changes (for cache invalidation)
    */
   const pathSubscribers = new Map();

   const subscribeToPath = (path, callback) => {
       const subscribers = pathSubscribers.get(path) || new Set();
       subscribers.add(callback);
       pathSubscribers.set(path, subscribers);

       return () => {
           subscribers.delete(callback);
           if (subscribers.size === 0) {
               pathSubscribers.delete(path);
           }
       };
   };

   /**
    * Notify path subscribers (called from reactive proxy)
    */
   const notifyPathSubscribers = (path) => {
       const subscribers = pathSubscribers.get(path);
       if (subscribers) {
           for (const callback of subscribers) {
               callback(path);
           }
       }
   };

   // Update Proxy set trap to notify subscribers
   // (in createReactive function, add to set handler):
   if (result) {
       const changePath = path ? `${path}.${String(property)}` : String(property);

       // Notify onChange
       if (onChange) {
           onChange(changePath, value);
       }

       // Notify path subscribers (for computed invalidation)
       notifyPathSubscribers(changePath);

       // Notify bindings
       notifyBindings(changePath, value);
   }
   ```

6. **Run Green Test**
   ```bash
   uv run npm test -- tests/features/bindx-computed-properties.feature -v --coverage
   # Must pass 100%
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat(bindx): Implement computed properties

   - Automatic dependency tracking
   - Memoization with cache invalidation
   - Circular dependency detection
   - Nested computed properties support
   - All BDD scenarios passing

   Test coverage: >90%"

   git push origin feature/bindx-computed
   ```

8. **Capture End Time**
   ```bash
   echo "Task 3.1 End: $(date '+%Y-%m-%d %H:%M:%S')" >> /Users/adam/dev/genX/docs/implementation/01-bindx-implementation-plan-v1_0.md
   ```

**Validation Criteria**:
- Circular dependency errors are clear and actionable
- Memoization provides >10x speedup for repeated reads
- Cache invalidation works for deep dependency chains
- Performance: <1ms for computed evaluation

---

### Task 3.2: Integrate Computed with Bindings
**Duration**: 1 hour 15 minutes
**Dependencies**: Task 3.1, Phase 2

**Implementation Process** (abbreviated - follows same 8-step pattern):

1. Capture start time
2. Create BDD feature file for computed + bindings integration
3. Create test fixtures
4. Run red test
5. Write implementation to connect computed properties to DOM bindings
6. Run green test (100% pass required)
7. Commit and push
8. Capture end time

**Key Implementation**: Allow `bx-bind="computedProperty"` where computedProperty is a computed function.

---

## Phase 4: DOM Integration
**Duration**: 2 hours 45 minutes
**Dependencies**: Phase 2 completion
**Risk Level**: Low

### Objectives
- [x] Implement attribute parser
- [x] DOM scanner for bx- attributes
- [x] MutationObserver for dynamic content
- [x] Polymorphic syntax support

### Task 4.1: Implement Attribute Parser
**Duration**: 1 hour

**Implementation Process** (abbreviated):
- Parse `bx-model`, `bx-bind`, `bx-compute` attributes
- Extract configuration from kebab-case attributes
- Support colon syntax: `bx-model="user.name:300"` (path:debounce)
- JSON options: `bx-opts='{"debounce":300}'`

---

### Task 4.2: Implement DOM Scanner
**Duration**: 1 hour

**Implementation Process** (abbreviated):
- Scan document for `[bx-model]`, `[bx-bind]`, `[bx-compute]`
- Create bindings automatically on page load
- DOMContentLoaded event integration
- Manual scan API: `bindX.scan(rootElement)`

---

### Task 4.3: Implement MutationObserver
**Duration**: 45 minutes

**Implementation Process** (abbreviated):
- Observe childList, attributes, subtree
- Auto-bind dynamically added elements
- Cleanup bindings when elements removed
- Throttle scanning for performance

---

## Phase 5: Collection Binding
**Duration**: 2 hours 30 minutes
**Dependencies**: Phase 2, Phase 4
**Risk Level**: Medium

### Objectives
- [x] Implement `bx-each` for arrays
- [x] Efficient DOM diffing algorithm
- [x] Key-based reconciliation
- [x] Array mutation tracking

### Task 5.1: Implement Array Reactivity
**Duration**: 1 hour 30 minutes

**Implementation Process** (abbreviated):
- Wrap array methods (push, pop, splice, etc.)
- Trigger updates on mutations
- Track array length changes

---

### Task 5.2: Implement Collection Binding
**Duration**: 1 hour

**Implementation Process** (abbreviated):
- Template cloning for each item
- Efficient DOM diffing (minimize DOM ops)
- Key attribute for stable identity
- Nested binding contexts

---

## Phase 6: Framework Adapters (Phase 1)
**Duration**: 2 hours
**Dependencies**: Phases 1-4 complete
**Risk Level**: Low

### Objectives
- [x] React hooks (useBindX, useBindXModel)
- [x] Vue composable (useBindX)
- [x] Svelte store bridge (bindxStore)

### Task 6.1: React Adapter
**Duration**: 45 minutes

**Implementation Process** (abbreviated):
- Create `useBindX` hook that returns [state, setState] tuple
- Integrate with React's useState/useEffect
- Cleanup on unmount
- Publish as `@genx/bindx-react`

---

### Task 6.2: Vue Adapter
**Duration**: 45 minutes

**Implementation Process** (abbreviated):
- Create Vue 3 composable `useBindX`
- Integrate with Vue's reactive() system
- watchEffect for bidirectional sync
- Publish as `@genx/bindx-vue`

---

### Task 6.3: Svelte Adapter
**Duration**: 30 minutes

**Implementation Process** (abbreviated):
- Create Svelte store with subscribe/set/update
- Bridge bindX reactivity to Svelte stores
- Publish as `@genx/bindx-svelte`

---

## Testing Strategy

### BDD Feature Coverage
Every major feature has dedicated `.feature` file:
- `bindx-reactive-proxy.feature`
- `bindx-two-way-binding.feature`
- `bindx-one-way-binding.feature`
- `bindx-computed-properties.feature`
- `bindx-collection-binding.feature`
- `bindx-dom-integration.feature`

### Unit Test Coverage
Target: >90% line coverage

**Test Categories**:
1. **Reactive Engine**: Proxy traps, change detection, notifications
2. **Bindings**: Model, bind, computed integration
3. **Computed**: Dependency tracking, memoization, circular detection
4. **DOM**: Scanning, observer, attribute parsing
5. **Collections**: Array reactivity, diffing, reconciliation
6. **Performance**: Batching, RAF scheduling, memory leaks

### Integration Tests
- Full page scenarios with multiple bindings
- Framework adapter integration
- Cross-module integration (fmtX + bindX)

### Performance Benchmarks
```javascript
describe('Performance Benchmarks', () => {
    it('creates 1000 bindings in <100ms', async () => {
        // Benchmark setup
        const elements = createMockElements(1000);
        const data = bindx({ values: Array(1000).fill(0) });

        const start = performance.now();

        elements.forEach((el, i) => {
            bind(el, `values.${i}`, data);
        });

        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100);
    });

    it('updates 1000 bindings in <16ms', async () => {
        // Batch update benchmark
        const data = bindx({ value: 0 });
        // ... create 1000 bindings

        const start = performance.now();
        data.value = 999; // Triggers all updates
        await flushBatchQueue();
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(16);
    });

    it('computed property evaluation <1ms', () => {
        const data = bindx({ a: 1, b: 2, c: 3 });
        const sum = computed(() => data.a + data.b + data.c);

        const start = performance.now();
        const result = sum();
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(1);
    });
});
```

---

## Risk Management

### Risk 1: Infinite Loop in Two-Way Binding
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Prevent update if value unchanged (strict equality check)
- Guard in both DOM→data and data→DOM paths
- Unit test specifically for this scenario

**Contingency**: Add update cycle counter, throw error if >10 updates in single frame

### Risk 2: Memory Leaks in Long-Running Apps
**Probability**: Medium
**Impact**: High
**Mitigation**:
- WeakMap for all element associations
- Explicit cleanup in destroy() methods
- Chrome DevTools heap snapshot testing

**Contingency**: Add manual `bindX.cleanup()` API for aggressive GC

### Risk 3: Performance Degradation with Deep Nesting
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Shallow mode option: `bindx(data, { deep: false })`
- Performance warnings in dev mode
- Documentation of best practices

**Contingency**: Provide `bindx.optimize(data, paths)` for selective deep reactivity

### Risk 4: Proxy API Browser Support
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Document ES6+ requirement clearly
- Provide proxy-polyfill reference
- Feature detection on init

**Contingency**: Fallback to getter/setter based reactivity for IE11

---

## Rollback Procedures

### Phase-Level Rollback
Each phase is independently revertable:

```bash
# Rollback Phase 3 (Computed Properties)
git log --oneline --grep="bindx.*computed"
git revert <commit-hash-1> <commit-hash-2> ...
npm test -- tests/features/bindx-*.feature
# Verify Phases 1, 2, 4, 5 still work
```

### Complete Module Rollback
```bash
# Remove bindX entirely
git log --oneline --grep="bindx"
git revert <first-commit>..<last-commit>
rm /Users/adam/dev/genX/src/bindx.js
rm -rf /Users/adam/dev/genX/tests/features/bindx-*.feature
npm test # Verify fmtX, accX unaffected
```

### Emergency Hotfix Procedure
1. Create hotfix branch from main
2. Apply minimal fix
3. Run full test suite (must pass 100%)
4. Fast-forward merge to main
5. Deploy to CDN
6. Notify users via changelog

---

## Success Criteria

### Task-Level Completion
Each task is ONLY complete when ALL 8 steps executed:
- [x] Start time captured
- [x] BDD feature file created
- [x] Test fixtures implemented
- [x] Red test verified (tests fail initially)
- [x] Implementation code written
- [x] Green test achieved (100% pass rate)
- [x] Code committed with proper message
- [x] End time captured

### Phase-Level Completion
- [x] All tasks in phase complete
- [x] All BDD tests passing (100%)
- [x] Test coverage >90%
- [x] Performance benchmarks met
- [x] Architecture compliance verified
- [x] Documentation updated

### Project-Level Completion
- [x] All 6 phases complete
- [x] Bundle size ≤3KB gzipped
- [x] All 500+ tests passing
- [x] Performance: <0.5ms per binding update
- [x] Lighthouse score: 100 maintained
- [x] Framework adapters published to npm
- [x] Documentation complete
- [x] Example applications working

---

## Progress Tracking

### Metrics Dashboard
```markdown
**Implementation Progress**
- Phases Complete: 0/6 (0%)
- Tasks Complete: 0/18 (0%)
- BDD Tests Passing: 0/500 (0%)
- Code Coverage: 0%
- Bundle Size: 0KB / 3KB target
- Performance: Not measured

**Time Tracking**
- Estimated Total: 18h 45m
- Actual Elapsed: 0h 0m
- Variance: 0%
- Velocity: 0 tasks/hour
```

### Daily Updates
```markdown
### Day 1 Progress (YYYY-MM-DD)
**Completed**:
- [ ] Task 1.1: Reactive Proxy Wrapper
- [ ] Task 1.2: Dependency Tracking

**Blockers**: None

**Next Actions**:
- [ ] Task 1.3: Batched Updates
```

---

## Appendix A: File Structure

```
/Users/adam/dev/genX/
├── src/
│   └── bindx.js                          # Main implementation (3KB target)
├── tests/
│   ├── unit/
│   │   └── bindx.test.js                 # Unit tests
│   ├── features/
│   │   ├── bindx-reactive-proxy.feature
│   │   ├── bindx-two-way-binding.feature
│   │   ├── bindx-one-way-binding.feature
│   │   ├── bindx-computed-properties.feature
│   │   ├── bindx-collection-binding.feature
│   │   └── bindx-dom-integration.feature
│   └── fixtures/
│       ├── bindx_fixtures.js
│       ├── dependency_fixtures.js
│       ├── registry_fixtures.js
│       ├── binding_fixtures.js
│       └── computed_fixtures.js
├── docs/
│   ├── architecture/
│   │   └── bindx-technical-architecture-v1_0.md
│   └── implementation/
│       └── 01-bindx-implementation-plan-v1_0.md (this file)
└── examples/
    ├── basic-binding.html
    ├── computed-demo.html
    ├── collection-demo.html
    └── framework-integration/
        ├── react-demo/
        ├── vue-demo/
        └── svelte-demo/
```

---

## Appendix B: Key Function Signatures

```javascript
/**
 * Create reactive data object
 */
const bindx = (
    data: Object,
    options?: {
        deep?: boolean,
        onChange?: (path: string, value: any) => void
    }
) => Proxy<typeof data>

/**
 * Create two-way binding
 */
const bind = (
    element: HTMLElement,
    path: string,
    data: ReactiveData,
    options?: {
        type?: 'model' | 'bind' | 'compute',
        debounce?: number,
        formatter?: string
    }
) => Binding

/**
 * Create computed property
 */
const computed = <T>(
    computeFn: () => T
) => () => T

/**
 * Scan DOM for bindings
 */
const scan = (
    root?: Element
) => void

/**
 * Destroy all bindings
 */
const destroy = () => void
```

---

## Appendix C: Browser Compatibility

**Minimum Requirements**:
- Proxy API (ES6) - 95% browser support
- MutationObserver - 99% browser support
- requestAnimationFrame - 99% browser support
- WeakMap - 98% browser support

**Supported Browsers**:
- Chrome 49+
- Firefox 52+
- Safari 10+
- Edge 15+

**Polyfills Available**:
- proxy-polyfill for IE11 (adds 5KB)

---

**Document Status**: Ready for Execution
**Next Step**: Begin Phase 1, Task 1.1
**Approval Required**: Architecture Lead sign-off before starting

---

**Revision History**:
- v1.0 (2025-11-09): Initial implementation plan created
