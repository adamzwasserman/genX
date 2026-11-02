/**
 * bindX Vue Framework Adapter
 *
 * @module @genx/bindx-vue
 * @version 1.0.0
 * @description Vue 3 integration adapter for bindX reactive state management
 * @author genX Framework Team
 * @license MIT
 *
 * @example
 * // Counter Example with Vue 3 Composition API
 * <template>
 *   <div>
 *     <p>Count: {{ state.count }}</p>
 *     <p>Double: {{ doubled() }}</p>
 *     <button @click="increment">Increment</button>
 *     <button @click="decrement">Decrement</button>
 *     <button @click="reset">Reset</button>
 *   </div>
 * </template>
 *
 * <script setup lang="ts">
 * import { reactive, computed } from '@genx/bindx-vue';
 *
 * const state = reactive({
 *   count: 0
 * });
 *
 * const doubled = computed(() => state.count * 2);
 *
 * function increment() {
 *   state.count++;
 * }
 *
 * function decrement() {
 *   state.count--;
 * }
 *
 * function reset() {
 *   state.count = 0;
 * }
 * </script>
 *
 * @example
 * // Todo List with Filtering
 * <template>
 *   <div>
 *     <input v-model="newTodoText" @keyup.enter="addTodo" placeholder="Add todo">
 *
 *     <div>
 *       <button @click="setFilter('all')">All</button>
 *       <button @click="setFilter('active')">Active</button>
 *       <button @click="setFilter('completed')">Completed</button>
 *     </div>
 *
 *     <ul>
 *       <li v-for="todo in filteredTodos()" :key="todo.id">
 *         <input
 *           type="checkbox"
 *           :checked="todo.completed"
 *           @change="toggleTodo(todo.id)"
 *         >
 *         <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
 *         <button @click="removeTodo(todo.id)">×</button>
 *       </li>
 *     </ul>
 *
 *     <p>{{ remainingCount() }} items left</p>
 *   </div>
 * </template>
 *
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { reactive, computed } from '@genx/bindx-vue';
 *
 * interface Todo {
 *   id: number;
 *   text: string;
 *   completed: boolean;
 * }
 *
 * type FilterType = 'all' | 'active' | 'completed';
 *
 * const state = reactive({
 *   todos: [] as Todo[],
 *   filter: 'all' as FilterType
 * });
 *
 * const newTodoText = ref('');
 *
 * const filteredTodos = computed(() => {
 *   switch (state.filter) {
 *     case 'active':
 *       return state.todos.filter(t => !t.completed);
 *     case 'completed':
 *       return state.todos.filter(t => t.completed);
 *     default:
 *       return state.todos;
 *   }
 * });
 *
 * const remainingCount = computed(() =>
 *   state.todos.filter(t => !t.completed).length
 * );
 *
 * function addTodo() {
 *   if (!newTodoText.value.trim()) return;
 *
 *   state.todos.push({
 *     id: Date.now(),
 *     text: newTodoText.value,
 *     completed: false
 *   });
 *
 *   newTodoText.value = '';
 * }
 *
 * function toggleTodo(id: number) {
 *   const todo = state.todos.find(t => t.id === id);
 *   if (todo) {
 *     todo.completed = !todo.completed;
 *   }
 * }
 *
 * function removeTodo(id: number) {
 *   const index = state.todos.findIndex(t => t.id === id);
 *   if (index !== -1) {
 *     state.todos.splice(index, 1);
 *   }
 * }
 *
 * function setFilter(filter: FilterType) {
 *   state.filter = filter;
 * }
 * </script>
 *
 * <style scoped>
 * .completed {
 *   text-decoration: line-through;
 *   color: #999;
 * }
 * </style>
 */

import {
  ref,
  computed as vueComputed,
  watch as vueWatch,
  getCurrentScope,
  getCurrentInstance,
  onScopeDispose,
  onActivated,
  onDeactivated,
  inject,
  ssrContextKey,
  type Ref,
  type ComputedRef,
  type WatchOptions,
  type WatchStopHandle
} from 'vue';

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
 * Type definition for computed getter with cleanup
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
 * Creates reactive state using bindX with Vue integration
 *
 * @template T - Type of state object
 * @param {T} state - Initial state object
 * @returns {T} Reactive proxy that integrates with Vue's reactivity
 *
 * @example
 * const state = reactive({
 *   count: 0,
 *   user: { name: 'John', age: 30 }
 * });
 *
 * // Changes trigger Vue re-renders
 * state.count++;
 * state.user.age++;
 */
export function reactive<T extends object>(state: T): T {
  const bindXState = bindX.reactive(state);

  // Inside a component (or any effect scope) let Vue track the state, so
  // templates, Vue computeds and Vue watchers update on every bindX write
  if (getCurrentScope()) {
    return toVueReactive(bindXState);
  }

  return bindXState;
}

/**
 * True while a component sets up for server rendering. Vue renders it once and
 * never unmounts it, so bridge watchers made there would leak per request.
 */
function inSSRSetup(): boolean {
  return !!getCurrentInstance() && inject(ssrContextKey, null) !== null;
}

/** Stop a bindX watcher when the current component or effect scope ends. */
function disposeWithScope(stop: () => void): void {
  if (getCurrentScope()) {
    onScopeDispose(stop);
  }
}

/**
 * Makes bindX reactive state visible to Vue's reactivity
 *
 * Vue tracks reads of the returned object; any write to the bindX state, at
 * any depth and from anywhere, triggers the Vue effects that read it. The
 * bridge watcher stops with the current component or effect scope.
 *
 * @template T - Type of state object
 * @param {T} state - bindX reactive state
 * @returns {T} The same state, tracked by Vue
 *
 * @example
 * const store = bindX.reactive({ count: 0 });
 * const state = toVueReactive(store); // in setup()
 * store.count++; // re-renders components that read state.count
 */
export function toVueReactive<T extends object>(state: T): T {
  // Server rendering reads the state once; nothing to keep in sync
  if (inSSRSetup()) {
    return state;
  }

  const version = ref(0);
  const stop = bindX.watch(() => state, () => {
    version.value++;
  }, { deep: true });
  disposeWithScope(stop);

  // Nested plain objects and arrays get the same treatment, so a template that
  // holds on to state.user or state.items still tracks it
  const wrappers = new WeakMap<object, any>();
  const handler: ProxyHandler<any> = {
    get(target, property, receiver) {
      // Vue's own reactive() (data(), reactive props) must not wrap the bridge
      // again: writes made straight to the bindX state would bypass that copy
      if (property === '__v_skip') {
        return true;
      }
      // Reading the version makes the current Vue effect depend on this object
      void version.value;
      const value = Reflect.get(target, property, receiver);
      return isPlainContainer(value) ? wrap(value) : value;
    },
    set(target, property, value) {
      // Write through the bindX proxy itself so it notifies as usual
      return Reflect.set(target, property, value);
    }
  };
  const wrap = (target: object) => {
    let wrapper = wrappers.get(target);
    if (!wrapper) {
      wrapper = new Proxy(target, handler);
      wrappers.set(target, wrapper);
    }
    return wrapper;
  };

  return wrap(state);
}

function isPlainContainer(value: unknown): value is object {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return Array.isArray(value) || proto === Object.prototype || proto === null;
}

/**
 * Creates computed property using bindX with Vue integration
 *
 * @template T - Return type of computed property
 * @param {() => T} getter - Getter function
 * @returns {() => T} Computed getter function
 *
 * @example
 * const state = reactive({ count: 0 });
 * const doubled = computed(() => state.count * 2);
 *
 * console.log(doubled()); // 0
 * state.count = 5;
 * console.log(doubled()); // 10
 */
export function computed<T>(getter: () => T): ComputedGetter<T> {
  const bindXComputed = bindX.computed(getter);

  if (!getCurrentScope() || inSSRSetup()) {
    return bindXComputed;
  }

  // In a component, make reads Vue-tracked even when the value comes from the
  // cache. The bridge watcher starts on first read, so evaluation stays lazy.
  const version = ref(0);
  let stop: UnwatchFn | null = null;
  let disposed = false;
  disposeWithScope(() => {
    disposed = true;
    if (stop) {
      stop();
      stop = null;
    }
  });

  return () => {
    void version.value;
    if (!stop && !disposed) {
      stop = bindX.watch(() => bindXComputed(), () => {
        version.value++;
      });
    }
    return bindXComputed();
  };
}

/**
 * Creates watcher using bindX with automatic cleanup on component unmount
 *
 * @template T - Type of watched value
 * @param {() => T} getter - Getter function to watch
 * @param {WatchCallback<T>} callback - Callback when value changes
 * @param {BindXWatchOptions} [options] - Watch options
 * @returns {UnwatchFn} Function to stop watching
 *
 * @example
 * const state = reactive({ userId: 1 });
 *
 * // Watch with immediate execution
 * const unwatch = watch(
 *   () => state.userId,
 *   (newId, oldId) => {
 *     console.log(`User ID changed from ${oldId} to ${newId}`);
 *     fetchUser(newId);
 *   },
 *   { immediate: true }
 * );
 *
 * // Cleanup happens automatically on unmount
 * // Or manually: unwatch();
 */
export function watch<T>(
  getter: () => T,
  callback: WatchCallback<T>,
  options?: BindXWatchOptions
): UnwatchFn {
  // Like Vue's watch during server rendering: only an immediate call runs
  if (inSSRSetup()) {
    if (options?.immediate) {
      callback(getter(), undefined as unknown as T);
    }
    return () => {};
  }

  // A component cached by <KeepAlive> pauses its watchers while inactive and,
  // on reactivation, reports the latest value once if it changed meanwhile
  let paused = false;
  let missed = false;
  let lastValue: T | undefined;
  const unwatch = bindX.watch(getter, (newValue: T, oldValue: T) => {
    if (paused) {
      missed = true;
      return;
    }
    lastValue = newValue;
    callback(newValue, oldValue);
  }, options);

  if (getCurrentInstance()) {
    onDeactivated(() => {
      paused = true;
    });
    onActivated(() => {
      if (!paused) {
        return;
      }
      paused = false;
      if (missed) {
        missed = false;
        const current = getter();
        const previous = lastValue as T;
        lastValue = current;
        callback(current, previous);
      }
    });
  }

  // Auto-cleanup when the component (or effect scope) ends
  disposeWithScope(unwatch);

  return unwatch;
}

/**
 * Converts bindX reactive state to Vue Ref
 *
 * @template T - Type of value
 * @param {() => T} getter - Getter function for bindX state
 * @returns {Ref<T>} Vue ref that syncs with bindX state
 *
 * @example
 * const state = reactive({ count: 0 });
 * const countRef = toVueRef(() => state.count);
 *
 * // Now can use with v-model and other Vue features
 * // <input v-model="countRef">
 */
export function toVueRef<T>(getter: () => T): Ref<T> {
  const vueRef = ref(getter()) as Ref<T>;

  // Watch bindX state and update Vue ref
  watch(
    getter,
    (newValue) => {
      vueRef.value = newValue;
    },
    { immediate: false }
  );

  return vueRef;
}

/**
 * Converts bindX computed to Vue ComputedRef
 *
 * @template T - Type of computed value
 * @param {ComputedGetter<T>} bindXComputed - bindX computed getter
 * @returns {ComputedRef<T>} Vue computed ref
 *
 * @example
 * const state = reactive({ count: 0 });
 * const doubled = computed(() => state.count * 2);
 * const doubledRef = toVueComputed(doubled);
 *
 * // Use in template: {{ doubledRef }}
 */
export function toVueComputed<T>(bindXComputed: ComputedGetter<T>): ComputedRef<T> {
  return vueComputed(() => bindXComputed());
}

/**
 * Converts Vue ref to bindX reactive state
 *
 * @template T - Type of value
 * @param {Ref<T>} vueRef - Vue ref
 * @returns {{ value: T }} bindX reactive object whose value follows the ref
 *
 * @example
 * const vueCount = ref(0);
 * const bindXState = fromVueRef(vueCount);
 *
 * // Changes in Vue ref update bindX state
 * vueCount.value++;
 * console.log(bindXState.value); // 1
 */
export function fromVueRef<T>(vueRef: Ref<T>): { value: T } {
  const state = bindX.reactive({ value: vueRef.value });

  // Sync flush so bindX watchers and computeds see the change right away
  vueWatch(
    () => vueRef.value,
    (newValue) => {
      state.value = newValue;
    },
    { flush: 'sync' }
  );

  return state;
}

/**
 * Creates a Vue composable that uses bindX reactive state
 *
 * @template T - Type of state
 * @param {() => T} factory - Factory function to create initial state
 * @returns {() => T} Composable function
 *
 * @example
 * // Define composable
 * const useCounter = createComposable(() => {
 *   const state = reactive({ count: 0 });
 *
 *   const increment = () => state.count++;
 *   const decrement = () => state.count--;
 *   const reset = () => state.count = 0;
 *
 *   return {
 *     state,
 *     increment,
 *     decrement,
 *     reset
 *   };
 * });
 *
 * // Use in component
 * const { state, increment, decrement, reset } = useCounter();
 */
export function createComposable<T>(factory: () => T): () => T {
  return () => {
    const result = factory();
    return result;
  };
}

/**
 * Utility to create a shared global store
 *
 * @template T - Type of store state
 * @param {T} initialState - Initial store state
 * @returns {T} Shared reactive store
 *
 * @example
 * // store.ts
 * export const userStore = createStore({
 *   currentUser: null,
 *   isAuthenticated: false
 * });
 *
 * // Component A
 * import { userStore } from './store';
 * userStore.currentUser = { id: 1, name: 'John' };
 *
 * // Component B - sees the same state
 * import { userStore } from './store';
 * console.log(userStore.currentUser); // { id: 1, name: 'John' }
 */
export function createStore<T extends object>(initialState: T): T {
  // A module-level store outlives components, so it is always Vue-tracked
  return toVueReactive(bindX.reactive(initialState));
}

/**
 * Vue plugin for global bindX integration
 *
 * @example
 * import { createApp } from 'vue';
 * import { bindXPlugin } from '@genx/bindx-vue';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 * app.use(bindXPlugin);
 * app.mount('#app');
 *
 * // Now available in all components via inject
 * const bindX = inject('bindX');
 */
export const bindXPlugin = {
  install(app: any, options?: Record<string, any>) {
    // Provide bindX utilities globally
    app.provide('bindX', {
      reactive,
      computed,
      watch,
      toVueRef,
      toVueComputed,
      fromVueRef,
      toVueReactive,
      createStore
    });

    // Optionally add global properties
    if (options?.globalProperties) {
      app.config.globalProperties.$bindX = {
        reactive,
        computed,
        watch
      };
    }
  }
};

/**
 * Hook to use bindX in Options API components
 *
 * @template T - Type of state
 * @param {T} initialState - Initial state
 * @returns {Object} Reactive state and utilities
 *
 * @example
 * export default {
 *   setup() {
 *     return useBindX({
 *       count: 0,
 *       user: { name: 'John' }
 *     });
 *   },
 *   methods: {
 *     increment() {
 *       this.count++;
 *     }
 *   }
 * }
 */
export function useBindX<T extends object>(initialState: T) {
  const state = reactive(initialState);

  return {
    ...state,
    _isBindXState: true
  };
}

/**
 * Composable for counter functionality
 *
 * @param {number} [initial=0] - Initial count value
 * @returns {Object} Counter state and methods
 *
 * @example
 * const { count, increment, decrement, reset } = useCounter(10);
 *
 * <button @click="increment">{{ count() }}</button>
 */
export function useCounter(initial: number = 0) {
  const state = reactive({ count: initial });

  const count = computed(() => state.count);

  function increment() {
    state.count++;
  }

  function decrement() {
    state.count--;
  }

  function reset() {
    state.count = initial;
  }

  return {
    count,
    increment,
    decrement,
    reset,
    state
  };
}

/**
 * Composable for toggle functionality
 *
 * @param {boolean} [initial=false] - Initial toggle value
 * @returns {Object} Toggle state and methods
 *
 * @example
 * const { isOpen, toggle, open, close } = useToggle();
 *
 * <button @click="toggle">{{ isOpen() ? 'Close' : 'Open' }}</button>
 */
export function useToggle(initial: boolean = false) {
  const state = reactive({ value: initial });

  const isOpen = computed(() => state.value);

  function toggle() {
    state.value = !state.value;
  }

  function open() {
    state.value = true;
  }

  function close() {
    state.value = false;
  }

  return {
    isOpen,
    toggle,
    open,
    close,
    state
  };
}

/**
 * Composable for array management
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
  const state = reactive({ items: [...initial] });

  const items = computed(() => state.items);
  const count = computed(() => state.items.length);
  const isEmpty = computed(() => state.items.length === 0);

  function push(item: T) {
    state.items.push(item);
  }

  function remove(index: number) {
    if (index >= 0 && index < state.items.length) {
      state.items.splice(index, 1);
    }
  }

  function clear() {
    state.items = [];
  }

  function filter(predicate: (item: T) => boolean) {
    state.items = state.items.filter(predicate);
  }

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
 * Composable for form management
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
 * <input v-model="form.data.username">
 * <button @click="form.submit()">Submit</button>
 */
export function useForm<T extends Record<string, any>>(initialData: T) {
  const state = reactive({
    data: { ...initialData },
    errors: {} as Record<keyof T, string>,
    isDirty: false,
    isSubmitting: false
  });

  const hasErrors = computed(() => Object.keys(state.errors).length > 0);

  // Reset in place: the returned data and errors objects stay the live ones
  function reset() {
    for (const key of Object.keys(state.data)) {
      delete (state.data as Record<string, any>)[key];
    }
    Object.assign(state.data, initialData);
    clearErrors();
    state.isDirty = false;
    state.isSubmitting = false;
  }

  function setError(field: keyof T, message: string) {
    state.errors[field] = message;
  }

  function clearError(field: keyof T) {
    delete state.errors[field];
  }

  function clearErrors() {
    for (const key of Object.keys(state.errors)) {
      delete (state.errors as Record<string, string>)[key];
    }
  }

  async function submit(handler?: (data: T) => Promise<void> | void) {
    if (state.isSubmitting) return;

    state.isSubmitting = true;
    clearErrors();

    try {
      if (handler) {
        await handler(state.data);
      }
      state.isDirty = false;
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      state.isSubmitting = false;
    }
  }

  // Watch for changes to mark as dirty
  watch(
    () => JSON.stringify(state.data),
    () => {
      state.isDirty = true;
    }
  );

  return {
    data: state.data,
    errors: state.errors,
    isDirty: computed(() => state.isDirty),
    isSubmitting: computed(() => state.isSubmitting),
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
 * Composable for async data fetching
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
 * <div v-if="loading()">Loading...</div>
 * <div v-else-if="error()">Error: {{ error() }}</div>
 * <div v-else>{{ data() }}</div>
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  options: { immediate?: boolean } = {}
) {
  const state = reactive({
    data: null as T | null,
    loading: false,
    error: null as Error | null
  });

  const data = computed(() => state.data);
  const loading = computed(() => state.loading);
  const error = computed(() => state.error);

  async function execute() {
    state.loading = true;
    state.error = null;

    try {
      state.data = await fetcher();
    } catch (err) {
      state.error = err as Error;
    } finally {
      state.loading = false;
    }
  }

  if (options.immediate) {
    execute();
  }

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    state
  };
}

// Re-export types for convenience
export type {
  Ref,
  ComputedRef,
  WatchOptions,
  WatchStopHandle
};

// Default export
export default {
  reactive,
  computed,
  watch,
  toVueRef,
  toVueComputed,
  fromVueRef,
  toVueReactive,
  createComposable,
  createStore,
  bindXPlugin,
  useBindX,
  useCounter,
  useToggle,
  useArray,
  useForm,
  useAsync
};
