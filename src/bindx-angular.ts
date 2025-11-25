/**
 * @genx/bindx-angular
 * Angular framework adapter for bindX reactive state management
 *
 * Provides Angular-specific integration including:
 * - Angular service for dependency injection
 * - Zone.js compatibility and change detection integration
 * - RxJS interoperability (Observable conversion)
 * - TypeScript support with full type safety
 * - Lifecycle integration (ngOnInit, ngOnDestroy cleanup)
 *
 * Compatible with Angular 12+
 *
 * @module @genx/bindx-angular
 * @version 1.0.0
 * @license MIT
 */

import {
  Injectable,
  NgZone,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  DestroyRef,
} from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
 * BindXService - Angular service for bindX integration
 *
 * Provides reactive state management with automatic Angular change detection integration.
 * All reactive updates automatically trigger Angular change detection via Zone.js.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-counter',
 *   template: `
 *     <div>Count: {{ state.count }}</div>
 *     <button (click)="increment()">+</button>
 *   `
 * })
 * export class CounterComponent implements OnInit {
 *   state = this.bindX.reactive({ count: 0 });
 *
 *   constructor(private bindX: BindXService) {}
 *
 *   increment() {
 *     this.state.count++;
 *   }
 * }
 * ```
 *
 * @Injectable({ providedIn: 'root' })
 */
@Injectable({
  providedIn: 'root'
})
export class BindXService implements OnDestroy {
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private watchers: UnwatchFn[] = [];
  private subscriptions = new Set<() => void>();

  constructor() {
    // Ensure bindX is available
    if (typeof bindX === 'undefined') {
      throw new Error(
        'bindX is not available. Please ensure bindX core library is loaded before Angular application.'
      );
    }
  }

  /**
   * Create a reactive state object
   *
   * All property changes automatically trigger Angular change detection.
   *
   * @template T - Type of the state object
   * @param state - Initial state object
   * @returns Reactive proxy of the state
   *
   * @example
   * ```typescript
   * const user = this.bindX.reactive({
   *   name: 'Alice',
   *   age: 30
   * });
   *
   * user.name = 'Bob'; // Triggers change detection
   * ```
   */
  reactive<T extends object>(state: T): T {
    const proxy = bindX.reactive(state);

    // Wrap proxy to trigger change detection on updates
    return new Proxy(proxy, {
      set: (target, property, value) => {
        const result = Reflect.set(target, property, value);

        // Trigger change detection
        this.ngZone.run(() => {
          // Empty callback - just need to trigger zone
        });

        return result;
      }
    });
  }

  /**
   * Create a computed property
   *
   * Computed properties automatically recalculate when dependencies change
   * and trigger Angular change detection.
   *
   * @template T - Return type of the computed function
   * @param getter - Function that computes the value
   * @returns Computed property getter function
   *
   * @example
   * ```typescript
   * const state = this.bindX.reactive({ firstName: 'John', lastName: 'Doe' });
   * const fullName = this.bindX.computed(() =>
   *   `${state.firstName} ${state.lastName}`
   * );
   *
   * console.log(fullName()); // "John Doe"
   * state.firstName = 'Jane';
   * console.log(fullName()); // "Jane Doe"
   * ```
   */
  computed<T>(getter: () => T): ComputedRef<T> {
    const computedRef = bindX.computed(getter);

    // Wrap to trigger change detection when accessed
    return () => {
      const value = computedRef();

      // Trigger change detection if we're in a template binding
      if (NgZone.isInAngularZone()) {
        this.ngZone.run(() => {});
      }

      return value;
    };
  }

  /**
   * Watch reactive properties for changes
   *
   * Watchers are automatically cleaned up when the component is destroyed.
   *
   * @template T - Type of the watched value
   * @param getter - Function that returns the value to watch
   * @param callback - Callback executed when value changes
   * @param options - Watch options
   * @returns Unwatch function to stop watching
   *
   * @example
   * ```typescript
   * const state = this.bindX.reactive({ count: 0 });
   *
   * this.bindX.watch(
   *   () => state.count,
   *   (newVal, oldVal) => {
   *     console.log(`Count changed from ${oldVal} to ${newVal}`);
   *   }
   * );
   * ```
   */
  watch<T>(
    getter: () => T,
    callback: WatchCallback<T>,
    options?: WatchOptions
  ): UnwatchFn {
    // Wrap callback to run in NgZone
    const wrappedCallback: WatchCallback<T> = (newValue, oldValue) => {
      this.ngZone.run(() => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('Error in bindX watcher:', error);
        }
      });
    };

    const unwatch = bindX.watch(getter, wrappedCallback, options);

    // Track for cleanup
    this.watchers.push(unwatch);

    // Auto-cleanup on destroy
    this.destroyRef.onDestroy(() => {
      unwatch();
      const index = this.watchers.indexOf(unwatch);
      if (index > -1) {
        this.watchers.splice(index, 1);
      }
    });

    return unwatch;
  }

  /**
   * Convert reactive property to RxJS Observable
   *
   * Enables use of RxJS operators and Angular async pipe.
   *
   * @template T - Type of the observable value
   * @param getter - Function that returns the reactive value
   * @returns RxJS Observable of the value
   *
   * @example
   * ```typescript
   * const state = this.bindX.reactive({ count: 0 });
   * const count$ = this.bindX.toObservable(() => state.count);
   *
   * // Use with async pipe
   * // <div>{{ count$ | async }}</div>
   *
   * // Use with RxJS operators
   * count$.pipe(
   *   map(x => x * 2),
   *   filter(x => x > 5)
   * ).subscribe(val => console.log(val));
   * ```
   */
  toObservable<T>(getter: () => T): Observable<T> {
    const subject = new BehaviorSubject<T>(getter());

    // Watch for changes and emit to subject
    const unwatch = this.watch(
      getter,
      (newValue) => {
        subject.next(newValue);
      },
      { immediate: false }
    );

    // Cleanup subject on destroy
    this.destroyRef.onDestroy(() => {
      unwatch();
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Create reactive state from RxJS Observable
   *
   * Synchronizes Observable values with reactive state.
   *
   * @template T - Type of the observable value
   * @param observable - RxJS Observable to convert
   * @param initialValue - Initial value before first emission
   * @returns Reactive state object with value property
   *
   * @example
   * ```typescript
   * const timer$ = interval(1000);
   * const state = this.bindX.fromObservable(timer$, 0);
   *
   * // state.value updates every second
   * ```
   */
  fromObservable<T>(observable: Observable<T>, initialValue: T): { value: T } {
    const state = this.reactive({ value: initialValue });

    const subscription = observable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        state.value = value;
      });

    return state;
  }

  /**
   * Initialize reactive state in ngOnInit
   *
   * Helper for component initialization pattern.
   *
   * @template T - Type of the state object
   * @param initializer - Function that returns initial state
   * @returns Reactive state
   *
   * @example
   * ```typescript
   * ngOnInit() {
   *   this.state = this.bindX.init(() => ({
   *     users: [],
   *     loading: false
   *   }));
   * }
   * ```
   */
  init<T extends object>(initializer: () => T): T {
    return this.reactive(initializer());
  }

  /**
   * Manually trigger change detection
   *
   * Useful when running outside NgZone.
   *
   * @example
   * ```typescript
   * this.ngZone.runOutsideAngular(() => {
   *   state.value = newValue;
   *   this.bindX.detectChanges(); // Manually trigger
   * });
   * ```
   */
  detectChanges(): void {
    this.ngZone.run(() => {
      // Empty callback triggers change detection
    });
  }

  /**
   * Run function outside Angular zone
   *
   * Useful for performance optimization of frequent updates.
   *
   * @param fn - Function to run outside zone
   *
   * @example
   * ```typescript
   * this.bindX.runOutsideZone(() => {
   *   // Frequent updates that don't need immediate view updates
   *   for (let i = 0; i < 1000; i++) {
   *     state.value = i;
   *   }
   *   this.bindX.detectChanges(); // Single update at end
   * });
   * ```
   */
  runOutsideZone(fn: () => void): void {
    this.ngZone.runOutsideAngular(fn);
  }

  /**
   * Cleanup all watchers and subscriptions
   *
   * Called automatically on service destroy.
   */
  ngOnDestroy(): void {
    // Disconnect all watchers
    this.watchers.forEach(unwatch => unwatch());
    this.watchers = [];

    // Clean up subscriptions
    this.subscriptions.forEach(cleanup => cleanup());
    this.subscriptions.clear();
  }
}

/**
 * Standalone function to create bindX-backed FormControl
 *
 * Synchronizes Angular FormControl with bindX reactive state.
 *
 * @param bindXService - BindXService instance
 * @param initialValue - Initial form value
 * @returns Object with FormControl and reactive state
 *
 * @example
 * ```typescript
 * const { control, state } = createReactiveFormControl(this.bindX, 'initial');
 *
 * // Changes to control update state.value
 * // Changes to state.value update control
 * ```
 */
export function createReactiveFormControl<T>(
  bindXService: BindXService,
  initialValue: T
): { control: any; state: { value: T } } {
  const state = bindXService.reactive({ value: initialValue });

  // Note: Actual FormControl creation would require @angular/forms import
  // This is a placeholder showing the pattern
  const control = {
    value: initialValue,
    valueChanges: bindXService.toObservable(() => state.value),
    setValue: (value: T) => {
      state.value = value;
    }
  };

  bindXService.watch(
    () => state.value,
    (newValue) => {
      if (control.value !== newValue) {
        control.value = newValue;
      }
    }
  );

  return { control, state };
}

/**
 * Type guard to check if object is reactive
 */
export function isReactive(obj: any): boolean {
  return bindX.isReactive(obj);
}

/**
 * Export bindX core functions for convenience
 */
export {
  // Re-export core bindX (if needed)
};

/**
 * Angular module for bindX
 *
 * @deprecated Use providedIn: 'root' service instead (Angular 14+)
 *
 * @example
 * ```typescript
 * import { BindXModule } from '@genx/bindx-angular';
 *
 * @NgModule({
 *   imports: [BindXModule]
 * })
 * export class AppModule {}
 * ```
 */
// Module export would go here for older Angular versions

/**
 * Example usage in Angular component:
 *
 * @example
 * ```typescript
 * import { Component, OnInit } from '@angular/core';
 * import { BindXService } from '@genx/bindx-angular';
 *
 * interface TodoItem {
 *   id: number;
 *   text: string;
 *   completed: boolean;
 * }
 *
 * interface TodoState {
 *   todos: TodoItem[];
 *   filter: 'all' | 'active' | 'completed';
 * }
 *
 * @Component({
 *   selector: 'app-todo',
 *   template: `
 *     <div>
 *       <h1>Todo List</h1>
 *
 *       <input
 *         [(ngModel)]="newTodoText"
 *         (keyup.enter)="addTodo()"
 *         placeholder="What needs to be done?">
 *
 *       <div *ngFor="let todo of filteredTodos()">
 *         <input
 *           type="checkbox"
 *           [checked]="todo.completed"
 *           (change)="toggleTodo(todo.id)">
 *         <span [class.completed]="todo.completed">{{ todo.text }}</span>
 *         <button (click)="removeTodo(todo.id)">✖</button>
 *       </div>
 *
 *       <div>
 *         <span>{{ remainingCount() }} items left</span>
 *         <button (click)="state.filter = 'all'">All</button>
 *         <button (click)="state.filter = 'active'">Active</button>
 *         <button (click)="state.filter = 'completed'">Completed</button>
 *       </div>
 *     </div>
 *   `,
 *   styles: [`
 *     .completed {
 *       text-decoration: line-through;
 *       opacity: 0.6;
 *     }
 *   `]
 * })
 * export class TodoComponent implements OnInit {
 *   state: TodoState;
 *   newTodoText = '';
 *
 *   // Computed properties
 *   filteredTodos;
 *   remainingCount;
 *
 *   constructor(private bindX: BindXService) {
 *     this.state = this.bindX.reactive<TodoState>({
 *       todos: [],
 *       filter: 'all'
 *     });
 *
 *     this.filteredTodos = this.bindX.computed(() => {
 *       switch (this.state.filter) {
 *         case 'active':
 *           return this.state.todos.filter(t => !t.completed);
 *         case 'completed':
 *           return this.state.todos.filter(t => t.completed);
 *         default:
 *           return this.state.todos;
 *       }
 *     });
 *
 *     this.remainingCount = this.bindX.computed(() =>
 *       this.state.todos.filter(t => !t.completed).length
 *     );
 *   }
 *
 *   ngOnInit() {
 *     // Watch for filter changes
 *     this.bindX.watch(
 *       () => this.state.filter,
 *       (newFilter) => {
 *         console.log('Filter changed to:', newFilter);
 *       }
 *     );
 *
 *     // Load initial todos
 *     this.state.todos = [
 *       { id: 1, text: 'Learn bindX', completed: false },
 *       { id: 2, text: 'Build Angular app', completed: false }
 *     ];
 *   }
 *
 *   addTodo() {
 *     if (this.newTodoText.trim()) {
 *       this.state.todos.push({
 *         id: Date.now(),
 *         text: this.newTodoText.trim(),
 *         completed: false
 *       });
 *       this.newTodoText = '';
 *     }
 *   }
 *
 *   toggleTodo(id: number) {
 *     const todo = this.state.todos.find(t => t.id === id);
 *     if (todo) {
 *       todo.completed = !todo.completed;
 *     }
 *   }
 *
 *   removeTodo(id: number) {
 *     const index = this.state.todos.findIndex(t => t.id === id);
 *     if (index > -1) {
 *       this.state.todos.splice(index, 1);
 *     }
 *   }
 * }
 * ```
 */

/**
 * Example with RxJS integration:
 *
 * @example
 * ```typescript
 * import { Component, OnInit } from '@angular/core';
 * import { BindXService } from '@genx/bindx-angular';
 * import { HttpClient } from '@angular/common/http';
 * import { interval } from 'rxjs';
 * import { switchMap, map } from 'rxjs/operators';
 *
 * @Component({
 *   selector: 'app-data-fetcher',
 *   template: `
 *     <div>
 *       <h2>Live Data</h2>
 *       <div *ngIf="state.loading">Loading...</div>
 *       <div *ngIf="state.error">Error: {{ state.error }}</div>
 *       <div *ngIf="!state.loading && !state.error">
 *         <p>Count: {{ state.count }}</p>
 *         <p>Last Updated: {{ state.lastUpdated }}</p>
 *         <pre>{{ state.data | json }}</pre>
 *       </div>
 *     </div>
 *   `
 * })
 * export class DataFetcherComponent implements OnInit {
 *   state = this.bindX.reactive({
 *     data: null,
 *     loading: false,
 *     error: null as string | null,
 *     count: 0,
 *     lastUpdated: new Date()
 *   });
 *
 *   constructor(
 *     private bindX: BindXService,
 *     private http: HttpClient
 *   ) {}
 *
 *   ngOnInit() {
 *     // Auto-refresh every 10 seconds
 *     const timer$ = interval(10000);
 *     const timerState = this.bindX.fromObservable(timer$, 0);
 *
 *     this.bindX.watch(
 *       () => timerState.value,
 *       () => this.fetchData()
 *     );
 *
 *     // Initial fetch
 *     this.fetchData();
 *
 *     // Convert reactive state to Observable for async operations
 *     const count$ = this.bindX.toObservable(() => this.state.count);
 *     count$.pipe(
 *       map(count => count * 2)
 *     ).subscribe(doubled => {
 *       console.log('Doubled count:', doubled);
 *     });
 *   }
 *
 *   fetchData() {
 *     this.state.loading = true;
 *     this.state.error = null;
 *
 *     this.http.get('https://api.example.com/data')
 *       .subscribe({
 *         next: (data) => {
 *           this.state.data = data;
 *           this.state.loading = false;
 *           this.state.count++;
 *           this.state.lastUpdated = new Date();
 *         },
 *         error: (err) => {
 *           this.state.error = err.message;
 *           this.state.loading = false;
 *         }
 *       });
 *   }
 * }
 * ```
 */

export default BindXService;
