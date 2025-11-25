/**
 * @genx/bindx-angular - Example Angular Component
 *
 * This file demonstrates how to use bindX with Angular applications.
 * Includes examples of reactive state, computed properties, watchers,
 * RxJS integration, and form handling.
 */

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BindXService } from '../src/bindx-angular';

/**
 * Example 1: Simple Counter Component
 */
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="counter">
      <h2>Counter Example</h2>
      <div class="display">{{ state.count }}</div>
      <div class="buttons">
        <button (click)="decrement()">-</button>
        <button (click)="reset()">Reset</button>
        <button (click)="increment()">+</button>
      </div>
      <p>
        Status: {{ status() }}<br>
        Doubled: {{ doubled() }}
      </p>
    </div>
  `,
  styles: [`
    .counter {
      padding: 2rem;
      text-align: center;
    }
    .display {
      font-size: 3rem;
      font-weight: bold;
      margin: 1rem 0;
    }
    .buttons button {
      margin: 0 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 1.2rem;
    }
  `]
})
export class CounterComponent implements OnInit {
  state = this.bindX.reactive({
    count: 0
  });

  // Computed properties
  doubled = this.bindX.computed(() => this.state.count * 2);

  status = this.bindX.computed(() => {
    const count = this.state.count;
    if (count === 0) return 'Zero';
    if (count > 0) return 'Positive';
    return 'Negative';
  });

  constructor(private bindX: BindXService) {}

  ngOnInit() {
    // Watch for changes
    this.bindX.watch(
      () => this.state.count,
      (newValue, oldValue) => {
        console.log(`Count changed from ${oldValue} to ${newValue}`);
      }
    );
  }

  increment() {
    this.state.count++;
  }

  decrement() {
    this.state.count--;
  }

  reset() {
    this.state.count = 0;
  }
}

/**
 * Example 2: Todo List with Filtering
 */
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="todo-app">
      <h2>Todo List</h2>

      <div class="input-section">
        <input
          [(ngModel)]="newTodoText"
          (keyup.enter)="addTodo()"
          placeholder="What needs to be done?"
          class="todo-input">
        <button (click)="addTodo()">Add</button>
      </div>

      <div *ngIf="state.todos.length > 0" class="todo-list">
        <div *ngFor="let todo of filteredTodos()" class="todo-item">
          <input
            type="checkbox"
            [checked]="todo.completed"
            (change)="toggleTodo(todo.id)">
          <span [class.completed]="todo.completed">{{ todo.text }}</span>
          <button (click)="removeTodo(todo.id)" class="delete-btn">✖</button>
        </div>
      </div>

      <div *ngIf="state.todos.length > 0" class="footer">
        <span>{{ remainingCount() }} items left</span>
        <div class="filters">
          <button
            [class.active]="state.filter === 'all'"
            (click)="state.filter = 'all'">
            All
          </button>
          <button
            [class.active]="state.filter === 'active'"
            (click)="state.filter = 'active'">
            Active
          </button>
          <button
            [class.active]="state.filter === 'completed'"
            (click)="state.filter = 'completed'">
            Completed
          </button>
        </div>
        <button (click)="clearCompleted()" *ngIf="completedCount() > 0">
          Clear Completed
        </button>
      </div>
    </div>
  `,
  styles: [`
    .todo-app {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }
    .input-section {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .todo-input {
      flex: 1;
      padding: 0.75rem;
      font-size: 1rem;
      border: 2px solid #ddd;
      border-radius: 4px;
    }
    .todo-list {
      margin: 1rem 0;
    }
    .todo-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }
    .todo-item span {
      flex: 1;
    }
    .completed {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .delete-btn {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      border-radius: 4px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #ddd;
    }
    .filters {
      display: flex;
      gap: 0.5rem;
    }
    .filters button.active {
      background: #667eea;
      color: white;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 4px;
    }
    button:hover {
      background: #f0f0f0;
    }
  `]
})
export class TodoListComponent implements OnInit {
  state = this.bindX.reactive({
    todos: [] as Todo[],
    filter: 'all' as FilterType
  });

  newTodoText = '';

  // Computed properties
  filteredTodos = this.bindX.computed(() => {
    switch (this.state.filter) {
      case 'active':
        return this.state.todos.filter(t => !t.completed);
      case 'completed':
        return this.state.todos.filter(t => t.completed);
      default:
        return this.state.todos;
    }
  });

  remainingCount = this.bindX.computed(() =>
    this.state.todos.filter(t => !t.completed).length
  );

  completedCount = this.bindX.computed(() =>
    this.state.todos.filter(t => t.completed).length
  );

  constructor(private bindX: BindXService) {}

  ngOnInit() {
    // Watch for filter changes
    this.bindX.watch(
      () => this.state.filter,
      (newFilter, oldFilter) => {
        console.log(`Filter changed from ${oldFilter} to ${newFilter}`);
      }
    );

    // Load sample todos
    this.state.todos = [
      { id: 1, text: 'Learn bindX', completed: false },
      { id: 2, text: 'Build Angular app', completed: false },
      { id: 3, text: 'Deploy to production', completed: false }
    ];
  }

  addTodo() {
    const text = this.newTodoText.trim();
    if (text) {
      this.state.todos.push({
        id: Date.now(),
        text,
        completed: false
      });
      this.newTodoText = '';
    }
  }

  toggleTodo(id: number) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  removeTodo(id: number) {
    const index = this.state.todos.findIndex(t => t.id === id);
    if (index > -1) {
      this.state.todos.splice(index, 1);
    }
  }

  clearCompleted() {
    this.state.todos = this.state.todos.filter(t => !t.completed);
  }
}

/**
 * Example 3: Form with Validation
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-container">
      <h2>User Registration</h2>

      <form (ngSubmit)="submit()">
        <div class="form-group">
          <label>Username:</label>
          <input
            [(ngModel)]="state.username"
            name="username"
            (blur)="validateUsername()"
            [class.error]="errors().username">
          <div *ngIf="errors().username" class="error-message">
            {{ errors().username }}
          </div>
        </div>

        <div class="form-group">
          <label>Email:</label>
          <input
            type="email"
            [(ngModel)]="state.email"
            name="email"
            (blur)="validateEmail()"
            [class.error]="errors().email">
          <div *ngIf="errors().email" class="error-message">
            {{ errors().email }}
          </div>
        </div>

        <div class="form-group">
          <label>Age:</label>
          <input
            type="number"
            [(ngModel)]="state.age"
            name="age"
            (blur)="validateAge()"
            [class.error]="errors().age">
          <div *ngIf="errors().age" class="error-message">
            {{ errors().age }}
          </div>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [(ngModel)]="state.agreed"
              name="agreed">
            I agree to the terms
          </label>
          <div *ngIf="errors().agreed" class="error-message">
            {{ errors().agreed }}
          </div>
        </div>

        <button
          type="submit"
          [disabled]="!isValid()">
          Register
        </button>

        <div *ngIf="state.submitted" class="success-message">
          ✓ Registration successful!
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    input[type="text"],
    input[type="email"],
    input[type="number"] {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    input.error {
      border-color: #e74c3c;
    }
    .error-message {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .success-message {
      color: #27ae60;
      font-weight: 600;
      margin-top: 1rem;
      padding: 1rem;
      background: #d5f4e6;
      border-radius: 4px;
    }
    button[type="submit"] {
      width: 100%;
      padding: 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button[type="submit"]:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    button[type="submit"]:not(:disabled):hover {
      background: #5568d3;
    }
  `]
})
export class UserFormComponent implements OnInit {
  state = this.bindX.reactive({
    username: '',
    email: '',
    age: null as number | null,
    agreed: false,
    submitted: false,
    validationErrors: {
      username: '',
      email: '',
      age: '',
      agreed: ''
    }
  });

  // Computed properties
  errors = this.bindX.computed(() => this.state.validationErrors);

  isValid = this.bindX.computed(() => {
    const errors = this.state.validationErrors;
    return !errors.username && !errors.email && !errors.age && !errors.agreed;
  });

  constructor(private bindX: BindXService) {}

  ngOnInit() {
    // Watch for changes and validate
    this.bindX.watch(
      () => this.state.username,
      () => {
        if (this.state.validationErrors.username) {
          this.validateUsername();
        }
      }
    );

    this.bindX.watch(
      () => this.state.email,
      () => {
        if (this.state.validationErrors.email) {
          this.validateEmail();
        }
      }
    );

    this.bindX.watch(
      () => this.state.age,
      () => {
        if (this.state.validationErrors.age) {
          this.validateAge();
        }
      }
    );
  }

  validateUsername() {
    const username = this.state.username.trim();
    if (!username) {
      this.state.validationErrors.username = 'Username is required';
    } else if (username.length < 3) {
      this.state.validationErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 20) {
      this.state.validationErrors.username = 'Username cannot exceed 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.state.validationErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else {
      this.state.validationErrors.username = '';
    }
  }

  validateEmail() {
    const email = this.state.email.trim();
    if (!email) {
      this.state.validationErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.state.validationErrors.email = 'Please enter a valid email address';
    } else {
      this.state.validationErrors.email = '';
    }
  }

  validateAge() {
    const age = this.state.age;
    if (!age) {
      this.state.validationErrors.age = 'Age is required';
    } else if (age < 18) {
      this.state.validationErrors.age = 'You must be at least 18 years old';
    } else if (age > 120) {
      this.state.validationErrors.age = 'Please enter a valid age';
    } else {
      this.state.validationErrors.age = '';
    }
  }

  validateAgreed() {
    if (!this.state.agreed) {
      this.state.validationErrors.agreed = 'You must agree to the terms';
    } else {
      this.state.validationErrors.agreed = '';
    }
  }

  submit() {
    // Validate all fields
    this.validateUsername();
    this.validateEmail();
    this.validateAge();
    this.validateAgreed();

    if (this.isValid()) {
      console.log('Form submitted:', {
        username: this.state.username,
        email: this.state.email,
        age: this.state.age,
        agreed: this.state.agreed
      });

      this.state.submitted = true;

      // Reset after 3 seconds
      setTimeout(() => {
        this.state.username = '';
        this.state.email = '';
        this.state.age = null;
        this.state.agreed = false;
        this.state.submitted = false;
        this.state.validationErrors = {
          username: '',
          email: '',
          age: '',
          agreed: ''
        };
      }, 3000);
    }
  }
}

/**
 * Example 4: RxJS Integration with Data Fetching
 */
@Component({
  selector: 'app-data-fetcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-container">
      <h2>Data Fetcher with RxJS</h2>

      <button (click)="fetchData()">Fetch Data</button>
      <button (click)="startAutoRefresh()">Auto-Refresh (10s)</button>
      <button (click)="stopAutoRefresh()">Stop Auto-Refresh</button>

      <div *ngIf="state.loading" class="loading">Loading...</div>

      <div *ngIf="state.error" class="error">
        Error: {{ state.error }}
      </div>

      <div *ngIf="!state.loading && !state.error && state.data" class="data">
        <h3>Fetched Data:</h3>
        <pre>{{ state.data | json }}</pre>
        <p>Fetch Count: {{ state.fetchCount }}</p>
        <p>Last Updated: {{ state.lastUpdated | date:'medium' }}</p>
      </div>

      <div class="observable-demo">
        <h3>Observable Count: {{ observableCount$ | async }}</h3>
      </div>
    </div>
  `,
  styles: [`
    .data-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
    }
    button {
      margin: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #5568d3;
    }
    .loading {
      color: #3498db;
      font-weight: 600;
      margin: 1rem 0;
    }
    .error {
      color: #e74c3c;
      padding: 1rem;
      background: #ffe6e6;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .data {
      margin: 1rem 0;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    .observable-demo {
      margin-top: 2rem;
      padding: 1rem;
      background: #e8f4f8;
      border-radius: 4px;
    }
  `]
})
export class DataFetcherComponent implements OnInit {
  state = this.bindX.reactive({
    data: null as any,
    loading: false,
    error: null as string | null,
    fetchCount: 0,
    lastUpdated: null as Date | null
  });

  // Convert reactive state to Observable
  observableCount$ = this.bindX.toObservable(() => this.state.fetchCount);

  private refreshInterval: any = null;

  constructor(private bindX: BindXService) {}

  ngOnInit() {
    // Watch for fetch count changes
    this.bindX.watch(
      () => this.state.fetchCount,
      (count) => {
        console.log('Fetch count:', count);
      }
    );
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  fetchData() {
    this.state.loading = true;
    this.state.error = null;

    // Simulate API call
    setTimeout(() => {
      // Random success/failure
      if (Math.random() > 0.2) {
        this.state.data = {
          id: Date.now(),
          message: 'Data fetched successfully',
          timestamp: new Date().toISOString(),
          random: Math.random()
        };
        this.state.loading = false;
        this.state.fetchCount++;
        this.state.lastUpdated = new Date();
      } else {
        this.state.error = 'Failed to fetch data';
        this.state.loading = false;
      }
    }, 1000);
  }

  startAutoRefresh() {
    if (!this.refreshInterval) {
      this.fetchData(); // Immediate fetch
      this.refreshInterval = setInterval(() => {
        this.fetchData();
      }, 10000);
    }
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

/**
 * Root App Component
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    CounterComponent,
    TodoListComponent,
    UserFormComponent,
    DataFetcherComponent
  ],
  template: `
    <div class="app">
      <header>
        <h1>bindX Angular Examples</h1>
        <p>Reactive state management for Angular</p>
      </header>

      <main>
        <section>
          <app-counter></app-counter>
        </section>

        <section>
          <app-todo-list></app-todo-list>
        </section>

        <section>
          <app-user-form></app-user-form>
        </section>

        <section>
          <app-data-fetcher></app-data-fetcher>
        </section>
      </main>

      <footer>
        <p>Built with bindX + Angular</p>
      </footer>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      background: #f5f5f5;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
    }
    header p {
      margin: 0;
      font-size: 1.2rem;
      opacity: 0.9;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    footer {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
export class AppComponent {}

/**
 * Bootstrap the application
 *
 * In main.ts:
 * ```typescript
 * import { bootstrapApplication } from '@angular/platform-browser';
 * import { AppComponent } from './app.component';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     // BindXService is automatically provided via providedIn: 'root'
 *   ]
 * });
 * ```
 */
