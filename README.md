# genX

## The Tailwind of Frontend Behavior

**Tailwind gave us utility-first CSS. genX gives us utility-first JavaScript.**

Inspired by [htmx](https://htmx.org)'s philosophy that HTML should be powerful enough on its own, genX extends this idea to client-side behavior. Just as Tailwind lets you style elements with `class="bg-blue-500 text-center"`, genX lets you add behavior with `fx-format="currency"` or `dx-draggable="card"`. No JavaScript to write. No frameworks to learn. Just HTML attributes.

```html
<!-- Format as currency - no JS needed -->
<span fx-format="currency">1299.99</span>  →  $1,299.99

<!-- Make draggable - no JS needed -->
<div dx-draggable="card">Drag me</div>

<!-- Add loading state - no JS needed -->
<button lx-loading="true">Saving...</button>
```

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://genx.software/examples/genx-demo.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of Contents

| | | | | |
|---|---|---|---|---|
| [Features](#features) | [Architecture](#architecture) | [Quick Start](#quick-start) | [Modules](#modules) | [fmtX Examples](#fmtx-examples) |
| [tableX Examples](#tablex-examples) | [Documentation](#documentation) | [Testing](#testing) | [Privacy & Security](#privacy--security) | [Browser Support](#browser-support) |
| [Installation](#installation-options) | [Contributing](#contributing) | [Project Status](#project-status) | [License](#license) | [Links](#links) |

**New to genX?** Start with the **[User Guide](docs/user-guide.md)** for a beginner-friendly introduction with step-by-step examples.

## Features

- **Declarative** - Control everything with HTML attributes (`fx-*`, `ax-*`, `dx-*`, etc.)
- **Lightweight** - ~1KB bootloader, modules loaded on-demand
- **Privacy-First** - 100% client-side processing, no tracking, no external calls
- **Accessible** - WCAG 2.1 AA compliant made easy
- **Fast** - Designed for <16ms operations (60 FPS)
- **Framework Agnostic** - Works with vanilla HTML, React, Vue, Angular, htmx, or anything else

## Architecture

### Universal Bootloader

- Scans DOM for genX attributes
- Dynamically loads only required modules
- Watches for dynamic content via centralized MutationObserver
- Powered by [domx](https://github.com/adamzwasserman/domx) for efficient DOM observation

### Centralized DOM Observation

genX uses **domx-bridge** to provide a single, shared MutationObserver for all modules. Instead of each module (fmtX, accX, bindX, etc.) creating its own observer, they all subscribe through domx-bridge which delegates to domx. This architecture:

- **Eliminates duplication** - One observer instead of 6+
- **Improves performance** - Single observer with filtered callbacks
- **Reduces memory** - No redundant DOM watchers
- **Fallback support** - Works without domx via native MutationObserver

### Module Design

- **Pure functional JavaScript** - No classes, no complex state
- **Polymorphic processing** - Handles multiple input/output formats
- **Client-side only** - Privacy-preserving, no external calls
- **Performance-first** - All operations target <16ms (60 FPS)

See [Architecture Documentation](docs/architecture/) for technical specifications.

## Quick Start

### View the Live Demo

See all modules in action: **[genX Interactive Demo](https://genx.software/examples/genx-demo.html)**

### Installation

#### Option 1: CDN (Easiest)

```html
<!-- Add to your HTML <head> with defer attribute -->
<script src="https://cdn.genx.software/v1/bootloader.js" defer></script>
```

#### Option 2: Self-Hosted

1. Copy genX files to your static directory:

```bash
# Clone the repository
git clone https://github.com/adamzwasserman/genX.git

# Copy src files to your project's static/js directory
cp genX/src/*.js your-project/static/js/
```

2. Add to your HTML `<head>` with `defer` attribute:

```html
<script src="/static/js/bootloader.js" defer></script>
```

**Important:** Always use the `defer` attribute to ensure genX loads after the DOM is parsed without blocking page rendering.

### Basic Usage

```html
<!-- Currency Formatting -->
<span fx-format="currency" fx-currency="USD">1299.99</span>
<!-- Displays: $1,299.99 -->

<!-- Phone Number Formatting -->
<input type="tel" fx-format="phone" fx-phone-format="us" value="5551234567">
<!-- Displays: (555) 123-4567 -->

<!-- Date Formatting -->
<span fx-format="date" fx-date-format="long">2024-03-15</span>
<!-- Displays: March 15, 2024 -->

<!-- Percentage with Decimal Control -->
<span fx-format="percent" fx-decimals="2">0.1567</span>
<!-- Displays: 15.67% -->
```

## Modules

| Module | Purpose | Prefix | Status | Documentation |
|--------|---------|--------|--------|---------------|
| **fmtX** | Text formatting (currency, dates, numbers, phones) | `fx-*` | ✅ v1.0 | [Architecture](docs/architecture/fmtx-architecture-v1.0.md) |
| **accX** | Accessibility (WCAG, ARIA) | `ax-*` | ✅ v1.0 | [Architecture](docs/architecture/accx-architecture-v1.0.md) |
| **loadX** | Loading states, skeletons, spinners | `lx-*` | ✅ v1.0 | [Architecture](docs/architecture/loadx-architecture-v1.0.md) |
| **navX** | Navigation & routing | `nx-*` | ✅ v1.0 | [Architecture](docs/architecture/navx-architecture-v1.0.md) |
| **dragX** | Drag & drop | `dx-*` | ✅ v1.0 | [Architecture](docs/architecture/dragx-architecture-v1.0.md) |
| **bindX** | Reactive data binding | `bx-*` | ✅ v1.0 | [Architecture](docs/architecture/bindx-technical-architecture-v1.0.md) |
| **tableX** | Enhanced tables | `tx-*` | ✅ v1.0 | [Architecture](docs/architecture/tablex-architecture-v1.0.md) |
| **smartX** | Auto-detection formatting | `sx-*` | ✅ v1.0 | - |

## fmtX Examples

The fmtX module supports comprehensive formatting with input type selectors:

### Currency Formatting

```html
<!-- Basic currency -->
<span fx-format="currency" fx-currency="USD">42.50</span>

<!-- Input type selector: dollars or cents -->
<span fx-format="currency" fx-currency="USD" fx-input-type="cents">4250</span>
<!-- Input: 4250 cents → Output: $42.50 -->
```

### Phone Numbers

Supports multiple US formats and international numbers:

```html
<!-- US formats -->
<span fx-format="phone" fx-phone-format="us">5551234567</span>
<!-- Output: (555) 123-4567 -->

<span fx-format="phone" fx-phone-format="us-dash">5551234567</span>
<!-- Output: 555-123-4567 -->

<span fx-format="phone" fx-phone-format="us-dot">5551234567</span>
<!-- Output: 555.123.4567 -->

<!-- International format -->
<span fx-format="phone" fx-phone-format="intl">+44 20 7946 0958</span>
<!-- Output: +44 20 7946 0958 (normalized) -->
```

**Input format flexibility:** Accepts raw digits, pre-formatted numbers, numbers with spaces, or international format. Gracefully handles:

- 10-digit US numbers
- 11-digit numbers with country code
- Already-formatted numbers (with parentheses, dashes, or dots)
- Extra spaces (stripped automatically)
- European/international numbers (preserved as-is)

### Date & Time

```html
<!-- Date input types: iso, unix, ms -->
<span fx-format="date" fx-date-format="long" fx-input-type="unix">1710518400</span>

<!-- Relative time (always UTC input) -->
<span fx-format="relative">2024-03-15T12:00:00Z</span>
<!-- Output: "2 hours ago" or "in 3 days" -->
```

### Numbers & Percentages

```html
<!-- Percentage with decimal control -->
<span fx-format="percent" fx-decimals="2">0.1567</span>
<!-- Output: 15.67% -->

<!-- Compact numbers (auto-scales: K, M, B, T) -->
<span fx-format="compact">1500000</span>
<!-- Output: 1.5M -->

<!-- File sizes (auto-scales: KB, MB, GB, TB) -->
<span fx-format="filesize">1073741824</span>
<!-- Output: 1.00 GB -->

<!-- Decimal precision control -->
<span fx-format="decimal" fx-decimals="3">3.14159</span>
<!-- Output: 3.142 -->
```

## tableX Examples

The tableX module enhances HTML tables with sorting, filtering, pagination, and responsive layouts—all through declarative attributes.

### Column Sorting

```html
<!-- Basic sortable table -->
<table>
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>
      <th class="tx-sortable">Age</th>
      <th class="tx-sortable">Join Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>30</td>
      <td>2024-01-15</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>25</td>
      <td>2024-02-20</td>
    </tr>
  </tbody>
</table>
```

**How it works:**
- Click a column header to sort ascending
- Click again to sort descending
- Click a third time to clear sort (restore original order)
- Automatically detects data types (string, number, date)
- Shift+click to add secondary/tertiary sorts (multi-column sorting)

**Multi-Column Sorting:**
1. Click "Name" to sort by name
2. Shift+click "Age" to add secondary sort (now sorted by name, then age)
3. Shift+click "Join Date" to add tertiary sort
4. Visual priority badges (①②③) show sort order

**Data Type Override:**
```html
<!-- Force date interpretation with data-value -->
<td data-value="2024-01-15">January 15, 2024</td>
```

**Accessibility:**
- Keyboard navigation (Tab to headers, Enter/Space to sort)
- ARIA live regions announce sort changes
- Screen reader friendly sort indicators
- Focus styles for keyboard users

**Performance:**
- Sorts 100 rows in <10ms
- Sorts 1,000 rows in <100ms
- All operations target 60 FPS (<16ms)

### Client-Side Pagination

```html
<!-- Basic pagination (default: 10 rows per page) -->
<table tx-paginate="true">
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <!-- 100 rows here -->
  </tbody>
</table>

<!-- Custom page size -->
<table tx-paginate="true" tx-per-page="25">
  <!-- ... -->
</table>
```

**How it works:**
- Automatically hides rows not on current page
- Shows Previous/Next navigation buttons
- Displays current page info (e.g., "Page 2 of 10")
- Keyboard accessible (Tab to buttons, Enter/Space to navigate)
- ARIA live regions announce page changes
- Previous button disabled on first page
- Next button disabled on last page

**Combine with sorting:**
```html
<!-- Sortable and paginated table -->
<table tx-sortable tx-paginate="true" tx-per-page="20">
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>
      <th class="tx-sortable">Date</th>
      <th class="tx-sortable">Status</th>
    </tr>
  </thead>
  <tbody>
    <!-- Many rows here -->
  </tbody>
</table>
```

Pagination controls are automatically inserted after the table with Previous, page info, and Next buttons.

### Responsive Table Layouts

tableX provides three responsive strategies for mobile-friendly tables, all implemented through CSS-only patterns:

#### Scroll Mode

Horizontal scrolling with sticky first column for important data:

```html
<table tx-responsive="scroll">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>Address</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Smith</td>
      <td>alice@example.com</td>
      <td>(555) 123-4567</td>
      <td>123 Main St, City, State 12345</td>
      <td>Active</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

**How it works:**
- Table scrolls horizontally on narrow screens
- First column (e.g., Name) stays sticky/visible while scrolling
- No data hidden, all columns accessible
- Best for tables where all data must be viewable

#### Cards Mode

Stacks rows as mobile-friendly cards on small screens:

```html
<table tx-responsive="cards">
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Category</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Product">Widget Pro</td>
      <td data-label="Price">$29.99</td>
      <td data-label="Stock">150</td>
      <td data-label="Category">Electronics</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

**How it works:**
- On screens <768px, rows become stacked cards
- Each cell displays with its column label (from `data-label`)
- Headers are hidden automatically
- Cards have borders, padding, and proper spacing
- Best for tables with moderate number of columns (3-6)

**Important:** Add `data-label` attributes to each cell matching the column header text.

#### Priority Mode

Progressively hides less important columns as screen narrows:

```html
<table tx-responsive="priority">
  <thead>
    <tr>
      <th class="tx-priority-1">Name</th>
      <th class="tx-priority-2">Email</th>
      <th class="tx-priority-3">Phone</th>
      <th class="tx-priority-4">Department</th>
      <th class="tx-priority-5">Location</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tx-priority-1">Alice Smith</td>
      <td class="tx-priority-2">alice@example.com</td>
      <td class="tx-priority-3">(555) 123-4567</td>
      <td class="tx-priority-4">Engineering</td>
      <td class="tx-priority-5">Building A</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

**How it works:**
- Columns with `tx-priority-1` are always visible (most important)
- `tx-priority-5` columns hide first (at <1024px)
- `tx-priority-4` hide next (at <900px)
- `tx-priority-3` hide next (at <768px)
- `tx-priority-2` hide last (at <600px)
- `tx-priority-1` always remain visible
- Best for tables with many columns where some data is optional

**Breakpoints:**
- **<600px**: Only priority-1 columns visible
- **<768px**: Priority-1 and priority-2 visible
- **<900px**: Priority-1, 2, and 3 visible
- **<1024px**: Priority-1, 2, 3, and 4 visible
- **≥1024px**: All columns visible

**Combine with sorting and pagination:**
```html
<table tx-responsive="cards" tx-paginate="true" tx-per-page="20">
  <thead>
    <tr>
      <th class="tx-sortable">Product</th>
      <th class="tx-sortable">Price</th>
      <th class="tx-sortable">Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Product">Widget</td>
      <td data-label="Price">$29.99</td>
      <td data-label="Stock">150</td>
    </tr>
    <!-- Many rows -->
  </tbody>
</table>
```

All three responsive modes work together with sorting and pagination seamlessly.

### Table Filtering

tableX provides client-side filtering with live search, debounced input, and multi-column support:

#### Basic Filtering

```html
<!-- Basic filterable table (searches all columns) -->
<table tx-filterable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Smith</td>
      <td>alice@example.com</td>
      <td>Engineering</td>
    </tr>
    <tr>
      <td>Bob Jones</td>
      <td>bob@example.com</td>
      <td>Sales</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

**How it works:**
- Automatically generates search input above table
- Live filtering as you type (debounced for performance)
- Case-insensitive search across all columns
- Shows result count (e.g., "5 rows found")
- ARIA live regions announce filter results
- Works seamlessly with sorting and pagination

#### Multi-Column Filtering

Filter only specific columns by name:

```html
<!-- Only search Name and Email columns -->
<table tx-filterable tx-filter-columns="Name,Email">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <!-- Rows -->
  </tbody>
</table>
```

The `tx-filter-columns` attribute accepts a comma-separated list of column header names (case-insensitive matching).

#### Custom Debounce Delay

Control how long to wait after typing stops before filtering:

```html
<!-- Wait 500ms after typing stops (default: 300ms) -->
<table tx-filterable tx-filter-debounce="500">
  <!-- ... -->
</table>
```

**Performance:**
- Default 300ms debounce prevents excessive filtering during typing
- Filters 1,000 rows in <16ms
- No page reload or server requests

#### Combine with Sorting and Pagination

All tableX features work together:

```html
<table tx-filterable tx-filter-columns="Name,Email" tx-paginate="true" tx-per-page="20">
  <thead>
    <tr>
      <th class="tx-sortable">Name</th>
      <th class="tx-sortable">Email</th>
      <th class="tx-sortable">Join Date</th>
      <th>Department</th>
    </tr>
  </thead>
  <tbody>
    <!-- Many rows -->
  </tbody>
</table>
```

**Behavior:**
1. Filter narrows visible rows
2. Sorting applies to filtered results only
3. Pagination shows filtered rows across pages
4. Result count updates as you filter

**Accessibility:**
- Search input has proper label and aria-label
- ARIA live regions announce filter results
- Keyboard accessible (Tab to input, type to filter)
- Screen reader friendly result counts

## Accessibility (WCAG 2.1 AA Compliant)

tableX is designed for full accessibility compliance:

### Keyboard Navigation

- **Tab**: Navigate between sortable headers, pagination buttons, and filter input
- **Enter/Space**: Sort column (when focused on sortable header)
- **Shift+Enter/Space**: Add secondary/tertiary sort (multi-column)
- All interactive elements are keyboard accessible

### ARIA Support

- **Sortable Headers**:
  - `role="columnheader"` on all sortable headers
  - `scope="col"` for proper column association
  - `aria-sort="ascending|descending|none"` indicates current sort state
  - `tabindex="0"` makes headers keyboard focusable

- **Pagination**:
  - `role="navigation"` with `aria-label="Table pagination"`
  - `aria-disabled="true|false"` on Previous/Next buttons
  - `aria-live="polite"` announces page changes

- **Filtering**:
  - `aria-label="Filter table rows"` on search input
  - `role="status"` with `aria-live="polite"` for result announcements
  - Hidden rows marked with `aria-hidden="true"`

- **Screen Reader Announcements**:
  - Sort changes: "Sorted by [column] [direction], [priority]"
  - Filter results: "Showing X of Y rows"
  - Page changes: "Page X of Y"

### Visual Accessibility

- **Focus Indicators**: Visible outline on all focusable elements
- **High Contrast Mode**: Increased opacity and bold indicators
- **Color Independence**: Sort indicators use symbols (▲▼), not just color
- **Dark Mode**: Full support via `prefers-color-scheme: dark`

### Screen Reader Support

- Semantic HTML table structure (`<table>`, `<thead>`, `<tbody>`)
- Column headers with proper scope attributes
- Live regions announce dynamic changes
- Hidden elements properly marked with `aria-hidden`
- All controls have accessible names and descriptions

### Testing

tableX meets WCAG 2.1 AA standards for:
- **1.4.3 Contrast (Minimum)**: All text meets 4.5:1 ratio
- **2.1.1 Keyboard**: Full keyboard accessibility
- **2.4.3 Focus Order**: Logical tab order
- **2.4.7 Focus Visible**: Clear focus indicators
- **3.2.4 Consistent Identification**: Consistent UI patterns
- **4.1.2 Name, Role, Value**: Proper ARIA implementation

**Automated Testing**: Compatible with axe-core and WAVE for accessibility auditing.

## Documentation

- **[User Guide](docs/user-guide.md)** - Beginner-friendly introduction with practical examples
- **[Live Demo](https://genx.software/examples/genx-demo.html)** - Interactive examples of all modules
- **[Architecture Specs](docs/architecture/)** - Technical documentation for each module
- **[Implementation Plans](docs/implementation/)** - Development roadmaps and completion reports
- **[Testing Guide](docs/testing/getting-started.md)** - BDD/TDD testing framework

## Testing

genX uses a comprehensive BDD/TDD testing framework:

- **Cucumber BDD** - Human-readable feature specifications
- **Playwright** - Browser automation for UI testing
- **Jest** - Unit tests for pure functions
- **Manual Test Suite** - Visual verification in `tests/manual/`

```bash
# Run all tests
npm test

# Run browser tests
npm run test:browser

# Run unit tests
npm run test:unit

# Run BDD tests
npm run test:bdd
```

## Privacy & Security

- **100% Client-Side** - No data sent to servers, ever
- **No Tracking** - No analytics, no telemetry, no cookies
- **XSS Protected** - Safe DOM manipulation, no innerHTML
- **CSP Compliant** - No eval, no inline scripts
- **GDPR Compliant** - No PII collection

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires modern JavaScript features: ES6+, Proxy, MutationObserver, async/await

## Installation Options

### Option 1: Direct Script Tag

```html
<script src="https://cdn.genx.software/v1/bootloader.js"></script>
```

### Option 2: Local Development

```bash
git clone https://github.com/adamzwasserman/genX.git
cd genX
# Include src/bootloader.js in your project
```

### Option 3: npm (Coming Soon)

```bash
npm install @genx/core
```

## Contributing

Contributions welcome! This project follows:

- **BDD/TDD** - All features require tests (Cucumber + Playwright + Jest)
- **Architecture-first** - Specifications before implementation
- **Performance budget** - <16ms operations, <1KB bootloader
- **Privacy-first** - No external calls, no tracking

See implementation plans in `docs/implementation/` for current development status.

## Project Status

**Version:** 1.0.0-alpha
**Modules Complete:** fmtX, accX, loadX, navX, dragX, tableX, bindX, smartX
**In Development:** (None)
**Planned:** (None - all core modules complete)

**Recent Updates:**

- ✅ **tableX v1.0** - Column sorting with multi-column support (shift+click)
- ✅ Phone number formatting with comprehensive US/international support
- ✅ Input type selectors for dates, currency, percentages
- ✅ Decimal precision control for percentages and numbers
- ✅ Comprehensive BDD test suite with Cucumber/Playwright/Jest
- ✅ Manual test files for visual verification
- ✅ Updated demo page with clean, minimal styling

## Development Acknowledgement

This project was developed with extensive use of AI-assisted coding tools. While the architecture, specifications, and testing have been carefully designed and validated, not all code has been manually reviewed line-by-line. Users should conduct their own security audits and testing before using genX in production environments.

## License

MIT License - See [LICENSE](LICENSE) for details

## Links

- **Website:** [https://genx.software](https://genx.software)
- **Repository:** [https://github.com/adamzwasserman/genX](https://github.com/adamzwasserman/genX)
- **Live Demo:** [https://genx.software/examples/genx-demo.html](https://genx.software/examples/genx-demo.html)
- **Issues:** [https://github.com/adamzwasserman/genX/issues](https://github.com/adamzwasserman/genX/issues)

---

Made for developers who value simplicity, privacy, and performance.
