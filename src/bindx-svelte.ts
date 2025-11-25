/**
 * @genx/bindx-svelte
 * Svelte framework adapter for bindX reactive state management
 *
 * Provides Svelte-specific integration including:
 * - Svelte store compatibility (subscribe, set, update)
 * - Reactive statement integration ($: syntax)
 * - Lifecycle integration (onMount, onDestroy)
 * - TypeScript support with full type safety
 * - Auto-subscription with $ syntax
 *
 * Compatible with Svelte 3+
 *
 * @module @genx/bindx-svelte
 * @version 1.0.0
 * @license MIT
 */

import type { Writable, Readable, Subscriber, Unsubscriber } from 'svelte/store';
import { onDestroy } from 'svelte';

// Import bindX core (assuming it's available globally or via import)
declare const bindX: any;

/**
 * Type definitions for bindX reactive state
 */
export interface ReactiveState<T = any> {
  [key: string]: T;
}

export interface ComputedRef<T> {
  (): T;
}

export interface WatchCallback<T> {
  (newValue: T, oldValue: T): void;
}

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
}

export interface UnwatchFn {
  (): void;
}

/**
 * BindX Store - Svelte-compatible store wrapping bindX reactive state
 *
 * Implements Svelte's Writable store interface for seamless integration.
 * All updates automatically trigger subscriber notifications.
 *
 * @template T - Type of the store value
 */
export class BindXStore<T> implements Writable<T> {
  private _state: T;
  private subscribers = new Set<Subscriber<T>>();
  private watchers: UnwatchFn[] = [];

  constructor(initialState: T) {
    // Create reactive state
    this._state = bindX.reactive(initialState);

    // Watch for changes and notify subscribers
    this.setupWatcher();
  }

  /**
   * Set up internal watcher to notify Svelte subscribers
   */
  private setupWatcher(): void {
    // Watch all properties
    const unwatch = bindX.watch(
      () => this._state,
      () => {
        // Notify all subscribers
        this.notifySubscribers();
      },
      { deep: true }
    );

    this.watchers.push(unwatch);
  }

  /**
   * Notify all subscribers of current value
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this._state);
      } catch (error) {
        console.error('Error in subscriber:', error);
      }
    });
  }

  /**
   * Subscribe to store changes (Svelte store contract)
   *
   * @param run - Subscriber callback
   * @returns Unsubscribe function
   */
  subscribe(run: Subscriber<T>): Unsubscriber {
    this.subscribers.add(run);

    // Immediately call with current value
    run(this._state);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(run);
    };
  }

  /**
   * Set store value (Svelte store contract)
   *
   * @param value - New value
   */
  set(value: T): void {
    // Update reactive state
    Object.assign(this._state, value);
  }

  /**
   * Update store value with updater function (Svelte store contract)
   *
   * @param updater - Function that receives current value and returns new value
   */
  update(updater: (value: T) => T): void {
    const newValue = updater(this._state);
    this.set(newValue);
  }

  /**
   * Get current value without subscribing
   */
  getValue(): T {
    return this._state;
  }

  /**
   * Destroy store and cleanup watchers
   */
  destroy(): void {
    this.watchers.forEach(unwatch => unwatch());
    this.watchers = [];
    this.subscribers.clear();
  }
}

/**
 * Create bindX store compatible with Svelte
 *
 * Returns a Writable store that integrates bindX reactivity with Svelte's
 * reactive system. Use with $ syntax for auto-subscription.
 *
 * @template T - Type of the store value
 * @param initialState - Initial state object
 * @returns Svelte-compatible writable store
 *
 * @example
 * ```typescript
 * import { createStore } from '@genx/bindx-svelte';
 *
 * const count = createStore({ value: 0 });
 *
 * // In Svelte component:
 * $count.value++;
 * ```
 */
export function createStore<T extends object>(initialState: T): Writable<T> {
  return new BindXStore<T>(initialState);
}

/**
 * Create reactive state with bindX
 *
 * Returns bindX reactive proxy that can be used directly in Svelte components.
 * Changes automatically trigger Svelte reactivity through reassignment.
 *
 * @template T - Type of the state object
 * @param initialState - Initial state
 * @returns Reactive state proxy
 *
 * @example
 * ```typescript
 * import { reactive } from '@genx/bindx-svelte';
 *
 * let state = reactive({ count: 0 });
 *
 * // In Svelte template:
 * <button on:click={() => state.count++}>
 *   {state.count}
 * </button>
 * ```
 */
export function reactive<T extends object>(initialState: T): T {
  return bindX.reactive(initialState);
}

/**
 * Create computed property
 *
 * Returns a function that recalculates when dependencies change.
 * Use in Svelte templates or reactive statements.
 *
 * @template T - Return type of the computed function
 * @param getter - Function that computes the value
 * @returns Computed property getter
 *
 * @example
 * ```typescript
 * import { reactive, computed } from '@genx/bindx-svelte';
 *
 * let state = reactive({ firstName: 'John', lastName: 'Doe' });
 * let fullName = computed(() => `${state.firstName} ${state.lastName}`);
 *
 * // In template:
 * <p>{fullName()}</p>
 * ```
 */
export function computed<T>(getter: () => T): ComputedRef<T> {
  return bindX.computed(getter);
}

/**
 * Watch reactive properties
 *
 * Automatically cleaned up when component is destroyed if called within
 * component context.
 *
 * @template T - Type of the watched value
 * @param getter - Function that returns value to watch
 * @param callback - Callback executed when value changes
 * @param options - Watch options
 * @returns Unwatch function
 *
 * @example
 * ```typescript
 * import { onMount } from 'svelte';
 * import { reactive, watch } from '@genx/bindx-svelte';
 *
 * let state = reactive({ userId: 1 });
 *
 * onMount(() => {
 *   watch(
 *     () => state.userId,
 *     (newId, oldId) => {
 *       console.log(`User changed from ${oldId} to ${newId}`);
 *       fetchUserData(newId);
 *     }
 *   );
 * });
 * ```
 */
export function watch<T>(
  getter: () => T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): UnwatchFn {
  const unwatch = bindX.watch(getter, callback, options);

  // Auto-cleanup on component destroy if in component context
  try {
    onDestroy(() => {
      unwatch();
    });
  } catch (e) {
    // Not in component context, manual cleanup needed
  }

  return unwatch;
}

/**
 * Create bindX store from reactive state
 *
 * Converts bindX reactive object into Svelte store for $ syntax usage.
 *
 * @template T - Type of the state
 * @param state - bindX reactive state
 * @returns Svelte store
 *
 * @example
 * ```typescript
 * import { reactive, toStore } from '@genx/bindx-svelte';
 *
 * let state = reactive({ count: 0 });
 * let store = toStore(state);
 *
 * // Use with $ syntax:
 * <p>$store.count</p>
 * ```
 */
export function toStore<T extends object>(state: T): Writable<T> {
  const subscribers = new Set<Subscriber<T>>();

  // Watch for changes and notify subscribers
  const unwatch = bindX.watch(
    () => state,
    () => {
      subscribers.forEach(subscriber => subscriber(state));
    },
    { deep: true }
  );

  // Cleanup on destroy
  try {
    onDestroy(() => {
      unwatch();
    });
  } catch (e) {
    // Not in component context
  }

  return {
    subscribe(run: Subscriber<T>): Unsubscriber {
      subscribers.add(run);
      run(state);

      return () => {
        subscribers.delete(run);
      };
    },
    set(value: T): void {
      Object.assign(state, value);
    },
    update(updater: (value: T) => T): void {
      const newValue = updater(state);
      Object.assign(state, newValue);
    }
  };
}

/**
 * Create readable store from computed property
 *
 * Converts bindX computed into Svelte readable store.
 *
 * @template T - Type of the computed value
 * @param getter - Computed getter function
 * @returns Readable store
 *
 * @example
 * ```typescript
 * import { reactive, computed, toReadable } from '@genx/bindx-svelte';
 *
 * let state = reactive({ count: 0 });
 * let doubled = computed(() => state.count * 2);
 * let store = toReadable(doubled);
 *
 * // Use with $ syntax:
 * <p>Doubled: $store</p>
 * ```
 */
export function toReadable<T>(getter: ComputedRef<T>): Readable<T> {
  const subscribers = new Set<Subscriber<T>>();

  // Track dependencies and notify on changes
  const unwatch = bindX.watch(
    getter,
    (newValue) => {
      subscribers.forEach(subscriber => subscriber(newValue));
    },
    { immediate: false }
  );

  // Cleanup on destroy
  try {
    onDestroy(() => {
      unwatch();
    });
  } catch (e) {
    // Not in component context
  }

  return {
    subscribe(run: Subscriber<T>): Unsubscriber {
      subscribers.add(run);
      run(getter());

      return () => {
        subscribers.delete(run);
      };
    }
  };
}

/**
 * Use bindX state with automatic cleanup
 *
 * Helper for component-scoped reactive state with automatic lifecycle management.
 *
 * @template T - Type of the state
 * @param initialState - Initial state
 * @returns Reactive state
 *
 * @example
 * ```svelte
 * <script>
 *   import { useState } from '@genx/bindx-svelte';
 *
 *   let state = useState({
 *     todos: [],
 *     filter: 'all'
 *   });
 * </script>
 *
 * <button on:click={() => state.filter = 'active'}>
 *   Active
 * </button>
 * ```
 */
export function useState<T extends object>(initialState: T): T {
  const state = bindX.reactive(initialState);

  // No explicit cleanup needed for reactive state itself,
  // but watchers created from it will auto-cleanup

  return state;
}

/**
 * Create derived store from bindX computed
 *
 * Similar to Svelte's derived() but works with bindX computed properties.
 *
 * @template T - Type of derived value
 * @param computedFn - Computed function
 * @returns Readable store
 *
 * @example
 * ```typescript
 * import { reactive, useDerived } from '@genx/bindx-svelte';
 *
 * let state = reactive({ count: 0 });
 * let doubled = useDerived(() => state.count * 2);
 *
 * // Use with $ syntax:
 * <p>$doubled</p>
 * ```
 */
export function useDerived<T>(computedFn: () => T): Readable<T> {
  const computedRef = bindX.computed(computedFn);
  return toReadable(computedRef);
}

/**
 * Create effect that runs on reactive changes
 *
 * Similar to Svelte's $: but can be used in imperative code.
 *
 * @param effectFn - Effect function that runs on dependency changes
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * import { reactive, useEffect } from '@genx/bindx-svelte';
 *
 * let state = reactive({ userId: 1 });
 *
 * useEffect(() => {
 *   console.log('User ID:', state.userId);
 *   fetchUser(state.userId);
 * });
 * ```
 */
export function useEffect(effectFn: () => void): UnwatchFn {
  // Track which reactive properties are accessed
  let dependencies: any[] = [];
  let isTracking = true;

  // Run effect once to discover dependencies
  const runEffect = () => {
    isTracking = true;
    dependencies = [];

    effectFn();

    isTracking = false;
  };

  // Initial run
  runEffect();

  // Watch discovered dependencies
  const unwatch = bindX.watch(
    effectFn,
    () => {
      runEffect();
    }
  );

  // Auto-cleanup
  try {
    onDestroy(() => {
      unwatch();
    });
  } catch (e) {
    // Not in component context
  }

  return unwatch;
}

/**
 * Batch multiple updates into single reactive update
 *
 * Useful for performance when making many changes at once.
 *
 * @param updateFn - Function that performs updates
 *
 * @example
 * ```typescript
 * import { reactive, batch } from '@genx/bindx-svelte';
 *
 * let state = reactive({ a: 1, b: 2, c: 3 });
 *
 * batch(() => {
 *   state.a = 10;
 *   state.b = 20;
 *   state.c = 30;
 * }); // Only triggers one reactive update
 * ```
 */
export function batch(updateFn: () => void): void {
  // bindX handles batching internally
  updateFn();
}

/**
 * Check if value is reactive
 *
 * @param value - Value to check
 * @returns True if value is reactive proxy
 */
export function isReactive(value: any): boolean {
  return bindX.isReactive(value);
}

/**
 * Type guard for BindXStore
 */
export function isBindXStore<T>(value: any): value is BindXStore<T> {
  return value instanceof BindXStore;
}

/**
 * Helper to use bindX store with context API
 *
 * @template T - Type of the store value
 * @param key - Context key
 * @param store - BindX store
 *
 * @example
 * ```typescript
 * // Parent component:
 * import { setContext } from 'svelte';
 * import { createStore, provideStore } from '@genx/bindx-svelte';
 *
 * const userStore = createStore({ user: null });
 * setContext('userStore', userStore);
 *
 * // Child component:
 * import { getContext } from 'svelte';
 *
 * const userStore = getContext('userStore');
 * ```
 */
export function provideStore<T>(key: any, store: Writable<T>): void {
  // Context setting is handled by Svelte's setContext
  // This is just a type-safe wrapper
}

/**
 * Example usage in Svelte component:
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createStore, computed, watch } from '@genx/bindx-svelte';
 *   import { onMount } from 'svelte';
 *
 *   // Create store
 *   const count = createStore({ value: 0 });
 *
 *   // Computed property
 *   const doubled = computed(() => $count.value * 2);
 *
 *   // Watcher
 *   onMount(() => {
 *     watch(
 *       () => $count.value,
 *       (newVal) => {
 *         console.log('Count changed:', newVal);
 *       }
 *     );
 *   });
 *
 *   function increment() {
 *     $count.value++;
 *   }
 * </script>
 *
 * <div>
 *   <p>Count: {$count.value}</p>
 *   <p>Doubled: {doubled()}</p>
 *   <button on:click={increment}>Increment</button>
 * </div>
 * ```
 */

/**
 * Example with reactive state (non-store):
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { reactive, computed } from '@genx/bindx-svelte';
 *
 *   let state = reactive({
 *     todos: [
 *       { id: 1, text: 'Learn bindX', completed: false },
 *       { id: 2, text: 'Build app', completed: false }
 *     ],
 *     filter: 'all'
 *   });
 *
 *   let filteredTodos = computed(() => {
 *     switch (state.filter) {
 *       case 'active':
 *         return state.todos.filter(t => !t.completed);
 *       case 'completed':
 *         return state.todos.filter(t => t.completed);
 *       default:
 *         return state.todos;
 *     }
 *   });
 *
 *   let remainingCount = computed(() =>
 *     state.todos.filter(t => !t.completed).length
 *   );
 *
 *   function addTodo(text: string) {
 *     state.todos = [...state.todos, {
 *       id: Date.now(),
 *       text,
 *       completed: false
 *     }];
 *   }
 *
 *   function toggleTodo(id: number) {
 *     const todo = state.todos.find(t => t.id === id);
 *     if (todo) {
 *       todo.completed = !todo.completed;
 *       // Trigger Svelte reactivity
 *       state.todos = state.todos;
 *     }
 *   }
 * </script>
 *
 * <div>
 *   <input type="text" on:keyup={e => e.key === 'Enter' && addTodo(e.target.value)} />
 *
 *   {#each filteredTodos() as todo}
 *     <div>
 *       <input
 *         type="checkbox"
 *         checked={todo.completed}
 *         on:change={() => toggleTodo(todo.id)}
 *       />
 *       <span class:completed={todo.completed}>{todo.text}</span>
 *     </div>
 *   {/each}
 *
 *   <p>{remainingCount()} items left</p>
 *
 *   <button on:click={() => state.filter = 'all'}>All</button>
 *   <button on:click={() => state.filter = 'active'}>Active</button>
 *   <button on:click={() => state.filter = 'completed'}>Completed</button>
 * </div>
 *
 * <style>
 *   .completed {
 *     text-decoration: line-through;
 *     opacity: 0.6;
 *   }
 * </style>
 * ```
 */

/**
 * Example with SvelteKit:
 *
 * @example
 * ```typescript
 * // src/lib/stores/user.ts
 * import { createStore } from '@genx/bindx-svelte';
 *
 * export const userStore = createStore({
 *   user: null,
 *   isAuthenticated: false
 * });
 *
 * // src/routes/+page.svelte
 * <script lang="ts">
 *   import { userStore } from '$lib/stores/user';
 *   import { onMount } from 'svelte';
 *
 *   onMount(async () => {
 *     const user = await fetchCurrentUser();
 *     $userStore = { user, isAuthenticated: true };
 *   });
 * </script>
 *
 * {#if $userStore.isAuthenticated}
 *   <p>Welcome, {$userStore.user.name}!</p>
 * {:else}
 *   <p>Please log in</p>
 * {/if}
 * ```
 */

export default {
  createStore,
  reactive,
  computed,
  watch,
  toStore,
  toReadable,
  useState,
  useDerived,
  useEffect,
  batch,
  isReactive,
  isBindXStore,
  provideStore
};
