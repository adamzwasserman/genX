# tableX API Reference

**Version:** 1.0.0
**Module:** tableX
**Prefix:** `tx-*`

tableX provides declarative table enhancements through HTML attributes, enabling sortable columns, pagination, responsive layouts, filtering, and virtual scrolling without JavaScript configuration.

---

## Table of Contents

1. [Core Attributes](#core-attributes)
2. [Sorting](#sorting)
3. [Pagination](#pagination)
4. [Filtering](#filtering)
5. [Virtual Scrolling](#virtual-scrolling)
6. [Responsive Design](#responsive-design)
7. [CSS Classes](#css-classes)
8. [JavaScript API](#javascript-api)
9. [Events](#events)
10. [Configuration Options](#configuration-options)

---

## Core Attributes

### Global Table Attributes

These attributes are applied to the `<table>` element to configure table-wide behavior.

#### `tx-sortable`

Enables column sorting for the table.

**Type:** Boolean attribute
**Default:** `false`
**Applies to:** `<table>`, `<th>`

**Usage:**

```html
<!-- Enable sorting for entire table -->
<table tx-sortable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <!-- rows -->
  </tbody>
</table>

<!-- Enable sorting for specific columns only -->
<table>
  <thead>
    <tr>
      <th tx-sortable>Name</th>
      <th tx-sortable>Age</th>
      <th>Email</th> <!-- Not sortable -->
    </tr>
  </thead>
  <tbody>
    <!-- rows -->
  </tbody>
</table>
```

**Behavior:**
- Adds click handlers to table headers
- Toggles between ascending, descending, and no sort
- Supports multi-column sorting with Shift+Click
- Automatically detects data types (string, number, date)
- Adds visual indicators (▲/▼) to sorted columns
- Screen reader announcements for sort state changes

**CSS Classes Applied:**
- `.tx-sortable` - Added to sortable headers
- `.tx-sort-active` - Added to currently sorted column
- `.tx-sort-asc` - Added when sorted ascending
- `.tx-sort-desc` - Added when sorted descending

---

#### `tx-paginate`

Enables client-side pagination for the table.

**Type:** Boolean attribute
**Default:** `false`
**Applies to:** `<table>`

**Usage:**

```html
<!-- Basic pagination -->
<table tx-paginate>
  <tbody>
    <!-- 100+ rows -->
  </tbody>
</table>

<!-- Pagination with custom page size -->
<table tx-paginate tx-per-page="25">
  <tbody>
    <!-- rows -->
  </tbody>
</table>
```

**Behavior:**
- Creates pagination controls automatically
- Default page size: 10 rows
- Shows "Page X of Y" information
- Previous/Next navigation buttons
- Screen reader accessible
- Updates dynamically when filtering

**Related Attributes:**
- `tx-per-page` - Number of rows per page

---

#### `tx-per-page`

Sets the number of rows displayed per page.

**Type:** Number
**Default:** `10`
**Applies to:** `<table>`
**Requires:** `tx-paginate`

**Usage:**

```html
<!-- Display 25 rows per page -->
<table tx-paginate tx-per-page="25">
  <!-- rows -->
</table>

<!-- Display 50 rows per page -->
<table tx-paginate tx-per-page="50">
  <!-- rows -->
</table>
```

**Valid Values:** Any positive integer (1-1000 recommended)

---

#### `tx-filter`

Enables client-side filtering/search for table rows.

**Type:** String (selector for input element)
**Default:** None
**Applies to:** `<table>`

**Usage:**

```html
<!-- Basic filtering -->
<input type="search" id="table-filter" placeholder="Search table...">

<table tx-filter="#table-filter">
  <tbody>
    <!-- rows -->
  </tbody>
</table>
```

**Advanced Usage:**

```html
<!-- Filter specific columns -->
<input type="search" id="table-filter">

<table tx-filter="#table-filter" tx-filter-columns="0,2,3">
  <thead>
    <tr>
      <th>Name</th>      <!-- Index 0 - Searchable -->
      <th>Age</th>        <!-- Index 1 - Not searchable -->
      <th>Email</th>      <!-- Index 2 - Searchable -->
      <th>City</th>       <!-- Index 3 - Searchable -->
    </tr>
  </thead>
  <tbody>
    <!-- rows -->
  </tbody>
</table>
```

**Behavior:**
- Case-insensitive search
- Searches visible text content
- Debounced for performance (300ms)
- Updates pagination automatically
- Shows "No results" message when no matches
- Preserves sort order during filtering

**Related Attributes:**
- `tx-filter-columns` - Comma-separated column indices to search

---

#### `tx-responsive`

Enables responsive table behavior for mobile devices.

**Type:** String (breakpoint strategy)
**Default:** `stack`
**Applies to:** `<table>`

**Usage:**

```html
<!-- Stack rows on mobile -->
<table tx-responsive="stack">
  <!-- rows -->
</table>

<!-- Horizontal scroll on mobile -->
<table tx-responsive="scroll">
  <!-- rows -->
</table>

<!-- Hide less important columns on mobile -->
<table tx-responsive="priority">
  <thead>
    <tr>
      <th>Name</th>               <!-- Always visible -->
      <th tx-priority="1">Email</th>   <!-- Hidden on mobile -->
      <th tx-priority="2">Phone</th>   <!-- Hidden on tablet -->
      <th>Actions</th>            <!-- Always visible -->
    </tr>
  </thead>
  <!-- rows -->
</table>
```

**Values:**
- `stack` - Stack cells vertically on mobile (default)
- `scroll` - Enable horizontal scrolling
- `priority` - Hide columns by priority on small screens

**Breakpoints:**
- Mobile: < 768px
- Tablet: < 1024px
- Desktop: >= 1024px

---

#### `tx-virtual`

Enables virtual scrolling for large datasets (10,000+ rows).

**Type:** Boolean attribute
**Default:** `false`
**Applies to:** `<table>`

**Usage:**

```html
<!-- Enable virtual scrolling -->
<table tx-virtual>
  <tbody>
    <!-- 10,000+ rows -->
  </tbody>
</table>

<!-- Virtual scrolling with custom buffer -->
<table tx-virtual tx-buffer-size="20">
  <tbody>
    <!-- rows -->
  </tbody>
</table>
```

**Behavior:**
- Only renders visible rows + buffer
- DOM recycling for performance
- Smooth scrolling experience
- Automatic activation for large datasets
- Performance target: <16ms render time

**Performance:**
- Without virtual scrolling: ~500 rows before lag
- With virtual scrolling: 10,000+ rows with 60 FPS

**Related Attributes:**
- `tx-buffer-size` - Number of extra rows to render above/below viewport (default: 10)

---

## Sorting

### Data Type Detection

tableX automatically detects column data types for intelligent sorting:

**String (alphabetical):**
```html
<td>Apple</td>
<td>Banana</td>
<td>Cherry</td>
```

**Number (numerical):**
```html
<td>1,234.56</td>
<td>789</td>
<td>$1,000.00</td>
```

**Date (chronological):**
```html
<td>2024-01-15</td>
<td>Jan 15, 2024</td>
<td>01/15/2024</td>
```

### Multi-Column Sorting

Hold **Shift** while clicking column headers to sort by multiple columns:

```html
<table tx-sortable>
  <thead>
    <tr>
      <th>Department</th>  <!-- Primary sort -->
      <th>Name</th>         <!-- Secondary sort -->
      <th>Salary</th>       <!-- Tertiary sort -->
    </tr>
  </thead>
  <!-- rows -->
</table>
```

**Sort Order:**
1. Click "Department" - Sort by department (asc)
2. Shift+Click "Name" - Sort by department, then name (asc, asc)
3. Shift+Click "Salary" - Sort by department, name, salary (asc, asc, asc)

### Custom Sort Type

Override automatic type detection with `data-sort-type`:

```html
<th data-sort-type="number">ID</th>
<th data-sort-type="date">Created</th>
<th data-sort-type="string">Notes</th>
```

**Valid Types:**
- `string` - Alphabetical sort
- `number` - Numerical sort
- `date` - Chronological sort
- `none` - Disable sorting for this column

---

## Pagination

### Pagination Controls

Pagination controls are automatically generated and inserted after the table:

```html
<table tx-paginate tx-per-page="25">
  <!-- rows -->
</table>

<!-- Generated controls structure: -->
<!-- <div class="tx-pagination">
  <button class="tx-pagination-prev">Previous</button>
  <span class="tx-pagination-info">Page 1 of 10</span>
  <button class="tx-pagination-next">Next</button>
</div> -->
```

### Custom Pagination Styling

Style pagination controls with CSS:

```css
.tx-pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.tx-pagination-prev,
.tx-pagination-next {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tx-pagination-prev:disabled,
.tx-pagination-next:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.tx-pagination-info {
  align-self: center;
  font-weight: 500;
}
```

### Programmatic Page Navigation

```javascript
// Get table instance
const table = document.querySelector('table[tx-paginate]');

// Navigate to specific page
window.tableX.setPage(table, 3);

// Get current page
const currentPage = window.tableX.getPage(table);

// Get total pages
const totalPages = window.tableX.getTotalPages(table);
```

---

## Filtering

### Basic Text Search

```html
<input type="search" id="search" placeholder="Search...">

<table tx-filter="#search">
  <!-- rows -->
</table>
```

### Column-Specific Filtering

Filter specific columns by index (0-based):

```html
<!-- Only search Name (0) and Email (2) columns -->
<table tx-filter="#search" tx-filter-columns="0,2">
  <thead>
    <tr>
      <th>Name</th>      <!-- Index 0 -->
      <th>Age</th>        <!-- Index 1 -->
      <th>Email</th>      <!-- Index 2 -->
    </tr>
  </thead>
  <!-- rows -->
</table>
```

### Filter Performance

- Debounced (300ms delay) to prevent lag during typing
- Searches visible text only (not hidden elements)
- Case-insensitive matching
- Updates pagination automatically
- Preserves sort order

### Custom Filter Logic

```javascript
// Apply custom filter function
window.tableX.setFilter(table, (row, query) => {
  // Custom filter logic
  const cells = row.querySelectorAll('td');
  const email = cells[2].textContent;
  return email.includes('@example.com') &&
         row.textContent.toLowerCase().includes(query.toLowerCase());
});
```

---

## Virtual Scrolling

### When to Use Virtual Scrolling

Use `tx-virtual` for tables with:
- 1,000+ rows
- Complex cell content
- Frequent updates
- Mobile devices

### Performance Comparison

| Rows | Standard | Virtual Scrolling |
|------|----------|-------------------|
| 100 | Fast | Fast |
| 500 | Laggy | Fast |
| 1,000 | Slow | Fast |
| 10,000 | Unusable | Fast (60 FPS) |

### Buffer Configuration

```html
<!-- Small buffer (less memory, more reflows) -->
<table tx-virtual tx-buffer-size="5">
  <!-- rows -->
</table>

<!-- Large buffer (more memory, fewer reflows) -->
<table tx-virtual tx-buffer-size="50">
  <!-- rows -->
</table>
```

**Recommended Buffer Sizes:**
- Mobile: 5-10
- Desktop: 10-20
- High-performance: 20-50

---

## Responsive Design

### Stack Strategy

```html
<table tx-responsive="stack">
  <!-- On mobile, each row becomes a card -->
</table>
```

### Scroll Strategy

```html
<table tx-responsive="scroll">
  <!-- On mobile, table scrolls horizontally -->
</table>
```

### Priority Strategy

```html
<table tx-responsive="priority">
  <thead>
    <tr>
      <th>Name</th>                 <!-- Always visible -->
      <th tx-priority="1">Email</th>     <!-- Hidden < 768px -->
      <th tx-priority="2">Phone</th>     <!-- Hidden < 1024px -->
      <th tx-priority="3">Address</th>   <!-- Hidden < 1440px -->
    </tr>
  </thead>
  <!-- rows -->
</table>
```

---

## CSS Classes

### Sorting Classes

| Class | Applied To | Description |
|-------|-----------|-------------|
| `.tx-sortable` | `<th>` | Marks column as sortable |
| `.tx-sort-active` | `<th>` | Currently sorted column |
| `.tx-sort-asc` | `<th>` | Sorted ascending |
| `.tx-sort-desc` | `<th>` | Sorted descending |

### Pagination Classes

| Class | Applied To | Description |
|-------|-----------|-------------|
| `.tx-pagination` | `<div>` | Pagination container |
| `.tx-pagination-prev` | `<button>` | Previous page button |
| `.tx-pagination-next` | `<button>` | Next page button |
| `.tx-pagination-info` | `<span>` | Page info display |

### Screen Reader Classes

| Class | Applied To | Description |
|-------|-----------|-------------|
| `.tx-sr-only` | Various | Screen reader only content |

---

## JavaScript API

### window.tableX

The global tableX API for programmatic control.

#### Methods

**`init(table)`**

Initialize tableX on a table element.

```javascript
const table = document.querySelector('#my-table');
window.tableX.init(table);
```

**`destroy(table)`**

Remove tableX functionality from a table.

```javascript
window.tableX.destroy(table);
```

**`sort(table, columnIndex, direction)`**

Sort table by column.

```javascript
// Sort by first column, ascending
window.tableX.sort(table, 0, 'asc');

// Sort by second column, descending
window.tableX.sort(table, 1, 'desc');

// Clear sorting
window.tableX.sort(table, 0, null);
```

**`setPage(table, pageNumber)`**

Navigate to specific page.

```javascript
window.tableX.setPage(table, 3);
```

**`getPage(table)`**

Get current page number.

```javascript
const page = window.tableX.getPage(table);
```

**`getTotalPages(table)`**

Get total number of pages.

```javascript
const total = window.tableX.getTotalPages(table);
```

**`setFilter(table, filterFn)`**

Set custom filter function.

```javascript
window.tableX.setFilter(table, (row, query) => {
  return row.textContent.toLowerCase().includes(query.toLowerCase());
});
```

**`refresh(table)`**

Refresh table (re-apply sort, filter, pagination).

```javascript
// After modifying DOM
table.querySelector('tbody').appendChild(newRow);
window.tableX.refresh(table);
```

---

## Events

### Sort Events

**`tx:sort`**

Fired when table is sorted.

```javascript
table.addEventListener('tx:sort', (event) => {
  console.log('Sorted by column:', event.detail.column);
  console.log('Direction:', event.detail.direction);
  console.log('Type:', event.detail.type);
});
```

**Event Detail:**
```javascript
{
  column: 0,           // Column index
  direction: 'asc',    // 'asc' | 'desc' | null
  type: 'string',      // 'string' | 'number' | 'date'
  multiSort: false     // Was Shift held?
}
```

### Pagination Events

**`tx:page`**

Fired when page changes.

```javascript
table.addEventListener('tx:page', (event) => {
  console.log('Current page:', event.detail.page);
  console.log('Total pages:', event.detail.totalPages);
});
```

**Event Detail:**
```javascript
{
  page: 2,            // Current page (1-indexed)
  totalPages: 10,     // Total pages
  perPage: 25,        // Rows per page
  totalRows: 237      // Total rows
}
```

### Filter Events

**`tx:filter`**

Fired when filter is applied.

```javascript
table.addEventListener('tx:filter', (event) => {
  console.log('Query:', event.detail.query);
  console.log('Matches:', event.detail.matches);
});
```

**Event Detail:**
```javascript
{
  query: 'search term',   // Search query
  matches: 42,            // Number of matching rows
  totalRows: 100          // Total rows
}
```

---

## Configuration Options

### Global Configuration

Configure tableX defaults globally:

```javascript
window.tableX.config({
  perPage: 25,           // Default rows per page
  sortIcons: true,       // Show sort icons
  debounceFilter: 300,   // Filter debounce (ms)
  virtualBuffer: 10,     // Virtual scroll buffer
  responsive: {
    mobile: 768,         // Mobile breakpoint
    tablet: 1024         // Tablet breakpoint
  }
});
```

### Per-Table Configuration

Configure individual tables via attributes or JavaScript:

```html
<!-- Via attributes -->
<table
  tx-sortable
  tx-paginate
  tx-per-page="25"
  tx-filter="#search"
  tx-responsive="stack">
</table>
```

```javascript
// Via JavaScript
window.tableX.init(table, {
  sortable: true,
  paginate: true,
  perPage: 25,
  filter: '#search',
  responsive: 'stack'
});
```

---

## Accessibility

### Keyboard Navigation

- **Tab** - Navigate between sortable headers
- **Enter/Space** - Sort column
- **Shift+Enter/Space** - Multi-column sort

### Screen Reader Support

- `aria-sort` attributes on sorted columns
- Live region announcements for sort/filter/page changes
- Proper focus management
- Semantic button elements for controls

### ARIA Attributes

tableX automatically adds appropriate ARIA attributes:

```html
<th aria-sort="ascending">Name</th>
<button aria-label="Next page" aria-disabled="false">Next</button>
<div role="status" aria-live="polite" class="tx-sr-only">
  Showing page 2 of 10
</div>
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Required

None. tableX uses only modern, widely-supported APIs.

---

## Performance

### Benchmarks

Tested on 2020 MacBook Pro (M1):

| Operation | Time | Notes |
|-----------|------|-------|
| Init (100 rows) | <1ms | First load |
| Sort (1,000 rows) | <50ms | String sort |
| Filter (10,000 rows) | <100ms | Full text search |
| Paginate (10,000 rows) | <10ms | Page change |
| Virtual scroll (10,000 rows) | <16ms | 60 FPS |

### Optimization Tips

1. **Use virtual scrolling** for 1,000+ rows
2. **Limit filter columns** with `tx-filter-columns`
3. **Debounce filters** (default: 300ms)
4. **Avoid complex cell content** in large tables
5. **Use CSS transforms** for custom animations

---

## Troubleshooting

### Sort not working

**Problem:** Clicking headers doesn't sort.

**Solutions:**
- Ensure `tx-sortable` is on `<table>` or `<th>`
- Check console for JavaScript errors
- Verify headers are in `<thead>`, rows in `<tbody>`

### Pagination not showing

**Problem:** Pagination controls don't appear.

**Solutions:**
- Ensure `tx-paginate` is on `<table>`
- Check that table has enough rows (>10 by default)
- Verify table is visible in DOM

### Filter not filtering

**Problem:** Typing in filter input doesn't filter rows.

**Solutions:**
- Ensure `tx-filter` selector matches input `id`
- Check input is visible and not disabled
- Verify rows are in `<tbody>` element

### Virtual scrolling laggy

**Problem:** Virtual scrolling feels choppy.

**Solutions:**
- Reduce `tx-buffer-size` (try 5-10)
- Simplify cell content (remove heavy images/CSS)
- Check browser DevTools for performance bottlenecks

---

## Migration Guides

See:
- [Migrating from DataTables](../guides/migrating-from-datatables.md)
- [Migrating from jQuery Table Plugins](../guides/migrating-from-jquery.md)

---

## Examples

See:
- [Getting Started Guide](../guides/tablex-getting-started.md)
- [Live Interactive Examples](../../examples/tablex-demo.html)

---

## Support

- **Documentation:** https://genx.software/docs
- **Issues:** https://github.com/genx/genx/issues
- **Discussions:** https://github.com/genx/genx/discussions
