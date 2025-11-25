# Getting Started with tableX

tableX is a declarative table enhancement library that adds sorting, pagination, filtering, and more to your HTML tables using simple attributes. No JavaScript configuration required!

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Basic Examples](#basic-examples)
4. [Common Patterns](#common-patterns)
5. [Styling Your Table](#styling-your-table)
6. [Next Steps](#next-steps)

---

## Quick Start

Add tableX to your page and enhance any table with just attributes:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.genx.software/tableX@1.0.0/tablex.min.js"></script>
  <link rel="stylesheet" href="https://cdn.genx.software/tableX@1.0.0/tablex.min.css">
</head>
<body>
  <table tx-sortable tx-paginate>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>alice@example.com</td>
        <td>Developer</td>
      </tr>
      <!-- More rows... -->
    </tbody>
  </table>
</body>
</html>
```

That's it! Your table now has sortable columns and pagination.

---

## Installation

### CDN (Recommended for Getting Started)

```html
<!-- Include in <head> -->
<script src="https://cdn.genx.software/tableX@1.0.0/tablex.min.js"></script>
<link rel="stylesheet" href="https://cdn.genx.software/tableX@1.0.0/tablex.min.css">
```

### NPM

```bash
npm install @genx/tablex
```

```javascript
// Import in your JavaScript
import tableX from '@genx/tablex';
import '@genx/tablex/dist/tablex.css';
```

### Download

Download from [genx.software/downloads](https://genx.software/downloads):

```html
<script src="/path/to/tablex.min.js"></script>
<link rel="stylesheet" href="/path/to/tablex.min.css">
```

---

## Basic Examples

### Example 1: Sortable Table

Click headers to sort:

```html
<table tx-sortable>
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Laptop</td>
      <td>$999.99</td>
      <td>15</td>
    </tr>
    <tr>
      <td>Mouse</td>
      <td>$29.99</td>
      <td>150</td>
    </tr>
    <tr>
      <td>Keyboard</td>
      <td>$79.99</td>
      <td>45</td>
    </tr>
  </tbody>
</table>
```

**Features:**
- Click any header to sort
- Click again to reverse sort
- Click a third time to remove sort
- Shift+Click for multi-column sorting

---

### Example 2: Paginated Table

Show 10 rows per page:

```html
<table tx-paginate tx-per-page="10">
  <tbody>
    <tr><td>Row 1</td><td>Data</td></tr>
    <tr><td>Row 2</td><td>Data</td></tr>
    <!-- ... 98 more rows ... -->
    <tr><td>Row 100</td><td>Data</td></tr>
  </tbody>
</table>
```

**Features:**
- Automatic pagination controls
- Previous/Next buttons
- Page counter ("Page 1 of 10")
- Keyboard navigation

---

### Example 3: Searchable Table

Add instant search:

```html
<input type="search" id="table-search" placeholder="Search employees...">

<table tx-filter="#table-search">
  <thead>
    <tr>
      <th>Name</th>
      <th>Department</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Johnson</td>
      <td>Engineering</td>
      <td>alice@company.com</td>
    </tr>
    <tr>
      <td>Bob Smith</td>
      <td>Marketing</td>
      <td>bob@company.com</td>
    </tr>
    <!-- More rows... -->
  </tbody>
</table>
```

**Features:**
- Case-insensitive search
- Searches all visible text
- Debounced for performance
- Updates pagination automatically

---

### Example 4: Combined Features

Everything together:

```html
<input type="search" id="search" placeholder="Search...">

<table tx-sortable tx-paginate tx-per-page="25" tx-filter="#search">
  <thead>
    <tr>
      <th>Employee</th>
      <th>Department</th>
      <th>Salary</th>
      <th>Start Date</th>
    </tr>
  </thead>
  <tbody>
    <!-- Many rows... -->
  </tbody>
</table>
```

**Features:**
- Sortable columns
- 25 rows per page
- Instant search
- All features work together seamlessly

---

### Example 5: Mobile-Responsive Table

Stacks on mobile devices:

```html
<table tx-sortable tx-responsive="stack">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Johnson</td>
      <td>alice@example.com</td>
      <td>(555) 123-4567</td>
      <td>San Francisco</td>
    </tr>
    <!-- More rows... -->
  </tbody>
</table>
```

**Mobile View:**
- Rows become cards
- Each cell shows label + value
- Easy to read on small screens

---

### Example 6: Large Dataset (Virtual Scrolling)

Handle 10,000+ rows smoothly:

```html
<table tx-virtual tx-sortable>
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <!-- 10,000+ rows -->
  </tbody>
</table>
```

**Features:**
- Only renders visible rows
- Smooth 60 FPS scrolling
- Handles 10,000+ rows
- Automatic performance optimization

---

## Common Patterns

### Pattern 1: User Directory

```html
<input type="search" id="user-search" placeholder="Search users...">

<table
  tx-sortable
  tx-paginate
  tx-per-page="50"
  tx-filter="#user-search"
  tx-filter-columns="0,1,2">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- User rows -->
  </tbody>
</table>
```

**Why This Works:**
- Users can sort by any column
- 50 rows visible at once (good for scanning)
- Search filters Name, Email, Department only
- Actions column excluded from search

---

### Pattern 2: Product Catalog

```html
<table tx-sortable tx-paginate tx-per-page="20" tx-responsive="stack">
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Category</th>
      <th>Rating</th>
    </tr>
  </thead>
  <tbody>
    <!-- Product rows -->
  </tbody>
</table>
```

**Why This Works:**
- Sort by price, stock, or rating
- 20 products per page (standard)
- Mobile-friendly layout

---

### Pattern 3: Data Report

```html
<table
  tx-sortable
  tx-paginate
  tx-per-page="100"
  class="data-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Revenue</th>
      <th>Expenses</th>
      <th>Profit</th>
      <th>Growth</th>
    </tr>
  </thead>
  <tbody>
    <!-- Report rows -->
  </tbody>
</table>
```

**Why This Works:**
- Large page size for analysis
- Sortable for trend analysis
- Clean, data-focused design

---

### Pattern 4: Dashboard Table

```html
<table
  tx-sortable
  tx-paginate
  tx-per-page="10"
  tx-responsive="priority">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Current</th>
      <th tx-priority="1">Previous</th>
      <th tx-priority="1">Change</th>
      <th tx-priority="2">Goal</th>
    </tr>
  </thead>
  <tbody>
    <!-- Metric rows -->
  </tbody>
</table>
```

**Why This Works:**
- Essential columns always visible
- Less important columns hide on mobile
- Quick overview of key metrics

---

## Styling Your Table

### Basic Styling

```css
/* Table structure */
table {
  width: 100%;
  border-collapse: collapse;
  font-family: system-ui, sans-serif;
}

/* Headers */
th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

/* Cells */
td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

/* Hover state */
tr:hover {
  background: #f9f9f9;
}

/* Sortable headers */
th.tx-sortable {
  cursor: pointer;
  user-select: none;
}

th.tx-sortable:hover {
  background: #e8e8e8;
}

/* Active sort indicator */
th.tx-sort-active {
  background: #007bff;
  color: white;
}
```

### Sort Icons

```css
/* Add sort icons */
th.tx-sortable::after {
  content: ' ⇅';
  opacity: 0.3;
  font-size: 0.8em;
}

th.tx-sort-asc::after {
  content: ' ▲';
  opacity: 1;
}

th.tx-sort-desc::after {
  content: ' ▼';
  opacity: 1;
}
```

### Pagination Styling

```css
/* Pagination container */
.tx-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
}

/* Buttons */
.tx-pagination-prev,
.tx-pagination-next {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.tx-pagination-prev:hover,
.tx-pagination-next:hover {
  background: #0056b3;
}

.tx-pagination-prev:disabled,
.tx-pagination-next:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Page info */
.tx-pagination-info {
  font-weight: 500;
  color: #666;
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  table {
    color: #e0e0e0;
  }

  th {
    background: #2d2d2d;
    border-bottom-color: #444;
  }

  td {
    border-bottom-color: #333;
  }

  tr:hover {
    background: #333;
  }

  th.tx-sort-active {
    background: #0056b3;
  }
}
```

---

## Next Steps

### Learn More

- **[Full API Reference](../api/tablex-api.md)** - Complete attribute and method documentation
- **[Migration Guides](./migrating-from-datatables.md)** - Switch from DataTables or jQuery plugins
- **[Performance Guide](./tablex-performance.md)** - Optimize for large datasets
- **[Accessibility Guide](./tablex-accessibility.md)** - WCAG compliance and screen readers
- **[Live Examples](../../examples/tablex-demo.html)** - Interactive demos

### Common Tasks

**Add custom sort logic:**
```javascript
window.tableX.sort(table, columnIndex, 'asc', (a, b) => {
  // Custom comparison
  return a.localeCompare(b);
});
```

**Refresh after DOM changes:**
```javascript
// Add/remove rows
table.querySelector('tbody').appendChild(newRow);

// Refresh tableX
window.tableX.refresh(table);
```

**Listen to events:**
```javascript
table.addEventListener('tx:sort', (e) => {
  console.log('Sorted:', e.detail);
});

table.addEventListener('tx:page', (e) => {
  console.log('Page changed:', e.detail.page);
});
```

### Community

- **GitHub:** https://github.com/genx/genx
- **Discussions:** https://github.com/genx/genx/discussions
- **Issues:** https://github.com/genx/genx/issues
- **Twitter:** @genx_software

---

## FAQ

**Q: Does tableX work with React/Vue/Angular?**

A: Yes! tableX works with any framework. Just add the attributes to your table element.

**Q: Can I use tableX with server-side data?**

A: tableX is designed for client-side tables. For server-side pagination/sorting, consider using your framework's data table component or implement custom event handlers.

**Q: How many rows can tableX handle?**

A: Without virtual scrolling: ~500 rows smoothly. With `tx-virtual`: 10,000+ rows at 60 FPS.

**Q: Does tableX support TypeScript?**

A: Yes! Type definitions are included in the npm package.

**Q: Is tableX accessible?**

A: Yes! tableX follows WCAG 2.1 Level AA guidelines with full keyboard navigation and screen reader support.

**Q: Can I customize the appearance?**

A: Absolutely! tableX uses minimal styles. You have full control with CSS.

**Q: Is tableX free?**

A: Yes! tableX is open source under the MIT license.

---

## Troubleshooting

**Problem:** Table doesn't initialize

**Solution:**
1. Check browser console for errors
2. Ensure tableX script loaded successfully
3. Verify attributes are on `<table>` element
4. Check that table has `<thead>` and `<tbody>`

---

**Problem:** Sort doesn't work

**Solution:**
1. Ensure `tx-sortable` is on `<table>` or specific `<th>`
2. Check headers are in `<thead>`, data in `<tbody>`
3. Verify no JavaScript errors in console

---

**Problem:** Pagination doesn't appear

**Solution:**
1. Ensure `tx-paginate` is on `<table>`
2. Check table has enough rows (>10 by default)
3. Verify table is visible in DOM

---

## Getting Help

If you're stuck:

1. Check the [API Reference](../api/tablex-api.md)
2. Browse [Examples](../../examples/tablex-demo.html)
3. Search [GitHub Issues](https://github.com/genx/genx/issues)
4. Ask in [Discussions](https://github.com/genx/genx/discussions)

Happy table building! 🎉
