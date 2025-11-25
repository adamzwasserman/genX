# bindX API Reference

Complete API documentation for bindX v1.0 - A lightweight reactive data binding library.

---

## Table of Contents

1. [HTML Attributes](#html-attributes)
2. [JavaScript API](#javascript-api)
3. [Validation Rules](#validation-rules)
4. [CSS Classes](#css-classes)
5. [Custom Events](#custom-events)
6. [Configuration Options](#configuration-options)
7. [Error Handling](#error-handling)
8. [Integration Points](#integration-points)

---

## HTML Attributes

### Core Binding Attributes

#### `bx-model`

**Purpose**: Two-way data binding between form inputs and reactive data.

**Syntax**:
```html
<input bx-model="propertyPath">
```

**Parameters**:
- `propertyPath` (string): Dot-notation path to reactive property (e.g., `user.name`, `items.0.price`)

**Supported Elements**:
- `<input type="text">` - Text inputs
- `<input type="number">` - Number inputs
- `<input type="email">` - Email inputs
- `<input type="password">` - Password inputs
- `<input type="checkbox">` - Checkbox (boolean or array binding)
- `<input type="radio">` - Radio buttons (value binding)
- `<select>` - Dropdowns (single or multiple)
- `<textarea>` - Multi-line text

**Examples**:

```html
<!-- Simple text binding -->
<input type="text" bx-model="username">

<!-- Nested property -->
<input type="email" bx-model="user.contact.email">

<!-- Checkbox (boolean) -->
<input type="checkbox" bx-model="agreed">

<!-- Checkbox (array) -->
<input type="checkbox" bx-model="selectedTags" value="javascript">
<input type="checkbox" bx-model="selectedTags" value="python">

<!-- Radio buttons -->
<input type="radio" bx-model="size" value="small">
<input type="radio" bx-model="size" value="large">

<!-- Select dropdown -->
<select bx-model="country">
  <option value="us">USA</option>
  <option value="ca">Canada</option>
</select>

<!-- Multi-select -->
<select bx-model="favoriteColors" multiple>
  <option value="red">Red</option>
  <option value="blue">Blue</option>
</select>

<!-- Textarea -->
<textarea bx-model="bio"></textarea>
```

**Behavior**:
- Updates data on `input` event (real-time)
- Updates data on `change` event for select/radio/checkbox
- Automatically converts types for number inputs
- Handles array binding for multi-select and checkbox groups
- Supports nested properties with dot notation

---

#### `bx-bind`

**Purpose**: One-way data binding from reactive data to DOM element content or attributes.

**Syntax**:
```html
<!-- Bind to text content -->
<span bx-bind="propertyPath"></span>

<!-- Bind to attribute -->
<img bx-bind:src="imageUrl">
<a bx-bind:href="linkUrl">Link</a>
<div bx-bind:class="dynamicClass"></div>
<div bx-bind:style="dynamicStyle"></div>
```

**Parameters**:
- `propertyPath` (string): Dot-notation path to reactive property
- `:attribute` (optional): Attribute name to bind (src, href, class, style, disabled, etc.)

**Examples**:

```html
<!-- Bind to text content -->
<p>Hello, <span bx-bind="username"></span>!</p>

<!-- Bind to nested property -->
<p>Email: <span bx-bind="user.contact.email"></span></p>

<!-- Bind to computed property -->
<p>Total: <span bx-bind="cart.total"></span></p>

<!-- Bind to src attribute -->
<img bx-bind:src="user.avatar" alt="Avatar">

<!-- Bind to href attribute -->
<a bx-bind:href="profileUrl">View Profile</a>

<!-- Bind to class attribute -->
<div bx-bind:class="statusClass"></div>

<!-- Bind to style attribute -->
<div bx-bind:style="customStyles"></div>

<!-- Bind to disabled attribute -->
<button bx-bind:disabled="isSubmitting">Submit</button>

<!-- Bind to title attribute -->
<span bx-bind:title="tooltipText">Hover me</span>
```

**Behavior**:
- Updates DOM when reactive property changes
- Escapes HTML content by default (use `innerHTML` binding for HTML)
- Supports computed properties
- Efficient updates (only changes when value differs)

---

### Configuration Attributes

#### `bx-opts`

**Purpose**: Configure binding behavior with options.

**Syntax**:
```html
<input bx-model="value" bx-opts='{"key":"value"}'>
```

**Supported Options**:
- `debounce` (number): Debounce delay in milliseconds
- `lazy` (boolean): Update on `change` instead of `input`
- `trim` (boolean): Trim whitespace from input
- `number` (boolean): Convert input to number
- `format` (string): Format type (requires fmtX)

**Examples**:

```html
<!-- Debounce input updates -->
<input bx-model="search" bx-opts='{"debounce":300}'>

<!-- Lazy binding (update on blur) -->
<input bx-model="email" bx-opts='{"lazy":true}'>

<!-- Trim whitespace -->
<input bx-model="username" bx-opts='{"trim":true}'>

<!-- Convert to number -->
<input bx-model="age" bx-opts='{"number":true}'>

<!-- Format as currency -->
<input bx-model="price" bx-opts='{"format":"currency"}'>

<!-- Combined options -->
<input bx-model="search" bx-opts='{"debounce":500,"trim":true}'>
```

---

#### `bx-debounce`

**Purpose**: Shorthand for debouncing input updates.

**Syntax**:
```html
<input bx-model="value" bx-debounce="300">
```

**Parameters**:
- Delay in milliseconds (default: 300)

**Example**:
```html
<!-- Wait 300ms after typing stops -->
<input type="search" bx-model="query" bx-debounce="300">

<!-- Wait 500ms (longer delay) -->
<input type="text" bx-model="username" bx-debounce="500">
```

**Equivalent to**:
```html
<input bx-model="value" bx-opts='{"debounce":300}'>
```

---

#### `bx-format`

**Purpose**: Format bound values using fmtX formatter.

**Syntax**:
```html
<span bx-bind="value" bx-format="formatType"></span>
```

**Supported Format Types** (requires fmtX integration):
- `currency` - $1,234.56
- `number` - 1,234.56
- `percent` - 45.67%
- `date` - Jan 15, 2025
- `time` - 3:45 PM
- `datetime` - Jan 15, 2025, 3:45 PM
- `phone` - (555) 123-4567
- `filesize` - 1.5 MB

**Examples**:

```html
<!-- Format as currency -->
<span bx-bind="price" bx-format="currency"></span>

<!-- Format as percentage -->
<span bx-bind="progress" bx-format="percent"></span>

<!-- Format date -->
<span bx-bind="createdAt" bx-format="date"></span>

<!-- Format phone number -->
<span bx-bind="phone" bx-format="phone"></span>
```

---

### Form Attributes

#### `bx-form`

**Purpose**: Mark a form for bindX validation and submission handling.

**Syntax**:
```html
<form bx-form>
  <!-- Form fields -->
</form>
```

**Behavior**:
- Enables validation for all fields with `bx-validate`
- Prevents default form submission
- Emits `bx-form-valid` or `bx-form-invalid` events on submit
- Applies state classes (`bx-pristine`, `bx-dirty`, `bx-valid`, `bx-invalid`)

**Example**:
```html
<form bx-form id="loginForm">
  <input type="email" bx-model="email" bx-validate='{"required":true,"email":true}'>
  <input type="password" bx-model="password" bx-validate='{"required":true,"minLength":8}'>
  <button type="submit">Login</button>
</form>

<script>
  const form = document.getElementById('loginForm');
  form.addEventListener('bx-form-valid', (e) => {
    console.log('Valid!', e.detail.data);
    // Submit to server
  });

  form.addEventListener('bx-form-invalid', (e) => {
    console.log('Invalid!', e.detail.errors);
  });
</script>
```

---

#### `bx-form-submit`

**Purpose**: Custom submit handler callback.

**Syntax**:
```html
<form bx-form bx-form-submit="functionName">
```

**Parameters**:
- `functionName` (string): Name of global function to call on valid submission

**Example**:
```html
<form bx-form bx-form-submit="handleLogin">
  <input type="email" bx-model="email" bx-validate='{"required":true}'>
  <button type="submit">Login</button>
</form>

<script>
  window.handleLogin = (formData) => {
    console.log('Submitting:', formData);
    // Custom submission logic
  };
</script>
```

---

#### `bx-validate`

**Purpose**: Specify validation rules for a form field.

**Syntax**:
```html
<input bx-model="field" bx-validate='{"rule1":true,"rule2":"value"}'>
```

**Parameters**:
- JSON object with validation rules (see [Validation Rules](#validation-rules))

**Examples**:

```html
<!-- Required field -->
<input bx-model="username" bx-validate='{"required":true}'>

<!-- Email validation -->
<input bx-model="email" bx-validate='{"required":true,"email":true}'>

<!-- Length constraints -->
<input bx-model="password" bx-validate='{"required":true,"minLength":8,"maxLength":64}'>

<!-- Numeric range -->
<input bx-model="age" bx-validate='{"required":true,"number":true,"min":18,"max":120}'>

<!-- Pattern matching -->
<input bx-model="zipCode" bx-validate='{"pattern":"^[0-9]{5}$"}'>

<!-- Multiple rules -->
<input bx-model="phone" bx-validate='{"required":true,"phone":true}'>
```

---

#### `bx-error-{ruleName}`

**Purpose**: Custom error message for specific validation rule.

**Syntax**:
```html
<input
  bx-validate='{"required":true,"email":true}'
  bx-error-required="Email is required"
  bx-error-email="Please enter a valid email address">
```

**Parameters**:
- Custom error message (string)

**Supported Error Attributes**:
- `bx-error-required`
- `bx-error-email`
- `bx-error-min`
- `bx-error-max`
- `bx-error-minLength`
- `bx-error-maxLength`
- `bx-error-pattern`
- `bx-error-url`
- `bx-error-number`
- `bx-error-integer`
- `bx-error-alpha`
- `bx-error-alphanumeric`
- `bx-error-phone`
- `bx-error-custom`

**Example**:
```html
<form bx-form>
  <label>
    Email:
    <input
      type="email"
      bx-model="email"
      bx-validate='{"required":true,"email":true}'
      bx-error-required="We need your email address"
      bx-error-email="That doesn't look like a valid email">
  </label>
  <div class="bx-error-message"></div>

  <label>
    Age:
    <input
      type="number"
      bx-model="age"
      bx-validate='{"required":true,"number":true,"min":18}'
      bx-error-required="Age is required"
      bx-error-number="Age must be a number"
      bx-error-min="You must be at least 18 years old">
  </label>
  <div class="bx-error-message"></div>

  <button type="submit">Submit</button>
</form>
```

---

## JavaScript API

### Core Functions

#### `bindX.reactive(object)`

**Purpose**: Create a reactive proxy from a plain JavaScript object.

**Parameters**:
- `object` (Object): Plain JavaScript object to make reactive

**Returns**: `Proxy` - Reactive proxy object

**Example**:
```javascript
const data = bindX.reactive({
  count: 0,
  user: {
    name: 'Alice',
    email: 'alice@example.com'
  }
});

// Changes are automatically tracked
data.count++; // Triggers updates

// Nested properties are also reactive
data.user.name = 'Bob'; // Triggers updates
```

**Behavior**:
- Returns a Proxy that intercepts property access
- Nested objects automatically become reactive
- Arrays are also reactive (push, pop, splice, etc.)
- Circular references are handled safely

---

#### `bindX.createReactive(object)`

**Alias**: Same as `bindX.reactive()`

---

#### `bindX.isReactive(object)`

**Purpose**: Check if an object is a reactive proxy.

**Parameters**:
- `object` (any): Object to check

**Returns**: `boolean` - `true` if object is reactive

**Example**:
```javascript
const plain = { name: 'Alice' };
const reactive = bindX.reactive(plain);

bindX.isReactive(plain);    // false
bindX.isReactive(reactive); // true
```

---

#### `bindX.computed(getter)`

**Purpose**: Create a computed property that automatically recalculates when dependencies change.

**Parameters**:
- `getter` (Function): Function that returns computed value

**Returns**: `Function` - Computed property getter

**Example**:
```javascript
const data = bindX.reactive({
  firstName: 'John',
  lastName: 'Doe',
  items: [
    { price: 10, quantity: 2 },
    { price: 20, quantity: 1 }
  ]
});

// Simple computed property
const fullName = bindX.computed(() =>
  `${data.firstName} ${data.lastName}`
);

console.log(fullName()); // "John Doe"

data.firstName = 'Jane';
console.log(fullName()); // "Jane Doe" (automatically updated)

// Complex computed property
const total = bindX.computed(() =>
  data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

console.log(total()); // 40

data.items[0].quantity = 5;
console.log(total()); // 70 (automatically updated)
```

**Behavior**:
- Tracks all reactive properties accessed during execution
- Caches result until dependencies change
- Automatically recalculates when dependencies update
- Supports nested computed properties
- Detects circular dependencies

---

#### `bindX.watch(getter, callback, options?)`

**Purpose**: Watch reactive properties and execute callback when they change.

**Parameters**:
- `getter` (Function): Function that accesses reactive properties
- `callback` (Function): Callback to execute on changes `(newValue, oldValue) => {}`
- `options` (Object, optional):
  - `immediate` (boolean): Execute callback immediately (default: `false`)
  - `deep` (boolean): Watch nested properties (default: `false`)

**Returns**: `Function` - Disconnect function to stop watching

**Example**:
```javascript
const data = bindX.reactive({
  count: 0,
  user: {
    name: 'Alice',
    age: 30
  }
});

// Watch single property
const unwatch1 = bindX.watch(
  () => data.count,
  (newValue, oldValue) => {
    console.log(`Count changed from ${oldValue} to ${newValue}`);
  }
);

data.count = 5; // Logs: "Count changed from 0 to 5"

// Watch nested property
const unwatch2 = bindX.watch(
  () => data.user.name,
  (newValue, oldValue) => {
    console.log(`Name changed from ${oldValue} to ${newValue}`);
  }
);

data.user.name = 'Bob'; // Logs: "Name changed from Alice to Bob"

// Watch multiple properties
const unwatch3 = bindX.watch(
  () => ({ name: data.user.name, age: data.user.age }),
  (newValue, oldValue) => {
    console.log('User changed:', newValue);
  }
);

// Immediate execution
bindX.watch(
  () => data.count,
  (value) => {
    console.log('Count is:', value);
  },
  { immediate: true }
); // Logs immediately: "Count is: 5"

// Stop watching
unwatch1(); // Stops watching data.count
```

---

#### `bindX.disconnect(watchFunction)`

**Purpose**: Stop watching reactive properties.

**Parameters**:
- `watchFunction` (Function): Function returned by `bindX.watch()`

**Example**:
```javascript
const unwatch = bindX.watch(() => data.count, (value) => {
  console.log('Count:', value);
});

// Later...
bindX.disconnect(unwatch);
// or
unwatch();
```

---

### DOM Functions

#### `bindX.init(reactiveObject, rootElement?)`

**Purpose**: Initialize bindX with reactive data and scan DOM for bindings.

**Parameters**:
- `reactiveObject` (Proxy): Reactive object created with `bindX.reactive()`
- `rootElement` (HTMLElement, optional): Root element to scan (default: `document.body`)

**Returns**: `Proxy` - The reactive object (for chaining)

**Example**:
```javascript
const data = bindX.reactive({
  message: 'Hello, bindX!',
  count: 0
});

// Initialize for entire document
bindX.init(data);

// Initialize for specific element
const app = document.getElementById('app');
bindX.init(data, app);
```

---

#### `bindX.scan(rootElement?)`

**Purpose**: Scan DOM for new bindings (after adding elements dynamically).

**Parameters**:
- `rootElement` (HTMLElement, optional): Root element to scan (default: `document.body`)

**Example**:
```javascript
// Add new element with binding
const newDiv = document.createElement('div');
newDiv.innerHTML = '<span bx-bind="dynamicValue"></span>';
document.body.appendChild(newDiv);

// Scan for new bindings
bindX.scan();
```

---

#### `bindX.bindx(reactiveObject, rootElement?)`

**Alias**: Same as `bindX.init()`

---

#### `bindX.createModelBinding(element, reactiveObject)`

**Purpose**: Manually create a two-way binding for an element.

**Parameters**:
- `element` (HTMLElement): Form input element
- `reactiveObject` (Proxy): Reactive data object

**Example**:
```javascript
const data = bindX.reactive({ value: '' });
const input = document.getElementById('myInput');

bindX.createModelBinding(input, data);

// Now input is bound to data.value
```

---

#### `bindX.createOneWayBinding(element, reactiveObject)`

**Purpose**: Manually create a one-way binding for an element.

**Parameters**:
- `element` (HTMLElement): DOM element
- `reactiveObject` (Proxy): Reactive data object

**Example**:
```javascript
const data = bindX.reactive({ message: 'Hello' });
const span = document.getElementById('output');

bindX.createOneWayBinding(span, data);

// Now span displays data.message
```

---

### Form Functions

#### `bindX.validateForm(formElement)`

**Purpose**: Validate all fields in a form.

**Parameters**:
- `formElement` (HTMLFormElement): Form to validate

**Returns**: `boolean` - `true` if all fields are valid

**Example**:
```javascript
const form = document.getElementById('myForm');
const isValid = bindX.validateForm(form);

if (isValid) {
  console.log('Form is valid!');
} else {
  console.log('Form has errors');
}
```

---

#### `bindX.validateField(fieldElement)`

**Purpose**: Validate a single form field.

**Parameters**:
- `fieldElement` (HTMLInputElement): Field to validate

**Returns**: `boolean` - `true` if field is valid

**Example**:
```javascript
const emailInput = document.getElementById('email');
const isValid = bindX.validateField(emailInput);

if (!isValid) {
  console.log('Email is invalid');
}
```

---

#### `bindX.serializeForm(formElement)`

**Purpose**: Get form data as a plain JavaScript object.

**Parameters**:
- `formElement` (HTMLFormElement): Form to serialize

**Returns**: `Object` - Form data as key-value pairs

**Example**:
```javascript
const form = document.getElementById('myForm');
const data = bindX.serializeForm(form);

console.log(data);
// {
//   username: 'alice',
//   email: 'alice@example.com',
//   age: 25
// }
```

---

#### `bindX.deserializeForm(formElement, data)`

**Purpose**: Populate form fields from a data object.

**Parameters**:
- `formElement` (HTMLFormElement): Form to populate
- `data` (Object): Data to populate form with

**Example**:
```javascript
const form = document.getElementById('myForm');
const userData = {
  username: 'bob',
  email: 'bob@example.com',
  age: 30
};

bindX.deserializeForm(form, userData);
// Form fields are now populated with data
```

---

#### `bindX.resetForm(formElement)`

**Purpose**: Reset form to initial state (clears values and validation state).

**Parameters**:
- `formElement` (HTMLFormElement): Form to reset

**Example**:
```javascript
const form = document.getElementById('myForm');
bindX.resetForm(form);

// All fields cleared
// All validation errors removed
// Form state reset to pristine
```

---

#### `bindX.getFormState(formElement)`

**Purpose**: Get current validation state of form.

**Parameters**:
- `formElement` (HTMLFormElement): Form to check

**Returns**: `Object` - Form state information
```javascript
{
  valid: boolean,      // Is form valid?
  pristine: boolean,   // Has form been modified?
  errors: Object       // Field errors
}
```

**Example**:
```javascript
const form = document.getElementById('myForm');
const state = bindX.getFormState(form);

console.log(state);
// {
//   valid: false,
//   pristine: false,
//   errors: {
//     email: 'Please enter a valid email',
//     password: 'Password must be at least 8 characters'
//   }
// }
```

---

### Utility Functions

#### `bindX.getNestedProperty(object, path)`

**Purpose**: Get value of nested property using dot notation.

**Parameters**:
- `object` (Object): Object to query
- `path` (string): Dot-notation path (e.g., `'user.contact.email'`)

**Returns**: `any` - Property value or `undefined`

**Example**:
```javascript
const data = {
  user: {
    contact: {
      email: 'alice@example.com'
    }
  }
};

const email = bindX.getNestedProperty(data, 'user.contact.email');
console.log(email); // 'alice@example.com'

const missing = bindX.getNestedProperty(data, 'user.address.street');
console.log(missing); // undefined
```

---

#### `bindX.setNestedProperty(object, path, value)`

**Purpose**: Set value of nested property using dot notation.

**Parameters**:
- `object` (Object): Object to modify
- `path` (string): Dot-notation path
- `value` (any): Value to set

**Example**:
```javascript
const data = {
  user: {
    contact: {}
  }
};

bindX.setNestedProperty(data, 'user.contact.email', 'bob@example.com');

console.log(data.user.contact.email); // 'bob@example.com'
```

---

#### `bindX.generateBindingId()`

**Purpose**: Generate unique ID for a binding (internal use).

**Returns**: `string` - Unique binding ID

---

#### `bindX.parseBindingAttribute(element, attributeName)`

**Purpose**: Parse a binding attribute from an element (internal use).

**Parameters**:
- `element` (HTMLElement): Element with binding attribute
- `attributeName` (string): Attribute name

**Returns**: `any` - Parsed attribute value

---

## Validation Rules

### `required`

**Purpose**: Ensure field has a non-empty value.

**Configuration**:
```json
{ "required": true }
```

**Valid Values**:
- Non-empty strings
- Non-zero numbers
- true (checkbox)
- Non-empty arrays

**Error Message**: "This field is required"

**Example**:
```html
<input
  bx-model="username"
  bx-validate='{"required":true}'
  bx-error-required="Username is required">
```

---

### `email`

**Purpose**: Validate email address format.

**Configuration**:
```json
{ "email": true }
```

**Valid Values**:
- Valid email format: `user@domain.com`

**Pattern**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Error Message**: "Please enter a valid email address"

**Example**:
```html
<input
  type="email"
  bx-model="email"
  bx-validate='{"required":true,"email":true}'
  bx-error-email="Invalid email format">
```

---

### `min`

**Purpose**: Validate minimum numeric value.

**Configuration**:
```json
{ "min": 18 }
```

**Parameters**:
- Minimum value (number)

**Error Message**: "Value must be at least {min}"

**Example**:
```html
<input
  type="number"
  bx-model="age"
  bx-validate='{"required":true,"min":18}'
  bx-error-min="You must be at least 18 years old">
```

---

### `max`

**Purpose**: Validate maximum numeric value.

**Configuration**:
```json
{ "max": 120 }
```

**Parameters**:
- Maximum value (number)

**Error Message**: "Value must be at most {max}"

**Example**:
```html
<input
  type="number"
  bx-model="age"
  bx-validate='{"max":120}'
  bx-error-max="Age cannot exceed 120">
```

---

### `minLength`

**Purpose**: Validate minimum string length.

**Configuration**:
```json
{ "minLength": 8 }
```

**Parameters**:
- Minimum length (number)

**Error Message**: "Must be at least {minLength} characters"

**Example**:
```html
<input
  type="password"
  bx-model="password"
  bx-validate='{"required":true,"minLength":8}'
  bx-error-minLength="Password must be at least 8 characters">
```

---

### `maxLength`

**Purpose**: Validate maximum string length.

**Configuration**:
```json
{ "maxLength": 100 }
```

**Parameters**:
- Maximum length (number)

**Error Message**: "Must be at most {maxLength} characters"

**Example**:
```html
<textarea
  bx-model="bio"
  bx-validate='{"maxLength":500}'
  bx-error-maxLength="Bio cannot exceed 500 characters"></textarea>
```

---

### `pattern`

**Purpose**: Validate against a regular expression.

**Configuration**:
```json
{ "pattern": "^[0-9]{5}$" }
```

**Parameters**:
- Regular expression pattern (string)

**Error Message**: "Invalid format"

**Example**:
```html
<!-- ZIP code validation -->
<input
  bx-model="zipCode"
  bx-validate='{"pattern":"^[0-9]{5}$"}'
  bx-error-pattern="ZIP code must be 5 digits">

<!-- Username validation (alphanumeric, 3-16 chars) -->
<input
  bx-model="username"
  bx-validate='{"pattern":"^[a-zA-Z0-9]{3,16}$"}'
  bx-error-pattern="Username must be 3-16 alphanumeric characters">
```

---

### `url`

**Purpose**: Validate URL format.

**Configuration**:
```json
{ "url": true }
```

**Valid Values**:
- Valid URL format: `https://example.com`

**Pattern**: `/^https?:\/\/.+/`

**Error Message**: "Please enter a valid URL"

**Example**:
```html
<input
  type="url"
  bx-model="website"
  bx-validate='{"url":true}'
  bx-error-url="Invalid URL format">
```

---

### `number`

**Purpose**: Validate numeric value (integer or decimal).

**Configuration**:
```json
{ "number": true }
```

**Valid Values**:
- Integers: `42`
- Decimals: `3.14`

**Error Message**: "Must be a valid number"

**Example**:
```html
<input
  bx-model="price"
  bx-validate='{"required":true,"number":true}'
  bx-error-number="Price must be a number">
```

---

### `integer`

**Purpose**: Validate integer value (no decimals).

**Configuration**:
```json
{ "integer": true }
```

**Valid Values**:
- Integers only: `42`, `-10`

**Error Message**: "Must be a whole number"

**Example**:
```html
<input
  bx-model="quantity"
  bx-validate='{"required":true,"integer":true}'
  bx-error-integer="Quantity must be a whole number">
```

---

### `alpha`

**Purpose**: Validate alphabetic characters only (a-z, A-Z).

**Configuration**:
```json
{ "alpha": true }
```

**Valid Values**:
- Letters only: `Alice`, `bob`

**Pattern**: `/^[a-zA-Z]+$/`

**Error Message**: "Must contain only letters"

**Example**:
```html
<input
  bx-model="firstName"
  bx-validate='{"required":true,"alpha":true}'
  bx-error-alpha="Name must contain only letters">
```

---

### `alphanumeric`

**Purpose**: Validate alphanumeric characters only (a-z, A-Z, 0-9).

**Configuration**:
```json
{ "alphanumeric": true }
```

**Valid Values**:
- Letters and numbers: `user123`, `Alice42`

**Pattern**: `/^[a-zA-Z0-9]+$/`

**Error Message**: "Must contain only letters and numbers"

**Example**:
```html
<input
  bx-model="username"
  bx-validate='{"required":true,"alphanumeric":true}'
  bx-error-alphanumeric="Username can only contain letters and numbers">
```

---

### `phone`

**Purpose**: Validate phone number format.

**Configuration**:
```json
{ "phone": true }
```

**Valid Values**:
- Phone formats: `(555) 123-4567`, `555-123-4567`, `5551234567`

**Pattern**: `/^[\d\s\-\(\)]+$/` (digits, spaces, dashes, parentheses)

**Error Message**: "Please enter a valid phone number"

**Example**:
```html
<input
  type="tel"
  bx-model="phone"
  bx-validate='{"required":true,"phone":true}'
  bx-error-phone="Invalid phone number format">
```

---

### `custom`

**Purpose**: Custom validation function.

**Configuration**:
```json
{ "custom": "functionName" }
```

**Parameters**:
- Name of global validation function (string)

**Function Signature**:
```javascript
function validatorName(value) {
  // Return true if valid, false if invalid
  return true;
}
```

**Error Message**: "Validation failed" (or custom message via `bx-error-custom`)

**Example**:
```html
<input
  bx-model="password"
  bx-validate='{"custom":"validateStrongPassword"}'
  bx-error-custom="Password must contain uppercase, lowercase, and number">

<script>
  window.validateStrongPassword = (value) => {
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasUpper && hasLower && hasNumber;
  };
</script>
```

---

### Combining Rules

Multiple rules can be combined in a single validation:

```html
<input
  bx-model="username"
  bx-validate='{
    "required": true,
    "minLength": 3,
    "maxLength": 16,
    "alphanumeric": true
  }'
  bx-error-required="Username is required"
  bx-error-minLength="Username must be at least 3 characters"
  bx-error-maxLength="Username cannot exceed 16 characters"
  bx-error-alphanumeric="Username can only contain letters and numbers">
```

---

## CSS Classes

bindX automatically applies CSS classes to forms and fields based on validation state.

### Form Classes

#### `bx-pristine`

**When Applied**: Form has not been modified since page load

**Removed When**: User interacts with any field

**Example**:
```css
form.bx-pristine {
  /* Style for untouched forms */
}
```

---

#### `bx-dirty`

**When Applied**: User has modified at least one field

**Example**:
```css
form.bx-dirty {
  /* Style for modified forms */
  border-left: 3px solid blue;
}
```

---

#### `bx-valid`

**When Applied**: All form fields pass validation

**Example**:
```css
form.bx-valid button[type="submit"] {
  /* Enable submit button for valid forms */
  background: green;
  cursor: pointer;
}
```

---

#### `bx-invalid`

**When Applied**: One or more form fields fail validation

**Example**:
```css
form.bx-invalid button[type="submit"] {
  /* Disable/style submit button for invalid forms */
  background: gray;
  cursor: not-allowed;
  opacity: 0.6;
}
```

---

### Field Classes

#### `bx-error`

**When Applied**: Field fails validation

**Example**:
```css
input.bx-error {
  border: 2px solid red;
  background: #ffe6e6;
}

input.bx-error:focus {
  outline: 2px solid red;
}
```

---

#### `bx-valid`

**When Applied**: Field passes validation

**Example**:
```css
input.bx-valid {
  border: 2px solid green;
}

input.bx-valid::after {
  content: '✓';
  color: green;
}
```

---

### Error Message Container

#### `.bx-error-message`

**Purpose**: Container for displaying validation error messages

**Usage**:
```html
<label>
  Email:
  <input
    type="email"
    bx-model="email"
    bx-validate='{"required":true,"email":true}'
    bx-error-required="Email is required"
    bx-error-email="Invalid email format">
</label>
<div class="bx-error-message"></div>
```

**Styling**:
```css
.bx-error-message {
  color: red;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: none;
}

input.bx-error + .bx-error-message {
  display: block;
}
```

---

### Complete Styling Example

```css
/* Form states */
form.bx-pristine {
  opacity: 0.95;
}

form.bx-dirty {
  opacity: 1;
}

form.bx-valid button[type="submit"] {
  background: #28a745;
  color: white;
}

form.bx-invalid button[type="submit"] {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Field states */
input,
textarea,
select {
  border: 2px solid #ddd;
  padding: 0.5rem;
  border-radius: 4px;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #007bff;
}

input.bx-error,
textarea.bx-error,
select.bx-error {
  border-color: #dc3545;
  background: #fff5f5;
}

input.bx-valid,
textarea.bx-valid,
select.bx-valid {
  border-color: #28a745;
}

/* Error messages */
.bx-error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: none;
}

input.bx-error ~ .bx-error-message,
textarea.bx-error ~ .bx-error-message,
select.bx-error ~ .bx-error-message {
  display: block;
}

/* Success indicator */
input.bx-valid::after,
textarea.bx-valid::after,
select.bx-valid::after {
  content: '✓';
  color: #28a745;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
```

---

## Custom Events

bindX emits custom events for various interactions.

### `bx-form-valid`

**When Emitted**: Form validation passes on submit

**Target**: `<form>` element

**Event Detail**:
```javascript
{
  data: Object,      // Serialized form data
  timestamp: number  // Event timestamp
}
```

**Example**:
```javascript
const form = document.getElementById('myForm');

form.addEventListener('bx-form-valid', (event) => {
  console.log('Form is valid!');
  console.log('Data:', event.detail.data);

  // Submit to server
  fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event.detail.data)
  });
});
```

---

### `bx-form-invalid`

**When Emitted**: Form validation fails on submit

**Target**: `<form>` element

**Event Detail**:
```javascript
{
  errors: Object,    // Field errors { fieldName: errorMessage }
  timestamp: number  // Event timestamp
}
```

**Example**:
```javascript
form.addEventListener('bx-form-invalid', (event) => {
  console.log('Form has errors!');
  console.log('Errors:', event.detail.errors);

  // Display error summary
  const summary = document.getElementById('errorSummary');
  summary.innerHTML = Object.values(event.detail.errors).join('<br>');
});
```

---

### `bx-field-change`

**When Emitted**: Field value changes

**Target**: Form field element

**Event Detail**:
```javascript
{
  field: string,    // Field name/path
  value: any,       // New value
  oldValue: any,    // Previous value
  timestamp: number // Event timestamp
}
```

**Example**:
```javascript
const input = document.getElementById('email');

input.addEventListener('bx-field-change', (event) => {
  console.log('Email changed:', event.detail.value);
});
```

---

### `bx-validation-error`

**When Emitted**: Field validation fails

**Target**: Form field element

**Event Detail**:
```javascript
{
  field: string,      // Field name/path
  rule: string,       // Failed validation rule
  message: string,    // Error message
  timestamp: number   // Event timestamp
}
```

**Example**:
```javascript
input.addEventListener('bx-validation-error', (event) => {
  console.log('Validation failed:', event.detail.message);
  console.log('Failed rule:', event.detail.rule);

  // Custom error handling
  showToast('Error: ' + event.detail.message);
});
```

---

### `bx-binding-created`

**When Emitted**: New binding is created

**Target**: `document`

**Event Detail**:
```javascript
{
  element: HTMLElement, // Element with binding
  type: string,         // 'model' or 'bind'
  path: string,         // Property path
  timestamp: number     // Event timestamp
}
```

**Example**:
```javascript
document.addEventListener('bx-binding-created', (event) => {
  console.log('Binding created:', event.detail.path);
  console.log('Type:', event.detail.type);
  console.log('Element:', event.detail.element);
});
```

---

## Configuration Options

### Global Configuration

Configure bindX behavior by setting options before initialization:

```javascript
window.bindXConfig = {
  // Debounce delay for input bindings (ms)
  debounceDelay: 300,

  // Batch update delay (ms)
  batchDelay: 16,

  // Enable debug logging
  debug: false,

  // Custom error messages
  errorMessages: {
    required: 'This field is required',
    email: 'Please enter a valid email',
    // ... other rules
  },

  // Custom validation rules
  validators: {
    customRule: (value) => {
      // Return true if valid
      return true;
    }
  },

  // Integration with fmtX
  fmtXEnabled: true,

  // Integration with bootloader
  useBootloader: true
};
```

---

### Per-Element Configuration

Configure individual bindings with `bx-opts`:

```html
<input
  bx-model="search"
  bx-opts='{
    "debounce": 500,
    "trim": true,
    "lazy": false
  }'>
```

**Available Options**:
- `debounce` (number): Debounce delay in milliseconds
- `lazy` (boolean): Update on `change` instead of `input`
- `trim` (boolean): Trim whitespace from input
- `number` (boolean): Convert input to number
- `format` (string): Format type (requires fmtX)

---

## Error Handling

### Error Types

#### Validation Errors

**Thrown When**: Field validation fails

**Error Object**:
```javascript
{
  type: 'validation',
  field: 'email',
  rule: 'email',
  message: 'Please enter a valid email',
  element: HTMLInputElement
}
```

**Handling**:
```javascript
form.addEventListener('bx-validation-error', (event) => {
  console.error('Validation error:', event.detail);
});
```

---

#### Binding Errors

**Thrown When**: Binding creation or update fails

**Error Object**:
```javascript
{
  type: 'binding',
  element: HTMLElement,
  path: 'user.email',
  message: 'Cannot access property email of undefined'
}
```

**Handling**:
```javascript
try {
  bindX.init(data);
} catch (error) {
  console.error('Binding error:', error);
}
```

---

#### Reactivity Errors

**Thrown When**: Reactive operation fails (e.g., circular dependency)

**Error Object**:
```javascript
{
  type: 'reactivity',
  message: 'Circular dependency detected',
  stack: [...]
}
```

**Handling**:
```javascript
try {
  const computed = bindX.computed(() => {
    // Circular reference
    return data.a + data.b;
  });
} catch (error) {
  console.error('Reactivity error:', error);
}
```

---

### Debug Mode

Enable debug mode for detailed logging:

```javascript
window.bindXConfig = { debug: true };
```

**Debug Output**:
```
bindX: Binding created: bx-model="username"
bindX: Value changed: username = "alice"
bindX: Validation triggered: email
bindX: Validation passed: email
bindX: Form submitted: valid
```

---

## Integration Points

### Bootloader Integration

bindX integrates with genX bootloader via `window.bxXFactory`:

```javascript
// Bootloader calls this
window.bxXFactory = (config) => {
  // Initialize bindX with bootloader config
  return bindX;
};
```

**Usage**:
```html
<!-- Bootloader loads bindX automatically -->
<script src="genx-bootloader.js"></script>
```

---

### Standalone Mode

Use bindX without bootloader:

```html
<script src="bindx.min.js"></script>
<script>
  // bindX available as window.bindX
  const data = bindX.reactive({ message: 'Hello' });
  bindX.init(data);
</script>
```

---

### fmtX Integration

bindX integrates with fmtX for formatting:

```html
<span bx-bind="price" bx-format="currency"></span>

<script>
  // fmtX must be loaded
  const data = bindX.reactive({ price: 1234.56 });
  bindX.init(data);

  // Displays: $1,234.56
</script>
```

---

### Framework Integration

#### React

```jsx
import { useEffect, useRef } from 'react';
import bindX from '@genx/bindx';

function MyComponent() {
  const dataRef = useRef(bindX.reactive({ count: 0 }));
  const containerRef = useRef(null);

  useEffect(() => {
    bindX.init(dataRef.current, containerRef.current);
  }, []);

  return (
    <div ref={containerRef}>
      <input type="number" bx-model="count" />
      <p>Count: <span bx-bind="count"></span></p>
    </div>
  );
}
```

---

#### Vue

```vue
<template>
  <div ref="container">
    <input type="text" bx-model="message" />
    <p>{{ message }}</p>
  </div>
</template>

<script>
import bindX from '@genx/bindx';

export default {
  data() {
    return {
      bindXData: bindX.reactive({ message: '' })
    };
  },
  mounted() {
    bindX.init(this.bindXData, this.$refs.container);
  }
};
</script>
```

---

#### Angular

```typescript
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import bindX from '@genx/bindx';

@Component({
  selector: 'app-bindx',
  template: `
    <div #container>
      <input type="text" bx-model="message" />
      <p>{{ bindXData.message }}</p>
    </div>
  `
})
export class BindXComponent implements OnInit {
  @ViewChild('container') container!: ElementRef;
  bindXData = bindX.reactive({ message: '' });

  ngOnInit() {
    bindX.init(this.bindXData, this.container.nativeElement);
  }
}
```

---

#### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import bindX from '@genx/bindx';

  let container;
  const data = bindX.reactive({ message: '' });

  onMount(() => {
    bindX.init(data, container);
  });
</script>

<div bind:this={container}>
  <input type="text" bx-model="message" />
  <p>Message: <span bx-bind="message"></span></p>
</div>
```

---

## Performance Considerations

### Optimization Techniques

1. **Debounce Input Bindings**
   ```html
   <input bx-model="search" bx-debounce="300">
   ```

2. **Use Lazy Binding for Non-Critical Fields**
   ```html
   <input bx-model="notes" bx-opts='{"lazy":true}'>
   ```

3. **Minimize Computed Dependencies**
   ```javascript
   // Bad: accesses many properties
   const summary = bindX.computed(() =>
     `${data.a} ${data.b} ${data.c} ${data.d} ${data.e}`
   );

   // Good: accesses fewer properties
   const summary = bindX.computed(() =>
     `${data.firstName} ${data.lastName}`
   );
   ```

4. **Avoid Deep Watchers When Possible**
   ```javascript
   // Prefer watching specific properties
   bindX.watch(() => data.user.email, callback);

   // Instead of watching entire object
   bindX.watch(() => data.user, callback, { deep: true });
   ```

5. **Clean Up Watchers**
   ```javascript
   const unwatch = bindX.watch(() => data.count, callback);

   // Later, when no longer needed
   unwatch();
   ```

---

### Performance Targets

- **Bundle Size**: <3KB minified + gzipped
- **Binding Update**: <0.5ms per update
- **Form Validation**: <5ms for 20 fields
- **Initial Scan**: <10ms for 100 bindings
- **Computed Recalculation**: <1ms (cached)
- **Batch Processing**: 60 FPS (16ms frame budget)

---

### Memory Management

- **WeakMap Registry**: Automatic garbage collection of binding metadata
- **Proxy Caching**: Reuses proxies for nested objects
- **Event Listener Cleanup**: Automatic cleanup on element removal
- **Watcher Disconnection**: Manual cleanup with `unwatch()` function

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Polyfills Required for Older Browsers**:
- Proxy (not polyfillable for IE11)
- WeakMap
- RequestAnimationFrame

---

## TypeScript Definitions

```typescript
declare module '@genx/bindx' {
  export interface BindXConfig {
    debounceDelay?: number;
    batchDelay?: number;
    debug?: boolean;
    errorMessages?: Record<string, string>;
    validators?: Record<string, (value: any) => boolean>;
    fmtXEnabled?: boolean;
    useBootloader?: boolean;
  }

  export interface BindXOptions {
    debounce?: number;
    lazy?: boolean;
    trim?: boolean;
    number?: boolean;
    format?: string;
  }

  export interface ValidationRules {
    required?: boolean;
    email?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    url?: boolean;
    number?: boolean;
    integer?: boolean;
    alpha?: boolean;
    alphanumeric?: boolean;
    phone?: boolean;
    custom?: string;
  }

  export interface FormState {
    valid: boolean;
    pristine: boolean;
    errors: Record<string, string>;
  }

  export function reactive<T extends object>(obj: T): T;
  export function createReactive<T extends object>(obj: T): T;
  export function isReactive(obj: any): boolean;
  export function computed<T>(getter: () => T): () => T;
  export function watch<T>(
    getter: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean; deep?: boolean }
  ): () => void;
  export function disconnect(watchFn: () => void): void;

  export function init<T extends object>(data: T, root?: HTMLElement): T;
  export function bindx<T extends object>(data: T, root?: HTMLElement): T;
  export function scan(root?: HTMLElement): void;
  export function createModelBinding(element: HTMLElement, data: object): void;
  export function createOneWayBinding(element: HTMLElement, data: object): void;

  export function validateForm(form: HTMLFormElement): boolean;
  export function validateField(field: HTMLInputElement): boolean;
  export function serializeForm(form: HTMLFormElement): Record<string, any>;
  export function deserializeForm(form: HTMLFormElement, data: Record<string, any>): void;
  export function resetForm(form: HTMLFormElement): void;
  export function getFormState(form: HTMLFormElement): FormState;

  export function getNestedProperty(obj: object, path: string): any;
  export function setNestedProperty(obj: object, path: string, value: any): void;
  export function generateBindingId(): string;
  export function parseBindingAttribute(element: HTMLElement, attrName: string): any;

  const bindX: {
    reactive: typeof reactive;
    createReactive: typeof createReactive;
    isReactive: typeof isReactive;
    computed: typeof computed;
    watch: typeof watch;
    disconnect: typeof disconnect;
    init: typeof init;
    bindx: typeof bindx;
    scan: typeof scan;
    createModelBinding: typeof createModelBinding;
    createOneWayBinding: typeof createOneWayBinding;
    validateForm: typeof validateForm;
    validateField: typeof validateField;
    serializeForm: typeof serializeForm;
    deserializeForm: typeof deserializeForm;
    resetForm: typeof resetForm;
    getFormState: typeof getFormState;
    getNestedProperty: typeof getNestedProperty;
    setNestedProperty: typeof setNestedProperty;
    generateBindingId: typeof generateBindingId;
    parseBindingAttribute: typeof parseBindingAttribute;
  };

  export default bindX;
}
```

---

## License

MIT License - See LICENSE file for details

---

## Support

- **GitHub**: https://github.com/genx/genx
- **Documentation**: https://genx.software/docs/bindx
- **Issues**: https://github.com/genx/genx/issues
- **Discussions**: https://github.com/genx/genx/discussions

---

*Last Updated: 2025-11-24*
