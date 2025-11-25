# Getting Started with bindX

bindX is a lightweight (~3KB) reactive data binding library that brings Vue 3-style reactivity to any web project without framework dependencies. Use it to build reactive UIs with declarative HTML attributes or programmatic JavaScript APIs.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Basic Examples](#basic-examples)
5. [Two-Way Binding](#two-way-binding)
6. [Computed Properties](#computed-properties)
7. [Watchers](#watchers)
8. [Form Validation](#form-validation)
9. [Performance](#performance)
10. [Next Steps](#next-steps)

---

## Quick Start

Add bindX to your page and create reactive data bindings with just HTML attributes:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.genx.software/bindX@1.0.0/bindx.min.js"></script>
</head>
<body>
  <div id="app">
    <input type="text" bx-model="message" placeholder="Type here...">
    <p>You typed: <span bx-bind="message"></span></p>
  </div>

  <script>
    const app = bindX.init(bindX.reactive({
      message: 'Hello, bindX!'
    }));
  </script>
</body>
</html>
```

That's it! The input and span are now synchronized automatically.

---

## Installation

### CDN (Recommended for Getting Started)

```html
<!-- Include in <head> -->
<script src="https://cdn.genx.software/bindX@1.0.0/bindx.min.js"></script>
```

### NPM

```bash
npm install @genx/bindx
```

```javascript
// Import in your JavaScript
import { bindx, reactive, computed } from '@genx/bindx';
```

### Download

Download from [genx.software/downloads](https://genx.software/downloads):

```html
<script src="/path/to/bindx.min.js"></script>
```

---

## Core Concepts

### 1. Reactive Data

Create reactive objects with `reactive()` or `bindx()`:

```javascript
const state = bindX.reactive({
  user: {
    name: 'Alice',
    age: 25
  },
  cart: []
});
```

Any changes to `state` automatically update bound UI elements:

```javascript
state.user.name = 'Bob'; // UI updates automatically!
```

### 2. Data Binding Attributes

Use `bx-*` attributes to bind data to DOM elements:

- **`bx-model`** - Two-way binding (form → data, data → form)
- **`bx-bind`** - One-way binding (data → DOM display)
- **`bx-validate`** - Form validation rules

### 3. Automatic Dependency Tracking

bindX tracks which properties your computed values depend on and only recalculates when those dependencies change:

```javascript
const data = reactive({ price: 100, tax: 0.1 });
const total = computed(() => data.price * (1 + data.tax));

console.log(total()); // 110
data.tax = 0.2;
console.log(total()); // 120 (automatically recomputed)
```

---

## Basic Examples

### Example 1: Simple Counter

```html
<div id="counter-app">
  <p>Count: <span bx-bind="count"></span></p>
  <button onclick="app.data.count++">Increment</button>
  <button onclick="app.data.count--">Decrement</button>
</div>

<script>
  const app = bindX.init(bindX.reactive({
    count: 0
  }));
</script>
```

**Features:**
- One-way binding displays current count
- Buttons modify reactive data
- UI updates automatically

---

### Example 2: Text Input Mirror

```html
<div id="mirror-app">
  <input type="text" bx-model="text" placeholder="Type something...">
  <p>You typed: <span bx-bind="text"></span></p>
  <p>Length: <span bx-bind="length"></span> characters</p>
</div>

<script>
  const data = bindX.reactive({ text: '' });

  const length = bindX.computed(() => data.text.length);

  bindX.init(data);

  // Manually bind computed value
  const lengthSpan = document.querySelector('[bx-bind="length"]');
  bindX.watch(data, 'text', () => {
    lengthSpan.textContent = length();
  });
</script>
```

**Features:**
- Two-way binding keeps input synchronized
- Computed property calculates text length
- Watcher updates computed display

---

### Example 3: User Profile

```html
<div id="profile-app">
  <h2>User Profile</h2>

  <label>Name:
    <input type="text" bx-model="user.name">
  </label>

  <label>Email:
    <input type="email" bx-model="user.email">
  </label>

  <label>Age:
    <input type="number" bx-model="user.age">
  </label>

  <h3>Preview:</h3>
  <p>Name: <span bx-bind="user.name"></span></p>
  <p>Email: <span bx-bind="user.email"></span></p>
  <p>Age: <span bx-bind="user.age"></span></p>
</div>

<script>
  bindX.init(bindX.reactive({
    user: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28
    }
  }));
</script>
```

**Features:**
- Nested property binding (`user.name`, `user.email`)
- Multiple bindings to same data
- Automatic type conversion (number input)

---

### Example 4: Shopping Cart

```html
<div id="cart-app">
  <h2>Shopping Cart</h2>

  <div>
    <input type="number" bx-model="quantity" min="1" value="1">
    <input type="number" bx-model="price" step="0.01" value="10.00">
    <button onclick="addItem()">Add Item</button>
  </div>

  <p>Subtotal: $<span bx-bind="subtotal"></span></p>
  <p>Tax (10%): $<span bx-bind="tax"></span></p>
  <p><strong>Total: $<span bx-bind="total"></span></strong></p>
</div>

<script>
  const cart = bindX.reactive({
    quantity: 1,
    price: 10.00,
    items: []
  });

  const subtotal = bindX.computed(() =>
    cart.quantity * cart.price
  );

  const tax = bindX.computed(() =>
    subtotal() * 0.10
  );

  const total = bindX.computed(() =>
    subtotal() + tax()
  );

  bindX.init(cart);

  // Manually update computed displays
  function updateTotals() {
    document.querySelector('[bx-bind="subtotal"]').textContent = subtotal().toFixed(2);
    document.querySelector('[bx-bind="tax"]').textContent = tax().toFixed(2);
    document.querySelector('[bx-bind="total"]').textContent = total().toFixed(2);
  }

  bindX.watch(cart, 'quantity', updateTotals);
  bindX.watch(cart, 'price', updateTotals);
  updateTotals(); // Initial update

  function addItem() {
    cart.items.push({ quantity: cart.quantity, price: cart.price });
    alert(`Added ${cart.quantity} item(s) at $${cart.price} each`);
  }
</script>
```

**Features:**
- Multiple computed properties with dependencies
- Nested computed (total depends on subtotal and tax)
- Watchers trigger updates on changes

---

## Two-Way Binding

Two-way binding synchronizes form inputs with reactive data in both directions.

### Basic Two-Way Binding

```html
<input type="text" bx-model="username">
```

Changes to the input update `data.username`, and changes to `data.username` update the input.

### Input Types

#### Text Input
```html
<input type="text" bx-model="user.name">
```

#### Number Input
```html
<input type="number" bx-model="age">
```
Automatically converts to number type.

#### Checkbox
```html
<input type="checkbox" bx-model="agreed">
```
Binds to boolean value.

#### Radio Buttons
```html
<input type="radio" bx-model="size" value="small"> Small
<input type="radio" bx-model="size" value="large"> Large
```

#### Select Dropdown
```html
<select bx-model="country">
  <option value="us">United States</option>
  <option value="ca">Canada</option>
  <option value="uk">United Kingdom</option>
</select>
```

#### Textarea
```html
<textarea bx-model="message" rows="4"></textarea>
```

### Debouncing

Delay updates for performance (useful for search inputs):

```html
<!-- Update after 300ms of no typing -->
<input type="text" bx-model="search:300" placeholder="Search...">

<!-- Or use attribute -->
<input type="text" bx-model="search" bx-debounce="300">
```

---

## Computed Properties

Computed properties automatically recalculate when their dependencies change.

### Basic Computed

```javascript
const data = reactive({ firstName: 'John', lastName: 'Doe' });

const fullName = computed(() =>
  `${data.firstName} ${data.lastName}`
);

console.log(fullName()); // "John Doe"

data.firstName = 'Jane';
console.log(fullName()); // "Jane Doe" (auto-updated)
```

### Nested Computed

```javascript
const data = reactive({ price: 100, quantity: 2 });

const subtotal = computed(() => data.price * data.quantity);
const tax = computed(() => subtotal() * 0.1);
const total = computed(() => subtotal() + tax());

console.log(total()); // 220
```

### Computed with Complex Logic

```javascript
const data = reactive({
  items: [
    { name: 'Laptop', price: 999, quantity: 1 },
    { name: 'Mouse', price: 29, quantity: 2 }
  ]
});

const cartTotal = computed(() =>
  data.items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  )
);

console.log(cartTotal()); // 1057
```

**Benefits:**
- Automatic dependency tracking
- Lazy evaluation (only computed when accessed)
- Memoization (cached until dependencies change)

---

## Watchers

Watchers observe reactive properties and run callbacks when they change.

### Basic Watcher

```javascript
const data = reactive({ count: 0 });

const unwatch = bindX.watch(data, 'count', (newValue) => {
  console.log('Count changed to:', newValue);
});

data.count = 5; // Logs: "Count changed to: 5"

// Stop watching
unwatch();
```

### Nested Property Watcher

```javascript
const data = reactive({
  user: {
    profile: {
      email: 'alice@example.com'
    }
  }
});

bindX.watch(data, 'user.profile.email', (newEmail) => {
  console.log('Email changed to:', newEmail);
});

data.user.profile.email = 'bob@example.com';
// Logs: "Email changed to: bob@example.com"
```

### Multiple Watchers

```javascript
const data = reactive({ x: 0, y: 0 });

bindX.watch(data, 'x', (val) => console.log('X:', val));
bindX.watch(data, 'y', (val) => console.log('Y:', val));

data.x = 10; // Logs: "X: 10"
data.y = 20; // Logs: "Y: 20"
```

### Watcher Use Cases

- **Logging**: Track state changes for debugging
- **API Calls**: Trigger requests when data changes
- **Side Effects**: Update localStorage, analytics, etc.
- **Derived State**: Update one property based on another

---

## Form Validation

bindX includes built-in form validation with 14 validation rules.

### Basic Form Validation

```html
<form bx-form>
  <label>Email:
    <input
      type="email"
      bx-model="email"
      bx-validate='{"required":true,"email":true}'
      bx-error-required="Email is required"
      bx-error-email="Please enter a valid email"
    >
  </label>
  <div class="bx-error-message"></div>

  <label>Age:
    <input
      type="number"
      bx-model="age"
      bx-validate='{"required":true,"min":18,"max":100}'
      bx-error-min="Must be at least 18"
      bx-error-max="Must be under 100"
    >
  </label>
  <div class="bx-error-message"></div>

  <button type="submit">Submit</button>
</form>

<script>
  const formData = bindX.reactive({ email: '', age: null });
  bindX.init(formData);
</script>
```

### Validation Rules

#### `required`
```html
<input bx-validate='{"required":true}'>
```

#### `email`
```html
<input type="email" bx-validate='{"email":true}'>
```

#### `min` / `max` (numeric)
```html
<input type="number" bx-validate='{"min":18,"max":65}'>
```

#### `minLength` / `maxLength` (string)
```html
<input type="text" bx-validate='{"minLength":8,"maxLength":20}'>
```

#### `pattern` (regex)
```html
<input bx-validate='{"pattern":"^[A-Z]"}'>
```

#### `url`
```html
<input type="url" bx-validate='{"url":true}'>
```

#### `phone`
```html
<input type="tel" bx-validate='{"phone":true}'>
```

#### `alphanumeric`
```html
<input bx-validate='{"alphanumeric":true}'>
```

#### `custom` (function)
```javascript
bindX.validationRules.custom = (value) => {
  return value.startsWith('A') || 'Must start with A';
};
```

### Form State Classes

bindX automatically applies CSS classes:

```css
/* Form states */
.bx-pristine { /* Form hasn't been modified */ }
.bx-dirty { /* Form has been modified */ }
.bx-valid { /* Form is valid */ }
.bx-invalid { /* Form has errors */ }

/* Field states */
input.bx-error { border-color: red; }
input.bx-valid { border-color: green; }
```

### Programmatic Validation

```javascript
const form = document.querySelector('form');
const data = bindX.reactive({ email: '', password: '' });

const result = bindX.validateForm(form, data);

if (result.valid) {
  console.log('Form is valid!');
} else {
  console.log('Errors:', result.errors);
  // { email: ['Email is required'], password: ['Password too short'] }
}
```

---

## Performance

bindX is optimized for performance with several techniques:

### 1. Batched Updates (60 FPS Target)

Updates are batched using `requestAnimationFrame` to prevent layout thrashing:

```javascript
// Multiple updates in the same frame are batched
data.count = 1;
data.count = 2;
data.count = 3;
// Only ONE DOM update occurs (to value 3)
```

### 2. Automatic Debouncing

Input debouncing prevents excessive updates:

```html
<!-- Updates every 300ms while typing -->
<input bx-model="search:300">
```

### 3. Computed Memoization

Computed properties cache results:

```javascript
const expensive = computed(() => {
  // Only runs when dependencies change
  return data.items.reduce(...);
});
```

### 4. WeakMap Memory Management

Reactive metadata uses WeakMaps for automatic garbage collection - no memory leaks!

### Performance Targets

- **Bundle Size**: <3KB minified + gzipped
- **Update Speed**: <0.5ms per binding
- **Operation Time**: <16ms (60 FPS)
- **Memory**: Auto-GC with WeakMaps

---

## Next Steps

### Learn More

- **[Full API Reference](../api/bindx-api.md)** - Complete attribute and method documentation
- **[Form Validation Guide](./bindx-forms.md)** - Advanced form handling
- **[Performance Guide](./bindx-performance.md)** - Optimization techniques
- **[Framework Integration](./bindx-frameworks.md)** - Use with React, Vue, Angular, Svelte
- **[Live Examples](../../examples/bindx-demo.html)** - Interactive demos

### Common Tasks

**Create reactive object:**
```javascript
const state = bindX.reactive({ count: 0 });
```

**Watch for changes:**
```javascript
bindX.watch(state, 'count', (value) => console.log(value));
```

**Computed property:**
```javascript
const double = bindX.computed(() => state.count * 2);
```

**Form validation:**
```html
<input bx-validate='{"required":true,"email":true}'>
```

**Debounced input:**
```html
<input bx-model="search:300">
```

### Community

- **GitHub:** https://github.com/genx/genx
- **Discussions:** https://github.com/genx/genx/discussions
- **Issues:** https://github.com/genx/genx/issues
- **Twitter:** @genx_software

---

## FAQ

**Q: How does bindX compare to Vue 3?**

A: bindX uses the same Proxy-based reactivity as Vue 3 but is framework-agnostic and much smaller (<3KB vs 40KB+). It's perfect for adding reactivity to existing projects without a full framework.

**Q: Can I use bindX with React/Vue/Angular?**

A: Yes! bindX works alongside frameworks. See the [Framework Integration Guide](./bindx-frameworks.md) for details.

**Q: Does bindX support TypeScript?**

A: Yes! Type definitions are included in the npm package.

**Q: Is bindX production-ready?**

A: Yes! bindX v1.0 is thoroughly tested with 100+ unit tests and comprehensive BDD scenarios.

**Q: How do I handle complex nested data?**

A: bindX supports deep reactivity automatically. All nested objects become reactive:
```javascript
const data = reactive({ user: { profile: { name: 'Alice' } } });
data.user.profile.name = 'Bob'; // Fully reactive!
```

**Q: Can I use bindX without HTML attributes?**

A: Absolutely! The JavaScript API works standalone:
```javascript
const data = reactive({ count: 0 });
watch(data, 'count', (val) => console.log(val));
```

---

## Troubleshooting

**Problem:** Binding doesn't update

**Solution:**
1. Check that data object is reactive: `bindX.isReactive(data)`
2. Verify attribute syntax: `bx-model="propertyName"` (no typos)
3. Ensure `bindX.init()` was called
4. Check browser console for errors

---

**Problem:** Validation doesn't trigger

**Solution:**
1. Ensure form has `bx-form` attribute
2. Verify validation rules are valid JSON: `bx-validate='{"required":true}'`
3. Check that field has `bx-model` attribute
4. Verify rule names are correct (e.g., `email`, not `Email`)

---

**Problem:** Performance issues with large forms

**Solution:**
1. Use debouncing: `bx-model="field:300"`
2. Batch updates manually: `bindX.getBatchQueue().flush()`
3. Disable deep reactivity if not needed: `reactive(data, { deep: false })`
4. Use computed properties to minimize calculations

---

## Getting Help

If you're stuck:

1. Check the [API Reference](../api/bindx-api.md)
2. Browse [Examples](../../examples/bindx-demo.html)
3. Search [GitHub Issues](https://github.com/genx/genx/issues)
4. Ask in [Discussions](https://github.com/genx/genx/discussions)

Happy binding! 🎉
