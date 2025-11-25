# Getting Started with bindX for Angular

Reactive state management for Angular applications using bindX.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Features](#core-features)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### NPM

```bash
npm install @genx/bindx @genx/bindx-angular
```

### Yarn

```bash
yarn add @genx/bindx @genx/bindx-angular
```

### Prerequisites

- Angular 12+ (Angular 14+ recommended for standalone components)
- TypeScript 4.0+
- RxJS 7.0+

---

## Quick Start

### 1. Import BindXService

The service is automatically provided at root level:

```typescript
import { Component } from '@angular/core';
import { BindXService } from '@genx/bindx-angular';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ state.count }}</p>
      <button (click)="increment()">+</button>
    </div>
  `
})
export class CounterComponent {
  state = this.bindX.reactive({ count: 0 });

  constructor(private bindX: BindXService) {}

  increment() {
    this.state.count++;
  }
}
```

### 2. Automatic Change Detection

All reactive state changes automatically trigger Angular change detection through Zone.js:

```typescript
state.count++; // View updates automatically
```

No need for:
- `ChangeDetectorRef.detectChanges()`
- Manual zone.run() calls
- BehaviorSubject boilerplate

---

## Core Features

### Reactive State

Create reactive objects that automatically track changes:

```typescript
export class UserComponent {
  state = this.bindX.reactive({
    user: {
      name: 'Alice',
      email: 'alice@example.com',
      age: 30
    },
    loading: false
  });

  constructor(private bindX: BindXService) {}

  updateUser() {
    this.state.user.name = 'Bob'; // Auto triggers change detection
    this.state.loading = true;
  }
}
```

**Features:**
- Deep reactivity (nested objects are reactive)
- Array reactivity (push, splice, etc. work)
- Automatic change detection integration
- TypeScript type safety

---

### Computed Properties

Derived values that automatically recalculate:

```typescript
export class TodoComponent {
  state = this.bindX.reactive({
    todos: [
      { id: 1, text: 'Learn bindX', completed: false },
      { id: 2, text: 'Build app', completed: false }
    ]
  });

  // Computed properties
  remainingCount = this.bindX.computed(() =>
    this.state.todos.filter(t => !t.completed).length
  );

  completedCount = this.bindX.computed(() =>
    this.state.todos.filter(t => t.completed).length
  );

  allCompleted = this.bindX.computed(() =>
    this.state.todos.every(t => t.completed)
  );

  constructor(private bindX: BindXService) {}
}
```

**Template usage:**

```html
<p>{{ remainingCount() }} items left</p>
<p>{{ completedCount() }} completed</p>
<p *ngIf="allCompleted()">All done! 🎉</p>
```

**Features:**
- Lazy evaluation (only calculate when accessed)
- Automatic dependency tracking
- Cached results (recalculate only when dependencies change)
- Can depend on other computed properties

---

### Watchers

Execute code when reactive properties change:

```typescript
export class DataComponent implements OnInit {
  state = this.bindX.reactive({
    userId: 1,
    data: null
  });

  constructor(private bindX: BindXService) {}

  ngOnInit() {
    // Watch for user ID changes
    this.bindX.watch(
      () => this.state.userId,
      (newId, oldId) => {
        console.log(`User ID changed from ${oldId} to ${newId}`);
        this.fetchUserData(newId);
      }
    );

    // Watch with immediate execution
    this.bindX.watch(
      () => this.state.userId,
      (id) => this.fetchUserData(id),
      { immediate: true }
    );

    // Watch multiple properties
    this.bindX.watch(
      () => ({ id: this.state.userId, data: this.state.data }),
      (value) => {
        console.log('State changed:', value);
      }
    );
  }

  fetchUserData(id: number) {
    // Fetch data...
  }
}
```

**Features:**
- Automatic cleanup on component destroy
- Immediate execution option
- Deep watching for nested objects
- TypeScript-safe callbacks

---

### RxJS Integration

Convert reactive state to Observables and vice versa:

```typescript
export class StreamComponent implements OnInit {
  state = this.bindX.reactive({
    count: 0,
    message: 'Hello'
  });

  // Convert reactive state to Observable
  count$ = this.bindX.toObservable(() => this.state.count);
  message$ = this.bindX.toObservable(() => this.state.message);

  constructor(
    private bindX: BindXService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Use with RxJS operators
    this.count$.pipe(
      map(count => count * 2),
      filter(count => count > 5),
      debounceTime(300)
    ).subscribe(doubled => {
      console.log('Doubled count:', doubled);
    });

    // Use with async pipe
    // <div>{{ count$ | async }}</div>

    // Convert Observable to reactive state
    const timer$ = interval(1000);
    const timerState = this.bindX.fromObservable(timer$, 0);

    // timerState.value updates every second
    this.bindX.watch(
      () => timerState.value,
      (time) => console.log('Timer:', time)
    );
  }
}
```

---

## API Reference

### BindXService

#### `reactive<T>(state: T): T`

Create a reactive proxy of an object.

```typescript
const state = this.bindX.reactive({
  count: 0,
  user: { name: 'Alice' }
});
```

---

#### `computed<T>(getter: () => T): () => T`

Create a computed property that recalculates when dependencies change.

```typescript
const doubled = this.bindX.computed(() => state.count * 2);
console.log(doubled()); // Access computed value
```

---

#### `watch<T>(getter, callback, options?): UnwatchFn`

Watch reactive properties for changes.

```typescript
const unwatch = this.bindX.watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(`Changed from ${oldVal} to ${newVal}`);
  },
  { immediate: true, deep: false }
);

// Stop watching
unwatch();
```

**Options:**
- `immediate`: Execute callback immediately (default: false)
- `deep`: Watch nested properties (default: false)

---

#### `toObservable<T>(getter: () => T): Observable<T>`

Convert reactive property to RxJS Observable.

```typescript
const count$ = this.bindX.toObservable(() => state.count);

count$.pipe(
  map(x => x * 2)
).subscribe(doubled => console.log(doubled));
```

---

#### `fromObservable<T>(observable: Observable<T>, initialValue: T)`

Convert Observable to reactive state.

```typescript
const timer$ = interval(1000);
const timerState = this.bindX.fromObservable(timer$, 0);

// Access: timerState.value
```

---

#### `init<T>(initializer: () => T): T`

Helper for initializing state in `ngOnInit`.

```typescript
ngOnInit() {
  this.state = this.bindX.init(() => ({
    users: [],
    loading: false
  }));
}
```

---

#### `detectChanges(): void`

Manually trigger Angular change detection.

```typescript
this.bindX.runOutsideZone(() => {
  // Expensive operation outside zone
  state.value = compute();
  this.bindX.detectChanges(); // Trigger detection
});
```

---

#### `runOutsideZone(fn: () => void): void`

Run function outside Angular zone for performance.

```typescript
this.bindX.runOutsideZone(() => {
  // Frequent updates without triggering change detection
  for (let i = 0; i < 1000; i++) {
    state.value = i;
  }
});
this.bindX.detectChanges(); // Single detection at end
```

---

## Examples

### Counter

```typescript
import { Component } from '@angular/core';
import { BindXService } from '@genx/bindx-angular';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <h2>Count: {{ state.count }}</h2>
      <button (click)="state.count--">-</button>
      <button (click)="state.count = 0">Reset</button>
      <button (click)="state.count++">+</button>
      <p>Status: {{ status() }}</p>
    </div>
  `
})
export class CounterComponent {
  state = this.bindX.reactive({ count: 0 });

  status = this.bindX.computed(() => {
    if (this.state.count === 0) return 'Zero';
    return this.state.count > 0 ? 'Positive' : 'Negative';
  });

  constructor(private bindX: BindXService) {}
}
```

---

### Form Validation

```typescript
interface FormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
  };
}

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="submit()">
      <input
        [(ngModel)]="state.email"
        (blur)="validateEmail()"
        placeholder="Email">
      <div *ngIf="state.errors.email" class="error">
        {{ state.errors.email }}
      </div>

      <input
        type="password"
        [(ngModel)]="state.password"
        (blur)="validatePassword()"
        placeholder="Password">
      <div *ngIf="state.errors.password" class="error">
        {{ state.errors.password }}
      </div>

      <button [disabled]="!isValid()">Login</button>
    </form>
  `
})
export class LoginComponent {
  state = this.bindX.reactive<FormState>({
    email: '',
    password: '',
    errors: {}
  });

  isValid = this.bindX.computed(() =>
    !this.state.errors.email && !this.state.errors.password
  );

  constructor(private bindX: BindXService) {}

  validateEmail() {
    const email = this.state.email.trim();
    if (!email) {
      this.state.errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.state.errors.email = 'Invalid email format';
    } else {
      delete this.state.errors.email;
    }
  }

  validatePassword() {
    const pwd = this.state.password;
    if (!pwd) {
      this.state.errors.password = 'Password is required';
    } else if (pwd.length < 8) {
      this.state.errors.password = 'Password must be at least 8 characters';
    } else {
      delete this.state.errors.password;
    }
  }

  submit() {
    this.validateEmail();
    this.validatePassword();

    if (this.isValid()) {
      console.log('Form submitted:', {
        email: this.state.email,
        password: this.state.password
      });
    }
  }
}
```

---

### Data Fetching with RxJS

```typescript
@Component({
  selector: 'app-users',
  template: `
    <div *ngIf="state.loading">Loading...</div>
    <div *ngIf="state.error">Error: {{ state.error }}</div>

    <div *ngFor="let user of state.users">
      {{ user.name }}
    </div>

    <button (click)="refresh()">Refresh</button>
  `
})
export class UsersComponent implements OnInit {
  state = this.bindX.reactive({
    users: [] as User[],
    loading: false,
    error: null as string | null
  });

  constructor(
    private bindX: BindXService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();

    // Auto-refresh every 30 seconds
    const refresh$ = interval(30000);
    this.bindX.fromObservable(refresh$, 0);

    this.bindX.watch(
      () => refresh$.value,
      () => this.loadUsers()
    );
  }

  loadUsers() {
    this.state.loading = true;
    this.state.error = null;

    this.http.get<User[]>('/api/users')
      .subscribe({
        next: (users) => {
          this.state.users = users;
          this.state.loading = false;
        },
        error: (err) => {
          this.state.error = err.message;
          this.state.loading = false;
        }
      });
  }

  refresh() {
    this.loadUsers();
  }
}
```

---

## Best Practices

### 1. Type Safety

Always type your reactive state:

```typescript
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

state = this.bindX.reactive<AppState>({
  user: null,
  isAuthenticated: false,
  loading: false
});
```

---

### 2. Service-Based State

For shared state, use a service:

```typescript
@Injectable({ providedIn: 'root' })
export class AppStateService {
  state = this.bindX.reactive({
    user: null as User | null,
    theme: 'light' as 'light' | 'dark'
  });

  isLoggedIn = this.bindX.computed(() =>
    this.state.user !== null
  );

  constructor(private bindX: BindXService) {}

  login(user: User) {
    this.state.user = user;
  }

  logout() {
    this.state.user = null;
  }

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
  }
}
```

Use in components:

```typescript
@Component({...})
export class HeaderComponent {
  constructor(public appState: AppStateService) {}
}
```

```html
<div *ngIf="appState.isLoggedIn()">
  Welcome, {{ appState.state.user?.name }}!
</div>
```

---

### 3. Computed Property Performance

Keep computed properties focused and efficient:

```typescript
// ✅ Good: Focused computation
totalPrice = this.bindX.computed(() =>
  this.state.items.reduce((sum, item) => sum + item.price, 0)
);

// ❌ Bad: Too much work in computed
summary = this.bindX.computed(() => {
  // Expensive operations
  const sorted = this.state.items.sort(...);
  const filtered = sorted.filter(...);
  const mapped = filtered.map(...);
  return mapped;
});
```

---

### 4. Watcher Cleanup

Watchers are automatically cleaned up on component destroy, but you can manually unwatch:

```typescript
private unwatchUserId: UnwatchFn;

ngOnInit() {
  this.unwatchUserId = this.bindX.watch(
    () => this.state.userId,
    (id) => this.fetchData(id)
  );
}

ngOnDestroy() {
  this.unwatchUserId(); // Manual cleanup if needed
}
```

---

### 5. OnPush Change Detection

bindX works with OnPush strategy:

```typescript
@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ state.value }}</div>`
})
export class OptimizedComponent {
  state = this.bindX.reactive({ value: 0 });

  constructor(private bindX: BindXService) {}

  update() {
    this.state.value++; // Change detection still works!
  }
}
```

---

## Migration Guide

### From BehaviorSubject

**Before (BehaviorSubject):**

```typescript
private countSubject = new BehaviorSubject<number>(0);
count$ = this.countSubject.asObservable();

increment() {
  this.countSubject.next(this.countSubject.value + 1);
}
```

**After (bindX):**

```typescript
state = this.bindX.reactive({ count: 0 });
count$ = this.bindX.toObservable(() => this.state.count);

increment() {
  this.state.count++;
}
```

**Benefits:**
- Less boilerplate
- Direct property access
- Automatic Observable conversion

---

### From NgRx ComponentStore

**Before (ComponentStore):**

```typescript
interface State {
  todos: Todo[];
}

@Injectable()
export class TodoStore extends ComponentStore<State> {
  readonly todos$ = this.select(state => state.todos);

  readonly addTodo = this.updater((state, todo: Todo) => ({
    todos: [...state.todos, todo]
  }));
}
```

**After (bindX):**

```typescript
state = this.bindX.reactive({
  todos: [] as Todo[]
});

todos$ = this.bindX.toObservable(() => this.state.todos);

addTodo(todo: Todo) {
  this.state.todos.push(todo);
}
```

**Benefits:**
- Simpler API
- No inheritance required
- Direct mutations (no immutability required)
- Smaller bundle size

---

## Troubleshooting

### Issue: Changes not triggering view updates

**Solution:** Ensure you're modifying the reactive state directly:

```typescript
// ✅ Correct
this.state.count++;

// ❌ Wrong (creates new object)
this.state = { count: this.state.count + 1 };
```

---

### Issue: Computed property not recalculating

**Solution:** Make sure you're calling the computed function:

```typescript
// ✅ Correct
<div>{{ total() }}</div>

// ❌ Wrong
<div>{{ total }}</div>
```

---

### Issue: Memory leaks with watchers

**Solution:** Watchers auto-cleanup on component destroy if using `DestroyRef`. For services, manually unwatch:

```typescript
ngOnDestroy() {
  this.unwatch();
}
```

---

### Issue: Performance issues with large lists

**Solution:** Use `runOutsideZone` for batch updates:

```typescript
this.bindX.runOutsideZone(() => {
  for (let i = 0; i < 1000; i++) {
    this.state.items.push({ id: i, value: i });
  }
});
this.bindX.detectChanges(); // Single update
```

---

### Issue: TypeScript errors with reactive state

**Solution:** Explicitly type your state:

```typescript
interface State {
  value: number;
}

state = this.bindX.reactive<State>({ value: 0 });
```

---

## Testing

### Unit Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { BindXService } from '@genx/bindx-angular';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;
  let bindX: BindXService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BindXService]
    });

    bindX = TestBed.inject(BindXService);
    component = new CounterComponent(bindX);
  });

  it('should increment count', () => {
    expect(component.state.count).toBe(0);

    component.increment();
    expect(component.state.count).toBe(1);
  });

  it('should compute doubled value', () => {
    component.state.count = 5;
    expect(component.doubled()).toBe(10);
  });
});
```

---

## Performance Tips

1. **Use computed properties** for derived values instead of recalculating in templates
2. **Batch updates** with `runOutsideZone` for large operations
3. **Use OnPush** change detection strategy when possible
4. **Avoid deep watchers** unless necessary
5. **Memoize expensive computations** with computed properties

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires Angular 12+ and modern browser with Proxy support.

---

## License

MIT License

---

## Support

- **GitHub:** https://github.com/genx/genx
- **Documentation:** https://genx.software/docs/bindx-angular
- **Issues:** https://github.com/genx/genx/issues

---

Happy coding with bindX + Angular! 🚀
