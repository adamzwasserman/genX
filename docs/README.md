# genX Documentation

Documentation for the genX declarative web development platform.

## Quick Links

- [Quick Start Guide](QUICK-START.md) - Get started with genX in 5 minutes
- [Architecture Overview](#architecture) - System design and module specifications
- [Implementation Guides](#implementation) - Launch checklists and deployment guides
- [Module Reference](#modules) - Complete API reference for all modules

## Table of Contents

1. [Architecture Documentation](#architecture)
2. [Implementation Guides](#implementation)
3. [Module Reference](#modules)
4. [Standards & Best Practices](#standards)
5. [Support & Troubleshooting](#support)

---

## Architecture

Comprehensive architecture documentation for the genX platform and all modules.

### Core Platform

- [genX Common Infrastructure](architecture/genx-common-infrastructure-architecture-v1.0.md) - Universal bootloader, polymorphic engine, and platform overview
- [Standard Text Blocks](architecture/STANDARD_TEXT_BLOCKS.md) - Reusable documentation components
- [Standardization Analysis](architecture/STANDARDIZATION_ANALYSIS.md) - Documentation consistency audit

### Module Architecture

| Module | Purpose | Documentation |
|--------|---------|---------------|
| **fmtX** | Declarative text formatting (currency, dates, numbers) | [Architecture](architecture/fmtx-architecture-v1.0.md) |
| **accX** | Automated accessibility (WCAG, ARIA) | [Architecture](architecture/accx-architecture-v1_0.md) |
| **bindX** | Reactive data binding | [Architecture](architecture/bindx-technical-architecture-v1_0.md) |
| **loadX** | Loading states and HTMX integration | [Architecture](architecture/loadx-architecture-v1_0.md) |
| **dragX** | Drag-and-drop functionality | [Architecture](architecture/dragx-architecture-v1_0.md) |
| **tableX** | Enhanced tables with sorting, filtering | [Architecture](architecture/tablex-architecture-v1_0.md) |
| **navX** | Navigation and routing | [Architecture](architecture/navx-architecture-v1_0.md) |

### Visual Tooling (Commercial)

Visual genX tooling is available as a commercial product. For information:
- Website: https://visual.genx.software
- Contact: sales@genx.software

**Features:**
- Chrome Extension - Point-and-click visual tagger
- VSCode Extension - IDE-integrated tagging
- Collaboration Server - Team-based workflows
- Enterprise SSO and RBAC

---

## Implementation

Step-by-step guides for implementing, deploying, and launching genX modules.

- [Launch Checklists](implementation/genx-launch-checklists.md) - Pre-launch validation for all modules

### Deployment

See [QUICK-START.md](QUICK-START.md) for local development and testing.

**Production Deployment Options:**

1. **Self-Hosted**
   ```html
   <script src="/js/bootloader.js"></script>
   ```

2. **CDN (jsDelivr, unpkg)**
   ```html
   <script src="https://cdn.jsdelivr.net/gh/youruser/genx@latest/bootloader.js"></script>
   ```

3. **Edge Compilation Service** (Optional paid tier)
   ```javascript
   window.genxConfig = {
       edge: { enabled: true, url: 'https://edge.genx.software/compile' }
   };
   ```

---

## Modules

### fmtX - Text Formatting

**Purpose:** Declarative text formatting with 20+ format types

**Usage:**
```html
<span fx-format="currency" fx-raw="29.99" fx-currency="USD">29.99</span>
<span fx-format="date" fx-raw="2024-03-15" fx-date-format="long">2024-03-15</span>
<span fx-format="abbreviated" fx-raw="1500000">1500000</span>
```

**Format Types:** currency, date, time, datetime, number, percent, scientific, accounting, abbreviated, compact, millions, billions, trillions, filesize, duration, fraction, uppercase, lowercase, capitalize, trim, truncate, phone, ssn, creditcard

**Documentation:** [fmtX Architecture](architecture/fmtx-architecture-v1.0.md)

### accX - Accessibility

**Purpose:** Automated WCAG 2.1 AA compliance with declarative attributes

**Usage:**
```html
<span ax-enhance="label" ax-type="abbreviation" ax-full="API">API</span>
<input ax-enhance="field" ax-required="true" ax-help="Enter email">
<nav ax-enhance="nav" ax-label="Main Navigation">...</nav>
<table ax-enhance="table" ax-caption="Sales Report">...</table>
```

**Enhancement Types:** srOnly, label, live, field, nav, button, table, image, modal, skipLink, landmark, focus, announce

**Documentation:** [accX Architecture](architecture/accx-architecture-v1_0.md)

### bindX - Data Binding

**Purpose:** Reactive data binding without frameworks

**Usage:**
```html
<div bx-bind="user.name"></div>
<input bx-model="user.email">
<button bx-on:click="handleSubmit">Submit</button>
```

**Documentation:** [bindX Architecture](architecture/bindx-technical-architecture-v1_0.md)

### loadX - Loading States

**Purpose:** Declarative loading indicators and HTMX integration

**Usage:**
```html
<button lx-loading="true">Processing...</button>
<div lx-skeleton="card"></div>
<div lx-spinner="dots"></div>
```

**Documentation:** [loadX Architecture](architecture/loadx-architecture-v1_0.md)

### dragX - Drag & Drop

**Purpose:** Accessible drag-and-drop with keyboard support

**Usage:**
```html
<div dx-draggable="true" dx-data="item-123">Drag me</div>
<div dx-dropzone="true" dx-accept="item">Drop here</div>
```

**Documentation:** [dragX Architecture](architecture/dragx-architecture-v1_0.md)

### tableX - Enhanced Tables

**Purpose:** Sortable, filterable, paginated tables

**Usage:**
```html
<table tx-enhance="true" tx-sortable="true" tx-filterable="true">
    <tr><th tx-sort="name">Name</th><th tx-sort="age">Age</th></tr>
    <tr><td>Alice</td><td>30</td></tr>
</table>
```

**Documentation:** [tableX Architecture](architecture/tablex-architecture-v1_0.md)

### navX - Navigation

**Purpose:** Client-side routing and navigation management

**Usage:**
```html
<nav nx-router="true">
    <a nx-route="/home">Home</a>
    <a nx-route="/about">About</a>
</nav>
```

**Documentation:** [navX Architecture](architecture/navx-architecture-v1_0.md)

---

## Standards

Best practices and coding standards for genX development.

- **Module Standards:** Pure functional, factory pattern, XSS-safe, <50KB
- **Performance Targets:** 0ms TBT, <16ms operations, perfect Lighthouse scores
- **Security:** SRI hashes, CSP compliance, input sanitization
- **Accessibility:** WCAG 2.1 AA compliance, screen reader tested
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## Support

### Common Issues

**Modules not loading:**
- Check browser console for errors
- Verify module paths in bootloader
- Ensure server is serving JavaScript files correctly

**Dynamic content not enhancing:**
- MutationObserver may be disabled - check `window.genxConfig.observe`
- Verify elements have correct attribute prefixes

**Performance issues:**
- Check Lighthouse scores
- Verify modules are minified for production
- Consider edge compilation service for optimization

### Getting Help

- Check [Quick Start Guide](QUICK-START.md)
- Review module architecture docs
- Test with `test-bootloader.html`
- Check browser compatibility

---

## Contributing

See root [README.md](../README.md) for contribution guidelines.

### Documentation Updates

When updating architecture:
1. Follow [STANDARD_TEXT_BLOCKS.md](architecture/STANDARD_TEXT_BLOCKS.md) format
2. Keep module docs consistent
3. Update this index if adding new docs
4. Run standardization analysis to verify consistency

---

## Version History

- **v1.0** - Initial release with fmtX and accX modules
- Universal bootloader with factory pattern
- XSS security fixes in accX
- Comprehensive architecture documentation
