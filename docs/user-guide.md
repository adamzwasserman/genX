# genX User Guide

A practical guide to adding interactive behavior to your HTML without writing JavaScript.

---

## Table of Contents

1. [What is genX?](#what-is-genx)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Common Use Cases](#common-use-cases)
5. [Module Quick Reference](#module-quick-reference)
6. [Framework Integration](#framework-integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Getting Help](#getting-help)

---

## What is genX?

genX lets you add interactive behavior to HTML using attributes instead of JavaScript. Think of it like Tailwind CSS, but for behavior instead of styling.

**Without genX:**
```html
<span id="price">1299.99</span>
<script>
  const el = document.getElementById('price');
  el.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(parseFloat(el.textContent));
</script>
```

**With genX:**
```html
<span fx-format="currency">1299.99</span>
<!-- Displays: $1,299.99 -->
```

### Why Use genX?

- **No JavaScript to write** — Behavior is declared in HTML attributes
- **Works with any backend** — Django, Rails, Laravel, PHP, static HTML, anything
- **Works with any frontend** — React, Vue, Angular, htmx, or vanilla HTML
- **Privacy-first** — Everything runs client-side, no data sent anywhere
- **Lightweight** — ~1KB bootloader, modules load only when needed
- **Accessible** — Built-in WCAG 2.1 AA compliance

---

## Getting Started

### Step 1: Add the Script

Add one line to your HTML `<head>`:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.genx.software/v1/bootloader.js" defer></script>
</head>
<body>
  <!-- Your content here -->
</body>
</html>
```

The `defer` attribute ensures the script loads without blocking page rendering.

### Step 2: Add Attributes

Use genX attributes on any HTML element:

```html
<!-- Format as currency -->
<span fx-format="currency">49.99</span>

<!-- Format phone number -->
<span fx-format="phone">5551234567</span>

<!-- Format date -->
<span fx-format="date" fx-date-format="long">2024-03-15</span>
```

### Step 3: That's It

There's no Step 3. The bootloader automatically:
1. Scans your page for genX attributes
2. Loads only the modules you're using
3. Processes matching elements
4. Watches for new elements added dynamically

### Try It Now

Create an `index.html` file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First genX Page</title>
  <script src="https://cdn.genx.software/v1/bootloader.js" defer></script>
</head>
<body>
  <h1>Product Details</h1>

  <p>Price: <span fx-format="currency">1299.99</span></p>
  <p>In Stock: <span fx-format="number">15000</span> units</p>
  <p>Released: <span fx-format="date" fx-date-format="long">2024-01-15</span></p>
  <p>Support: <span fx-format="phone">8005551234</span></p>
</body>
</html>
```

Open it in a browser — no server needed.

---

## Core Concepts

### 1. Attribute Prefixes

Each genX module uses a unique two-letter prefix:

| Prefix | Module | Purpose |
|--------|--------|---------|
| `fx-` | fmtX | Text formatting (currency, dates, numbers, phones) |
| `ax-` | accX | Accessibility (ARIA, focus management) |
| `lx-` | loadX | Loading states (skeletons, spinners) |
| `nx-` | navX | Navigation and routing |
| `dx-` | dragX | Drag and drop |
| `bx-` | bindX | Reactive data binding |
| `tx-` | tableX | Table enhancements (sort, filter, paginate) |
| `sx-` | smartX | Auto-detection formatting |

### 2. On-Demand Loading

The bootloader is tiny (~1KB). Modules only load when you use them:

```html
<!-- Using fx- attributes? fmtX loads automatically -->
<span fx-format="currency">99.99</span>

<!-- Using tx- attributes? tableX loads automatically -->
<table tx-sortable>...</table>

<!-- Not using dx- attributes? dragX never loads -->
```

### 3. Automatic Processing

genX processes elements:
- **On page load** — All matching elements
- **On dynamic content** — Elements added via JavaScript, AJAX, htmx, etc.

```html
<!-- Works even if added after page load -->
<div id="container"></div>
<script>
  // genX automatically processes this new element
  container.innerHTML = '<span fx-format="currency">29.99</span>';
</script>
```

### 4. Declarative Over Imperative

Instead of telling the browser *how* to do something (imperative), you declare *what* you want (declarative):

```html
<!-- Declarative: what you want -->
<span fx-format="percent" fx-decimals="1">0.156</span>

<!-- vs Imperative: how to do it -->
<script>
  const value = 0.156;
  const formatted = (value * 100).toFixed(1) + '%';
  document.querySelector('span').textContent = formatted;
</script>
```

---

## Common Use Cases

### Formatting Display Data

**Currency:**
```html
<span fx-format="currency">1299.99</span>           <!-- $1,299.99 -->
<span fx-format="currency" fx-currency="EUR">50</span>  <!-- €50.00 -->
<span fx-format="currency" fx-input-type="cents">4999</span>  <!-- $49.99 -->
```

**Numbers:**
```html
<span fx-format="number">1500000</span>     <!-- 1,500,000 -->
<span fx-format="compact">1500000</span>    <!-- 1.5M -->
<span fx-format="filesize">1073741824</span> <!-- 1.00 GB -->
```

**Dates:**
```html
<span fx-format="date">2024-03-15</span>                    <!-- 3/15/2024 -->
<span fx-format="date" fx-date-format="long">2024-03-15</span>  <!-- March 15, 2024 -->
<span fx-format="relative">2024-03-15T12:00:00Z</span>      <!-- 2 days ago -->
```

**Phone Numbers:**
```html
<span fx-format="phone">5551234567</span>              <!-- (555) 123-4567 -->
<span fx-format="phone" fx-phone-format="us-dash">5551234567</span>  <!-- 555-123-4567 -->
```

**Percentages:**
```html
<span fx-format="percent">0.156</span>               <!-- 15.6% -->
<span fx-format="percent" fx-decimals="2">0.1567</span>  <!-- 15.67% -->
```

### Building Interactive Tables

**Sortable columns:**
```html
<table>
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>
      <th class="tx-sortable">Price</th>
      <th class="tx-sortable">Date</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Widget</td><td>$29.99</td><td>2024-01-15</td></tr>
    <tr><td>Gadget</td><td>$49.99</td><td>2024-02-20</td></tr>
  </tbody>
</table>
```
Click headers to sort. Shift+click for multi-column sorting.

**With pagination:**
```html
<table tx-paginate="true" tx-per-page="25">
  <!-- Headers and many rows -->
</table>
```

**With filtering:**
```html
<table tx-filterable>
  <!-- Auto-generates search input above table -->
</table>
```

**All features combined:**
```html
<table tx-filterable tx-paginate="true" tx-per-page="20">
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>
      <th class="tx-sortable">Email</th>
      <th class="tx-sortable">Department</th>
    </tr>
  </thead>
  <tbody>
    <!-- Rows -->
  </tbody>
</table>
```

### Adding Loading States

**Skeleton placeholders:**
```html
<div lx-skeleton="true" lx-skeleton-lines="3">
  <!-- Content loads here -->
</div>
```

**Spinner while loading:**
```html
<button lx-loading="true">
  Saving...
</button>
```

### Drag and Drop

**Make elements draggable:**
```html
<div dx-draggable="card">Drag me</div>
<div dx-draggable="card">Drag me too</div>

<div dx-drop-zone="card-list">Drop cards here</div>
```

### Form Data Binding

**Two-way binding:**
```html
<input type="text" bx-model="username">
<p>Hello, <span bx-bind="username"></span>!</p>

<script>
  const data = bindX.reactive({ username: 'Guest' });
  bindX.init(data);
</script>
```

### Accessibility Enhancements

**ARIA labels:**
```html
<button ax-label="Close dialog">×</button>
<div ax-live="polite">Status updates appear here</div>
```

---

## Module Quick Reference

### fmtX (Formatting)

| Attribute | Values | Example |
|-----------|--------|---------|
| `fx-format` | `currency`, `number`, `date`, `phone`, `percent`, `compact`, `filesize`, `relative`, `decimal` | `fx-format="currency"` |
| `fx-currency` | ISO code | `fx-currency="EUR"` |
| `fx-date-format` | `short`, `medium`, `long`, `full` | `fx-date-format="long"` |
| `fx-phone-format` | `us`, `us-dash`, `us-dot`, `intl` | `fx-phone-format="us-dash"` |
| `fx-decimals` | Number | `fx-decimals="2"` |
| `fx-input-type` | `dollars`, `cents`, `iso`, `unix`, `ms` | `fx-input-type="cents"` |

### tableX (Tables)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `class="tx-sortable"` | Make column sortable | `<th class="tx-sortable">` |
| `tx-paginate` | Enable pagination | `tx-paginate="true"` |
| `tx-per-page` | Rows per page | `tx-per-page="25"` |
| `tx-filterable` | Enable search filter | `tx-filterable` |
| `tx-filter-columns` | Columns to search | `tx-filter-columns="Name,Email"` |
| `tx-responsive` | Mobile layout | `tx-responsive="cards"` |

### bindX (Data Binding)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `bx-model` | Two-way binding | `bx-model="email"` |
| `bx-bind` | One-way display | `bx-bind="total"` |
| `bx-validate` | Form validation | `bx-validate='{"required":true}'` |

### loadX (Loading States)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `lx-skeleton` | Show skeleton | `lx-skeleton="true"` |
| `lx-loading` | Show loading state | `lx-loading="true"` |

### dragX (Drag & Drop)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `dx-draggable` | Make draggable | `dx-draggable="item"` |
| `dx-drop-zone` | Create drop target | `dx-drop-zone="list"` |

### accX (Accessibility)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `ax-label` | Set aria-label | `ax-label="Close"` |
| `ax-live` | Set aria-live | `ax-live="polite"` |

---

## Framework Integration

genX works with any framework because it operates on the DOM, not framework internals.

### React

```jsx
function ProductCard({ price }) {
  return (
    <div className="product">
      <span fx-format="currency">{price}</span>
    </div>
  );
}
```

genX processes elements after React renders them.

### Vue

```vue
<template>
  <div class="product">
    <span fx-format="currency">{{ price }}</span>
  </div>
</template>
```

### Angular

```html
<div class="product">
  <span fx-format="currency">{{ price }}</span>
</div>
```

### htmx

genX and htmx complement each other perfectly:

```html
<!-- htmx loads content, genX formats it -->
<div hx-get="/api/products" hx-trigger="load">
  <!-- Server returns: <span fx-format="currency">29.99</span> -->
  <!-- genX automatically formats to: $29.99 -->
</div>
```

### Alpine.js

```html
<div x-data="{ price: 49.99 }">
  <span fx-format="currency" x-text="price"></span>
</div>
```

### Server-Side Rendering (Django, Rails, Laravel, etc.)

genX is ideal for server-rendered HTML:

**Django:**
```html
<span fx-format="currency">{{ product.price }}</span>
```

**Rails:**
```erb
<span fx-format="currency"><%= product.price %></span>
```

**Laravel:**
```blade
<span fx-format="currency">{{ $product->price }}</span>
```

**PHP:**
```php
<span fx-format="currency"><?= $product['price'] ?></span>
```

---

## Best Practices

### 1. Use Semantic HTML First

genX enhances HTML — it doesn't replace good markup:

```html
<!-- Good: semantic table with genX enhancement -->
<table tx-sortable>
  <thead>...</thead>
  <tbody>...</tbody>
</table>

<!-- Avoid: using divs for tabular data -->
<div class="fake-table" tx-sortable>...</div>
```

### 2. Provide Raw Data, Let genX Format

Server should send raw values, not pre-formatted strings:

```html
<!-- Good: raw value, genX formats -->
<span fx-format="currency">1299.99</span>

<!-- Avoid: pre-formatted value -->
<span fx-format="currency">$1,299.99</span>
```

### 3. Use Appropriate Input Types

Specify input types when the raw data format isn't obvious:

```html
<!-- Unix timestamp needs input-type -->
<span fx-format="date" fx-input-type="unix">1710518400</span>

<!-- Cents instead of dollars -->
<span fx-format="currency" fx-input-type="cents">4999</span>
```

### 4. Keep Tables Accessible

Always use proper table structure:

```html
<table tx-sortable>
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>  <!-- th, not td -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Value</td>
    </tr>
  </tbody>
</table>
```

### 5. Test Without JavaScript

genX degrades gracefully. Raw values remain visible if JavaScript fails:

```html
<!-- If genX doesn't load, user sees "1299.99" instead of nothing -->
<span fx-format="currency">1299.99</span>
```

### 6. Don't Over-Engineer

If you only need one formatted value, genX might be overkill:

```html
<!-- For a single static value, this is fine -->
<span>$1,299.99</span>

<!-- genX shines with dynamic/repeated formatting -->
<table>
  <tr><td fx-format="currency">29.99</td></tr>
  <tr><td fx-format="currency">49.99</td></tr>
  <tr><td fx-format="currency">99.99</td></tr>
  <!-- ... 100 more rows -->
</table>
```

---

## Troubleshooting

### Elements Not Formatting

**Symptom:** Raw values display instead of formatted values.

**Check:**
1. Script is loading (check browser console for errors)
2. Script has `defer` attribute
3. Attribute names are correct (`fx-format`, not `fx_format` or `data-fx-format`)
4. Values are valid (numbers for currency, ISO dates for dates)

```html
<!-- Correct -->
<script src="https://cdn.genx.software/v1/bootloader.js" defer></script>
<span fx-format="currency">29.99</span>

<!-- Wrong: missing defer -->
<script src="https://cdn.genx.software/v1/bootloader.js"></script>

<!-- Wrong: invalid attribute -->
<span data-fx-format="currency">29.99</span>
```

### Dynamic Content Not Processing

**Symptom:** Elements added via JavaScript aren't formatted.

**Check:**
1. MutationObserver is supported (all modern browsers)
2. Elements are being added to the DOM, not just created
3. No JavaScript errors blocking execution

```javascript
// This works — element is added to DOM
container.innerHTML = '<span fx-format="currency">29.99</span>';

// This also works
const span = document.createElement('span');
span.setAttribute('fx-format', 'currency');
span.textContent = '29.99';
container.appendChild(span);
```

### Table Sorting Not Working

**Symptom:** Clicking headers doesn't sort.

**Check:**
1. `tx-sortable` class is on `<th>` elements, not `<td>`
2. Table has proper `<thead>` and `<tbody>` structure
3. No conflicting JavaScript handling click events

```html
<!-- Correct structure -->
<table>
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>  <!-- tx-sortable on th -->
    </tr>
  </thead>
  <tbody>
    <tr><td>Value</td></tr>
  </tbody>
</table>
```

### Performance Issues

**Symptom:** Page feels slow with many elements.

**Solutions:**
1. Use pagination for large tables (`tx-paginate="true" tx-per-page="50"`)
2. Avoid formatting thousands of elements on initial load
3. Use `fx-input-type` to avoid parsing ambiguity

### Console Errors

**Common errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `genX is not defined` | Script didn't load | Check script URL and network tab |
| `Invalid date` | Bad date format | Use ISO format: `2024-03-15` |
| `NaN` | Invalid number | Ensure numeric values are clean |

---

## Getting Help

### Resources

- **Live Demo:** [genx.software/examples/genx-demo.html](https://genx.software/examples/genx-demo.html)
- **GitHub:** [github.com/adamzwasserman/genX](https://github.com/adamzwasserman/genX)
- **Issues:** [github.com/adamzwasserman/genX/issues](https://github.com/adamzwasserman/genX/issues)

### Reporting Bugs

When reporting issues, include:
1. Browser and version
2. Minimal HTML that reproduces the issue
3. Expected vs actual behavior
4. Console errors (if any)

### Module-Specific Guides

- [tableX Getting Started](guides/tablex-getting-started.md)
- [bindX Getting Started](guides/bindx-getting-started.md)
- [Testing Guide](testing/getting-started.md)

---

## Next Steps

1. **Try the demo** — [genx.software/examples/genx-demo.html](https://genx.software/examples/genx-demo.html)
2. **Read module docs** — Detailed guides in `docs/guides/`
3. **Check architecture specs** — Technical details in `docs/architecture/`
4. **Contribute** — PRs welcome at [github.com/adamzwasserman/genX](https://github.com/adamzwasserman/genX)

---

*genX: The Tailwind of Frontend Behavior*
