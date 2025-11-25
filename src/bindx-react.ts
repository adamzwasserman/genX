/**
 * bindX React Framework Adapter
 *
 * @module @genx/bindx-react
 * @version 1.0.0
 * @description React integration adapter for bindX reactive state management
 * @author genX Framework Team
 * @license MIT
 *
 * @example
 * // Counter Example with React Hooks
 * import React from 'react';
 * import { useBindX } from '@genx/bindx-react';
 *
 * function Counter() {
 *   const state = useBindX({ count: 0 });
 *   const doubled = useComputed(() => state.count * 2);
 *
 *   const increment = () => state.count++;
 *   const decrement = () => state.count--;
 *   const reset = () => state.count = 0;
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <p>Double: {doubled()}</p>
 *       <button onClick={increment}>+</button>
 *       <button onClick={decrement}>-</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Todo List with Filtering
 * import React, { useState } from 'react';
 * import { useBindX, useComputed } from '@genx/bindx-react';
 *
 * interface Todo {
 *   id: number;
 *   text: string;
 *   completed: boolean;
 * }
 *
 * type FilterType = 'all' | 'active' | 'completed';
 *
 * function TodoList() {
 *   const state = useBindX({
 *     todos: [] as Todo[],
 *     filter: 'all' as FilterType
 *   });
 *
 *   const [newTodoText, setNewTodoText] = useState('');
 *
 *   const filteredTodos = useComputed(() => {
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
 *   const remainingCount = useComputed(() =>
 *     state.todos.filter(t => !t.completed).length
 *   );
 *
 *   const addTodo = () => {
 *     if (!newTodoText.trim()) return;
 *
 *     state.todos.push({
 *       id: Date.now(),
 *       text: newTodoText,
 *       completed: false
 *     });
 *
 *     setNewTodoText('');
 *   };
 *
 *   const toggleTodo = (id: number) => {
 *     const todo = state.todos.find(t => t.id === id);
 *     if (todo) {
 *       todo.completed = !todo.completed;
 *     }
 *   };
 *
 *   const removeTodo = (id: number) => {
 *     const index = state.todos.findIndex(t => t.id === id);
 *     if (index !== -1) {
 *       state.todos.splice(index, 1);
 *     }
 *   };
 *
 *   const setFilter = (filter: FilterType) => {
 *     state.filter = filter;
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         value={newTodoText}
 *         onChange={e => setNewTodoText(e.target.value)}
 *         onKeyPress={e => e.key === 'Enter' && addTodo()}
 *         placeholder="Add todo"
 *       />
 *
 *       <div>
 *         <button onClick={() => setFilter('all')}>All</button>
 *         <button onClick={() => setFilter('active')}>Active</button>
 *         <button onClick={() => setFilter('completed')}>Completed</button>
 *       </div>
 *
 *       <ul>
 *         {filteredTodos().map(todo => (
 *           <li key={todo.id}>
 *             <input
 *               type="checkbox"
 *               checked={todo.completed}
 *               onChange={() => toggleTodo(todo.id)}
 *             />
 *             <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
 *               {todo.text}
 *             </span>
 *             <button onClick={() => removeTodo(todo.id)}>×</button>
 *           </li>
 *         ))}
 *       </ul>
 *
 *       <p>{remainingCount()} items left</p>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Form with Validation
 * import React from 'react';
 * import { useBindX, useWatch } from '@genx/bindx-react';
 *
 * function SignupForm() {
 *   const form = useBindX({
 *     username: '',
 *     email: '',
 *     password: '',
 *     errors: {} as Record<string, string>
 *   });
 *
 *   // Watch username for validation
 *   useWatch(
 *     () => form.username,
 *     (username) => {
 *       if (username.length > 0 && username.length < 3) {
 *         form.errors.username = 'Username must be at least 3 characters';
 *       } else {
 *         delete form.errors.username;
 *       }
 *     }
 *   );
 *
 *   // Watch email for validation
 *   useWatch(
 *     () => form.email,
 *     (email) => {
 *       if (email.length > 0 && !email.includes('@')) {
 *         form.errors.email = 'Invalid email address';
 *       } else {
 *         delete form.errors.email;
 *       }
 *     }
 *   );
 *
 *   const hasErrors = useComputed(() =>
 *     Object.keys(form.errors).length > 0
 *   );
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     if (!hasErrors()) {
 *       console.log('Form submitted:', form);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <div>
 *         <input
 *           type="text"
 *           value={form.username}
 *           onChange={e => form.username = e.target.value}
 *           placeholder="Username"
 *         />
 *         {form.errors.username && <span>{form.errors.username}</span>}
 *       </div>
 *
 *       <div>
 *         <input
 *           type="email"
 *           value={form.email}
 *           onChange={e => form.email = e.target.value}
 *           placeholder="Email"
 *         />
 *         {form.errors.email && <span>{form.errors.email}</span>}
 *       </div>
 *
 *       <div>
 *         <input
 *           type="password"
 *           value={form.password}
 *           onChange={e => form.password = e.target.value}
 *           placeholder="Password"
 *         />
 *       </div>
 *
 *       <button type="submit" disabled={hasErrors()}>
 *         Sign Up
 *       </button>
 *     </form>
 *   );
 * }
 */

import { useEffect, useRef, useState, useMemo, useCallback, createContext, useContext } from 'react';
import type { DependencyList } from 'react';

// Import bindX core (would be from actual bindX module)
declare const bindX: {
  reactive<T extends object>(obj: T): T;
  computed<T>(getter: () => T): () => T;
  watch<T>(
    getter: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean; deep?: boolean }
  ): () => void;
};

/**
 * Type definition for unwatcher function
 */
export type UnwatchFn = () => void;

/**
 * Type definition for computed getter
 */
export type ComputedGetter<T> = () => T;

/**
 * Type definition for watch callback
 */
export type WatchCallback<T> = (newValue: T, oldValue: T) => void;

/**
 * Options for bindX watchers
 */
export interface BindXWatchOptions {
  immediate?: boolean;
  deep?: boolean;
}

/**
 * Counter for forcing re-renders
 */
let renderCounter = 0;

/**
 * React hook for bindX reactive state management
 *
 * @template T - Type of state object
 * @param {T | (() => T)} initialState - Initial state object or factory function
 * @returns {T} Reactive proxy that triggers React re-renders
 *
 * @example
 * const state = useBindX({ count: 0, user: { name: 'John' } });
 *
 * // Changes trigger re-renders
 * state.count++;
 * state.user.name = 'Jane';
 */
export function useBindX<T extends object>(initialState: T | (() => T)): T {
  // Force re-render mechanism
  const [, setRenderCount] = useState(0);
  const forceRender = useCallback(() => {
    setRenderCount(++renderCounter);
  }, []);

  // Create reactive state once and maintain identity
  const stateRef = useRef<T | null>(null);

  if (stateRef.current === null) {
    const initial = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
    const reactive = bindX.reactive(initial);

    // Wrap to trigger React re-renders
    stateRef.current = new Proxy(reactive, {
      set(target, property, value, receiver) {
        const result = Reflect.set(target, property, value, receiver);
        forceRender();
        return result;
      },
      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        forceRender();
        return result;
      }
    });
  }

  return stateRef.current;
}

/**
 * React hook for bindX computed properties
 *
 * @template T - Return type of computed property
 * @param {() => T} getter - Getter function
 * @returns {() => T} Computed getter function
 *
 * @example
 * const state = useBindX({ count: 0 });
 * const doubled = useComputed(() => state.count * 2);
 *
 * console.log(doubled()); // 0
 * state.count = 5;
 * console.log(doubled()); // 10
 */
export function useComputed<T>(getter: () => T): ComputedGetter<T> {
  const computedRef = useRef<ComputedGetter<T> | null>(null);

  if (computedRef.current === null) {
    computedRef.current = bindX.computed(getter);
  }

  return computedRef.current;
}

/**
 * React hook for bindX watchers with automatic cleanup
 *
 * @template T - Type of watched value
 * @param {() => T} getter - Getter function to watch
 * @param {WatchCallback<T>} callback - Callback when value changes
 * @param {BindXWatchOptions} [options] - Watch options
 * @param {DependencyList} [deps=[]] - React dependencies
 *
 * @example
 * const state = useBindX({ userId: 1 });
 *
 * useWatch(
 *   () => state.userId,
 *   (newId, oldId) => {
 *     console.log(`User ID changed from ${oldId} to ${newId}`);
 *     fetchUser(newId);
 *   },
 *   { immediate: true }
 * );
 */
export function useWatch<T>(
  getter: () => T,
  callback: WatchCallback<T>,
  options?: BindXWatchOptions,
  deps: DependencyList = []
): void {
  useEffect(() => {
    const unwatch = bindX.watch(getter, callback, options);
    return () => {
      unwatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * React hook for creating a custom counter
 *
 * @param {number} [initial=0] - Initial count value
 * @returns {Object} Counter state and methods
 *
 * @example
 * const { count, increment, decrement, reset } = useCounter(10);
 *
 * <button onClick={increment}>{count()}</button>
 */
export function useCounter(initial: number = 0) {
  const state = useBindX({ count: initial });
  const count = useComputed(() => state.count);

  const increment = useCallback(() => {
    state.count++;
  }, [state]);

  const decrement = useCallback(() => {
    state.count--;
  }, [state]);

  const reset = useCallback(() => {
    state.count = initial;
  }, [state, initial]);

  return {
    count,
    increment,
    decrement,
    reset,
    state
  };
}

/**
 * React hook for toggle functionality
 *
 * @param {boolean} [initial=false] - Initial toggle value
 * @returns {Object} Toggle state and methods
 *
 * @example
 * const { isOpen, toggle, open, close } = useToggle();
 *
 * <button onClick={toggle}>{isOpen() ? 'Close' : 'Open'}</button>
 */
export function useToggle(initial: boolean = false) {
  const state = useBindX({ value: initial });
  const isOpen = useComputed(() => state.value);

  const toggle = useCallback(() => {
    state.value = !state.value;
  }, [state]);

  const open = useCallback(() => {
    state.value = true;
  }, [state]);

  const close = useCallback(() => {
    state.value = false;
  }, [state]);

  return {
    isOpen,
    toggle,
    open,
    close,
    state
  };
}

/**
 * React hook for array management
 *
 * @template T - Type of array items
 * @param {T[]} [initial=[]] - Initial array
 * @returns {Object} Array state and methods
 *
 * @example
 * const { items, push, remove, clear, count } = useArray<string>(['a', 'b']);
 *
 * push('c');
 * remove(0);
 * console.log(count()); // 2
 */
export function useArray<T>(initial: T[] = []) {
  const state = useBindX({ items: [...initial] });

  const items = useComputed(() => state.items);
  const count = useComputed(() => state.items.length);
  const isEmpty = useComputed(() => state.items.length === 0);

  const push = useCallback((item: T) => {
    state.items.push(item);
  }, [state]);

  const remove = useCallback((index: number) => {
    if (index >= 0 && index < state.items.length) {
      state.items.splice(index, 1);
    }
  }, [state]);

  const clear = useCallback(() => {
    state.items = [];
  }, [state]);

  const filter = useCallback((predicate: (item: T) => boolean) => {
    state.items = state.items.filter(predicate);
  }, [state]);

  return {
    items,
    count,
    isEmpty,
    push,
    remove,
    clear,
    filter,
    state
  };
}

/**
 * React hook for form management
 *
 * @template T - Type of form data
 * @param {T} initialData - Initial form data
 * @returns {Object} Form state and methods
 *
 * @example
 * const form = useForm({
 *   username: '',
 *   email: '',
 *   password: ''
 * });
 *
 * <input
 *   value={form.data.username}
 *   onChange={e => form.data.username = e.target.value}
 * />
 * <button onClick={form.submit}>Submit</button>
 */
export function useForm<T extends Record<string, any>>(initialData: T) {
  const state = useBindX({
    data: { ...initialData },
    errors: {} as Record<keyof T, string>,
    isDirty: false,
    isSubmitting: false
  });

  const hasErrors = useComputed(() => Object.keys(state.errors).length > 0);

  const reset = useCallback(() => {
    state.data = { ...initialData };
    state.errors = {} as Record<keyof T, string>;
    state.isDirty = false;
    state.isSubmitting = false;
  }, [state, initialData]);

  const setError = useCallback((field: keyof T, message: string) => {
    state.errors[field] = message;
  }, [state]);

  const clearError = useCallback((field: keyof T) => {
    delete state.errors[field];
  }, [state]);

  const clearErrors = useCallback(() => {
    state.errors = {} as Record<keyof T, string>;
  }, [state]);

  const submit = useCallback(async (handler: (data: T) => Promise<void>) => {
    if (state.isSubmitting) return;

    state.isSubmitting = true;
    clearErrors();

    try {
      await handler(state.data);
      state.isDirty = false;
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      state.isSubmitting = false;
    }
  }, [state, clearErrors]);

  // Watch for changes to mark as dirty
  useWatch(
    () => JSON.stringify(state.data),
    () => {
      state.isDirty = true;
    }
  );

  return {
    data: state.data,
    errors: state.errors,
    isDirty: hasErrors,
    isSubmitting: useComputed(() => state.isSubmitting),
    hasErrors,
    reset,
    setError,
    clearError,
    clearErrors,
    submit,
    state
  };
}

/**
 * React hook for async data fetching
 *
 * @template T - Type of fetched data
 * @param {() => Promise<T>} fetcher - Async function to fetch data
 * @param {Object} [options] - Fetch options
 * @returns {Object} Async state and methods
 *
 * @example
 * const { data, loading, error, refetch } = useAsync(
 *   () => fetch('/api/users').then(r => r.json()),
 *   { immediate: true }
 * );
 *
 * if (loading()) return <div>Loading...</div>;
 * if (error()) return <div>Error: {error().message}</div>;
 * return <div>{JSON.stringify(data())}</div>;
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  options: { immediate?: boolean; deps?: DependencyList } = {}
) {
  const state = useBindX({
    data: null as T | null,
    loading: false,
    error: null as Error | null
  });

  const data = useComputed(() => state.data);
  const loading = useComputed(() => state.loading);
  const error = useComputed(() => state.error);

  const execute = useCallback(async () => {
    state.loading = true;
    state.error = null;

    try {
      state.data = await fetcher();
    } catch (err) {
      state.error = err as Error;
    } finally {
      state.loading = false;
    }
  }, [state, fetcher]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps || []);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    state
  };
}

/**
 * Create a React Context for bindX state
 *
 * @template T - Type of state
 * @param {T} [defaultValue] - Default context value
 * @returns {Object} Context and hooks
 *
 * @example
 * // Create context
 * const UserContext = createBindXContext({ user: null, isAuthenticated: false });
 *
 * // Provider
 * function App() {
 *   const state = useBindX({ user: null, isAuthenticated: false });
 *
 *   return (
 *     <UserContext.Provider value={state}>
 *       <UserProfile />
 *     </UserContext.Provider>
 *   );
 * }
 *
 * // Consumer
 * function UserProfile() {
 *   const userState = UserContext.useContext();
 *   return <div>{userState.user?.name}</div>;
 * }
 */
export function createBindXContext<T extends object>(defaultValue?: T) {
  const Context = createContext<T | undefined>(defaultValue);

  const useBindXContext = () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useBindXContext must be used within a Provider');
    }
    return context;
  };

  return {
    Context,
    Provider: Context.Provider,
    Consumer: Context.Consumer,
    useContext: useBindXContext
  };
}

/**
 * Create a global bindX store that persists across component instances
 *
 * @template T - Type of store state
 * @param {T} initialState - Initial store state
 * @returns {() => T} Hook to access the store
 *
 * @example
 * // store.ts
 * export const useGlobalStore = createGlobalStore({
 *   currentUser: null,
 *   isAuthenticated: false
 * });
 *
 * // Component A
 * function ComponentA() {
 *   const store = useGlobalStore();
 *   store.currentUser = { id: 1, name: 'John' };
 * }
 *
 * // Component B - sees the same state
 * function ComponentB() {
 *   const store = useGlobalStore();
 *   return <div>{store.currentUser?.name}</div>;
 * }
 */
export function createGlobalStore<T extends object>(initialState: T): () => T {
  const globalState = bindX.reactive(initialState);

  return function useGlobalStore(): T {
    const [, setRenderCount] = useState(0);
    const forceRender = useCallback(() => {
      setRenderCount(++renderCounter);
    }, []);

    // Create proxy that triggers re-renders
    const proxyRef = useRef<T | null>(null);

    if (proxyRef.current === null) {
      proxyRef.current = new Proxy(globalState, {
        set(target, property, value, receiver) {
          const result = Reflect.set(target, property, value, receiver);
          forceRender();
          return result;
        }
      });
    }

    return proxyRef.current;
  };
}

/**
 * Higher-order component to inject bindX state as props
 *
 * @template P - Props type
 * @template S - State type
 * @param {React.ComponentType<P & S>} Component - Component to wrap
 * @param {S | (() => S)} initialState - Initial state or factory
 * @returns {React.ComponentType<P>} Wrapped component
 *
 * @example
 * interface Props {
 *   title: string;
 * }
 *
 * function Counter({ title, count, increment }: Props & { count: number; increment: () => void }) {
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>+</button>
 *     </div>
 *   );
 * }
 *
 * const CounterWithState = withBindX(Counter, { count: 0, increment: function() { this.count++; } });
 */
export function withBindX<P extends object, S extends object>(
  Component: React.ComponentType<P & S>,
  initialState: S | (() => S)
): React.ComponentType<P> {
  return function WithBindXComponent(props: P) {
    const state = useBindX(initialState);
    return <Component {...props} {...state} />;
  };
}

// Re-export types for convenience
export type { DependencyList };

// Default export
export default {
  useBindX,
  useComputed,
  useWatch,
  useCounter,
  useToggle,
  useArray,
  useForm,
  useAsync,
  createBindXContext,
  createGlobalStore,
  withBindX
};
